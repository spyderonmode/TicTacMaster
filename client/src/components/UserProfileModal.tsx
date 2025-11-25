import { useState, useEffect } from 'react';
import { X, Trophy, Zap, Crown, Coins, TrendingUp, Swords, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { AvatarWithFrame } from './AvatarWithFrame';
import { getWinsRequiredForCurrentLevel, getProgressInCurrentLevel } from '../../../shared/level'; 

// 🎯 Utility function for large number formatting 
const formatLargeNumber = (num: number): string => {
    if (num < 10000) {
        return num.toString();
    }
    // Small text approach: only show 'k' if significantly large
    const formatted = (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1);
    return formatted + 'k';
};

// --- INTERFACES (Kept consistent) ---
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

// Component for a dense, small-text stat line
interface StatLineProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    valueColor: string;
}

const MinimalStatLine = ({ icon, label, value, valueColor }: StatLineProps) => (
    <div className="flex justify-between items-center py-1 border-b border-gray-700/50 last:border-b-0">
        <div className='flex items-center gap-2'>
            {icon}
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className={`text-sm font-bold ${valueColor} leading-tight font-mono`}>
            {value}
        </div>
    </div>
);


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
        const winsRequiredForLevel = getWinsRequiredForCurrentLevel(s.level);
        const progressInLevel = getProgressInCurrentLevel(s.wins);
        return (progressInLevel / winsRequiredForLevel) * 100;
    };


    return (
        <Dialog open={open} onOpenChange={onClose}>
            {/* NEW FRAME DESIGN: Deep Navy/Black Background with Amber Accent */}
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto 
                bg-zinc-950/95 p-0 text-gray-100 
                border-2 border-amber-600/50 rounded-lg shadow-inner-xl shadow-amber-900/40" // Frame border is key
            > 
                
                {/* Header Section: Profile ID Block (USER-ID removed) */}
                <DialogHeader className="p-4 border-b border-amber-600/50 bg-zinc-900/60 flex flex-row items-center justify-between">
                    <DialogTitle className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                            <AvatarWithFrame
                                src={profileImage}
                                alt={displayName}
                                size="md" // Smaller avatar
                                borderType={activeAvatarFrame || selectedAchievementBorder || stats?.selectedAchievementBorder || null}
                                fallbackText={displayName.charAt(0).toUpperCase()}
                            />
                        </div>

                        {/* Text is smaller and more technical */}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-extrabold text-amber-300 truncate leading-tight tracking-wide uppercase"> 
                                {displayName}
                            </h2>
                            {/* Replaced with username for general display */}
                            <p className="text-xs text-gray-500 font-mono tracking-tighter">@{username}</p> 
                        </div>
                    </DialogTitle>
                    <Button 
                        onClick={onClose} 
                        variant="ghost" 
                        className="text-amber-500 hover:text-white p-2 h-auto rounded-md transition-colors" 
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>
                
                {/* Content Area - Data Grid Approach */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4"> 
                    
                    {loading ? (
                        <div className="text-center py-8 text-amber-400">
                            <div className="animate-spin w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm mt-3 font-semibold">ACCESSING PLAYER DATA...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 bg-red-900/20 rounded-lg ring-1 ring-red-600/50 text-red-300 text-sm">
                            <p className="font-semibold">{error}</p>
                        </div>
                    ) : stats && (
                        <div className="space-y-6">

                            {/* Section 1: Core Stats & Currency - Grid of Minimal Lines */}
                            <div className="p-4 rounded-md bg-zinc-800/50 ring-1 ring-amber-600/30">
                                <h3 className="text-xs uppercase text-amber-400 mb-2 tracking-widest font-bold border-b border-amber-700/40 pb-1">Primary Metrics</h3>
                                <div className="space-y-2">
                                    <MinimalStatLine
                                        icon={<Coins className="w-4 h-4 text-yellow-400" />}
                                        label="Current Gold"
                                        value={stats.coins.toLocaleString('en-US')}
                                        valueColor="text-yellow-300"
                                    />
                                    <MinimalStatLine
                                        icon={<Crown className="w-4 h-4 text-purple-400" />}
                                        label="Player Level"
                                        value={stats.level}
                                        valueColor="text-purple-300"
                                    />
                                    <MinimalStatLine
                                        icon={<Swords className="w-4 h-4 text-red-400" />}
                                        label="Total Games" 
                                        value={formatLargeNumber(stats.totalGames)}
                                        valueColor="text-gray-300"
                                    />
                                </div>
                            </div>
                            
                            {/* Section 2: Battle Record Summary - High-Density 2x2 Grid */}
                            <div className="p-4 rounded-md bg-zinc-800/50 ring-1 ring-amber-600/30">
                                <h3 className="text-xs uppercase text-amber-400 mb-2 tracking-widest font-bold border-b border-amber-700/40 pb-1">Engagement Analysis</h3>
                                <div className="grid grid-cols-4 gap-2 text-center pt-2"> 
                                    
                                    {/* Wins */}
                                    <div className="p-1">
                                        <div className="text-lg font-bold text-green-400 leading-tight">{formatLargeNumber(stats.wins)}</div> 
                                        <div className="text-[10px] text-gray-500 uppercase">WINS</div>
                                    </div>
                                    {/* Losses */}
                                    <div className="p-1">
                                        <div className="text-lg font-bold text-red-400 leading-tight">{formatLargeNumber(stats.losses)}</div> 
                                        <div className="text-[10px] text-gray-500 uppercase">LOSSES</div>
                                    </div>
                                    {/* Draws */}
                                    <div className="p-1">
                                        <div className="text-lg font-bold text-gray-300 leading-tight">{formatLargeNumber(stats.draws)}</div> 
                                        <div className="text-[10px] text-gray-500 uppercase">DRAWS</div>
                                    </div>
                                    {/* Win Rate */}
                                    <div className="p-1">
                                        <div className="text-lg font-bold text-blue-400 leading-tight">{getWinRate(stats)}%</div>
                                        <div className="text-[10px] text-gray-500 uppercase">RATE</div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Progression & Streaks - Single Card */}
                            <div className="p-4 rounded-md bg-zinc-800/50 ring-1 ring-amber-600/30 space-y-3">
                                <h3 className="text-xs uppercase text-amber-400 tracking-widest font-bold border-b border-amber-700/40 pb-1 mb-2">Operational Status</h3>
                                
                                {/* Progression Bar - Very small text */}
                                <div className="pb-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                                            <Trophy className="w-4 h-4 text-cyan-400"/> LEVEL STATUS
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {getProgressInCurrentLevel(stats.wins)}/{getWinsRequiredForCurrentLevel(stats.level)} (Next Lv{stats.level + 1})
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full transition-all duration-500 ease-out" 
                                            style={{ width: `${getLevelProgress(stats)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Streaks (Side-by-Side) */}
                                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-700/50">
                                    <div className="flex flex-col items-start">
                                        <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-orange-400" /> Current Streak
                                        </span>
                                        <div className="text-lg font-bold text-orange-300 leading-tight font-mono">{stats.currentWinStreak || 0}</div>
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3 text-pink-400" /> Best Streak
                                        </span>
                                        <div className="text-lg font-bold text-pink-300 leading-tight font-mono">{stats.bestWinStreak || 0}</div>
                                    </div>
                                </div>

                            </div>
                            
                        </div>
                    )}
                </div>
                
                {/* Footer Button: Tactical Button */}
                <div className="flex-shrink-0 p-4 border-t border-amber-600/50 bg-zinc-900/60">
                    <Button 
                        onClick={onClose} 
                        className="w-full bg-transparent border-2 border-amber-500 text-amber-300 font-extrabold py-3 shadow-lg shadow-amber-700/30 rounded-md 
                                   hover:bg-amber-600/20 hover:text-white transition-all duration-200 uppercase tracking-widest"
                    >
                        CLOSE PROFILE VIEW
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}