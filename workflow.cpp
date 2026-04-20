/*
 * IntelliFlow AI - Graph Workflow Engine
 * DSA Implementation: BFS + DFS + LRU Cache
 *
 * Compile: g++ -O2 -std=c++17 -o workflow workflow.cpp
 * Usage:   ./workflow '<json_input>'
 *
 * JSON Input Format:
 * {
 *   "nodes": ["T1","T2","T3"],
 *   "edges": [["T1","T2"],["T1","T3"],["T2","T3"]],
 *   "algorithm": "bfs"   // or "dfs"
 * }
 */

#include <iostream>
#include <string>
#include <vector>
#include <queue>
#include <stack>
#include <map>
#include <unordered_map>
#include <unordered_set>
#include <list>
#include <sstream>
#include <algorithm>
#include <stdexcept>

// ────────────────────────────────────────────
// MINIMAL JSON PARSER (no external libs)
// ────────────────────────────────────────────
std::string extractStringValue(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos = json.find(":", pos);
    pos = json.find("\"", pos);
    size_t end = json.find("\"", pos + 1);
    return json.substr(pos + 1, end - pos - 1);
}

std::vector<std::string> extractArray(const std::string& json, const std::string& key) {
    std::vector<std::string> result;
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return result;
    size_t arr_start = json.find("[", pos);
    size_t arr_end   = json.find("]", arr_start);
    std::string arr  = json.substr(arr_start + 1, arr_end - arr_start - 1);

    size_t i = 0;
    while (i < arr.size()) {
        size_t s = arr.find("\"", i);
        if (s == std::string::npos) break;
        size_t e = arr.find("\"", s + 1);
        result.push_back(arr.substr(s + 1, e - s - 1));
        i = e + 1;
    }
    return result;
}

// Extract array-of-arrays for edges: [["T1","T2"], ...]
std::vector<std::pair<std::string,std::string>> extractEdges(const std::string& json) {
    std::vector<std::pair<std::string,std::string>> edges;
    size_t pos = json.find("\"edges\"");
    if (pos == std::string::npos) return edges;

    size_t outer_start = json.find("[", pos);      // outer [
    size_t depth = 0;
    size_t outer_end = outer_start;
    for (size_t i = outer_start; i < json.size(); ++i) {
        if (json[i] == '[') depth++;
        else if (json[i] == ']') { depth--; if (depth == 0) { outer_end = i; break; } }
    }

    std::string arr = json.substr(outer_start + 1, outer_end - outer_start - 1);
    size_t i = 0;
    while (i < arr.size()) {
        size_t inner_start = arr.find("[", i);
        if (inner_start == std::string::npos) break;
        size_t inner_end = arr.find("]", inner_start);
        std::string inner = arr.substr(inner_start + 1, inner_end - inner_start - 1);

        size_t s1 = inner.find("\"");
        size_t e1 = inner.find("\"", s1 + 1);
        size_t s2 = inner.find("\"", e1 + 1);
        size_t e2 = inner.find("\"", s2 + 1);

        if (s1 != std::string::npos && s2 != std::string::npos) {
            std::string from = inner.substr(s1 + 1, e1 - s1 - 1);
            std::string to   = inner.substr(s2 + 1, e2 - s2 - 1);
            edges.push_back({from, to});
        }
        i = inner_end + 1;
    }
    return edges;
}

// ────────────────────────────────────────────
// LRU CACHE
// ────────────────────────────────────────────
class LRUCache {
    int capacity;
    std::list<std::pair<std::string, std::string>> cache;
    std::unordered_map<std::string, std::list<std::pair<std::string,std::string>>::iterator> map;

public:
    LRUCache(int cap) : capacity(cap) {}

    std::string get(const std::string& key) {
        auto it = map.find(key);
        if (it == map.end()) return "";
        cache.splice(cache.begin(), cache, it->second);
        return it->second->second;
    }

    void put(const std::string& key, const std::string& value) {
        auto it = map.find(key);
        if (it != map.end()) {
            cache.erase(it->second);
            map.erase(it);
        }
        cache.push_front({key, value});
        map[key] = cache.begin();
        if ((int)cache.size() > capacity) {
            map.erase(cache.back().first);
            cache.pop_back();
        }
    }

    std::vector<std::string> getKeys() {
        std::vector<std::string> keys;
        for (auto& p : cache) keys.push_back(p.first);
        return keys;
    }
};

// Global LRU cache (capacity 5)
static LRUCache workflowCache(5);

// ────────────────────────────────────────────
// GRAPH CLASS
// ────────────────────────────────────────────
class WorkflowGraph {
    std::map<std::string, std::vector<std::string>> adj;
    std::vector<std::string> nodes;

public:
    void addNode(const std::string& n) {
        if (adj.find(n) == adj.end()) {
            adj[n] = {};
            nodes.push_back(n);
        }
    }

