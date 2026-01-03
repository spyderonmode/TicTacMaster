import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <>
      <Button
        onClick={handleClick}
        className={`bg-gradient-to-r from-purple-800 to-blue-800 hover:from-purple-900 hover:to-blue-900 text-white transition-all duration-500 h-14 ${!canWatch ? 'opacity-30 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}
        size="sm"
        title={canWatch ? "Watch video to earn 5,000,000 coins!" : "Available in 3 hours"}
      >
        {canWatch ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <Film className="w-5 h-5 text-yellow-300" />
              <div className="flex flex-col items-center leading-none">
                <span className="text-[12px] font-black text-yellow-300 drop-shadow-md">5M</span>
              </div>
            </div>
          </>
        ) : (
          <span className="text-lg">⏱️</span>
        )}
      </Button>

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
    </>
  );
}
