import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function VideoRewardsButton() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [showPopup, setShowPopup] = useState(false);
  
  const { data: rewardStatus, refetch } = useQuery<{ videosRemaining: number; totalVideos: number; nextResetTime: string }>({
    queryKey: ['/api/video-rewards/status'],
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  const videosLeft = rewardStatus?.videosRemaining || 0;
  const canWatch = videosLeft > 0;
  const nextReset = rewardStatus?.nextResetTime;

  useEffect(() => {
    if (!nextReset || canWatch) {
      setTimeLeft("");
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const reset = new Date(nextReset).getTime();
      const diff = reset - now;

      if (diff <= 0) {
        setTimeLeft("");
        refetch();
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextReset, canWatch, refetch]);

  const handleClick = () => {
    if (canWatch) {
      setLocation('/video-rewards/watch');
    } else {
      setShowPopup(true);
    }
  };

  return (
    <Card className={`relative overflow-hidden border-2 transition-all duration-300 h-24 ${canWatch ? 'border-purple-500/50 bg-slate-900/80 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-slate-800 bg-slate-950/50 opacity-50'}`}>
      <CardContent className="p-0 h-full">
        <Button
          onClick={handleClick}
          variant="ghost"
          className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-3 text-white hover:bg-transparent"
        >
          <div className={`relative p-1.5 rounded-xl bg-gradient-to-br transition-all duration-500 ${canWatch ? 'from-purple-600 to-blue-600 shadow-lg group-hover:scale-110' : 'from-slate-700 to-slate-800'}`}>
            {canWatch ? (
              <Film className="w-4 h-4 text-yellow-300 animate-pulse" />
            ) : (
              <span className="text-base">⏱️</span>
            )}
          </div>
          
          <div className="text-center space-y-0">
            <h3 className="font-black text-[11px] tracking-tighter italic leading-none">
              {canWatch ? 'REWARD VIDEO' : 'COOLDOWN'}
            </h3>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
              {canWatch ? 'EARN 5,000,000 COINS' : `READY IN: ${timeLeft || '...'}`}
            </p>
          </div>

          {canWatch && (
            <div className="absolute top-2 right-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
            </div>
          )}
        </Button>
      </CardContent>

      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold flex flex-col items-center gap-4">
              <span className="text-4xl">⏱️</span>
              Next Reward Available In
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-3xl font-mono text-yellow-500 bg-slate-900/50 px-6 py-3 rounded-xl border border-slate-600">
              {timeLeft || "Checking..."}
            </div>
            <p className="mt-4 text-slate-400 text-sm">You can watch a video every 3 hours to earn rewards.</p>
            <Button 
              className="mt-6 w-full bg-slate-700 hover:bg-slate-600"
              onClick={() => setShowPopup(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
