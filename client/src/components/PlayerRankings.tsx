import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus, User, BarChart3, PieChart, Activity, Zap, Crown, Star, Target } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerRanking {
  userId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winRate: number;
  rank: number;
  rankChange: number; // +/- change from previous ranking
  streak: number; // current win/loss streak
  streakType: 'win' | 'loss' | 'draw';
}

interface PlayerRankingsProps {
  currentUserId?: string;
}

interface RankingStats {
  totalPlayers: number;
  averageWinRate: number;
  mostActivePlayer: string;
  topStreak: number;
  totalGamesPlayed: number;
}

export function PlayerRankings({ currentUserId }: PlayerRankingsProps) {
  const [sortBy, setSortBy] = useState<'winRate' | 'totalGames' | 'wins'>('winRate');
  const [viewMode, setViewMode] = useState<'list' | 'chart' | 'stats'>('list');
  const [previousRankings, setPreviousRankings] = useState<PlayerRanking[]>([]);

  const { data: rankings, isLoading } = useQuery({
    queryKey: ['/api/rankings', sortBy],
    refetchInterval: 30000, // Increased to 30s - rankings don't change frequently
    staleTime: 25000, // Consider data fresh for 25 seconds
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Track ranking changes
  useEffect(() => {
    if (rankings && rankings.length > 0) {
      setPreviousRankings(prev => {
        if (prev.length === 0) return rankings;
        
        // Calculate rank changes
        const updatedRankings = rankings.map((current: PlayerRanking) => {
          const previous = prev.find(p => p.userId === current.userId);
          const rankChange = previous ? previous.rank - current.rank : 0;
          return { ...current, rankChange };
        });
        
        return updatedRankings;
      });
    }
  }, [rankings]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Player Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getStreakColor = (streakType: string) => {
    switch (streakType) {
      case 'win':
        return 'bg-green-500';
      case 'loss':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-600 dark:text-green-400';
    if (winRate >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const calculateStats = (rankings: PlayerRanking[]): RankingStats => {
    if (!rankings || rankings.length === 0) {
      return {
        totalPlayers: 0,
        averageWinRate: 0,
        mostActivePlayer: '',
        topStreak: 0,
        totalGamesPlayed: 0
      };
    }

    const totalGamesPlayed = rankings.reduce((sum, player) => sum + player.totalGames, 0);
    const averageWinRate = rankings.reduce((sum, player) => sum + player.winRate, 0) / rankings.length;
    const mostActivePlayer = rankings.reduce((prev, current) => 
      prev.totalGames > current.totalGames ? prev : current
    ).displayName || 'Unknown';
    const topStreak = Math.max(...rankings.map(player => player.streak));

    return {
      totalPlayers: rankings.length,
      averageWinRate,
      mostActivePlayer,
      topStreak,
      totalGamesPlayed
    };
  };

  const renderChart = () => {
    if (!rankings || rankings.length === 0) return null;

    const topPlayers = rankings.slice(0, 10);
    const maxWinRate = Math.max(...topPlayers.map(p => p.winRate));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Win Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />
                Win Rate Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPlayers.map((player, index) => (
                  <motion.div
                    key={player.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-16 text-xs text-gray-600 dark:text-gray-400 truncate">
                      {player.displayName || 'Unknown'}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(player.winRate / maxWinRate) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                      />
                    </div>
                    <div className="w-12 text-xs text-right">
                      {player.winRate.toFixed(1)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Games Played Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Games Played
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topPlayers.map((player, index) => {
                  const maxGames = Math.max(...topPlayers.map(p => p.totalGames));
                  return (
                    <motion.div
                      key={player.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-16 text-xs text-gray-600 dark:text-gray-400 truncate">
                        {player.displayName || 'Unknown'}
                      </div>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(player.totalGames / maxGames) * 100}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                      <div className="w-12 text-xs text-right">
                        {player.totalGames}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Streak Leaders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4" />
              Current Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankings
                .filter(player => player.streak > 1)
                .sort((a, b) => b.streak - a.streak)
                .slice(0, 6)
                .map((player, index) => (
                  <motion.div
                    key={player.userId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border-2 ${
                      player.streakType === 'win' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : player.streakType === 'loss'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {player.profileImageUrl ? (
                        <img 
                          src={player.profileImageUrl} 
                          alt={player.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {player.displayName || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {player.streak} {player.streakType}{player.streak > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${
                        player.streakType === 'win' 
                          ? 'text-green-600' 
                          : player.streakType === 'loss'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {player.streak}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStats = () => {
    if (!rankings || rankings.length === 0) return null;

    const stats = calculateStats(rankings);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Players</p>
                  <p className="text-2xl font-bold">{stats.totalPlayers}</p>
                </div>
                <User className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Win Rate</p>
                  <p className="text-2xl font-bold">{stats.averageWinRate.toFixed(1)}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Most Active</p>
                  <p className="text-lg font-bold truncate">{stats.mostActivePlayer}</p>
                </div>
                <Crown className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Top Streak</p>
                  <p className="text-2xl font-bold">{stats.topStreak}</p>
                </div>
                <Zap className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-2 lg:col-span-4"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Games Played</p>
                  <p className="text-3xl font-bold">{stats.totalGamesPlayed}</p>
                </div>
                <Activity className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Player Rankings
          </div>
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex gap-1 mr-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title="List View"
              >
                <User className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`p-2 rounded ${
                  viewMode === 'chart' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title="Chart View"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`p-2 rounded ${
                  viewMode === 'stats' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                title="Stats View"
              >
                <PieChart className="h-4 w-4" />
              </button>
            </div>
            
            {/* Sort Options */}
            {viewMode === 'list' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('winRate')}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === 'winRate' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Win Rate
                </button>
                <button
                  onClick={() => setSortBy('wins')}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === 'wins' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Wins
                </button>
                <button
                  onClick={() => setSortBy('totalGames')}
                  className={`px-3 py-1 rounded text-sm ${
                    sortBy === 'totalGames' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Games
                </button>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {rankings?.map((player: PlayerRanking, index) => (
                <motion.div
                  key={player.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    player.userId === currentUserId 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(player.rank)}
                  </div>

                  {/* Profile Picture */}
                  <div className="relative">
                    {player.profileImageUrl ? (
                      <img 
                        src={player.profileImageUrl} 
                        alt={player.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    
                    {/* Streak indicator */}
                    {player.streak > 1 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.2 }}
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full ${getStreakColor(player.streakType)} flex items-center justify-center`}
                      >
                        <span className="text-xs font-bold text-white">{player.streak}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {player.displayName || `${player.firstName} ${player.lastName}`.trim() || 'Anonymous'}
                      </p>
                      {player.userId === currentUserId && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                      {player.rankChange > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.3 }}
                          className="flex items-center gap-1"
                        >
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-500">+{player.rankChange}</span>
                        </motion.div>
                      )}
                      {player.rankChange < 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 + 0.3 }}
                          className="flex items-center gap-1"
                        >
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-500">{player.rankChange}</span>
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className={`font-medium ${getWinRateColor(player.winRate)}`}>
                          {player.winRate.toFixed(1)}%
                        </span>
                        <span>({player.wins}W-{player.losses}L-{player.draws}D)</span>
                      </div>
                    </div>
                  </div>

                  {/* Win Rate Progress */}
                  <div className="w-20">
                    <Progress 
                      value={player.winRate} 
                      className="h-2"
                    />
                  </div>

                  {/* Total Games */}
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {player.totalGames}
                    </p>
                    <p className="text-xs text-gray-500">games</p>
                  </div>
                </motion.div>
              ))}
              
              {(!rankings || rankings.length === 0) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-500"
                >
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No rankings available yet</p>
                  <p className="text-sm">Play some online games to see rankings!</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {viewMode === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderChart()}
            </motion.div>
          )}

          {viewMode === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStats()}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}