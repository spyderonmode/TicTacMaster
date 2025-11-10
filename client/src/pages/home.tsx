import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";
// useAudio hook removed as sound effects are removed
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { GameBoard } from "@/components/GameBoard";
import { GameModeSelector } from "@/components/GameModeSelector";
import { ProfileManager } from "@/components/ProfileManager";
// AudioControls component removed as requested
import { RoomManager } from "@/components/RoomManager";
import { PlayerList } from "@/components/PlayerList";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { GameOverModal } from "@/components/GameOverModal";
import { PlayAgainRequestDialog } from "@/components/PlayAgainRequestDialog";
import { EmailVerificationModal } from "@/components/EmailVerificationModal";
import { MatchmakingModal } from "@/components/MatchmakingModal";
import { OnlineUsersModal } from "@/components/OnlineUsersModal";
import { ThemeSelector } from "@/components/ThemeSelector";
import { AchievementModal } from "@/components/AchievementModal";
import { LevelUpModal } from "@/components/LevelUpModal";
import { Friends } from "@/components/Friends";
import { InvitationPopup } from "@/components/InvitationPopup";
import { Leaderboard } from "@/components/Leaderboard";
import { ShareButton } from "@/components/ShareButton";
import { UserProfileModal } from "@/components/UserProfileModal";
import MonthlyRankPopup from "@/components/MonthlyRankPopup";
import { GiftReceivedNotification } from "@/components/GiftReceivedNotification";
import { ErrorModal } from "@/components/ErrorModal";
import { ConnectingOverlay } from "@/components/ConnectingOverlay";
import { QuickChat } from "@/components/QuickChat";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { GamepadIcon, LogOut, User, Zap, Loader2, Users, Settings, Menu, X, Palette, Trophy, Languages, BookOpen, ShoppingBag } from "lucide-react";
import { logout } from "@/lib/firebase";
import { useTranslation } from "@/contexts/LanguageContext";
import { CustomLanguageSelector } from "@/components/CustomLanguageSelector";
import { useLocation } from "wouter";
import { formatNumber } from "@/lib/utils";


