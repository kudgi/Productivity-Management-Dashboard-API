const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const dashboardRoutes = require("./routes/dashboard");
const logger = require("./utils/logger");

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
})); // Security headers with relaxed CSP for dev
app.use(cors()); // Enable CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable caching for development
app.use((req, res, next) => {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

// Serve static files from public folder
const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath, { index: false }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Root route - serve login page
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// SPA Fallback - serve index.html for non-API routes
app.use((req, res) => {
  // If it's not an API route, serve index.html for SPA routing
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(publicPath, "index.html"));
  } else {
    // 404 for API routes that don't exist
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

module.exports = app;