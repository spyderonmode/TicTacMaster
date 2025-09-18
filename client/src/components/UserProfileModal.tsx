import { useState, useEffect } from 'react';
import { X, Trophy, Target, Users, GamepadIcon, Zap, Flame } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  profileImageUrl?: string;
}

interface OnlineGameStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  currentWinStreak: number;
  bestWinStreak: number;
  level: number;
  winsToNextLevel: number;
  coins?: number;
}

export function UserProfileModal({ 
  open, 
  onClose, 
  userId, 
  username, 
  displayName, 
  profilePicture, 
  profileImageUrl 
}: UserProfileModalProps) {
  const [stats, setStats] = useState<OnlineGameStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      fetchOnlineStats();
    }
  }, [open, userId]);

  const fetchOnlineStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching online stats for user:', userId);
      const response = await fetch(`/api/users/${userId}/online-stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Online stats response:', data);
      setStats(data);
    } catch (err) {
      setError('Failed to load player statistics');
      console.error('Error fetching online stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getWinRate = () => {
    if (!stats || stats.totalGames === 0) return 0;
    return Math.round((stats.wins / stats.totalGames) * 100);
  };

  const profileImage = profileImageUrl || profilePicture;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="relative">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{displayName}</h2>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-2 mb-4">
            <GamepadIcon className="w-5 h-5" />
            <h3 className="font-semibold">Online Multiplayer Stats</h3>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading stats...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{error}</p>
              <Button 
                onClick={fetchOnlineStats} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Wins</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {stats.wins}
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Losses</span>
                  </div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                    {stats.losses}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-600">Draws</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                    {stats.draws}
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <GamepadIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Total Games</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {stats.totalGames}
                  </div>
                </div>
              </div>
              
              {/* Streak and Coins Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Current Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {stats.currentWinStreak || 0}
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Best Streak</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {stats.bestWinStreak || 0}
                  </div>
                </div>
              </div>

              {/* Level */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Level</span>
                  </div>
                  <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {stats.level}
                  </span>
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-500">
                  {stats.winsToNextLevel} wins to next level
                </div>
                <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((60 - stats.winsToNextLevel) / 60) * 100}%` }}
                  />
                </div>
              </div>

              {/* Coins */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">Coins</span>
                  </div>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {stats.coins ?? 1000}
                  </span>
                </div>
              </div>
              
              {stats.totalGames > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Win Rate</span>
                    <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {getWinRate()}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getWinRate()}%` }}
                    />
                  </div>
                </div>
              )}
              
              {stats.totalGames === 0 && (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <GamepadIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    No online games played yet
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Statistics will appear after playing online multiplayer games
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}