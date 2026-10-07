# PhishGuard AI – AI-Based Phishing Email & Malicious URL Detection

PhishGuard AI is an academic machine learning project developed for **Artificial Intelligence and Machine Learning - II** in the **Department of Information Technology** at **M. H. Saboo Siddik College of Engineering**. The system provides an interactive web application to evaluate potentially deceptive emails and malicious URLs using trained classification pipelines and explainable risk summaries.

> [!NOTE]
> **Academic Prototype Notice:**  
> This project is designed as an educational, final-year IT engineering demonstration and security awareness prototype. It is not intended to replace enterprise email gateways or real-time threat intelligence appliances.

---

## Team & Academic Attribution

* **Students / Authors:**
  * **Asim Khan** — Roll No. 231407
  * **Arshan Attar** — Roll No. 231408
* **Head of Department (HOD):** **Dr. Zainab Mirza**
* **Department:** DEPARTMENT OF INFORMATION TECHNOLOGY
* **College:** M. H. Saboo Siddik College of Engineering, Byculla, Mumbai
* **Subject:** Artificial Intelligence and Machine Learning - II

---

## 📚 Project Documentation Suite

- [Product Requirements Document (PRD)](docs/PRD.md) — Objectives, scope, functional requirements, and boundaries.
- [System Architecture](docs/ARCHITECTURE.md) — Full-stack system design, ML pipelines, and API schemas.
- [UI/UX Design Specification](docs/DESIGN.md) — Dark cybersecurity theme, layout, components, and motion tokens.
- [Project Tasks & Tracker](docs/TASKS.md) — Implementation milestones and completed deliverables.
- [Project Rules & Guidelines](docs/RULES.md) — Coding conventions, ML evaluation rules, and integrity standards.
- [Project Memory & Context](docs/MEMORY.md) — Architectural decisions, model lineage, and implementation context.
- [Documentation Index](docs/README.md) — Quick reference index for all documentation files.

---

## Overview

PhishGuard AI addresses two of the most prevalent initial attack vectors in cybersecurity:
1. **Phishing & Spam Emails:** Messages crafted with social engineering techniques, urgent payment lures, or fake account verification requests.
2. **Malicious & Phishing URLs:** Fraudulent web addresses leveraging typosquatting, suspicious top-level domains, excessive subdomains, or deceptive redirection syntax.

The platform provides:
- Machine learning-based email text classification.
- Deep learning-based URL threat assessment across 30 structural/lexical features.
- Dynamic Phishing Risk probability percentages ($0.00\%$ to $100.00\%$).
- Contextual "Why This Was Detected" explainability summaries and safety recommendations.
- Local scan history tracking and real-time dashboard scan statistics.

---

## Features

- **Email Scanner:**
  - Full-text email analysis (subject line + body content).
  - Live character and word count tracking.
  - Multi-sample loaders with 10+ synthetic phishing and 10+ legitimate test emails.
  - Single calibrated Phishing Risk progress bar.
- **URL Scanner:**
  - Syntactic validation and static string extraction.
  - Multi-sample loaders with 15+ synthetic phishing and 15+ legitimate test URLs.
  - 30-feature lexical, structural, and domain evaluation.
  - Smooth automated demonstration scan flow.
- **Explainable Assessment:**
  - Dynamic explanations describing linguistic urgency triggers or URL structural anomalies.
  - Actionable security checklists tailored to the risk level.
- **Scan History:**
  - Client-side history storage of recent email and URL scans (Type, Target/Input, Verdict, Risk Score, Timestamp).
  - Clear history option and direct review capabilities.
- **Live Threat Dashboard:**
  - Real-time session metrics tracking total scans, phishing detections, safe items, and average risk score.

---

## System Architecture

```text
                                 User Input
                       (Email Text / Target URL)
                                     │
                                     ▼
                        Email / URL Web Scanner
                                     │
                                     ▼
                      Feature Extraction & Scaling
                  ┌──────────────────┴──────────────────┐
                  ▼                                     ▼
         Email Preprocessing                    30-Feature Extractor
          (Text Cleaning)                        & StandardScaler
                  │                                     │
                  ▼                                     ▼
         TF-IDF Vectorization                 Dense Neural Network
                  │                                     │
                  ▼                                     ▼
         Logistic Regression                 Sigmoid Phishing Output
                  └──────────────────┬──────────────────┘
                                     ▼
                              Risk Prediction
                                     │
                                     ▼
                     Detection Result & Explainability
```

### 1. Email Detection Pipeline
```text
Email Text (Subject + Body)
        ↓
Text Cleaning & Normalization
        ↓
TF-IDF Vectorization (30,000 features, n-grams 1–2, sublinear TF)
        ↓
Logistic Regression Classifier
        ↓
Phishing / Legitimate Verdict & Probability
```

