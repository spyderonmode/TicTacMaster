import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AchievementNotificationProps {
  achievement: {
    id: string;
    achievementType: string;
    achievementName: string;
    description: string;
    icon: string;
    unlockedAt: string;
  };
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show notification with animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide after 5 seconds
    const autoHide = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

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
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'
    }`}>
      <Card className="w-80 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{achievement.icon}</div>
              <div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-white" />
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Achievement Unlocked!
                  </Badge>
                </div>
                <h3 className="font-semibold text-white mt-1">{achievement.achievementName}</h3>
                <p className="text-sm text-white/90">{achievement.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-1 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}