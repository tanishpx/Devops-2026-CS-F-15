import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Load server .env first, then fall back to root .env
dotenv.config({ path: new URL("./.env", import.meta.url) });
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import bugsRouter from "./routes/bugs.js";
import submissionsRouter from "./routes/submissions.js";
import statsRouter from "./routes/stats.js";
import settingsRouter from "./routes/settings.js";

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
  "https://bugpilotai.vercel.app",
];

if (process.env.ALLOWED_ORIGINS) {
  const extraOrigins = process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim());
  allowedOrigins.push(...extraOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Middleware to check MongoDB connection before processing requests
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database not connected yet. Please try again.",
      readyState: mongoose.connection.readyState,
    });
  }
  next();
});

app.use("/api/bugs", bugsRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/settings", settingsRouter);

async function startServer() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, {
        dbName: "bugpilot",
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        minPoolSize: 2,
      });
      console.log("Connected to MongoDB → database: bugpilot");
    } catch (err) {
      console.error("MongoDB connection failed:", err.message);
      console.warn("Starting server without database. Queries will fail.");
    }
  } else {
    console.warn("MONGODB_URI not set. Starting server without database.");
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`BugPilot server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
