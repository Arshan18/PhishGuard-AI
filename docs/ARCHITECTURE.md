# System Architecture — PhishGuard AI

## 1. System Overview

PhishGuard AI employs a modular client-server architecture designed for high responsiveness, explainability, and academic demonstration. The frontend web client communicates with a lightweight Python Flask REST API server that executes inference across dual machine learning models.

```text
               ┌─────────────────────────────────────────────────────────┐
               │                     Frontend Client                     │
               │             HTML5 / Custom CSS / Vanilla JS             │
               │   (index.html, email.html, url.html, history.html)      │
               └────────────────────────────┬────────────────────────────┘
                                            │
                                            │ HTTP REST (JSON)
                                            ▼
               ┌─────────────────────────────────────────────────────────┐
               │                      Flask Backend                      │
               │                    (backend/app.py)                     │
               └─────────────┬─────────────────────────────┬─────────────┘
                             │                             │
                             ▼                             ▼
              ┌─────────────────────────────┐┌───────────────────────────┐
              │  Email ML Pipeline (Active) ││ URL Neural Network (Active)│
              │   TF-IDF + Logistic Reg.    ││  30-Features + Dense NN   │
              │ (email_phishing_model.joblib││ (url_phishing_model.keras)│
              └─────────────────────────────┘└───────────────────────────┘
```

---

## 2. Architectural Components

### 2.1. Frontend Layer (`frontend/`)

* **Technologies:** HTML5, Vanilla CSS3 (Design tokens in `style.css`), Vanilla JavaScript (`script.js`), Bootstrap 5 CSS CDN, Bootstrap Icons.
* **Pages & Components:**
  * `index.html`: Dashboard featuring system overview, quick scan launcher, architecture walkthrough, and live session stats (Total Scans, Phishing Detected, Safe Items, Avg Risk).
  * `email.html`: Interactive email text scanner with character/word counter, 10+ synthetic phishing & 10+ legitimate test sample loaders, live radar scanning animation, explainable verdict card, and Phishing Risk progress bar.
  * `url.html`: Malicious URL scanner with 15+ synthetic phishing and 15+ legitimate test URL loaders, automated scan demonstration flow, 30-feature indicator breakdown, and recommendations.
  * `history.html`: Client-side Scan History logging recent scans with target input, detection label, risk percentage, and timestamp.
* **Responsibilities:**
  * Client-side validation (minimum character lengths, valid URL format checks).
  * Managing UI scanning states (radar sweeps, button spinners, disabling inputs during requests).
  * Asynchronous communication with the Flask backend via `fetch()`.
  * Persisting and retrieving scan history in `localStorage`.
  * Rendering explainable detection indicators and safety recommendations.

### 2.2. Backend Layer (`backend/`)

* **Technologies:** Python 3, Flask, `flask_cors`, `joblib`, `numpy`, `pandas`, `scikit-learn`, `tensorflow`/`keras`.
* **Entry Point:** `backend/app.py`
* **Feature Extractor:** `backend/url_features.py`
* **Responsibilities:**
  * Serving static frontend files and web pages.
  * Exposing RESTful JSON endpoints (`/api/health`, `/api/scan-email`, `/api/scan-url`).
  * Loading serialized model artifacts on server startup (`models/email_phishing_model.joblib`, `models/url_phishing_model.keras`, `models/url_scaler.joblib`).
  * Running text preprocessing and TF-IDF inference for email classification.
  * Parsing target URLs into 30 structural/lexical features and applying StandardScaler normalization before Keras model prediction.
  * Returning structured JSON responses with risk scores, probabilities, explainability summaries, and safety advice.

---

## 3. Machine Learning Pipelines

### 3.1. Email Phishing Detection Pipeline

```text
Raw Email Input (Subject + Body)
               │
               ▼
Text Preprocessing & Lowercasing
               │
               ▼
TF-IDF Vectorization (30,000 features, sublinear TF, n-grams 1–2)
               │
               ▼
Logistic Regression Classifier (Balanced class weights)
               │
               ▼
Probability Extraction:
  • P(Legitimate) = proba[0]
  • P(Phishing)   = proba[1]
               │
               ▼
JSON Response: Verdict, Phishing Risk Score, Dynamic Explanation & Checklist
```

