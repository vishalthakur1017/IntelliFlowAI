"""
IntelliFlow AI - Task Priority Prediction Model
Supervised Classification using scikit-learn
"""

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import pickle
import os

# ─────────────────────────────────────────────
# 1. GENERATE DUMMY DATASET
# ─────────────────────────────────────────────
data = {
    "description": [
        # HIGH priority
        "Fix critical production bug causing data loss",
        "Deploy urgent security patch to server",
        "Resolve payment gateway failure immediately",
        "Server is down fix it now",
        "Database backup failed needs immediate attention",
        "Critical API endpoint returning 500 errors",
        "Customer data breach detected urgent response",
        "Fix authentication system broken login",
        "Production deployment pipeline failed",
        "Urgent hotfix for billing module crash",
        "Resolve high severity vulnerability in system",
        "Emergency rollback of broken release",
        "Fix crashing mobile app for thousands of users",
        "Critical data migration failure",
        "Outage in payment processing system",
        "Fix null pointer exception in core module",
        "Database connection pool exhausted urgent",
        "SSL certificate expired fix now",

        # MEDIUM priority
        "Add new feature for user profile editing",
        "Improve search functionality performance",
        "Implement email notification system",
        "Refactor authentication module for clarity",
        "Write unit tests for order processing",
        "Update API documentation",
        "Design new dashboard layout",
        "Integrate third party analytics tool",
        "Optimize database queries for reports",
        "Build REST API for mobile clients",
        "Create admin panel for user management",
        "Implement pagination for task list",
        "Add export to PDF functionality",
        "Setup CI/CD pipeline for staging",
        "Migrate from monolith to microservices",
        "Implement caching layer with Redis",
        "Create role based access control system",
        "Update dependencies and resolve warnings",

        # LOW priority
        "Update README documentation",
        "Change button color on landing page",
        "Add a favicon to the website",
        "Rename variables for better readability",
        "Write blog post about project architecture",
        "Clean up unused CSS styles",
        "Add comments to utility functions",
        "Update copyright year in footer",
        "Organize project folder structure",
        "Add loading spinner to slow pages",
        "Fix minor typo in about page",
        "Update team member profile photos",
        "Add social media links to footer",
        "Reorder menu items for consistency",
        "Minor UI spacing adjustments",
        "Archive old log files",
        "Update color theme in documentation",
        "Add placeholder text to empty inputs",
    ],
    "priority": (
        ["High"] * 18 +
        ["Medium"] * 18 +
        ["Low"] * 18
    )
}

df = pd.DataFrame(data)
print(f"Dataset created: {len(df)} samples")
print(df["priority"].value_counts())

# ─────────────────────────────────────────────
# 2. FEATURE EXTRACTION (TF-IDF)
# ─────────────────────────────────────────────
vectorizer = TfidfVectorizer(max_features=500, stop_words="english", ngram_range=(1, 2))
X = vectorizer.fit_transform(df["description"])
y = df["priority"]

# ─────────────────────────────────────────────
# 3. TRAIN / TEST SPLIT
# ─────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ─────────────────────────────────────────────
# 4. TRAIN MODEL (Random Forest)
# ─────────────────────────────────────────────
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# ─────────────────────────────────────────────
# 5. EVALUATE
# ─────────────────────────────────────────────
y_pred = model.predict(X_test)
print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.2%}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# ─────────────────────────────────────────────
# 6. SAVE MODEL & VECTORIZER
# ─────────────────────────────────────────────
os.makedirs("model", exist_ok=True)
with open("model/priority_model.pkl", "wb") as f:
    pickle.dump(model, f)
with open("model/vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)

print("\nModel saved to model/priority_model.pkl")
print("Vectorizer saved to model/vectorizer.pkl")
