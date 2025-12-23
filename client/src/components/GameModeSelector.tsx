import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Users, GamepadIcon, Zap, Brain, Cpu, Sparkles, Crown, Star, Trophy, Swords } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

interface GameModeSelectorProps {
  selectedMode: 'ai' | 'pass-play' | 'online';
  onModeChange: (mode: 'ai' | 'pass-play' | 'online') => void;
  aiDifficulty: 'easy' | 'medium' | 'hard';
  onDifficultyChange: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

export function GameModeSelector({ selectedMode, onModeChange, aiDifficulty, onDifficultyChange }: GameModeSelectorProps) {
  const { t } = useTranslation();

  const modes = [
    {
      id: 'ai' as const,
      name: t('aiMode'),
      icon: Bot,
      description: t('challengeComputer'),
      colors: {
        primary: '#06b6d4',
        secondary: '#3b82f6',
      }
    },
    {
      id: 'pass-play' as const,
      name: t('passPlayMode'),
      icon: GamepadIcon,
      description: t('localMultiplayer'),
      colors: {
        primary: '#10b981',
        secondary: '#059669',
      }
    },
    {
      id: 'online' as const,
      name: t('onlineMode'),
      icon: Users,
      description: t('playWithFriends'),
      colors: {
        primary: '#a855f7',
        secondary: '#ec4899',
      }
    }
  ];

  return (
    <div className="relative">
      <Card className="relative overflow-hidden border-2 border-amber-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl">
        {/* Premium animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Radial gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

          {/* Animated orbs */}
          <div className="absolute top-0 left-1/4 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl animate-orb-float" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl animate-orb-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl animate-pulse" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundImage: `linear-gradient(rgba(251, 191, 36, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 191, 36, 0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-particle-float"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                background: i % 2 === 0 ? '#fbbf24' : '#a855f7',
                left: `${8 + i * 8}%`,
                top: `${15 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${4 + (i % 3)}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>

        {/* Header with premium styling */}
        <CardHeader className="relative z-10 pb-3 pt-5">
          <div className="flex items-center justify-center gap-3">
            {/* Left decorative line */}
            <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-amber-500" />

            <CardTitle className="flex items-center gap-3 px-4">
              <div className="relative">
                <Trophy className="w-7 h-7 text-amber-400 animate-bounce-slow" />
              </div>
              <span className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200">
                {t('gameMode')}
              </span>
              <div className="relative">
                <Swords className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </CardTitle>

            {/* Right decorative line */}
            <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-amber-500/50 to-amber-500" />
          </div>
        </CardHeader>

        <CardContent className="relative z-10 space-y-4 px-5 pb-5">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <div key={mode.id} className="space-y-3">
                {/* Mode button with premium effects */}
                <div className="relative group">
                  {/* Selection glow ring */}
                  {isSelected && (
                    <div 
                      className="absolute -inset-[3px] rounded-2xl animate-border-glow"
                      style={{
                        background: `linear-gradient(90deg, ${mode.colors.primary}, ${mode.colors.secondary}, ${mode.colors.primary})`,
                        backgroundSize: '200% 100%'
                      }}
                    />
                  )}

                  <button
                    onClick={() => onModeChange(mode.id)}
                    data-testid={`card-mode-${mode.id}`}
                    aria-pressed={isSelected}
                    aria-label={`${mode.name} - ${mode.description}`}
                    className={`
                      relative w-full p-5 rounded-xl transition-all duration-500 ease-out overflow-hidden
                      ${isSelected 
                        ? 'bg-slate-900/95 scale-[1.02]' 
                        : 'bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/80'
                      }
                    `}
                  >
                    {/* Inner glow for selected */}
                    {isSelected && (
                      <div 
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `radial-gradient(ellipse at center, ${mode.colors.primary}40 0%, transparent 70%)`
                        }}
                      />
                    )}

                    {/* Animated shine sweep */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent
                      -translate-x-full group-hover:translate-x-full transition-transform duration-1000
                    `} />

                    {/* Floating particles on selected */}
                    {isSelected && [...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full animate-particle-rise"
                        style={{
                          width: '3px',
                          height: '3px',
                          background: mode.colors.primary,
                          left: `${15 + i * 14}%`,
                          bottom: '10%',
                          animationDelay: `${i * 0.2}s`,
                          opacity: 0.8
                        }}
                      />
                    ))}

