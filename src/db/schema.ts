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
