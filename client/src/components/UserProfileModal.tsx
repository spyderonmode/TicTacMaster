import { useState, useEffect } from 'react';
import { X, Trophy, Users, Zap, Crown, Swords, Coins, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { AvatarWithFrame } from './AvatarWithFrame'; 

// 🎯 Utility function for large number formatting (used for stats, NOT for Coins)
const formatLargeNumber = (num: number): string => {
    if (num < 10000) {
        return num.toString();
    }
    const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1);
    return formatted + 'k';
};

// --- INTERFACES (Kept consistent for stability) ---
interface PlayerStats {
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    currentWinStreak: number;
    bestWinStreak: number;
    level: number; 
    winsToNextLevel: number;
    coins: number; 
    achievementsUnlocked: number;
    selectedAchievementBorder?: string | null;
}

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  profileImageUrl?: string;
  selectedAchievementBorder?: string | null;
}
// -----------------------------


export function UserProfileModal({ 
    open, 
    onClose, 
    userId, 
    username, 
    displayName, 
    profilePicture, 
    profileImageUrl,
    selectedAchievementBorder
}: UserProfileModalProps) {
    
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeAvatarFrame, setActiveAvatarFrame] = useState<string | null>(null);

    const profileImage = profileImageUrl || profilePicture;
    const WINS_PER_LEVEL = 50; 
    
    useEffect(() => {
        if (open && userId) {
            fetchOnlineStats();
            fetchActiveAvatarFrame();
        }
    }, [open, userId]);

    const fetchOnlineStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/users/${userId}/online-stats`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json(); 
            
            const newStats: PlayerStats = {
                ...data,
                achievementsUnlocked: data.achievementsUnlocked ?? 0, 
                coins: data.coins ?? 1000, 
            };

            setStats(newStats);
        } catch (err) {
            setError('Failed to load player statistics.');
            console.error('Error fetching online stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveAvatarFrame = async () => {
        try {
            const response = await fetch(`/api/users/${userId}/avatar-frame`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                setActiveAvatarFrame(data.activeFrameId);
            }
        } catch (err) {
            console.error('Error fetching active avatar frame:', err);
        }
    };

    const getWinRate = (s: PlayerStats) => {
        if (s.totalGames === 0) return 0;
        return Math.round((s.wins / s.totalGames) * 100);
    };

    const getLevelProgress = (s: PlayerStats) => {
        const winsNeeded = s.winsToNextLevel > 0 ? s.winsToNextLevel : WINS_PER_LEVEL;
        return ((WINS_PER_LEVEL - winsNeeded) / WINS_PER_LEVEL) * 100;
    };


    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* NEW: Dynamic Gradient Background for the main modal */}
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto 
                bg-gradient-to-br from-gray-900 via-zinc-900 to-black p-0 text-white 
                border-2 border-indigo-700/50 rounded-xl shadow-2xl">
                
                {/* Header Section: Now also part of the gradient flow, but with a subtle border */}
                <DialogHeader className="p-4 border-b border-indigo-800/50">
                    <DialogTitle className="flex items-center gap-4">
                        {/* Profile Image - More vibrant border */}
                        <div className="relative flex-shrink-0">
                            <AvatarWithFrame
                                src={profileImage}
                                alt={displayName}
                                size="md"
                                borderType={activeAvatarFrame || selectedAchievementBorder || stats?.selectedAchievementBorder || null}
                                fallbackText={displayName.charAt(0).toUpperCase()}
                            />
                        </div>
                        {/* Name/Username */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-extrabold text-white truncate leading-tight"> 
                                {displayName}
                            </h2>
                            <p className="text-sm text-gray-400 font-mono">@{username}</p>
                        </div>
                        <Button 
                            onClick={onClose} 
                            variant="ghost" 
                            className="text-gray-400 hover:text-white p-2 h-auto"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    
                    {loading ? (
                        <div className="text-center py-12 text-gray-400">
                            <div className="animate-spin w-6 h-6 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm mt-3">Loading statistics...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 bg-red-900/20 rounded-lg">
                            <p className="text-red-300 text-sm font-semibold">{error}</p>
                            <Button  onClick={fetchOnlineStats} variant="outline" size="sm" className="mt-4 border-red-500 text-red-300">
                                Try Again
                            </Button>
                        </div>
                    ) : stats && (
                        <div className="space-y-4">
                            
                            {/* Coins and Level Group - Top Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Coins: ADJUSTED FOR FULL NUMBER DISPLAY */}
                                <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/70 flex flex-col items-start overflow-hidden shadow-lg"> {/* Subtle shadow */}
                                    <div className='flex items-center gap-2 mb-1'>
                                        <Coins className="w-5 h-5 text-yellow-400" /> {/* Brighter yellow */}
                                        <span className="text-xs text-gray-300 font-medium uppercase">Gold</span>
                                    </div>
                                    <div className="text-lg sm:text-xl font-extrabold text-white leading-tight break-words">
                                        {stats.coins.toLocaleString('en-US')}
                                    </div>
                                </div>
                                {/* Level: UPDATED TEXT */}
                                <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/70 flex flex-col items-start shadow-lg">
                                    <div className='flex items-center gap-2 mb-1'>
                                        <Crown className="w-5 h-5 text-purple-400" /> {/* Brighter purple */}
                                        <span className="text-xs text-gray-300 font-medium uppercase">Level</span> {/* Changed from Rank to Level */}
                                    </div>
                                    <div className="text-2xl font-extrabold text-white leading-tight">
                                        {stats.level} {/* Removed "Lv." prefix */}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Battle Record (W/L/D/WinRate) - Grid */}
                            <div className="grid grid-cols-4 gap-2 text-center border-t border-b border-gray-700 py-3 mt-4 bg-gray-900/40 rounded-xl shadow-inner"> {/* Inner shadow for depth */}
                                
                                {/* Wins */}
                                <div className="p-1">
                                    <div className="text-xl font-bold text-green-400 leading-tight">{formatLargeNumber(stats.wins)}</div>
                                    <div className="text-[10px] text-gray-400 uppercase">Wins</div>
                                </div>
                                {/* Losses */}
                                <div className="p-1">
                                    <div className="text-xl font-bold text-red-400 leading-tight">{formatLargeNumber(stats.losses)}</div>
                                    <div className="text-[10px] text-gray-400 uppercase">Losses</div>
                                </div>
                                {/* Draws */}
                                <div className="p-1">
                                    <div className="text-xl font-bold text-gray-300 leading-tight">{formatLargeNumber(stats.draws)}</div> {/* Lighter gray for draws */}
                                    <div className="text-[10px] text-gray-400 uppercase">Draws</div>
                                </div>
                                {/* Win Rate */}
                                <div className="p-1">
                                    <div className="text-xl font-bold text-blue-400 leading-tight">{getWinRate(stats)}%</div>
                                    <div className="text-[10px] text-gray-400 uppercase">Rate</div>
                                </div>
                            </div>

                            {/* Progression Bar */}
                            <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/70 shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-cyan-400"/> Progression
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {stats.winsToNextLevel} wins left
                                    </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full shadow-lg" // Added shadow
                                        style={{ width: `${getLevelProgress(stats)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Streaks */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Current Streak */}
                                <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/70 flex flex-col items-start shadow-lg">
                                    <div className='flex items-center gap-2 mb-1'>
                                        <Zap className="w-5 h-5 text-orange-400" />
                                        <span className="text-xs text-gray-300 font-medium uppercase">Current Streak</span>
                                    </div>
                                    <div className="text-xl font-bold text-white leading-tight">
                                        {stats.currentWinStreak || 0}
                                    </div>
                                </div>
                                {/* Best Streak */}
                                <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/70 flex flex-col items-start shadow-lg">
                                    <div className='flex items-center gap-2 mb-1'>
                                        <TrendingUp className="w-5 h-5 text-pink-400" />
                                        <span className="text-xs text-gray-300 font-medium uppercase">Best Streak</span>
                                    </div>
                                    <div className="text-xl font-bold text-white leading-tight">
                                        {stats.bestWinStreak || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer Button: More prominent with gradient */}
                <div className="flex-shrink-0 p-4 border-t border-indigo-800/50 bg-gray-900/70">
                    <Button 
                        onClick={onClose} 
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold py-3 shadow-lg shadow-indigo-500/50"
                    >
                        CLOSE PROFILE
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}