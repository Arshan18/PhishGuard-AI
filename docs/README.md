# PhishGuard AI — Documentation Index

Welcome to the technical documentation suite for **PhishGuard AI** (AI-Based Phishing Email & Malicious URL Detection), developed for **Artificial Intelligence and Machine Learning - II** at **M. H. Saboo Siddik College of Engineering**.

---

## 👥 Academic Attribution

* **Team Members:**
  * **Asim Khan** — Roll No. 231407
  * **Arshan Attar** — Roll No. 231408
* **Head of Department (HOD):** **Dr. Zainab Mirza**
* **Department:** DEPARTMENT OF INFORMATION TECHNOLOGY
* **Subject:** Artificial Intelligence and Machine Learning - II

---

## 📑 Documentation Structure

| Document | File Path | Focus & Purpose |
| :--- | :--- | :--- |
| **Product Requirements Document (PRD)** | [PRD.md](PRD.md) | Problem definition, user goals, functional/non-functional requirements, and project boundaries. |
| **System Architecture** | [ARCHITECTURE.md](ARCHITECTURE.md) | Full-stack component topology, data flows, machine learning pipelines, and API schemas. |
| **UI/UX Design Specification** | [DESIGN.md](DESIGN.md) | Design tokens, color system, typography, motion keyframes, and page component specs. |
| **Project Memory & Context** | [MEMORY.md](MEMORY.md) | Implementation history, architectural decisions, model configurations, and current operational state. |
| **Development Rules & Standards** | [RULES.md](RULES.md) | Engineering conventions, machine learning evaluation rules, and integrity principles. |
| **Project Task Tracker** | [TASKS.md](TASKS.md) | Phase-by-phase implementation progress, completed features, and deliverables. |
| **Main Project README** | [../README.md](../README.md) | Root repository documentation, installation, execution commands, and comprehensive overview. |

---

## ⚡ Quick Technical Summary

* **Frontend:** HTML5, Vanilla CSS3 (Custom Dark Charcoal/Teal Design System), Vanilla JavaScript ES6+, Bootstrap 5 UI framework.
* **Backend:** Python 3, Flask REST API (`backend/app.py`), CORS enabled.
* **Email ML Pipeline:** Scikit-learn Pipeline with `TfidfVectorizer` (30,000 features, n-grams 1–2) + `LogisticRegression` (`models/email_phishing_model.joblib`).
* **URL ML Pipeline:** 30-feature lexical/structural extractor (`backend/url_features.py`) + `StandardScaler` (`models/url_scaler.joblib`) + Keras Dense Neural Network (`models/url_phishing_model.keras`).
* **Datasets:**
  * Combined Email Benchmark Dataset (82,486 records).
  * UCI Phishing Websites Dataset (11,055 records, 30 features).
