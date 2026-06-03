const mongoose = require("mongoose");

const nutritionLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    foodItem: {
      type: String,
      required: [true, "Food item name is required"],
      trim: true,
    },
    servingSize: { type: String, default: "100g" }, // e.g. "1 cup", "200g"
    calories: { type: Number, required: true, min: 0 },
    protein:  { type: Number, default: 0, min: 0 }, // grams
    carbs:    { type: Number, default: 0, min: 0 }, // grams
    fats:     { type: Number, default: 0, min: 0 }, // grams
    fiber:    { type: Number, default: 0, min: 0 }, // grams
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      default: "snack",
    },
    imageUrl: { type: String, default: "" }, // food photo URL (from YOLO scan)
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── Index for per-user date queries (daily calorie totals) ────────────────────
nutritionLogSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model("NutritionLog", nutritionLogSchema);
