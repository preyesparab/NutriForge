const router = require("express").Router();
const { protect } = require("../middleware/auth");

const { createWorkout, getWorkouts, getRecentWorkouts } = require("../controllers/workout.controller");

// All workout routes are protected
router.use(protect);

router.post("/", createWorkout);
router.get("/recent", getRecentWorkouts);
router.get("/", getWorkouts);

router.get("/:id",    (_req, res) => res.json({ message: "get workout stub" }));
router.delete("/:id", (_req, res) => res.json({ message: "delete workout stub" }));

module.exports = router;
