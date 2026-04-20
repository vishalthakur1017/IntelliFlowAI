# IntelliFlow AI — Setup & Run Guide

> **Smart Workflow Automation & Decision System**
> Node.js · MongoDB · Python ML · C++ DSA · Generative AI

---

## 📁 Folder Structure

```
IntelliFlow-AI/
├── frontend/
│   └── index.html              ← Single-page UI (Bootstrap + Vanilla JS)
│
├── backend/
│   ├── server.js               ← Express entry point
│   ├── package.json
│   ├── .env.example            ← Copy to .env and fill API keys
│   ├── models/
│   │   ├── Task.js             ← MongoDB Task schema
│   │   └── WorkflowHistory.js  ← MongoDB WorkflowHistory schema
│   ├── routes/
│   │   ├── taskRoutes.js
│   │   ├── workflowRoutes.js
│   │   ├── mlRoutes.js
│   │   └── dsaRoutes.js
│   ├── controllers/
│   │   ├── taskController.js   ← CRUD + memory fallback
│   │   ├── workflowController.js ← GenAI calls
│   │   ├── mlController.js     ← child_process → Python
│   │   └── dsaController.js    ← child_process → C++
│   └── services/
│       └── aiService.js        ← Gemini / OpenAI abstraction
│
├── ml-model/
│   ├── train_model.py          ← Train & save Random Forest model
│   ├── predict.py              ← Called by Node.js, prints JSON
│   └── model/
│       ├── priority_model.pkl  ← Saved trained model
│       └── vectorizer.pkl      ← Saved TF-IDF vectorizer
│
├── dsa-cpp/
│   ├── workflow.cpp            ← BFS + DFS + Topo Sort + LRU Cache
│   └── workflow               ← Compiled binary (after build step)
│
├── PROJECT_REPORT.md
└── README.md (this file)
```

---

## ⚙️ Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| npm | 9+ | included with Node |
| Python | 3.10+ | https://python.org |
| MongoDB | 6+ | https://mongodb.com (optional) |
| g++ / GCC | 11+ | Linux: `sudo apt install g++` · Mac: Xcode CLT · Windows: MinGW |

---

## 🚀 Step-by-Step Setup in VS Code

### Step 1 — Clone / Open Project
```bash
# Open VS Code terminal (Ctrl+`)
cd IntelliFlow-AI
```

### Step 2 — Install Node.js Backend Dependencies
```bash
cd backend
npm install
cd ..
```

### Step 3 — Configure Environment Variables
```bash
cd backend
cp .env.example .env
```
Open `backend/.env` and fill in:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/intelliflow

# Choose one:
GEMINI_API_KEY=your_gemini_key_here     # https://aistudio.google.com/
OPENAI_API_KEY=your_openai_key_here     # https://platform.openai.com/

AI_PROVIDER=gemini    # or openai
```
> **Note:** If you skip the API key, the system still works using built-in fallback responses.

### Step 4 — Install Python ML Dependencies
```bash
pip install scikit-learn pandas numpy
# If using pip3:
pip3 install scikit-learn pandas numpy
```

### Step 5 — Train the ML Model
```bash
cd ml-model
python3 train_model.py
# Expected output: "Model saved to model/priority_model.pkl"
cd ..
```

### Step 6 — Compile C++ Workflow Engine
```bash
cd dsa-cpp
g++ -O2 -std=c++17 -o workflow workflow.cpp

# Windows (MinGW):
g++ -O2 -std=c++17 -o workflow.exe workflow.cpp
cd ..
```
> **Note:** If g++ is unavailable, the backend auto-falls back to a JavaScript BFS/DFS implementation.

### Step 7 — Start MongoDB (optional but recommended)
```bash
# Linux / Mac:
mongod --dbpath ~/data/db

# Or if installed as a service:
sudo systemctl start mongod

# Windows:
net start MongoDB
```
> **Without MongoDB:** Tasks are stored in memory (lost on server restart), but everything else works.

