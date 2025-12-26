import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Coins, Crown, Sparkles, Flame, Trophy, Star, Zap, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DailyRewardStatus {
  canClaim: boolean;
  reward: {
    id: string;
    userId: string;
    lastClaimDate: string | null;
    currentStreak: number;
    bestStreak: number;
    totalClaimed: number;
  } | null;
  nextClaimDate?: string;
}

interface DailyRewardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyRewardModal({ open, onOpenChange }: DailyRewardModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCelebration, setShowCelebration] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(1000000);


  const { data: rewardStatus, isLoading } = useQuery<DailyRewardStatus>({
    queryKey: ['/api/daily-reward'],
    enabled: open,
    staleTime: 3600000, // 1 hour cache
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/daily-reward/claim', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim reward');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (typeof data.coinsEarned === 'number') {
        setRewardAmount(data.coinsEarned);
      }
      setShowCelebration(true);
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reward'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

      setTimeout(() => {
        setShowCelebration(false);
        onOpenChange(false);
      }, 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClaim = () => {
    claimMutation.mutate();
  };

  const formatNextClaimTime = (nextClaimDate?: string) => {
    if (!nextClaimDate) return '';

    const now = new Date();
    const next = new Date(nextClaimDate);
    const diff = next.getTime() - now.getTime();

    if (diff <= 0) return 'Now';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const getStreakBonus = (streak: number) => {
    if (streak >= 30) return "3x";
    if (streak >= 14) return "2x";
    return "1x";
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "from-purple-500 to-pink-500";
    if (streak >= 14) return "from-orange-500 to-red-500";
    if (streak >= 7) return "from-yellow-500 to-orange-500";
    return "from-blue-500 to-cyan-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-[420px] p-0 !gap-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-[0_0_60px_rgba(251,191,36,0.15)] overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {showCelebration ? (
          /* ======================== CELEBRATION VIEW ======================== */
          <div className="relative flex flex-col items-center justify-center py-8 px-6 space-y-5">
            {/* Floating Sparkles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <Sparkles
                  key={i}
                  className="absolute text-yellow-400/60 animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`,
                    width: `${Math.random() * 10 + 6}px`,
                    height: `${Math.random() * 10 + 6}px`,
                  }}
                />
              ))}
            </div>

            {/* Main Coin Animation */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-full blur-xl opacity-60 animate-pulse scale-125"></div>
              <div className="relative bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-full p-5 shadow-xl shadow-amber-500/50 animate-bounce">
                <Coins className="h-14 w-14 text-slate-900" />
              </div>
              <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 text-amber-300 animate-pulse" />
            </div>

            {/* Success Text */}
            <div className="text-center space-y-4 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <Star className="h-6 w-6 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                <h2 className="text-3xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                  AMAZING!
                </h2>
                <Star className="h-6 w-6 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 rounded-xl p-5 border border-amber-400/30 shadow-lg backdrop-blur-sm">
                <p className="text-xs text-amber-200/80 font-medium tracking-wider uppercase mb-2">You Earned</p>
                <div className="flex items-center justify-center gap-2">
                  <Coins className="h-7 w-7 text-amber-400" />
                  <p className="text-4xl font-black bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
                    +{rewardAmount.toLocaleString()}
                  </p>
                </div>
                <p className="text-lg text-amber-100 mt-2 font-bold tracking-wide">COINS</p>
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-300">
                <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
                <p className="text-sm italic">Keep your streak alive!</p>
                <Flame className="h-5 w-5 text-orange-400 animate-pulse" />
              </div>
            </div>
          </div>
        ) : (
          /* ======================== MAIN VIEW ======================== */
          <div className="relative">
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-amber-600/20 via-yellow-500/20 to-amber-600/20 border-b border-amber-500/30 px-5 py-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                  <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2 rounded-lg shadow-lg shadow-amber-500/30">
                    <Gift className="h-5 w-5 text-slate-900" />
                  </div>
                  <span className="bg-gradient-to-r from-amber-200 to-yellow-100 bg-clip-text text-transparent">
                    Daily Reward
                  </span>
                  <Sparkles className="h-5 w-5 text-amber-400 animate-pulse ml-auto" />
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-sm mt-1">
                  Claim your reward and build your streak!
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="px-5 py-5 space-y-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-400"></div>
                </div>
              ) : rewardStatus?.canClaim ? (
                <>
                  {/* Premium Treasure Chest */}
                  <div className="relative bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/30 rounded-xl p-5 text-center overflow-hidden group hover:border-amber-400/50 transition-all duration-500">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Chest Icon */}
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-xl scale-125 animate-pulse"></div>
                      <div className="relative inline-block">
                        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-xl p-4 shadow-xl shadow-amber-500/40 transform group-hover:scale-105 transition-transform duration-300">
                          <Gift className="h-12 w-12 text-slate-900" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-1.5 shadow-lg animate-bounce">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Reward Amount */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <Coins className="h-7 w-7 text-amber-400" />
                        <p className="text-4xl font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                          1,000,000
                        </p>
                      </div>
                      <p className="text-amber-200/70 font-medium tracking-wider uppercase text-sm">Golden Coins</p>
                    </div>
                  </div>

                  {/* Streak Display */}
                  {rewardStatus.reward && (
                    <div className="space-y-3">
                      {/* Current Streak */}
                      <div className={`flex items-center justify-between p-4 rounded-lg bg-gradient-to-r ${getStreakColor(rewardStatus.reward.currentStreak)}/10 border border-white/10`}>
                        <div className="flex items-center gap-3">
                          <div className="bg-white/10 rounded-lg p-2">
                            <Flame className="h-5 w-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-white font-bold">
                              {rewardStatus.reward.currentStreak} Day Streak
                            </p>
                            <p className="text-white/60 text-xs">Keep it going!</p>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg px-3 py-1.5">
                          <span className="text-white font-bold">{getStreakBonus(rewardStatus.reward.currentStreak)} Bonus</span>
                        </div>
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                          <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                          <p className="text-white font-bold text-lg">{rewardStatus.reward.bestStreak}</p>
                          <p className="text-slate-400 text-xs">Best Streak</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                          <Star className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                          <p className="text-white font-bold text-lg">{rewardStatus.reward.totalClaimed}</p>
                          <p className="text-slate-400 text-xs">Total Claims</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Claim Button */}
                  <Button
                    onClick={handleClaim}
                    disabled={claimMutation.isPending}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 text-slate-900 font-bold text-base py-6 rounded-xl shadow-lg shadow-amber-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {claimMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900"></div>
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Gift className="h-5 w-5" />
                          Claim Your Reward
                          <Sparkles className="h-5 w-5 group-hover:animate-spin" />
                        </>
                      )}
                    </span>
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </Button>
                </>
              ) : (
                /* ======================== ALREADY CLAIMED VIEW ======================== */
                <div className="text-center space-y-5 py-4">
                  {/* Clock Icon */}
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-slate-500/20 rounded-full blur-xl scale-125"></div>
                    <div className="relative bg-gradient-to-br from-slate-600 to-slate-700 rounded-full p-5 shadow-xl">
                      <Clock className="h-12 w-12 text-slate-300" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Already Claimed!</h3>
                    <p className="text-slate-400">
                      Come back in{" "}
                      <span className="text-amber-400 font-bold">
                        {formatNextClaimTime(rewardStatus?.nextClaimDate)}
                      </span>
                    </p>
                  </div>

                  {/* Current Stats */}
                  {rewardStatus?.reward && (
                    <div className="space-y-3 pt-2">
                      <div className={`flex items-center justify-center gap-3 p-4 rounded-lg bg-gradient-to-r ${getStreakColor(rewardStatus.reward.currentStreak)}/10 border border-white/10`}>
                        <Flame className="h-6 w-6 text-orange-400" />
                        <span className="text-white font-bold text-lg">
                          {rewardStatus.reward.currentStreak} Day Streak
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                          <Trophy className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                          <p className="text-white font-bold">{rewardStatus.reward.bestStreak}</p>
                          <p className="text-slate-400 text-xs">Best Streak</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                          <Star className="h-5 w-5 text-amber-400 mx-auto mb-1" />
                          <p className="text-white font-bold">{rewardStatus.reward.totalClaimed}</p>
                          <p className="text-slate-400 text-xs">Total Claims</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => onOpenChange(false)}
                    variant="outline"
                    className="w-full mt-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
