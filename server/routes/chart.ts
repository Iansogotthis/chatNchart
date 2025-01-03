import { eq } from "drizzle-orm";
import { db } from "../../db";
import { charts, squareCustomizations } from "../../db/schema";
import type { Request, Response } from "express";

export async function saveSquareCustomization(req: Request, res: Response) {
  try {
    const { chartId, squareClass, parentText, depth, title, priority, urgency, aesthetic } = req.body;

    // Validate required fields
    if (!chartId || !squareClass || !parentText || depth === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify chart exists and belongs to user
    const [chart] = await db
      .select()
      .from(charts)
      .where(eq(charts.id, chartId))
      .limit(1);

    if (!chart) {
      return res.status(404).json({ error: "Chart not found" });
    }

    // Check for existing customization
    const [existingCustomization] = await db
      .select()
      .from(squareCustomizations)
      .where(
        eq(squareCustomizations.chartId, chartId) &&
        eq(squareCustomizations.squareClass, squareClass) &&
        eq(squareCustomizations.parentText, parentText) &&
        eq(squareCustomizations.depth, depth)
      )
      .limit(1);

    if (existingCustomization) {
      // Update existing customization
      const [updatedCustomization] = await db
        .update(squareCustomizations)
        .set({
          title,
          priority,
          urgency,
          aesthetic,
          updatedAt: new Date(),
        })
        .where(eq(squareCustomizations.id, existingCustomization.id))
        .returning();

      return res.json(updatedCustomization);
    }

    // Create new customization
    const [customization] = await db
      .insert(squareCustomizations)
      .values({
        chartId,
        squareClass,
        parentText,
        depth,
        title,
        priority,
        urgency,
        aesthetic,
      })
      .returning();

    res.json(customization);
  } catch (error) {
    console.error("Error saving square customization:", error);
    res.status(500).json({ error: "Failed to save square customization" });
  }
}

export async function getSquareCustomizations(req: Request, res: Response) {
  try {
    const { chartId } = req.params;

    if (!chartId) {
      return res.status(400).json({ error: "Chart ID is required" });
    }

    const customizations = await db
      .select()
      .from(squareCustomizations)
      .where(eq(squareCustomizations.chartId, parseInt(chartId)));

    res.json(customizations);
  } catch (error) {
    console.error("Error getting square customizations:", error);
    res.status(500).json({ error: "Failed to get square customizations" });
  }
}