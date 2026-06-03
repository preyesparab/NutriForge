const mongoose = require("mongoose");

const detectedFoodSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true },
    displayName:    { type: String, default: "" },          // USDA food description
    confidence:     { type: Number, required: true },
    estimatedGrams: { type: Number, required: true },
    bbox:           { type: [Number], default: [] },
    nutrition: {
      calories: { type: Number, default: 0 },
      protein:  { type: Number, default: 0 },
      fat:      { type: Number, default: 0 },
      carbs:    { type: Number, default: 0 },
      fiber:    { type: Number, default: 0 },
      sugar:    { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const nutritionScanSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    scannedAt:      { type: Date, default: Date.now },
    mealType: {
      type:    String,
      enum:    ["breakfast", "lunch", "dinner", "snack"],
      default: "snack",
    },
    detectedFoods:  { type: [detectedFoodSchema], default: [] },
    totals: {
      calories: { type: Number, default: 0 },
      protein:  { type: Number, default: 0 },
      fat:      { type: Number, default: 0 },
      carbs:    { type: Number, default: 0 },
      fiber:    { type: Number, default: 0 },
      sugar:    { type: Number, default: 0 },
    },
    // base64 annotated image — stored as string (large; consider S3 for prod)
    imageWithBoxes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Fast per-user date queries (dashboard calorie totals)
nutritionScanSchema.index({ user: 1, scannedAt: -1 });

module.exports = mongoose.model("NutritionScan", nutritionScanSchema);
