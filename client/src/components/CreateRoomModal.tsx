import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTranslation } from "@/contexts/LanguageContext";
import { Plus, Users, Lock, Unlock, Sparkles, Coins } from "lucide-react";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onRoomCreated: (room: any) => void;
  currentRoom?: any;
  leaveRoom?: (roomId: string) => void;
}

export function CreateRoomModal({ open, onClose, onRoomCreated, currentRoom, leaveRoom }: CreateRoomModalProps) {
  const { t } = useTranslation();
  const [maxPlayers, setMaxPlayers] = useState("2");
  const [betAmount, setBetAmount] = useState("5000");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { sendMessage, isConnected } = useWebSocket();

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

  const resetForm = () => {
    setMaxPlayers("2");
    setBetAmount("5000");
    setIsPrivate(false);
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

  const handleClose = () => {
    if (!isCreating) {
      // Clear timeout if modal is closed
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onClose();
      resetForm();
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
              <Plus className="w-5 h-5 text-white" />
            </div>
            {t('createNewRoom')}
          </DialogTitle>
        </DialogHeader>
        
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
                onCheckedChange={setIsPrivate}
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
      </DialogContent>
    </Dialog>
  );
}
