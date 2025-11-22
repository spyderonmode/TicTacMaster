import {
  users,
  rooms,
  games,
  moves,
  roomParticipants,
  blockedUsers,
  achievements,
  userThemes,
  userPieceStyles,
  stickerItems,
  userStickers,
  gameStickerSends,
  avatarFrameItems,
  userAvatarFrames,
  friendRequests,
  friendships,
  roomInvitations,
  coinTransactions,
  playAgainRequests,
  levelUps,
  weeklyLeaderboard,
  weeklyRewards,
  weeklyResetStatus,
  dailyRewards,
  type User,
  type UpsertUser,
  type Room,
  type Game,
  type Move,
  type RoomParticipant,
  type BlockedUser,
  type Achievement,
  type UserTheme,
  type UserPieceStyle,
  type StickerItem,
  type UserSticker,
  type GameStickerSend,
  type AvatarFrameItem,
  type UserAvatarFrame,
  type FriendRequest,
  type Friendship,
  type RoomInvitation,
  type CoinTransaction,
  type PlayAgainRequest,
  type LevelUp,
  type WeeklyLeaderboard,
  type WeeklyReward,
  type WeeklyResetStatus,
  type DailyReward,
  type InsertRoom,
  type InsertGame,
  type InsertMove,
  type InsertRoomParticipant,
  type InsertBlockedUser,
  type InsertAchievement,
  type InsertUserTheme,
  type InsertFriendRequest,
  type InsertFriendship,
  type InsertRoomInvitation,
  type InsertCoinTransaction,
  type InsertPlayAgainRequest,
  type InsertLevelUp,
  type InsertWeeklyLeaderboard,
  type InsertWeeklyReward,
  type InsertWeeklyResetStatus,
  type InsertDailyReward,
  type BasicFriendInfo,
} from "@shared/schema";
import { db } from "./db";
import { getLevelFromWins, getWinsToNextLevel } from "@shared/level";
import { eq, and, desc, count, or, ne, isNull, isNotNull, sql, exists, inArray, lt, gt, not, like, ilike } from "drizzle-orm";

// League earnings multiplier - applied to all weekly leaderboard coin earnings
const LEAGUE_EARNINGS_MULTIPLIER = 2;

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByName(name: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Room operations
  createRoom(room: InsertRoom & { ownerId: string }): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getRoomById(id: string): Promise<Room | undefined>;
  updateRoomStatus(id: string, status: string): Promise<void>;

  // Bet amount operations
  validateUserCanJoinRoom(userId: string, roomId: string): Promise<{ canJoin: boolean; reason?: string }>;
  processRoomBetTransaction(winnerId: string, loserId: string, betAmount: number, gameId: string): Promise<void>;

  // Game operations
  createGame(game: InsertGame): Promise<Game>;
  getGameById(id: string): Promise<Game | undefined>;
  getActiveGameByRoomId(roomId: string): Promise<Game | undefined>;
  updateGameBoard(gameId: string, board: Record<string, string>): Promise<void>;
  updateGameStatus(gameId: string, status: string, winnerId?: string, winCondition?: string): Promise<void>;
  updateCurrentPlayer(gameId: string, currentPlayer: string): Promise<void>;
  getActiveGameForUser(userId: string): Promise<Game | undefined>;
  updateLastMoveTime(gameId: string): Promise<void>;
  finishGame(gameId: string, finishData: { status: string; winningPlayer?: string | null; winningPositions?: number[]; updatedAt: Date }): Promise<void>;

  // Auto-play operations
  enableAutoPlay(gameId: string, player: 'X' | 'O'): Promise<void>;
  disableAutoPlay(gameId: string, player: 'X' | 'O'): Promise<void>;
  getGamesWithInactivePlayers(): Promise<Game[]>;

  // Move operations
  createMove(move: InsertMove): Promise<Move>;
  getGameMoves(gameId: string): Promise<Move[]>;

  // Room participant operations
  addRoomParticipant(participant: InsertRoomParticipant): Promise<RoomParticipant>;
  getRoomParticipants(roomId: string): Promise<(RoomParticipant & { user: User })[]>;
  removeRoomParticipant(roomId: string, userId: string): Promise<void>;
  clearRoomParticipants(roomId: string): Promise<void>;

  // Statistics
  updateUserStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void>;
  getUserStats(userId: string): Promise<{ wins: number; losses: number; draws: number }>;
  getOnlineGameStats(userId: string): Promise<{ wins: number; losses: number; draws: number; totalGames: number; currentWinStreak: number; bestWinStreak: number; level: number; winsToNextLevel: number; coins: number; selectedAchievementBorder?: string | null; achievementsUnlocked: number }>;

  // Blocked Users
  blockUser(blockerId: string, blockedId: string): Promise<BlockedUser>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUsers(userId: string): Promise<BlockedUser[]>;
  isUserBlocked(blockerId: string, blockedId: string): Promise<boolean>;

  // Player Rankings
  getPlayerRankings(sortBy: string): Promise<any[]>;

  // Achievement operations
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  getUserAchievements(userId: string): Promise<Achievement[]>;
  getUserAchievementsFast(userId: string): Promise<Achievement[]>
  hasAchievement(userId: string, achievementType: string): Promise<boolean>;
  checkAndGrantAchievements(userId: string, gameResult: 'win' | 'loss' | 'draw', gameData?: any): Promise<Achievement[]>;

  // Theme operations
  unlockTheme(userId: string, themeName: string): Promise<UserTheme>;
  getUserThemes(userId: string): Promise<UserTheme[]>;
  isThemeUnlocked(userId: string, themeName: string): Promise<boolean>;

  // Piece Style operations
  unlockPieceStyle(userId: string, styleName: string): Promise<UserPieceStyle>;
  getUserPieceStyles(userId: string): Promise<UserPieceStyle[]>;
  getActivePieceStyle(userId: string): Promise<UserPieceStyle | undefined>;
  setActivePieceStyle(userId: string, styleName: string): Promise<UserPieceStyle | null>;
  isPieceStyleUnlocked(userId: string, styleName: string): Promise<boolean>;
  purchasePieceStyle(userId: string, styleName: string, price: number): Promise<{ success: boolean; message: string; style?: UserPieceStyle }>;

  // Friend operations
  sendFriendRequest(requesterId: string, requestedId: string): Promise<FriendRequest>;
  getFriendRequests(userId: string): Promise<(FriendRequest & { requester: User; requested: User })[]>;
  respondToFriendRequest(requestId: string, response: 'accepted' | 'rejected'): Promise<void>;
  getFriends(userId: string): Promise<BasicFriendInfo[]>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  areFriends(userId: string, friendId: string): Promise<boolean>;
  cleanupFriendshipData(): Promise<void>;
  getHeadToHeadStats(userId: string, friendId: string): Promise<{
    totalGames: number;
    userWins: number;
    friendWins: number;
    draws: number;
    userWinRate: number;
    friendWinRate: number;
  }>;

  // Room Invitation operations
  createRoomInvitationsTable(): Promise<void>;
  sendRoomInvitation(roomId: string, inviterId: string, invitedId: string): Promise<RoomInvitation>;
  getRoomInvitations(userId: string): Promise<(RoomInvitation & { room: Room; inviter: User; invited: User })[]>;
  respondToRoomInvitation(invitationId: string, response: 'accepted' | 'rejected'): Promise<void>;
  expireOldInvitations(): Promise<void>;

  // Achievement Border Selection
  updateSelectedAchievementBorder(userId: string, achievementType: string | null): Promise<void>;

  // Coin operations
  createCoinTransaction(transaction: InsertCoinTransaction): Promise<CoinTransaction>;
  getUserCoins(userId: string): Promise<number>;
  updateUserCoins(userId: string, newBalance: number): Promise<void>;
  processCoinTransaction(userId: string, amount: number, type: string, gameId?: string): Promise<void>;

  // Coin gift operations
  sendCoinGift(senderId: string, recipientId: string, amount: number, message?: string): Promise<{ success: boolean; error?: string }>;
  getCoinGiftHistory(userId: string, limit?: number): Promise<Array<CoinTransaction & { sender?: User; recipient?: User }>>;
  getReceivedGifts(userId: string, unreadOnly?: boolean): Promise<Array<CoinTransaction & { sender: User }>>;
  markGiftsAsRead(userId: string, giftIds: string[]): Promise<void>;

  // Play Again operations
  sendPlayAgainRequest(requesterId: string, requestedId: string, gameId: string): Promise<PlayAgainRequest>;
  getPlayAgainRequests(userId: string): Promise<(PlayAgainRequest & { requester: User; requested: User; game: Game })[]>;
  respondToPlayAgainRequest(requestId: string, response: 'accepted' | 'rejected'): Promise<void>;
  expireOldPlayAgainRequests(): Promise<void>;
  getActivePlayAgainRequest(gameId: string, requesterId: string): Promise<PlayAgainRequest | undefined>;

  // Weekly Leaderboard operations
  getOrCreateWeeklyStats(userId: string, weekNumber: number, year: number): Promise<WeeklyLeaderboard>;
  updateWeeklyStats(userId: string, result: 'win' | 'loss' | 'draw', coinsEarned: number): Promise<void>;
  getWeeklyLeaderboard(weekNumber: number, year: number, limit?: number): Promise<Array<WeeklyLeaderboard & { user: User; rank: number }>>;
  getCurrentWeekLeaderboard(limit?: number): Promise<Array<WeeklyLeaderboard & { user: User; rank: number }>>;
  getTimeUntilWeekEnd(): Promise<{ days: number; hours: number; minutes: number; seconds: number }>;
  distributeWeeklyRewards(weekNumber: number, year: number): Promise<WeeklyReward[]>;
  resetWeeklyStats(weekNumber: number, year: number): Promise<void>;
  getWeeklyRewards(userId: string): Promise<WeeklyReward[]>;
  hasReceivedWeeklyReward(userId: string, weekNumber: number, year: number): Promise<boolean>;
  doubleCurrentWeekEarnings(): Promise<{ success: boolean; updatedCount: number }>;

  // Weekly Reset Status operations
  getResetStatus(weekNumber: number, year: number): Promise<WeeklyResetStatus | undefined>;
  createResetStatus(weekNumber: number, year: number): Promise<WeeklyResetStatus>;
  updateResetStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', errorMessage?: string): Promise<void>;
  incrementRetryCount(id: string, nextRetryAt?: Date): Promise<void>;
  getPendingResets(): Promise<WeeklyResetStatus[]>;
  getFailedResets(): Promise<WeeklyResetStatus[]>;
  createWeeklyResetTable(): Promise<void>;

  // Sticker operations
  getAllStickerItems(): Promise<StickerItem[]>;
  getStickerItemById(id: string): Promise<StickerItem | undefined>;
  getUserStickers(userId: string): Promise<(UserSticker & { sticker: StickerItem })[]>;
  hasUserPurchasedSticker(userId: string, stickerId: string): Promise<boolean>;
  purchaseSticker(userId: string, stickerId: string): Promise<{ success: boolean; message: string; sticker?: UserSticker }>;
  sendStickerInGame(gameId: string, senderId: string, recipientId: string, stickerId: string): Promise<GameStickerSend>;
  getGameStickerSends(gameId: string): Promise<(GameStickerSend & { sticker: StickerItem; sender: User })[]>;
  createDefaultStickers(): Promise<void>;
  
  getAllAvatarFrameItems(): Promise<AvatarFrameItem[]>;
  getAvatarFrameItemById(id: string): Promise<AvatarFrameItem | undefined>;
  getUserAvatarFrames(userId: string): Promise<(UserAvatarFrame & { frame: AvatarFrameItem })[]>;
  getActiveAvatarFrame(userId: string): Promise<string | null>;
  hasUserPurchasedAvatarFrame(userId: string, frameId: string): Promise<boolean>;
  purchaseAvatarFrame(userId: string, frameId: string): Promise<{ success: boolean; message: string; frame?: UserAvatarFrame }>;
  setActiveAvatarFrame(userId: string, frameId: string | null): Promise<{ success: boolean; message: string }>;
  createDefaultAvatarFrames(): Promise<void>;

  // Daily Reward operations
  getDailyReward(userId: string): Promise<{ canClaim: boolean; reward: DailyReward | null; nextClaimDate?: Date }>;
  claimDailyReward(userId: string): Promise<{ success: boolean; message: string; reward?: DailyReward; coinsEarned?: number }>;
}

export class DatabaseStorage implements IStorage {
  // Helper function for ISO week calculation
  private getISOWeekInfo(date: Date = new Date()): { weekNumber: number; year: number } {
    const target = new Date(date.getTime());
    // Use UTC to avoid timezone issues
    target.setUTCHours(0, 0, 0, 0);

    // Thursday in current week decides the year
    const thursday = new Date(target.getTime());
    thursday.setUTCDate(target.getUTCDate() - ((target.getUTCDay() + 6) % 7) + 3);

    // January 4th is always in week 1 - use UTC constructor consistently
    const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
    firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);

    const weekNumber = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

