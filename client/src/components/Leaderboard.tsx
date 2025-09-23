import { useState, useEffect } from "react";
import { PlayerProfileModal } from "./PlayerProfileModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy, Medal, Award, Crown, Loader2, Clock, Coins, Users, Rocket, Zap, ChevronDown, List, X } from "lucide-react";
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

const SkeletonCard = () => (
  <div className="p-3 bg-gray-800 rounded-lg animate-pulse flex items-center gap-3 border border-gray-700">
    <div className="w-8 h-8 rounded-full bg-gray-700"></div>
    <div className="w-12 h-12 rounded-full bg-gray-700"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
    </div>
    <div className="w-16 h-6 bg-gray-700 rounded-full"></div>
  </div>
);

const useAnimatedNumber = (value: number) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const startValue = animatedValue;
    const endValue = value;
    const duration = 800;
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);
      const currentValue = startValue + (endValue - startValue) * percentage;
      setAnimatedValue(Math.floor(currentValue));

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return animatedValue;
};

const TopPlayerCard = ({ entry, position, onClick }: { entry: WeeklyLeaderboardUser, position: number, onClick: () => void }) => {
  const user = entry.user;
  const animatedWins = useAnimatedNumber(entry.weeklyWins);

  const getTopPlayerStyle = (pos: number) => {
    if (pos === 1) return "border-b-2 border-yellow-500/80 shadow-lg shadow-yellow-500/20";
    if (pos === 2) return "border-b-2 border-gray-400/80 shadow-lg shadow-gray-400/20";
    if (pos === 3) return "border-b-2 border-amber-500/80 shadow-lg shadow-amber-500/20";
    return "";
  };

  const getRankIndicator = (pos: number) => {
    if (pos === 1) return <Crown className="w-8 h-8 text-yellow-500 absolute -top-4 left-1/2 -translate-x-1/2 z-10" />;
    if (pos === 2) return <Medal className="w-7 h-7 text-gray-400 absolute -top-3 left-1/2 -translate-x-1/2 z-10" />;
    if (pos === 3) return <Award className="w-7 h-7 text-amber-500 absolute -top-3 left-1/2 -translate-x-1/2 z-10" />;
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.2 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className={`flex flex-col items-center text-center p-2 rounded-xl cursor-pointer transition-all duration-300 relative ${getTopPlayerStyle(position)}`}
      onClick={onClick}
    >
      {getRankIndicator(position)}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-transparent bg-gradient-to-br from-gray-700 to-gray-800 p-1 overflow-hidden" style={{ borderColor: position === 1 ? 'gold' : position === 2 ? 'silver' : 'bronze' }}>
        <img
          src={entry.user.profileImageUrl || `https://ui-avatars.com/api/?name=${entry.user.displayName}&background=random&color=fff`}
          alt={entry.user.displayName}
          className="w-full h-full object-cover rounded-full"
        />
      </div>
      <h3 className="text-white text-base sm:text-lg font-bold truncate max-w-[80px] sm:max-w-[100px] mt-2">{user.displayName}</h3>
      <div className="flex items-center gap-1 text-green-400 mt-1">
        <Zap className="w-4 h-4" />
        <span className="font-bold">{formatNumber(animatedWins)}</span>
      </div>
    </motion.div>
  );
};

