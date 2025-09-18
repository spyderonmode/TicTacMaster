import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Check, X, Clock } from "lucide-react";

interface InvitationNotificationProps {
  invitation: {
    senderId: string;
    senderName: string;
    roomId: string;
    roomName: string;
    timestamp: string;
  };
  onAccept: (roomId: string) => void;
  onDismiss: () => void;
}

export function InvitationNotification({ invitation, onAccept, onDismiss }: InvitationNotificationProps) {
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      // Join the room
      await apiRequest(`/api/rooms/${invitation.roomId}/join`, {
        method: 'POST',
        body: { role: 'player' }
      });
      
      onAccept(invitation.roomId);
      
      toast({
        title: "Invitation accepted",
        description: `You joined ${invitation.roomName}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="w-80 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          Room Invitation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium">{invitation.senderName}</p>
          <p className="text-sm text-muted-foreground">
            invited you to join "{invitation.roomName}"
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatTime(invitation.timestamp)}
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isAccepting}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            {isAccepting ? "Joining..." : "Accept"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDismiss}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}