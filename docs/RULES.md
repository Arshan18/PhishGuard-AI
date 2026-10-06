# Project Development Rules & Standards — PhishGuard AI

This document establishes the development, machine learning, architectural, and documentation guidelines for **PhishGuard AI**.

---

## 1. Code Quality & Engineering Discipline

* **Keep It Lightweight:** Maintain an accessible, subject-level project footprint. Avoid unnecessary enterprise dependencies, distributed queues, or heavy containerization.
* **Component Preservation:** Preserve existing working HTML, CSS, JavaScript, Flask endpoints, and ML models. Do not perform arbitrary rewrites without clear justification.
* **Safe Analysis Guarantee:** Target URLs and email text must always be inspected as static strings. Never execute, navigate to, or resolve suspicious URLs.
* **Zero Fabricated Data:** Never hardcode prediction outputs, fake confidence percentages, or simulate machine learning predictions in the frontend. All verdicts must originate from model inference.

---

## 2. Machine Learning & Inference Standards

* **Pipeline Parity:** Ensure text vectorization, n-gram parameters, vocabulary bounds, and classification hyperparameters match between training notebooks and runtime Flask inference.
* **Verified Class Mappings:** Never assume a fixed class index (e.g., assuming index 1 is always phishing). Always inspect `model.classes_` dynamically to map labels (`0: Legitimate`, `1: Phishing`).
* **Probabilistic Integrity:** Return exact floating-point probabilities from `predict_proba()` without arbitrary clamping, rounding distortion, or synthetic scaling.
* **Explainability Boundaries:** Clearly distinguish rule-based summaries conditioned on model output from post-hoc explainability frameworks (e.g., LIME or SHAP).

---

## 3. Dataset & Model Artifact Rules

* **Read-Only Datasets:** Raw data in `datasets/` (`phishing_email.csv`, `Training Dataset.arff`) must remain immutable.
* **Safe Serialization:** Export and store all scikit-learn model pipelines in `models/` using `joblib` with descriptive filenames.
* **Feature Ordering:** For tabular feature models, strictly preserve column ordering and categorical encoding across training and runtime inference.

---

## 4. Frontend & UX Standards

* **Design Consistency:** Adhere strictly to the dark charcoal (`#080D10`) and teal (`#20C8C3`) palette, typography, and card tokens defined in `frontend/style.css`.
* **Motion & Performance:** Use hardware-accelerated CSS properties (`transform`, `opacity`) for smooth 60fps animations.
* **Accessibility:** Always maintain a functional `@media (prefers-reduced-motion: reduce)` block to support users who prefer minimal motion.
* **State Cleanliness:** When initiating a new scan or clearing inputs, immediately reset previous result containers (`innerHTML = ''`) and alerts to avoid stale UI state.

---

## 5. Backend & API Rules

* **Strict Input Validation:** Validate payloads on every endpoint; return descriptive HTTP 400 status codes for missing or empty input fields.
* **Structured Error Responses:** Wrap model inference in try/except blocks to return standardized JSON error objects instead of unhandled 500 server crashes.
* **CORS Compliance:** Ensure CORS headers are enabled to allow smooth local testing and frontend-backend decoupling.

---

## 6. Documentation Standards

* **Ground Truth Parity:** Keep all `.md` files strictly aligned with the current implementation state.
* **Honest Status Tracking:** Never document a planned or pending feature as completed. Mark incomplete features explicitly as `[In Progress]` or `[Planned]`.
