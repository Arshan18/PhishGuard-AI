# Product Requirements Document (PRD) — PhishGuard AI

## 1. Project Overview

* **Project Name:** AI-Based Phishing Email and Malicious URL Detection Using Explainable Machine Learning (PhishGuard AI)
* **Project Type:** Subject-level IT Engineering Academic Project
* **Problem Statement:** Phishing attacks and fraudulent web links represent primary vectors for credential theft, malware distribution, and social engineering fraud. Conventional rule-based filters struggle with dynamic phrasing, while complex deep learning models lack transparency for non-expert users.
* **Project Purpose:** To deliver a clean, interactive, and transparent web-based cybersecurity tool that evaluates emails and URLs using machine learning pipelines, providing clear risk probabilities and actionable explanations.
* **Target Audience:** College students, evaluators, IT administrators, and end-users seeking an accessible security assessment tool.
* **Scope Disclaimer:** PhishGuard AI is developed as an academic and research project for demonstration and educational purposes. It is not an enterprise email gateway or antivirus replacement.

---

## 2. Project Objectives

1. **Email Threat Detection:** Accurately classify email body and subject text as *Phishing/Spam* or *Legitimate* using machine learning.
2. **Transparent Probability Scoring:** Provide a single, unambiguous **Phishing Risk** percentage representing the model's computed probability for the phishing class.
3. **Malicious URL Detection Interface:** Provide an interactive interface to inspect website addresses for structural and lexical threat indicators.
4. **Explainable Assessment:** Generate plain-language explanations and safety recommendations tailored to the classification verdict.
5. **Modern User Experience:** Provide a responsive, high-performance cybersecurity dashboard interface with smooth animations and multi-sample testing tools.

---

## 3. System Architecture & Machine Learning Pipelines

### 3.1. Email Detection Pipeline (Operational)

```text
Raw Email Text (Subject + Body)
              ↓
Text Preprocessing & Tokenization
              ↓
TF-IDF Vectorization (30,000 features, sublinear TF, n-grams 1-2)
              ↓
Logistic Regression Classifier (Balanced Class Weights)
              ↓
Binary Prediction + Phishing Risk Probability + Explainable Recommendations
```

### 3.2. URL Detection Pipeline (In Progress)

```text
Target URL String
              ↓
Lexical & Structural Feature Extraction (30 attributes)
              ↓
Feature Normalization
              ↓
Random Forest Classifier (datasets/Training Dataset.arff)
              ↓
Risk Classification + Recommendation Checklist
```

---

## 4. Functional Requirements

* **FR-1: Email Text Input:** Support user input for an optional subject line and email body text.
* **FR-2: Dynamic Sample Loaders:** Provide quick test buttons with random non-consecutive selection from 10+ synthetic phishing emails and 10+ legitimate emails.
* **FR-3: Input Validation:** Enforce minimum 15-character threshold and prevent empty submissions.
* **FR-4: Real-Time Scanning State:** Display animated card radar sweep and button spinner strictly while API inference is active.
* **FR-5: Live Model Inference:** Flask backend processes raw text through the loaded scikit-learn Pipeline (`models/email_phishing_model.joblib`).
* **FR-6: Phishing Risk Progress Bar:** Animate a slim 8px risk indicator representing the exact percentage returned by the backend.
* **FR-7: Explainable Verdict:** Provide contextual summaries and safety checklists based on model outputs.
* **FR-8: Malicious URL Scanner Interface:** Accept URL/IP targets, enforce syntax validation, and present static threat reviews.
* **FR-9: Disconnected Server Graceful Handling:** Display user-friendly banners and startup instructions when Flask is offline.

---

## 5. Out of Scope

The following elements are excluded to preserve a realistic subject-level academic scope:

* User authentication, user logins, or persistent database storage
* Commercial payment integration or subscription models
* Real-time network packet sniffing or IMAP/SMTP mail server listeners
* Browser extensions or deep system kernel hooks
* Automatic navigation or active crawling of malicious URLs (sandboxed static string analysis only)
* Enterprise multi-tenant administration consoles
