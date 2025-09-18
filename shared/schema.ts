import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  serial,
  integer,
  boolean,
  uuid,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"),
  username: varchar("username").unique(),
  profileImageUrl: varchar("profile_image_url"),
  isGuest: boolean("is_guest").default(false), // Flag to identify guest users
  guestSessionExpiry: timestamp("guest_session_expiry"), // Expiry time for guest sessions
  wins: integer("wins").default(0),
  losses: integer("losses").default(0),
  draws: integer("draws").default(0),
  coins: bigint("coins", { mode: 'number' }).default(2000), // Starting coins for new users
  currentWinStreak: integer("current_win_streak").default(0), // Current consecutive wins
  bestWinStreak: integer("best_win_streak").default(0), // Best win streak ever achieved
  selectedAchievementBorder: varchar("selected_achievement_border"), // Store the selected achievement type for border display
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  name: varchar("name").notNull(),
  maxPlayers: integer("max_players").default(2),
  isPrivate: boolean("is_private").default(false),
  ownerId: varchar("owner_id").references(() => users.id),
  status: varchar("status").default("waiting"), // waiting, playing, finished
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").references(() => rooms.id),
  playerXId: varchar("player_x_id").references(() => users.id),
  playerOId: varchar("player_o_id").references(() => users.id),
  currentPlayer: varchar("current_player").default("X"), // X or O
  gameMode: varchar("game_mode").notNull(), // ai, pass-play, online
  status: varchar("status").default("active"), // active, finished, abandoned
  winnerId: varchar("winner_id").references(() => users.id),
  winCondition: varchar("win_condition"), // horizontal, diagonal, draw
  board: jsonb("board").default('{}'), // position -> player mapping
  lastMoveAt: timestamp("last_move_at").defaultNow(), // Track last move/game update time for expiration
  playerXAutoPlay: boolean("player_x_auto_play").default(false), // Is player X in auto-play mode
  playerOAutoPlay: boolean("player_o_auto_play").default(false), // Is player O in auto-play mode
  playerXAutoPlaySince: timestamp("player_x_auto_play_since"), // When player X auto-play started
  playerOAutoPlaySince: timestamp("player_o_auto_play_since"), // When player O auto-play started
  createdAt: timestamp("created_at").defaultNow(),
  finishedAt: timestamp("finished_at"),
});

export const roomParticipants = pgTable("room_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").references(() => rooms.id),
  userId: varchar("user_id").references(() => users.id),
  role: varchar("role").notNull(), // player, spectator
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const moves = pgTable("moves", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id").references(() => games.id),
  playerId: varchar("player_id").references(() => users.id),
  position: integer("position").notNull(),
  symbol: varchar("symbol").notNull(), // X or O
  moveNumber: integer("move_number").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const blockedUsers = pgTable("blocked_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  blockerId: varchar("blocker_id").references(() => users.id).notNull(),
  blockedId: varchar("blocked_id").references(() => users.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  // Prevent duplicate blocks
  index("unique_block").on(table.blockerId, table.blockedId),
]);

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  achievementType: varchar("achievement_type").notNull(), // first_win, win_streak_5, win_streak_10, master_of_diagonals, speed_demon, etc.
  achievementName: varchar("achievement_name").notNull(),
  description: varchar("description").notNull(),
  icon: varchar("icon").notNull(), // emoji or icon name
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  metadata: jsonb("metadata").default('{}'), // additional data like streak count, game time, etc.
}, (table) => [
  // Prevent duplicate achievements
  index("unique_achievement").on(table.userId, table.achievementType),
]);

export const userThemes = pgTable("user_themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  themeName: varchar("theme_name").notNull(), // halloween, christmas, summer, etc.
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  isUnlocked: boolean("is_unlocked").default(true),
}, (table) => [
  // Prevent duplicate theme unlocks
  index("unique_user_theme").on(table.userId, table.themeName),
]);

export const friendRequests = pgTable("friend_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  requestedId: varchar("requested_id").references(() => users.id).notNull(),
  status: varchar("status").default("pending"), // pending, accepted, rejected
  sentAt: timestamp("sent_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
}, (table) => [
  // Prevent duplicate friend requests
  index("unique_friend_request").on(table.requesterId, table.requestedId),
]);

