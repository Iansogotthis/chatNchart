import { drizzle } from "drizzle-orm/neon-serverless";
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
  squareCustomizations,
} from "../db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { saveSquareCustomization, getSquareCustomizations } from "./routes/chart";

export function registerRoutes(app: Express) {
  setupAuth(app);
  const httpServer = createServer(app);

  app.get("/api/users/search", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const searchQuery = req.query.q as string;
      if (!searchQuery || searchQuery.length < 2) {
        return res.json([]);
      }

      const searchResults = await db
        .select({
          id: users.id,
          username: users.username,
        })
        .from(users)
        .where(
          and(
            sql`LOWER(${users.username}) LIKE ${`%${searchQuery.toLowerCase()}%`}`,
            sql`${users.id} != ${req.user.id}`
          )
        )
        .limit(10);

      res.json(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  });

  app.post("/api/friends/request/:username", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const [targetUser] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.username}) = LOWER(${req.params.username})`)
        .limit(1);

      if (!targetUser) {
        return res.status(404).send("User not found");
      }

      if (targetUser.id === req.user.id) {
        return res.status(400).send("Cannot send friend request to yourself");
      }

      const [existingRequest] = await db
        .select()
        .from(friends)
        .where(
          or(
            and(
              eq(friends.userId, req.user.id),
              eq(friends.friendId, targetUser.id)
            ),
            and(
              eq(friends.userId, targetUser.id),
              eq(friends.friendId, req.user.id)
            )
          )
        )
        .limit(1);

      if (existingRequest) {
        if (existingRequest.status === 'accepted') {
          return res.status(400).send("Already friends with this user");
        }
        return res.status(400).send("Friend request already exists");
      }

      const [friendRequest] = await db
        .insert(friends)
        .values({
          userId: req.user.id,
          friendId: targetUser.id,
          status: "pending"
        })
        .returning();

      await db.insert(notificationsTable).values({
        userId: targetUser.id,
        type: "friend_request",
        sourceId: friendRequest.id,
      });

      res.json(friendRequest);
    } catch (error) {
      console.error('Error sending friend request:', error);
      res.status(500).json({ error: 'Failed to send friend request' });
    }
  });

  app.put("/api/friends/request/:requestId", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const { action } = req.body;
      if (!['accept', 'reject'].includes(action)) {
        return res.status(400).send("Invalid action");
      }

      const [friendRequest] = await db
        .select()
        .from(friends)
        .where(
          and(
            eq(friends.id, parseInt(req.params.requestId)),
            eq(friends.friendId, req.user.id),
            eq(friends.status, "pending")
          )
        )
        .limit(1);

      if (!friendRequest) {
        return res.status(404).send("Friend request not found");
      }

      if (action === 'accept') {
        const [updatedRequest] = await db
          .update(friends)
          .set({ status: "accepted" })
          .where(eq(friends.id, friendRequest.id))
          .returning();

        await db.insert(friends).values({
          userId: friendRequest.friendId,
          friendId: friendRequest.userId,
          status: "accepted"
        });

        await db.insert(notificationsTable).values({
          userId: friendRequest.userId,
          type: "friend_request_accepted",
          sourceId: friendRequest.id,
        });

        res.json(updatedRequest);
      } else {
        await db
          .delete(friends)
          .where(eq(friends.id, friendRequest.id));

        res.json({ message: "Friend request rejected" });
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      res.status(500).json({ error: 'Failed to handle friend request' });
    }
  });

  app.delete("/api/friends/:friendId", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      await db
        .delete(friends)
        .where(
          or(
            and(
              eq(friends.userId, req.user.id),
              eq(friends.friendId, parseInt(req.params.friendId))
            ),
            and(
              eq(friends.userId, parseInt(req.params.friendId)),
              eq(friends.friendId, req.user.id)
            )
          )
        );

      res.json({ message: "Friend removed successfully" });
    } catch (error) {
      console.error('Error removing friend:', error);
      res.status(500).json({ error: 'Failed to remove friend' });
    }
  });

  app.get("/api/friends", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const friendsList = await db
        .select({
          id: friends.id,
          status: friends.status,
          createdAt: friends.createdAt,
          friend: {
            id: users.id,
            username: users.username,
            bio: users.bio,
          }
        })
        .from(friends)
        .where(
          and(
            eq(friends.userId, req.user.id),
            eq(friends.status, "accepted")
          )
        )
        .leftJoin(users, eq(friends.friendId, users.id));

      const pendingRequests = await db
        .select({
          id: friends.id,
          status: friends.status,
          createdAt: friends.createdAt,
          sender: {
            id: users.id,
            username: users.username
          }
        })
        .from(friends)
        .where(
          and(
            eq(friends.friendId, req.user.id),
            eq(friends.status, "pending")
          )
        )
        .leftJoin(users, eq(friends.userId, users.id));

      const response = {
        friends: friendsList.map(f => ({
          id: f.id,
          status: f.status,
          createdAt: f.createdAt,
          friend: f.friend ? {
            id: f.friend.id,
            username: f.friend.username,
            bio: f.friend.bio
          } : null
        })),
        pendingRequests: pendingRequests.map(r => ({
          id: r.id,
          status: r.status,
          createdAt: r.createdAt,
          sender: r.sender ? {
            id: r.sender.id,
            username: r.sender.username
          } : null
        }))
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({ error: 'Failed to fetch friends' });
    }
  });

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

      await db.insert(notificationsTable).values({
        userId: parseInt(req.body.receiverId),
        type: 'message',
        sourceId: message.id,
      });

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

  app.post("/api/charts/:id/like", async (req, res) => {
    if (!req.user) return res.status(401).send("Not authenticated");

    try {
      const [like] = await db.insert(chartLikes).values({
        userId: req.user.id,
        chartId: parseInt(req.params.id),
      }).returning();

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

  app.post("/api/square-customization", saveSquareCustomization);
  app.get("/api/square-customization/:chartId", getSquareCustomizations);

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

  app.get("/api/users/:username", async (req, res) => {
    try {
      const result = await db
        .select({
          id: users.id,
          username: users.username,
          bio: users.bio,
          createdAt: users.createdAt,
          email: users.email,
          phone: users.phone,
          city: users.city,
          state: users.state,
          zipCode: users.zipCode,
          socials: users.socials,
          favorites: users.favorites,
          hobbies: users.hobbies,
          talents: users.talents,
          professional: users.professional,
        })
        .from(users)
        .where(eq(users.username, req.params.username))
        .limit(1);

      const userData = result[0];
      if (!userData) return res.status(404).send("User not found");

      const userCharts = await db
        .select({
          id: charts.id,
          title: charts.title,
          data: charts.data,
          createdAt: charts.createdAt,
          updatedAt: charts.updatedAt,
          isPublic: charts.isPublic,
          creator: {
            id: users.id,
            username: users.username,
          }
        })
        .from(charts)
        .leftJoin(users, eq(charts.userId, users.id))
        .where(eq(charts.userId, userData.id))
        .limit(5);

      const transformedCharts = userCharts.map(chart => ({
        id: chart.id,
        title: chart.title,
        data: chart.data,
        createdAt: chart.createdAt,
        updatedAt: chart.updatedAt,
        isPublic: chart.isPublic,
        creator: chart.creator,
      }));

      res.json({
        ...userData,
        topCharts: transformedCharts,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  app.get("/api/users/:username/friends", async (req, res) => {
    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
        })
        .from(users)
        .where(eq(users.username, req.params.username))
        .limit(1);

      if (!user) return res.status(404).send("User not found");

      const userFriends = await db
        .select({
          id: friends.id,
          status: friends.status,
          createdAt: friends.createdAt,
          friend: {
            id: users.id,
            username: users.username,
          },
        })
        .from(friends)
        .where(
          and(
            eq(friends.userId, user.id),
            eq(friends.status, "accepted")
          )
        )
        .leftJoin(users, eq(friends.friendId, users.id));

      res.json(userFriends);
    } catch (error) {
      console.error('Error fetching user friends:', error);
      res.status(500).json({ error: 'Failed to fetch user friends' });
    }
  });

  return httpServer;
}