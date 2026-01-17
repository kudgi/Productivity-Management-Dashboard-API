const express = require("express");
const Task = require("../models/Task");
const logger = require("../utils/logger");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Middleware to protect all routes
router.use(protect);

// @route   GET /api/dashboard/overview
// @desc    Get productivity overview
// @access  Private
router.get("/overview", async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all user tasks
    const allTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({
      user: userId,
      status: "Completed",
    });
    const pendingTasks = await Task.countDocuments({
      user: userId,
      status: "Pending",
    });
    const inProgressTasks = await Task.countDocuments({
      user: userId,
      status: "In Progress",
    });
    const overdueTasks = await Task.countDocuments({
      user: userId,
      isOverdue: true,
    });

    const completionRate =
      allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0;

    logger.info(`Dashboard overview retrieved for user ${userId}`);
    res.status(200).json({
      success: true,
      data: {
        totalTasks: allTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
      },
    });
  } catch (error) {
    logger.error(`Error fetching dashboard overview: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard overview",
      error: error.message,
    });
  }
});

// @route   GET /api/dashboard/statistics
// @desc    Get detailed productivity statistics
// @access  Private
router.get("/statistics", async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = "week" } = req.query; // week or month

    const now = new Date();
    let startDate = new Date();

    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Completed tasks in period
    const completedInPeriod = await Task.countDocuments({
      user: userId,
      status: "Completed",
      completedAt: { $gte: startDate },
    });

    // Created tasks in period
    const createdInPeriod = await Task.countDocuments({
      user: userId,
      createdAt: { $gte: startDate },
    });

    // Priority distribution
    const priorityDistribution = await Task.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // Status distribution
    const statusDistribution = await Task.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Tasks completed per day (last 7 days)
    const completionTrend = await Task.aggregate([
      {
        $match: {
          user: userId,
          status: "Completed",
          completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$completedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    logger.info(`Statistics retrieved for user ${userId}`);
    res.status(200).json({
      success: true,
      data: {
        period,
        completedInPeriod,
        createdInPeriod,
        priorityDistribution,
        statusDistribution,
        completionTrend,
      },
    });
  } catch (error) {
    logger.error(`Error fetching statistics: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

// @route   GET /api/dashboard/productivity-score
// @desc    Get productivity score based on completion rate and task trends
// @access  Private
router.get("/productivity-score", async (req, res) => {
  try {
    const userId = req.user._id;

    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({
      user: userId,
      status: "Completed",
    });
    const overdueTasks = await Task.countDocuments({
      user: userId,
      isOverdue: true,
    });

    // Calculate score (0-100)
    let score = 0;

    if (totalTasks > 0) {
      const completionRate = completedTasks / totalTasks;
      score += completionRate * 60; // 60% for completion rate

      // 40% for task management
      if (totalTasks <= 10) {
        score += 40;
      } else if (totalTasks <= 30) {
        score += 30;
      } else if (totalTasks <= 60) {
        score += 20;
      } else {
        score += 10;
      }

      // Deduct for overdue tasks
      if (overdueTasks > 0) {
        score -= overdueTasks * 5;
      }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let level = "Beginner";
    if (score >= 80) level = "Expert";
    else if (score >= 60) level = "Advanced";
    else if (score >= 40) level = "Intermediate";

    logger.info(`Productivity score calculated for user ${userId}: ${score}`);
    res.status(200).json({
      success: true,
      data: {
        score,
        level,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        overdueTasks,
      },
    });
  } catch (error) {
    logger.error(`Error calculating productivity score: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error calculating productivity score",
      error: error.message,
    });
  }
});

module.exports = router;
