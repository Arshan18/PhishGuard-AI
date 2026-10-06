# Architecture Documentation — PhishGuard AI

## 1. System Overview

PhishGuard AI follows a client-server architecture designed for high performance, explainability, and academic demonstration. The presentation layer connects to a Python Flask REST API server, which manages machine learning inference and formats structured risk indicators.

```text
                ┌──────────────────────────────────────────────┐
                │               Frontend Client                │
                │        HTML5 / Custom CSS / Vanilla JS       │
                │      Bootstrap 5 UI + Motion Framework       │
                └──────────────────────┬───────────────────────┘
                                       │
                                       │ HTTP REST (JSON)
                                       ▼
                ┌──────────────────────────────────────────────┐
                │                Flask Backend                 │
                │               (backend/app.py)               │
                └──────────────┬───────────────────────────────┘
                               │
                               ▼
                ┌──────────────────────────────────────────────┐
                │          Trained Email ML Pipeline           │
                │  TfidfVectorizer (30,000 features, ngrams)   │
                │         + LogisticRegression Classifier      │
                │       (models/email_phishing_model.joblib)   │
                └──────────────────────────────────────────────┘
```

---

## 2. Architectural Components

### 2.1. Frontend Layer (`frontend/`)

* **Technologies:** HTML5, Vanilla CSS3 (Design tokens in `style.css`), Vanilla JavaScript (`script.js`), Bootstrap 5 CSS CDN, Bootstrap Icons.
* **Pages:**
  * `index.html`: Landing page with hero banner, Live Threat Monitor preview, dual detection module cards, and 3-step workflow.
  * `email.html`: Interactive email text analyzer with character counter, 10+ random test samples, real-time scanning sweep animation, and single Phishing Risk progress bar.
  * `url.html`: Malicious URL analyzer with syntax validation, static target display, and safety recommendation structure.
* **Responsibilities:**
  * Client-side input validation and character counting.
  * Triggering real-time visual scanning states and animations.
  * Asynchronous REST API requests via native `fetch()`.
  * Sanitized presentation of classification verdicts and explainability recommendations.

### 2.2. Backend Layer (`backend/`)

* **Technologies:** Python 3, Flask, `flask_cors`, `joblib`, `numpy`, `scikit-learn`.
* **Entry Point:** `backend/app.py`
* **Responsibilities:**
  * Serving static frontend pages and assets.
  * Exposing RESTful JSON API endpoints (`/api/health`, `/api/scan-email`, `/api/analyze-url`).
  * Validating request payloads and handling edge cases gracefully.
  * Loading serialized `.joblib` model pipelines on server startup.
  * Calculating calibrated phishing probability scores from `predict_proba()`.

---

## 3. Machine Learning Pipelines

### 3.1. Email Phishing Pipeline (Active & Live)

1. **Input:** Raw email text string (subject line concatenated with body text).
2. **Text Cleaning & Tokenization:** Scikit-learn internal preprocessing, lowercasing, and whitespace tokenization.
3. **Feature Representation:** `TfidfVectorizer` (Vocabulary: 30,000 features, n-gram range `(1, 2)`, sublinear TF enabled).
4. **Classifier:** `LogisticRegression` (with balanced class weights and maximum 1,000 iterations).
5. **Class Mapping:** Verified from `email_model.classes_`:
   * `0` $\rightarrow$ **Legitimate Email**
   * `1` $\rightarrow$ **Phishing / Spam Email**
6. **Probability Extraction:**
   * $P(\text{Phishing}) = \text{proba}[\text{index of class 1}]$
   * $P(\text{Legitimate}) = \text{proba}[\text{index of class 0}]$
   * Model Confidence = probability of the predicted class ($P(\text{predicted})$).
   * Phishing Risk = probability specifically assigned to class $1$.

### 3.2. Malicious URL Pipeline (In Progress)

1. **Input:** Target web URL / IP string.
2. **Feature Extraction (Required):** Computing 30 structural/lexical domain attributes (e.g., URL length, subdomain depth, prefix-suffix hyphenation, SSL lineage) matching the schema of `datasets/Training Dataset.arff`.
3. **Classifier (Planned):** Scikit-learn `RandomForestClassifier`.
4. **Current Status:** The UCI URL dataset is present in `datasets/`, and the frontend interface is built. Live inference in Flask is scheduled for subsequent release upon deployment of the feature extractor.

---

## 4. Model Artifacts (`models/`)

* `models/email_phishing_model.joblib` *(Active Model)*: Serialized scikit-learn Pipeline combining TF-IDF vectorizer and Logistic Regression classifier (~1.45 MB).
* `models/malicious_url_model.joblib` *(Planned Artifact)*: Serialized Random Forest model for URL tabular features.

---

## 5. API Endpoint Specifications

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves the frontend landing page (`index.html`). | **Active** |
| `GET` | `/api/health` | Health check returning service status and model readiness. | **Active** |
| `POST` | `/api/scan-email` | Evaluates email text for phishing indicators using the ML pipeline. | **Active & Live** |
| `POST` | `/api/analyze-email` | Alias for `/api/scan-email`. | **Active & Live** |
| `POST` | `/api/analyze-url` | Endpoint for URL analysis. | **Pending ML Integration** |

---

## 6. End-to-End Prediction Sequence

```text
User Form Submission (email.html)
      │
      ▼
script.js (validates length >= 15 chars, activates loading indicator)
      │
      ▼  POST /api/scan-email { subject, content, email_text }
Flask Backend (backend/app.py)
      │
      ├─► Combines full_text = f"{subject} {email_text}".strip()
      ├─► Calls email_model.predict([full_text]) -> label (0 or 1)
      ├─► Calls email_model.predict_proba([full_text]) -> [P(0), P(1)]
      └─► Constructs JSON payload with probabilities, explanation & recommendations
      │
      ▼  JSON Response (200 OK)
script.js (renders .result-card, animates progress bar to exact percentage)
```
