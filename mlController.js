/**
 * ML Controller
 * Calls Python scikit-learn model via Node.js child_process
 */
const { spawn } = require("child_process");
const path      = require("path");

// POST /api/ml/predict
exports.predictPriority = (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ success: false, error: "Description is required" });
  }

  const scriptPath = path.join(__dirname, "../../ml-model/predict.py");
  const python     = process.env.PYTHON_CMD || "python3";

  const pyProcess = spawn(python, [scriptPath, description]);

  let output = "";
  let errorOutput = "";

  pyProcess.stdout.on("data", (data) => {
    output += data.toString();
  });

  pyProcess.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  pyProcess.on("close", (code) => {
    if (code !== 0) {
      console.error("Python error:", errorOutput);
      // Fallback: keyword-based heuristic
      const priority = heuristicPriority(description);
      return res.json({
        success: true,
        priority,
        confidence: { [priority]: 1.0 },
        description,
        source: "heuristic (ML model not trained yet)",
      });
    }

    try {
      const result = JSON.parse(output.trim());
      res.json({ success: true, ...result, source: "ml-model" });
    } catch {
      const priority = heuristicPriority(description);
      res.json({
        success: true,
        priority,
        confidence: { [priority]: 1.0 },
        description,
        source: "heuristic (parse error)",
      });
    }
  });
};

// Fallback heuristic when Python not available
function heuristicPriority(desc) {
  const lower = desc.toLowerCase();
  const high   = ["critical","urgent","emergency","crash","down","failure","broken","fix","immediately","hotfix","outage","breach","expired"];
  const low    = ["readme","typo","cleanup","rename","update footer","favicon","photo","minor","comment","archive","placeholder","spacing"];
  if (high.some((w) => lower.includes(w))) return "High";
  if (low.some((w) => lower.includes(w)))  return "Low";
  return "Medium";
}
