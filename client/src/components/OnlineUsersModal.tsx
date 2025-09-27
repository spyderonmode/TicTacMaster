import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { apiRequest } from "@/lib/queryClient";
import { User, Clock, Users, UserPlus } from "lucide-react";

interface OnlineUsersModalProps {
  open: boolean;
  onClose: () => void;
  currentRoom?: any;
  user?: any;
}

export function OnlineUsersModal({ open, onClose, currentRoom, user }: OnlineUsersModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();
  const [pendingFriendRequestId, setPendingFriendRequestId] = useState<string | null>(null);

  const { data: onlineUsers, isLoading } = useQuery<{ total: number; users: any[] }>({
    queryKey: ["/api/users/online"],
    refetchInterval: open ? 60000 : false, // Increased to 15s and only when modal is open
    enabled: open,
    staleTime: 60000, // Consider data fresh for 12 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Function to send friend requests with per-user pending state
  const handleSendFriendRequest = async (requestedId: string) => {
    if (pendingFriendRequestId) return; // Prevent multiple simultaneous requests
    
    setPendingFriendRequestId(requestedId);
    
    try {
      await apiRequest('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ requestedId }),
      });
      
      toast({
        title: t('success'),
        description: t('friendRequestSent') || 'Friend request sent!',
      });
      
      // Invalidate friend-related queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to send friend request',
        variant: 'destructive',
      });
    } finally {
      setPendingFriendRequestId(null);
    }
  };












  const formatLastSeen = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return t('justNow');
    if (minutes < 60) return `${minutes}${t('minutesAgo')}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${t('hoursAgo')}`;
    
    const days = Math.floor(hours / 24);
    return `${days}${t('daysAgo')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('onlinePlayers')} ({onlineUsers?.total || 0})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{t('onlinePlayers')}:</strong> {t('players')}
            </p>
          </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ScrollArea className="h-[500px] w-full">
                  <div className="space-y-2">
                    {onlineUsers?.users && onlineUsers.users.length > 0 ? (
                      onlineUsers.users.map((onlineUser: any) => {
                        return (
                          <Card key={onlineUser.userId} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <div className="flex items-center gap-2">
                              {onlineUser.profilePicture || onlineUser.profileImageUrl ? (
                                <img
                                  src={onlineUser.profilePicture || onlineUser.profileImageUrl}
                                  alt={t('profile')}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                                  <User className="h-4 w-4 text-white" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-1 mb-1">
                                  <h3 className="font-medium text-sm">
                                    {onlineUser.displayName || onlineUser.firstName || onlineUser.username}
                                  </h3>
                                  {onlineUser.inRoom && (
                                    <Badge variant="secondary" className="text-xs">{t('inRoom')}</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatLastSeen(onlineUser.lastSeen)}
                                </div>
                              </div>
                              {/* Add Friend Button - Only show if not the current user */}
                              {onlineUser.userId !== ((user as any)?.userId || (user as any)?.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendFriendRequest(onlineUser.userId)}
                                  disabled={pendingFriendRequestId === onlineUser.userId}
                                  className="ml-2"
                                  data-testid={`button-add-friend-${onlineUser.userId}`}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  {pendingFriendRequestId === onlineUser.userId ? t('loading') : t('addFriend') || 'Add Friend'}
                                </Button>
                              )}
                            </div>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('noOtherPlayersOnline')}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
        </div>
      </DialogContent>
    </Dialog>
  );
}