import { GamepadIcon } from "lucide-react";

export default function LoadingScreen() {

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center z-50">
      {/* Background animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Main content */}
      <div className="relative flex flex-col items-center justify-center space-y-8">
        {/* Game logo with animations */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 w-32 h-32 border-4 border-primary/30 rounded-full animate-spin"></div>
          
          {/* Middle pulsing ring */}
          <div className="absolute inset-2 w-28 h-28 border-2 border-blue-400/40 rounded-full animate-pulse"></div>
          
          {/* Logo container */}
          <div className="relative w-32 h-32 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
            {/* Inner glow effect */}
            <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
            
            {/* Game icon */}
            <GamepadIcon className="w-16 h-16 text-white drop-shadow-lg animate-pulse" />
          </div>

          {/* Sparkle effects */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-ping animation-delay-500"></div>
          <div className="absolute top-4 -left-4 w-2 h-2 bg-purple-400 rounded-full animate-ping animation-delay-1000"></div>
        </div>

        {/* Game title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white tracking-wide animate-fade-in">
            TicTac 3x5
          </h1>
          <p className="text-slate-300 text-lg animate-fade-in animation-delay-500">
            Strategic Tic-Tac-Toe Experience
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce animation-delay-200"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce animation-delay-400"></div>
        </div>

        {/* Loading text */}
        <p className="text-slate-400 text-sm animate-pulse">
          Loading your gaming experience...
        </p>

        {/* Made by text */}
        <p className="text-slate-300 text-sm font-semibold animate-fade-in animation-delay-1000 mt-4 bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          Made By DarkLayer Studios
        </p>
      </div>
    </div>
  );
}