const RewardsList = ({ rewardData, timeUntilEnd }: { rewardData: any[], timeUntilEnd: TimeLeft | undefined }) => {
  const top3Rewards = rewardData.slice(0, 3);
  const remainingRewards = rewardData.slice(3);

  const combinedReward = remainingRewards.length > 0 ? {
    position: "4-10",
    coins: remainingRewards[0].coins,
    displayRange: true
  } : null;

  return (
    <div className="py-4">
      <h3 className="text-lg font-bold text-white mb-4 text-center">Top 10 Rewards</h3>
      {/* Time Left added here, below the title */}
      <div className="flex items-center justify-center text-gray-500 text-sm mt-2 gap-2">
        <Clock className="w-4 h-4 text-blue-500" />
        <span>Time left:</span>
        <div className="font-mono text-white">
          {timeUntilEnd?.days}d {timeUntilEnd?.hours}h {timeUntilEnd?.minutes}m
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {top3Rewards.map(reward => (
          <motion.div
            key={reward.position}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reward.position * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              {reward.position === 1 ? <Crown className="w-6 h-6 text-yellow-500" /> : reward.position === 2 ? <Medal className="w-6 h-6 text-gray-400" /> : reward.position === 3 ? <Award className="w-6 h-6 text-amber-500" /> : <div className="w-6 h-6 text-center font-bold text-gray-400">#{reward.position}</div>}
              <span className="text-gray-300 font-medium">Rank #{reward.position}</span>
            </div>
            <div className="flex items-center text-yellow-400 font-bold">
              <Coins className="w-4 h-4 mr-1" />
              <span>{formatNumber(reward.coins)}</span>
            </div>
          </motion.div>
        ))}

        {combinedReward && (
          <motion.div
            key={combinedReward.position}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3 * 0.05 }}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-300 font-medium">Rank #{combinedReward.position}</span>
            </div>
            <div className="flex items-center text-yellow-400 font-bold">
              <Coins className="w-4 h-4 mr-1" />
              <span>{formatNumber(combinedReward.coins)}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export function Leaderboard({ trigger, open, onClose }: LeaderboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modalOpen = open !== undefined ? open : isOpen;
  const handleClose = onClose || (() => setIsOpen(false));
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const isArabic = language === 'ar';

  const { data: weeklyLeaderboard, isLoading, error, refetch } = useQuery<WeeklyLeaderboardUser[]>({
    queryKey: ['/api/leaderboard/weekly', language],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/weekly?limit=50', { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },
    enabled: modalOpen,
    retry: 3,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const { data: timeUntilEnd } = useQuery<TimeLeft>({
    queryKey: ['/api/leaderboard/time-left'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/time-left');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },
    enabled: modalOpen,
    refetchInterval: 1000,
    staleTime: 0,
  });

  const top3 = weeklyLeaderboard?.slice(0, 3) || [];
  const remainingPlayers = weeklyLeaderboard?.slice(3) || [];

  const rewardData = [
    { position: 1, coins: 10000000 },
    { position: 2, coins: 5000000 },
    { position: 3, coins: 3000000 },
    { position: 4, coins: 1000000 },
    { position: 5, coins: 1000000 },
    { position: 6, coins: 1000000 },
    { position: 7, coins: 1000000 },
    { position: 8, coins: 1000000 },
    { position: 9, coins: 1000000 },
    { position: 10, coins: 1000000 },
  ];

  useEffect(() => {
    if (modalOpen) {
      queryClient.invalidateQueries({ queryKey: ['/api/leaderboard/weekly'] });
      refetch();
    }
  }, [modalOpen, language, refetch, queryClient]);

  const handlePlayerClick = (userId: string) => {
    setSelectedPlayerId(userId);
    setShowPlayerProfile(true);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-400 hover:text-white" data-testid="button-leaderboard">
      <Trophy className="w-4 h-4 text-yellow-500" />
      {t('Leaderboard') || 'Leaderboard'}
    </Button>
  );

  return (
    <>
      <style jsx global>{`
        /* Styles for WebKit-based browsers (Chrome, Safari) */
        .scrollbar-custom::-webkit-scrollbar {
          width: 8px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 10px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
          border: 2px solid #111827;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }

        /* Styles for Firefox */
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: #374151 #1f2937;
        }

        /* Confetti Burst Animation */
        @keyframes confetti-burst {
          0% {
            transform: scale(0.5) translateY(0) rotate(0);
            opacity: 1;
          }
          50% {
            transform: scale(1) translateY(-50px) rotate(180deg);
          }
          100% {
            transform: scale(1.5) translateY(100px) rotate(360deg);
            opacity: 0;
          }
        }
        
        .confetti-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 1;
        }

        .confetti {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: confetti-burst 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          opacity: 0;
        }
      `}</style>
      <Dialog open={modalOpen} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <div onClick={(e) => {
            e.stopPropagation();
            if (open !== undefined) {
              onClose?.();
            } else {
              setIsOpen(true);
            }
          }} data-testid="trigger-leaderboard">
            {trigger || defaultTrigger}
          </div>
        </DialogTrigger>
        <DialogContent
          className={`max-w-[98vw] sm:max-w-3xl lg:max-w-4xl max-h-[90vh] w-full mx-auto flex flex-col overflow-hidden bg-gray-950 text-gray-100 border-2 border-gray-800 shadow-2xl shadow-gray-950/50 ${isArabic ? 'font-arabic' : ''}`}
          style={isArabic ? { fontFamily: "'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif", direction: 'rtl' } : {}}
          data-testid="dialog-leaderboard"
        >
          <DialogHeader className="pb-6 relative overflow-hidden">
            <div className="confetti-container">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    backgroundColor: `hsl(${Math.random() * 360}, 100%, 75%)`
                  }}
                ></div>
              ))}
            </div>
            <DialogTitle className={`flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-white relative z-20`}>
              <Trophy className="w-6 h-6 text-yellow-500" />
              {t('Weekly Leaderboard') || 'Weekly Leaderboard'}
            </DialogTitle>
            {/* यह वह सेक्शन है जो टाइम लेफ्ट दिखाता है, जिसे आपको Weekly Leaderboard शीर्षक के ठीक नीचे रखना है। */}
            <div className="flex items-center justify-center text-gray-500 text-sm mt-2 gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{t('Time left') || 'Time left'}:</span>
              <div className="font-mono text-white">
                {timeUntilEnd?.days}d {timeUntilEnd?.hours}h {timeUntilEnd?.minutes}m
              </div>
            </div>
            {/* यह वह सेक्शन है जो टाइम लेफ्ट दिखाता है, जिसे आपको Weekly Leaderboard शीर्षक के ठीक नीचे रखना है। */}
          </DialogHeader>

          <div className="flex justify-center my-2">
            <Button
              variant="ghost"
              onClick={() => setShowRewards(true)}
              className="group flex items-center gap-2 text-yellow-400 hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-sm font-medium">{t('Time & Reward') || 'Time & Reward'}: {formatNumber(rewardData[0].coins)} <Coins className="w-4 h-4 inline-block" /></span>
              <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3 py-4" data-testid="loading-state">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 flex-1 text-red-400" data-testid="error-state">
              <span>{t('errorLoadingWeeklyLeaderboard') || 'Error loading weekly leaderboard. Please try again.'}</span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              {top3.length > 0 && (
                <div className="grid grid-cols-3 items-end gap-2 px-2 pb-6 pt-4 border-b border-gray-800">
                  <div className="col-span-1 flex justify-center">
                    {top3[1] && <TopPlayerCard entry={top3[1]} position={2} onClick={() => handlePlayerClick(top3[1].user.id)} />}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {top3[0] && <TopPlayerCard entry={top3[0]} position={1} onClick={() => handlePlayerClick(top3[0].user.id)} />}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {top3[2] && <TopPlayerCard entry={top3[2]} position={3} onClick={() => handlePlayerClick(top3[2].user.id)} />}
                  </div>
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto mt-6 px-2 space-y-3 scrollbar-custom" style={{ WebkitOverflowScrolling: 'touch' }} data-testid="leaderboard-container">
                {remainingPlayers.length > 0 ? (
                  remainingPlayers.map((entry, index) => {
                    const position = index + 4;
                    const user = entry.user;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(31, 41, 55, 0.4)" }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 bg-gray-900/50 cursor-pointer"
                        onClick={() => handlePlayerClick(user.id)}
                        data-testid={`player-card-${user.id}`}
                      >
                        <span className="w-8 flex-shrink-0 text-center font-bold text-gray-500">#{position}</span>
                        <img
                          src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.displayName}&background=random&color=fff`}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-white truncate">{user.displayName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-400 font-semibold text-base">
                          <Zap className="w-4 h-4" />
                          <span>{formatNumber(entry.weeklyWins)}</span>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500" data-testid="no-data-state">
                    <Rocket className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-700" />
                    <p className="text-sm font-medium">{t('noWeeklyDataYet') || 'No weekly data yet. Start playing to compete!'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="py-4 px-4 border-t border-gray-800 flex justify-between items-center bg-gray-900/50">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Users className="w-4 h-4" />
              <span>{weeklyLeaderboard?.length || 0} {t('players on leaderboard') || 'players on leaderboard'}</span>
            </div>
            <Button
              onClick={handleClose}
              variant="ghost"
              className={`text-white hover:bg-gray-800 ${isArabic ? 'font-arabic' : ''}`}
              data-testid="button-close"
            >
              {t('close') || 'Close'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PlayerProfileModal
        playerId={selectedPlayerId}
        open={showPlayerProfile}
        onClose={() => {
          setShowPlayerProfile(false);
          setSelectedPlayerId(null);
        }}
        currentUserId={undefined}
      />

      <Dialog open={showRewards} onOpenChange={setShowRewards}>
        <DialogContent
          className={`max-w-[95vw] sm:max-w-md bg-gray-950 border border-gray-800 text-gray-100 ${isArabic ? 'font-arabic' : ''}`}
          style={isArabic ? { fontFamily: "'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif", direction: 'rtl' } : {}}
        >
          <DialogHeader className="flex flex-row items-center justify-between pb-2">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              {t('Weekly Rewards') || 'Weekly Rewards'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowRewards(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </DialogHeader>
          <DialogDescription className="text-gray-400">
            {t('Check out the rewards for the top 10 winners this week.') || 'Check out the rewards for the top 10 winners this week.'}
          </DialogDescription>
          <RewardsList rewardData={rewardData} timeUntilEnd={timeUntilEnd} />
        </DialogContent>
      </Dialog>
    </>
  );
}