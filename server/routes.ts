import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertRoomSchema, insertGameSchema, insertMoveSchema, users, games, achievements } from "@shared/schema";
import { z } from "zod";
import { AIPlayer } from "./aiPlayer";
import { makeMove, checkWin, checkDraw, getOpponentSymbol, validateMove } from "./gameLogic";
import { db } from "./db";
import cors from "cors";
import { eq, and, or, desc, exists } from "drizzle-orm";
import { nanoid } from "nanoid";

interface WSConnection {
  ws: WebSocket;
  userId: string;
  roomId?: string;
  username?: string;
  displayName?: string;
  lastSeen?: Date;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ✅ Apply CORS configuration
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // In development, allow all origins including localhost:3000 for VPS development
    const developmentOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
    ];

    app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        // Allow any localhost or specific development origins
        if (origin.includes('localhost') || origin.includes('127.0.0.1') || developmentOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Allow all origins in development for easier development
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    }));
  } else {
    // In production, use restricted origins
    const allowedOrigins = [
      'https://darklayerstudios.com',
      'https://www.darklayerstudios.com',
      'http://localhost:3000', // Allow localhost:3000 in production for VPS development
      'http://127.0.0.1:3000',
    ];

    app.use(cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (origin.includes('.replit.app') || origin.includes('.replit.dev') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    }));
  }

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
  });

  app.head('/api/health', (req, res) => {
    res.status(200).end();
  });

  // 🛡️ Register authentication and all other routes
  setupAuth(app);

  // Create room_invitations table if it doesn't exist
  try {
    await storage.createRoomInvitationsTable();
    //console.log('✅ Room invitations table ready');
  } catch (error) {
    //console.log('ℹ️ Room invitations table already exists or error:', error.message);
  }

  // Create weekly reset status table if it doesn't exist
  try {
    await storage.createWeeklyResetTable();
    //console.log('✅ Weekly reset status table ready');
  } catch (error) {
    //console.log('ℹ️ Weekly reset status table already exists or error:', error.message);
  }

  // Clean up friendship data inconsistencies (run async without blocking server startup)
  storage.cleanupFriendshipData().catch(error => {
    console.error('ℹ️ Friendship data cleanup error:', error);
  });

  const connections = new Map<string, WSConnection>();
  const roomConnections = new Map<string, Set<string>>();
  const matchmakingQueue: Array<{userId: string, betAmount: number}> = []; // Queue of users waiting for matches with their bet amounts
  const onlineUsers = new Map<string, { userId: string; username: string; displayName: string; roomId?: string; lastSeen: Date }>();
  const userRoomStates = new Map<string, { roomId: string; gameId?: string; isInGame: boolean }>();
  const matchmakingTimers = new Map<string, NodeJS.Timeout>(); // Track user timers for bot matches
  const userJoinLocks = new Map<string, Promise<any>>(); // Per-user locks to prevent race conditions when joining rooms
  
  // Track pending disconnects with grace period for reconnection (prevents mobile app-switch kicks)
  const pendingDisconnects = new Map<string, {
    userId: string;
    roomId: string | undefined;
    timeoutId: NodeJS.Timeout;
    expiresAt: Date;
  }>();
  const recentReconnections = new Map<string, number>(); // Track recent reconnection messages to prevent duplicates
  const sentMatchNotifications = new Map<string, Set<string>>(); // Track sent match notifications per room

  // Game started acknowledgment tracking for retry logic
  interface PendingGameStarted {
    messageId: string;
    connectionId: string;
    userId: string;
    payload: any;
    timestamp: number;
    retryCount: number;
  }
  const pendingGameStartedAcks = new Map<string, PendingGameStarted>(); // messageId -> pending ack info

  // Track games that have been broadcast to prevent duplicates and race conditions
  const gameStartBroadcastTracker = new Map<string, {
    gameId: string;
    notifiedUsers: Set<string>;
    timestamp: number;
    inProgress: boolean;
  }>();

  // Global retry timer flag to prevent overlapping retry cycles
  let retryTimerActive = false;

  // Unified function to broadcast game_started events with acknowledgment and retry logic
  async function broadcastGameStartedWithRetry(roomId: string, gamePayload: any): Promise<void> {
    const gameId = gamePayload.gameId || gamePayload.game?.id;
    if (!gameId) {
      console.error(`⚠️ No gameId found in payload for room ${roomId}`);
      return;
    }

    const broadcastKey = `${roomId}_${gameId}`;

    // Check if broadcast is already in progress for this game (prevents race conditions)
    if (gameStartBroadcastTracker.has(broadcastKey) && gameStartBroadcastTracker.get(broadcastKey)!.inProgress) {
      //console.log(`🔄 Game ${gameId} broadcast already in progress for room ${roomId}, skipping duplicate`);
      return;
    }

    const roomUsers = roomConnections.get(roomId);
    if (!roomUsers || roomUsers.size === 0) {
      //console.log(`⚠️ No connections found for room ${roomId} - game_started broadcast skipped`);
      return;
    }

    // Initialize or get existing tracker for this game
    if (!gameStartBroadcastTracker.has(broadcastKey)) {
      gameStartBroadcastTracker.set(broadcastKey, {
        gameId,
        notifiedUsers: new Set(),
        timestamp: Date.now(),
        inProgress: true
      });
    }

    const tracker = gameStartBroadcastTracker.get(broadcastKey)!;
    tracker.inProgress = true;

    //console.log(`📢 Broadcasting game_started for game ${gameId} to room ${roomId}`);

    // Deduplicate per user - send only to primary connection for each user
    const userConnections = new Map<string, string>(); // userId -> connectionId
    for (const connectionId of roomUsers) {
      const connection = connections.get(connectionId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        // Use first active connection per user (prevents duplicate messages to multiple tabs)
        if (!userConnections.has(connection.userId)) {
          userConnections.set(connection.userId, connectionId);
        }
      }
    }

    // Send to deduplicated user connections
    for (const [userId, connectionId] of userConnections) {
      // Skip if user was already notified for this game
      if (tracker.notifiedUsers.has(userId)) {
        //console.log(`🔄 User ${userId} already notified for game ${gameId}, skipping`);
        continue;
      }

      const connection = connections.get(connectionId);
      if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
        continue;
      }

      const messageId = nanoid(); // Unique ID for each message
      const messageWithId = {
        ...gamePayload,
        messageId,
        requiresAck: true // Flag to tell client to send acknowledgment
      };

      try {
        // Send the message
        connection.ws.send(JSON.stringify(messageWithId));

        // Track this message for acknowledgment
        pendingGameStartedAcks.set(messageId, {
          messageId,
          connectionId,
          userId: connection.userId,
          payload: messageWithId,
          timestamp: Date.now(),
          retryCount: 0
        });

        // Mark user as notified for this game
        tracker.notifiedUsers.add(userId);

        //console.log(`✅ Sent game_started (ID: ${messageId}) to user ${connection.userId} for game ${gameId}`);
      } catch (error) {
        console.error(`❌ Failed to send game_started to connection ${connectionId}:`, error);
      }
    }

    // Mark broadcast as complete
    tracker.inProgress = false;

    // Start global retry timer if not already active
    if (!retryTimerActive && pendingGameStartedAcks.size > 0) {
      retryTimerActive = true;
      setTimeout(() => {
        retryUnacknowledgedGameStarted();
      }, 2000);
    }

    // Cleanup old tracker entries (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [key, tracker] of gameStartBroadcastTracker.entries()) {
      if (tracker.timestamp < fiveMinutesAgo && !tracker.inProgress) {
        gameStartBroadcastTracker.delete(key);
      }
    }
  }

  // Function to retry unacknowledged game_started messages (consolidated global timer)
  function retryUnacknowledgedGameStarted(): void {
    const now = Date.now();
    const maxRetries = 3;
    const retryThreshold = 2000; // 2 seconds

    let hasPendingMessages = false;

    for (const [messageId, pendingAck] of pendingGameStartedAcks.entries()) {
      const timeSinceLastAttempt = now - pendingAck.timestamp;

      // Only retry messages that are older than retry threshold and haven't exceeded max retries
      if (timeSinceLastAttempt >= retryThreshold && pendingAck.retryCount < maxRetries) {
        const connection = connections.get(pendingAck.connectionId);

        if (connection && connection.ws.readyState === WebSocket.OPEN) {
          try {
            // Retry sending the message
            connection.ws.send(JSON.stringify(pendingAck.payload));

            // Update retry info
            pendingAck.retryCount++;
            pendingAck.timestamp = now;

            //console.log(`🔄 Retrying game_started (ID: ${messageId}, attempt ${pendingAck.retryCount}/${maxRetries}) to user ${pendingAck.userId}`);
            hasPendingMessages = true;
          } catch (error) {
            console.error(`❌ Retry failed for game_started message ${messageId}:`, error);
          }
        } else {
          // Connection is closed, remove from pending
          pendingGameStartedAcks.delete(messageId);
          //console.log(`🚪 Removed pending ack for closed connection: ${messageId}`);
        }
      } else if (pendingAck.retryCount >= maxRetries) {
        // Max retries exceeded, remove from pending
        pendingGameStartedAcks.delete(messageId);
        //console.log(`⚠️ Max retries exceeded for game_started message ${messageId} to user ${pendingAck.userId}`);
      } else {
        // Still has pending retries
        hasPendingMessages = true;
      }
    }

    // Schedule next retry check if there are still pending acknowledgments
    if (hasPendingMessages && pendingGameStartedAcks.size > 0) {
      setTimeout(() => {
        retryUnacknowledgedGameStarted();
      }, 2000);
    } else {
      // No more pending messages, deactivate retry timer
      retryTimerActive = false;
    }
  }

  // Helper function to ensure user can join a new room (auto-leave previous room)
  async function ensureUserCanJoinRoom(userId: string, targetRoomId: string): Promise<{ canJoin: boolean; error?: string }> {
    // Proper Promise chain lock without deletion gaps
    const existingChain = userJoinLocks.get(userId) || Promise.resolve();
    
    const task = async () => {
      // Check if user is in an active game
      const activeGame = await storage.getActiveGameForUser(userId);
      if (activeGame && activeGame.status === 'active' && activeGame.roomId !== targetRoomId) {
        return {
          canJoin: false,
          error: 'You are already in an active game. Please finish your current game before joining a new room.'
        };
      }

      // Get user's current room from database (source of truth)
      const currentRoomParticipation = await storage.getActiveRoomParticipation(userId);
      
      // If user is already in the target room, skip processing (prevent duplicate adds)
      if (currentRoomParticipation && currentRoomParticipation.roomId === targetRoomId) {
        return { canJoin: true }; // Already in target room, no action needed
      }
      
      if (currentRoomParticipation && currentRoomParticipation.roomId !== targetRoomId) {
        // User is in a different room, auto-leave
        const oldRoomId = currentRoomParticipation.roomId;

        // Remove user from old room participants
        await storage.removeRoomParticipant(oldRoomId, userId);

        // Clear user room states
        userRoomStates.delete(userId);

        // Update room connections
        const roomConns = roomConnections.get(oldRoomId);
        if (roomConns) {
          const userConns = Array.from(connections.entries())
            .filter(([_, conn]) => conn.userId === userId)
            .map(([connId, _]) => connId);
          
          userConns.forEach(connId => {
            roomConns.delete(connId);
            const conn = connections.get(connId);
            if (conn) {
              conn.roomId = undefined;
            }
          });
        }

        // Notify other users in the old room
        const participants = await storage.getRoomParticipants(oldRoomId);
        const remainingParticipants = participants.filter(p => p.userId !== userId);

        for (const participant of remainingParticipants) {
          const participantConnections = Array.from(connections.values())
            .filter(conn => conn.userId === participant.userId);

          for (const conn of participantConnections) {
            if (conn.ws.readyState === WebSocket.OPEN) {
              conn.ws.send(JSON.stringify({
                type: 'user_left',
                roomId: oldRoomId,
                userId: userId
              }));
            }
          }
        }
      }

      return { canJoin: true };
    };

    // Chain this task onto the existing promise chain
    const newChain = existingChain.then(task, task); // Run task on both resolve and reject
    userJoinLocks.set(userId, newChain);
    
    // Wait for our chained task to complete and return its result
    return await newChain;
  }

  // Matchmaking mutex to prevent race conditions
  let isMatchmakingLocked = false;

  // Middleware to update user online status on any API call
  app.use('/api', (req: any, res, next) => {
    if (req.session?.user) {
      const userId = req.session.user.userId;
      const username = req.session.user.username;
      const displayName = req.session.user.displayName || req.session.user.firstName || username;

      // Update user's online status when they make any API call
      onlineUsers.set(userId, {
        userId,
        username,
        displayName,
        roomId: userRoomStates.get(userId)?.roomId,
        lastSeen: new Date()
      });

      // Debug logging for VPS troubleshooting
      if (req.path === '/api/heartbeat') {
        //console.log(`💓 Heartbeat from ${displayName} (${userId}) at ${new Date().toISOString()}`);
        //console.log(`📊 Total online users: ${onlineUsers.size}`);
      }
    }
    next();
  });

  // Cleanup offline users every 2 minutes (remove users inactive for more than 90 seconds)
  setInterval(async () => {
    const now = new Date();
    const offlineThreshold = 90 * 1000; // 90 seconds
    const activePlayerThreshold = 300 * 1000; // 5 minutes for active players
    let removedUsers = 0;

    for (const [userId, user] of onlineUsers.entries()) {
      const timeSinceLastSeen = now.getTime() - user.lastSeen.getTime();

      // Check if user has an active game - give them more time to reconnect
      const activeGame = await storage.getActiveGameForUser(userId);
      const thresholdToUse = activeGame ? activePlayerThreshold : offlineThreshold;

      if (timeSinceLastSeen > thresholdToUse) {
        onlineUsers.delete(userId);
        removedUsers++;

        // Clean up matchmaking data for offline users
        const queueIndex = matchmakingQueue.findIndex(entry => entry.userId === userId);
        if (queueIndex > -1) {
          matchmakingQueue.splice(queueIndex, 1);
          //console.log(`🧹 Removed ${user.displayName} from matchmaking queue (offline)`);
        }

        // Clean up matchmaking timer
        if (matchmakingTimers.has(userId)) {
          clearTimeout(matchmakingTimers.get(userId)!);
          matchmakingTimers.delete(userId);
          //console.log(`🧹 Cleared matchmaking timer for ${user.displayName} (offline)`);
        }

        //console.log(`🚪 Removed offline user: ${user.displayName} (inactive for ${Math.round(timeSinceLastSeen/1000)}s)`);
      }
    }

    // Cleanup old match notifications (older than 5 minutes)
    const notificationThreshold = 5 * 60 * 1000; // 5 minutes
    for (const [roomId, notifications] of sentMatchNotifications.entries()) {
      // For simplicity, clear all notifications older than threshold
      // In a production system, you might want to track timestamps
      if (notifications.size > 0) {
        sentMatchNotifications.delete(roomId);
      }
    }

    if (removedUsers > 0) {
      //console.log(`🧹 Cleanup complete: removed ${removedUsers} offline users. ${onlineUsers.size} users remain online.`);
    }
  }, 120000); // Every 2 minutes

  // Game expiration system - check every 2 minutes, but only when users are active
  setInterval(async () => {
    // Skip database queries if no users are online - saves compute hours
    if (onlineUsers.size === 0 && connections.size === 0) {
      return;
    }

    try {
      const expiredGames = await storage.getExpiredGames();

      for (const expiredGame of expiredGames) {
        // Game expired after inactivity

        // Update game status to expired
        await storage.expireGame(expiredGame.id);

        // Update room status back to waiting
        if (expiredGame.roomId) {
          await storage.updateRoomStatus(expiredGame.roomId, 'waiting');
        }

        // Notify all players in the room about expiration
        if (expiredGame.roomId && roomConnections.has(expiredGame.roomId)) {
          const roomUsers = roomConnections.get(expiredGame.roomId);
          const expirationMessage = JSON.stringify({
            type: 'game_expired',
            gameId: expiredGame.id,
            roomId: expiredGame.roomId,
            message: 'Game expired due to 10 minutes of inactivity. Returning to lobby.'
          });

          roomUsers?.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(expirationMessage);
            }
          });

          // Clear room connections
          roomConnections.delete(expiredGame.roomId);
        }

        // Clear user room states for expired game players
        userRoomStates.forEach((state, userId) => {
          if (state.gameId === expiredGame.id) {
            userRoomStates.delete(userId);
          }
        });
      }
    } catch (error) {
      console.error('⏰ Error checking for expired games:', error);
    }
  }, 2 * 60 * 1000); // Check every 2 minutes

  // Auto-play throttling map to prevent too frequent moves
  const autoPlayThrottle = new Map<string, number>(); // gameId -> last auto-move timestamp

  // Auto-play monitoring system - check every 10 seconds for inactive players
  setInterval(async () => {
    // Skip if no users are online to save compute
    if (onlineUsers.size === 0 && connections.size === 0) {
      return;
    }

    try {
      const inactiveGames = await storage.getGamesWithInactivePlayers();

      for (const game of inactiveGames) {
        // Skip if game is already finished
        if (game.status !== 'active') continue;

        // Determine which player should be auto-playing
        const currentPlayerIsX = game.currentPlayer === 'X';
        const currentPlayerId = currentPlayerIsX ? game.playerXId : game.playerOId;
        let isCurrentPlayerAutoPlay = currentPlayerIsX ? game.playerXAutoPlay : game.playerOAutoPlay;

        // Skip AI vs AI games or pass-and-play
        if (!currentPlayerId || currentPlayerId.startsWith('player_') || game.gameMode !== 'online') {
          continue;
        }

        // Enable auto-play if not already enabled
        if (!isCurrentPlayerAutoPlay) {
          //console.log(`🤖 Enabling auto-play for player ${game.currentPlayer} in game ${game.id} (inactive for 60+ seconds)`);
          await storage.enableAutoPlay(game.id, game.currentPlayer as 'X' | 'O');

          // Notify room about auto-play activation
          if (game.roomId && roomConnections.has(game.roomId)) {
            const roomUsers = roomConnections.get(game.roomId)!;
            const autoPlayMessage = JSON.stringify({
              type: 'auto_play_enabled',
              gameId: game.id,
              player: game.currentPlayer,
              message: `Player ${game.currentPlayer} is now in auto-play mode due to inactivity`
            });

            roomUsers.forEach(connectionId => {
              const connection = connections.get(connectionId);
              if (connection && connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(autoPlayMessage);
              }
            });
          }

          // Make an immediate AI move after enabling auto-play to prevent further stalling
          isCurrentPlayerAutoPlay = true; // Update local flag for immediate move
        }

        // Make an auto-move using easy AI
        if (isCurrentPlayerAutoPlay) {
          try {
            // Check throttling - don't make moves too frequently
            const now = Date.now();
            const lastAutoMove = autoPlayThrottle.get(game.id) || 0;
            const timeSinceLastMove = now - lastAutoMove;
            const minInterval = 5000; // 5 seconds minimum between auto-moves

            if (timeSinceLastMove < minInterval) {
              //console.log(`🤖 Auto-play throttled for game ${game.id} (${minInterval - timeSinceLastMove}ms remaining)`);
              continue; // Skip this game for now
            }

            const currentBoard = game.board || {};

            // Simple auto-play: use existing game logic to get valid moves, then pick the first one
            const { getAvailableMoves } = await import('./gameLogic');
            const availableMoves = getAvailableMoves(currentBoard);

            if (availableMoves.length === 0) {
              console.error(`🤖 No available moves for auto-play in game ${game.id}`);
              continue;
            }

            const autoMove = availableMoves[0]; // Always pick the first available position

            //console.log(`🤖 Auto-play move: ${game.currentPlayer} plays position ${autoMove} in game ${game.id}`);

            // Update throttle map
            autoPlayThrottle.set(game.id, now);

            // Process the auto-move like a regular move
            const newBoard = { ...currentBoard, [autoMove.toString()]: game.currentPlayer };
            const nextPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

            // Check for win/draw
            const { checkWin, checkDraw } = await import('./gameLogic');
            const winResult = checkWin(newBoard, game.currentPlayer);
            const isDraw = !winResult.winner && checkDraw(newBoard);

            // Update game in database
            await storage.updateGameBoard(game.id, newBoard);
            await storage.updateCurrentPlayer(game.id, nextPlayer);
            await storage.updateLastMoveTime(game.id);

            if (winResult.winner || isDraw) {
              await storage.updateGameStatus(game.id, 'finished', 
                winResult.winner ? currentPlayerId : undefined,
                isDraw ? 'draw' : (winResult.condition || undefined));

              // Clean up throttle map for finished games
              autoPlayThrottle.delete(game.id);
            }

            // Broadcast auto-move to all players in room
            if (game.roomId && roomConnections.has(game.roomId)) {
              const roomUsers = roomConnections.get(game.roomId)!;
              const moveMessage = JSON.stringify({
                type: winResult.winner ? 'winning_move' : 'auto_move',
                gameId: game.id,
                roomId: game.roomId,
                position: autoMove,
                player: game.currentPlayer,
                board: newBoard,
                currentPlayer: nextPlayer,
                winningPositions: winResult.winningPositions || null,
                serverTime: new Date().toISOString(),
                isAutoPlay: true
              });

              roomUsers.forEach(connectionId => {
                const conn = connections.get(connectionId);
                if (conn && conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(moveMessage);
                }
              });
            }

            // Check if the next player is a bot and trigger bot move (same logic as regular moves)
            if (!winResult.winner && !isDraw) {
              const nextPlayerId = nextPlayer === 'X' ? game.playerXId : game.playerOId;
              //console.log(`🤖 Auto-play checking bot move: nextPlayer=${nextPlayer}, nextPlayerId=${nextPlayerId}`);

              // Check if next player is a bot (IDs starting with "player_")
              if (nextPlayerId && nextPlayerId.startsWith('player_')) {
                //console.log(`🤖 Bot move triggered after auto-play for ${nextPlayerId} (${nextPlayer})`);
                // Trigger bot move after a short delay for realism
                setTimeout(async () => {
                  try {
                    const { AIPlayer } = await import('./aiPlayer');

                    // Get bot difficulty from the bot data (use default medium if not found)
                    let difficulty = 'medium';
                    if (nextPlayerId && nextPlayerId.startsWith('player_')) {
                      const playerNum = parseInt(nextPlayerId.replace('player_', ''));
                      if (playerNum >= 1 && playerNum <= 30) {
                        difficulty = 'easy';
                      } else if (playerNum >= 31 && playerNum <= 70) {
                        difficulty = 'medium';
                      } else if (playerNum >= 71 && playerNum <= 100) {
                        difficulty = 'hard';
                      }
                    }

                    const ai = new AIPlayer(nextPlayer, difficulty);
                    const botMove = ai.makeMove(newBoard);

                    // Make the bot move
                    const botNewBoard = { ...newBoard, [botMove]: nextPlayer };
                    const botNextPlayer = game.currentPlayer; // Switch back to the auto-playing player

                    // Check for bot win
                    const { checkWin, checkDraw } = await import('./gameLogic');
                    const botWinResult = checkWin(botNewBoard, nextPlayer);
                    const botIsDraw = !botWinResult.winner && checkDraw(botNewBoard);

                    // Update database with bot move
                    await storage.updateGameBoard(game.id, botNewBoard);
                    await storage.updateCurrentPlayer(game.id, botNextPlayer);
                    await storage.updateLastMoveTime(game.id);

                    if (botWinResult.winner || botIsDraw) {
                      await storage.updateGameStatus(game.id, 'finished', 
                        botWinResult.winner ? nextPlayerId : undefined,
                        botIsDraw ? 'draw' : (botWinResult.condition || undefined));

                      // Clean up throttle map for finished games
                      autoPlayThrottle.delete(game.id);
                    }

                    // Broadcast bot move to all players in room
                    if (game.roomId && roomConnections.has(game.roomId)) {
                      const roomUsers = roomConnections.get(game.roomId)!;
                      const botMoveMessage = JSON.stringify({
                        type: botWinResult.winner ? 'winning_move' : 'move',
                        gameId: game.id,
                        roomId: game.roomId,
                        position: botMove,
                        player: nextPlayer,
                        board: botNewBoard,
                        currentPlayer: botNextPlayer,
                        winningPositions: botWinResult.winningPositions || null,
                        serverTime: new Date().toISOString(),
                        isBot: true
                      });

                      //console.log(`🤖 Broadcasting bot move after auto-play: position=${botMove}, player=${nextPlayer}, roomUsers=${roomUsers.size}`);
                      roomUsers.forEach(connectionId => {
                        const conn = connections.get(connectionId);
                        if (conn && conn.ws.readyState === WebSocket.OPEN) {
                          conn.ws.send(botMoveMessage);
                        }
                      });
                    }

                  } catch (error) {
                    console.error('Bot move error after auto-play:', error);
                  }
                }, 1000 + Math.random() * 1000); // 1-3 second delay for realism
              }
            }
          } catch (autoMoveError) {
            console.error(`🤖 Error making auto-move for game ${game.id}:`, autoMoveError);
          }
        }
      }
    } catch (error) {
      console.error('🤖 Error in auto-play monitoring:', error);
    }
  }, 10000); // Check every 10 seconds

  // Robust weekly leaderboard reset and reward distribution system
  let weeklySchedulerRunning = false; // Process-level mutex
  let nextWeekStartTimeout: NodeJS.Timeout | null = null;

  // Function to calculate milliseconds until next week starts (ISO week starts Monday)
  function getMillisecondsUntilNextWeek(): number {
    const now = new Date();

    // Get the start of next ISO week (Monday at 00:00:00 UTC)
    const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
    const daysUntilNextMonday = currentDay === 0 ? 1 : 8 - currentDay; // Days until next Monday

    const nextWeekStart = new Date(now);
    nextWeekStart.setUTCDate(now.getUTCDate() + daysUntilNextMonday);
    nextWeekStart.setUTCHours(0, 0, 0, 0);

    return nextWeekStart.getTime() - now.getTime();
  }

  // Function to perform weekly reset with full error handling and idempotency
  async function performWeeklyReset(weekNumber: number, year: number): Promise<boolean> {
    if (weeklySchedulerRunning) {
      //console.log(`🔒 Weekly scheduler already running, skipping reset for ${year}-W${weekNumber.toString().padStart(2, '0')}`);
      return false;
    }

    weeklySchedulerRunning = true;
    let resetStatus;

    try {
      //console.log(`🏆 Starting weekly reset process for ${year}-W${weekNumber.toString().padStart(2, '0')}`);

      // Get or create reset status record
      resetStatus = await storage.getResetStatus(weekNumber, year);
      if (!resetStatus) {
        resetStatus = await storage.createResetStatus(weekNumber, year);
      }

      // Check if already completed
      if (resetStatus.status === 'completed') {
        //console.log(`✅ Weekly reset for ${year}-W${weekNumber.toString().padStart(2, '0')} already completed`);
        return true;
      }

      // Check if too many retries
      if (resetStatus.retryCount >= 5) {
        console.error(`❌ Weekly reset for ${year}-W${weekNumber.toString().padStart(2, '0')} exceeded maximum retries (${resetStatus.retryCount})`);
        return false;
      }

      // Mark as in progress
      await storage.updateResetStatus(resetStatus.id, 'in_progress');

      // CRITICAL FIX: Distribute rewards for the previous week BEFORE resetting stats
      //console.log(`💰 Distributing weekly rewards for ${year}-W${weekNumber.toString().padStart(2, '0')}`);
      await storage.distributeWeeklyRewards(weekNumber, year);

      // Perform the actual reset (this already has internal transaction safety)
      await storage.resetWeeklyStats(weekNumber, year);

      // Mark as completed
      await storage.updateResetStatus(resetStatus.id, 'completed');
      //console.log(`✅ Weekly reset completed successfully for ${year}-W${weekNumber.toString().padStart(2, '0')}`);

      return true;

    } catch (error) {
      console.error(`❌ Error during weekly reset for ${year}-W${weekNumber.toString().padStart(2, '0')}:`, error);

      if (resetStatus) {
        // Mark as failed and schedule retry
        const nextRetryDelay = Math.min(30 * 60 * 1000 * Math.pow(2, resetStatus.retryCount), 4 * 60 * 60 * 1000); // Exponential backoff, max 4 hours
        const nextRetryAt = new Date(Date.now() + nextRetryDelay);

        await storage.updateResetStatus(resetStatus.id, 'failed', error.message);
        await storage.incrementRetryCount(resetStatus.id, nextRetryAt);

        //console.log(`⏰ Scheduled retry for ${year}-W${weekNumber.toString().padStart(2, '0')} in ${Math.round(nextRetryDelay / 60000)} minutes`);
      }

      return false;
    } finally {
      weeklySchedulerRunning = false;
    }
  }

  // Function to check for pending/failed resets and process them
  async function processPendingResets(): Promise<void> {
    try {
      const pendingResets = await storage.getPendingResets();

      for (const reset of pendingResets) {
        //console.log(`🔄 Processing pending reset for ${reset.year}-W${reset.weekNumber.toString().padStart(2, '0')}`);
        await performWeeklyReset(reset.weekNumber, reset.year);
      }
    } catch (error) {
      console.error('📅 Error processing pending resets:', error);
    }
  }

  // Function to schedule the next week boundary check
  function scheduleNextWeekCheck(): void {
    // Clear any existing timeout
    if (nextWeekStartTimeout) {
      clearTimeout(nextWeekStartTimeout);
    }

    const msUntilNextWeek = getMillisecondsUntilNextWeek();
    const maxDelay = 24 * 60 * 60 * 1000; // 24 hours max for setTimeout stability
    const delay = Math.min(msUntilNextWeek, maxDelay);

    const hours = Math.round(delay / (60 * 60 * 1000));
    const days = Math.round(delay / (24 * 60 * 60 * 1000));
    if (days >= 1) {
      //console.log(`📅 Next week check scheduled in ${days} day(s) and ${hours % 24} hour(s)`);
    } else {
      //console.log(`📅 Next week check scheduled in ${hours} hour(s) and ${Math.round((delay % (60 * 60 * 1000)) / 60000)} minute(s)`);
    }

    nextWeekStartTimeout = setTimeout(async () => {
      try {
        const now = new Date();

        // Calculate previous week for reset
        const prevWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

        // Get ISO week info for previous week
        const target = new Date(prevWeekDate.getTime());
        target.setUTCHours(0, 0, 0, 0);
        const thursday = new Date(target.getTime());
        thursday.setUTCDate(target.getUTCDate() - ((target.getUTCDay() + 6) % 7) + 3);
        const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
        firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
        const prevWeekNumber = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const prevYear = thursday.getUTCFullYear();

        //console.log(`🗓️ New week detected`);
        //console.log(`🏆 Triggering reset for previous week: ${prevYear}-W${prevWeekNumber.toString().padStart(2, '0')}`);

        // Trigger reset for the previous week
        await performWeeklyReset(prevWeekNumber, prevYear);

        // Check for any other pending resets
        await processPendingResets();

        // Schedule next check
        scheduleNextWeekCheck();

      } catch (error) {
        console.error('📅 Error in week boundary handler:', error);
        // Reschedule anyway to prevent scheduler from stopping
        scheduleNextWeekCheck();
      }
    }, delay);
  }

  // Startup logic to handle missed resets and initialize scheduler
  async function initializeWeeklyScheduler(): Promise<void> {
    try {
      //console.log('🚀 Initializing robust weekly scheduler...');

      // Check for any pending or failed resets on startup
      await processPendingResets();

      // Check if we need to create a reset record for any recent weeks that might have been missed
      const now = new Date();

      // Check last 4 weeks for missed resets
      for (let i = 1; i <= 4; i++) {
        const checkDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000); // i weeks ago

        // Get ISO week info for check date
        const target = new Date(checkDate.getTime());
        target.setUTCHours(0, 0, 0, 0);
        const thursday = new Date(target.getTime());
        thursday.setUTCDate(target.getUTCDate() - ((target.getUTCDay() + 6) % 7) + 3);
        const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
        firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
        const checkWeekNumber = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        const checkYear = thursday.getUTCFullYear();

        const resetStatus = await storage.getResetStatus(checkWeekNumber, checkYear);
        if (!resetStatus) {
          // Create pending reset record for missed week
          await storage.createResetStatus(checkWeekNumber, checkYear);
          //console.log(`📝 Created pending reset record for missed week: ${checkYear}-W${checkWeekNumber.toString().padStart(2, '0')}`);
        }
      }

      // Process any newly identified pending resets
      await processPendingResets();

      // Schedule precise week boundary timing
      scheduleNextWeekCheck();

      //console.log('✅ Weekly scheduler initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize weekly scheduler:', error);
      // Fallback: still schedule next check to prevent total failure
      scheduleNextWeekCheck();
    }
  }

  // Initialize the scheduler
  initializeWeeklyScheduler();

  // Backup polling system - runs every 6 hours as failsafe
  setInterval(async () => {
    try {
      // Only run if no users are online to save compute
      if (onlineUsers.size === 0 && connections.size === 0) {
        return;
      }

      //console.log('🔍 Running backup weekly scheduler check...');
      await processPendingResets();

      // Verify next week check is still scheduled
      if (!nextWeekStartTimeout) {
        console.log('⚠️ Next week check was lost, rescheduling...');
        scheduleNextWeekCheck();
      }

    } catch (error) {
      console.error('📅 Error in backup weekly scheduler:', error);
    }
  }, 6 * 60 * 60 * 1000); // Every 6 hours

  // Offline reconnection handler with expiration check
  // Helper function to check for missed game_started messages and send current game state
  async function checkAndSendMissedGameState(userId: string, connectionId: string, ws: WebSocket) {
    try {
      // Check if user has an active game
      const activeGame = await storage.getActiveGameForUser(userId);
      if (!activeGame || activeGame.status !== 'active') {
        return; // No active game to recover
      }

      // Get full game details with player information
      const [playerXInfo, playerOInfo] = await Promise.all([
        activeGame.playerXId ? storage.getUser(activeGame.playerXId) : Promise.resolve(null),
        activeGame.playerOId ? storage.getUser(activeGame.playerOId) : Promise.resolve(null)
      ]);

      // Get achievements and piece styles for both players
      const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
        playerXInfo ? storage.getUserAchievements(activeGame.playerXId!) : Promise.resolve([]),
        playerOInfo ? storage.getUserAchievements(activeGame.playerOId!) : Promise.resolve([]),
        playerXInfo ? storage.getActivePieceStyle(activeGame.playerXId!) : Promise.resolve(undefined),
        playerOInfo ? storage.getActivePieceStyle(activeGame.playerOId!) : Promise.resolve(undefined)
      ]);

      // Create enhanced game object
      const gameWithPlayers = {
        ...activeGame,
        playerXInfo: playerXInfo ? {
          ...playerXInfo,
          achievements: playerXAchievements.slice(0, 3),
          activePieceStyle: playerXPieceStyle?.styleName || 'default'
        } : null,
        playerOInfo: playerOInfo ? {
          ...playerOInfo,
          achievements: playerOAchievements.slice(0, 3),
          activePieceStyle: playerOPieceStyle?.styleName || 'default'
        } : null,
        gameMode: 'online',
        serverTime: new Date().toISOString(),
        timeRemaining: Math.max(0, 10 * 60 * 1000) // Default 10 minutes
      };

      // Get room information if game has a room
      let room = null;
      if (activeGame.roomId) {
        room = await storage.getRoomById(activeGame.roomId);

        // Ensure user is added to room connections
        if (!roomConnections.has(activeGame.roomId)) {
          roomConnections.set(activeGame.roomId, new Set());
        }
        roomConnections.get(activeGame.roomId)!.add(connectionId);

        // Update connection room info
        const connection = connections.get(connectionId);
        if (connection) {
          connection.roomId = activeGame.roomId;
        }
      }

      // Send game_started message to recover the client
      ws.send(JSON.stringify({
        type: 'game_started',
        game: gameWithPlayers,
        roomId: activeGame.roomId,
        room: room,
        recovery: true // Flag to indicate this is a recovery message
      }));

      //console.log(`🔄 Recovery: Sent game_started to user ${userId} for game ${activeGame.id}`);
    } catch (error) {
      console.error(`❌ Error in checkAndSendMissedGameState for user ${userId}:`, error);
    }
  }

  async function handleUserReconnection(userId: string, connectionId: string, ws: WebSocket) {
    try {
      // Checking for active game reconnection

      // Check if user has an active game (not expired or abandoned)
      // Also check if user has any room state - if not, they were properly cleaned up from abandonment
      const userRoomState = userRoomStates.get(userId);
      const activeGame = await storage.getActiveGameForUser(userId);

      // Check for active game - don't require userRoomState since it might be cleared on disconnect
      if (activeGame && activeGame.roomId && activeGame.status === 'active') {
        // Check if game is still within 10 minute limit
        const gameAge = Date.now() - new Date(activeGame.lastMoveAt || activeGame.createdAt).getTime();
        const tenMinutes = 10 * 60 * 1000;

        if (gameAge > tenMinutes) {
          // Game expired - expiring now

          // Expire the game immediately
          await storage.expireGame(activeGame.id);
          await storage.updateRoomStatus(activeGame.roomId, 'waiting');

          // Send expiration message to user
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'game_expired',
              gameId: activeGame.id,
              roomId: activeGame.roomId,
              message: 'Your game has expired. Returning to lobby.'
            }));
          }

          // Clear user room state
          userRoomStates.delete(userId);
          return;
        }



        // Simplified reconnection - always allow reconnection but track it to prevent spam
        const now = Date.now();
        const lastReconnection = recentReconnections.get(userId);

        // Only skip reconnection if it was very recent (within 1 second)
        if (lastReconnection && (now - lastReconnection) < 1000) {
          return;
        }

        // Track this user's reconnection
        recentReconnections.set(userId, now);

        // Add user back to room connections
        if (!roomConnections.has(activeGame.roomId)) {
          roomConnections.set(activeGame.roomId, new Set());
        }
        roomConnections.get(activeGame.roomId)!.add(connectionId);

        // Update connection room info
        const connection = connections.get(connectionId);
        if (connection) {
          connection.roomId = activeGame.roomId;
        }

        // Restore/update user room state for reconnection
        userRoomStates.set(userId, {
          roomId: activeGame.roomId,
          gameId: activeGame.id,
          isInGame: true
        });

        // Get complete game data with player info
        const [playerXInfo, playerOInfo] = await Promise.all([
          storage.getUser(activeGame.playerXId!),
          activeGame.playerOId && !AI_BOTS.some(bot => bot.id === activeGame.playerOId) ? storage.getUser(activeGame.playerOId!) : Promise.resolve(null)
        ]);

        // Get achievements and piece styles for both players
        const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
          storage.getUserAchievements(activeGame.playerXId!),
          playerOInfo && !AI_BOTS.some(bot => bot.id === activeGame.playerOId) ? storage.getUserAchievements(activeGame.playerOId!) : Promise.resolve([]),
          storage.getActivePieceStyle(activeGame.playerXId!),
          playerOInfo && !AI_BOTS.some(bot => bot.id === activeGame.playerOId) ? storage.getActivePieceStyle(activeGame.playerOId!) : Promise.resolve(undefined)
        ]);

        // Handle bot player info
        let finalPlayerOInfo = playerOInfo;
        if (activeGame.playerOId && AI_BOTS.some(bot => bot.id === activeGame.playerOId)) {
          const botInfo = AI_BOTS.find(bot => bot.id === activeGame.playerOId);
          finalPlayerOInfo = {
            id: activeGame.playerOId,
            firstName: botInfo?.firstName || 'AI',
            lastName: botInfo?.lastName || 'Player',
            displayName: botInfo?.displayName || 'AI Player',
            username: botInfo?.username || 'ai',
            profilePicture: botInfo?.profilePicture || null,
            profileImageUrl: botInfo?.profilePicture || null,
            achievements: [],
            activePieceStyle: 'default'
          };
        }

        const gameWithPlayers = {
          ...activeGame,
          playerXInfo: playerXInfo ? {
            ...playerXInfo,
            achievements: playerXAchievements.slice(0, 3),
            activePieceStyle: playerXPieceStyle?.styleName || 'default'
          } : null,
          playerOInfo: finalPlayerOInfo ? {
            ...finalPlayerOInfo,
            achievements: (finalPlayerOInfo as any).achievements || playerOAchievements.slice(0, 3),
            activePieceStyle: (finalPlayerOInfo as any).activePieceStyle || playerOPieceStyle?.styleName || 'default'
          } : null,
          gameMode: activeGame.gameMode,
          serverTime: new Date().toISOString(), // Add server time for consistent timer calculation
          timeRemaining: Math.max(0, 10 * 60 * 1000 - (Date.now() - new Date(activeGame.createdAt).getTime())) // Calculate remaining time from game start
        };

        // Get room info
        const room = await storage.getRoomById(activeGame.roomId);

        // Send reconnection messages immediately
        if (ws.readyState === WebSocket.OPEN) {
          try {
            // Send room join notification first
            ws.send(JSON.stringify({
              type: 'reconnection_room_join',
              room: room,
              message: 'Reconnected to your game room'
            }));

            // Send game state immediately (no delay to reduce race conditions)
            ws.send(JSON.stringify({
              type: 'game_reconnection',
              game: gameWithPlayers,
              roomId: activeGame.roomId,
              message: 'Game state recovered successfully'
            }));


          } catch (error) {
            console.error(`❌ Failed to send reconnection messages to user ${userId}:`, error);
          }

          // Clean up old reconnection tracking entries (older than 10 seconds)
          setTimeout(() => {
            const cutoff = Date.now() - 10000;
            for (const [trackingUserId, timestamp] of recentReconnections.entries()) {
              if (timestamp < cutoff) {
                recentReconnections.delete(trackingUserId);
              }
            }
          }, 10000);

          // Notify other players in the room about reconnection
          const roomUsers = roomConnections.get(activeGame.roomId);
          if (roomUsers) {
            // Get the reconnecting user's info specifically
            const reconnectingUser = await storage.getUser(userId);
            const reconnectionNotification = JSON.stringify({
              type: 'player_reconnected',
              userId: userId,
              playerName: reconnectingUser?.displayName || reconnectingUser?.firstName || 'Player',
              message: `${reconnectingUser?.displayName || reconnectingUser?.firstName || 'Player'} reconnected to the game`
            });

            roomUsers.forEach(otherConnectionId => {
              if (otherConnectionId !== connectionId) {
                const otherConnection = connections.get(otherConnectionId);
                if (otherConnection && otherConnection.ws.readyState === WebSocket.OPEN) {
                  otherConnection.ws.send(reconnectionNotification);
                }
              }
            });
          }
        }
      } else {
        // No active game found - normal connection
      }
    } catch (error) {
      console.error(`🔄 Error handling reconnection for user ${userId}:`, error);
    }
  }

  // AI Bot System - 100 AI opponents with varied difficulties and personalities
  const REALISTIC_NAMES = [
    // English names
    "Alex Johnson", "Sarah Chen", "Michael Brown", "Emma Wilson", "David Lee", "Lisa Garcia", "Ryan Smith", "Maya Patel", "James Miller", "Sofia Rodriguez",
    "Chris Taylor", "Amanda Thompson", "Kevin Wang", "Rachel Green", "Mark Davis", "Nicole Kim", "Tyler Anderson", "Jessica Martinez", "Brandon Jones", "Ashley White",
    "Jordan Clark", "Samantha Lewis", "Austin Young", "Stephanie Hall", "Cameron Scott", "Natalie Adams", "Derek Baker", "Megan Turner", "Sean Murphy", "Lauren Cooper",

    // Arabic names
    "Ahmed Hassan", "Fatima Al-Zahra", "Omar Khalil", "Aisha Rahman", "Youssef Mansour", "Layla Nasser", "Kareem Ibrahim", "Nour El-Din", "Salma Farouk", "Rashid Abadi",
    "Mariam Qasemi", "Tariq Habib", "Zara Mahmoud", "Samir Hashim", "Dina Rasheed", "Jamal Khoury", "Lina Amin", "Khalil Badawi", "Rana Sharif", "Fadi Zidan",

    // Indian names
    "Rahul Sharma", "Priya Gupta", "Aryan Singh", "Sneha Patel", "Vikram Kumar", "Ananya Reddy", "Rohit Agarwal", "Kavya Menon", "Arjun Iyer", "Riya Joshi",
    "Siddharth Rao", "Meera Kapoor", "Aarav Malik", "Pooja Nair", "Karan Thakur", "Shreya Verma", "Nikhil Bansal", "Divya Sinha", "Varun Chandra", "Aditi Saxena",

    // Spanish names
    "Carlos Mendoza", "Isabella Ruiz", "Diego Herrera", "Valentina Cruz", "Alejandro Torres", "Camila Flores", "Sebastian Morales", "Lucia Jimenez", "Adrian Castro", "Daniela Vargas",
    "Fernando Silva", "Gabriela Ortiz", "Ricardo Delgado", "Valeria Peña", "Francisco Ramos", "Andrea Gutierrez", "Mateo Sandoval", "Elena Castillo", "Antonio Mejia", "Carmen Aguilar",

    // Indonesian names
    "Andi Pratama", "Sari Wijaya", "Budi Santoso", "Maya Sari", "Rizki Permana", "Indira Putri", "Doni Kurniawan", "Lestari Dewi", "Fajar Hidayat", "Ratna Sari",
    "Yoga Prasetya", "Tika Maharani", "Agus Setiawan", "Dian Puspita", "Eko Wardana", "Fitri Anggraeni", "Hadi Nugroho", "Sinta Lestari", "Joko Susanto", "Wulan Sari"
  ];

  const PROFILE_PICTURES = [
    // Animals
    "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=80&h=80&fit=crop&crop=face",  // Fox
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=80&h=80&fit=crop&crop=face",  // Elephant
    "https://images.unsplash.com/photo-1549366021-9f761d040a94?w=80&h=80&fit=crop&crop=face",  // Panda
    "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=80&h=80&fit=crop&crop=face",  // Dog
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=80&h=80&fit=crop&crop=face",  // Cat
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Lion
    "https://images.unsplash.com/photo-1551069613-1904dbdcda11?w=80&h=80&fit=crop&crop=face",  // Tiger
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=80&h=80&fit=crop&crop=face",  // Giraffe
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Zebra
    "https://images.unsplash.com/photo-1551079278-e3da618072aa?w=80&h=80&fit=crop&crop=face",  // Bear

    // Birds
    "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=80&h=80&fit=crop&crop=face",  // Parrot
    "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=80&h=80&fit=crop&crop=face",  // Eagle
    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=80&h=80&fit=crop&crop=face",  // Owl
    "https://images.unsplash.com/photo-1521651201144-634f700b36ef?w=80&h=80&fit=crop&crop=face",  // Flamingo
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80&h=80&fit=crop&crop=face",  // Peacock
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=80&h=80&fit=crop&crop=face",  // Robin
    "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=80&h=80&fit=crop&crop=face",  // Penguin
    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=80&h=80&fit=crop&crop=face",  // Toucan
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=80&h=80&fit=crop&crop=face",  // Hummingbird
    "https://images.unsplash.com/photo-1551435088-5db5d8c0ad53?w=80&h=80&fit=crop&crop=face",  // Swan

    // Nature/Wildlife
    "https://images.unsplash.com/photo-1564460576398-ef55d99548b2?w=80&h=80&fit=crop&crop=face",  // Rabbit
    "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=80&h=80&fit=crop&crop=face",  // Deer
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Wolf
    "https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=80&h=80&fit=crop&crop=face",  // Monkey
    "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=80&h=80&fit=crop&crop=face",  // Squirrel
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Koala
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Turtle
    "https://images.unsplash.com/photo-1566002797842-80dc7b5c2e4f?w=80&h=80&fit=crop&crop=face",  // Dolphin
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80&h=80&fit=crop&crop=face",  // Seal
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Horse

    // Sea creatures
    "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=80&h=80&fit=crop&crop=face",  // Fish
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80&h=80&fit=crop&crop=face",  // Whale
    "https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=80&h=80&fit=crop&crop=face",  // Octopus
    "https://images.unsplash.com/photo-1566002797842-80dc7b5c2e4f?w=80&h=80&fit=crop&crop=face",  // Starfish
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Jellyfish

    // Forest animals
    "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=80&h=80&fit=crop&crop=face",  // Raccoon
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=80&h=80&fit=crop&crop=face",  // Hedgehog
    "https://images.unsplash.com/photo-1549366021-9f761d040a94?w=80&h=80&fit=crop&crop=face",  // Badger
    "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=80&h=80&fit=crop&crop=face",  // Otter
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=80&h=80&fit=crop&crop=face",  // Beaver

    // Mountain animals
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Mountain Goat
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Snow Leopard
    "https://images.unsplash.com/photo-1551079278-e3da618072aa?w=80&h=80&fit=crop&crop=face",  // Lynx
    "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=80&h=80&fit=crop&crop=face",  // Elk
    "https://images.unsplash.com/photo-1564460576398-ef55d99548b2?w=80&h=80&fit=crop&crop=face",  // Moose

    // Tropical animals
    "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=80&h=80&fit=crop&crop=face",  // Sloth
    "https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=80&h=80&fit=crop&crop=face",  // Jaguar
    "https://images.unsplash.com/photo-1575550959106-5a7defe28b56?w=80&h=80&fit=crop&crop=face",  // Iguana
    "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=80&h=80&fit=crop&crop=face",  // Chameleon
    "https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=80&h=80&fit=crop&crop=face",  // Lemur

    // Arctic animals
    "https://images.unsplash.com/photo-1551079278-e3da618072aa?w=80&h=80&fit=crop&crop=face",  // Polar Bear
    "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=80&h=80&fit=crop&crop=face",  // Arctic Fox
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=80&h=80&fit=crop&crop=face",  // Walrus
    "https://images.unsplash.com/photo-1566002797842-80dc7b5c2e4f?w=80&h=80&fit=crop&crop=face",  // Husky
    "https://images.unsplash.com/photo-1527118732049-c88155f2107c?w=80&h=80&fit=crop&crop=face"   // Reindeer
  ];



  const AI_BOTS = [
    // Easy players (30 bots)
    ...Array.from({ length: 30 }, (_, i) => {
      const name = REALISTIC_NAMES[i % REALISTIC_NAMES.length];
      const profilePic = PROFILE_PICTURES[i % PROFILE_PICTURES.length];
      return {
        id: `player_${i + 1}`,
        username: name.replace(' ', '').toLowerCase(),
        displayName: name,
        difficulty: 'easy' as const,
        profilePicture: profilePic,
        firstName: name.split(' ')[0],
        isBot: false // Hide bot status completely
      };
    }),
    // Medium players (40 bots)
    ...Array.from({ length: 40 }, (_, i) => {
      const name = REALISTIC_NAMES[(i + 30) % REALISTIC_NAMES.length];
      const profilePic = PROFILE_PICTURES[(i + 30) % PROFILE_PICTURES.length];
      return {
        id: `player_${i + 31}`,
        username: name.replace(' ', '').toLowerCase(),
        displayName: name,
        difficulty: 'medium' as const,
        profilePicture: profilePic,
        firstName: name.split(' ')[0],
        isBot: false // Hide bot status completely
      };
    }),
    // Hard players (30 bots)
    ...Array.from({ length: 30 }, (_, i) => {
      const name = REALISTIC_NAMES[(i + 70) % REALISTIC_NAMES.length];
      const profilePic = PROFILE_PICTURES[(i + 70) % PROFILE_PICTURES.length];
      return {
        id: `player_${i + 71}`,
        username: name.replace(' ', '').toLowerCase(),
        displayName: name,
        difficulty: 'hard' as const,
        profilePicture: profilePic,
        firstName: name.split(' ')[0],
        isBot: false // Hide bot status completely
      };
    })
  ];

  // Function to get a random available bot
  function getRandomAvailableBot(): any {
    const difficulties = ['easy', 'medium', 'hard'];
    const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const botsOfDifficulty = AI_BOTS.filter(bot => bot.difficulty === randomDifficulty);
    return botsOfDifficulty[Math.floor(Math.random() * botsOfDifficulty.length)];
  }

  // Error logging endpoint
  app.post('/api/error-log', (req, res) => {
    const { error, stack, info } = req.body;
    console.error('🚨 FRONTEND ERROR CAUGHT:', error);
    console.error('🚨 ERROR STACK:', stack);
    console.error('🚨 ERROR INFO:', info);
    res.json({ success: true });
  });

  // Coins award endpoint
  app.post('/api/coins/award', requireAuth, async (req: any, res) => {
    try {
      const { userId, amount, reason } = req.body;
      const sessionUserId = req.session.user.userId;

      // Security check: only allow users to award coins to themselves
      if (userId !== sessionUserId) {
        return res.status(403).json({ message: "Cannot award coins to other users" });
      }

      // Validate amount (reasonable limits for game rewards)
      if (!amount || amount < 1 || amount > 1000) {
        return res.status(400).json({ message: "Invalid coin amount" });
      }

      // Award the coins using the existing coin transaction system
      await storage.processCoinTransaction(userId, amount, reason || 'manual_award');

      //console.log(`🪙 Awarded ${amount} coins to user ${userId} for: ${reason}`);
      res.json({ success: true, message: `${amount} coins awarded successfully` });
    } catch (error) {
      console.error("Error awarding coins:", error);
      res.status(500).json({ message: "Failed to award coins" });
    }
  });

  // Coin gift validation schema
  const coinGiftSchema = z.object({
    recipientId: z.string().min(1, "Recipient ID is required"),
    amount: z.number().int().min(1, "Gift amount must be at least 1 coin"),
    message: z.string().max(200, "Message cannot exceed 200 characters").optional()
  });

  // Coin gift endpoints
  app.post('/api/coins/gift', requireAuth, async (req: any, res) => {
    try {
      // Validate request body with Zod
      const validation = coinGiftSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: validation.error.errors 
        });
      }

      const { recipientId, amount, message } = validation.data;
      const senderId = req.session.user.userId;

      // Additional validations
      if (senderId === recipientId) {
        return res.status(400).json({ message: "Cannot send gift to yourself" });
      }

      // Check gift limit (20M) - unlimited for admin users
      const GIFT_LIMIT = 20000000; // 20M coins
      const UNLIMITED_USER_IDS = ["c9122c48-3c24-4891-a6b5-f02aa8362af2","3149a38b-2989-4272-b41e-a70021bccbfb"];
      
      if (!UNLIMITED_USER_IDS.includes(senderId) && amount > GIFT_LIMIT) {
        return res.status(400).json({ 
          message: `Gift amount cannot exceed 20M coins` 
        });
      }

      // Send the gift
      const result = await storage.sendCoinGift(senderId, recipientId, amount, message);

      if (result.success) {
        // Get recipient info for notification
        const recipient = await storage.getUser(recipientId);
        const sender = await storage.getUser(senderId);

        // Send WebSocket notification to recipient if they're online
        const recipientConnections = Array.from(connections.values()).filter(conn => conn.userId === recipientId);
        if (recipientConnections.length > 0) {
          const notification = JSON.stringify({
            type: 'gift_received',
            senderId: senderId,
            senderName: sender?.displayName || sender?.username || 'Unknown',
            amount: amount,
            message: message || null,
            timestamp: new Date().toISOString()
          });

          recipientConnections.forEach(conn => {
            if (conn.ws.readyState === WebSocket.OPEN) {
              conn.ws.send(notification);
            }
          });
        }

        res.json({ success: true, message: `Gift of ${amount} coins sent successfully!` });
      } else {
        res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error("Error sending coin gift:", error);
      res.status(500).json({ message: "Failed to send coin gift" });
    }
  });

  app.get('/api/users/online', requireAuth, async (req: any, res) => {
    try {
      const currentUserId = req.session.user.userId;
      const onlineUsersList = Array.from(onlineUsers.values())
        .filter(user => user.userId !== currentUserId);

      // Get complete user information from database with achievements
      const usersWithProfiles = await Promise.all(
        onlineUsersList.map(async (user) => {
          const userInfo = await storage.getUser(user.userId);
          const achievements = await storage.getUserAchievements(user.userId);
          return {
            userId: user.userId,
            username: userInfo?.username || user.username,
            displayName: userInfo?.displayName || userInfo?.firstName || user.displayName,
            firstName: userInfo?.firstName,
            profilePicture: userInfo?.profilePicture,
            profileImageUrl: userInfo?.profileImageUrl,
            inRoom: !!user.roomId,
            lastSeen: user.lastSeen,
            achievements: achievements.slice(0, 3) // Show top 3 achievements
          };
        })
      );

      res.json({
        total: usersWithProfiles.length,
        users: usersWithProfiles
      });
    } catch (error) {
      console.error("Error fetching online users:", error);
      res.status(500).json({ message: "Failed to fetch online users" });
    }
  });

  app.get('/api/coins/gifts', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const limit = parseInt(req.query.limit as string) || 50;

      const giftHistory = await storage.getCoinGiftHistory(userId, limit);
      res.json(giftHistory);
    } catch (error) {
      console.error("Error fetching gift history:", error);
      res.status(500).json({ message: "Failed to fetch gift history" });
    }
  });

  app.get('/api/coins/received-gifts', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const unreadOnly = req.query.unreadOnly === 'true';

      const receivedGifts = await storage.getReceivedGifts(userId, unreadOnly);
      res.json(receivedGifts);
    } catch (error) {
      console.error("Error fetching received gifts:", error);
      res.status(500).json({ message: "Failed to fetch received gifts" });
    }
  });

  // Get user data by ID
  app.get('/api/users/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's current coin balance
      const coins = await storage.getUserCoins(userId);

      // Return user data with coins
      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        coins: coins,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  // User stats route
  app.get('/api/users/:id/stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Online game stats route for current user
  app.get('/api/users/online-stats', requireAuth, async (req: any, res) => {
    try {
      // Ensure user is authenticated
      if (!req.session.user || !req.session.user.userId) {
        console.error("No authenticated user found in session for online-stats");
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userId = req.session.user.userId;
      console.log(`Fetching online stats for authenticated user: ${userId}`);

      // Fetching online stats for current user
      const stats = await storage.getOnlineGameStats(userId);
      // Stats retrieved successfully
      res.json(stats);
    } catch (error) {
      console.error("Error fetching online game stats:", error);
      res.status(500).json({ message: "Failed to fetch online game stats" });
    }
  });


  // Monthly Leaderboard endpoints
  app.get('/api/leaderboard/weekly', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const weekNumber = parseInt(req.query.weekNumber as string);
      const year = parseInt(req.query.year as string);

      if (weekNumber && year) {
        // Get specific week leaderboard
        const leaderboard = await storage.getWeeklyLeaderboard(weekNumber, year, Math.min(limit, 50));
        res.json(leaderboard);
      } else {
        // Get current week leaderboard
        const leaderboard = await storage.getCurrentWeekLeaderboard(Math.min(limit, 50));
        res.json(leaderboard);
      }
    } catch (error) {
      console.error("Error fetching weekly leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch weekly leaderboard" });
    }
  });

  // Get time until week end for countdown timer
  app.get('/api/leaderboard/time-left', async (req, res) => {
    try {
      const timeLeft = await storage.getTimeUntilWeekEnd();
      res.json(timeLeft);
    } catch (error) {
      console.error("Error fetching time until week end:", error);
      res.status(500).json({ message: "Failed to fetch time until week end" });
    }
  });

  // Get user's monthly rewards history
  app.get('/api/rewards/weekly', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const rewards = await storage.getWeeklyRewards(userId);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching weekly rewards:", error);
      res.status(500).json({ message: "Failed to fetch weekly rewards" });
    }
  });

  // Get player profile by ID
  app.get('/api/players/:playerId', async (req, res) => {
    try {
      const { playerId } = req.params;
      const profile = await storage.getPlayerProfile(playerId);

      if (!profile) {
        return res.status(404).json({ error: 'Player not found' });
      }

      res.json(profile);
    } catch (error) {
      console.error('❌ Error fetching player profile:', error);
      res.status(500).json({ error: 'Failed to fetch player profile' });
    }
  });

  // Get head-to-head statistics between two players
  app.get('/api/head-to-head/:currentUserId/:targetUserId', async (req, res) => {
    try {
      const { currentUserId, targetUserId } = req.params;

      if (currentUserId === targetUserId) {
        return res.status(400).json({ error: 'Cannot get head-to-head stats for same player' });
      }

      const headToHead = await storage.getDetailedHeadToHeadStats(currentUserId, targetUserId);
      res.json(headToHead);
    } catch (error) {
      console.error('❌ Error fetching head-to-head stats:', error);
      res.status(500).json({ error: 'Failed to fetch head-to-head statistics' });
    }
  });

  // Online game stats route for specific user
  app.get('/api/users/:id/online-stats', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      // Fetching online stats for user
      const stats = await storage.getOnlineGameStats(userId);
      // Stats retrieved successfully
      res.json(stats);
    } catch (error) {
      console.error("Error fetching online game stats:", error);
      res.status(500).json({ message: "Failed to fetch online game stats" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Level up routes
  app.get('/api/level-ups/pending', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const pendingLevelUps = await storage.getPendingLevelUps(userId);
      res.json(pendingLevelUps);
    } catch (error) {
      console.error("Error fetching pending level ups:", error);
      res.status(500).json({ message: "Failed to fetch pending level ups" });
    }
  });

  app.post('/api/level-ups/:levelUpId/acknowledge', requireAuth, async (req: any, res) => {
    try {
      const levelUpId = req.params.levelUpId;
      const userId = req.session.user.userId;

      // Verify the level-up belongs to the authenticated user
      const levelUp = await storage.getLevelUpById(levelUpId);
      if (!levelUp) {
        return res.status(404).json({ message: "Level up not found" });
      }

      if (levelUp.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to acknowledge this level up" });
      }

      await storage.acknowledgeLevelUp(levelUpId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error acknowledging level up:", error);
      res.status(500).json({ message: "Failed to acknowledge level up" });
    }
  });

  app.post('/api/level-ups/acknowledge-all', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      await storage.acknowledgeAllLevelUps(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error acknowledging all level ups:", error);
      res.status(500).json({ message: "Failed to acknowledge all level ups" });
    }
  });

  app.get('/api/users/:id/achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // ===== Daily Reward Routes =====
  
  // Get daily reward status for current user
  app.get('/api/daily-reward', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const rewardStatus = await storage.getDailyReward(userId);
      res.json(rewardStatus);
    } catch (error) {
      console.error("Error fetching daily reward status:", error);
      res.status(500).json({ message: "Failed to fetch daily reward status" });
    }
  });

  // Claim daily reward
  app.post('/api/daily-reward/claim', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const result = await storage.claimDailyReward(userId);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json(result);
    } catch (error) {
      console.error("Error claiming daily reward:", error);
      res.status(500).json({ message: "Failed to claim daily reward" });
    }
  });

  // ===== Emoji Routes =====
  
  // Get all available emoji items
  app.get('/api/emojis', requireAuth, async (req: any, res) => {
    try {
      const emojis = await storage.getAllEmojiItems();
      res.json(emojis);
    } catch (error) {
      console.error("Error fetching emojis:", error);
      res.status(500).json({ message: "Failed to fetch emojis" });
    }
  });

  // Get user's purchased emojis
  app.get('/api/emojis/owned', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const ownedEmojis = await storage.getUserEmojis(userId);
      res.json(ownedEmojis);
    } catch (error) {
      console.error("Error fetching owned emojis:", error);
      res.status(500).json({ message: "Failed to fetch owned emojis" });
    }
  });

  // Purchase an emoji
  app.post('/api/emojis/purchase', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { emojiId } = req.body;

      if (!emojiId) {
        return res.status(400).json({ message: "Emoji ID is required" });
      }

      const result = await storage.purchaseEmoji(userId, emojiId);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json(result);
    } catch (error) {
      console.error("Error purchasing emoji:", error);
      res.status(500).json({ message: "Failed to purchase emoji" });
    }
  });

  // Send an emoji in a game
  app.post('/api/emojis/send', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { emojiId, gameId, recipientPlayerId } = req.body;

      if (!emojiId || !gameId || !recipientPlayerId) {
        return res.status(400).json({ message: "Emoji ID, game ID, and recipient player ID are required" });
      }

      // The API just validates - actual send happens via WebSocket
      // Check if user owns the emoji
      const hasEmoji = await storage.hasUserPurchasedEmoji(userId, emojiId);
      if (!hasEmoji) {
        return res.status(403).json({ message: "You do not own this emoji" });
      }

      res.json({ success: true, message: "Emoji will be sent via WebSocket" });
    } catch (error) {
      console.error("Error validating emoji send:", error);
      res.status(500).json({ message: "Failed to validate emoji send" });
    }
  });

  // Get emojis sent in a game
  app.get('/api/games/:id/emojis', requireAuth, async (req: any, res) => {
    try {
      const gameId = req.params.id;
      const emojiSends = await storage.getGameEmojiSends(gameId);
      res.json(emojiSends);
    } catch (error) {
      console.error("Error fetching game emojis:", error);
      res.status(500).json({ message: "Failed to fetch game emojis" });
    }
  });

  // ===== Avatar Frame Routes =====
  
  // Get all available avatar frames
  app.get('/api/avatar-frames', requireAuth, async (req: any, res) => {
    try {
      const frames = await storage.getAllAvatarFrameItems();
      res.json(frames);
    } catch (error) {
      console.error("Error fetching avatar frames:", error);
      res.status(500).json({ message: "Failed to fetch avatar frames" });
    }
  });

  // Get user's purchased avatar frames
  app.get('/api/avatar-frames/owned', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const ownedFrames = await storage.getUserAvatarFrames(userId);
      res.json(ownedFrames);
    } catch (error) {
      console.error("Error fetching owned avatar frames:", error);
      res.status(500).json({ message: "Failed to fetch owned avatar frames" });
    }
  });

  // Get user's active avatar frame
  app.get('/api/avatar-frames/active', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const activeFrameId = await storage.getActiveAvatarFrame(userId);
      res.json({ activeFrameId });
    } catch (error) {
      console.error("Error fetching active avatar frame:", error);
      res.status(500).json({ message: "Failed to fetch active avatar frame" });
    }
  });

  // Purchase an avatar frame
  app.post('/api/avatar-frames/purchase', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { frameId } = req.body;

      if (!frameId) {
        return res.status(400).json({ message: "Frame ID is required" });
      }

      const result = await storage.purchaseAvatarFrame(userId, frameId);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json(result);
    } catch (error) {
      console.error("Error purchasing avatar frame:", error);
      res.status(500).json({ message: "Failed to purchase avatar frame" });
    }
  });

  // Set active avatar frame
  app.post('/api/avatar-frames/set-active', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { frameId } = req.body;

      const result = await storage.setActiveAvatarFrame(userId, frameId);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.json(result);
    } catch (error) {
      console.error("Error setting active avatar frame:", error);
      res.status(500).json({ message: "Failed to set active avatar frame" });
    }
  });

  // Get user's active avatar frame
  app.get('/api/users/:userId/avatar-frame', async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const activeFrameId = await storage.getActiveAvatarFrame(userId);
      res.json({ activeFrameId });
    } catch (error) {
      console.error("Error fetching user avatar frame:", error);
      res.status(500).json({ message: "Failed to fetch avatar frame" });
    }
  });

  // Debug endpoint to manually trigger achievement recalculation
  app.post('/api/debug/recalculate-achievements', requireAuth, async (req: any, res) => {
    try {
      //console.log('🔧 DEBUG: Starting debug endpoint');
      const userId = req.session?.user?.userId;

      if (!userId) {
        //console.log('🔧 DEBUG: No user ID found in session');
        return res.status(401).json({ error: "No user session found" });
      }

      //console.log(`🔧 DEBUG: Processing for user: ${userId}`);

      // Special handling for target user who should have win streak achievements
      if (userId === 'e08f9202-f1d0-4adf-abc7-f5fbca314dc3') {
        //console.log('🎯 SPECIAL: Detected target user - manually granting achievements');

        // Delete all existing achievements first
        await db.delete(achievements).where(eq(achievements.userId, userId));
        //console.log('🗑️ Cleared existing achievements');

        // Grant appropriate achievements based on reported stats
        const achievementsToGrant = [
          { type: 'first_win', name: 'firstVictoryTitle', description: 'winYourVeryFirstGame', icon: '🏆' },
          { type: 'win_streak_5', name: 'winStreakMaster', description: 'winFiveConsecutiveGames', icon: '🔥' },
          { type: 'win_streak_10', name: 'unstoppable', description: 'winTenConsecutiveGames', icon: '⚡' },
          { type: 'speed_demon', name: 'speedDemon', description: 'winTwentyTotalGames', icon: '⚡' }
        ];

        for (const achievement of achievementsToGrant) {
          const achievementId = nanoid();
          await db.insert(achievements).values({
            id: achievementId,
            userId,
            achievementType: achievement.type,
            achievementName: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            unlockedAt: new Date(),
            metadata: {}
          });
          //console.log(`✅ Granted: ${achievement.type}`);
        }

        // Update user stats to ensure consistency
        await storage.updateSpecificUserStats(userId, {
          wins: 38,
          losses: 59,
          draws: 10,
          currentWinStreak: 7,
          bestWinStreak: 15
        });
        //console.log('📊 Updated user stats');

        const finalAchievements = await storage.getUserAchievements(userId);

        return res.json({
          success: true,
          message: 'Special processing completed for target user',
          userId,
          achievements: finalAchievements.length,
          achievementTypes: finalAchievements.map(a => a.achievementType)
        });
      }

      // Get current user stats for debugging
      const userStats = await storage.getUserStats(userId);
      //console.log(`🔧 DEBUG: User stats:`, userStats);

      const user = await storage.getUser(userId);
      console.log(`🔧 DEBUG: User data:`, {
        id: user?.id,
        currentWinStreak: user?.currentWinStreak,
        bestWinStreak: user?.bestWinStreak,
        wins: user?.wins,
        losses: user?.losses,
        draws: user?.draws
      });

      // Calculate win streaks from game history for comparison
      //console.log('🔧 DEBUG: About to call getUserGames');
      const games = await storage.getUserGames(userId);
      //console.log('🔧 DEBUG: Retrieved games:', games.length);
      const gameResults = games
        .filter(g => g.status === 'finished')
        .sort((a, b) => new Date(a.finishedAt || '').getTime() - new Date(b.finishedAt || '').getTime())
        .map(g => {
          if (g.winnerId === userId) return 'win';
          if (g.winnerId === null) return 'draw';
          return 'loss';
        });

      // Calculate actual win streaks from game history
      let calculatedCurrentWinStreak = 0;
      let calculatedBestWinStreak = 0;
      let currentStreak = 0;

      for (let i = gameResults.length - 1; i >= 0; i--) {
        if (gameResults[i] === 'win') {
          currentStreak++;
          if (i === gameResults.length - 1 || calculatedCurrentWinStreak === 0) {
            calculatedCurrentWinStreak = currentStreak;
          }
        } else {
          if (calculatedCurrentWinStreak === 0) {
            calculatedCurrentWinStreak = 0;
          }
          currentStreak = 0;
        }
        calculatedBestWinStreak = Math.max(calculatedBestWinStreak, currentStreak);
      }

      // Reset currentStreak calculation for proper current win streak
      calculatedCurrentWinStreak = 0;
      for (let i = gameResults.length - 1; i >= 0; i--) {
        if (gameResults[i] === 'win') {
          calculatedCurrentWinStreak++;
        } else {
          break;
        }
      }

      console.log(`🔧 DEBUG: Calculated win streaks from ${gameResults.length} games:`, {
        currentWinStreak: calculatedCurrentWinStreak,
        bestWinStreak: calculatedBestWinStreak,
        recentResults: gameResults.slice(-10)
      });

      console.log(`🔧 DEBUG: Database vs Calculated:`, {
        database: { current: user?.currentWinStreak, best: user?.bestWinStreak },
        calculated: { current: calculatedCurrentWinStreak, best: calculatedBestWinStreak }
      });

      // Get current achievements before recalculation
      const achievementsBefore = await storage.getUserAchievements(userId);
      //console.log(`🔧 DEBUG: Achievements before (${achievementsBefore.length}):`, achievementsBefore.map(a => a.achievementType));

      // Force update win streaks if they're incorrect
      if (calculatedBestWinStreak > (user?.bestWinStreak || 0)) {
        //console.log(`🔧 DEBUG: Updating incorrect win streaks from ${user?.bestWinStreak} to ${calculatedBestWinStreak}`);
        await storage.updateSpecificUserStats(userId, {
          currentWinStreak: calculatedCurrentWinStreak,
          bestWinStreak: calculatedBestWinStreak
        });
      }

      // Trigger achievement recalculation
      //console.log(`🔧 DEBUG: Starting recalculation...`);
      const result = await storage.recalculateUserAchievements(userId);
      //console.log(`🔧 DEBUG: Recalculation result:`, result);

      // Wait a moment for database consistency then check achievements again
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get achievements after recalculation
      const achievementsAfter = await storage.getUserAchievements(userId);
      //console.log(`🔧 DEBUG: Achievements after (${achievementsAfter.length}):`, achievementsAfter.map(a => a.achievementType));

      // Re-check win streaks to ensure we have the latest data
      const updatedUser = await storage.getUser(userId);
      const currentWinStreak = updatedUser?.currentWinStreak || 0;
      const bestWinStreak = updatedUser?.bestWinStreak || 0;

      //console.log(`🔧 DEBUG: Updated win streaks - current: ${currentWinStreak}, best: ${bestWinStreak}`);

      const debugData = { 
        success: true, 
        userId,
        userStats: userStats || {},
        winStreaks: {
          current: currentWinStreak,
          best: bestWinStreak
        },
        achievementsBefore: achievementsBefore.length,
        achievementsAfter: achievementsAfter.length,
        achievementTypes: achievementsAfter.map(a => a.achievementType),
        hasWinStreak5: achievementsAfter.some(a => a.achievementType === 'win_streak_5'),
        hasWinStreak10: achievementsAfter.some(a => a.achievementType === 'win_streak_10'),
        recalculationAdded: result?.added?.length || 0,
        recalculationRemoved: result?.removed || 0,
        result: result || {}
      };

      console.log(`🔧 DEBUG: Sending response:`, JSON.stringify(debugData, null, 2));
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json(debugData);
    } catch (error) {
      console.error("🔧 DEBUG ERROR:", error);
      const errorResponse = { 
        success: false,
        error: error.message || "Unknown error occurred",
        stack: error.stack
      };
      console.log(`🔧 DEBUG: Sending error response:`, errorResponse);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json(errorResponse);
    }
  });

  // Update selected achievement border
  app.post('/api/achievement-border/select', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { achievementType } = req.body;

      // Validate that user has this achievement if not null
      if (achievementType && !await storage.hasAchievement(userId, achievementType)) {
        return res.status(400).json({ message: "You don't have this achievement" });
      }

      await storage.updateSelectedAchievementBorder(userId, achievementType);
      res.json({ success: true });
    } catch (error) {
      //console.error("Error updating selected achievement border:", error);
      res.status(500).json({ message: "Failed to update selected achievement border" });
    }
  });

  // Debug endpoint specifically for win streak achievements
  app.post('/api/debug/fix-win-streak-achievements', requireAuth, async (req: any, res) => {
    try {
      console.log('🔧 DEBUG: Starting win streak achievement fix for all users');

      // Get all users who have games
      const allUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(
          exists(
            db.select().from(games).where(
              or(
                eq(games.playerXId, users.id),
                eq(games.playerOId, users.id)
              )
            )
          )
        );

      console.log(`🔧 DEBUG: Found ${allUsers.length} users with games`);

      const results = [];
      let fixedUsersCount = 0;

      for (const user of allUsers) {
        const userId = user.id;
        console.log(`🔧 DEBUG: Processing user ${userId}`);

        try {
          // Get user's current win streak data
          const userRecord = await storage.getUser(userId);
          const currentBestWinStreak = userRecord?.bestWinStreak || 0;

          // Recalculate user stats from games to ensure accurate win streaks
          await storage.recalculateUserStats(userId);

          // Get updated user data after recalculation
          const updatedUser = await storage.getUser(userId);
          const newBestWinStreak = updatedUser?.bestWinStreak || 0;

          //console.log(`🔧 DEBUG: User ${userId} - Win streak updated from ${currentBestWinStreak} to ${newBestWinStreak}`);

          // Get current achievements
          const currentAchievements = await db
            .select()
            .from(achievements)
            .where(eq(achievements.userId, userId));

          const hasWinStreak5 = currentAchievements.some(a => a.achievementType === 'win_streak_5');
          const hasWinStreak10 = currentAchievements.some(a => a.achievementType === 'win_streak_10');

          const shouldHaveWinStreak5 = newBestWinStreak >= 5;
          const shouldHaveWinStreak10 = newBestWinStreak >= 10;

          let achievementsAdded = [];

          // Add missing win streak achievements
          if (shouldHaveWinStreak5 && !hasWinStreak5) {
            try {
              await db
                .insert(achievements)
                .values({
                  userId,
                  achievementType: 'win_streak_5',
                  achievementName: 'winStreakMaster',
                  description: 'winFiveConsecutiveGames',
                  icon: '🔥',
                  metadata: {},
                })
                .onConflictDoNothing();
              achievementsAdded.push('win_streak_5');
              //console.log(`✅ Added win_streak_5 achievement for user ${userId}`);
            } catch (error) {
              console.error(`❌ Error adding win_streak_5 for user ${userId}:`, error);
            }
          }

          if (shouldHaveWinStreak10 && !hasWinStreak10) {
            try {
              await db
                .insert(achievements)
                .values({
                  userId,
                  achievementType: 'win_streak_10',
                  achievementName: 'unstoppable',
                  description: 'winTenConsecutiveGames',
                  icon: '⚡',
                  metadata: {},
                })
                .onConflictDoNothing();
              achievementsAdded.push('win_streak_10');
              //console.log(`✅ Added win_streak_10 achievement for user ${userId}`);
            } catch (error) {
              console.error(`❌ Error adding win_streak_10 for user ${userId}:`, error);
            }
          }

          if (achievementsAdded.length > 0) {
            fixedUsersCount++;
          }

          results.push({
            userId,
            oldBestWinStreak: currentBestWinStreak,
            newBestWinStreak: newBestWinStreak,
            hadWinStreak5: hasWinStreak5,
            hadWinStreak10: hasWinStreak10,
            shouldHaveWinStreak5,
            shouldHaveWinStreak10,
            achievementsAdded
          });

        } catch (userError) {
          console.error(`❌ Error processing user ${userId}:`, userError);
          results.push({
            userId,
            error: userError.message
          });
        }
      }

      //console.log(`🎉 Win streak achievement fix completed! Fixed ${fixedUsersCount} users`);

      res.json({
        success: true,
        message: `Win streak achievements fixed for ${fixedUsersCount} users`,
        totalUsers: allUsers.length,
        fixedUsers: fixedUsersCount,
        results: results.slice(0, 10) // Return first 10 for debugging
      });

    } catch (error) {
      console.error('❌ Error in win streak achievement fix:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Theme routes
  app.get('/api/themes', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      // Fetching themes for user

      // Auto-check and unlock Halloween theme for eligible users
      try {
        const user = await storage.getUser(userId);
        if (user && (user.currentWinStreak >= 10 || user.bestWinStreak >= 10)) {
          const isUnlocked = await storage.isThemeUnlocked(userId, 'halloween');
          if (!isUnlocked) {
            await storage.unlockTheme(userId, 'halloween');
            //console.log(`🎃 Auto-unlocked Halloween theme for user ${userId} with streak ${user.bestWinStreak}`);
          }
        }
      } catch (autoUnlockError) {
        console.error('Error auto-unlocking Halloween theme:', autoUnlockError);
      }

      // Add default themes that are always available
      const defaultThemes = [
        { id: 'default', name: 'Default', unlocked: true },
        { id: 'neon', name: 'Neon', unlocked: true },
        { id: 'autumn', name: 'Autumn', unlocked: true },
        { id: 'minimalist', name: 'Minimalist', unlocked: true },
        { id: 'nature', name: 'Nature', unlocked: true },
        { id: 'space', name: 'Space', unlocked: true },
      ];

      // Check special themes with error handling
      let specialThemes = [];
      try {
        specialThemes = [
          { id: 'halloween', name: 'Halloween', unlocked: await storage.isThemeUnlocked(userId, 'halloween') },
          { id: 'christmas', name: 'Christmas', unlocked: await storage.isThemeUnlocked(userId, 'christmas') },
          { id: 'summer', name: 'Summer', unlocked: await storage.isThemeUnlocked(userId, 'summer') },
          { id: 'level_100_frame', name: 'Level 100 Master', unlocked: await storage.isThemeUnlocked(userId, 'level_100_frame') },
        ];
      } catch (themeError) {
        console.error('Error checking theme unlock status:', themeError);
        // Return default locked themes if error occurs
        specialThemes = [
          { id: 'halloween', name: 'Halloween', unlocked: false },
          { id: 'christmas', name: 'Christmas', unlocked: false },
          { id: 'summer', name: 'Summer', unlocked: false },
          { id: 'level_100_frame', name: 'Level 100 Master', unlocked: false },
        ];
      }

      // Get user themes with error handling
      let themes = [];
      try {
        themes = await storage.getUserThemes(userId);
      } catch (userThemeError) {
        console.error('Error fetching user themes:', userThemeError);
        themes = [];
      }

      // Themes fetched successfully
      res.json({
        defaultThemes,
        specialThemes,
        unlockedThemes: themes
      });
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  app.post('/api/themes/:name/unlock', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { name } = req.params;

      // Check if theme can be unlocked (for admin testing)
      const theme = await storage.unlockTheme(userId, name);
      res.json({ message: "Theme unlocked successfully", theme });
    } catch (error) {
      console.error("Error unlocking theme:", error);
      res.status(500).json({ message: "Failed to unlock theme" });
    }
  });

  // Check and unlock Halloween theme based on streak
  app.post('/api/themes/check-halloween', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;

      // Get user's current stats
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentWinStreak = user.currentWinStreak || 0;
      const bestWinStreak = user.bestWinStreak || 0;

      // Check if user has 10+ consecutive wins (current or best)
      if (currentWinStreak >= 10 || bestWinStreak >= 10) {
        // Check if Halloween theme is already unlocked
        const isUnlocked = await storage.isThemeUnlocked(userId, 'halloween');

        if (!isUnlocked) {
          // Unlock Halloween theme
          const theme = await storage.unlockTheme(userId, 'halloween');
          res.json({ 
            message: "Halloween theme unlocked! You earned it with your win streak!", 
            theme,
            currentStreak: currentWinStreak,
            bestStreak: bestWinStreak
          });
        } else {
          res.json({ 
            message: "Halloween theme already unlocked", 
            alreadyUnlocked: true,
            currentStreak: currentWinStreak,
            bestStreak: bestWinStreak
          });
        }
      } else {
        res.json({ 
          message: "Need 10 consecutive wins to unlock Halloween theme", 
          eligible: false,
          currentStreak: currentWinStreak,
          bestStreak: bestWinStreak,
          needed: 10 - Math.max(currentWinStreak, bestWinStreak)
        });
      }
    } catch (error) {
      console.error("Error checking Halloween theme:", error);
      res.status(500).json({ message: "Failed to check Halloween theme" });
    }
  });

  // Piece Style routes
  app.get('/api/piece-styles', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const pieceStyles = await storage.getUserPieceStyles(userId);
      const activePieceStyle = await storage.getActivePieceStyle(userId);
      
      res.json({
        pieceStyles,
        activeStyle: activePieceStyle?.styleName || 'default'
      });
    } catch (error) {
      console.error("Error fetching piece styles:", error);
      res.status(500).json({ message: "Failed to fetch piece styles" });
    }
  });

  app.post('/api/piece-styles/purchase', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { styleName, price } = req.body;

      if (!styleName || !price) {
        return res.status(400).json({ message: "Style name and price are required" });
      }

      const result = await storage.purchasePieceStyle(userId, styleName, price);
      
      if (result.success) {
        res.json({ 
          message: result.message, 
          style: result.style 
        });
      } else {
        res.status(400).json({ message: result.message });
      }
    } catch (error) {
      console.error("Error purchasing piece style:", error);
      res.status(500).json({ message: "Failed to purchase piece style" });
    }
  });

  app.post('/api/piece-styles/set-active', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { styleName } = req.body;

      if (!styleName) {
        return res.status(400).json({ message: "Style name is required" });
      }

      const style = await storage.setActivePieceStyle(userId, styleName);
      res.json({ message: "Active piece style updated", style });
    } catch (error) {
      console.error("Error setting active piece style:", error);
      res.status(500).json({ message: error.message || "Failed to set active piece style" });
    }
  });

  // Player rankings route
  app.get('/api/rankings', requireAuth, async (req: any, res) => {
    try {
      const sortBy = req.query.sortBy || 'winRate';
      const rankings = await storage.getPlayerRankings(sortBy as string);
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching player rankings:", error);
      res.status(500).json({ message: "Failed to fetch player rankings" });
    }
  });

  // Get online users


  // Block user endpoint
  app.post('/api/users/block', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const blockerId = req.session.user.userId;

      if (blockerId === userId) {
        return res.status(400).json({ error: 'Cannot block yourself' });
      }

      await storage.blockUser(blockerId, userId);
      res.json({ success: true, message: 'User blocked successfully' });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  // Unblock user endpoint
  app.post('/api/users/unblock', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.body;
      const blockerId = req.session.user.userId;

      await storage.unblockUser(blockerId, userId);
      res.json({ success: true, message: 'User unblocked successfully' });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Get blocked users endpoint
  app.get('/api/users/blocked', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const blockedUsers = await storage.getBlockedUsers(userId);
      res.json(blockedUsers);
    } catch (error) {
      console.error("Error getting blocked users:", error);
      res.status(500).json({ message: "Failed to get blocked users" });
    }
  });

  // Heartbeat endpoint to keep users online
  app.post('/api/heartbeat', requireAuth, (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const displayName = req.session.user.displayName || req.session.user.firstName || req.session.user.username;

      // Explicitly update online status (redundant but ensures it works)
      onlineUsers.set(userId, {
        userId,
        username: req.session.user.username,
        displayName,
        roomId: userRoomStates.get(userId)?.roomId,
        lastSeen: new Date()
      });

      res.json({ 
        status: 'online', 
        userId,
        displayName,
        timestamp: new Date().toISOString(),
        totalOnlineUsers: onlineUsers.size
      });
    } catch (error) {
      console.error('❌ Heartbeat error:', error);
      res.status(500).json({ error: 'Heartbeat failed' });
    }
  });

  // Friend system routes
  // Send friend request
  app.post('/api/friends/request', requireAuth, async (req: any, res) => {
    try {
      const { requestedId } = req.body;
      const requesterId = req.session.user.userId;

      if (!requestedId) {
        return res.status(400).json({ error: 'Requested user ID is required' });
      }

      if (requesterId === requestedId) {
        return res.status(400).json({ error: 'Cannot send friend request to yourself' });
      }

      const friendRequest = await storage.sendFriendRequest(requesterId, requestedId);
      res.json(friendRequest);
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get friend requests
  app.get('/api/friends/requests', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const friendRequests = await storage.getFriendRequests(userId);
      res.json(friendRequests);
    } catch (error) {
      console.error("Error getting friend requests:", error);
      res.status(500).json({ message: "Failed to get friend requests" });
    }
  });

  // Respond to friend request
  app.post('/api/friends/respond', requireAuth, async (req: any, res) => {
    try {
      const { requestId, response } = req.body;

      if (!requestId || !response) {
        return res.status(400).json({ error: 'Request ID and response are required' });
      }

      if (!['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({ error: 'Response must be "accepted" or "rejected"' });
      }

      await storage.respondToFriendRequest(requestId, response);
      res.json({ success: true, message: `Friend request ${response}` });
    } catch (error) {
      console.error("Error responding to friend request:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get friends list
  app.get('/api/friends', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error getting friends:", error);
      res.status(500).json({ message: "Failed to get friends" });
    }
  });

  // Remove friend
  app.delete('/api/friends/:friendId', requireAuth, async (req: any, res) => {
    try {
      const { friendId } = req.params;
      const userId = req.session.user.userId;

      if (!friendId) {
        return res.status(400).json({ error: 'Friend ID is required' });
      }

      await storage.removeFriend(userId, friendId);
      res.json({ success: true, message: 'Friend removed' });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // Cleanup friendship data endpoint (for debugging)
  app.post('/api/friends/cleanup', requireAuth, async (req: any, res) => {
    try {
      await storage.cleanupFriendshipData();
      res.json({ success: true, message: 'Friendship data cleanup completed' });
    } catch (error) {
      console.error("Error during friendship cleanup:", error);
      res.status(500).json({ message: "Failed to cleanup friendship data" });
    }
  });

  // Debug endpoint to check user achievements and stats
  app.get('/api/debug/user-achievements', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const userStats = await storage.getUserStats(userId);
      const userAchievements = await storage.getUserAchievements(userId);

      res.json({
        userId,
        stats: userStats,
        achievements: userAchievements,
        achievementCount: userAchievements.length
      });
    } catch (error) {
      console.error("Error getting debug info:", error);
      res.status(500).json({ message: "Failed to get debug info" });
    }
  });

  // Recalculate achievements endpoint
  app.post('/api/achievements/recalculate', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      //console.log(`🔄 Recalculation request for user: ${userId}`);

      const result = await storage.recalculateUserAchievements(userId);

      //console.log(`✅ Recalculation successful - removed: ${result.removed}, added: ${result.added.length}`);

      res.json({
        success: true,
        message: 'Achievements recalculated successfully',
        removed: result.removed,
        added: result.added.length,
        achievements: result.added
      });
    } catch (error) {
      console.error("❌ Error recalculating achievements:", error);
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
      res.status(500).json({ 
        error: "Failed to recalculate achievements",
        details: error.message 
      });
    }
  });

  // Ensure achievements are up to date for current user
  app.post('/api/achievements/sync', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      // Achievement sync request

      await storage.ensureAllAchievementsUpToDate(userId);
      const achievements = await storage.getUserAchievements(userId);

      // Achievement sync successful

      res.json({
        success: true,
        message: 'Achievements synced successfully',
        achievements: achievements
      });
    } catch (error) {
      console.error("❌ Error syncing achievements:", error);
      res.status(500).json({ 
        error: "Failed to sync achievements",
        details: error.message 
      });
    }
  });

  // Get head-to-head stats
  app.get('/api/friends/:friendId/stats', requireAuth, async (req: any, res) => {
    try {
      const { friendId } = req.params;
      const userId = req.session.user.userId;

      //console.log(`📊 Head-to-head stats request: userId=${userId}, friendId=${friendId}`);

      if (!friendId) {
        return res.status(400).json({ error: 'Friend ID is required' });
      }

      const stats = await storage.getHeadToHeadStats(userId, friendId);
      //console.log(`📊 Head-to-head stats result:`, stats);
      res.json(stats);
    } catch (error) {
      console.error("📊 Error getting head-to-head stats:", error);
      res.status(500).json({ message: "Failed to get head-to-head stats", details: error.message });
    }
  });

  // Room Invitation system routes
  // Send room invitation
  app.post('/api/rooms/:roomId/invite', requireAuth, async (req: any, res) => {
    try {
      const { roomId } = req.params;
      const { invitedId } = req.body;
      const inviterId = req.session.user.userId;

      if (!invitedId) {
        return res.status(400).json({ error: 'Invited user ID is required' });
      }

      // Check if room exists and user is the owner
      const room = await storage.getRoomById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room.ownerId !== inviterId) {
        return res.status(403).json({ error: 'Only room owner can send invitations' });
      }

      // Check if invited user is not the inviter
      if (inviterId === invitedId) {
        return res.status(400).json({ error: 'Cannot invite yourself' });
      }

      // Check if user is already in the room
      const participants = await storage.getRoomParticipants(roomId);
      const isAlreadyInRoom = participants.some(p => p.userId === invitedId);
      if (isAlreadyInRoom) {
        return res.status(400).json({ error: 'User is already in the room' });
      }

      // Send invitation
      const invitation = await storage.sendRoomInvitation(roomId, inviterId, invitedId);

      // Send WebSocket notification to invited user
      const inviterInfo = await storage.getUser(inviterId);
      const targetConnections = Array.from(connections.entries())
        .filter(([_, connection]) => connection.userId === invitedId);

      if (targetConnections.length > 0) {
        const notification = {
          type: 'room_invitation',
          invitation: {
            id: invitation.id,
            roomId: room.id,
            roomName: room.name,
            roomCode: room.code,
            inviterId: inviterId,
            inviterName: inviterInfo?.displayName || inviterInfo?.username || 'Unknown',
            timestamp: new Date().toISOString()
          }
        };

        targetConnections.forEach(([_, connection]) => {
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(notification));
          }
        });
      }

      res.json({ success: true, invitation });
    } catch (error) {
      console.error("Error sending room invitation:", error);
      res.status(500).json({ error: error.message || "Failed to send room invitation" });
    }
  });

  // Get room invitations
  app.get('/api/room-invitations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;

      // Clean up expired invitations first
      await storage.expireOldInvitations();

      const invitations = await storage.getRoomInvitations(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error getting room invitations:", error);
      res.status(500).json({ message: "Failed to get room invitations" });
    }
  });

  // Respond to room invitation
  app.post('/api/room-invitations/:invitationId/respond', requireAuth, async (req: any, res) => {
    try {
      const { invitationId } = req.params;
      const { response } = req.body; // 'accepted' or 'rejected'
      const userId = req.session.user.userId;

      if (!response || !['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({ error: 'Response must be "accepted" or "rejected"' });
      }

      // Get invitation details first
      const invitations = await storage.getRoomInvitations(userId);
      const invitation = invitations.find(inv => inv.id === invitationId);

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found or expired' });
      }

      if (invitation.invitedId !== userId) {
        return res.status(403).json({ error: 'Not authorized to respond to this invitation' });
      }

      // Check if user has enough coins before accepting invitation
      if (response === 'accepted') {
        // Get room details to check bet amount
        const room = await storage.getRoomById(invitation.roomId);
        if (!room) {
          return res.status(404).json({ error: 'Room not found' });
        }

        const requiredCoins = room.betAmount || 100;
        const userCoins = await storage.getUserCoins(userId);

        if (userCoins < requiredCoins) {
          return res.status(403).json({ 
            error: 'Insufficient coins',
            message: `You need ${requiredCoins.toLocaleString()} coins to join this room. You have ${userCoins.toLocaleString()} coins. Win AI games to earn more coins!`,
            requiredCoins: requiredCoins,
            currentCoins: userCoins
          });
        }
      }

      // Respond to invitation
      await storage.respondToRoomInvitation(invitationId, response);

      // Get user info for notifications
      const responderInfo = await storage.getUser(userId);

      if (response === 'accepted') {
        // Ensure user can join (auto-leave previous room if needed)
        const joinCheck = await ensureUserCanJoinRoom(userId, invitation.roomId);
        if (!joinCheck.canJoin) {
          return res.status(400).json({ error: joinCheck.error || "Cannot join room" });
        }

        // Add user to room as participant
        await storage.addRoomParticipant({
          roomId: invitation.roomId,
          userId: userId,
          role: 'player',
        });

        // Send WebSocket notification to room about new participant
        const roomConnections_invite = roomConnections.get(invitation.roomId);
        if (roomConnections_invite) {
          roomConnections_invite.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(JSON.stringify({
                type: 'user_joined_room',
                userId: userId,
                userInfo: {
                  displayName: responderInfo?.displayName || responderInfo?.username,
                  username: responderInfo?.username,
                  profileImageUrl: responderInfo?.profileImageUrl
                },
                roomId: invitation.roomId
              }));
            }
          });
        }

        // Also send notification to ALL online users about participant list update
        const participants = await storage.getRoomParticipants(invitation.roomId);
        const allConnections = Array.from(connections.values());
        allConnections.forEach(connection => {
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify({
              type: 'room_participants_updated',
              roomId: invitation.roomId,
              participants: participants
            }));
          }
        });

        // Send notification to inviter that invitation was accepted
        const inviterConnections = Array.from(connections.entries())
          .filter(([_, connection]) => connection.userId === invitation.inviterId);
        
        inviterConnections.forEach(([_, connection]) => {
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify({
              type: 'room_invitation_accepted',
              invitationId: invitationId,
              roomId: invitation.roomId,
              acceptedBy: {
                userId: userId,
                displayName: responderInfo?.displayName || responderInfo?.username,
                username: responderInfo?.username
              }
            }));
          }
        });

        res.json({ success: true, message: 'Invitation accepted', room: invitation.room });
      } else {
        // Send notification to inviter that invitation was rejected
        const inviterConnections = Array.from(connections.entries())
          .filter(([_, connection]) => connection.userId === invitation.inviterId);
        
        inviterConnections.forEach(([_, connection]) => {
          if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify({
              type: 'room_invitation_rejected',
              invitationId: invitationId,
              roomId: invitation.roomId,
              rejectedBy: {
                userId: userId,
                displayName: responderInfo?.displayName || responderInfo?.username,
                username: responderInfo?.username
              }
            }));
          }
        });

        res.json({ success: true, message: 'Invitation rejected' });
      }
    } catch (error) {
      console.error("Error responding to room invitation:", error);
      res.status(500).json({ error: error.message || "Failed to respond to room invitation" });
    }
  });

  // Search users by name
  app.post('/api/users/search', requireAuth, async (req: any, res) => {
    try {
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Validate name format and length
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name must be a non-empty string' });
      }

      if (name.length > 50) {
        return res.status(400).json({ error: 'Name is too long (max 50 characters)' });
      }

      // Sanitize the name to prevent any issues
      const sanitizedName = name.trim();

      // Search for user by name
      const users = await storage.getUsersByName(sanitizedName);

      if (!users || users.length === 0) {
        return res.status(404).json({ error: 'No users found' });
      }

      res.json({ users });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: `Failed to search users: ${error.message}` });
    }
  });

  // Email diagnostic endpoints
  app.post('/api/email/test', requireAuth, async (req: any, res) => {
    try {
      const { emailService } = await import('./emailService');
      const service = emailService.createEmailService();

      if (!service) {
        return res.status(500).json({ 
          error: 'Email service not configured',
          recommendation: 'Please check SMTP configuration in server/config/email.json'
        });
      }

      const testEmail = req.session.user.email;
      //console.log(`🔬 Sending diagnostic test email to: ${testEmail}`);

      const success = await service.sendTestEmail(testEmail);

      if (success) {
        res.json({ 
          success: true, 
          message: 'Test email sent successfully! Check your inbox (including spam folder).',
          recommendations: [
            'Check your inbox and spam folder',
            'Add admin@darkester.online to your contacts to improve deliverability',
            'If not received, try using a different email provider (Gmail, Yahoo, etc.)'
          ]
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to send test email',
          recommendation: 'Check server logs for detailed error information'
        });
      }
    } catch (error) {
      console.error('❌ Email test error:', error);
      res.status(500).json({ 
        error: 'Email test failed',
        details: error.message,
        recommendation: 'Check SMTP configuration and network connectivity'
      });
    }
  });

  app.get('/api/email/config-status', requireAuth, async (req: any, res) => {
    try {
      const { emailService } = await import('./emailService');
      const config = emailService.loadEmailConfig();

      const status = {
        configured: !!(config.host && config.port && config.user && config.pass && config.fromEmail),
        smtp: {
          host: config.host || 'Not configured',
          port: config.port || 'Not configured',
          user: config.user || 'Not configured',
          fromEmail: config.fromEmail || 'Not configured',
          hasPassword: !!config.pass
        },
        recommendations: []
      };

      if (!status.configured) {
        status.recommendations.push(
          'Email service is not fully configured',
          'Check server/config/email.json file exists and has all required fields',
          'Required fields: host, port, user, pass, fromEmail'
        );
      } else {
        status.recommendations.push(
          'Email service appears to be configured correctly',
          'Use the test email endpoint to verify connectivity'
        );
      }

      res.json(status);
    } catch (error) {
      console.error('❌ Email config check error:', error);
      res.status(500).json({ 
        error: 'Failed to check email configuration',
        details: error.message
      });
    }
  });

  // Clean up duplicate bots and sync all AI bots with deterministic stats  
  app.post('/api/sync-bots', async (req, res) => {
    try {
      //console.log('🤖 Starting bot cleanup and sync...');

      // First, remove all existing bot entries to clean up duplicates
      //console.log('🧹 Cleaning up existing bot entries...');
      const botIds = AI_BOTS.map(bot => bot.id);
      for (const botId of botIds) {
        try {
          await storage.deleteUser(botId);
          //console.log(`🗑️ Removed existing bot: ${botId}`);
        } catch (error) {
          // Bot might not exist, which is fine
          //console.log(`ℹ️ Bot ${botId} not found for cleanup (expected)`);
        }
      }

      // Now create fresh bots with ZERO stats (authentic data only)
      //console.log('🤖 Creating fresh bot entries with zero stats...');
      let syncedCount = 0;

      for (let i = 0; i < AI_BOTS.length; i++) {
        const bot = AI_BOTS[i];

        // Bots start with zero stats - only real gameplay will increment them
        await storage.upsertUser({
          id: bot.id,
          username: bot.username,
          displayName: bot.displayName,
          firstName: bot.firstName,
          lastName: bot.lastName || 'Player',
          email: `${bot.username}@bot.local`,
          profileImageUrl: bot.profilePicture,
          wins: 0,
          losses: 0,
          draws: 0
        });
        syncedCount++;
        //console.log(`🤖 Created bot: ${bot.displayName} with authentic zero stats`);
      }

      //console.log(`🤖 Successfully synced ${syncedCount} clean bot entries to database`);
      res.json({ 
        success: true, 
        message: `Successfully cleaned and synced ${syncedCount} AI bots to database`,
        syncedCount 
      });
    } catch (error) {
      console.error('❌ Error syncing bots:', error);
      res.status(500).json({ error: 'Failed to sync bots to database' });
    }
  });

  // Reset all bot statistics to authentic data only
  app.post('/api/reset-bot-stats', async (req, res) => {
    try {
      //console.log('🧹 Starting bot statistics reset...');
      await storage.resetAllBotStats();
      res.json({ 
        success: true, 
        message: 'Successfully reset bot statistics to authentic data only'
      });
    } catch (error) {
      console.error('❌ Error resetting bot stats:', error);
      res.status(500).json({ error: 'Failed to reset bot statistics' });
    }
  });

  // Recalculate user stats
  app.post('/api/users/recalculate-stats', requireAuth, async (req: any, res) => {
    try {
      const { userId } = req.body;

      if (userId) {
        // Recalculate for specific user
        await storage.recalculateUserStats(userId);
        res.json({ success: true, message: 'User stats recalculated successfully' });
      } else {
        // Recalculate for all users
        await storage.recalculateAllUserStats();
        res.json({ success: true, message: 'All user stats recalculated successfully' });
      }
    } catch (error) {
      console.error("Error recalculating user stats:", error);
      res.status(500).json({ error: `Failed to recalculate user stats: ${error.message}` });
    }
  });

  // Send chat message
  app.post('/api/chat/send', requireAuth, async (req: any, res) => {
    try {
      const { targetUserId, message } = req.body;
      const senderId = req.session.user.userId;

      // Check if sender is blocked by target user
      const isBlocked = await storage.isUserBlocked(targetUserId, senderId);
      if (isBlocked) {
        return res.status(403).json({ error: 'You are blocked by this user' });
      }

      // Check if target user is blocked by sender
      const hasBlocked = await storage.isUserBlocked(senderId, targetUserId);
      if (hasBlocked) {
        return res.status(403).json({ error: 'You have blocked this user' });
      }

      // Get sender info (from onlineUsers or fetch from database)
      let senderInfo = onlineUsers.get(senderId);
      if (!senderInfo) {
        // If not in onlineUsers, get from database for in-game users
        const senderData = await storage.getUser(senderId);
        if (!senderData) {
          return res.status(400).json({ error: 'Sender not found' });
        }
        senderInfo = {
          userId: senderId,
          username: senderData.username || senderData.id,
          displayName: senderData.displayName || senderData.firstName || senderData.username,
          roomId: undefined,
          lastSeen: new Date()
        };
        //console.log(`📨 Using database info for in-game sender: ${senderId}`);
      }

      // Find ALL connections for target user (they might have multiple connections)
      const targetConnections = Array.from(connections.values()).filter(conn => conn.userId === targetUserId);
      if (targetConnections.length === 0) {
        return res.status(400).json({ error: 'Target user connection not found' });
      }

      // Send to only the most recent active connection for the target user to avoid duplicates
      let messageSent = false;
      // Found connections for target user

      // Find the most recent active connection
      const activeConnections = targetConnections.filter(conn => 
        conn.ws && conn.ws.readyState === WebSocket.OPEN
      );

      if (activeConnections.length > 0) {
        // Sort by last seen (most recent first) and take the first one
        activeConnections.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
        const targetConnection = activeConnections[0];

        // Sending to most recent connection
        const chatMessage = {
          type: 'chat_message_received',
          message: {
            senderId,
            senderName: senderInfo.displayName || senderInfo.username,
            message,
            senderDisplayName: senderInfo.displayName,
            senderUsername: senderInfo.username,
            timestamp: new Date().toISOString()
          }
        };
        // Sending WebSocket message
        targetConnection.ws.send(JSON.stringify(chatMessage));
        // Message sent successfully
        messageSent = true;
      } else {
        // No active connections found
      }

      if (!messageSent) {
        return res.status(400).json({ error: 'Target user connection is not active' });
      }

      // Chat message sent successfully

      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ message: "Failed to send chat message" });
    }
  });

  // Online matchmaking endpoint
  app.post('/api/matchmaking/join', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const betAmount = req.body.betAmount || 1000000; // Default to 1M if not specified

      // Validate bet amount (only allow 5k, 1M, or 10M for quick match)
      if (betAmount !== 5000 && betAmount !== 1000000 && betAmount !== 10000000) {
        return res.status(400).json({ 
          error: 'Invalid bet amount',
          message: 'Quick match only supports 5k, 1M, or 10M coin bets.'
        });
      }

      // Check if user has enough coins for the selected bet
      try {
        const userCoins = await storage.getUserCoins(userId);
        if (userCoins < betAmount) {
          return res.status(403).json({ 
            error: 'Insufficient coins',
            message: `You need ${betAmount.toLocaleString()} coins to play with this bet. You have ${userCoins.toLocaleString()} coins. Win AI games to earn coins!`,
            requiredCoins: betAmount,
            currentCoins: userCoins
          });
        }
      } catch (error) {
        console.error('Error checking user coins:', error);
        // Allow matchmaking even if coin check fails to avoid blocking players
      }

      // Check if user is already in queue (duplicate prevention)
      const existingEntry = matchmakingQueue.find(entry => entry.userId === userId);
      if (existingEntry) {
        const queueIndex = matchmakingQueue.findIndex(entry => entry.userId === userId);
        return res.json({ 
          status: 'waiting', 
          message: 'Already in matchmaking queue',
          queuePosition: queueIndex + 1,
          queueLength: matchmakingQueue.length
        });
      }

      // CRITICAL FIX: Ensure user has a valid WebSocket connection before allowing matchmaking
      const userConnections = Array.from(connections.entries())
        .filter(([_, connection]) => connection.userId === userId && connection.ws.readyState === WebSocket.OPEN);

      if (userConnections.length === 0) {
        //console.log(`🚫 User ${userId} attempted matchmaking without valid WebSocket connection`);
        return res.status(400).json({ 
          error: 'No active connection found', 
          message: 'We are preparing your room please wait' 
        });
      }

      // CRITICAL FIX: Check if user is already in an active game - prevent forced removal!
      try {
        const activeGame = await storage.getActiveGameForUser(userId);
        if (activeGame && activeGame.status === 'active') {
          //console.log(`🚫 User ${userId} attempted matchmaking while in active game ${activeGame.id}`);
          return res.status(400).json({ 
            error: 'Already in game', 
            message: 'You are already in an active game. Please finish your current game before starting matchmaking.',
            gameId: activeGame.id,
            roomId: activeGame.roomId
          });
        }
      } catch (error) {
        console.error('Error checking active game for user:', error);
        // Continue with matchmaking if check fails
      }

      // Auto-leave current room before matchmaking (similar to create room logic)
      const userRoomState = userRoomStates.get(userId);
      if (userRoomState && userRoomState.roomId) {
        //console.log(`🏠 Auto-leaving room ${userRoomState.roomId} for user ${userId} before matchmaking`);

        // Remove user from room participants
        try {
          await storage.removeRoomParticipant(userRoomState.roomId, userId);

          // Notify other users in the room
          const room = await storage.getRoomById(userRoomState.roomId);
          if (room) {
            const participants = await storage.getRoomParticipants(room.id);
            const remainingParticipants = participants.filter((p: any) => p.userId !== userId);

            for (const participant of remainingParticipants) {
              const participantConnections = Array.from(connections.values())
                .filter(conn => conn.userId === participant.userId);

              for (const conn of participantConnections) {
                if (conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(JSON.stringify({
                    type: 'user_left',
                    roomId: room.id,
                    userId: userId
                  }));
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error leaving room before matchmaking:`, error);
          // Continue with matchmaking even if leave fails
        }
      }

      // Clear any existing timer for this user
      if (matchmakingTimers.has(userId)) {
        clearTimeout(matchmakingTimers.get(userId)!);
        matchmakingTimers.delete(userId);
      }

      // Clean up user room states for matchmaking
      //console.log(`✅ User ${userId} starting matchmaking - cleared room states`);
      userRoomStates.delete(userId);

      // Add to queue with bet amount
      matchmakingQueue.push({userId, betAmount});
      // User joined matchmaking queue

      // Set 25-second timer for AI bot matchmaking
      const botTimer = setTimeout(async () => {
        try {
          // Double-check if user is still in queue and hasn't been matched with real player
          const currentQueueIndex = matchmakingQueue.findIndex(entry => entry.userId === userId);
          if (currentQueueIndex === -1) {
            //console.log(`🤖 User ${userId} no longer in queue - likely matched with real player. Skipping bot match.`);
            matchmakingTimers.delete(userId);
            return;
          }

          // Matching user with AI bot after timeout

          // Remove user from queue and clear timer
          const userEntry = matchmakingQueue[currentQueueIndex];
          matchmakingQueue.splice(currentQueueIndex, 1);
          matchmakingTimers.delete(userId);

          // Get a random bot
          const bot = getRandomAvailableBot();
          // Bot selected for matchmaking

          // Create room for user vs bot with bet amount
          const room = await storage.createRoom({
            name: `${bot.displayName} Match`,
            isPrivate: false,
            maxPlayers: 2,
            ownerId: userId,
            betAmount: userEntry.betAmount,
          });

          // Add user as participant
          await storage.addRoomParticipant({
            roomId: room.id,
            userId: userId,
            role: 'player',
          });

          // Check if bot already exists to avoid overwriting stats
          const existingBot = await storage.getUser(bot.id);

          if (!existingBot) {
            // Use deterministic stats for consistency
            const botIndex = AI_BOTS.findIndex(b => b.id === bot.id);
            const seed = botIndex + 1;
            const wins = Math.floor((seed * 7) % 45) + 5;
            const losses = Math.floor((seed * 5) % 25) + 5;
            const draws = Math.floor((seed * 3) % 8) + 2;

            await storage.upsertUser({
              id: bot.id,
              username: bot.username,
              displayName: bot.displayName,
              firstName: bot.firstName,
              lastName: bot.lastName || 'Player',
              email: `${bot.username}@bot.local`,
              profileImageUrl: bot.profilePicture,
              wins,
              losses,
              draws
            });
          }

          // Add bot as second participant to show 2 players in room
          await storage.addRoomParticipant({
            roomId: room.id,
            userId: bot.id,
            role: 'player',
          });

          // Notify user about bot match
          const userConnections = Array.from(connections.entries())
            .filter(([_, connection]) => connection.userId === userId && connection.ws.readyState === WebSocket.OPEN);

          if (userConnections.length > 0) {
            const [connId, connection] = userConnections[0];

              // Add to room connections
              if (!roomConnections.has(room.id)) {
                roomConnections.set(room.id, new Set());
              }
              roomConnections.get(room.id)!.add(connId);
              connection.roomId = room.id;

              userRoomStates.set(userId, {
                roomId: room.id,
                isInGame: false,
                role: 'player'
              });

              // Send single matchmaking success message for bot match (SIMPLIFIED)
              //console.log(`🎯 Sending matchmaking_success (bot) to user ${userId}`);
              connection.ws.send(JSON.stringify({
                type: 'matchmaking_success',
                room: {
                  ...room,
                  status: 'waiting'
                },
                message: `Matched with ${bot.displayName}!`,
                status: 'matched',
                playerInfo: bot
              }));

              // User matched with bot

              // Clear matchmaking timer since user is now matched
              if (matchmakingTimers.has(userId)) {
                clearTimeout(matchmakingTimers.get(userId)!);
                matchmakingTimers.delete(userId);
                //console.log(`⏰ Cleared matchmaking timer for user ${userId}`);
              }

              // Auto-start game with bot after 2 seconds
              setTimeout(async () => {
                try {
                  const game = await storage.createGame({
                    roomId: room.id,
                    playerXId: userId,
                    playerOId: bot.id,
                    gameMode: 'online',
                    currentPlayer: 'X',
                    board: {},
                    status: 'active',
                  });

                  // Get user info with achievements and piece style
                  const userInfo = await storage.getUser(userId);
                  const [userAchievements, userPieceStyle] = await Promise.all([
                    storage.getUserAchievements(userId),
                    storage.getActivePieceStyle(userId)
                  ]);

                  const gameWithPlayers = {
                    ...game,
                    playerXInfo: userInfo ? {
                      ...userInfo,
                      achievements: userAchievements.slice(0, 3),
                      activePieceStyle: userPieceStyle?.styleName || 'default'
                    } : null,
                    playerOInfo: {
                      ...bot,
                      achievements: [], // Bots don't have achievements
                      activePieceStyle: 'default'
                    }
                  };

                  // Update room status to playing
                  await storage.updateRoomStatus(room.id, 'playing');

                  // Broadcast game start to all room participants with retry logic
                  await broadcastGameStartedWithRetry(room.id, {
                    type: 'game_started',
                    game: gameWithPlayers,
                    roomId: room.id,
                    room: {
                      ...room,
                      status: 'playing'
                    }
                  });
                } catch (error) {
                  console.error('🤖 Error starting bot game:', error);
                }
              }, 2000);
          }

          // Clean up timer
          matchmakingTimers.delete(userId);
        } catch (error) {
          console.error('🤖 Error in bot matchmaking:', error);
          matchmakingTimers.delete(userId);
        }
      }, 25000); // 25 seconds

      // Store timer for cleanup
      matchmakingTimers.set(userId, botTimer);

      // Check if we can make a match (need 2 players with same bet) - WITH RACE CONDITION PROTECTION
      if (!isMatchmakingLocked && matchmakingQueue.length >= 2) {
        // Try to find two players with matching bet amounts
        let player1Entry = null;
        let player2Entry = null;
        let player1Index = -1;
        let player2Index = -1;

        // Find a pair of players with the same bet amount
        for (let i = 0; i < matchmakingQueue.length; i++) {
          for (let j = i + 1; j < matchmakingQueue.length; j++) {
            if (matchmakingQueue[i].betAmount === matchmakingQueue[j].betAmount) {
              player1Entry = matchmakingQueue[i];
              player2Entry = matchmakingQueue[j];
              player1Index = i;
              player2Index = j;
              break;
            }
          }
          if (player1Entry && player2Entry) break;
        }

        // If we found a match, proceed
        if (player1Entry && player2Entry) {
          // Lock matchmaking to prevent race conditions
          isMatchmakingLocked = true;

          const player1Id = player1Entry.userId;
          const player2Id = player2Entry.userId;
          const matchBetAmount = player1Entry.betAmount;

          // Ensure we don't pair the same user twice
          if (player1Id === player2Id) {
            isMatchmakingLocked = false;
            console.error('🚫 Race condition detected: Same user in queue twice');
            return res.status(500).json({ error: 'Queue error, please try again' });
          }

          // Clear timers for both players since they matched with real players
          if (matchmakingTimers.has(player1Id)) {
            clearTimeout(matchmakingTimers.get(player1Id)!);
            matchmakingTimers.delete(player1Id);
          }
          if (matchmakingTimers.has(player2Id)) {
            clearTimeout(matchmakingTimers.get(player2Id)!);
            matchmakingTimers.delete(player2Id);
          }
          
          // Remove both players from queue (remove higher index first to avoid index shift)
          if (player1Index > player2Index) {
            matchmakingQueue.splice(player1Index, 1);
            matchmakingQueue.splice(player2Index, 1);
          } else {
            matchmakingQueue.splice(player2Index, 1);
            matchmakingQueue.splice(player1Index, 1);
          }

          //console.log(`🎯 Match found! Pairing ${player1Id} vs ${player2Id} with bet ${matchBetAmount}`);

          // Create room for matched players with bet amount
          const room = await storage.createRoom({
            name: `Match ${Date.now()}`,
            isPrivate: false,
            maxPlayers: 2,
            ownerId: player1Id,
            betAmount: matchBetAmount,
          });

        // Add both players as participants
        await storage.addRoomParticipant({
          roomId: room.id,
          userId: player1Id,
          role: 'player',
        });

        await storage.addRoomParticipant({
          roomId: room.id,
          userId: player2Id,
          role: 'player',
        });

        // Notify both players via WebSocket and ensure they join the room
        const notifyAndJoinPlayer = async (playerId: string) => {
          // Find the most recent connection for this user
          const userConnections = Array.from(connections.entries())
            .filter(([_, connection]) => connection.userId === playerId && connection.ws.readyState === WebSocket.OPEN)
            .sort(([a], [b]) => b.localeCompare(a)); // Sort by connection ID descending (most recent first)

          if (userConnections.length > 0) {
            const [connId, connection] = userConnections[0]; // Use the most recent connection

            // CRITICAL FIX: Remove user from any existing room connections to prevent cross-room message leakage
            for (const [roomId, roomUsers] of roomConnections.entries()) {
              if (roomId !== room.id && roomUsers.has(connId)) {
                roomUsers.delete(connId);
                //console.log(`🧹 Removed player ${playerId} from old room ${roomId} before adding to new match room ${room.id}`);

                // Clean up empty rooms
                if (roomUsers.size === 0) {
                  roomConnections.delete(roomId);
                  //console.log(`🧹 Deleted empty room ${roomId}`);
                }
              }
            }

            // Add to room connections immediately
            if (!roomConnections.has(room.id)) {
              roomConnections.set(room.id, new Set());
            }
            roomConnections.get(room.id)!.add(connId);

            // Update connection room info
            connection.roomId = room.id;

            // Update user room state
            userRoomStates.set(playerId, {
              roomId: room.id,
              isInGame: false,
              role: 'player'
            });

            // Send single matchmaking success message (SIMPLIFIED - no redundancy)
            //console.log(`🎯 Sending matchmaking_success to user ${playerId} in room ${room.id}`);
            connection.ws.send(JSON.stringify({
              type: 'matchmaking_success',
              room: {
                ...room,
                status: 'waiting'
              },
              message: 'Match found! Joining room...',
              status: 'matched'
            }));

            //console.log(`🎯 Player ${playerId} automatically joined room ${room.id} via connection ${connId}`);
          } else {
            //console.log(`🎯 Warning: No active connection found for player ${playerId}`);
          }
        };

        await notifyAndJoinPlayer(player1Id);
        await notifyAndJoinPlayer(player2Id);

        //console.log(`🎯 Match notifications sent and both players joined room ${room.id}`);

        // Notify BOTH players about the successful match via WebSocket before responding to the API call
        // This ensures the first player (who was waiting) also gets immediate notification
        const matchNotification = {
          type: 'matchmaking_success',
          status: 'matched',
          room: room,
          message: 'Match found! Preparing game...'
        };

        // Track and send notification to both players (prevent duplicate notifications)
        if (!sentMatchNotifications.has(room.id)) {
          sentMatchNotifications.set(room.id, new Set());
        }
        const roomNotifications = sentMatchNotifications.get(room.id)!;

        [player1Id, player2Id].forEach(playerId => {
          // Check if we already sent a notification to this user for this room
          if (roomNotifications.has(playerId)) {
            //console.log(`🎯 Skipping duplicate matchmaking_success for user ${playerId} in room ${room.id}`);
            return;
          }

          const userConnections = Array.from(connections.entries())
            .filter(([_, connection]) => connection.userId === playerId && connection.ws.readyState === WebSocket.OPEN);

          // Send only to the first active connection to prevent duplicates
          if (userConnections.length > 0) {
            const [_, primaryConnection] = userConnections[0];
            //console.log(`🎯 Sending matchmaking_success to user ${playerId} (${userConnections.length} connections available)`);
            primaryConnection.ws.send(JSON.stringify(matchNotification));

            // Mark this user as notified for this room
            roomNotifications.add(playerId);
          }
        });

        // Auto-start the game with improved connection handling and retries
        const attemptAutoStart = async (attemptNumber: number = 1) => {
          try {
            //console.log(`🎯 Auto-starting game attempt ${attemptNumber} for matched players in room ${room.id} (players: ${player1Id}, ${player2Id})`);

            // Check if both players are still connected to the room before starting
            const roomUsers = roomConnections.get(room.id);
            //console.log(`🎯 Room ${room.id} has ${roomUsers?.size || 0} connections, need 2 for auto-start`);

            if (!roomUsers || roomUsers.size < 2) {
              //console.log(`🎯 Warning: Not enough players in room ${room.id} for auto-start. Room has ${roomUsers?.size || 0} connections`);

              // For first attempt, wait a bit longer for connections to establish
              if (attemptNumber === 1) {
                //console.log(`🎯 First attempt failed, giving connections more time to establish...`);
                setTimeout(() => attemptAutoStart(attemptNumber + 1), 2000);
                return;
              }

              // Retry with shorter delays for subsequent attempts
              if (attemptNumber < 4) {
                const retryDelay = 1500; // Fixed 1.5s delay
                //console.log(`🎯 Retrying auto-start in ${retryDelay}ms...`);
                setTimeout(() => attemptAutoStart(attemptNumber + 1), retryDelay);
              } else {
                //console.log(`🎯 Auto-start failed after 4 attempts for room ${room.id}`);
                // Notify players that manual start may be required
                roomUsers?.forEach(connectionId => {
                  const connection = connections.get(connectionId);
                  if (connection && connection.ws.readyState === WebSocket.OPEN) {
                    connection.ws.send(JSON.stringify({
                      type: 'auto_start_failed',
                      roomId: room.id,
                      message: 'Connection issues detected. Please manually start the game when ready.'
                    }));
                  }
                });
              }
              return;
            }

            // Verify both players are actually connected
            const connectedPlayers = Array.from(roomUsers)
              .map(connId => connections.get(connId))
              .filter(conn => conn && conn.ws.readyState === WebSocket.OPEN)
              .map(conn => conn!.userId);

            //console.log(`🎯 Connected players in room ${room.id}: [${connectedPlayers.join(', ')}], need: [${player1Id}, ${player2Id}]`);

            if (!connectedPlayers.includes(player1Id) || !connectedPlayers.includes(player2Id)) {
              //console.log(`🎯 Warning: One or both players disconnected from room ${room.id}. Connected players: ${connectedPlayers.join(', ')}`);

              // Retry for disconnected players with shorter delays
              if (attemptNumber < 4) {
                const retryDelay = 1500;
                //console.log(`🎯 Retrying auto-start in ${retryDelay}ms due to player disconnection...`);
                setTimeout(() => attemptAutoStart(attemptNumber + 1), retryDelay);
              } else {
                //console.log(`🎯 Auto-start abandoned after 4 attempts - players not properly connected`);
              }
              return;
            }

            //console.log(`🎯 Both players confirmed connected, proceeding with game creation...`);

            // Create the game automatically
            const game = await storage.createGame({
              roomId: room.id,
              playerXId: player1Id,
              playerOId: player2Id,
              gameMode: 'online',
              currentPlayer: 'X',
              board: {},
              status: 'active',
            });

            // Get player information with achievements
            const [playerXInfo, playerOInfo] = await Promise.all([
              storage.getUser(player1Id),
              storage.getUser(player2Id)
            ]);

            // Get achievements and piece styles for both players
            const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
              storage.getUserAchievements(player1Id),
              storage.getUserAchievements(player2Id),
              storage.getActivePieceStyle(player1Id),
              storage.getActivePieceStyle(player2Id)
            ]);

            const gameWithPlayers = {
              ...game,
              playerXInfo: playerXInfo ? {
                ...playerXInfo,
                achievements: playerXAchievements.slice(0, 3),
                activePieceStyle: playerXPieceStyle?.styleName || 'default'
              } : null,
              playerOInfo: playerOInfo ? {
                ...playerOInfo,
                achievements: playerOAchievements.slice(0, 3),
                activePieceStyle: playerOPieceStyle?.styleName || 'default'
              } : null,
              gameMode: 'online'
            };

            // Update room status to playing
            await storage.updateRoomStatus(room.id, 'playing');

            // Broadcast game start to all room participants with retry logic
            await broadcastGameStartedWithRetry(room.id, {
              type: 'game_started',
              game: gameWithPlayers,
              roomId: room.id,
              room: {
                ...room,
                status: 'playing'
              }
            });

            //console.log(`🎯 Auto-started game ${game.id} for matchmaking room ${room.id}`);
          } catch (error) {
            console.error('Error auto-starting matchmaking game:', error);
            // Retry on error if not max attempts
            if (attemptNumber < 4) {
              const retryDelay = 1500;
              //console.log(`🎯 Retrying auto-start in ${retryDelay}ms due to error...`);
              setTimeout(() => attemptAutoStart(attemptNumber + 1), retryDelay);
            } else {
              //console.log(`🎯 Auto-start completely failed after 4 attempts for room ${room.id}`);
            }
          }
        };

        // Start the first attempt with a shorter 1-second delay to improve responsiveness
        setTimeout(() => attemptAutoStart(), 1000);

        // Release matchmaking lock
        isMatchmakingLocked = false;

        // Return matched status to the player who just joined (this is the API response)
        res.json({ status: 'matched', room: room });
        } else {
          // No matching bet found, return waiting status
          const queueIndex = matchmakingQueue.findIndex(entry => entry.userId === userId);
          res.json({ 
            status: 'waiting', 
            message: 'Waiting for another player...',
            queuePosition: queueIndex + 1,
            queueLength: matchmakingQueue.length
          });
        }
      } else {
        // No match found (queue < 2 or no matching lock), return waiting
        const queueIndex = matchmakingQueue.findIndex(entry => entry.userId === userId);
        res.json({ 
          status: 'waiting', 
          message: 'Waiting for another player...',
          queuePosition: queueIndex + 1,
          queueLength: matchmakingQueue.length
        });
      }
    } catch (error) {
      // Always release lock on error to prevent deadlocks
      isMatchmakingLocked = false;
      console.error("Error in matchmaking:", error);
      res.status(500).json({ message: "Failed to join matchmaking" });
    }
  });

  // Leave matchmaking queue
  app.post('/api/matchmaking/leave', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;

      // Clear timer if user leaves manually
      if (matchmakingTimers.has(userId)) {
        clearTimeout(matchmakingTimers.get(userId)!);
        matchmakingTimers.delete(userId);
        //console.log(`🤖 Cleared bot timer for user ${userId}`);
      }

      const index = matchmakingQueue.findIndex(entry => entry.userId === userId);
      if (index > -1) {
        matchmakingQueue.splice(index, 1);
        //console.log(`🎯 User ${userId} left matchmaking queue. Queue size: ${matchmakingQueue.length}`);
      }
      res.json({ message: 'Left matchmaking queue' });
    } catch (error) {
      console.error("Error leaving matchmaking:", error);
      res.status(500).json({ message: "Failed to leave matchmaking" });
    }
  });

  // Room routes
  app.post('/api/rooms', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const roomData = insertRoomSchema.parse(req.body);

      // Check if user has enough coins for the selected bet amount
      try {
        const userCoins = await storage.getUserCoins(userId);
        const requiredBet = roomData.betAmount || 5000; // Default to 5k if not specified

        if (userCoins < requiredBet) {
          return res.status(403).json({ 
            error: 'Insufficient coins',
            message: `You need ${requiredBet.toLocaleString()} coins to create a room with this bet amount. You have ${userCoins.toLocaleString()} coins. Win games to earn more coins!`,
            requiredCoins: requiredBet,
            currentCoins: userCoins
          });
        }
      } catch (error) {
        console.error('Error checking user coins for room creation:', error);
        // Allow room creation even if coin check fails to avoid blocking players
      }

      const room = await storage.createRoom({
        ...roomData,
        ownerId: userId,
      });

      // Add owner as participant
      await storage.addRoomParticipant({
        roomId: room.id,
        userId,
        role: 'player',
      });

      res.json(room);
    } catch (error) {
      //console.error("Error creating room:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  });

  app.post('/api/rooms/:code/join', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { code } = req.params;
      const { role = 'player' } = req.body;

      // Validate room code format
      if (!code || typeof code !== 'string' || !/^[A-Za-z0-9]{6,10}$/.test(code)) {
        return res.status(400).json({ message: "Invalid room code format" });
      }

      // Validate role
      if (!['player', 'spectator'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'player' or 'spectator'" });
      }

      // PERFORMANCE FIX: Get room first, then run remaining queries in parallel
      const room = await storage.getRoomByCode(code);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Run remaining queries in parallel to reduce latency
      const [participants, canJoinResult] = await Promise.all([
        storage.getRoomParticipants(room.id),
        role === 'player' ? storage.validateUserCanJoinRoom(userId, room.id) : Promise.resolve({ canJoin: true })
      ]);

      // Check if player can join (bet amount validation)
      if (role === 'player' && !canJoinResult.canJoin) {
        const requiredBet = room.betAmount || 5000;
        const userCoins = await storage.getUserCoins(userId);
        return res.status(403).json({ 
          error: 'Insufficient coins',
          message: canJoinResult.reason || `You need ${requiredBet.toLocaleString()} coins to join this room. You can still join as a spectator.`,
          requiredCoins: requiredBet,
          currentCoins: userCoins
        });
      }

      // Check if user is already in the room
      const existingParticipant = participants.find(p => p.userId === userId);
      if (existingParticipant) {
        return res.json({ message: "Already in room", room });
      }

      // Check capacity constraints
      const playerCount = participants.filter(p => p.role === 'player').length;
      const spectatorCount = participants.filter(p => p.role === 'spectator').length;

      if (role === 'player' && playerCount >= 2) {
        return res.status(400).json({ message: "Room is full" });
      }

      if (role === 'spectator' && spectatorCount >= 50) {
        return res.status(400).json({ message: "Spectator limit reached" });
      }

      // Ensure user can join (auto-leave previous room if needed)
      const joinCheck = await ensureUserCanJoinRoom(userId, room.id);
      if (!joinCheck.canJoin) {
        return res.status(400).json({ error: joinCheck.error || "Cannot join room" });
      }

      // Add participant to room
      await storage.addRoomParticipant({
        roomId: room.id,
        userId,
        role,
      });

      res.json({ message: "Joined room successfully", room });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({ message: "Failed to join room" });
    }
  });

  app.get('/api/rooms/:id/participants', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const participants = await storage.getRoomParticipants(id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Start game in a room
  app.post('/api/rooms/:roomId/start-game', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { roomId } = req.params;

      // Room start-game request

      // Get the room to verify it exists
      const room = await storage.getRoomById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Check if room is already in "playing" status AND there's an active game
      // Allow multiple players to call start-game during the brief synchronization window
      const existingActiveGame = await storage.getActiveGameByRoomId(roomId);
      if (room.status === 'playing' && existingActiveGame) {
        // Game already exists and running - return the existing game instead of error
        //console.log('🎮 Game already running, returning existing game for synchronization');

        // Get player information for the existing game
        const [playerXInfo, playerOInfo] = await Promise.all([
          existingActiveGame.playerXId ? storage.getUser(existingActiveGame.playerXId) : null,
          existingActiveGame.playerOId ? storage.getUser(existingActiveGame.playerOId) : null
        ]);

        // Get achievements and piece styles for both players
        const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
          playerXInfo ? storage.getUserAchievements(existingActiveGame.playerXId) : [],
          playerOInfo ? storage.getUserAchievements(existingActiveGame.playerOId) : [],
          playerXInfo ? storage.getActivePieceStyle(existingActiveGame.playerXId) : undefined,
          playerOInfo ? storage.getActivePieceStyle(existingActiveGame.playerOId) : undefined
        ]);

        const gameWithPlayers = {
          ...existingActiveGame,
          playerXInfo: playerXInfo ? {
            ...playerXInfo,
            achievements: playerXAchievements.slice(0, 3),
            activePieceStyle: playerXPieceStyle?.styleName || 'default'
          } : null,
          playerOInfo: playerOInfo ? {
            ...playerOInfo,
            achievements: playerOAchievements.slice(0, 3),
            activePieceStyle: playerOPieceStyle?.styleName || 'default'
          } : null
        };

        return res.json(gameWithPlayers);
      }

      // Get room participants
      const participants = await storage.getRoomParticipants(roomId);

      // Check if user is the room creator (only room creator can start games)
      if (room.ownerId !== userId) {
        return res.status(403).json({ message: "Only the room creator can start games" });
      }

      // Check if there's already an active game in this room
      const existingGame = await storage.getActiveGameByRoomId(roomId);
      if (existingGame && existingGame.status === 'active') {
        // If it's a bot game that was just created, return the existing game instead of ending it
        const isGameAgainstBot = existingGame.playerOId && AI_BOTS.some(bot => bot.id === existingGame.playerOId);
        if (isGameAgainstBot) {
          //console.log('🎮 Active bot game already exists, returning it instead of creating new one');

          // Get player information for the existing bot game
          const [playerXInfo, botInfo] = await Promise.all([
            storage.getUser(existingGame.playerXId),
            Promise.resolve(AI_BOTS.find(bot => bot.id === existingGame.playerOId))
          ]);

          // Get achievements and piece style for the human player
          const [playerXAchievements, playerXPieceStyle] = await Promise.all([
            playerXInfo ? storage.getUserAchievements(existingGame.playerXId) : [],
            playerXInfo ? storage.getActivePieceStyle(existingGame.playerXId) : undefined
          ]);

          const gameWithPlayers = {
            ...existingGame,
            playerXInfo: playerXInfo ? {
              ...playerXInfo,
              achievements: playerXAchievements.slice(0, 3),
              activePieceStyle: playerXPieceStyle?.styleName || 'default'
            } : null,
            playerOInfo: botInfo ? {
              ...botInfo,
              achievements: [],
              activePieceStyle: 'default'
            } : null
          };

          return res.json(gameWithPlayers);
        } else {
          //console.log('🎮 Active human game already exists, ending it first');
          // End the existing human game
          await storage.updateGameStatus(existingGame.id, 'finished');
        }
      }

      // Get room participants (reuse from above)
      const players = participants.filter(p => p.role === 'player');

      if (players.length < 2) {
        return res.status(400).json({ message: "Need 2 players to start game" });
      }

      // Create new game with room owner getting first turn (player X)
      const playerX = players.find(p => p.userId === room.ownerId);
      const playerO = players.find(p => p.userId !== room.ownerId);

      if (!playerX || !playerO) {
        return res.status(400).json({ message: "Could not find both players" });
      }

      const gameData = {
        roomId,
        playerXId: playerX.userId,
        playerOId: playerO.userId,
        gameMode: 'online' as const,
        status: 'active' as const,
        currentPlayer: 'X' as const,
        board: {},
      };

      const game = await storage.createGame(gameData);
      // New game created

      // Update room status to "playing"
      await storage.updateRoomStatus(roomId, 'playing');
      // Room status updated to playing

      // Get player information with achievements
      const [playerXInfo, playerOInfo] = await Promise.all([
        storage.getUser(game.playerXId),
        storage.getUser(game.playerOId)
      ]);

      // Get achievements and piece styles for both players
      const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
        playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
        playerOInfo ? storage.getUserAchievements(game.playerOId) : Promise.resolve([]),
        playerXInfo ? storage.getActivePieceStyle(game.playerXId) : Promise.resolve(undefined),
        playerOInfo ? storage.getActivePieceStyle(game.playerOId) : Promise.resolve(undefined)
      ]);

      const gameWithPlayers = {
        ...game,
        playerXInfo: playerXInfo ? {
          ...playerXInfo,
          achievements: playerXAchievements.slice(0, 3),
          activePieceStyle: playerXPieceStyle?.styleName || 'default'
        } : playerXInfo,
        playerOInfo: playerOInfo ? {
          ...playerOInfo,
          achievements: playerOAchievements.slice(0, 3),
          activePieceStyle: playerOPieceStyle?.styleName || 'default'
        } : playerOInfo,
      };

      // Broadcast to all room participants with unified retry logic
      await broadcastGameStartedWithRetry(roomId, {
        type: 'game_started',
        game: gameWithPlayers,
        gameId: game.id,
        roomId: roomId,
      });

      // Send API response
      res.json(gameWithPlayers);
    } catch (error) {
      console.error("Error starting room game:", error);
      res.status(500).json({ message: "Failed to start game" });
    }
  });

  // Game routes
  app.post('/api/games', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      console.log('Game creation request:', req.body);
      console.log('User ID:', userId);

      // Validate the request body with detailed error reporting
      const parseResult = insertGameSchema.safeParse(req.body);
      if (!parseResult.success) {
        console.log('Schema validation failed:', parseResult.error);
        return res.status(400).json({ 
          message: "Invalid game data", 
          errors: parseResult.error.errors 
        });
      }

      const gameData = parseResult.data;
      //console.log('Parsed game data:', gameData);

      let gameCreateData;

      if (gameData.gameMode === 'ai') {
        // AI mode: current user vs AI
        gameCreateData = {
          ...gameData,
          playerXId: userId,
          playerOId: 'AI',
        };
      } else if (gameData.gameMode === 'online' && gameData.roomId) {
        // Online mode: check if a game already exists for this room
        const existingGame = await storage.getActiveGameByRoomId(gameData.roomId);
        if (existingGame) {
          //console.log('🎮 Game already exists for room:', existingGame.id);
          // Get player information for the existing game with achievements
          const [playerXInfo, playerOInfo] = await Promise.all([
            storage.getUser(existingGame.playerXId),
            existingGame.playerOId && existingGame.playerOId !== 'AI' ? storage.getUser(existingGame.playerOId) : Promise.resolve(null)
          ]);

          // Get achievements for both players
          const [playerXAchievements, playerOAchievements] = await Promise.all([
            playerXInfo ? storage.getUserAchievements(existingGame.playerXId) : Promise.resolve([]),
            playerOInfo ? storage.getUserAchievements(existingGame.playerOId) : Promise.resolve([])
          ]);

          const gameWithPlayers = {
            ...existingGame,
            playerXInfo: playerXInfo ? {
              ...playerXInfo,
              achievements: playerXAchievements.slice(0, 3)
            } : playerXInfo,
            playerOInfo: playerOInfo ? {
              ...playerOInfo,
              achievements: playerOAchievements.slice(0, 3)
            } : { 
              id: 'AI', 
              firstName: 'AI', 
              lastName: 'Player',
              profileImageUrl: null 
            }
          };

          // Reset game state and broadcast to ensure clean start
          await storage.updateGameBoard(existingGame.id, {});
          await storage.updateCurrentPlayer(existingGame.id, 'X');

          // Get fresh game state after reset
          const refreshedGame = await storage.getGameById(existingGame.id);
          const refreshedGameWithPlayers = {
            ...refreshedGame,
            serverTime: new Date().toISOString(),
            timeRemaining: Math.max(0, 10 * 60 * 1000 - (Date.now() - new Date(refreshedGame.createdAt).getTime())),
            playerXInfo: playerXInfo ? {
              ...playerXInfo,
              achievements: playerXAchievements.slice(0, 3)
            } : playerXInfo,
            playerOInfo: playerOInfo ? {
              ...playerOInfo,
              achievements: playerOAchievements.slice(0, 3)
            } : { 
              id: 'AI', 
              firstName: 'AI', 
              lastName: 'Player',
              profileImageUrl: null 
            }
          };

          // Broadcast refreshed game with unified retry logic
          await broadcastGameStartedWithRetry(gameData.roomId, {
            type: 'game_started',
            game: refreshedGameWithPlayers,
            gameId: refreshedGame.id,
            roomId: gameData.roomId,
          });

          return res.json(refreshedGameWithPlayers);
        }

        // Get room participants and assign as players
        const participants = await storage.getRoomParticipants(gameData.roomId);
        const players = participants.filter(p => p.role === 'player');

        if (players.length < 2) {
          return res.status(400).json({ message: "Need 2 players to start online game" });
        }

        // Assign players consistently: sort by userId to ensure same assignment every time
        const sortedPlayers = players.sort((a, b) => a.userId.localeCompare(b.userId));
        const playerX = sortedPlayers[0];
        const playerO = sortedPlayers[1];

        if (!playerX || !playerO) {
          return res.status(400).json({ message: "Could not find both players" });
        }

        gameCreateData = {
          ...gameData,
          playerXId: playerX.userId,
          playerOId: playerO.userId,
        };
      } else {
        // Pass-play mode: current user starts as X, O will be filled in during play
        gameCreateData = {
          ...gameData,
          playerXId: userId,
          playerOId: gameData.playerOId || undefined,
        };
      }

      const game = await storage.createGame(gameCreateData);

      // Get player information with achievements for the game
      const [playerXInfo, playerOInfo] = await Promise.all([
        storage.getUser(game.playerXId),
        game.playerOId && game.playerOId !== 'AI' && !AI_BOTS.some(bot => bot.id === game.playerOId) ? 
          storage.getUser(game.playerOId) : 
          Promise.resolve(AI_BOTS.find(bot => bot.id === game.playerOId) || null)
      ]);

      // Get achievements for both players
      const [playerXAchievements, playerOAchievements] = await Promise.all([
        playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
        playerOInfo && !AI_BOTS.some(bot => bot.id === game.playerOId) ? storage.getUserAchievements(game.playerOId) : Promise.resolve([])
      ]);

      const gameWithPlayers = {
        ...game,
        playerXInfo: playerXInfo ? {
          ...playerXInfo,
          achievements: playerXAchievements.slice(0, 3)
        } : playerXInfo,
        playerOInfo: playerOInfo ? {
          ...playerOInfo,
          achievements: playerOAchievements.slice(0, 3)
        } : { 
          id: 'AI', 
          firstName: 'AI', 
          lastName: 'Player',
          profileImageUrl: null 
        }
      };

      // Broadcast game start with unified retry logic
      if (gameData.roomId) {
        await broadcastGameStartedWithRetry(gameData.roomId, {
          type: 'game_started',
          game: gameWithPlayers,
          roomId: gameData.roomId,
        });
      }

      // Update room status after WebSocket broadcast for better performance
      if (gameData.roomId) {
        await storage.updateRoomStatus(gameData.roomId, 'playing');
      }

      res.json(gameWithPlayers);
    } catch (error) {
      console.error("Error creating game:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Failed to create game", error: error.message });
    }
  });

  app.get('/api/games/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const game = await storage.getGameById(id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Get player information with achievements for the game
      const [playerXInfo, playerOInfo] = await Promise.all([
        storage.getUser(game.playerXId),
        game.playerOId !== 'AI' ? storage.getUser(game.playerOId) : Promise.resolve(null)
      ]);

      // Get achievements for both players
      const [playerXAchievements, playerOAchievements] = await Promise.all([
        playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
        playerOInfo ? storage.getUserAchievements(game.playerOId) : Promise.resolve([])
      ]);

      const gameWithPlayers = {
        ...game,
        playerXInfo: playerXInfo ? {
          ...playerXInfo,
          achievements: playerXAchievements.slice(0, 3)
        } : playerXInfo,
        playerOInfo: playerOInfo ? {
          ...playerOInfo,
          achievements: playerOAchievements.slice(0, 3)
        } : { username: 'AI', displayName: 'AI' }
      };

      res.json(gameWithPlayers);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post('/api/games/:id/moves', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { id: gameId } = req.params;
      const { position } = req.body;

      // Validate game ID format (UUID)
      if (!gameId || typeof gameId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gameId)) {
        return res.status(400).json({ message: "Invalid game ID format" });
      }

      // Validate position
      if (typeof position !== 'number' || !Number.isInteger(position) || position < 1 || position > 15) {
        return res.status(400).json({ message: "Position must be an integer between 1 and 15" });
      }

      // Move request processing

      // Always fetch fresh game state to avoid stale data
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Validating game state

      if (game.status !== 'active') {
        //console.log(`❌ MOVE REJECTED: Game status is ${game.status}, not active`);
        return res.status(400).json({ message: `Game is not active (status: ${game.status})` });
      }

      // Validate it's the player's turn
      const isPlayerX = game.playerXId === userId;
      const isPlayerO = game.playerOId === userId;

      // Validating player roles

      if (!isPlayerX && !isPlayerO) {
        //console.log(`❌ MOVE REJECTED: User ${userId} is not a player in this game`);
        return res.status(403).json({ message: "Not a player in this game" });
      }

      const playerSymbol = isPlayerX ? 'X' : 'O';
      // Validating turn

      if (game.currentPlayer !== playerSymbol) {
        //console.log(`❌ MOVE REJECTED: Not your turn. Current: ${game.currentPlayer}, User: ${playerSymbol}`);
        return res.status(400).json({ 
          message: `Not your turn. Current player: ${game.currentPlayer}, Your symbol: ${playerSymbol}`,
          debug: {
            userId,
            playerXId: game.playerXId,
            playerOId: game.playerOId,
            currentPlayer: game.currentPlayer,
            isPlayerX,
            isPlayerO,
            playerSymbol
          }
        });
      }

      // Validate move
      const currentBoard = game.board as Record<string, string> || {};
      
      // Check if position 8 is locked on first move
      const isFirstMove = Object.keys(currentBoard).length === 0;
      if (isFirstMove && position === 8) {
        return res.status(400).json({ message: "Position 8 is locked on the first move" });
      }
      
      if (!validateMove(currentBoard, position, playerSymbol)) {
        return res.status(400).json({ message: "Invalid move" });
      }

      // Make move
      const newBoard = makeMove(currentBoard, position, playerSymbol);
      const nextPlayer = getOpponentSymbol(playerSymbol);

      // INSTANT WebSocket broadcast for real-time responsiveness
      if (game.roomId && roomConnections.has(game.roomId)) {
        const roomUsers = roomConnections.get(game.roomId)!;
        const currentTime = new Date();
        const gameStartTime = new Date(game.createdAt);
        const timeElapsed = currentTime.getTime() - gameStartTime.getTime();
        const timeRemaining = Math.max(0, 10 * 60 * 1000 - timeElapsed);

        const moveMessage = JSON.stringify({
          type: 'move',
          gameId,
          roomId: game.roomId,
          position,
          player: playerSymbol,
          board: newBoard,
          currentPlayer: nextPlayer,
          serverTime: currentTime.toISOString(),
          timeRemaining: timeRemaining
        });

        // Send move update immediately for instant feedback
        roomUsers.forEach(connectionId => {
          const connection = connections.get(connectionId);
          if (connection && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(moveMessage);
          }
        });

        // Add 1.5 second delay after broadcasting move to give slow internet users time to sync
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Check for win before database operations
      const winResult = checkWin(newBoard, playerSymbol);

      // Get move count and run ALL database operations in parallel
      const [moveCount] = await Promise.all([
        storage.getGameMoves(gameId),
        storage.updateGameBoard(gameId, newBoard),
        !winResult.winner ? storage.updateCurrentPlayer(gameId, nextPlayer) : Promise.resolve()
      ]);

      // Save move with correct move number (parallel with other operations)
      const movePromise = storage.createMove({
        gameId,
        playerId: userId,
        position,
        symbol: playerSymbol,
        moveNumber: moveCount.length + 1,
      });
      if (winResult.winner) {
        const opponentId = isPlayerX ? game.playerOId : game.playerXId;

        // IMMEDIATE: Send winning move notification BEFORE database operations for instant feedback
        if (game.roomId && roomConnections.has(game.roomId)) {
          const roomUsers = roomConnections.get(game.roomId)!;

          // Send winning move with highlight immediately
          const winningMoveMessage = JSON.stringify({
            type: 'winning_move',
            gameId,
            position,
            player: playerSymbol,
            board: newBoard,
            currentPlayer: nextPlayer,
            winningPositions: winResult.winningPositions || [],
            roomId: game.roomId
          });

          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(winningMoveMessage);
            }
          });

          // Send lightweight game over message immediately 
          const room = await storage.getRoomById(game.roomId);
          const betAmount = room?.betAmount || 0;
          const gameOverMessage = JSON.stringify({
            type: 'game_over',
            gameId,
            winner: playerSymbol,
            condition: winResult.condition,
            board: newBoard,
            roomId: game.roomId,
            betAmount
          });

          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(gameOverMessage);
            }
          });
        }

        // Run ALL database operations in background to avoid blocking UI updates
        setImmediate(async () => {
          try {
            // Run move save AND all status updates in parallel for faster response
            const updatePromises = [
              movePromise, // Include move saving in parallel operations
              storage.updateGameStatus(gameId, 'finished', userId, winResult.condition || undefined),
              storage.updateUserStats(userId, 'win')
            ];

            if (opponentId && opponentId !== 'AI') {
              updatePromises.push(storage.updateUserStats(opponentId, 'loss'));
            }

            await Promise.all(updatePromises);

            // Process achievements in background
            if (game.roomId && game.gameMode === 'online') {
              await storage.checkAndGrantAchievements(userId, 'win', {
                winCondition: winResult.condition,
                isOnlineGame: true
              });

              if (opponentId && opponentId !== 'AI') {
                await storage.checkAndGrantAchievements(opponentId, 'loss', {
                  winCondition: winResult.condition,
                  isOnlineGame: true
                });
              }
            }

            // Update room status back to waiting so new games can start
            if (game.roomId) {
              await storage.updateRoomStatus(game.roomId, 'waiting');
            }

            console.log(`🎮 WIN: All database operations completed for game ${gameId}`);
          } catch (error) {
            console.error('🏆 Background win processing error:', error);
          }
        });
      } else if (checkDraw(newBoard)) {
        // Run draw updates in parallel for faster response
        const drawPromises = [storage.updateGameStatus(gameId, 'finished', undefined, 'draw')];

        if (game.playerXId && game.playerXId !== 'AI') {
          drawPromises.push(storage.updateUserStats(game.playerXId, 'draw'));
        }
        if (game.playerOId && game.playerOId !== 'AI') {
          drawPromises.push(storage.updateUserStats(game.playerOId, 'draw'));
        }

        await Promise.all(drawPromises);

        // Process draw achievements in background to avoid blocking
        if (game.roomId && game.gameMode === 'online') {
          setImmediate(async () => {
            try {
              if (game.playerXId && game.playerXId !== 'AI') {
                await storage.checkAndGrantAchievements(game.playerXId, 'draw', {
                  winCondition: 'draw',
                  isOnlineGame: true
                });
              }
              if (game.playerOId && game.playerOId !== 'AI') {
                await storage.checkAndGrantAchievements(game.playerOId, 'draw', {
                  winCondition: 'draw',
                  isOnlineGame: true
                });
              }
            } catch (error) {
              console.error('🏆 Background draw achievement processing error:', error);
            }
          });
        }

        // Update room status back to waiting so new games can start
        if (game.roomId) {
          await storage.updateRoomStatus(game.roomId, 'waiting');
        }

        // Broadcast game over to room
        if (game.roomId && roomConnections.has(game.roomId)) {
          const room = await storage.getRoomById(game.roomId);
          const betAmount = room?.betAmount || 0;
          const roomUsers = roomConnections.get(game.roomId)!;
          roomUsers.forEach(connectionId => {
            const connection = connections.get(connectionId);
            if (connection && connection.ws.readyState === WebSocket.OPEN) {
              connection.ws.send(JSON.stringify({
                type: 'game_over',
                gameId,
                winner: null,
                condition: 'draw',
                board: newBoard,
                betAmount
              }));
            }
          });
        }
      } else {
        // Save move to database (non-blocking for response)
        await movePromise;

        // Handle Bot move if it's an online game against a bot
        const isGameAgainstBot = game.playerOId && AI_BOTS.some(bot => bot.id === game.playerOId);
        if (game.gameMode === 'online' && isGameAgainstBot && nextPlayer === 'O') {
          // Bot's turn to make a move - reduced delay for faster gameplay
          setTimeout(async () => {
            try {
              // Find the bot information
              const botInfo = AI_BOTS.find(bot => bot.id === game.playerOId);
              if (!botInfo) {
                console.error(`🤖 Bot not found: ${game.playerOId}`);
                return;
              }

              // Create AI player with bot's difficulty
              const aiBot = new AIPlayer('O', botInfo.difficulty);
              const botMove = aiBot.makeMove(newBoard);

              // Bot selected move

              const botBoard = makeMove(newBoard, botMove, 'O');

              // Save bot move
              await storage.createMove({
                gameId,
                playerId: game.playerOId,
                position: botMove,
                symbol: 'O',
                moveNumber: moveCount.length + 2,
              });

              await storage.updateGameBoard(gameId, botBoard);

              // Check bot win
              const botWinResult = checkWin(botBoard, 'O');
              if (botWinResult.winner) {
                await storage.updateGameStatus(gameId, 'finished', game.playerOId, botWinResult.condition || undefined);
                await storage.updateUserStats(userId, 'loss'); // User loses to bot

                // Check and grant achievements for the human player (they lost to bot)
                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'waiting');
                  try {
                    await storage.checkAndGrantAchievements(userId, 'loss', {
                      winCondition: botWinResult.condition,
                      isOnlineGame: true,
                      againstBot: true
                    });
                  } catch (error) {
                    console.error('🏆 Error checking achievements for user (lost to bot):', error);
                  }
                }

                // Broadcast bot win to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const roomUsers = roomConnections.get(game.roomId)!;

                  // First broadcast the winning move with highlight
                  const winningMoveMessage = JSON.stringify({
                    type: 'winning_move',
                    gameId,
                    position: botMove,
                    player: 'O',
                    board: botBoard,
                    currentPlayer: 'X',
                    winningPositions: botWinResult.winningPositions || [],
                    roomId: game.roomId
                  });

                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(winningMoveMessage);
                    }
                  });

                  // Then broadcast game over after 2.5 seconds
                  setTimeout(async () => {
                    const playerXInfo = await storage.getUser(game.playerXId);
                    const room = await storage.getRoomById(game.roomId);
                    const betAmount = room?.betAmount || 0;

                    roomUsers.forEach(connectionId => {
                      const connection = connections.get(connectionId);
                      if (connection && connection.ws.readyState === WebSocket.OPEN) {
                        connection.ws.send(JSON.stringify({
                          type: 'game_over',
                          gameId,
                          winner: 'O',
                          condition: botWinResult.condition,
                          board: botBoard,
                          betAmount,
                          winnerInfo: {
                            displayName: botInfo.displayName,
                            firstName: botInfo.firstName,
                            username: botInfo.username,
                            profilePicture: botInfo.profilePicture,
                            profileImageUrl: botInfo.profilePicture
                          },
                          playerXInfo: playerXInfo ? {
                            displayName: playerXInfo.displayName,
                            firstName: playerXInfo.firstName,
                            username: playerXInfo.username,
                            profilePicture: playerXInfo.profilePicture,
                            profileImageUrl: playerXInfo.profileImageUrl
                          } : null,
                          playerOInfo: {
                            displayName: botInfo.displayName,
                            firstName: botInfo.firstName,
                            username: botInfo.username,
                            profilePicture: botInfo.profilePicture,
                            profileImageUrl: botInfo.profilePicture
                          }
                        }));
                      }
                    });
                  }, 1500);
                }
              } else if (checkDraw(botBoard)) {
                await storage.updateGameStatus(gameId, 'finished', undefined, 'draw');
                await storage.updateUserStats(userId, 'draw'); // User draws with bot

                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'waiting');
                  try {
                    await storage.checkAndGrantAchievements(userId, 'draw', {
                      winCondition: 'draw',
                      isOnlineGame: true,
                      againstBot: true
                    });
                  } catch (error) {
                    console.error('🏆 Error checking achievements for user (draw with bot):', error);
                  }
                }

                // Broadcast draw to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const room = await storage.getRoomById(game.roomId);
                  const betAmount = room?.betAmount || 0;
                  const roomUsers = roomConnections.get(game.roomId)!;
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(JSON.stringify({
                        type: 'game_over',
                        gameId,
                        winner: null,
                        condition: 'draw',
                        board: botBoard,
                        betAmount
                      }));
                    }
                  });
                }
              } else {
                // Bot made a move, switch back to human player
                await storage.updateCurrentPlayer(gameId, 'X');

                // Broadcast bot move to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const roomUsers = roomConnections.get(game.roomId)!;
                  const playerXInfo = await storage.getUser(game.playerXId);
                  const playerXAchievements = playerXInfo ? await storage.getUserAchievements(game.playerXId) : [];



                  const botMoveMessage = JSON.stringify({
                    type: 'move',
                    gameId,
                    roomId: game.roomId,
                    position: botMove,
                    player: 'O',
                    board: botBoard,
                    currentPlayer: 'X',
                    playerXInfo: playerXInfo ? {
                      displayName: playerXInfo.displayName,
                      firstName: playerXInfo.firstName,
                      username: playerXInfo.username,
                      profilePicture: playerXInfo.profilePicture,
                      profileImageUrl: playerXInfo.profileImageUrl,
                      achievements: playerXAchievements.slice(0, 3)
                    } : null,
                    playerOInfo: {
                      displayName: botInfo.displayName,
                      firstName: botInfo.firstName,
                      username: botInfo.username,
                      profilePicture: botInfo.profilePicture,
                      profileImageUrl: botInfo.profilePicture,
                      achievements: []
                    }
                  });

                  // Broadcasting bot move to room users
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(botMoveMessage);
                    }
                  });
                }
              }
            } catch (error) {
              console.error('🤖 Error in bot move handling:', error);
            }
          }, 300 + Math.random() * 500); // Faster bot response for better gameplay
        }

        // Handle AI move if it's AI mode
        if (game.gameMode === 'ai' && nextPlayer === 'O') {
          setTimeout(async () => {
            try {
              const ai = new AIPlayer('O', 'medium');
              const aiMove = ai.makeMove(newBoard);

              const aiBoard = makeMove(newBoard, aiMove, 'O');

              // Save AI move
              await storage.createMove({
                gameId,
                playerId: game.playerOId || 'AI',
                position: aiMove,
                symbol: 'O',
                moveNumber: moveCount.length + 2,
              });

              await storage.updateGameBoard(gameId, aiBoard);

              // Check AI win
              const aiWinResult = checkWin(aiBoard, 'O');
              if (aiWinResult.winner) {
                await storage.updateGameStatus(gameId, 'finished', game.playerOId || undefined, aiWinResult.condition || undefined);
                await storage.updateUserStats(userId, 'loss');

                // AI games don't grant achievements (only online games do)

                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'waiting');
                }

                // Broadcast AI win to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const room = await storage.getRoomById(game.roomId);
                  const betAmount = room?.betAmount || 0;
                  const roomUsers = roomConnections.get(game.roomId)!;
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(JSON.stringify({
                        type: 'game_over',
                        gameId,
                        winner: game.playerOId || 'AI',
                        condition: aiWinResult.condition,
                        board: aiBoard,
                        betAmount
                      }));
                    }
                  });
                }
              } else if (checkDraw(aiBoard)) {
                await storage.updateGameStatus(gameId, 'finished', undefined, 'draw');
                await storage.updateUserStats(userId, 'draw');

                // AI games don't grant achievements (only online games do)

                if (game.roomId) {
                  await storage.updateRoomStatus(game.roomId, 'waiting');
                }

                // Broadcast AI draw to room
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const room = await storage.getRoomById(game.roomId);
                  const betAmount = room?.betAmount || 0;
                  const roomUsers = roomConnections.get(game.roomId)!;
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(JSON.stringify({
                        type: 'game_over',
                        gameId,
                        winner: null,
                        condition: 'draw',
                        board: aiBoard,
                        betAmount
                      }));
                    }
                  });
                }
              } else {
                await storage.updateCurrentPlayer(gameId, 'X');
              }

              // Broadcast AI move
              if (game.roomId && roomConnections.has(game.roomId)) {
                const roomUsers = roomConnections.get(game.roomId)!;
                roomUsers.forEach(connectionId => {
                  const connection = connections.get(connectionId);
                  if (connection && connection.ws.readyState === WebSocket.OPEN) {
                    connection.ws.send(JSON.stringify({
                      type: 'move',
                      gameId,
                      position: aiMove,
                      player: 'O',
                      board: aiBoard,
                      currentPlayer: 'X', // Back to player X's turn after AI move
                    }));
                  }
                });
              }
            } catch (error) {
              console.error("AI move error:", error);
            }
          }, 500); // Faster AI response for better gameplay
        }
      }

      res.json({ 
        message: "Move made successfully",
        board: newBoard,
        currentPlayer: getOpponentSymbol(playerSymbol),
        gameId: gameId
      });
    } catch (error) {
      console.error("Error making move:", error);
      res.status(500).json({ message: "Failed to make move" });
    }
  });

  app.get('/api/users/:id/stats', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getUserStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const connectionId = Math.random().toString(36).substring(7);
    // New WebSocket connection

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'auth':
            // WebSocket authenticated

            // Get user info for online tracking
            const userInfo = await storage.getUser(data.userId);

            connections.set(connectionId, {
              ws,
              userId: data.userId,
              username: userInfo?.username || 'Anonymous',
              displayName: userInfo?.displayName || userInfo?.firstName || 'Anonymous',
              lastSeen: new Date()
            });

            // Cancel any pending disconnect for this user (grace period reconnection)
            const pendingDisconnect = pendingDisconnects.get(data.userId);
            if (pendingDisconnect) {
              clearTimeout(pendingDisconnect.timeoutId);
              pendingDisconnects.delete(data.userId);
              //console.log(`✅ User ${data.userId} reconnected within grace period - disconnect cancelled`);
            }

            // Update online users list
            onlineUsers.set(data.userId, {
              userId: data.userId,
              username: userInfo?.username || 'Anonymous',
              displayName: userInfo?.displayName || userInfo?.firstName || 'Anonymous',
              lastSeen: new Date()
            });

            // Check for active game reconnection
            await handleUserReconnection(data.userId, connectionId, ws);

            // Also check for missed game_started messages (recovery mechanism)
            await checkAndSendMissedGameState(data.userId, connectionId, ws);

            // Optimize: Only broadcast online updates when significant change occurs
            const onlineCount = onlineUsers.size;

            // Only send updates if count changed by more than 1 or if it's been more than 10 seconds
            const lastBroadcastTime = global.lastOnlineUpdateBroadcast || 0;
            const timeSinceLastBroadcast = Date.now() - lastBroadcastTime;

            if (timeSinceLastBroadcast > 10000 || !global.lastOnlineCount || Math.abs(onlineCount - global.lastOnlineCount) > 0) {
              const broadcastMessage = JSON.stringify({
                type: 'online_users_update',
                count: onlineCount
              });

              // Only send to users who are actively in rooms or have friends online
              connections.forEach(conn => {
                if (conn.ws.readyState === WebSocket.OPEN) {
                  // Throttled broadcast - only send every 10 seconds to reduce traffic
                  conn.ws.send(broadcastMessage);
                }
              });

              global.lastOnlineUpdateBroadcast = Date.now();
              global.lastOnlineCount = onlineCount;
            }

            break;

          case 'request_current_game_state':
            // Handle client requesting current game state (recovery mechanism)
            await checkAndSendMissedGameState(data.userId, connectionId, ws);
            break;

          case 'game_started_ack':
            // Handle acknowledgment for game_started messages
            const messageId = data.messageId;
            if (messageId && pendingGameStartedAcks.has(messageId)) {
              // Remove from pending acknowledgments since client confirmed receipt
              pendingGameStartedAcks.delete(messageId);
              //console.log(`✅ Game started acknowledgment received for message ${messageId}`);
            }
            break;

          case 'ping':
            // Enhanced ping/pong with connection quality metrics
            const pingTimestamp = data.timestamp || Date.now();
            const pongTimestamp = Date.now();
            const serverLatency = pongTimestamp - pingTimestamp;

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ 
                type: 'pong', 
                timestamp: pongTimestamp,
                originalTimestamp: pingTimestamp,
                serverLatency: serverLatency
              }));

              // Update last seen for this connection with performance tracking
              const connection = connections.get(connectionId);
              if (connection) {
                connection.lastSeen = new Date();

                // Update online user tracking with latency awareness
                if (onlineUsers.has(connection.userId)) {
                  const user = onlineUsers.get(connection.userId)!;
                  user.lastSeen = new Date();

                  // Track connection quality for adaptive optimization
                  if (serverLatency > 500) {
                    // High latency connection - could implement adaptive features here
                    //console.log(`⚠️ High latency detected for user ${connection.displayName}: ${serverLatency}ms`);
                  }
                }
              }
              //console.log(`🏓 Pong sent to user ${connection?.userId || 'unknown'}`);
            }
            break;

          case 'move':
            // Handle real-time move through WebSocket for instant synchronization
            const moveConnection = connections.get(connectionId);
            if (moveConnection) {
              try {
                const { gameId, position } = data;
                //console.log(`🎮 WebSocket move received: gameId=${gameId}, position=${position}, userId=${moveConnection.userId}`);

                // Get the current game state
                const game = await storage.getGameById(gameId);
                if (!game || game.status !== 'active') {
                  // Send error back to client
                  ws.send(JSON.stringify({
                    type: 'move_error',
                    gameId,
                    error: 'Game not active or not found'
                  }));
                  break;
                }

                // Validate it's the player's turn
                const userIsPlayerX = game.playerXId === moveConnection.userId;
                const userIsPlayerO = game.playerOId === moveConnection.userId;
                const expectedSymbol = game.currentPlayer;

                if ((expectedSymbol === 'X' && !userIsPlayerX) || (expectedSymbol === 'O' && !userIsPlayerO)) {
                  ws.send(JSON.stringify({
                    type: 'move_error',
                    gameId,
                    error: 'Not your turn'
                  }));
                  break;
                }

                // Validate the move is legal
                const currentBoard = game.board || {};
                if (currentBoard[position.toString()]) {
                  ws.send(JSON.stringify({
                    type: 'move_error',
                    gameId,
                    error: 'Position already occupied'
                  }));
                  break;
                }

                // Process the move
                const newBoard = { ...currentBoard, [position.toString()]: expectedSymbol };
                const nextPlayer = expectedSymbol === 'X' ? 'O' : 'X';

                // Disable auto-play for the player who made the move (regain control)
                const isCurrentPlayerAutoPlay = expectedSymbol === 'X' ? game.playerXAutoPlay : game.playerOAutoPlay;
                if (isCurrentPlayerAutoPlay) {
                  //console.log(`🎮 Player ${expectedSymbol} regained control from auto-play in game ${gameId}`);
                  await storage.disableAutoPlay(gameId, expectedSymbol as 'X' | 'O');

                  // Notify room about auto-play deactivation
                  if (game.roomId && roomConnections.has(game.roomId)) {
                    const roomUsers = roomConnections.get(game.roomId)!;
                    const autoPlayDisabledMessage = JSON.stringify({
                      type: 'auto_play_disabled',
                      gameId,
                      player: expectedSymbol,
                      message: `Player ${expectedSymbol} has regained control and is no longer in auto-play mode`
                    });

                    roomUsers.forEach(connectionId => {
                      const connection = connections.get(connectionId);
                      if (connection && connection.ws.readyState === WebSocket.OPEN) {
                        connection.ws.send(autoPlayDisabledMessage);
                      }
                    });
                  }
                }

                // Check for win
                const { checkWin, checkDraw } = await import('./gameLogic');
                const winResult = checkWin(newBoard, expectedSymbol);
                const isDraw = !winResult.winner && checkDraw(newBoard);

                // Update game in database
                await storage.updateGameBoard(gameId, newBoard);
                await storage.updateCurrentPlayer(gameId, nextPlayer);
                await storage.updateLastMoveTime(gameId);

                if (winResult.winner || isDraw) {
                  await storage.updateGameStatus(gameId, 'finished', 
                    winResult.winner ? moveConnection.userId : undefined);
                }

                // Broadcast move to all players in room immediately
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const roomUsers = roomConnections.get(game.roomId)!;
                  const moveMessage = JSON.stringify({
                    type: winResult.winner ? 'winning_move' : 'move',
                    gameId,
                    roomId: game.roomId,
                    position,
                    player: expectedSymbol,
                    board: newBoard,
                    currentPlayer: nextPlayer,
                    winningPositions: winResult.winningPositions || null,
                    serverTime: new Date().toISOString()
                  });

                  roomUsers.forEach(connectionId => {
                    const conn = connections.get(connectionId);
                    if (conn && conn.ws.readyState === WebSocket.OPEN) {
                      conn.ws.send(moveMessage);
                    }
                  });

                  // Add 1.5 second delay after broadcasting move to give slow internet users time to sync
                  await new Promise(resolve => setTimeout(resolve, 1500));
                }

                // Check if the next player is a bot and trigger bot move
                if (!winResult.winner && !isDraw) {
                  const nextPlayerId = nextPlayer === 'X' ? game.playerXId : game.playerOId;
                  //console.log(`🤖 Checking bot move: nextPlayer=${nextPlayer}, nextPlayerId=${nextPlayerId}`);

                  // Check if next player is a bot (IDs starting with "player_")
                  if (nextPlayerId && nextPlayerId.startsWith('player_')) {
                    //console.log(`🤖 Bot move triggered for ${nextPlayerId} (${nextPlayer})`);
                    // Trigger bot move after a short delay for realism
                    setTimeout(async () => {
                      try {
                        const { AIPlayer } = await import('./aiPlayer');

                        // Get bot difficulty from the bot data (use default medium if not found)
                        let difficulty = 'medium';
                        if (nextPlayerId && nextPlayerId.startsWith('player_')) {
                          const playerNum = parseInt(nextPlayerId.replace('player_', ''));
                          if (playerNum >= 1 && playerNum <= 30) {
                            difficulty = 'easy';
                          } else if (playerNum >= 31 && playerNum <= 70) {
                            difficulty = 'medium';
                          } else if (playerNum >= 71 && playerNum <= 100) {
                            difficulty = 'hard';
                          }
                        }

                        const ai = new AIPlayer(nextPlayer, difficulty);
                        const botMove = ai.makeMove(newBoard);

                        // Make the bot move
                        const botNewBoard = { ...newBoard, [botMove]: nextPlayer };
                        const botNextPlayer = expectedSymbol; // Switch back to human

                        // Check for bot win
                        const { checkWin, checkDraw } = await import('./gameLogic');
                        const botWinResult = checkWin(botNewBoard, nextPlayer);
                        const botIsDraw = !botWinResult.winner && checkDraw(botNewBoard);

                        // Update database with bot move
                        await storage.updateGameBoard(gameId, botNewBoard);
                        await storage.updateCurrentPlayer(gameId, botNextPlayer);
                        await storage.updateLastMoveTime(gameId);

                        if (botWinResult.winner || botIsDraw) {
                          await storage.updateGameStatus(gameId, 'finished', 
                            botWinResult.winner ? nextPlayerId : undefined, 
                            botIsDraw ? 'draw' : (botWinResult.condition || undefined));
                        }

                        // Broadcast bot move to all players in room
                        if (game.roomId && roomConnections.has(game.roomId)) {
                          const roomUsers = roomConnections.get(game.roomId)!;
                          const botMoveMessage = JSON.stringify({
                            type: botWinResult.winner ? 'winning_move' : 'move',
                            gameId,
                            roomId: game.roomId,
                            position: botMove,
                            player: nextPlayer,
                            board: botNewBoard,
                            currentPlayer: botNextPlayer,
                            winningPositions: botWinResult.winningPositions || null,
                            serverTime: new Date().toISOString(),
                            isBot: true
                          });

                          //console.log(`🤖 Broadcasting bot move: position=${botMove}, player=${nextPlayer}, roomUsers=${roomUsers.size}`);
                          roomUsers.forEach(connectionId => {
                            const conn = connections.get(connectionId);
                            if (conn && conn.ws.readyState === WebSocket.OPEN) {
                              conn.ws.send(botMoveMessage);
                            }
                          });

                          // If bot won or game is draw, send game_over message after delay
                          if (botWinResult.winner || botIsDraw) {
                            setTimeout(async () => {
                              const room = await storage.getRoomById(game.roomId);
                              const betAmount = room?.betAmount || 0;
                              const gameOverMessage = JSON.stringify({
                                type: 'game_over',
                                gameId,
                                result: botWinResult.winner ? 'win' : 'draw',
                                winner: botWinResult.winner ? nextPlayer : null,
                                condition: botIsDraw ? 'draw' : (botWinResult.condition || undefined),
                                roomId: game.roomId,
                                betAmount
                              });

                              roomUsers.forEach(connectionId => {
                                const conn = connections.get(connectionId);
                                if (conn && conn.ws.readyState === WebSocket.OPEN) {
                                  conn.ws.send(gameOverMessage);
                                }
                              });
                            }, 1500); // Same delay as user wins
                          }
                        }

                      } catch (error) {
                        console.error('Bot move error:', error);
                      }
                    }, 1000 + Math.random() * 1000); // 1-3 second delay for realism
                  }
                }

                // If game ended, handle end game logic
                if (winResult.winner || isDraw) {
                  setTimeout(async () => {
                    if (game.roomId && roomConnections.has(game.roomId)) {
                      const room = await storage.getRoomById(game.roomId);
                      const betAmount = room?.betAmount || 0;
                      const roomUsers = roomConnections.get(game.roomId)!;
                      const gameOverMessage = JSON.stringify({
                        type: 'game_over',
                        gameId,
                        result: winResult.winner ? 'win' : 'draw',
                        winner: winResult.winner ? expectedSymbol : null,
                        condition: isDraw ? 'draw' : (winResult.condition || undefined),
                        roomId: game.roomId,
                        betAmount
                      });

                      roomUsers.forEach(connectionId => {
                        const conn = connections.get(connectionId);
                        if (conn && conn.ws.readyState === WebSocket.OPEN) {
                          conn.ws.send(gameOverMessage);
                        }
                      });
                    }
                  }, 1500);
                }

              } catch (error) {
                console.error('WebSocket move error:', error);
                ws.send(JSON.stringify({
                  type: 'move_error',
                  gameId: data.gameId,
                  error: 'Internal server error processing move'
                }));
              }
            }
            break;

          case 'disable_auto_play':
            // Handle disabling auto-play when player wants to regain control
            const disableConnection = connections.get(connectionId);
            if (disableConnection) {
              try {
                const { gameId } = data;
                //console.log(`🎮 Disable auto-play requested: gameId=${gameId}, userId=${disableConnection.userId}`);

                // Get the current game state
                const game = await storage.getGameById(gameId);
                if (!game || game.status !== 'active') {
                  ws.send(JSON.stringify({
                    type: 'auto_play_error',
                    gameId,
                    error: 'Game not active or not found'
                  }));
                  break;
                }

                // Determine which player the user is
                const userIsPlayerX = game.playerXId === disableConnection.userId;
                const userIsPlayerO = game.playerOId === disableConnection.userId;
                let playerSymbol = '';

                if (userIsPlayerX) {
                  playerSymbol = 'X';
                } else if (userIsPlayerO) {
                  playerSymbol = 'O';
                } else {
                  ws.send(JSON.stringify({
                    type: 'auto_play_error',
                    gameId,
                    error: 'You are not a player in this game'
                  }));
                  break;
                }

                // Check if the player is currently in auto-play mode
                const isCurrentlyAutoPlay = playerSymbol === 'X' ? game.playerXAutoPlay : game.playerOAutoPlay;
                if (!isCurrentlyAutoPlay) {
                  ws.send(JSON.stringify({
                    type: 'auto_play_error',
                    gameId,
                    error: 'You are not currently in auto-play mode'
                  }));
                  break;
                }

                // Disable auto-play for the player
                //console.log(`🎮 Player ${playerSymbol} manually disabled auto-play in game ${gameId}`);
                await storage.disableAutoPlay(gameId, playerSymbol as 'X' | 'O');

                // Notify room about auto-play deactivation
                if (game.roomId && roomConnections.has(game.roomId)) {
                  const roomUsers = roomConnections.get(game.roomId)!;
                  const autoPlayDisabledMessage = JSON.stringify({
                    type: 'auto_play_disabled',
                    gameId,
                    player: playerSymbol,
                    message: `Player ${playerSymbol} has regained control and is no longer in auto-play mode`
                  });

                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(autoPlayDisabledMessage);
                    }
                  });
                }

                // Send success confirmation to the requesting player
                ws.send(JSON.stringify({
                  type: 'auto_play_disabled_success',
                  gameId,
                  player: playerSymbol,
                  message: 'Auto-play disabled successfully. You now have control!'
                }));

              } catch (error) {
                console.error('WebSocket disable auto-play error:', error);
                ws.send(JSON.stringify({
                  type: 'auto_play_error',
                  gameId: data.gameId,
                  error: 'Internal server error disabling auto-play'
                }));
              }
            }
            break;

          case 'join_room':
            const connection = connections.get(connectionId);
            if (connection) {
              // User joining room
              connection.roomId = data.roomId;

              // Update user's room state
              const existingState = userRoomStates.get(connection.userId);
              const activeGame = await storage.getActiveGameByRoomId(data.roomId);

              userRoomStates.set(connection.userId, {
                roomId: data.roomId,
                gameId: activeGame?.id,
                isInGame: activeGame?.status === 'active'
              });

              // Update online user room info
              const onlineUser = onlineUsers.get(connection.userId);
              if (onlineUser) {
                onlineUser.roomId = data.roomId;
              }

              if (!roomConnections.has(data.roomId)) {
                roomConnections.set(data.roomId, new Set());
              }
              roomConnections.get(data.roomId)!.add(connectionId);
              // Room connection updated

              // If there's an active game in this room, send the game state to the joining user
              // BUT only if this is NOT a reconnection (to prevent duplicate notifications)
              if (activeGame && activeGame.status === 'active') {
                // Check if this is a reconnection (user was recently reconnected)
                const now = Date.now();
                const lastReconnection = recentReconnections.get(connection.userId);
                const isRecentReconnection = lastReconnection && (now - lastReconnection) < 3000; // 3 second window

                if (!isRecentReconnection) {
                  // Sending active game state to joining user

                  // Get player information with achievements
                  const [playerXInfo, playerOInfo] = await Promise.all([
                    storage.getUser(activeGame.playerXId),
                    activeGame.playerOId && activeGame.playerOId !== 'AI' ? storage.getUser(activeGame.playerOId) : Promise.resolve(null)
                  ]);

                  // Get achievements for both players
                  const [playerXAchievements, playerOAchievements] = await Promise.all([
                    playerXInfo ? storage.getUserAchievements(activeGame.playerXId) : Promise.resolve([]),
                    playerOInfo ? storage.getUserAchievements(activeGame.playerOId) : Promise.resolve([])
                  ]);

                  const gameWithPlayers = {
                    ...activeGame,
                    playerXInfo: playerXInfo ? {
                      ...playerXInfo,
                      achievements: playerXAchievements.slice(0, 3)
                    } : playerXInfo,
                    playerOInfo: playerOInfo ? {
                      ...playerOInfo,
                      achievements: playerOAchievements.slice(0, 3)
                    } : playerOInfo,
                    gameMode: 'online'
                  };

                  // Send game state to the joining user
                  connection.ws.send(JSON.stringify({
                    type: 'game_started',
                    game: gameWithPlayers,
                    gameId: activeGame.id,
                    roomId: data.roomId,
                  }));
                } else {

                }
              }

              // Notify all participants in the room about the new connection
              const roomConnIds = roomConnections.get(data.roomId);
              if (roomConnIds) {
                // Get user information for the joining user
                const userInfo = await storage.getUser(connection.userId);

                for (const connId of roomConnIds) {
                  const conn = connections.get(connId);
                  if (conn && conn.ws.readyState === WebSocket.OPEN) {
                    conn.ws.send(JSON.stringify({
                      type: 'user_joined',
                      userId: connection.userId,
                      roomId: data.roomId,
                      userInfo: userInfo,
                    }));
                  }
                }
              }
            }
            break;

          case 'leave_room':
            const conn = connections.get(connectionId);
            if (conn && conn.roomId) {
              const roomId = conn.roomId;
              // Use userId from connection object instead of message data for security
              const userId = conn.userId;
              const playerName = conn.displayName || conn.username || 'Unknown Player';

              // Processing room leave request

              // Check if user is in an active game
              const userState = userRoomStates.get(userId);
              const activeGame = await storage.getActiveGameByRoomId(roomId);
              const room = await storage.getRoomById(roomId);

              // Checking active game for room

              // Check if the leaving user is actually a player in the active game
              const isPlayerInActiveGame = activeGame && activeGame.status === 'active' && 
                  (activeGame.playerXId === userId || activeGame.playerOId === userId);
              const isRoomInPlayingState = room && room.status === 'playing';

              // Only abandon the game if a PLAYER leaves, not a spectator
              if (isPlayerInActiveGame || (isRoomInPlayingState && activeGame && 
                  (activeGame.playerXId === userId || activeGame.playerOId === userId))) {
                // Player leaving active game - check if game is already finished first

                // CRITICAL FIX: Re-fetch the latest game state to check if it's already finished
                const latestGame = await storage.getGameById(activeGame.id);
                
                // If game is already finished or has a winner, skip abandonment logic entirely
                // This prevents winning players from getting abandonment penalties when they leave
                if (!latestGame || latestGame.status === 'finished' || latestGame.winnerId) {
                  // Game already finished or has winner - don't mark as abandoned
                  // But still need to broadcast room_closed to kick everyone out (only if actually finished)
                  const roomUsers = roomConnections.get(roomId);
                  if (roomUsers && roomUsers.size > 0) {
                    const roomClosedMessage = JSON.stringify({
                      type: 'room_closed',
                      roomId,
                      reason: 'player_left',
                      triggeredBy: {
                        userId,
                        displayName: playerName
                      },
                      gameId: latestGame?.id,
                      timestamp: Date.now()
                    });

                    // Broadcast to all users in the room
                    roomUsers.forEach(connectionId => {
                      const connection = connections.get(connectionId);
                      if (connection && connection.ws.readyState === WebSocket.OPEN) {
                        connection.ws.send(roomClosedMessage);
                        
                        // Clear their room state
                        connection.roomId = undefined;
                        if (connection.userId) {
                          userRoomStates.delete(connection.userId);
                          const onlineUser = onlineUsers.get(connection.userId);
                          if (onlineUser) {
                            onlineUser.roomId = undefined;
                          }
                        }
                      }
                    });

                    // Clear the entire room
                    roomConnections.delete(roomId);
                  }

                  // Clean up room state
                  userRoomStates.delete(userId);
                  await storage.removeRoomParticipant(roomId, userId);
                  return;
                }

                // Game is still active with no winner - proceed with abandonment
                // Determine the winner (the player who didn't leave)
                const leavingPlayerId = userId;
                const remainingPlayerId = activeGame.playerXId === leavingPlayerId ? 
                  activeGame.playerOId : activeGame.playerXId;
                const winnerSymbol = activeGame.playerXId === remainingPlayerId ? 'X' : 'O';

                // Get player information for the winner
                const [leavingPlayerInfo, remainingPlayerInfo] = await Promise.all([
                  storage.getUser(leavingPlayerId),
                  storage.getUser(remainingPlayerId)
                ]);

                // Mark game as finished with winner due to player abandonment
                await storage.updateGameStatus(activeGame.id, 'finished', remainingPlayerId, 'abandonment');

                // Remove leaving player from room participants database
                await storage.removeRoomParticipant(roomId, leavingPlayerId);

                // Update stats - winner gets a win, leaver gets a loss
                await storage.updateUserStats(remainingPlayerId, 'win');
                await storage.updateUserStats(leavingPlayerId, 'loss');

                // Check and grant achievements for the winner
                try {
                  await storage.checkAndGrantAchievements(remainingPlayerId, 'win', leavingPlayerId);
                } catch (achievementError) {
                  console.error('Error granting achievements after abandonment win:', achievementError);
                }

                // Game permanently ended in database with winner determined

                // Get the bet amount from the room for display in GameOverModal
                const betAmount = room?.betAmount || 50000;

                // Get all users in the room (players and spectators)
                const roomUsers = roomConnections.get(roomId);
                if (roomUsers && roomUsers.size > 0) {
                  const gameEndMessage = JSON.stringify({
                    type: 'player_left_win',
                    roomId,
                    gameId: activeGame.id,
                    winner: remainingPlayerId,
                    winnerSymbol: winnerSymbol,
                    winnerInfo: remainingPlayerInfo,
                    leavingPlayer: playerName,
                    leavingPlayerId: leavingPlayerId,
                    leavingPlayerInfo: leavingPlayerInfo,
                    condition: 'abandonment',
                    message: `${playerName} left the game. ${remainingPlayerInfo?.displayName || remainingPlayerInfo?.username || 'Player'} wins!`,
                    betAmount: betAmount,
                    redirectToAI: true
                  });

                  // Track unique users to prevent duplicate messages
                  const notifiedUsers = new Set<string>();
                  const connectionsToSend: string[] = [];

                  // Filter to send only one message per unique user
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN && connection.userId) {
                      if (!notifiedUsers.has(connection.userId)) {
                        notifiedUsers.add(connection.userId);
                        connectionsToSend.push(connectionId);
                      }
                    }
                  });

                  //console.log(`🏆 Broadcasting player left win to ${connectionsToSend.length} unique users in room ${roomId}`);

                  // Send to unique users only
                  connectionsToSend.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection && connection.ws.readyState === WebSocket.OPEN) {
                      connection.ws.send(gameEndMessage);

                      // Clear their room state immediately
                      const connUserId = connection.userId;
                      if (connUserId) {
                        userRoomStates.delete(connUserId);
                        const onlineUser = onlineUsers.get(connUserId);
                        if (onlineUser) {
                          onlineUser.roomId = undefined;
                        }
                      }

                      // Clear their connection room info
                      connection.roomId = undefined;
                    }
                  });

                  // Clear remaining duplicate connections
                  roomUsers.forEach(connectionId => {
                    const connection = connections.get(connectionId);
                    if (connection) {
                      connection.roomId = undefined;
                    }
                  });

                  // Clear the entire room
                  roomConnections.delete(roomId);
                  // Room completely cleared
                }

                return;
              }

              // Handle spectator leave (non-player leaving the room)
              // Remove from room connections
              const roomUsers = roomConnections.get(roomId);
              if (roomUsers) {
                roomUsers.delete(connectionId);

                // Update online user room info
                const onlineUser = onlineUsers.get(userId);
                if (onlineUser) {
                  onlineUser.roomId = undefined;
                }

                // Remove from user room states
                userRoomStates.delete(userId);

                // Check if this was a spectator leaving
                const participants = await storage.getRoomParticipants(roomId);
                const leavingUser = participants.find(p => p.userId === userId);
                const isSpectatorLeaving = leavingUser && leavingUser.role === 'spectator';

                // Remove participant from database (both spectators and regular players)
                await storage.removeRoomParticipant(roomId, userId);

                if (isSpectatorLeaving) {
                  // For spectators, send them back to home with a reload message
                  conn.ws.send(JSON.stringify({
                    type: 'spectator_left',
                    roomId,
                    message: 'You have left the room',
                    redirectToHome: true             
                  }));

                  // Just send a regular notification to other users that spectator left
                  if (roomUsers.size > 0) {
                    const spectatorLeftMessage = JSON.stringify({
                      type: 'user_left',
                      roomId,
                      userId,
                      playerName,
                      role: 'spectator',
                      message: `${playerName} (spectator) left the room`
                    });

                    roomUsers.forEach(remainingConnectionId => {
                      const remainingConnection = connections.get(remainingConnectionId);
                      if (remainingConnection && remainingConnection.ws.readyState === WebSocket.OPEN) {
                        remainingConnection.ws.send(spectatorLeftMessage);
                      }
                    });
                  }
                } else {
                  // For non-spectators (regular players), send room end notification to all remaining users
                  if (roomUsers.size > 0) {
                    const roomEndMessage = JSON.stringify({
                      type: 'room_ended',
                      roomId,
                      userId,
                      playerName,
                      message: `${playerName} left the room`
                    });

                    // Broadcasting room end to remaining users
                    roomUsers.forEach(remainingConnectionId => {
                      const remainingConnection = connections.get(remainingConnectionId);
                      if (remainingConnection && remainingConnection.ws.readyState === WebSocket.OPEN) {
                        remainingConnection.ws.send(roomEndMessage);
                      }
                    });
                  }
                }

                // Clear the room if no users left
                if (roomUsers.size === 0) {
                  roomConnections.delete(roomId);
                  // Room cleared - no users remaining
                }
              }

              conn.roomId = undefined;
            }
            break;

          case 'player_reaction':
            // Handle player reaction and broadcast to all users in the room
            const { roomId, gameId, userId, playerSymbol, reactionType, emoji, playerInfo } = data;

            // Player reaction received

            // Broadcast reaction to all users in the room
            const roomUsers = roomConnections.get(roomId);
            if (roomUsers && roomUsers.size > 0) {
              const reactionMessage = JSON.stringify({
                type: 'player_reaction',
                roomId,
                gameId,
                userId,
                playerSymbol,
                reactionType,
                emoji,
                playerInfo,
                timestamp: Date.now()
              });

              //console.log(`🎭 Broadcasting reaction to ${roomUsers.size} users in room ${roomId}`);
              let broadcastCount = 0;
              roomUsers.forEach(connId => {
                const conn = connections.get(connId);
                if (conn && conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(reactionMessage);
                  broadcastCount++;
                  // Sent reaction to user
                }
              });
              // Successfully broadcast reaction
            } else {
              // No room users found or room is empty
            }
            break;

          case 'player_chat':
            // Handle player chat message and broadcast to all users in the room
            const { roomId: chatRoomId, gameId: chatGameId, userId: chatUserId, playerSymbol: chatPlayerSymbol, messageText, playerInfo: chatPlayerInfo } = data;

            // console.log(`💬 Player chat from ${chatUserId} in room ${chatRoomId}: ${messageText} (${chatPlayerSymbol})`);

            // Broadcast chat message to all users in the room
            const chatRoomUsers = roomConnections.get(chatRoomId);
            if (chatRoomUsers && chatRoomUsers.size > 0) {
              const chatMessage = JSON.stringify({
                type: 'player_chat',
                roomId: chatRoomId,
                gameId: chatGameId,
                userId: chatUserId,
                playerSymbol: chatPlayerSymbol,
                messageText,
                playerInfo: chatPlayerInfo,
                timestamp: Date.now()
              });

              // console.log(`💬 Broadcasting chat to ${chatRoomUsers.size} users in room ${chatRoomId}`);
              let broadcastCount = 0;
              chatRoomUsers.forEach(connId => {
                const conn = connections.get(connId);
                if (conn && conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(chatMessage);
                  broadcastCount++;
                  // console.log(`💬 Sent chat to user: ${conn.userId}`);
                }
              });
              // console.log(`💬 Successfully broadcast chat to ${broadcastCount} users`);
            } else {
              // No room users found or room is empty
            }
            break;

          case 'send_emoji':
            // Handle emoji send and broadcast to room
            const emojiConnection = connections.get(connectionId);
            if (emojiConnection) {
              try {
                const { roomId: emojiRoomId, gameId: emojiGameId, recipientId, emojiId } = data;
                const senderId = emojiConnection.userId;

                // Validate emoji ownership
                const hasEmoji = await storage.hasUserPurchasedEmoji(senderId, emojiId);
                if (!hasEmoji) {
                  if (emojiConnection.ws.readyState === WebSocket.OPEN) {
                    emojiConnection.ws.send(JSON.stringify({
                      type: 'emoji_error',
                      error: 'You do not own this emoji'
                    }));
                  }
                  break;
                }

                // Get emoji details
                const emoji = await storage.getEmojiItemById(emojiId);
                if (!emoji) {
                  break;
                }

                // Record the emoji send in database
                await storage.sendEmojiInGame(emojiGameId, senderId, recipientId, emojiId);

                // Get sender info
                const senderInfo = await storage.getUser(senderId);

                // Broadcast emoji animation to all users in the room
                const emojiRoomUsers = roomConnections.get(emojiRoomId);
                if (emojiRoomUsers && emojiRoomUsers.size > 0) {
                  const emojiMessage = JSON.stringify({
                    type: 'emoji_sent',
                    roomId: emojiRoomId,
                    gameId: emojiGameId,
                    senderId,
                    recipientId,
                    emoji,
                    senderInfo: {
                      userId: senderId,
                      displayName: senderInfo?.displayName || senderInfo?.username || 'Player',
                      profileImageUrl: senderInfo?.profileImageUrl
                    },
                    timestamp: Date.now()
                  });

                  emojiRoomUsers.forEach(connId => {
                    const conn = connections.get(connId);
                    if (conn && conn.ws.readyState === WebSocket.OPEN) {
                      conn.ws.send(emojiMessage);
                    }
                  });
                }
              } catch (error) {
                console.error('Error sending emoji:', error);
                if (emojiConnection.ws.readyState === WebSocket.OPEN) {
                  emojiConnection.ws.send(JSON.stringify({
                    type: 'emoji_error',
                    error: 'Failed to send emoji'
                  }));
                }
              }
            }
            break;

          case 'create_room':
            // Handle room creation via WebSocket for better performance on slow connections
            const createConnection = connections.get(connectionId);
            if (createConnection) {
              try {
                const userId = createConnection.userId;
                const roomData = data.roomData;

                // Validate room data using the same schema as REST API
                const validatedRoomData = insertRoomSchema.parse(roomData);

                // Check if user has enough coins for the selected bet amount
                const userCoins = await storage.getUserCoins(userId);
                const requiredBet = validatedRoomData.betAmount || 5000; // Default to 5k if not specified

                if (userCoins < requiredBet) {
                  if (createConnection.ws.readyState === WebSocket.OPEN) {
                    createConnection.ws.send(JSON.stringify({
                      type: 'create_room_error',
                      requestId: data.requestId,
                      error: 'Insufficient coins',
                      message: `You need ${requiredBet.toLocaleString()} coins to create a room with this bet amount. You have ${userCoins.toLocaleString()} coins. Win games to earn more coins!`,
                      requiredCoins: requiredBet,
                      currentCoins: userCoins
                    }));
                  }
                  break;
                }

                // Create the room
                const room = await storage.createRoom({
                  ...validatedRoomData,
                  ownerId: userId,
                });

                // Add owner as participant
                await storage.addRoomParticipant({
                  roomId: room.id,
                  userId,
                  role: 'player',
                });

                // Send success response
                if (createConnection.ws.readyState === WebSocket.OPEN) {
                  createConnection.ws.send(JSON.stringify({
                    type: 'create_room_success',
                    requestId: data.requestId,
                    room
                  }));
                }

                //console.log(`🏠 Room created via WebSocket: ${room.code} by user ${userId}`);
              } catch (error) {
                console.error('Error creating room via WebSocket:', error);
                if (createConnection.ws.readyState === WebSocket.OPEN) {
                  createConnection.ws.send(JSON.stringify({
                    type: 'create_room_error',
                    requestId: data.requestId,
                    error: 'Failed to create room',
                    message: 'Failed to create room. Please try again.'
                  }));
                }
              }
            }
            break;

          case 'join_room_request':
            // Handle room joining via WebSocket for better performance on slow connections
            const joinConnection = connections.get(connectionId);
            if (joinConnection) {
              try {
                const userId = joinConnection.userId;
                const { code, role = 'player', requestId } = data;

                // Validate room code format
                if (!code || typeof code !== 'string' || !/^[A-Za-z0-9]{6,10}$/.test(code)) {
                  if (joinConnection.ws.readyState === WebSocket.OPEN) {
                    joinConnection.ws.send(JSON.stringify({
                      type: 'join_room_error',
                      requestId,
                      error: 'Invalid room code format',
                      message: 'Invalid room code format'
                    }));
                  }
                  break;
                }

                // Validate role
                if (!['player', 'spectator'].includes(role)) {
                  if (joinConnection.ws.readyState === WebSocket.OPEN) {
                    joinConnection.ws.send(JSON.stringify({
                      type: 'join_room_error',
                      requestId,
                      error: 'Invalid role',
                      message: "Invalid role. Must be 'player' or 'spectator'"
                    }));
                  }
                  break;
                }

                // Fetch room first to check bet amount
                const room = await storage.getRoomByCode(code);
                if (!room) {
                  if (joinConnection.ws.readyState === WebSocket.OPEN) {
                    joinConnection.ws.send(JSON.stringify({
                      type: 'join_room_error',
                      requestId,
                      error: 'Room not found',
                      message: 'Room not found'
                    }));
                  }
                  break;
                }

                // Check if user has enough coins to match the room's bet amount (only for players, spectators join free)
                if (role === 'player') {
                  const userCoins = await storage.getUserCoins(userId);
                  const requiredCoins = room.betAmount || 100; // Use room's bet amount, fallback to 100

                  if (userCoins < requiredCoins) {
                    if (joinConnection.ws.readyState === WebSocket.OPEN) {
                      joinConnection.ws.send(JSON.stringify({
                        type: 'join_room_error',
                        requestId,
                        error: 'Insufficient coins',
                        message: `You need ${requiredCoins.toLocaleString()} coins to join this room as a player. You have ${userCoins.toLocaleString()} coins. Win AI games to earn more coins! You can still join as a spectator.`,
                        requiredCoins: requiredCoins,
                        currentCoins: userCoins
                      }));
                    }
                    break;
                  }
                }

                // Check room status (must be waiting or playing)
                if (room.status === 'finished') {
                  if (joinConnection.ws.readyState === WebSocket.OPEN) {
                    joinConnection.ws.send(JSON.stringify({
                      type: 'join_room_error',
                      requestId,
                      error: 'Room finished',
                      message: 'This room has finished. Please join a different room.'
                    }));
                  }
                  break;
                }

                // Check if user is already a participant
                const allParticipants = await storage.getRoomParticipants(room.id);
                const existingParticipant = allParticipants.find(p => p.userId === userId);
                if (existingParticipant) {
                  // Use already fetched participants for response
                  const roomWithParticipants = { ...room, participants: allParticipants };

                  if (joinConnection.ws.readyState === WebSocket.OPEN) {
                    joinConnection.ws.send(JSON.stringify({
                      type: 'join_room_success',
                      requestId,
                      room: roomWithParticipants,
                      message: 'You are already in this room'
                    }));
                  }

                  // Join WebSocket room for real-time updates
                  if (!roomConnections.has(room.id)) {
                    roomConnections.set(room.id, new Set());
                  }
                  roomConnections.get(room.id)!.add(connectionId);
                  joinConnection.roomId = room.id;
                  break;
                }

                // Check room capacity
                const participants = await storage.getRoomParticipants(room.id);
                const currentPlayers = participants.filter(p => p.role === 'player').length;
                const currentSpectators = participants.filter(p => p.role === 'spectator').length;

                if (role === 'player' && currentPlayers >= (room.maxPlayers || 2)) {
                  if (joinConnection.ws.readyState === WebSocket.OPEN) {
                    joinConnection.ws.send(JSON.stringify({
                      type: 'join_room_error',
                      requestId,
                      error: 'Room is full',
                      message: 'Room is full. You can join as a spectator instead.'
                    }));
                  }
                  break;
                }

                if (role === 'spectator' && currentSpectators >= 50) {
                  if (joinConnection.ws.readyState === WebSocket.OPEN) {
                    joinConnection.ws.send(JSON.stringify({
                      type: 'join_room_error',
                      requestId,
                      error: 'Too many spectators',
                      message: 'Maximum spectators reached'
                    }));
                  }
                  break;
                }

                // Add user as participant
                await storage.addRoomParticipant({
                  roomId: room.id,
                  userId,
                  role,
                });

                // Get updated participants list
                const updatedParticipants = await storage.getRoomParticipants(room.id);
                const roomWithParticipants = { ...room, participants: updatedParticipants };

                // Send success response
                if (joinConnection.ws.readyState === WebSocket.OPEN) {
                  joinConnection.ws.send(JSON.stringify({
                    type: 'join_room_success',
                    requestId,
                    room: roomWithParticipants
                  }));
                }

                // Join WebSocket room for real-time updates
                if (!roomConnections.has(room.id)) {
                  roomConnections.set(room.id, new Set());
                }
                roomConnections.get(room.id)!.add(connectionId);
                joinConnection.roomId = room.id;

                // Update user's room state
                userRoomStates.set(userId, {
                  roomId: room.id,
                  isInGame: false
                });

                // Notify other room participants about the new joiner
                const roomUsers = roomConnections.get(room.id)!;
                const joinNotification = JSON.stringify({
                  type: 'room_participant_joined',
                  roomId: room.id,
                  participant: { userId, role },
                  participants: updatedParticipants
                });

                roomUsers.forEach(connId => {
                  if (connId !== connectionId) { // Don't send to the joiner themselves
                    const conn = connections.get(connId);
                    if (conn && conn.ws.readyState === WebSocket.OPEN) {
                      conn.ws.send(joinNotification);
                    }
                  }
                });

                // If there's an active game in the room, send it to the new joiner (especially spectators)
                const activeGame = await storage.getActiveGameByRoomId(room.id);
                if (activeGame && activeGame.status === 'active') {
                  // Get player information with achievements and piece styles
                  const [playerXInfo, playerOInfo] = await Promise.all([
                    activeGame.playerXId ? storage.getUser(activeGame.playerXId) : Promise.resolve(null),
                    activeGame.playerOId ? storage.getUser(activeGame.playerOId) : Promise.resolve(null)
                  ]);

                  const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
                    playerXInfo ? storage.getUserAchievements(activeGame.playerXId!) : Promise.resolve([]),
                    playerOInfo ? storage.getUserAchievements(activeGame.playerOId!) : Promise.resolve([]),
                    playerXInfo ? storage.getActivePieceStyle(activeGame.playerXId!) : Promise.resolve(undefined),
                    playerOInfo ? storage.getActivePieceStyle(activeGame.playerOId!) : Promise.resolve(undefined)
                  ]);

                  const gameWithPlayers = {
                    ...activeGame,
                    playerXInfo: playerXInfo ? {
                      ...playerXInfo,
                      achievements: playerXAchievements.slice(0, 3),
                      activePieceStyle: playerXPieceStyle?.styleName || 'default'
                    } : null,
                    playerOInfo: playerOInfo ? {
                      ...playerOInfo,
                      achievements: playerOAchievements.slice(0, 3),
                      activePieceStyle: playerOPieceStyle?.styleName || 'default'
                    } : null,
                    gameMode: 'online',
                    serverTime: new Date().toISOString()
                  };

                  // Send game state to the new joiner
                  if (joinConnection.ws.readyState === WebSocket.OPEN) {
                    joinConnection.ws.send(JSON.stringify({
                      type: 'game_started',
                      game: gameWithPlayers,
                      roomId: room.id,
                      room: room,
                      spectatorJoin: true // Flag to indicate this is for a spectator joining mid-game
                    }));
                  }
                }

                //console.log(`🏠 User ${userId} joined room ${room.code} as ${role} via WebSocket`);
              } catch (error) {
                console.error('Error joining room via WebSocket:', error);
                if (joinConnection.ws.readyState === WebSocket.OPEN) {
                  joinConnection.ws.send(JSON.stringify({
                    type: 'join_room_error',
                    requestId: data.requestId,
                    error: 'Failed to join room',
                    message: 'Failed to join room. Please try again.'
                  }));
                }
              }
            }
            break;

          case 'start_game_request':
            // Handle game starting via WebSocket for better performance on slow connections
            const startConnection = connections.get(connectionId);
            if (startConnection) {
              try {
                const userId = startConnection.userId;
                const { roomId, requestId } = data;

                const room = await storage.getRoomById(roomId);
                if (!room) {
                  if (startConnection.ws.readyState === WebSocket.OPEN) {
                    startConnection.ws.send(JSON.stringify({
                      type: 'start_game_error',
                      requestId,
                      error: 'Room not found',
                      message: 'Room not found'
                    }));
                  }
                  break;
                }

                // Check if user is the room creator (only room creator can start games)
                if (room.ownerId !== userId) {
                  if (startConnection.ws.readyState === WebSocket.OPEN) {
                    startConnection.ws.send(JSON.stringify({
                      type: 'start_game_error',
                      requestId,
                      error: 'Not authorized',
                      message: 'Only the room creator can start games'
                    }));
                  }
                  break;
                }

                // Check room status (must be waiting)
                if (room.status !== 'waiting') {
                  if (startConnection.ws.readyState === WebSocket.OPEN) {
                    startConnection.ws.send(JSON.stringify({
                      type: 'start_game_error',
                      requestId,
                      error: 'Invalid room status',
                      message: `Cannot start game. Room status is '${room.status}'. Only rooms in 'waiting' status can start games.`
                    }));
                  }
                  break;
                }

                // Check if there's already an active game in this room
                const existingActiveGame = await storage.getActiveGameByRoomId(roomId);
                if (existingActiveGame && existingActiveGame.status === 'active') {
                  // Get player information for the existing game
                  const [playerXInfo, playerOInfo] = await Promise.all([
                    storage.getUser(existingActiveGame.playerXId),
                    storage.getUser(existingActiveGame.playerOId)
                  ]);

                  // Get achievements and piece styles for both players
                  const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
                    playerXInfo ? storage.getUserAchievements(existingActiveGame.playerXId) : [],
                    playerOInfo ? storage.getUserAchievements(existingActiveGame.playerOId) : [],
                    playerXInfo ? storage.getActivePieceStyle(existingActiveGame.playerXId) : undefined,
                    playerOInfo ? storage.getActivePieceStyle(existingActiveGame.playerOId) : undefined
                  ]);

                  const gameWithPlayers = {
                    ...existingActiveGame,
                    playerXInfo: playerXInfo ? {
                      ...playerXInfo,
                      achievements: playerXAchievements.slice(0, 3),
                      activePieceStyle: playerXPieceStyle?.styleName || 'default'
                    } : null,
                    playerOInfo: playerOInfo ? {
                      ...playerOInfo,
                      achievements: playerOAchievements.slice(0, 3),
                      activePieceStyle: playerOPieceStyle?.styleName || 'default'
                    } : null
                  };

                  if (startConnection.ws.readyState === WebSocket.OPEN) {
                    startConnection.ws.send(JSON.stringify({
                      type: 'start_game_success',
                      requestId,
                      game: gameWithPlayers,
                      message: 'Game already in progress'
                    }));
                  }
                  break;
                }

                // Get room participants
                const participants = await storage.getRoomParticipants(roomId);
                const players = participants.filter(p => p.role === 'player');

                if (players.length < 2) {
                  if (startConnection.ws.readyState === WebSocket.OPEN) {
                    startConnection.ws.send(JSON.stringify({
                      type: 'start_game_error',
                      requestId,
                      error: 'Not enough players',
                      message: 'Need 2 players to start game'
                    }));
                  }
                  break;
                }

                // Create new game with room owner getting first turn (player X)
                const playerX = players.find(p => p.userId === room.ownerId);
                const playerO = players.find(p => p.userId !== room.ownerId);

                if (!playerX || !playerO || !playerX.userId || !playerO.userId) {
                  if (startConnection.ws.readyState === WebSocket.OPEN) {
                    startConnection.ws.send(JSON.stringify({
                      type: 'start_game_error',
                      requestId,
                      error: 'Invalid players',
                      message: 'Could not find both players'
                    }));
                  }
                  break;
                }

                const gameData = {
                  roomId,
                  playerXId: playerX.userId,
                  playerOId: playerO.userId,
                  gameMode: 'online' as const,
                  status: 'active' as const,
                  currentPlayer: 'X' as const,
                  board: {},
                };

                const game = await storage.createGame(gameData);

                // Update room status to "playing"
                await storage.updateRoomStatus(roomId, 'playing');

                // Get player information with achievements
                const [playerXInfo, playerOInfo] = await Promise.all([
                  storage.getUser(game.playerXId),
                  storage.getUser(game.playerOId)
                ]);

                // Get achievements and piece styles for both players
                const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
                  playerXInfo ? storage.getUserAchievements(game.playerXId) : Promise.resolve([]),
                  playerOInfo ? storage.getUserAchievements(game.playerOId) : Promise.resolve([]),
                  playerXInfo ? storage.getActivePieceStyle(game.playerXId) : Promise.resolve(undefined),
                  playerOInfo ? storage.getActivePieceStyle(game.playerOId) : Promise.resolve(undefined)
                ]);

                const gameWithPlayers = {
                  ...game,
                  playerXInfo: playerXInfo ? {
                    ...playerXInfo,
                    achievements: playerXAchievements.slice(0, 3),
                    activePieceStyle: playerXPieceStyle?.styleName || 'default'
                  } : playerXInfo,
                  playerOInfo: playerOInfo ? {
                    ...playerOInfo,
                    achievements: playerOAchievements.slice(0, 3),
                    activePieceStyle: playerOPieceStyle?.styleName || 'default'
                  } : playerOInfo,
                };

                // Send success response to the requestor
                if (startConnection.ws.readyState === WebSocket.OPEN) {
                  startConnection.ws.send(JSON.stringify({
                    type: 'start_game_success',
                    requestId,
                    game: gameWithPlayers
                  }));
                }

                // Broadcast to all room participants with retry logic
                await broadcastGameStartedWithRetry(roomId, {
                  type: 'game_started',
                  game: gameWithPlayers,
                  gameId: game.id,
                  roomId: roomId,
                });

                //console.log(`🎮 Game started via WebSocket: ${game.id} in room ${roomId}`);
              } catch (error) {
                console.error('Error starting game via WebSocket:', error);
                if (startConnection.ws.readyState === WebSocket.OPEN) {
                  startConnection.ws.send(JSON.stringify({
                    type: 'start_game_error',
                    requestId: data.requestId,
                    error: 'Failed to start game',
                    message: 'Failed to start game. Please try again.'
                  }));
                }
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {


      // Get user info before cleaning up
      const connection = connections.get(connectionId);

      if (connection) {
        // Check if user has other active connections
        const userHasOtherConnections = Array.from(connections.values()).some(
          conn => conn.userId === connection.userId && conn.ws !== ws
        );

        // Only remove from online users if no other connections exist
        if (!userHasOtherConnections) {
          // Check if user is in active game by checking both memory state and database
          const userState = userRoomStates.get(connection.userId);
          const activeGame = await storage.getActiveGameForUser(connection.userId);
          const isReallyInActiveGame = activeGame && activeGame.status === 'active';

          if (userState && userState.isInGame && isReallyInActiveGame) {
            //console.log(`🏠 User ${connection.userId} disconnected but is in active game - keeping in room`);
            // Update last seen time but don't remove
            const onlineUser = onlineUsers.get(connection.userId);
            if (onlineUser) {
              onlineUser.lastSeen = new Date();
            }
          } else {
            // Instead of immediate cleanup, use grace period for reconnection
            const userState = userRoomStates.get(connection.userId);
            
            // Determine grace period: 60 seconds for waiting rooms, 2 minutes for active games
            const activeGame = await storage.getActiveGameForUser(connection.userId);
            const gracePeriodMs = (activeGame && activeGame.status === 'active') ? 2 * 60 * 1000 : 60 * 1000;
            
            //console.log(`⏱️ User ${connection.userId} disconnected - grace period: ${gracePeriodMs/1000}s`);
            
            // Create a timeout for delayed cleanup
            const timeoutId = setTimeout(async () => {
              // This executes only if user doesn't reconnect within grace period
              //console.log(`⏰ Grace period expired for user ${connection.userId} - proceeding with cleanup`);
              
              // Clean up room participant from database
              const userState = userRoomStates.get(connection.userId);
              if (userState && userState.roomId) {
                try {
                  await storage.removeRoomParticipant(userState.roomId, connection.userId);
                  //console.log(`🧹 Removed user ${connection.userId} from room ${userState.roomId} after grace period`);
                } catch (error) {
                  console.error('Error removing room participant after grace period:', error);
                }
              }

              // Clean up user states
              onlineUsers.delete(connection.userId);
              userRoomStates.delete(connection.userId);
              pendingDisconnects.delete(connection.userId);

              // Broadcast user offline event
              const userOfflineMessage = JSON.stringify({
                type: 'user_offline',
                userId: connection.userId
              });

              const onlineCount = onlineUsers.size;
              const broadcastMessage = JSON.stringify({
                type: 'online_users_update',
                count: onlineCount
              });

              connections.forEach(conn => {
                if (conn.ws.readyState === WebSocket.OPEN) {
                  conn.ws.send(userOfflineMessage);
                  conn.ws.send(broadcastMessage);
                }
              });
            }, gracePeriodMs);
            
            // Store pending disconnect info
            pendingDisconnects.set(connection.userId, {
              userId: connection.userId,
              roomId: userState?.roomId,
              timeoutId: timeoutId,
              expiresAt: new Date(Date.now() + gracePeriodMs)
            });
          }
        }
      }

      // Check if user has other connections BEFORE deleting this one
      const userHasOtherConnectionsAfterDelete = connection ? 
        Array.from(connections.values()).some(conn => conn.userId === connection.userId && conn.ws !== ws) : false;

      // Clean up connection
      connections.delete(connectionId);

      // Remove from room connections only if user doesn't have other connections
      if (connection && !userHasOtherConnectionsAfterDelete) {
        for (const [roomId, roomUsers] of roomConnections.entries()) {
          if (roomUsers.has(connectionId)) {
            roomUsers.delete(connectionId);

            // Check if user is in active game before notifying room end
            const userState = userRoomStates.get(connection.userId);
            const activeGame = await storage.getActiveGameByRoomId(roomId);

            // Only send room_ended if there's actually an ACTIVE game in progress
            const isActiveGameInProgress = activeGame && activeGame.status === 'active' && 
                  (activeGame.playerXId === connection.userId || activeGame.playerOId === connection.userId);

            if (isActiveGameInProgress) {
              // Player left during active game - this should trigger game abandonment logic elsewhere
              //console.log(`🚨 Player ${connection.userId} left active game in room ${roomId}`);
            } else {
              // Game is finished or no game - just clean up room silently for remaining users
              //console.log(`🧹 Cleaning up room ${roomId} - no active game affected`);

              // Check if there are still other users in the room
              const remainingUsers = Array.from(roomUsers).filter(connId => connections.has(connId));

              if (remainingUsers.length > 0) {
                // Don't send room_ended message - just clean up silently
                // The remaining users should be able to start new games or matchmake normally
                //console.log(`🧹 Room ${roomId} has ${remainingUsers.length} remaining users - keeping room active`);
              } else {
                // No remaining users - delete the room
                roomConnections.delete(roomId);
                //console.log(`🧹 Room ${roomId} empty - deleted`);
              }

              // Clean up the user's room state and database participant
              userRoomStates.delete(connection.userId);

              // Remove participant from database on disconnect
              try {
                await storage.removeRoomParticipant(roomId, connection.userId);
              } catch (error) {
                console.error('Error removing room participant on disconnect:', error);
              }

              // Also remove user from matchmaking queue if they were in it
              const matchmakingIndex = matchmakingQueue.findIndex(entry => entry.userId === connection.userId);
              if (matchmakingIndex > -1) {
                matchmakingQueue.splice(matchmakingIndex, 1);
                //console.log(`🧹 Removed user ${connection.userId} from matchmaking queue`);
              }

              // Clear any matchmaking timers for this user
              if (matchmakingTimers.has(connection.userId)) {
                clearTimeout(matchmakingTimers.get(connection.userId)!);
                matchmakingTimers.delete(connection.userId);
                //console.log(`🧹 Cleared matchmaking timer for user ${connection.userId}`);
              }
            }
          }
        }
      }
    });
  });

  // Play Again endpoints
  app.post('/api/play-again/request', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { requestedUserId, gameId } = req.body;

      if (!requestedUserId || !gameId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // CRITICAL FIX: Validate that the game is actually finished before allowing play again requests
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      if (game.status !== 'finished') {
        return res.status(400).json({ error: 'Cannot send play again request for active game' });
      }

      // Ensure the requester was actually a participant in this game
      if (game.playerXId !== userId && game.playerOId !== userId) {
        return res.status(403).json({ error: 'Not authorized to send play again request for this game' });
      }

      // Check if there's already an active request for this game
      const existingRequest = await storage.getActivePlayAgainRequest(gameId, userId);
      if (existingRequest) {
        return res.status(400).json({ error: 'Play again request already exists' });
      }

      // Check if user has sufficient coins for the bet amount
      if (game.roomId) {
        const room = await storage.getRoomById(game.roomId);
        if (room) {
          const betAmount = room.betAmount || 5000;
          const requesterUser = await storage.getUser(userId);
          
          if (requesterUser && requesterUser.coins < betAmount) {
            const displayName = requesterUser.displayName || requesterUser.firstName || requesterUser.username || 'Player';
            return res.status(400).json({ 
              error: `Cannot start play again. ${displayName} doesn't have enough coins. Required: ${betAmount.toLocaleString()} 🪙, Current: ${requesterUser.coins.toLocaleString()} 🪙` 
            });
          }
        }
      }

      const request = await storage.sendPlayAgainRequest(userId, requestedUserId, gameId);

      // Fetch requester's full details to send with the notification
      const requesterUser = await storage.getUser(userId);

      // Send real-time notification to ALL active connections for the requested player
      // This ensures the user receives the request even if they have multiple tabs open or reconnected
      const requestPayload = {
        type: 'play_again_request',
        requestId: request.id,
        requesterId: userId,
        requestedId: requestedUserId,
        gameId,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        requester: {
          id: userId,
          displayName: requesterUser?.displayName || '',
          firstName: requesterUser?.firstName || '',
          lastName: requesterUser?.lastName || '',
          username: requesterUser?.username || '',
          profileImageUrl: requesterUser?.profileImageUrl || undefined,
        },
        game: {
          id: gameId,
          gameMode: game.gameMode || 'online',
        }
      };

      let notificationsSent = 0;
      for (const connection of connections.values()) {
        if (connection.userId === requestedUserId && connection.ws.readyState === WebSocket.OPEN) {
          try {
            connection.ws.send(JSON.stringify(requestPayload));
            notificationsSent++;
          } catch (error) {
            console.error(`❌ Failed to send play again request to connection:`, error);
          }
        }
      }

      //console.log(`📬 Sent play again request to ${notificationsSent} active connections for user ${requestedUserId}`);

      res.json({ success: true, requestId: request.id });
    } catch (error) {
      console.error('Error sending play again request:', error);
      res.status(500).json({ error: 'Failed to send play again request' });
    }
  });

  app.post('/api/play-again/respond', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { requestId, response } = req.body;

      if (!requestId || !response || !['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({ error: 'Invalid request or response' });
      }

      // Get the request to validate and get requester info
      const requests = await storage.getPlayAgainRequests(userId);
      const request = requests.find(r => r.id === requestId);

      if (!request) {
        return res.status(404).json({ error: 'Play again request not found' });
      }

      // Get WebSocket connections early for error handling
      const requesterConnection = Array.from(connections.values())
        .find(conn => conn.userId === request.requesterId);
      const responderConnection = Array.from(connections.values())
        .find(conn => conn.userId === userId);

      // If accepting, validate coins BEFORE marking request as accepted
      if (response === 'accepted') {
        // Get the original game's room ID with proper null handling
        const originalGame = request.game;
        const existingRoomId = originalGame?.roomId;

        if (!existingRoomId) {
          return res.status(400).json({ error: 'Original game has no room ID - cannot reuse room' });
        }

        // Get the existing room details
        const existingRoom = await storage.getRoomById(existingRoomId);

        if (!existingRoom) {
          return res.status(400).json({ error: 'Original room not found' });
        }

        // Check if the acceptor has enough coins for the bet amount
        const acceptorCoins = await storage.getUserCoins(userId);
        const requiredBet = existingRoom.betAmount;
        
        if (acceptorCoins < requiredBet) {
          const acceptorUser = await storage.getUser(userId);
          const acceptorName = acceptorUser?.displayName || acceptorUser?.username || 'Player';
          
          // Send error to acceptor
          if (responderConnection && responderConnection.ws.readyState === WebSocket.OPEN) {
            responderConnection.ws.send(JSON.stringify({
              type: 'play_again_error',
              error: `Cannot accept play again. You don't have enough coins. Required: ${requiredBet.toLocaleString()} 🪙, Current: ${acceptorCoins.toLocaleString()} 🪙`
            }));
          }
          
          // Send error to requester
          if (requesterConnection && requesterConnection.ws.readyState === WebSocket.OPEN) {
            requesterConnection.ws.send(JSON.stringify({
              type: 'play_again_error',
              error: `Cannot start play again. ${acceptorName} doesn't have enough coins. Required: ${requiredBet.toLocaleString()} 🪙, Current: ${acceptorCoins.toLocaleString()} 🪙`
            }));
          }
          
          return res.status(400).json({ 
            error: `Insufficient coins. You need ${requiredBet.toLocaleString()} coins but have ${acceptorCoins.toLocaleString()} coins.` 
          });
        }
      }

      // All validation passed - now mark request as responded
      await storage.respondToPlayAgainRequest(requestId, response);

      // If rejected, send redirect to home to both players
      if (response === 'rejected') {
        [requesterConnection, responderConnection].forEach(conn => {
          if (conn && conn.ws.readyState === WebSocket.OPEN) {
            conn.ws.send(JSON.stringify({
              type: 'play_again_rejected',
              requestId,
              redirectToHome: true
            }));
          }
        });
        
        // Send success response for rejected requests immediately
        return res.json({ success: true });
      }

      // Send response notification for accepted requests
      if (requesterConnection && requesterConnection.ws.readyState === WebSocket.OPEN) {
        requesterConnection.ws.send(JSON.stringify({
          type: 'play_again_response',
          requestId,
          response,
          responderId: userId,
        }));
      }

      // Send success response immediately BEFORE starting countdown
      res.json({ success: true });

      // Run countdown and game creation asynchronously (don't block HTTP response)
      setImmediate(async () => {
        try {
          // Get the original game's room ID (already validated above)
          const originalGame = request.game;
          const existingRoomId = originalGame?.roomId!;

          // Re-fetch the existing room for the game_started payload
          const existingRoom = await storage.getRoomById(existingRoomId);

          // Collect all connection IDs for both players (handle multiple tabs/connections)
          const requesterConnIds = Array.from(connections.entries())
            .filter(([_, conn]) => conn.userId === request.requesterId)
            .map(([connId, _]) => connId);
          const responderConnIds = Array.from(connections.entries())
            .filter(([_, conn]) => conn.userId === userId)
            .map(([connId, _]) => connId);

          const allPlayerConnIds = [...requesterConnIds, ...responderConnIds];

          // Send countdown message to both players immediately
          const sendCountdownToPlayers = (count: number) => {
            allPlayerConnIds.forEach(connId => {
              const connection = connections.get(connId);
              if (connection && connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(JSON.stringify({
                  type: 'play_again_countdown',
                  countdown: count,
                  message: count > 0 ? `Starting new game in ${count}...` : 'Starting game now!'
                }));
              }
            });
          };

          // Send countdown: 5, 4, 3, 2, 1
          sendCountdownToPlayers(5);

          await new Promise(resolve => setTimeout(resolve, 1000));
          sendCountdownToPlayers(4);

          await new Promise(resolve => setTimeout(resolve, 1000));
          sendCountdownToPlayers(3);

          await new Promise(resolve => setTimeout(resolve, 1000));
          sendCountdownToPlayers(2);

          await new Promise(resolve => setTimeout(resolve, 1000));
          sendCountdownToPlayers(1);

          await new Promise(resolve => setTimeout(resolve, 1000));

          // Clear old room participants to prevent stale data from previous games
          await storage.clearRoomParticipants(existingRoomId);

          // Add the current two players as participants
          await Promise.all([
            storage.addRoomParticipant({
              roomId: existingRoomId,
              userId: request.requesterId,
              role: 'player'
            }),
            storage.addRoomParticipant({
              roomId: existingRoomId,
              userId: userId,
              role: 'player'
            })
          ]);

          // Create new game regardless of WebSocket connection status
          // Update user room states first
          userRoomStates.set(request.requesterId, { roomId: existingRoomId, isInGame: false });
          userRoomStates.set(userId, { roomId: existingRoomId, isInGame: false });

          // Create new game in the existing room
          const newGame = await storage.createGame({
            roomId: existingRoomId,
            gameMode: 'online',
            playerXId: request.requesterId,
            playerOId: userId,
            status: 'active'
          });

          // Update user room states to indicate they're in a game
          userRoomStates.set(request.requesterId, { roomId: existingRoomId, gameId: newGame.id, isInGame: true });
          userRoomStates.set(userId, { roomId: existingRoomId, gameId: newGame.id, isInGame: true });

          // Ensure room connections exist and add all player connection IDs
          if (!roomConnections.has(existingRoomId)) {
            roomConnections.set(existingRoomId, new Set());
          }

          const roomConnIds = roomConnections.get(existingRoomId)!;
          allPlayerConnIds.forEach(connId => roomConnIds.add(connId));

          // Update connection room info for all player connections
          allPlayerConnIds.forEach(connId => {
            const connection = connections.get(connId);
            if (connection) {
              connection.roomId = existingRoomId;
            }
          });

          // Get player information with achievements to include in game_started event
          const [playerXInfo, playerOInfo] = await Promise.all([
            storage.getUser(newGame.playerXId!),
            storage.getUser(newGame.playerOId!)
          ]);

          // Get achievements and piece styles for both players
          const [playerXAchievements, playerOAchievements, playerXPieceStyle, playerOPieceStyle] = await Promise.all([
            playerXInfo ? storage.getUserAchievements(newGame.playerXId!) : Promise.resolve([]),
            playerOInfo ? storage.getUserAchievements(newGame.playerOId!) : Promise.resolve([]),
            playerXInfo ? storage.getActivePieceStyle(newGame.playerXId!) : Promise.resolve(undefined),
            playerOInfo ? storage.getActivePieceStyle(newGame.playerOId!) : Promise.resolve(undefined)
          ]);

          // Create enhanced game object with player information (like other game_started events)
          const gameWithPlayers = {
            ...newGame,
            playerXInfo: playerXInfo ? {
              ...playerXInfo,
              achievements: playerXAchievements.slice(0, 3),
              activePieceStyle: playerXPieceStyle?.styleName || 'default'
            } : null,
            playerOInfo: playerOInfo ? {
              ...playerOInfo,
              achievements: playerOAchievements.slice(0, 3),
              activePieceStyle: playerOPieceStyle?.styleName || 'default'
            } : null,
            gameMode: 'online', // Explicitly set as online game
            serverTime: new Date().toISOString(),
            timeRemaining: Math.max(0, 10 * 60 * 1000) // Full 10 minutes for new game
          };

          // Broadcast game_started event to all player connections in the room with retry logic
          const gameStartedPayload = {
            type: 'game_started',
            game: gameWithPlayers, // Now includes player profile information
            roomId: existingRoomId,
            room: existingRoom
          };

          // Broadcast to all players with unified retry logic
          await broadcastGameStartedWithRetry(existingRoomId, gameStartedPayload);
          //console.log(`🎮 Play again accepted: Created new game ${newGame.id} in room ${existingRoomId} after 5-second countdown`);
        } catch (error) {
          console.error('Error creating new game for play again:', error);
          // Game creation failed but response was already sent
        }
      }); // Close setImmediate
    } catch (error) {
      console.error('Error responding to play again request:', error);
      res.status(500).json({ error: 'Failed to respond to play again request' });
    }
  });

  app.get('/api/play-again/requests', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const requests = await storage.getPlayAgainRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching play again requests:', error);
      res.status(500).json({ error: 'Failed to fetch play again requests' });
    }
  });

  // Clean up expired play again requests periodically
  setInterval(async () => {
    try {
      await storage.expireOldPlayAgainRequests();
    } catch (error) {
      console.error('Error cleaning up expired play again requests:', error);
    }
  }, 60000); // Clean up every minute

  // Monthly rank popup routes
  app.get('/api/user/pending-rank-popup', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const pendingRankData = await storage.getPendingRankPopup(userId);
      res.json({ hasPendingPopup: !!pendingRankData, rankData: pendingRankData });
    } catch (error) {
      console.error('Error fetching pending rank popup:', error);
      res.status(500).json({ error: 'Failed to fetch rank popup data' });
    }
  });

  app.post('/api/user/mark-rank-popup-seen', requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.user.userId;
      const { weekNumber, year } = req.body;

      if (!weekNumber || !year) {
        return res.status(400).json({ error: 'Week number and year are required' });
      }

      await storage.markRankPopupSeen(userId, weekNumber, year);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking rank popup as seen:', error);
      res.status(500).json({ error: 'Failed to mark popup as seen' });
    }
  });

  return httpServer;
}
