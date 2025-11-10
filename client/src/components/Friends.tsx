import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Dialog, DialogContent, DialogHeader, DialogTitle,  DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserPlus, UserCheck, UserX, Trophy, TrendingUp, Calendar, Loader2, Eye, Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { showUserFriendlyError } from '@/lib/errorUtils';
import { useTranslation } from '@/contexts/LanguageContext';
import { BasicFriendInfo } from '@shared/schema';
import { UserProfileModal } from './UserProfileModal';
import { CoinGiftModal } from './CoinGiftModal';

interface FriendRequest {
  id: string;
  requesterId: string;
  requestedId: string;
  status: string;
  sentAt: string;
  respondedAt: string | null;
  requester: User;
  requested: User;
}

interface HeadToHeadStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  recentGames: Array<{
    id: string;
    result: 'win' | 'loss' | 'draw';
    playedAt: string;
  }>;
}

export function Friends() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<BasicFriendInfo | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedGiftFriend, setSelectedGiftFriend] = useState<BasicFriendInfo | null>(null);
  const [showCoinGiftModal, setShowCoinGiftModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery<BasicFriendInfo[]>({
    queryKey: ['/api/friends'],
    enabled: isOpen,
    staleTime: 30000, // Cache friends list for 30 seconds
  });

  // Fetch current user data for coin balance
  const { data: currentUserData } = useQuery({
    queryKey: ['/api/users', user?.userId],
    enabled: isOpen && !!user?.userId,
    staleTime: 60000, // Cache for 60 seconds to avoid refetching
  });

  // Fetch friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests'],
    enabled: isOpen,
    staleTime: 30000, // Cache friend requests for 30 seconds
  });

  // Fetch head-to-head stats for selected friend
  const { data: headToHeadStats, isLoading: headToHeadLoading, error: headToHeadError } = useQuery<HeadToHeadStats>({
    queryKey: ['/api/head-to-head', (user as any)?.userId, selectedFriend?.id],
    enabled: !!selectedFriend && !!selectedFriend?.id && !!(user as any)?.userId,
    retry: 1,
  });

  // Fetch online users for online status indicators
  const { data: onlineUsersData } = useQuery<{ total: number; users: any[] }>({
    queryKey: ['/api/users/online'],
    enabled: isOpen,
    refetchInterval: 60000, // Refresh every 60 seconds (reduced from 30)
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Send friend request mutation
  const sendFriendRequest = useMutation({
    mutationFn: async (requestedId: string) => {
      return await apiRequest('/api/friends/request', { method: 'POST', body: { requestedId } });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent successfully",
      });
      setSearchName('');
      setSearchResults([]);
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
    },
    onError: (error: any) => {
      showUserFriendlyError(error, toast);
    },
  });

  // Respond to friend request mutation
  const respondToFriendRequest = useMutation({
    mutationFn: async ({ requestId, response }: { requestId: string; response: 'accepted' | 'rejected' }) => {
      return await apiRequest('/api/friends/respond', { method: 'POST', body: { requestId, response } });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request responded to successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
    },
    onError: (error: any) => {
      showUserFriendlyError(error, toast);
    },
  });

  // Remove friend mutation
  const removeFriend = useMutation({
    mutationFn: async (friendId: string) => {
      return await apiRequest(`/api/friends/${friendId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      setSelectedFriend(null);
    },
    onError: (error: any) => {
      showUserFriendlyError(error, toast);
    },
  });

  // State for search results
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleViewProfile = (friend: BasicFriendInfo) => {
    setProfileUser({
      userId: friend.id,
      username: friend.username,
      displayName: friend.displayName,
      firstName: friend.firstName,
      lastName: friend.lastName,
      profileImageUrl: friend.profileImageUrl
    });
    setShowProfileModal(true);
  };

  // Helper function to check if a friend is online
  const isUserOnline = (friendId: string) => {
    return onlineUsersData?.users?.some(onlineUser => onlineUser.userId === friendId) || false;
  };

  // Find users by name for friend requests
  const findUsersByName = async () => {
    if (!searchName.trim()) return;

    setIsSearching(true);
    try {
      const response = await apiRequest('/api/users/search', { method: 'POST', body: { name: searchName.trim() } });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.users) {
        setSearchResults(data.users);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error("Friend search error:", error);
      showUserFriendlyError(error, toast);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Users className="h-4 w-4 mr-2" />
          {t('friends')}
          {friendRequests.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {friendRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('friends')}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              {t('friends')} ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              {t('requests')}
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add">{t('addFriend')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            {friendsLoading ? (
              <div className="text-center py-8">{t('loadingFriends')}</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('noFriends')}
              </div>
            ) : (
              <div className="space-y-2">
                {friends
                  .sort((a, b) => {
                    // Sort online friends first
                    const aOnline = isUserOnline(a.id);
                    const bOnline = isUserOnline(b.id);
                    if (aOnline && !bOnline) return -1;
                    if (!aOnline && bOnline) return 1;
                    return 0;
                  })
                  .map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => setSelectedFriend(friend)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        {friend.profileImageUrl ? (
                          <img
                            src={friend.profileImageUrl}
                            alt={friend.displayName || `${friend.firstName} ${friend.lastName || ''}`.trim()}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                            {friend.firstName?.[0] || '?'}{friend.lastName?.[0] || ''}
                          </div>
                        )}
                        {/* Online status indicator */}
                        {isUserOnline(friend.id) && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {friend.displayName || `${friend.firstName} ${friend.lastName || ''}`.trim()}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(friend);
                        }}
                        className="text-xs px-2 py-1"
                        data-testid={`button-view-profile-${friend.id}`}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGiftFriend(friend);
                          setShowCoinGiftModal(true);
                        }}
                        className="text-xs px-2 py-1 text-yellow-600 hover:text-yellow-700"
                        data-testid={`button-send-coins-${friend.id}`}
                      >
                        <Coins className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFriend.mutate(friend.id);
                        }}
                        className="text-xs px-2 py-1"
                      >
                        <UserX className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8">{t('loadingFriends')}</div>
            ) : friendRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('noPendingRequests')}
              </div>
            ) : (
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {request.requester.profileImageUrl ? (
                        <img
                          src={request.requester.profileImageUrl}
                          alt={request.requester.displayName || `${request.requester.firstName} ${request.requester.lastName || ''}`.trim()}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {request.requester.firstName?.[0] || '?'}{request.requester.lastName?.[0] || ''}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {request.requester.displayName || `${request.requester.firstName} ${request.requester.lastName || ''}`.trim()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('sentOn')} {formatDate(request.sentAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondToFriendRequest.mutate({ requestId: request.id, response: 'accepted' })}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondToFriendRequest.mutate({ requestId: request.id, response: 'rejected' })}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="add" className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t('searchFriends')}
              </label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  type="text"
                  placeholder={t('searchFriends')}
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      findUsersByName();
                    }
                  }}
                />
                <Button
                  onClick={findUsersByName}
                  disabled={!searchName.trim() || isSearching}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">{t('searchResults')}:</div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      {user.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {user.firstName?.[0] || '?'}{user.lastName?.[0] || ''}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-sm">
                          {user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => sendFriendRequest.mutate(user.id)}
                      disabled={sendFriendRequest.isPending}
                      className="text-xs px-2 py-1"
                    >
                      <UserPlus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Profile Modal */}
        {profileUser && (
          <UserProfileModal
            open={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            userId={profileUser.userId}
            username={profileUser.username}
            displayName={profileUser.displayName || `${profileUser.firstName} ${profileUser.lastName || ''}`.trim()}
            profilePicture={profileUser.profileImageUrl}
            profileImageUrl={profileUser.profileImageUrl}
            selectedAchievementBorder={profileUser.selectedAchievementBorder}
          />
        )}
        
        {/* Head-to-head stats modal */}
        {selectedFriend && (
          <Dialog open={!!selectedFriend} onOpenChange={() => setSelectedFriend(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {t('headToHeadStats')} with {selectedFriend.displayName || `${selectedFriend.firstName} ${selectedFriend.lastName || ''}`.trim()}
                </DialogTitle>
              </DialogHeader>
              
              {headToHeadLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>{t('loadingStats')}</span>
                </div>
              ) : headToHeadError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-2">Failed to load head-to-head stats</p>
                  <p className="text-sm text-muted-foreground">
                    {headToHeadError.message}
                  </p>
                </div>
              ) : headToHeadStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {headToHeadStats.wins}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('youWon')}</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {headToHeadStats.losses}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('theyWon')}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.totalGames}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('totalGames')}</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.draws}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('draws')}</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-lg font-bold">
                        {headToHeadStats.winRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">{t('yourWinRate')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">No games played yet</div>
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Coin Gift Modal */}
        <CoinGiftModal
          open={showCoinGiftModal}
          onClose={() => {
            setShowCoinGiftModal(false);
            setSelectedGiftFriend(null);
          }}
          friend={selectedGiftFriend}
          currentUserCoins={(currentUserData as any)?.coins || 0}
        />
      </DialogContent>
    </Dialog>
  );
}