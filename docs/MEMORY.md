# Project Memory & Implementation Context — PhishGuard AI

## 1. Project Overview & Identity

* **Project Title:** AI-Based Phishing Email and Malicious URL Detection Using Explainable Machine Learning
* **Application Name:** PhishGuard AI
* **Scope:** Final-Year Undergraduate Subject-Level IT Engineering Academic Project
* **Core Goal:** Deliver an interactive, educational, and explainable threat assessment platform utilizing transparent machine learning workflows.

---

## 2. Technology Stack & Environment

* **Language:** Python 3 (Flask Backend & ML Inference), JavaScript ES6+ (Frontend Controller)
* **Backend Framework:** Flask 3.x with CORS support (`flask_cors`)
* **ML & Numerical Libraries:** `scikit-learn`, `numpy`, `joblib`
* **Frontend:** HTML5, Vanilla CSS3 (Custom Design System & Motion Framework), Bootstrap 5 (CDN), Bootstrap Icons
* **Supported Platforms:** Windows, macOS, Linux (Cross-platform)

---

## 3. Machine Learning Architecture Decisions

### 3.1. Email Classification Pipeline
* **Artifact:** `models/email_phishing_model.joblib` (Loaded automatically on Flask startup).
* **Pipeline Structure:**
  1. `TfidfVectorizer(max_features=30000, ngram_range=(1, 2), sublinear_tf=True)`
  2. `LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)`
* **Class Mapping:** Verified from `classes_` array:
  * `0`: Legitimate
  * `1`: Phishing / Spam
* **Probability Metrics Decision:**
  * **Phishing Risk ($P(\text{Phishing})$):** The single probability score displayed in the user interface. It represents the probability belonging strictly to class 1.
  * **Model Confidence ($P(\text{Predicted})$):** Computed internally and returned in API responses for auditing, but the UI is focused cleanly on Phishing Risk to prevent user confusion.

### 3.2. URL Classification Pipeline
* **Dataset:** `datasets/Training Dataset.arff` (UCI Phishing Websites repository with 30 pre-engineered structural and lexical domain attributes).
* **Status:** The frontend UI is complete with client validation and sample loaders. The live inference hook in Flask is scheduled for subsequent deployment alongside the raw URL feature extraction layer.

---

## 4. Key UI/UX Decisions

* **Theme:** Dark charcoal (`#080D10` / `#0D1519`) and teal (`#20C8C3` / `#52DDD6`) palette.
* **Motion Framework:** Hardware-accelerated CSS keyframes and transitions with full `@media (prefers-reduced-motion: reduce)` accessibility overrides.
* **Sample Testing Bar:** Collections of 10+ synthetic phishing emails and 10+ legitimate emails with non-repeating random selection on consecutive clicks.
* **Scanning State:** Active card scanline radar sweep (`@keyframes scanlineSweep`) and button spinner active strictly while API requests are pending.
* **State Management:** Form submission resets previous results immediately (`resultContainer.innerHTML = ''`), and input clear resets all fields and character counters.

---

## 5. Verified Implementation Checklist

- [x] Standard project directory structure (`datasets/`, `notebooks/`, `models/`, `backend/`, `frontend/`, `docs/`)
- [x] Email dataset (`datasets/phishing_email.csv`) and URL dataset (`datasets/Training Dataset.arff`)
- [x] Trained email model pipeline exported to `models/email_phishing_model.joblib`
- [x] Flask backend (`backend/app.py`) serving static files and live REST APIs
- [x] Health check endpoint (`GET /api/health`) and email scan route (`POST /api/scan-email`)
- [x] Verified class index extraction and probability calculation in Flask
- [x] Responsive frontend with homepage, email scanner, and URL scanner
- [x] 10+ synthetic phishing and 10+ legitimate sample email library with random picker
- [x] Slim 8px animated progress bar for Phishing Risk
- [x] Diagnostic scripts (`backend/test_model.py`, `backend/test_api_endpoints.py`)
- [ ] Raw URL feature extraction pipeline and Random Forest model export for `/api/analyze-url`
