import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { runMigrations } from "./migrations";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// =========================================================
// 🚫 INVITE & PLAY-AGAIN PROTECTION (IP-based)
// =========================================================
interface IpRecord {
  timestamps: Record<string, number[]>; // track per endpoint
  bannedUntil: number;
  patternMatches: number;
}

const LIMIT = 30; // max 14 requests per endpoint
const WINDOW = 3 * 60 * 1000; // 3 minutes
const BAN_DURATION = 30 * 60 * 1000; // 30 minutes

const ipMap = new Map<string, IpRecord>();

function isProtectedPath(path: string): boolean {
  return (
    path.startsWith("/api/room-invitations") ||
    path.startsWith("/api/play-again/request") ||
    path.startsWith("/api/play-again/respond") ||
    path.startsWith("/api/play-again/requests")
  );
}

function getPathKey(path: string) {
  return path; // exact path for separate counting
}

function abuseProtection(req: Request, res: Response, next: NextFunction) {
  if (!isProtectedPath(req.path)) return next();

  const ipRaw = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.ip;
  const ip = String(ipRaw).split(",")[0].trim();

  if (!ipMap.has(ip)) {
    ipMap.set(ip, { timestamps: {}, bannedUntil: 0, patternMatches: 0 });
  }

  const record = ipMap.get(ip)!;
  const now = Date.now();
  const pathKey = getPathKey(req.path);

  if (!record.timestamps[pathKey]) record.timestamps[pathKey] = [];

  // Active ban check
  if (record.bannedUntil > now) {
    const remaining = Math.ceil((record.bannedUntil - now) / 1000);
    return res.status(429).json({
      message: `Banned for ${remaining} seconds due to excessive requests.`,
    });
  }

  // Cleanup old timestamps
  record.timestamps[pathKey] = record.timestamps[pathKey].filter((t) => now - t < WINDOW);

  // Automation pattern detection
  const MIN_SAMPLES = 2;
  const PATTERN_REPEAT = 5;
  const TIME_TOLERANCE = 0; // ms
  const AUTOMATION_BAN = 2 * 60 * 60 * 1000; // 2 hours

  const ts = record.timestamps[pathKey];
  if (ts.length >= MIN_SAMPLES) {
    const deltas = [];
    for (let i = 1; i < ts.length; i++) deltas.push(ts[i] - ts[i - 1]);
    const recentDeltas = deltas.slice(-MIN_SAMPLES);
    const avg = recentDeltas.reduce((a, b) => a + b, 0) / recentDeltas.length;

    const allSame = recentDeltas.every((d) => Math.abs(d - avg) <= TIME_TOLERANCE);
    if (allSame) {
      record.patternMatches++;
      if (record.patternMatches >= PATTERN_REPEAT) {
        record.bannedUntil = now + AUTOMATION_BAN;
        return res.status(429).json({
          message: "Automated request pattern detected — banned for 2 hours.",
        });
      }
    } else {
      record.patternMatches = 0;
    }
  }

  // Per-path request limit
  if (record.timestamps[pathKey].length >= LIMIT) {
    record.bannedUntil = now + BAN_DURATION;
    return res.status(429).json({
      message: `Exceeded maximum requests on ${pathKey} — banned for 30 minutes.`,
    });
  }

  // Log request timestamp
  record.timestamps[pathKey].push(now);

  next();
}

// =========================================================
// 🚫 GLOBAL RATE LIMIT (Token bucket)
interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
  blockedUntil: number;
}

const RATE_LIMIT = 4;
const BLOCK_DURATION = 10 * 60 * 1000;
const TOKEN_REFILL_INTERVAL = 250;
const ipRateMap = new Map<string, RateLimitRecord>();
const OFFICIAL_APP_ID = "com.darklayerstudio.tictac3x5pro";

app.use(abuseProtection);

