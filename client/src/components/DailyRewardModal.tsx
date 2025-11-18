import { useState, useEffect } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

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
  const [chestOpening, setChestOpening] = useState(false);
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

      setTimeout(() => {
        setShowCelebration(false);
        onOpenChange(false);
      }, 3500);
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
    setChestOpening(true);
    setTimeout(() => {
      claimMutation.mutate();
      setChestOpening(false);
    }, 1500);
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
        className="sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-yellow-500/30 overflow-hidden"
        data-testid="dialog-daily-reward"
      >
        {showCelebration ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 relative min-h-[400px]">
            {/* Cute sparkles and stars background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  className="absolute text-yellow-400"
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                  }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1, 1, 0],
                    rotate: [0, 360],
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>

            {/* Coin explosion effect */}
            <AnimatePresence>
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={`coin-${i}`}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    opacity: 0.5 
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 500,
                    y: (Math.random() - 0.5) * 500,
                    scale: [0, 1.8, 0],
                    opacity: [1, 1, 0],
                    rotate: Math.random() * 1080
                  }}
                  transition={{ 
                    duration: 4,
                    delay: i * 0.08,
                    ease: "easeOut"
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <Coins className="h-10 w-10 text-yellow-400 drop-shadow-lg" />
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Cute bouncing coin with hearts */}
            <motion.div 
              className="relative z-10 flex flex-col items-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ 
                scale: 1, 
                rotate: 0,
              }}
              transition={{ type: "spring", stiffness: 150, damping: 10 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -15, 0],
                }}
                transition={{ 
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Coins className="h-28 w-28 text-yellow-400 drop-shadow-2xl" />
              </motion.div>
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl animate-pulse scale-150"></div>
            </motion.div>
            
            {/* Cute celebration text with emoji */}
            <motion.div
              className="z-10 text-center space-y-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="text-5xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                }}
                transition={{ 
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🪙
              </motion.div>
              
              <motion.h2 
                className="text-4xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent"
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                }}
              >
                Amazing!
              </motion.h2>
              
              <motion.div
                className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400/50 shadow-2xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <p className="text-sm text-yellow-200 font-semibold mb-2">You earned</p>
                <p className="text-5xl font-black text-yellow-300 drop-shadow-lg">
                  +{rewardAmount.toLocaleString()}
                </p>
                <p className="text-2xl text-yellow-100 mt-2 font-bold">Coins!</p>
              </motion.div>
              
              <motion.p 
                className="text-lg text-slate-300 italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Keep your streak going! 🎯
              </motion.p>
            </motion.div>
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
                  {/* Premium Chest Display */}
                  <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-lg p-6 text-center space-y-4 relative overflow-hidden">
                    {/* Animated background particles */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(10)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1 h-1 bg-yellow-500 rounded-full"
                          animate={{
                            y: [0, -100],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: '100%',
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Chest Animation */}
                    <motion.div 
                      className="relative inline-block"
                      animate={chestOpening ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, -10, 10, -10, 0],
                      } : {}}
                      transition={{ duration: 1.5 }}
                    >
                      <motion.div
                        className="relative"
                        initial={false}
                        animate={chestOpening ? { rotateX: 180 } : { rotateX: 0 }}
                        transition={{ duration: 0.8 }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <Gift className="h-20 w-20 text-yellow-500 mx-auto" />
                      </motion.div>
                      <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-lg"></div>
                      
                      {/* Sparkle effects around chest */}
                      <AnimatePresence>
                        {chestOpening && [...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute"
                            initial={{ scale: 0, opacity: 1 }}
                            animate={{
                              scale: [0, 1, 0],
                              opacity: [1, 1, 0],
                              x: Math.cos((i / 8) * Math.PI * 2) * 50,
                              y: Math.sin((i / 8) * Math.PI * 2) * 50,
                            }}
                            transition={{ duration: 1 }}
                            style={{
                              left: '50%',
                              top: '50%',
                            }}
                          >
                            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                    
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
                    className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold text-lg py-6"
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
