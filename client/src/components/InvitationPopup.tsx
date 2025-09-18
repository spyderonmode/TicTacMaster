import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, X, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";

interface InvitationPopupProps {
  onRoomJoin: (room: any) => void;
}

export function InvitationPopup({ onRoomJoin }: InvitationPopupProps) {
  const { t } = useTranslation();
  const [visibleInvitation, setVisibleInvitation] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Fetch room invitations only when authenticated
  // Use longer polling interval to reduce unnecessary API calls
  const { data: invitations = [] } = useQuery({
    queryKey: ['/api/room-invitations'],
    refetchInterval: isAuthenticated ? 15000 : false, // Increased to 15s to reduce load
    enabled: isAuthenticated,
    staleTime: 12000, // Consider data fresh for 12 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Show the first pending invitation as a popup
  useEffect(() => {
    const pendingInvitation = invitations.find((inv: any) => inv.status === 'pending');
    if (pendingInvitation && (!visibleInvitation || visibleInvitation.id !== pendingInvitation.id)) {
      setVisibleInvitation(pendingInvitation);
    } else if (!pendingInvitation && visibleInvitation) {
      setVisibleInvitation(null);
    }
  }, [invitations]);

  const respondToInvitationMutation = useMutation({
    mutationFn: async (data: { invitationId: string, response: 'accepted' | 'rejected' }) => {
      const response = await apiRequest(`/api/room-invitations/${data.invitationId}/respond`, {
        method: 'POST',
        body: { response: data.response }
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (variables.response === 'accepted') {
        onRoomJoin(data.room);
        toast({
          title: t('invitationAccepted'),
          description: t('joinedRoomSuccessfully'),
        });
      } else {
        toast({
          title: t('invitationDeclined'),
          description: t('youDeclinedInvitation'),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/room-invitations'] });
      setVisibleInvitation(null);
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAccept = () => {
    if (visibleInvitation) {
      respondToInvitationMutation.mutate({
        invitationId: visibleInvitation.id,
        response: 'accepted'
      });
    }
  };

  const handleDecline = () => {
    if (visibleInvitation) {
      respondToInvitationMutation.mutate({
        invitationId: visibleInvitation.id,
        response: 'rejected'
      });
    }
  };

  const handleDismiss = () => {
    setVisibleInvitation(null);
  };

  if (!visibleInvitation) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <Card className="bg-gradient-to-br from-blue-900/95 to-purple-900/95 border-blue-500/50 shadow-2xl backdrop-blur-sm max-w-sm w-full mx-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <CardTitle className="text-lg text-white">{t('roomInvitation')}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-white font-medium">
{t('invitedYouToJoinRoom', { inviterName: visibleInvitation.inviterName || visibleInvitation.inviter?.displayName || visibleInvitation.inviter?.username || 'Unknown' })}
              </div>
              <div className="text-blue-200 text-sm">
{t('room')}: {visibleInvitation.roomCode}
              </div>
              <Badge variant="secondary" className="bg-blue-600/30 text-blue-200 border-blue-400/30">
                <Clock className="w-3 h-3 mr-1" />
{t('gameRoom')}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                disabled={respondToInvitationMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
{t('accept')}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={respondToInvitationMutation.isPending}
                variant="outline"
                className="flex-1 border-red-500/50 text-red-300 hover:bg-red-500/20"
              >
                <X className="w-4 h-4 mr-2" />
{t('decline')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}