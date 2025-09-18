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
import { User, Clock, Users, UserX, UserCheck, Eye, UserPlus } from "lucide-react";
import { showUserFriendlyError } from "@/lib/errorUtils";
import { UserProfileModal } from "./UserProfileModal";

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
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [profileUser, setProfileUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { data: onlineUsers, isLoading } = useQuery({
    queryKey: ["/api/users/online"],
    refetchInterval: open ? 60000 : false, // Increased to 15s and only when modal is open
    enabled: open,
    staleTime: 60000, // Consider data fresh for 12 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch blocked users
  const { data: blockedUsersData } = useQuery({
    queryKey: ["/api/users/blocked"],
    enabled: open,
  });

  // Fetch friends
  const { data: friendsData } = useQuery({
    queryKey: ["/api/friends"],
    enabled: open,
  });

  // Update blocked users state when data changes
  useEffect(() => {
    if (blockedUsersData) {
      setBlockedUsers(new Set(blockedUsersData.map((blocked: any) => blocked.blockedId)));
    }
  }, [blockedUsersData]);

  // Update friends state when data changes
  useEffect(() => {
    if (friendsData) {
      setFriends(new Set(friendsData.map((friend: any) => friend.id)));
    }
  }, [friendsData]);



  const blockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('/api/users/block', { method: 'POST', body: { userId } });
    },
    onSuccess: (_, userId) => {
      setBlockedUsers(prev => new Set(prev).add(userId));
      queryClient.invalidateQueries({ queryKey: ["/api/users/blocked"] });
      toast({
        title: t('userBlocked'),
        description: t('userBlockedSuccessfully'),
      });
    },
    onError: (error: any) => {
      showUserFriendlyError(error, toast);
    },
  });

  const unblockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest('/api/users/unblock', { method: 'POST', body: { userId } });
    },
    onSuccess: (_, userId) => {
      setBlockedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/blocked"] });
      toast({
        title: t('userUnblocked'),
        description: t('userUnblockedSuccessfully'),
      });
    },
    onError: (error: any) => {
      showUserFriendlyError(error, toast);
    },
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (requestedId: string) => {
      return await apiRequest('/api/friends/request', { method: 'POST', body: { requestedId } });
    },
    onSuccess: (_, requestedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      toast({
        title: t('friendRequestSent'),
        description: t('friendRequestSentSuccessfully'),
      });
    },
    onError: (error: any) => {
      // Handle specific friend request errors
      if (error.message?.includes('already exists') || error.message?.includes('already sent')) {
        toast({
          title: t('error'),
          description: t('friendRequestAlreadyExists'),
          variant: 'destructive',
        });
      } else if (error.message?.includes('already friends')) {
        toast({
          title: t('error'),
          description: t('alreadyFriends'),
          variant: 'destructive',
        });
      } else {
        showUserFriendlyError(error, toast);
      }
    },
  });





  const handleBlockUser = (userId: string) => {
    blockUserMutation.mutate(userId);
  };

  const handleUnblockUser = (userId: string) => {
    unblockUserMutation.mutate(userId);
  };

  const handleAddFriend = (userId: string) => {
    sendFriendRequestMutation.mutate(userId);
  };

  const handleViewProfile = (user: any) => {
    setProfileUser(user);
    setShowProfileModal(true);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('onlinePlayers')} ({onlineUsers?.total || 0})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{t('onlinePlayers')}:</strong> {t('viewPlayerProfilesAndManageInteractions')}
            </p>
          </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <ScrollArea className="h-[400px] w-full">
                  <div className="space-y-2">
                    {onlineUsers?.users?.length > 0 ? (
                      onlineUsers.users.map((user: any) => {
                        const isBlocked = blockedUsers.has(user.userId);
                        const isFriend = friends.has(user.userId);
                        return (
                          <Card key={user.userId} className={`p-3 cursor-pointer transition-colors ${isBlocked ? 'opacity-50 border-red-200 dark:border-red-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            <div className="space-y-3">
                              {/* User Info Row */}
                              <div className="flex items-center gap-3">
                                {user.profilePicture || user.profileImageUrl ? (
                                  <img
                                    src={user.profilePicture || user.profileImageUrl}
                                    alt={t('profile')}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <User className="h-5 w-5 text-white" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium">
                                      {user.displayName || user.firstName || user.username}
                                    </h3>
                                    {isBlocked && (
                                      <Badge variant="destructive" className="text-xs">
                                        {t('blocked')}
                                      </Badge>
                                    )}
                                    {user.inRoom && (
                                      <Badge variant="secondary" className="text-xs">{t('inRoom')}</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatLastSeen(user.lastSeen)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons Row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewProfile(user)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {t('profile')}
                                </Button>
                                
                                {!isFriend && !isBlocked && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAddFriend(user.userId)}
                                    disabled={sendFriendRequestMutation.isPending}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    {t('addFriend')}
                                  </Button>
                                )}
                                
                                {isBlocked ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUnblockUser(user.userId)}
                                    disabled={unblockUserMutation.isPending}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    {t('unblock')}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBlockUser(user.userId)}
                                    disabled={blockUserMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    {t('block')}
                                  </Button>
                                )}
                              </div>
                              
                              {user.achievements && user.achievements.length > 0 && (
                                <div className="flex items-center gap-1 pl-13">
                                  {user.achievements.map((achievement: any) => (
                                    <span
                                      key={achievement.id}
                                      className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full flex items-center gap-1"
                                      title={achievement.description}
                                    >
                                      {achievement.icon}
                                      <span className="font-medium">{achievement.achievementName}</span>
                                    </span>
                                  ))}
                                </div>
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
      
      {/* Profile Modal */}
      {profileUser && (
        <UserProfileModal
          open={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={profileUser.userId}
          username={profileUser.username}
          displayName={profileUser.displayName || profileUser.firstName || profileUser.username}
          profilePicture={profileUser.profilePicture}
          profileImageUrl={profileUser.profileImageUrl}
        />
      )}
    </Dialog>
  );
}