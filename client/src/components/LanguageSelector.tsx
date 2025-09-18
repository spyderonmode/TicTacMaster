import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, ChevronDown } from 'lucide-react';
import { useLanguage, useTranslation } from '@/contexts/LanguageContext';
import { languages, Language } from '@/lib/i18n';

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Languages className="w-4 h-4" />
          <span className="text-sm">{languages[language].flag}</span>
          <span className="hidden sm:inline">{languages[language].name}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 z-[9999] bg-slate-800 border border-slate-600 shadow-2xl"
        style={{ zIndex: 9999 }}
        sideOffset={8}
      >
        {Object.entries(languages).map(([code, info]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as Language)}
            className={`flex items-center gap-2 cursor-pointer ${
              language === code ? 'bg-accent' : ''
            }`}
          >
            <span className="text-lg">{info.flag}</span>
            <span className="flex-1">{info.name}</span>
            {language === code && (
              <span className="text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}