const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { getDashboardAnalytics } = require("../controllers/analyticsController");

// @route   GET /api/analytics/dashboard
// @desc    Get analytics chart data based on workouts and user goals
// @access  Private
router.get("/dashboard", protect, getDashboardAnalytics);

module.exports = router;
