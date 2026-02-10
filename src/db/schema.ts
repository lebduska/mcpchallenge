import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

// ==================== AUTH TABLES (NextAuth compatible) ====================

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  name: text("name"),
  username: text("username").unique(),
  image: text("image"),
  bio: text("bio"),
  passwordHash: text("password_hash"), // For credentials auth
  referredBy: text("referred_by"), // Referral code used at signup
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "oauth" | "credentials"
  provider: text("provider").notNull(), // "google" | "github" | "linkedin" | "credentials"
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.identifier, table.token] }),
]);

// ==================== ACHIEVEMENT TABLES ====================

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji or icon name
  category: text("category").notNull(), // "challenge" | "milestone" | "special"
  points: integer("points").notNull().default(0),
  rarity: text("rarity").notNull().default("common"), // "common" | "rare" | "epic" | "legendary"
  requirement: text("requirement"), // JSON string for complex requirements
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const userAchievements = sqliteTable("user_achievements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  metadata: text("metadata"), // JSON for extra context (e.g., score achieved)
});

// ==================== CHALLENGE TABLES ====================

export const challengeCompletions = sqliteTable("challenge_completions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: text("challenge_id").notNull(), // matches challenge IDs in code
  score: integer("score"), // optional score for scored challenges
  timeSpentMs: integer("time_spent_ms"), // time to complete
  completedAt: integer("completed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  metadata: text("metadata"), // JSON for challenge-specific data
});

// ==================== USER STATS TABLE ====================

