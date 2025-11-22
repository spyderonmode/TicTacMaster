import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migrations";

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Only log important API calls, exclude frequent polling endpoints
      const excludedPaths = [
        '/api/room-invitations',
        '/api/auth/user',
        '/api/users/online-stats',
        '/api/leaderboard',
        '/api/rooms/',
        '/api/games/',
        '/api/users/online',
        '/api/users/blocked',
        '/api/friends',
        '/api/achievements',
        '/api/themes',
        '/api/matchmaking/'
      ];
      
      const shouldLog = !excludedPaths.some(excludedPath => path.includes(excludedPath)) || 
                       path.includes('/api/auth/login') || 
                       path.includes('/api/auth/register');
      
      if (shouldLog) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        //log(logLine);
      }
    }
  });

  next();
});

(async () => {
  // Run database migrations first
  await runMigrations();
  
  // Import storage for room cleanup
  const { storage } = await import("./storage");
  
  // Initialize default stickers and avatar frames
  await storage.createDefaultStickers();
  await storage.createDefaultAvatarFrames();
  
  // Clean up old rooms immediately on startup - BUG FIXED: Now preserves game history
  //console.log("🧹 Running initial room cleanup...");
  await storage.cleanupOldRooms();
  
  // Set up periodic room cleanup every 10 minutes - BUG FIXED: Now safe
  const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
  setInterval(async () => {
    try {
      await storage.cleanupOldRooms();
    } catch (error) {
      console.error("❌ Error during periodic room cleanup:", error);
    }
  }, CLEANUP_INTERVAL);
  
  //console.log("✅ Room cleanup system RE-ENABLED - fixed to preserve user game history and stats");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    //log(`serving on port ${port}`);
  });
})();
