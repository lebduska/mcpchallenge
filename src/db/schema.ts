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
