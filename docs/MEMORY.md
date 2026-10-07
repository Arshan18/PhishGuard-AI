# Project Memory & Implementation Context — PhishGuard AI

## 1. Project Overview & Identity

* **Project Title:** PhishGuard AI – AI-Based Phishing Email & Malicious URL Detection
* **Academic Subject:** Artificial Intelligence and Machine Learning - II
* **Department:** DEPARTMENT OF INFORMATION TECHNOLOGY
* **College:** M. H. Saboo Siddik College of Engineering
* **Team Members:**
  * Asim Khan — 231407
  * Arshan Attar — 231408
* **Head of Department (HOD):** Dr. Zainab Mirza
* **Scope:** Final-Year Undergraduate Engineering Academic Project & Laboratory Prototype

---

## 2. Technology Stack & Environment

* **Backend Framework:** Python 3, Flask 3.x, `flask_cors`
* **Machine Learning Libraries:** `scikit-learn`, `joblib`, `numpy`, `pandas`, `tensorflow` / `keras`
* **Frontend Architecture:** HTML5, Vanilla CSS3 (Custom Dark Cybersecurity Design System), Vanilla JavaScript ES6+, Bootstrap 5 CDN, Bootstrap Icons
* **Supported Environments:** Windows, macOS, Linux (Cross-platform)

---

## 3. Machine Learning Architecture Decisions

### 3.1. Email Classification Pipeline
* **Artifact:** `models/email_phishing_model.joblib` (Loaded automatically on Flask startup).
* **Pipeline Structure:**
  1. `TfidfVectorizer(max_features=30000, ngram_range=(1, 2), sublinear_tf=True)`
  2. `LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)`
* **Class Mapping:** Verified from `model.classes_`:
  * `0`: Legitimate Email
  * `1`: Phishing / Spam Email
* **Verified Evaluation Results:**
  * Accuracy: **98.48%**
  * Confusion Matrix: `[[7795, 124], [126, 8453]]`
* **Probability Metrics:** The UI displays **Phishing Risk** ($P(\text{Phishing})$) as a calibrated percentage from $0.00\%$ to $100.00\%$.

### 3.2. URL Classification Pipeline
* **Artifacts:** `models/url_phishing_model.keras` and `models/url_scaler.joblib`.
* **Feature Extraction:** `backend/url_features.py` computes 30 structural, domain, and lexical features aligned with the UCI Phishing Websites schema.
* **Scaler:** `StandardScaler` fitted on the 30 UCI features.
* **Model Architecture:** Multi-layer Dense Neural Network with ReLU activation in hidden layers and a Sigmoid output unit trained for 50 epochs.
* **Inference Output:** Returns continuous phishing probability ($0.0$ to $1.0$), rendered as a risk percentage in the frontend.
* **Evaluation Status:** URL model training was completed for phishing probability prediction; verified evaluation metrics are not currently documented.

---

## 4. Key UI/UX Decisions

* **Theme:** Professional dark charcoal (`#080D10` / `#0D1519`) and teal accent (`#20C8C3` / `#52DDD6`) palette.
* **Motion Framework:** Staggered upward card entrances, ambient background glow, live scanline radar sweeps during inference, and smooth progress bar animation.
* **Accessibility:** Full `@media (prefers-reduced-motion: reduce)` support.
* **Multi-Sample Testing Libraries:**
  * Email Scanner: 10+ synthetic phishing emails and 10+ legitimate emails with non-repeating random selection.
  * URL Scanner: 15+ synthetic phishing URLs and 15+ legitimate URLs with automated scan demonstration flow.
* **Scan History:** Persistent browser `localStorage` tracking recent scans with clear controls.
* **Live Threat Dashboard:** Real-time summary statistics (Total Scans, Phishing Detected, Safe Items, Avg Risk) on the homepage.

---

## 5. Verified Implementation Checklist

- [x] Standard project directory structure (`datasets/`, `notebooks/`, `models/`, `backend/`, `frontend/`, `docs/`, `presentation/`)
- [x] Email dataset (`datasets/phishing_email.csv`) and URL dataset (`datasets/Training Dataset.arff`)
- [x] Trained email model pipeline exported to `models/email_phishing_model.joblib`
- [x] Trained URL neural network and scaler exported to `models/url_phishing_model.keras` & `models/url_scaler.joblib`
- [x] 30-feature URL extraction engine implemented in `backend/url_features.py`
- [x] Flask backend (`backend/app.py`) serving static assets and REST API endpoints (`/api/health`, `/api/scan-email`, `/api/scan-url`)
- [x] Responsive frontend with Dashboard (`index.html`), Email Scanner (`email.html`), URL Scanner (`url.html`), and Scan History (`history.html`)
- [x] Synthetic sample loaders for both email and URL testing
- [x] Explainable AI summaries and actionable safety recommendations
- [x] Academic 7-slide presentation generated in `presentation/PhishGuard_AI_Project_Presentation.pptx`
- [x] Comprehensive documentation suite synchronized with the active codebase
