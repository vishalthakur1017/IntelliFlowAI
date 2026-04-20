"""
IntelliFlow AI - Task Priority Prediction Script
Called by Node.js via child_process
Usage: python predict.py "task description here"
"""

import sys
import pickle
import json
import os

def predict_priority(description: str) -> dict:
    model_dir = os.path.join(os.path.dirname(__file__), "model")
    model_path = os.path.join(model_dir, "priority_model.pkl")
    vec_path   = os.path.join(model_dir, "vectorizer.pkl")

    if not os.path.exists(model_path):
        return {"error": "Model not found. Please run train_model.py first.", "priority": "Medium"}

    with open(model_path, "rb") as f:
        model = pickle.load(f)
    with open(vec_path, "rb") as f:
        vectorizer = pickle.load(f)

    X = vectorizer.transform([description])
    prediction = model.predict(X)[0]

    # Confidence (probability)
    proba = model.predict_proba(X)[0]
    classes = model.classes_
    confidence = dict(zip(classes.tolist(), [round(float(p), 3) for p in proba]))

    return {
        "priority": prediction,
        "confidence": confidence,
        "description": description
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No description provided", "priority": "Medium"}))
        sys.exit(1)

    description = " ".join(sys.argv[1:])
    result = predict_priority(description)
    print(json.dumps(result))
