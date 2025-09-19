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

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onRoomCreated: (room: any) => void;
}

export function CreateRoomModal({ open, onClose, onRoomCreated }: CreateRoomModalProps) {
  const { t } = useTranslation();
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("2");
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
          description: message || 'Failed to create room. Please try again.',
          variant: "destructive",
        });
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
    setRoomName("");
    setMaxPlayers("2");
    setIsPrivate(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      toast({
        title: t('error'),
        description: t('roomNameRequired'),
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
        name: roomName.trim(),
        maxPlayers: parseInt(maxPlayers),
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">{t('createNewRoom')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roomName" className="text-sm font-medium text-gray-300">
              {t('roomName')}
            </Label>
            <Input
              id="roomName"
              placeholder={t('enterRoomName')}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white mt-1"
              disabled={isCreating}
            />
          </div>
          
          <div>
            <Label htmlFor="maxPlayers" className="text-sm font-medium text-gray-300">
              {t('maxPlayers')}
            </Label>
            <Select 
              value={maxPlayers} 
              onValueChange={setMaxPlayers}
              disabled={isCreating}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="2">{t('twoPlayers')}</SelectItem>
                <SelectItem value="2">{t('Spectators')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              className="border-slate-600"
              disabled={isCreating}
            />
            <Label htmlFor="private" className="text-sm text-gray-300">
              {t('private')}
            </Label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreating ? t('creating') : t('createRoom')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
