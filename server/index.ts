import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./migrations";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.set('trust proxy', 1);

// 🚀 Universal CORS setup (or you can move this into registerRoutes)
const allowedOrigins = [
  "https://darklayerstudios.com",
  "https://www.darklayerstudios.com",
  "http://localhost:3000",
  "http://localhost:5000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);

// ⏱️ Request logging
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
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }

        if (logLine.length > 80) {
          logLine = logLine.slice(0, 79) + "…";
        }

        // log(logLine);
      }
    }
  });

  next();
});

(async () => {
  await runMigrations();

  // 🛠️ Register routes (now CORS + session are active)
  const server = await registerRoutes(app);

  // Room cleanup logic
  const { storage } = await import("./storage");
  await storage.cleanupOldRooms();

  const CLEANUP_INTERVAL = 10 * 60 * 1000;
  setInterval(async () => {
    try {
      await storage.cleanupOldRooms();
    } catch (error) {
      console.error("❌ Error during periodic room cleanup:", error);
    }
  }, CLEANUP_INTERVAL);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Vite dev mode or static production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 🎯 Serve everything on port 5000
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      // log(`Serving on port ${port}`);
    }
  );
})();
