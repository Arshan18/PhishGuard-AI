# Project Memory & Context

## 1. Project Identity

* **Project Title:** AI-Based Phishing Email & Malicious URL Detection Using Explainable Machine Learning
* **Application Name:** PhishGuard AI
* **Scope & Level:** Undergraduate Subject-Level IT Engineering Academic Project
* **Core Purpose:** To provide a clean, educational, and functional security tool that detects phishing emails and malicious links using transparent machine learning workflows.

---

## 2. Technology Stack

* **Language:** Python 3 (Backend & ML)
* **ML & Data Libraries:** `scikit-learn`, `pandas`, `numpy`, `joblib`
* **Development Environments:** Jupyter Notebook / Google Colab (for model training)
* **Backend Framework:** Flask, `flask-cors`
* **Frontend Technologies:** HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+), Bootstrap 5 (CDN), Bootstrap Icons

---

## 3. Machine Learning Models

* **Email Detection:** TF-IDF Vectorizer + Logistic Regression Classifier (`LogisticRegression`)
* **URL Detection:** Structural/Lexical Feature Vector + Random Forest Classifier (`RandomForestClassifier`)

---

## 4. Datasets

* **Email Dataset:** `datasets/phishing_email.csv` (Raw email text entries with binary phishing/legitimate labels).
* **URL Dataset:** `datasets/Training Dataset.arff` (UCI Phishing Websites dataset containing 30 pre-engineered structural and lexical domain attributes).
  * *Context Note:* The URL dataset consists of tabular engineered features; raw URL string processing requires explicit feature extraction to map inputs into this feature space.

---

## 5. Important Constraints & Guidelines

* **Subject-Level Scope:** Do not introduce enterprise bloat (e.g., user authentication, databases, Docker containers, cloud services).
* **No Fabricated Data:** Never generate or display hardcoded prediction results or fabricated accuracy scores.
* **Consistency:** Maintain exact parity between training preprocessing (TF-IDF vocabulary, feature indices) and backend inference routines.
* **Safe Analysis:** User-entered URLs must remain static inspection targets and must never be automatically visited or resolved by the client.

---

## 6. Current Implementation Status

* **Project Structure & Environment:** `Completed`
* **Frontend UI & Controllers:** `Completed` (Full responsive pages for Home, Email Scanner, and URL Scanner).
* **Backend Routing & Server:** `Completed` (`GET /`, `GET /api/health`, `POST /api/scan-email`, `POST /api/analyze-email`, `POST /api/analyze-url`).
* **Documentation Suite:** `Completed` (Located in `docs/`).
* **Email ML Model:** `Completed` (`models/email_phishing_model.joblib` loaded and verified).
* **Live Email Inference Integration in Flask:** `Completed` (`/api/scan-email` active with live probability calculation).
* **URL ML Model Training:** `Not Started / In Progress` (Pending separate URL model integration).
* **URL Model Inference Integration:** `Pending` (Scheduled separately).
