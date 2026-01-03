import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Coins, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export default function WatchAd() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Prevent double-start
  const startedRef = useRef(false);

  // Reward / claim locks
  const rewardGrantedRef = useRef(false);
  const claimInProgressRef = useRef(false);
  const tokenRef = useRef<string | null>(null);

  // Fallback timing
  const adStartedRef = useRef(false);
  const adStartTimeRef = useRef<number | null>(null);
  const MIN_WATCH_MS = 15000; // 15 seconds

  // Optional timeout so user isn't stuck if callbacks never arrive
  const timeoutRef = useRef<number | null>(null);

  const clearFlowTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const claimRewardMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch("/api/video-rewards/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to claim reward");
      }
      return response.json() as Promise<{ coinsEarned: number }>;
    },
    onSuccess: () => {
      clearFlowTimeout();
      queryClient.invalidateQueries({ queryKey: ["/api/video-rewards/status"] });
      // Navigate away after success
      setTimeout(() => setLocation("/home"), 300);
    },
    onError: () => {
      clearFlowTimeout();
      setLocation("/home");
    },
  });

  useEffect(() => {
    if (!user || startedRef.current) return;
    startedRef.current = true;

    const startAd = async () => {
      try {
        // 1) Generate token
        const tokenRes = await fetch("/api/video-rewards/generate-token", {
          method: "POST",
        });
        if (!tokenRes.ok) {
          setLocation("/home");
          return;
        }
        const tokenData = await tokenRes.json();
        tokenRef.current = tokenData.token;

        // 2) Global timeout fallback (no toast)
        timeoutRef.current = window.setTimeout(() => {
          if (!rewardGrantedRef.current && !claimInProgressRef.current) {
            setLocation("/home");
          }
        }, 60000);

        // 3) Trigger rewarded ad (native handles adId)
        setTimeout(() => {
          const WTN = (window as any).WTN;
          if (!WTN?.AdMob?.rewardsAd) {
            clearFlowTimeout();
            setLocation("/home");
            return;
          }

          WTN.AdMob.rewardsAd({
            rewardsAdCallback: (value: any) => {
              // Parse string OR object
              let res: any = value;
              if (typeof value === "string") {
                try {
                  res = JSON.parse(value);
                } catch {
                  // if parse fails, keep raw
                }
              }

              let { status, error } = res || {};
              status = typeof status === "string" ? status.trim() : status;

              //console.log("WTN rewarded callback:", res);

              // If reward already granted or claim running, ignore late callbacks (like adDismissed after reward)
              if (rewardGrantedRef.current || claimInProgressRef.current) return;

              // Ad started (shown)
              if (status === "success") {
                adStartedRef.current = true;
                adStartTimeRef.current = Date.now();
                return;
              }

              // Proper rewarded completion
              if (status === "rewardSuccess") {
                if (tokenRef.current) {
                  rewardGrantedRef.current = true;
                  claimInProgressRef.current = true;
                  claimRewardMutation.mutate(tokenRef.current);
                } else {
                  clearFlowTimeout();
                  setLocation("/home");
                }
                return;
              }

              // Ad closed/dismissed -> fallback reward if watched >= 15s
              if (status === "adDismissed") {
                const watchedMs = adStartTimeRef.current
                  ? Date.now() - adStartTimeRef.current
                  : 0;

                if (adStartedRef.current && watchedMs >= MIN_WATCH_MS && tokenRef.current) {
                  rewardGrantedRef.current = true;
                  claimInProgressRef.current = true;
                  claimRewardMutation.mutate(tokenRef.current);
                  return;
                }

                // Not eligible -> just go home (no toast)
                clearFlowTimeout();
                setTimeout(() => setLocation("/home"), 150);
                return;
              }

              // Failures -> just go home (no toast)
              if (status === "adLoadFailure" || status === "adError") {
                //console.log("Ad failed:", { status, error });
                clearFlowTimeout();
                setTimeout(() => setLocation("/home"), 150);
                return;
              }

              // Unknown -> go home (no toast)
              //console.log("Unknown ad status:", status);
              clearFlowTimeout();
              setTimeout(() => setLocation("/home"), 150);
            },
          });
        }, 1000);
      } catch (e) {
        //console.log("startAd error:", e);
        clearFlowTimeout();
        setLocation("/home");
      }
    };

    startAd();

    return () => {
      clearFlowTimeout();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <Loader2 className="w-20 h-20 text-blue-500 animate-spin" />
            <Film className="w-8 h-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Loading Advertisement</h2>
            <p className="text-slate-400">Please wait…</p>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 flex items-center justify-center gap-3">
            <Coins className="w-6 h-6 text-yellow-500" />
            <span className="text-xl font-semibold">
              {formatNumber(5000000)} Coins Reward
            </span>
          </div>

          <Button
            variant="ghost"
            className="text-slate-500 hover:text-white"
            onClick={() => setLocation("/home")}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
