# Project Development Rules & Standards — PhishGuard AI

This document establishes engineering, machine learning, architectural, and documentation guidelines for **PhishGuard AI** (AI-Based Phishing Email & Malicious URL Detection).

---

## 1. Academic Scope & Integrity Standards

* **Academic Prototype Focus:** Maintain a clear, accessible academic footprint suitable for a final-year IT engineering project (*Artificial Intelligence and Machine Learning - II*). Avoid claiming enterprise-grade real-time security appliances unless verified.
* **Zero Fabricated Metrics or Predictions:** Never hardcode prediction outputs, fake confidence percentages, or simulated machine learning outputs. All scores displayed in the UI must originate directly from trained model inference (`predict_proba()` or Keras Sigmoid output).
* **Safe Analysis Guarantee:** Target URLs and email texts must always be evaluated strictly as static string data. Never execute, navigate to, or resolve suspicious URLs in real time.

---

## 2. Machine Learning & Inference Standards

* **Dual-Pipeline Separation:**
  * **Email Model:** Uses classical machine learning (`TfidfVectorizer` + `LogisticRegression` in `models/email_phishing_model.joblib`). Do not refer to neural training epochs for the classical Logistic Regression model.
  * **URL Model:** Uses deep learning (`backend/url_features.py` 30-feature extractor + `models/url_scaler.joblib` + Dense Neural Network in `models/url_phishing_model.keras` trained over 50 epochs).
* **Class Index Integrity:** Dynamically verify class mapping from `model.classes_` (`0: Legitimate`, `1: Phishing/Spam`) to prevent inverted probability outputs.
* **Continuous Probabilities:** Output true floating-point probabilities from model inference without artificial discretization to fixed extremes ($0\%$ or $100\%$).
* **Explainability Boundaries:** Clearly present dynamic explanations and security checklists as rule-conditioned guidance derived from model confidence and feature presence, avoiding confusion with post-hoc perturbation frameworks (such as LIME or SHAP).

---

## 3. Dataset & Model Artifact Management

* **Immutable Datasets:** Raw benchmark data in `datasets/` (`phishing_email.csv`, `Training Dataset.arff`) must remain intact and read-only.
* **Consistent Feature Ordering:** The 30 extracted URL attributes in `backend/url_features.py` must strictly match the column sequence expected by `url_scaler.joblib` and `url_phishing_model.keras`.
* **Model Serialization:** Maintain all trained artifacts in `models/` with standard formats (`.joblib` for scikit-learn pipelines/scalers, `.keras` for TensorFlow/Keras neural networks).

---

## 4. Frontend & UI/UX Standards

* **Design System Adherence:** Consistently use the dark cybersecurity theme (charcoal `#080D10` / panel `#0D1519` / teal accent `#20C8C3` / gold `#FBBF24` / crimson `#FF727A`) defined in `frontend/style.css`.
* **Performance & Smoothness:** Use hardware-accelerated CSS properties (`transform`, `opacity`) for animations.
* **Accessibility:** Always maintain a functional `@media (prefers-reduced-motion: reduce)` override to respect user accessibility settings.
* **State Management:** When clearing inputs or submitting a new scan, immediately clear previous result containers (`innerHTML = ''`) and alerts to prevent stale state display.

---

## 5. Backend & API Guidelines

* **Input Validation:** Enforce payload validation on all routes (`/api/scan-email`, `/api/scan-url`); return descriptive HTTP 400 status codes for empty or invalid inputs.
* **Standardized JSON Responses:** Return uniform response structures containing status, prediction, probabilities, risk percentages, and explanations.
* **CORS Support:** Ensure CORS headers are enabled to permit decoupled frontend testing and local execution across ports.

---

## 6. Documentation Synchronization

* **Ground-Truth Parity:** All `.md` files must strictly reflect the active code, model artifacts, endpoints, and datasets present in the repository.
* **Attribution Consistency:** Maintain consistent team member names, roll numbers, HOD, and department metadata across all project documentation.
