# Product Requirements Document (PRD) — PhishGuard AI

## 1. Project Overview & Context

* **Project Title:** PhishGuard AI – AI-Based Phishing Email & Malicious URL Detection
* **Academic Course:** Artificial Intelligence and Machine Learning - II
* **Department:** DEPARTMENT OF INFORMATION TECHNOLOGY
* **Institution:** M. H. Saboo Siddik College of Engineering, Byculla, Mumbai
* **Team Members:**
  * **Asim Khan** — Roll No. 231407
  * **Arshan Attar** — Roll No. 231408
* **Head of Department (HOD):** **Dr. Zainab Mirza**
* **Project Type:** Final-Year Undergraduate Engineering Academic Project & Laboratory Demonstration Prototype

---

## 2. Problem Statement & Motivation

Phishing emails and deceptive web links remain the primary initial attack vectors for identity theft, credential harvesting, malware distribution, and financial fraud. 

Traditional rule-based keyword filters and static blocklists often fail against emerging social engineering lures and dynamically generated domain names. Conversely, complex black-box detection systems do not provide clear risk interpretation to end users.

**PhishGuard AI** addresses this challenge by providing an accessible, transparent, and responsive web platform that analyzes both email content and target URLs using dedicated machine learning models, presenting clear risk probabilities and actionable safety guidance.

---

## 3. Project Objectives

1. **Dual-Vector Threat Detection:** Provide separate scanning interfaces for evaluating (a) email text content and (b) target URLs.
2. **Transparent Machine Learning Inference:** Utilize classical machine learning (TF-IDF + Logistic Regression) for linguistic email analysis and deep learning (Dense Neural Network) for multi-feature URL evaluation.
3. **Calibrated Risk Scoring:** Calculate and display a single, unambiguous **Phishing Risk** percentage ($0.00\%$ to $100.00\%$) indicating threat likelihood.
4. **Explainable AI Summaries:** Deliver dynamic natural-language explanations and safety recommendations tailored to the specific detection outcome.
5. **Interactive Demonstration Tools:** Include pre-configured synthetic sample loaders for both malicious and legitimate examples to facilitate academic evaluation.
6. **Local Scan History Tracking:** Persist recent scan results locally in the user's browser for session auditing without external database overhead.

---

## 4. Functional Requirements

| ID | Module | Description | Implementation Status |
| :--- | :--- | :--- | :--- |
| **FR-1** | **Email Scanner** | Accepts subject line and body text, validates input length ($\ge$ 15 chars), and displays word/character counts. | **Completed & Live** |
| **FR-2** | **Email Multi-Sample Loader** | Provides 10+ synthetic phishing emails and 10+ legitimate emails with non-consecutive random selection. | **Completed & Live** |
| **FR-3** | **Email ML Inference** | Evaluates text via `TfidfVectorizer` + `LogisticRegression` (`models/email_phishing_model.joblib`) and returns exact class probabilities. | **Completed & Live** |
| **FR-4** | **URL Scanner** | Validates URL format and evaluates structural/lexical indicators via static string parsing. | **Completed & Live** |
| **FR-5** | **URL Multi-Sample Loader** | Provides 15+ synthetic phishing URLs and 15+ legitimate URLs with automated scan demonstration flow. | **Completed & Live** |
| **FR-6** | **URL Neural Network Inference** | Extracts 30 features (`backend/url_features.py`), scales values with `StandardScaler`, and evaluates via Keras Dense Neural Network (`models/url_phishing_model.keras`). | **Completed & Live** |
| **FR-7** | **Phishing Risk Progress Bar** | Smoothly animates a slim calibrated progress bar reflecting the exact probability returned by the backend. | **Completed & Live** |
| **FR-8** | **Explainability & Tips** | Presents contextual summaries ("Why This Was Detected") and actionable safety checklists. | **Completed & Live** |
| **FR-9** | **Scan History Logger** | Records recent scans (Type, Target, Verdict, Risk Score, Timestamp) in `localStorage` with view and clear controls (`frontend/history.html`). | **Completed & Live** |
| **FR-10** | **Live Threat Dashboard** | Displays real-time session counters (Total Scans, Phishing Detected, Safe Items, Avg Risk) on the homepage. | **Completed & Live** |
| **FR-11** | **Offline Handling** | Displays graceful warning banners when the Flask backend server is disconnected or unreachable. | **Completed & Live** |

---

## 5. Non-Functional Requirements

* **Performance & Latency:** Model inference response times under 200ms on standard local hardware.
* **Safety & Isolation:** Target URLs are evaluated purely as inert text strings and are never fetched, resolved, or executed.
* **Responsive Design:** Fluid layout across desktop and mobile screens using Bootstrap 5 and custom CSS.
* **Accessibility:** Full support for `@media (prefers-reduced-motion: reduce)` disabling non-essential UI animations.
* **Maintainability:** Modular separation between backend inference, feature extraction, and frontend static assets.

---

## 6. Scope Boundaries & Exclusions

To maintain a practical and achievable academic scope, the following capabilities are explicitly excluded:

* Active automated web crawling or live DOM rendering of external malicious sites.
* Live mail server integration (IMAP/SMTP listeners) or commercial enterprise security gateways.
* User account registration, passwords, or cloud database storage.
* Paid third-party commercial threat intelligence API dependencies.
