const router = require("express").Router();
const { generatePlan } = require("../controllers/aiController");
const { protect }      = require("../middleware/auth");

// POST /api/ai/generate-plan  (protected — user must be logged in)
router.post("/generate-plan", protect, generatePlan);

module.exports = router;