    void addEdge(const std::string& from, const std::string& to) {
        adj[from].push_back(to);
    }

    // BFS → execution order (level by level)
    std::vector<std::string> bfs(const std::string& start) {
        std::vector<std::string> order;
        std::unordered_set<std::string> visited;
        std::queue<std::string> q;

        q.push(start);
        visited.insert(start);

        while (!q.empty()) {
            std::string node = q.front(); q.pop();
            order.push_back(node);
            for (const auto& neighbor : adj[node]) {
                if (!visited.count(neighbor)) {
                    visited.insert(neighbor);
                    q.push(neighbor);
                }
            }
        }
        return order;
    }

    // DFS → dependency traversal (deep first)
    std::vector<std::string> dfs(const std::string& start) {
        std::vector<std::string> order;
        std::unordered_set<std::string> visited;
        std::stack<std::string> stk;

        stk.push(start);
        while (!stk.empty()) {
            std::string node = stk.top(); stk.pop();
            if (!visited.count(node)) {
                visited.insert(node);
                order.push_back(node);
                for (auto it = adj[node].rbegin(); it != adj[node].rend(); ++it) {
                    if (!visited.count(*it)) stk.push(*it);
                }
            }
        }
        return order;
    }

    // Topological sort for full execution plan
    std::vector<std::string> topologicalSort() {
        std::map<std::string, int> inDegree;
        for (auto& n : nodes) inDegree[n] = 0;
        for (auto& p : adj)
            for (auto& nb : p.second) inDegree[nb]++;

        std::queue<std::string> q;
        for (auto& p : inDegree)
            if (p.second == 0) q.push(p.first);

        std::vector<std::string> result;
        while (!q.empty()) {
            std::string node = q.front(); q.pop();
            result.push_back(node);
            for (auto& nb : adj[node]) {
                if (--inDegree[nb] == 0) q.push(nb);
            }
        }
        return result;
    }

    std::string getFirstNode() {
        return nodes.empty() ? "" : nodes[0];
    }
};

// ────────────────────────────────────────────
// JSON OUTPUT HELPERS
// ────────────────────────────────────────────
std::string vecToJson(const std::vector<std::string>& v) {
    std::string s = "[";
    for (size_t i = 0; i < v.size(); ++i) {
        s += "\"" + v[i] + "\"";
        if (i + 1 < v.size()) s += ",";
    }
    return s + "]";
}

// ────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────
int main(int argc, char* argv[]) {
    if (argc < 2) {
        std::cerr << "{\"error\":\"No input provided\"}" << std::endl;
        return 1;
    }

    std::string input = argv[1];

    // Check LRU cache first
    std::string cached = workflowCache.get(input);
    // (Cache doesn't persist across processes; shown for concept demo)

    // Parse input
    std::vector<std::string> nodes = extractArray(input, "nodes");
    auto edges = extractEdges(input);
    std::string algo = extractStringValue(input, "algorithm");
    if (algo.empty()) algo = "bfs";

    if (nodes.empty()) {
        std::cout << "{\"error\":\"No nodes provided\",\"order\":[],\"algorithm\":\"" << algo << "\"}" << std::endl;
        return 0;
    }

    // Build graph
    WorkflowGraph graph;
    for (auto& n : nodes) graph.addNode(n);
    for (auto& p : edges) graph.addEdge(p.first, p.second);

    std::string start = graph.getFirstNode();
    std::vector<std::string> order;
    std::string traversalInfo;

    if (algo == "dfs") {
        order = graph.dfs(start);
        traversalInfo = "DFS: Dependency-first traversal (explore deep paths before siblings)";
    } else if (algo == "topo") {
        order = graph.topologicalSort();
        traversalInfo = "Topological Sort: Full execution order respecting all dependencies";
    } else {
        order = graph.bfs(start);
        traversalInfo = "BFS: Level-by-level execution (all tasks at same depth run together)";
    }

    // Cache the result (concept demo)
    workflowCache.put(input, vecToJson(order));

    // Output JSON
    std::cout << "{";
    std::cout << "\"algorithm\":\"" << algo << "\",";
    std::cout << "\"startNode\":\"" << start << "\",";
    std::cout << "\"order\":" << vecToJson(order) << ",";
    std::cout << "\"totalNodes\":" << nodes.size() << ",";
    std::cout << "\"totalEdges\":" << edges.size() << ",";
    std::cout << "\"traversalInfo\":\"" << traversalInfo << "\",";
    std::cout << "\"cacheSize\":5,";
    std::cout << "\"status\":\"success\"";
    std::cout << "}" << std::endl;

    return 0;
}
