import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTranslation } from "@/contexts/LanguageContext";
import { Plus, Users, Lock, Unlock, Sparkles, Coins, Crown, DoorOpen, Eye } from "lucide-react";
import { userDataQueryOptions } from "@/lib/queryClient";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onRoomCreated: (room: any) => void;
  currentRoom?: any;
  leaveRoom?: (roomId: string) => void;
}

export function CreateRoomModal({ open, onClose, onRoomCreated, currentRoom, leaveRoom }: CreateRoomModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [maxPlayers, setMaxPlayers] = useState("2");
  const [betAmount, setBetAmount] = useState("5000");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState<'player' | 'spectator' | false>(false);
  const [joinCode, setJoinCode] = useState("");
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [joinRequestId, setJoinRequestId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { sendMessage, isConnected } = useWebSocket();

  // Check if user has active VIP Pass
  const { data: vipPassData } = useQuery<{ hasActivePass: boolean }>({
    queryKey: ['/api/vip-pass'],
    ...userDataQueryOptions,
  });
  const hasVipPass = vipPassData?.hasActivePass || false;

  useEffect(() => {
    const handleCreateRoomSuccess = (event: any) => {
      const { room, requestId } = event.detail;
      // Only handle if this is the response to our current request, or if no requestId correlation
      if (!requestId || requestId === currentRequestId) {
        // Clear timeout if it exists
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsCreating(false);
        setCurrentRequestId(null);
        onRoomCreated(room);
        onClose();
        resetForm();
        toast({
          title: t('roomCreated'),
          description: t('roomCodeCreated').replace('%s', room.code),
        });
      }
    };

    const handleCreateRoomError = (event: any) => {
      const { error, message, requestId } = event.detail;
      // Only handle if this is the response to our current request, or if no requestId correlation
      if (!requestId || requestId === currentRequestId) {
        // Clear timeout if it exists
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsCreating(false);
        setCurrentRequestId(null);
        
        // Note: Error modal is handled by home.tsx, no toast needed here to avoid duplicate messages
      }
    };

    window.addEventListener('create_room_success', handleCreateRoomSuccess);
    window.addEventListener('create_room_error', handleCreateRoomError);

    return () => {
      window.removeEventListener('create_room_success', handleCreateRoomSuccess);
      window.removeEventListener('create_room_error', handleCreateRoomError);
    };
  }, [onRoomCreated, onClose, toast, t, currentRequestId]);

  // Join room event listeners
  useEffect(() => {
    const handleJoinRoomSuccess = (event: any) => {
      const { room, requestId } = event.detail;
      if (!requestId || requestId === joinRequestId) {
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
        setIsJoining(false);
        setJoinRequestId(null);
        onRoomCreated(room);
        onClose();
        resetForm();
        toast({
          title: t('success'),
          description: t('joinedRoomSuccessfully') || 'Joined room successfully!',
        });
      }
    };

    const handleJoinRoomError = (event: any) => {
      const { requestId } = event.detail;
      if (!requestId || requestId === joinRequestId) {
        if (joinTimeoutRef.current) {
          clearTimeout(joinTimeoutRef.current);
          joinTimeoutRef.current = null;
        }
        setIsJoining(false);
        setJoinRequestId(null);
      }
    };

    window.addEventListener('join_room_success', handleJoinRoomSuccess);
    window.addEventListener('join_room_error', handleJoinRoomError);

    return () => {
      window.removeEventListener('join_room_success', handleJoinRoomSuccess);
      window.removeEventListener('join_room_error', handleJoinRoomError);
    };
  }, [onRoomCreated, onClose, toast, t, joinRequestId]);

  const resetForm = () => {
    setMaxPlayers("2");
    setBetAmount("5000");
    setIsPrivate(false);
    setJoinCode("");
    setActiveTab("create");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check WebSocket connection before sending
    if (!isConnected) {
      toast({
        title: t('error'),
        description: 'Not connected to server. Please wait and try again.',
        variant: "destructive",
      });
      return;
    }

    // Auto-leave current room before creating a new one to prevent connection conflicts
    if (currentRoom && leaveRoom) {
      console.log(`🏠 Auto-leaving current room ${currentRoom.id} before creating new room`);
      leaveRoom(currentRoom.id);
      toast({
        title: "Left Room",
        description: "Left previous room to create a new one",
        duration: 2000,
      });
    }

    setIsCreating(true);
    const requestId = Math.random().toString(36).substring(7);
    setCurrentRequestId(requestId);
    
    // Set timeout to handle no response scenarios
    timeoutRef.current = setTimeout(() => {
      // Only timeout if we're still waiting for this specific request
      setIsCreating(false);
      setCurrentRequestId(null);
      timeoutRef.current = null;
      toast({
        title: t('error'),
        description: 'Request timeout. Please try again.',
        variant: "destructive",
      });
    }, 15000); // 15 second timeout
    
    sendMessage({
      type: 'create_room',
      requestId,
      roomData: {
        name: 'Game Room',
        maxPlayers: parseInt(maxPlayers),
        betAmount: parseInt(betAmount),
        isPrivate,
      }
    });
  };

  const handleJoinRoom = (role: 'player' | 'spectator') => {
    if (!isConnected) {
      toast({
        title: t('error'),
        description: 'Not connected to server. Please wait and try again.',
        variant: "destructive",
      });
      return;
    }

    if (!joinCode.trim()) {
      toast({
        title: t('error'),
        description: t('enterRoomCode') || 'Please enter a room code',
        variant: "destructive",
      });
      return;
    }

    // Auto-leave current room before joining a new one
    if (currentRoom && leaveRoom) {
      console.log(`🏠 Auto-leaving current room ${currentRoom.id} before joining new room`);
      leaveRoom(currentRoom.id);
      toast({
        title: "Left Room",
        description: "Left previous room to join a new one",
        duration: 2000,
      });
    }

    setIsJoining(role);
    const requestId = Math.random().toString(36).substring(7);
    setJoinRequestId(requestId);

    joinTimeoutRef.current = setTimeout(() => {
      setIsJoining(false);
      setJoinRequestId(null);
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

  const handleClose = () => {
    if (!isCreating && !isJoining) {
      // Clear timeouts if modal is closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
      onClose();
      resetForm();
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            {t('room') || 'Room'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "join")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
            <TabsTrigger 
              value="create" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
              data-testid="tab-create-room"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('createRoom') || 'Create'}
            </TabsTrigger>
            <TabsTrigger 
              value="join" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600"
              data-testid="tab-join-room"
            >
              <DoorOpen className="w-4 h-4 mr-2" />
              {t('joinRoom') || 'Join'}
            </TabsTrigger>
          </TabsList>

          {/* Create Room Tab */}
          <TabsContent value="create" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Max Players Section */}
              <div className="space-y-2">
                <Label htmlFor="maxPlayers" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  {t('maxPlayers')}
                </Label>
                <div className="relative">
                  <Select 
                    value={maxPlayers} 
                    onValueChange={setMaxPlayers}
                    disabled={isCreating}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white h-11 hover:bg-slate-700 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="2" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>2 Players</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="4" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>4 Players (with spectators)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bet Amount Section */}
              <div className="space-y-2">
                <Label htmlFor="betAmount" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Bet Amount
                </Label>
                <div className="relative">
                  <Select 
                    value={betAmount} 
                    onValueChange={setBetAmount}
                    disabled={isCreating}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white h-11 hover:bg-slate-700 transition-colors" data-testid="select-bet-amount">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="5000" data-testid="option-bet-5k" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>5k coins</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="50000" data-testid="option-bet-50k" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>50k coins</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="250000" data-testid="option-bet-250k" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>250k coins</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="1000000" data-testid="option-bet-1m" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>1M coins</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="10000000" data-testid="option-bet-10m" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span>10M coins</span>
                        </div>
                      </SelectItem>
                      {hasVipPass && (
                        <SelectItem value="30000000" data-testid="option-bet-30m" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            <span className="text-yellow-400 font-semibold">30M coins</span>
                            <span className="text-xs bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-1.5 py-0.5 rounded font-bold">VIP</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>Higher bets = bigger rewards!</span>
                </p>
              </div>
              
              {/* Privacy Toggle */}
              <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={(checked) => setIsPrivate(checked === true)}
                    className="border-slate-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    disabled={isCreating}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {isPrivate ? (
                      <Lock className="w-4 h-4 text-purple-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-green-400" />
                    )}
                    <Label htmlFor="private" className="text-sm text-gray-200 cursor-pointer">
                      {t('private')}
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 ml-7">
                  {isPrivate ? "🔒 Only invited players can join" : "🌐 Anyone with the code can join"}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-600 text-gray-300 hover:bg-slate-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 relative overflow-hidden px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{t('creating')}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{t('createRoom')}</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </TabsContent>

          {/* Join Room Tab */}
          <TabsContent value="join" className="mt-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="joinCode" className="text-sm font-medium text-gray-200 flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-blue-400" />
                  {t('roomCode') || 'Room Code'}
                </Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t('enterRoomCode') || 'Enter room code'}
                  className="bg-slate-700/50 border-slate-600 text-white h-11 text-center text-lg font-mono tracking-widest uppercase"
                  disabled={isJoining}
                  maxLength={8}
                  data-testid="input-join-code"
                />
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>{t('askFriendForCode') || 'Ask your friend for their room code'}</span>
                </p>
              </div>

              {/* Join Options */}
              <div className="space-y-3">
                {/* Join as Player */}
                <button
                  type="button"
                  onClick={() => handleJoinRoom('player')}
                  disabled={!!isJoining || !joinCode.trim()}
                  className="w-full relative overflow-hidden px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:cursor-not-allowed"
                  data-testid="button-join-as-player"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isJoining === 'player' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{t('joining') || 'Joining...'}</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        <span>{t('joinAsPlayer') || 'Join as Player'}</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Join as Spectator */}
                <button
                  type="button"
                  onClick={() => handleJoinRoom('spectator')}
                  disabled={!!isJoining || !joinCode.trim()}
                  className="w-full relative overflow-hidden px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-join-as-spectator"
                >
                  <div className="flex items-center justify-center gap-2">
                    {isJoining === 'spectator' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{t('joining') || 'Joining...'}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>{t('joinAsSpectator') || 'Join as Spectator'}</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Cancel Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={!!isJoining}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-600 text-gray-300 hover:bg-slate-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