    return {
      weekNumber,
      year: thursday.getUTCFullYear()
    };
  }

  // Database initialization
  async createRoomInvitationsTable(): Promise<void> {
    // First create the table without foreign key constraints
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS room_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID NOT NULL,
        inviter_id VARCHAR NOT NULL,
        invited_id VARCHAR NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 seconds'),
        UNIQUE(room_id, invited_id)
      )
    `);

    // Add foreign key constraints if they don't exist
    try {
      await db.execute(sql`
        ALTER TABLE room_invitations 
        ADD CONSTRAINT room_invitations_room_id_fkey 
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      `);
    } catch (e) {
      // Constraint may already exist
    }

    try {
      await db.execute(sql`
        ALTER TABLE room_invitations 
        ADD CONSTRAINT room_invitations_inviter_id_fkey 
        FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (e) {
      // Constraint may already exist
    }

    try {
      await db.execute(sql`
        ALTER TABLE room_invitations 
        ADD CONSTRAINT room_invitations_invited_id_fkey 
        FOREIGN KEY (invited_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (e) {
      // Constraint may already exist
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsersByName(name: string): Promise<User[]> {
    // Sanitize search term to prevent SQL injection
    const sanitizedName = name.replace(/[%_]/g, '\\$&'); // Escape SQL wildcards
    const searchTerm = `%${sanitizedName}%`;

    const usersByName = await db.select().from(users).where(
      or(
        ilike(users.firstName, searchTerm),
        ilike(users.lastName, searchTerm),
        ilike(users.displayName, searchTerm),
        ilike(users.username, searchTerm),
        sql`LOWER(CONCAT(${users.firstName}, ' ', ${users.lastName})) LIKE LOWER(${searchTerm})`
      )
    ).limit(10);
    return usersByName;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if user exists
    const existingUser = await this.getUser(userData.id);

    if (existingUser) {
      // User exists, update only if data is different to avoid foreign key issues
      const shouldUpdate = 
        existingUser.email !== userData.email ||
        existingUser.firstName !== userData.firstName ||
        existingUser.lastName !== userData.lastName ||
        existingUser.displayName !== userData.displayName ||
        existingUser.username !== userData.username ||
        existingUser.profileImageUrl !== userData.profileImageUrl ||
        existingUser.isGuest !== userData.isGuest ||
        existingUser.guestSessionExpiry !== userData.guestSessionExpiry;

      if (shouldUpdate) {
        try {
          const [user] = await db
            .update(users)
            .set({
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              displayName: userData.displayName,
              username: userData.username,
              profileImageUrl: userData.profileImageUrl,
              isGuest: userData.isGuest,
              guestSessionExpiry: userData.guestSessionExpiry,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userData.id))
            .returning();
          return user;
        } catch (error: any) {
          // If foreign key constraint violation, just return existing user
          if (error.code === '23503') {
            //console.log(`⚠️ Foreign key constraint for user ${userData.id}, keeping existing data`);
            return existingUser;
          }
          throw error;
        }
      }
      return existingUser;
    }

    // User doesn't exist, try to insert
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === '23505') { // Unique constraint violation
        if (error.detail?.includes('email') && userData.email) {
          // Email conflict - try to get by email
          const user = await this.getUserByEmail(userData.email);
          if (user) return user;
        }
        if (error.detail?.includes('username') && userData.username) {
          // Username conflict - try to get by username
          const [user] = await db.select().from(users).where(eq(users.username, userData.username));
          if (user) return user;
        }
      }
      // Re-throw if we couldn't handle the conflict
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Room operations
  async createRoom(roomData: InsertRoom & { ownerId: string }): Promise<Room> {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    const [room] = await db
      .insert(rooms)
      .values({
        ...roomData,
        code,
      })
      .returning();
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async getRoomById(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async updateRoomStatus(id: string, status: string): Promise<void> {
    await db.update(rooms).set({ status }).where(eq(rooms.id, id));
  }

  // Bet amount operations
  async validateUserCanJoinRoom(userId: string, roomId: string): Promise<{ canJoin: boolean; reason?: string }> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
    if (!room) {
      return { canJoin: false, reason: "Room not found" };
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return { canJoin: false, reason: "User not found" };
    }

    const userCoins = user.coins || 0;
    const requiredBet = room.betAmount || 50000;

    if (userCoins < requiredBet) {
      return { 
        canJoin: false, 
        reason: `Insufficient coins. You need ${requiredBet.toLocaleString()} coins but only have ${userCoins.toLocaleString()} coins.` 
      };
    }

    return { canJoin: true };
  }

  async processRoomBetTransaction(winnerId: string, loserId: string, betAmount: number, gameId: string): Promise<void> {
    // Get current balances
    const [winner, loser] = await Promise.all([
      db.select().from(users).where(eq(users.id, winnerId)),
      db.select().from(users).where(eq(users.id, loserId))
    ]);

    if (!winner[0] || !loser[0]) {
      throw new Error("Winner or loser not found");
    }

    const winnerCurrentBalance = winner[0].coins || 0;
    const loserCurrentBalance = loser[0].coins || 0;

    // Process in transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Winner gets the bet amount
      await tx.update(users)
        .set({ coins: winnerCurrentBalance + betAmount })
        .where(eq(users.id, winnerId));

      // Record winner transaction
      await tx.insert(coinTransactions).values({
        userId: winnerId,
        gameId: gameId,
        amount: betAmount,
        type: 'room_game_win',
        balanceBefore: winnerCurrentBalance,
        balanceAfter: winnerCurrentBalance + betAmount
      });

      // Loser loses coins only if they have enough balance
      if (loserCurrentBalance >= betAmount) {
        await tx.update(users)
          .set({ coins: loserCurrentBalance - betAmount })
          .where(eq(users.id, loserId));

        // Record loser transaction
        await tx.insert(coinTransactions).values({
          userId: loserId,
          gameId: gameId,
          amount: -betAmount,
          type: 'room_game_loss',
          balanceBefore: loserCurrentBalance,
          balanceAfter: loserCurrentBalance - betAmount
        });
      }
    });
  }

  // Clean up old rooms (older than 30 minutes) SAFELY - only inactive rooms with no active games
  async cleanupOldRooms(): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    try {
      // SAFELY find old rooms that have NO active games AND no recent activity
      const safeToDeleteRooms = await db
        .select({ 
          id: rooms.id, 
          code: rooms.code, 
          createdAt: rooms.createdAt 
        })
        .from(rooms)
        .where(
          and(
            lt(rooms.createdAt, thirtyMinutesAgo),
            // Ensure NO active games in this room using NOT EXISTS
            not(exists(
              db.select()
                .from(games)
                .where(and(
                  eq(games.roomId, rooms.id),
                  eq(games.status, 'active')
                ))
            )),
            // Also ensure no recent activity using NOT EXISTS for recent moves
            not(exists(
              db.select()
                .from(games)
                .where(and(
                  eq(games.roomId, rooms.id),
                  gt(games.lastMoveAt, thirtyMinutesAgo)
                ))
            ))
          )
        );

      if (safeToDeleteRooms.length === 0) {
        return 0;
      }

      const roomIds = safeToDeleteRooms.map(r => r.id);

      // Use transaction for atomic cleanup
      const deletedCount = await db.transaction(async (tx) => {
        // Delete related data in correct order to avoid foreign key violations
        // 1. Delete room participants first
        await tx.delete(roomParticipants).where(inArray(roomParticipants.roomId, roomIds));

        // 2. DETACH games from these rooms instead of deleting them (preserves game history)
        // Extra safety: only detach non-active games
        await tx.update(games)
          .set({ roomId: null })
          .where(and(
            inArray(games.roomId, roomIds),
            ne(games.status, 'active') // Never touch active games
          ));

        // 3. Finally delete the rooms themselves
        const deletedRooms = await tx.delete(rooms)
          .where(inArray(rooms.id, roomIds))
          .returning({ id: rooms.id });

        return deletedRooms.length;
      });

      //console.log(`🧹 Safely cleaned up ${deletedCount} inactive rooms (older than 30 minutes, no active games)`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Error cleaning up old rooms:', error);
      return 0;
    }
  }

  // Game operations
  async createGame(gameData: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(gameData).returning();
    return game;
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getActiveGameByRoomId(roomId: string): Promise<Game | undefined> {
    const [game] = await db
      .select()
      .from(games)
      .where(and(eq(games.roomId, roomId), eq(games.status, "active")))
      .orderBy(desc(games.createdAt));
    return game;
  }

  async updateGameBoard(gameId: string, board: Record<string, string>): Promise<void> {
    await db.update(games).set({ board, lastMoveAt: new Date() }).where(eq(games.id, gameId));
  }

  async updateGameStatus(gameId: string, status: string, winnerId?: string, winCondition?: string): Promise<void> {
    // Get current game status to check if already finished (idempotency)
    const [currentGame] = await db.select().from(games).where(eq(games.id, gameId));
    const wasAlreadyFinished = currentGame?.status === 'finished';

    const updateData: any = { status };
    if (winnerId) updateData.winnerId = winnerId;
    if (winCondition) updateData.winCondition = winCondition;
    if (status === "finished") updateData.finishedAt = new Date();

    await db.update(games).set(updateData).where(eq(games.id, gameId));

    // Check for achievements when game is finished (only if not already finished)
    if (status === 'finished' && !wasAlreadyFinished) {
      const [game] = await db.select().from(games).where(eq(games.id, gameId));
      if (game && game.playerXId && game.playerOId) {
        const gameData = { winCondition, gameId };

        // Check achievements for both players
        if (winnerId) {
          // Define loser ID
          const loserId = winnerId === game.playerXId ? game.playerOId : game.playerXId;

          // Update user stats for winner and loser (only for online games, skip if abandonment since routes.ts handles it) - BEFORE achievements
          if (game.gameMode === 'online' && winCondition !== 'abandonment') {
            await this.updateUserStats(winnerId, 'win');
            await this.updateUserStats(loserId, 'loss');
          }

          // Winner achievements (after stats update to ensure level calculation is accurate)
          await this.checkAndGrantAchievements(winnerId, 'win', gameData);

          // Loser achievements
          await this.checkAndGrantAchievements(loserId, 'loss', gameData);

          // Process coin transactions based on game mode and room
          try {
            //console.log(`💰 Processing coin transactions for game ${gameId} (mode: ${game.gameMode}):`);

            if (game.gameMode === 'ai') {
              // AI games: Winner gets 100 coins (smaller reward for AI practice)
              //console.log(`💰 AI game - Winner: ${winnerId} (+100 coins)`);
              await this.processCoinTransaction(winnerId, 100, 'ai_game_win', gameId);
              //console.log(`💰 Awarded 100 coins to AI game winner: ${winnerId}`);
            } else if (game.gameMode === 'online') {
              // Check if this is a room-based game or matchmaking game
              if (game.roomId) {
                // Room-based game: Use room's bet amount
                const room = await this.getRoomById(game.roomId);
                if (room) {
                  const betAmount = room.betAmount || 50000;
                  //console.log(`💰 Room-based game - Winner: ${winnerId} (+${betAmount} coins), Loser: ${loserId} (-${betAmount} coins)`);

                  await this.processRoomBetTransaction(winnerId, loserId, betAmount, gameId);
                  //console.log(`💰 Processed room bet transaction: ${betAmount} coins`);

                  // Track weekly stats for room games (now includes abandonment wins)
                  try {
                    const loserCoins = await this.getUserCoins(loserId);
                    const actualLoss = loserCoins >= betAmount ? -betAmount : 0;
                    await this.updateWeeklyStats(winnerId, 'win', betAmount);
                    await this.updateWeeklyStats(loserId, 'loss', actualLoss);
                  } catch (error) {
                    //console.error('📊 Error updating weekly stats for room game:', error);
                  }
                }
              } else {
                // Online matchmaking games: Winner gets 1000 coins, loser loses 1000 coins (if sufficient balance)
                //console.log(`💰 Online matchmaking game - Winner: ${winnerId} (+1000 coins), Loser: ${loserId} (-1000 coins)`);

                // Winner always gets coins
                await this.processCoinTransaction(winnerId, 1000, 'online_game_win', gameId);
                //console.log(`💰 Awarded 1000 coins to online game winner: ${winnerId}`);

                // Loser loses coins only if they have enough balance
                const loserCoins = await this.getUserCoins(loserId);
                //console.log(`💰 Loser ${loserId} current balance: ${loserCoins} coins`);

                let loserCoinsLost = 0;
                if (loserCoins >= 1000) {
                  await this.processCoinTransaction(loserId, -1000, 'online_game_loss', gameId);
                  //console.log(`💰 Deducted 1000 coins from loser: ${loserId}`);
                  loserCoinsLost = -1000;
                } else {
                  //console.log(`💰 Loser ${loserId} doesn't have enough coins (${loserCoins}), skipping deduction`);
                }

                // Track weekly stats for online matchmaking games (now includes abandonment wins)
                try {
                  await this.updateWeeklyStats(winnerId, 'win', 1000);
                  await this.updateWeeklyStats(loserId, 'loss', loserCoinsLost);
                } catch (error) {
                  //console.error('📊 Error updating weekly stats:', error);
                }
              }
            } else {
              //console.log(`💰 No coin transactions for game mode: ${game.gameMode}`);
            }
          } catch (error) {
            //console.error('💰 Error processing coin transactions:', error);
          }
        } else {
          // Draw achievements for both players
          await this.checkAndGrantAchievements(game.playerXId, 'draw', gameData);
          await this.checkAndGrantAchievements(game.playerOId, 'draw', gameData);

          // Update user stats for both players (draw, only for online games)
          if (game.gameMode === 'online') {
            await this.updateUserStats(game.playerXId, 'draw');
            await this.updateUserStats(game.playerOId, 'draw');

            // Track weekly stats for online draws (exclude abandonment - though draws shouldn't happen with abandonment)
            if (winCondition !== 'abandonment') {
              try {
                await this.updateWeeklyStats(game.playerXId, 'draw', 0);
                await this.updateWeeklyStats(game.playerOId, 'draw', 0);
              } catch (error) {
                //console.error('📊 Error updating weekly stats for draw:', error);
              }
            }
          }

          // No coin transactions for draws
          //console.log(`💰 Game ${gameId} ended in draw, no coin transactions processed`);
        }
      }
    }
  }

  async updateCurrentPlayer(gameId: string, currentPlayer: string): Promise<void> {
    await db.update(games).set({ currentPlayer, lastMoveAt: new Date() }).where(eq(games.id, gameId));
  }

  async getActiveGameForUser(userId: string): Promise<Game | undefined> {
    const [game] = await db
      .select()
      .from(games)
      .where(and(
        eq(games.status, 'active'),
        or(
          eq(games.playerXId, userId),
          eq(games.playerOId, userId)
        )
      ))
      .orderBy(desc(games.createdAt))
      .limit(1);
    return game;
  }

  async updateLastMoveTime(gameId: string): Promise<void> {
    await db.update(games).set({ lastMoveAt: new Date() }).where(eq(games.id, gameId));
  }

  async getExpiredGames(): Promise<Game[]> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    return await db
      .select()
      .from(games)
      .where(and(
        eq(games.status, 'active'),
        lt(games.lastMoveAt, tenMinutesAgo)
      ));
  }

  async expireGame(gameId: string): Promise<void> {
    await db.update(games).set({ 
      status: 'expired',
      finishedAt: new Date()
    }).where(eq(games.id, gameId));
  }

  // Auto-play implementations
  async enableAutoPlay(gameId: string, player: 'X' | 'O'): Promise<void> {
    const now = new Date();
    const updateData = player === 'X' 
      ? { playerXAutoPlay: true, playerXAutoPlaySince: now }
      : { playerOAutoPlay: true, playerOAutoPlaySince: now };

    await db.update(games).set(updateData).where(eq(games.id, gameId));
  }

  async disableAutoPlay(gameId: string, player: 'X' | 'O'): Promise<void> {
    const updateData = player === 'X' 
      ? { playerXAutoPlay: false, playerXAutoPlaySince: null }
      : { playerOAutoPlay: false, playerOAutoPlaySince: null };

    await db.update(games).set(updateData).where(eq(games.id, gameId));
  }

  async getGamesWithInactivePlayers(): Promise<Game[]> {
    const oneMinuteAgo = new Date(Date.now() - 40 * 1000); // 60 seconds ago
    return await db
      .select()
      .from(games)
      .where(and(
        eq(games.status, 'active'),
        eq(games.gameMode, 'online'), // Only online games need auto-play
        lt(games.lastMoveAt, oneMinuteAgo)
      ));
  }

  async finishGame(gameId: string, finishData: { status: string; winningPlayer?: string | null; winningPositions?: number[]; updatedAt: Date }): Promise<void> {
    // Get current game status to check if already finished (idempotency)
    const [currentGame] = await db.select().from(games).where(eq(games.id, gameId));
    const wasAlreadyFinished = currentGame?.status === 'finished';

    const updateData: any = { 
      status: finishData.status,
      finishedAt: finishData.updatedAt
    };

    if (finishData.winningPlayer) {
      updateData.winnerId = finishData.winningPlayer;
    }

    await db.update(games).set(updateData).where(eq(games.id, gameId));

    // Process achievements, stats, and coins when game is finished (only if not already finished)
    if (finishData.status === 'finished' && !wasAlreadyFinished) {
      const [game] = await db.select().from(games).where(eq(games.id, gameId));
      if (game && game.playerXId && game.playerOId && finishData.winningPlayer) {
        const winnerId = finishData.winningPlayer;
        const loserId = winnerId === game.playerXId ? game.playerOId : game.playerXId;

        // Check achievements for both players
        const gameData = { winCondition: game.winCondition, gameId };
        await this.checkAndGrantAchievements(winnerId, 'win', gameData);
        await this.checkAndGrantAchievements(loserId, 'loss', gameData);

        // Update user stats for winner and loser (only for online games)
        if (game.gameMode === 'online') {
          await this.updateUserStats(winnerId, 'win');
          await this.updateUserStats(loserId, 'loss');
        }

        // Process coin transactions based on game mode
        try {
          //console.log(`💰 Processing coin transactions for game ${gameId} (mode: ${game.gameMode}):`);

          if (game.gameMode === 'ai') {
            // AI games: Winner gets 100 coins (smaller reward for AI practice)
            await this.processCoinTransaction(winnerId, 100, 'ai_game_win', gameId);
          } else if (game.gameMode === 'online') {
            // Online games: Winner gets 1000 coins, loser loses 1000 coins (if sufficient balance)
            //console.log(`💰 Online game - Winner: ${winnerId} (+1000 coins), Loser: ${loserId} (-1000 coins)`);

            // Winner always gets coins
            await this.processCoinTransaction(winnerId, 1000, 'online_game_win', gameId);
            //console.log(`💰 Awarded 100 coins to winner: ${winnerId}`);

            // Loser loses coins only if they have enough balance
            const loserCoins = await this.getUserCoins(loserId);
            //console.log(`💰 Loser ${loserId} current balance: ${loserCoins} coins`);

            let loserCoinsLost = 0;
            if (loserCoins >= 1000) {
              await this.processCoinTransaction(loserId, -1000, 'online_game_loss', gameId);
              //console.log(`💰 Deducted 1000 coins from loser: ${loserId}`);
              loserCoinsLost = -1000;
            } else {
              //console.log(`💰 Loser ${loserId} doesn't have enough coins (${loserCoins}), skipping deduction`);
            }

            // Track weekly stats for online games only
            try {
              await this.updateWeeklyStats(winnerId, 'win', 1000);
              await this.updateWeeklyStats(loserId, 'loss', loserCoinsLost);
            } catch (error) {
              //console.error('📊 Error updating weekly stats:', error);
            }
          }
        } catch (error) {
          //console.error('💰 Error processing coin transactions:', error);
        }
      } else if (game && game.playerXId && game.playerOId && !finishData.winningPlayer) {
        // Draw - check achievements for both players
        const gameData = { winCondition: game.winCondition, gameId };
        await this.checkAndGrantAchievements(game.playerXId, 'draw', gameData);
        await this.checkAndGrantAchievements(game.playerOId, 'draw', gameData);

        // Update user stats for both players (draw, only for online games)
        if (game.gameMode === 'online') {
          await this.updateUserStats(game.playerXId, 'draw');
          await this.updateUserStats(game.playerOId, 'draw');

          // Track weekly stats for online draws (no coins earned/lost)
          try {
            await this.updateWeeklyStats(game.playerXId, 'draw', 0);
            await this.updateWeeklyStats(game.playerOId, 'draw', 0);
          } catch (error) {
            //console.error('📊 Error updating weekly stats for draw:', error);
          }
        }

        // No coin transactions for draws
        //console.log(`💰 Game ${gameId} ended in draw, no coin transactions processed`);
      }
    }
  }

  // Move operations
  async createMove(moveData: InsertMove): Promise<Move> {
    const [move] = await db.insert(moves).values(moveData).returning();
    return move;
  }

  async getGameMoves(gameId: string): Promise<Move[]> {
    return await db
      .select()
      .from(moves)
      .where(eq(moves.gameId, gameId))
      .orderBy(moves.moveNumber);
  }

  // Room participant operations
  async addRoomParticipant(participantData: InsertRoomParticipant): Promise<RoomParticipant> {
    // Check if participant already exists to prevent duplicates
    const existingParticipant = await db
      .select()
      .from(roomParticipants)
      .where(
        and(
          eq(roomParticipants.roomId, participantData.roomId),
          eq(roomParticipants.userId, participantData.userId)
        )
      )
      .limit(1);

    if (existingParticipant.length > 0) {
      // User is already a participant, return existing record
      return existingParticipant[0];
    }

    // User is not a participant yet, add them
    const [participant] = await db.insert(roomParticipants).values(participantData).returning();
    return participant;
  }

  async getRoomParticipants(roomId: string): Promise<(RoomParticipant & { user: User })[]> {
    return await db
      .select({
        id: roomParticipants.id,
        roomId: roomParticipants.roomId,
        userId: roomParticipants.userId,
        role: roomParticipants.role,
        joinedAt: roomParticipants.joinedAt,
        user: users,
      })
      .from(roomParticipants)
      .innerJoin(users, eq(roomParticipants.userId, users.id))
      .where(eq(roomParticipants.roomId, roomId));
  }

  async getActiveRoomParticipation(userId: string): Promise<{ roomId: string; role: string; roomCode: string; roomStatus: string } | null> {
    const result = await db
      .select({
        roomId: roomParticipants.roomId,
        role: roomParticipants.role,
        roomCode: rooms.code,
        roomStatus: rooms.status,
      })
      .from(roomParticipants)
      .innerJoin(rooms, eq(roomParticipants.roomId, rooms.id))
      .where(eq(roomParticipants.userId, userId))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  async removeRoomParticipant(roomId: string, userId: string): Promise<void> {
    await db
      .delete(roomParticipants)
      .where(and(eq(roomParticipants.roomId, roomId), eq(roomParticipants.userId, userId)));
  }

  async clearRoomParticipants(roomId: string): Promise<void> {
    await db
      .delete(roomParticipants)
      .where(eq(roomParticipants.roomId, roomId));
  }

  // Statistics - for game results
  async updateUserStatsFromGame(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    // Calculate current level before updating stats
    const currentLevel = getLevelFromWins(user.wins || 0);

    const updates: any = {};

    // Update basic stats
    if (result === 'win') {
      const newWins = (user.wins || 0) + 1;
      updates.wins = newWins;

      // Update win streak
      const currentStreak = (user.currentWinStreak || 0) + 1;
      updates.currentWinStreak = currentStreak;
      // Update best win streak if current streak is better
      if (currentStreak > (user.bestWinStreak || 0)) {
        updates.bestWinStreak = currentStreak;
      }

      // Check for level up
      const newLevel = getLevelFromWins(newWins);
      if (newLevel > currentLevel) {
        // User leveled up! Record it in the levelUps table
        await this.recordLevelUp(userId, currentLevel, newLevel);
      }
    } else if (result === 'loss') {
      updates.losses = (user.losses || 0) + 1;
      // Reset win streak on loss
      updates.currentWinStreak = 0;
    } else if (result === 'draw') {
      updates.draws = (user.draws || 0) + 1;
      // Reset win streak on draw
      updates.currentWinStreak = 0;
    }

    await db.update(users).set(updates).where(eq(users.id, userId));
  }

  // Method to update user stats based on game result (matches IStorage interface)
  async updateUserStats(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
    //console.log(`📊 Updating user stats: ${userId} -> ${result}`);
    await this.updateUserStatsFromGame(userId, result);
    //console.log(`✅ User stats updated successfully: ${userId} -> ${result}`);
  }

  // Level up management methods
  async recordLevelUp(userId: string, previousLevel: number, newLevel: number): Promise<void> {
    await db.insert(levelUps).values({
      userId,
      previousLevel,
      newLevel,
      acknowledged: false,
    });
    //console.log(`🎉 Level up recorded for user ${userId}: ${previousLevel} → ${newLevel}`);
  }

  async getPendingLevelUps(userId: string): Promise<LevelUp[]> {
    return await db
      .select()
      .from(levelUps)
      .where(and(eq(levelUps.userId, userId), eq(levelUps.acknowledged, false)))
      .orderBy(desc(levelUps.createdAt));
  }

  async acknowledgeLevelUp(levelUpId: string): Promise<void> {
    await db
      .update(levelUps)
      .set({ acknowledged: true })
      .where(eq(levelUps.id, levelUpId));
  }

  async acknowledgeAllLevelUps(userId: string): Promise<void> {
    await db
      .update(levelUps)
      .set({ acknowledged: true })
      .where(and(eq(levelUps.userId, userId), eq(levelUps.acknowledged, false)));
  }

  async getLevelUpById(levelUpId: string): Promise<LevelUp | null> {
    const [levelUp] = await db
      .select()
      .from(levelUps)
      .where(eq(levelUps.id, levelUpId))
      .limit(1);
    return levelUp || null;
  }

  // Helper method to update specific user stats
  async updateSpecificUserStats(userId: string, statsUpdate: { currentWinStreak?: number; bestWinStreak?: number; wins?: number; losses?: number; draws?: number }): Promise<void> {
    await db.update(users).set(statsUpdate).where(eq(users.id, userId));
  }

  // Alias method for getUserGames
  async getUserGames(userId: string): Promise<Game[]> {
    return await db
      .select()
      .from(games)
      .where(or(eq(games.playerXId, userId), eq(games.playerOId, userId)));
  }

  async recalculateUserStats(userId: string): Promise<void> {
    // Get all finished games for this user ordered by finish time
    const userGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.status, 'finished'),
        or(
          eq(games.playerXId, userId),
          eq(games.playerOId, userId)
        )
      ))
      .orderBy(desc(games.finishedAt));

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let currentWinStreak = 0;
    let bestWinStreak = 0;
    let tempStreak = 0;

    // Calculate basic stats and win streaks
    userGames.forEach(game => {
      if (game.winnerId === userId) {
        wins++;
      } else if (game.winnerId === null) {
        draws++;
      } else {
        losses++;
      }
    });

    // Calculate current win streak from most recent games
    for (const game of userGames) {
      if (game.winnerId === userId) {
        currentWinStreak++;
      } else {
        break; // Stop at first non-win
      }
    }

    // Calculate best win streak by going through all games in chronological order
    const chronologicalGames = [...userGames].reverse();
    for (const game of chronologicalGames) {
      if (game.winnerId === userId) {
        tempStreak++;
        if (tempStreak > bestWinStreak) {
          bestWinStreak = tempStreak;
        }
      } else {
        tempStreak = 0; // Reset streak on loss or draw
      }
    }

    // Update user stats in database
    await db.update(users).set({
      wins: wins,
      losses: losses,
      draws: draws,
      currentWinStreak: currentWinStreak,
      bestWinStreak: bestWinStreak
    }).where(eq(users.id, userId));

    // Skip expensive achievement validation during normal stats updates for performance
    // Only run during administrative operations
    // await this.ensureAllAchievementsUpToDate(userId);
  }

  async recalculateAllUserStats(): Promise<void> {
    // Get all users who have played games
    const allUsers = await db
      .select({ id: users.id })
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

    // Recalculating user statistics in background
    for (const user of allUsers) {
      await this.recalculateUserStats(user.id);
    }

    // Recalculating achievements in background
    for (const user of allUsers) {
      await this.recalculateUserAchievements(user.id);
    }
  }

  async resetAllBotStats(): Promise<void> {
    // Reset all bot statistics to zero - only actual gameplay should count
    //console.log('🤖 Resetting all bot statistics to zero...');

    const result = await db
      .update(users)
      .set({
        wins: 0,
        losses: 0,
        draws: 0
      })
      .where(like(users.id, 'player_%'));

    //console.log('🤖 All bot statistics reset to zero - only authentic gameplay will count now');

    // Now recalculate stats based on actual games played
    const botUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          like(users.id, 'player_%'),
          exists(
            db.select().from(games).where(
              or(
                eq(games.playerXId, users.id),
                eq(games.playerOId, users.id)
              )
            )
          )
        )
      );

    //console.log(`🔄 Recalculating authentic stats for ${botUsers.length} bots who have played games...`);

    for (const bot of botUsers) {
      await this.recalculateUserStats(bot.id);
      //console.log(`✅ Updated authentic stats for bot: ${bot.id}`);
    }

    //console.log('🎉 Bot stats now reflect only authentic gameplay!');
  }

  async getUserStats(userId: string): Promise<{ wins: number; losses: number; draws: number }> {
    const user = await this.getUser(userId);
    return {
      wins: user?.wins || 0,
      losses: user?.losses || 0,
      draws: user?.draws || 0,
    };
  }

  async getOnlineGameStats(userId: string): Promise<{ wins: number; losses: number; draws: number; totalGames: number; currentWinStreak: number; bestWinStreak: number; level: number; winsToNextLevel: number; coins: number; selectedAchievementBorder?: string | null; achievementsUnlocked: number }> {
    // Since we're properly updating user stats in the database, just return the user's stats
    // This represents their online game performance since we only update stats for online games
    const user = await this.getUser(userId);
    if (!user) {
      return { wins: 0, losses: 0, draws: 0, totalGames: 0, currentWinStreak: 0, bestWinStreak: 0, level: 0, winsToNextLevel: 10, coins: 2000, selectedAchievementBorder: null, achievementsUnlocked: 0 };
    }

    const wins = user.wins || 0;
    const losses = user.losses || 0;
    const draws = user.draws || 0;
    const currentWinStreak = user.currentWinStreak || 0;
    const bestWinStreak = user.bestWinStreak || 0;

    // Calculate level based on wins (10 wins = 1 level)
    const level = getLevelFromWins(wins);
    const winsToNextLevel = getWinsToNextLevel(wins);

    // Get current coin balance using the same method as coin gifts
    const coins = await this.getUserCoins(userId);

    // Get achievements count
    const userAchievements = await this.getUserAchievements(userId);
    const achievementsUnlocked = userAchievements.length;

    return {
      wins,
      losses,
      draws,
      totalGames: wins + losses + draws,
      currentWinStreak,
      bestWinStreak,
      level,
      winsToNextLevel,
      coins,
      selectedAchievementBorder: user.selectedAchievementBorder,
      achievementsUnlocked
    };
  }

  // Blocked Users methods
  async blockUser(blockerId: string, blockedId: string): Promise<BlockedUser> {
    const [blocked] = await db
      .insert(blockedUsers)
      .values({ blockerId, blockedId })
      .onConflictDoNothing()
      .returning();
    return blocked;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db
      .delete(blockedUsers)
      .where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)));
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    return await db.select().from(blockedUsers).where(eq(blockedUsers.blockerId, userId));
  }

  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [blocked] = await db
      .select()
      .from(blockedUsers)
      .where(and(eq(blockedUsers.blockerId, blockerId), eq(blockedUsers.blockedId, blockedId)));
    return !!blocked;
  }

  async getPlayerRankings(sortBy: string): Promise<any[]> {
    try {
      // Get all users with their online game stats
      const usersWithStats = await db.select({
        userId: users.id,
        displayName: users.displayName,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        wins: users.wins,
        losses: users.losses,
        draws: users.draws,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        sql`${users.wins} + ${users.losses} + ${users.draws} > 0`
      );

      // Calculate rankings with additional metrics
      const rankings = await Promise.all(
        usersWithStats.map(async (user, index) => {
          const totalGames = user.wins + user.losses + user.draws;
          const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0;

          // Get recent games for streak calculation
          const recentGames = await db.select({
            winnerId: games.winnerId,
            status: games.status,
            createdAt: games.createdAt
          })
          .from(games)
          .where(
            and(
              or(
                eq(games.playerXId, user.userId),
                eq(games.playerOId, user.userId)
              ),
              eq(games.gameMode, 'online'),
              eq(games.status, 'finished')
            )
          )
          .orderBy(desc(games.createdAt))
          .limit(10);

          // Calculate current streak
          let streak = 0;
          let streakType: 'win' | 'loss' | 'draw' = 'win';

          if (recentGames.length > 0) {
            const latestGame = recentGames[0];
            if (latestGame.winnerId === user.userId) {
              streakType = 'win';
            } else if (latestGame.winnerId === null) {
              streakType = 'draw';
            } else {
              streakType = 'loss';
            }

            // Count consecutive games with same result
            for (const game of recentGames) {
              let gameResult: 'win' | 'loss' | 'draw';
              if (game.winnerId === user.userId) {
                gameResult = 'win';
              } else if (game.winnerId === null) {
                gameResult = 'draw';
              } else {
                gameResult = 'loss';
              }

              if (gameResult === streakType) {
                streak++;
              } else {
                break;
              }
            }
          }

          return {
            userId: user.userId,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            wins: user.wins,
            losses: user.losses,
            draws: user.draws,
            totalGames,
            winRate,
            streak,
            streakType,
            rankChange: 0, // Would need previous rankings to calculate
            createdAt: user.createdAt
          };
        })
      );

      // Sort rankings based on sortBy parameter
      let sortedRankings;
      switch (sortBy) {
        case 'wins':
          sortedRankings = rankings.sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.winRate - a.winRate; // Secondary sort by win rate
          });
          break;
        case 'totalGames':
          sortedRankings = rankings.sort((a, b) => {
            if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames;
            return b.winRate - a.winRate; // Secondary sort by win rate
          });
          break;
        case 'winRate':
        default:
          sortedRankings = rankings.sort((a, b) => {
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            if (b.totalGames !== a.totalGames) return b.totalGames - a.totalGames; // Secondary sort by total games
            return b.wins - a.wins; // Tertiary sort by wins
          });
          break;
      }

      // Add rank numbers
      return sortedRankings.map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    } catch (error) {
      console.error('Error fetching player rankings:', error);
      throw error;
    }
  }

  // Achievement operations
  async createAchievement(achievementData: InsertAchievement): Promise<Achievement> {
    const [achievement] = await db
      .insert(achievements)
      .values(achievementData)
      .onConflictDoNothing()
      .returning();
    return achievement;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    // First get current achievements
    const currentAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt));

    // Auto-validate achievements if user has any
    if (currentAchievements.length > 0) {
      await this.validateUserAchievements(userId);

      // Get updated achievements after validation
      return await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId))
        .orderBy(desc(achievements.unlockedAt));
    }

    return currentAchievements;
  }


  // PERFORMANCE OPTIMIZATION: Fast achievement fetching without validation for room joins
  async getUserAchievementsFast(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId))
      .orderBy(desc(achievements.unlockedAt))
      .limit(3); // Only get top 3 achievements for performance
  }

  async hasAchievement(userId: string, achievementType: string): Promise<boolean> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .where(and(
        eq(achievements.userId, userId),
        eq(achievements.achievementType, achievementType)
      ));
    return !!achievement;
  }

  async validateUserAchievements(userId: string): Promise<void> {
    try {
      // Get current user stats
      const userStats = await this.getUserStats(userId);
      const totalGames = userStats.wins + userStats.losses + userStats.draws;

      // Get user for win streak data
      const user = await this.getUser(userId);
      const bestWinStreak = user?.bestWinStreak || 0;

      // Get existing achievements
      const existingAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId));

      // Define what achievements should exist
      const shouldHaveAchievements: string[] = [];

       // Calculate current level for level-based achievements
      const currentLevel = getLevelFromWins(userStats.wins);

      if (userStats.wins >= 1) shouldHaveAchievements.push('first_win');
      if (bestWinStreak >= 5) shouldHaveAchievements.push('win_streak_5');
      if (bestWinStreak >= 10) shouldHaveAchievements.push('win_streak_10');
      if (await this.checkDiagonalWins(userId, 3)) shouldHaveAchievements.push('master_of_diagonals');
      if (await this.checkComebackCondition(userId)) shouldHaveAchievements.push('comeback_king');
      if (userStats.wins >= 20) shouldHaveAchievements.push('speed_demon');
      if (userStats.wins >= 50) shouldHaveAchievements.push('legend');
      if (userStats.wins >= 100) shouldHaveAchievements.push('champion');
      if (userStats.wins >= 200) shouldHaveAchievements.push('grandmaster');
      if (currentLevel >= 100) shouldHaveAchievements.push('level_100_master');
      if (totalGames >= 100) shouldHaveAchievements.push('veteran_player');
      if (totalGames >= 500) shouldHaveAchievements.push('ultimate_veteran');

      // Define historical achievements that should never be removed once earned
      const historicalAchievements = ['master_of_diagonals', 'comeback_king'];

      // Check for incorrect achievements, but exclude historical ones from removal
      const incorrectAchievements = existingAchievements.filter(
        achievement => !shouldHaveAchievements.includes(achievement.achievementType) && 
                      !historicalAchievements.includes(achievement.achievementType)
      );

      // Remove incorrect achievements (but preserve historical achievements)
      if (incorrectAchievements.length > 0) {
        // console.log(`🔄 Auto-removing ${incorrectAchievements.length} incorrect achievements for user: ${userId}`);
        await db
          .delete(achievements)
          .where(and(
            eq(achievements.userId, userId),
            inArray(achievements.achievementType, incorrectAchievements.map(a => a.achievementType))
          ));
      }

      // Add missing achievements
      const existingTypes = existingAchievements.map(a => a.achievementType);
      const missingAchievements = shouldHaveAchievements.filter(
        type => !existingTypes.includes(type)
      );

      if (missingAchievements.length > 0) {
        // console.log(`🔄 Auto-adding ${missingAchievements.length} missing achievements for user: ${userId}`);

        const achievementData: Record<string, { name: string; description: string; icon: string }> = {
          'first_win': { name: 'firstVictoryTitle', description: 'winYourVeryFirstGame', icon: '🏆' },
          'win_streak_5': { name: 'winStreakMaster', description: 'winFiveConsecutiveGames', icon: '🔥' },
          'win_streak_10': { name: 'unstoppable', description: 'winTenConsecutiveGames', icon: '⚡' },
          'master_of_diagonals': { name: 'masterOfDiagonals', description: 'winThreeGamesDiagonally', icon: '🎯' },
          'comeback_king': { name: 'comebackKing', description: 'winAfterLosingFive', icon: '👑' },
          'speed_demon': { name: 'speedDemon', description: 'winTwentyTotalGames', icon: '⚡' },
          'legend': { name: 'legend', description: 'achieveFiftyTotalWins', icon: '🌟' },
          'champion': { name: 'champion', description: 'achieveOneHundredTotalWins', icon: '👑' },
          'grandmaster': { name: 'grandmaster', description: 'achieveTwoHundredTotalWins', icon: '💎' },
          'level_100_master': { name: 'level100Master', description: 'reachLevelOneHundred', icon: '🏅' },
          'veteran_player': { name: 'veteranPlayer', description: 'playOneHundredTotalGames', icon: '🎖️' },
          'ultimate_veteran': { name: 'ultimateVeteran', description: 'playFiveHundredTotalGames', icon: '🔥' }
        };

        for (const type of missingAchievements) {
          const data = achievementData[type];
          if (data) {
            await db
              .insert(achievements)
              .values({
                userId,
                achievementType: type,
                achievementName: data.name,
                description: data.description,
                icon: data.icon,
                metadata: {},
              })
              .onConflictDoNothing();
          }
        }
      }
    } catch (error) {
      console.error('Error validating achievements:', error);
    }
  }

  async recalculateUserAchievements(userId: string): Promise<{ removed: number; added: Achievement[] }> {
    try {
      // Recalculating achievements for user

      // Get current user stats
      const userStats = await this.getUserStats(userId);
      // Processing user statistics

      // Get existing achievements count first
      const existingAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId));

      // Processing existing achievements

      // Preserve historical achievements that should never be removed once earned
      const historicalAchievements = ['master_of_diagonals', 'comeback_king'];
      const historicalUserAchievements = existingAchievements.filter(
        achievement => historicalAchievements.includes(achievement.achievementType)
      );

      // Remove only non-historical achievements for this user
      await db
        .delete(achievements)
        .where(and(
          eq(achievements.userId, userId),
          not(inArray(achievements.achievementType, historicalAchievements))
        ));

      const removedCount = existingAchievements.length;
      // Removed existing achievements

      // Define correct achievement conditions based on current stats only
      const newAchievements: Achievement[] = [];

      // Only grant achievements that the user actually qualifies for
      const totalGames = userStats.wins + userStats.losses + userStats.draws;
      // Processing detailed statistics

      // Get user for win streak data
      const user = await this.getUser(userId);
      const bestWinStreak = user?.bestWinStreak || 0;
