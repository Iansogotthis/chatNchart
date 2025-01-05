import { Router } from "express";
import { db } from "../../db";
import { users } from "../../db/schema";
import { ilike, not, eq, and, or } from "drizzle-orm";

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

    // Use ILIKE for case-insensitive partial matching
    const searchResults = await db
      .select({
        id: users.id,
        username: users.username,
        bio: users.bio
      })
      .from(users)
      .where(
        currentUserId 
          ? and(
              not(eq(users.id, currentUserId)),
              or(
                ilike(users.username, `%${query}%`),
                ilike(users.bio || '', `%${query}%`)
              )
            )
          : or(
              ilike(users.username, `%${query}%`), 
              ilike(users.bio || '', `%${query}%`)
            )
      )
      .limit(10);

    res.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      message: "Failed to perform search",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;