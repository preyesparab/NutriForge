const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Workout must belong to a user"],
    },
    title: {
      type: String,
      required: [true, "Workout title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    caloriesBurned: {
      type: Number,
      min: [0, "Calories burned cannot be negative"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    exercises: [
      {
        name: {
          type: String,
          required: [true, "Exercise name is required"],
          trim: true,
        },
        sets: [
          {
            weight: {
              type: Number,
              required: [true, "Weight is required"],
              min: [0, "Weight cannot be negative"],
            },
            reps: {
              type: Number,
              required: [true, "Reps are required"],
              min: [1, "Reps must be at least 1"],
            },
            isCompleted: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workout", workoutSchema);
