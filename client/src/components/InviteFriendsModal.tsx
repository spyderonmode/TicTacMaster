import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { UserPlus, Users, Send, Check } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { BasicFriendInfo } from '@shared/schema';

interface InviteFriendsModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export function InviteFriendsModal({ open, onClose, roomId, roomName }: InviteFriendsModalProps) {
  const { t } = useTranslation();
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery<BasicFriendInfo[]>({
    queryKey: ['/api/friends'],
    enabled: open,
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const response = await apiRequest(`/api/rooms/${roomId}/invite`, {
        method: 'POST',
        body: { invitedId: friendId }
      });
      return response.json();
    },
    onSuccess: (_, friendId) => {
      setInvitedFriends(prev => new Set([...Array.from(prev), friendId]));
      toast({
        title: t('invitationSent'),
        description: t('friendInvitedToRoom'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || t('failedToSendInvitation'),
        variant: "destructive",
      });
    },
  });

  const handleInviteFriend = (friendId: string) => {
    sendInvitationMutation.mutate(friendId);
  };

  const handleClose = () => {
    setInvitedFriends(new Set());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-500" />
{t('inviteFriendsTo')} {roomName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {friendsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{t('loadingFriends')}</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="font-medium text-lg mb-2">{t('noFriendsFound')}</h3>
              <p className="text-sm">
                {t('addFriendsFirstToInvite')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {t('selectFriendsToInvite')}
              </div>
              
              {friends.map((friend) => {
                const isInvited = invitedFriends.has(friend.id);
                const isInviting = sendInvitationMutation.isPending;
                
                return (
                  <Card key={friend.id} className="border border-gray-200 dark:border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {friend.profileImageUrl ? (
                            <img
                              src={friend.profileImageUrl}
                              alt={friend.displayName || friend.username || 'Friend'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {(friend.displayName || friend.username || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {friend.displayName || friend.username}
                            </p>
                            <div className="text-xs text-gray-500">
                              <span>@{friend.username}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          {isInvited ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              {t('invited')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleInviteFriend(friend.id)}
                              disabled={isInviting}
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Send className="h-4 w-4 mr-1" />
                              {isInviting ? t('sending') : t('invite')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              {t('close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}