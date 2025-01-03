import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add security headers and CORS
app.use((req, res, next) => {
  // Allow requests from Replit preview window and browsers
  const allowedOrigins = ['https://*.replit.dev', 'https://*.repl.co', 'https://*.repl.run'];
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

(async () => {
  const server = registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error('Server error:', err);
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = process.env.PORT || 3001;

  server.listen(PORT as number, "0.0.0.0", () => {
    log(`Server running on http://0.0.0.0:${PORT}`);
  });
})().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});