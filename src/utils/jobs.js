const cron = require("node-cron");
const Task = require("../models/Task");
const logger = require("./logger");

// Update overdue tasks every hour
const updateOverdueTasks = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      await Task.updateMany(
        {
          deadline: { $lt: now },
          status: { $ne: "Completed" },
        },
        { isOverdue: true }
      );
      logger.info("Overdue tasks updated");
    } catch (error) {
      logger.error(`Error updating overdue tasks: ${error.message}`);
    }
  });
};

// Handle recurring tasks daily
const handleRecurringTasks = () => {
  cron.schedule("0 2 * * *", async () => {
    // Runs daily at 2 AM
    try {
      const recurringTasks = await Task.find({
        "recurring.enabled": true,
      });

      for (const task of recurringTasks) {
        if (task.recurring.frequency === "daily") {
          // Create a new task instance
          await Task.create({
            title: task.title,
            description: task.description,
            priority: task.priority,
            deadline: new Date(task.deadline.getTime() + 24 * 60 * 60 * 1000),
            tags: task.tags,
            user: task.user,
            recurring: task.recurring,
          });
        } else if (task.recurring.frequency === "weekly") {
          // Create a new task instance for next week
          await Task.create({
            title: task.title,
            description: task.description,
            priority: task.priority,
            deadline: new Date(task.deadline.getTime() + 7 * 24 * 60 * 60 * 1000),
            tags: task.tags,
            user: task.user,
            recurring: task.recurring,
          });
        }
      }

      logger.info(`Recurring tasks created: ${recurringTasks.length}`);
    } catch (error) {
      logger.error(`Error handling recurring tasks: ${error.message}`);
    }
  });
};

const startBackgroundJobs = () => {
  logger.info("Starting background jobs...");
  updateOverdueTasks();
  handleRecurringTasks();
};

module.exports = startBackgroundJobs;
