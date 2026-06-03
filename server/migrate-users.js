require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/posenutri";

async function runMigration() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for migration");

    const users = await User.find({ goals: { $exists: false } });
    console.log(`Found ${users.length} legacy users without 'goals' field`);

    let count = 0;
    for (const user of users) {
      if (!user.goals) {
        user.goals = {
          weeklyWorkoutsTarget: 4,
        };
        await user.save({ validateBeforeSave: false }); // Bypass full validation in case older schemas lacked required fields
        count++;
      }
    }

    console.log(`Migration complete. Successfully updated ${count} users.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
