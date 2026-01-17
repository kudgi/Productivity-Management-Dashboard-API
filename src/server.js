require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/database");
const startBackgroundJobs = require("./utils/jobs");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start background jobs
    startBackgroundJobs();

    // Start server
    const server = app.listen(PORT, "127.0.0.1", () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
    
    server.on('error', (err) => {
      logger.error(`Server error: ${err.message}`);
      console.error('Server error:', err);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
