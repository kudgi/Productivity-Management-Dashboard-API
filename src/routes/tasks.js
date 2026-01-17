const express = require("express");
const Task = require("../models/Task");
const logger = require("../utils/logger");
const { protect } = require("../middleware/auth");
const { validateRequest, taskSchema, updateTaskSchema } = require("../middleware/validation");

const router = express.Router();

// Middleware to protect all routes
router.use(protect);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post("/", validateRequest(taskSchema), async (req, res) => {
  try {
    console.log("Creating task with validatedData:", req.validatedData);
    const { title, description, priority, status, deadline, tags, recurring } =
      req.validatedData;

    // Determine if task is overdue
    const isOverdue = deadline && new Date(deadline) < new Date() && status !== "Completed";

    const task = await Task.create({
      title,
      description,
      priority,
      status,
      deadline,
      tags,
      recurring,
      isOverdue,
      user: req.user._id,
    });

    logger.info(`Task created: ${task._id} by user ${req.user._id}`);
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Full error stack:", error);
    logger.error(`Error creating task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks for authenticated user with filters
// @access  Private
router.get("/", async (req, res) => {
  try {
    const {
      status,
      priority,
      search,
      startDate,
      endDate,
      tags,
      sortBy = "-createdAt",
    } = req.query;

    // Build query
    let query = { user: req.user._id };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by deadline range
    if (startDate || endDate) {
      query.deadline = {};
      if (startDate) {
        query.deadline.$gte = new Date(startDate);
      }
      if (endDate) {
        query.deadline.$lte = new Date(endDate);
      }
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(",");
      query.tags = { $in: tagArray };
    }

    const tasks = await Task.find(query).sort(sortBy).populate("user", "username email");

    logger.info(`Retrieved ${tasks.length} tasks for user ${req.user._id}`);
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    logger.error(`Error fetching tasks: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("user", "username email");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Ensure user owns the task
    if (task.user._id.toString() !== req.user._id.toString()) {
      logger.warn(
        `Unauthorized access attempt to task ${req.params.id} by user ${req.user._id}`
      );
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this task",
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    logger.error(`Error fetching task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error fetching task",
      error: error.message,
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put("/:id", validateRequest(updateTaskSchema), async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Ensure user owns the task
    if (task.user.toString() !== req.user._id.toString()) {
      logger.warn(
        `Unauthorized update attempt to task ${req.params.id} by user ${req.user._id}`
      );
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this task",
      });
    }

    const updateData = req.validatedData;

    // If status is changed to Completed, set completedAt
    if (updateData.status === "Completed" && task.status !== "Completed") {
      updateData.completedAt = new Date();
    }

    task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    logger.info(`Task updated: ${task._id} by user ${req.user._id}`);
    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    logger.error(`Error updating task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Ensure user owns the task
    if (task.user.toString() !== req.user._id.toString()) {
      logger.warn(
        `Unauthorized delete attempt to task ${req.params.id} by user ${req.user._id}`
      );
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this task",
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    logger.info(`Task deleted: ${req.params.id} by user ${req.user._id}`);
    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    logger.error(`Error deleting task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
});

module.exports = router;
