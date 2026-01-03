import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getCurrentLanguage, setCurrentLanguage, initializeLanguage, translations, TranslationKey } from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return getCurrentLanguage() as Language;
    } catch (e) {
      return 'en' as Language;
    }
  });
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    try {
      initializeLanguage();
      const lang = getCurrentLanguage() as Language;
      setLanguageState(lang);
      setIsRTL(lang === ('ar' as any));
      
      if (lang === ('ar' as any)) {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.classList.remove('rtl');
      }
    } catch (e) {
      console.error('Language initialization error:', e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    setLanguageState(lang);
    setIsRTL(lang === ('ar' as any));
    
    // Apply RTL/LTR changes immediately without reload
    if (lang === ('ar' as any)) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.classList.remove('rtl');
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Custom hook for getting translations
export function useTranslation() {
  const { language } = useLanguage();
  
  return {
    t: (key: TranslationKey, variables?: Record<string, string>) => {
      const trans = translations[key] as any;
      let translation = trans?.[language as any] || trans?.en || key;
      
      // Replace variables in the translation
      if (variables) {
        Object.entries(variables).forEach(([varKey, value]) => {
          translation = translation.replace(new RegExp(`{${varKey}}`, 'g'), value);
        });
      }
      
      return translation;
    },
    language
  };
}