export const userStats = sqliteTable("user_stats", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  challengesCompleted: integer("challenges_completed").notNull().default(0),
  achievementsUnlocked: integer("achievements_unlocked").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  dailyStreak: integer("daily_streak").notNull().default(0),
  longestDailyStreak: integer("longest_daily_streak").notNull().default(0),
  lastDailyCompletedAt: integer("last_daily_completed_at", { mode: "timestamp" }),
  // PvP stats
  pvpWins: integer("pvp_wins").notNull().default(0),
  pvpLosses: integer("pvp_losses").notNull().default(0),
  pvpRating: integer("pvp_rating").notNull().default(1000), // ELO-style rating, starting at 1000
  pvpWinStreak: integer("pvp_win_streak").notNull().default(0),
  pvpBestWinStreak: integer("pvp_best_win_streak").notNull().default(0),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== CHALLENGE PROGRESS TABLES ====================

export const challengeProgress = sqliteTable("challenge_progress", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: text("challenge_id").notNull(),
  maxLevelUnlocked: integer("max_level_unlocked").notNull().default(1),
  lastLevel: integer("last_level").notNull().default(1),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const levelBest = sqliteTable("level_best", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: text("challenge_id").notNull(),
  levelId: text("level_id").notNull(),
  bestMoves: integer("best_moves"),
  bestPushes: integer("best_pushes"),
  bestTimeMs: integer("best_time_ms"),
  bestReplayId: text("best_replay_id"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== REPLAY TABLES ====================

export const replays = sqliteTable("replays", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  challengeId: text("challenge_id").notNull(),
  levelId: text("level_id"),
  seed: text("seed"),
  movesJson: text("moves_json").notNull(),
  resultJson: text("result_json"),
  agentSnapshotJson: text("agent_snapshot_json"), // Agent identity snapshot (if MCP agent)
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const shareLinks = sqliteTable("share_links", {
  id: text("id").primaryKey(), // short code (8 chars)
  replayId: text("replay_id").notNull().references(() => replays.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  visibility: text("visibility").notNull().default("unlisted"),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== CHALLENGE IDEAS TABLES ====================

export const challengeIdeas = sqliteTable("challenge_ideas", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("game"), // "game" | "creative" | "puzzle" | "educational"
  gameReference: text("game_reference"), // Reference to existing game/concept
  status: text("status").notNull().default("pending"), // "pending" | "approved" | "in_progress" | "implemented" | "rejected"
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  voteCount: integer("vote_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  adminNotes: text("admin_notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const ideaVotes = sqliteTable("idea_votes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ideaId: text("idea_id").notNull().references(() => challengeIdeas.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voteType: integer("vote_type").notNull().default(1), // 1 = upvote, -1 = downvote
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const ideaComments = sqliteTable("idea_comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  ideaId: text("idea_id").notNull().references(() => challengeIdeas.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id"), // Self-reference handled at DB level, not in Drizzle
  content: text("content").notNull(),
  isEdited: integer("is_edited", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== GALLERY TABLES ====================

export const galleryImages = sqliteTable("gallery_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  challengeId: text("challenge_id").notNull(),
  r2Key: text("r2_key").notNull().unique(),
  title: text("title"),
  width: integer("width").notNull().default(512),
  height: integer("height").notNull().default(512),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull().default("image/png"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== CODE SNIPPETS ====================

export const codeSnippets = sqliteTable("code_snippets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  language: text("language").notNull().default("json"),
  code: text("code").notNull(),
  challengeId: text("challenge_id"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  isCurated: integer("is_curated", { mode: "boolean" }).notNull().default(false), // Official snippets
  clientType: text("client_type"), // "claude-code" | "cursor" | "windsurf" | "generic"
  sortOrder: integer("sort_order").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== AI EXAMPLES ====================

export const aiExamples = sqliteTable("ai_examples", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  challengeId: text("challenge_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  strategy: text("strategy").notNull(), // "random" | "minimax" | "a-star" | "greedy" | "claude" | "openai" | "gemini"
  difficulty: text("difficulty").notNull().default("intermediate"), // "beginner" | "intermediate" | "advanced"
  language: text("language").notNull().default("typescript"),
  code: text("code").notNull(),
  aiProvider: text("ai_provider"), // "claude" | "openai" | "gemini" | null (for algorithmic)
  estimatedTokens: integer("estimated_tokens"), // Approximate tokens per move for AI providers
  sortOrder: integer("sort_order").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== DAILY CHALLENGE ====================

export const dailyChallenges = sqliteTable("daily_challenges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: text("date").notNull().unique(), // YYYY-MM-DD format, UTC
  challengeId: text("challenge_id").notNull(),
  seed: text("seed"), // Deterministic seed for level generation
  difficulty: text("difficulty").notNull().default("normal"), // "easy" | "normal" | "hard"
  bonusPoints: integer("bonus_points").notNull().default(50),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const dailyChallengeCompletions = sqliteTable("daily_challenge_completions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dailyChallengeId: text("daily_challenge_id").notNull().references(() => dailyChallenges.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  timeSpentMs: integer("time_spent_ms"),
  completedAt: integer("completed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== REFERRAL SYSTEM ====================

export const referralCodes = sqliteTable("referral_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(), // Short unique code (e.g., "ABC123")
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  usageCount: integer("usage_count").notNull().default(0),
  maxUses: integer("max_uses"), // null = unlimited
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  referrerId: text("referrer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refereeId: text("referee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  codeUsed: text("code_used").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "qualified" | "rewarded"
  qualifiedAt: integer("qualified_at", { mode: "timestamp" }), // When referee completed first challenge
  rewardedAt: integer("rewarded_at", { mode: "timestamp" }), // When both got rewards
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ==================== PVP MULTIPLAYER ====================

export const pvpMatches = sqliteTable("pvp_matches", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomId: text("room_id").notNull(), // Durable Object room ID
  gameType: text("game_type").notNull(), // "chess" | "tic-tac-toe"
  whiteUserId: text("white_user_id").references(() => users.id, { onDelete: "set null" }),
  blackUserId: text("black_user_id").references(() => users.id, { onDelete: "set null" }),
  winnerId: text("winner_id").references(() => users.id, { onDelete: "set null" }),
  result: text("result").notNull().default("pending"), // "pending" | "white_wins" | "black_wins" | "draw" | "abandoned"
  whiteRatingBefore: integer("white_rating_before"),
  blackRatingBefore: integer("black_rating_before"),
  whiteRatingChange: integer("white_rating_change"),
  blackRatingChange: integer("black_rating_change"),
  movesJson: text("moves_json"), // JSON array of moves
  totalMoves: integer("total_moves").notNull().default(0),
  durationMs: integer("duration_ms"), // Match duration in milliseconds
  startedAt: integer("started_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  endedAt: integer("ended_at", { mode: "timestamp" }),
});

export const matchmakingQueue = sqliteTable("matchmaking_queue", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gameType: text("game_type").notNull(), // "chess" | "tic-tac-toe"
  rating: integer("rating").notNull().default(1000),
  status: text("status").notNull().default("waiting"), // "waiting" | "matched" | "cancelled"
  matchedWithUserId: text("matched_with_user_id").references(() => users.id, { onDelete: "set null" }),
  matchedRoomId: text("matched_room_id"),
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  matchedAt: integer("matched_at", { mode: "timestamp" }),
});

// ==================== CHALLENGE COMMENTS ====================

export const challengeComments = sqliteTable("challenge_comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  challengeId: text("challenge_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  parentId: text("parent_id"),
  content: text("content").notNull(),
  isTip: integer("is_tip", { mode: "boolean" }).notNull().default(false),
  likeCount: integer("like_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const commentLikes = sqliteTable("comment_likes", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  commentId: text("comment_id").notNull().references(() => challengeComments.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => [
  primaryKey({ columns: [table.userId, table.commentId] }),
]);

// ==================== TYPES ====================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type ChallengeCompletion = typeof challengeCompletions.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type ChallengeProgress = typeof challengeProgress.$inferSelect;
export type LevelBest = typeof levelBest.$inferSelect;
export type Replay = typeof replays.$inferSelect;
export type ShareLink = typeof shareLinks.$inferSelect;
export type ChallengeIdea = typeof challengeIdeas.$inferSelect;
export type NewChallengeIdea = typeof challengeIdeas.$inferInsert;
export type IdeaVote = typeof ideaVotes.$inferSelect;
export type IdeaComment = typeof ideaComments.$inferSelect;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type NewGalleryImage = typeof galleryImages.$inferInsert;
export type CodeSnippet = typeof codeSnippets.$inferSelect;
export type NewCodeSnippet = typeof codeSnippets.$inferInsert;
export type ChallengeComment = typeof challengeComments.$inferSelect;
export type NewChallengeComment = typeof challengeComments.$inferInsert;
export type AiExample = typeof aiExamples.$inferSelect;
export type NewAiExample = typeof aiExamples.$inferInsert;
export type DailyChallenge = typeof dailyChallenges.$inferSelect;
export type NewDailyChallenge = typeof dailyChallenges.$inferInsert;
export type DailyChallengeCompletion = typeof dailyChallengeCompletions.$inferSelect;
export type NewDailyChallengeCompletion = typeof dailyChallengeCompletions.$inferInsert;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type NewReferralCode = typeof referralCodes.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type PvpMatch = typeof pvpMatches.$inferSelect;
export type NewPvpMatch = typeof pvpMatches.$inferInsert;
export type MatchmakingQueueEntry = typeof matchmakingQueue.$inferSelect;
export type NewMatchmakingQueueEntry = typeof matchmakingQueue.$inferInsert;
