import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

// Users table - extending existing users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  bio: text("bio"),
  funFacts: text("fun_facts").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Charts table
export const charts = pgTable("charts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  data: jsonb("data").notNull(),
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

// Relations
export const userRelations = relations(users, ({ many }) => ({
  charts: many(charts),
  posts: many(forumPosts),
  friends: many(friends),
}));

export const chartRelations = relations(charts, ({ one }) => ({
  user: one(users, {
    fields: [charts.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertChartSchema = createInsertSchema(charts);
export const selectChartSchema = createSelectSchema(charts);

export const insertPostSchema = createInsertSchema(forumPosts);
export const selectPostSchema = createSelectSchema(forumPosts);

export type User = typeof users.$inferSelect;
export type Chart = typeof charts.$inferSelect;
export type ForumPost = typeof forumPosts.$inferSelect;
export type Friend = typeof friends.$inferSelect;
