import { drizzle } from "drizzle-orm/neon-serverless";
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enable WebSocket support for the neon client
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

// Create SQL client with proper configuration for serverless environment
const sql = neon(process.env.DATABASE_URL);

// Create drizzle instance with schema
export const db = drizzle(sql, { schema: schema });