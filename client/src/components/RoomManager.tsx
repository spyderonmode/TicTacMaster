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
import { Plus, LogOut, Play, UserPlus, DoorOpen, Users2, Eye } from "lucide-react";
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
  const [isJoiningAsPlayer, setIsJoiningAsPlayer] = useState(false);
  const [isJoiningAsSpectator, setIsJoiningAsSpectator] = useState(false);
  const [currentJoinRequestId, setCurrentJoinRequestId] = useState<string | null>(null);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { sendMessage, isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  // Fetch participants for the current room - reuse the same query key to share cache
  const { data: participants = [] } = useQuery({
    queryKey: ["/api/rooms", currentRoom?.id, "participants"], // Use same key as PlayerList
    enabled: !!currentRoom,
    staleTime: 3000, // Shorter stale time for real-time data
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: true, // Always fetch on mount for slow connections
    refetchInterval: false, // Don't poll here, let PlayerList handle it
  });

  // WebSocket event listeners for room joining
  useEffect(() => {
    const handleJoinRoomSuccess = (event: any) => {
      const { room, requestId, participants: roomParticipants } = event.detail;
      // Accept late responses idempotently - don't discard based on requestId mismatch
      const shouldProcess = !requestId || requestId === currentJoinRequestId || isJoiningAsPlayer || isJoiningAsSpectator;

      if (shouldProcess) {
        // Clear timeout if it exists
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
        setIsJoiningAsPlayer(false);
        setIsJoiningAsSpectator(false);
        setCurrentJoinRequestId(null);

        // Hydrate participants cache if provided
        if (roomParticipants && room?.id) {
          queryClient.setQueryData(
            ["/api/rooms", room.id, "participants"],
            roomParticipants
          );
        }

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
      // Accept late responses if still trying to join
      const shouldProcess = !requestId || requestId === currentJoinRequestId || isJoiningAsPlayer || isJoiningAsSpectator;

      if (shouldProcess) {
        // Clear timeout if it exists
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
        setIsJoiningAsPlayer(false);
        setIsJoiningAsSpectator(false);
        setCurrentJoinRequestId(null);

        // Note: Error modal is handled by home.tsx, no toast needed here to avoid duplicate messages
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

      // Handle unauthorized errors with redirect
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

      // Note: Error modal is handled by home.tsx, no toast needed here to avoid duplicate messages

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

    if (role === 'player') {
      setIsJoiningAsPlayer(true);
    } else {
      setIsJoiningAsSpectator(true);
    }
    const requestId = Math.random().toString(36).substring(7);
    setCurrentJoinRequestId(requestId);

    // Set timeout to handle no response scenarios
    joinTimeoutRef.current = setTimeout(() => {
      // Only timeout if we're still waiting for this specific request
      setIsJoiningAsPlayer(false);
      setIsJoiningAsSpectator(false);
      setCurrentJoinRequestId(null);
      joinTimeoutRef.current = null;
      toast({
        title: t('error'),
        description: 'Request timeout. Please try again.',
        variant: "destructive",
      });
    }, 25000); // 25 second timeout for slow connections

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
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <DoorOpen className="w-5 h-5 text-orange-400" />
          {t('roomManagement')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {!currentRoom ? (
          <>
            {/* Join Room Section with Graphics */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  placeholder={t('roomCode')}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-slate-700/50 border-slate-600 text-white pl-10 h-12 text-base font-medium tracking-wider"
                  maxLength={8}
                  data-testid="input-room-code"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <DoorOpen className="w-5 h-5" />
                </div>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
                <span className="text-amber-400 text-lg">💰</span>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Rooms have different bet amounts (50k, 250k, or 1M coins). Make sure you have enough coins to join as a player.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleJoinRoom('player')}
                  disabled={!joinCode.trim() || isJoiningAsPlayer}
                  className="flex-1 relative overflow-hidden rounded-lg px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                  data-testid="button-join-player"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users2 className="w-4 h-4" />
                    <span>{isJoiningAsPlayer ? t('loading') : t('joinAsPlayer')}</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleJoinRoom('spectator')}
                  disabled={!joinCode.trim() || isJoiningAsSpectator}
                  className="flex-1 relative overflow-hidden rounded-lg px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                  data-testid="button-join-spectator"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{isJoiningAsSpectator ? t('loading') : t('joinAsSpectator')}</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Create Room Button with Graphics */}
            <div className="relative pt-2">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
              <button
                type="button"
                onClick={onCreateRoom}
                className="w-full mt-2 relative overflow-hidden rounded-lg px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
                data-testid="button-create-room"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span>{t('createNewRoom')}</span>
                </div>
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Current Room with Graphics */}
            <div className="relative overflow-hidden rounded-lg p-4 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-600">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }}></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-500/20 p-2 rounded-lg">
                      <DoorOpen className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="font-semibold text-white">{t('currentRoom')}</span>
                  </div>
                  <Badge variant="secondary" className={`${
                    currentRoom.status === 'playing' ? 'bg-gradient-to-r from-orange-600 to-red-600' : 
                    currentRoom.status === 'waiting' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gray-600'
                  } text-white border-0`}>
                    {currentRoom.status === 'playing' ? t('playing') : 
                     currentRoom.status === 'waiting' ? t('waiting') : t('active')}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-mono font-bold text-blue-400">
                    {t('roomLabel')} #{currentRoom.code}
                  </div>
                  <div className="text-sm text-gray-300">
                    {currentRoom.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Room Actions with Graphics */}
            <div className="space-y-2">
              {/* Main action buttons */}
              <div className="flex gap-2">
                {/* Check if user is the room creator */}
                {currentRoom.ownerId === (user?.userId || user?.id) ? (
                  <button
                    type="button"
                    onClick={handleStartGame}
                    disabled={isStartingGame || currentRoom.status === 'playing'}
                    className="flex-1 relative overflow-hidden rounded-lg px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium transition-all duration-300 shadow-lg hover:shadow-green-500/25"
                    data-testid="button-start-game"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" />
                      <span>{isStartingGame ? t('starting') : 
                       currentRoom.status === 'playing' ? t('gameRunning') : t('startGame')}</span>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 rounded-lg px-4 py-3 bg-gray-700 text-gray-400 font-medium cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" />
                      <span>{currentRoom.status === 'playing' ? t('gameRunning') : t('waitForStart')}</span>
                    </div>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="px-4 py-3 rounded-lg border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Invite friends button (only for room owner and when not playing) */}
              {currentRoom.ownerId === (user?.userId || user?.id) && currentRoom.status !== 'playing' && (
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="w-full relative overflow-hidden rounded-lg px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25 border border-blue-500/30"
                >
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>{t('inviteFriends')}</span>
                  </div>
                </button>
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
