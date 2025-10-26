import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Users, GamepadIcon, Zap, Brain, Cpu, CheckCircle2 } from "lucide-react";
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
      gradient: 'from-blue-600 to-cyan-600',
      hoverGradient: 'hover:from-blue-500 hover:to-cyan-500',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400'
    },
    {
      id: 'pass-play' as const,
      name: t('passPlayMode'),
      icon: GamepadIcon,
      description: t('localMultiplayer'),
      gradient: 'from-green-600 to-emerald-600',
      hoverGradient: 'hover:from-green-500 hover:to-emerald-500',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400'
    },
    {
      id: 'online' as const,
      name: t('onlineMode'),
      icon: Users,
      description: t('playWithFriends'),
      gradient: 'from-purple-600 to-pink-600',
      hoverGradient: 'hover:from-purple-500 hover:to-pink-500',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <GamepadIcon className="w-5 h-5 text-purple-400" />
          {t('gameMode')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <div key={mode.id} className="space-y-2">
              <button
                type="button"
                className={`
                  w-full relative overflow-hidden rounded-lg cursor-pointer transition-all duration-300
                  ${isSelected 
                    ? `bg-gradient-to-r ${mode.gradient} border-2 border-white/30 shadow-lg` 
                    : `bg-slate-700/50 border border-slate-600 ${mode.hoverGradient} hover:border-slate-500`
                  }
                `}
                onClick={() => onModeChange(mode.id)}
                data-testid={`card-mode-${mode.id}`}
                aria-pressed={isSelected}
                aria-label={`${mode.name} - ${mode.description}`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative p-4 flex items-center gap-4">
                  {/* Icon Container */}
                  <div className={`
                    ${isSelected ? 'bg-white/20' : mode.iconBg} 
                    p-3 rounded-xl backdrop-blur-sm transition-all duration-300
                    ${!isSelected && 'group-hover:scale-110'}
                  `}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : mode.iconColor}`} />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <div className={`font-bold text-base ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                      {mode.name}
                    </div>
                    <div className={`text-xs sm:text-sm ${isSelected ? 'text-white/90' : 'text-gray-400'}`}>
                      {mode.description}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Shine Effect on Selected */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                )}
              </button>
              
              {/* AI Difficulty Selector */}
              {mode.id === 'ai' && isSelected && (
                <div className="ml-2 mr-2 mt-2 bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">{t('difficulty')}</span>
                  </div>
                  <Select value={aiDifficulty} onValueChange={onDifficultyChange}>
                    <SelectTrigger className="w-full bg-slate-800 border-slate-600 text-white" data-testid="select-ai-difficulty">
                      <SelectValue placeholder={t('difficulty')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="easy" className="text-white hover:bg-slate-700" data-testid="option-difficulty-easy">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span>{t('easy')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="text-white hover:bg-slate-700" data-testid="option-difficulty-medium">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-yellow-400" />
                          <span>{t('medium')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hard" className="text-white hover:bg-slate-700" data-testid="option-difficulty-hard">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-red-400" />
                          <span>{t('hard')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
