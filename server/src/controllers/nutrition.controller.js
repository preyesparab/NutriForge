const axios        = require("axios");
const FormData     = require("form-data");
const multer       = require("multer");
const NutritionScan = require("../models/NutritionScan");
const NutritionLog  = require("../models/NutritionLog");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// ── Multer — memory storage, no disk writes ───────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are accepted"), false);
  },
});

// ── POST /api/nutrition/analyze ───────────────────────────────────────────────
const analyzeImage = [
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    // Forward the image buffer to the Python AI service
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename:    req.file.originalname || "upload.jpg",
      contentType: req.file.mimetype,
    });

    let aiResult;
    try {
      const aiRes = await axios.post(`${AI_URL}/food/analyze`, form, {
        headers: { ...form.getHeaders() },
        timeout: 60_000,   // model inference can take a moment on first run
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      aiResult = aiRes.data;
    } catch (err) {
      console.error("[nutrition/analyze] AI service error:", err.message);
      const status  = err.response?.status || 503;
      const message = err.response?.data?.detail || "AI service unavailable";
      return res.status(status).json({ success: false, message });
    }

    // Persist scan to MongoDB
    const mealType = req.body.mealType || "snack";
    const scan = await NutritionScan.create({
      user:          req.user._id,
      scannedAt:     new Date(),
      mealType,
      detectedFoods: (aiResult.detected_foods || []).map((f) => ({
        name:           f.name,
        displayName:    f.display_name || f.name,
        confidence:     f.confidence,
        estimatedGrams: f.estimated_grams,
        bbox:           f.bbox,
        nutrition:      f.nutrition,
      })),
      totals:        aiResult.totals || {},
      imageWithBoxes: aiResult.image_with_boxes || "",
    });

    return res.json({
      success: true,
      scanId:  scan._id,
      detectedFoods:   aiResult.detected_foods,
      totals:          aiResult.totals,
      imageWithBoxes:  aiResult.image_with_boxes,
    });
  },
];

// ── POST /api/nutrition/log  (save as a NutritionLog manual entry) ────────────
const saveLog = async (req, res) => {
  const { scanId, mealType, detectedFoods, totals } = req.body;

  if (!totals || totals.calories === undefined) {
    return res.status(400).json({ success: false, message: "Missing totals" });
  }

  // Update mealType on the scan record if scanId is provided
  if (scanId) {
    await NutritionScan.findOneAndUpdate(
      { _id: scanId, user: req.user._id },
      { mealType }
    );
  }

  // Also write into the legacy NutritionLog (used by Dashboard calorie charts)
  const logEntries = (detectedFoods || []).map((f) => ({
    user:        req.user._id,
    foodItem:    f.display_name || f.displayName || f.name,
    servingSize: `${f.estimated_grams}g`,
    calories:    f.nutrition?.calories ?? 0,
    protein:     f.nutrition?.protein  ?? 0,
    carbs:       f.nutrition?.carbs    ?? 0,
    fats:        f.nutrition?.fat      ?? 0,
    fiber:       f.nutrition?.fiber    ?? 0,
    mealType,
  }));

  if (logEntries.length > 0) {
    await NutritionLog.insertMany(logEntries);
  }

  return res.json({ success: true, message: "Saved to nutrition log" });
};

// ── GET /api/nutrition/log  (recent scan history) ─────────────────────────────
const getLogs = async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const scans = await NutritionScan.find({ user: req.user._id })
    .sort({ scannedAt: -1 })
    .limit(limit)
    .select("-imageWithBoxes"); // omit large base64 for list view

  return res.json({ success: true, scans });
};

module.exports = { analyzeImage, saveLog, getLogs, upload };
