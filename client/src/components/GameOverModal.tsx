import React, { useState, useEffect } from "react";
import { Bot, RefreshCw, Send } from "lucide-react";
import { useTranslation } from '../contexts/LanguageContext';
import { ShareButton } from './ShareButton';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GameOverModalProps {
  open: boolean;
  onClose: () => void;
  result: any;
  onPlayAgain: () => void;
  isCreatingGame?: boolean;
  onPlayWithAI?: () => void;
  isSpectator?: boolean;
  currentUser?: {
    userId: string;
    username: string;
    displayName?: string;
  } | null;
}

export function GameOverModal({ open, onClose, result, onPlayAgain, isCreatingGame = false, onPlayWithAI, isSpectator = false, currentUser }: GameOverModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRequestingSent, setIsRequestingSent] = useState(false);

  const playAgainRequestMutation = useMutation({
    mutationFn: async ({ requestedUserId, gameId }: { requestedUserId: string; gameId: string }) => {
      return apiRequest(`/api/play-again/request`, {
        method: 'POST',
        body: { requestedUserId, gameId },
      });
    },
    onSuccess: () => {
      toast({
        description: "Play again request sent! Waiting for response...",
      });
      setIsRequestingSent(true);
      queryClient.invalidateQueries({ queryKey: ['/api/play-again/requests'] });
    },
    onError: (error: any) => {
      console.error('Error sending play again request:', error);
      toast({
        variant: "destructive",
        description: error?.message?.includes('already exists') ? 
          "You've already sent a play again request for this game" :
          "Failed to send play again request",
      });
    },
  });

  // Reset the request sent state when play again request is processed
  useEffect(() => {
    const handlePlayAgainAccepted = () => {
      // Request was accepted, reset the button state so it can be used again
      setIsRequestingSent(false);
    };

    const handlePlayAgainRejected = () => {
      // Request was rejected, reset the button state so it can be used again
      setIsRequestingSent(false);
    };

    const handleGameStarted = () => {
      // New game started (means request was accepted), reset the button state
      setIsRequestingSent(false);
    };

    // Listen for play again events
    window.addEventListener('play_again_rejected_received', handlePlayAgainRejected);
    window.addEventListener('game_started_received', handleGameStarted);
    
    // Also listen for generic game_started events from useWebSocket
    const handleMessage = (event: any) => {
      if (event.detail?.type === 'game_started') {
        setIsRequestingSent(false);
      }
    };
    window.addEventListener('matchmaking_message_received', handleMessage);

    return () => {
      window.removeEventListener('play_again_rejected_received', handlePlayAgainRejected);
      window.removeEventListener('game_started_received', handleGameStarted);
      window.removeEventListener('matchmaking_message_received', handleMessage);
    };
  }, []);

  // Helper function to get the opponent's user ID
  const getOpponentId = () => {
    if (!currentUser || !result?.game) return null;
    
    const { playerXId, playerOId } = result.game;
    if (playerXId === currentUser.userId) {
      return playerOId;
    } else if (playerOId === currentUser.userId) {
      return playerXId;
    }
    return null;
  };

  // Helper function to determine if this is an online game with a real opponent
  const isOnlineGameWithOpponent = () => {
    const opponentId = getOpponentId();
    // Check if it's online mode AND has an opponent AND the opponent is not a bot
    return result?.game?.gameMode === 'online' && 
           opponentId && 
           opponentId !== 'ai' && 
           !opponentId.startsWith('player_'); // Bot IDs start with 'player_'
  };

  // Handle play again - either send request for online games or direct play again for others
  const handlePlayAgainClick = () => {
    if (isOnlineGameWithOpponent()) {
      const opponentId = getOpponentId();
      if (opponentId && result?.game?.id) {
        playAgainRequestMutation.mutate({
          requestedUserId: opponentId,
          gameId: result.game.id
        });
      }
    } else {
      // For AI games and pass-play, use the existing play again functionality
      onPlayAgain();
    }
  };
  
  // Simple safety checks
  if (!open) return null;
  if (!result) {
    console.error('GameOverModal: No result provided');
    return null;
  }
  
  console.log('GameOverModal rendering with result:', result);

  // Super simple logic - no complex conditionals
  const isDraw = result.condition === 'draw';
  const winner = result.winner;
  
  // Get proper player names and info - only for online games
  const isOnlineGame = result.game?.gameMode === 'online';
  
  const getPlayerDisplayName = (symbol: string) => {
    if (!isOnlineGame) {
      // For AI and pass-play modes, use simple names
      if (symbol === 'X') return 'Player X';
      if (symbol === 'O') return result.game?.gameMode === 'ai' ? 'AI' : 'Player O';
      return 'Unknown';
    }
    
    // For online games, use actual player info
    if (symbol === 'X') {
      const playerX = result.playerXInfo;
      return playerX?.displayName || playerX?.firstName || playerX?.username || 'Player X';
    } else if (symbol === 'O') {
      const playerO = result.playerOInfo;
      return playerO?.displayName || playerO?.firstName || playerO?.username || 'Player O';
    }
    return 'Unknown';
  };
  
  const winnerName = winner ? getPlayerDisplayName(winner) : null;
  const winnerInfo = isOnlineGame && winner ? (winner === 'X' ? result.playerXInfo : result.playerOInfo) : null;
  
  // Get loser information - only for games with winners
  const loser = winner ? (winner === 'X' ? 'O' : 'X') : null;
  const loserName = loser ? getPlayerDisplayName(loser) : null;
  const loserInfo = isOnlineGame && loser ? (loser === 'X' ? result.playerXInfo : result.playerOInfo) : null;

  return (
    <>
      {/* Sparkle explosion effect for wins */}
      {open && !isDraw && winner && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10000
        }}>
          {/* Generate 60 sparkles that explode outward from center */}
          {Array.from({ length: 60 }, (_, i) => {
            const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#00b894', '#e17055'];
            const size = Math.random() * 10 + 3; // 3-13px
            const angle = (360 / 60) * i + Math.random() * 20; // Spread around 360 degrees
            const distance = Math.random() * 300 + 150; // 150-450px from center
            const duration = Math.random() * 1.5 + 1.5; // 1.5-3s animation
            const delay = Math.random() * 0.3; // 0-0.3s delay
            
            // Calculate final position based on angle and distance
            const radian = (angle * Math.PI) / 180;
            const dx = Math.cos(radian) * distance;
            const dy = Math.sin(radian) * distance;
            
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                  borderRadius: '50%',
                  animation: `sparkle-explode ${duration}s ease-out ${delay}s forwards`,
                  boxShadow: `0 0 ${size * 2}px ${colors[Math.floor(Math.random() * colors.length)]}`,
                  transform: 'translate(-50%, -50%)',
                  '--dx': `${dx}px`,
                  '--dy': `${dy}px`
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}
        onClick={onClose}
      >
      <div 
        style={{
          backgroundColor: '#1e293b',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #475569',
          color: 'white',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes winner-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
            100% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
          }
          @keyframes sparkle-explode {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 1;
            }
            20% {
              transform: translate(-50%, -50%) scale(1.5);
              opacity: 1;
            }
            100% {
              transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.3);
              opacity: 0;
            }
          }
        `}</style>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'white' }}>
          {t('gameOver')}
        </h2>
        
        <div style={{ marginBottom: '24px' }}>
          {isDraw ? (
            <div>
              <div 
                style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 16px',
                  backgroundColor: '#eab308',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ fontSize: '32px' }}>🤝</span>
              </div>
              <p style={{ fontSize: '20px', color: '#d1d5db' }}>{t('itsADraw')}</p>
            </div>
          ) : (
            <div>
              {/* Winner vs Loser display */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                {/* Winner */}
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 8px',
                      backgroundColor: winner === 'X' ? '#3b82f6' : '#ef4444',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '4px solid #fbbf24',
                      animation: 'winner-pulse 1s ease-in-out infinite alternate'
                    }}
                  >
                    {isOnlineGame && (winnerInfo?.profilePicture || winnerInfo?.profileImageUrl) ? (
                      <img 
                        src={winnerInfo.profilePicture || winnerInfo.profileImageUrl} 
                        alt={winnerName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '32px', color: 'white', fontWeight: 'bold' }}>
                        {winner}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold', margin: 0 }}>
                    👑 {winnerName}
                  </p>
                  <p style={{ fontSize: '12px', color: '#10b981', margin: 0 }}>
                    Winner {isOnlineGame ? '+1k 💰' : ''}
                  </p>
                </div>

                {/* VS */}
                <div style={{ fontSize: '24px', color: '#9ca3af', fontWeight: 'bold' }}>
                  VS
                </div>

                {/* Loser */}
                <div style={{ textAlign: 'center' }}>
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 8px',
                      backgroundColor: loser === 'X' ? '#3b82f6' : '#ef4444',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '3px solid #6b7280',
                      opacity: 0.7
                    }}
                  >
                    {isOnlineGame && (loserInfo?.profilePicture || loserInfo?.profileImageUrl) ? (
                      <img 
                        src={loserInfo.profilePicture || loserInfo.profileImageUrl} 
                        alt={loserName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '32px', color: 'white', fontWeight: 'bold' }}>
                        {loser}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'bold', margin: 0 }}>
                    {loserName}
                  </p>
                  <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>
                    Loser {isOnlineGame ? '-1k 💰' : ''}
                  </p>
                </div>
              </div>
              
              <p style={{ fontSize: '20px', color: 'white', marginBottom: '16px' }}>
                {result.isAbandonmentWin && result.abandonmentMessage ? 
                  result.abandonmentMessage : 
                  winnerName ? t('playerWins').replace('{player}', winnerName) : t('itsADraw')
                }
              </p>
              
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                {result.condition === 'abandonment' ? 
                  'Opponent left the game' : 
                  result.condition === 'horizontal' ? t('horizontalLine') : t('diagonalLine')
                }
              </p>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              console.log('🤖 Play with AI button clicked from GameOverModal');
              onClose();
              if (onPlayWithAI) {
                console.log('🤖 Calling onPlayWithAI from GameOverModal');
                onPlayWithAI();
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: '#374151',
              color: 'white',
              border: '1px solid #6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Bot style={{ width: '16px', height: '16px' }} />
            Home
          </button>
          
          {/* Only show Play Again button if user is not a spectator */}
          {!isSpectator && (
            <button
              onClick={() => {
                if (!isCreatingGame && !playAgainRequestMutation.isPending && !isRequestingSent) {
                  handlePlayAgainClick();
                }
              }}
              disabled={isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent}
              data-testid="button-play-again"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? '#6b7280' : '#3b82f6',
                color: 'white',
                border: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? '1px solid #6b7280' : '1px solid #2563eb',
                cursor: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? 0.6 : 1
              }}
            >
              {isOnlineGameWithOpponent() ? (
                <>
                  <Send style={{ width: '16px', height: '16px' }} />
                  {isRequestingSent ? 'Request Sent' : 
                   playAgainRequestMutation.isPending ? 'Sending...' : 
                   'Request Play Again'}
                </>
              ) : (
                <>
                  <RefreshCw style={{ width: '16px', height: '16px' }} />
                  {t('playAgain')}
                </>
              )}
            </button>
          )}
          
          {/* Share button for victories */}
          {!isDraw && winner && (
            <div style={{ marginTop: '8px' }}>
              <ShareButton
                title="TicTac 3x5 Victory!"
                text={`🎉 I just won a game in TicTac 3x5! ${winnerName} wins! Check out this strategic tic-tac-toe game.`}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}