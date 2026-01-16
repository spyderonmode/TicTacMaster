import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Globe, Trophy, Coins, Zap, Loader2, Award, Medal, Crown } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber } from "@/lib/utils";
import { CachedProfileImage } from "./CachedProfileImage";
import globeIcon from "@/lib/globe.png";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { PlayerProfileModal } from "./PlayerProfileModal";

interface RankingEntry {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string;
  wins: number;
  coins: number;
  totalEarnings: number;
  level: number;
  rank: number;
}

export function GlobalStatsModal() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("earnings");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);

  const [loadedTabs, setLoadedTabs] = useState<Record<string, boolean>>({});

  const { data: rankings, isFetching, isLoading } = useQuery<RankingEntry[]>({
    queryKey: ["/api/leaderboard/global", activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/leaderboard/global?sortBy=${activeTab}&limit=10`);
      if (!response.ok) throw new Error("Failed to fetch rankings");
      const data = await response.json();
      setLoadedTabs(prev => ({ ...prev, [activeTab]: true }));
      return data;
    },
    enabled: isOpen,
    staleTime: 0, 
    placeholderData: (previousData) => previousData, 
  });

  const isDataLoading = (isLoading || isFetching) && !loadedTabs[activeTab];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (rank === 3) return <Award className="w-4 h-4 text-amber-600" />;
    return <span className="text-gray-500 font-bold text-xs w-4 text-center">{rank}</span>;
  };

  const handlePlayerClick = (userId: string) => {
    setSelectedPlayerId(userId);
    setShowPlayerProfile(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-auto hover:bg-transparent"
          onClick={() => setIsOpen(true)}
        >
          <img src={globeIcon} alt="Global Stats" className="w-12 h-12 drop-shadow-md" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95%] max-h-[90vh] bg-slate-950 border-slate-800 text-white p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 bg-slate-900/50 border-b border-slate-800 flex-shrink-0">
          <DialogTitle className="text-2xl font-black flex items-center gap-3 italic">
            <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            GLOBAL RANKINGS
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="earnings" className="w-full flex-1 flex flex-col min-h-0" onValueChange={setActiveTab}>
          <div className="px-6 py-4 bg-slate-900/30 flex-shrink-0">
            <TabsList className="grid grid-cols-3 bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
              <TabsTrigger value="earnings" className="rounded-lg data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all">
                <Coins className="w-4 h-4 mr-2" /> EARNINGS
              </TabsTrigger>
              <TabsTrigger value="wins" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all">
                <Trophy className="w-4 h-4 mr-2" /> WINS
              </TabsTrigger>
              <TabsTrigger value="level" className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all">
                <Zap className="w-4 h-4 mr-2" /> LEVEL
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar min-h-0">
            {isDataLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {rankings?.map((player, index) => (
                    <motion.div
                      key={`${activeTab}-${player.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50 border border-slate-800/50 hover:border-slate-700 transition-colors group cursor-pointer"
                      onClick={() => handlePlayerClick(player.id)}
                    >
                      <div className="flex-shrink-0 w-6 flex justify-center">
                        {getRankIcon(index + 1)}
                      </div>
                      
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-700 p-0.5 bg-slate-800">
                          <CachedProfileImage
                            src={player.profileImageUrl}
                            alt={player.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">
                          {player.displayName}
                        </div>
                      </div>

                      <div className="text-right">
                        {activeTab === 'earnings' && (
                          <div className="flex items-center justify-end gap-1 text-green-400 text-xs font-black">
                            <Coins className="w-3 h-3" />
                            {formatNumber(player.totalEarnings)}
                          </div>
                        )}
                        {activeTab === 'wins' && (
                          <div className="flex items-center justify-end gap-1 text-blue-400 text-xs font-black">
                            <Trophy className="w-3 h-3" />
                            {formatNumber(player.wins)}
                          </div>
                        )}
                        {activeTab === 'level' && (
                          <div className="flex items-center justify-end gap-1 text-purple-400 text-xs font-black">
                            <Zap className="w-3 h-3" />
                            {player.level}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </Tabs>

        <PlayerProfileModal
          open={showPlayerProfile}
          onClose={() => setShowPlayerProfile(false)}
          playerId={selectedPlayerId}
          currentUserId={undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
