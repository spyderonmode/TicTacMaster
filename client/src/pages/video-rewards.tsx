import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Film, Coins, Clock } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useLocation } from "wouter";

export default function VideoRewards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showAdModal, setShowAdModal] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adToken, setAdToken] = useState<string>('');

  // Fetch video reward status
  const { data: rewardStatus, refetch } = useQuery<{ videosRemaining: number; totalVideos: number; nextResetTime: string }>({
    queryKey: ['/api/video-rewards/status'],
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  // Claim reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async () => {
      // In the new system, reward claiming happens on the /watch page
      // This is kept for compatibility if needed, but navigation is the primary path
      return { coinsEarned: 0 };
    },
    onSuccess: () => {
      refetch();
    },
  });

  const videosLeft = rewardStatus?.videosRemaining || 0;
  const videosAvailable = videosLeft > 0 ? 1 : 0;
  const nextResetTime = rewardStatus?.nextResetTime;
  const canWatchMore = videosLeft > 0;

  const handleWatchAd = async () => {
    if (!canWatchMore) {
      toast({
        title: "Cooldown Active",
        description: "You need to wait 3 hours after watching a video before you can watch another.",
        variant: "destructive",
      });
      return;
    }

    setLocation('/video-rewards/watch');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-md mx-auto space-y-6 pt-8">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Watch & Earn</h1>
          <p className="text-slate-400">Watch videos to earn coins daily</p>
        </div>

        {/* Reward Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="w-5 h-5" />
              Daily Video Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Video Available</span>
                <Badge variant={canWatchMore ? "default" : "secondary"}>
                  {canWatchMore ? "✓ Ready" : "⏳ Cooldown"}
                </Badge>
              </div>
            </div>

            {/* Reward Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <Coins className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">2M</p>
                <p className="text-xs text-slate-400">Per Video</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">3H</p>
                <p className="text-xs text-slate-400">Cooldown</p>
              </div>
            </div>

            {/* Reset Time */}
            {nextResetTime && (
              <div className="bg-slate-700/30 rounded-lg p-3 text-center text-sm text-slate-300">
                Next reset: {new Date(nextResetTime).toLocaleTimeString()}
              </div>
            )}

            {/* Watch Button */}
            <Button
              onClick={handleWatchAd}
              disabled={!canWatchMore || claimRewardMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              size="lg"
            >
              {claimRewardMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : !canWatchMore ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Wait 3 Hours
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 mr-2" />
                  Watch Video Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-2">
            <p>✓ Watch 1 video = Earn 2M coins</p>
            <p>✓ Next video available after 3 hours</p>
            <p>✓ Watch unlimited videos (3 hour cooldown between each)</p>
            <p>✓ Come back anytime to earn more coins</p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button
          variant="secondary"
          className="w-full bg-slate-700 hover:bg-slate-600 text-white"
          onClick={() => setLocation('/home')}
        >
          Back to Game
        </Button>
      </div>

      {/* Ad Watch Modal */}
      <Dialog open={showAdModal} onOpenChange={setShowAdModal}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Watch Advertisement</DialogTitle>
            <DialogDescription>
              Watch the complete ad to earn your reward
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="animate-spin text-4xl mb-4">🎬</div>
            <p className="text-slate-300">Loading ad...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