export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  user1Id: varchar("user1_id").references(() => users.id).notNull(),
  user2Id: varchar("user2_id").references(() => users.id).notNull(),
  becameFriendsAt: timestamp("became_friends_at").defaultNow(),
}, (table) => [
  // Prevent duplicate friendships
  index("unique_friendship").on(table.user1Id, table.user2Id),
]);

export const roomInvitations = pgTable("room_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").references(() => rooms.id).notNull(),
  inviterId: varchar("inviter_id").references(() => users.id).notNull(),
  invitedId: varchar("invited_id").references(() => users.id).notNull(),
  status: varchar("status").default("pending"), // pending, accepted, rejected, expired
  invitedAt: timestamp("invited_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at").notNull(), // Invitations expire after 24 hours
}, (table) => [
  // Prevent duplicate room invitations
  index("unique_room_invitation").on(table.roomId, table.invitedId),
]);

export const coinTransactions = pgTable("coins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  gameId: uuid("game_id").references(() => games.id),
  amount: bigint("amount", { mode: 'number' }).notNull(), // positive for earned, negative for lost
  type: varchar("type").notNull(), // game_win, game_loss, game_draw
  balanceBefore: bigint("balance_before", { mode: 'number' }).notNull(),
  balanceAfter: bigint("balance_after", { mode: 'number' }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playAgainRequests = pgTable("play_again_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  requestedId: varchar("requested_id").references(() => users.id).notNull(),
  gameId: uuid("game_id").references(() => games.id).notNull(), // The finished game that prompted this request
  status: varchar("status").default("pending"), // pending, accepted, rejected, expired
  requestedAt: timestamp("requested_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
  expiresAt: timestamp("expires_at").notNull(), // Request expires after 5 minutes
}, (table) => [
  // Prevent duplicate play again requests for the same game
  index("unique_play_again_request").on(table.gameId, table.requesterId),
]);

// Level up notifications table
export const levelUps = pgTable("level_ups", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  previousLevel: integer("previous_level").notNull(),
  newLevel: integer("new_level").notNull(),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Monthly leaderboard table for tracking monthly statistics
export const monthlyLeaderboard = pgTable("monthly_leaderboard", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  monthlyWins: integer("monthly_wins").default(0),
  monthlyLosses: integer("monthly_losses").default(0),
  monthlyDraws: integer("monthly_draws").default(0),
  monthlyGames: integer("monthly_games").default(0),
  monthlyWinStreak: integer("monthly_win_streak").default(0),
  bestMonthlyWinStreak: integer("best_monthly_win_streak").default(0),
  coinsEarned: bigint("coins_earned", { mode: 'number' }).default(0), // Coins earned this month
  rewardReceived: boolean("reward_received").default(false),
  finalRank: integer("final_rank"), // Final rank at month end
  rewardAmount: bigint("reward_amount", { mode: 'number' }).default(0),
  rankPopupSeen: boolean("rank_popup_seen").default(false), // Whether user has seen their monthly rank popup
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure one record per user per month
  uniqueIndex("unique_user_month").on(table.userId, table.month, table.year),
]);

// Monthly rewards history table
export const monthlyRewards = pgTable("monthly_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  rank: integer("rank").notNull(), // 1, 2, or 3
  rewardAmount: bigint("reward_amount", { mode: 'number' }).notNull(),
  distributedAt: timestamp("distributed_at").defaultNow(),
}, (table) => [
  // Ensure one reward per rank per month and one reward per user per month
  uniqueIndex("unique_month_rank").on(table.year, table.month, table.rank),
  uniqueIndex("unique_user_month_reward").on(table.userId, table.year, table.month),
]);

export const monthlyResetStatus = pgTable("monthly_reset_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  status: varchar("status").notNull(), // 'pending', 'in_progress', 'completed', 'failed'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  nextRetryAt: timestamp("next_retry_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Unique constraint - one reset record per month/year
  uniqueIndex("unique_monthly_reset").on(table.month, table.year),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedRooms: many(rooms),
  gameParticipations: many(roomParticipants),
  gamesAsX: many(games, { relationName: "playerX" }),
  gamesAsO: many(games, { relationName: "playerO" }),
  wonGames: many(games, { relationName: "winner" }),
  moves: many(moves),
  blockedUsers: many(blockedUsers, { relationName: "blocker" }),
  blockedByUsers: many(blockedUsers, { relationName: "blocked" }),
  achievements: many(achievements),
  unlockedThemes: many(userThemes),
  sentFriendRequests: many(friendRequests, { relationName: "requester" }),
  receivedFriendRequests: many(friendRequests, { relationName: "requested" }),
  friendshipsAsUser1: many(friendships, { relationName: "user1" }),
  friendshipsAsUser2: many(friendships, { relationName: "user2" }),
  sentRoomInvitations: many(roomInvitations, { relationName: "inviter" }),
  receivedRoomInvitations: many(roomInvitations, { relationName: "invited" }),
  coinTransactions: many(coinTransactions),
  sentPlayAgainRequests: many(playAgainRequests, { relationName: "requester" }),
  receivedPlayAgainRequests: many(playAgainRequests, { relationName: "requested" }),
  levelUps: many(levelUps),
  monthlyStats: many(monthlyLeaderboard),
  monthlyRewards: many(monthlyRewards),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  owner: one(users, { fields: [rooms.ownerId], references: [users.id] }),
  participants: many(roomParticipants),
  games: many(games),
  invitations: many(roomInvitations),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  room: one(rooms, { fields: [games.roomId], references: [rooms.id] }),
  playerX: one(users, { fields: [games.playerXId], references: [users.id], relationName: "playerX" }),
  playerO: one(users, { fields: [games.playerOId], references: [users.id], relationName: "playerO" }),
  winner: one(users, { fields: [games.winnerId], references: [users.id], relationName: "winner" }),
  moves: many(moves),
  playAgainRequests: many(playAgainRequests),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  room: one(rooms, { fields: [roomParticipants.roomId], references: [rooms.id] }),
  user: one(users, { fields: [roomParticipants.userId], references: [users.id] }),
}));

