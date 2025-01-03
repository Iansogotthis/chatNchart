import type { Express } from "express";
import { createServer } from "http";
import { setupAuth } from "./auth";
import { db } from "../db";
import { charts, forumPosts, friends, users, squareCustomizations } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { saveSquareCustomization, getSquareCustomizations } from "./routes/chart";

export function registerRoutes(app: Express) {
  // Register auth routes and middleware first
  setupAuth(app);
  const httpServer = createServer(app);

  // Debug route to check auth status
  app.get("/api/auth-status", (req, res) => {
    res.json({
      isAuthenticated: req.isAuthenticated?.(),
      user: req.user
    });
  });

  // Chart routes
  app.get("/api/charts", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");
    const userCharts = await db.select().from(charts).where(eq(charts.userId, req.user.id));
    res.json(userCharts);
  });

  app.post("/api/charts", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");
    try {
      const [chart] = await db.insert(charts).values({
        userId: req.user.id,
        title: req.body.title,
        data: req.body.data,
      }).returning();
      res.json(chart);
    } catch (error) {
      console.error('Error creating chart:', error);
      res.status(500).json({ error: 'Failed to create chart' });
    }
  });

  app.put("/api/charts/:id", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const [chart] = await db
        .select()
        .from(charts)
        .where(and(
          eq(charts.id, parseInt(req.params.id)),
          eq(charts.userId, req.user.id)
        ))
        .limit(1);

      if (!chart) {
        return res.status(404).send("Chart not found");
      }

      const [updatedChart] = await db
        .update(charts)
        .set({
          title: req.body.title,
          data: req.body.data,
          updatedAt: new Date(),
        })
        .where(eq(charts.id, parseInt(req.params.id)))
        .returning();

      res.json(updatedChart);
    } catch (error) {
      console.error('Error updating chart:', error);
      res.status(500).json({ error: 'Failed to update chart' });
    }
  });

  // Square customization routes
  app.post("/api/square-customization", saveSquareCustomization);
  app.get("/api/square-customization/:chartId", getSquareCustomizations);

  // Forum routes
  app.get("/api/forum/posts", async (_req, res) => {
    const posts = await db.select().from(forumPosts);
    res.json(posts);
  });

  app.post("/api/forum/posts", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");
    const [post] = await db.insert(forumPosts).values({
      userId: req.user.id,
      title: req.body.title,
      content: req.body.content,
    }).returning();
    res.json(post);
  });

  // User profile routes
  app.get("/api/users/:username", async (req, res) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, req.params.username))
      .limit(1);

    if (!user) return res.status(404).send("User not found");

    const userCharts = await db
      .select()
      .from(charts)
      .where(eq(charts.userId, user.id))
      .limit(5);

    res.json({
      ...user,
      topCharts: userCharts,
    });
  });

  // Friend routes
  app.get("/api/users/:username/friends", async (req, res) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, req.params.username))
      .limit(1);

    if (!user) return res.status(404).send("User not found");

    const userFriends = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.userId, user.id),
          eq(friends.status, "accepted")
        )
      );

    res.json(userFriends);
  });

  return httpServer;
}