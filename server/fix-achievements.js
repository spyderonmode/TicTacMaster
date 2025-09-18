// Quick script to fix win streak achievements for all users
// This will run the SQL directly to ensure win streak achievements are properly awarded

const { db } = require('./database');
const { users, games, achievements } = require('../shared/schema');
const { eq, and, or, desc, exists } = require('drizzle-orm');

async function fixWinStreakAchievements() {
  console.log('🔧 Starting win streak achievement fix...');
  
  try {
    // Get all users who have games
    const allUsers = await db
      .select({ 
        id: users.id, 
        currentWinStreak: users.currentWinStreak,
        bestWinStreak: users.bestWinStreak,
        wins: users.wins
      })
      .from(users)
      .where(
        exists(
          db.select().from(games).where(
            or(
              eq(games.playerXId, users.id),
              eq(games.playerOId, users.id)
            )
          )
        )
      );

    console.log(`Found ${allUsers.length} users with games`);
    
    let fixedCount = 0;
    
    for (const user of allUsers) {
      const userId = user.id;
      const bestWinStreak = user.bestWinStreak || 0;
      
      console.log(`Processing ${userId}: bestWinStreak=${bestWinStreak}, wins=${user.wins}`);
      
      // Check if user should have win streak achievements
      const shouldHaveWinStreak5 = bestWinStreak >= 5;
      const shouldHaveWinStreak10 = bestWinStreak >= 10;
      
      if (shouldHaveWinStreak5 || shouldHaveWinStreak10) {
        // Check current achievements
        const currentAchievements = await db
          .select()
          .from(achievements)
          .where(eq(achievements.userId, userId));
        
        const hasWinStreak5 = currentAchievements.some(a => a.achievementType === 'win_streak_5');
        const hasWinStreak10 = currentAchievements.some(a => a.achievementType === 'win_streak_10');
        
        let achievementsAdded = [];
        
        // Add missing win_streak_5
        if (shouldHaveWinStreak5 && !hasWinStreak5) {
          try {
            await db
              .insert(achievements)
              .values({
                userId,
                achievementType: 'win_streak_5',
                achievementName: 'winStreakMaster',
                description: 'winFiveConsecutiveGames',
                icon: '🔥',
                metadata: {},
              })
              .onConflictDoNothing();
            achievementsAdded.push('win_streak_5');
            console.log(`✅ Added win_streak_5 for ${userId}`);
          } catch (error) {
            console.error(`❌ Error adding win_streak_5 for ${userId}:`, error);
          }
        }
        
        // Add missing win_streak_10
        if (shouldHaveWinStreak10 && !hasWinStreak10) {
          try {
            await db
              .insert(achievements)
              .values({
                userId,
                achievementType: 'win_streak_10',
                achievementName: 'unstoppable',
                description: 'winTenConsecutiveGames',
                icon: '⚡',
                metadata: {},
              })
              .onConflictDoNothing();
            achievementsAdded.push('win_streak_10');
            console.log(`✅ Added win_streak_10 for ${userId}`);
          } catch (error) {
            console.error(`❌ Error adding win_streak_10 for ${userId}:`, error);
          }
        }
        
        if (achievementsAdded.length > 0) {
          fixedCount++;
          console.log(`🎉 Fixed achievements for ${userId}: ${achievementsAdded.join(', ')}`);
        }
      }
    }
    
    console.log(`🎉 Win streak achievement fix completed! Fixed ${fixedCount} users out of ${allUsers.length} total users.`);
    return { success: true, fixed: fixedCount, total: allUsers.length };
    
  } catch (error) {
    console.error('❌ Error in win streak achievement fix:', error);
    throw error;
  }
}

module.exports = { fixWinStreakAchievements };