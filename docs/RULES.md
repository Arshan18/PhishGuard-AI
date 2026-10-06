# Project Development Rules

This document outlines the architectural, engineering, and ethical development guidelines for the **AI-Based Phishing Email & Malicious URL Detection** project.

---

## 1. General Engineering Rules

* **Keep It Simple:** Maintain a lightweight, subject-level project footprint. Avoid enterprise architectural complexity (e.g., microservices, orchestrators, heavy state stores).
* **Technology Discipline:** Do not introduce unrequested frameworks, complex ORMs, or container tools unless explicitly required.
* **Preserve Working Code:** Do not delete, break, or arbitrarily refactor working components without a clearly justified requirement.
* **Dataset Integrity:** Never overwrite or corrupt existing raw datasets in the `datasets/` folder.
* **No Fabricated Results:** Never fake or hardcode machine learning prediction scores or performance metrics.

---

## 2. Machine Learning Rules

* **Model-Driven Inference:** All predictions presented in the UI must originate from trained model artifacts, not heuristic mocks or hardcoded output mappings.
* **No Hardcoded Accuracy Claims:** Never claim specific accuracy, precision, or recall figures unless verified against an actual validation dataset.
* **Preprocessing Parity:** Ensure text tokenization, TF-IDF feature vocabulary, and scaling used during inference exactly mirror training-time preprocessing.
* **Preserve Feature Order:** For tabular and structural URL models, strictly preserve the exact column ordering and encoding format used during model training.
* **Transparent Limitations:** Clearly articulate the distinction between pre-engineered tabular URL features and raw URL string processing.

---

## 3. Dataset Rules

* **Storage Location:** All raw datasets must reside in the `datasets/` directory.
* **Immutability:** Treat raw data as read-only. Cleaned or preprocessed variations should be stored separately if needed.
* **Label Verification:** Thoroughly inspect label representations (e.g., `1` vs. `-1` vs. `0`) and document mappings prior to fitting classifiers.
* **Document Provenance:** Maintain clear records of dataset sources (e.g., UCI Machine Learning Repository).

---

## 4. Frontend Rules

* **Cybersecurity Design Consistency:** Maintain the established dark navy palette, cyan/blue highlights, and card layouts defined in `frontend/style.css`.
* **Full Responsiveness:** Ensure all interactive pages render cleanly on mobile, tablet, and desktop viewports.
* **Scope Discipline:** Do not introduce unrequested pages (e.g., user profiles, admin consoles, billing views, authentication gates).
* **Safe Inspection:** Never automatically visit, redirect to, or execute user-entered target URLs.

---

## 5. Backend Rules

* **Simplicity First:** Keep the Flask API minimal, readable, and focused solely on serving the application and performing inference.
* **Strict Input Validation:** Validate payloads on every endpoint; return clear HTTP 400 status codes with descriptive error messages when required fields are missing.
* **Graceful Exception Handling:** Wrap inference routines in structured try/except blocks to prevent unhandled 500 server crashes.
* **Information Security:** Do not expose sensitive internal server stack traces or directory paths in client-facing API responses.

---

## 6. Documentation Rules

* **Ground Truth Alignment:** Keep all documentation files strictly synchronized with the actual codebase state.
* **Honest Status Tracking:** Never describe a planned or partially completed component as fully operational.
* **Explicit Status Labels:** Clearly mark unbuilt features with labels such as `[Planned]` or `[Not yet implemented]`.
