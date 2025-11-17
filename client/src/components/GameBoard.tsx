import { useState, useEffect, useMemo, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
// useAudio hook removed as sound effects are removed
// Force file update to clear cache
// Removed useWebSocket import - messages now come from parent component
import { isUnauthorizedError } from "@/lib/authUtils";
import { motion, AnimatePresence } from "framer-motion"; // Added back for winning line animation
import { useTheme } from "@/contexts/ThemeContext";
import { User, MessageCircle, Gift } from "lucide-react";
import { QuickChatPanel } from '@/components/QuickChatPanel';
import { useTranslation } from "@/contexts/LanguageContext";
import { PlayerProfileModal } from '@/components/PlayerProfileModal';
import { AnimatedPiece } from '@/components/AnimatedPieces';
import { AvatarWithFrame } from '@/components/AvatarWithFrame';
import { EmojiPicker } from '@/components/EmojiPicker';

const VALID_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Player quick chat system
interface PlayerMessage {
  text: string;
  duration: number;
}

const QUICK_CHAT_MESSAGES = [
  { text: 'Good luck!', duration: 4000 },
  { text: 'Well played!', duration: 3500 },
  { text: 'Nice move!', duration: 3000 },
  { text: 'Great strategy!', duration: 3500 },
  { text: 'Play faster!', duration: 3000 },
  { text: 'Take your time', duration: 3500 },
  { text: 'Good game!', duration: 4000 },
  { text: 'Thanks for the game!', duration: 3000 },
  { text: 'One more?', duration: 3000 },
  { text: 'Impressive!', duration: 3500 },
  { text: 'Thinking...', duration: 4000 },
  { text: 'Ready to play!', duration: 3000 }
];

// Helper function to check if player has Legend achievement
const hasLegendAchievement = (achievements: any[]): boolean => {
  return achievements?.some(achievement => achievement.achievementType === 'legend') || false;
};

// Helper function to check if player has Champion achievement (100 wins)
const hasChampionAchievement = (achievements: any[]): boolean => {
  return achievements?.some(achievement => achievement.achievementType === 'champion') || false;
};

// Helper function to check if player has Grandmaster achievement (200 wins)
const hasGrandmasterAchievement = (achievements: any[]): boolean => {
  return achievements?.some(achievement => achievement.achievementType === 'grandmaster') || false;
};

// Helper function to check if player has Ultimate Veteran achievement (500 games)
const hasUltimateVeteranAchievement = (achievements: any[]): boolean => {
  return achievements?.some(achievement => achievement.achievementType === 'ultimate_veteran') || false;
};

// Helper function to get the selected achievement border for display
const getSelectedAchievementBorder = (playerInfo: any): string | null => {
  // If player has selectedAchievementBorder, use that (including null for no border)
  if (playerInfo?.selectedAchievementBorder !== undefined) {
    return playerInfo.selectedAchievementBorder;
  }

  // Fallback to auto-detection of highest achievement for legacy users
  const achievements = playerInfo?.achievements || [];
  if (hasUltimateVeteranAchievement(achievements)) return 'ultimate_veteran';
  if (hasGrandmasterAchievement(achievements)) return 'grandmaster';
  if (hasChampionAchievement(achievements)) return 'champion';
  if (hasLegendAchievement(achievements)) return 'legend';

  return null; // No border
};

// Helper function to render achievement borders based on selected type (Optimized with CSS)
const renderAchievementBorder = (borderType: string | null, playerName: string, theme: any) => {
  switch (borderType) {
    case 'ultimate_veteran':
      return (
        <div
          className="px-2 py-1 rounded-lg border-2 bg-gradient-to-r from-red-900/25 via-orange-800/25 to-red-900/25 relative overflow-hidden achievement-ultimate-veteran"
          style={{ borderColor: '#ff6347' }}
        >
          <span className={`text-base ${theme.textColor} max-w-32 truncate font-extrabold relative z-10`}>
            {playerName}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/15 to-transparent animate-shimmer"></div>
        </div>
      );
    case 'grandmaster':
      return (
        <div
          className="px-2 py-1 rounded-lg border-2 bg-gradient-to-r from-indigo-900/20 via-gray-800/20 to-purple-900/20 relative achievement-grandmaster"
          style={{ borderColor: '#818cf8' }}
        >
          <span className={`text-base ${theme.textColor} max-w-32 truncate font-bold`}>
            {playerName}
          </span>
        </div>
      );
    case 'champion':
      return (
        <div
          className="px-2 py-1 rounded-lg border-2 bg-gradient-to-r from-purple-900/15 via-blue-900/15 to-purple-900/15 achievement-champion"
          style={{ borderColor: '#8a2be2' }}
        >
          <span className={`text-base ${theme.textColor} max-w-32 truncate font-bold`}>
            {playerName}
          </span>
        </div>
      );
    case 'legend':
      return (
        <div
          className="px-2 py-1 rounded-md border-2 bg-orange-900/15 achievement-legend"
          style={{ borderColor: '#ff4500' }}
        >
          <span className={`text-base ${theme.textColor} max-w-32 truncate font-bold`}>
            {playerName}
          </span>
        </div>
      );
    case 'level_100_master':
    case 'level100Master':
      return (
        <div
          className="px-2 py-1 rounded-lg border-2 bg-gradient-to-r from-amber-900/30 via-yellow-800/30 to-amber-900/30 relative achievement-level-100"
          style={{ borderColor: '#fbbf24' }}
        >
          <span className={`text-base ${theme.textColor} max-w-32 truncate font-extrabold relative z-10`}>
            {playerName}
          </span>
        </div>
      );
    default:
      return (
        <span className={`text-base ${theme.textColor} max-w-32 truncate`}>
          {playerName}
        </span>
      );
  }
};

// Function to get winning positions for highlighting
const getWinningPositions = (board: Record<string, string>, player: string): number[] => {
  // Check horizontal wins: Row 1 and Row 3 need 4 consecutive, Row 2 (middle) needs all 5
  const edgeRows = [
    [1, 2, 3, 4, 5],      // Row 1
    [11, 12, 13, 14, 15]  // Row 3
  ];

  for (const row of edgeRows) {
    for (let i = 0; i <= row.length - 4; i++) {
      const positions = row.slice(i, i + 4);
      if (positions.every(pos => board[pos.toString()] === player)) {
        return positions;
      }
    }
  }

  // Row 2 (middle): Check for ALL 5 consecutive tokens
  const middleRow = [6, 7, 8, 9, 10];
  if (middleRow.every(pos => board[pos.toString()] === player)) {
    return middleRow;
  }

  // Check vertical wins
  const columns = [
    [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
  ];

  for (const column of columns) {
    if (column.every(pos => board[pos.toString()] === player)) {
      return column;
    }
  }

  // Check diagonal wins
  const diagonals = [
    [1, 7, 13], [2, 8, 14], [3, 7, 11], [4, 8, 12]
  ];

  for (const diagonal of diagonals) {
    if (diagonal.every(pos => board[pos.toString()] === player)) {
      return diagonal;
    }
  }

  return [];
};

// AI helper functions for different difficulty levels
const findBestMove = (board: Record<string, string>, availableMoves: number[]): number | null => {
  // Try to win first
  for (const move of availableMoves) {
    const testBoard = { ...board, [move.toString()]: 'O' };
    if (checkWinSimple(testBoard, 'O')) {
      return move;
    }
  }

  // Try to block player win
  for (const move of availableMoves) {
    const testBoard = { ...board, [move.toString()]: 'X' };
    if (checkWinSimple(testBoard, 'X')) {
      return move;
    }
  }

  return null;
};

const findBestMoveHard = (board: Record<string, string>, availableMoves: number[]): number | null => {
  // Try to win first
  for (const move of availableMoves) {
    const testBoard = { ...board, [move.toString()]: 'O' };
    if (checkWinSimple(testBoard, 'O')) {
      return move;
    }
  }

  // Try to block player win
  for (const move of availableMoves) {
    const testBoard = { ...board, [move.toString()]: 'X' };
    if (checkWinSimple(testBoard, 'X')) {
      return move;
    }
  }

  // Strategic positioning: prefer center and corners
  const strategicMoves = [8, 1, 3, 11, 13, 7, 9]; // Center first, then corners and edges
  for (const move of strategicMoves) {
    if (availableMoves.includes(move)) {
      return move;
    }
  }

  return null;
};

const checkWinSimple = (board: Record<string, string>, player: string): boolean => {
  // Check horizontal: Row 1 and Row 3 need 4 consecutive, Row 2 (middle) needs all 5
  const edgeRows = [
    [1, 2, 3, 4, 5],      // Row 1
    [11, 12, 13, 14, 15]  // Row 3
  ];

  for (const row of edgeRows) {
    for (let i = 0; i <= row.length - 4; i++) {
      const positions = row.slice(i, i + 4);
      if (positions.every(pos => board[pos.toString()] === player)) {
        return true;
      }
    }
  }

  // Row 2 (middle): Check for ALL 5 consecutive tokens
  const middleRow = [6, 7, 8, 9, 10];
  if (middleRow.every(pos => board[pos.toString()] === player)) {
    return true;
  }

  // Check vertical (3 in a column)
  const columns = [
    [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
  ];

  for (const column of columns) {
    if (column.every(pos => board[pos.toString()] === player)) {
      return true;
    }
  }

  // Check diagonal (3 in diagonal, excluding columns 5, 10, 15)
  const diagonals = [
    [1, 7, 13], [2, 8, 14], [3, 7, 11], [4, 8, 12]
  ];

  for (const diagonal of diagonals) {
    if (diagonal.every(pos => board[pos.toString()] === player)) {
      return true;
    }
  }

  return false;
};

interface GameBoardProps {
  game: any;
  onGameOver: (result: any) => void;
  gameMode: 'ai' | 'pass-play' | 'online';
  user: any;
  lastMessage?: any;
  sendMessage?: (message: any) => void;
  isSpectator?: boolean;
}

export function GameBoard({ game, onGameOver, gameMode, user, lastMessage, sendMessage, isSpectator = false }: GameBoardProps) {
  const [board, setBoard] = useState<Record<string, string>>({});
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  // Removed winningLine state - now derived from game prop
  const [lastMove, setLastMove] = useState<number | null>(null);

  const [opponent, setOpponent] = useState<any>(null);

  // Player chat message state
  const [playerXMessage, setPlayerXMessage] = useState<PlayerMessage | null>(null);
  const [playerOMessage, setPlayerOMessage] = useState<PlayerMessage | null>(null);
  const [messageTimeouts, setMessageTimeouts] = useState<{ X?: NodeJS.Timeout; O?: NodeJS.Timeout }>({});
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Profile modal state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Emoji state - similar to player messages
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [playerXEmoji, setPlayerXEmoji] = useState<{ emoji: any; timeout?: NodeJS.Timeout } | null>(null);
  const [playerOEmoji, setPlayerOEmoji] = useState<{ emoji: any; timeout?: NodeJS.Timeout } | null>(null);

  // Fetch user's owned emojis
  const { data: ownedEmojis = [] } = useQuery<Array<{ emoji: any }>>({
    queryKey: ['/api/emojis/owned'],
    enabled: gameMode === 'online',
  });

  // Fetch user stats for coin balance
  const { data: userStats } = useQuery<{ coins: number }>({
    queryKey: ['/api/users/online-stats'],
    enabled: !!user,
  });

  // Fetch avatar frames for both players
  const { data: playerXAvatarFrame } = useQuery<{ activeFrameId: string | null }>({
    queryKey: ['/api/users', game?.playerXId, 'avatar-frame'],
    enabled: !!game?.playerXId,
  });

  const { data: playerOAvatarFrame } = useQuery<{ activeFrameId: string | null }>({
    queryKey: ['/api/users', game?.playerOId, 'avatar-frame'],
    enabled: !!game?.playerOId,
  });

  // Emoji send mutation
  const sendEmojiMutation = useMutation({
    mutationFn: async ({ emojiId, recipientSymbol }: { emojiId: string; recipientSymbol: string }) => {
      if (!game?.id || !sendMessage || !currentUserSymbol || !game.roomId) {
        throw new Error('Cannot send emoji in this game mode');
      }

      // Get the opponent's actual user ID
      const userId = (user as any)?.userId || (user as any)?.id;
      const opponentId = currentUserSymbol === 'X' ? game.playerOId : game.playerXId;

      if (!opponentId) {
        throw new Error('Opponent not found');
      }

      // Send emoji via API to validate ownership
      const response = await apiRequest('/api/emojis/send', {
        method: 'POST',
        body: {
          emojiId,
          gameId: game.id,
          recipientPlayerId: opponentId,
        },
      });

      // Send via WebSocket for real-time animation and database recording
      sendMessage({
        type: 'send_emoji',
        roomId: game.roomId,
        gameId: game.id,
        emojiId,
        recipientId: opponentId,
        emoji: ownedEmojis.find(e => e.emoji.id === emojiId)?.emoji,
      });

      return response;
    },
    onSuccess: () => {
      setShowEmojiPanel(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send emoji',
        description: error.message || 'Could not send emoji',
        variant: 'destructive',
      });
    },
  });

  // Fetch current user's active piece style
  const { data: pieceStyleData } = useQuery<{ activeStyle: string }>({
    queryKey: ["/api/piece-styles"],
  });
  const currentUserPieceStyle = pieceStyleData?.activeStyle || 'default';

  // Determine which player is the current user (X or O)
  const currentUserSymbol = useMemo(() => {
    if (!game || !user) return null;
    const userId = (user as any)?.userId || (user as any)?.id;
    if (game.playerXId === userId) return 'X';
    if (game.playerOId === userId) return 'O';
    return null;
  }, [game, user]);

  // Handle profile picture click
  const handleProfileClick = (playerId: string) => {
    // Profile click handler called
    // Current selectedPlayerId state and setting modal

    // Force close first if already open, then open with new player
    if (showProfileModal) {
      setShowProfileModal(false);
      setSelectedPlayerId(null);
      // Use setTimeout to ensure state is updated before opening with new player
      setTimeout(() => {
        setSelectedPlayerId(playerId);
        setShowProfileModal(true);
        // Modal reopened with playerId
      }, 100);
    } else {
      setSelectedPlayerId(playerId);
      setShowProfileModal(true);
      // Modal opened with playerId
    }
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedPlayerId(null);
  };

  // Derive winning line from game state using useMemo to prevent infinite loops
  const derivedWinningLine = useMemo(() => {
    return game?.winningPositions || [];
  }, [game?.winningPositions?.join('-')]);

  // Auto-close profile modal when game ends  
  useEffect(() => {
    if (game?.status === 'finished' || game?.status === 'abandoned') {
      if (showProfileModal) {
        // Auto-closing profile modal due to game end
        setShowProfileModal(false);
        setSelectedPlayerId(null);
      }
    }
  }, [game?.status]);

  // Handle player left win event from WebSocket - show GameOverModal instead of notification
  useEffect(() => {
    const handlePlayerLeftWin = (event: CustomEvent) => {
      const message = event.detail;
      console.log('🏆 GameBoard: Player left win event received:', message);

      // Trigger onGameOver with a proper result object to show GameOverModal
      if (onGameOver && game) {
        const winnerSymbol = message.winnerSymbol || (message.winner === game.playerXId ? 'X' : 'O');
        const isCurrentUserWinner = user && message.winner === (user.userId || user.id);

        const gameResult = {
          game: game,
          winner: winnerSymbol,
          winnerInfo: message.winnerInfo,
          loserInfo: message.leavingPlayerInfo,
          condition: 'abandonment',
          message: isCurrentUserWinner 
            ? `${message.leavingPlayer || 'Opponent'} left the game. You win!`
            : `${message.leavingPlayer || 'Opponent'} left the game.`,
          isAbandonment: true
        };

        // Show the GameOverModal with opponent left message
        onGameOver(gameResult);
      }
    };

    window.addEventListener('player_left_win', handlePlayerLeftWin as EventListener);

    return () => {
      window.removeEventListener('player_left_win', handlePlayerLeftWin as EventListener);
    };
  }, [game, user, onGameOver]);

  // Debug effect to track modal state changes
  useEffect(() => {
    // Modal state changed
  }, [showProfileModal, selectedPlayerId]);
  const { toast } = useToast();
  const { currentTheme, themes } = useTheme();
  const { t } = useTranslation();
  // Sound effects removed as requested
  // WebSocket now handled by parent component
  const queryClient = useQueryClient();

  // Determine opponent for online games
  useEffect(() => {
    if (gameMode === 'online' && game && user) {
      const userIsPlayerX = game.playerXId === (user.userId || user.id);
      const userIsPlayerO = game.playerOId === (user.userId || user.id);

      if (userIsPlayerX && game.playerOInfo) {
        setOpponent(game.playerOInfo);
      } else if (userIsPlayerO && game.playerXInfo) {
        setOpponent(game.playerXInfo);
      }
    }
  }, [game, user, gameMode]);

  // Player message functions
  const setPlayerMessage = (player: 'X' | 'O', messageText: string) => {
    const message = QUICK_CHAT_MESSAGES.find(msg => msg.text === messageText) || { text: messageText, duration: 3000 };

    // Clear existing timeout
    if (messageTimeouts[player]) {
      clearTimeout(messageTimeouts[player]);
    }

    // Set new message
    if (player === 'X') {
      setPlayerXMessage(message);
    } else {
      setPlayerOMessage(message);
    }

    // Clear message after duration
    const timeout = setTimeout(() => {
      if (player === 'X') {
        setPlayerXMessage(null);
      } else {
        setPlayerOMessage(null);
      }
      setMessageTimeouts(prev => ({ ...prev, [player]: undefined }));
    }, message.duration);

    setMessageTimeouts(prev => ({ ...prev, [player]: timeout }));
  };

  const handleMessageClick = (messageText: string) => {
    if (gameMode === 'online' && user) {
      const userId = user.userId || user.id;
      const isPlayerX = game.playerXId === userId;
      const isPlayerO = game.playerOId === userId;

      // Check if user is actually a player (not a spectator)
      if (!isPlayerX && !isPlayerO) {
        console.log('❌ Spectator cannot use quick chat');
        return;
      }

      const playerSymbol = isPlayerX ? 'X' : 'O';

      // Show message locally first
      setPlayerMessage(playerSymbol, messageText);

      // Broadcast message to all players and spectators in the room
      const chatMessage = {
        type: 'player_chat',
        roomId: game.roomId,
        gameId: game.id,
        userId: userId,
        playerSymbol: playerSymbol,
        messageText: messageText,
        playerInfo: isPlayerX ? game.playerXInfo : game.playerOInfo
      };

      // Send via WebSocket
      if (sendMessage) {
        sendMessage(chatMessage);
      }
    } else {
      // For local games, current player uses message
      setPlayerMessage(currentPlayer, messageText);
    }
    setShowChatPanel(false);
  };

  // Use ref to track timeouts to avoid dependency issues
  const messageTimeoutsRef = useRef<{ X?: NodeJS.Timeout; O?: NodeJS.Timeout }>({});

  // Cleanup timeouts on unmount using ref
  useEffect(() => {
    return () => {
      // Clean up all message timeouts on unmount using ref
      Object.values(messageTimeoutsRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
      // Clean up emoji timeouts
      if (playerXEmoji?.timeout) clearTimeout(playerXEmoji.timeout);
      if (playerOEmoji?.timeout) clearTimeout(playerOEmoji.timeout);
    };
  }, []); // Empty dependency array safe because it uses ref





  // Create stable dependencies for board to prevent infinite loops
  const gameBoardKeys = game?.board ? Object.keys(game.board).sort().join(',') : '';
  const gameBoardValues = game?.board ? Object.values(game.board).join(',') : '';

  // Use ref to track last synced board state
  const lastSyncedBoardRef = useRef<string>('');

  useEffect(() => {
    if (game) {
      const gameBoard = game.board || {};
      const isNewGame = Object.keys(gameBoard).length === 0;
      const currentBoardState = gameBoardKeys + '|' + gameBoardValues;
      const syncKey = `${currentBoardState}|${game.syncTimestamp}|${game.timestamp}`;

      // For local games, only set board if it's truly empty (new game)
      if (game.id && game.id.startsWith('local-game')) {
        if (isNewGame) {
          setBoard({});
          setLastMove(null);
        }
        // Always sync currentPlayer for local games
        setCurrentPlayer(game.currentPlayer || 'X');
      } else {
        // For online games, sync if board changed OR if we have a new sync timestamp
        // This ensures moves from other players are always reflected
        if (syncKey !== lastSyncedBoardRef.current) {
          lastSyncedBoardRef.current = syncKey;
          setBoard(gameBoard);
          setCurrentPlayer(game.currentPlayer || 'X');
          if (game.lastMove !== undefined && game.lastMove !== null) {
            setLastMove(game.lastMove);
          }
        }
      }
    }
  }, [game?.id, gameBoardKeys, gameBoardValues, game?.currentPlayer, game?.lastMove, game?.syncTimestamp, game?.timestamp]);

  // Remove WebSocket handling from GameBoard - it's now handled in Home component
  // This prevents double handling and state conflicts

  // Handle incoming WebSocket messages for chat and moves
  useEffect(() => {
    if (lastMessage?.type === 'player_chat') {
      // Handle player chat message

      if (lastMessage.gameId === game?.id || lastMessage.roomId === game?.roomId) {
        const messageText = lastMessage.messageText;
        const playerSymbol = lastMessage.playerSymbol;

        // Message matches current game/room

        // Show the message for the specified player
        if (messageText) {
          setPlayerMessage(playerSymbol, messageText);
          // Set player message
        }
      } else {
        // Message doesn't match current game/room
      }
    }

    // Handle move error messages from WebSocket
    if (lastMessage?.type === 'move_error' && lastMessage?.gameId === game?.id) {
      toast({
        title: "Move Error",
        description: lastMessage.error || "Invalid move",
        variant: "destructive",
      });
    }

    // Handle incoming emoji from WebSocket
    if (lastMessage?.type === 'emoji_sent' && lastMessage?.gameId === game?.id) {
      const { emoji, senderId } = lastMessage;

      if (!emoji) {
        return;
      }

      // Determine which player sent the emoji
      const senderSymbol = senderId === game?.playerXId ? 'X' : 'O';

      // Clear any existing timeout for this player
      if (senderSymbol === 'X' && playerXEmoji?.timeout) {
        clearTimeout(playerXEmoji.timeout);
      } else if (senderSymbol === 'O' && playerOEmoji?.timeout) {
        clearTimeout(playerOEmoji.timeout);
      }

      // Set emoji for the correct player with auto-clear timeout
      if (senderSymbol === 'X') {
        setPlayerXEmoji({ emoji });
        const timeout = setTimeout(() => {
          setPlayerXEmoji(null);
        }, 5000);
        setPlayerXEmoji({ emoji, timeout });
      } else {
        setPlayerOEmoji({ emoji });
        const timeout = setTimeout(() => {
          setPlayerOEmoji(null);
        }, 5000);
        setPlayerOEmoji({ emoji, timeout });
      }
    }
  }, [lastMessage, game?.id, game?.roomId, game?.playerXId]);

  // Removed isMoveProcessing feature to prevent infinite loop issues

  const makeMoveMutation = useMutation({
    mutationFn: async (position: number) => {
      if (!game) {
        throw new Error('No active game');
      }

      // CRITICAL FIX: Ensure game is in active state before processing move
      if (game.status !== 'active') {
        throw new Error('Game is not active yet. Please wait...');
      }

      // For local games (AI and pass-play), handle moves locally
      if (game.id && game.id.startsWith('local-game')) {
        return handleLocalMove(position);
      }

      // Making move with current game state

      // For online games, use WebSocket for instant synchronization
      if (sendMessage && gameMode === 'online') {
        // Send move via WebSocket for real-time sync
        sendMessage({
          type: 'move',
          gameId: game.id,
          position: position
        });

        // Return immediately - WebSocket will handle the response
        return Promise.resolve({ success: true });
      }

      // Fallback to HTTP API if WebSocket not available
      return await apiRequest(`/api/games/${game.id}/moves`, { method: 'POST', body: { position } });
    },
    onSuccess: (data) => {
      // Move successful
      if (game && game.id && !game.id.startsWith('local-game')) {
        // For online games, the Home component will handle WebSocket updates
        // No need to update local state here
        // WebSocket will handle board update


      }
      // For online games, don't force board update since WebSocket handles it
      // For local games, board is already updated in handleLocalMove
    },
    onError: (error) => {
      // Move error occurred
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  const handleLocalMove = (position: number) => {
    if (!game) return;

    // HandleLocalMove called
    // Position, current player, and board state

    // Sound effects removed as requested
    const newBoard = { ...board };
    newBoard[position.toString()] = currentPlayer;
    setLastMove(position);

    console.log('  - New board after move:', newBoard);

    // Check for win condition with winning line detection
    const checkWin = (board: Record<string, string>, player: string) => {
      // Check horizontal: Row 1 and Row 3 need 4 consecutive, Row 2 (middle) needs all 5
      const edgeRows = [
        [1, 2, 3, 4, 5],      // Row 1
        [11, 12, 13, 14, 15]  // Row 3
      ];

      for (const row of edgeRows) {
        for (let i = 0; i <= row.length - 4; i++) {
          const positions = row.slice(i, i + 4);
          if (positions.every(pos => board[pos.toString()] === player)) {
            // Winning line now derived from game state
            return true;
          }
        }
      }

      // Row 2 (middle): Check for ALL 5 consecutive tokens
      const middleRow = [6, 7, 8, 9, 10];
      if (middleRow.every(pos => board[pos.toString()] === player)) {
        return true;
      }

      // Check vertical (3 consecutive)
      const columns = [
        [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
      ];

      for (const column of columns) {
        if (column.every(pos => board[pos.toString()] === player)) {
          // Winning line now derived from game state
          return true;
        }
      }

      // Check diagonal (3 consecutive, excluding columns 5,10,15)
      const diagonals = [
        [1, 7, 13], [2, 8, 14], // Main diagonals (excluding [3,9,15])
        [3, 7, 11], [4, 8, 12], // Anti-diagonals (excluding [5,9,13])
        [11, 7, 3], [12, 8, 4]  // Additional patterns (excluding those with 5,10,15)
      ];

      for (const diagonal of diagonals) {
        if (diagonal.every(pos => board[pos.toString()] === player)) {
          return true;
        }
      }

      return false;
    };

    const checkDraw = (board: Record<string, string>) => {
      return VALID_POSITIONS.every(pos => board[pos.toString()]);
    };

    // Update board state and force render
    // LocalMove: Updating board
    setBoard(newBoard);

    if (checkWin(newBoard, currentPlayer)) {
      const winnerInfo = currentPlayer === 'X' 
        ? (game?.playerXInfo?.firstName || game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
        : (game?.playerOInfo?.firstName || game?.playerOInfo?.displayName || game?.playerOInfo?.username || (gameMode === 'ai' ? 'AI' : 'Player O'));

      // Show winning positions before game over  
      const winningPositions = getWinningPositions(newBoard, currentPlayer);
      // Winning line now derived from game state

      // Add delay before showing game over for AI and pass-play
      setTimeout(() => {
        try {
          if (onGameOver) {
            const winnerName = currentPlayer === 'X' ? 'Player X' : (gameMode === 'ai' ? 'AI' : 'Player O');
            // GameBoard sending win result
            onGameOver({
              winner: currentPlayer,
              winnerName,
              condition: 'diagonal'
            });
          }
        } catch (error) {
          console.error('🚨 Error in game over handler:', error);
        }
      }, gameMode === 'ai' || gameMode === 'pass-play' ? 1500 : 0);
      return;
    }

    if (checkDraw(newBoard)) {
      if (onGameOver) {
        try {
          // GameBoard sending draw result
          onGameOver({
            winner: null,
            winnerName: null,
            condition: 'draw'
          });
        } catch (error) {
          console.error('🚨 Error in draw handler:', error);
        }
      }
      return;
    }

    // Switch player
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';
    setCurrentPlayer(nextPlayer);



    // Handle AI move
    if (gameMode === 'ai' && nextPlayer === 'O') {

      setTimeout(() => {
        makeAIMove(newBoard);
      }, 1000); // Increased delay to reduce blinking
    }
  };

  const makeAIMove = (currentBoard: Record<string, string>) => {
    const availableMoves = VALID_POSITIONS.filter(pos => !currentBoard[pos.toString()]);
    if (availableMoves.length === 0) return;

    // AI difficulty-based move selection
    const difficulty = game?.aiDifficulty || 'medium';
    let selectedMove;

    if (difficulty === 'easy') {
      // Easy: Random move
      selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else if (difficulty === 'medium') {
      // Medium: Try to win or block, otherwise random
      selectedMove = findBestMove(currentBoard, availableMoves) || availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      // Hard: More strategic play
      selectedMove = findBestMoveHard(currentBoard, availableMoves) || availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    // Sound effects removed as requested
    const newBoard = { ...currentBoard };
    newBoard[selectedMove.toString()] = 'O';

    // AI Move: Updating board
    setBoard(newBoard);
    setLastMove(selectedMove);



    // Check for AI win using same logic
    const checkWin = (board: Record<string, string>, player: string) => {
      // Check horizontal: Row 1 and Row 3 need 4 consecutive, Row 2 (middle) needs all 5
      const edgeRows = [
        [1, 2, 3, 4, 5],      // Row 1
        [11, 12, 13, 14, 15]  // Row 3
      ];

      for (const row of edgeRows) {
        for (let i = 0; i <= row.length - 4; i++) {
          const positions = row.slice(i, i + 4);
          if (positions.every(pos => board[pos.toString()] === player)) {
            return true;
          }
        }
      }

      // Row 2 (middle): Check for ALL 5 consecutive tokens
      const middleRow = [6, 7, 8, 9, 10];
      if (middleRow.every(pos => board[pos.toString()] === player)) {
        return true;
      }

      // Check vertical (3 consecutive)
      const columns = [
        [1, 6, 11], [2, 7, 12], [3, 8, 13], [4, 9, 14], [5, 10, 15]
      ];

      for (const column of columns) {
        if (column.every(pos => board[pos.toString()] === player)) {
          return true;
        }
      }

      // Check diagonal (3 consecutive, excluding columns 5,10,15)
      const diagonals = [
        [1, 7, 13], [2, 8, 14], // Main diagonals (excluding [3,9,15])
        [3, 7, 11], [4, 8, 12], // Anti-diagonals (excluding [5,9,13])
        [11, 7, 3], [12, 8, 4]  // Additional patterns (excluding those with 5,10,15)
      ];

      return diagonals.some(diagonal => 
        diagonal.every(pos => board[pos.toString()] === player)
      );
    };

    const checkDraw = (board: Record<string, string>) => {
      return VALID_POSITIONS.every(pos => board[pos.toString()]);
    };

    if (checkWin(newBoard, 'O')) {

      // Show winning positions before game over
      const winningPositions = getWinningPositions(newBoard, 'O');
      if (winningPositions.length > 0) {
        // Winning line now derived from game state
      }

      // Add delay before showing game over for AI mode
      setTimeout(() => {
        if (onGameOver) {
          try {
            console.log('🎮 GameBoard sending AI win result:', {
              winner: 'O',
              winnerName: 'AI',
              condition: 'diagonal'
            });
            onGameOver({
              winner: 'O',
              winnerName: 'AI',
              condition: 'diagonal'
            });
          } catch (error) {
            console.error('🚨 Error in AI win handler:', error);
          }
        }
      }, 1500);
      return;
    }

    if (checkDraw(newBoard)) {


      if (onGameOver) {
        try {
          onGameOver({
            winner: null,
            winnerName: null,
            condition: 'draw'
          });
        } catch (error) {
          console.error('🚨 Error in AI draw handler:', error);
        }
      }
      return;
    }

    setCurrentPlayer('X');
  };

  const handleCellClick = (position: number) => {
    // Handle cell click for game move

    // CRITICAL FIX: Prevent moves until game is fully initialized
    if (!game) {
      toast({
        title: "Game not ready",
        description: "Please wait for the game to start...",
        variant: "destructive",
      });
      return;
    }

    if (game.status && game.status !== 'active') {
      // Game not active
      toast({
        title: "Game not active",
        description: "Start a new game to play",
        variant: "destructive",
      });
      return;
    }

    if (board[position.toString()]) {
      // Position already occupied



      toast({
        title: t('invalidMove'),
        description: t('positionOccupied'),
        variant: "destructive",
      });
      return;
    }


    // Check if position 8 is locked on first move
    if (Object.keys(board).length === 0 && position === 8) {
      toast({
        title: "Position Locked",
        description: "Position 8 is locked on the first move",
        variant: "destructive",
      });
      return;
    }
    // Check if it's the player's turn
    if (gameMode === 'online') {
      const userId = user?.userId || user?.id;
      const isPlayerX = game.playerXId === userId;
      const isPlayerO = game.playerOId === userId;

      // Validate turn

      if (!isPlayerX && !isPlayerO) {
        // User is not a player in this game
        toast({
          title: t('notAPlayer'),
          description: t('notPlayerInGame'),
          variant: "destructive",
        });
        return;
      }

      const playerSymbol = isPlayerX ? 'X' : 'O';
      // Check player symbol and turn

      if (currentPlayer !== playerSymbol) {
        // Not your turn



        const currentPlayerName = currentPlayer === 'X' ? 
          (game.playerXInfo?.firstName || 'Player X') : 
          (game.playerOInfo?.firstName || 'Player O');
        toast({
          title: t('notYourTurn'),
          description: `${t('waitingFor')} ${currentPlayerName} ${t('toMakeMove')}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Making move on position
    // Sound effects removed as requested
    makeMoveMutation.mutate(position);
  };

  const resetGame = () => {
    setBoard({});
    setCurrentPlayer('X');
    // Winning line now derived from game state
    setLastMove(null);
  };

  const renderCell = (position: number) => {
    const symbol = board[position.toString()];
    const isEmpty = !symbol;
    const isWinningCell = derivedWinningLine?.includes(position);
    const isLastMove = lastMove === position;
    const isFirstMove = Object.keys(board).length === 0;
    const isLockedPosition = isFirstMove && position === 8;

    return (
      <motion.div
        key={position}
        className={`
          w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 ${theme.cellStyle} rounded-lg flex items-center justify-center cursor-pointer 
          ${isEmpty ? theme.cellHoverStyle : 'cursor-not-allowed'}
          ${makeMoveMutation.isPending ? 'opacity-50' : ''}
          ${isWinningCell ? theme.winningCellStyle : ''}
          ${isLastMove ? 'ring-2 ring-yellow-400' : ''}
          ${!isEmpty && !isWinningCell && symbol === 'X' ? 'animate-pulse-border-x' : ''}
          ${!isEmpty && !isWinningCell && symbol === 'O' ? 'animate-pulse-border-o' : ''}
          ${isLockedPosition ? 'opacity-40 cursor-not-allowed ring-2 ring-red-500' : ''}
        `}
        onClick={() => handleCellClick(position)}
        animate={isWinningCell ? {
          scale: [1, 1.05, 1.1, 1.05, 1],
          // REMOVING GREEN BACKGROUND/SHADOW ANIMATION (Lines 2-18)
          // ONLY KEEPING THE SCALE ANIMATION FOR VISUAL HIGHLIGHT
        } : {}}
        transition={isWinningCell ? {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}

      >
        {symbol && (
          <div className="w-16 h-16 flex items-center justify-center">
            <AnimatedPiece 
              symbol={symbol as "X" | "O"} 
              position={position}
              style={
                gameMode === 'online' 
                  ? (symbol === 'X' 
                      ? (game?.playerXInfo?.activePieceStyle || 'default') 
                      : (game?.playerOInfo?.activePieceStyle || 'default'))
                  : (symbol === currentUserSymbol && (currentUserPieceStyle === "thunder" || currentUserPieceStyle === "fire" || currentUserPieceStyle === "hammer" || currentUserPieceStyle === "autumn" || currentUserPieceStyle === "lovers" || currentUserPieceStyle === "flower" || currentUserPieceStyle === "greenleaf" || currentUserPieceStyle === "cat" || currentUserPieceStyle === "bestfriends" || currentUserPieceStyle === "lotus" || currentUserPieceStyle === "holi" || currentUserPieceStyle === "tulip" || currentUserPieceStyle === "butterfly" || currentUserPieceStyle === "peacock" || currentUserPieceStyle === "bulb"))
                    ? currentUserPieceStyle
                    : "default"
              }
              className={
                gameMode === 'online'
                  ? (((symbol === 'X' && game?.playerXInfo?.activePieceStyle && game?.playerXInfo?.activePieceStyle !== 'default') || 
                      (symbol === 'O' && game?.playerOInfo?.activePieceStyle && game?.playerOInfo?.activePieceStyle !== 'default'))
                      ? `${symbol === 'X' ? theme.playerXColor : theme.playerOColor}`
                      : `text-lg sm:text-xl md:text-2xl font-bold ${symbol === 'X' ? theme.playerXColor : theme.playerOColor}`)
                  : ((symbol === currentUserSymbol && (currentUserPieceStyle === "thunder" || currentUserPieceStyle === "fire" || currentUserPieceStyle === "hammer" || currentUserPieceStyle === "autumn" || currentUserPieceStyle === "lovers" || currentUserPieceStyle === "flower" || currentUserPieceStyle === "greenleaf" || currentUserPieceStyle === "cat" || currentUserPieceStyle === "bestfriends" || currentUserPieceStyle === "lotus" || currentUserPieceStyle === "holi" || currentUserPieceStyle === "tulip" || currentUserPieceStyle === "butterfly" || currentUserPieceStyle === "peacock" || currentUserPieceStyle === "bulb"))
                      ? `${symbol === 'X' ? theme.playerXColor : theme.playerOColor}`
                      : `text-lg sm:text-xl md:text-2xl font-bold ${symbol === 'X' ? theme.playerXColor : theme.playerOColor}`)
              }
            />
          </div>
        )}
        <span className={`text-xs ${theme.textColor} opacity-50 absolute mt-10 sm:mt-12 md:mt-16`}>{position}</span>
      </motion.div>
    );
  };

  const getLineCoordinates = (positions: number[]) => {
    // Get grid coordinates for line drawing
    const getGridPosition = (pos: number) => {
      const row = Math.floor((pos - 1) / 5);
      const col = (pos - 1) % 5;
      return { x: col * 20 + 10, y: row * 33.33 + 16.67 };
    };

    const start = getGridPosition(positions[0]);
    const end = getGridPosition(positions[positions.length - 1]);

    return {
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y
    };
  };

  const getSparklePosition = (position: number) => {
    const row = Math.floor((position - 1) / 5);
    const col = (position - 1) % 5;
    return { 
      x: col * 20 + 10,
      y: row * 33.33 + 16.67 
    };
  };

  const theme = themes[currentTheme];

  return (
    <Card className={`${theme.boardStyle}`}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          {/* Player X - Left Side */}
          <div className="flex items-center space-x-3">
  {/* Player X Profile - Vertical Layout */}
  <div className="flex flex-col items-center space-y-2">
    {(gameMode === 'online' && (game?.playerXInfo?.profileImageUrl || game?.playerXInfo?.profilePicture)) ? (
      <div
        className="cursor-pointer hover:ring-2 hover:ring-blue-400 rounded-full transition-all duration-200 hover:scale-110 relative z-50"
        onClick={() => {
          console.log('🎮 Player X profile DIV clicked:', game.playerXInfo.id);
          setSelectedPlayerId(game.playerXInfo.id);
          setShowProfileModal(true);
        }}
        title="Click to view player profile"
      >
        <AvatarWithFrame
          src={game.playerXInfo.profileImageUrl || game.playerXInfo.profilePicture}
          alt="Player X"
          size="lg" // <-- CHANGE: Increased size
          borderType={playerXAvatarFrame?.activeFrameId || getSelectedAchievementBorder(game.playerXInfo)}
          fallbackText={game.playerXInfo.firstName?.charAt(0) || game.playerXInfo.displayName?.charAt(0) || game.playerXInfo.username?.charAt(0) || 'X'}
        />
      </div>
    ) : (
      // CHANGE: Updated placeholder size
      <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center"> 
        <span className="text-xl text-white font-bold">X</span>
      </div>
    )}

              <div className="flex flex-col items-center mt-3">
                {renderAchievementBorder(
                  getSelectedAchievementBorder(game?.playerXInfo),
                  gameMode === 'online' 
                    ? (game?.playerXInfo?.firstName || game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
                    : 'Player X',
                  theme
                )}
                 </div>
            </div>

            {/* Chat Message and Emoji for Player X - On RIGHT side */}
            <AnimatePresence>
              {playerXMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: [1, 1.05, 1], 
                    x: 0
                  }}
                  exit={{ opacity: 0, scale: 0.5, x: -20 }}
                  transition={{ 
                    duration: 0.4,
                    scale: { duration: 0.6, ease: "easeInOut" }
                  }}
                  className="relative max-w-32"
                  title={playerXMessage.text}
                >
                  <motion.div 
                    className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md shadow-sm"
                    animate={{ 
                      scale: [1, 1.02, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {playerXMessage.text}
                  </motion.div>
                </motion.div>
              )}
              {playerXEmoji && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: [1, 1.3, 1.1, 1.3, 1], 
                    x: 0,
                    rotate: [0, 10, -10, 0]
                  }}
                  exit={{ opacity: 0, scale: 0.5, x: -20, transition: { duration: 0.5 } }}
                  transition={{ 
                    duration: 0.6,
                    scale: { duration: 1.5, ease: "easeInOut" }
                  }}
                  className="relative"
                  title={playerXEmoji.emoji.name}
                >
                  <motion.div 
                    className="text-4xl"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotateY: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {playerXEmoji.emoji.name.split(' ')[0]}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Player O - Right Side */}
          <div className="flex items-center space-x-3">
            {/* Chat Message and Emoji for Player O - On LEFT side */}
            <AnimatePresence>
              {playerOMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: [1, 1.05, 1], 
                    x: 0
                  }}
                  exit={{ opacity: 0, scale: 0.5, x: 20 }}
                  transition={{ 
                    duration: 0.4,
                    scale: { duration: 0.6, ease: "easeInOut" }
                  }}
                  className="relative max-w-32"
                  title={playerOMessage.text}
                >
                  <motion.div 
                    className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-md shadow-sm"
                    animate={{ 
                      scale: [1, 1.02, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {playerOMessage.text}
                  </motion.div>
                </motion.div>
              )}
              {playerOEmoji && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: [1, 1.3, 1.1, 1.3, 1], 
                    x: 0,
                    rotate: [0, -10, 10, 0]
                  }}
                  exit={{ opacity: 0, scale: 0.5, x: 20, transition: { duration: 0.5 } }}
                  transition={{ 
                    duration: 0.6,
                    scale: { duration: 1.5, ease: "easeInOut" }
                  }}
                  className="relative"
                  title={playerOEmoji.emoji.name}
                >
                  <motion.div 
                    className="text-4xl"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotateY: [0, -5, 5, 0]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {playerOEmoji.emoji.name.split(' ')[0]}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Player O Profile - Vertical Layout */}
            <div className="flex flex-col items-center space-y-2">
              {(gameMode === 'online' && (game?.playerOInfo?.profileImageUrl || game?.playerOInfo?.profilePicture)) ? (
                <div
                  className="cursor-pointer hover:ring-2 hover:ring-red-400 rounded-full transition-all duration-200 hover:scale-110 relative z-50"
                  onClick={() => {
                    console.log('🎮 Player O profile DIV clicked:', game.playerOInfo.id);
                    setSelectedPlayerId(game.playerOInfo.id);
                    setShowProfileModal(true);
                  }}
                  title="Click to view player profile"
                >
                  <AvatarWithFrame
                    src={game.playerOInfo.profileImageUrl || game.playerOInfo.profilePicture}
                    alt="Player O"
                    size="lg" // <-- CHANGE: Increased size
                    borderType={playerOAvatarFrame?.activeFrameId || getSelectedAchievementBorder(game.playerOInfo)}
                    fallbackText={game.playerOInfo.firstName?.charAt(0) || game.playerOInfo.displayName?.charAt(0) || game.playerOInfo.username?.charAt(0) || 'O'}
                  />
                </div>
              ) : (
                // CHANGE: Updated placeholder size
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xl text-white font-bold">O</span>
                </div>
              )}
<div className="flex flex-col items-center mt-3">
                {renderAchievementBorder(
                  getSelectedAchievementBorder(game?.playerOInfo),
                  gameMode === 'online' 
                    ? (game?.playerOInfo?.firstName || game?.playerOInfo?.displayName || game?.playerOInfo?.username || 'Player O')
                    : (gameMode === 'ai' ? 'AI' : 'Player O'),
                  theme
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Current Player Indicator */}
        <div className={`mb-6 p-4 ${theme.cellStyle.split(' ')[0]} ${theme.borderColor} border rounded-lg`}>
          <div className="flex items-center justify-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              currentPlayer === 'X' ? 'bg-blue-500' : 'bg-red-500'
            }`}></div>
            <span className={`text-lg font-medium ${theme.textColor}`}>
              {gameMode === 'online' 
                ? (currentPlayer === 'X' 
                    ? (game?.playerXInfo?.firstName || game?.playerXInfo?.displayName || game?.playerXInfo?.username || 'Player X')
                    : (game?.playerOInfo?.firstName || game?.playerOInfo?.displayName || game?.playerOInfo?.username || 'Player O'))
                : (currentPlayer === 'X' 
                    ? 'Player X'
                    : (gameMode === 'ai' ? 'AI' : 'Player O'))
              }'s Turn
            </span>
          </div>
        </div>

        {/* Auto-Play Indicator */}
        {game?.autoPlayActive && gameMode === 'online' && (
          <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  🤖 Player {game.autoPlayActive} is in Auto-Play mode
                </span>
              </div>
              {/* Show "Take Control" button only if current user is the auto-playing player */}
              {((game.autoPlayActive === 'X' && game.playerXInfo?.userId === user?.userId) ||
                (game.autoPlayActive === 'O' && game.playerOInfo?.userId === user?.userId)) && (
                <Button
                  onClick={() => {
                    // Send WebSocket message to disable auto-play
                    if (sendMessage && game) {
                      sendMessage({
                        type: 'disable_auto_play',
                        gameId: game.id
                      });
                      toast({
                        title: "Taking Control...",
                        description: "Disabling auto-play mode...",
                      });
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                  data-testid="button-take-control"
                >
                  Take Control
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 3x5 Game Grid */}
        <div 
          className="relative grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 max-w-xs sm:max-w-md md:max-w-lg mx-auto"
        >
          {/* Row 1: 1,2,3,4,5 */}
          {[1, 2, 3, 4, 5].map(renderCell)}

          {/* Row 2: 6,7,8,9,10 */}
          {[6, 7, 8, 9, 10].map(renderCell)}

          {/* Row 3: 11,12,13,14,15 */}
          {[11, 12, 13, 14, 15].map(renderCell)}

          {/* Winning line animation removed - keeping only box blink */}
        </div>

        {/* Game Controls */}
        <div className="mt-8 flex justify-center space-x-4">
          {/* Only show chat button for players, not spectators */}
          {!isSpectator && (
            <Button 
              variant="outline"
              onClick={() => setShowChatPanel(!showChatPanel)}
              className="flex items-center space-x-2"
              data-testid="button-chat"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('chat')}</span>
            </Button>
          )}

          {/* Send Emoji button - opens emoji picker */}
          {gameMode === 'online' && !isSpectator && ownedEmojis.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => setShowEmojiPanel(!showEmojiPanel)}
              className="flex items-center space-x-2"
              data-testid="button-send-emoji"
            >
              <Gift className="w-4 h-4" />
              <span>Send Emoji</span>
            </Button>
          )}

          {/* Only show Reset Game button for non-online modes */}
          {gameMode !== 'online' && (
            <Button 
              variant="destructive"
              onClick={resetGame}
              disabled={makeMoveMutation.isPending}
              data-testid="button-reset"
            >
              {t('resetGame')}
            </Button>
          )}
        </div>

        {/* Quick Chat Panel */}
        <div className="relative">
          <QuickChatPanel
            isOpen={showChatPanel}
            onMessageClick={handleMessageClick}
            onClose={() => setShowChatPanel(false)}
          />
        </div>

        {/* Emoji Picker Panel */}
        {gameMode === 'online' && (
          <div className="relative">
            <EmojiPicker
              isOpen={showEmojiPanel}
              ownedEmojis={ownedEmojis}
              onEmojiSelect={(emojiId, recipientSymbol) => {
                sendEmojiMutation.mutate({ emojiId, recipientSymbol });
                setShowEmojiPanel(false);
              }}
              onClose={() => setShowEmojiPanel(false)}
              currentUserSymbol={currentUserSymbol}
              isPending={sendEmojiMutation.isPending}
            />
          </div>
        )}
      </CardContent>

      {/* Player Profile Modal */}
      {showProfileModal && selectedPlayerId && (
        <PlayerProfileModal
          playerId={selectedPlayerId}
          open={showProfileModal}
          onClose={handleCloseProfileModal}
          currentUserId={user?.userId || user?.id}
        />
      )}


    </Card>
  );
}
