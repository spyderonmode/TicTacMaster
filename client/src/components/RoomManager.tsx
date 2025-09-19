import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, LogOut, Play, UserPlus } from "lucide-react";
import { InviteFriendsModal } from "./InviteFriendsModal";
import { useTranslation } from "@/contexts/LanguageContext";

interface RoomManagerProps {
  currentRoom: any;
  onRoomJoin: (room: any) => void;
  onRoomLeave: () => void;
  onCreateRoom: () => void;
  onGameStart: (game: any) => void;
  gameMode: 'ai' | 'pass-play' | 'online';
  user: any;
}

export function RoomManager({ 
  currentRoom, 
  onRoomJoin, 
  onRoomLeave, 
  onCreateRoom, 
  onGameStart,
  gameMode,
  user 
}: RoomManagerProps) {
  const { t } = useTranslation();
  const [joinCode, setJoinCode] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentJoinRequestId, setCurrentJoinRequestId] = useState<string | null>(null);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { sendMessage, isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  // Fetch participants for the current room - reuse the same query key to share cache
  const { data: participants = [] } = useQuery({
    queryKey: ["/api/rooms", currentRoom?.id, "participants"], // Use same key as PlayerList
    enabled: !!currentRoom,
    staleTime: 8000, // Consider data fresh for 8 seconds
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Only refetch if data is stale
    refetchInterval: false, // Don't poll here, let PlayerList handle it
  });

  // WebSocket event listeners for room joining
  useEffect(() => {
    const handleJoinRoomSuccess = (event: any) => {
      const { room, requestId } = event.detail;
      // Only handle if this is the response to our current request, or if no requestId correlation
      if (!requestId || requestId === currentJoinRequestId) {
        // Clear timeout if it exists
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
        setIsJoining(false);
        setCurrentJoinRequestId(null);
        onRoomJoin(room);
        setJoinCode("");
        toast({
          title: t('success'),
          description: t('joinedRoomSuccessfully'),
        });
      }
    };

    const handleJoinRoomError = (event: any) => {
      const { error, message, requestId } = event.detail;
      // Only handle if this is the response to our current request, or if no requestId correlation
      if (!requestId || requestId === currentJoinRequestId) {
        // Clear timeout if it exists
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
        setIsJoining(false);
        setCurrentJoinRequestId(null);
        
        // Handle insufficient coins error
        if (message && message.includes('coins')) {
          toast({
            title: '💰 Insufficient Coins',
            description: message,
            variant: "destructive",
          });
          return;
        }
        
        toast({
          title: t('error'),
          description: message || 'Failed to join room. Please try again.',
          variant: "destructive",
        });
      }
    };

    window.addEventListener('join_room_success', handleJoinRoomSuccess);
    window.addEventListener('join_room_error', handleJoinRoomError);

    return () => {
      window.removeEventListener('join_room_success', handleJoinRoomSuccess);
      window.removeEventListener('join_room_error', handleJoinRoomError);
    };
  }, [onRoomJoin, toast, t, currentJoinRequestId]);

  // Cleanup timeout and listeners on unmount
  useEffect(() => {
    return () => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
      if (startGameTimeoutRef.current) {
        clearTimeout(startGameTimeoutRef.current);
        startGameTimeoutRef.current = null;
      }
      // Remove any pending start game event listeners
      if (startGameHandlersRef.current.success) {
        window.removeEventListener('start_game_success', startGameHandlersRef.current.success);
        startGameHandlersRef.current.success = undefined;
      }
      if (startGameHandlersRef.current.error) {
        window.removeEventListener('start_game_error', startGameHandlersRef.current.error);
        startGameHandlersRef.current.error = undefined;
      }
    };
  }, []);

  // WebSocket-based room joining (replaced useMutation)

  // WebSocket-based game starting (replaced useMutation) 
  const [isStartingGame, setIsStartingGame] = useState(false);
  const startGameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentStartGameRequestId = useRef<string | null>(null);
  const startGameHandlersRef = useRef<{ success?: EventListener; error?: EventListener }>({});

  const handleStartGame = useCallback(() => {
    if (!currentRoom || !isConnected) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: 'Not connected to server. Please wait and try again.',
      });
      return;
    }

    const requestId = Math.random().toString(36).substring(7);
    currentStartGameRequestId.current = requestId;
    setIsStartingGame(true);

    startGameTimeoutRef.current = setTimeout(() => {
      setIsStartingGame(false);
      currentStartGameRequestId.current = null;
      startGameTimeoutRef.current = null;
      toast({
        variant: "destructive", 
        title: t('error'),
        description: 'Request timed out. Please try again.',
      });
      
      // Cleanup listeners on timeout
      window.removeEventListener('start_game_success', handleSuccess as EventListener);
      window.removeEventListener('start_game_error', handleError as EventListener);
    }, 15000);

    const handleSuccess = (event: CustomEvent) => {
      // Allow events without requestId or matching requestId (server compatibility)
      if (event.detail.requestId && event.detail.requestId !== requestId) return;
      
      if (startGameTimeoutRef.current) {
        clearTimeout(startGameTimeoutRef.current);
        startGameTimeoutRef.current = null;
      }
      currentStartGameRequestId.current = null;
      setIsStartingGame(false);
      
      // Game started successfully - handle different payload shapes
      const gameData = event.detail.game || event.detail.data?.game || event.detail;
      onGameStart(gameData);
      toast({
        title: t('gameStarted'),
        description: t('letTheBattleBegin'),
      });
      
      // Cleanup listeners
      window.removeEventListener('start_game_success', handleSuccess as EventListener);
      window.removeEventListener('start_game_error', handleError as EventListener);
    };

    const handleError = (event: CustomEvent) => {
      // Allow events without requestId or matching requestId (server compatibility)
      if (event.detail.requestId && event.detail.requestId !== requestId) return;
      
      if (startGameTimeoutRef.current) {
        clearTimeout(startGameTimeoutRef.current);
        startGameTimeoutRef.current = null;
      }
      currentStartGameRequestId.current = null;
      setIsStartingGame(false);
      
      const error = event.detail;
      console.error('Start game error:', error);
      
      if (error.message && error.message.includes('unauthorized')) {
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
      
      toast({
        title: t('error'),
        description: error.message || 'Failed to start game. Please try again.',
        variant: "destructive",
      });
      
      // Cleanup listeners
      window.removeEventListener('start_game_success', handleSuccess as EventListener);
      window.removeEventListener('start_game_error', handleError as EventListener);
    };

    // Store handlers for unmount cleanup
    startGameHandlersRef.current.success = handleSuccess as EventListener;
    startGameHandlersRef.current.error = handleError as EventListener;

    // Add event listeners
    window.addEventListener('start_game_success', handleSuccess as EventListener);
    window.addEventListener('start_game_error', handleError as EventListener);

    // Send WebSocket message
    sendMessage({
      type: 'start_game_request',
      roomId: currentRoom.id,
      requestId: requestId
    });
  }, [currentRoom, isConnected, sendMessage, t, toast, onGameStart]);

  const handleJoinRoom = (role: 'player' | 'spectator' = 'player') => {
    if (!joinCode.trim()) {
      toast({
        title: t('error'),
        description: 'Please enter a room code',
        variant: "destructive",
      });
      return;
    }

    // Check WebSocket connection before sending
    if (!isConnected) {
      toast({
        title: t('error'),
        description: 'Not connected to server. Please wait and try again.',
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    const requestId = Math.random().toString(36).substring(7);
    setCurrentJoinRequestId(requestId);
    
    // Set timeout to handle no response scenarios
    joinTimeoutRef.current = setTimeout(() => {
      // Only timeout if we're still waiting for this specific request
      setIsJoining(false);
      setCurrentJoinRequestId(null);
      joinTimeoutRef.current = null;
      toast({
        title: t('error'),
        description: 'Request timeout. Please try again.',
        variant: "destructive",
      });
    }, 15000); // 15 second timeout
    
    sendMessage({
      type: 'join_room_request',
      requestId,
      code: joinCode.trim().toUpperCase(),
      role
    });
  };

  const handleLeaveRoom = () => {
    onRoomLeave();
    toast({
      title: t('leftRoom'),
      description: t('youHaveLeftTheRoom'),
    });
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg">{t('roomManagement')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentRoom ? (
          <>
            {/* Join Room */}
            <div className="space-y-2">
              <Input
                placeholder={t('roomCode')}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="bg-slate-700 border-slate-600 text-white"
                maxLength={8}
              />
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button 
                  onClick={() => handleJoinRoom('player')}
                  disabled={!joinCode.trim() || isJoining}
                  className="w-full sm:flex-1 bg-green-600 hover:bg-green-700"
                >
                  {t('joinAsPlayer')}
                </Button>
                <Button 
                  onClick={() => handleJoinRoom('spectator')}
                  disabled={!joinCode.trim() || isJoining}
                  className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {t('joinAsSpectator')}
                </Button>
              </div>
            </div>
            
            {/* Create Room */}
            <Button 
              onClick={onCreateRoom}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isJoining}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('createNewRoom')}
            </Button>
          </>
        ) : (
          <>
            {/* Current Room */}
            <div className="p-3 bg-slate-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{t('currentRoom')}</span>
                <Badge variant="secondary" className={`${
                  currentRoom.status === 'playing' ? 'bg-orange-600' : 
                  currentRoom.status === 'waiting' ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {currentRoom.status === 'playing' ? t('playing') : 
                   currentRoom.status === 'waiting' ? t('waiting') : t('active')}
                </Badge>
              </div>
              <div className="text-sm text-gray-400">
                {t('room')} #{currentRoom.code}
              </div>
              <div className="text-sm text-gray-400">
                {currentRoom.name}
              </div>
            </div>

            {/* Room Actions */}
            <div className="space-y-2">
              {/* Main action buttons */}
              <div className="flex space-x-2">
                {/* Check if user is the room creator */}
                {currentRoom.ownerId === (user?.userId || user?.id) ? (
                  <Button
                    onClick={handleStartGame}
                    disabled={isStartingGame || currentRoom.status === 'playing'}
                    className="flex-1 bg-primary hover:bg-primary/90"
                    data-testid="button-start-game"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isStartingGame ? t('starting') : 
                     currentRoom.status === 'playing' ? t('gameRunning') : t('startGame')}
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="flex-1 bg-gray-600 cursor-not-allowed"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {currentRoom.status === 'playing' ? t('gameRunning') : t('waitForStart')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleLeaveRoom}
                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Invite friends button (only for room owner and when not playing) */}
              {currentRoom.ownerId === (user?.userId || user?.id) && currentRoom.status !== 'playing' && (
                <Button
                  onClick={() => setShowInviteModal(true)}
                  variant="outline"
                  className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('inviteFriends')}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      {/* Invite Friends Modal */}
      {currentRoom && (
        <InviteFriendsModal
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          roomId={currentRoom.id}
          roomName={currentRoom.name}
        />
      )}
    </Card>
  );
}
