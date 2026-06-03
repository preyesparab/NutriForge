const mongoose = require("mongoose");

/**
 * connectDB — establishes a Mongoose connection to MONGO_URI.
 * Call once at server startup. Exits the process on failure.
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8+ has these as defaults, listed here for clarity
      serverSelectionTimeoutMS: 10_000, // fail fast if Atlas unreachable
    });

    console.log(`\n✅  MongoDB connected`);
    console.log(`    Host : ${conn.connection.host}`);
    console.log(`    DB   : ${conn.connection.name}\n`);
  } catch (err) {
    console.error(`\n❌  MongoDB connection failed`);
    console.error(`    ${err.message}\n`);
    process.exit(1);
  }
}

/**
 * Graceful shutdown — close connection when the process is terminated.
 */
mongoose.connection.on("disconnected", () => {
  console.log("⚠️   MongoDB disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔌  MongoDB connection closed (SIGINT)");
  process.exit(0);
});

module.exports = connectDB;
