# Product Requirements Document (PRD)

## 1. Project Overview

* **Project Name:** AI-Based Phishing Email and Malicious URL Detection Using Explainable Machine Learning (PhishGuard AI)
* **Project Type:** Subject-level IT engineering college project
* **Problem Statement:** Phishing emails and malicious web links are among the most pervasive cybersecurity threats, deceiving users into exposing sensitive credentials and financial information. Manual inspection of suspicious messages and URLs is error-prone, while opaque black-box detection systems lack user interpretability.
* **Project Purpose:** To construct a clean, practical, and educational web-based cybersecurity tool that uses machine learning classifiers to evaluate emails and URLs, offering transparent and understandable prediction results.
* **Target Users:** College students, academic evaluators, IT staff, and general users seeking an easy-to-use security inspection tool.
* **Why Detection is Useful:** Provides automated preliminary threat assessment, raises security awareness, and assists users in recognizing linguistic and structural phishing indicators.

---

## 2. Project Goals

1. **Email Phishing Detection:** Classify incoming email body text as either *Phishing* or *Legitimate*.
2. **Malicious URL Detection:** Classify web links/features as either *Phishing/Malicious* or *Legitimate*.
3. **Explainable Results:** Provide human-understandable explanations and indicators alongside predictions.
4. **Simple & Modern Interface:** Deliver a responsive, cybersecurity-themed user interface without complex onboarding or enterprise clutter.
5. **Demonstrate Core ML Concepts:** Clearly showcase standard machine learning pipelines (TF-IDF text vectorization, Logistic Regression, Random Forest classification) for academic evaluation.

---

## 3. Machine Learning Components

### 3.1. Email Detection Pipeline

```text
Raw Email Text
      ↓
Text Cleaning & Preprocessing
      ↓
TF-IDF Vectorization (Term Frequency - Inverse Document Frequency)
      ↓
Logistic Regression Classifier
      ↓
Prediction (Phishing vs. Legitimate) + Confidence Score
```

### 3.2. URL Detection Pipeline

```text
URL / Extracted URL Features
      ↓
Feature Preprocessing (Lexical & Structural)
      ↓
Random Forest Classifier
      ↓
Prediction (Malicious vs. Legitimate) + Confidence Score
```

> **Important Note on URL Features:**  
> The URL dataset utilized (`Training Dataset.arff`) contains pre-engineered website/URL structural features (e.g., prefix-suffix, subdomain count, SSL state, URL length). Direct raw URL string inference requires an explicit feature extraction layer to compute these attributes before passing them to the Random Forest model.

---

## 4. Functional Requirements

* **FR-1: Email Input:** Users can input email body text and an optional subject line.
* **FR-2: Email Analysis:** Frontend sends text to the analysis service for ML tokenization and classification.
* **FR-3: URL Input:** Users can enter a target web URL or IP address.
* **FR-4: URL Analysis:** System evaluates URL input (static string analysis; never automatically navigated or visited).
* **FR-5: Prediction Results:** Displays clear classification badge (*Phishing/Malicious* or *Legitimate/Safe*).
* **FR-6: Confidence Score:** Displays model probability or confidence percentage when supported by the model.
* **FR-7: Safety Recommendations:** Provides clear actionable recommendations based on classification.
* **FR-8: Input Validation & Clear:** Form validation prevents empty or invalid inputs; one-click reset clears inputs and active results.
* **FR-9: Loading & Disconnected States:** Animated loading state during inference, with user-friendly error banners when the backend server is unreachable.

---

## 5. Non-Functional Requirements

* **Simplicity:** Clean, intuitive UI without convoluted workflows.
* **Responsiveness:** Fluid layout supporting mobile, tablet, and desktop viewports.
* **Performance:** Rapid client-side response and low-latency model inference (< 200ms expected locally).
* **Safe Inspection:** Static analysis only; user-entered URLs are never visited, resolved, or executed by the client.
* **Maintainability:** Modular separation between frontend presentation, backend routing, and ML model training.
* **Presentation-Ready:** Includes built-in sample test cases for seamless demonstration during academic reviews.

---

## 6. Out of Scope

The following features are intentionally out of scope to maintain an appropriate subject-level academic scope:

* User authentication, registration, or session management
* Payment processing or subscription tiers
* Multi-tenant admin dashboards
* Relational or NoSQL database integration (e.g., PostgreSQL, MongoDB)
* Containerization (Docker) or complex Kubernetes orchestration
* Cloud infrastructure provisioning (AWS/GCP/Azure)
* Browser extension development
* Direct email inbox integration (IMAP/POP3/SMTP listeners)
* Continuous real-time network traffic interception
