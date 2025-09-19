import { useState, useEffect } from "react";
import { PlayerProfileModal } from "./PlayerProfileModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy, Medal, Award, Crown, TrendingUp, Users, Target, Loader2, Calendar, Clock, Coins } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { formatNumber } from "@/lib/utils";

interface WeeklyLeaderboardUser {
  id: string;
  userId: string;
  weeklyWins: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string;
    selectedAchievementBorder: string;
  };
}

interface WeeklyReward {
  id: string;
  weekNumber: number;
  year: number;
  position: number;
  coins: number;
  claimedAt: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface LeaderboardProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}

export function Leaderboard({ trigger, open, onClose }: LeaderboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use external open state if provided, otherwise use internal state
  const modalOpen = open !== undefined ? open : isOpen;
  const handleClose = onClose || (() => setIsOpen(false));
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';

  // Weekly leaderboard query
  const { data: weeklyLeaderboard, isLoading: weeklyLoading, error: weeklyError, refetch: refetchWeekly } = useQuery<WeeklyLeaderboardUser[]>({
    queryKey: ['/api/leaderboard/weekly', language],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/weekly?limit=50', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    enabled: modalOpen, // Always enabled when modal is open
    retry: 3,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Refresh when window gets focus
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Time until week end query
  const { data: timeUntilEnd } = useQuery<TimeLeft>({
    queryKey: ['/api/leaderboard/time-left'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/time-left');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    enabled: modalOpen,
    refetchInterval: 1000, // Update every second for countdown
    staleTime: 0,
  });

  // Weekly rewards query
  const { data: weeklyRewards } = useQuery<WeeklyReward[]>({
    queryKey: ['/api/rewards/weekly'],
    queryFn: async () => {
      const response = await fetch('/api/rewards/weekly', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    enabled: modalOpen,
    retry: 3,
    staleTime: 60000,
  });

  // Force refresh when modal opens or language changes
  useEffect(() => {
    if (modalOpen) {
      console.log(`Modal opened (${language}) - forcing weekly leaderboard refresh`);
      // Clear cache and force fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard/weekly'] });
      refetchWeekly();
    }
  }, [modalOpen, language, refetchWeekly, queryClient]);

  // Update local countdown timer state when data changes
  useEffect(() => {
    if (timeUntilEnd) {
      setTimeLeft(timeUntilEnd);
    }
  }, [timeUntilEnd]);

  // Listen for external trigger to open leaderboard
  useEffect(() => {
    const handleOpenLeaderboard = () => {
      setIsOpen(true);
    };

    window.addEventListener('openLeaderboard', handleOpenLeaderboard);
    return () => window.removeEventListener('openLeaderboard', handleOpenLeaderboard);
  }, []);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return (
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <Crown className="w-7 h-7 text-yellow-500 drop-shadow-lg filter brightness-110" />
            <motion.div 
              className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ 
                scale: [0.5, 1, 0.5],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        );
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{position}</span>;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return "from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "from-gray-300 to-gray-500 text-white";
      case 3:
        return "from-amber-400 to-amber-600 text-white";
      default:
        if (position <= 10) return "from-blue-100 to-blue-200 text-blue-800 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-200";
        return "from-gray-50 to-gray-100 text-gray-700 dark:from-gray-800/50 dark:to-gray-700/50 dark:text-gray-300";
    }
  };

  // Get achievement border styling for profile pictures
  const getAchievementBorderStyle = (entry: WeeklyLeaderboardUser, position: number) => {
    // Always show golden border for top 3 positions
    if (position <= 3) {
      switch (position) {
        case 1:
          return {
            borderClass: "ring-2 ring-yellow-400",
            glowEffect: "shadow-[0_0_12px_rgba(234,179,8,0.4)]",
            animation: "animate-pulse"
          };
        case 2:
          return {
            borderClass: "ring-2 ring-gray-400",
            glowEffect: "shadow-[0_0_12px_rgba(156,163,175,0.4)]",
            animation: "animate-pulse"
          };
        case 3:
          return {
            borderClass: "ring-2 ring-amber-400",
            glowEffect: "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
            animation: "animate-pulse"
          };
      }
    }

    // Apply achievement-specific styling for users with achievement borders
    if (!entry.user.selectedAchievementBorder) {
      return {
        borderClass: "ring-1 ring-gray-200 dark:ring-gray-600",
        glowEffect: "",
        animation: ""
      };
    }

    switch (entry.user.selectedAchievementBorder) {
      case 'ultimate_veteran':
        return {
          borderClass: "ring-2 ring-orange-500",
          glowEffect: "shadow-[0_0_15px_rgba(255,99,71,0.5)]",
          animation: "animate-pulse"
        };
      case 'grandmaster':
        return {
          borderClass: "ring-2 ring-indigo-400",
          glowEffect: "shadow-[0_0_15px_rgba(165,180,252,0.5)]",
          animation: "animate-pulse"
        };
      case 'champion':
        return {
          borderClass: "ring-2 ring-purple-400",
          glowEffect: "shadow-[0_0_15px_rgba(196,181,253,0.5)]",
          animation: "animate-pulse"
        };
      case 'legend':
        return {
          borderClass: "ring-2 ring-orange-400",
          glowEffect: "shadow-[0_0_15px_rgba(251,146,60,0.5)]",
          animation: "animate-pulse"
        };
      default:
        return {
          borderClass: "ring-1 ring-gray-200 dark:ring-gray-600",
          glowEffect: "",
          animation: ""
        };
    }
  };

  const renderAchievementBorder = (entry: WeeklyLeaderboardUser, position: number) => {
    if (!entry.user.selectedAchievementBorder) {
      return (
        <span className="font-semibold text-sm truncate">
          {entry.user.displayName}
        </span>
      );
    }

    switch (entry.user.selectedAchievementBorder) {
      case 'ultimate_veteran':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 8px #ff6347, 0 0 12px #ff4500, 0 0 16px #ffd700",
                "0 0 10px #ff1493, 0 0 15px #dc143c, 0 0 20px #8b0000",
                "0 0 9px #ff6600, 0 0 13px #ff3300, 0 0 17px #cc0000",
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-black text-sm sm:text-base truncate text-orange-500"
          >
            🔥 {entry.user.displayName}
          </motion.span>
        );
      case 'grandmaster':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 8px #e0e7ff, 0 0 12px #c7d2fe, 0 0 16px #a5b4fc",
                "0 0 10px #f3f4f6, 0 0 15px #e5e7eb, 0 0 20px #d1d5db",
                "0 0 9px #ddd6fe, 0 0 13px #c4b5fd, 0 0 17px #a78bfa"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-sm sm:text-base truncate text-indigo-400"
          >
            💎 {entry.user.displayName}
          </motion.span>
        );
      case 'champion':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 8px #8a2be2, 0 0 12px #4b0082, 0 0 16px #9932cc",
                "0 0 10px #00bfff, 0 0 15px #1e90ff, 0 0 20px #4169e1",
                "0 0 9px #ffd700, 0 0 13px #ffff00, 0 0 17px #ffa500"
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-sm sm:text-base truncate text-purple-400"
          >
            👑 {entry.user.displayName}
          </motion.span>
        );
      case 'legend':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 6px #ff4500, 0 0 12px #ff6600, 0 0 18px #ff8800",
                "0 0 8px #ff0000, 0 0 16px #ff3300, 0 0 24px #ff6600",
                "0 0 7px #ff8800, 0 0 14px #ffaa00, 0 0 21px #ffcc00"
              ]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-sm sm:text-base truncate text-orange-400"
          >
            🌟 {entry.user.displayName}
          </motion.span>
        );
      default:
        return (
          <span className="font-semibold text-sm sm:text-base truncate">
            {entry.user.displayName}
          </span>
        );
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-leaderboard">
      <Trophy className="w-4 h-4" />
      {t('Leaderboard') || 'Leaderboard'}
    </Button>
  );

  return (
    <Dialog open={modalOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <div onClick={(e) => {
          e.stopPropagation();
          if (open !== undefined) {
            // External control - don't use internal state
            onClose?.();
          } else {
            setIsOpen(true);
          }
        }} data-testid="trigger-leaderboard">
          {trigger || defaultTrigger}
        </div>
      </DialogTrigger>
      <DialogContent 
        className={`max-w-[98vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] w-full mx-auto flex flex-col overflow-hidden bg-gradient-to-br from-purple-100/95 via-blue-50/98 to-indigo-100/90 dark:from-slate-900/95 dark:via-purple-900/50 dark:to-indigo-900/95 backdrop-blur-md border border-purple-200/30 dark:border-purple-700/30 shadow-2xl ${isArabic ? 'font-arabic' : ''}`}
        style={isArabic ? { 
          fontFamily: "'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif",
          direction: 'rtl'
        } : {}}
        data-testid="dialog-leaderboard"
      >
        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-3 border-b bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-600/30 relative overflow-hidden">
          {/* Enhanced Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 via-orange-50/20 to-red-50/30 dark:from-yellow-900/10 dark:via-orange-900/5 dark:to-red-900/10"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-32 bg-gradient-to-b from-yellow-100/20 to-transparent dark:from-yellow-800/10 blur-3xl"></div>
          
          <div className="text-center space-y-1 sm:space-y-2 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <DialogTitle className={`flex items-center justify-center gap-1 sm:gap-2 text-lg sm:text-xl md:text-2xl font-bold ${isArabic ? 'font-arabic' : ''}`}>
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-500 drop-shadow-2xl filter brightness-110" />
                </motion.div>
                <span className={`bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-sm ${isArabic ? 'font-arabic' : ''}`}>
                  {t('Weekly Leaderboard') || 'Weekly Leaderboard'}
                </span>
              </DialogTitle>
            </motion.div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

          {/* Compact Timer & Rewards */}
          <div className="mb-1 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-1 rounded border border-purple-200/50 dark:border-purple-700/30">
            <div className="text-center space-y-1">
              {/* Compact Timer */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <Clock className="w-3 h-3 text-orange-500" />
                <div className="flex gap-1 font-mono" data-testid="countdown-timer">
                  <span className="bg-orange-100 dark:bg-orange-900/30 px-1 py-0.5 rounded text-orange-700 dark:text-orange-300">{timeLeft.days}d</span>
                  <span className="bg-orange-100 dark:bg-orange-900/30 px-1 py-0.5 rounded text-orange-700 dark:text-orange-300">{timeLeft.hours}h</span>
                  <span className="bg-orange-100 dark:bg-orange-900/30 px-1 py-0.5 rounded text-orange-700 dark:text-orange-300">{timeLeft.minutes}m</span>
                </div>
              </div>
              
              {/* Rewards Header */}
              <div className="text-center text-xs font-medium text-purple-700 dark:text-purple-300">
                Rewards in coins for top 10 players
              </div>
              
              {/* Compact Rewards */}
              <div className="flex justify-center flex-wrap gap-1 text-xs" data-testid="rewards-display">
                <div className="flex items-center gap-0.5 bg-yellow-100 dark:bg-yellow-900/30 px-1 py-0.5 rounded">
                  <Crown className="w-2.5 h-2.5 text-yellow-600" />
                  <span className="text-yellow-700 dark:text-yellow-300">10M</span>
                </div>
                <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800/50 px-1 py-0.5 rounded">
                  <Medal className="w-2.5 h-2.5 text-gray-600" />
                  <span className="text-gray-700 dark:text-gray-300">5M</span>
                </div>
                <div className="flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 px-1 py-0.5 rounded">
                  <Award className="w-2.5 h-2.5 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300">3M</span>
                </div>
                <div className="flex items-center gap-0.5 bg-blue-100 dark:bg-blue-900/30 px-1 py-0.5 rounded">
                  <span className="text-blue-700 dark:text-blue-300 text-[10px]">4th-10th</span>
                  <span className="text-blue-700 dark:text-blue-300">1M</span>
                </div>
              </div>
            </div>
          </div>

          {weeklyLoading ? (
            <div className="flex items-center justify-center py-8 flex-1" data-testid="loading-state">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">{t('Loading weekly leaderboard...') || 'Loading weekly leaderboard...'}</span>
            </div>
          ) : weeklyError ? (
            <div className="flex flex-col items-center justify-center py-8 flex-1 text-red-500" data-testid="error-state">
              <span>{t('errorLoadingWeeklyLeaderboard') || 'Error loading weekly leaderboard. Please try again.'}</span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent" style={{ WebkitOverflowScrolling: 'touch' }} data-testid="leaderboard-container">
              <div className="space-y-1 py-1">
                {weeklyLeaderboard && weeklyLeaderboard.length > 0 ? (
                  weeklyLeaderboard.map((entry, index) => {
                    const position = index + 1;
                    const user = entry.user;
                    
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        data-testid={`player-card-${entry.id}`}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02, y: -2 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Card 
                            className={`relative cursor-pointer overflow-hidden ${
                            position <= 3 ? 'border-2 shadow-xl' : 'border shadow-lg'} ${
                            position === 1 ? 'border-yellow-400/60 bg-gradient-to-br from-yellow-50/90 via-amber-50/80 to-yellow-100/70 dark:from-yellow-900/30 dark:via-amber-900/25 dark:to-yellow-800/30 shadow-yellow-200/60 shadow-2xl' :
                            position === 2 ? 'border-gray-400/50 bg-gradient-to-br from-gray-50/80 via-white to-gray-100/60 dark:from-gray-700/20 dark:via-slate-800 dark:to-gray-600/20 shadow-gray-200/40' :
                            position === 3 ? 'border-amber-400/50 bg-gradient-to-br from-amber-50/80 via-white to-amber-100/60 dark:from-amber-900/20 dark:via-slate-800 dark:to-amber-800/20 shadow-amber-200/40' : 
                            'bg-gradient-to-br from-slate-50/90 via-white to-blue-50/40 dark:from-slate-800/90 dark:via-slate-750 dark:to-slate-700/90 border-gray-200/60 dark:border-gray-600/40 shadow-gray-100/60'
                          } ${position === 1 ? 'ring-4 ring-yellow-300/50 shadow-yellow-300/40 shadow-2xl' : position <= 3 ? 'ring-2 ring-opacity-30 shadow-2xl ' + (position === 2 ? 'ring-gray-300/40' : 'ring-amber-300/40') : 'ring-1 ring-gray-200/30 dark:ring-gray-600/30'} backdrop-blur-sm ${position === 1 ? 'animate-pulse' : ''}`}
                            onClick={() => {
                              setSelectedPlayerId(user.id);
                              setShowPlayerProfile(true);
                            }}>
                              <CardContent className={`${isArabic ? 'p-2 sm:p-3' : 'p-2 sm:p-3'} relative`}>
                                {position === 1 && (
                                  <>
                                    {/* Golden Sparkles Animation for #1 */}
                                    <motion.div 
                                      className="absolute top-1 left-1 w-2 h-2 bg-yellow-400 rounded-full opacity-70"
                                      animate={{ 
                                        scale: [0, 1, 0],
                                        opacity: [0, 1, 0]
                                      }}
                                      transition={{ 
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: 0
                                      }}
                                    />
                                    <motion.div 
                                      className="absolute top-3 right-4 w-1.5 h-1.5 bg-amber-300 rounded-full opacity-60"
                                      animate={{ 
                                        scale: [0, 1, 0],
                                        opacity: [0, 1, 0]
                                      }}
                                      transition={{ 
                                        duration: 2.5,
                                        repeat: Infinity,
                                        delay: 0.8
                                      }}
                                    />
                                  </>
                                )}
                                
                                <div className="flex items-center gap-3 mb-3">
                                  {/* Rank Icon/Number */}
                                  <div className="flex-shrink-0 relative">
                                    {getRankIcon(position)}
                                  </div>
                                  
                                  {/* Avatar with achievement border styling */}
                                  {(() => {
                                    const borderStyle = getAchievementBorderStyle(entry, position);
                                    return (
                                      <div className={`relative group ${borderStyle.animation}`}>
                                        <div 
                                          className={`w-12 h-12 rounded-full ${borderStyle.borderClass} ${borderStyle.glowEffect} transition-all duration-300 group-hover:scale-105 overflow-hidden bg-gradient-to-br from-white to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-bold text-lg`}
                                          style={{
                                            backgroundImage: user.profileImageUrl ? `url(${user.profileImageUrl})` : undefined,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                          }}
                                          data-testid={`avatar-${user.id}`}
                                        >
                                          {!user.profileImageUrl && (
                                            <span className="text-gray-600 dark:text-gray-300 text-base">
                                              {user.displayName?.charAt(0)?.toUpperCase() || '?'}
                                            </span>
                                          )}
                                        </div>
                                        
                                        {/* Subtle Rank position indicator for top 3 */}
                                        {position <= 3 && (
                                          <motion.div 
                                            className={`absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full border border-white dark:border-gray-900 flex items-center justify-center text-xs font-bold bg-gradient-to-br ${getRankColor(position)} shadow-lg z-30`}
                                            animate={{ 
                                              scale: position === 1 ? [1, 1.1, 1] : 1,
                                            }}
                                            transition={{ 
                                              duration: 2,
                                              repeat: position === 1 ? Infinity : 0,
                                              ease: "easeInOut"
                                            }}
                                            data-testid={`rank-badge-${position}`}
                                            style={{
                                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                                            }}
                                          >
                                            <span className="text-white drop-shadow-sm font-bold text-xs">{position}</span>
                                          </motion.div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  
                                  {/* Player Info */}
                                  <div className="flex-1 min-w-0">
                                    <div data-testid={`player-name-${user.id}`}>
                                      {renderAchievementBorder(entry, position)}
                                    </div>
                                  </div>
                                  
                                  {/* Weekly Wins Display */}
                                  <div className="text-right" data-testid={`wins-${user.id}`}>
                                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                      {entry.weeklyWins}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      weekly wins
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500" data-testid="no-data-state">
                      <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>{t('noWeeklyDataYet') || 'No weekly data yet. Start playing to compete!'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        <div className="flex justify-between items-center pt-1 pb-1 sm:pt-1.5 sm:pb-1.5 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 flex-shrink-0 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <div className={`flex items-center gap-2 ${isArabic ? 'font-arabic' : ''}`}>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400" data-testid="player-count">
              {weeklyLeaderboard?.length ? 
                `${t('showing') || 'Showing'} ${weeklyLeaderboard.length} ${t('players') || 'players'}` :
                ''
              }
            </span>
          </div>
          <Button 
            onClick={handleClose} 
            variant="default" 
            className={`bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg px-2 sm:px-3 text-xs ${isArabic ? 'font-arabic' : ''}`}
            data-testid="button-close"
          >
            {t('close') || 'Close'}
          </Button>
        </div>
      </DialogContent>

      {/* Player Profile Modal */}
      <PlayerProfileModal
        playerId={selectedPlayerId}
        open={showPlayerProfile}
        onClose={() => {
          setShowPlayerProfile(false);
          setSelectedPlayerId(null);
        }}
        currentUserId={undefined} // TODO: Get current user ID from context
      />
    </Dialog>
  );
}