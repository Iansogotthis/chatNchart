import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "../db";
import { users } from "../db/schema";
import { sql } from "drizzle-orm";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security headers and CORS
app.use((req, res, next) => {
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
  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Debug auth state
  log(`Auth state for ${path}: ${req.isAuthenticated?.() ? 'authenticated' : 'not authenticated'}`);

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

async function startServer() {
  try {
    log("Starting server initialization...");

    // Test database connection
    try {
      await db.execute(sql`SELECT 1`);
      log("Database connection successful");
    } catch (error) {
      log("Database connection failed:", error instanceof Error ? error.message : String(error));
      throw new Error("Failed to connect to database");
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

    const PORT = process.env.PORT || 3000;
    const HOST = "0.0.0.0";

    return new Promise((resolve, reject) => {
      server.listen(PORT, HOST, () => {
        log(`Server running on http://${HOST}:${PORT}`);
        resolve(server);
      }).on('error', (error: any) => {
        if (error.syscall !== 'listen') {
          reject(error);
          return;
        }

        switch (error.code) {
          case 'EACCES':
            reject(new Error(`Port ${PORT} requires elevated privileges`));
            break;
          case 'EADDRINUSE':
            reject(new Error(`Port ${PORT} is already in use`));
            break;
          default:
            reject(error);
        }
      });
    });
  } catch (error) {
    log("Failed to start server:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Start the server
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error('Critical server error:', error);
    process.exit(1);
  }
})();