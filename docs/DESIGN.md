# UI/UX Design Specification — PhishGuard AI

## 1. Visual Theme & Aesthetics

PhishGuard AI employs a dark charcoal and teal cybersecurity aesthetic designed to look professional, modern, and accessible for academic and technical presentations.

### 1.1. Color Palette

* **Background Primary:** `#080D10` (Deep Dark Charcoal)
* **Background Secondary / Panels:** `#0D1519` / `#111D22` (Card and panel surface)
* **Input Background:** `#0B1318` / `#0E181D` (Focused state)
* **Accent Cyan / Teal:** `#20C8C3` / `#52DDD6` (Primary interactive elements, glowing highlights, and brand tokens)
* **Accent Glow:** `rgba(32, 200, 195, 0.2)`
* **Safe Status:** `#43D6A0` (Emerald Green)
* **Threat / Phishing Status:** `#FF727A` (Crimson Red)
* **Warning Status:** `#F2C66D` (Amber Yellow)
* **Typography:** `#EDF4F5` (Headings/Body), `#9BAEB3` (Muted/Subtext), `#5E7A80` (Dim labels)
* **Borders:** `#24363B` / `rgba(32, 200, 195, 0.35)`

### 1.2. Typography

* **Primary Interface Font:** `Plus Jakarta Sans` (Google Fonts) — clean, modern sans-serif with high readability.
* **Monospace / Code Font:** `JetBrains Mono` / Consolas — used for technical tags, threat monitor previews, and code snippets.

### 1.3. Motion & Micro-Interactions Framework

* **Easing Tokens:**
  * `--ease-out-expo`: `cubic-bezier(0.16, 1, 0.3, 1)`
  * `--ease-smooth`: `cubic-bezier(0.2, 0.8, 0.2, 1)`
  * `--ease-in-out`: `cubic-bezier(0.4, 0, 0.2, 1)`
* **Entrance Animations:** Staggered upward slide and fade-in (`.fade-slide-up`, `.delay-1` through `.delay-5`) completing in 650ms.
* **Ambient Background Effect:** Slowly drifting teal ambient glow (`.glow-orb` with `@keyframes ambientDrift` over 20–26s).
* **Card Interactions:** Hover elevation (`translateY(-4px)`), teal border transition (`rgba(32, 200, 195, 0.4)`), ambient glow (`box-shadow`), and icon scaling (`.card-icon-wrap`).
* **Tactile Buttons:** Hover elevation and brightened teal glow, active press scaling (`scale(0.97)`), and focus-visible rings.
* **Live Scanning State:** Active card scanline radar sweep (`@keyframes scanlineSweep`), button spinner, and status text ("Analyzing email..." / "Inspecting URL...").
* **Result Reveal:** Smooth upward fade-in with a 650ms animated progress bar fill from 0% to the exact returned model percentage.
* **Accessibility:** Full `@media (prefers-reduced-motion: reduce)` support disabling non-essential transitions and transforms.

---

## 2. Page Specifications

### 2.1. Homepage (`index.html`)

* **Navigation Bar:**
  * Brand shield icon with "PhishGuard AI" logo.
  * Links: Home, Email Scanner, URL Scanner, About.
  * Responsive mobile hamburger toggle.
* **Hero Section:**
  * Badge: `Explainable Machine Learning`.
  * Headline: *"Stay One Step Ahead of Phishing."*
  * Supporting copy explaining email and URL ML capabilities.
  * Action buttons: *"Scan an Email"* (Primary teal) and *"Check a URL"* (Secondary outline).
  * Quick highlights: Dual-Model ML, Explainable AI, <150ms inference latency.
  * Live Threat Monitor terminal card displaying real-time ML vectorization simulation.
* **Core Capabilities Section:**
  * Dual interactive cards for Email Phishing Detection and Malicious URL Detection with hover lift and primary action buttons.
* **Workflow Section (`#about`):**
  * 3 numbered steps: *1. Input Submission*, *2. Machine Learning Analysis*, *3. Explainable Verdict*.
* **Footer:**
  * Brand logo, description, and copyright attribution.

### 2.2. Email Scanner (`email.html`)

* **Header & Breadcrumbs:** Page title and instructions.
* **Quick Test Samples Bar:**
  * *"Load Phishing Sample"*: Randomly selects one of 10+ synthetic phishing emails (non-consecutive selection).
  * *"Load Legitimate Sample"*: Randomly selects one of 10+ synthetic everyday emails.
* **Input Form:**
  * Optional Subject Line input.
  * Email Body textarea with live character counter.
  * Action buttons: *"Analyze Email"* (Primary) and *"Clear"* (Outline).
* **Scanning State:** Active scanner card radar sweep, disabled inputs to prevent double submission, spinner, and status message.
* **Result Card:**
  * Classification verdict header with status badge (*High Phishing Threat* / *Verified Legitimate*).
  * Single slim (8px) **Phishing Risk** indicator with external percentage.
  * Explainable AI summary paragraph.
  * Actionable safety recommendations list.

### 2.3. Malicious URL Scanner (`url.html`)

* **Header & Breadcrumbs:** Title and usage guidance.
* **Quick Test Samples Bar:** Buttons to load malicious or safe test URLs.
* **Input Form:**
  * Target URL/IP text input with validation.
  * Static inspection assurance note (URLs are evaluated as text strings and never executed or resolved).
  * Action buttons: *"Check URL"* and *"Clear"*.
* **Result Section:**
  * Status badge, static reference box, model confidence bar, and recommendations list.

---

## 3. Responsive Behavior

* **Mobile (<768px):** Collapsed navigation menu, single-column feature cards, full-width buttons, and touch-friendly padding.
* **Desktop ($\ge$768px):** Multi-column grid, card hover elevation effects, and side-by-side button groupings.
