import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Gift, Coins, Target } from "lucide-react";
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(1000000);

  const { data: rewardStatus, isLoading } = useQuery<DailyRewardStatus>({
    queryKey: ['/api/daily-reward'],
    enabled: open,
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
      // Extract coin amount from response if available
      if (typeof data.coinsEarned === 'number') {
        setRewardAmount(data.coinsEarned);
      }
      setShowCelebration(true);
      queryClient.invalidateQueries({ queryKey: ['/api/daily-reward'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });

      // Auto close after a short delay to let them see the success message
      setTimeout(() => {
        setShowCelebration(false);
        onOpenChange(false);
      }, 2000);
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
    // Trigger immediately without animation delay
    claimMutation.mutate();
  };

  const formatNextClaimTime = (nextClaimDate?: string) => {
    if (!nextClaimDate) return '';
    
    const now = new Date();
    const next = new Date(nextClaimDate);
    const diff = next.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-yellow-500/30"
        data-testid="dialog-daily-reward"
      >
        {showCelebration ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Static Celebration View */}
            <div className="relative">
              <Coins className="h-28 w-28 text-yellow-400 drop-shadow-2xl" />
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl"></div>
            </div>
            
            <div className="text-center space-y-3">
              <div className="text-5xl">🪙</div>
              
              <h2 className="text-4xl font-black text-yellow-400">
                Amazing!
              </h2>
              
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border-2 border-yellow-400/50 shadow-xl">
                <p className="text-sm text-yellow-200 font-semibold mb-2">You earned</p>
                <p className="text-5xl font-black text-yellow-300 drop-shadow-lg">
                  +{rewardAmount.toLocaleString()}
                </p>
                <p className="text-2xl text-yellow-100 mt-2 font-bold">Coins!</p>
              </div>
              
              <p className="text-lg text-slate-300 italic">
                Keep your streak going! 🎯
              </p>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl text-white">
                <Gift className="h-6 w-6 text-yellow-500" />
                Daily Reward
              </DialogTitle>
              <DialogDescription className="text-slate-300">
                Claim your daily reward and build your streak!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {isLoading ? (
                <div className="text-center text-slate-400">Loading...</div>
              ) : rewardStatus?.canClaim ? (
                <>
                  {/* Static Premium Chest Display */}
                  <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-lg p-6 text-center space-y-4 relative">
                    <div className="relative inline-block">
                      <Gift className="h-20 w-20 text-yellow-500 mx-auto drop-shadow-lg" />
                      <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-lg"></div>
                    </div>
                    
                    <div>
                      <p className="text-4xl font-bold text-yellow-500">
                        1,000,000
                      </p>
                      <p className="text-sm text-slate-300 mt-1">Coins</p>
                    </div>
                  </div>

                  {rewardStatus.reward && rewardStatus.reward.currentStreak > 0 && (
                    <div className="flex items-center justify-center gap-2 text-blue-500">
                      <Target className="h-5 w-5" />
                      <span className="font-semibold" data-testid="text-current-streak">
                        {rewardStatus.reward.currentStreak} Day Streak
                      </span>
                    </div>
                  )}

                  {rewardStatus.reward && rewardStatus.reward.bestStreak > 0 && (
                    <div className="text-center text-sm text-slate-400">
                      Best Streak: {rewardStatus.reward.bestStreak} days
                    </div>
                  )}

                  <Button
                    onClick={handleClaim}
                    disabled={claimMutation.isPending}
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold text-lg py-6 transition-all active:scale-95"
                    data-testid="button-claim-reward"
                  >
                    {claimMutation.isPending ? "Claiming..." : "Claim Reward"}
                  </Button>
                </>
              ) : (
                <div className="text-center space-y-4 py-6">
                  <div className="text-slate-400">
                    <p className="text-lg">You've already claimed your daily reward!</p>
                    <p className="text-sm mt-2">
                      Come back in {formatNextClaimTime(rewardStatus?.nextClaimDate)}
                    </p>
                  </div>
                  
                  {rewardStatus?.reward && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-blue-500">
                        <Target className="h-5 w-5" />
                        <span className="font-semibold">
                          {rewardStatus.reward.currentStreak} Day Streak
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Total Claimed: {rewardStatus.reward.totalClaimed} rewards
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => onOpenChange(false)}
                    variant="outline"
                    className="w-full mt-4"
                    data-testid="button-close-modal"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}