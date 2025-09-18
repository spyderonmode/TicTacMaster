import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Loader2, Users, X, Zap } from "lucide-react";
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
}

export function MatchmakingModal({ open, onClose, onMatchFound, user, isWebSocketConnected = true, refreshWebSocketConnection }: MatchmakingModalProps) {
  const { t } = useTranslation();
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [isWebSocketHandlingEnabled, setIsWebSocketHandlingEnabled] = useState(false);
  const [errorModal, setErrorModal] = useState<{open: boolean, title: string, message: string, type?: 'error' | 'coins' | 'warning'}>({
    open: false,
    title: '',
    message: '',
    type: 'error'
  });
  const { toast } = useToast();
  const { lastMessage } = useWebSocket();
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      //console.log('🎮 MatchmakingModal: Starting timer');
      interval = setInterval(() => {
        setSearchTime(prev => {
          const newTime = prev + 1;
          //console.log('🎮 MatchmakingModal: Timer tick:', newTime);
          return newTime;
        });
      }, 1000);
    } else {
      // Stopping timer
    }
    return () => {
      if (interval) {
        //console.log('🎮 MatchmakingModal: Cleaning up timer');
        clearInterval(interval);
      }
    };
  }, [isSearching]);

  // Reset timer when modal opens to prevent double counting
  useEffect(() => {
    if (open) {
      //console.log('🎮 MatchmakingModal: Modal opened, resetting timer');
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
      const response = await apiRequest('/api/matchmaking/join', { method: 'POST', body: {} });
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
      
      // Check for insufficient coins error and show modal instead of toast
      if (error.status === 403 && error.message?.includes('coins')) {
        setErrorModal({
          open: true,
          title: 'Insufficient Coins',
          message: error.message || 'You need 100 coins to play online. Win AI games to earn coins!',
          type: 'coins'
        });
      } else if (error.message.includes('room') || error.message.includes('connection')) {
        setErrorModal({
          open: true,
          title: 'Connection Error',
          message: 'Connection issue. Please try again.',
          type: 'error'
        });
      } else if (error.message.includes('queue')) {
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
          message: errorMessage,
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {t('quickMatch')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isSearching && !joinMatchmakingMutation.isPending ? (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <Users className="h-12 w-12 mx-auto text-blue-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">{t('readyToPlay')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('findAnotherPlayerCompete')}
                </p>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>{t('onlinePlayersLookingForMatches')}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('averageMatchTime')}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                onClick={handleStartSearch}
                className="w-full"
                size="lg"
              >
                <Zap className="h-4 w-4 mr-2" />
                {t('findMatch')}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{t('searchingForOpponent')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('lookingForPlayer')}
                </p>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('searchTime')}</span>
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {formatTime(searchTime)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('status')}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                          {t('searching')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          searchTime >= 25 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                        style={{ width: `${Math.min((searchTime / 25) * 100, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-center">
                      {searchTime < 10 ? (
                        <span className="text-gray-500">{t('findingPerfectOpponent')}</span>
                      ) : searchTime < 20 ? (
                        <span className="text-gray-500">{t('expandingSearch')}</span>
                      ) : searchTime < 25 ? (
                        <span className="text-gray-500">{t('expandingSearch')}</span>
                      ) : (
                        <span className="text-blue-500 font-medium">{t('findingPerfectOpponent')}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Button 
                onClick={handleCancelSearch}
                variant="outline"
                className="w-full"
                disabled={leaveMatchmakingMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                {t('cancel')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    
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