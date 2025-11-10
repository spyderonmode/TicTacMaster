import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Medal, Award, Trophy, Coins, TrendingUp, Target } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface WeeklyRankData {
  id: string;
  weekNumber: number;
  year: number;
  finalRank: number;
  rewardReceived: boolean;
  rewardAmount: number;
  weeklyWins: number;
  weeklyLosses: number;
  weeklyGames: number;
  coinsEarned: number;
}

interface WeeklyRankPopupProps {
  isOpen: boolean;
  onClose: () => void;
  rankData: WeeklyRankData;
  userDisplayName: string;
  userProfileImage?: string;
}

const WeeklyRankPopup = ({ 
  isOpen, 
  onClose, 
  rankData, 
  userDisplayName, 
  userProfileImage 
}: WeeklyRankPopupProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClosing, setIsClosing] = useState(false);

  const markSeenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/user/mark-rank-popup-seen', {
        method: 'POST',
        body: { weekNumber: rankData.weekNumber, year: rankData.year }
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh user data after marking as seen
      queryClient.invalidateQueries({ queryKey: ['/api/users/online-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
      
      setIsClosing(true);
      setTimeout(onClose, 500); // Allow exit animation
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update rank status',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    markSeenMutation.mutate();
  };

  const isTop10 = rankData.finalRank <= 10;
  const isTop50 = rankData.finalRank <= 50;
  const isTop3 = rankData.finalRank <= 3;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-8 h-8 text-yellow-500" />;
      case 2: return <Medal className="w-8 h-8 text-gray-400" />;
      case 3: return <Award className="w-8 h-8 text-amber-600" />;
      default: return <Trophy className="w-8 h-8 text-blue-500" />;
    }
  };

  const getRankMessage = () => {
    if (rankData.finalRank === 1) {
      return {
        title: "🎉 CHAMPION! 🎉",
        message: "Incredible! You dominated the weekly leaderboard and claimed the #1 spot!",
        subMessage: "You are the ultimate Tic Tac 3x5 master this week!"
      };
    } else if (rankData.finalRank === 2) {
      return {
        title: "🥈 RUNNER-UP! 🥈",
        message: "Amazing performance! You secured 2nd place in this week's competition!",
        subMessage: "You're one of the elite players this week!"
      };
    } else if (rankData.finalRank === 3) {
      return {
        title: "🥉 BRONZE MEDALIST! 🥉", 
        message: "Excellent work! You earned 3rd place in the weekly rankings!",
        subMessage: "You're among the top performers this week!"
      };
    } else if (isTop10) {
      return {
        title: "⭐ TOP 10 FINISHER! ⭐",
        message: `Outstanding! You finished in ${rankData.finalRank}${getOrdinalSuffix(rankData.finalRank)} place!`,
        subMessage: "You've earned your spot among the week's best players!"
      };
    } else if (isTop50) {
      return {
        title: "🎯 TOP 50 FINISHER! 🎯",
        message: `You finished in ${rankData.finalRank}${getOrdinalSuffix(rankData.finalRank)} place this week.`,
        subMessage: "Great effort! Keep playing to climb higher next week!"
      };
    } else {
      return {
        title: "🚀 Keep Climbing! 🚀",
        message: `You finished in ${rankData.finalRank}${getOrdinalSuffix(rankData.finalRank)} place this week.`,
        subMessage: "Great effort! Keep playing to climb higher next week!"
      };
    }
  };

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const getWeekDisplay = (weekNumber: number, year: number) => {
    return `Week ${weekNumber}, ${year}`;
  };

  const rankMessage = getRankMessage();

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent 
            className="max-w-md mx-auto bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700"
            data-testid="weekly-rank-popup"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: isClosing ? 0.8 : 1, opacity: isClosing ? 0 : 1 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-4"
            >
              <DialogTitle className="sr-only">Weekly Ranking Results</DialogTitle>
              
              {/* Header */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                  {getWeekDisplay(rankData.weekNumber, rankData.year)} Results
                </h2>
              </div>

              {/* User Profile */}
              <div className="flex items-center justify-center space-x-3">
                <div className="relative">
                  {userProfileImage ? (
                    <img 
                      src={userProfileImage} 
                      alt={userDisplayName}
                      className="w-16 h-16 rounded-full border-4 border-purple-300 dark:border-purple-600"
                      data-testid="user-profile-image"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold border-4 border-purple-300 dark:border-purple-600">
                      {userDisplayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200" data-testid="user-display-name">
                    {userDisplayName}
                  </h3>
                </div>
              </div>

              {/* Rank Display */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-center space-x-3">
                  {getRankIcon(rankData.finalRank)}
                  <span className="text-4xl font-bold text-purple-800 dark:text-purple-200" data-testid="final-rank">
                    #{rankData.finalRank}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {rankMessage.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {rankMessage.message}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {rankMessage.subMessage}
                  </p>
                </div>
              </motion.div>

              {/* Reward Section */}
              {isTop50 && rankData.rewardReceived && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 p-4 rounded-lg border border-yellow-300 dark:border-yellow-700"
                >
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Coins className="w-6 h-6 text-yellow-600" />
                    <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                      Reward Earned!
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200" data-testid="reward-amount">
                    +{rankData.rewardAmount.toLocaleString()} Coins
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Added to your account
                  </p>
                </motion.div>
              )}

              {/* Stats Summary */}
              <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Your Weekly Performance
                </h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-600 dark:text-green-400" data-testid="weekly-wins">
                      {rankData.weeklyWins}
                    </div>
                    <div className="text-gray-500">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-600 dark:text-blue-400" data-testid="weekly-games">
                      {rankData.weeklyGames}
                    </div>
                    <div className="text-gray-500">Games</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600 dark:text-purple-400" data-testid="coins-earned">
                      {rankData.coinsEarned.toLocaleString()}
                    </div>
                    <div className="text-gray-500">Coins</div>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              {!isTop50 && (
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      Next Month's Goal
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Aim for the top 10 to earn reward coins! Keep practicing and you'll get there! 🎯
                  </p>
                </div>
              )}

              {/* Close Button */}
              <Button
                onClick={handleClose}
                disabled={markSeenMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                data-testid="close-popup-button"
              >
                {markSeenMutation.isPending ? 'Closing...' : 'Awesome! 🚀'}
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default WeeklyRankPopup;