app.use((req, res, next) => {
  const appId = req.headers["x-requested-with"];
  const ipRaw = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.ip;
  const ip = String(ipRaw).split(",")[0].trim();
  const now = Date.now();

  if (appId === OFFICIAL_APP_ID) return next();

  if (!ipRateMap.has(ip)) {
    ipRateMap.set(ip, { tokens: RATE_LIMIT, lastRefill: now, blockedUntil: 0 });
  }

  const record = ipRateMap.get(ip)!;

  if (record.blockedUntil > now) {
    return res.status(429).json({
      message: "Too many requests — temporarily blocked for 10 minutes.",
    });
  }

  const elapsed = now - record.lastRefill;
  const tokensToAdd = Math.floor(elapsed / TOKEN_REFILL_INTERVAL);
  if (tokensToAdd > 0) {
    record.tokens = Math.min(RATE_LIMIT, record.tokens + tokensToAdd);
    record.lastRefill = now;
  }

  if (record.tokens > 0) {
    record.tokens--;
    return next();
  }

  record.blockedUntil = now + BLOCK_DURATION;
  return res.status(429).json({
    message: "You are sending too many requests — blocked for 10 minutes.",
  });
});

// =========================================================
// 🚫 WEBVIEW + HEADER SECURITY CHECK
app.use((req, res, next) => {
  if (app.get("env") === "development") return next();

  const h = req.headers;
  if (h["x-requested-with"] !== OFFICIAL_APP_ID) {
    return res.status(403).json({ message: "unauthorised" });
  }

  const ua = h["user-agent"] || "";
  if (!/wv/i.test(ua)) return res.status(403).json({ message: "unauthorised" });

  if (h["origin"] && !h["origin"].startsWith("https://darklayerstudios.com")) {
    return res.status(403).json({ message: "Blocked: Wrong origin" });
  }

  if (h["referer"] && !h["referer"].startsWith("https://darklayerstudios.com")) {
    return res.status(403).json({ message: "Blocked: Wrong referer" });
  }

  if (h["sec-ch-ua-platform"] !== '"Android"') {
    return res.status(403).json({ message: "Blocked: Wrong platform" });
  }

  next();
});

// =========================================================
// LOGGING MIDDLEWARE (with protected endpoint tries)
const endpointTries: Record<string, Record<string, number>> = {}; // ip -> path -> tries

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
    const ipRaw = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.ip;
    const ip = String(ipRaw).split(",")[0].trim();

    if (!endpointTries[ip]) endpointTries[ip] = {};
    if (!endpointTries[ip][path]) endpointTries[ip][path] = 0;
    endpointTries[ip][path]++;
    const tries = endpointTries[ip][path];

    // =========================================================
    // Default logging for non-excluded endpoints
    // =========================================================
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

    // Protected endpoints logging
    if (isProtectedPath(path)) {
      //console.log(`[PROTECTED] ${req.method} ${path} IP ${ip} in ${duration}ms [tries: ${tries}]`);

      // Play-again request
      if (path.startsWith("/api/play-again/request") && capturedJsonResponse) {
        const requester = capturedJsonResponse.requesterId || "unknown";
        const requested = capturedJsonResponse.requestedId || "unknown";
        //console.log(`[PLAY AGAIN REQUEST] From USER ${requester} to USER ${requested} [tries: ${tries}]`);
      }

      // Play-again respond
      if (path.startsWith("/api/play-again/respond") && capturedJsonResponse) {
        const requestId = capturedJsonResponse.requestId || "unknown";
        const response = capturedJsonResponse.response || "unknown";
        //console.log(`[PLAY AGAIN RESPOND] request ${requestId} responded "${response}" [tries: ${tries}]`);
      }
    }
  });

  next();
});

// =========================================================
// SERVER SETUP
(async () => {
  await runMigrations();
  const { storage } = await import("./storage");

  await storage.createDefaultStickers();
  await storage.createDefaultAvatarFrames();
  await storage.cleanupOldRooms();

  const CLEANUP_INTERVAL = 10 * 60 * 1000;
  setInterval(async () => {
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
