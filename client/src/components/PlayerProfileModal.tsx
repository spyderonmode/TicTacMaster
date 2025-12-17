import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Castle, Swords, Clock, Calendar, Gem, Sparkles } from "lucide-react"; 
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/LanguageContext";
import { AvatarWithFrame } from "./AvatarWithFrame";
import vipImage from '@/lib/vip.png';

// --- (Interfaces remain the same) ---
interface PlayerProfile {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    coins: number;
    totalEarnings: number;
    level: number;
    winsToNextLevel: number;
    currentWinStreak: number;
    bestWinStreak: number;
    createdAt: string;
    selectedAchievementBorder?: string;
    achievements: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
        unlockedAt: string;
    }>;
}

interface HeadToHeadStats {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    recentGames: Array<{
        id: string;
        result: 'win' | 'loss' | 'draw';
        playedAt: string;
    }>;
}

interface PlayerProfileModalProps {
    playerId: string | null;
    open: boolean;
    onClose: () => void;
    currentUserId?: string;
}
// --- (Interfaces remain the same) ---

// 👑 NEW UTILITY FUNCTION TO FORMAT LARGE NUMBERS 👑
const formatLargeNumber = (num: number): string => {
    if (num < 10000) {
        return num.toString();
    }
    const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1);
    return formatted + 'k';
};

// 🎯 Utility function for earnings with million/billion formatting
const formatEarnings = (num: number): string => {
    if (num < 10000) {
        return num.toString();
    } else if (num < 1000000) {
        const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1);
        return formatted + 'k';
    } else if (num < 1000000000) {
        const formatted = (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1);
        return formatted + 'M';
    } else {
        const formatted = (num / 1000000000).toFixed(num % 1000000000 === 0 ? 0 : 1);
        return formatted + 'B';
    }
};
// --------------------------------------------------


