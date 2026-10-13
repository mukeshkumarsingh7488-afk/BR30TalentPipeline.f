require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

const PORT = Number(process.env.PORT) || 5000;

let server;
let isShuttingDown = false;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log("========================================");
      console.log("BR30 Talent Pipeline API Started");
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Port: ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/v1/health`);
      console.log("========================================");
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error.message);
      process.exitCode = 1;
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exitCode = 1;
    await mongoose.disconnect().catch(() => {});
  }
};

const shutdown = (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error("Graceful shutdown timed out.");
    process.exit(1);
  }, 10000);

  forceExitTimer.unref();

  const closeDatabase = async () => {
    try {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    } catch (error) {
      console.error("MongoDB shutdown error:", error.message);
      process.exitCode = 1;
    } finally {
      clearTimeout(forceExitTimer);
    }
  };

  if (!server) {
    closeDatabase().finally(() => {
      process.exit(process.exitCode || 0);
    });
    return;
  }

  server.close(() => {
    closeDatabase().finally(() => {
      process.exit(process.exitCode || 0);
    });
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
