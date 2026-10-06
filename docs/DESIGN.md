# UI/UX Design Specification

## 1. Visual Theme & Aesthetics

PhishGuard AI employs a modern cybersecurity aesthetic designed to look professional, polished, and accessible for an academic presentation without enterprise dashboard clutter.

### 1.1. Color Palette

* **Background Primary:** `#070b14` (Deep Dark Navy)
* **Background Secondary / Panels:** `#0d1424` / `rgba(15, 23, 42, 0.75)` (Glassmorphism Card Surface)
* **Accent Cyan:** `#06b6d4` / `#22d3ee` (Primary Brand & Glow Highlights)
* **Accent Blue:** `#3b82f6` / `#60a5fa` (Secondary Accents & Badges)
* **Safe / Verified Status:** `#10b981` (Emerald Green)
* **Threat / Phishing Status:** `#ef4444` (Crimson Red)
* **Warning Status:** `#f59e0b` (Amber Yellow)
* **Typography Colors:** `#f8fafc` (Headings/Body), `#94a3b8` (Muted/Subtext), `#64748b` (Dim labels)

### 1.2. Typography

* **Primary Interface Font:** `Plus Jakarta Sans` (Google Fonts) — clean, modern sans-serif with excellent legibility.
* **Monospace / Code Font:** `JetBrains Mono` / `Fira Code` — used for technical feature tags, terminal previews, and URL inspection strings.

### 1.3. UI Components & Effects

* **Glassmorphism:** Translucent panel backdrops (`backdrop-filter: blur(12px)`) with subtle 1px border strokes (`rgba(255, 255, 255, 0.08)`).
* **Micro-interactions:** Smooth hover elevation (`translateY(-2px)`) and soft radial background orbs for depth.
* **Badges:** Pill-shaped status indicators with soft background fills.

---

## 2. Page Specifications

### 2.1. Homepage (`index.html`)

* **Navigation Bar:**
  * Brand shield icon with "PhishGuard AI" logo text.
  * Links: Home, Email Scanner, URL Scanner, About.
  * Responsive hamburger toggle for mobile devices.
* **Hero Section:**
  * Badge: `Explainable Machine Learning`.
  * Headline: *"Stay One Step Ahead of Phishing."*
  * Supporting copy explaining dual email & URL ML capabilities.
  * Action buttons: *"Scan an Email"* (Primary) and *"Check a URL"* (Secondary).
  * Live Threat Monitor terminal card displaying architectural pipeline highlights.
* **Feature Cards:**
  * Two interactive cards highlighting Email Phishing Detection and Malicious URL Detection.
  * Each card links directly to its respective scanner module.
* **How It Works Section:**
  * 3 numbered steps: *1. Input Submission*, *2. Machine Learning Analysis*, *3. Explainable Verdict*.
* **Technology Section:**
  * 6 technical cards showcasing Python, Scikit-learn, TF-IDF, Logistic Regression, Random Forest, and Flask.
* **Footer:**
  * Branding, quick navigation links, and college project academic disclaimer.

### 2.2. Email Scanner (`email.html`)

* **Header:** Breadcrumbs, page title, and concise usage guidance.
* **Sample Test Bar:** One-click sample loader buttons (*"Load Phishing Sample"*, *"Load Legitimate Sample"*) for rapid live demonstration.
* **Input Form:**
  * Subject line input (Optional).
  * Email body textarea with real-time character count.
  * Action buttons: *"Analyze Email"* (Primary) and *"Clear"* (Secondary).
* **Loading State:** Centered animated spinner displaying *"Running TF-IDF tokenization and classification model inference..."*.
* **Notification / Error Banner:** Dynamic alerts for empty input, short text warnings, and backend connection guidance.
* **Result Section:**
  * Status badge (*Phishing Detected* or *Legitimate Email*).
  * Model confidence progress bar.
  * Explainable AI summary highlighting detected indicators.
  * Actionable safety recommendations list.

### 2.3. Malicious URL Scanner (`url.html`)

* **Header:** Breadcrumbs, title, and URL inspection instructions.
* **Sample Test Bar:** Quick-load sample buttons (*"Load Malicious Sample"*, *"Load Safe Sample"*).
* **Input Form:**
  * Web address / IP text input with URL link icon prefix.
  * Safety reminder note explicitly clarifying that target URLs are analyzed as static strings and never automatically executed or visited.
  * Action buttons: *"Check URL"* and *"Clear"*.
* **Loading State:** Animated spinner displaying *"Extracting Lexical Features..."*.
* **Result Section:**
  * Status badge (*Malicious / Phishing URL* or *Legitimate / Safe URL*).
  * Static target URL display box.
  * Model confidence progress bar.
  * Explainable feature summary and structured safety recommendations.

---

## 3. UX Guidelines

* **Immediate Feedback:** Clear visual state changes upon submission, clearing, or errors.
* **No Unnecessary Clutter:** Focused solely on scanning tasks without confusing navigation layers or extraneous metrics.
* **Accessibility:** High contrast text on dark backgrounds, clearly distinguishable buttons, and standard HTML5 form controls.
* **Safe Exploration:** Explicit assurances and sandboxed static string handling for malicious inputs.
