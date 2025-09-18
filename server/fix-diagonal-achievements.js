import { db } from './db.ts';
import { games, achievements, users } from '../shared/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';

async function checkUserDiagonalWins() {
  const userId = 'e08f9202-f1d0-4adf-abc7-f5fbca314dc3';
  
  console.log(`🔍 Checking diagonal wins for user: ${userId}`);
  
  // Check diagonal wins
  const diagonalWins = await db
    .select()
    .from(games)
    .where(and(
      eq(games.winnerId, userId),
      eq(games.winCondition, 'diagonal')
    ))
    .orderBy(desc(games.finishedAt));
  
  console.log(`🎯 Diagonal wins found: ${diagonalWins.length}`);
  
  if (diagonalWins.length > 0) {
    console.log('🎯 Diagonal wins details:');
    diagonalWins.forEach((game, index) => {
      console.log(`  ${index + 1}. Game ID: ${game.id}, Date: ${game.finishedAt}`);
    });
  }
  
  // Check current achievements
  const currentAchievements = await db
    .select()
    .from(achievements)
    .where(eq(achievements.userId, userId));
  
  console.log(`🏆 Current achievements: ${currentAchievements.length}`);
  const achievementTypes = currentAchievements.map(a => a.achievementType);
  console.log(`🏆 Achievement types:`, achievementTypes);
  
  const hasDiagonalAchievement = achievementTypes.includes('master_of_diagonals');
  console.log(`🎯 Has Master of Diagonals achievement: ${hasDiagonalAchievement}`);
  
  // If user has 3+ diagonal wins but no achievement, create it
  if (diagonalWins.length >= 3 && !hasDiagonalAchievement) {
    console.log(`✅ User qualifies for Master of Diagonals! Creating achievement...`);
    
    const newAchievement = await db
      .insert(achievements)
      .values({
        userId,
        achievementType: 'master_of_diagonals',
        achievementName: 'masterOfDiagonals',
        description: 'winThreeGamesDiagonally',
        icon: '🎯',
        metadata: {},
      })
      .returning();
    
    console.log(`🎉 Created Master of Diagonals achievement:`, newAchievement[0]);
  }
  
  // Check comeback achievement as well
  const recentGames = await db
    .select()
    .from(games)
    .where(or(
      eq(games.playerXId, userId),
      eq(games.playerOId, userId)
    ))
    .orderBy(desc(games.finishedAt))
    .limit(6);
  
  console.log(`🔄 Recent games for comeback check: ${recentGames.length}`);
  
  if (recentGames.length >= 6) {
    const latestGame = recentGames[0];
    const isLatestWin = latestGame.winnerId === userId;
    
    let previousFiveLosses = true;
    for (let i = 1; i < 6; i++) {
      const game = recentGames[i];
      if (game.winnerId === userId || game.winnerId === null) {
        previousFiveLosses = false;
        break;
      }
    }
    
    const qualifiesForComeback = isLatestWin && previousFiveLosses;
    const hasComebackAchievement = achievementTypes.includes('comeback_king');
    
    console.log(`👑 Qualifies for Comeback King: ${qualifiesForComeback}`);
    console.log(`👑 Has Comeback King achievement: ${hasComebackAchievement}`);
    
    if (qualifiesForComeback && !hasComebackAchievement) {
      console.log(`✅ User qualifies for Comeback King! Creating achievement...`);
      
      const newAchievement = await db
        .insert(achievements)
        .values({
          userId,
          achievementType: 'comeback_king',
          achievementName: 'comebackKing',
          description: 'winAfterLosingFive',
          icon: '👑',
          metadata: {},
        })
        .returning();
      
      console.log(`🎉 Created Comeback King achievement:`, newAchievement[0]);
    }
  }
  
  process.exit(0);
}

checkUserDiagonalWins().catch(console.error);