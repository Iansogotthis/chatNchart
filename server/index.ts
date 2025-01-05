import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { setupWebSocket } from "./websocket";
import { createServer } from "vite";
import { sessionMiddleware } from "./session";
import { setupAuth } from "./auth";

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

// Use session middleware before setting up auth
app.use(sessionMiddleware);

// Setup authentication after session middleware
setupAuth(app);

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

    // Create HTTP server first
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
    app.set('port', port);
    const server = registerRoutes(app);
server.listen(port, '0.0.0.0', () => {
  log(`Server running on port ${port}`);
});
    
    // Setup WebSocket server with existing HTTP server and session
    try {
      const wss = setupWebSocket(server);
      log("WebSocket server initialized successfully");

      // Set up WebSocket error handling
      wss.on('error', (error) => {
        console.error('WebSocket server error:', error);
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
      // Continue running the HTTP server even if WebSocket fails
    }

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

    // Setup Vite in development mode
    if (process.env.NODE_ENV !== 'production') {
      log("Setting up Vite development server...");
      const vite = await createServer({
        server: { 
          middlewareMode: true,
          hmr: {
            server: server
          }
        },
        appType: 'spa',
      });

      app.use(vite.middlewares);
    }

    // Start the server on all network interfaces
    server.listen(port, '0.0.0.0', () => {
      log(`Server running on port ${port}`);
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