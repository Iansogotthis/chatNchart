import { Router } from "express";
import { db } from "../../db";
import { users, friends, notifications } from "../../db/schema";
import { ilike, not, eq, and, or, sql } from "drizzle-orm";

const router = Router();

// Enhanced search with partial matching and better error handling
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Don't include the current user in search results
    const currentUserId = req.user?.id;

    // More flexible search with multiple fields and partial matching
    const searchPattern = `%${query}%`;
    const searchResults = await db
      .select({
        id: users.id,
        username: users.username,
        bio: users.bio
      })
      .from(users)
      .where(
        and(
          currentUserId ? not(eq(users.id, currentUserId)) : undefined,
          or(
            ilike(users.username, searchPattern),
            ilike(users.bio || '', searchPattern)
          )
        )
      )
      .limit(20); // Increased limit for better results

    console.log(`Search query "${query}" found ${searchResults.length} results`);
    res.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: "Failed to perform search",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Handle friend requests
router.post("/request/:username", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  try {
    const [targetUser] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${req.params.username})`)
      .limit(1);

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
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

    await db.insert(notifications).values({
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

export default router;