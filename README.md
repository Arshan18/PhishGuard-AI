# PhishGuard AI — AI-Based Phishing Email and Malicious URL Detection Using Explainable Machine Learning

**PhishGuard AI** is an educational and research-oriented cybersecurity tool developed as a final-year IT college project. It provides an intuitive, interactive web interface to evaluate potentially malicious emails and fraudulent web links using machine learning classification pipelines and explainable risk summaries.

> [!NOTE]
> **Academic & Educational Scope:**  
> This application is intended for academic demonstrations, student research, and security awareness. It is not an enterprise-grade security gateway and should not be used as the sole defense mechanism against live cyber threats.

---

## 📚 Project Documentation Suite

- [Product Requirements Document (PRD)](docs/PRD.md) — Objectives, user profiles, and functional scope.
- [System Architecture](docs/ARCHITECTURE.md) — Full-stack system design, ML pipelines, and API schemas.
- [UI/UX Design Specification](docs/DESIGN.md) — Dark charcoal and teal design system, animations, and components.
- [Project Tasks & Tracker](docs/TASKS.md) — Implementation progress across all project phases.
- [Project Rules & Guidelines](docs/RULES.md) — Coding conventions, ML evaluation rules, and integrity standards.
- [Project Memory & Context](docs/MEMORY.md) — Architectural decisions, model lineage, and current state.

---

## 📁 Verified Project Directory Structure

```text
c:\AIDS-Project\
│
├── datasets/
│   ├── phishing_email.csv          # Email text corpus with binary labels (0: Legitimate, 1: Phishing)
│   └── Training Dataset.arff       # UCI Phishing Websites dataset with 30 pre-engineered features
│
├── notebooks/
│   ├── 01_email_phishing_model.ipynb   # Email classification training notebook scaffolding
│   └── 02_malicious_url_model.ipynb    # URL classification training notebook scaffolding
│
├── models/
│   ├── email_phishing_model.joblib # Trained TF-IDF + Logistic Regression Pipeline (~1.45 MB)
│   └── .gitkeep                    # Directory placeholder for future model artifacts
│
├── backend/
│   ├── app.py                      # Python Flask REST API and static file server
│   ├── requirements.txt            # Python dependencies (Flask, scikit-learn, joblib, numpy, requests)
│   ├── test_model.py               # Diagnostic script for raw model probability verification
│   └── test_api_endpoints.py       # End-to-end integration test script for Flask endpoints
│
├── frontend/
│   ├── index.html                  # Homepage with system overview, threat monitor, and module cards
│   ├── email.html                  # Email Phishing Scanner with multi-sample loaders and risk bar
│   ├── url.html                    # Malicious URL Scanner interface (static lexical review)
│   ├── style.css                   # Custom cybersecurity design system, animations, and tokens
│   └── script.js                   # Client validation, live scanning state, API communication
│
├── docs/                           # Comprehensive project documentation
│   ├── README.md                   # Documentation index & user guide
│   ├── PRD.md                      # Product Requirements Document
│   ├── ARCHITECTURE.md             # System Architecture & API specifications
│   ├── DESIGN.md                   # UI/UX and animation design guidelines
│   ├── TASKS.md                    # Project milestone tracker
│   ├── RULES.md                    # Project development and evaluation rules
│   └── MEMORY.md                   # Context log and implementation decisions
│
├── .gitignore                      # Git exclusion rules for environments, caches, and binaries
└── README.md                       # Root repository documentation
```

---

## ⚡ Current Implementation Status

| Component | Module | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Homepage (`index.html`) | **Completed** | Responsive dark charcoal/teal theme, staggered entrances, module cards. |
| **Frontend UI** | Email Scanner (`email.html`) | **Completed** | Form validation, 10+ random synthetic test samples, animated single risk bar. |
| **Frontend UI** | URL Scanner (`url.html`) | **Completed** | URL syntax validation, static target review banner, demo sample loaders. |
| **Backend** | Flask Server (`app.py`) | **Completed** | Routes for health check, email inference, and static asset delivery. |
| **Machine Learning** | Email Model (`email_phishing_model.joblib`) | **Completed & Live** | TF-IDF (30,000 features, n-grams 1-2) + Logistic Regression classifier. |
| **Machine Learning** | URL Model (`malicious_url_model.joblib`) | **In Progress** | Tabular dataset present (`Training Dataset.arff`); live feature extraction pipeline pending. |

---

## 🚀 Installation and Execution Guide

### 1. Prerequisites
- **Operating System:** Windows, macOS, or Linux.
- **Python:** Python 3.9, 3.10, or 3.11 recommended.
- **Web Browser:** Any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave).

### 2. Setting Up the Environment

1. Open your terminal / PowerShell and navigate to the project directory:
   ```bash
   cd c:\AIDS-Project
   ```

2. *(Optional but recommended)* Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Windows (Command Prompt):
   .\venv\Scripts\activate.bat
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

