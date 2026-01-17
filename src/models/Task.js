const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a task title"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High"],
        message: "Priority must be Low, Medium, or High",
      },
      default: "Medium",
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "In Progress", "Completed"],
        message: "Status must be Pending, In Progress, or Completed",
      },
      default: "Pending",
    },
    deadline: {
      type: Date,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    completedAt: {
      type: Date,
    },
    recurring: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["daily", "weekly"],
      },
    },
  },
  { timestamps: true }
);

// Index for faster queries
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, deadline: 1 });
taskSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model("Task", taskSchema);
