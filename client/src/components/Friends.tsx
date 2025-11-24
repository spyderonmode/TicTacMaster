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
import { Users, UserPlus, UserCheck, UserX, Trophy, TrendingUp, Calendar, Loader2, Eye, Coins, Sparkles, Crown, Star } from 'lucide-react';
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
    staleTime: 30000,
  });

  // Fetch current user data for coin balance
  const { data: currentUserData } = useQuery({
    queryKey: ['/api/users', user?.userId],
    enabled: isOpen && !!user?.userId,
    staleTime: 60000,
  });

  // Fetch friend requests (incoming)
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests'],
    enabled: isOpen,
    staleTime: 30000,
  });

  // Fetch outgoing friend requests (sent by current user)
  const { data: outgoingRequests = [] } = useQuery<FriendRequest[]>({
    queryKey: ['/api/friends/requests/outgoing'],
    enabled: isOpen,
    staleTime: 30000,
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
    refetchInterval: 60000,
    staleTime: 30000,
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
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests/outgoing'] });
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

  // Helper function to check if there's a pending outgoing request to a user
  const hasPendingOutgoingRequest = (userId: string) => {
    return outgoingRequests.some(request => request.requestedId === userId);
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
        <Button variant="ghost" size="sm" className="w-full justify-start group hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-950/30 dark:hover:to-blue-950/30 transition-all duration-300">
          <Users className="h-4 w-4 mr-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
          <span className="font-medium">{t('friends')}</span>
          {friendRequests.length > 0 && (
            <Badge variant="destructive" className="ml-auto animate-pulse shadow-lg shadow-red-500/50">
              {friendRequests.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-hidden bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-blue-950/20 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-2xl">
        <DialogHeader className="border-b border-purple-200/50 dark:border-purple-800/50 pb-4">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
            <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            {t('friends')}
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 p-1 rounded-xl border border-purple-200 dark:border-purple-800">
            <TabsTrigger 
              value="friends" 
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 font-semibold transition-all duration-300"
            >
              <Users className="h-4 w-4 mr-2" />
              {t('friends')} ({friends.length})
            </TabsTrigger>
            <TabsTrigger 
              value="requests"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 font-semibold transition-all duration-300"
            >
              {t('requests')}
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 animate-pulse shadow-md">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="add"
              className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-lg data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 font-semibold transition-all duration-300"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t('addFriend')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-3 mt-6">
            {friendsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400 mb-3" />
                <p className="text-sm text-muted-foreground">{t('loadingFriends')}</p>
              </div>
            ) : friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-purple-400 dark:text-purple-500" />
                </div>
                <p className="text-muted-foreground font-medium">{t('noFriends')}</p>
              </div>
            ) : (
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-3">
                  {friends
                    .sort((a, b) => {
                      const aOnline = isUserOnline(a.id);
                      const bOnline = isUserOnline(b.id);
                      if (aOnline && !bOnline) return -1;
                      if (!aOnline && bOnline) return 1;
                      return 0;
                    })
                    .map((friend) => (
                    <div
                      key={friend.id}
                      className="group relative flex items-center justify-between p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/50 bg-gradient-to-r from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-950/20 hover:shadow-lg hover:scale-[1.01] hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedFriend(friend)}
                    >
                      {/* Premium background gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-blue-500/5 group-hover:to-purple-500/5 transition-all duration-500"></div>
                      
                      <div className="flex items-center gap-2.5 relative z-10">
                        <div className="relative">
                          {friend.profileImageUrl ? (
                            <img
                              src={friend.profileImageUrl}
                              alt={friend.displayName || `${friend.firstName} ${friend.lastName || ''}`.trim()}
                              className="w-9 h-9 rounded-full ring-2 ring-purple-200 dark:ring-purple-800 group-hover:ring-purple-400 dark:group-hover:ring-purple-600 transition-all duration-300"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-purple-200 dark:ring-purple-800 group-hover:ring-purple-400 dark:group-hover:ring-purple-600 transition-all duration-300 shadow-lg">
                              {friend.firstName?.[0] || '?'}{friend.lastName?.[0] || ''}
                            </div>
                          )}
                          {isUserOnline(friend.id) && (
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <div className="relative">
                                <div className="w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse shadow-md shadow-green-500/50"></div>
                                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                            {friend.displayName || `${friend.firstName} ${friend.lastName || ''}`.trim()}
                          </div>
                          {isUserOnline(friend.id) && (
                            <Badge className="mt-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md text-[10px] px-1.5 py-0">
                              <div className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse"></div>
                              Online
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 relative z-10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(friend);
                          }}
                          className="h-7 w-7 p-0 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 shadow-sm hover:shadow-md"
                          data-testid={`button-view-profile-${friend.id}`}
                        >
                          <Eye className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGiftFriend(friend);
                            setShowCoinGiftModal(true);
                          }}
                          className="h-7 w-7 p-0 border border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all duration-300 shadow-sm hover:shadow-md"
                          data-testid={`button-send-coins-${friend.id}`}
                        >
                          <Coins className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFriend.mutate(friend.id);
                          }}
                          className="h-7 w-7 p-0 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-400 dark:hover:border-red-600 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                          <UserX className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-3 mt-6">
            {requestsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400 mb-3" />
                <p className="text-sm text-muted-foreground">{t('loadingFriends')}</p>
              </div>
            ) : friendRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                  <UserCheck className="h-10 w-10 text-purple-400 dark:text-purple-500" />
                </div>
                <p className="text-muted-foreground font-medium">{t('noPendingRequests')}</p>
              </div>
            ) : (
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-3">
                  {friendRequests.map((request) => (
                    <div
                      key={request.id}
                      className="group flex items-center justify-between p-4 rounded-xl border-2 border-blue-100 dark:border-blue-900/50 bg-gradient-to-r from-white to-blue-50/50 dark:from-gray-800 dark:to-blue-950/20 hover:shadow-xl hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        {request.requester.profileImageUrl ? (
                          <img
                            src={request.requester.profileImageUrl}
                            alt={request.requester.displayName || `${request.requester.firstName} ${request.requester.lastName || ''}`.trim()}
                            className="w-14 h-14 rounded-full ring-4 ring-blue-200 dark:ring-blue-800 group-hover:ring-blue-400 dark:group-hover:ring-blue-600 transition-all duration-300 shadow-lg"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold ring-4 ring-blue-200 dark:ring-blue-800 group-hover:ring-blue-400 dark:group-hover:ring-blue-600 transition-all duration-300 shadow-lg">
                            {request.requester.firstName?.[0] || '?'}{request.requester.lastName?.[0] || ''}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                            {request.requester.displayName || `${request.requester.firstName} ${request.requester.lastName || ''}`.trim()}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {t('sentOn')} {formatDate(request.sentAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => respondToFriendRequest.mutate({ requestId: request.id, response: 'accepted' })}
                          className="border-2 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 hover:border-green-400 dark:hover:border-green-600 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => respondToFriendRequest.mutate({ requestId: request.id, response: 'rejected' })}
                          className="border-2 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 hover:border-red-400 dark:hover:border-red-600 transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                          <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="add" className="space-y-4 mt-6">
            <div className="space-y-3">
              <label htmlFor="name" className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
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
                  className="border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-500 bg-white dark:bg-gray-800 shadow-md focus:shadow-lg transition-all duration-300"
                />
                <Button
                  onClick={findUsersByName}
                  disabled={!searchName.trim() || isSearching}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  {t('searchResults')}:
                </div>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-3">
                    {searchResults.map((user) => {
                      const isPending = hasPendingOutgoingRequest(user.id);
                      
                      return (
                        <div
                          key={user.id}
                          className="group flex items-center justify-between p-4 rounded-xl border-2 border-purple-100 dark:border-purple-900/50 bg-gradient-to-r from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-950/20 hover:shadow-xl hover:scale-[1.02] hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300"
                        >
                          <div className="flex items-center gap-4">
                            {user.profileImageUrl ? (
                              <img
                                src={user.profileImageUrl}
                                alt={user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                                className="w-12 h-12 rounded-full ring-4 ring-purple-200 dark:ring-purple-800 group-hover:ring-purple-400 dark:group-hover:ring-purple-600 transition-all duration-300 shadow-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-pink-500 flex items-center justify-center text-white text-base font-bold ring-4 ring-purple-200 dark:ring-purple-800 group-hover:ring-purple-400 dark:group-hover:ring-purple-600 transition-all duration-300 shadow-lg">
                                {user.firstName?.[0] || '?'}{user.lastName?.[0] || ''}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-sm bg-gradient-to-r from-purple-700 to-blue-700 dark:from-purple-300 dark:to-blue-300 bg-clip-text [-webkit-text-fill-color:transparent] [&>*]:[-webkit-text-fill-color:initial]">
                                {user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                              </div>
                            </div>
                          </div>
                          {isPending ? (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md px-3 py-1">
                              {t('pending')}
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendFriendRequest.mutate(user.id)}
                              disabled={sendFriendRequest.isPending}
                              className="border-2 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              <UserPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
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
            <DialogContent className="sm:max-w-[550px] bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:via-purple-950/20 dark:to-blue-950/20 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-2xl">
              <DialogHeader className="border-b border-purple-200/50 dark:border-purple-800/50 pb-4">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-purple-600 dark:text-purple-400">
                  <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  {t('headToHeadStats')} with {selectedFriend.displayName || `${selectedFriend.firstName} ${selectedFriend.lastName || ''}`.trim()}
                </DialogTitle>
              </DialogHeader>
              
              {headToHeadLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mb-3" />
                  <span className="text-sm text-muted-foreground">{t('loadingStats')}</span>
                </div>
              ) : headToHeadError ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-red-400 dark:text-red-500" />
                  </div>
                  <p className="text-red-500 mb-2 font-semibold">Failed to load head-to-head stats</p>
                  <p className="text-sm text-muted-foreground">
                    {headToHeadError.message}
                  </p>
                </div>
              ) : headToHeadStats ? (
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent mb-2">
                        {headToHeadStats.wins}
                      </div>
                      <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('youWon')}</div>
                    </div>
                    <div className="text-center p-6 rounded-xl border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent mb-2">
                        {headToHeadStats.losses}
                      </div>
                      <div className="text-sm font-semibold text-red-700 dark:text-red-300">{t('theyWon')}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-400 dark:to-purple-500 bg-clip-text text-transparent">
                        {headToHeadStats.totalGames}
                      </div>
                      <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mt-1">{t('totalGames')}</div>
                    </div>
                    <div className="text-center p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/20 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="text-2xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-400 dark:to-gray-500 bg-clip-text text-transparent">
                        {headToHeadStats.draws}
                      </div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">{t('draws')}</div>
                    </div>
                    <div className="text-center p-4 rounded-xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 shadow-md hover:shadow-lg transition-all duration-300">
                      <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
                        {headToHeadStats.winRate}%
                      </div>
                      <div className="text-xs font-semibold text-green-700 dark:text-green-300 mt-1">{t('yourWinRate')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                    <Trophy className="h-10 w-10 text-purple-400 dark:text-purple-500" />
                  </div>
                  <p className="text-muted-foreground font-medium">No games played yet</p>
                </div>
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
