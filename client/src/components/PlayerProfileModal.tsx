import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Castle, Swords, Clock, Calendar, Gem } from "lucide-react"; 
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/LanguageContext";
import { AvatarWithFrame } from "./AvatarWithFrame";

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
        // Display up to 9,999 as standard number
        return num.toString();
    }
    // Format to 'k' (e.g., 10000 -> 10k, 12345 -> 12.3k)
    // Rounds to one decimal place if not a clean thousand
    const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1);
    return formatted + 'k';
};
// --------------------------------------------------


export function PlayerProfileModal({ playerId, open, onClose, currentUserId }: PlayerProfileModalProps) {
    const { t } = useTranslation();

    useEffect(() => {
        // PlayerProfileModal props changed
    }, [playerId, open, currentUserId]);

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

        const baseClasses = "font-serif text-xl font-extrabold truncate";
        
        // Check if user has manually selected a border (only if it has a non-null value)
        const borderType = profile.selectedAchievementBorder 
            ? profile.selectedAchievementBorder 
            : getAchievementLevel(profile);

        switch (borderType) {
            case 'level_100_master':
            case 'level100Master':
                return (
                    <span className={`${baseClasses} text-white drop-shadow-lg`}>
                        👑 {profile.displayName}
                    </span>
                );
            case 'ultimate_veteran':
            case 'ultimateVeteran':
                return (
                    <span className={`${baseClasses} text-white drop-shadow-md`}>
                        🏰 {profile.displayName}
                    </span>
                );
            case 'grandmaster':
                return (
                    <span className={`${baseClasses} text-white drop-shadow-md`}>
                        💎 {profile.displayName}
                    </span>
                );
            case 'champion':
                return (
                    <span className={`${baseClasses} text-white drop-shadow-md`}>
                        🛡️ {profile.displayName}
                    </span>
                );
            case 'legend':
            case 'veteran_player':
            case 'veteranPlayer':
                return (
                    <span className={`${baseClasses} text-white drop-shadow-md`}>
                        ⚜️ {profile.displayName}
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
            <DialogContent className="player-profile-modal max-w-md w-[95vw] mx-auto flex flex-col overflow-hidden relative 
                bg-gradient-to-br from-gray-950 via-indigo-900 to-black 
                border-4 border-yellow-700 shadow-[0_0_50px_rgba(255,215,0,0.4)] backdrop-blur-sm p-0 rounded-2xl max-h-[85vh]">
                
                {/* Animated Grandeur Elements (omitted for brevity) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <motion.div
                        className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-500/30 to-red-600/30 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                            x: [0, 10, 0],
                            y: [0, -10, 0]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>
                <DialogHeader className="sr-only">
                    <DialogTitle>{t('playerProfile') || 'Royal Profile'}</DialogTitle>
                    <DialogDescription>
                        {profile ? `View ${profile.displayName}'s noble lineage and battle records` : 'Loading noble records'}
                    </DialogDescription>
                </DialogHeader>

                {profileLoading ? (
                    <div className="flex items-center justify-center py-12 text-white">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"
                        />
                        <span className="ml-3 text-lg font-medium">{t('loading') || 'Unfurling the Scroll...'}</span>
                    </div>
                ) : profile ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex-1 overflow-y-auto space-y-3 p-4 relative z-10"
                    >
                        {/* Profile Header */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="relative bg-gradient-to-r from-indigo-900 via-gray-900 to-indigo-900 rounded-xl p-4 text-white shadow-2xl overflow-hidden border border-yellow-800/50" 
                        >
                            <div className="absolute inset-0 opacity-10">
                                <div className="w-full h-full bg-repeat" style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239e7e2a' fill-opacity='0.2'%3E%3Cpath d='M9.82 23.37L.31 32.22l50 50 50-50-9.51-8.85L50 63.37zM50 0l49.43 49.43L50 98.86.57 49.43z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                }}></div>
                            </div>
                            <div className="relative flex items-center gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="flex-shrink-0 relative"
                                >
                                    <AvatarWithFrame
                                        src={profile.profileImageUrl}
                                        alt={`${profile.displayName}'s profile`}
                                        size="lg"
                                        borderType={avatarFrameData?.activeFrameId || profile.selectedAchievementBorder || null}
                                        fallbackText={profile.displayName.charAt(0).toUpperCase()}
                                    />
                                    <div className="absolute -top-2 -right-1 w-5 h-5 bg-green-500 border-2 border-yellow-500 rounded-full"></div>
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="mb-0 leading-none">
                                        {renderAchievementBorder(profile)}
                                    </h1>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className="text-[10px] bg-yellow-600/80 text-gray-900 border-yellow-400 font-bold">
                                            @{profile.username}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-yellow-300/80">
                                        <Calendar className="w-3 h-3" />
                                        <span>{t('joined') || 'Joined'} {formatDate(profile.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Royal Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Royal Gold (Coins) */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="bg-gradient-to-br from-yellow-700 to-amber-900 rounded-xl p-3 text-white shadow-2xl border-2 border-yellow-600/80" 
                            >
                                <div className="flex flex-col">
                                    {/* Coins are usually large, but formatting is not applied here to allow for visual weight */}
                                    <div className="text-lg font-extrabold drop-shadow-md">{profile?.coins ?? 0}</div>
                                    <div className="text-xs text-yellow-200">Coins</div>
                                </div>
                            </motion.div>

                            {/* Noble Rank (Level) */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="bg-gradient-to-br from-indigo-800 to-purple-900 rounded-xl p-3 text-white shadow-2xl border-2 border-purple-600/80" 
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <div className="text-lg font-extrabold drop-shadow-md">{profile?.level || 0}</div>
                                        <Crown className="w-4 h-4 text-yellow-400 drop-shadow-lg" />
                                    </div>
                                    <div className="text-xs text-purple-200">Level</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Progression Bar */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="bg-gray-900 rounded-xl p-3 shadow-inner shadow-gray-700 border border-yellow-800" 
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-yellow-400 flex items-center gap-2">
                                    <Castle className="w-3 h-3"/>
                                    User Level Progress
                                </span>
                                <span className="text-xs text-gray-400">
                                    {profile?.winsToNextLevel ?? 0} victories to the next Level
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${profile?.winsToNextLevel ? ((100 - profile.winsToNextLevel) / 100) * 100 : 0}%` }}
                                    transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                                    className="bg-gradient-to-r from-red-600 via-yellow-500 to-yellow-300 h-2 rounded-full shadow-lg"
                                />
                            </div>
                        </motion.div>

                        {/* Game Stats - Battle Record - Using formatLargeNumber */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="bg-gray-900 rounded-xl p-3 shadow-2xl border border-indigo-700" 
                        >
                            <h3 className="text-base font-extrabold mb-3 flex items-center gap-2 text-red-400">
                                <Shield className="w-4 h-4 text-red-600" /> 
                                Battle Record
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {/* WINS - FORMATTED */}
                                <div className="text-center bg-green-900/40 rounded-lg p-2 border border-green-700 shadow-md">
                                    <div className="text-base font-extrabold text-green-400 leading-tight">{formatLargeNumber(profile?.wins ?? 0)}</div>
                                    <div className="text-[10px] text-green-300">{t('wins') || 'Wins'}</div>
                                </div>
                                {/* LOSSES - FORMATTED */}
                                <div className="text-center bg-red-900/40 rounded-lg p-2 border border-red-700 shadow-md">
                                    <div className="text-base font-extrabold text-red-400 leading-tight">{formatLargeNumber(profile?.losses ?? 0)}</div>
                                    <div className="text-[10px] text-red-300">{t('losses') || 'Losses'}</div>
                                </div>
                                {/* DRAWS - FORMATTED */}
                                <div className="text-center bg-yellow-900/40 rounded-lg p-2 border border-yellow-700 shadow-md">
                                    <div className="text-base font-extrabold text-yellow-400 leading-tight">{formatLargeNumber(profile?.draws ?? 0)}</div>
                                    <div className="text-[10px] text-yellow-300">{t('draws') || 'Draws'}</div>
                                </div>
                                {/* WIN RATE - Not formatted */}
                                <div className="text-center bg-indigo-900/40 rounded-lg p-2 border border-indigo-700 shadow-md">
                                    <div className="text-base font-extrabold text-yellow-400 leading-tight">{winRate}%</div>
                                    <div className="text-[10px] text-indigo-300">{t('winRate') || 'Win Rate'}</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Current Win Streak */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.55, duration: 0.5 }}
                            className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-lg p-2 shadow-lg border border-purple-600/60"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Swords className="w-4 h-4 text-purple-400" />
                                    <span className="text-xs font-semibold text-purple-200">Current Win Streak</span>
                                </div>
                                <div className="text-lg font-extrabold text-white drop-shadow-md">
                                    {profile?.currentWinStreak ?? 0}
                                </div>
                            </div>
                        </motion.div>

                        {/* Head-to-Head Statistics (omitted for brevity) */}

                        {/* Achievements - Constrained Height */}
                        {profile?.achievements && profile.achievements.length > 0 && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                                className="bg-gray-900 rounded-xl p-3 shadow-2xl border border-yellow-700" 
                            >
                                <h3 className="text-base font-extrabold mb-3 flex items-center gap-2 text-yellow-400">
                                    <Gem className="w-4 h-4 text-yellow-500" />
                                    Achievements
                                </h3>
                                <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto pr-2 custom-scrollbar"
                                    style={{
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: 'rgb(203 166 22) transparent'
                                    }}>
                                    {profile?.achievements?.map((achievement) => (
                                        <motion.div
                                            key={achievement.id}
                                            whileHover={{ scale: 1.02, boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}
                                            className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg border border-yellow-700/50 transition-all duration-200" 
                                        >
                                            <span className="text-xl flex-shrink-0 text-yellow-400">{achievement.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-xs truncate text-yellow-300">{achievement.name}</div>
                                                <div className="text-xs text-gray-400 truncate">{achievement.description}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                        <span className="text-lg">This noble could not be located in the register.</span>
                    </div>
                )}

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="flex-shrink-0 p-4 pt-0 relative z-10"
                >
                    <Button
                        onClick={onClose}
                        className="w-full h-9 bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700 hover:from-yellow-800 hover:via-yellow-700 hover:to-yellow-800 text-gray-900 font-extrabold text-base py-2 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.5)] transition-all duration-300 transform hover:scale-[1.01] border-2 border-yellow-300"
                        data-testid="button-close-profile"
                    >
                        {t('close') || 'Close'}
                    </Button>
                </motion.div>
            </DialogContent>
        </Dialog>
    );
}