### Step 8 — Start the Backend Server
```bash
cd backend
node server.js
# Or with hot-reload:
npx nodemon server.js
```
Expected output:
```
✅ MongoDB connected: mongodb://localhost:27017/intelliflow
🚀 IntelliFlow AI running at http://localhost:5000
📁 Frontend:  http://localhost:5000/
🔌 API Base:  http://localhost:5000/api
```

### Step 9 — Open the Frontend
Open your browser and go to:
```
http://localhost:5000
```
The Express server serves the frontend at the root path.

---

## 🧪 Sample Test Cases

### Test 1 — Add a Task
- Click **Add Task** panel
- Title: `Fix login bug`
- Description: `Users can't log in with Google OAuth`
- Priority: `High`
- Click **Add Task**
- Expected: Task appears in the Task List with a red "High" badge

### Test 2 — Predict Priority (ML)
- In the **ML Prediction** panel, enter:
  `Fix critical database crash causing payment failures`
- Click **Predict Priority**
- Expected: `HIGH` prediction with confidence bars showing ~80% for High

### Test 3 — Run Workflow (C++ DSA)
- Nodes: `Design, Backend, Frontend, Testing, Deploy`
- Edges: `Design→Backend, Design→Frontend, Backend→Testing, Frontend→Testing, Testing→Deploy`
- Select **BFS** algorithm
- Click **Run Workflow**
- Expected: `Design → Backend → Frontend → Testing → Deploy` (or similar BFS order)

### Test 4 — Generate AI Workflow
- Prompt: `Build a real-time chat application with rooms and file sharing`
- Click **Generate Workflow**
- Expected: 6-8 ordered steps like "Step 1: Define requirements..."

### Test 5 — Suggest Tasks
- Goal: `Launch an e-commerce website in 30 days`
- Click **Suggest Tasks**
- Expected: 4-6 tasks with titles, descriptions, and priorities

---

## 🔌 API Quick Reference

```bash
# Health
curl http://localhost:5000/api/health

# Create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Fix bug","priority":"High"}'

# Get all tasks
curl http://localhost:5000/api/tasks

# ML Predict
curl -X POST http://localhost:5000/api/ml/predict \
  -H "Content-Type: application/json" \
  -d '{"description":"Urgent: server is down"}'

# DSA Run Workflow
curl -X POST http://localhost:5000/api/dsa/run \
  -H "Content-Type: application/json" \
  -d '{"nodes":["A","B","C"],"edges":[["A","B"],["B","C"]],"algorithm":"bfs"}'

# Generate AI Workflow
curl -X POST http://localhost:5000/api/workflow/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Build a login system"}'

# Suggest Tasks
curl -X POST http://localhost:5000/api/workflow/suggest \
  -H "Content-Type: application/json" \
  -d '{"goal":"Build a mobile app"}'
```

---

## 🎓 Viva Explanation Points

### What is this project?
"IntelliFlow AI is a task management system that uses ML to predict task priority, GenAI to
generate workflow plans, REST APIs for data persistence, and C++ graph algorithms to compute
optimal execution order."

### How does the ML work?
"We use a TF-IDF vectorizer to convert task descriptions into numerical feature vectors.
These are fed into a Random Forest classifier trained on 54 labeled samples.  The model
outputs a priority class (High/Medium/Low) with a confidence score."

### How does Node.js call Python?
"Using Node's built-in `child_process.spawn()`, we launch `python3 predict.py "<description>"`.
The Python script prints a JSON object to stdout, which Node.js captures and parses."

### How does the C++ engine work?
"The C++ program reads a JSON payload as a command-line argument containing nodes, edges,
and algorithm choice. It builds an adjacency-list graph, runs BFS or DFS or Topological
Sort, and prints the result as JSON to stdout. Node.js spawns this binary and reads the
output."

### What is LRU Cache?
"Least Recently Used Cache keeps the N most recently accessed items. When the cache is
full, the least recently used item is evicted. We implement it with a doubly-linked list
(O(1) move to front) and a hash map (O(1) lookup), giving O(1) get and put."

### How does GenAI integration work?
"We send a carefully engineered system prompt to the Gemini API via HTTP POST using axios.
The prompt instructs the model to return only JSON. We parse the response and serve it to
the frontend."
