require("dotenv").config();

const readline = require("readline");
const mongoose = require("mongoose");

const connectDB = require("../../config/db");
const User = require("./user.model");
const authService = require("./auth.service");

const LOCK_ID = "br30-talent-pipeline-initial-hr";

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const askPassword = () =>
  new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || !process.stdin.setRawMode) {
      reject(new Error("Hidden password input requires an interactive terminal."));
      return;
    }

    const stdin = process.stdin;
    let password = "";

    process.stdout.write("HR password (minimum 12 characters): ");

    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    const onData = (chunk) => {
      const input = chunk.toString("utf8");

      for (const char of input) {
        if (char === "\u0003") {
          cleanup();
          process.stdout.write("\n");
          reject(new Error("Bootstrap cancelled."));
          return;
        }

        if (char === "\r" || char === "\n") {
          cleanup();
          process.stdout.write("\n");
          resolve(password);
          return;
        }

        if (char === "\u007f" || char === "\b") {
          password = password.slice(0, -1);
          continue;
        }

        if (char >= " " && char !== "\u007f") {
          password += char;
        }
      }
    };

    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });

const run = async () => {
  let lockAcquired = false;
  let accountCreated = false;

  try {
    console.log("\nBR30 Talent Pipeline — Initial HR Setup\n");

    const name = await ask("HR name: ");
    const email = await ask("HR email: ");
    const password = await askPassword();

    await connectDB();

    const existingHR = await User.exists({ role: "HR" });

    if (existingHR) {
      throw new Error("An HR account already exists. Initial bootstrap is disabled.");
    }

    const lockCollection = mongoose.connection.db.collection("system_bootstrap_locks");

    try {
      await lockCollection.insertOne({
        _id: LOCK_ID,
        purpose: "Initial HR account creation",
        createdAt: new Date(),
      });

      lockAcquired = true;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Bootstrap has already started or completed. Do not run it again.");
      }

      throw error;
    }

    const result = await authService.createHRAccount({
      name,
      email,
      password,
    });

    accountCreated = true;

    console.log("\nHR account created successfully.");
    console.log(result.message);
    console.log(`Email: ${result.email}`);
    console.log("Check your email for the verification OTP.");
    console.log("Verify the email before attempting to log in.");
  } catch (error) {
    console.error("\nBootstrap failed:", error.message);

    // Release the lock only if no HR account was created.
    if (lockAcquired && !accountCreated && mongoose.connection.readyState === 1) {
      try {
        const existingHR = await User.exists({ role: "HR" });

        if (!existingHR) {
          await mongoose.connection.db.collection("system_bootstrap_locks").deleteOne({ _id: LOCK_ID });
        }
      } catch (cleanupError) {
        console.error("Bootstrap lock cleanup failed. Check the database before retrying.");
      }
    }

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

run();
