import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

export function DebugAchievements() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRefreshCache = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
      await queryClient.refetchQueries({ queryKey: ['/api/achievements'] });
      console.log('Achievement cache invalidated and refetched');
    } catch (error) {
      console.error('Error refreshing cache:', error);
    }
  };

  const handleRecalculate = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      console.log('Making request to debug endpoint...');
      const response = await fetch('/api/debug/recalculate-achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${responseText}`);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      console.log('Parsed response:', data);
      setResult(data);
      
      // Auto-refresh cache after successful recalculation
      if (data.success) {
        setTimeout(async () => {
          await handleRefreshCache();
          // Invalidate all queries to refresh data
          await queryClient.invalidateQueries();
        }, 500);
      }
    } catch (error) {
      console.error('Error recalculating achievements:', error);
      setResult({ error: `${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixWinStreaks = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      console.log('Making request to fix win streak achievements...');
      const response = await fetch('/api/debug/fix-win-streak-achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Win streak fix response:', data);
      setResult(data);
      
      // Auto-refresh cache after successful fix
      if (data.success) {
        setTimeout(async () => {
          await handleRefreshCache();
          // Invalidate all queries to refresh data
          await queryClient.invalidateQueries();
        }, 500);
      }
    } catch (error) {
      console.error('Error fixing win streak achievements:', error);
      setResult({ error: `${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-96 bg-slate-800 border-slate-700 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Debug Achievements
        </CardTitle>
        <CardDescription className="text-gray-400">
          Fix missing win streak achievements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={handleRecalculate} 
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recalculating...
              </>
            ) : (
              'Recalculate Achievements'
            )}
          </Button>
          
          <Button 
            onClick={handleFixWinStreaks} 
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              '🔥 Fix Win Streak Achievements'
            )}
          </Button>
          
          <Button 
            onClick={handleRefreshCache} 
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Achievement Cache
          </Button>
        </div>
        
        {result && (
          <div className="space-y-3">
            {result.error ? (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm mt-1">{result.error}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Success</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">User Stats:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Wins: {result.userStats?.wins}</Badge>
                    <Badge variant="outline">Losses: {result.userStats?.losses}</Badge>
                    <Badge variant="outline">Draws: {result.userStats?.draws}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Win Streaks:</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">Current: {result.winStreaks?.current || 0}</Badge>
                    <Badge variant="outline">Best: {result.winStreaks?.best || 0}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Achievements:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={result.hasWinStreak5 ? "default" : "secondary"}>
                      Win Streak 5: {result.hasWinStreak5 ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={result.hasWinStreak10 ? "default" : "secondary"}>
                      Win Streak 10: {result.hasWinStreak10 ? "✓" : "✗"}
                    </Badge>
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-400 hover:text-white">
                    Show Raw Data
                  </summary>
                  <pre className="mt-2 p-2 bg-slate-900 rounded text-xs overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}