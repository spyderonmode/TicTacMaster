import { useState, useEffect, useRef } from "react";
import { PlayerProfileModal } from "./PlayerProfileModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy, Medal, Award, Crown, Loader2, Clock, Coins, Users, Rocket, Zap, ChevronDown, List, X, Star, Flame, Sparkles } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/utils";
import { CachedProfileImage } from "./CachedProfileImage";

interface WeeklyLeaderboardUser {
  id: string;
  userId: string;
  weeklyWins: number;
  coinsEarned: number;
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
  <div className="p-2 bg-white/5 rounded-xl animate-pulse flex items-center gap-2 border border-white/10">
    <div className="w-7 h-7 rounded-lg bg-white/10"></div>
    <div className="w-8 h-8 rounded-xl bg-white/10"></div>
    <div className="flex-1 space-y-1">
      <div className="h-2 bg-white/10 rounded-full w-3/4"></div>
      <div className="h-1 bg-white/10 rounded-full w-1/2"></div>
    </div>
    <div className="w-12 h-4 bg-white/10 rounded-xl"></div>
  </div>
);

const useAnimatedNumber = (value: number) => {
  const [animatedValue, setAnimatedValue] = useState(value);
  const isFirstRender = useRef(true);
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setAnimatedValue(value);
      return;
    }
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    const startValue = animatedValue;
    const endValue = value;
    const duration = 1000;
    let start: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const percentage = Math.min(progress / duration, 1);
      const currentValue = startValue + (endValue - startValue) * percentage;
      setAnimatedValue(Math.floor(currentValue));
      if (percentage < 1) animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value]);
  
  return animatedValue;
};

const Sparkle = ({ color }: { color: string }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ 
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      rotate: [0, 90, 180]
    }}
    transition={{ 
      duration: 2 + Math.random() * 2,
      repeat: Infinity,
      delay: Math.random() * 5
    }}
    className={`absolute w-1 h-1 rounded-full bg-${color}`}
    style={{ 
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      boxShadow: `0 0 10px 2px var(--tw-shadow-color)`
    }}
  />
);

const TopPlayerCard = ({ entry, position, onClick }: { entry: WeeklyLeaderboardUser, position: number, onClick: () => void }) => {
  const user = entry.user;
  const animatedCoins = useAnimatedNumber(entry.coinsEarned);
  
  const getRankConfig = (pos: number) => {
    if (pos === 1) return {
      borderColor: "border-red-500",
      glowColor: "",
      gradient: "from-red-600/30 via-red-500/10 to-transparent",
      icon: <Crown className="w-8 h-8 text-red-500" />,
      scale: 1.0,
      yOffset: -6,
      badge: "CHAMPION",
      accent: "red-500",
      bgClass: "bg-red-500/5"
    };
    if (pos === 2) return {
      borderColor: "border-cyan-400",
      glowColor: "",
      gradient: "from-cyan-500/20 via-cyan-400/5 to-transparent",
      icon: <Medal className="w-6 h-6 text-cyan-300" />,
      scale: 0.88,
      yOffset: 0,
      badge: "LEGEND",
      accent: "cyan-400",
      bgClass: "bg-cyan-400/5"
    };
    return {
      borderColor: "border-green-500",
      glowColor: "",
      gradient: "from-green-600/20 via-green-500/5 to-transparent",
      icon: <Award className="w-6 h-6 text-green-400" />,
      scale: 0.88,
      yOffset: 0,
      badge: "MASTER",
      accent: "green-500",
      bgClass: "bg-green-500/5"
    };
  };

  const config = getRankConfig(position);

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col items-center p-2 sm:p-3 rounded-[1.5rem] cursor-pointer transition-all duration-300 border-[2.5px] ${config.borderColor} group overflow-hidden w-full ${config.bgClass}`}
      style={{
        backdropFilter: 'blur(16px)',
        transform: `scale(${config.scale}) translateY(${config.yOffset}px)`,
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${config.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-700`} />
      
      {/* Animated Shine Effect */}
      <div className="absolute top-0 bottom-0 w-1/2 bg-white/10 -skew-x-12 z-0 animate-sweep" />

      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
        <div className={position === 1 ? "animate-bounce-slow" : ""}>
          {config.icon}
        </div>
      </div>

      <div className="relative mb-2 z-10 mt-1.5">
        <div className={`absolute inset-0 rounded-full blur-xl bg-${config.accent} opacity-30 group-hover:opacity-50 transition-opacity duration-700`} />
        <div className={`relative w-14 h-14 sm:w-20 sm:h-20 rounded-full border-[3px] ${config.borderColor} overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3`}>
          <CachedProfileImage
            src={entry.user.profileImageUrl || `https://ui-avatars.com/api/?name=${entry.user.displayName}&background=random&color=fff`}
            alt={user.displayName}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="text-center z-10 w-full px-1">
        <div className={`text-[10px] font-black text-${config.accent} tracking-[0.2em] uppercase mb-1`}>
          RANK 0{position}
        </div>
        <div className="flex items-center justify-center gap-1 mb-2 transition-all duration-500 transform group-hover:scale-110">
          <Coins className="w-3 h-3 text-yellow-400 fill-current" />
          <span className="font-black text-[13px] sm:text-[15px] tabular-nums text-yellow-400 tracking-widest leading-none">
            {formatNumber(animatedCoins)}
          </span>
        </div>
        <h3 className={`text-${config.accent} text-[12px] sm:text-[14px] font-black truncate tracking-tight uppercase leading-tight mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400`}>
          {user.displayName}
        </h3>
        <div className="text-[7px] font-black text-white/60 tracking-[0.25em] uppercase">
          {config.badge}
        </div>
      </div>
      
      {/* Decorative dots */}
      <div className="absolute top-2 right-2 w-1 h-1 rounded-full bg-white/20" />
      <div className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-white/20" />
    </div>
  );
};

