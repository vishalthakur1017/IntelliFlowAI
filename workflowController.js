/**
 * Workflow Controller
 * Handles GenAI calls (Gemini / OpenAI) for workflow generation and task suggestion
 */
const aiService = require("../services/aiService");
const WorkflowHistory = require("../models/WorkflowHistory");

let memoryHistory = [];

function usesMongo() {
  const mongoose = require("mongoose");
  return mongoose.connection.readyState === 1;
}

// POST /api/workflow/generate
exports.generateWorkflow = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, error: "Prompt is required" });

    const steps = await aiService.generateWorkflow(prompt);

    // Save to history
    const historyEntry = { prompt, steps, type: "generated" };
    if (usesMongo()) {
      await WorkflowHistory.create(historyEntry);
    } else {
      memoryHistory.unshift({ ...historyEntry, _id: Date.now(), createdAt: new Date() });
    }

    res.json({ success: true, prompt, steps });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/workflow/suggest
exports.suggestTasks = async (req, res) => {
  try {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ success: false, error: "Goal is required" });

    const tasks = await aiService.suggestTasks(goal);
    res.json({ success: true, goal, tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/workflow/history
exports.getHistory = async (req, res) => {
  try {
    if (usesMongo()) {
      const history = await WorkflowHistory.find().sort({ createdAt: -1 }).limit(20);
      return res.json({ success: true, history });
    }
    res.json({ success: true, history: memoryHistory.slice(0, 20) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
