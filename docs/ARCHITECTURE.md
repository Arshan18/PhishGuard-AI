# Architecture Documentation

## 1. System Overview

PhishGuard AI follows a lightweight client-server architecture tailored for academic demonstration. The presentation layer connects to a Python Flask microframework backend via asynchronous REST API calls, which orchestrates text processing and machine learning inference pipelines.

```text
                ┌─────────────────────────────────────┐
                │          Frontend Client            │
                │   HTML5 / Custom CSS / Vanilla JS   │
                │        Bootstrap 5 UI Bundle        │
                └──────────────────┬──────────────────┘
                                   │
                                   │ HTTP REST (JSON)
                                   ▼
                ┌─────────────────────────────────────┐
                │             Flask Backend           │
                │            (backend/app.py)         │
                └──────────┬───────────────────┬──────┘
                           │                   │
                           ▼                   ▼
                ┌─────────────────────┐ ┌─────────────────────┐
                │ Email ML Pipeline   │ │  URL ML Pipeline    │
                │ TF-IDF Vectorizer + │ │ Preprocessed Feature│
                │ Logistic Regression │ │   Random Forest     │
                └─────────────────────┘ └─────────────────────┘
```

---

## 2. Architectural Components

### 2.1. Frontend Layer (`frontend/`)

* **Technologies:** HTML5, CSS3 (Custom design system in `style.css`), Vanilla JavaScript (`script.js`), Bootstrap 5 CSS/JS CDN, Bootstrap Icons.
* **Pages:**
  * `index.html`: Landing page with system overview, architecture highlights, and module navigation.
  * `email.html`: Interactive email text analyzer with character counting, validation, sample loaders, and explainable result cards.
  * `url.html`: Malicious URL analyzer with syntax validation, static reference display, and recommendation cards.
* **Responsibilities:** Client-side form validation, handling loading and error states, formatting explainability outputs, and triggering API requests via asynchronous `fetch()`.

### 2.2. Backend Layer (`backend/`)

* **Technologies:** Python 3, Flask, Flask-CORS.
* **Entry Point:** `backend/app.py`
* **Responsibilities:**
  * Serving static frontend files.
  * Exposing RESTful JSON API endpoints for email and URL inspection.
  * Handling payload validation and returning structured error responses.
  * Orchestrating model loading and feature transformation for inference.

---

## 3. Machine Learning Pipelines

### 3.1. Email Phishing Pipeline

1. **Input:** Raw email body string + optional subject.
2. **Text Cleaning:** Tokenization, punctuation removal, lowercasing.
3. **Feature Representation:** TF-IDF (Term Frequency - Inverse Document Frequency) matrix transformation.
4. **Classifier:** Scikit-learn `LogisticRegression`.
5. **Output:** Binary classification (`Phishing` [1] vs. `Legitimate` [0]) + confidence percentage.

### 3.2. Malicious URL Pipeline

1. **Input:** Extracted structural/lexical website feature vector (e.g., prefix-suffix, IP presence, SSL state).
2. **Preprocessing:** Encoding and standardization matching the training schema.
3. **Classifier:** Scikit-learn `RandomForestClassifier`.
4. **Output:** Binary classification (`Malicious/Phishing` [-1/1] vs. `Legitimate` [1/-1]) + confidence percentage.

---

## 4. Model Artifacts (`models/`)

The `models/` directory is designated for serializing trained scikit-learn model pipelines:

* `models/email_phishing_model.joblib` *(Planned Artifact)*: Serialized TF-IDF vectorizer and Logistic Regression classifier bundle.
* `models/malicious_url_model.joblib` *(Planned Artifact)*: Serialized Random Forest classifier for URL feature sets.

> **Current Status:**  
> The `models/` directory currently contains a `.gitkeep` placeholder. Model binaries will be exported here upon running training scripts in `notebooks/`.

---

## 5. API Specification

The Flask application (`backend/app.py`) defines the following endpoints:

| Method | Endpoint | Description | Status |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves the frontend landing page (`index.html`). | **Implemented** |
| `GET` | `/api/health` | Service health check returning backend status and version. | **Implemented** |
| `POST` | `/api/analyze-email` | Receives `{ "subject": "...", "content": "..." }` for email threat analysis. | **Implemented (Endpoint Active / Model Loading Hook Planned)** |
| `POST` | `/api/analyze-url` | Receives `{ "url": "..." }` for URL risk inspection. | **Implemented (Endpoint Active / Model Loading Hook Planned)** |