                    <div className="relative z-10 flex items-center gap-5">
                      {/* Icon container */}
                      <div className="relative">
                        <div 
                          className={`
                            p-4 rounded-xl transition-all duration-500 border
                            ${isSelected 
                              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-white/20' 
                              : 'bg-slate-700/30 border-slate-600/30 group-hover:border-slate-500/50'
                            }
                          `}
                        >
                          <Icon 
                            className={`w-8 h-8 transition-all duration-500 ${isSelected ? 'animate-icon-pulse' : ''}`}
                            style={{ 
                              color: isSelected ? mode.colors.primary : '#94a3b8'
                            }}
                          />
                        </div>
                      </div>

                      {/* Text content */}
                      <div className="flex-1 text-left">
                        <h3 
                          className={`
                            font-bold text-xl transition-all duration-500 mb-1
                            ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}
                          `}
                        >
                          {mode.name}
                        </h3>
                        <p className={`
                          text-sm transition-all duration-300
                          ${isSelected ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-300'}
                        `}>
                          {mode.description}
                        </p>
                      </div>

                      {/* Selection indicator with crown */}
                      <div className={`
                        transition-all duration-500 transform
                        ${isSelected ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 rotate-180'}
                      `}>
                        <div className="relative">
                          <div className="p-2 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500">
                            <Crown className="w-5 h-5 text-slate-900" />
                          </div>
                          {/* Sparkle effects */}
                          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300 animate-spin-slow" />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* AI Difficulty Selector - Premium version */}
                {mode.id === 'ai' && selectedMode === 'ai' && (
                  <div className="relative ml-6 animate-slide-down">
                    {/* Connector line */}
                    <div className="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-cyan-500/50 via-cyan-500/30 to-transparent" />

                    <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="relative">
                          <Brain className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                          {t('difficulty')}
                        </span>
                        <div className="flex-1 h-[1px] bg-gradient-to-r from-cyan-500/30 to-transparent" />
                      </div>

                      <Select value={aiDifficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => onDifficultyChange(value)}>
                        <SelectTrigger className="w-full bg-slate-950/80 border-cyan-500/30 text-white hover:border-cyan-400/60 transition-all duration-300 h-12 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-cyan-500/40 rounded-xl overflow-hidden">
                          <SelectItem value="easy" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20 py-3">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-green-500/20">
                                <Zap className="w-4 h-4 text-green-400" />
                              </div>
                              <span className="font-semibold">{t('easy')}</span>
                              <div className="flex ml-auto gap-0.5">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <Star className="w-4 h-4 text-slate-600" />
                                <Star className="w-4 h-4 text-slate-600" />
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20 py-3">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-yellow-500/20">
                                <Brain className="w-4 h-4 text-yellow-400" />
                              </div>
                              <span className="font-semibold">{t('medium')}</span>
                              <div className="flex ml-auto gap-0.5">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <Star className="w-4 h-4 text-slate-600" />
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="hard" className="text-white hover:bg-cyan-500/20 focus:bg-cyan-500/20 py-3">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-red-500/20">
                                <Cpu className="w-4 h-4 text-red-400" />
                              </div>
                              <span className="font-semibold">{t('hard')}</span>
                              <div className="flex ml-auto gap-0.5">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>

        {/* Custom animations */}
        <style>{`
          @keyframes orb-float {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
            50% { transform: translate(20px, -20px) scale(1.1); opacity: 0.15; }
          }
          @keyframes orb-float-delayed {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.1; }
            50% { transform: translate(-20px, 20px) scale(1.15); opacity: 0.12; }
          }
          @keyframes particle-float {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
            50% { transform: translateY(-15px) rotate(180deg); opacity: 0.8; }
          }
          @keyframes particle-rise {
            0% { transform: translateY(0) scale(1); opacity: 0.8; }
            100% { transform: translateY(-40px) scale(0); opacity: 0; }
          }
          @keyframes border-glow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes icon-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slide-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-orb-float { animation: orb-float 8s ease-in-out infinite; }
          .animate-orb-float-delayed { animation: orb-float-delayed 10s ease-in-out infinite; }
          .animate-particle-float { animation: particle-float 4s ease-in-out infinite; }
          .animate-particle-rise { animation: particle-rise 1.5s ease-out infinite; }
          .animate-border-glow { animation: border-glow 2s linear infinite; }
          .animate-icon-pulse { animation: icon-pulse 2s ease-in-out infinite; }
          .animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
          .animate-spin-slow { animation: spin-slow 4s linear infinite; }
          .animate-slide-down { animation: slide-down 0.3s ease-out; }
        `}</style>
      </Card>
    </div>
  );
}
