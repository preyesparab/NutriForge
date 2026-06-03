const router = require("express").Router();
// GET  /api/plans         – list plans
router.get("/",    (_req, res) => res.json({ message: "list plans stub" }));
// POST /api/plans/generate – generate AI plan
router.post("/generate", (_req, res) => res.json({ message: "generate plan stub" }));
module.exports = router;
