/**
 * DSA Controller
 * Compiles & executes C++ workflow engine via Node.js child_process
 * Algorithms: BFS, DFS, Topological Sort + LRU Cache
 */
const { execSync, spawn } = require("child_process");
const path = require("path");
const fs   = require("fs");

const CPP_SRC    = path.join(__dirname, "../../dsa-cpp/workflow.cpp");
const CPP_BIN    = path.join(__dirname, "../../dsa-cpp/workflow");
const CPP_BIN_WIN = CPP_BIN + ".exe";

function binaryExists() {
  return fs.existsSync(CPP_BIN) || fs.existsSync(CPP_BIN_WIN);
}

function compileCpp() {
  try {
    execSync(`g++ -O2 -std=c++17 -o "${CPP_BIN}" "${CPP_SRC}"`, { timeout: 15000 });
    console.log("✅ C++ compiled successfully");
    return true;
  } catch (err) {
    console.warn("⚠️  g++ not available:", err.message);
    return false;
  }
}

// POST /api/dsa/run
exports.runWorkflow = (req, res) => {
  const { nodes, edges, algorithm } = req.body;

  if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
    return res.status(400).json({ success: false, error: "nodes array is required" });
  }

  const payload = JSON.stringify({
    nodes,
    edges:     edges || [],
    algorithm: algorithm || "bfs",
  });

  // Try to compile if binary doesn't exist
  if (!binaryExists()) {
    const compiled = compileCpp();
    if (!compiled) {
      // Fallback: JS BFS/DFS implementation
      return res.json(jsFallback(nodes, edges || [], algorithm || "bfs", payload));
    }
  }

  const binary = fs.existsSync(CPP_BIN_WIN) ? CPP_BIN_WIN : CPP_BIN;
  const proc   = spawn(binary, [payload]);

  let out = "";
  let err = "";

  proc.stdout.on("data", (d) => (out += d.toString()));
  proc.stderr.on("data", (d) => (err += d.toString()));

  proc.on("close", (code) => {
    if (code !== 0 || !out.trim()) {
      console.warn("C++ fallback triggered:", err);
      return res.json(jsFallback(nodes, edges || [], algorithm || "bfs", payload));
    }
    try {
      const result = JSON.parse(out.trim());
      res.json({ success: true, ...result, source: "c++" });
    } catch {
      res.json(jsFallback(nodes, edges || [], algorithm || "bfs", payload));
    }
  });
};

// ─────────────────────────────────────────────
// JavaScript fallback (BFS/DFS) when g++ unavailable
// ─────────────────────────────────────────────
function jsFallback(nodes, edges, algorithm) {
  const adj = {};
  nodes.forEach((n) => (adj[n] = []));
  edges.forEach(([from, to]) => { if (adj[from]) adj[from].push(to); });

  let order = [];
  const visited = new Set();

  if (algorithm === "dfs") {
    const stack = [nodes[0]];
    while (stack.length) {
      const node = stack.pop();
      if (!visited.has(node)) {
        visited.add(node);
        order.push(node);
        (adj[node] || []).slice().reverse().forEach((nb) => stack.push(nb));
      }
    }
  } else if (algorithm === "topo") {
    const inDeg = {};
    nodes.forEach((n) => (inDeg[n] = 0));
    edges.forEach(([, to]) => { inDeg[to] = (inDeg[to] || 0) + 1; });
    const queue = nodes.filter((n) => inDeg[n] === 0);
    while (queue.length) {
      const node = queue.shift();
      order.push(node);
      (adj[node] || []).forEach((nb) => { if (--inDeg[nb] === 0) queue.push(nb); });
    }
  } else {
    // BFS
    const queue = [nodes[0]];
    visited.add(nodes[0]);
    while (queue.length) {
      const node = queue.shift();
      order.push(node);
      (adj[node] || []).forEach((nb) => {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
      });
    }
  }

  return {
    success: true,
    algorithm,
    startNode: nodes[0],
    order,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    traversalInfo: `${algorithm.toUpperCase()}: Executed via JavaScript fallback (g++ not found)`,
    cacheSize: 5,
    status: "success",
    source: "javascript-fallback",
  };
}
