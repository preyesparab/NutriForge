const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type:      String,
      required:  [true, "Name is required"],
      trim:      true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    email: {
      type:      String,
      required:  [true, "Email is required"],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type:      String,
      required:  [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select:    false,           // never returned in queries by default
    },

    // ── Physical measurements ─────────────────────────────────────────────────
    age:    { type: Number, min: [10, "Age must be at least 10"], max: [120, "Age is unrealistic"] },
    height: { type: Number, min: 0 },   // cm
    weight: { type: Number, min: 0 },   // kg
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },

    // ── Fitness profile ───────────────────────────────────────────────────────
    fitnessGoal: {
      type:    String,
      enum:    ["weight_loss", "muscle_gain", "maintenance", "endurance", "flexibility"],
      default: "maintenance",
    },
    dietPreference: {
      type:    String,
      enum:    ["none", "vegetarian", "vegan", "keto", "paleo", "halal", "gluten_free"],
      default: "none",
    },

    // ── Goals ─────────────────────────────────────────────────────────────────
    goals: {
      weeklyWorkoutsTarget: {
        type: Number,
        default: 4,
      },
      targetLift: {
        exerciseName: { type: String, trim: true },
        targetWeight: { type: Number, min: 0 },
      },
    },

    // ── Account ───────────────────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    ["user", "admin"],
      default: "user",
    },
    avatar: { type: String, default: "" },
  },
  { timestamps: true }
);

// ── Hash password before saving ───────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare passwords ───────────────────────────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
