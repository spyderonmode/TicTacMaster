import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Loader2, Users, X, Zap, Coins, Crown, Lock } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { ErrorModal } from "./ErrorModal";

interface MatchmakingModalProps {
  open: boolean;
  onClose: () => void;
  onMatchFound: (room: any) => void;
  user: any;
  isWebSocketConnected?: boolean;
  currentRoom?: any;
  leaveRoom?: (roomId: string) => void;
}

export function MatchmakingModal({ open, onClose, onMatchFound, user, isWebSocketConnected = true, currentRoom, leaveRoom }: MatchmakingModalProps) {
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const [isMatchFound, setIsMatchFound] = useState(false);
  const [isMatchmakingSuccessDetected, setIsMatchmakingSuccessDetected] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [selectedBet, setSelectedBet] = useState(1000000);
  const [errorModal, setErrorModal] = useState<{open: boolean, title: string, message: string, type?: 'error' | 'coins' | 'warning'}>({
    open: false,
    title: '',
    message: '',
    type: 'error'
  });
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  const { isOnline } = useOnlineStatus();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionLostToastShownRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (emergencyTimeoutRef.current) {
      clearTimeout(emergencyTimeoutRef.current);
      emergencyTimeoutRef.current = null;
    }
  }, []);

  const resetMatchmakingState = useCallback(() => {
    console.log('🔄 MatchmakingModal: Resetting matchmaking state');
    clearAllTimers();
    connectionLostToastShownRef.current = false;
    // CRITICAL: isSearching and isMatchFound must NOT be reset here
    // to prevent the flicker back to the selection screen.
    // They are now exclusively handled by the useEffect that manages modal closure.
    setSearchTime(0);
  }, [clearAllTimers]);

  // Check if user has active VIP Pass
  const { data: vipPassData, isError: vipPassError } = useQuery<{ hasActivePass: boolean }>({
    queryKey: [`/api/players/${user?.userId}/vip-status`],
    enabled: open && !!user && !user.isGuest,
    staleTime: 3600000, // 1 hour cache for VIP status
  });
  const hasVipPass = !vipPassError && vipPassData?.hasActivePass === true && !!user && !user.isGuest;

  // Listen for matchmaking success - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    if (!lastMessage) return;

    const isMatchmakingSuccess = ['matchmaking_success', 'game_started', 'match_found'].includes(lastMessage.type);
    
    if (isMatchmakingSuccess && open && isSearching) {
      console.log('🎮 MatchmakingModal: Match found!', lastMessage.type);
      setIsMatchmakingSuccessDetected(true);
      
      // Clear timers immediately but keep isSearching TRUE
      clearAllTimers();
      
      if (lastMessage.room) {
        onMatchFound(lastMessage.room);
      }

      // Just close. The useEffect(!open) will handle the cleanup.
      onClose();
    }
  }, [lastMessage, open, isSearching, onMatchFound, onClose, resetMatchmakingState]);

  // Reset timer when modal opens
  useEffect(() => {
    if (open) {
      setSearchTime(0);
    }
  }, [open]);

  const joinMatchmakingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/matchmaking/join', { method: 'POST', body: { betAmount: selectedBet } });
      return response.json();
    },
    onSuccess: (data) => {
      // Establish searching state immediately regardless of status
      setIsSearching(true);
      setSearchTime(0);

      if (data.status === 'matched') {
        console.log('🎮 MatchmakingModal: Matched immediately, keeping search state visible');
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: t('unauthorized'),
          description: t('loggedOutLoggingIn'),
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      console.error('🚨 Matchmaking error:', error);

      let displayMessage = error.data?.message || error.message;

      if (displayMessage && typeof displayMessage === 'string' && displayMessage.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(displayMessage);
          displayMessage = parsed.message || displayMessage;
        } catch (e) {
          // Keep original message if parsing fails
        }
      }

      if (error.status === 403 && (displayMessage?.includes('coins') || displayMessage?.includes('Insufficient'))) {
        setErrorModal({
          open: true,
          title: 'Insufficient Coins',
          message: displayMessage || 'You need 1000 coins to play online. Win AI games to earn coins!',
          type: 'coins'
        });
      } else {
        setErrorModal({
          open: true,
          title: 'Error',
          message: displayMessage || 'An error occurred. Please try again.',
          type: 'error'
        });
      }
      setIsSearching(false);
      setSearchTime(0);
    },
  });

  const leaveMatchmakingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/matchmaking/leave', { method: 'POST', body: {} });
      return response.json();
    },
    onSuccess: () => {
      setIsSearching(false);
      setSearchTime(0);
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartSearch = () => {
    console.log('🎮 MatchmakingModal: Starting matchmaking search');

    // Auto-leave current room before starting matchmaking
    if (currentRoom && leaveRoom) {
      console.log(`🏠 Auto-leaving current room ${currentRoom.id} before starting matchmaking`);
      leaveRoom(currentRoom.id);
    }

    // Check WebSocket connection
    if (!isWebSocketConnected) {
      console.log('🚫 WebSocket not connected');
      setErrorModal({
        open: true,
        title: 'Connection Error',
        message: 'WebSocket connection required for matchmaking. Please try again.',
        type: 'error'
      });
      return;
    }

    // Start matchmaking directly
    setSearchTime(0);
    joinMatchmakingMutation.mutate();
  };

  const handleCancelSearch = () => {
    console.log('🎮 MatchmakingModal: Cancel search requested');
    // Immediately reset state to stop UI timer
    resetMatchmakingState();
    setIsSearching(false);
    // Notify server to clear backend timer and queue entry
    leaveMatchmakingMutation.mutate();
  };

  const handleClose = () => {
    console.log('🎮 MatchmakingModal: Close requested, isSearching:', isSearching);
    if (isSearching) {
      // Notify server to clear backend timer and queue entry
      leaveMatchmakingMutation.mutate();
      resetMatchmakingState();
      // Only set searching to false when user EXPLICITLY cancels
      setIsSearching(false);
    } else {
      resetMatchmakingState();
    }
    onClose();
  };

  // Reset state when modal is fully closed to ensure next time is fresh
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setIsSearching(false);
        setIsMatchFound(false);
        setIsMatchmakingSuccessDetected(false);
        setSearchTime(0);
        connectionLostToastShownRef.current = false;
        clearAllTimers();
      }, 300); // Small delay to wait for closing animation
      return () => clearTimeout(timer);
    }
  }, [open, clearAllTimers]);

  // Cancel matchmaking if connection is lost while searching
  useEffect(() => {
    if (isSearching && (!isWebSocketConnected || !isOnline)) {
      // Only show toast once per connection loss event
      if (!connectionLostToastShownRef.current) {
        console.log('🚫 MatchmakingModal: Connection lost while searching');
        connectionLostToastShownRef.current = true;
        
        toast({
          title: 'Connection Lost',
          description: 'Matchmaking cancelled. Please reconnect and try again.',
          variant: "destructive",
        });
      }
      
      resetMatchmakingState();
      leaveMatchmakingMutation.mutate();
    }
  }, [isWebSocketConnected, isOnline, isSearching, resetMatchmakingState]);

  // Search timer and emergency timeout
  useEffect(() => {
    clearAllTimers();

    if (isSearching) {
      // Regular search timer
      timerRef.current = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);

      // Emergency timeout after 90 seconds
      emergencyTimeoutRef.current = setTimeout(() => {
        console.log('🚨 MatchmakingModal: Emergency timeout - closing after 90 seconds');
        resetMatchmakingState();
        onClose();
      }, 90000);
    }

    return () => {
      clearAllTimers();
    };
  }, [isSearching, onClose, clearAllTimers, resetMatchmakingState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
    {open && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}
        onClick={handleClose}
      >
        {/* Main Modal Card */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
            borderRadius: '16px',
            maxWidth: '90%',
            width: '420px',
            maxHeight: '80vh',
            overflowY: 'auto',
            position: 'relative',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            boxSizing: 'border-box'
          }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* Close Button */}
          <button
            onClick={handleClose}
            data-testid="close-matchmaking"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: '#ffd700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>

          {isMatchFound ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
              <div style={{
                width: '70px',
                height: '70px',
                margin: '0 auto 20px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
                animation: 'pulse 1.5s infinite'
              }}>
                <Zap style={{ width: '35px', height: '35px', color: '#ffffff' }} />
              </div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '900',
                color: '#10b981',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {t('matchFound') || 'Match Found!'}
              </h2>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '500'
              }}>
                {t('preparingYourGame') || 'Preparing your game...'}
              </p>
            </div>
          ) : (!isSearching && !joinMatchmakingMutation.isPending && !isMatchmakingSuccessDetected) ? (
            <div style={{ padding: '24px 20px', boxSizing: 'border-box', width: '100%' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 12px',
                  background: '#ffd700',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255, 215, 0, 0.3)'
                }}>
                  <Zap style={{ width: '28px', height: '28px', color: '#000000' }} />
                </div>
                <h2 style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '4px'
                }}>
                  {t('quickMatch')}
                </h2>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500'
                }}>
                  {t('findAnotherPlayerCompete')}
                </p>
              </div>

              {/* Bet Selection */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '10px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Select Bet Amount
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedBet(5000)}
                    data-testid="bet-5k"
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      background: selectedBet === 5000
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: selectedBet === 5000
                        ? '2px solid rgba(59, 130, 246, 0.5)'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedBet !== 5000) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedBet !== 5000) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '3px' }}>
                      <Coins style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                      <span style={{ fontSize: '18px', fontWeight: '800' }}>5k</span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>
                      Starter
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBet(1000000)}
                    data-testid="bet-1m"
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      background: selectedBet === 1000000
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: selectedBet === 1000000
                        ? '2px solid rgba(59, 130, 246, 0.5)'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedBet !== 1000000) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedBet !== 1000000) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '3px' }}>
                      <Coins style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                      <span style={{ fontSize: '18px', fontWeight: '800' }}>1M</span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>
                      Pro
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBet(10000000)}
                    data-testid="bet-10m"
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      background: selectedBet === 10000000
                        ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: selectedBet === 10000000
                        ? '2px solid rgba(139, 92, 246, 0.5)'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedBet !== 10000000) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedBet !== 10000000) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '3px' }}>
                      <Coins style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                      <span style={{ fontSize: '18px', fontWeight: '800' }}>10M</span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>
                      Elite
                    </div>
                  </button>
                </div>
                {/* VIP Bet Option */}
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => hasVipPass && setSelectedBet(30000000)}
                    data-testid="bet-30m-vip"
                    disabled={!hasVipPass}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      background: !hasVipPass
                        ? 'rgba(100, 100, 100, 0.1)'
                        : selectedBet === 30000000
                          ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                          : 'rgba(251, 191, 36, 0.1)',
                      border: !hasVipPass
                        ? '2px solid rgba(100, 100, 100, 0.3)'
                        : selectedBet === 30000000
                          ? '2px solid rgba(251, 191, 36, 0.7)'
                          : '2px solid rgba(251, 191, 36, 0.3)',
                      color: 'white',
                      cursor: hasVipPass ? 'pointer' : 'not-allowed',
                      opacity: hasVipPass ? 1 : 0.7,
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (hasVipPass && selectedBet !== 30000000) {
                        e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasVipPass && selectedBet !== 30000000) {
                        e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {!hasVipPass && <Lock style={{ width: '16px', height: '16px', color: '#888' }} />}
                      <Crown style={{ width: '20px', height: '20px', color: !hasVipPass ? '#888' : (selectedBet === 30000000 ? '#000' : '#fbbf24') }} />
                      <span style={{ fontSize: '20px', fontWeight: '800', color: !hasVipPass ? '#888' : (selectedBet === 30000000 ? '#000' : '#fbbf24') }}>30M</span>
                      <span style={{ 
                        fontSize: '10px', 
                        background: !hasVipPass ? 'linear-gradient(135deg, #888, #666)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                        color: !hasVipPass ? '#fff' : '#000', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontWeight: '700'
                      }}>VIP</span>
                    </div>
                    <div style={{ fontSize: '10px', color: !hasVipPass ? 'rgba(150, 150, 150, 0.8)' : (selectedBet === 30000000 ? 'rgba(0,0,0,0.7)' : 'rgba(251, 191, 36, 0.8)'), fontWeight: '600', marginTop: '2px' }}>
                      {hasVipPass ? 'Exclusive VIP Pass Bet' : 'VIP Pass Required'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Status Info */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                padding: '10px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '2px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981'
                  }} />
                  <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '700' }}>
                    {t('onlinePlayersLookingForMatches')}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  {t('averageMatchTime')}
                </div>
              </div>

              {/* Find Match Button */}
              <button
                onClick={handleStartSearch}
                data-testid="find-match-button"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: '#ffd700',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: '#000000',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffed4e';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffd700';
                }}
              >
                <Zap style={{ width: '18px', height: '18px' }} />
                {t('findMatch')}
              </button>
            </div>
          ) : (
            <div style={{ padding: '28px 24px', boxSizing: 'border-box', width: '100%' }}>
              {/* Searching Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 16px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <radialGradient id="goldGradient">
                        <stop offset="0%" style={{ stopColor: '#ffed4e', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
                      </radialGradient>
                      <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ffed4e', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#d4af37', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    
                    <circle cx="50" cy="50" r="48" fill="url(#rimGradient)" opacity="0.3" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#rimGradient)" strokeWidth="3" />
                    <circle cx="50" cy="50" r="42" fill="url(#goldGradient)" />
                    
                    <g opacity="0.15" stroke="#000000" strokeWidth="0.5" fill="none">
                      <circle cx="50" cy="50" r="35" />
                      <circle cx="50" cy="50" r="25" />
                      <circle cx="50" cy="50" r="15" />
                      <line x1="50" y1="8" x2="50" y2="92" />
                      <line x1="8" y1="50" x2="92" y2="50" />
                      <line x1="20" y1="20" x2="80" y2="80" />
                      <line x1="80" y1="20" x2="20" y2="80" />
                    </g>
                    
                    <g fill="#1a1a1a" opacity="0.9">
                      <ellipse cx="32" cy="40" rx="6" ry="7" />
                      <path d="M 32 47 Q 27 52, 27 60 L 27 62 Q 27 64, 29 64 L 35 64 Q 37 64, 37 62 L 37 60 Q 37 52, 32 47 Z" />
                      <ellipse cx="68" cy="40" rx="6" ry="7" />
                      <path d="M 68 47 Q 63 52, 63 60 L 63 62 Q 63 64, 65 64 L 71 64 Q 73 64, 73 62 L 73 60 Q 73 52, 68 47 Z" />
                    </g>
                    
                    <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="900" fill="#1a1a1a" opacity="0.4">VS</text>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" opacity="0.6" />
                    <circle cx="25" cy="25" r="2" fill="rgba(255, 255, 255, 0.8)" />
                    <circle cx="75" cy="25" r="1.5" fill="rgba(255, 255, 255, 0.6)" />
                    <circle cx="25" cy="75" r="1.5" fill="rgba(255, 255, 255, 0.6)" />
                    <circle cx="75" cy="75" r="2" fill="rgba(255, 255, 255, 0.8)" />
                  </svg>
                </div>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '900',
                  color: 'white',
                  marginBottom: '6px'
                }}>
                  {t('searchingForOpponent')}
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '500'
                }}>
                  {t('lookingForPlayer')}
                </p>
              </div>

              {/* Search Stats */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>
                      {t('searchTime')}
                    </span>
                    <span style={{ fontSize: '16px', color: '#ffd700', fontWeight: '800', fontFamily: 'monospace' }}>
                      {formatTime(searchTime)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{
                        height: '100%',
                        background: searchTime >= 25
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : 'linear-gradient(90deg, #ffd700, #ffed4e)',
                        width: `${Math.min((searchTime / 30) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '600' }}>
                    {t('status')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                      animation: 'pulse 2s infinite'
                    }} />
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: '600' }}>
                      {t('searching')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={handleCancelSearch}
                data-testid="cancel-search-button"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                {t('Cancel Search')}
              </button>
            </div>
          )}

          {/* Error Modal */}
          <ErrorModal
            open={errorModal.open}
            onClose={() => setErrorModal({ ...errorModal, open: false })}
            title={errorModal.title}
            message={errorModal.message}
            type={errorModal.type}
          />
        </div>
      </div>
    )}
    </>
  );
}
