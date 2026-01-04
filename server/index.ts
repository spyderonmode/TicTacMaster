import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { runMigrations } from "./migrations";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// =========================================================
// 🔒 BROWSER LOCK (WEBVIEW + VERSION CHECK VIA USER-AGENT)
// =========================================================
const OFFICIAL_APP_ID = "com.darklayerstudio.tictac3x5pro";
const REQUIRED_UA_MARKER = "DLApp/6";

app.use((req, res, next) => {
  if (app.get("env") === "development") return next();

  const h = req.headers;

  // Require official app id
  if (h["x-requested-with"] !== OFFICIAL_APP_ID) {
    return res.status(403).json({ message: "unauthorised" });
  }

  const ua = String(h["user-agent"] || "");

  // Require Android WebView
  if (!/wv/i.test(ua)) {
    return res.status(403).json({ message: "unauthorised" });
  }

  // Require app version marker (blocks old versions)
  if (!ua.includes(REQUIRED_UA_MARKER)) {
    return res.status(426).json({
      message: "Update required, Kindly Visit https://tictac3x5.darklayerstudios.com",
    });
  }

  // Restrict origin / referer
  if (h["origin"] && !String(h["origin"]).startsWith("https://darklayerstudios.com")) {
    return res.status(403).json({ message: "Blocked: Wrong origin" });
  }

  if (h["referer"] && !String(h["referer"]).startsWith("https://darklayerstudios.com")) {
    return res.status(403).json({ message: "Blocked: Wrong referer" });
  }

  next();
});

// =========================================================
// BASIC LOGGING MIDDLEWARE
// =========================================================
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

    const excludedPaths = [
      "/api/room-invitations",
      "/api/auth/user",
      "/api/users/online-stats",
      "/api/leaderboard",
      "/api/rooms/",
      "/api/games/",
      "/api/users/online",
      "/api/users/blocked",
      "/api/friends",
      "/api/achievements",
      "/api/themes",
      "/api/matchmaking/",
    ];

    const shouldLog =
      !excludedPaths.some((excludedPath) => path.includes(excludedPath)) ||
      path.includes("/api/auth/login") ||
      path.includes("/api/auth/register");

    if (shouldLog) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 120) logLine = logLine.slice(0, 119) + "…";
      //console.log(logLine);
    }
  });

  next();
});

// =========================================================
// SERVER SETUP
// =========================================================
(async () => {
  await runMigrations();
  const { storage } = await import("./storage");

  await storage.createDefaultStickers();
  await storage.createDefaultAvatarFrames();
  await storage.cleanupOldRooms();

  const CLEANUP_INTERVAL = 10 * 60 * 1000;
  setInterval(async () => {
    // Skip if no active connections to save compute
    // @ts-ignore - access connections from registered routes or app
    if (app.get('connections')?.size === 0) {
      return;
    }
    try {
      await storage.cleanupOldRooms();
    } catch (_) {}
  }, CLEANUP_INTERVAL);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const server = await registerRoutes(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({ port, host: "0.0.0.0", reusePort: true });
})();
