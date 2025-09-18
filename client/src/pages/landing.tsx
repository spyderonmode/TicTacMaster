import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GamepadIcon } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ShareButton } from "@/components/ShareButton";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const handleLogin = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <nav className="px-6 py-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <GamepadIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{t('appName')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <ShareButton 
              text={t('shareGameText')}
              variant="ghost"
              size="sm"
            />
            <Button 
              onClick={handleLogin}
              className="bg-primary hover:bg-primary/90"
            >
              {t('getStarted')}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6">
            {t('strategicTicTacToe')}
            <span className="block text-primary">{t('game')}</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            {t('gameDescription')}
          </p>
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
          >
            {t('startPlayingNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}