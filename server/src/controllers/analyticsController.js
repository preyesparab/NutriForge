const Workout = require("../models/Workout");
const User = require("../models/User");

/**
 * @desc    Get dashboard analytics (Flat Dark Mode spec)
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. STATS (totalWorkouts, totalCalories, totalMinutes, totalVolume)
    const workouts = await Workout.find({ user: userId });
    const totalWorkouts = workouts.length;
    let totalCalories = 0;
    let totalMinutes = 0;
    let totalVolume = 0;

    workouts.forEach((w) => {
      totalCalories += w.caloriesBurned || 0;
      totalMinutes += w.durationMinutes || 0;
      if (w.exercises) {
        w.exercises.forEach((ex) => {
          if (ex.sets) {
            ex.sets.forEach((s) => {
              if (s.isCompleted) {
                totalVolume += (s.weight || 0) * (s.reps || 0);
              }
            });
          }
        });
      }
    });

    const stats = { totalWorkouts, totalCalories, totalMinutes, totalVolume };

    // 2. CHARTDATA (last 14 days array)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const volumeChart = await Workout.aggregate([
      { $match: { user: userId, date: { $gte: fourteenDaysAgo } } },
      { $unwind: "$exercises" },
      { $unwind: "$exercises.sets" },
      { $match: { "exercises.sets.isCompleted": true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          volume: { $sum: { $multiply: ["$exercises.sets.weight", "$exercises.sets.reps"] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const daysArr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartData = volumeChart.map((item) => {
      const d = new Date(item._id);
      return {
        date: daysArr[d.getUTCDay()],
        volume: item.volume,
      };
    });

    // 3. GOALS (workoutsCompletedThisWeek, weeklyTarget)
    const user = await User.findById(userId).select("goals");
    const weeklyTarget = user?.goals?.weeklyWorkoutsTarget || 4;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const workoutsCompletedThisWeek = await Workout.countDocuments({
      user: userId,
      date: { $gte: sevenDaysAgo },
    });

    const goals = { workoutsCompletedThisWeek, weeklyTarget };

    // Final Payload Map
    res.status(200).json({
      success: true,
      data: { stats, chartData, goals },
    });
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error calculating analytics.",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardAnalytics,
};