export const movesRelations = relations(moves, ({ one }) => ({
  game: one(games, { fields: [moves.gameId], references: [games.id] }),
  player: one(users, { fields: [moves.playerId], references: [users.id] }),
}));

export const blockedUsersRelations = relations(blockedUsers, ({ one }) => ({
  blocker: one(users, { fields: [blockedUsers.blockerId], references: [users.id], relationName: "blocker" }),
  blocked: one(users, { fields: [blockedUsers.blockedId], references: [users.id], relationName: "blocked" }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, { fields: [achievements.userId], references: [users.id] }),
}));

export const userThemesRelations = relations(userThemes, ({ one }) => ({
  user: one(users, { fields: [userThemes.userId], references: [users.id] }),
}));

export const friendRequestsRelations = relations(friendRequests, ({ one }) => ({
  requester: one(users, { fields: [friendRequests.requesterId], references: [users.id], relationName: "requester" }),
  requested: one(users, { fields: [friendRequests.requestedId], references: [users.id], relationName: "requested" }),
}));

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user1: one(users, { fields: [friendships.user1Id], references: [users.id], relationName: "user1" }),
  user2: one(users, { fields: [friendships.user2Id], references: [users.id], relationName: "user2" }),
}));

export const roomInvitationsRelations = relations(roomInvitations, ({ one }) => ({
  room: one(rooms, { fields: [roomInvitations.roomId], references: [rooms.id] }),
  inviter: one(users, { fields: [roomInvitations.inviterId], references: [users.id], relationName: "inviter" }),
  invited: one(users, { fields: [roomInvitations.invitedId], references: [users.id], relationName: "invited" }),
}));

export const coinTransactionsRelations = relations(coinTransactions, ({ one }) => ({
  user: one(users, { fields: [coinTransactions.userId], references: [users.id] }),
  game: one(games, { fields: [coinTransactions.gameId], references: [games.id] }),
}));

export const playAgainRequestsRelations = relations(playAgainRequests, ({ one }) => ({
  requester: one(users, { fields: [playAgainRequests.requesterId], references: [users.id], relationName: "requester" }),
  requested: one(users, { fields: [playAgainRequests.requestedId], references: [users.id], relationName: "requested" }),
  game: one(games, { fields: [playAgainRequests.gameId], references: [games.id] }),
}));

export const monthlyLeaderboardRelations = relations(monthlyLeaderboard, ({ one }) => ({
  user: one(users, { fields: [monthlyLeaderboard.userId], references: [users.id] }),
}));

export const monthlyRewardsRelations = relations(monthlyRewards, ({ one }) => ({
  user: one(users, { fields: [monthlyRewards.userId], references: [users.id] }),
}));

// Schemas
export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  maxPlayers: true,
  isPrivate: true,
});

