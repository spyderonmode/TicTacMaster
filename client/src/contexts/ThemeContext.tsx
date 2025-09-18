import React, { createContext, useContext, useState, useEffect } from 'react';

export type GameTheme = 'default' | 'neon' | 'autumn' | 'minimalist' | 'nature' | 'space' | 'halloween' | 'christmas' | 'summer';

interface ThemeContextType {
  currentTheme: GameTheme;
  setTheme: (theme: GameTheme) => void;
  themes: Record<GameTheme, {
    name: string;
    description: string;
    boardStyle: string;
    cellStyle: string;
    cellHoverStyle: string;
    playerXColor: string;
    playerOColor: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    winningCellStyle: string;
  }>;
}

const themes = {
  default: {
    name: 'Default',
    description: 'Classic dark theme',
    boardStyle: 'bg-slate-800 border-slate-700',
    cellStyle: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600',
    cellHoverStyle: 'hover:bg-slate-600',
    playerXColor: 'text-blue-400',
    playerOColor: 'text-red-400',
    backgroundColor: 'bg-slate-900',
    textColor: 'text-white',
    borderColor: 'border-slate-700',
    winningCellStyle: 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-400/50'
  },
  neon: {
    name: 'Neon',
    description: 'Cyberpunk neon glow',
    boardStyle: 'bg-black border-cyan-500 shadow-lg shadow-cyan-500/20',
    cellStyle: 'bg-gray-900 border-cyan-400 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-300 hover:shadow-cyan-400/50',
    cellHoverStyle: 'hover:bg-cyan-900/30 hover:border-cyan-300 hover:shadow-cyan-400/50',
    playerXColor: 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    playerOColor: 'text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]',
    backgroundColor: 'bg-black',
    textColor: 'text-cyan-300',
    borderColor: 'border-cyan-500',
    winningCellStyle: 'bg-gradient-to-br from-cyan-400 to-pink-500 shadow-lg shadow-cyan-400/50 border-cyan-300'
  },
  autumn: {
    name: 'Autumn',
    description: 'Warm autumn colors theme',
    boardStyle: 'bg-gradient-to-br from-orange-100 to-amber-100 border-orange-300 shadow-lg shadow-orange-200/50',
    cellStyle: 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 text-orange-900 hover:from-orange-100 hover:to-amber-100 transition-all duration-300',
    cellHoverStyle: 'hover:from-orange-100 hover:to-amber-100 transition-all duration-300',
    playerXColor: 'text-red-700 font-semibold',
    playerOColor: 'text-amber-700 font-semibold',
    backgroundColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
    textColor: 'text-orange-900',
    borderColor: 'border-orange-300',
    winningCellStyle: 'bg-gradient-to-br from-red-200 to-orange-200 shadow-md shadow-red-200/50 border-red-300'
  },
  minimalist: {
    name: 'Minimalist',
    description: 'Clean and simple',
    boardStyle: 'bg-white border-gray-300 shadow-md',
    cellStyle: 'bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100',
    cellHoverStyle: 'hover:bg-gray-100',
    playerXColor: 'text-indigo-600',
    playerOColor: 'text-rose-600',
    backgroundColor: 'bg-gray-50',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    winningCellStyle: 'bg-gradient-to-br from-indigo-100 to-rose-100 border-indigo-300'
  },
  nature: {
    name: 'Nature',
    description: 'Earth tones and natural colors',
    boardStyle: 'bg-green-900 border-green-700 shadow-lg',
    cellStyle: 'bg-green-800 border-green-600 text-green-100 hover:bg-green-700',
    cellHoverStyle: 'hover:bg-green-700',
    playerXColor: 'text-emerald-300',
    playerOColor: 'text-amber-300',
    backgroundColor: 'bg-green-950',
    textColor: 'text-green-100',
    borderColor: 'border-green-700',
    winningCellStyle: 'bg-gradient-to-br from-emerald-400 to-amber-500 shadow-lg shadow-emerald-400/50'
  },
  space: {
    name: 'Space',
    description: 'Deep space adventure',
    boardStyle: 'bg-indigo-950 border-purple-600 shadow-lg shadow-purple-600/20',
    cellStyle: 'bg-indigo-900 border-purple-500 text-purple-100 hover:bg-purple-900/50',
    cellHoverStyle: 'hover:bg-purple-900/50',
    playerXColor: 'text-blue-300 drop-shadow-[0_0_6px_rgba(147,197,253,0.6)]',
    playerOColor: 'text-purple-300 drop-shadow-[0_0_6px_rgba(196,181,253,0.6)]',
    backgroundColor: 'bg-indigo-950',
    textColor: 'text-purple-100',
    borderColor: 'border-purple-600',
    winningCellStyle: 'bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg shadow-blue-400/50'
  },
  halloween: {
    name: 'Halloween',
    description: 'Spooky orange and black theme',
    boardStyle: 'bg-gradient-to-br from-orange-800 to-black border-orange-500 shadow-lg shadow-orange-500/30',
    cellStyle: 'bg-gradient-to-br from-orange-700 to-orange-900 border-orange-600 text-orange-100 hover:from-orange-600 hover:to-orange-800 transition-all duration-300',
    cellHoverStyle: 'hover:from-orange-600 hover:to-orange-800 transition-all duration-300',
    playerXColor: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]',
    playerOColor: 'text-purple-400 drop-shadow-[0_0_8px_rgba(196,181,253,0.8)]',
    backgroundColor: 'bg-gradient-to-br from-orange-900 to-black',
    textColor: 'text-orange-100',
    borderColor: 'border-orange-500',
    winningCellStyle: 'bg-gradient-to-br from-orange-400 to-purple-500 shadow-lg shadow-orange-400/50 border-orange-300'
  },
  christmas: {
    name: 'Christmas',
    description: 'Festive red and green theme',
    boardStyle: 'bg-gradient-to-br from-red-800 to-green-800 border-red-400 shadow-lg shadow-red-400/30',
    cellStyle: 'bg-gradient-to-br from-red-700 to-green-700 border-red-500 text-red-100 hover:from-red-600 hover:to-green-600 transition-all duration-300',
    cellHoverStyle: 'hover:from-red-600 hover:to-green-600 transition-all duration-300',
    playerXColor: 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)]',
    playerOColor: 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]',
    backgroundColor: 'bg-gradient-to-br from-red-900 to-green-900',
    textColor: 'text-red-100',
    borderColor: 'border-red-400',
    winningCellStyle: 'bg-gradient-to-br from-red-400 to-green-400 shadow-lg shadow-red-400/50 border-red-300'
  },
  summer: {
    name: 'Summer',
    description: 'Bright and sunny theme',
    boardStyle: 'bg-gradient-to-br from-yellow-300 to-blue-300 border-yellow-400 shadow-lg shadow-yellow-400/30',
    cellStyle: 'bg-gradient-to-br from-yellow-200 to-blue-200 border-yellow-300 text-yellow-900 hover:from-yellow-100 hover:to-blue-100 transition-all duration-300',
    cellHoverStyle: 'hover:from-yellow-100 hover:to-blue-100 transition-all duration-300',
    playerXColor: 'text-yellow-700 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]',
    playerOColor: 'text-blue-700 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]',
    backgroundColor: 'bg-gradient-to-br from-yellow-100 to-blue-100',
    textColor: 'text-yellow-900',
    borderColor: 'border-yellow-400',
    winningCellStyle: 'bg-gradient-to-br from-yellow-400 to-blue-400 shadow-lg shadow-yellow-400/50 border-yellow-300'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<GameTheme>('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('game-theme') as GameTheme;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const setTheme = (theme: GameTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('game-theme', theme);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}