import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "../db";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cache for auth states (5 minute TTL)
const authCache = new Map<string, { isAuth: boolean; timestamp: number }>();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Bypass auth for static assets and cache auth state
app.use((req, res, next) => {
  // Skip auth check for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }

  // Allow requests from Replit preview window and browsers
  const allowedOrigins = ['https://*.replit.dev', 'https://*.repl.co'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.some(allowed => origin.match(new RegExp(allowed.replace('*', '.*'))))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Cache auth state
  const sessionId = req.sessionID;
  if (sessionId) {
    const cached = authCache.get(sessionId);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < AUTH_CACHE_TTL) {
      // Use cached auth state
      if (cached.isAuth) {
        next();
        return;
      }
    }
  }

  next();
});

// Add request logging middleware (only for API routes)
app.use((req, res, next) => {
  // Skip logging for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }

  const start = Date.now();
  const path = req.path;

  // Only capture JSON response for API routes
  if (path.startsWith("/api")) {
    let capturedJsonResponse: Record<string, any> | undefined = undefined;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      // Sanitize sensitive data before logging
      if (bodyJson && typeof bodyJson === 'object') {
        const sanitized = { ...bodyJson };
        delete sanitized.password;
        delete sanitized.token;
        capturedJsonResponse = sanitized;
      }
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    });
  }

  next();
});

async function startServer() {
  try {
    log("Starting server initialization...");

    // Test database connection and schema
    try {
      await db.execute(sql`SELECT 1`);
      log("Database connection successful");

      // Only log schema in development
      if (process.env.NODE_ENV === 'development') {
        const tables = await db.execute(sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'users'
        `);
        log("Database schema verified:", JSON.stringify(tables));
      }
    } catch (error) {
      log("Database error:", error instanceof Error ? error.message : String(error));
      throw new Error("Failed to connect to database or verify schema");
    }

    const server = registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error('Server error:', err);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      log("Setting up Vite development server...");
      await setupVite(app, server);
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
    }

    const port = Number(process.env.PORT) || 3001;

    return new Promise<void>((resolve) => {
      server.listen(port, '0.0.0.0', () => {
        log(`Server running on port ${port}`);
        resolve();
      });
    });
  } catch (error) {
    log("Failed to start server:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Start the server with error handling
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error('Critical server error:', error);
    process.exit(1);
  }
})();