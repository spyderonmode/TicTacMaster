import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/contexts/LanguageContext";

interface AchievementBadgeProps {
  achievement: {
    id: string;
    achievementType: string;
    achievementName: string;
    description: string;
    icon: string;
    unlockedAt: string;
    metadata?: any;
  };
  size?: 'sm' | 'md' | 'lg';
}

export function AchievementBadge({ achievement, size = 'md' }: AchievementBadgeProps) {
  const { t } = useTranslation();

  // Helper function to get translated achievement name
  const getTranslatedName = (achievementType: string, originalName: string): string => {
    // Check if the original name is a translation key
    if (originalName && !originalName.includes(' ')) {
      return t(originalName);
    }
    
    // Fallback for existing achievement names
    switch (achievementType) {
      case 'first_win':
        return t('firstVictoryTitle');
      case 'win_streak_5':
        return t('winStreakMaster');
      case 'win_streak_10':
        return t('unstoppable');
      case 'master_of_diagonals':
        return t('masterOfDiagonals');
      case 'speed_demon':
        return t('speedDemon');
      case 'veteran_player':
        return t('veteranPlayer');
      case 'comeback_king':
        return t('comebackKing');
      case 'legend':
        return t('legend');
      case 'champion':
        return t('champion');
      case 'grandmaster':
        return t('grandmaster');
      case 'ultimate_veteran':
        return t('ultimateVeteran');
      default:
        return originalName;
    }
  };

  const getTranslatedDescription = (achievementType: string, originalDescription: string): string => {
    // Check if the original description is a translation key
    if (originalDescription && !originalDescription.includes(' ')) {
      return t(originalDescription);
    }
    
    // Fallback for existing achievement descriptions
    switch (achievementType) {
      case 'first_win':
        return t('winYourVeryFirstGame');
      case 'win_streak_5':
        return t('winFiveConsecutiveGames');
      case 'win_streak_10':
        return t('winTenConsecutiveGames');
      case 'master_of_diagonals':
        return t('winThreeGamesDiagonally');
      case 'speed_demon':
        return t('winTwentyTotalGames');
      case 'veteran_player':
        return t('playOneHundredTotalGames');
      case 'comeback_king':
        return t('winAfterLosingFive');
      case 'legend':
        return t('achieveFiftyTotalWins');
      case 'champion':
        return t('achieveOneHundredTotalWins');
      case 'grandmaster':
        return t('achieveTwoHundredTotalWins');
      case 'ultimate_veteran':
        return t('playFiveHundredTotalGames');
      default:
        return originalDescription;
    }
  };
  const sizeClasses = {
    sm: 'w-20 h-20 text-xs',
    md: 'w-28 h-28 text-sm',
    lg: 'w-32 h-32 text-base'
  };

  const iconSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  return (
    <Card className={`${sizeClasses[size]} relative group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-110 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700/50`}>
      <CardContent className="p-3 flex flex-col items-center justify-center h-full">
        <div className={`${iconSizes[size]} mb-2 transform transition-transform duration-300 group-hover:scale-110`}>
          {achievement.icon}
        </div>
        <div className="text-center leading-tight">
          <div className="font-bold text-amber-800 dark:text-amber-200 text-xs truncate w-full">{getTranslatedName(achievement.achievementType, achievement.achievementName)}</div>
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 shadow-2xl border border-gray-700 w-44 max-w-[90vw] pointer-events-none">
          <div className="font-bold text-amber-300 mb-1 text-center text-xs">{getTranslatedName(achievement.achievementType, achievement.achievementName)}</div>
          <div className="text-gray-200 text-xs text-center leading-tight">{getTranslatedDescription(achievement.achievementType, achievement.description)}</div>
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900"></div>
        </div>
      </CardContent>
    </Card>
  );
}