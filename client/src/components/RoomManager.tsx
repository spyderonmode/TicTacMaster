import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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

  const joinRoomMutation = useMutation({
    mutationFn: async (data: { code: string, role: 'player' | 'spectator' }) => {
      const response = await apiRequest(`/api/rooms/${data.code}/join`, { method: 'POST', body: { role: data.role } });
      return response.json();
    },
    onSuccess: (data) => {
      onRoomJoin(data.room);
      setJoinCode("");
      toast({
        title: t('success'),
        description: t('joinedRoomSuccessfully'),
      });
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
      
      // Handle insufficient coins error
      if (error.status === 403 && error.message?.includes('coins')) {
        toast({
          title: '💰 Insufficient Coins',
          description: error.message || 'You need 100 coins to join as a player. Win AI games to earn coins! You can still join as a spectator.',
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startGameMutation = useMutation({
    mutationFn: async () => {
      if (!currentRoom) throw new Error('No room selected');
      
      const response = await apiRequest(`/api/rooms/${currentRoom.id}/start-game`, { method: 'POST', body: {} });
      return response.json();
    },
    onSuccess: (game) => {
      // Game started successfully
      onGameStart(game);
      toast({
        title: t('gameStarted'),
        description: t('letTheBattleBegin'),
      });
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
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoinRoom = (role: 'player' | 'spectator' = 'player') => {
    if (joinCode.trim()) {
      joinRoomMutation.mutate({ 
        code: joinCode.trim().toUpperCase(), 
        role 
      });
    }
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
                  disabled={!joinCode.trim() || joinRoomMutation.isPending}
                  className="w-full sm:flex-1 bg-green-600 hover:bg-green-700"
                >
                  {t('joinAsPlayer')}
                </Button>
                <Button 
                  onClick={() => handleJoinRoom('spectator')}
                  disabled={!joinCode.trim() || joinRoomMutation.isPending}
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
              disabled={joinRoomMutation.isPending}
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
                    onClick={() => {
                      // Start game button clicked
                      startGameMutation.mutate();
                    }}
                    disabled={startGameMutation.isPending || currentRoom.status === 'playing'}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {startGameMutation.isPending ? t('starting') : 
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
