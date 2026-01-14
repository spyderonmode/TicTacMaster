import startPng from "@/lib/start.png";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden bg-black">
      {/* Background Image - Enhanced brightness and contrast */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-110 contrast-110"
        style={{ 
          backgroundImage: `url(${startPng})`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          height: '100%',
          width: '100%'
        }}
      />
      
      {/* Main content - Directly over the background */}
      <div className="relative flex flex-col items-center justify-end h-full py-20 w-full max-w-md px-8">
        {/* Simple Loading Section - No containing box */}
        <div className="w-full space-y-5">
          <div className="space-y-3">
            <div className="flex justify-between text-white text-base font-bold px-2 tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span>Initialising</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="relative h-2.5 w-full bg-white/30 rounded-full overflow-hidden border border-white/20">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-[length:200%_100%] animate-shimmer transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,1)]"
                style={{ width: `${progress}%` }}
              />
              {/* Glossy highlight on the bar itself */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-[#4ade80] text-xs font-bold tracking-[0.3em] uppercase [text-shadow:1px_1px_2px_black,0_0_1em_black,0_0_0.2em_black] drop-shadow-lg">
              Loading your gaming experience
            </p>
            <p className="text-[#4ade80] font-black text-sm tracking-[0.4em] uppercase [text-shadow:1px_1px_2px_black,0_0_1em_black,0_0_0.2em_black] drop-shadow-lg">
              Made By DarkLayer Studios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}