/**
 * Task Controller - CRUD for tasks in MongoDB
 */
const Task = require("../models/Task");

// In-memory fallback when MongoDB is not available
let memoryTasks = [];
let nextId = 1;

function usesMongo() {
  const mongoose = require("mongoose");
  return mongoose.connection.readyState === 1;
}

exports.getAllTasks = async (req, res) => {
  try {
    if (usesMongo()) {
      const tasks = await Task.find().sort({ createdAt: -1 });
      return res.json({ success: true, tasks });
    }
    res.json({ success: true, tasks: memoryTasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, status, dependencies, tags } = req.body;
    if (!title) return res.status(400).json({ success: false, error: "Title is required" });

    if (usesMongo()) {
      const task = await Task.create({ title, description, priority, status, dependencies, tags });
      return res.status(201).json({ success: true, task });
    }

    // Memory fallback
    const task = {
      _id: String(nextId++),
      title,
      description: description || "",
      priority: priority || "Medium",
      status: status || "pending",
      dependencies: dependencies || [],
      tags: tags || [],
      createdAt: new Date().toISOString(),
    };
    memoryTasks.unshift(task);
    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    if (usesMongo()) {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ success: false, error: "Task not found" });
      return res.json({ success: true, task });
    }
    const task = memoryTasks.find((t) => t._id === req.params.id);
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    if (usesMongo()) {
      const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!task) return res.status(404).json({ success: false, error: "Task not found" });
      return res.json({ success: true, task });
    }
    const idx = memoryTasks.findIndex((t) => t._id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: "Task not found" });
    memoryTasks[idx] = { ...memoryTasks[idx], ...req.body };
    res.json({ success: true, task: memoryTasks[idx] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    if (usesMongo()) {
      await Task.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: "Task deleted" });
    }
    memoryTasks = memoryTasks.filter((t) => t._id !== req.params.id);
    res.json({ success: true, message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
