import { Router } from "express";
import { db } from "../../db";
import { messages, notifications, users } from "../../db/schema";
import { eq, and, or } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const router = Router();

// Authentication middleware with proper error handling
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized", details: "Session invalid or expired" });
    }
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    next(error);
  }
};

// Get all messages for current user
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(messages.createdAt);

    res.json(userMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    next(error);
  }
});

// Get direct messages between two users
router.get("/direct/:friendId", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const friendId = parseInt(req.params.friendId);

    if (isNaN(friendId)) {
      return res.status(400).json({ message: "Invalid friend ID" });
    }

    // First verify if the friend exists
    const [friend] = await db
      .select()
      .from(users)
      .where(eq(users.id, friendId))
      .limit(1);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Get messages between the two users
    const directMessages = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId), eq(messages.receiverId, friendId)),
          and(eq(messages.senderId, friendId), eq(messages.receiverId, userId))
        )
      )
      .orderBy(messages.createdAt);

    res.json(directMessages);
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).json({ message: "Failed to fetch direct messages" });
  }
});

// Send a direct message
router.post("/direct", requireAuth, async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedReceiverId = parseInt(receiverId);
    if (isNaN(parsedReceiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }

    // Check if receiver exists
    const [receiver] = await db
      .select()
      .from(users)
      .where(eq(users.id, parsedReceiverId))
      .limit(1);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Create the message
    const [newMessage] = await db
      .insert(messages)
      .values({
        senderId: req.user!.id,
        receiverId: parsedReceiverId,
        content: content.trim(),
        isRead: false,
      })
      .returning();

    // Create notification for the receiver
    await db.insert(notifications).values({
      userId: parsedReceiverId,
      type: 'message',
      sourceId: newMessage.id,
    });

    res.json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    next(error);
  }
});

// Mark messages as read
router.put("/read", requireAuth, async (req, res, next) => {
  try {
    const { messageIds } = req.body;
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: "Invalid message IDs" });
    }

    // Only update messages where the current user is the recipient
    const [updatedMessages] = await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.receiverId, req.user!.id),
          or(...messageIds.map(id => eq(messages.id, id)))
        )
      )
      .returning();

    res.json({ message: "Messages marked as read", updatedMessages });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    next(error);
  }
});

export default router;