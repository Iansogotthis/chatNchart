import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "../db";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration with proper error handling and local development support
app.use((req, res, next) => {
  try {
    const allowedOrigins = process.env.NODE_ENV === 'development' 
      ? ['http://localhost:3002', 'http://localhost:5173'] 
      : ['https://*.replit.dev', 'https://*.repl.co'];

    const origin = req.headers.origin;
    if (origin && allowedOrigins.some(allowed => 
      origin.match(new RegExp(allowed.replace('*', '.*')))
    )) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  } catch (error) {
    next(error);
  }
});

async function startServer() {
  try {
    log("Starting server initialization...");

    // Test database connection
    try {
      await db.execute(sql`SELECT 1`);
      log("Database connection successful");
    } catch (error) {
      log("Database error:", error instanceof Error ? error.message : String(error));
      throw new Error("Failed to connect to database");
    }

    const server = registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Send detailed error in development
      if (process.env.NODE_ENV === 'development') {
        res.status(status).json({
          message,
          stack: err.stack,
          details: err.details || {}
        });
      } else {
        // Send safe error in production
        res.status(status).json({ message });
      }
    });

    if (app.get("env") === "development") {
      log("Setting up Vite development server...");
      await setupVite(app, server);
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
    }

    // Start server with port handling
    const port = process.env.PORT || 3002;

    server.listen(port, '0.0.0.0', () => {
      log(`Server running on port ${port}`);
    }).on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Please use a different port.`);
        process.exit(1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    log("Failed to start server:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Start the server with error handling
startServer().catch((error) => {
  console.error('Critical server error:', error);
  process.exit(1);
});

export default app;