// Calculate current level for level-based achievements
      const currentLevel = getLevelFromWins(userStats.wins);
      // Check special conditions
      const hasDiagonalWins = await this.checkDiagonalWins(userId, 3);
      const hasComeback = await this.checkComebackCondition(userId);

      const achievementRules = [
        {
          type: 'first_win',
          name: 'firstVictoryTitle',
          description: 'winYourVeryFirstGame',
          icon: '🏆',
          condition: userStats.wins >= 1,
        },
        {
          type: 'win_streak_5',
          name: 'winStreakMaster',
          description: 'winFiveConsecutiveGames',
          icon: '🔥',
          condition: bestWinStreak >= 5,
        },
        {
          type: 'win_streak_10',
          name: 'unstoppable',
          description: 'winTenConsecutiveGames',
          icon: '⚡',
          condition: bestWinStreak >= 10,
        },
        {
          type: 'master_of_diagonals',
          name: 'masterOfDiagonals',
          description: 'winThreeGamesDiagonally',
          icon: '🎯',
          condition: hasDiagonalWins,
        },
        {
          type: 'comeback_king',
          name: 'comebackKing',
          description: 'winAfterLosingFive',
          icon: '👑',
          condition: hasComeback,
        },
        {
          type: 'speed_demon',
          name: 'speedDemon',
          description: 'winTwentyTotalGames',
          icon: '⚡',
          condition: userStats.wins >= 20,
        },
        {
          type: 'legend',
          name: 'legend',
          description: 'achieveFiftyTotalWins',
          icon: '🌟',
          condition: userStats.wins >= 50,
        },
        {
          type: 'champion',
          name: 'champion',
          description: 'achieveOneHundredTotalWins',
          icon: '👑',
          condition: userStats.wins >= 100,
        },
        {
          type: 'level_100_master',
          name: 'level100Master',
          description: 'reachLevelOneHundred',
          icon: '🏅',
          condition: currentLevel >= 100,
        },
        {
          type: 'veteran_player',
          name: 'veteranPlayer',
          description: 'playOneHundredTotalGames',
          icon: '🎖️',
          condition: totalGames >= 100,
        },
        {
          type: 'grandmaster',
          name: 'grandmaster',
          description: 'achieveTwoHundredTotalWins',
          icon: '💎',
          condition: userStats.wins >= 200,
        },
        {
          type: 'ultimate_veteran',
          name: 'ultimateVeteran',
          description: 'playFiveHundredTotalGames',
          icon: '🔥',
          condition: totalGames >= 500,
        },
      ];

      // Get list of existing historical achievements to avoid duplicates
      const existingHistoricalTypes = historicalUserAchievements.map(a => a.achievementType);

      // Grant achievements based on current stats
      for (const rule of achievementRules) {
        if (rule.condition) {
          // Skip historical achievements that already exist
          if (historicalAchievements.includes(rule.type) && existingHistoricalTypes.includes(rule.type)) {
            continue;
          }

          try {
            // Creating achievement

            // Create achievement with direct database insert instead of using createAchievement
            const [newAchievement] = await db
              .insert(achievements)
              .values({
                userId,
                achievementType: rule.type,
                achievementName: rule.name,
                description: rule.description,
                icon: rule.icon,
                metadata: {},
              })
              .returning();

            if (newAchievement) {
              newAchievements.push(newAchievement);
              // Achievement created
            }
          } catch (error) {
            console.error(`❌ Error creating achievement ${rule.type}:`, error);
          }
        }
      }

      // Achievement processing completed
      return { removed: removedCount, added: newAchievements };
    } catch (error) {
      console.error('❌ Error during achievement recalculation:', error);
      throw error;
    }
  }

  async checkAndGrantAchievements(userId: string, gameResult: 'win' | 'loss' | 'draw', gameData?: any): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    // Get user stats
    const userStats = await this.getUserStats(userId);

    // Define achievement conditions
    const achievementConditions = [
      {
        type: 'first_win',
        name: 'firstVictoryTitle',
        description: 'winYourVeryFirstGame',
        icon: '🏆',
        condition: gameResult === 'win' && userStats.wins === 1,
      },
      {
        type: 'win_streak_5',
        name: 'winStreakMaster',
        description: 'winFiveConsecutiveGames',
        icon: '🔥',
        condition: gameResult === 'win' && await this.checkWinStreakAchievement(userId, 5),
      },
      {
        type: 'win_streak_10',
        name: 'unstoppable',
        description: 'winTenConsecutiveGames',
        icon: '⚡',
        condition: gameResult === 'win' && await this.checkWinStreakAchievement(userId, 10),
      },
      {
        type: 'master_of_diagonals',
        name: 'masterOfDiagonals',
        description: 'winThreeGamesDiagonally',
        icon: '🎯',
        condition: gameResult === 'win' && gameData?.winCondition === 'diagonal' && await this.checkDiagonalWins(userId, 3),
      },
      {
        type: 'speed_demon',
        name: 'speedDemon',
        description: 'winTwentyTotalGames',
        icon: '⚡',
        condition: gameResult === 'win' && userStats.wins === 20,
      },
      {
        type: 'veteran_player',
        name: 'veteranPlayer',
        description: 'playOneHundredTotalGames',
        icon: '🎖️',
        condition: (userStats.wins + userStats.losses + userStats.draws) === 100,
      },
      {
        type: 'comeback_king',
        name: 'comebackKing',
        description: 'winAfterLosingFive',
        icon: '👑',
        condition: gameResult === 'win' && await this.checkComebackCondition(userId),
      },
      {
        type: 'legend',
        name: 'legend',
        description: 'achieveFiftyTotalWins',
        icon: '🌟',
        condition: gameResult === 'win' && userStats.wins === 50,
      },
      {
        type: 'champion',
        name: 'champion',
        description: 'achieveOneHundredTotalWins',
        icon: '👑',
        condition: gameResult === 'win' && userStats.wins === 100,
      },
      {
        type: 'level_100_master',
        name: 'level100Master',
        description: 'reachLevelOneHundred',
        icon: '🏅',
        condition: gameResult === 'win' && getLevelFromWins(userStats.wins) >= 100,
      },
      {
        type: 'grandmaster',
        name: 'grandmaster',
        description: 'achieveTwoHundredTotalWins',
        icon: '💎',
        condition: gameResult === 'win' && userStats.wins === 200,
      },
      {
        type: 'ultimate_veteran',
        name: 'ultimateVeteran',
        description: 'playFiveHundredTotalGames',
        icon: '🔥',
        condition: (userStats.wins + userStats.losses + userStats.draws) === 500,
      },
    ];

    // Check each achievement condition
    for (const achievement of achievementConditions) {
      if (achievement.condition && !await this.hasAchievement(userId, achievement.type)) {
        try {
          const newAchievement = await this.createAchievement({
            userId,
            achievementType: achievement.type,
            achievementName: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            metadata: gameData || {},
          });
          if (newAchievement) {
            newAchievements.push(newAchievement);
            //console.log(`🎉 New achievement unlocked for user ${userId}: ${achievement.type}`);

            // Unlock special themes for certain achievements
            if (achievement.type === 'win_streak_10') {
              await this.unlockTheme(userId, 'halloween');
            } else if (achievement.type === 'speed_demon') {
              await this.unlockTheme(userId, 'christmas');
            } else if (achievement.type === 'veteran_player') {
              await this.unlockTheme(userId, 'summer');
              } else if (achievement.type === 'level_100_master') {
              await this.unlockTheme(userId, 'level_100_frame');
            }
          }
        } catch (error) {
          console.error('Error creating achievement:', error);
        }
      }
    }

    // Only run expensive validation during administrative operations, not during normal gameplay
    // await this.ensureAllAchievementsUpToDate(userId); // Commented out to improve move performance

    return newAchievements;
  }

  // New method to ensure all achievements are up to date based on current stats
  async ensureAllAchievementsUpToDate(userId: string): Promise<void> {
    try {
      // console.log(`🔄 Ensuring achievements are up to date for user: ${userId}`);
      const userStats = await this.getUserStats(userId);
      const totalGames = userStats.wins + userStats.losses + userStats.draws;

      // Get user for win streak data
      const user = await this.getUser(userId);
      const bestWinStreak = user?.bestWinStreak || 0;

      // Check diagonal wins count
      const diagonalWinsCount = await this.checkDiagonalWins(userId, 1) ? await this.getDiagonalWinsCount(userId) : 0;

      // Check comeback condition
      const hasComeback = await this.checkComebackCondition(userId);

      // Define all possible achievements that should exist based on current stats
      const allPossibleAchievements = [
        { type: 'first_win', condition: userStats.wins >= 1 },
        { type: 'win_streak_5', condition: bestWinStreak >= 5 },
        { type: 'win_streak_10', condition: bestWinStreak >= 10 },
        { type: 'master_of_diagonals', condition: diagonalWinsCount >= 3 },
        { type: 'comeback_king', condition: hasComeback },
        { type: 'speed_demon', condition: userStats.wins >= 20 },
        { type: 'legend', condition: userStats.wins >= 50 },
        { type: 'champion', condition: userStats.wins >= 100 },
        { type: 'level_100_master', condition: getLevelFromWins(userStats.wins) >= 100 },
        { type: 'grandmaster', condition: userStats.wins >= 200 },
        { type: 'veteran_player', condition: totalGames >= 100 },
        { type: 'ultimate_veteran', condition: totalGames >= 500 },
      ];

      // Track missing achievements
      let missingCount = 0;

      // Check each achievement and grant if missing
      for (const achievement of allPossibleAchievements) {
        if (achievement.condition && !await this.hasAchievement(userId, achievement.type)) {
          missingCount++;
        }
      }

      if (missingCount > 0) {
        //console.log(`🔄 Found ${missingCount} missing achievements for user ${userId}. Running validation...`);
        await this.validateUserAchievements(userId);

        // After validation, check for theme unlocks
        await this.checkThemeUnlocks(userId);

        // Achievement validation completed
      } else {
        // All achievements up to date
      }
    } catch (error) {
      console.error('Error ensuring achievements are up to date:', error);
    }
  }

  private async checkWinStreak(userId: string, requiredStreak: number): Promise<boolean> {
    // First try to get current streak from user record for efficiency
    const user = await db
      .select({ currentWinStreak: users.currentWinStreak })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user[0]?.currentWinStreak >= requiredStreak) {
      return true;
    }

    // Fallback to calculating from games if needed (for backward compatibility)
    const recentGames = await db
      .select()
      .from(games)
      .where(or(
        eq(games.playerXId, userId),
        eq(games.playerOId, userId)
      ))
      .orderBy(desc(games.finishedAt))
      .limit(requiredStreak);

    if (recentGames.length < requiredStreak) return false;

    let streak = 0;
    for (const game of recentGames) {
      if (game.winnerId === userId) {
        streak++;
      } else {
        break;
      }
    }

    return streak >= requiredStreak;
  }

  private async checkWinStreakAchievement(userId: string, requiredStreak: number): Promise<boolean> {
    // Check both current win streak and best win streak for achievement eligibility
    const user = await db
      .select({ 
        currentWinStreak: users.currentWinStreak,
        bestWinStreak: users.bestWinStreak 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const userStats = user[0];
    if (!userStats) return false;

    // User qualifies if they currently have the streak OR have ever achieved it
    return (userStats.currentWinStreak >= requiredStreak) || (userStats.bestWinStreak >= requiredStreak);
  }

  private async checkDiagonalWins(userId: string, requiredWins: number): Promise<boolean> {
    const diagonalWins = await db
      .select()
      .from(games)
      .where(and(
        eq(games.winnerId, userId),
        eq(games.winCondition, 'diagonal')
      ));

    return diagonalWins.length >= requiredWins;
  }

  private async getDiagonalWinsCount(userId: string): Promise<number> {
    const diagonalWins = await db
      .select()
      .from(games)
      .where(and(
        eq(games.winnerId, userId),
        eq(games.winCondition, 'diagonal')
      ));

    return diagonalWins.length;
  }

  private async checkThemeUnlocks(userId: string): Promise<void> {
    try {
      // Get user data to check theme unlock conditions
      const user = await this.getUser(userId);
      if (!user) return;

      // Calculate total games played
      const totalGames = (user.wins || 0) + (user.losses || 0) + (user.draws || 0);

      // Calculate user level from wins
      const { getLevelFromWins } = await import('../shared/level.js');
      const userLevel = getLevelFromWins(user.wins || 0);

      // Check theme unlock conditions based on actual user stats
      // Halloween: 10+ win streak
      if ((user.currentWinStreak || 0) >= 10) {
        await this.unlockTheme(userId, 'halloween');
      }

      // Christmas: 20+ total wins
      if ((user.wins || 0) >= 20) {
        await this.unlockTheme(userId, 'christmas');
      }

      // Summer: 100+ total games played
      if (totalGames >= 100) {
        await this.unlockTheme(userId, 'summer');
      }

      // Level 100 Master: Level 100+
      if (userLevel >= 100) {
        await this.unlockTheme(userId, 'level_100_frame');
      }
    } catch (error) {
      console.error('Error checking theme unlocks:', error);
    }
  }

  private async checkComebackCondition(userId: string): Promise<boolean> {
    const recentGames = await db
      .select()
      .from(games)
      .where(or(
        eq(games.playerXId, userId),
        eq(games.playerOId, userId)
      ))
      .orderBy(desc(games.finishedAt))
      .limit(6);

    if (recentGames.length < 6) return false;

    // Check if latest game is a win
    const latestGame = recentGames[0];
    if (latestGame.winnerId !== userId) return false;

    // Check if previous 5 games were losses
    for (let i = 1; i < 6; i++) {
      const game = recentGames[i];
      if (game.winnerId === userId || game.winnerId === null) {
        return false;
      }
    }

    return true;
  }

  // Theme operations
  async unlockTheme(userId: string, themeName: string): Promise<UserTheme> {
    const [theme] = await db
      .insert(userThemes)
      .values({
        userId,
        themeName,
        isUnlocked: true,
      })
      .onConflictDoUpdate({
        target: [userThemes.userId, userThemes.themeName],
        set: {
          isUnlocked: true,
          unlockedAt: new Date(),
        },
      })
      .returning();
    return theme;
  }

  async getUserThemes(userId: string): Promise<UserTheme[]> {
    return await db
      .select()
      .from(userThemes)
      .where(and(
        eq(userThemes.userId, userId),
        eq(userThemes.isUnlocked, true)
      ))
      .orderBy(desc(userThemes.unlockedAt));
  }

  async isThemeUnlocked(userId: string, themeName: string): Promise<boolean> {
    const [theme] = await db
      .select()
      .from(userThemes)
      .where(and(
        eq(userThemes.userId, userId),
        eq(userThemes.themeName, themeName),
        eq(userThemes.isUnlocked, true)
      ));
    return !!theme;
  }

  // Piece Style operations
  async unlockPieceStyle(userId: string, styleName: string): Promise<UserPieceStyle> {
    const [style] = await db
      .insert(userPieceStyles)
      .values({
        userId,
        styleName,
        isActive: false,
      })
      .onConflictDoUpdate({
        target: [userPieceStyles.userId, userPieceStyles.styleName],
        set: {
          unlockedAt: new Date(),
        },
      })
      .returning();
    return style;
  }

  async getUserPieceStyles(userId: string): Promise<UserPieceStyle[]> {
    return await db
      .select()
      .from(userPieceStyles)
      .where(eq(userPieceStyles.userId, userId))
      .orderBy(desc(userPieceStyles.unlockedAt));
  }

  async getActivePieceStyle(userId: string): Promise<UserPieceStyle | undefined> {
    const [style] = await db
      .select()
      .from(userPieceStyles)
      .where(and(
        eq(userPieceStyles.userId, userId),
        eq(userPieceStyles.isActive, true)
      ));
    return style;
  }

  async setActivePieceStyle(userId: string, styleName: string): Promise<UserPieceStyle | null> {
    // Deactivate all styles for this user first
    await db
      .update(userPieceStyles)
      .set({ isActive: false })
      .where(eq(userPieceStyles.userId, userId));

    // If setting to default, just deactivate all others and return null
    if (styleName === 'default') {
      return null;
    }

    // Activate the selected style
    const [style] = await db
      .update(userPieceStyles)
      .set({ isActive: true })
      .where(and(
        eq(userPieceStyles.userId, userId),
        eq(userPieceStyles.styleName, styleName)
      ))
      .returning();

    if (!style) {
      throw new Error('Piece style not found or not unlocked');
    }

    return style;
  }

  async isPieceStyleUnlocked(userId: string, styleName: string): Promise<boolean> {
    const [style] = await db
      .select()
      .from(userPieceStyles)
      .where(and(
        eq(userPieceStyles.userId, userId),
        eq(userPieceStyles.styleName, styleName)
      ));
    return !!style;
  }

  async purchasePieceStyle(userId: string, styleName: string, price: number): Promise<{ success: boolean; message: string; style?: UserPieceStyle }> {
    try {
      // Check if already unlocked
      const alreadyUnlocked = await this.isPieceStyleUnlocked(userId, styleName);
      if (alreadyUnlocked) {
        return { success: false, message: 'You already own this piece style' };
      }

      // Get user's current coins
      const [user] = await db
        .select({ coins: users.coins })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const currentCoins = user.coins || 0;

      if (currentCoins < price) {
        return { success: false, message: 'Insufficient coins' };
      }

      // Process the transaction atomically
      return await db.transaction(async (tx) => {
        // Deduct coins
        await tx
          .update(users)
          .set({ coins: currentCoins - price })
          .where(eq(users.id, userId));

        // Record the transaction
        await tx.insert(coinTransactions).values({
          userId,
          amount: -price,
          type: 'piece_style_purchase',
          balanceBefore: currentCoins,
          balanceAfter: currentCoins - price,
        });

        // Unlock the piece style
        const [style] = await tx
          .insert(userPieceStyles)
          .values({
            userId,
            styleName,
            isActive: false,
          })
          .returning();

        return { success: true, message: 'Piece style purchased successfully', style };
      });
    } catch (error) {
      console.error('Error purchasing piece style:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to purchase piece style' };
    }
  }

  // Friend operations
  async sendFriendRequest(requesterId: string, requestedId: string): Promise<FriendRequest> {
    // Check if they're already friends
    const alreadyFriends = await this.areFriends(requesterId, requestedId);
    if (alreadyFriends) {
      throw new Error('Users are already friends');
    }

    // Check if friend request already exists (in either direction) - check all statuses
    const existingRequest = await db
      .select()
      .from(friendRequests)
      .where(or(
        and(
          eq(friendRequests.requesterId, requesterId),
          eq(friendRequests.requestedId, requestedId)
        ),
        and(
          eq(friendRequests.requesterId, requestedId),
          eq(friendRequests.requestedId, requesterId)
        )
      ));

    if (existingRequest.length > 0) {
      const request = existingRequest[0];
      if (request.status === 'pending') {
        throw new Error('Friend request already exists');
      } else if (request.status === 'accepted') {
        // This should not happen if friendship was properly removed, but clean it up
        await db
          .delete(friendRequests)
          .where(eq(friendRequests.id, request.id));
        console.log('Cleaned up orphaned accepted friend request');
      } else if (request.status === 'rejected') {
        // Allow new request if previous was rejected
        // Delete the old rejected request first
        await db
          .delete(friendRequests)
          .where(eq(friendRequests.id, request.id));
      }
    }

    // Try to insert with error handling for constraint violations
    try {
      const [friendRequest] = await db
        .insert(friendRequests)
        .values({
          requesterId,
          requestedId,
        })
        .returning();

      return friendRequest;
    } catch (error: any) {
      // Handle constraint violations
      if (error.code === '23505') {
        // Unique constraint violation - friend request already exists
        throw new Error('Friend request already exists');
      }
      // Re-throw other errors
      throw error;
    }
  }

  async getFriendRequests(userId: string): Promise<(FriendRequest & { requester: User; requested: User })[]> {
    return await db
      .select({
        id: friendRequests.id,
        requesterId: friendRequests.requesterId,
        requestedId: friendRequests.requestedId,
        status: friendRequests.status,
        sentAt: friendRequests.sentAt,
        respondedAt: friendRequests.respondedAt,
        requester: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        requested: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(friendRequests)
      .leftJoin(users, eq(friendRequests.requesterId, users.id))
      .where(and(
        eq(friendRequests.requestedId, userId),
        eq(friendRequests.status, 'pending')
      ))
      .orderBy(desc(friendRequests.sentAt));
  }

  async respondToFriendRequest(requestId: string, response: 'accepted' | 'rejected'): Promise<void> {
    const [request] = await db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.id, requestId));

    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Friend request already responded to');
    }

    // Update friend request status
    await db
      .update(friendRequests)
      .set({
        status: response,
        respondedAt: new Date(),
      })
      .where(eq(friendRequests.id, requestId));

    // If accepted, create friendship
    if (response === 'accepted') {
      const user1Id = request.requesterId < request.requestedId ? request.requesterId : request.requestedId;
      const user2Id = request.requesterId < request.requestedId ? request.requestedId : request.requesterId;

      await db
        .insert(friendships)
        .values({
          user1Id,
          user2Id,
        })
        .onConflictDoNothing();
    }
  }

  async getFriends(userId: string): Promise<BasicFriendInfo[]> {
    const friends = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      })
      .from(friendships)
      .innerJoin(users, or(
        and(eq(friendships.user1Id, userId), eq(friendships.user2Id, users.id)),
        and(eq(friendships.user2Id, userId), eq(friendships.user1Id, users.id))
      ))
      .where(or(
        eq(friendships.user1Id, userId),
        eq(friendships.user2Id, userId)
      ))
      .orderBy(desc(friendships.becameFriendsAt));

    return friends.filter(friend => friend.id !== null).map(friend => ({
      id: friend.id!,
      username: friend.username,
      displayName: friend.displayName,
      firstName: friend.firstName,
      lastName: friend.lastName,
      profileImageUrl: friend.profileImageUrl,
    }));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    // Delete the friendship record
    await db
      .delete(friendships)
      .where(or(
        and(eq(friendships.user1Id, userId), eq(friendships.user2Id, friendId)),
        and(eq(friendships.user1Id, friendId), eq(friendships.user2Id, userId))
      ));

    // Also delete any accepted friend requests between these users
    await db
      .delete(friendRequests)
      .where(or(
        and(
          eq(friendRequests.requesterId, userId),
          eq(friendRequests.requestedId, friendId),
          eq(friendRequests.status, 'accepted')
        ),
        and(
          eq(friendRequests.requesterId, friendId),
          eq(friendRequests.requestedId, userId),
          eq(friendRequests.status, 'accepted')
        )
      ));
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(or(
        and(eq(friendships.user1Id, userId), eq(friendships.user2Id, friendId)),
        and(eq(friendships.user1Id, friendId), eq(friendships.user2Id, userId))
      ));

    return !!friendship;
  }

  async cleanupFriendshipData(): Promise<void> {
    try {
      // Clean up accepted friend requests that don't have corresponding friendships
      const acceptedRequests = await db
        .select()
        .from(friendRequests)
        .where(eq(friendRequests.status, 'accepted'));

      for (const request of acceptedRequests) {
        const friendshipExists = await this.areFriends(request.requesterId, request.requestedId);

        if (!friendshipExists) {
          // Delete orphaned accepted friend request instead of creating friendship
          // This prevents the "already friends" error when trying to send new requests
          await db
            .delete(friendRequests)
            .where(eq(friendRequests.id, request.id));

          //console.log(`Removed orphaned accepted friend request for users: ${request.requesterId} and ${request.requestedId}`);
        }
      }

      // Clean up friend requests that have friendships but are still marked as pending
      const friendshipsList = await db.select().from(friendships);

      for (const friendship of friendshipsList) {
        // Check for pending requests between these friends
        const pendingRequests = await db
          .select()
          .from(friendRequests)
          .where(and(
            or(
              and(
                eq(friendRequests.requesterId, friendship.user1Id),
                eq(friendRequests.requestedId, friendship.user2Id)
              ),
              and(
                eq(friendRequests.requesterId, friendship.user2Id),
                eq(friendRequests.requestedId, friendship.user1Id)
              )
            ),
            eq(friendRequests.status, 'pending')
          ));

        // Update pending requests to accepted since friendship exists
        for (const request of pendingRequests) {
          await db
            .update(friendRequests)
            .set({
              status: 'accepted',
              respondedAt: new Date(),
            })
            .where(eq(friendRequests.id, request.id));

          //console.log(`Updated pending request to accepted for users: ${request.requesterId} and ${request.requestedId}`);
        }
      }

      console.log('Friendship data cleanup completed');
    } catch (error) {
      console.error('Error during friendship data cleanup:', error);
    }
  }

  async getHeadToHeadStats(userId: string, friendId: string): Promise<{
    totalGames: number;
    userWins: number;
    friendWins: number;
    draws: number;
    userWinRate: number;
    friendWinRate: number;
  }> {
    const headToHeadGames = await db
      .select()
      .from(games)
      .where(and(
        eq(games.gameMode, 'online'),
        eq(games.status, 'finished'),
        or(
          and(eq(games.playerXId, userId), eq(games.playerOId, friendId)),
          and(eq(games.playerXId, friendId), eq(games.playerOId, userId))
        )
      ));

    const totalGames = headToHeadGames.length;
    let userWins = 0;
    let friendWins = 0;
    let draws = 0;

    headToHeadGames.forEach(game => {
      if (game.winnerId === userId) {
        userWins++;
      } else if (game.winnerId === friendId) {
        friendWins++;
      } else {
        draws++;
      }
    });

    const userWinRate = totalGames > 0 ? Math.round((userWins / totalGames) * 100) : 0;
    const friendWinRate = totalGames > 0 ? Math.round((friendWins / totalGames) * 100) : 0;

    return {
      totalGames,
      userWins,
      friendWins,
      draws,
      userWinRate,
      friendWinRate,
    };
  }

  // Room Invitation operations
  async sendRoomInvitation(roomId: string, inviterId: string, invitedId: string): Promise<RoomInvitation> {
    // First, clean up expired invitations
    await this.expireOldInvitations();

    // Remove any existing invitations for this room and user (regardless of status)
    // This ensures we can always send a new invitation
    await db
      .delete(roomInvitations)
      .where(
        and(
          sql`${roomInvitations.roomId}::text = ${roomId}`,
          sql`${roomInvitations.invitedId} = ${invitedId}`
        )
      );

    // Check if active invitation already exists (not expired) - this should now be unnecessary but kept as safety check
    const existingInvitation = await db
      .select()
      .from(roomInvitations)
      .where(
        and(
          sql`${roomInvitations.roomId}::text = ${roomId}`,
          sql`${roomInvitations.invitedId} = ${invitedId}`,
          eq(roomInvitations.status, 'pending'),
          sql`${roomInvitations.expiresAt} > NOW()`
        )
      );

    if (existingInvitation.length > 0) {
      throw new Error('Invitation already sent to this user for this room');
    }

    // Create expiration date (30 seconds from now)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + 30);

    const [invitation] = await db
      .insert(roomInvitations)
      .values({
        roomId,
        inviterId,
        invitedId,
        expiresAt,
      })
      .returning();

    return invitation;
  }

  async getRoomInvitations(userId: string): Promise<(RoomInvitation & { room: Room; inviter: User; invited: User })[]> {
    // First, clean up expired invitations
    await this.expireOldInvitations();
    const invitations = await db
      .select({
        id: roomInvitations.id,
        roomId: roomInvitations.roomId,
        inviterId: roomInvitations.inviterId,
        invitedId: roomInvitations.invitedId,
        status: roomInvitations.status,
        invitedAt: roomInvitations.invitedAt,
        respondedAt: roomInvitations.respondedAt,
        expiresAt: roomInvitations.expiresAt,
        room: rooms,
        inviter: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        invited: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        }
      })
      .from(roomInvitations)
      .innerJoin(rooms, sql`${roomInvitations.roomId}::text = ${rooms.id}::text`)
      .innerJoin(users, sql`${roomInvitations.inviterId} = ${users.id}`)
      .where(
        and(
          sql`${roomInvitations.invitedId} = ${userId}`,
          eq(roomInvitations.status, 'pending'),
          sql`${roomInvitations.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(roomInvitations.invitedAt));

    return invitations.map(inv => ({
      ...inv,
      inviter: inv.inviter,
      invited: inv.invited
    }));
  }

  async respondToRoomInvitation(invitationId: string, response: 'accepted' | 'rejected'): Promise<void> {
    // Clean up expired invitations first
    await this.expireOldInvitations();

    await db
      .update(roomInvitations)
      .set({
        status: response,
        respondedAt: new Date(),
      })
      .where(sql`${roomInvitations.id}::text = ${invitationId}`);
  }

  async expireOldInvitations(): Promise<void> {
    try {
      // Update expired invitations to 'expired' status
      await db
        .update(roomInvitations)
        .set({ 
          status: 'expired',
          respondedAt: sql`NOW()`
        })
        .where(
          and(
            eq(roomInvitations.status, 'pending'),
            sql`${roomInvitations.expiresAt} <= NOW()`
          )
        );
    } catch (error) {
      console.error('Error expiring old invitations:', error);
    }
  }

  async updateSelectedAchievementBorder(userId: string, achievementType: string | null): Promise<void> {
    try {
      await db
        .update(users)
        .set({ 
          selectedAchievementBorder: achievementType,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating selected achievement border:', error);
      throw error;
    }
  }

  // Coin operations
  async createCoinTransaction(transaction: InsertCoinTransaction): Promise<CoinTransaction> {
    const [coinTransaction] = await db.insert(coinTransactions).values(transaction).returning();
    return coinTransaction;
  }

  async getUserCoins(userId: string): Promise<number> {
    const [user] = await db.select({ coins: users.coins }).from(users).where(eq(users.id, userId));
    return user?.coins ?? 2000;
  }

  async updateUserCoins(userId: string, newBalance: number): Promise<void> {
    await db.update(users).set({ 
      coins: newBalance,
      updatedAt: new Date()
    }).where(eq(users.id, userId));
  }

  async processCoinTransaction(userId: string, amount: number, type: string, gameId?: string): Promise<void> {
    const currentCoins = await this.getUserCoins(userId);
    const newBalance = currentCoins + amount;

    // Try to create transaction record, but continue if it fails (missing table)
    try {
      await this.createCoinTransaction({
        userId,
        gameId,
        amount,
        type,
        balanceBefore: currentCoins,
        balanceAfter: newBalance
      });
    } catch (error) {
      //console.log('Coin transaction record failed (table may not exist), continuing with balance update:', error);
    }

    // Update user's coin balance
    await this.updateUserCoins(userId, newBalance);
  }

  // Coin gift operations
  async sendCoinGift(senderId: string, recipientId: string, amount: number, message?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate amount
      if (amount <= 0) {
        return { success: false, error: "Gift amount must be greater than 0" };
      }

      // Check if sender has enough coins
      const senderCoins = await this.getUserCoins(senderId);
      if (senderCoins < amount) {
        return { success: false, error: "Insufficient coins to send gift" };
      }

      // Check if recipient exists
      const recipient = await this.getUser(recipientId);
      if (!recipient) {
        return { success: false, error: "Recipient not found" };
      }

      // Check if users are friends
      const areFriends = await this.areFriends(senderId, recipientId);
      if (!areFriends) {
        return { success: false, error: "You can only send gifts to friends" };
      }

      // Use atomic database transaction for secure transfer
      await db.transaction(async (tx) => {
        // Get current balances within transaction
        const senderBalance = await tx.select({ coins: users.coins }).from(users).where(eq(users.id, senderId)).then(rows => rows[0]?.coins || 0);
        const recipientBalance = await tx.select({ coins: users.coins }).from(users).where(eq(users.id, recipientId)).then(rows => rows[0]?.coins || 0);

        // Double-check sufficient balance within transaction
        if (senderBalance < amount) {
          throw new Error("Insufficient coins to send gift");
        }

        // Calculate new balances
        const senderBalanceAfter = senderBalance - amount;
        const recipientBalanceAfter = recipientBalance + amount;

        // Ensure sender balance never goes negative
        if (senderBalanceAfter < 0) {
          throw new Error("Transfer would result in negative balance");
        }

        // Create transaction records
        await tx.insert(coinTransactions).values({
          id: crypto.randomUUID(),
          userId: senderId,
          amount: -amount,
          type: 'gift_sent',
          balanceBefore: senderBalance,
          balanceAfter: senderBalanceAfter,
          recipientId: recipientId,
          giftMessage: message,
          createdAt: new Date()
        });

        await tx.insert(coinTransactions).values({
          id: crypto.randomUUID(),
          userId: recipientId,
          amount: amount,
          type: 'gift_received',
          balanceBefore: recipientBalance,
          balanceAfter: recipientBalanceAfter,
          senderId: senderId,
          giftMessage: message,
          createdAt: new Date()
        });

        // Update user balances atomically
        await tx.update(users).set({ coins: senderBalanceAfter }).where(eq(users.id, senderId));
        await tx.update(users).set({ coins: recipientBalanceAfter }).where(eq(users.id, recipientId));
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending coin gift:', error);
      return { success: false, error: error instanceof Error ? error.message : "Failed to send gift" };
    }
  }

  async getCoinGiftHistory(userId: string, limit: number = 50): Promise<Array<CoinTransaction & { sender?: User; recipient?: User }>> {
    try {
      const transactions = await db
        .select({
          transaction: coinTransactions,
          sender: users,
          recipient: users
        })
        .from(coinTransactions)
        .leftJoin(users, eq(coinTransactions.senderId, users.id))
        .leftJoin(users, eq(coinTransactions.recipientId, users.id))
        .where(
          and(
            eq(coinTransactions.userId, userId),
            or(
              eq(coinTransactions.type, 'gift_sent'),
              eq(coinTransactions.type, 'gift_received')
            )
          )
        )
        .orderBy(desc(coinTransactions.createdAt))
        .limit(limit);

      return transactions.map(row => ({
        ...row.transaction,
        sender: row.sender || undefined,
        recipient: row.recipient || undefined
      }));
    } catch (error) {
      console.error('Error fetching gift history:', error);
      return [];
    }
  }

  async getReceivedGifts(userId: string, unreadOnly: boolean = false): Promise<Array<CoinTransaction & { sender: User }>> {
    try {
      const query = db
        .select({
          transaction: coinTransactions,
          sender: users
        })
        .from(coinTransactions)
        .innerJoin(users, eq(coinTransactions.senderId, users.id))
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.type, 'gift_received')
          )
        )
        .orderBy(desc(coinTransactions.createdAt));

      const transactions = await query;

      return transactions.map(row => ({
        ...row.transaction,
        sender: row.sender
      }));
    } catch (error) {
      console.error('Error fetching received gifts:', error);
      return [];
    }
  }

  async markGiftsAsRead(userId: string, giftIds: string[]): Promise<void> {
    try {
      // For now, we don't have a read status in the schema
      // This method is prepared for future implementation
      // when we add a 'read' field to coin transactions
    } catch (error) {
      console.error('Error marking gifts as read:', error);
    }
  }


  async getPlayerProfile(playerId: string): Promise<{
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    wins: number;
    losses: number;
    draws: number;
    totalGames: number;
    coins: number;
    level: number;
    winsToNextLevel: number;
    currentWinStreak: number;
    bestWinStreak: number;
    createdAt: string;
    selectedAchievementBorder?: string;
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      unlockedAt: string;
    }>;
  } | null> {
    try {
      // Get user data
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, playerId))
        .limit(1);

      if (user.length === 0) {
        return null;
      }

      const userData = user[0];

      // Get user achievements
      const userAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, playerId))
        .orderBy(desc(achievements.unlockedAt));

      const totalGames = (userData.wins || 0) + (userData.losses || 0) + (userData.draws || 0);
      const wins = userData.wins || 0;
      const level = getLevelFromWins(wins);
      const winsToNextLevel = getWinsToNextLevel(wins);

      return {
        id: userData.id,
        username: userData.username || 'Unknown',
        displayName: userData.displayName || userData.username || 'Unknown',
        profileImageUrl: userData.profileImageUrl || undefined,
        wins: wins,
        losses: userData.losses || 0,
        draws: userData.draws || 0,
        totalGames,
        coins: userData.coins ?? 2000,
        level: level,
        winsToNextLevel: winsToNextLevel,
        currentWinStreak: userData.currentWinStreak || 0,
        bestWinStreak: userData.bestWinStreak || 0,
        createdAt: userData.createdAt?.toISOString() || new Date().toISOString(),
        selectedAchievementBorder: userData.selectedAchievementBorder || undefined,
        achievements: userAchievements.map(achievement => ({
          id: achievement.id,
          name: achievement.achievementName,
          description: achievement.description,
          icon: achievement.icon,
          unlockedAt: achievement.unlockedAt?.toISOString() || new Date().toISOString()
        }))
      };
    } catch (error) {
      console.error('Error fetching player profile:', error);
      throw error;
    }
  }

  async getDetailedHeadToHeadStats(currentUserId: string, targetUserId: string): Promise<{
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    recentGames: Array<{
      id: string;
      result: 'win' | 'loss' | 'draw';
      playedAt: string;
    }>;
  }> {
    try {
      // Get all games where both players participated
      const gamesQuery = await db
        .select()
        .from(games)
        .where(
          and(
            eq(games.status, 'finished'),
            or(
              and(eq(games.playerXId, currentUserId), eq(games.playerOId, targetUserId)),
              and(eq(games.playerXId, targetUserId), eq(games.playerOId, currentUserId))
            )
          )
        )
        .orderBy(desc(games.createdAt))
        .limit(50); // Get last 50 games for recent games section

      let wins = 0;
      let losses = 0;
      let draws = 0;
      const recentGames: Array<{ id: string; result: 'win' | 'loss' | 'draw'; playedAt: string }> = [];

      for (const game of gamesQuery) {
        let result: 'win' | 'loss' | 'draw';

        if (!game.winnerId) {
          result = 'draw';
          draws++;
        } else if (game.winnerId === currentUserId) {
          result = 'win';
          wins++;
        } else {
          result = 'loss';
          losses++;
        }

        recentGames.push({
          id: game.id,
          result,
          playedAt: game.createdAt || new Date().toISOString()
        });
      }

      const totalGames = wins + losses + draws;
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      return {
        totalGames,
        wins,
        losses,
        draws,
        winRate,
        recentGames: recentGames.slice(0, 10) // Return only 10 most recent games
      };
    } catch (error) {
      console.error('Error fetching head-to-head stats:', error);
      throw error;
    }
  }

  // Play Again operations
  async sendPlayAgainRequest(requesterId: string, requestedId: string, gameId: string): Promise<PlayAgainRequest> {
    // Clean up any existing requests from this game first to prevent duplicates
    await db.delete(playAgainRequests).where(
      and(
        eq(playAgainRequests.gameId, gameId),
        eq(playAgainRequests.requesterId, requesterId)
      )
    );

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const [request] = await db.insert(playAgainRequests).values({
      requesterId,
      requestedId,
      gameId,
      expiresAt,
    }).returning();

    return request;
  }

  async getPlayAgainRequests(userId: string): Promise<(PlayAgainRequest & { requester: User; requested: User; game: Game })[]> {
    const requests = await db
      .select({
        id: playAgainRequests.id,
        requesterId: playAgainRequests.requesterId,
        requestedId: playAgainRequests.requestedId,
        gameId: playAgainRequests.gameId,
        status: playAgainRequests.status,
        requestedAt: playAgainRequests.requestedAt,
        respondedAt: playAgainRequests.respondedAt,
        expiresAt: playAgainRequests.expiresAt,
        requester: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          isGuest: users.isGuest,
          guestSessionExpiry: users.guestSessionExpiry,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          coins: users.coins,
          currentWinStreak: users.currentWinStreak,
          bestWinStreak: users.bestWinStreak,
          selectedAchievementBorder: users.selectedAchievementBorder,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        requested: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          isGuest: users.isGuest,
          guestSessionExpiry: users.guestSessionExpiry,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          coins: users.coins,
          currentWinStreak: users.currentWinStreak,
          bestWinStreak: users.bestWinStreak,
          selectedAchievementBorder: users.selectedAchievementBorder,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        game: {
          id: games.id,
          roomId: games.roomId,
          playerXId: games.playerXId,
          playerOId: games.playerOId,
          currentPlayer: games.currentPlayer,
          gameMode: games.gameMode,
          status: games.status,
          winnerId: games.winnerId,
          winCondition: games.winCondition,
          board: games.board,
          lastMoveAt: games.lastMoveAt,
          playerXAutoPlay: games.playerXAutoPlay,
          playerOAutoPlay: games.playerOAutoPlay,
          playerXAutoPlaySince: games.playerXAutoPlaySince,
          playerOAutoPlaySince: games.playerOAutoPlaySince,
          createdAt: games.createdAt,
          finishedAt: games.finishedAt,
        },
      })
      .from(playAgainRequests)
      .leftJoin(users, sql`${playAgainRequests.requesterId}::text = ${users.id}::text`)
      .leftJoin(games, sql`${playAgainRequests.gameId}::text = ${games.id}::text`)
      .where(
        and(
          or(
            sql`${playAgainRequests.requesterId}::text = ${userId}`,
            sql`${playAgainRequests.requestedId}::text = ${userId}`
          ),
          eq(playAgainRequests.status, 'pending'),
          sql`${playAgainRequests.expiresAt} > NOW()`
        )
      )
      .orderBy(desc(playAgainRequests.requestedAt));

    return requests as (PlayAgainRequest & { requester: User; requested: User; game: Game })[];
  }

  async respondToPlayAgainRequest(requestId: string, response: 'accepted' | 'rejected'): Promise<void> {
    // Delete the request immediately after processing - no need to keep accepted/rejected requests
    await db.delete(playAgainRequests).where(eq(playAgainRequests.id, requestId));
  }

  async expireOldPlayAgainRequests(): Promise<void> {
    await db.update(playAgainRequests).set({
      status: 'expired',
    }).where(
      and(
        eq(playAgainRequests.status, 'pending'),
        sql`${playAgainRequests.expiresAt} <= NOW()`
      )
    );
  }

  async getActivePlayAgainRequest(gameId: string, requesterId: string): Promise<PlayAgainRequest | undefined> {
    const [request] = await db
      .select()
      .from(playAgainRequests)
      .where(
        and(
          eq(playAgainRequests.gameId, gameId),
          eq(playAgainRequests.requesterId, requesterId),
          eq(playAgainRequests.status, 'pending'),
          sql`${playAgainRequests.expiresAt} > NOW()`
        )
      );

    return request;
  }

  // Weekly Leaderboard methods
  async getOrCreateWeeklyStats(userId: string, weekNumber: number, year: number): Promise<WeeklyLeaderboard> {
    // Use atomic upsert to prevent race conditions
    // First try to insert, then select if it already exists
    try {
      const [newStats] = await db
        .insert(weeklyLeaderboard)
        .values({
          userId,
          weekNumber,
          year,
        })
        .onConflictDoNothing()
        .returning();

      if (newStats) {
        return newStats;
      }
    } catch (error) {
      // If there's any error during insert, fall through to select
    }

    // Record already exists, fetch it
    const [existing] = await db
      .select()
      .from(weeklyLeaderboard)
      .where(
        and(
          eq(weeklyLeaderboard.userId, userId),
          eq(weeklyLeaderboard.weekNumber, weekNumber),
          eq(weeklyLeaderboard.year, year)
        )
      );

    if (!existing) {
      throw new Error(`Failed to create or retrieve weekly stats for user ${userId}, week ${weekNumber}, year ${year}`);
    }

    return existing;
  }

  async updateWeeklyStats(userId: string, result: 'win' | 'loss' | 'draw', coinsEarned: number): Promise<void> {
    const now = new Date();
    const { weekNumber, year } = this.getISOWeekInfo(now);

    // Ensure stats record exists
    const stats = await this.getOrCreateWeeklyStats(userId, weekNumber, year);

    // Use atomic SQL-level increments to prevent race conditions
    if (result === 'win') {
      // Apply multiplier only to positive earnings; preserve negative values (shouldn't occur for wins, but guards against bugs)
      const multipliedEarnings = coinsEarned > 0 ? coinsEarned * LEAGUE_EARNINGS_MULTIPLIER : coinsEarned;
      await db.execute(sql`
        UPDATE weekly_leaderboard 
        SET 
          weekly_games = COALESCE(weekly_games, 0) + 1,
          weekly_wins = COALESCE(weekly_wins, 0) + 1,
          weekly_win_streak = COALESCE(weekly_win_streak, 0) + 1,
          best_weekly_win_streak = GREATEST(COALESCE(best_weekly_win_streak, 0), COALESCE(weekly_win_streak, 0) + 1),
          coins_earned = COALESCE(coins_earned, 0) + ${multipliedEarnings},
          updated_at = ${now}
        WHERE id = ${stats.id}
      `);
    } else if (result === 'loss') {
      await db.execute(sql`
        UPDATE weekly_leaderboard 
        SET 
          weekly_games = COALESCE(weekly_games, 0) + 1,
          weekly_losses = COALESCE(weekly_losses, 0) + 1,
          weekly_win_streak = 0,
          updated_at = ${now}
        WHERE id = ${stats.id}
      `);
    } else if (result === 'draw') {
      await db.execute(sql`
        UPDATE weekly_leaderboard 
        SET 
          weekly_games = COALESCE(weekly_games, 0) + 1,
          weekly_draws = COALESCE(weekly_draws, 0) + 1,
          weekly_win_streak = 0,
          updated_at = ${now}
        WHERE id = ${stats.id}
      `);
    }
  }

  async getWeeklyLeaderboard(weekNumber: number, year: number, limit: number = 50): Promise<Array<WeeklyLeaderboard & { user: User; rank: number }>> {
    const leaderboard = await db
      .select({
        id: weeklyLeaderboard.id,
        userId: weeklyLeaderboard.userId,
        weekNumber: weeklyLeaderboard.weekNumber,
        year: weeklyLeaderboard.year,
        weeklyWins: weeklyLeaderboard.weeklyWins,
        weeklyLosses: weeklyLeaderboard.weeklyLosses,
        weeklyDraws: weeklyLeaderboard.weeklyDraws,
        weeklyGames: weeklyLeaderboard.weeklyGames,
        weeklyWinStreak: weeklyLeaderboard.weeklyWinStreak,
        bestWeeklyWinStreak: weeklyLeaderboard.bestWeeklyWinStreak,
        coinsEarned: weeklyLeaderboard.coinsEarned,
        rewardReceived: weeklyLeaderboard.rewardReceived,
        finalRank: weeklyLeaderboard.finalRank,
        rewardAmount: weeklyLeaderboard.rewardAmount,
        createdAt: weeklyLeaderboard.createdAt,
        updatedAt: weeklyLeaderboard.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          displayName: users.displayName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          isGuest: users.isGuest,
          guestSessionExpiry: users.guestSessionExpiry,
          wins: users.wins,
          losses: users.losses,
          draws: users.draws,
          coins: users.coins,
          currentWinStreak: users.currentWinStreak,
          bestWinStreak: users.bestWinStreak,
          selectedAchievementBorder: users.selectedAchievementBorder,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(weeklyLeaderboard)
      .leftJoin(users, eq(weeklyLeaderboard.userId, users.id))
      .where(
        and(
          eq(weeklyLeaderboard.weekNumber, weekNumber),
          eq(weeklyLeaderboard.year, year),
          gt(weeklyLeaderboard.weeklyGames, 0)
        )
      )
      .orderBy(
        desc(weeklyLeaderboard.coinsEarned),
        desc(weeklyLeaderboard.weeklyWins),
        desc(weeklyLeaderboard.weeklyGames),
        desc(weeklyLeaderboard.bestWeeklyWinStreak),
        weeklyLeaderboard.userId // Final deterministic tie-breaker
      )
      .limit(limit);

    return leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    })) as Array<WeeklyLeaderboard & { user: User; rank: number }>;
  }

  async getCurrentWeekLeaderboard(limit: number = 50): Promise<Array<WeeklyLeaderboard & { user: User; rank: number }>> {
    const { weekNumber, year } = this.getISOWeekInfo();
    return this.getWeeklyLeaderboard(weekNumber, year, limit);
  }

  async getTimeUntilWeekEnd(): Promise<{ days: number; hours: number; minutes: number; seconds: number }> {
    const now = new Date();

    // Calculate the next Monday (start of next week) in UTC
    const nextMonday = new Date(now.getTime());
    nextMonday.setUTCHours(0, 0, 0, 0);

    // Get current day (0=Sunday, 1=Monday, etc.)
    const currentDay = now.getUTCDay();

    // Calculate days until next Monday
    let daysUntilMonday;
    if (currentDay === 0) {
      // Sunday -> next Monday is 1 day away
      daysUntilMonday = 1;
    } else if (currentDay === 1) {
      // Monday -> check if we're already past the current Monday 00:00:00
      // If so, next Monday is 7 days away
      const mondayStart = new Date(now.getTime());
      mondayStart.setUTCHours(0, 0, 0, 0);
      if (now.getTime() >= mondayStart.getTime()) {
        daysUntilMonday = 7; // Already past this Monday's start, go to next Monday
      } else {
        daysUntilMonday = 0; // Still before this Monday's start (shouldn't happen in normal case)
      }
    } else {
      // Tuesday through Saturday -> calculate days until next Monday
      daysUntilMonday = 8 - currentDay; // 2->6, 3->5, 4->4, 5->3, 6->2
    }

    nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);

    const timeLeft = nextMonday.getTime() - now.getTime();

    // Ensure we never return negative values
    const positiveTimeLeft = Math.max(0, timeLeft);

    const days = Math.floor(positiveTimeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((positiveTimeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((positiveTimeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((positiveTimeLeft % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  }

  async doubleCurrentWeekEarnings(): Promise<{ success: boolean; updatedCount: number }> {
    try {
      const { weekNumber, year } = this.getISOWeekInfo();
      const now = new Date();

      const result = await db.execute(sql`
        UPDATE weekly_leaderboard 
        SET 
          coins_earned = COALESCE(coins_earned, 0) * 2,
          updated_at = ${now}
        WHERE week_number = ${weekNumber} 
          AND year = ${year}
          AND COALESCE(coins_earned, 0) > 0
      `);

      const updatedCount = result.rowCount ?? 0;

      return { success: true, updatedCount };
    } catch (error) {
      console.error('Error doubling current week earnings:', error);
      return { success: false, updatedCount: 0 };
    }
  }

  async distributeWeeklyRewards(weekNumber: number, year: number): Promise<WeeklyReward[]> {
    // Use transaction with proper locking and idempotency to prevent race conditions
    return await db.transaction(async (tx) => {
      // Use advisory lock to prevent concurrent reward distribution for same week/year
      const lockKey = weekNumber * 10000 + year; // e.g., 1202025 for week 1 of 2025
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);

      // Check if rewards have already been distributed for this week/year
      const existingRewards = await tx
        .select()
        .from(weeklyRewards)
        .where(
          and(
            eq(weeklyRewards.weekNumber, weekNumber),
            eq(weeklyRewards.year, year)
          )
        )
        .limit(1);

      if (existingRewards.length > 0) {
        // Rewards already distributed, return existing rewards
        return await tx
          .select()
          .from(weeklyRewards)
          .where(
            and(
              eq(weeklyRewards.weekNumber, weekNumber),
              eq(weeklyRewards.year, year)
            )
          )
          .orderBy(weeklyRewards.rank);
      }

      // Get final leaderboard snapshot for this week/year
      const topPlayers = await this.getWeeklyLeaderboard(weekNumber, year, 50);
      // 1st=1B, 2nd=700M, 3rd=500M, 4th-10th=300M each, 11th-50th=100M each
      const getRewardAmount = (rank: number): number => {
        switch (rank) {
          case 1: return 1000000000; // 1B
          case 2: return 700000000; // 700M
          case 3: return 500000000; // 500M
          default: 
            if (rank <= 10) return 300000000; // 300M for ranks 4-10
            if (rank <= 50) return 100000000; // 100M for ranks 11-50
            return 0; // No reward for ranks beyond 50
        }
      };
      const rewards: WeeklyReward[] = [];

      for (let i = 0; i < Math.min(topPlayers.length, 50); i++) {
        const player = topPlayers[i];
        const rank = i + 1;
        const rewardAmount = getRewardAmount(rank);

        // Create reward record (idempotent via unique constraint)
        const [reward] = await tx
          .insert(weeklyRewards)
          .values({
            userId: player.userId,
            weekNumber,
            year,
            rank,
            rewardAmount,
          })
          .onConflictDoNothing()
          .returning();

        if (reward) {
          // Get user's current balance before updating
          const [userBefore] = await tx
            .select({ coins: users.coins })
            .from(users)
            .where(eq(users.id, player.userId))
            .limit(1);

          const balanceBefore = userBefore?.coins || 0;
          const balanceAfter = balanceBefore + rewardAmount;

          // Update user's coins atomically
          await tx.execute(sql`
            UPDATE users 
            SET coins = COALESCE(coins, 0) + ${rewardAmount}
            WHERE id = ${player.userId}
          `);

          // Update weekly leaderboard record
          await tx
            .update(weeklyLeaderboard)
            .set({
              rewardReceived: true,
              finalRank: rank,
              rewardAmount: rewardAmount,
            })
            .where(eq(weeklyLeaderboard.id, player.id));

          // Create coin transaction record with required balance fields
          await tx
            .insert(coinTransactions)
            .values({
              userId: player.userId,
              amount: rewardAmount,
              type: 'weekly_reward',
              balanceBefore: balanceBefore,
              balanceAfter: balanceAfter,
            })
            .onConflictDoNothing();

          rewards.push(reward);
        }
      }

      return rewards;
    });
  }

  // Weekly Reset Status operations
  async createWeeklyResetTable(): Promise<void> {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS weekly_reset_status (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        week_number INTEGER NOT NULL,
        year INTEGER NOT NULL,
        status VARCHAR NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        next_retry_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add unique constraint
    try {
      await db.execute(sql`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_weekly_reset 
        ON weekly_reset_status(week_number, year)
      `);
    } catch (e) {
      // Index may already exist
    }
  }

  async getResetStatus(weekNumber: number, year: number): Promise<WeeklyResetStatus | undefined> {
    const [status] = await db
      .select()
      .from(weeklyResetStatus)
      .where(
        and(
          eq(weeklyResetStatus.weekNumber, weekNumber),
          eq(weeklyResetStatus.year, year)
        )
      );
    return status;
  }

  async createResetStatus(weekNumber: number, year: number): Promise<WeeklyResetStatus> {
    const [status] = await db
      .insert(weeklyResetStatus)
      .values({
        weekNumber,
        year,
        status: 'pending',
      })
      .onConflictDoNothing()
      .returning();

    if (!status) {
      // Record already exists, return it
      return (await this.getResetStatus(weekNumber, year))!;
    }

    return status;
  }

  async updateResetStatus(id: string, status: 'pending' | 'in_progress' | 'completed' | 'failed', errorMessage?: string): Promise<void> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'in_progress') {
      updateData.startedAt = new Date();
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.errorMessage = null; // Clear any previous error
    } else if (status === 'failed' && errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    await db
      .update(weeklyResetStatus)
      .set(updateData)
      .where(eq(weeklyResetStatus.id, id));
  }

  async incrementRetryCount(id: string, nextRetryAt?: Date): Promise<void> {
    await db
      .update(weeklyResetStatus)
      .set({
        retryCount: sql`${weeklyResetStatus.retryCount} + 1`,
        nextRetryAt,
        updatedAt: new Date(),
      })
      .where(eq(weeklyResetStatus.id, id));
  }

  async getPendingResets(): Promise<WeeklyResetStatus[]> {
    return await db
      .select()
      .from(weeklyResetStatus)
      .where(
        or(
          eq(weeklyResetStatus.status, 'pending'),
          and(
            eq(weeklyResetStatus.status, 'failed'),
            or(
              isNull(weeklyResetStatus.nextRetryAt),
              lt(weeklyResetStatus.nextRetryAt, new Date())
            )
          )
        )
      )
      .orderBy(weeklyResetStatus.year, weeklyResetStatus.weekNumber);
  }

  async getFailedResets(): Promise<WeeklyResetStatus[]> {
    return await db
      .select()
      .from(weeklyResetStatus)
      .where(eq(weeklyResetStatus.status, 'failed'))
      .orderBy(desc(weeklyResetStatus.updatedAt));
  }

  async resetWeeklyStats(weekNumber: number, year: number): Promise<void> {
    // First distribute rewards for the finishing week
    await this.distributeWeeklyRewards(weekNumber, year);

    // Archive the weekly stats by updating finalRank for all participants
    // Also mark them to see their rank popup
    const allParticipants = await this.getWeeklyLeaderboard(weekNumber, year, 1000);

    for (const participant of allParticipants) {
      await db
        .update(weeklyLeaderboard)
        .set({
          finalRank: participant.rank,
          rankPopupSeen: false, // Mark for popup display
        })
        .where(eq(weeklyLeaderboard.id, participant.id));
    }

    // The weekly stats are preserved for historical purposes
    // New week stats will be created automatically when games are played
  }

  async getWeeklyRewards(userId: string): Promise<WeeklyReward[]> {
    return await db
      .select()
      .from(weeklyRewards)
      .where(eq(weeklyRewards.userId, userId))
      .orderBy(desc(weeklyRewards.distributedAt));
  }

  async hasReceivedWeeklyReward(userId: string, weekNumber: number, year: number): Promise<boolean> {
    const [reward] = await db
      .select()
      .from(weeklyRewards)
      .where(
        and(
          eq(weeklyRewards.userId, userId),
          eq(weeklyRewards.weekNumber, weekNumber),
          eq(weeklyRewards.year, year)
        )
      );

    return !!reward;
  }

  // Weekly rank popup functions
  async getPendingRankPopup(userId: string): Promise<any | null> {
    const [rankData] = await db
      .select({
        id: weeklyLeaderboard.id,
        weekNumber: weeklyLeaderboard.weekNumber,
        year: weeklyLeaderboard.year,
        finalRank: weeklyLeaderboard.finalRank,
        rewardReceived: weeklyLeaderboard.rewardReceived,
        rewardAmount: weeklyLeaderboard.rewardAmount,
        weeklyWins: weeklyLeaderboard.weeklyWins,
        weeklyLosses: weeklyLeaderboard.weeklyLosses,
        weeklyGames: weeklyLeaderboard.weeklyGames,
        coinsEarned: weeklyLeaderboard.coinsEarned,
        rankPopupSeen: weeklyLeaderboard.rankPopupSeen,
      })
      .from(weeklyLeaderboard)
      .where(
        and(
          eq(weeklyLeaderboard.userId, userId),
          eq(weeklyLeaderboard.rankPopupSeen, false),
          isNotNull(weeklyLeaderboard.finalRank)
        )
      )
      .orderBy(desc(weeklyLeaderboard.year), desc(weeklyLeaderboard.weekNumber))
      .limit(1);

    return rankData || null;
  }

  async markRankPopupSeen(userId: string, weekNumber: number, year: number): Promise<void> {
    await db
      .update(weeklyLeaderboard)
      .set({
        rankPopupSeen: true,
      })
      .where(
        and(
          eq(weeklyLeaderboard.userId, userId),
          eq(weeklyLeaderboard.weekNumber, weekNumber),
          eq(weeklyLeaderboard.year, year)
        )
      );
  }

  // ===== Sticker Operations =====
  
  async getAllStickerItems(): Promise<StickerItem[]> {
    const items = await db
      .select()
      .from(stickerItems)
      .where(eq(stickerItems.isActive, true))
      .orderBy(stickerItems.price);
    return items;
  }

  async getStickerItemById(id: string): Promise<StickerItem | undefined> {
    const [item] = await db
      .select()
      .from(stickerItems)
      .where(eq(stickerItems.id, id))
      .limit(1);
    return item;
  }

  async getUserStickers(userId: string): Promise<(UserSticker & { sticker: StickerItem })[]> {
    const stickers = await db
      .select({
        id: userStickers.id,
        userId: userStickers.userId,
        stickerId: userStickers.stickerId,
        purchasedAt: userStickers.purchasedAt,
        sticker: stickerItems,
      })
      .from(userStickers)
      .innerJoin(stickerItems, eq(userStickers.stickerId, stickerItems.id))
      .where(eq(userStickers.userId, userId));
    
    return stickers.map(s => ({
      id: s.id,
      userId: s.userId,
      stickerId: s.stickerId,
      purchasedAt: s.purchasedAt,
      sticker: s.sticker,
    }));
  }

  async hasUserPurchasedSticker(userId: string, stickerId: string): Promise<boolean> {
    const [result] = await db
      .select({ id: userStickers.id })
      .from(userStickers)
      .where(
        and(
          eq(userStickers.userId, userId),
          eq(userStickers.stickerId, stickerId)
        )
      )
      .limit(1);
    return !!result;
  }

  async purchaseSticker(userId: string, stickerId: string): Promise<{ success: boolean; message: string; sticker?: UserSticker }> {
    try {
      // Check if sticker exists
      const sticker = await this.getStickerItemById(stickerId);
      if (!sticker) {
        return { success: false, message: 'Sticker not found' };
      }

      if (!sticker.isActive) {
        return { success: false, message: 'This sticker is not available for purchase' };
      }

      // Check if already purchased
      const alreadyOwned = await this.hasUserPurchasedSticker(userId, stickerId);
      if (alreadyOwned) {
        return { success: false, message: 'You already own this sticker' };
      }

      // Check user's coins
      const currentCoins = await this.getUserCoins(userId);
      if (currentCoins < sticker.price) {
        return { success: false, message: 'Insufficient coins' };
      }

      // Deduct coins and record purchase (transaction)
      await db.transaction(async (tx) => {
        // Deduct coins
        const newBalance = currentCoins - sticker.price;
        await tx
          .update(users)
          .set({ coins: newBalance })
          .where(eq(users.id, userId));

        // Record coin transaction
        await tx.insert(coinTransactions).values({
          userId,
          amount: -sticker.price,
          type: 'sticker_purchase',
          balanceBefore: currentCoins,
          balanceAfter: newBalance,
        });

        // Add sticker to user's collection
        await tx.insert(userStickers).values({
          userId,
          stickerId,
        });
      });

      const [purchasedSticker] = await db
        .select()
        .from(userStickers)
        .where(
          and(
            eq(userStickers.userId, userId),
            eq(userStickers.stickerId, stickerId)
          )
        )
        .limit(1);

      return {
        success: true,
        message: `Successfully purchased ${sticker.name}!`,
        sticker: purchasedSticker,
      };
    } catch (error) {
      console.error('Error purchasing sticker:', error);
      return { success: false, message: 'Failed to purchase sticker' };
    }
  }

  async sendStickerInGame(gameId: string, senderId: string, recipientId: string, stickerId: string): Promise<GameStickerSend> {
    const [stickerSend] = await db
      .insert(gameStickerSends)
      .values({
        gameId,
        senderId,
        recipientId,
        stickerId,
      })
      .returning();

    return stickerSend;
  }

  async getGameStickerSends(gameId: string): Promise<(GameStickerSend & { sticker: StickerItem; sender: User })[]> {
    const sends = await db
      .select({
        id: gameStickerSends.id,
        gameId: gameStickerSends.gameId,
        senderId: gameStickerSends.senderId,
        recipientId: gameStickerSends.recipientId,
        stickerId: gameStickerSends.stickerId,
        sentAt: gameStickerSends.sentAt,
        sticker: stickerItems,
        sender: users,
      })
      .from(gameStickerSends)
      .innerJoin(stickerItems, eq(gameStickerSends.stickerId, stickerItems.id))
      .innerJoin(users, eq(gameStickerSends.senderId, users.id))
      .where(eq(gameStickerSends.gameId, gameId));

    return sends.map(s => ({
      id: s.id,
      gameId: s.gameId,
      senderId: s.senderId,
      recipientId: s.recipientId,
      stickerId: s.stickerId,
      sentAt: s.sentAt,
      sticker: s.sticker,
      sender: s.sender,
    }));
  }

  async createDefaultStickers(): Promise<void> {
    const defaultStickers = [
      {
        id: 'funny-memes',
        name: 'Enjoy',
        description: 'Send hilarious meme reactions',
        price: 100000000,
        assetPath: 'funny-memes.gif',
        animationType: 'none',
      },
      {
        id: '200w',
        name: 'Victory Dance',
        description: 'Celebrate your wins with style',
        price: 100000000,
        assetPath: '200w.gif',
        animationType: 'none',
      },
      {
        id: '2754b56ef8822c96677a529827edfdcb',
        name: 'Epic Reaction',
        description: 'Show your epic reaction',
        price: 100000000,
        assetPath: '2754b56ef8822c96677a529827edfdcb.gif',
        animationType: 'none',
      },
      {
        id: '50782c2081d0743376207ba172523866',
        name: 'Mind Blown',
        description: 'When your opponent makes an amazing move',
        price: 100000000,
        assetPath: '50782c2081d0743376207ba172523866.gif',
        animationType: 'none',
      },
      {
        id: 'c3c38d9d92142e045c30c40487b69abc',
        name: 'Celebration Time',
        description: 'Time to celebrate your victory',
        price: 100000000,
        assetPath: 'c3c38d9d92142e045c30c40487b69abc.gif',
        animationType: 'none',
      },
      {
        id: 'd1712b1d2c1169c8d01c70530f88874d',
        name: 'Game On',
        description: 'Let the games begin',
        price: 100000000,
        assetPath: 'd1712b1d2c1169c8d01c70530f88874d.gif',
        animationType: 'none',
      },
    ];

    try {
      // Insert or update current stickers
      for (const sticker of defaultStickers) {
        const existing = await this.getStickerItemById(sticker.id);
        if (!existing) {
          await db.insert(stickerItems).values(sticker);
        } else {
          // Update existing sticker with new values
          await db.update(stickerItems)
            .set({
              name: sticker.name,
              description: sticker.description,
              price: sticker.price,
              assetPath: sticker.assetPath,
              animationType: sticker.animationType,
            })
            .where(eq(stickerItems.id, sticker.id));
        }
      }
      console.log('✅ Default stickers initialized');
    } catch (error) {
      console.error('Error creating default stickers:', error);
    }
  }

  // ===== Avatar Frame Methods =====
  
  async getAllAvatarFrameItems(): Promise<AvatarFrameItem[]> {
    const items = await db
      .select()
      .from(avatarFrameItems)
      .where(eq(avatarFrameItems.isActive, true))
      .orderBy(avatarFrameItems.price);
    return items;
  }

  async getAvatarFrameItemById(id: string): Promise<AvatarFrameItem | undefined> {
    const [item] = await db
      .select()
      .from(avatarFrameItems)
      .where(eq(avatarFrameItems.id, id))
      .limit(1);
    return item;
  }

  async getUserAvatarFrames(userId: string): Promise<(UserAvatarFrame & { frame: AvatarFrameItem })[]> {
    const frames = await db
      .select({
        id: userAvatarFrames.id,
        userId: userAvatarFrames.userId,
        frameId: userAvatarFrames.frameId,
        purchasedAt: userAvatarFrames.purchasedAt,
        isActive: userAvatarFrames.isActive,
        frame: avatarFrameItems,
      })
      .from(userAvatarFrames)
      .innerJoin(avatarFrameItems, eq(userAvatarFrames.frameId, avatarFrameItems.id))
      .where(eq(userAvatarFrames.userId, userId));
    
    return frames.map(f => ({
      id: f.id,
      userId: f.userId,
      frameId: f.frameId,
      purchasedAt: f.purchasedAt,
      isActive: f.isActive,
      frame: f.frame,
    }));
  }

  async getActiveAvatarFrame(userId: string): Promise<string | null> {
    const [activeFrame] = await db
      .select({ frameId: userAvatarFrames.frameId })
      .from(userAvatarFrames)
      .where(
        and(
          eq(userAvatarFrames.userId, userId),
          eq(userAvatarFrames.isActive, true)
        )
      )
      .limit(1);
    return activeFrame?.frameId || null;
  }

  async hasUserPurchasedAvatarFrame(userId: string, frameId: string): Promise<boolean> {
    const [result] = await db
      .select({ id: userAvatarFrames.id })
      .from(userAvatarFrames)
      .where(
        and(
          eq(userAvatarFrames.userId, userId),
          eq(userAvatarFrames.frameId, frameId)
        )
      )
      .limit(1);
    return !!result;
  }

  async purchaseAvatarFrame(userId: string, frameId: string): Promise<{ success: boolean; message: string; frame?: UserAvatarFrame }> {
    try {
      // Check if frame exists
      const frame = await this.getAvatarFrameItemById(frameId);
      if (!frame) {
        return { success: false, message: 'Avatar frame not found' };
      }

      if (!frame.isActive) {
        return { success: false, message: 'This avatar frame is not available for purchase' };
      }

      // Check if already purchased
      const alreadyOwned = await this.hasUserPurchasedAvatarFrame(userId, frameId);
      if (alreadyOwned) {
        return { success: false, message: 'You already own this avatar frame' };
      }

      // Check user's coins
      const currentCoins = await this.getUserCoins(userId);
      if (currentCoins < frame.price) {
        return { success: false, message: 'Insufficient coins' };
      }

      // Deduct coins and record purchase (transaction)
      await db.transaction(async (tx) => {
        // Deduct coins
        const newBalance = currentCoins - frame.price;
        await tx
          .update(users)
          .set({ coins: newBalance })
          .where(eq(users.id, userId));

        // Record coin transaction
        await tx.insert(coinTransactions).values({
          userId,
          amount: -frame.price,
          type: 'avatar_frame_purchase',
          balanceBefore: currentCoins,
          balanceAfter: newBalance,
        });

        // Add frame to user's collection
        await tx.insert(userAvatarFrames).values({
          userId,
          frameId,
          isActive: false,
        });
      });

      const [purchasedFrame] = await db
        .select()
        .from(userAvatarFrames)
        .where(
          and(
            eq(userAvatarFrames.userId, userId),
            eq(userAvatarFrames.frameId, frameId)
          )
        )
        .limit(1);

      return {
        success: true,
        message: `Successfully purchased ${frame.name}!`,
        frame: purchasedFrame,
      };
    } catch (error) {
      console.error('Error purchasing avatar frame:', error);
      return { success: false, message: 'Failed to purchase avatar frame' };
    }
  }

  async setActiveAvatarFrame(userId: string, frameId: string | null): Promise<{ success: boolean; message: string }> {
    try {
      // If frameId is null, deactivate all frames
      if (frameId === null) {
        await db
          .update(userAvatarFrames)
          .set({ isActive: false })
          .where(eq(userAvatarFrames.userId, userId));
        return { success: true, message: 'Avatar frame removed' };
      }

      // Check if user owns the frame
      const hasFrame = await this.hasUserPurchasedAvatarFrame(userId, frameId);
      if (!hasFrame) {
        return { success: false, message: 'You do not own this avatar frame' };
      }

      // Deactivate all frames for this user, then activate the selected one
      await db.transaction(async (tx) => {
        // Deactivate all frames
        await tx
          .update(userAvatarFrames)
          .set({ isActive: false })
          .where(eq(userAvatarFrames.userId, userId));

        // Activate selected frame
        await tx
          .update(userAvatarFrames)
          .set({ isActive: true })
          .where(
            and(
              eq(userAvatarFrames.userId, userId),
              eq(userAvatarFrames.frameId, frameId)
            )
          );
      });

      return { success: true, message: 'Avatar frame activated' };
    } catch (error) {
      console.error('Error setting active avatar frame:', error);
      return { success: false, message: 'Failed to set active avatar frame' };
    }
  }

  async createDefaultAvatarFrames(): Promise<void> {
    const defaultFrames = [
      {
        id: 'thundering',
        name: 'Thundering Storm',
        description: 'Electrifying blue lightning effects with pulsing energy',
        price: 1000000000, // 50 million coins
      },
      {
        id: 'firestorm',
        name: 'Fire Storm',
        description: 'Blazing 3D fire frame with intense flames erupting outside the border',
        price: 1000000000, // 1 billion coins
      },
      {
        id: 'level_100_master',
        name: 'Level 100 Master',
        description: 'Golden animated frame for achieving level 100',
        price: 75000000, // 75 million coins
      },
      {
        id: 'ultimate_veteran',
        name: 'Ultimate Veteran',
        description: 'Premium silver frame with prismatic effects',
        price: 100000000, // 100 million coins
      },
      {
        id: 'grandmaster',
        name: 'Grandmaster',
        description: 'Elegant purple frame with cosmic energy',
        price: 150000000, // 150 million coins
      },
      {
        id: 'champion',
        name: 'Champion',
        description: 'Fiery red and gold frame for true champions',
        price: 200000000, // 200 million coins
      },
      {
        id: 'legend',
        name: 'Legend',
        description: 'Ultimate rainbow prismatic frame for legends',
        price: 500000000, // 500 million coins
      },
      {
        id: 'lovers_3d',
        name: 'Lovers Heart 3D',
        description: 'Romantic 3D hearts floating around your avatar - for lovers only!',
        price: 1000000000, // 1 billion coins
      },
      {
        id: 'diamond_luxury',
        name: 'Diamond Luxury',
        description: 'Ultra-premium 3D floating diamond crystals with shimmer effects - the ultimate luxury!',
        price: 2000000000, // 2 billion coins
      },
      {
        id: 'holographic_matrix',
        name: 'Holographic Matrix',
        description: 'Mind-blowing 3D holographic frame with liquid wave distortion on your avatar - truly mesmerizing!',
        price: 1500000000, // 2 billion coins
      },
      {
        id: 'cosmic_vortex',
        name: 'Cosmic Vortex',
        description: 'Explosive neon energy plasma border with dual-rotating waves and pulsing brightness effect!',
        price: 1500000000, // 2 billion coins
      },
      {
        id: 'royal_zigzag_crown',
        name: 'Royal Golden',
        description: 'Majestic 3D zigzag golden border with floating crown jewels - feel like royalty!',
        price: 3000000000, // 3 billion coins
      },
      {
        id: 'celestial_nebula',
        name: 'Celestial Nebula',
        description: 'Stunning 3D cosmic nebula with swirling galaxies, floating stardust, and mesmerizing aurora effects - absolutely breathtaking!',
        price: 5000000000, // 5 billion coins
      },
      {
        id: 'quantum_prism',
        name: 'Quantum Prism',
        description: 'Ultra-modern 3D hexagonal crystal frame with rotating geometric shapes, pulsing energy rings, and clean light beams - the future of style!',
        price: 6000000000, // 3.5 billion coins
      },
      {
        id: 'phoenix_immortal',
        name: 'Phoenix Immortal',
        description: 'The ultimate legendary frame! Mythical phoenix with majestic flaming wings, eternal rebirth fire cycles, floating ember particles, and divine golden feathers - the rarest and most powerful frame ever created!',
        price: 10000000000, // 8 billion coins
      },
    ];

    try {
      // Insert or update frames
      for (const frame of defaultFrames) {
        const existing = await this.getAvatarFrameItemById(frame.id);
        if (!existing) {
          await db.insert(avatarFrameItems).values(frame);
        } else {
          // Update existing frame with new values
          await db.update(avatarFrameItems)
            .set({
              name: frame.name,
              description: frame.description,
              price: frame.price,
            })
            .where(eq(avatarFrameItems.id, frame.id));
        }
      }
      console.log('✅ Default avatar frames initialized');
    } catch (error) {
      console.error('Error creating default avatar frames:', error);
    }
  }

  // Daily Reward operations
  async getDailyReward(userId: string): Promise<{ canClaim: boolean; reward: DailyReward | null; nextClaimDate?: Date }> {
    // Get or create daily reward record for user
    let [reward] = await db.select().from(dailyRewards).where(eq(dailyRewards.userId, userId));
    
    if (!reward) {
      // Create new reward record for user
      [reward] = await db.insert(dailyRewards).values({ userId }).returning();
      return { canClaim: true, reward };
    }

    // Check if user can claim (hasn't claimed today)
    if (!reward.lastClaimDate) {
      return { canClaim: true, reward };
    }

    const now = new Date();
    const lastClaim = new Date(reward.lastClaimDate);
    
    // Set both dates to start of day for comparison
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastClaimStart = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
    
    if (todayStart > lastClaimStart) {
      // Can claim today
      return { canClaim: true, reward };
    }

    // Already claimed today, calculate next claim date
    const nextClaimDate = new Date(todayStart);
    nextClaimDate.setDate(nextClaimDate.getDate() + 1);
    
    return { canClaim: false, reward, nextClaimDate };
  }

  async claimDailyReward(userId: string): Promise<{ success: boolean; message: string; reward?: DailyReward; coinsEarned?: number }> {
    const DAILY_REWARD_AMOUNT = 1000000; // 1 million coins

    // Check if user can claim
    const { canClaim, reward } = await this.getDailyReward(userId);
    
    if (!canClaim) {
      return { 
        success: false, 
        message: "You have already claimed your daily reward today. Come back tomorrow!" 
      };
    }

    const now = new Date();
    const lastClaim = reward?.lastClaimDate ? new Date(reward.lastClaimDate) : null;
    
    // Calculate streak
    let newStreak = 1;
    if (lastClaim) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const lastClaimStart = new Date(lastClaim.getFullYear(), lastClaim.getMonth(), lastClaim.getDate());
      
      if (lastClaimStart.getTime() === yesterdayStart.getTime()) {
        // Claimed yesterday, continue streak
        newStreak = (reward.currentStreak || 0) + 1;
      }
      // If last claim was before yesterday, streak resets to 1
    }

    const newBestStreak = Math.max(newStreak, reward?.bestStreak || 0);

    // Process transaction
    await db.transaction(async (tx) => {
      // Get user's current balance
      const [user] = await tx.select().from(users).where(eq(users.id, userId));
      if (!user) {
        throw new Error("User not found");
      }

      const currentBalance = user.coins || 0;
      const newBalance = currentBalance + DAILY_REWARD_AMOUNT;

      // Update user coins
      await tx.update(users)
        .set({ coins: newBalance })
        .where(eq(users.id, userId));

      // Record coin transaction
      await tx.insert(coinTransactions).values({
        userId,
        amount: DAILY_REWARD_AMOUNT,
        type: 'daily_reward',
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
      });

      // Update daily reward record
      await tx.update(dailyRewards)
        .set({
          lastClaimDate: now,
          currentStreak: newStreak,
          bestStreak: newBestStreak,
          totalClaimed: (reward?.totalClaimed || 0) + 1,
          updatedAt: now,
        })
        .where(eq(dailyRewards.userId, userId));
    });

    // Get updated reward record
    const [updatedReward] = await db.select().from(dailyRewards).where(eq(dailyRewards.userId, userId));

    return {
      success: true,
      message: `Daily reward claimed! You earned ${DAILY_REWARD_AMOUNT.toLocaleString()} coins! ${newStreak > 1 ? `🔥 ${newStreak} day streak!` : ''}`,
      reward: updatedReward,
      coinsEarned: DAILY_REWARD_AMOUNT,
    };
  }
}

export const storage = new DatabaseStorage();
