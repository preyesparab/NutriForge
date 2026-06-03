const mongoose = require("mongoose");

const workoutLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    exerciseType: {
      type: String,
      required: [true, "Exercise type is required"],
      enum: [
        "squat",
        "push_up",
        "dumbbell_curl",
        "deadlift",
        "lunge",
        "shoulder_press",
        "plank",
        "jumping_jack",
        "other",
      ],
    },
    repsCompleted: {
      type: Number,
      required: true,
      min: [0, "Reps cannot be negative"],
    },
    sets: { type: Number, default: 1, min: 1 },
    durationSeconds: { type: Number, default: 0 }, // total exercise duration
    avgPostureAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      // Percentage score from MediaPipe pose analysis
    },
    feedback: {
      type: [String], // e.g. ["Keep your back straight", "Lower your hips"]
      default: [],
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── Index for efficient per-user date-range queries ───────────────────────────
workoutLogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model("WorkoutLog", workoutLogSchema);