export default function Home() {
  const { user } = useAuth();
  const { isConnected, lastMessage, joinRoom, leaveRoom, sendMessage, refreshConnection } = useWebSocket();
  const { isOnline: actualOnlineStatus } = useOnlineStatus();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  // Sound effects removed as requested
  const [selectedMode, setSelectedMode] = useState<'ai' | 'pass-play' | 'online'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [currentGame, setCurrentGame] = useState<any>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showMatchmaking, setShowMatchmaking] = useState(false);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showHeaderSidebar, setShowHeaderSidebar] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isResettingState, setIsResettingState] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [playAgainRequest, setPlayAgainRequest] = useState<any>(null);
  const [showPlayAgainRequest, setShowPlayAgainRequest] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<any>(null);
  const [showMonthlyRankPopup, setShowMonthlyRankPopup] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(5);
  const [monthlyRankData, setMonthlyRankData] = useState<any>(null);
  const [showGiftNotification, setShowGiftNotification] = useState(false);
  const [giftNotificationData, setGiftNotificationData] = useState<any>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState<{ title: string; message: string; type?: 'error' | 'coins' | 'warning' }>({ title: '', message: '' });
  const [showGameRules, setShowGameRules] = useState(false);
  const headerSidebarRef = useRef<HTMLDivElement>(null);
  const gameBoardRef = useRef<HTMLDivElement>(null);

  const playAgainRequestRef = useRef<any>(null);
  const showPlayAgainRequestRef = useRef<boolean>(false);

  useEffect(() => {
    playAgainRequestRef.current = playAgainRequest;
    showPlayAgainRequestRef.current = showPlayAgainRequest;
  }, [playAgainRequest, showPlayAgainRequest]);

  const { data: userStats } = useQuery({
    queryKey: ["/api/users", (user as any)?.userId, "online-stats"],
    enabled: !!user && !!(user as any)?.userId,
  });

  // Get current user's role in the room (to check if they're a spectator)
  const { data: roomParticipants = [] } = useQuery({
    queryKey: ["/api/rooms", currentRoom?.id, "participants"],
    enabled: !!currentRoom?.id && !!user,
    refetchInterval: 10000,
    staleTime: 8000,
  });

  // Check if current user is a spectator
  const currentUserParticipant = (roomParticipants as any[]).find((p: any) => p.userId === ((user as any)?.userId || (user as any)?.id));
  const isSpectator = currentUserParticipant?.role === 'spectator';

  // Prefetch leaderboard data on app load to eliminate wait time
  useEffect(() => {
    if (user) {
      queryClient.prefetchQuery({
        queryKey: ['/api/leaderboard/weekly', language],
        queryFn: async () => {
          const response = await fetch('/api/leaderboard/weekly?limit=50', { credentials: 'include' });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        },
        staleTime: 60000,
      });
      queryClient.prefetchQuery({
        queryKey: ['/api/leaderboard/time-left'],
        queryFn: async () => {
          const response = await fetch('/api/leaderboard/time-left');
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          return await response.json();
        },
        staleTime: 0,
      });
    }
  }, [user, language, queryClient]);

  // Global error handler for all WebSocket error events
  useEffect(() => {
    const handleCreateRoomError = (event: any) => {
      const { message } = event.detail;
      const isCoinsError = message && message.toLowerCase().includes('coins');
      setErrorModalData({
        title: isCoinsError ? 'Insufficient Coins' : 'Create Room Error',
        message: message || 'Failed to create room. Please try again.',
        type: isCoinsError ? 'coins' : 'error'
      });
      setShowErrorModal(true);
    };

    const handleJoinRoomError = (event: any) => {
      const { message } = event.detail;
      const isCoinsError = message && message.toLowerCase().includes('coins');
      setErrorModalData({
        title: isCoinsError ? 'Insufficient Coins' : 'Join Room Error',
        message: message || 'Failed to join room. Please try again.',
        type: isCoinsError ? 'coins' : 'error'
      });
      setShowErrorModal(true);
    };

    const handleStartGameError = (event: any) => {
      const { message } = event.detail;
      setErrorModalData({
        title: 'Start Game Error',
        message: message || 'Failed to start game. Please try again.',
        type: 'error'
      });
      setShowErrorModal(true);
    };

    const handleMoveError = (event: any) => {
      const { error } = event.detail;
      setErrorModalData({
        title: 'Move Error',
        message: error || 'Invalid move. Please try again.',
        type: 'warning'
      });
      setShowErrorModal(true);
    };

    const handleAutoPlayError = (event: any) => {
      const { error } = event.detail;
      setErrorModalData({
        title: 'Auto-play Error',
        message: error || 'Auto-play failed. Please try again.',
        type: 'warning'
      });
      setShowErrorModal(true);
    };

    window.addEventListener('create_room_error', handleCreateRoomError);
    window.addEventListener('join_room_error', handleJoinRoomError);
    window.addEventListener('start_game_error', handleStartGameError);
    window.addEventListener('move_error', handleMoveError);
    window.addEventListener('auto_play_error', handleAutoPlayError);

    return () => {
      window.removeEventListener('create_room_error', handleCreateRoomError);
      window.removeEventListener('join_room_error', handleJoinRoomError);
      window.removeEventListener('start_game_error', handleStartGameError);
      window.removeEventListener('move_error', handleMoveError);
      window.removeEventListener('auto_play_error', handleAutoPlayError);
    };
  }, []);

  // Check if email verification is required
  useEffect(() => {
    if (user && (user as any).email && !(user as any).isEmailVerified) {
      setShowEmailVerification(true);
    }
  }, [user]);

  // Check for pending level ups when user loads home
  useEffect(() => {
    const checkPendingLevelUps = async () => {
      if (!user) return;
      if (showGameOver) return; // Don't show level up if game over modal is showing

      try {
        const response = await fetch('/api/level-ups/pending', {
          credentials: 'include'
        });

        if (response.ok) {
          const levelUps = await response.json();
          if (levelUps.length > 0) {
            // Show the most recent level up
            const latestLevelUp = levelUps[0];
            setLevelUpData(latestLevelUp);
            setShowLevelUp(true);
          }
        }
      } catch (error) {
        console.error('Error checking for level ups:', error);
      }
    };

    checkPendingLevelUps();
  }, [user, showGameOver]);

  // Check for pending monthly rank popup when user loads home
  useEffect(() => {
    const checkPendingRankPopup = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/user/pending-rank-popup', {
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.hasPendingPopup && result.rankData) {
            setMonthlyRankData(result.rankData);
            setShowMonthlyRankPopup(true);
          }
        }
      } catch (error) {
        console.error('Error checking for pending rank popup:', error);
        toast({
          title: 'Error',
          description: 'Failed to check for rank updates',
          variant: 'destructive',
        });
      }
    };

    checkPendingRankPopup();
  }, [user, toast]);

  // Handle level up acknowledgment
  const handleLevelUpAcknowledge = async () => {
    if (!levelUpData) return;

    try {
      const response = await fetch(`/api/level-ups/${levelUpData.id}/acknowledge`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setShowLevelUp(false);
        setLevelUpData(null);

        // Check if there are more level ups to show
        const pendingResponse = await fetch('/api/level-ups/pending', {
          credentials: 'include'
        });

        if (pendingResponse.ok) {
          const remainingLevelUps = await pendingResponse.json();
          if (remainingLevelUps.length > 0) {
            // Show the next level up
            const nextLevelUp = remainingLevelUps[0];
            setLevelUpData(nextLevelUp);
            setShowLevelUp(true);
          }
        }
      }
    } catch (error) {
      console.error('Error acknowledging level up:', error);
    }
  };

  // Handle game over modal close - check for pending level ups after closing
  const handleGameOverClose = async () => {
    setShowGameOver(false);

    // Small delay to ensure smooth transition before checking for level ups
    setTimeout(async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/level-ups/pending', {
          credentials: 'include'
        });

        if (response.ok) {
          const levelUps = await response.json();
          if (levelUps.length > 0) {
            const latestLevelUp = levelUps[0];
            setLevelUpData(latestLevelUp);
            setShowLevelUp(true);
          }
        }
      } catch (error) {
        console.error('Error checking for level ups after game over:', error);
      }
    }, 300); // 300ms delay for smooth transition
  };

  // Close header sidebar when clicking outside or via custom event
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerSidebarRef.current && !headerSidebarRef.current.contains(event.target as Node)) {
        // Check if the click is on a theme selector dialog or any other modal
        const target = event.target as Element;
        if (target.closest('[data-radix-portal]') || 
            target.closest('[role="dialog"]') ||
            target.closest('[data-state="open"]')) {
          return; // Don't close sidebar if clicking on a dialog or modal
        }
        setShowHeaderSidebar(false);
      }
    };

    const handleCloseHeaderSidebar = () => {
      setShowHeaderSidebar(false);
    };

    if (showHeaderSidebar) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('closeHeaderSidebar', handleCloseHeaderSidebar);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('closeHeaderSidebar', handleCloseHeaderSidebar);
      };
    }
  }, [showHeaderSidebar]);

  // Listen for spectator transition to AI events
  useEffect(() => {
    const handleSpectatorTransitionToAI = (event: any) => {
      try {
        // Show toast notification
        toast({
          title: "Left Room",
          description: event.detail?.message || "You have left the room.",
          duration: 2000,
        });

        // Immediate smooth state transition to AI mode without any delays
        setCurrentGame(null);
        setCurrentRoom(null);
        setSelectedMode('ai');
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);

        // Initialize a fresh AI game
        setTimeout(() => {
          setCurrentGame({
            id: `local-game-${Date.now()}`,
            gameMode: 'ai',
            status: 'active',
            board: {},
            currentPlayer: 'X',
            playerXId: (user as any)?.userId || (user as any)?.id || '',
            playerOId: 'AI',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }, 100);

      } catch (error) {
        // Fallback to simple state reset
        setCurrentGame(null);
        setCurrentRoom(null);
        setSelectedMode('ai');
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);
      }
    };

    window.addEventListener('spectator_transition_to_ai', handleSpectatorTransitionToAI);

    return () => {
      window.removeEventListener('spectator_transition_to_ai', handleSpectatorTransitionToAI);
    };
  }, [toast, user]);

  // Listen for leaderboard open events
  useEffect(() => {
    const handleOpenLeaderboard = () => {
      setShowLeaderboard(true);
    };

    window.addEventListener('openLeaderboard', handleOpenLeaderboard);
    return () => window.removeEventListener('openLeaderboard', handleOpenLeaderboard);
  }, []);

  // Listen for gift received events
  useEffect(() => {
    const handleGiftReceived = (event: any) => {
      console.log('🎁 Gift received event:', event.detail);
      setGiftNotificationData(event.detail);
      setShowGiftNotification(true);
    };

    window.addEventListener('gift_received', handleGiftReceived);
    return () => window.removeEventListener('gift_received', handleGiftReceived);
  }, []);

  // Listen for game abandonment custom events
  useEffect(() => {
    const handleGameAbandoned = (event: any) => {
      console.log('🏠 Game abandoned custom event received:', event.detail);
      try {
        // Immediate transition to prevent blinking - no delays
        setIsResettingState(true);

        // Batch all state changes in a single synchronous update to prevent flickering
        setCurrentGame(null);
        setCurrentRoom(null);
        setSelectedMode('ai');
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);

        toast({
          title: "Game Ended",
          description: event.detail.message || "Game ended because a player left the room.",
          variant: "destructive",
        });

        // Quick reset without delay to prevent visual artifacts
        setTimeout(() => {
          setIsResettingState(false);
          initializeLocalGame();
        }, 50);
      } catch (error) {
        console.error('🏠 Error handling game abandonment:', error);
        // Force page reload as fallback
        window.location.reload();
      }
    };

    window.addEventListener('game_abandoned', handleGameAbandoned);

    // Handle play again request events
    const handlePlayAgainRequest = (event: any) => {
      try {
        const requestData = event.detail;
        console.log('🔄 Play again request received:', requestData);

        const newRequest = {
          id: requestData.requestId,
          requesterId: requestData.requesterId,
          requestedId: requestData.requestedId,
          gameId: requestData.gameId,
          status: requestData.status || 'pending',
          requestedAt: requestData.requestedAt || new Date().toISOString(),
          requester: requestData.requester,
          game: requestData.game
        };

        if (!showPlayAgainRequestRef.current) {
          setPlayAgainRequest(newRequest);
          setShowPlayAgainRequest(true);
          console.log('✅ Play again request dialog opened');
        } else {
          console.log('⚠️ Play again request already showing, ignoring duplicate');
        }
      } catch (error) {
        console.error('❌ Error handling play again request:', error);
      }
    };

    window.addEventListener('play_again_request_received', handlePlayAgainRequest);

    // Handle play again rejection - redirect to AI table
    const handlePlayAgainRejected = (event: any) => {
      try {
        const rejectionData = event.detail;
        console.log('❌ Play again rejected, redirecting to AI table:', rejectionData);

        // Close any existing game over modal or play again dialog
        setShowGameOver(false);
        setShowPlayAgainRequest(false);
        setPlayAgainRequest(null);
        setGameResult(null);

        // Transition to AI mode (home page with local games)
        setCurrentGame(null);
        setCurrentRoom(null);
        setSelectedMode('ai');

        // Show notification
        toast({
          title: "Play Again Declined",
          description: "The play again request was declined. Starting a new AI game.",
          duration: 3000,
        });

        // Initialize a fresh AI game after a short delay
        setTimeout(() => {
          initializeLocalGame();
        }, 500);
      } catch (error) {
        console.error('❌ Error handling play again rejection:', error);
      }
    };

    window.addEventListener('play_again_rejected_received', handlePlayAgainRejected);

    // Handle play again countdown
    const handlePlayAgainCountdown = (event: any) => {
      try {
        const countdownData = event.detail;
        console.log('⏳ Play again countdown:', countdownData.countdown);

        // If countdown is 0 or less, hide the overlay immediately
        if (countdownData.countdown <= 0) {
          setShowCountdown(false);
          return;
        }

        // Close game over modal and play again request dialog
        setShowGameOver(false);
        setShowPlayAgainRequest(false);

        // Show countdown overlay
        setCountdownNumber(countdownData.countdown);
        setShowCountdown(true);
      } catch (error) {
        console.error('❌ Error handling countdown:', error);
      }
    };

    window.addEventListener('play_again_countdown', handlePlayAgainCountdown);

    // Handle play again error
    const handlePlayAgainError = (event: any) => {
      try {
        const errorData = event.detail;
        console.log('❌ Play again error:', errorData.error);

        setShowPlayAgainRequest(false);
        setPlayAgainRequest(null);

        toast({
          variant: "destructive",
          title: "Cannot Play Again",
          description: errorData.error || "Unable to start play again. Please try again.",
          duration: 5000,
        });
      } catch (error) {
        console.error('❌ Error handling play again error:', error);
      }
    };

    window.addEventListener('play_again_error', handlePlayAgainError as EventListener);

    // Handle play again response (for the requester)
    const handlePlayAgainResponse = (event: any) => {
      try {
        const responseData = event.detail;
        console.log('🔄 Play again response received:', responseData);

        if (responseData.response === 'rejected') {
          setShowGameOver(false);
          toast({
            description: "Your play again request was declined",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('❌ Error handling play again response:', error);
      }
    };

    window.addEventListener('play_again_response_received', handlePlayAgainResponse as EventListener);

    // Handle room reconnection events
    const handleRoomReconnection = (event: any) => {
      const message = event.detail;
      console.log('🏠 Room reconnection event received:', message.room?.id);

      if (message.room) {
        // Restore room state immediately
        setCurrentRoom(message.room);
        setSelectedMode('online');
        console.log('✅ Room reconnection processed - Room ID:', message.room.id);
      }
    };

    // Handle immediate game reconnection events
    const handleGameReconnection = (event: any) => {
      const message = event.detail;
      console.log('🔄 Immediate reconnection event received:', message.game?.id);

      if (message.game && message.roomId) {
        // Restore room state first if not already set
        if (!currentRoom || currentRoom.id !== message.roomId) {
          // Room state will be set by reconnection_room_join message
          console.log('🏠 Waiting for room reconnection...');
        }

        // Restore game state immediately and consistently
        setSelectedMode('online');
        setCurrentGame({
          ...message.game,
          status: 'active',
          gameMode: 'online',
          timestamp: Date.now(),
          syncTimestamp: Date.now()
        });

        // Clear any interfering states
        setIsCreatingGame(false);
        setShowGameOver(false);
        setGameResult(null);
        setShowMatchmaking(false);

        console.log('✅ Immediate reconnection processed');
      }
    };

    // Handle navigation to AI mode event from GameBoard
    const handleNavigateToAI = () => {
      console.log('🤖 Navigating to AI mode smoothly (no reload)');

      // Clear all online game state
      setCurrentGame(null);
      setCurrentRoom(null);
      setShowGameOver(false);
      setGameResult(null);
      setIsCreatingGame(false);
      setShowMatchmaking(false);

      // Switch to AI mode
      setSelectedMode('ai');

      // Initialize local AI game
      setTimeout(() => {
        initializeLocalGame();
      }, 100);
    };

    window.addEventListener('reconnection_room_join', handleRoomReconnection);
    window.addEventListener('game_reconnection', handleGameReconnection);
    window.addEventListener('navigate_to_ai_mode', handleNavigateToAI);

    // Handle matchmaking messages (including game_started from play again)
    const handleMatchmakingMessage = (event: any) => {
      const message = event.detail;
      console.log('🎮 Matchmaking message received:', message.type, message);

      if (message.type === 'game_started') {
        console.log('🎮 Game started from matchmaking message - processing...');

        // Handle game start - ensure both players transition to game
        if (message.game && message.roomId) {
          console.log('🎮 Processing game_started from play again - closing dialogs and setting game state');

          // Close any existing dialogs (but NOT countdown - let it finish naturally)
          setShowPlayAgainRequest(false);
          setPlayAgainRequest(null);
          setShowGameOver(false);
          setGameResult(null);
          setIsMatchmaking(false);
          setShowMatchmaking(false);
          // NOTE: Don't hide countdown here - it will hide automatically when it reaches 0
          // or when the game becomes active (handled by separate useEffect)

          // Force close matchmaking modal
          window.dispatchEvent(new CustomEvent('force_close_matchmaking', {
            detail: { reason: 'game_started_from_play_again', timestamp: Date.now() }
          }));

          // Set game mode to online
          setSelectedMode('online');

          // Set the room state immediately
          setCurrentRoom({
            id: message.roomId,
            status: 'playing',
            code: message.room?.code || 'ONLINE'
          });

          // Set the complete game state from the server message
          setCurrentGame({
            ...message.game,
            board: message.game.board || {},
            gameMode: 'online',
            status: 'active'
          });

          console.log('✅ Game state set from play again - Game ID:', message.game.id, 'Room ID:', message.roomId);

          // No notification needed for game start

          // Scroll to game board
          setTimeout(() => {
            const gameBoard = document.getElementById('tic-tac-toe-board');
            if (gameBoard) {
              gameBoard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center'
              });
            }
          }, 100);
        }
      }
    };

    window.addEventListener('matchmaking_message_received', handleMatchmakingMessage);

    return () => {
      window.removeEventListener('game_abandoned', handleGameAbandoned);
      window.removeEventListener('play_again_request_received', handlePlayAgainRequest);
      window.removeEventListener('play_again_rejected_received', handlePlayAgainRejected);
      window.removeEventListener('play_again_countdown', handlePlayAgainCountdown);
      window.removeEventListener('play_again_error', handlePlayAgainError as EventListener);
      window.removeEventListener('play_again_response_received', handlePlayAgainResponse as EventListener);
      window.removeEventListener('reconnection_room_join', handleRoomReconnection);
      window.removeEventListener('game_reconnection', handleGameReconnection);
      window.removeEventListener('navigate_to_ai_mode', handleNavigateToAI);
      window.removeEventListener('matchmaking_message_received', handleMatchmakingMessage);
    };
  }, []); // Remove toast dependency to prevent effect recreation

  // Track shown toasts to prevent duplicates
  const [shownGameStartedToasts, setShownGameStartedToasts] = useState<Set<string>>(new Set());

  // Clear toast tracking when games end to prevent memory buildup
  useEffect(() => {
    if (currentGame?.status === 'finished' || currentGame?.status === 'abandoned') {
      const currentGameKey = `${currentGame.id}-${currentRoom?.id}`;
      setShownGameStartedToasts(prev => {
        const updated = new Set(prev);
        updated.delete(currentGameKey);
        return updated;
      });
    }
  }, [currentGame?.status, currentGame?.id, currentRoom?.id]);

  // Hide countdown when game becomes active
  useEffect(() => {
    if (currentGame && currentGame.status === 'active') {
      setShowCountdown(false);
    }
  }, [currentGame, currentGame?.status]);

  useEffect(() => {
    if (lastMessage) {
      // Home received WebSocket message
      // Message type being processed
      switch (lastMessage.type) {
        case 'online_users_update':
          setOnlineUserCount(lastMessage.count);
          break;
        case 'chat_message_received':
          // Event is already dispatched by useWebSocket hook, no need to dispatch again
          break;
        case 'user_offline':
          // Dispatch custom event for chat history cleanup
          window.dispatchEvent(new CustomEvent('user_offline', {
            detail: lastMessage
          }));
          break;
        case 'game_started':
          console.log('🎮 Game started message received in home.tsx:', lastMessage);
          console.log('🎮 Message has game?', !!lastMessage.game, 'Message has roomId?', !!lastMessage.roomId);

          // Handle game start from WebSocket - ensure both players transition
          if (lastMessage.game && lastMessage.roomId) {
            console.log('🎮 Processing game_started - closing matchmaking modal and setting game state');

            // CRITICAL FIX: Force close matchmaking modal when game starts
            // Note: Don't hide countdown here - let it finish displaying naturally
            setIsMatchmaking(false);
            setShowMatchmaking(false);
            handleMatchmakingClose();

            // Dispatch global event to force close any stuck modals
            window.dispatchEvent(new CustomEvent('force_close_matchmaking', {
              detail: { reason: 'game_started', timestamp: Date.now() }
            }));

            // CRITICAL FIX: Force UI refresh for proper game board display
            setIsResettingState(true);

            // Clear any conflicting storage
            localStorage.removeItem('currentGameState');
            sessionStorage.removeItem('currentGameState');
            localStorage.removeItem('currentRoomState');
            sessionStorage.removeItem('currentRoomState');

            setTimeout(() => {
              // Ensure game mode is set to online when receiving game_started
              setSelectedMode('online');

              // Set the room state immediately
              setCurrentRoom({
                id: lastMessage.roomId,
                status: 'playing',
                code: lastMessage.room?.code || 'ONLINE'
              });

              // Set the complete game state from the server message
              const gameData = {
                ...lastMessage.game,
                status: 'active',
                gameMode: 'online',
                roomId: lastMessage.roomId,
                board: lastMessage.game.board || {},
                currentPlayer: lastMessage.game.currentPlayer || 'X',
                timestamp: Date.now()
              };

              console.log('🎮 Setting game state:', gameData);
              setCurrentGame(gameData);

              // Reset creating state since game was successfully created
              setIsCreatingGame(false);
              setShowGameOver(false);

              // CRITICAL FIX: Clear play again request state when new game starts
              setShowPlayAgainRequest(false);
              setPlayAgainRequest(null);
              setGameResult(null);
              setIsResettingState(false);

              // Show game started toast only once per game
              const gameToastKey = `${lastMessage.game.id}-${lastMessage.roomId}`;
              if (!shownGameStartedToasts.has(gameToastKey)) {
                setShownGameStartedToasts(prev => new Set([...prev, gameToastKey]));
                toast({
                  title: "Game Started!",
                  description: "Your match has begun. Good luck!",
                  duration: 3000,
                });
              }

              // Auto-scroll to game board when game starts - fixed timing issues
              console.log('🔄 About to trigger auto-scroll to game board');
              // Use requestAnimationFrame to ensure DOM is ready, then scroll
              requestAnimationFrame(() => {
                setTimeout(() => {
                  console.log('📍 Attempting to scroll to game board, ref exists:', !!gameBoardRef.current);
                  if (gameBoardRef.current) {
                    console.log('📍 GameBoardRef element:', gameBoardRef.current);
                    gameBoardRef.current.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                    console.log('✅ Successfully scrolled to game board');
                  } else {
                    console.warn('⚠️ GameBoard ref not found, scroll failed');
                  }
                }, 150); // Single timeout with optimized delay
              });
            }, 100); // Ensure proper state synchronization

            // Invalidate queries to refresh room data
            queryClient.invalidateQueries({ queryKey: ["/api/rooms", lastMessage.roomId, "participants"] });
          }
          break;
        case 'move':
          // Handle move updates from WebSocket - FOR BOTH PLAYERS AND SPECTATORS
          // Enhanced move handling - match by gameId OR roomId to ensure spectators see moves
          const isCurrentGame = currentGame && lastMessage.gameId === currentGame.id;
          const isCurrentRoom = currentRoom && lastMessage.roomId === currentRoom.id;

          if (isCurrentGame || isCurrentRoom) {
            // Update or create game state for everyone (players and spectators)
            setCurrentGame(prevGame => {
              // If we have a currentGame, update it
              if (prevGame && prevGame.id === lastMessage.gameId) {
                return {
                  ...prevGame,
                  board: lastMessage.board,
                  currentPlayer: lastMessage.currentPlayer,
                  lastMove: lastMessage.position,
                  lastMoveAt: lastMessage.lastMoveAt || prevGame.lastMoveAt,
                  serverTime: lastMessage.serverTime || prevGame.serverTime,
                  timeRemaining: lastMessage.timeRemaining || prevGame.timeRemaining,
                  playerXInfo: lastMessage.playerXInfo || prevGame.playerXInfo,
                  playerOInfo: lastMessage.playerOInfo || prevGame.playerOInfo,
                  timestamp: Date.now(), // Force re-render
                  syncTimestamp: Date.now() // Single update with sync timestamp
                };
              } else if (lastMessage.gameId) {
                // Create new game state for spectators or reconnecting players OR if game ID changed
                return {
                  id: lastMessage.gameId,
                  roomId: lastMessage.roomId || currentRoom?.id,
                  gameMode: 'online' as const,
                  status: 'active' as const,
                  board: lastMessage.board,
                  currentPlayer: lastMessage.currentPlayer,
                  lastMove: lastMessage.position,
                  lastMoveAt: lastMessage.lastMoveAt,
                  serverTime: lastMessage.serverTime,
                  timeRemaining: lastMessage.timeRemaining,
                  playerXInfo: lastMessage.playerXInfo,
                  playerOInfo: lastMessage.playerOInfo,
                  timestamp: Date.now(),
                  syncTimestamp: Date.now()
                };
              } else {
                return prevGame;
              }
            });
          }
          break;
        case 'auto_move':
          // Handle auto-play moves - same as regular moves but from AI
          const isCurrentGameAuto = currentGame && lastMessage.gameId === currentGame.id;
          const isCurrentRoomAuto = currentRoom && lastMessage.roomId === currentRoom.id;

          if (isCurrentGameAuto || isCurrentRoomAuto) {
            // Auto-play move received (logging removed to prevent spam)
            // Update or create game state for everyone (players and spectators)
            setCurrentGame(prevGame => {
              // If we have a currentGame, update it
              if (prevGame && prevGame.id === lastMessage.gameId) {
                return {
                  ...prevGame,
                  board: lastMessage.board,
                  currentPlayer: lastMessage.currentPlayer,
                  lastMove: lastMessage.position,
                  lastMoveAt: lastMessage.lastMoveAt || prevGame.lastMoveAt,
                  serverTime: lastMessage.serverTime || prevGame.serverTime,
                  timeRemaining: lastMessage.timeRemaining || prevGame.timeRemaining,
                  playerXInfo: lastMessage.playerXInfo || prevGame.playerXInfo,
                  playerOInfo: lastMessage.playerOInfo || prevGame.playerOInfo,
                  autoPlayActive: lastMessage.player, // Track which player is in auto-play
                  timestamp: Date.now(), // Force re-render
                  syncTimestamp: Date.now() // Single update with sync timestamp
                };
              } else {
                // Create new game state for spectators or reconnecting players
                return {
                  id: lastMessage.gameId,
                  roomId: lastMessage.roomId || currentRoom?.id,
                  gameMode: 'online',
                  status: 'active',
                  board: lastMessage.board,
                  currentPlayer: lastMessage.currentPlayer,
                  lastMove: lastMessage.position,
                  lastMoveAt: lastMessage.lastMoveAt,
                  serverTime: lastMessage.serverTime,
                  timeRemaining: lastMessage.timeRemaining,
                  playerXInfo: lastMessage.playerXInfo,
                  playerOInfo: lastMessage.playerOInfo,
                  timestamp: Date.now(),
                  syncTimestamp: Date.now()
                };
              }
            });
          }
          break;
        case 'auto_play_enabled':
          // Handle auto-play activation notification
          if (currentGame && lastMessage.gameId === currentGame.id) {
            setCurrentGame(prevGame => ({
              ...prevGame,
              autoPlayActive: lastMessage.player,
              timestamp: Date.now()
            }));
          }
          break;
        case 'auto_play_disabled':
          // Handle auto-play deactivation notification
          if (currentGame && lastMessage.gameId === currentGame.id) {
            setCurrentGame(prevGame => ({
              ...prevGame,
              autoPlayActive: null,
              timestamp: Date.now()
            }));
          }
          break;
        case 'auto_play_disabled_success':
          // Handle successful auto-play disabling with user feedback
          if (currentGame && lastMessage.gameId === currentGame.id) {
            toast({
              title: "Auto-Play Disabled",
              description: lastMessage.message || "You've regained control! Make your next move.",
            });
            setCurrentGame(prevGame => ({
              ...prevGame,
              autoPlayActive: null,
              timestamp: Date.now()
            }));
          }
          break;
        case 'auto_play_error':
          // Handle auto-play error messages
          if (lastMessage.gameId === currentGame?.id) {
            console.error('❌ Auto-play error:', lastMessage.error);
            toast({
              title: "Auto-Play Error",
              description: lastMessage.error || "Failed to disable auto-play",
              variant: "destructive",
            });
          }
          break;
        case 'winning_move':
          // Handle winning move with position highlighting
          if (currentGame && lastMessage.gameId === currentGame.id) {
            //console.log('🎮 Winning move received:', lastMessage);
            setCurrentGame(prevGame => ({
              ...prevGame,
              board: lastMessage.board,
              currentPlayer: lastMessage.currentPlayer,
              lastMove: lastMessage.position,
              winningPositions: lastMessage.winningPositions,
              timestamp: Date.now()
            }));
          }
          break;
        case 'game_over':
          // Handle game over from WebSocket
          if (currentGame && lastMessage.gameId === currentGame.id) {
            // Sound effects removed as requested
            const userId = user?.userId || user?.id;
            //console.log('🎮 Game over message received:', lastMessage);
            //console.log('🎮 Winner info from server:', lastMessage.winnerInfo);
            //console.log('🎮 Player X Info:', lastMessage.playerXInfo || currentGame.playerXInfo);
            //console.log('🎮 Player O Info:', lastMessage.playerOInfo || currentGame.playerOInfo);

            // Helper function to detect if board is full (draw condition)
            const isBoardFull = (board: any) => {
              if (!board) return false;
              const validPositions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
              return validPositions.every(pos => board[pos.toString()]);
            };

            // Determine condition - if winner is null and board is full, it's a draw
            const gameCondition = lastMessage.condition || 
              (lastMessage.winner === null && isBoardFull(lastMessage.board) ? 'draw' : null);

            // Create comprehensive result object with all player info
            const gameResult = {
              winner: lastMessage.winner,
              condition: gameCondition,
              board: lastMessage.board,
              winnerInfo: lastMessage.winnerInfo,
              playerXInfo: lastMessage.playerXInfo || currentGame.playerXInfo,
              playerOInfo: lastMessage.playerOInfo || currentGame.playerOInfo,
              game: {
                ...currentGame,
                gameMode: currentGame.gameMode || 'online'
              }
            };

            //console.log('🎮 Setting complete game result:', gameResult);
            setGameResult(gameResult);

            // Invalidate stats cache to update user stats immediately
            console.log('📊 Game ended - refreshing user stats cache');
            queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.userId, "online-stats"] });
            queryClient.invalidateQueries({ queryKey: ['/api/users/online'] });
            queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });

            // Call individual stats API to ensure immediate update
            if (userId) {
              console.log(`📊 Fetching updated stats for user: ${userId}`);
              fetch(`/api/users/${userId}/stats`, {
                credentials: 'include'
              }).then(response => {
                if (response.ok) {
                  return response.json();
                } else {
                  throw new Error('Failed to fetch stats');
                }
              }).then(stats => {
                console.log('✅ User stats fetched and updated:', stats);
                // Force re-invalidate after successful fetch
                queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.userId, "online-stats"] });
                queryClient.invalidateQueries({ queryKey: ['/api/users/online'] });
              }).catch(error => {
                console.error('❌ Error fetching user stats:', error);
              });
            }

            // Close all modals to prevent blocking the game over modal
            setShowOnlineUsers(false);
            setShowProfile(false);
            setShowAchievements(false);
            setShowLeaderboard(false);
            setShowCreateRoom(false);
            setShowMatchmaking(false);
            setShowHeaderSidebar(false);

            setShowGameOver(true);

            // Note: Removed auto-close behavior for bot games to allow users to properly see the win/loss popup
          }
          break;
        case 'player_left':
          // Handle player leaving room
          if (currentRoom && lastMessage.roomId === currentRoom.id) {
            //console.log('🎮 Player left room:', lastMessage);
            // Show notification about player leaving
          }
          break;
        case 'room_ended':
          // Handle room ending - refresh the page
          if (currentRoom && lastMessage.roomId === currentRoom.id) {
            //console.log('🎮 Room ended, refreshing page');
            toast({
              title: "Room Ended",
              description: `${lastMessage.playerName || 'A player'} left the room. Refreshing page...`,
                duration: 1000,
            });
            // Reset to AI mode after a short delay
            setTimeout(() => {
              setCurrentGame(null);
              setCurrentRoom(null);
              setSelectedMode('ai');
              setShowGameOver(false);
              setGameResult(null);
              setIsCreatingGame(false);
            }, 1000);
          }
          break;
        case 'spectator_left':
          // This case is now handled by custom event spectator_left_smooth for smooth transitions
          console.log('👀 Spectator left handled by custom event');
          break;
        case 'match_found':
        case 'matchmaking_response': 
        case 'matchmaking_success':
          // Handle all matchmaking success scenarios
          console.log('🎮 Matchmaking success received:', lastMessage.type, lastMessage);
          console.log('🎮 Current matchmaking state - isMatchmaking:', isMatchmaking, 'showMatchmaking:', showMatchmaking);

          // IMMEDIATELY force close all matchmaking UI states
          console.log('🎮 EMERGENCY CLOSE: Forcing all matchmaking states to false');
          setIsMatchmaking(false);
          setShowMatchmaking(false);

          // Force update the DOM by triggering a re-render
          setTimeout(() => {
            setIsMatchmaking(false);
            setShowMatchmaking(false);
            console.log('🎮 SECONDARY CLOSE: Double-checking matchmaking modal closure');
          }, 10);

          // Handle the room joining
          if (lastMessage.room) {
            console.log('🎮 Setting room from matchmaking success:', lastMessage.room.id);
            setCurrentRoom(lastMessage.room);
            setSelectedMode('online'); // Ensure we're in online mode

            // Join the room via WebSocket to receive game updates
            joinRoom(lastMessage.room.id);

            toast({
              title: "Match Found!",
              description: lastMessage.message || "You've been matched with an opponent. Game starting...",
            });
          } else {
            console.log('🎮 Warning: No room data in matchmaking message');
          }
          break;

        case 'reconnection_room_join':
          //console.log('🔄 Reconnection room join:', lastMessage);
          if (lastMessage.room) {
            handleRoomJoin(lastMessage.room);
            toast({
              title: "Reconnected!",
              description: lastMessage.message || "You've been reconnected to your game room.",
            });
          }
          break;
        case 'game_reconnection':
          //console.log('🔄 Processing game reconnection:', lastMessage);
          if (lastMessage.game && lastMessage.roomId) {
            //console.log('✅ Restoring game state:', lastMessage.game.id);

            // Restore game state immediately - room state will be handled by reconnection_room_join
            setSelectedMode('online');
            setCurrentGame({
              ...lastMessage.game,
              status: 'active',
              gameMode: 'online',
              timestamp: Date.now(),
              syncTimestamp: Date.now()
            });

            // Reset any modal states that might interfere
            setIsCreatingGame(false);
            setShowGameOver(false);
            setGameResult(null);
            setShowMatchmaking(false);

            toast({
              title: "Game Reconnected",
              description: "Your game has been restored successfully.",
            });

            //console.log('✅ Game reconnection completed');
          }
          break;
        case 'player_reconnected':
          //console.log('🔄 Player reconnected:', lastMessage);
          // Notification hidden to prevent spam when users reconnect
          break;
        case 'game_expired':
          console.log('⏰ Game expired:', lastMessage);
          // Prevent multiple resets and effects from triggering
          setIsResettingState(true);

          setTimeout(() => {
            // Batch all state changes in a single update - preserve selectedMode
            setCurrentGame(null);
            setCurrentRoom(null);
            // Don't reset selectedMode - keep user's preference
            setShowGameOver(false);
            setGameResult(null);
            setIsCreatingGame(false);

            toast({
              title: "Game Expired",
              description: lastMessage.message || "Game expired due to inactivity. Returning to lobby.",
              variant: "destructive",
            });

            // Complete reset and initialize game only if in AI mode
            setTimeout(() => {
              setIsResettingState(false);
              if (selectedMode === 'ai') {
                initializeLocalGame();
              }
            }, 200);
          }, 350);
          break;
        case 'player_left_win':
          // This case is now handled directly in WebSocket hook for immediate response
          console.log('🏆 Player left win handled by WebSocket hook');
          break;
        case 'game_abandoned':
          //console.log('🏠 HOME USEEFFECT: Game abandoned - player left:', lastMessage);
          //console.log('🏠 HOME USEEFFECT: Current game state:', currentGame);
          //console.log('🏠 HOME USEEFFECT: Current room state:', currentRoom);
          //console.log('🏠 HOME USEEFFECT: Processing game abandonment via lastMessage');

          try {
            // Immediate transition to prevent blinking - no delays
            setIsResettingState(true);

            // Batch all state changes in a single synchronous update to prevent flickering
            setCurrentGame(null);
            setCurrentRoom(null);
            // Don't reset selectedMode - keep user's preference for online mode
            setShowGameOver(false);
            setGameResult(null);
            setIsCreatingGame(false);

            toast({
              title: "Game Ended",
              description: lastMessage.message || "Game ended because a player left the room.",
              variant: "destructive",
            });

            // Quick reset without delay to prevent visual artifacts
            setTimeout(() => {
              try {
                setIsResettingState(false);
                // Only initialize local game if user was in AI mode
                if (selectedMode === 'ai') {
                  initializeLocalGame();
                }
              } catch (innerError) {
                console.error('🏠 Error in initializeLocalGame:', innerError);
                // Force page reload if local game initialization fails
                // Reset to clean state instead of reload
                setCurrentGame(null);
                setCurrentRoom(null);
                setSelectedMode('ai');
                setShowGameOver(false);
                setGameResult(null);
                setIsCreatingGame(false);
                setIsResettingState(false);
              }
            }, 50); // Minimal delay just for state synchronization
          } catch (error) {
            console.error('🏠 Error handling game abandonment in useEffect:', error);
            // Force page reload as fallback
            setCurrentGame(null);
            setCurrentRoom(null);
            setSelectedMode('ai');
            setShowGameOver(false);
            setGameResult(null);
            setIsCreatingGame(false);
            setIsResettingState(false);
          }
          break;
        case 'player_reaction':
          // Handle player reaction - this will be broadcast to all players and spectators
          if (currentGame && (lastMessage.gameId === currentGame.id || lastMessage.roomId === currentRoom?.id)) {
            console.log('🎮 Player reaction received:', lastMessage);
            // The reaction will be displayed by the GameBoard component
            // We don't need to handle it here as it's handled by the GameBoard component directly
          }
          break;
        case 'player_chat':
          // Handle player chat - this will be broadcast to all players and spectators
          if (currentGame && (lastMessage.gameId === currentGame.id || lastMessage.roomId === currentRoom?.id)) {
            //console.log('🎮 Player chat received:', lastMessage);
            // The chat will be displayed by the GameBoard component
            // We don't need to handle it here as it's handled by the GameBoard component directly
          }
          break;
        case 'play_again_request':
          console.log('🔄 Play again request received:', lastMessage);
          setPlayAgainRequest(lastMessage);
          setShowPlayAgainRequest(true);
          break;
        case 'play_again_response':
          console.log('🔄 Play again response received:', lastMessage);
          // Only show notification for declined requests
          if (lastMessage.response === 'rejected') {
            toast({
              description: "Your play again request was declined",
            });
          }
          break;
        case 'play_again_rejected':
          console.log('🔄 Play again request rejected, redirecting to home');
          // Clear all game and room state
          setCurrentGame(null);
          setCurrentRoom(null);
          setGameResult(null);
          setShowGameOver(false);
          setShowPlayAgainRequest(false);
          setPlayAgainRequest(null);
          // Redirect to home
          setLocation('/');
          toast({
            description: "Play again request was declined. Returning to home.",
          });
          break;
      }
    }
  }, [lastMessage, currentGame, currentRoom, user]);

  const handleRoomJoin = (room: any) => {
    //console.log('🏠 handleRoomJoin called with room:', room.id);
    //console.log('🏠 Current room before join:', currentRoom?.id);

    // Prevent duplicate room joins
    if (currentRoom && currentRoom.id === room.id) {
      //console.log('🏠 Already in this room, skipping duplicate join');
      return;
    }

    // Automatically switch to online mode when joining a room
    //console.log('🏠 Switching to online mode for room join');
    setSelectedMode('online');

    setCurrentRoom(room);
    joinRoom(room.id);
  };

  const handleRoomLeave = () => {
    if (currentRoom) {
      leaveRoom(currentRoom.id);
      setCurrentRoom(null);
    }
  };

  const handlePlayWithAI = () => {
    console.log('🤖 handlePlayWithAI called');

    // Clean up any matchmaking state first to prevent conflicts
    setIsMatchmaking(false);
    setShowMatchmaking(false);

    // Leave room if currently in one - this will trigger room end notification
    if (currentRoom) {
      console.log('🤖 Leaving room to start AI game:', currentRoom.id);

      // Send explicit leave message to notify other players FIRST
      const leaveMessage = {
        type: 'leave_room',
        roomId: currentRoom.id,
        userId: user?.userId || user?.id,
        playerName: user?.displayName || user?.firstName || user?.username || 'Player'
      };

      console.log('🤖 Sending leave message:', leaveMessage);
      sendMessage(leaveMessage);

      // Prevent multiple resets and effects from triggering
      setIsResettingState(true);

      setTimeout(() => {
        console.log('🤖 Cleaning up after leave message sent');
        // Batch all state changes and switch to AI mode
        setCurrentRoom(null);
        setCurrentGame(null);
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);
        setIsMatchmaking(false); // Ensure matchmaking is off
        setShowMatchmaking(false); // Ensure modal is closed
        setSelectedMode('ai'); // Switch to AI mode

        // Complete reset and initialize AI game
        setTimeout(() => {
          setIsResettingState(false);
          initializeLocalGame();
        }, 200);
      }, 400);
    } else {
      console.log('🤖 No current room, starting AI game directly');
      // Batch state changes to prevent screen blinking
      const resetState = () => {
        setCurrentRoom(null);
        setCurrentGame(null);
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);
        setIsMatchmaking(false); // Ensure matchmaking is off
        setShowMatchmaking(false); // Ensure modal is closed
        setSelectedMode('ai'); // Switch to AI mode
      };

      // Prevent multiple resets and effects from triggering
      setIsResettingState(true);

      setTimeout(() => {
        resetState();
        // Complete reset and initialize AI game
        setTimeout(() => {
          setIsResettingState(false);
          initializeLocalGame();
        }, 200);
      }, 350);
    }
  };

  const handleGameStart = (game: any) => {
    //console.log('🎮 handleGameStart called with game:', game);
    setCurrentGame(game);
  };

  const handleMatchmakingStart = () => {
    console.log('🎮 handleMatchmakingStart called - cleaning up all state');

    // Clean up any existing game/room state first to prevent conflicts
    if (currentGame) {
      console.log('🎮 Clearing existing game state before matchmaking');
      setCurrentGame(null);
    }

    if (currentRoom) {
      console.log('🎮 Clearing existing room state before matchmaking');
      setCurrentRoom(null);
    }

    // Reset any lingering game over state
    setShowGameOver(false);
    setGameResult(null);
    setIsCreatingGame(false);

    // Switch to online mode for matchmaking
    setSelectedMode('online');

    // Start matchmaking
    setShowMatchmaking(true);
    setIsMatchmaking(true);
  };

  const handleMatchmakingClose = () => {
    console.log('🎮 handleMatchmakingClose called - forcing modal closure');
    setShowMatchmaking(false);
    setIsMatchmaking(false);
  };

  const handleMatchFound = (room: any) => {
    console.log('🎮 handleMatchFound called - match found, processing...', room);

    // CRITICAL FIX: Force close all modals and reset states immediately
    setIsMatchmaking(false);
    setShowMatchmaking(false);

    // Clear any existing game state to prevent conflicts
    setCurrentGame(null);

    // Clear local storage that might interfere
    localStorage.removeItem('currentGameState');
    sessionStorage.removeItem('currentGameState');
    localStorage.removeItem('currentRoomState');
    sessionStorage.removeItem('currentRoomState');

    // CRITICAL FIX: Ensure proper UI refresh by forcing component re-render
    // This fixes the issue where the second player's game board doesn't refresh
    setIsResettingState(true);

    setTimeout(() => {
      // Set the room state and switch to online mode
      setSelectedMode('online');
      setCurrentRoom({
        id: room.id,
        code: room.code || 'ONLINE',
        status: room.status || 'waiting',
        name: room.name || 'Match Room',
        maxPlayers: room.maxPlayers || 2,
        ownerId: room.ownerId,
        isPrivate: room.isPrivate || false,
        createdAt: room.createdAt
      });

      // Clear any conflicting states
      setIsCreatingGame(false);
      setShowGameOver(false);
      setGameResult(null);
      setIsResettingState(false);

      // Join the room via WebSocket
      if (room.id) {
        console.log('🎮 Joining WebSocket room:', room.id);
        joinRoom(room.id);
      }

      // Show success toast
      toast({
        title: "Match Found!",
        description: "Connecting to your opponent...",
        duration: 2000,
      });

      console.log('🎮 Match found processing complete - room set and joined');
    }, 50); // Small delay for proper state synchronization
  };

  // Initialize local game for AI and pass-play modes when no game exists
  const initializeLocalGame = () => {
    if (selectedMode === 'ai' || selectedMode === 'pass-play') {
      //console.log('🎮 Initializing local game for mode:', selectedMode);
      const newGame = {
        id: `local-game-${Date.now()}`,
        board: {},
        currentPlayer: 'X',
        status: 'active',
        gameMode: selectedMode,
        aiDifficulty,
        playerXId: user?.userId || user?.id,
        playerOId: selectedMode === 'ai' ? 'ai' : 'player2',
        playerXInfo: {
          displayName: 'Player X',
          firstName: 'Player X',
          username: 'Player X'
        },
        playerOInfo: selectedMode === 'ai' ? {
          displayName: 'AI',
          firstName: 'AI',
          username: 'AI'
        } : {
          displayName: 'Player O',
          firstName: 'Player O',
          username: 'Player O'
        }
      };
      //console.log('🎮 Created local game:', newGame);
      setCurrentGame(newGame);
    }
  };

  // Auto-initialize game when switching to AI or pass-play mode
  useEffect(() => {
    if (isResettingState) return; // Skip during reset operations

    if (selectedMode === 'ai' || selectedMode === 'pass-play') {
      //console.log('🎮 Mode changed to:', selectedMode);
      // Clear any online game state first
      if (currentGame && currentGame.gameMode === 'online') {
        //console.log('🎮 Clearing online game state for local mode');
        setCurrentGame(null);
        setCurrentRoom(null);
        setShowGameOver(false);
        setGameResult(null);
        setIsCreatingGame(false);
      }

      // Initialize local game if no game exists or if switching from online
      if (!currentGame || currentGame.gameMode === 'online') {
        //console.log('🎮 Auto-initializing game for mode:', selectedMode);
        setTimeout(() => {
          initializeLocalGame();
        }, 100);
      }
    }
  }, [selectedMode, currentGame, user, isResettingState]);

  // Fix white screen issue by ensuring game exists for all modes
  useEffect(() => {
    if (isResettingState) return; // Skip during reset operations

    //console.log('🎮 Effect check - currentGame:', !!currentGame, 'currentRoom:', !!currentRoom, 'selectedMode:', selectedMode);
    if (!currentGame && !currentRoom && selectedMode !== 'online') {
      //console.log('🎮 White screen fix - initializing local game');
      initializeLocalGame();
    }
  }, [currentGame, currentRoom, selectedMode, user, isResettingState]);

  // Handle WebSocket game over events for online games
  useEffect(() => {
    const handleWebSocketGameOver = (event: any) => {
      const message = event.detail;
      console.log('🎮 WebSocket game over event received:', message);

      // Create enriched result object similar to local games but with WebSocket data
      const enrichedResult = {
        winner: message.winner,
        winnerName: message.winner === 'X' 
          ? (currentGame?.playerXInfo?.displayName || currentGame?.playerXInfo?.firstName || 'Player X')
          : message.winner === 'O' 
            ? (currentGame?.playerOInfo?.displayName || currentGame?.playerOInfo?.firstName || 'Player O')
            : null,
        condition: message.condition || 'unknown',
        game: currentGame ? {
          ...currentGame,
          gameMode: 'online',
          id: message.gameId || currentGame.id,
          playerXId: currentGame.playerXId,
          playerOId: currentGame.playerOId,
          betAmount: message.betAmount
        } : null,
        betAmount: message.betAmount, // Direct from WebSocket message
        playerXInfo: currentGame?.playerXInfo,
        playerOInfo: currentGame?.playerOInfo
      };

      console.log('🎮 Setting WebSocket game result:', enrichedResult);
      setGameResult(enrichedResult);
      setShowGameOver(true);

      // Refresh user stats cache for online games
      console.log('📊 Online game ended - refreshing user stats cache');
      queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.userId, "online-stats"] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/online'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
    };

    window.addEventListener('websocket_game_over', handleWebSocketGameOver);

    return () => {
      window.removeEventListener('websocket_game_over', handleWebSocketGameOver);
    };
  }, [currentGame, currentRoom, user, queryClient]);

  // Add effect to prevent game state loss on WebSocket reconnections
  useEffect(() => {
    if (currentGame && currentRoom && !isConnected) {
      //console.log('🔌 WebSocket disconnected but have game/room, maintaining state');
      // Don't reset game state on WebSocket disconnection
    }
  }, [isConnected, currentGame, currentRoom]);

  // Auto-rejoin room when WebSocket reconnects
  useEffect(() => {
    if (isConnected && currentRoom) {
      //console.log('🔌 WebSocket reconnected, rejoining room:', currentRoom.id);
      joinRoom(currentRoom.id);
    }
  }, [isConnected, currentRoom]);

  // Force game initialization when user becomes available
  useEffect(() => {
    if (isResettingState) return; // Skip during reset operations

    if (user && !currentGame && !currentRoom && selectedMode !== 'online') {
      //console.log('🎮 User available - initializing local game');
      initializeLocalGame();
    }
  }, [user, currentGame, currentRoom, selectedMode, isResettingState]);

  // Update AI difficulty when changed - reset the game
  useEffect(() => {
    if (currentGame && selectedMode === 'ai') {
      //console.log('🎮 AI difficulty changed, resetting game');
      // Reset the game completely when difficulty changes
      const newGame = {
        id: `local-game-${Date.now()}`,
        board: {},
        currentPlayer: 'X',
        status: 'active',
        gameMode: selectedMode,
        aiDifficulty,
        playerXId: user?.userId || user?.id,
        playerOId: 'ai',
        playerXInfo: {
          displayName: 'Player X',
          firstName: 'Player X',
          username: 'Player X'
        },
        playerOInfo: {
          displayName: 'AI',
          firstName: 'AI',
          username: 'AI'
        }
      };
      setCurrentGame(newGame);
    }
  }, [aiDifficulty, selectedMode, user]);

  const handleGameOver = async (result: any) => {
    console.log('🎮 handleGameOver called with result:', result);
    console.log('🎮 Current game:', currentGame);
    console.log('🎮 Current room:', currentRoom);

    // Include all necessary data for coin display in GameOverModal
    const enrichedResult = {
      winner: result?.winner || null,
      winnerName: result?.winnerName || (result?.winner === 'X' ? 'Player X' : result?.winner === 'O' ? (selectedMode === 'ai' ? 'AI' : 'Player O') : null),
      condition: result?.condition || 'unknown',
      game: currentGame ? {
        ...currentGame,
        gameMode: currentGame.gameMode || selectedMode,
        id: currentGame.id,
        playerXId: currentGame.playerXId,
        playerOId: currentGame.playerOId,
        betAmount: currentRoom?.betAmount || currentGame.betAmount
      } : null,
      betAmount: currentRoom?.betAmount || currentGame?.betAmount, // Include bet amount from room for online games
      playerXInfo: currentGame?.playerXInfo,
      playerOInfo: currentGame?.playerOInfo
    };

    console.log('🎮 Setting enriched game result:', enrichedResult);
    setGameResult(enrichedResult);
    setShowGameOver(true);

    // Award coins for AI game wins
    if (selectedMode === 'ai' && result?.winner === 'X' && user?.userId) {
      try {
        console.log('🪙 Player won AI game, awarding 100 coins');
        const response = await fetch('/api/coins/award', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.userId,
            amount: 100,
            reason: 'AI game win'
          })
        });

        if (response.ok) {
          console.log('🪙 Coins awarded successfully');
          // Refresh user data to show updated coin balance
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        } else {
          console.error('Failed to award coins:', response.status);
        }
      } catch (error) {
        console.error('Error awarding coins:', error);
      }
    }

    // Invalidate stats cache for local games too
    console.log('📊 Local game ended - refreshing user stats cache');
    queryClient.invalidateQueries({ queryKey: ["/api/users", (user as any)?.userId, "online-stats"] });
    queryClient.invalidateQueries({ queryKey: ['/api/users/online'] });
    queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
  };

  const handlePlayAgain = async () => {
    if (isCreatingGame) {
      //console.log('🎮 Already creating game, ignoring request');
      return;
    }

    setIsCreatingGame(true);

    if (selectedMode === 'online' && currentRoom) {
      // Check if opponent is a bot (ID starts with 'player_')
      // Also check gameResult for bot info if currentGame is not available
      const opponentIdFromGame = currentGame?.playerXId === (user as any)?.userId 
        ? currentGame?.playerOId 
        : currentGame?.playerXId;
      const opponentIdFromResult = gameResult?.game?.playerXId === (user as any)?.userId
        ? gameResult?.game?.playerOId
        : gameResult?.game?.playerXId;
      const opponentId = opponentIdFromGame || opponentIdFromResult;
      const isPlayingWithBot = opponentId && opponentId.startsWith('player_');

      // For online mode with bot, show 2-second countdown
      if (isPlayingWithBot) {
        const startBotGameCountdown = async () => {
          // IMMEDIATELY show countdown before clearing game state
          setCountdownNumber(2);
          setShowCountdown(true);

          // Then clear game state
          setCurrentGame(null);
          setShowGameOver(false);
          setGameResult(null);

          // Countdown: 2 -> 1
          await new Promise(resolve => setTimeout(resolve, 1000));
          setCountdownNumber(1);

          await new Promise(resolve => setTimeout(resolve, 1000));
          setShowCountdown(false);

          // Create new game after countdown
          try {
            const response = await fetch(`/api/rooms/${currentRoom.id}/start-game`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const newGame = await response.json();
              // Server will broadcast game_started to all participants

              // Reset creating state after game is created
              setIsCreatingGame(false);
            } else {
              setCurrentGame(null);
              setIsCreatingGame(false);
            }
          } catch (error) {
            setCurrentGame(null);
            setIsCreatingGame(false);
          }
        };

        startBotGameCountdown();
      } else {
        // For online mode with real player, create game immediately (they have their own 5-second countdown on server)
        try {
          //console.log('🎮 Creating new game for room:', currentRoom.id);

          // Clear the current game first to prevent using finished game
          setCurrentGame(null);
          setShowGameOver(false);
          setGameResult(null);

          const response = await fetch(`/api/rooms/${currentRoom.id}/start-game`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const newGame = await response.json();
            //console.log('🎮 New game created for play again:', newGame);
            //console.log('🎮 Game created successfully, waiting for server broadcast to all participants');

            // Don't set the game locally - let the server broadcast handle it
            // This ensures both players get the exact same game state at the same time

            // Sound effects removed as requested

            // Reset creating state after a short delay (server will send game_started)
            setTimeout(() => {
              setIsCreatingGame(false);
            }, 1000);
          } else {
            //console.error('Failed to create new game:', response.status);
            // Reset game state on error
            setCurrentGame(null);
            setIsCreatingGame(false);
          }
        } catch (error) {
          //console.error('Error starting new game:', error);
          // Reset game state on error
          setCurrentGame(null);
          setIsCreatingGame(false);
        }
      }
    } else {
      // For AI and pass-play modes, restart locally with countdown
      setShowGameOver(false);
      setGameResult(null);

      // Show 2-second countdown for bot games
      const startCountdown = async () => {
        // Countdown: 2, 1
        setCountdownNumber(2);
        setShowCountdown(true);

        await new Promise(resolve => setTimeout(resolve, 1000));
        setCountdownNumber(1);

        await new Promise(resolve => setTimeout(resolve, 1000));
        setShowCountdown(false);

        // Create new game after countdown
        const newGame = {
          id: `local-game-${Date.now()}`,
          board: {},
          currentPlayer: 'X',
          status: 'active',
          gameMode: selectedMode,
          aiDifficulty,
          playerXId: user?.userId || user?.id,
          playerOId: selectedMode === 'ai' ? 'ai' : 'player2',
          playerXInfo: {
            displayName: 'Player X',
            firstName: 'Player X',
            username: 'Player X'
          },
          playerOInfo: selectedMode === 'ai' ? {
            displayName: 'AI',
            firstName: 'AI',
            username: 'AI'
          } : {
            displayName: 'Player O',
            firstName: 'Player O',
            username: 'Player O'
          }
        };

        setCurrentGame(newGame);
        // Sound effects removed as requested

        // Reset creating state after game is created (after countdown completes)
        setIsCreatingGame(false);
      };

      startCountdown();
    }
  };



  return (
    <>
    <div className="relative min-h-screen bg-slate-900 text-white">
      {/* Background Graphics (animations removed for performance) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Dot Pattern Overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}></div>

        {/* Diagonal Lines */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 36px)',
        }}></div>
      </div>

      {/* Enhanced Navigation Header - Larger Topbar */}
      <nav className="sticky top-0 z-40 bg-slate-800 border-b border-slate-600 shadow-lg px-2 py-3 sm:px-4 sm:py-5 md:py-6">
        <div className="relative max-w-7xl mx-auto flex items-center justify-between">
          {/* Epic Gaming Profile Section - Larger Layout */}
          <div 
            className="flex items-center space-x-3 sm:space-x-4 md:space-x-7 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => setShowUserProfile(true)}
            title="Click to view your profile stats"
          >
            {/* Main Profile Display */}
            <div className="relative group">
              {/* Epic Profile Picture with Multiple Visual Effects */}
              <div className="relative">
                {/* Outer Glow Ring - Slightly larger */}
                <div className="absolute inset-0 w-11 h-11 sm:w-14 sm:h-14 md:w-20 md:h-20 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full blur-md opacity-75 group-hover:opacity-100 animate-pulse"></div>

                {/* Main Profile Picture Container - Slightly larger sizing */}
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-full p-0.5 sm:p-1 shadow-2xl">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover border-2 border-white/30 shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center border-2 border-white/30">
                      <User className="w-5 h-5 sm:w-7 sm:h-7 md:w-10 md:h-10 text-white" />
                    </div>
                  )}

                  {/* Online Status with Enhanced Glow - Mobile responsive */}
                  <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 sm:border-3 border-slate-800 ${actualOnlineStatus ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'} animate-pulse`}></div>

                  {/* Level Badge - Mobile responsive */}
                  <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs sm:text-sm font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg border border-yellow-300">
                    Lv.{userStats?.level || '0'}
                  </div>
                </div>

                {/* Floating Particles Effect - Hidden on very small screens */}
                <div className="absolute inset-0 pointer-events-none hidden sm:block">
                  <div className="absolute top-0 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                  <div className="absolute bottom-2 right-0 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-60 animation-delay-500"></div>
                  <div className="absolute top-3 right-6 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping opacity-50 animation-delay-1000"></div>
                </div>
              </div>
            </div>

            {/* Player Info with Gaming Stats - Larger Layout */}
            <div className="flex flex-col space-y-1 sm:space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <h2 className="text-sm sm:text-lg md:text-2xl font-black text-white truncate">
                  {user?.displayName || user?.firstName || user?.username || 'Player'}
                </h2>
                <div className={`flex items-center space-x-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold ${actualOnlineStatus ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${actualOnlineStatus ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                  <span className="hidden sm:inline">{actualOnlineStatus ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
              </div>

              {/* Epic Stats Display - Larger Layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-1.5 md:flex md:items-center md:space-x-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-1 bg-blue-500/20 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded border border-blue-500/30">
                  <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-xs sm:text-sm">{userStats?.wins || 0}</span>
                  <span className="text-blue-300 hidden sm:inline text-xs">Wins</span>
                </div>

                <div className="flex items-center space-x-1 bg-purple-500/20 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded border border-purple-500/30">
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400" />
                  <span className="text-orange-400 font-bold text-xs sm:text-sm">{userStats?.currentWinStreak || 0}</span>
                  <span className="text-purple-300 hidden sm:inline text-xs">Streak</span>
                </div>

                <div className="flex items-center space-x-1 bg-pink-500/20 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded border border-pink-500/30">
                  <span className="text-pink-400 font-bold text-xs sm:text-sm">{Math.round(((userStats?.wins || 0) / Math.max((userStats?.wins || 0) + (userStats?.losses || 0), 1)) * 100)}%</span>
                  <span className="text-pink-300 hidden sm:inline text-xs">Rate</span>
                </div>

                <div className="flex items-center space-x-1 bg-green-500/20 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded border border-green-500/30">
                  <span className="text-green-400 font-bold text-xs">🪙</span>
                  <span className="text-green-400 font-bold text-xs sm:text-sm">{formatNumber(userStats?.coins ?? 1000)}</span>
                  <span className="text-green-300 hidden sm:inline text-xs">Coins</span>
                </div>
              </div>
            </div>
          </div>



            {/* Enhanced Action Buttons - Larger Layout */}
            <div className="relative flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Leaderboard Button - Larger Size */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLeaderboard(true)}
                className="relative bg-gradient-to-r from-yellow-600 to-orange-600 border-yellow-500/50 text-white hover:from-yellow-500 hover:to-orange-500 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-xl shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 backdrop-blur-sm"
                data-testid="button-leaderboard"
              >
                <Trophy className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                <span className="hidden md:inline ml-2 font-semibold text-sm">{t('leaderboard') || 'Leaderboard'}</span>
              </Button>

              {/* Menu Button - Larger Size */}
              <div className="relative" ref={headerSidebarRef}>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHeaderSidebar(!showHeaderSidebar)}
                  className="relative bg-slate-700/80 border-slate-500/50 text-white hover:bg-slate-600/80 px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2.5 rounded-xl shadow-lg backdrop-blur-sm hover:shadow-slate-500/25 transition-all duration-300"
                >
                  {showHeaderSidebar ? (
                    <X className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  ) : (
                    <Menu className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  )}
                  <span className="hidden md:inline ml-2 font-semibold text-sm">Menu</span>
                </Button>

              {/* Header Sidebar */}
              {showHeaderSidebar && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-[9999] overflow-visible">
                  <div className="p-4 space-y-4 overflow-visible">
                    <div className="text-sm font-medium text-gray-300 border-b border-slate-700 pb-2">
                      {t('quickActions')}
                    </div>

                    {/* Language Selector */}
                    <div className="flex items-center justify-between overflow-visible">
                      <div className="flex items-center space-x-2">
                        <Languages className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('language')}</span>
                      </div>
                      <div className="relative z-[9999]">
                        <CustomLanguageSelector />
                      </div>
                    </div>

                    {/* Theme Selector */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Palette className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('theme')}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Theme change button clicked');
                          // Don't close the sidebar, just open theme selector
                          const event = new CustomEvent('openThemeSelector');
                          window.dispatchEvent(event);
                        }}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs cursor-pointer"
                      >
                        <Palette className="h-3 w-3 mr-1" />
                        {t('change')}
                      </Button>
                    </div>

                    {/* Friends */}
                    <div className="w-full">
                      <Friends />
                    </div>

                    {/* Online Players */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('onlineUsers')}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowOnlineUsers(true);
                          setShowHeaderSidebar(false);
                        }}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
                      >
                        {onlineUserCount} {t('playersLabel')}
                      </Button>
                    </div>

                    {/* Achievements */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('achievements')}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAchievements(true);
                          setShowHeaderSidebar(false);
                        }}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
                      >
                        <Trophy className="h-3 w-3 mr-1" />
                        {t('view')}
                      </Button>
                    </div>

                    {/* Share Game */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-300">{t('shareGame')}</span>
                      </div>
                      <ShareButton
                        title="TicTac 3x5 - Strategic Tic-Tac-Toe"
                        text="Join me for strategic tic-tac-toe on TicTac 3x5! It's more challenging than regular tic-tac-toe with diagonal-only wins."
                        variant="outline"
                        size="sm"
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
                      />
                    </div>

                    {/* Shop */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">Shop</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHeaderSidebar(false);
                          setLocation('/shop');
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500/50 text-white hover:from-purple-500 hover:to-pink-500 text-xs"
                        data-testid="button-shop-menu"
                      >
                        Visit
                      </Button>
                    </div>

                    {/* Profile Settings */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{t('profileSettings')}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHeaderSidebar(false);
                          // Give a small delay to ensure sidebar is closed before opening profile
                          setTimeout(() => {
                            setShowProfile(true);
                          }, 100);
                        }}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs"
                      >
{t('settings')}
                      </Button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-700 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logout()}
                        className="w-full bg-red-700 border-red-600 text-white hover:bg-red-600 justify-start"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
{t('logout')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Quick Chat Bar - Between Header and Game Board */}
      <QuickChat />

      {/* Main Content with relative positioning */}
      <div className="relative z-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Game Board Section */}
          <div ref={gameBoardRef} className="lg:col-span-2">
            {currentGame ? (
              <div>
                <GameBoard 
                  key={currentGame?.id}
                  game={currentGame}
                  onGameOver={handleGameOver}
                  gameMode={selectedMode}
                  user={user}
                  lastMessage={lastMessage}
                  sendMessage={sendMessage}
                  isSpectator={isSpectator}
                />
              </div>
            ) : (
              <div className="text-center p-8 text-gray-400">
                <p>No active game. Select a game mode to start playing.</p>
              </div>
            )}

            {/* Game Rules - Small Trigger Card */}
            <Card 
              className="mt-4 sm:mt-6 bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500/50 cursor-pointer hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25" 
              onClick={() => setShowGameRules(true)}
              data-testid="card-game-rules-trigger"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">{t('gameRules')}</h3>
                    <p className="text-white/80 text-xs">{t('clickToView') || 'Click to view rules'}</p>
                  </div>
                </div>
                <div className="text-white/60">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Game Mode Selection */}
            <GameModeSelector 
              selectedMode={selectedMode}
              onModeChange={(mode) => {
                // Sound effects removed as requested
                setSelectedMode(mode);
              }}
              aiDifficulty={aiDifficulty}
              onDifficultyChange={setAiDifficulty}
            />



            {/* Online Room Management */}
            {selectedMode === 'online' && (
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">{t('onlineMode')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {!currentRoom && (
                      <>
                        <div className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20">
                          <div className="text-center space-y-3">
                            <div className="text-sm font-semibold text-blue-300">{t('quickMatch')}</div>
                            <p className="text-xs text-gray-400">
                              {t('getMatchedWithAnotherPlayer')}
                            </p>
                            <Button 
                              onClick={handleMatchmakingStart}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              disabled={isMatchmaking}
                            >
                              {isMatchmaking ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {t('thinking')}
                                </>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4 mr-2" />
                                  {t('findMatch')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="text-center text-sm text-gray-500">
                          <span>{t('or')}</span>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-gray-300 mb-2">
                            {t('createOrJoinRoom')}
                          </p>
                        </div>
                      </>
                    )}

                    {currentRoom && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">{t('connectedToRoom')} {currentRoom.code}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Room Management */}
            {selectedMode === 'online' && (
              <RoomManager 
                currentRoom={currentRoom}
                onRoomJoin={handleRoomJoin}
                onRoomLeave={handleRoomLeave}
                onCreateRoom={() => setShowCreateRoom(true)}
                onGameStart={handleGameStart}
                gameMode={selectedMode}
                user={user}
              />
            )}

            {/* Players & Spectators */}
            {currentRoom && (
              <PlayerList roomId={currentRoom.id} />
            )}

            {/* Audio Controls removed as requested */}

            {/* Game Statistics */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">{t('gameStats')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 text-center">
                  <div className="p-2 sm:p-3 bg-slate-700 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-blue-500">
                      {userStats?.wins || 0}
                    </div>
                    <div className="text-xs text-gray-400">{t('wins')}</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-700 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-red-500">
                      {userStats?.losses || 0}
                    </div>
                    <div className="text-xs text-gray-400">{t('losses')}</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-700 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-yellow-500">
                      {userStats?.draws || 0}
                    </div>
                    <div className="text-xs text-gray-400">{t('draws')}</div>
                  </div>
                  <div className="p-2 sm:p-3 bg-slate-700 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-gray-400">
                      {(userStats?.wins || 0) + (userStats?.losses || 0) + (userStats?.draws || 0)}
                    </div>
                    <div className="text-xs text-gray-400">{t('total')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Game Rules Modal */}
      <Dialog open={showGameRules} onOpenChange={setShowGameRules}>
        <DialogContent className="max-w-[90%] md:max-w-[70%] max-h-[90vh] md:max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700" data-testid="dialog-game-rules">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-400" />
              {t('gameRules')}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {t('gameRulesDescription') || 'Learn how to play TicTac 3x5'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Grid Layout */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{t('gridLayout')}</h3>
                  <p className="text-gray-300 text-sm">{t('gridDescription') || 'The game is played on a 3x5 grid with 15 positions (numbered 1-15)'}</p>
                </div>
              </div>
            </div>

            {/* Win Conditions */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                {t('winConditionsTitle') || 'Win Conditions'}
              </h3>

              <div className="space-y-4">
                {/* Horizontal Win */}
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('horizontalWin')}</h4>
                    <p className="text-gray-400 text-sm">{t('horizontalWinDescription') || '4 consecutive symbols in any row'}</p>
                  </div>
                </div>

                {/* Vertical Win */}
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('verticalWin')}</h4>
                    <p className="text-gray-400 text-sm">{t('verticalWinDescription') || '3 consecutive symbols in any column'}</p>
                  </div>
                </div>

                {/* Diagonal Win */}
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('diagonalWin')}</h4>
                    <p className="text-gray-400 text-sm">{t('diagonalWinDescription') || '3 consecutive symbols diagonally (positions 5, 10, 15 excluded)'}</p>
                  </div>
                </div>

                {/* First Move Rule */}
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-white font-medium mb-1">{t('firstMoveRule')}</h4>
                    <p className="text-gray-400 text-sm">{t('firstMoveRuleDescription') || 'The center position (8) cannot be played on the first move'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-700">
              <Button 
                onClick={() => setShowGameRules(false)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                data-testid="button-close-rules"
              >
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      {/* End of Main Content Wrapper */}

    </div>

    {/* Modals - Rendered outside main container to avoid z-index stacking context issues */}
      <CreateRoomModal 
        open={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        onRoomCreated={handleRoomJoin}
        currentRoom={currentRoom}
        leaveRoom={leaveRoom}
      />

      <GameOverModal 
        open={showGameOver}
        onClose={handleGameOverClose}
        result={gameResult}
        onPlayAgain={handlePlayAgain}
        isCreatingGame={isCreatingGame}
        onPlayWithAI={handlePlayWithAI}
        isSpectator={isSpectator}
        currentUser={user ? {
          userId: (user as any).userId || (user as any).id,
          username: (user as any).username || 'Unknown',
          displayName: (user as any).displayName || (user as any).firstName || (user as any).username
        } : null}
      />

      <PlayAgainRequestDialog
        open={showPlayAgainRequest}
        onClose={() => {
          setShowPlayAgainRequest(false);
          setPlayAgainRequest(null);
        }}
        request={playAgainRequest}
      />

      {showEmailVerification && user?.email && (
        <EmailVerificationModal 
          email={user.email}
          onClose={() => setShowEmailVerification(false)}
        />
      )}

      <MatchmakingModal 
        open={showMatchmaking}
        onClose={handleMatchmakingClose}
        onMatchFound={handleMatchFound}
        user={user}
        isWebSocketConnected={isConnected}
        refreshWebSocketConnection={refreshConnection}
        currentRoom={currentRoom}
        leaveRoom={leaveRoom}
      />

      <OnlineUsersModal 
        open={showOnlineUsers}
        onClose={() => setShowOnlineUsers(false)}
        currentRoom={currentRoom}
        user={user}
      />

      <LevelUpModal 
        open={showLevelUp}
        onClose={handleLevelUpAcknowledge}
        userDisplayName={(user as any)?.displayName || (user as any)?.firstName || (user as any)?.username || 'Player'}
        newLevel={levelUpData?.newLevel || 1}
        previousLevel={levelUpData?.previousLevel || 0}
        userProfilePicture={(user as any)?.profilePicture || (user as any)?.photoURL}
      />

      {/* Monthly Rank Popup */}
      {showMonthlyRankPopup && monthlyRankData && (
        <MonthlyRankPopup
          isOpen={showMonthlyRankPopup}
          onClose={() => {
            setShowMonthlyRankPopup(false);
            setMonthlyRankData(null);
          }}
          rankData={monthlyRankData}
          userDisplayName={(user as any)?.displayName || (user as any)?.firstName || (user as any)?.username || 'Player'}
          userProfileImage={(user as any)?.profilePicture || (user as any)?.photoURL}
        />
      )}

      {/* Gift Received Notification */}
      {showGiftNotification && giftNotificationData && (
        <GiftReceivedNotification
          gift={giftNotificationData}
          onClose={() => {
            setShowGiftNotification(false);
            setGiftNotificationData(null);
          }}
        />
      )}

      {/* Play Again Countdown Overlay */}
      {showCountdown && (
        <div 
          className="z-[10001]"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div style={{
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '120px',
              fontWeight: 'bold',
              marginBottom: '24px',
              animation: 'pulse 0.5s ease-in-out',
              textShadow: '0 0 30px rgba(59, 130, 246, 0.8)'
            }}>
              {countdownNumber}
            </div>
            <div style={{
              fontSize: '24px',
              opacity: 0.9,
              fontWeight: '500'
            }}>
              Starting new game...
            </div>
          </div>
        </div>
      )}

      {/* Global Error Modal */}
      <ErrorModal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={errorModalData.title}
        message={errorModalData.message}
        type={errorModalData.type}
      />

      <ProfileManager 
        user={user}
        open={showProfile}
        onClose={() => setShowProfile(false)}
      />

      <ThemeSelector />

      <AchievementModal 
        open={showAchievements}
        onClose={() => setShowAchievements(false)}
        user={user}
      />

      <Leaderboard 
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        trigger={<></>}
      />

      <UserProfileModal
        open={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        userId={user?.userId || user?.id || ''}
        username={user?.username || ''}
        displayName={user?.displayName || user?.firstName || user?.username || 'Player'}
        profilePicture={user?.profilePicture}
        profileImageUrl={user?.profileImageUrl}
        selectedAchievementBorder={user?.selectedAchievementBorder}
      />

      <InvitationPopup onRoomJoin={handleRoomJoin} />

      {/* Connecting overlay for online games */}
      <ConnectingOverlay 
        isVisible={selectedMode === 'online' && !isConnected && (!!currentGame || !!currentRoom)}
      />
    </>
  );
}