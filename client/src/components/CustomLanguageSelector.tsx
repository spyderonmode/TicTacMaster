import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Languages, ChevronDown } from 'lucide-react';
import { useLanguage, useTranslation } from '@/contexts/LanguageContext';
import { languages, Language } from '@/lib/i18n';

export function CustomLanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button 
        ref={buttonRef}
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={handleToggle}
      >
        <Languages className="w-4 h-4" />
        <span className="text-sm">{languages[language].flag}</span>
        <span className="hidden sm:inline">{languages[language].name}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>
      
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl overflow-hidden"
          style={{ 
            zIndex: 10000,
          }}
        >
          <div className="p-1">
            {Object.entries(languages).map(([code, info]) => (
              <div
                key={code}
                onClick={() => handleLanguageChange(code as Language)}
                className={`flex items-center gap-2 cursor-pointer px-2 py-1.5 text-sm rounded-sm transition-colors hover:bg-slate-700 ${
                  language === code ? 'bg-slate-700' : ''
                }`}
              >
                <span className="text-lg">{info.flag}</span>
                <span className="flex-1 text-white">{info.name}</span>
                {language === code && (
                  <span className="text-xs text-gray-400">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}