/**
 * Level system utilities
 * Level is calculated as: level = Math.floor(wins / 60)
 * Each level requires 60 wins
 */

export const WINS_PER_LEVEL = 60;

export const getLevelFromWins = (wins: number): number => {
  return Math.floor((wins ?? 0) / 60);
};

export const getWinsToNextLevel = (wins: number): number => {
  const currentWins = wins ?? 0;
  return 60 - (currentWins % 60);
};

export const getProgressInCurrentLevel = (wins: number): number => {
  const currentWins = wins ?? 0;
  return currentWins % 60;
};

export const getTotalWinsForLevel = (level: number): number => {
  return level * 60;
};