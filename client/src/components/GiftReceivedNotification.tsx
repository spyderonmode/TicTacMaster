import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Gift, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

interface GiftReceivedNotificationProps {
  gift: {
    senderId: string;
    senderName: string;
    amount: number;
    message?: string | null;
    timestamp: string;
  };
  onClose: () => void;
}

export function GiftReceivedNotification({ gift, onClose }: GiftReceivedNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification with animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide after 7 seconds (longer than achievement for gift messages)
    const autoHide = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 7000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHide);
    };
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
      }`}
      data-testid="notification-gift-received"
    >
      <Card className="w-80 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 border-0 shadow-lg shadow-purple-500/25">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">
                <Gift className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Coins className="w-4 h-4 text-white" />
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                    Gift Received!
                  </Badge>
                </div>
                <h3 className="font-bold text-white text-lg leading-tight">
                  {formatNumber(gift.amount)} coins
                </h3>
                <p className="text-sm text-white/90 font-medium">
                  from {gift.senderName}
                </p>
                {gift.message && (
                  <div className="mt-2 p-2 bg-white/10 rounded text-xs text-white/95 italic">
                    "{gift.message}"
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-1 h-6 w-6 ml-2"
              data-testid="button-close-gift-notification"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}