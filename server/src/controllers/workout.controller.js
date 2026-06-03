const Workout = require("../models/Workout");

/**
 * @desc    Create new workout
 * @route   POST /api/workouts
 * @access  Private
 */
const createWorkout = async (req, res) => {
  try {
    console.log('Received workout data:', req.body);
    const { title, durationMinutes, caloriesBurned, exercises, startTime } = req.body;

    const newWorkout = await Workout.create({
      user: req.user._id, // Set by the 'protect' middleware
      title: title || "New Session",
      durationMinutes: durationMinutes || 0,
      caloriesBurned: caloriesBurned || 0,
      date: startTime ? new Date(startTime) : Date.now(),
      exercises: exercises || [],
    });

    res.status(201).json({
      success: true,
      data: newWorkout,
      message: "Workout successfully created",
    });
  } catch (error) {
    console.error("Failed to create workout:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating workout.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all workouts for the logged-in user
 * @route   GET /api/workouts
 * @access  Private
 */
const getWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id }).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: workouts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching workouts." });
  }
};

/**
 * @desc    Get recent 5 workouts for the user
 * @route   GET /api/workouts/recent
 * @access  Private
 */
const getRecentWorkouts = async (req, res) => {
  try {
    const workouts = await Workout.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      data: workouts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching recent workouts." });
  }
};

module.exports = {
  createWorkout,
  getWorkouts,
  getRecentWorkouts,
};
