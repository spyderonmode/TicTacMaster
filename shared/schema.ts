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
  coins: bigint("coins", { mode: 'number' }).default(15000).notNull(), // Starting coins for new users
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
  betAmount: bigint("bet_amount", { mode: 'number' }).default(5000).notNull(), // Bet amount: 5k, 50k, 250k, 1m, 10m
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

export const userPieceStyles = pgTable("user_piece_styles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  styleName: varchar("style_name").notNull(), // default, thunder, etc.
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  isActive: boolean("is_active").default(false), // Whether this style is currently selected
}, (table) => [
  // Prevent duplicate piece style unlocks
  index("unique_user_piece_style").on(table.userId, table.styleName),
]);

// Animated emojis that can be sent during games
export const emojiItems = pgTable("emoji_items", {
  id: varchar("id").primaryKey(), // rose, heart, fire, trophy, etc.
  name: varchar("name").notNull(), // Display name
  description: text("description").notNull(),
  price: bigint("price", { mode: 'number' }).notNull(), // Cost in coins
  animationType: varchar("animation_type").notNull(), // fly, float, spin, etc.
  isActive: boolean("is_active").default(true), // Can be purchased/used
  createdAt: timestamp("created_at").defaultNow(),
});

// User's purchased emojis
export const userEmojis = pgTable("user_emojis", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  emojiId: varchar("emoji_id").references(() => emojiItems.id).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
}, (table) => [
  // Prevent duplicate emoji purchases
  index("unique_user_emoji").on(table.userId, table.emojiId),
]);

// Avatar frames that can be purchased
export const avatarFrameItems = pgTable("avatar_frame_items", {
  id: varchar("id").primaryKey(), // thundering, level_100_master, ultimate_veteran, etc.
  name: varchar("name").notNull(), // Display name
  description: text("description").notNull(),
  price: bigint("price", { mode: 'number' }).notNull(), // Cost in coins
  isActive: boolean("is_active").default(true), // Can be purchased/used
  createdAt: timestamp("created_at").defaultNow(),
});

// User's purchased avatar frames
export const userAvatarFrames = pgTable("user_avatar_frames", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  frameId: varchar("frame_id").references(() => avatarFrameItems.id).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  isActive: boolean("is_active").default(false), // Whether this frame is currently selected
}, (table) => [
  // Prevent duplicate frame purchases
  index("unique_user_frame").on(table.userId, table.frameId),
]);

// Track emoji sends during games for real-time animation
export const gameEmojiSends = pgTable("game_emoji_sends", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id").references(() => games.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  emojiId: varchar("emoji_id").references(() => emojiItems.id).notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
});

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
  type: varchar("type").notNull(), // game_win, game_loss, game_draw, gift_sent, gift_received
  balanceBefore: bigint("balance_before", { mode: 'number' }).notNull(),
  balanceAfter: bigint("balance_after", { mode: 'number' }).notNull(),
  // Gift-specific fields
  recipientId: varchar("recipient_id").references(() => users.id), // For gift_sent transactions
  senderId: varchar("sender_id").references(() => users.id), // For gift_received transactions  
  giftMessage: text("gift_message"), // Optional message with the gift
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

// Weekly leaderboard table for tracking weekly statistics
export const weeklyLeaderboard = pgTable("weekly_leaderboard", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weekNumber: integer("week_number").notNull(), // 1-53
  year: integer("year").notNull(),
  weeklyWins: integer("weekly_wins").default(0),
  weeklyLosses: integer("weekly_losses").default(0),
  weeklyDraws: integer("weekly_draws").default(0),
  weeklyGames: integer("weekly_games").default(0),
  weeklyWinStreak: integer("weekly_win_streak").default(0),
  bestWeeklyWinStreak: integer("best_weekly_win_streak").default(0),
  coinsEarned: bigint("coins_earned", { mode: 'number' }).default(0), // Coins earned this week
  rewardReceived: boolean("reward_received").default(false),
  finalRank: integer("final_rank"), // Final rank at week end
  rewardAmount: bigint("reward_amount", { mode: 'number' }).default(0),
  rankPopupSeen: boolean("rank_popup_seen").default(false), // Whether user has seen their weekly rank popup
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Ensure one record per user per week
  uniqueIndex("unique_user_week").on(table.userId, table.weekNumber, table.year),
  // Index for optimal weekly queries
  index("idx_week_scope").on(table.year, table.weekNumber),
]);

