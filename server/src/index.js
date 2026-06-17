require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const connectDB = require("./config/db");
const app = express();

// ── Core middleware ────────────────────────────────────────────────────────────
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,          // any localhost port (dev)
  /^https:\/\/.*\.vercel\.app$/,       // all Vercel preview + production URLs
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser requests (Postman, server-to-server) and whitelisted origins
      if (!origin || allowedOrigins.some((p) => p.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Static file serving — /uploads/<filename> returns images saved by multer ──
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/workouts", require("./routes/workout.routes"));
app.use("/api/nutrition", require("./routes/nutrition.routes"));
app.use("/api/plans", require("./routes/plan.routes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "nutriforge-server", timestamp: new Date().toISOString() })
);

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Connect to DB, then start server ──────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  NutriForge server  →  http://localhost:${PORT}`);
    console.log(`📂  Uploads served    →  http://localhost:${PORT}/uploads`);
  });
});