* **Dataset:** Combined email corpus (82,486 emails).
* **Class Mapping:** `0 = Legitimate`, `1 = Phishing/Spam`.
* **Model Artifact:** `models/email_phishing_model.joblib`.
* **Verified Accuracy:** 98.48% (Confusion Matrix: `[[7795, 124], [126, 8453]]`).

### 3.2. Malicious URL Detection Pipeline

```text
Target URL Input String
               │
               ▼
URL Validation & Parsing (backend/url_features.py)
               │
               ▼
30-Feature Extraction (Lexical, Structural & Domain Attributes)
               │
               ▼
StandardScaler Feature Normalization (models/url_scaler.joblib)
               │
               ▼
Dense Neural Network (models/url_phishing_model.keras)
  • Input: 30 scaled features
  • Hidden Layers: Dense with ReLU activations
  • Output: Dense(1, activation='sigmoid')
               │
               ▼
Phishing Probability (0.0 to 1.0) & Risk Percentage (0.0% to 100.0%)
               │
               ▼
JSON Response: Verdict, Risk Score, Explainability & Recommendations
```

* **Dataset:** UCI Phishing Websites Dataset (11,055 records, 30 features).
* **Training:** 50 epochs with binary cross-entropy loss.
* **Model Artifacts:** `models/url_phishing_model.keras`, `models/url_scaler.joblib`.

---

## 4. API Endpoint Specifications

### 4.1. Health Check
* **Method:** `GET /api/health`
* **Description:** Verifies service availability and model readiness.
* **Response (200 OK):**
  ```json
  {
    "status": "online",
    "service": "PhishGuard AI Backend",
    "email_model_loaded": true,
    "url_model_loaded": true,
    "version": "1.0.0"
  }
  ```

### 4.2. Scan Email
* **Method:** `POST /api/scan-email` (alias `POST /api/analyze-email`)
* **Request Format:**
  ```json
  {
    "subject": "Optional Email Subject",
    "content": "Mandatory email body text content..."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "prediction": "Phishing/Spam",
    "is_phishing": true,
    "label": 1,
    "model_confidence": 0.9854,
    "phishing_risk": 0.9854,
    "confidence": 98.54,
    "probabilities": {
      "legitimate": 0.0146,
      "phishing": 0.9854
    },
    "explanation": "The machine learning model classified this text as Phishing/Spam with a 98.54% confidence score...",
    "recommendations": [
      "Do not click on any hyperlinks, buttons, or embedded redirects.",
      "Verify the sender's authentic email address and domain headers."
    ],
    "text_length": 142
  }
  ```

### 4.3. Scan URL
* **Method:** `POST /api/scan-url` (alias `POST /api/analyze-url`)
* **Request Format:**
  ```json
  {
    "url": "https://secure-login-portal.example-bank.com/auth"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "status": "success",
    "url": "https://secure-login-portal.example-bank.com/auth",
    "prediction": "Phishing",
    "is_phishing": true,
    "phishing_probability": 0.8924,
    "phishing_percentage": 89.24,
    "risk_percentage": 89.24,
    "model_confidence": 0.8924,
    "confidence": 89.24,
    "model_confidence_pct": 89.24,
    "explanation": "The deep learning neural network model classified this URL as Phishing...",
    "recommendations": [
      "Do not open, visit, or submit credentials on this destination.",
      "Verify the official root domain directly via authoritative search engines."
    ],
    "feature_count": 30
  }
  ```

---

## 5. Security & Safe Processing Model

* **Inert Static String Analysis:** Target URLs and email texts are strictly parsed as string data. The system never executes HTTP requests to target destinations or renders external JavaScript.
* **Client-Side Data Sanitization:** Output strings rendered in the DOM are properly escaped to prevent Cross-Site Scripting (XSS).
* **Local Storage Isolation:** Scan history is stored locally in the user's browser `localStorage` without transmitting user history to external databases.
