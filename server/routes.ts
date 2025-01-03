import type { Express } from "express";
import { createServer } from "http";
import { setupAuth } from "./auth";
import { db } from "../db";
import { 
  charts, 
  messages as messagesTable,
  savedCharts,
  chartLikes,
  notifications as notificationsTable,
  forumPosts, 
  friends, 
  users,
  squareCustomizations 
} from "../db/schema";
import { eq, and, desc, or } from "drizzle-orm";
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

  // Message routes
  app.get("/api/messages", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const messages = await db
        .select({
          id: messagesTable.id,
          content: messagesTable.content,
          isRead: messagesTable.isRead,
          createdAt: messagesTable.createdAt,
          senderId: messagesTable.senderId,
          receiverId: messagesTable.receiverId,
          sender: {
            id: users.id,
            username: users.username,
          },
          receiver: {
            id: users.id,
            username: users.username,
          },
        })
        .from(messagesTable)
        .where(or(
          eq(messagesTable.senderId, req.user.id),
          eq(messagesTable.receiverId, req.user.id)
        ))
        .leftJoin(users, eq(messagesTable.senderId, users.id))
        .leftJoin(users, eq(messagesTable.receiverId, users.id))
        .orderBy(desc(messagesTable.createdAt));

      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const [message] = await db.insert(messagesTable).values({
        senderId: req.user.id,
        receiverId: parseInt(req.body.receiverId),
        content: req.body.content,
      }).returning();

      // Create notification for the receiver
      await db.insert(notificationsTable).values({
        userId: parseInt(req.body.receiverId),
        type: 'message',
        sourceId: message.id,
      });

      // Fetch the complete message with sender and receiver info
      const [completeMessage] = await db
        .select({
          id: messagesTable.id,
          content: messagesTable.content,
          isRead: messagesTable.isRead,
          createdAt: messagesTable.createdAt,
          senderId: messagesTable.senderId,
          receiverId: messagesTable.receiverId,
          sender: {
            id: users.id,
            username: users.username,
          },
          receiver: {
            id: users.id,
            username: users.username,
          },
        })
        .from(messagesTable)
        .where(eq(messagesTable.id, message.id))
        .leftJoin(users, eq(messagesTable.senderId, users.id))
        .limit(1);

      res.json(completeMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Saved charts routes
  app.get("/api/saved-charts", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const saved = await db
        .select({
          id: savedCharts.id,
          notes: savedCharts.notes,
          createdAt: savedCharts.createdAt,
          chart: {
            id: charts.id,
            title: charts.title,
            data: charts.data,
            creator: {
              id: users.id,
              username: users.username,
            },
          },
        })
        .from(savedCharts)
        .where(eq(savedCharts.userId, req.user.id))
        .leftJoin(charts, eq(savedCharts.chartId, charts.id))
        .leftJoin(users, eq(charts.userId, users.id));

      res.json(saved);
    } catch (error) {
      console.error('Error fetching saved charts:', error);
      res.status(500).json({ error: 'Failed to fetch saved charts' });
    }
  });

  app.post("/api/saved-charts", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const [saved] = await db.insert(savedCharts).values({
        userId: req.user.id,
        chartId: req.body.chartId,
        notes: req.body.notes,
      }).returning();

      res.json(saved);
    } catch (error) {
      console.error('Error saving chart:', error);
      res.status(500).json({ error: 'Failed to save chart' });
    }
  });

  // Chart likes routes
  app.post("/api/charts/:id/like", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const [like] = await db.insert(chartLikes).values({
        userId: req.user.id,
        chartId: parseInt(req.params.id),
      }).returning();

      // Create notification for the chart owner
      const [chart] = await db
        .select()
        .from(charts)
        .where(eq(charts.id, parseInt(req.params.id)))
        .limit(1);

      if (chart && chart.userId !== req.user.id) {
        await db.insert(notificationsTable).values({
          userId: chart.userId,
          type: 'chart_like',
          sourceId: like.id,
        });
      }

      res.json(like);
    } catch (error) {
      console.error('Error liking chart:', error);
      res.status(500).json({ error: 'Failed to like chart' });
    }
  });

  app.delete("/api/charts/:id/like", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      await db
        .delete(chartLikes)
        .where(and(
          eq(chartLikes.userId, req.user.id),
          eq(chartLikes.chartId, parseInt(req.params.id))
        ));

      res.json({ success: true });
    } catch (error) {
      console.error('Error unliking chart:', error);
      res.status(500).json({ error: 'Failed to unlike chart' });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const notifications = await db
        .select()
        .from(notificationsTable)
        .where(eq(notificationsTable.userId, req.user.id))
        .orderBy(desc(notificationsTable.createdAt));

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.patch("/api/notifications/:id", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const [notification] = await db
        .update(notificationsTable)
        .set({ isRead: true })
        .where(and(
          eq(notificationsTable.id, parseInt(req.params.id)),
          eq(notificationsTable.userId, req.user.id)
        ))
        .returning();

      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to update notification' });
    }
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
    try {
      const posts = await db
        .select({
          id: forumPosts.id,
          title: forumPosts.title,
          content: forumPosts.content,
          createdAt: forumPosts.createdAt,
          author: {
            id: users.id,
            username: users.username,
          },
        })
        .from(forumPosts)
        .leftJoin(users, eq(forumPosts.userId, users.id))
        .orderBy(desc(forumPosts.createdAt));

      const transformedPosts = posts.map(post => ({
        ...post,
        author: post.author?.id ? post.author : null
      }));

      res.json(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  app.post("/api/forum/posts", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");
    try {
      const [post] = await db.insert(forumPosts).values({
        userId: req.user.id,
        title: req.body.title,
        content: req.body.content,
      }).returning();

      // Fetch the created post with author information
      const [createdPost] = await db
        .select({
          id: forumPosts.id,
          title: forumPosts.title,
          content: forumPosts.content,
          createdAt: forumPosts.createdAt,
          author: {
            id: users.id,
            username: users.username,
          },
        })
        .from(forumPosts)
        .leftJoin(users, eq(forumPosts.userId, users.id))
        .where(eq(forumPosts.id, post.id))
        .limit(1);

      const transformedPost = {
        ...createdPost,
        author: createdPost.author?.id ? createdPost.author : null
      };

      res.json(transformedPost);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
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