### 2. URL Detection Pipeline
```text
Target URL String
        ↓
URL Feature Extraction (30 structural and lexical attributes)
        ↓
StandardScaler Feature Scaling
        ↓
Dense Neural Network (ReLU hidden layers, Sigmoid output)
        ↓
Phishing Probability & Risk Percentage
```

---

## Machine Learning Models

### Email Detection Model
- **Dataset:** Combined email corpus compiled from established benchmarks (CEAS_08, Enron, Nazario, SpamAssassin, phishing_email, Nigerian Fraud, Ling).
- **Dataset Size:** 82,486 email records (`text_combined`, `label`).
- **Feature Representation:** `TfidfVectorizer` with 30,000 max features, sublinear term-frequency scaling, and unigram/bigram `(1, 2)` coverage.
- **Algorithm:** Classical `LogisticRegression` with balanced class weights (trained via convex optimization, not neural epochs).
- **Label Mapping:** `0 = Legitimate`, `1 = Phishing/Spam`.
- **Model File:** `models/email_phishing_model.joblib` (~1.45 MB).
- **Verified Evaluation Results:**
  - **Accuracy:** **98.48%**
  - **Confusion Matrix:**
    ```text
                    Predicted Legit    Predicted Phish
    Actual Legit         7,795               124
    Actual Phish           126             8,453
    ```

### URL Detection Model
- **Dataset:** UCI Phishing Websites Dataset (`datasets/Training Dataset.arff`).
- **Dataset Size:** 11,055 website records.
- **Input Features:** 30 engineered attributes covering URL structure, domain characteristics, and syntax markers.
- **Preprocessing:** Categorical value mapping and normalization via `StandardScaler` (`models/url_scaler.joblib`).
- **Architecture:** Feed-forward Dense Neural Network with ReLU activation in hidden layers and a single Sigmoid output unit (`models/url_phishing_model.keras`).
- **Training Configuration:** 50 epochs with binary cross-entropy loss and Adam optimizer.
- **Evaluation Status:** URL model training was completed for phishing probability prediction; verified evaluation metrics are not currently documented.

---

## Datasets

| Dataset | File Location | Records | Target / Classes | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Combined Email Dataset** | `datasets/phishing_email.csv` | 82,486 | Binary (`0`: Legit, `1`: Phishing) | Email body & subject classification |
| **UCI Phishing Websites** | `datasets/Training Dataset.arff` | 11,055 | 30 Features (`-1`: Phishing, `1`: Legit) | URL structure & domain pattern analysis |

---

## Project Structure

```text
PhishGuard-AI/
├── backend/
│   ├── app.py                      # Flask application and REST API endpoints
│   ├── requirements.txt            # Python dependencies (Flask, scikit-learn, tensorflow, etc.)
│   └── url_features.py             # 30-feature lexical/structural URL extraction engine
│
├── frontend/
│   ├── index.html                  # Dashboard with live metrics, quick overview, and navigation
│   ├── email.html                  # Email scanner with sample loaders and explainable breakdown
│   ├── url.html                    # URL scanner with sample loaders and risk progress bar
│   ├── history.html                # Scan history logger with persistent browser storage
│   ├── style.css                   # Custom cybersecurity design system (charcoal & teal)
│   └── script.js                   # Client-side controllers, API fetch requests, and state
│
├── models/
│   ├── email_phishing_model.joblib # Trained TF-IDF + Logistic Regression email pipeline
│   ├── url_phishing_model.keras    # Trained Dense Neural Network URL classifier
│   ├── url_scaler.joblib           # Fitted StandardScaler for 30 URL features
│   └── .gitkeep
│
├── datasets/
│   ├── phishing_email.csv          # Email classification benchmark corpus
│   └── Training Dataset.arff       # UCI Phishing Websites dataset
│
├── notebooks/
│   ├── 01_email_phishing_model.ipynb # Email classification training notebook
│   └── 02_malicious_url_model.ipynb  # URL classification training notebook
│
├── presentation/
│   ├── generate_presentation.py    # Automated PPTX presentation generator script
│   └── PhishGuard_AI_Project_Presentation.pptx # Academic 7-slide project presentation
│
├── docs/
│   ├── ARCHITECTURE.md             # System architecture and data flow diagrams
│   ├── DESIGN.md                   # UI/UX design specification and motion tokens
│   ├── MEMORY.md                   # Project context and implementation memory
│   ├── PRD.md                      # Product Requirements Document
│   ├── README.md                   # Documentation index
│   ├── RULES.md                    # Engineering, ML, and integrity rules
│   └── TASKS.md                    # Project development task tracker
│
├── .gitignore                      # Git exclusion rules
├── LICENSE                         # MIT License
└── README.md                       # Root repository documentation
```

