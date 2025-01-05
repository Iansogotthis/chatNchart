import { Router } from "express";
import { db } from "../../db";
import { messages, notifications, users } from "../../db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

const router = Router();

// Message validation schema with improved validation
const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  receiverId: z.number().int().positive("Invalid receiver ID"),
  messageType: z.enum(['direct', 'group', 'system', 'notification', 'project']).default('direct'),
  metadata: z.record(z.any()).optional(),
});

// Authentication middleware with proper error handling
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ 
        message: "Unauthorized", 
        details: "Please log in to continue" 
      });
    }
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    next(error);
  }
};

// Get all messages for current user with better error handling
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    res.json(userMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      message: "Failed to fetch messages",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get conversations list with latest messages
router.get("/conversations", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;

    // Get all messages involving the current user
    const userMessages = await db
      .select({
        messages: messages,
        sender: users,
        receiver: users
      })
      .from(messages)
      .where(or(
        eq(messages.senderId, userId),
        eq(messages.receiverId, userId)
      ))
      .leftJoin(users, eq(messages.senderId, users.id))
      .leftJoin(users, eq(messages.receiverId, users.id))
      .orderBy(desc(messages.createdAt));

    // Transform into conversations
    const conversations = userMessages.reduce((acc: any[], msg) => {
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      const existingConvo = acc.find(c => c.participantId === otherUser.id);

      if (!existingConvo && otherUser) {
        acc.push({
          id: msg.id,
          participantId: otherUser.id,
          participantName: otherUser.username,
          lastMessageAt: msg.createdAt,
          lastMessage: msg.content
        });
      }

      return acc;
    }, []);

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      message: "Failed to fetch conversations",
      details: error instanceof Error ? error.message : "Unknown error"
    });
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

    const [friend] = await db
      .select()
      .from(users)
      .where(eq(users.id, friendId))
      .limit(1);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const directMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          or(
            and(eq(messages.senderId, userId), eq(messages.receiverId, friendId)),
            and(eq(messages.senderId, friendId), eq(messages.receiverId, userId))
          ),
          eq(messages.messageType, 'direct')
        )
      )
      .orderBy(desc(messages.createdAt));

    res.json(directMessages);
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).json({
      message: "Failed to fetch messages",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Send a direct message with improved validation and error handling
router.post("/direct", requireAuth, async (req, res, next) => {
  try {
    const validation = messageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ 
        message: "Invalid message data", 
        details: validation.error.errors 
      });
    }

    const { receiverId, content, messageType = 'direct', metadata = {} } = validation.data;

    const [receiver] = await db
      .select()
      .from(users)
      .where(eq(users.id, receiverId))
      .limit(1);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Create the message with proper type
    const [newMessage] = await db
      .insert(messages)
      .values({
        senderId: req.user!.id,
        receiverId,
        content: content.trim(),
        messageType,
        metadata,
        isRead: false,
        status: 'unread',
        isImportant: false,
        isDraft: false
      })
      .returning();

    // Create notification for the receiver
    await db.insert(notifications).values({
      userId: receiverId,
      type: 'message',
      sourceId: newMessage.id,
      isRead: false,
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      message: "Failed to send message",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;