const RewardsList = ({ rewardData, timeUntilEnd }: { rewardData: any[], timeUntilEnd: TimeLeft | undefined }) => {
  const top3Rewards = rewardData.filter(r => r.position <= 3);
  const masterReward = rewardData.find(r => r.position === 4);
  const eliteReward = rewardData.find(r => r.position === 11);
  
  return (
    <div className="py-2.5 space-y-4 px-1">
      <div className="relative text-center">
        <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">
          <span className="text-yellow-400">ULTRA</span> REWARDS
        </h3>
        <p className="text-white/60 text-[8px] font-black tracking-[0.2em] uppercase mt-0.5">Seasonal Exclusive</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {top3Rewards.map((reward, idx) => (
          <motion.div
            key={reward.position}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl group overflow-hidden"
          >
            <div className="flex items-center justify-between w-full relative z-10 px-0.5">
              <span className="text-white font-black text-[13px] tracking-tight uppercase">Rank {reward.position}</span>
              <div className="flex items-center gap-1.5 text-[13px] font-black text-white">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="tabular-nums">{formatNumber(reward.coins)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-6">
        {masterReward && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[15px] font-black text-purple-500 uppercase tracking-[0.2em]">Master Tier (4-10)</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-center gap-2.5">
                  <span className="text-white/80 font-black text-[14px] uppercase italic group-hover:text-purple-400 transition-colors tracking-tight">REWARD</span>
                </div>
                <div className="flex items-center gap-2 font-black text-purple-400 text-lg">
                  <Coins className="w-6 h-6" />
                  <span className="tabular-nums tracking-tighter">{formatNumber(masterReward.coins)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {eliteReward && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <div className="h-[1px] flex-1 bg-white/10" />
              <span className="text-[15px] font-black text-blue-500 uppercase tracking-[0.2em]">Elite Tier (11-50)</span>
              <div className="h-[1px] flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-1 gap-1">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 group">
                <div className="flex items-center gap-2.5">
                  <span className="text-white/70 font-black text-[14px] uppercase italic group-hover:text-blue-400 transition-colors tracking-tight">REWARD</span>
                </div>
                <div className="flex items-center gap-2 font-black text-blue-400 text-lg">
                  <Coins className="w-6 h-6" />
                  <span className="tabular-nums tracking-tighter">{formatNumber(eliteReward.coins)}</span>
                </div>
              </div>
            </div>
          </div>
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
  const isArabic = (language as string) === 'ar';

  const { data: weeklyLeaderboard, isLoading, error, refetch } = useQuery<WeeklyLeaderboardUser[]>({
    queryKey: ['/api/leaderboard/weekly', language],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/weekly?limit=50', { credentials: 'include' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },
    enabled: modalOpen,
    retry: 3,
    staleTime: 120000,
  });

  const { data: serverTimeUntilEnd } = useQuery<TimeLeft>({
    queryKey: ['/api/leaderboard/time-left'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/time-left');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },
    enabled: modalOpen,
    staleTime: 60000,
  });

  const [timeUntilEnd, setTimeUntilEnd] = useState<TimeLeft | undefined>(serverTimeUntilEnd);
  
  useEffect(() => {
    if (serverTimeUntilEnd) setTimeUntilEnd(serverTimeUntilEnd);
  }, [serverTimeUntilEnd]);

  useEffect(() => {
    if (!modalOpen || !timeUntilEnd) return;
    const interval = setInterval(() => {
      setTimeUntilEnd(prev => {
        if (!prev) return prev;
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [modalOpen, timeUntilEnd]);

  const top3 = weeklyLeaderboard?.slice(0, 3) || [];
  const remainingPlayers = weeklyLeaderboard?.slice(3) || [];
  const rewardData = [
    { position: 1, coins: 1000000000 },
    { position: 2, coins: 700000000 },
    { position: 3, coins: 500000000 },
    { position: 4, coins: 300000000 },
    { position: 11, coins: 100000000 }
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
    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-gray-400 hover:text-white px-3 py-1.5 h-9 rounded-xl bg-white/5 border border-white/5 transition-all group" data-testid="button-leaderboard">
      <Trophy className="w-3.5 h-3.5 text-yellow-500 group-hover:scale-110" />
      <span className="font-black text-xs tracking-tight">{(t as any)('Leaderboard') || 'Leaderboard'}</span>
    </Button>
  );

  return (
    <>
      <style>{`
        .scrollbar-custom::-webkit-scrollbar { width: 5px; }
        .scrollbar-custom::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-custom::-webkit-scrollbar-thumb { 
          background: rgba(255,255,255,0.08); 
          border-radius: 10px; 
        }
        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-sweep { animation: sweep 3s linear infinite; }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
      <Dialog open={modalOpen} onOpenChange={handleClose}>
        <DialogTrigger asChild>
          <div onClick={(e) => {
            e.stopPropagation();
            if (open !== undefined) onClose?.();
            else setIsOpen(true);
          }} data-testid="trigger-leaderboard">
            {trigger || defaultTrigger}
          </div>
        </DialogTrigger>
        <DialogContent
          className={`max-w-[96vw] sm:max-w-2xl max-h-[95vh] w-full mx-auto flex flex-col overflow-hidden bg-[#050505] text-gray-100 border border-white/10 p-0 rounded-3xl ${isArabic ? 'font-arabic' : ''} outline-none shadow-none`}
          style={isArabic ? { fontFamily: "'Noto Sans Arabic', 'Cairo', 'Tajawal', system-ui, sans-serif", direction: 'rtl' } : {}}
          data-testid="dialog-leaderboard"
        >
          <div className="px-5 sm:px-8 relative flex flex-col pt-3 pb-0 bg-[#050505]">
            <div className="flex justify-between items-center mb-1 pr-8">
              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30 relative">
                  <Trophy className="w-3.5 h-3.5 text-yellow-400 relative z-10" />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-yellow-400/20 blur-md rounded-full"
                  />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white italic tracking-tighter uppercase leading-none">
                    WEEKLY <span className="text-yellow-400">LEAGUE</span>
                  </h2>
                </div>
              </motion.div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                  <Clock className="w-2.5 h-2.5 text-blue-400" />
                  <span className="font-mono text-white text-[9px] font-black tracking-tight">
                    {timeUntilEnd?.days}D {timeUntilEnd?.hours}H {timeUntilEnd?.minutes}M
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRewards(true)}
                  className="p-1 h-6 w-6 rounded-lg border border-yellow-400/20 text-yellow-400 group relative overflow-hidden"
                >
                  <Star className="w-3 h-3 fill-yellow-400 relative z-10 transition-transform group-hover:scale-125 group-hover:rotate-12" />
                  <div className="absolute inset-0 bg-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-1 py-2 px-4 sm:px-8" data-testid="loading-state">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 flex-1 text-red-400" data-testid="error-state">
              <X className="w-8 h-8 mb-3 opacity-20" />
              <span className="font-black text-xs uppercase tracking-widest italic">System Error</span>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto scrollbar-custom pb-3" style={{ WebkitOverflowScrolling: 'touch' }} data-testid="leaderboard-container">
                {top3.length > 0 && (
                  <div className="sticky top-0 z-30 flex justify-center items-end gap-1.5 sm:gap-3 pt-5 pb-6 px-4 sm:px-8 bg-[#050505] border-b border-white/5 relative shadow-2xl">
                    <div className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-b from-yellow-500/5 to-transparent blur-[40px] -z-10" />
                    
                    {/* Background Sparkles for Top 3 */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <Sparkle color="yellow-400" />
                      <Sparkle color="cyan-400" />
                      <Sparkle color="purple-400" />
                    </div>

                    <div className="w-[32%] max-w-[105px] relative z-10">
                      {top3[1] && <TopPlayerCard entry={top3[1]} position={2} onClick={() => handlePlayerClick(top3[1].user.id)} />}
                    </div>
                    <div className="w-[36%] max-w-[125px] relative z-20">
                      {top3[0] && <TopPlayerCard entry={top3[0]} position={1} onClick={() => handlePlayerClick(top3[0].user.id)} />}
                    </div>
                    <div className="w-[32%] max-w-[105px] relative z-10">
                      {top3[2] && <TopPlayerCard entry={top3[2]} position={3} onClick={() => handlePlayerClick(top3[2].user.id)} />}
                    </div>
                  </div>
                )}
                
                <div className="px-4 sm:px-8 space-y-1">
                  <div className="flex items-center justify-between px-3 py-1 text-white/20 text-[7px] font-black tracking-[0.2em] uppercase border-b border-white/5 mb-1">
                    <span>Rank & Player</span>
                    <span>Earnings</span>
                  </div>
                  
                  {remainingPlayers.map((entry, index) => {
                    const position = index + 4;
                    const user = entry.user;
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-2 p-2 rounded-xl border border-white/10 bg-white/[0.03] cursor-pointer group transition-all duration-300 relative overflow-hidden"
                        onClick={() => handlePlayerClick(user.id)}
                        data-testid={`player-card-${user.id}`}
                      >
                        <div className="w-6 flex-shrink-0 text-center font-black text-white text-[10px] group-hover:text-yellow-400">
                          #{position}
                        </div>
                        <div className="relative flex-shrink-0">
                          <CachedProfileImage
                            src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${user.displayName}&background=random&color=fff`}
                            alt={user.displayName}
                            className="w-[32px] h-[32px] rounded-lg object-cover border border-white/20"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col">
                            <span className="font-black text-white truncate text-[11px] tracking-tight uppercase group-hover:text-yellow-400">
                              {user.displayName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-yellow-400 font-black text-[11px] transition-all">
                          <Coins className="w-2.5 h-2.5 text-yellow-400" />
                          <span className="tabular-nums">{formatNumber(entry.coinsEarned)}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="py-2 px-5 border-t border-white/5 flex justify-between items-center bg-white/5">
            <span className="text-white/30 text-[8px] font-black uppercase tracking-widest">
              {weeklyLeaderboard?.length || 0} Contestants
            </span>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className={`text-white/70 hover:bg-white/10 px-3 py-0.5 h-7 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5 ${isArabic ? 'font-arabic' : ''}`}
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
          className={`max-w-[92vw] sm:max-w-lg bg-[#0a0a0a] border border-white/10 text-gray-100 p-0 rounded-3xl overflow-hidden outline-none ${isArabic ? 'font-arabic' : ''}`}
        >
          <div className="px-5 pt-5 pb-3 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-base font-black uppercase italic tracking-tighter">Season Prizes</h2>
          </div>
          <div className="overflow-y-auto max-h-[60vh] px-3 py-1.5 scrollbar-custom">
            <RewardsList rewardData={rewardData} timeUntilEnd={timeUntilEnd} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
