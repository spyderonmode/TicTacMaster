import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X, Minimize2, Maximize2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from '@/contexts/LanguageContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
  fromMe: boolean;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  initialSender?: {
    userId: string;
    displayName: string;
  };
  initialMessage?: string;
}

export function ChatPopup({ 
  isOpen, 
  onClose, 
  currentUser, 
  initialSender, 
  initialMessage 
}: ChatPopupProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(initialSender || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isOnline } = useOnlineStatus();

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add initial message if provided and handle updates
  useEffect(() => {
    if (initialMessage && initialSender) {
      const message: ChatMessage = {
        id: `${initialSender.userId}-${Date.now()}`,
        senderId: initialSender.userId,
        senderName: initialSender.displayName,
        message: initialMessage,
        timestamp: new Date().toLocaleTimeString(),
        fromMe: false
      };
      
      // Check if this exact message already exists to avoid duplicates
      setMessages(prev => {
        const exists = prev.some(msg => 
          msg.senderId === message.senderId && 
          msg.message === message.message &&
          Math.abs(new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()) < 5000 // Within 5 seconds
        );
        
        if (!exists) {
          return [...prev, message];
        }
        return prev;
      });
      
      setActiveChatUser(initialSender);
    }
  }, [initialMessage, initialSender]);

  // No WebSocket listener needed - ChatPopup only handles the initial message through props
  // New messages from the same user will trigger a new popup instance

  const sendMessageMutation = useMutation({
    mutationFn: async ({ targetUserId, message }: { targetUserId: string; message: string }) => {
      return await apiRequest('/api/chat/send', { method: 'POST', body: { targetUserId, message } });
    },
    onSuccess: () => {
      if (activeChatUser) {
        // Add the sent message to chat
        const sentMessage: ChatMessage = {
          id: Date.now().toString(),
          senderId: currentUser?.userId || currentUser?.id,
          senderName: currentUser?.displayName || t('you'),
          message: newMessage,
          timestamp: new Date().toLocaleTimeString(),
          fromMe: true
        };
        
        setMessages(prev => [...prev, sentMessage]);
      }
      setNewMessage('');
    },
    onError: (error: any) => {
      console.error('Chat message error:', error);
      toast({
        title: t('error'),
        description: error.message || t('failedToSendMessage'),
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChatUser) return;
    
    sendMessageMutation.mutate({ 
      targetUserId: activeChatUser.userId, 
      message: newMessage.trim() 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setMessages([]);
    setActiveChatUser(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-80 max-w-sm md:w-80 sm:w-[calc(100vw-40px)] sm:max-w-[350px] pointer-events-auto"
        >
            <Card className="shadow-xl border-2 border-blue-200 dark:border-blue-700">
              <CardHeader className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    {activeChatUser ? (
                      <span className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {activeChatUser.displayName}
                      </span>
                    ) : (
                      t('chat')
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {!isMinimized && (
                <CardContent className="p-0">
                  <div className="h-64 sm:h-48 flex flex-col">
                    <ScrollArea className="flex-1 p-3 sm:p-2">
                      <div className="space-y-2">
                        {messages.length === 0 ? (
                          <div className="text-center text-gray-500 text-sm py-8">
{t('noMessagesYet')}
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                                  message.fromMe
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                                }`}
                              >
                                <div className="font-medium text-xs opacity-70 mb-1">
                                  {message.fromMe ? t('you') : message.senderName}
                                </div>
                                <div>{message.message}</div>
                                <div className="text-xs opacity-70 mt-1">
                                  {message.timestamp}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <div className="p-3 sm:p-2 border-t bg-gray-50 dark:bg-gray-800">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('typeMessage')}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="flex-1 text-sm sm:text-base"
                          disabled={!activeChatUser || sendMessageMutation.isPending}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || !activeChatUser || sendMessageMutation.isPending}
                          size="sm"
                          className="px-3 sm:px-4 sm:py-2"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}