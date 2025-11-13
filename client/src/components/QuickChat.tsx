import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Users, ChevronDown, ChevronUp, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/contexts/LanguageContext';
import { BasicFriendInfo } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { parseErrorMessage } from '@/lib/errorUtils';

interface ChatMessage {
  fromMe: boolean;
  message: string;
  timestamp: string;
  userId: string;
  senderName?: string;
}

export function QuickChat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedChatFriend, setSelectedChatFriend] = useState<BasicFriendInfo | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Map<string, ChatMessage[]>>(new Map());
  const [unreadMessages, setUnreadMessages] = useState<Map<string, number>>(new Map());

  // Fetch friends list
  const { data: friends = [] } = useQuery<BasicFriendInfo[]>({
    queryKey: ['/api/friends'],
    enabled: !!user,
    staleTime: 30000,
  });

  // Fetch online users
  const { data: onlineUsersData } = useQuery<{ total: number; users: any[] }>({
    queryKey: ['/api/users/online'],
    enabled: !!user,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Helper function to check if a friend is online
  const isUserOnline = (friendId: string) => {
    return onlineUsersData?.users?.some(onlineUser => onlineUser.userId === friendId) || false;
  };

  // Get online friends, sorted by unread messages (friends with messages appear first)
  const onlineFriends = friends
    .filter(friend => isUserOnline(friend.id))
    .sort((a, b) => {
      const aUnread = unreadMessages.get(a.id) || 0;
      const bUnread = unreadMessages.get(b.id) || 0;
      return bUnread - aUnread; // Sort by unread count (descending)
    });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ targetUserId, message }: { targetUserId: string; message: string }) => {
      return await apiRequest('/api/chat/send', { method: 'POST', body: { targetUserId, message } });
    },
    onSuccess: (data, variables) => {
      if (selectedChatFriend) {
        const newMessage: ChatMessage = {
          fromMe: true,
          message: chatMessage,
          timestamp: new Date().toLocaleTimeString(),
          userId: variables.targetUserId
        };

        setChatHistory(prev => {
          const newHistory = new Map(prev);
          const userMessages = newHistory.get(selectedChatFriend.id) || [];
          newHistory.set(selectedChatFriend.id, [...userMessages, newMessage]);
          return newHistory;
        });
      }
      setChatMessage("");
    },
    onError: (error: any) => {
      console.error('Chat message error:', error);
      
      // Parse the error message to get a user-friendly version
      const friendlyMessage = parseErrorMessage(error);
      
      // Check if this is an offline error to show a special cute message
      const isOfflineError = error?.message?.includes('Target user connection not found') || 
                             error?.message?.includes('connection not found') ||
                             friendlyMessage.toLowerCase().includes('offline');
      
      if (isOfflineError) {
        // Show a cute, friendly notification for offline friends
        toast({
          title: (
            <div className="flex items-center gap-2 text-white">
              <div className="bg-orange-500/20 p-2 rounded-full">
                <WifiOff className="h-5 w-5 text-orange-400" />
              </div>
              <span className="font-semibold">Friend Went Offline</span>
            </div>
          ) as any,
          description: (
            <div className="text-gray-200 mt-1">
              {selectedChatFriend?.displayName || selectedChatFriend?.firstName || 'Your friend'} is no longer online.
            </div>
          ) as any,
          variant: "default",
          className: "bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-orange-500/30 shadow-lg shadow-orange-500/20",
        });
      } else {
        // Show generic error for other cases
        toast({
          title: t('error'),
          description: friendlyMessage,
          variant: "destructive",
        });
      }
    },
  });

  // Handle incoming chat messages
  useEffect(() => {
    const handleChatMessage = (event: CustomEvent) => {
      const data = event.detail;

      if (data.type === 'chat_message_received') {
        const incomingMessage: ChatMessage = {
          fromMe: false,
          message: data.message.message,
          timestamp: new Date(data.message.timestamp).toLocaleTimeString(),
          userId: data.message.senderId,
          senderName: data.message.senderName
        };

        setChatHistory(prev => {
          const newHistory = new Map(prev);
          const userMessages = newHistory.get(data.message.senderId) || [];
          newHistory.set(data.message.senderId, [...userMessages, incomingMessage]);
          return newHistory;
        });

        // Update unread count if chat dialog is not open or friend not selected
        if (!selectedChatFriend || selectedChatFriend.id !== data.message.senderId) {
          setUnreadMessages(prev => {
            const newUnread = new Map(prev);
            const currentUnread = newUnread.get(data.message.senderId) || 0;
            newUnread.set(data.message.senderId, currentUnread + 1);
            return newUnread;
          });
        }
      }
    };

    window.addEventListener('chat_message_received', handleChatMessage as EventListener);

    return () => {
      window.removeEventListener('chat_message_received', handleChatMessage as EventListener);
    };
  }, [selectedChatFriend]);

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedChatFriend) return;

    sendMessageMutation.mutate({ 
      targetUserId: selectedChatFriend.id, 
      message: chatMessage.trim() 
    });
  };

  const startChatWithFriend = (friend: BasicFriendInfo) => {
    setSelectedChatFriend(friend);
    // Clear unread messages for this friend
    setUnreadMessages(prev => {
      const newUnread = new Map(prev);
      newUnread.delete(friend.id);
      return newUnread;
    });
  };

  // Get current chat messages for selected friend
  const currentChatMessages = selectedChatFriend ? chatHistory.get(selectedChatFriend.id) || [] : [];

  // Calculate total unread messages
  const totalUnreadMessages = Array.from(unreadMessages.values()).reduce((sum, count) => sum + count, 0);

  // Don't render if no friends
  if (friends.length === 0) {
    return null;
  }

  return (
    <>
      {/* Quick Chat Bar */}
      <div className="w-full border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm relative z-10" data-testid="quick-chat-bar">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                  {t('chat')}
                </span>
                {onlineFriends.length > 0 && (
                  <span className="text-xs text-gray-400">
                    ({onlineFriends.length})
                  </span>
                )}
                {totalUnreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {totalUnreadMessages}
                  </span>
                )}
              </div>

              {/* Online Friends Preview (Existing size, no change requested here) */}
              {!isExpanded && onlineFriends.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto">
                  {onlineFriends.slice(0, 3).map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => startChatWithFriend(friend)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors relative"
                      data-testid={`quick-chat-friend-${friend.id}`}
                    >
                      <div className="relative">
                        {friend.profileImageUrl ? (
                          <img
                            src={friend.profileImageUrl}
                            alt={friend.displayName || friend.firstName || undefined}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
                            {friend.firstName?.[0] || '?'}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-slate-800 rounded-full"></div>
                      </div>
                      <span className="text-xs text-white hidden sm:inline">
                        {friend.displayName || friend.firstName || ''}
                      </span>
                      {unreadMessages.get(friend.id) && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {unreadMessages.get(friend.id)}
                        </span>
                      )}
                    </button>
                  ))}
                  {onlineFriends.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{onlineFriends.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Expand/Collapse Button */}
            {onlineFriends.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs"
                data-testid="toggle-chat-list"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    View All
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Expanded Friends List (Changes applied here) */}
          <AnimatePresence>
            {isExpanded && onlineFriends.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden relative z-20"
              >
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1 mt-2 pt-2 border-t border-slate-700"> {/* Reduced columns and gap */}
                  {onlineFriends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => startChatWithFriend(friend)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors relative"
                      data-testid={`expanded-chat-friend-${friend.id}`}
                    >
                      <div className="relative">
                        {friend.profileImageUrl ? (
                          <img
                            src={friend.profileImageUrl}
                            alt={friend.displayName || friend.firstName || undefined}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
                            {friend.firstName?.[0] || '?'}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-white truncate block">
                          {friend.displayName || friend.firstName || ''}
                        </span>
                      </div>
                      {unreadMessages.get(friend.id) && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3.5 w-3.5 flex items-center justify-center p-0">
                          {unreadMessages.get(friend.id)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Chat Dialog (No change requested here) */}
      <Dialog open={!!selectedChatFriend} onOpenChange={() => setSelectedChatFriend(null)}>
        <DialogContent className="sm:max-w-[500px]" data-testid="chat-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedChatFriend?.profileImageUrl ? (
                <img
                  src={selectedChatFriend.profileImageUrl}
                  alt={selectedChatFriend.displayName || selectedChatFriend.firstName || undefined}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
                  {selectedChatFriend?.firstName?.[0] || '?'}
                </div>
              )}
              <span>
                {selectedChatFriend?.displayName || `${selectedChatFriend?.firstName || ''} ${selectedChatFriend?.lastName || ''}`.trim()}
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {currentChatMessages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    {t('noMessages')}
                  </div>
                ) : (
                  currentChatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-3 py-2 ${
                          msg.fromMe
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        <div className="text-sm">{msg.message}</div>
                        <div className="text-xs opacity-70 mt-1">{msg.timestamp}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder={t('typeMessage')}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                data-testid="chat-input"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                data-testid="send-message-button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}