import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Users, GamepadIcon, Zap, Brain, Cpu } from "lucide-react";
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
      description: t('challengeComputer')
    },
    {
      id: 'pass-play' as const,
      name: t('passPlayMode'),
      icon: GamepadIcon,
      description: t('localMultiplayer')
    },
    {
      id: 'online' as const,
      name: t('onlineMode'),
      icon: Users,
      description: t('playWithFriends')
    }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-lg">{t('gameMode')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;
          
          return (
            <div key={mode.id} className="space-y-2">
              <Button
                variant={isSelected ? "default" : "outline"}
                className={`w-full justify-start p-4 h-auto ${
                  isSelected 
                    ? 'bg-primary hover:bg-primary/90 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 border-slate-600'
                }`}
                onClick={() => onModeChange(mode.id)}
              >
                <Icon className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">{mode.name}</div>
                  <div className="text-sm opacity-75">{mode.description}</div>
                </div>
                {isSelected && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Button>
              
              {mode.id === 'ai' && isSelected && (
                <div className="ml-4 mr-4 mt-2">
                  <Select value={aiDifficulty} onValueChange={onDifficultyChange}>
                    <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder={t('difficulty')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      <SelectItem value="easy" className="text-white hover:bg-slate-700">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-green-400" />
                          <span>{t('easy')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="text-white hover:bg-slate-700">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-yellow-400" />
                          <span>{t('medium')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hard" className="text-white hover:bg-slate-700">
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
