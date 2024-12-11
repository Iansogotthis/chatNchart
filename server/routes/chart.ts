import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { charts, squareCustomizations } from "@db/schema";
import type { Request, Response } from "express";

export async function saveSquareCustomization(req: Request, res: Response) {
  try {
    const { chartId, squareClass, parentText, depth, title, priority, urgency, aesthetic } = req.body;

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
