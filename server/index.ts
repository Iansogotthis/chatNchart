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
    const origin = req.headers.origin || '';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    const port = process.env.PORT || 5000;
    app.set('port', port);
    const server = registerRoutes(app);
    
    // Kill any existing processes on the port
    try {
      await new Promise((resolve) => {
        const tester = server.listen(port, '0.0.0.0', () => {
          tester.close(resolve);
        });
        tester.on('error', () => {
          resolve();
        });
      });
    } catch (err) {
      console.error('Port cleanup error:', err);
    }
    
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
          },
          host: '0.0.0.0' // Added to bind Vite to all interfaces
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
      const errorDetails = error instanceof Error ? 
        { message: error.message, stack: error.stack } : 
        { message: String(error) };
      console.error("Server initialization failed:", JSON.stringify(errorDetails, null, 2));
      throw error;
    }
}

// Start the server with error handling
startServer().catch((error) => {
  console.error('Critical server error:', error);
  process.exit(1);
});

export default app;