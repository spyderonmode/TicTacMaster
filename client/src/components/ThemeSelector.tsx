import { useState, useEffect } from 'react';
import { useTheme, GameTheme } from '@/contexts/ThemeContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Palette, Check, Lock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function ThemeSelector() {
  const { currentTheme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  
  // Fetch theme unlocks from API
  const { data: themeData } = useQuery({
    queryKey: ['/api/themes'],
    enabled: open,
  });
  
  const isThemeUnlocked = (themeId: string) => {
    // Default themes are always unlocked
    const defaultThemes = ['default', 'neon', 'autumn', 'minimalist', 'nature', 'space'];
    if (defaultThemes.includes(themeId)) return true;
    
    // Check if special theme is unlocked
    const specialTheme = themeData?.specialThemes?.find((t: any) => t.id === themeId);
    return specialTheme?.unlocked || false;
  };
  
  const getUnlockRequirement = (themeId: string) => {
    const requirements = {
      halloween: 'Win 10 games in a row',
      christmas: 'Win 20 games total',
      summer: 'Play 100 games total'
    };
    return requirements[themeId as keyof typeof requirements] || '';
  };

  useEffect(() => {
    const handleOpenThemeSelector = () => {
      console.log('Theme selector opening...');
      setOpen(true);
    };

    window.addEventListener('openThemeSelector', handleOpenThemeSelector);
    return () => window.removeEventListener('openThemeSelector', handleOpenThemeSelector);
  }, []);

  const handleThemeSelect = (theme: GameTheme) => {
    if (!isThemeUnlocked(theme)) return; // Don't allow selecting locked themes
    
    setTheme(theme);
    setOpen(false);
    // Close the header sidebar after theme selection
    const closeEvent = new CustomEvent('closeHeaderSidebar');
    window.dispatchEvent(closeEvent);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Theme</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Default Themes */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Default Themes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(themes).filter(([key]) => 
                ['default', 'neon', 'autumn', 'minimalist', 'nature', 'space'].includes(key)
              ).map(([key, theme]) => (
                <Card 
                  key={key} 
                  className={`cursor-pointer transition-all hover:scale-105 ${
                    currentTheme === key ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleThemeSelect(key as GameTheme)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      {theme.name}
                      {currentTheme === key && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{theme.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg ${theme.backgroundColor} ${theme.borderColor} border-2`}>
                      <div className={`grid grid-cols-3 gap-1 ${theme.boardStyle} p-2 rounded`}>
                        {Array.from({ length: 9 }, (_, i) => (
                          <div
                            key={i}
                            className={`aspect-square ${theme.cellStyle} rounded text-xs flex items-center justify-center border`}
                          >
                            {i === 0 ? <span className={theme.playerXColor}>X</span> : 
                             i === 4 ? <span className={theme.playerOColor}>O</span> : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Special Themes */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Special Themes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(themes).filter(([key]) => 
                ['halloween', 'christmas', 'summer'].includes(key)
              ).map(([key, theme]) => {
                const unlocked = isThemeUnlocked(key);
                const requirement = getUnlockRequirement(key);
                
                return (
                  <Card 
                    key={key} 
                    className={`transition-all ${
                      unlocked ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60'
                    } ${currentTheme === key ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => unlocked && handleThemeSelect(key as GameTheme)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {theme.name}
                          {!unlocked && <Lock className="h-4 w-4" />}
                        </div>
                        {currentTheme === key && (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {unlocked ? theme.description : `🔒 ${requirement}`}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className={`p-4 rounded-lg ${theme.backgroundColor} ${theme.borderColor} border-2 ${!unlocked ? 'filter grayscale' : ''}`}>
                        <div className={`grid grid-cols-3 gap-1 ${theme.boardStyle} p-2 rounded`}>
                          {Array.from({ length: 9 }, (_, i) => (
                            <div
                              key={i}
                              className={`aspect-square ${theme.cellStyle} rounded text-xs flex items-center justify-center border`}
                            >
                              {i === 0 ? <span className={theme.playerXColor}>X</span> : 
                               i === 4 ? <span className={theme.playerOColor}>O</span> : 
                               i === 8 ? <span className={theme.playerXColor}>X</span> : ''}
                            </div>
                          ))}
                        </div>
                        <div className={`mt-2 text-xs ${theme.textColor} text-center`}>
                          {unlocked ? 'Preview' : 'Locked'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}