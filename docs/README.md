# AI-Based Phishing Email and Malicious URL Detection Using Explainable Machine Learning

**PhishGuard AI** is a modern cybersecurity tool and academic project designed to detect phishing emails and malicious/fraudulent URLs using machine learning algorithms and explainable AI techniques.

---

## 📚 Project Documentation

- [Product Requirements](PRD.md)
- [Architecture](ARCHITECTURE.md)
- [Project Rules](RULES.md)
- [Design](DESIGN.md)
- [Tasks](TASKS.md)
- [Project Memory](MEMORY.md)

---

## 📁 Project Folder Structure

```text
Phishing-Detection-Project/
│
├── datasets/
│   ├── phishing_email.csv          # Email text dataset with labels
│   └── Training Dataset.arff       # Malicious URL feature dataset
│
├── notebooks/
│   ├── 01_email_phishing_model.ipynb   # TF-IDF & text classifier training
│   └── 02_malicious_url_model.ipynb    # Lexical URL feature extraction & model training
│
├── models/
│   └── .gitkeep                    # Directory to store exported .pkl / .joblib models
│
├── backend/
│   ├── app.py                      # Flask REST API server for inference
│   └── requirements.txt            # Python backend dependencies
│
├── frontend/
│   ├── index.html                  # Landing page & system architecture overview
│   ├── email.html                  # Email phishing scanner module
│   ├── url.html                    # Malicious URL scanner module
│   ├── style.css                   # Custom cybersecurity dark navy UI design system
│   └── script.js                   # Client validation, UI state handling, API calls
│
├── README.md                       # Project documentation & run guide
└── .gitignore                      # Git ignore file for binaries & venv
```

---

## 🚀 How to Open and Run the Project

### Option 1: Running the Frontend (Static / UI Review)
You can directly test and view the user interface without running any server:
1. Navigate to the `frontend/` directory.
2. Double-click **`index.html`** or right-click and open it in any modern browser (Chrome, Edge, Firefox).
3. Seamlessly navigate between **Home**, **Email Scanner**, and **URL Scanner**.
4. Test client-side validations, sample text loaders, and clear buttons.

---

### Option 2: Running with Python Flask Backend (Full Stack Live Inference)

1. **Open your terminal / command prompt** and navigate to the project directory:
   ```bash
   cd c:\AIDS-Project
   ```

2. **(Optional) Create and activate a Python virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   ```

3. **Install backend dependencies:**
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Start the Flask server:**
   ```bash
   python backend/app.py
   ```
   *The server starts on `http://127.0.0.1:5000`.*

5. **Open the application:**
   - Open your browser to `http://127.0.0.1:5000` or open `frontend/index.html`.

---

## 🛡️ Key Features & Modules

1. **Homepage (`index.html`)**:
   - Hero banner with cybersecurity visual hierarchy.
   - Dedicated modules for Email Phishing and URL Detection.
   - 3-step workflow diagram.
   - Technology and model architecture breakdown.

2. **Email Phishing Scanner (`email.html`)**:
   - Input fields for optional subject and email body.
   - Character count and quick sample loaders for presentation demos.
   - Input validation (empty text prevention, minimum length check).
   - Dynamic loading indicators and explainable result cards.

3. **Malicious URL Scanner (`url.html`)**:
   - URL & IP syntax validator.
   - Static string inspection guarantee (URLs are never executed or visited).
   - Sample buttons for instant demo testing.
   - Risk indicator badges, confidence scoring, and safety recommendations.

---

## 🔌 Backend API Integration Details

The frontend communicates with Flask endpoints defined in `backend/app.py`:
- `GET  /api/health` — Checks backend connectivity.
- `POST /api/analyze-email` — Receives `{ "subject": "...", "content": "..." }`.
- `POST /api/analyze-url` — Receives `{ "url": "..." }`.

> **Note on Model Connection:**  
> When you train your models in `notebooks/`, export the trained pipeline (`.pkl` / `.joblib`) to the `models/` directory and import them into `backend/app.py` to yield live probabilities and explanations.

---

## 🎓 Academic Disclaimer
This project is built for academic and research presentation purposes to demonstrate explainable AI and machine learning techniques in cybersecurity.
