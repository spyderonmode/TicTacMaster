import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Loader2, Users, X, Zap, Coins } from "lucide-react";
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
  refreshWebSocketConnection?: () => void;
  currentRoom?: any;
  leaveRoom?: (roomId: string) => void;
}

export function MatchmakingModal({ open, onClose, onMatchFound, user, isWebSocketConnected = true, refreshWebSocketConnection, currentRoom, leaveRoom }: MatchmakingModalProps) {
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [isWebSocketHandlingEnabled, setIsWebSocketHandlingEnabled] = useState(false);
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

  // Reset timer when modal opens
  useEffect(() => {
    if (open) {
      setSearchTime(0);
    }
  }, [open]);

  // Simplified: No complex WebSocket handling states needed

  // AGGRESSIVE: Listen for ANY matchmaking message and close modal immediately
  useEffect(() => {
    if (lastMessage) {
      // Handle WebSocket messages

      // CRITICAL FIX: Process game_started messages even if modal shows as closed
      if (lastMessage) {
        // SIMPLIFIED: Only listen for essential matchmaking messages
        const isMatchmakingSuccess = ['matchmaking_success', 'game_started'].includes(lastMessage.type);

        if (isMatchmakingSuccess) {
          //console.log('🎮 MatchmakingModal: CRITICAL FIX - Received matchmaking message:', lastMessage.type);
          //console.log('🎮 MatchmakingModal: Current state:', { open, isSearching });

          // Special handling for game_started - always close modal regardless of state
          if (lastMessage.type === 'game_started') {
            // Game started - force closing modal
            setIsSearching(false);
            setSearchTime(0);
            setQueuePosition(0);
            onClose();
            return; // Exit early for game_started
          }

          // For other matchmaking messages, only process if modal is open
          if (open) {
            // FORCE stop all searching states
            setIsSearching(false);
            setSearchTime(0);
            setQueuePosition(0);

            // Always call onMatchFound if room data is available
            if (lastMessage.room) {
              //console.log('🎮 MatchmakingModal: FORCE - Calling onMatchFound with room data');
              onMatchFound(lastMessage.room);
            }

            // FORCE close the modal
            //console.log('🎮 MatchmakingModal: FORCE - Calling onClose to force modal closure');
            onClose();
          }
        }
      }
    }
  }, [lastMessage, open, isSearching, onClose, onMatchFound]);

  // CRITICAL FIX: Always listen for matchmaking events regardless of modal state
  useEffect(() => {
    const handleGlobalMatchmaking = (event: CustomEvent) => {
      const message = event.detail;
      console.log('🎮 MatchmakingModal: Received matchmaking message:', message.type, 'Modal open:', open);

      // Handle matchmaking messages regardless of modal open state
      if (['match_found', 'matchmaking_success', 'game_started'].includes(message.type)) {
        console.log('🎮 MatchmakingModal: Processing critical matchmaking message:', message.type);

        // Reset modal state immediately
        setIsSearching(false);
        setSearchTime(0);
        setQueuePosition(0);
        setSearchStartTime(null);
        setIsWebSocketHandlingEnabled(false);

        if (message.type === 'match_found' || message.type === 'matchmaking_success') {
          if (message.room) {
            console.log('🎮 MatchmakingModal: Match found! Room data:', message.room);

            // CRITICAL FIX: Force a brief delay to ensure UI state is ready before calling onMatchFound
            // This fixes the issue where the second player gets auto-connected without proper UI refresh
            setTimeout(() => {
              console.log('🎮 MatchmakingModal: Calling onMatchFound with room data');
              onMatchFound(message.room);
              onClose();
            }, 100); // Small delay to ensure proper state synchronization
          }
        }

        if (message.type === 'game_started') {
          console.log('🎮 MatchmakingModal: Game started - ensuring modal is closed');
          onClose();
        }
      }
    };

    const handleForceClose = (event: CustomEvent) => {
      // Emergency force close triggered
      setIsSearching(false);
      setSearchTime(0);
      setQueuePosition(0);
      setSearchStartTime(null);
      setIsWebSocketHandlingEnabled(false);
      onClose();
    };

    window.addEventListener('matchmaking_message_received', handleGlobalMatchmaking as EventListener);
    window.addEventListener('force_close_matchmaking', handleForceClose as EventListener);

    return () => {
      window.removeEventListener('matchmaking_message_received', handleGlobalMatchmaking as EventListener);
      window.removeEventListener('force_close_matchmaking', handleForceClose as EventListener);
    };
  }, [onClose, onMatchFound]); // Listen regardless of modal open state

  // WebSocket message handling is now managed by parent component (home.tsx) to prevent conflicts

  const joinMatchmakingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/matchmaking/join', { method: 'POST', body: { betAmount: selectedBet } });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'matched') {
        setIsSearching(false);
        // Parent component handles WebSocket messages and room joining
        // No need for onClose() here as parent will handle it
        toast({
          title: t('matchFound'),
          description: t('matchedWithOpponent'),
        });
      } else if (data.status === 'waiting') {
        setIsSearching(true);
        setQueuePosition(1);
        toast({
          title: t('searchingForOpponent'),
          description: t('lookingForPlayer'),
        });
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

      // Handle specific error types with appropriate styling and messages
      let toastTitle = t('error');
      let errorMessage = error.message;
      let variant: "destructive" | "default" = "destructive";

      // Extract clean message from error object
      // Priority: error.data.message > error.message
      // If error.message is a JSON string, try to parse it to get the message field
      let displayMessage = error.data?.message || error.message;

      // If displayMessage looks like JSON, try to parse it to extract the message
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
      } else if (displayMessage?.includes('room') || displayMessage?.includes('connection')) {
        setErrorModal({
          open: true,
          title: 'Connection Error',
          message: 'Connection issue. Please try again.',
          type: 'error'
        });
      } else if (displayMessage?.includes('queue')) {
        setErrorModal({
          open: true,
          title: 'Matchmaking Error',
          message: 'Matchmaking queue error. Please try again.',
          type: 'error'
        });
      } else {
        setErrorModal({
          open: true,
          title: 'Error',
          message: displayMessage || errorMessage || 'An error occurred. Please try again.',
          type: 'error'
        });
      }
      setIsSearching(false);

      // Reset modal state on error
      setSearchTime(0);
      setQueuePosition(0);
      setSearchStartTime(null);
      setIsWebSocketHandlingEnabled(false);
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
      setQueuePosition(0);
      toast({
        title: t('leftQueue'),
        description: t('leftMatchmakingQueue'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartSearch = async () => {
    console.log('🎮 MatchmakingModal: Pre-matchmaking connection validation');

    // Auto-leave current room before starting matchmaking to prevent connection conflicts
    if (currentRoom && leaveRoom) {
      console.log(`🏠 Auto-leaving current room ${currentRoom.id} before starting matchmaking`);
      leaveRoom(currentRoom.id);
      toast({
        title: "Left Room",
        description: "Left previous room to start matchmaking",
        duration: 2000,
      });
    }

    // CRITICAL FIX: Always test WebSocket connectivity with ping before matchmaking
    if (!isWebSocketConnected) {
      console.log('🚫 WebSocket not connected, attempting to refresh connection...');
      toast({
        title: 'Connection Issue',
        description: 'Refreshing connection, please wait...',
        variant: "default",
      });

      // Call refresh function if available
      if (refreshWebSocketConnection) {
        refreshWebSocketConnection();
      }

      // Give some time for connection refresh
      setTimeout(() => {
        console.log('🎮 MatchmakingModal: Retrying matchmaking after connection refresh');
        setSearchTime(0);
        setQueuePosition(0);
        setSearchStartTime(Date.now());
        joinMatchmakingMutation.mutate();
      }, 3000);

      return;
    }

    // Test WebSocket with ping before matchmaking - CRITICAL for idle connections
    //console.log('🏓 Testing WebSocket connectivity with ping...');

    // Create a promise to wait for pong response
    const testConnectivity = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection test timeout'));
      }, 5000);

      // Listen for pong response
      const handlePongResponse = (event: CustomEvent) => {
        if (event.detail.type === 'pong') {
          //console.log('🏓 Pong received - WebSocket is active');
          clearTimeout(timeout);
          window.removeEventListener('websocket_pong_received', handlePongResponse as EventListener);
          resolve(true);
        }
      };

      window.addEventListener('websocket_pong_received', handlePongResponse as EventListener);

      // Send ping through global WebSocket
      const pingEvent = new CustomEvent('send_websocket_ping', {
        detail: { type: 'ping', timestamp: Date.now() }
      });
      window.dispatchEvent(pingEvent);
    });

    try {
      await testConnectivity;
      //console.log('🎮 MatchmakingModal: WebSocket connectivity confirmed, starting matchmaking');
      setSearchTime(0);
      setQueuePosition(0);
      setSearchStartTime(Date.now());
      joinMatchmakingMutation.mutate();
    } catch (error) {
      console.error('🚫 WebSocket connectivity test failed:', error);
      toast({
        title: 'Quick Match',
        description: 'We are preparing your room, please wait..',
        variant: "destructive",
      });

      // Attempt connection refresh as fallback
      if (refreshWebSocketConnection) {
        refreshWebSocketConnection();
        setTimeout(() => {
          setSearchTime(0);
          setQueuePosition(0);
          setSearchStartTime(Date.now());
          joinMatchmakingMutation.mutate();
        }, 3000);
      }
    }
  };

  const handleCancelSearch = () => {
    setSearchStartTime(null); // Clear search start time
    setIsWebSocketHandlingEnabled(false); // Disable WebSocket handling
    leaveMatchmakingMutation.mutate();
  };

  const handleClose = () => {
    if (isSearching) {
      handleCancelSearch();
    } else {
      setSearchStartTime(null); // Clear search start time on close
      setIsWebSocketHandlingEnabled(false); // Disable WebSocket handling
    }
    onClose();
  };

  // Listen for matchmaking state changes from parent
  useEffect(() => {
    if (!open && isSearching) {
      // Modal was closed externally (by parent), reset searching state
      //console.log('🎮 MatchmakingModal: Modal closed externally while searching, resetting state');
      setIsSearching(false);
      setSearchTime(0);
      setQueuePosition(0);
      setSearchStartTime(null);
      setIsWebSocketHandlingEnabled(false);
    }
  }, [open, isSearching]);

  // Reset search state when modal opens fresh
  useEffect(() => {
    if (open && !isSearching) {
      setSearchStartTime(null);
      setSearchTime(0);
      setQueuePosition(0);
    }
  }, [open, isSearching]);

  // Search timer and emergency timeout
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let emergencyTimeout: NodeJS.Timeout;

    if (isSearching) {
      // Regular search timer
      timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);

      // Emergency timeout to force close modal after 60 seconds
      emergencyTimeout = setTimeout(() => {
        if (isSearching) {
          //console.log('🚨 MatchmakingModal: Emergency timeout - forcing modal closure after 60 seconds');
          setIsSearching(false);
          setSearchTime(0);
          setQueuePosition(0);
          setSearchStartTime(null);
          setIsWebSocketHandlingEnabled(false);
          onClose();
        }
      }, 60000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(emergencyTimeout);
    };
  }, [isSearching, onClose]);

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
            border: '1px solid rgba(255, 215, 0, 0.2)'
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

          {!isSearching && !joinMatchmakingMutation.isPending ? (
            <div style={{ padding: '24px 20px' }}>
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
            <div style={{ padding: '28px 24px' }}>
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
                    
                    {/* Outer beveled rim */}
                    <circle cx="50" cy="50" r="48" fill="url(#rimGradient)" opacity="0.3" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#rimGradient)" strokeWidth="3" />
                    
                    {/* Main gold coin */}
                    <circle cx="50" cy="50" r="42" fill="url(#goldGradient)" />
                    
                    {/* Radial star-map grid */}
                    <g opacity="0.15" stroke="#000000" strokeWidth="0.5" fill="none">
                      <circle cx="50" cy="50" r="35" />
                      <circle cx="50" cy="50" r="25" />
                      <circle cx="50" cy="50" r="15" />
                      <line x1="50" y1="8" x2="50" y2="92" />
                      <line x1="8" y1="50" x2="92" y2="50" />
                      <line x1="20" y1="20" x2="80" y2="80" />
                      <line x1="80" y1="20" x2="20" y2="80" />
                    </g>
                    
                    {/* Two opposing player silhouettes */}
                    <g fill="#1a1a1a" opacity="0.9">
                      {/* Left player */}
                      <ellipse cx="32" cy="40" rx="6" ry="7" />
                      <path d="M 32 47 Q 27 52, 27 60 L 27 62 Q 27 64, 29 64 L 35 64 Q 37 64, 37 62 L 37 60 Q 37 52, 32 47 Z" />
                      
                      {/* Right player */}
                      <ellipse cx="68" cy="40" rx="6" ry="7" />
                      <path d="M 68 47 Q 63 52, 63 60 L 63 62 Q 63 64, 65 64 L 71 64 Q 73 64, 73 62 L 73 60 Q 73 52, 68 47 Z" />
                    </g>
                    
                    {/* VS symbol in center */}
                    <text x="50" y="58" textAnchor="middle" fontSize="18" fontWeight="900" fill="#1a1a1a" opacity="0.4">VS</text>
                    
                    {/* Inner highlight for depth */}
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1.5" opacity="0.6" />
                    
                    {/* Subtle sparkle accents */}
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
                      background: '#fbbf24'
                    }} />
                    <span style={{ fontSize: '14px', color: '#fbbf24', fontWeight: '700' }}>
                      {t('searching')}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: '16px', fontSize: '12px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
                  {searchTime < 10 ? (
                    t('findingPerfectOpponent')
                  ) : searchTime < 20 ? (
                    t('expandingSearch')
                  ) : searchTime < 25 ? (
                    t('expandingSearch')
                  ) : (
                    t('findingPerfectOpponent')
                  )}
                </div>
              </div>

              {/* Cancel Button */}
              <button
                onClick={handleCancelSearch}
                disabled={leaveMatchmakingMutation.isPending}
                data-testid="cancel-search-button"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: '#ffd700',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: leaveMatchmakingMutation.isPending ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: leaveMatchmakingMutation.isPending ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (!leaveMatchmakingMutation.isPending) {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
                {t('cancel')}
              </button>
            </div>
          )}
        </div>
      </div>
    )}

    <ErrorModal
      open={errorModal.open}
      onClose={() => setErrorModal(prev => ({ ...prev, open: false }))}
      title={errorModal.title}
      message={errorModal.message}
      type={errorModal.type}
    />
  </>
  );
}