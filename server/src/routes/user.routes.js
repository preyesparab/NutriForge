const router = require("express").Router();
// GET  /api/users/me  – current user profile
router.get("/me",   (_req, res) => res.json({ message: "get profile stub" }));
// PUT  /api/users/me  – update profile
router.put("/me",   (_req, res) => res.json({ message: "update profile stub" }));
module.exports = router;
