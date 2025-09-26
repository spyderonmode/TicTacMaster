/**
 * Level system utilities with tiered progression:
 * - Levels 1-60: 60 wins per level
 * - Levels 61-80: 300 wins per level
 * - Levels 81-100: 700 wins per level
 * - Levels 100+: 1000 wins per level
 */

// Level tier constants
export const TIER_1_WINS_PER_LEVEL = 60;   // Levels 1-60
export const TIER_2_WINS_PER_LEVEL = 300;  // Levels 61-80
export const TIER_3_WINS_PER_LEVEL = 700;  // Levels 81-100
export const TIER_4_WINS_PER_LEVEL = 1000; // Levels 100+

export const TIER_1_MAX_LEVEL = 60;
export const TIER_2_MAX_LEVEL = 80;
export const TIER_3_MAX_LEVEL = 100;

// Calculate total wins needed for tier boundaries
export const TIER_1_TOTAL_WINS = TIER_1_MAX_LEVEL * TIER_1_WINS_PER_LEVEL; // 3600 wins for level 60
export const TIER_2_TOTAL_WINS = TIER_1_TOTAL_WINS + (TIER_2_MAX_LEVEL - TIER_1_MAX_LEVEL) * TIER_2_WINS_PER_LEVEL; // 3600 + 6000 = 9600 wins for level 80
export const TIER_3_TOTAL_WINS = TIER_2_TOTAL_WINS + (TIER_3_MAX_LEVEL - TIER_2_MAX_LEVEL) * TIER_3_WINS_PER_LEVEL; // 9600 + 14000 = 23600 wins for level 100

export const getLevelFromWins = (wins: number): number => {
  const currentWins = wins ?? 0;
  
  if (currentWins < TIER_1_TOTAL_WINS) {
    // Tier 1: Levels 1-60 (60 wins per level)
    return Math.floor(currentWins / TIER_1_WINS_PER_LEVEL);
  } else if (currentWins < TIER_2_TOTAL_WINS) {
    // Tier 2: Levels 61-80 (300 wins per level)
    const remainingWins = currentWins - TIER_1_TOTAL_WINS;
    return TIER_1_MAX_LEVEL + Math.floor(remainingWins / TIER_2_WINS_PER_LEVEL);
  } else if (currentWins < TIER_3_TOTAL_WINS) {
    // Tier 3: Levels 81-100 (700 wins per level)
    const remainingWins = currentWins - TIER_2_TOTAL_WINS;
    return TIER_2_MAX_LEVEL + Math.floor(remainingWins / TIER_3_WINS_PER_LEVEL);
  } else {
    // Tier 4: Levels 100+ (1000 wins per level)
    const remainingWins = currentWins - TIER_3_TOTAL_WINS;
    return TIER_3_MAX_LEVEL + Math.floor(remainingWins / TIER_4_WINS_PER_LEVEL);
  }
};

export const getWinsToNextLevel = (wins: number): number => {
  const currentWins = wins ?? 0;
  const currentLevel = getLevelFromWins(currentWins);
  const totalWinsForNextLevel = getTotalWinsForLevel(currentLevel + 1);
  return totalWinsForNextLevel - currentWins;
};

export const getProgressInCurrentLevel = (wins: number): number => {
  const currentWins = wins ?? 0;
  const currentLevel = getLevelFromWins(currentWins);
  const totalWinsForCurrentLevel = getTotalWinsForLevel(currentLevel);
  return currentWins - totalWinsForCurrentLevel;
};

export const getTotalWinsForLevel = (level: number): number => {
  if (level <= 0) return 0;
  
  if (level <= TIER_1_MAX_LEVEL) {
    // Tier 1: Levels 1-60 (60 wins per level)
    return level * TIER_1_WINS_PER_LEVEL;
  } else if (level <= TIER_2_MAX_LEVEL) {
    // Tier 2: Levels 61-80 (300 wins per level)
    return TIER_1_TOTAL_WINS + (level - TIER_1_MAX_LEVEL) * TIER_2_WINS_PER_LEVEL;
  } else if (level <= TIER_3_MAX_LEVEL) {
    // Tier 3: Levels 81-100 (700 wins per level)
    return TIER_2_TOTAL_WINS + (level - TIER_2_MAX_LEVEL) * TIER_3_WINS_PER_LEVEL;
  } else {
    // Tier 4: Levels 100+ (1000 wins per level)
    return TIER_3_TOTAL_WINS + (level - TIER_3_MAX_LEVEL) * TIER_4_WINS_PER_LEVEL;
  }
};

export const getWinsRequiredForCurrentLevel = (level: number): number => {
  if (level <= 0) return 0;
  
  if (level <= TIER_1_MAX_LEVEL) {
    return TIER_1_WINS_PER_LEVEL;
  } else if (level <= TIER_2_MAX_LEVEL) {
    return TIER_2_WINS_PER_LEVEL;
  } else if (level <= TIER_3_MAX_LEVEL) {
    return TIER_3_WINS_PER_LEVEL;
  } else {
    return TIER_4_WINS_PER_LEVEL;
  }
};