### 3. Running the Application

1. Start the Flask server:
   ```bash
   python backend/app.py
   ```
   *The server loads the trained model from `models/email_phishing_model.joblib` and listens on `http://127.0.0.1:5000`.*

2. Access the application in your browser:
   - Navigate to: **`http://127.0.0.1:5000`**
   - Alternatively, you can open `frontend/index.html` directly in a browser for client-side UI review.

---

## 🧪 Testing the Detection Modules

### A. Testing Email Phishing Detection
1. Open `http://127.0.0.1:5000/email.html` in your browser.
2. Click **Load Phishing Sample** to randomly populate a realistic synthetic phishing email (e.g., urgent banking freeze, fake package customs fee, or payroll update lure).
3. Click **Analyze Email**. The live scanning state will activate, and the backend will return the classification verdict with the calibrated **Phishing Risk** percentage and recommendations.
4. Click **Load Legitimate Sample** to populate a normal workplace email (e.g., sprint review agenda, dentist reminder, or order confirmation), then click **Analyze Email** to observe low phishing risk output.

### B. Testing URL Detection
1. Open `http://127.0.0.1:5000/url.html`.
2. Enter a suspicious URL or click **Load Malicious Sample**.
3. Target URLs are inspected strictly as static character sequences and are never resolved, executed, or visited by the application.
4. *(Note: Backend returns a pending integration notice until the URL feature extraction pipeline is deployed).*

---

## 🔌 API Endpoint Specifications

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Response:**
  ```json
  {
    "status": "online",
    "service": "PhishGuard AI Backend",
    "email_model_loaded": true,
    "version": "1.0.0"
  }
  ```

### 2. Email Phishing Scan
- **Endpoint:** `POST /api/scan-email` (or `POST /api/analyze-email`)
- **Request Headers:** `Content-Type: application/json`
- **Request Payload:**
  ```json
  {
    "subject": "URGENT: Your Account Has Been Suspended!",
    "content": "Dear Customer, unauthorized login attempts were detected. Please click http://security-verify-bank.xyz/login within 24 hours."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "prediction": "Phishing/Spam",
    "is_phishing": true,
    "label": 1,
    "model_confidence": 0.9968,
    "phishing_risk": 0.9968,
    "confidence": 99.68,
    "probabilities": {
      "legitimate": 0.0032,
      "phishing": 0.9968
    },
    "explanation": "The machine learning model classified this text as Phishing/Spam with a 99.68% confidence score. The email text exhibits linguistic patterns, urgency cues, or suspicious solicitation indicators commonly observed in phishing campaigns.",
    "recommendations": [
      "Do not click on any hyperlinks, buttons, or embedded redirects.",
      "Do not download or open any attachments included in this email.",
      "Verify the sender's authentic email address and domain headers.",
      "Never share credentials, PINs, or financial information via email."
    ],
    "text_length": 182
  }
  ```

### 3. Malicious URL Analysis
- **Endpoint:** `POST /api/analyze-url`
- **Request Payload:**
  ```json
  {
    "url": "http://paypal-account-security-update.suspicious-domain.xyz/login"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "pending",
    "message": "URL model integration is scheduled separately."
  }
  ```

---

## 🔍 Explainability & Interpretability

- **Explainable Summaries:** Conditioned on the verified model prediction and probability outputs. Phishing predictions highlight urgent linguistic triggers and domain spoofing patterns; legitimate predictions describe alignment with standard communication syntax.
- **Distinction from Post-Hoc Libraries:** Explanations in the active Flask application are generated dynamically from model confidence thresholds and classification rules. External perturbation libraries (e.g., LIME, SHAP) are conceptual research topics outlined in the training notebooks and are not currently active in the real-time API loop.

---

## ⚠️ Known Limitations & Evaluation Risks

1. **Dataset Bias:** The email model is trained on standard benchmark corpora (`phishing_email.csv`). Highly novel zero-day phrasing, multi-lingual emails, or non-English text may produce false positives or false negatives.
2. **Short Text Sensitivity:** Very short inputs (<15 characters) lack sufficient token distribution for reliable TF-IDF vectorization. The frontend enforces a minimum 15-character threshold.
3. **URL Scanner Pipeline:** While the UCI URL dataset is present, raw string lexical extraction requires pre-computing structural attributes before full live inference can be enabled.

---

## 🛠️ Troubleshooting

- **Backend Disconnected Alert in UI:** Ensure `python backend/app.py` is actively running in a terminal on port `5000`.
- **Model File Not Found (HTTP 503):** Verify that `email_phishing_model.joblib` exists in `models/`.
- **Inconsistent Version Warnings:** scikit-learn unpickling warnings are benign when using compatible versions (scikit-learn $\ge$ 1.6).

---

## 📄 License & Academic Attribution
Developed as an academic software project. Educational and research use permitted.
