import React, { useState, useEffect } from "react";
import { RefreshCw, Send } from "lucide-react";
import { useTranslation } from '../contexts/LanguageContext';
import { ShareButton } from './ShareButton';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfettiExplosion } from './ConfettiExplosion';

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
  const [showConfetti, setShowConfetti] = useState(false);

  // ... (Your useMutation and useEffect hooks remain unchanged)
  const playAgainRequestMutation = useMutation({
    // ... (rest of mutation setup)
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

  useEffect(() => {
    const handlePlayAgainRejected = () => { setIsRequestingSent(false); };
    const handleGameStarted = () => { setIsRequestingSent(false); };
    const handleMessage = (event: any) => {
      if (event.detail?.type === 'game_started') {
        setIsRequestingSent(false);
      }
    };

    window.addEventListener('play_again_rejected_received', handlePlayAgainRejected);
    window.addEventListener('game_started_received', handleGameStarted);
    window.addEventListener('matchmaking_message_received', handleMessage);

    return () => {
      window.removeEventListener('play_again_rejected_received', handlePlayAgainRejected);
      window.removeEventListener('game_started_received', handleGameStarted);
      window.removeEventListener('matchmaking_message_received', handleMessage);
    };
  }, []);

  useEffect(() => {
    if (open && result?.condition !== 'draw') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [open, result?.condition]);

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

  const isOnlineGameWithOpponent = () => {
    const opponentId = getOpponentId();
    return result?.game?.gameMode === 'online' &&
             opponentId &&
             opponentId !== 'ai' &&
             !opponentId.startsWith('player_');
  };

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
      onPlayAgain();
    }
  };

  // Simple safety checks
  if (!open) return null;
  if (!result) {
    console.error('GameOverModal: No result provided');
    return null;
  }

  const isDraw = result.condition === 'draw';
  const winner = result.winner;
  const isOnlineGame = result.game?.gameMode === 'online';

  const getPlayerDisplayName = (symbol: string) => {
    // ... (rest of getPlayerDisplayName logic)
    if (!isOnlineGame) {
      if (symbol === 'X') return 'Player X';
      if (symbol === 'O') return result.game?.gameMode === 'ai' ? 'AI' : 'Player O';
      return 'Unknown';
    }

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
  const loser = winner ? (winner === 'X' ? 'O' : 'X') : null;
  const loserName = loser ? getPlayerDisplayName(loser) : null;
  const loserInfo = isOnlineGame && loser ? (loser === 'X' ? result.playerXInfo : result.playerOInfo) : null;

  return (
    <>
      {/* Confetti for wins only */}
      {!isDraw && <ConfettiExplosion active={showConfetti} duration={2000} particleCount={20} />}
      
      {/* Premium Modal Overlay with Backdrop Blur */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.90)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
          overflowY: 'auto'
        }}
        onClick={onClose}
      >
        {/* Main Premium Modal Card */}
        <div
          id="game-over-modal-content"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
            borderRadius: '24px',
            padding: '0',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '95vh',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 100px rgba(99, 102, 241, 0.3)',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            margin: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated Border Gradient - All Sides */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '24px',
            padding: '3px',
            background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #FFA500 75%, #FFD700 100%)',
            backgroundSize: '200% 100%',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
            boxShadow: 'inset 0 0 20px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)'
          }} />

          {/* Background Decorative Graphics */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25), transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            animation: 'float-glow 6s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25), transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            animation: 'float-glow 6s ease-in-out infinite reverse'
          }} />
          
          {/* Floating Geometric Shape */}
          <div style={{
            position: 'absolute',
            top: '15%',
            right: '10%',
            width: '40px',
            height: '40px',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            transform: 'rotate(45deg)',
            animation: 'float-shape 4s ease-in-out infinite',
            pointerEvents: 'none'
          }} />

          <style>{`
            @keyframes glow-pulse {
              0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.4), 0 0 40px rgba(255, 215, 0, 0.2); }
              50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3); }
            }
            @keyframes float-shape {
              0%, 100% { transform: rotate(45deg) translateY(0px); opacity: 0.3; }
              50% { transform: rotate(45deg) translateY(-20px); opacity: 0.6; }
            }
            @keyframes float-glow {
              0%, 100% { transform: translateY(0px); opacity: 0.25; }
              50% { transform: translateY(-30px); opacity: 0.35; }
            }
            @keyframes sparkle {
              0%, 100% {
                opacity: 0;
                transform: scale(0);
              }
              50% {
                opacity: 1;
                transform: scale(1);
              }
            }

            @media (max-width: 600px) {
              #game-over-modal-content {
                max-width: 80%;
                border-radius: 20px;
              }
              .modal-header { padding: 32px 20px 24px !important; }
              .modal-body { padding: 0 20px 24px !important; }
              .modal-footer { padding: 0 20px 32px !important; }
              .player-avatar { width: 90px !important; height: 90px !important; }
              .modal-button-container { flex-direction: column; gap: 12px !important; }
              .modal-button-container button { width: 100% !important; }
            }
          `}</style>

          {/* Header Section */}
          <div className="modal-header" style={{ padding: '40px 32px 28px', position: 'relative' }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: '900', 
              margin: 0,
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px'
            }}>
              {isDraw ? t('itsADraw') : 'Victory!'}
            </h2>
            
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.6)', 
              marginTop: '8px',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {t('gameOver')}
            </p>
          </div>

          {/* Body Section - Players Display */}
          <div className="modal-body" style={{ padding: '0 32px 28px' }}>
            {isDraw ? (
              <div style={{ padding: '24px 0' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto 20px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 10px 40px rgba(245, 158, 11, 0.4)'
                }}>
                  <span style={{ fontSize: '56px' }}>🤝</span>
                </div>
                <p style={{ 
                  fontSize: '24px', 
                  fontWeight: '800',
                  color: '#f59e0b',
                  margin: 0
                }}>
                  It's a Draw!
                </p>
              </div>
            ) : (
              <div>
                {/* Players Comparison */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '32px',
                  marginBottom: '24px'
                }}>
                  {/* Winner */}
                  <div style={{ 
                    textAlign: 'center',
                    position: 'relative',
                    flex: 1
                  }}>
                    {/* Lightweight Crown */}
                    <div style={{
                      position: 'absolute',
                      top: '-32px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 2,
                      width: '48px',
                      height: '40px',
                      filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.6))'
                    }}>
                      <svg viewBox="0 0 48 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Crown Base */}
                        <rect x="6" y="30" width="36" height="6" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
                        
                        {/* Crown Body */}
                        <path d="M24 4L20 14L10 8L12 28h24L38 8L28 14z" fill="#FFD700" stroke="#FFA500" strokeWidth="1"/>
                        
                        {/* Simple Jewels */}
                        <circle cx="24" cy="6" r="3" fill="#FF1493"/>
                        <circle cx="10" cy="10" r="2" fill="#00FFFF"/>
                        <circle cx="38" cy="10" r="2" fill="#7FFFD4"/>
                      </svg>
                      
                      {/* Sparkles - Pure CSS */}
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '8px',
                        width: '4px',
                        height: '4px',
                        background: '#FFD700',
                        borderRadius: '50%',
                        animation: 'sparkle 1.5s ease-in-out infinite'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        right: '6px',
                        width: '3px',
                        height: '3px',
                        background: '#FFF',
                        borderRadius: '50%',
                        animation: 'sparkle 1.8s ease-in-out 0.3s infinite'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '14px',
                        width: '3px',
                        height: '3px',
                        background: '#FFD700',
                        borderRadius: '50%',
                        animation: 'sparkle 2s ease-in-out 0.6s infinite'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '2px',
                        width: '3px',
                        height: '3px',
                        background: '#FFF',
                        borderRadius: '50%',
                        animation: 'sparkle 1.6s ease-in-out 0.9s infinite'
                      }} />
                    </div>
                    
                    <div className="player-avatar" style={{
                      width: '100px',
                      height: '100px',
                      margin: '0 auto 12px',
                      background: winner === 'X' ? 
                        'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 
                        'linear-gradient(135deg, #ef4444, #dc2626)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '4px solid #FFD700',
                      animation: 'glow-pulse 2s ease-in-out infinite',
                      position: 'relative'
                    }}>
                      {isOnlineGame && (winnerInfo?.profilePicture || winnerInfo?.profileImageUrl) ? (
                        <img
                          src={winnerInfo.profilePicture || winnerInfo.profileImageUrl}
                          alt={winnerName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ 
                          fontSize: '40px', 
                          color: 'white', 
                          fontWeight: 'bold'
                        }}>
                          {winner}
                        </span>
                      )}
                    </div>
                    
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#10b981', 
                      fontWeight: '700',
                      margin: '12px 0 0'
                    }}>
                      {winnerName}
                    </p>
                    {isOnlineGame && result?.betAmount && typeof result.betAmount === 'number' && (
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#10b981',
                        margin: '4px 0 0',
                        fontWeight: '600'
                      }}>
                        +{result.betAmount.toLocaleString()} 🪙
                      </p>
                    )}
                  </div>

                  {/* VS Badge */}
                  <div style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(255, 165, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                    border: '2px solid rgba(255, 215, 0, 0.6)',
                    fontSize: '11px',
                    fontWeight: '900',
                    color: '#1a1a2e',
                    letterSpacing: '0.5px'
                  }}>
                    VS
                  </div>

                  {/* Loser */}
                  <div style={{ 
                    textAlign: 'center',
                    flex: 1
                  }}>
                    <div className="player-avatar" style={{
                      width: '100px',
                      height: '100px',
                      margin: '12px auto',
                      background: loser === 'X' ? 
                        'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 
                        'linear-gradient(135deg, #ef4444, #dc2626)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '3px solid rgba(255, 255, 255, 0.2)',
                      opacity: 0.6,
                      filter: 'grayscale(50%)'
                    }}>
                      {isOnlineGame && (loserInfo?.profilePicture || loserInfo?.profileImageUrl) ? (
                        <img
                          src={loserInfo.profilePicture || loserInfo.profileImageUrl}
                          alt={loserName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ 
                          fontSize: '40px', 
                          color: 'white', 
                          fontWeight: 'bold'
                        }}>
                          {loser}
                        </span>
                      )}
                    </div>
                    
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#ef4444', 
                      fontWeight: '800',
                      margin: '12px 0 0'
                    }}>
                      {loserName}
                    </p>
                    {isOnlineGame && result?.betAmount && typeof result.betAmount === 'number' && (
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#ef4444',
                        margin: '4px 0 0',
                        fontWeight: '600'
                      }}>
                        -{result.betAmount.toLocaleString()} 🪙
                      </p>
                    )}
                  </div>
                </div>

                {/* Winner Wins Text - Centered */}
                <div style={{ 
                  textAlign: 'center',
                  margin: '24px 0 0'
                }}>
                  <p style={{ 
                    fontSize: '24px', 
                    fontWeight: '800',
                    margin: 0,
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.5px',
                    animation: 'slide-in-bottom 0.6s ease-out 0.3s backwards'
                  }}>
                    {winnerName} Wins
                  </p>
                </div>

                {/* Win Condition */}
                <p style={{ 
                  fontSize: '15px', 
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '20px 0 0',
                  fontWeight: '600'
                }}>
                  {result.isAbandonmentWin && result.abandonmentMessage ?
                    result.abandonmentMessage :
                    result.condition === 'abandonment' ?
                      'Opponent left the game' :
                      result.condition === 'horizontal' ? 
                        `🎯 ${t('horizontalLine')}` : 
                        `🎯 ${t('diagonalLine')}`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Footer - Action Buttons */}
          <div className="modal-footer" style={{ 
            padding: '0 32px 40px',
            background: 'linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.2))'
          }}>
            <div className="modal-button-container" style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '12px', 
              flexWrap: 'wrap',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => {
                  onClose();
                  if (onPlayWithAI) {
                    onPlayWithAI();
                  }
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Home
              </button>

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
                    background: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? 
                      'linear-gradient(135deg, rgba(107, 114, 128, 0.5), rgba(107, 114, 128, 0.3))' :
                      'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    border: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? 
                      '1px solid rgba(107, 114, 128, 0.5)' : 
                      '1px solid rgba(59, 130, 246, 0.5)',
                    cursor: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? 
                      'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontWeight: '600',
                    fontSize: '13px',
                    opacity: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? 
                      'none' : 
                      '0 3px 10px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCreatingGame && !playAgainRequestMutation.isPending && !isRequestingSent) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = (isCreatingGame || playAgainRequestMutation.isPending || isRequestingSent) ? 
                      'none' : 
                      '0 3px 10px rgba(59, 130, 246, 0.3)';
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
            </div>

            {!isDraw && winner && (
              <div style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                borderRadius: '8px',
                boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease',
                padding: '2px 0'
              }}>
                <ShareButton
                  title="TicTac 3x5 Victory!"
                  text={`🎉 I just won a game in TicTac 3x5! ${winnerName} wins! Check out this strategic tic-tac-toe game.`}
                  variant="default"
                  size="sm"
                  className="w-full bg-transparent hover:bg-white/10 border-0 text-xs py-1.5"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}