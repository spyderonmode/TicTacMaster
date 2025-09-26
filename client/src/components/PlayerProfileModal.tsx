import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Users, Swords, Clock, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/contexts/LanguageContext";

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
  createdAt: string;
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

export function PlayerProfileModal({ playerId, open, onClose, currentUserId }: PlayerProfileModalProps) {
  const { t } = useTranslation();
  
  // Debug logging for profile modal
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

  const isOwnProfile = playerId === currentUserId;
  const winRate = profile ? Math.round((profile.wins / Math.max(profile.totalGames, 1)) * 100) : 0;

  const getAchievementLevel = (profile: PlayerProfile | undefined) => {
    if (!profile) return 'none';
    if (profile.level >= 100) return 'level100Master';
    if (profile.totalGames >= 500) return 'ultimateVeteran';
    if (profile.wins >= 200) return 'grandmaster';
    if (profile.wins >= 100) return 'champion';
    if (profile.wins >= 50) return 'legend';
    return 'none';
  };

  const renderAchievementBorder = (profile: PlayerProfile | undefined) => {
    if (!profile) return <span className="font-semibold text-sm truncate">Unknown Player</span>;
    
    const level = getAchievementLevel(profile);
    
    switch (level) {
      case 'level100Master':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 15px #fbbf24, 0 0 25px #f59e0b, 0 0 35px #d97706",
                "0 0 20px #d97706, 0 0 30px #b45309, 0 0 40px #92400e",
                "0 0 18px #92400e, 0 0 28px #fbbf24, 0 0 38px #f59e0b"
              ],
              scale: [1, 1.08, 1],
              filter: [
                "brightness(1.2) saturate(1.4)",
                "brightness(1.5) saturate(1.8)",
                "brightness(1.2) saturate(1.4)"
              ]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-xl truncate text-amber-400"
            data-testid={`level-master-name-${profile.id}`}
          >
            🏅 {profile.displayName}
          </motion.span>
        );
      case 'ultimateVeteran':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 10px #ff6347, 0 0 20px #ff1493, 0 0 30px #ff4500",
                "0 0 15px #ff4500, 0 0 25px #ff6347, 0 0 35px #ff1493",
                "0 0 12px #ff1493, 0 0 22px #ff4500, 0 0 32px #ff6347"
              ],
              scale: [1, 1.05, 1],
              filter: [
                "brightness(1) saturate(1)",
                "brightness(1.2) saturate(1.3)",
                "brightness(1) saturate(1)"
              ]
            }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-lg truncate text-red-400"
          >
            🔥 {profile.displayName}
          </motion.span>
        );
      case 'grandmaster':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 8px #4f46e5, 0 0 16px #c0c0c0, 0 0 24px #9333ea",
                "0 0 10px #9333ea, 0 0 20px #ffd700, 0 0 30px #4f46e5",
                "0 0 9px #ffd700, 0 0 18px #4f46e5, 0 0 27px #c0c0c0"
              ],
              scale: [1, 1.02, 1],
              rotate: [0, 1, -1, 0]
            }}
            transition={{
              duration: 3.0,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-lg truncate text-indigo-400"
          >
            💎 {profile.displayName}
          </motion.span>
        );
      case 'champion':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 10px #9333ea, 0 0 20px #3b82f6, 0 0 30px #ffd700",
                "0 0 15px #ffd700, 0 0 25px #ec4899, 0 0 35px #9333ea",
                "0 0 12px #ec4899, 0 0 22px #9333ea, 0 0 32px #3b82f6"
              ],
              scale: [1, 1.03, 1]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-lg truncate text-purple-400"
          >
            👑 {profile.displayName}
          </motion.span>
        );
      case 'legend':
        return (
          <motion.span
            animate={{
              textShadow: [
                "0 0 6px #ff4500, 0 0 12px #ff6600, 0 0 18px #ff8800",
                "0 0 8px #ff0000, 0 0 16px #ff3300, 0 0 24px #ff6600",
                "0 0 7px #ff8800, 0 0 14px #ffaa00, 0 0 21px #ffcc00"
              ]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="font-bold text-lg truncate text-orange-400"
          >
            🌟 {profile.displayName}
          </motion.span>
        );
      default:
        return (
          <span className="font-semibold text-lg truncate">
            {profile.displayName}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!open || !playerId) {
    // PlayerProfileModal not showing
    return null;
  }

  // PlayerProfileModal rendering

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="player-profile-modal max-w-2xl max-h-[90vh] w-[95vw] sm:w-full mx-auto flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-6 h-6 text-blue-500" />
            {t('playerProfile') || 'Player Profile'}
          </DialogTitle>
        </DialogHeader>

        {profileLoading ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">{t('loading') || 'Loading...'}</span>
          </div>
        ) : profile ? (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {profile.profileImageUrl ? (
                      <img
                        src={profile.profileImageUrl}
                        alt={`${profile.displayName}'s profile`}
                        className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                        {profile.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      {renderAchievementBorder(profile)}
                    </div>
                    <Badge variant="secondary" className="text-sm mb-2">
                      @{profile.username}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{t('joined') || 'Joined'} {formatDate(profile.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Game Statistics */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  {t('gameStats') || 'Game Statistics'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{profile.wins}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('wins') || 'Wins'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{profile.losses}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('losses') || 'Losses'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{profile.draws}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('draws') || 'Draws'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{winRate}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('winRate') || 'Win Rate'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500 dark:text-green-300 flex items-center justify-center gap-1">
                      <span>💰</span>
                      <span>{profile.coins ?? 1000}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Coins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                      <span>🏆</span>
                      <span>Lv.{profile.level || 0}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                  </div>
                </div>
                
                {/* Level Progress Bar */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Level Progress</span>
                    <span className="text-sm text-amber-600 dark:text-amber-500">
                      {profile.winsToNextLevel ?? 60} wins to next level
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((60 - (profile.winsToNextLevel ?? 60)) / 60) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Head-to-Head Statistics */}
            {!isOwnProfile && currentUserId && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Swords className="w-5 h-5" />
                    {t('headToHead') || 'Head-to-Head vs You'}
                  </h3>
                  {h2hLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2">{t('loading') || 'Loading...'}</span>
                    </div>
                  ) : headToHead ? (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{headToHead.totalGames}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{t('totalGames') || 'Total Games'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">{headToHead.wins}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{t('yourWins') || 'Your Wins'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-600 dark:text-red-400">{headToHead.losses}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{t('yourLosses') || 'Your Losses'}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{headToHead.winRate}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{t('yourWinRate') || 'Your Win Rate'}</div>
                        </div>
                      </div>
                      {headToHead.recentGames.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">{t('recentGames') || 'Recent Games'}</h4>
                          <div className="space-y-2">
                            {headToHead.recentGames.slice(0, 5).map((game) => (
                              <div key={game.id} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{formatDate(game.playedAt)}</span>
                                <Badge variant={
                                  game.result === 'win' ? 'default' : 
                                  game.result === 'loss' ? 'destructive' : 'secondary'
                                }>
                                  {game.result === 'win' ? t('win') || 'Win' :
                                   game.result === 'loss' ? t('loss') || 'Loss' :
                                   t('draw') || 'Draw'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400 text-center">
                      {t('noGamesPlayed') || 'No games played against this player yet.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Achievements */}
            {profile.achievements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    {t('achievements') || 'Achievements'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{achievement.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{achievement.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 flex-1">
            <span className="text-gray-600 dark:text-gray-400">{t('playerNotFound') || 'Player not found'}</span>
          </div>
        )}

        <div className="flex-shrink-0 pt-4 border-t">
          <Button onClick={onClose} className="w-full">
            {t('close') || 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}