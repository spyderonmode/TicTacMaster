import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Palette, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/contexts/LanguageContext";

interface Achievement {
  id: string;
  achievementType: string;
  achievementName: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface User {
  id: string;
  selectedAchievementBorder?: string;
}

interface AchievementBorderSelectorProps {
  user: User;
}

export function AchievementBorderSelector({ user }: AchievementBorderSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBorder, setSelectedBorder] = useState<string | null>(user.selectedAchievementBorder || null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Update selectedBorder when user prop changes (when selectedAchievementBorder is loaded from database)
  useEffect(() => {
    setSelectedBorder(user.selectedAchievementBorder || null);
  }, [user.selectedAchievementBorder]);

  // Fetch user's achievements
  const { data: achievements, isLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  // Update selected border mutation
  const updateBorderMutation = useMutation({
    mutationFn: async (achievementType: string | null) => {
      return apiRequest('/api/achievement-border/select', {
        method: 'POST',
        body: { achievementType },
      });
    },
    onSuccess: () => {
      toast({
        title: t('borderUpdated') || 'Border Updated',
        description: t('borderUpdateSuccess') || 'Your achievement border has been updated successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: t('error') || 'Error',
        description: error.message || 'Failed to update achievement border',
        variant: "destructive",
      });
    },
  });

  const handleBorderSelect = (achievementType: string | null) => {
    setSelectedBorder(achievementType);
    updateBorderMutation.mutate(achievementType);
  };

  const getBorderPreview = (achievementType: string) => {
    switch (achievementType) {
      case 'ultimate_veteran':
        return (
          <motion.div
            animate={{
              boxShadow: [
                "0 0 8px #ff6347, 0 0 16px #ff4500, 0 0 24px #ff8c00",
                "0 0 12px #ff1493, 0 0 24px #dc143c, 0 0 36px #b22222",
                "0 0 10px #ff6600, 0 0 20px #ff3300, 0 0 30px #ff0000"
              ],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="px-3 py-2 rounded-lg border-3 border-double border-orange-600 bg-gradient-to-r from-red-900/30 via-orange-800/30 to-red-900/30"
          >
            <span className="text-sm font-black text-white">🔥 Ultimate Veteran</span>
          </motion.div>
        );
      case 'grandmaster':
        return (
          <motion.div
            animate={{
              boxShadow: [
                "0 0 10px #e0e7ff, 0 0 20px #c7d2fe, 0 0 30px #a5b4fc",
                "0 0 12px #f3f4f6, 0 0 24px #e5e7eb, 0 0 36px #d1d5db",
                "0 0 11px #ddd6fe, 0 0 22px #c4b5fd, 0 0 33px #a78bfa"
              ],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="px-3 py-2 rounded-lg border-2 border-indigo-400 bg-gradient-to-r from-indigo-900/25 via-gray-800/25 to-indigo-900/25"
          >
            <span className="text-sm font-bold text-white">💎 Grandmaster</span>
          </motion.div>
        );
      case 'champion':
        return (
          <motion.div
            animate={{
              boxShadow: [
                "0 0 8px #8a2be2, 0 0 16px #4b0082, 0 0 24px #9932cc",
                "0 0 10px #00bfff, 0 0 20px #1e90ff, 0 0 30px #4169e1",
                "0 0 9px #ffd700, 0 0 18px #ffff00, 0 0 27px #ffa500"
              ],
              scale: [1, 1.01, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="px-3 py-2 rounded-lg border-2 border-purple-500 bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20"
          >
            <span className="text-sm font-bold text-white">👑 Champion</span>
          </motion.div>
        );
      case 'legend':
        return (
          <motion.div
            animate={{
              boxShadow: [
                "0 0 6px #ff4500, 0 0 12px #ff6600, 0 0 18px #ff8800",
                "0 0 8px #ff0000, 0 0 16px #ff3300, 0 0 24px #ff6600",
                "0 0 7px #ff8800, 0 0 14px #ffaa00, 0 0 21px #ffcc00"
              ],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="px-3 py-2 rounded-md border-2 border-orange-500 bg-orange-900/20"
          >
            <span className="text-sm font-bold text-white">🌟 Legend</span>
          </motion.div>
        );
      default:
        return (
          <div className="px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-300">Default (No Border)</span>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          {t('chooseBorder') || 'Choose Border'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            {t('selectAchievementBorder') || 'Select Achievement Border'}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('chooseBorderDescription') || 'Choose which achievement border to display around your name in games. You can only use borders from achievements you have unlocked.'}
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Selection */}
          <div>
            <h4 className="text-sm font-medium mb-2">{t('currentSelection') || 'Current Selection'}:</h4>
            {getBorderPreview(selectedBorder || 'default')}
          </div>

          {/* Default Option */}
          <Card className={`cursor-pointer transition-all ${selectedBorder === null ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <X className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t('defaultNoBorder') || 'Default (No Border)'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('defaultBorderDescription') || 'Display your name without any special border effects'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedBorder === null && <Check className="w-5 h-5 text-green-500" />}
                  <Button
                    variant={selectedBorder === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBorderSelect(null)}
                    disabled={updateBorderMutation.isPending}
                  >
                    {selectedBorder === null ? t('selected') || 'Selected' : t('select') || 'Select'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Borders */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              {t('loadingAchievements') || 'Loading achievements...'}
            </div>
          ) : achievements && achievements.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('unlockedBorders') || 'Unlocked Borders'}:</h4>
              {achievements
                .filter(achievement => 
                  ['legend', 'champion', 'grandmaster', 'ultimate_veteran'].includes(achievement.achievementType)
                )
                .map((achievement) => (
                  <Card 
                    key={achievement.id} 
                    className={`cursor-pointer transition-all ${
                      selectedBorder === achievement.achievementType 
                        ? 'ring-2 ring-blue-500' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {achievement.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{achievement.achievementName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {achievement.description}
                            </p>
                            <div className="scale-90 origin-left">
                              {getBorderPreview(achievement.achievementType)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedBorder === achievement.achievementType && (
                            <Check className="w-5 h-5 text-green-500" />
                          )}
                          <Button
                            variant={selectedBorder === achievement.achievementType ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleBorderSelect(achievement.achievementType)}
                            disabled={updateBorderMutation.isPending}
                          >
                            {selectedBorder === achievement.achievementType 
                              ? t('selected') || 'Selected' 
                              : t('select') || 'Select'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>{t('noAchievementBorders') || 'No achievement borders available yet. Unlock achievements like Legend, Champion, Grandmaster, or Ultimate Veteran to access special borders!'}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}