// Weekly rewards history table
export const weeklyRewards = pgTable("weekly_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  rank: integer("rank").notNull(), // 1, 2, or 3
  rewardAmount: bigint("reward_amount", { mode: 'number' }).notNull(),
  distributedAt: timestamp("distributed_at").defaultNow(),
}, (table) => [
  // Ensure one reward per rank per week and one reward per user per week
  uniqueIndex("unique_week_rank").on(table.year, table.weekNumber, table.rank),
  uniqueIndex("unique_user_week_reward").on(table.userId, table.year, table.weekNumber),
]);

export const weeklyResetStatus = pgTable("weekly_reset_status", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekNumber: integer("week_number").notNull(), // 1-53
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
  // Unique constraint - one reset record per week/year
  uniqueIndex("unique_weekly_reset").on(table.weekNumber, table.year),
]);

// Daily rewards tracking table
export const dailyRewards = pgTable("daily_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  lastClaimDate: timestamp("last_claim_date"), // Last time user claimed daily reward
  currentStreak: integer("current_streak").default(0), // Consecutive days claimed
  bestStreak: integer("best_streak").default(0), // Highest streak achieved
  totalClaimed: integer("total_claimed").default(0), // Total number of rewards claimed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Index for quick user lookups
  index("idx_daily_rewards_user").on(table.userId),
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
  unlockedPieceStyles: many(userPieceStyles),
  unlockedAvatarFrames: many(userAvatarFrames),
  sentFriendRequests: many(friendRequests, { relationName: "requester" }),
  receivedFriendRequests: many(friendRequests, { relationName: "requested" }),
  friendshipsAsUser1: many(friendships, { relationName: "user1" }),
  friendshipsAsUser2: many(friendships, { relationName: "user2" }),
  sentRoomInvitations: many(roomInvitations, { relationName: "inviter" }),
  receivedRoomInvitations: many(roomInvitations, { relationName: "invited" }),
  coinTransactions: many(coinTransactions),
  sentGifts: many(coinTransactions, { relationName: "giftRecipient" }),
  receivedGifts: many(coinTransactions, { relationName: "giftSender" }),
  sentPlayAgainRequests: many(playAgainRequests, { relationName: "requester" }),
  receivedPlayAgainRequests: many(playAgainRequests, { relationName: "requested" }),
  levelUps: many(levelUps),
  weeklyStats: many(weeklyLeaderboard),
  weeklyRewards: many(weeklyRewards),
  dailyReward: many(dailyRewards),
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

export const userPieceStylesRelations = relations(userPieceStyles, ({ one }) => ({
  user: one(users, { fields: [userPieceStyles.userId], references: [users.id] }),
}));

export const userAvatarFramesRelations = relations(userAvatarFrames, ({ one }) => ({
  user: one(users, { fields: [userAvatarFrames.userId], references: [users.id] }),
  frame: one(avatarFrameItems, { fields: [userAvatarFrames.frameId], references: [avatarFrameItems.id] }),
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
  recipient: one(users, { fields: [coinTransactions.recipientId], references: [users.id], relationName: "giftRecipient" }),
  sender: one(users, { fields: [coinTransactions.senderId], references: [users.id], relationName: "giftSender" }),
}));

export const playAgainRequestsRelations = relations(playAgainRequests, ({ one }) => ({
  requester: one(users, { fields: [playAgainRequests.requesterId], references: [users.id], relationName: "requester" }),
  requested: one(users, { fields: [playAgainRequests.requestedId], references: [users.id], relationName: "requested" }),
  game: one(games, { fields: [playAgainRequests.gameId], references: [games.id] }),
}));

export const weeklyLeaderboardRelations = relations(weeklyLeaderboard, ({ one }) => ({
  user: one(users, { fields: [weeklyLeaderboard.userId], references: [users.id] }),
}));

export const weeklyRewardsRelations = relations(weeklyRewards, ({ one }) => ({
  user: one(users, { fields: [weeklyRewards.userId], references: [users.id] }),
}));

export const dailyRewardsRelations = relations(dailyRewards, ({ one }) => ({
  user: one(users, { fields: [dailyRewards.userId], references: [users.id] }),
}));

// Schemas
export const insertRoomSchema = createInsertSchema(rooms).pick({
  maxPlayers: true,
  isPrivate: true,
  betAmount: true,
}).extend({
  name: z.string().optional().default('Game Room'), // Auto-generate name if not provided
  betAmount: z.number().refine((val) => [5000, 50000, 250000, 1000000, 10000000].includes(val), {
    message: "Bet amount must be 5000, 50000, 250000, 1000000, or 10000000 coins",
  }),
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

export const insertUserPieceStyleSchema = createInsertSchema(userPieceStyles).pick({
  userId: true,
  styleName: true,
  isActive: true,
});

export const insertEmojiItemSchema = createInsertSchema(emojiItems).pick({
  id: true,
  name: true,
  description: true,
  price: true,
  animationType: true,
  isActive: true,
});

export const insertUserEmojiSchema = createInsertSchema(userEmojis).pick({
  userId: true,
  emojiId: true,
});

export const insertAvatarFrameItemSchema = createInsertSchema(avatarFrameItems).pick({
  id: true,
  name: true,
  description: true,
  price: true,
  isActive: true,
});

export const insertUserAvatarFrameSchema = createInsertSchema(userAvatarFrames).pick({
  userId: true,
  frameId: true,
  isActive: true,
});

export const insertGameEmojiSendSchema = createInsertSchema(gameEmojiSends).pick({
  gameId: true,
  senderId: true,
  recipientId: true,
  emojiId: true,
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
  recipientId: true,
  senderId: true,
  giftMessage: true,
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

export const insertWeeklyLeaderboardSchema = createInsertSchema(weeklyLeaderboard).pick({
  userId: true,
  weekNumber: true,
  year: true,
}).extend({
  weekNumber: z.number().min(1).max(53),
  year: z.number().min(2000).max(3000),
});

export const insertWeeklyRewardSchema = createInsertSchema(weeklyRewards).pick({
  userId: true,
  weekNumber: true,
  year: true,
  rank: true,
  rewardAmount: true,
}).extend({
  weekNumber: z.number().min(1).max(53),
  year: z.number().min(2000).max(3000),
  rank: z.number().min(1).max(3),
  rewardAmount: z.number().positive(),
});

export const insertWeeklyResetStatusSchema = createInsertSchema(weeklyResetStatus).pick({
  weekNumber: true,
  year: true,
  status: true,
  startedAt: true,
  completedAt: true,
  errorMessage: true,
  retryCount: true,
  nextRetryAt: true,
}).extend({
  weekNumber: z.number().min(1).max(53),
  year: z.number().min(2000).max(3000),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  retryCount: z.number().min(0).default(0),
});

export const insertDailyRewardSchema = createInsertSchema(dailyRewards).pick({
  userId: true,
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
export type UserPieceStyle = typeof userPieceStyles.$inferSelect;
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

export type EmojiItem = typeof emojiItems.$inferSelect;
export type UserEmoji = typeof userEmojis.$inferSelect;
export type GameEmojiSend = typeof gameEmojiSends.$inferSelect;
export type InsertEmojiItem = z.infer<typeof insertEmojiItemSchema>;
export type InsertUserEmoji = z.infer<typeof insertUserEmojiSchema>;
export type InsertGameEmojiSend = z.infer<typeof insertGameEmojiSendSchema>;

export type AvatarFrameItem = typeof avatarFrameItems.$inferSelect;
export type UserAvatarFrame = typeof userAvatarFrames.$inferSelect;
export type InsertAvatarFrameItem = z.infer<typeof insertAvatarFrameItemSchema>;
export type InsertUserAvatarFrame = z.infer<typeof insertUserAvatarFrameSchema>;

export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertMove = z.infer<typeof insertMoveSchema>;
export type InsertRoomParticipant = z.infer<typeof insertRoomParticipantSchema>;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserTheme = z.infer<typeof insertUserThemeSchema>;
export type InsertUserPieceStyle = z.infer<typeof insertUserPieceStyleSchema>;
export type InsertRoomInvitation = z.infer<typeof insertRoomInvitationSchema>;
export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = z.infer<typeof insertCoinTransactionSchema>;

export type PlayAgainRequest = typeof playAgainRequests.$inferSelect;
export type InsertPlayAgainRequest = z.infer<typeof insertPlayAgainRequestSchema>;
export type LevelUp = typeof levelUps.$inferSelect;
export type InsertLevelUp = z.infer<typeof insertLevelUpSchema>;
export type WeeklyLeaderboard = typeof weeklyLeaderboard.$inferSelect;
export type InsertWeeklyLeaderboard = z.infer<typeof insertWeeklyLeaderboardSchema>;
export type WeeklyReward = typeof weeklyRewards.$inferSelect;
export type InsertWeeklyReward = z.infer<typeof insertWeeklyRewardSchema>;
export type WeeklyResetStatus = typeof weeklyResetStatus.$inferSelect;
export type InsertWeeklyResetStatus = z.infer<typeof insertWeeklyResetStatusSchema>;
export type DailyReward = typeof dailyRewards.$inferSelect;
export type InsertDailyReward = z.infer<typeof insertDailyRewardSchema>;
