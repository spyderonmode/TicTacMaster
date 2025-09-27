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
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'disconnected'>('disconnected');
  const joinedRooms = useRef<Set<string>>(new Set());
  const messageQueue = useRef<WebSocketMessage[]>([]);
  const reconnectAttempts = useRef(0);
  const lastPingTime = useRef<number>(0);
  const pingResponseTime = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    // Prevent duplicate connections by checking if one already exists
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      return;
    }

    // Fix: Use strict same-origin WebSocket URL to ensure cookies are sent
    const wsUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
    
    console.log(`🔌 WebSocket connecting to: ${wsUrl}`);


    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      setIsConnected(true);
      setConnectionQuality('good');
      reconnectAttempts.current = 0; // Reset on successful connection
      // Clear joined rooms on reconnect to prevent duplicates
      joinedRooms.current.clear();

      // Get user ID with fallback to backup data
      let userId = (user as any)?.userId || (user as any)?.id;

      // If no user from API, try backup from localStorage
      if (!userId) {
        try {
          const backupUser = localStorage.getItem('backup_user_data');
          if (backupUser) {
            const parsedUser = JSON.parse(backupUser);
            userId = parsedUser?.userId || parsedUser?.id;
            //console.log('🔄 Using backup user data for WebSocket auth');
          }
        } catch (error) {
          console.warn('Failed to read backup user data:', error);
        }
      }

      // Authenticate with WebSocket
      const authMessage = {
        type: 'auth',
        userId: userId,
      };

      // WebSocket authenticated
      ws.current?.send(JSON.stringify(authMessage));
      
      // Add recovery mechanism for missed game_started messages (helps with slow connections)
      setTimeout(() => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          // Request current game state in case we missed a game_started message
          ws.current.send(JSON.stringify({
            type: 'request_current_game_state',
            userId: userId
          }));
        }
      }, 1000); // Wait 1 second after authentication
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
        }

        // Handle gift received notifications
        if (message.type === 'gift_received') {
          const giftEvent = new CustomEvent('gift_received', {
            detail: message
          });
          window.dispatchEvent(giftEvent);
        }

        // Handle room invitation messages
        if (message.type === 'room_invitation') {
          const invitationEvent = new CustomEvent('room_invitation_received', {
            detail: message.invitation
          });
          window.dispatchEvent(invitationEvent);
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
          }, 2000); // Give user time to see the notification

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

        // Handle play again requests
        if (message.type === 'play_again_request') {
          // Dispatching play again request event
          window.dispatchEvent(new CustomEvent('play_again_request_received', {
            detail: message
          }));
        }

        // Handle play again rejection - redirect to home
        if (message.type === 'play_again_rejected') {
          // Dispatching play again rejected event to redirect to AI table
          window.dispatchEvent(new CustomEvent('play_again_rejected_received', {
            detail: message
          }));
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

        // Handle pong response with connection quality analysis
        if (message.type === 'pong') {
          const responseTime = Date.now() - lastPingTime.current;
          pingResponseTime.current = responseTime;

          // Update connection quality based on response time
          if (responseTime < 200) {
            setConnectionQuality('good');
          } else if (responseTime < 1000) {
            setConnectionQuality('poor');
          }

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

        // Setting lastMessage in useWebSocket
        setLastMessage(messageWithTimestamp);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      // WebSocket connection closed
      setIsConnected(false);
      setConnectionQuality('disconnected');
      reconnectAttempts.current++;

      // Smart reconnection with exponential backoff, but cap at 5 seconds max
      if (event.code !== 1000) {
        const baseDelay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current - 1), 5000);
        const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
        const delay = Math.min(baseDelay + jitter, 5000);

        // Reconnecting with backoff
        setTimeout(() => {
          if (user && (!ws.current || ws.current.readyState === WebSocket.CLOSED)) {
            // Reconnecting for active player
            setIsConnected(false);
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

    // Enhanced heartbeat with connection quality monitoring - send ping every 15 seconds
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        lastPingTime.current = Date.now();
        ws.current.send(JSON.stringify({ 
          type: 'ping', 
          timestamp: lastPingTime.current,
          keepAlive: true 
        }));
      }
    }, 30000); // Optimized ping frequency for stable connections

    return () => {
      window.removeEventListener('send_websocket_ping', handleSendPing as EventListener);
      clearInterval(pingInterval); // Clean up heartbeat interval

      if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        ws.current.close();
      }
      ws.current = null;
    };
  }, [(user as any)?.userId || (user as any)?.id]); // Only recreate when user ID changes, not the entire user object

  const sendMessage = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // For poor connections, prioritize game moves over other messages
      if (connectionQuality === 'poor' && message.type === 'move') {
        // Skip other queued messages and send move immediately
        messageQueue.current = messageQueue.current.filter(m => m.type === 'move');
        // Priority move sent on poor connection
      } else {
        // Sending WebSocket message
      }

      ws.current.send(JSON.stringify(message));

      // Process any queued messages after successful send
      while (messageQueue.current.length > 0 && ws.current.readyState === WebSocket.OPEN) {
        const queuedMessage = messageQueue.current.shift();
        if (queuedMessage) {
          // Sending queued message
          ws.current.send(JSON.stringify(queuedMessage));
        }
      }
    } else {
      // Queue critical messages for retry when connection is restored
      if (['move', 'join_room', 'join_room_request', 'start_game_request', 'auth'].includes(message.type)) {
        messageQueue.current.push(message);
        // Queued critical message for retry
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
              try {
                const backupUser = localStorage.getItem('backup_user_data');
                if (backupUser) {
                  const parsedUser = JSON.parse(backupUser);
                  userId = parsedUser?.userId || parsedUser?.id;
                }
              } catch (error) {
                console.warn('Failed to read backup user data:', error);
              }
            }

            const authMessage = {
              type: 'auth',
              userId: userId,
            };

            console.log('🔄 Refreshed WebSocket connection with userId:', userId);
            ws.current?.send(JSON.stringify(authMessage));
          };

          ws.current.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);

              if (message.type === 'chat_message_received') {
                const chatEvent = new CustomEvent('chat_message_received', {
                  detail: message
                });
                window.dispatchEvent(chatEvent);
              }

              if (message.type === 'room_invitation') {
                const invitationEvent = new CustomEvent('room_invitation_received', {
                  detail: message.invitation
                });
                window.dispatchEvent(invitationEvent);
              }

              if (message.type === 'player_left_win') {
                console.log('🏆 WebSocket: Player left win message received:', message);

                const playerLeftWinEvent = new CustomEvent('player_left_win', {
                  detail: message
                });
                window.dispatchEvent(playerLeftWinEvent);

                return;
              }

              if (message.type === 'game_abandoned') {
                const toastMessage = message.message || "Game ended because a player left the room.";

                // Create notification using safe DOM methods to prevent XSS
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
                titleDiv.textContent = 'Game Ended'; // Safe: uses textContent

                const messageDiv = document.createElement('div');
                messageDiv.style.cssText = 'font-size: 14px; opacity: 0.9;';
                messageDiv.textContent = toastMessage; // Safe: uses textContent instead of innerHTML

                containerDiv.appendChild(titleDiv);
                containerDiv.appendChild(messageDiv);
                notificationDiv.appendChild(containerDiv);
                document.body.appendChild(notificationDiv);

                setTimeout(() => {
                  if (notificationDiv.parentNode) {
                    document.body.removeChild(notificationDiv);
                  }
                }, 5000);

                localStorage.removeItem('currentGameState');
                sessionStorage.removeItem('currentGameState');

                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);

                return;
              }

              if (message.type === 'spectator_left') {
                localStorage.removeItem('currentGameState');
                sessionStorage.removeItem('currentGameState');
                localStorage.removeItem('currentRoomState');
                sessionStorage.removeItem('currentRoomState');

                const spectatorTransitionEvent = new CustomEvent('spectator_transition_to_ai', {
                  detail: {
                    message: message.message || 'You have left the room',
                    targetMode: 'ai'
                  }
                });

                window.dispatchEvent(spectatorTransitionEvent);

                return;
              }

              if (message.type === 'reconnection_room_join') {
                window.dispatchEvent(new CustomEvent('reconnection_room_join', {
                  detail: message
                }));
              }

              if (message.type === 'game_reconnection') {
                window.dispatchEvent(new CustomEvent('game_reconnection', {
                  detail: message
                }));
              }

              if (message.type === 'online_users_update' || message.type === 'user_offline') {
                window.dispatchEvent(new CustomEvent('online_status_update', {
                  detail: message
                }));
              }

              const messageWithTimestamp = {
                ...message,
                timestamp: Date.now()
              };

              if (['match_found', 'matchmaking_success', 'matchmaking_response', 'game_started'].includes(message.type)) {
                console.log('🎮 WebSocket: Received matchmaking message:', message.type, messageWithTimestamp);

                const matchmakingEvent = new CustomEvent('matchmaking_message_received', {
                  detail: messageWithTimestamp
                });
                window.dispatchEvent(matchmakingEvent);
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
    connectionQuality,
    sendMessage,
    joinRoom,
    leaveRoom,
    refreshConnection,
  };
}