export function PlayerProfileModal({ playerId, open, onClose, currentUserId }: PlayerProfileModalProps) {
    const { t } = useTranslation();


    const { data: profile, isLoading: profileLoading } = useQuery<PlayerProfile>({
        queryKey: ['/api/players', playerId],
        enabled: open && !!playerId,
    });

    const { data: headToHead, isLoading: h2hLoading } = useQuery<HeadToHeadStats>({
        queryKey: ['/api/head-to-head', currentUserId, playerId],
        enabled: open && !!playerId && !!currentUserId && playerId !== currentUserId,
    });

    const { data: avatarFrameData } = useQuery<{ activeFrameId: string | null }>({
        queryKey: ['/api/users', playerId, 'avatar-frame'],
        enabled: open && !!playerId,
    });


    const { data: vipPassData } = useQuery<{ hasActivePass: boolean }>({
        queryKey: [`/api/players/${playerId}/vip-status`],
        enabled: open && !!playerId,
    });
    const hasVipPass = vipPassData?.hasActivePass || false;
    const isOwnProfile = playerId === currentUserId;
    const winRate = profile ? Math.round((profile.wins / Math.max(profile.totalGames, 1)) * 100) : 0;

    const getAchievementLevel = (profile: PlayerProfile | undefined) => {
        if (!profile) return 'none';
        if (profile.level >= 100) return 'level100Master';
        if (profile.totalGames >= 500) return 'ultimateVeteran';
        if (profile.wins >= 200) return 'grandmaster';
        if (profile.wins >= 100) return 'champion';
        if (profile.wins >= 50) return 'legend';
        if (profile.totalGames >= 100) return 'veteranPlayer';
        return 'none';
    };

    const renderAchievementBorder = (profile: PlayerProfile | undefined) => {
        if (!profile) return <span className="font-serif text-lg font-bold truncate text-white">Noble Guest</span>; 

        const baseClasses = "font-serif text-base font-extrabold truncate";
        
        // Check if user has manually selected a border (only if it has a non-null value)
        const borderType = profile.selectedAchievementBorder 
            ? profile.selectedAchievementBorder 
            : getAchievementLevel(profile);

        switch (borderType) {
            case 'level_100_master':
            case 'level100Master':
                return (
                    <span className={`${baseClasses} text-white`}>
                        {profile.displayName}
                    </span>
                );
            case 'ultimate_veteran':
            case 'ultimateVeteran':
                return (
                    <span className={`${baseClasses} text-white`}>
                        {profile.displayName}
                    </span>
                );
            case 'grandmaster':
                return (
                    <span className={`${baseClasses} text-white`}>
                        {profile.displayName}
                    </span>
                );
            case 'champion':
                return (
                    <span className={`${baseClasses} text-white`}>
                        {profile.displayName}
                    </span>
                );
            case 'legend':
            case 'veteran_player':
            case 'veteranPlayer':
                return (
                    <span className={`${baseClasses} text-white`}>
                        {profile.displayName}
                    </span>
                );
            case null:
            case '':
                // User explicitly selected "no border"
                return (
                    <span className={`${baseClasses} text-white`}>
                        {profile.displayName}
                    </span>
                );
            default:
                return (
                    <span className={`${baseClasses} text-white`}>
                        {profile.displayName}
                    </span>
                );
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (!open || !playerId) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="player-profile-modal max-w-sm w-[95vw] mx-auto flex flex-col overflow-hidden relative 
                bg-gradient-to-br from-gray-950 via-indigo-900 to-black 
                border-2 border-yellow-700 p-0 rounded-2xl max-h-[85vh]">
                
                <DialogHeader className="sr-only">
                    <DialogTitle>{t('playerProfile') || 'Royal Profile'}</DialogTitle>
                    <DialogDescription>
                        {profile ? `View ${profile.displayName}'s noble lineage and battle records` : 'Loading noble records'}
                    </DialogDescription>
                </DialogHeader>

                {profileLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-white min-h-[150px]">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="rounded-full h-10 w-10 border-[3px] border-solid border-yellow-500 border-r-transparent" 
                        />
                        <span className="mt-4 text-base font-medium text-yellow-300">{t('loading') || 'Unfurling the Scroll...'}</span>
                    </div>
                ) : profile ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 overflow-y-auto space-y-2 p-3 relative z-10"
                    >
                        {/* Profile Header */}
                        <div className="relative bg-gradient-to-r from-indigo-900 via-gray-900 to-indigo-900 rounded-xl p-3 text-white overflow-hidden border border-yellow-800/50">
                            <div className="relative flex items-center gap-3">
                                <div className="flex-shrink-0 relative">
                                    <AvatarWithFrame
                                        src={profile.profileImageUrl}
                                        alt={`${profile.displayName}'s profile`}
                                        size="md"
                                        borderType={avatarFrameData?.activeFrameId || profile.selectedAchievementBorder || null}
                                        fallbackText={profile.displayName.charAt(0).toUpperCase()}
                                    />
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-yellow-500 rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0 flex justify-between items-start">
                                    <div>
                                        <h1 className="mb-0 leading-none">
                                            {renderAchievementBorder(profile)}
                                        </h1>
                                        <div className="flex items-center gap-1.5 text-[10px] text-yellow-300/80">
                                            <Calendar className="w-2.5 h-2.5" />
                                            <span>{t('joined') || 'Joined'} {formatDate(profile.createdAt)}</span>
                                        </div>
                                    </div>
                                    {hasVipPass && (
    <div className="relative flex-shrink-0">
        <img 
            src={vipImage} 
            alt="VIP" 
            className="relative object-contain"
            style={{ width: '80px', height: '60px' }}
        />
    </div>
)}
                                </div>
                            </div>
                        </div>

                        {/* Royal Stats Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* Royal Gold (Coins) */}
                            <div className="bg-gradient-to-br from-yellow-700 to-amber-900 rounded-xl p-2 text-white border border-yellow-600/80" 
                            >
                                <div className="flex flex-col">
                                    <div className="text-base font-extrabold">{profile?.coins ?? 0}</div>
                                    <div className="text-[10px] text-yellow-200">Coins</div>
                                </div>
                            </div>

                            {/* Noble Rank (Level) */}
                            <div className="bg-gradient-to-br from-indigo-800 to-purple-900 rounded-xl p-2 text-white border border-purple-600/80" 
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <div className="text-base font-extrabold">{profile?.level || 0}</div>
                                        <Crown className="w-3 h-3 text-yellow-400" />
                                    </div>
                                    <div className="text-[10px] text-purple-200">Level</div>
                                </div>
                            </div>

                            {/* Total Games */}
                            <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl p-2 text-white border border-gray-600/80" 
                            >
                                <div className="flex flex-col">
                                    <div className="text-base font-extrabold">{formatLargeNumber(profile?.totalGames ?? 0)}</div>
                                    <div className="text-[10px] text-gray-200">Total Games</div>
                                </div>
                            </div>

                            {/* Total Earnings */}
                            <div className="bg-gradient-to-br from-green-700 to-emerald-900 rounded-xl p-2 text-white border border-green-600/80" 
                            >
                                <div className="flex flex-col">
                                    <div className="text-base font-extrabold">{formatEarnings(profile?.totalEarnings ?? 0)}</div>
                                    <div className="text-[10px] text-green-200">Total Earnings</div>
                                </div>
                            </div>
                        </div>

                        {/* Progression Bar */}
                        <div className="bg-gray-900 rounded-xl p-2 border border-yellow-800" 
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold text-yellow-400 flex items-center gap-1">
                                    <Castle className="w-2.5 h-2.5"/>
                                    User Level Progress
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {profile?.winsToNextLevel ?? 0} victories to the next Level
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-red-600 via-yellow-500 to-yellow-300 h-1.5 rounded-full"
                                    style={{ width: `${profile?.winsToNextLevel ? ((100 - profile.winsToNextLevel) / 100) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Game Stats - Battle Record - Using formatLargeNumber */}
                        <div className="bg-gray-900 rounded-xl p-2 border border-indigo-700" 
                            >
                            <h3 className="text-xs font-extrabold mb-2 flex items-center gap-1.5 text-red-400">
                                <Shield className="w-3 h-3 text-red-600" /> 
                                Battle Record
                            </h3>
                            <div className="grid grid-cols-4 gap-1.5">
                                {/* WINS - FORMATTED */}
                                <div className="text-center bg-green-900/40 rounded-lg p-1.5 border border-green-700">
                                    <div className="text-sm font-extrabold text-green-400 leading-tight">{formatLargeNumber(profile?.wins ?? 0)}</div>
                                    <div className="text-[8px] text-green-300">{t('wins') || 'Wins'}</div>
                                </div>
                                {/* LOSSES - FORMATTED */}
                                <div className="text-center bg-red-900/40 rounded-lg p-1.5 border border-red-700">
                                    <div className="text-sm font-extrabold text-red-400 leading-tight">{formatLargeNumber(profile?.losses ?? 0)}</div>
                                    <div className="text-[8px] text-red-300">{t('losses') || 'Losses'}</div>
                                </div>
                                {/* DRAWS - FORMATTED */}
                                <div className="text-center bg-yellow-900/40 rounded-lg p-1.5 border border-yellow-700">
                                    <div className="text-sm font-extrabold text-yellow-400 leading-tight">{formatLargeNumber(profile?.draws ?? 0)}</div>
                                    <div className="text-[8px] text-yellow-300">{t('draws') || 'Draws'}</div>
                                </div>
                                {/* WIN RATE - Not formatted */}
                                <div className="text-center bg-indigo-900/40 rounded-lg p-1.5 border border-indigo-700">
                                    <div className="text-sm font-extrabold text-yellow-400 leading-tight">{winRate}%</div>
                                    <div className="text-[8px] text-indigo-300">{t('winRate') || 'Win Rate'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Current Win Streak */}
                        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-1.5 border border-purple-600/60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Swords className="w-3 h-3 text-purple-400" />
                                    <span className="text-[10px] font-semibold text-purple-200">Current Win Streak</span>
                                </div>
                                <div className="text-base font-extrabold text-white">
                                    {profile?.currentWinStreak ?? 0}
                                </div>
                            </div>
                        </div>

                        {/* Head-to-Head Statistics (omitted for brevity) */}

                        {/* Achievements - Constrained Height */}
                        {profile?.achievements && profile.achievements.length > 0 && (
                            <div className="bg-gray-900 rounded-xl p-2 border border-yellow-700" 
                            >
                                <h3 className="text-xs font-extrabold mb-2 flex items-center gap-1.5 text-yellow-400">
                                    <Gem className="w-3 h-3 text-yellow-500" />
                                    Achievements
                                </h3>
                                <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar"
                                    style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: 'rgb(203 166 22) transparent'
                                    }}>
                                    {profile?.achievements?.map((achievement) => (
                                        <div
                                            key={achievement.id}
                                            className="flex items-center gap-2 p-1.5 bg-gray-800 rounded-lg border border-yellow-700/50" 
                                        >
                                            <span className="text-base flex-shrink-0 text-yellow-400">{achievement.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-[10px] truncate text-yellow-300">{achievement.name}</div>
                                                <div className="text-[10px] text-gray-400 truncate">{achievement.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                        <span className="text-lg">This noble could not be located in the register.</span>
                    </div>
                )}

                <div className="flex-shrink-0 p-3 pt-0 relative z-10">
                    <Button
                        onClick={onClose}
                        className="w-full h-8 bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700 hover:from-yellow-800 hover:via-yellow-700 hover:to-yellow-800 text-gray-900 font-extrabold text-xs py-1.5 rounded-xl transition-all duration-300 transform hover:scale-[1.01] border border-yellow-300"
                        data-testid="button-close-profile"
                    >
                        {t('close') || 'Close'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}