const router = require("express").Router();
const { register, login, me } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// GET  /api/auth/me  (protected)
router.get("/me", protect, me);

module.exports = router;