---

## Installation & Setup

### 1. Prerequisites
- **Python:** Python 3.9, 3.10, or 3.11.
- **Web Browser:** Any modern browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave).

### 2. Environment Setup

1. Open your terminal or PowerShell and navigate to the project directory:
   ```bash
   cd c:\AIDS-Project
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Windows (Command Prompt):
   .\venv\Scripts\activate.bat

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r backend/requirements.txt
   ```

---

## Running the Application

1. Start the Flask application:
   ```bash
   python backend/app.py
   ```
   *The server loads the models on startup and serves both the static frontend and REST APIs on `http://127.0.0.1:5000`.*

2. Access the web application:
   - **Dashboard / Home:** `http://127.0.0.1:5000`
   - **Email Scanner:** `http://127.0.0.1:5000/email.html`
   - **URL Scanner:** `http://127.0.0.1:5000/url.html`
   - **Scan History:** `http://127.0.0.1:5000/history.html`

---

## API Usage & Endpoints

### 1. Health Check
* **Endpoint:** `GET /api/health`
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

### 2. Scan Email
* **Endpoint:** `POST /api/scan-email` (alias `POST /api/analyze-email`)
* **Request Payload:**
  ```json
  {
    "subject": "Urgent: Account Verification Required",
    "content": "Dear customer, your account access has been suspended due to suspicious activity. Click here to verify."
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

### 3. Scan URL
* **Endpoint:** `POST /api/scan-url` (alias `POST /api/analyze-url`)
* **Request Payload:**
  ```json
  {
    "url": "https://secure-login-verify.example-bank-security.com/account/login"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "status": "success",
    "url": "https://secure-login-verify.example-bank-security.com/account/login",
    "prediction": "Phishing",
    "is_phishing": true,
    "phishing_probability": 0.8924,
    "phishing_percentage": 89.24,
    "risk_percentage": 89.24,
    "confidence": 89.24,
    "model_confidence_pct": 89.24,
    "explanation": "The deep learning neural network model classified this URL as Phishing with a 89.24% phishing risk score...",
    "recommendations": [
      "Do not open, visit, or submit credentials on this destination.",
      "Verify the official root domain directly via authoritative search engines."
    ],
    "feature_count": 30
  }
  ```

---

## Results & Verification

| Detection Engine | Algorithm | Dataset & Samples | Key Result / Evaluation Status |
| :--- | :--- | :--- | :--- |
| **Email Phishing** | Logistic Regression (TF-IDF) | Combined Benchmark (82,486 emails) | **98.48% Accuracy**<br>Confusion Matrix: `[[7795, 124], [126, 8453]]` |
| **URL Phishing** | Dense Neural Network (50 Epochs) | UCI Phishing Websites (11,055 records, 30 features) | URL model trained for phishing probability prediction; verified evaluation metrics are not currently documented. |

---

## Limitations

1. **Static Analysis Scope:** URLs are analyzed via static structural, lexical, and domain attributes. The system does not actively spider webpages, render DOM elements, or execute dynamic JavaScript payloads.
2. **Webpage-Level Feature Approximations:** The UCI Phishing dataset contains engineered features relating to webpage DOM attributes (such as iframe visibility, right-click disabling, or anchor link ratios). In a raw URL input context without active network crawling, these attributes rely on standard lexical approximations or neutral defaults.
3. **Dataset Scope & Zero-Day Phrasing:** The models rely on historical benchmark patterns. Highly targeted spear-phishing or novel multilingual evasion tactics may fall outside the learned feature distributions.
4. **Academic Prototype Context:** The software is designed for academic demonstration and laboratory testing, rather than continuous high-throughput enterprise network gateway filtering.

---

## Future Scope

- **Advanced Transformer Architectures:** Integration of lightweight transformer models (such as DistilBERT) for nuanced contextual email understanding.
- **Live Headless DOM Inspection:** Sandboxed browser-based crawling to inspect runtime webpage elements (favicon, iframe behavior, external form actions).
- **Client Extensions:** Development of browser extensions or email client add-ins for inline threat warnings.
- **Threat Intelligence Feeds:** Integration with live reputation feeds and dynamic blocklists.

---

## Security Considerations

- **Safe Handling:** Target URLs and email snippets are treated strictly as inert character strings and are never visited, resolved, or executed.
- **Demonstration Data:** Always use synthetic, safe demonstration URLs (such as `example.com` domain structures) during testing. Never open unverified links found in real spam messages.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details. Third-party datasets and reference materials remain the property of their respective creators.
