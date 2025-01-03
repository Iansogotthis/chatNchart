import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";  
import { db } from "@db";  

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security headers and CORS with proper cookie handling
app.use((req, res, next) => {
  // Allow requests from Replit preview window and browsers
  const allowedOrigins = ['https://*.replit.dev', 'https://*.repl.co'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.some(allowed => origin.match(new RegExp(allowed.replace('*', '.*'))))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Debug auth state
  log(`Auth state for ${path}: ${req.isAuthenticated?.() ? 'authenticated' : 'not authenticated'}`);
  log(`Session ID: ${req.sessionID}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Initialize database connection and start server
(async () => {
  try {
    // Add auth setup first before routes
    setupAuth(app);

    const server = registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const PORT = 3000;

    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on http://0.0.0.0:${PORT}`);
    }).on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${PORT} is already in use. Please try a different port.`);
        process.exit(1);
      } else {
        console.error('Server startup error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Server initialization error:', error);
    process.exit(1);
  }
})().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});