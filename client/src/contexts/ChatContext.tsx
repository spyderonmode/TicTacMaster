import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChatPopup } from '@/components/ChatPopup';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

interface ActiveChat {
  id: string;
  sender: { userId: string; displayName: string };
  initialMessage: string;
  isOpen: boolean;
}

interface ChatContextType {
  showChatPopup: (sender: { userId: string; displayName: string; username?: string }, message: string) => void;
  closeChatPopup: (chatId: string) => void;
  activeChats: ActiveChat[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
  currentUser: any;
}

export function ChatProvider({ children, currentUser }: ChatProviderProps) {
  //console.log('📨 ChatProvider: Initializing with currentUser:', currentUser);
  
  const { isOnline } = useOnlineStatus();
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const showChatPopup = useCallback((sender: { userId: string; displayName: string; username?: string }, message: string) => {
    //console.log('📨 ChatContext: showChatPopup called with sender:', sender, 'message:', message);
    
    // Check if we already have a chat open with this user
    setActiveChats(prev => {
      const existingChatIndex = prev.findIndex(chat => chat.sender.userId === sender.userId);
      
      if (existingChatIndex >= 0) {
        // For existing chats, create a new chat instance to force re-render with new message
        const updated = [...prev];
        const existingChat = updated[existingChatIndex];
        
        // Remove the old chat and add a new one with the new message
        updated.splice(existingChatIndex, 1);
        
        const newChat: ActiveChat = {
          id: `chat-${sender.userId}-${Date.now()}`, // New ID to force re-mount
          sender,
          initialMessage: message,
          isOpen: true
        };
        
        return [...updated, newChat];
      } else {
        // Create new chat
        const newChat: ActiveChat = {
          id: `chat-${sender.userId}-${Date.now()}`,
          sender,
          initialMessage: message,
          isOpen: true
        };
        
        return [...prev, newChat];
      }
    });
    
    //console.log('📨 ChatContext: Chat popups updated');
  }, []);

  // Listen for incoming chat messages and user offline events
  useEffect(() => {
    //console.log('📨 ChatProvider: useEffect initializing - currentUser:', currentUser);
    
    const handleChatMessage = (event: CustomEvent) => {
      //console.log('📨 ChatContext: Event listener triggered with event:', event);
      const data = event.detail;
      console.log('📨 ChatContext: Event detail:', data);
      
      if (data && data.type === 'chat_message_received') {
        //console.log('📨 ChatContext: Processing chat message:', data.message);
        const sender = {
          userId: data.message.senderId,
          displayName: data.message.senderDisplayName || data.message.senderName,
          username: data.message.senderDisplayName || data.message.senderName
        };
        
        //console.log('📨 ChatContext: Calling showChatPopup with sender:', sender, 'message:', data.message.message);
        // Show popup with the new message
        showChatPopup(sender, data.message.message);
      } else {
        //console.log('📨 ChatContext: Event data is not chat_message_received type:', data);
      }
    };
    
    const handleUserOffline = (event: CustomEvent) => {
      const data = event.detail;
      //console.log('📨 ChatContext: User offline event:', data);
      
      if (data && data.type === 'user_offline' && data.userId) {
        // Clear chat popups for the offline user
        setActiveChats(prev => prev.filter(chat => chat.sender.userId !== data.userId));
        //console.log(`📨 ChatContext: Cleared chat history for offline user: ${data.userId}`);
      }
    };

    //console.log('📨 ChatContext: Setting up event listeners for chat_message_received and user_offline');
    // Listen for WebSocket messages
    window.addEventListener('chat_message_received', handleChatMessage as EventListener);
    window.addEventListener('user_offline', handleUserOffline as EventListener);
    
    return () => {
      console.log('📨 ChatContext: Removing event listeners');
      window.removeEventListener('chat_message_received', handleChatMessage as EventListener);
      window.removeEventListener('user_offline', handleUserOffline as EventListener);
    };
  }, [showChatPopup]);

  // Add test function for debugging
  (window as any).testChatPopup = () => {
    console.log('🧪 Testing chat popup directly');
    showChatPopup(
      { userId: 'test123', displayName: 'Test User', username: 'testuser' },
      'Test message from test function'
    );
  };

  const closeChatPopup = (chatId: string) => {
    setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  return (
    <ChatContext.Provider value={{ showChatPopup, closeChatPopup, activeChats }}>
      {children}
      {activeChats.map((chat, index) => (
        <div
          key={chat.id}
          className={`fixed transition-all duration-300 ${
            isMobile 
              ? 'left-4 right-4' // Full width on mobile with margin
              : '' // Let desktop use style positioning
          }`}
          style={{
            zIndex: 1000 + index,
            ...(isMobile ? {
              bottom: `${20 + index * 200}px`, // Stack vertically on mobile
            } : {
              bottom: '20px',
              right: `${20 + index * 320}px` // Stack horizontally on desktop
            })
          }}
        >
          <ChatPopup
            isOpen={chat.isOpen}
            onClose={() => closeChatPopup(chat.id)}
            currentUser={currentUser}
            initialSender={chat.sender}
            initialMessage={chat.initialMessage}
          />
        </div>
      ))}
    </ChatContext.Provider>
  );
}