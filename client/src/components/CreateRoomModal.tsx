import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { showUserFriendlyError } from "@/lib/errorUtils";
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
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      const response = await apiRequest('/api/rooms', { method: 'POST', body: roomData });
      return response.json();
    },
    onSuccess: (room) => {
      onRoomCreated(room);
      onClose();
      resetForm();
      toast({
        title: t('roomCreated'),
        description: t('roomCodeCreated').replace('%s', room.code),
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
          description: error.message || 'You need 1000 coins to create a room. Win AI games to earn coins!',
          variant: "destructive",
        });
        return;
      }
      
      showUserFriendlyError(error, toast);
    },
  });

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

    createRoomMutation.mutate({
      name: roomName.trim(),
      maxPlayers: parseInt(maxPlayers),
      isPrivate,
    });
  };

  const handleClose = () => {
    if (!createRoomMutation.isPending) {
      onClose();
      resetForm();
    }
  };

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
              disabled={createRoomMutation.isPending}
            />
          </div>
          
          <div>
            <Label htmlFor="maxPlayers" className="text-sm font-medium text-gray-300">
              {t('maxPlayers')}
            </Label>
            <Select 
              value={maxPlayers} 
              onValueChange={setMaxPlayers}
              disabled={createRoomMutation.isPending}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="2">{t('twoPlayers')}</SelectItem>
                <SelectItem value="52">{t('twoPlayersSpectators')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              className="border-slate-600"
              disabled={createRoomMutation.isPending}
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
              disabled={createRoomMutation.isPending}
              className="border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createRoomMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createRoomMutation.isPending ? t('creating') : t('createRoom')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
