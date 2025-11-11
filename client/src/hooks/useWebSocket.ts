   import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export function useWebSocket() {
  const { user } = useAuth();
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectTrigger, setReconnectTrigger] = useState(0);
  const joinedRooms = useRef<Set<string>>(new Set());
  const messageQueue = useRef<WebSocketMessage[]>([]);
  const maxQueueSize = 50; // Prevent memory issues from excessive queuing
  // Critical message types that must be queued if they fail to send
  const criticalMessageTypes = [
    'move', 'join_room', 'join_room_request', 'start_game_request',
    'start_matchmaking', 'cancel_matchmaking', 'auth', 'game_started_ack',
    'leave_room', 'play_again_response'
  ];
  const reconnectAttempts = useRef(0);
  const lastPingTime = useRef<number>(0);
  const pingResponseTime = useRef<number>(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    // Close existing connection if any
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      ws.current.close();
      ws.current = null;
    }

    // Fix: Use strict same-origin WebSocket URL to ensure cookies are sent
    const wsUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;

    console.log(`🔌 WebSocket connecting to: ${wsUrl}`);


    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected successfully!');
      setIsConnected(true);
      reconnectAttempts.current = 0; // Reset on successful connection
      // Clear joined rooms on reconnect to prevent duplicates
      joinedRooms.current.clear();

      // Get user ID with fallback to backup data
      let userId = (user as any)?.userId || (user as any)?.id;

      // If no user from API, don't use backup - force proper authentication
      if (!userId) {
        console.warn('⚠️ No authenticated user found - WebSocket connection cancelled');
        ws.current.close();
        return;
      }

      // Authenticate with WebSocket
      const authMessage = {
        type: 'auth',
        userId: userId,
      };

      // WebSocket authenticated
      ws.current?.send(JSON.stringify(authMessage));

      // Immediately request current game state for fast reconnection (within 5 seconds total)
      // This ensures players get fresh game data (moves, board state) quickly after reconnecting
      setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          // Request current game state in case we missed a game_started message
          ws.current.send(JSON.stringify({
            type: 'request_current_game_state',
            userId: userId
          }));
        }
      }, 100); // Fast refresh - only 100ms to ensure auth completes first
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        // Remove verbose logging for game messages

        // Dispatch custom events for different message types
        if (message.type === 'chat_message_received') {
          const chatEvent = new CustomEvent('chat_message_received', {
            detail: message
          });
          window.dispatchEvent(chatEvent);
          return;
        }

        // Handle gift received notifications
        if (message.type === 'gift_received') {
          const giftEvent = new CustomEvent('gift_received', {
            detail: message
          });
          window.dispatchEvent(giftEvent);
          return;
        }

        // Handle room invitation messages
        if (message.type === 'room_invitation') {
          const invitationEvent = new CustomEvent('room_invitation_received', {
            detail: message.invitation
          });
          window.dispatchEvent(invitationEvent);
          return;
        }

        // Handle room invitation accepted notification (for inviter)
        if (message.type === 'room_invitation_accepted') {
          window.dispatchEvent(new CustomEvent('room_invitation_accepted', {
            detail: message
          }));
          return;
        }

        // Handle room invitation rejected notification (for inviter)
        if (message.type === 'room_invitation_rejected') {
          window.dispatchEvent(new CustomEvent('room_invitation_rejected', {
            detail: message
          }));
          return;
        }

        // Handle regular game over - dispatch custom event for proper modal display
        if (message.type === 'game_over') {
          console.log('🎮 WebSocket: game_over message received:', message);

          // Dispatch custom event for game over handling
          const gameOverEvent = new CustomEvent('websocket_game_over', {
            detail: message
          });
          window.dispatchEvent(gameOverEvent);

          return; // Don't process further
        }

        // Handle player left win scenario - dispatch custom event for game board handling
        if (message.type === 'player_left_win') {
          // Player left win message received

          // Dispatch custom event for game board to handle
          const playerLeftWinEvent = new CustomEvent('player_left_win', {
            detail: message
          });
          window.dispatchEvent(playerLeftWinEvent);

          return; // Don't process further
        }

        // Handle game abandonment due to player leaving
        if (message.type === 'game_abandoned') {

          // Show toast notification directly
          const toastMessage = message.message || "Game ended because a player left the room.";

          // Create and show a temporary toast-like notification (XSS-safe)
          const notificationDiv = document.createElement('div');

          const containerDiv = document.createElement('div');
          containerDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            max-width: 400px;
            font-family: system-ui, -apple-system, sans-serif;
          `;

          const titleDiv = document.createElement('div');
          titleDiv.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
          titleDiv.textContent = 'Game Ended';

          const messageDiv = document.createElement('div');
          messageDiv.style.cssText = 'font-size: 14px; opacity: 0.9;';
          messageDiv.textContent = toastMessage; // Safe: uses textContent instead of innerHTML

          containerDiv.appendChild(titleDiv);
          containerDiv.appendChild(messageDiv);
          notificationDiv.appendChild(containerDiv);
          document.body.appendChild(notificationDiv);

          // Clear any stored game state to prevent reconnection
          localStorage.removeItem('currentGameState');
          sessionStorage.removeItem('currentGameState');

          // Force page reload after showing the notification
          setTimeout(() => {
            window.location.href = '/'; // Redirect to root instead of reload to prevent reconnection
          }, 1000); // Give user time to see the notification

          return; // Don't set lastMessage to prevent useEffect processing
        }

        // Handle spectator leaving and needing to redirect to home
        if (message.type === 'spectator_left') {
          // For spectators, provide immediate smooth transition to AI board
          // Clear any stored game/room state
          localStorage.removeItem('currentGameState');
          sessionStorage.removeItem('currentGameState');
          localStorage.removeItem('currentRoomState');
          sessionStorage.removeItem('currentRoomState');

          // Dispatch immediate transition event with explicit AI mode
          const spectatorTransitionEvent = new CustomEvent('spectator_transition_to_ai', {
            detail: {
              message: message.message || 'You have left the room',
              targetMode: 'ai'
            }
          });

          window.dispatchEvent(spectatorTransitionEvent);

          return; // Don't set lastMessage to prevent useEffect processing
        }

        // For critical reconnection messages, dispatch custom events immediately
        if (message.type === 'reconnection_room_join') {
          // Dispatching immediate room reconnection event
          window.dispatchEvent(new CustomEvent('reconnection_room_join', {
            detail: message
          }));
        }

        if (message.type === 'game_reconnection') {
          // Dispatching immediate game_reconnection event
          window.dispatchEvent(new CustomEvent('game_reconnection', {
            detail: message
          }));
        }

        // Handle play again request messages
        if (message.type === 'play_again_request') {
          const playAgainEvent = new CustomEvent('play_again_request_received', {
            detail: message
          });
          window.dispatchEvent(playAgainEvent);
          return;
        }

        // Handle play again rejected messages
        if (message.type === 'play_again_rejected') {
          const playAgainRejectedEvent = new CustomEvent('play_again_rejected_received', {
            detail: message
          });
          window.dispatchEvent(playAgainRejectedEvent);
          return;
        }

        // Handle play again countdown
        if (message.type === 'play_again_countdown') {
          window.dispatchEvent(new CustomEvent('play_again_countdown', {
            detail: message
          }));
          return;
        }

        // Handle play again response - requester needs to know if accepted/rejected
        if (message.type === 'play_again_response') {
          window.dispatchEvent(new CustomEvent('play_again_response_received', {
            detail: message
          }));
          return;
        }

        // Handle play again error
        if (message.type === 'play_again_error') {
          const playAgainErrorEvent = new CustomEvent('play_again_error', {
            detail: message
          });
          window.dispatchEvent(playAgainErrorEvent);
          return;
        }

        // Handle online status updates for friends list
        if (message.type === 'online_users_update' || message.type === 'user_offline') {
          // Dispatching online status update
          window.dispatchEvent(new CustomEvent('online_status_update', {
            detail: message
          }));
        }

        // Add timestamp to message for proper matching in modal
        const messageWithTimestamp = {
          ...message,
          timestamp: Date.now()
        };

        // Handle matchmaking-related messages
        if (['match_found', 'matchmaking_success', 'matchmaking_response', 'game_started'].includes(message.type)) {
          // Matchmaking message received

          // Special handling for game_started messages to ensure they're not missed
          if (message.type === 'game_started') {
            console.log('🎮 Received game_started message - ensuring proper handling');

            // Send acknowledgment if required (retry mechanism)
            if (message.requiresAck && message.messageId && ws.current && ws.current.readyState === WebSocket.OPEN) {
              try {
                ws.current.send(JSON.stringify({
                  type: 'game_started_ack',
                  messageId: message.messageId
                }));
                console.log(`✅ Sent acknowledgment for game_started message ${message.messageId}`);
              } catch (error) {
                console.error('Failed to send game_started acknowledgment:', error);
              }
            }

            // Store game state locally as backup
            try {
              localStorage.setItem('lastGameStarted', JSON.stringify({
                game: message.game,
                roomId: message.roomId,
                timestamp: Date.now()
              }));
            } catch (error) {
              console.warn('Failed to store game_started backup:', error);
            }
          }

          // Dispatch a global event for matchmaking messages to ensure modal receives them
          const matchmakingEvent = new CustomEvent('matchmaking_message_received', {
            detail: messageWithTimestamp
          });
          window.dispatchEvent(matchmakingEvent);
        }

        // Handle pong response for keepalive
        if (message.type === 'pong') {
          const responseTime = Date.now() - lastPingTime.current;
          pingResponseTime.current = responseTime;

          window.dispatchEvent(new CustomEvent('websocket_pong_received', {
            detail: { ...message, responseTime }
          }));
        }

        // Handle room creation success
        if (message.type === 'create_room_success') {
          const roomCreatedEvent = new CustomEvent('create_room_success', {
            detail: message
          });
          window.dispatchEvent(roomCreatedEvent);
        }

        // Handle room creation error
        if (message.type === 'create_room_error') {
          const roomErrorEvent = new CustomEvent('create_room_error', {
            detail: message
          });
          window.dispatchEvent(roomErrorEvent);
        }

        // Handle room join success
        if (message.type === 'join_room_success') {
          const joinRoomSuccessEvent = new CustomEvent('join_room_success', {
            detail: message
          });
          window.dispatchEvent(joinRoomSuccessEvent);
        }

        // Handle room join error
        if (message.type === 'join_room_error') {
          const joinRoomErrorEvent = new CustomEvent('join_room_error', {
            detail: message
          });
          window.dispatchEvent(joinRoomErrorEvent);
        }

        // Handle game start success
        if (message.type === 'start_game_success') {
          const startGameSuccessEvent = new CustomEvent('start_game_success', {
            detail: message
          });
          window.dispatchEvent(startGameSuccessEvent);
        }

        // Handle game start error
        if (message.type === 'start_game_error') {
          const startGameErrorEvent = new CustomEvent('start_game_error', {
            detail: message
          });
          window.dispatchEvent(startGameErrorEvent);
        }

        // Handle move error
        if (message.type === 'move_error') {
          const moveErrorEvent = new CustomEvent('move_error', {
            detail: message
          });
          window.dispatchEvent(moveErrorEvent);
        }

        // Handle auto-play error
        if (message.type === 'auto_play_error') {
          const autoPlayErrorEvent = new CustomEvent('auto_play_error', {
            detail: message
          });
          window.dispatchEvent(autoPlayErrorEvent);
        }

        // Setting lastMessage in useWebSocket
        setLastMessage(messageWithTimestamp);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      // WebSocket connection closed
      console.log('🔌 WebSocket closed, attempting reconnection...');
      setIsConnected(false);
      reconnectAttempts.current++;

      // Smart reconnection with exponential backoff, but cap at 5 seconds max
      if (event.code !== 1000 && user) {
        const baseDelay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current - 1), 5000);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        const delay = Math.min(baseDelay + jitter, 5000);

        console.log(`⏳ Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts.current})`);

        // Clear any existing reconnection timeout
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }

        // Schedule reconnection by triggering useEffect to run again
        reconnectTimeout.current = setTimeout(() => {
          if (user && (!ws.current || ws.current.readyState === WebSocket.CLOSED)) {
            console.log('🔄 Triggering reconnection...');
            setReconnectTrigger(prev => prev + 1);
          }
        }, delay);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Listen for ping send events
    const handleSendPing = (event: CustomEvent) => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        //console.log('🏓 Sending ping to server');
        ws.current.send(JSON.stringify(event.detail));
      }
    };

    window.addEventListener('send_websocket_ping', handleSendPing as EventListener);

    // Enhanced heartbeat with connection quality monitoring - send ping every 50 seconds
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        lastPingTime.current = Date.now();
        ws.current.send(JSON.stringify({ 
          type: 'ping', 
          timestamp: lastPingTime.current,
          keepAlive: true 
        }));
      }
    }, 50000); // Optimized ping frequency for stable connections

    return () => {
      window.removeEventListener('send_websocket_ping', handleSendPing as EventListener);
      clearInterval(pingInterval); // Clean up heartbeat interval

      // Clear reconnection timeout on cleanup
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }

      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close();
      }
      ws.current = null;
    };
  }, [(user as any)?.userId || (user as any)?.id, reconnectTrigger]); // Re-run when user ID changes or reconnect is triggered

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        // Sending WebSocket message with error handling
        ws.current.send(JSON.stringify(message));

        // Process any queued messages after successful send
        while (messageQueue.current.length > 0 && ws.current.readyState === WebSocket.OPEN) {
          const queuedMessage = messageQueue.current.shift();
          if (queuedMessage) {
            try {
              // Sending queued message with error handling
              ws.current.send(JSON.stringify(queuedMessage));
            } catch (sendError) {
              console.error(`❌ Failed to send queued message:`, sendError);
              // Re-queue the message if send fails
              messageQueue.current.unshift(queuedMessage);
              break; // Stop processing queue if send fails
            }
          }
        }
      } catch (error) {
        console.error(`❌ Failed to send WebSocket message:`, error);
        // Queue the message for retry on critical message types (unified list)
        if (criticalMessageTypes.includes(message.type)) {
          // Check queue size limit
          if (messageQueue.current.length < maxQueueSize) {
            // Check for duplicates to prevent message spam
            const isDuplicate = messageQueue.current.some(m => 
              m.type === message.type && JSON.stringify(m) === JSON.stringify(message)
            );
            if (!isDuplicate) {
              messageQueue.current.push(message);
              console.log(`📥 Queued failed message for retry: ${message.type} (${messageQueue.current.length}/${maxQueueSize})`);
            }
          } else {
            console.warn(`⚠️ Message queue full (${maxQueueSize}), dropping message:`, message.type);
          }
        } else {
          console.warn(`⚠️ Non-critical message failed to send and will not be retried:`, message.type);
        }
      }
    } else {
      // Queue important messages for retry when connection is restored (unified list)
      if (criticalMessageTypes.includes(message.type)) {
        // Check queue size limit
        if (messageQueue.current.length < maxQueueSize) {
          // Check for duplicates to prevent message spam
          const isDuplicate = messageQueue.current.some(m => 
            m.type === message.type && JSON.stringify(m) === JSON.stringify(message)
          );
          if (!isDuplicate) {
            messageQueue.current.push(message);
            console.log(`📥 Queued message for reconnection: ${message.type} (${messageQueue.current.length}/${maxQueueSize})`);
          }
        } else {
          console.warn(`⚠️ Message queue full (${maxQueueSize}), dropping message:`, message.type);
        }
      } else {
        console.warn(`❌ WebSocket not ready, message not sent:`, message);
      }
    }
  };

  // Add a refresh connection method for matchmaking issues
  const refreshConnection = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setIsConnected(false);

      // Trigger a reconnection by updating the user dependency
      setTimeout(() => {
        if (user) {
          // Fix: Use strict same-origin WebSocket URL to ensure cookies are sent
          const wsUrl = `${window.location.origin.replace(/^http/, 'ws')}/ws`;

          ws.current = new WebSocket(wsUrl);

          ws.current.onopen = () => {
            setIsConnected(true);
            joinedRooms.current.clear();

            let userId = (user as any)?.userId || (user as any)?.id;

            if (!userId) {
              console.warn('⚠️ No authenticated user found - refresh connection cancelled');
              return;
            }

            const authMessage = {
              type: 'auth',
              userId: userId,
            };

            //console.log('🔄 Refreshed WebSocket connection with userId:', userId);
            ws.current?.send(JSON.stringify(authMessage));
          };

          // CRITICAL FIX: Simplified reconnection message handler to avoid duplication
          // All message processing should go through setLastMessage and be handled in home.tsx
          ws.current.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);

              // Only handle critical messages that need immediate action during reconnection
              // All other messages will be processed via lastMessage in home.tsx

              if (message.type === 'game_abandoned') {
                // Game abandoned needs immediate UI notification
                const toastMessage = message.message || "Game ended because a player left the room.";
                const notificationDiv = document.createElement('div');
                const containerDiv = document.createElement('div');
                containerDiv.style.cssText = `
                  position: fixed; top: 20px; right: 20px; background: #ef4444;
                  color: white; padding: 16px; border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); z-index: 9999;
                  max-width: 400px; font-family: system-ui, -apple-system, sans-serif;
                `;
                const titleDiv = document.createElement('div');
                titleDiv.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
                titleDiv.textContent = 'Game Ended';
                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = 'font-size: 14px; opacity: 0.9;';
                messageDiv.textContent = toastMessage;
                containerDiv.appendChild(titleDiv);
                containerDiv.appendChild(messageDiv);
                notificationDiv.appendChild(containerDiv);
                document.body.appendChild(notificationDiv);
                setTimeout(() => {
                  if (notificationDiv.parentNode) document.body.removeChild(notificationDiv);
                }, 5000);
                localStorage.removeItem('currentGameState');
                sessionStorage.removeItem('currentGameState');
                setTimeout(() => { window.location.href = '/'; }, 1000);
                return;
              }

              // All other messages go through setLastMessage for unified handling
              const messageWithTimestamp = { ...message, timestamp: Date.now() };
              setLastMessage(messageWithTimestamp);
            } catch (error) {
              console.error('Failed to parse WebSocket message:', error);
            }
          };

          ws.current.onclose = (event) => {
            setIsConnected(false);
          };

          ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
          };
        }
      }, 100);
    }
  };

  const joinRoom = (roomId: string) => {
    if (joinedRooms.current.has(roomId)) {
      //console.log(`🏠 Already joined room ${roomId}, skipping duplicate join`);
      return;
    }
    //console.log(`🏠 Joining room: ${roomId}`);
    joinedRooms.current.add(roomId);
    sendMessage({ type: 'join_room', roomId });
  };

  const leaveRoom = (roomId: string) => {
    //console.log(`🏠 Leaving room: ${roomId}`);
    joinedRooms.current.delete(roomId);
    sendMessage({ type: 'leave_room', roomId });
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
    joinRoom,
    leaveRoom,
    refreshConnection,
  };
}