export const insertRoomInvitationSchema = createInsertSchema(roomInvitations).pick({
  roomId: true,
  invitedId: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  roomId: true,
  gameMode: true,
}).extend({
  playerXId: z.string().optional(),
  playerOId: z.string().optional(),
}).transform((data) => {
  // Remove null values, keep undefined for optional fields
  const cleaned = { ...data };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key as keyof typeof cleaned] === null) {
      delete cleaned[key as keyof typeof cleaned];
    }
  });
  return cleaned;
});

export const insertMoveSchema = createInsertSchema(moves).pick({
  gameId: true,
  playerId: true,
  position: true,
  symbol: true,
  moveNumber: true,
});

export const insertRoomParticipantSchema = createInsertSchema(roomParticipants).pick({
  roomId: true,
  userId: true,
  role: true,
});

export const insertBlockedUserSchema = createInsertSchema(blockedUsers).pick({
  blockerId: true,
  blockedId: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  userId: true,
  achievementType: true,
  achievementName: true,
  description: true,
  icon: true,
  metadata: true,
});

export const insertUserThemeSchema = createInsertSchema(userThemes).pick({
  userId: true,
  themeName: true,
  isUnlocked: true,
});

export const insertFriendRequestSchema = createInsertSchema(friendRequests).pick({
  requesterId: true,
  requestedId: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).pick({
  user1Id: true,
  user2Id: true,
});

export const insertCoinTransactionSchema = createInsertSchema(coinTransactions).pick({
  userId: true,
  gameId: true,
  amount: true,
  type: true,
  balanceBefore: true,
  balanceAfter: true,
});

export const insertPlayAgainRequestSchema = createInsertSchema(playAgainRequests).pick({
  requesterId: true,
  requestedId: true,
  gameId: true,
  expiresAt: true,
});

export const insertLevelUpSchema = createInsertSchema(levelUps).pick({
  userId: true,
  previousLevel: true,
  newLevel: true,
  acknowledged: true,
});

export const insertMonthlyLeaderboardSchema = createInsertSchema(monthlyLeaderboard).pick({
  userId: true,
  month: true,
  year: true,
}).extend({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(3000),
});

export const insertMonthlyRewardSchema = createInsertSchema(monthlyRewards).pick({
  userId: true,
  month: true,
  year: true,
  rank: true,
  rewardAmount: true,
}).extend({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(3000),
  rank: z.number().min(1).max(3),
  rewardAmount: z.number().positive(),
});

export const insertMonthlyResetStatusSchema = createInsertSchema(monthlyResetStatus).pick({
  month: true,
  year: true,
  status: true,
  startedAt: true,
  completedAt: true,
  errorMessage: true,
  retryCount: true,
  nextRetryAt: true,
}).extend({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(3000),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  retryCount: z.number().min(0).default(0),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Game = typeof games.$inferSelect;
export type RoomInvitation = typeof roomInvitations.$inferSelect;
export type Move = typeof moves.$inferSelect;
export type RoomParticipant = typeof roomParticipants.$inferSelect;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserTheme = typeof userThemes.$inferSelect;
export type FriendRequest = typeof friendRequests.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;

// Basic friend info type with only essential fields for fast loading
export type BasicFriendInfo = {
  id: string;
  username: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertMove = z.infer<typeof insertMoveSchema>;
export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserTheme = z.infer<typeof insertUserThemeSchema>;
export type InsertRoomInvitation = z.infer<typeof insertRoomInvitationSchema>;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = z.infer<typeof insertCoinTransactionSchema>;

export type PlayAgainRequest = typeof playAgainRequests.$inferSelect;
export type InsertPlayAgainRequest = z.infer<typeof insertPlayAgainRequestSchema>;
export type LevelUp = typeof levelUps.$inferSelect;
export type InsertLevelUp = z.infer<typeof insertLevelUpSchema>;
export type MonthlyLeaderboard = typeof monthlyLeaderboard.$inferSelect;
export type InsertMonthlyLeaderboard = z.infer<typeof insertMonthlyLeaderboardSchema>;
export type MonthlyReward = typeof monthlyRewards.$inferSelect;
export type InsertMonthlyReward = z.infer<typeof insertMonthlyRewardSchema>;
export type MonthlyResetStatus = typeof monthlyResetStatus.$inferSelect;
export type InsertMonthlyResetStatus = z.infer<typeof insertMonthlyResetStatusSchema>;
