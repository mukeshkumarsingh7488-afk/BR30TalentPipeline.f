const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    throw new Error("MONGO_URI is missing. Please configure it in the .env file.");
  }

  try {
    mongoose.set("strictQuery", true);

    const connection = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      autoIndex: process.env.NODE_ENV !== "production",
    });

    const db = mongoose.connection;

    console.log("========================================");
    console.log("BR30 Talent Pipeline Database Connected");
    console.log(`Host: ${db.host}`);
    console.log(`Database: ${db.name}`);
    console.log("========================================");

    db.on("error", (error) => {
      console.error("MongoDB connection error:", error.message);
    });

    db.on("disconnected", () => {
      console.warn("MongoDB disconnected.");
    });

    db.on("reconnected", () => {
      console.log("MongoDB reconnected successfully.");
    });

    return connection;
  } catch (error) {
    console.error("BR30 Talent Pipeline MongoDB connection failed:", error.message);

    throw error;
  }
};

module.exports = connectDB;
