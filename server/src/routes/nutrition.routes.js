const router = require("express").Router();
const { protect } = require("../middleware/auth");
const {
  analyzeImage,
  saveLog,
  getLogs,
} = require("../controllers/nutrition.controller");

router.use(protect);

// POST  /api/nutrition/analyze  — upload image → YOLO → USDA → save scan
router.post("/analyze", ...analyzeImage);

// GET   /api/nutrition/log      — recent scan history (no base64 blobs)
router.get("/log", getLogs);

// POST  /api/nutrition/log      — confirm + save scan to NutritionLog
router.post("/log", saveLog);

module.exports = router;
