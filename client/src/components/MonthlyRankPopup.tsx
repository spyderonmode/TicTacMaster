import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Using smaller DialogContent for better fit
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'; 
import { Button } from '@/components/ui/button';
import { Crown, Medal, Award, Trophy, Coins, Target, Sparkles, Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
// formatNumber is only used for the Reward, not the performance panel now
import { formatNumber } from '@/lib/utils'; 

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

// --- Helper function for Coin Abbreviation (New or Modified) ---

/**
 * Formats a number, abbreviating large numbers with 'k' or 'M'.
 * e.g., 435000 -> 435k, -435000 -> -435k
 * @param num The number to format.
 * @returns The formatted string.
 */
const abbreviateNumber = (num: number): string => {
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (absNum >= 1000000) {
        // Divide by 1 million and round to 1 decimal place if needed
        return sign + (absNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (absNum >= 1000) {
        // Divide by 1 thousand and round to 1 decimal place if needed
        return sign + (absNum / 1000).toFixed(0) + 'k'; // Keeping it simple for hundreds of thousands
    }
    return String(num);
};
// ------------------------------------------------------------------


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

  // Reset isClosing when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

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
  // const isTop3 = rankData.finalRank <= 3; // Unused variable removed

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500 md:w-8 md:h-8" />; // Reduced size
      case 2: return <Medal className="w-6 h-6 text-gray-400 md:w-8 md:h-8" />; // Reduced size
      case 3: return <Award className="w-6 h-6 text-amber-600 md:w-8 md:h-8" />; // Reduced size
      default: return <Trophy className="w-6 h-6 text-blue-500 md:w-8 md:h-8" />; // Reduced size
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
      // Message refinement for "Keep Climbing!" based on the image provided
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
    return `WEEK ${weekNumber}, ${year}`;
  };

  const rankMessage = getRankMessage();

  const getRankGradient = () => {
    if (rankData.finalRank === 1) return "from-yellow-400 via-yellow-500 to-amber-600";
    if (rankData.finalRank === 2) return "from-gray-300 via-gray-400 to-gray-500";
    if (rankData.finalRank === 3) return "from-amber-400 via-amber-500 to-orange-600";
    if (isTop10) return "from-purple-500 via-purple-600 to-indigo-600";
    if (isTop50) return "from-blue-500 via-blue-600 to-cyan-600";
    return "from-gray-500 via-gray-600 to-gray-700";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent 
            // Adjusted max-width and padding for better fit
            className="w-full max-w-sm mx-auto p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-gray-900 to-black dark:from-slate-950 dark:via-gray-950 dark:to-black border-2 border-yellow-500/30 dark:border-yellow-400/20 shadow-2xl shadow-yellow-500/20"
            data-testid="weekly-rank-popup"
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-purple-500/20 to-blue-500/20 animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_50%)]"></div>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: isClosing ? 0.8 : 1, opacity: isClosing ? 0 : 1 }}
              transition={{ duration: 0.3 }}
              // Reduced overall spacing with space-y-3
              className="text-center space-y-3 relative z-10" 
            >
              <DialogTitle className="sr-only">Weekly League Results</DialogTitle>
              
              {/* Premium Header with Sparkles */}
              <div className="space-y-1 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                </div>
                {/* Reduced font size to 2xl */}
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 bg-clip-text text-transparent pt-3"> 
                  Weekly League Results
                </h2>
                {/* Reduced font size to xs */}
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium tracking-widest uppercase">
                  {getWeekDisplay(rankData.weekNumber, rankData.year)}
                </p>
              </div>

              {/* Premium User Profile Card - Reduced padding */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-purple-500/10 to-blue-500/10 rounded-xl blur-xl"></div>
                {/* Reduced padding to p-3 */}
                <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-r ${getRankGradient()} rounded-full blur-md opacity-50 animate-pulse`}></div>
                      {userProfileImage ? (
                        // Reduced image size to w-14 h-14
                        <img 
                          src={userProfileImage} 
                          alt={userDisplayName}
                          className={`relative w-14 h-14 rounded-full border-4 border-gradient-to-r ${getRankGradient()} ring-4 ring-gray-800`}
                          data-testid="user-profile-image"
                        />
                      ) : (
                        // Reduced placeholder size
                        <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${getRankGradient()} flex items-center justify-center text-white text-lg font-bold ring-4 ring-gray-800 shadow-xl`}>
                          {userDisplayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      {/* Reduced text size to base/lg */}
                      <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" data-testid="user-display-name">
                        {userDisplayName}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-gray-400">League Player</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Rank Display - Reduced padding */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="space-y-2"
              >
                <div className="relative">
                  {/* Rank Badge with Glow - Reduced padding to p-5 */}
                  <div className="relative inline-flex items-center justify-center">
                    <div className={`absolute inset-0 bg-gradient-to-r ${getRankGradient()} rounded-full blur-xl opacity-60 animate-pulse`}></div>
                    <div className={`relative bg-gradient-to-br ${getRankGradient()} rounded-full p-5 shadow-2xl ring-4 ring-gray-800 border-2 border-white/20`}>
                      <div className="flex items-center gap-2">
                        {getRankIcon(rankData.finalRank)}
                        {/* Reduced font size to 4xl */}
                        <span className="text-4xl font-black text-white drop-shadow-2xl" data-testid="final-rank">
                          #{rankData.finalRank}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rank Message - Reduced font sizes to base/sm */}
                <div className="space-y-1 px-2">
                  <h3 className="text-lg font-black bg-gradient-to-r from-yellow-200 via-white to-yellow-200 bg-clip-text text-transparent">
                    {rankMessage.title}
                  </h3>
                  <p className="text-sm text-gray-300 font-medium leading-relaxed">
                    {rankMessage.message}
                  </p>
                  <p className="text-xs text-gray-400 italic">
                    {rankMessage.subMessage}
                  </p>
                </div>
              </motion.div>

              {/* Premium Reward Section - Reduced padding and font sizes */}
              {isTop50 && rankData.rewardReceived && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-xl blur-xl opacity-30 animate-pulse"></div>
                  {/* Reduced padding to p-4, reduced rounded to xl */}
                  <div className="relative bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-sm p-4 rounded-xl border-2 border-yellow-400/40 shadow-2xl">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Coins className="w-6 h-6 text-yellow-400 animate-bounce" />
                      <span className="text-lg font-black bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                        League Reward!
                      </span>
                    </div>
                    {/* Reduced font size to 3xl */}
                    <div className="text-3xl font-black text-yellow-300 drop-shadow-lg" data-testid="reward-amount">
                      +{formatNumber(rankData.rewardAmount)}
                    </div>
                    <p className="text-xs text-yellow-200/80 mt-1 font-semibold tracking-wide">
                      Coins Added to Your Balance
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Premium Stats Summary - Reduced padding and font sizes */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl blur-xl"></div>
                {/* Reduced padding to p-3 */}
                <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-3 shadow-lg">
                  <h4 className="text-[10px] font-bold text-gray-400 mb-2 tracking-wider uppercase text-center">
                    Weekly Performance
                  </h4>
                  <div className="grid grid-cols-3 gap-2"> {/* Reduced gap to 2 */}
                    {/* Stat Box: Wins */}
                    <div className="text-center space-y-1">
                      {/* Reduced padding to p-2 */}
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-2 shadow-lg">
                        {/* Reduced font size to xl */}
                        <div className="text-xl font-black text-white drop-shadow-lg" data-testid="weekly-wins">
                          {rankData.weeklyWins}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold">Wins</div>
                    </div>
                    {/* Stat Box: Games */}
                    <div className="text-center space-y-1">
                      {/* Reduced padding to p-2 */}
                      <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-2 shadow-lg">
                        {/* Reduced font size to xl */}
                        <div className="text-xl font-black text-white drop-shadow-lg" data-testid="weekly-games">
                          {rankData.weeklyGames}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold">Games</div>
                    </div>
                    {/* Stat Box: Coins Won - IMPLEMENTED ABBREVIATION */}
                    <div className="text-center space-y-1">
                      {/* Reduced padding to p-2 */}
                      <div className={`rounded-lg p-2 shadow-lg ${rankData.coinsEarned >= 0 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
                        {/* Reduced font size to xl, used abbreviateNumber */}
                        <div className="text-xl font-black text-white drop-shadow-lg" data-testid="coins-earned">
                          {abbreviateNumber(rankData.coinsEarned)} 
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 font-semibold">Coins Won</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Motivational Message - Reduced padding and font sizes */}
              {!isTop50 && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-lg"></div>
                  {/* Reduced padding to p-3 */}
                  <div className="relative bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm p-3 rounded-xl border border-blue-500/30 shadow-lg">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-300 tracking-wide">
                        Next Week's Target
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Aim for the <span className="font-bold text-yellow-400">Top 50</span> to earn league rewards! 
                      Keep playing and climb the ranks! 🎯
                    </p>
                  </div>
                </div>
              )}

              {/* Premium Close Button - Reduced vertical padding */}
              <div className="relative pt-1">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-purple-500 to-blue-500 rounded-xl blur-lg opacity-50"></div>
                <Button
                  onClick={handleClose}
                  disabled={markSeenMutation.isPending}
                  // Reduced py-2
                  className="relative w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-600 hover:via-amber-600 hover:to-orange-600 text-black font-black py-2 px-4 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-400/50"
                  data-testid="close-popup-button"
                >
                  {markSeenMutation.isPending ? '⏳ Closing...' : '✨ Awesome! Let\'s Go! ✨'}
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default WeeklyRankPopup;