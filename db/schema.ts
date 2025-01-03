import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Users table - extending existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  bio: text("bio"),
  funFacts: text("fun_facts").array(),
  createdAt: timestamp("created_at").defaultNow(),
  lastOnline: timestamp("last_online"),
  // Personal Information
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  // Social Links
  socials: jsonb("socials").default({
    linkedin: "",
    facebook: "",
    instagram: "",
    twitter: "",
    ziprecruiter: "",
    reddit: "",
  }),
  // Favorites
  favorites: jsonb("favorites").default({
    book: "",
    song: "",
    actor: "",
    movie: "",
    episode: "",
    character: "",
  }),
  // Hobbies and Talents
  hobbies: text("hobbies").array(),
  talents: text("talents").array(),
  // Professional Information
  professional: jsonb("professional").default({
    field: "",
    company: "",
    position: "",
    experience: "",
  }),
  certifications: jsonb("certifications").array(),
  resumeUrl: text("resume_url"),
});

// Charts table
export const charts = pgTable("charts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  data: jsonb("data").notNull(),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id),
  receiverId: integer("receiver_id").references(() => users.id),
  content: text("content").notNull(),
  status: text("status").notNull().default('unread'),
  isImportant: boolean("is_important").default(false),
  isRead: boolean("is_read").default(false),
  isDraft: boolean("is_draft").default(false),
  projectId: integer("project_id"),
  folder: text("folder"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved charts table
export const savedCharts = pgTable("saved_charts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  chartId: integer("chart_id").references(() => charts.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chart likes table
export const chartLikes = pgTable("chart_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  chartId: integer("chart_id").references(() => charts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Square customizations table
export const squareCustomizations = pgTable("square_customizations", {
  id: serial("id").primaryKey(),
  chartId: integer("chart_id").references(() => charts.id),
  squareClass: text("square_class").notNull(),
  parentText: text("parent_text").notNull(),
  depth: integer("depth").notNull(),
  title: text("title"),
  priority: jsonb("priority").notNull(),
  urgency: text("urgency").notNull(),
  aesthetic: jsonb("aesthetic").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Forum posts table
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friends table
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  friendId: integer("friend_id").references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Collaboration requests table
export const collaborationRequests = pgTable("collaboration_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  friendId: integer("friend_id").references(() => users.id),
  chartId: integer("chart_id").references(() => charts.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // message, friend_request, collab_request, chart_like
  sourceId: integer("source_id").notNull(), // ID of the related entity (message, friend request, etc.)
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  charts: many(charts),
  posts: many(forumPosts),
  friends: many(friends),
  collaborationRequests: many(collaborationRequests),
  sentMessages: many(messages, {
    relationName: "sentMessages"
  }),
  receivedMessages: many(messages, {
    relationName: "receivedMessages"
  }),
  savedCharts: many(savedCharts),
  chartLikes: many(chartLikes),
  notifications: many(notifications),
}));

export const chartRelations = relations(charts, ({ one, many }) => ({
  user: one(users, {
    fields: [charts.userId],
    references: [users.id],
  }),
  likes: many(chartLikes),
  savedBy: many(savedCharts),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertChartSchema = createInsertSchema(charts);
export const selectChartSchema = createSelectSchema(charts);

export const insertPostSchema = createInsertSchema(forumPosts);
export const selectPostSchema = createSelectSchema(forumPosts);

export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);

export type User = typeof users.$inferSelect;
export type Chart = typeof charts.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type Friend = typeof friends.$inferSelect;
export type CollaborationRequest = typeof collaborationRequests.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type SavedChart = typeof savedCharts.$inferSelect;
export type ChartLike = typeof chartLikes.$inferSelect;
export type Notification = typeof notifications.$inferSelect;