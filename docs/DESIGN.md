# UI/UX Design Specification — PhishGuard AI

## 1. Visual Theme & Design Language

PhishGuard AI employs a dark charcoal and teal cybersecurity aesthetic designed to provide an engaging, clean, and modern interface suitable for academic presentations and laboratory demonstrations.

### 1.1. Color Palette

* **Background Primary:** `#080D10` (Deep Dark Charcoal)
* **Background Secondary / Panels:** `#0D1519` / `#111D22` (Card surface and container background)
* **Input Background:** `#0B1318` / `#0E181D` (Form field surfaces)
* **Accent Cyan / Teal:** `#20C8C3` / `#52DDD6` (Primary interactive highlights, glowing accents, and brand badges)
* **Accent Glow:** `rgba(32, 200, 195, 0.2)`
* **Safe Status:** `#43D6A0` (Emerald Green)
* **Threat / Phishing Status:** `#FF727A` (Crimson Red)
* **Warning Status:** `#FBBF24` / `#F2C66D` (Amber Gold)
* **Typography:** `#EDF4F5` (Headings/Body), `#9BAEB3` (Muted/Subtext), `#5E7A80` (Dim labels)
* **Borders:** `#24363B` / `rgba(32, 200, 195, 0.35)`

### 1.2. Typography

* **Primary Interface Font:** `Plus Jakarta Sans` (Google Fonts) — clean modern sans-serif.
* **Monospace / Code Font:** `JetBrains Mono` / Consolas — used for technical tags, URL displays, probability scores, and terminal cards.

### 1.3. Motion & Micro-Interactions Framework

* **Easing Tokens:**
  * `--ease-out-expo`: `cubic-bezier(0.16, 1, 0.3, 1)`
  * `--ease-smooth`: `cubic-bezier(0.2, 0.8, 0.2, 1)`
  * `--ease-in-out`: `cubic-bezier(0.4, 0, 0.2, 1)`
* **Entrance Animations:** Staggered upward slide and fade-in (`.fade-slide-up`, `.delay-1` through `.delay-5`) completing smoothly in 650ms.
* **Ambient Background Effect:** Slowly drifting teal ambient glow (`.glow-orb` with `@keyframes ambientDrift` over 20–26s).
* **Card Interactions:** Hover elevation (`translateY(-4px)`), teal border transition (`rgba(32, 200, 195, 0.4)`), and ambient glow (`box-shadow`).
* **Live Scanning State:** Active card scanline radar sweep (`@keyframes scanlineSweep`), button spinner, and status text during API inference.
* **Result Reveal:** Smooth upward fade-in with an animated progress bar fill from 0% to the exact returned model percentage.
* **Accessibility:** Full `@media (prefers-reduced-motion: reduce)` support disabling non-essential transitions and transforms.

---

## 2. Page Specifications

### 2.1. Homepage & Dashboard (`index.html`)

* **Navigation Bar:** Brand shield icon with "PhishGuard AI" logo, navigation links (Home, Email Scanner, URL Scanner, Scan History, About), and mobile toggle.
* **Hero Section:**
  * Badge: `Explainable Machine Learning`.
  * Headline: *"Stay One Step Ahead of Phishing."*
  * Supporting copy explaining email and URL AI capabilities.
  * Direct action buttons: *"Scan an Email"* (Primary teal) and *"Check a URL"* (Secondary outline).
  * Quick highlights: Dual-Model ML, Explainable AI, <150ms inference latency.
* **Live Threat Dashboard:** Real-time session metrics tracking:
  * Total Scans Conducted
  * Phishing Threats Flagged
  * Legitimate / Safe Items
  * Average Phishing Risk Percentage
* **Core Capabilities Section:** Interactive module cards for Email Phishing Detection and Malicious URL Detection with hover lift and direct launch buttons.
* **Workflow Section (`#about`):** 3 numbered steps explaining the processing pipeline (Input → ML Inference → Explainable Verdict).

### 2.2. Email Scanner (`email.html`)

* **Header & Breadcrumbs:** Page title and usage instructions.
* **Quick Test Samples Bar:**
  * *"Load Phishing Sample"*: Randomly loads one of 10+ realistic synthetic phishing emails.
  * *"Load Legitimate Sample"*: Randomly loads one of 10+ standard everyday workplace emails.
* **Input Form:** Optional Subject Line input and Email Body textarea with live word and character counters.
* **Scanning State:** Active scanner card radar sweep, disabled inputs during request, spinner, and status message.
* **Result Card:**
  * Classification verdict badge (*Phishing Detected* / *Verified Legitimate*).
  * Single slim (8px) **Phishing Risk** indicator with external percentage.
  * Dynamic explainable AI summary paragraph.
  * Actionable safety recommendations list.

### 2.3. Malicious URL Scanner (`url.html`)

* **Header & Breadcrumbs:** Title and usage guidance.
* **Quick Test Samples Bar:**
  * *"Load Malicious Sample"*: Randomly loads one of 15+ synthetic phishing URLs with automated scan demonstration flow.
  * *"Load Legitimate Sample"*: Randomly loads one of 15+ verified authentic URLs.
* **Input Form:** Target URL input with syntax validation and static inspection assurance note.
* **Result Section:** Status badge, static URL display, 30-feature Neural Network risk bar, dynamic explainable findings, and checklist.

### 2.4. Scan History (`history.html`)

* **Header:** Summary of recent scanning activity.
* **Controls:** Filter options and a *"Clear History"* button.
* **History Table / Cards:** Displays recent scans with:
  * Scan Type (Email / URL)
  * Target Snippet / Address
  * Detection Label (Phishing / Legitimate)
  * Risk Score (%)
  * Date & Time Timestamp
* **Storage:** Persisted locally in browser `localStorage`.

---

## 3. Responsive Behavior

* **Mobile (<768px):** Collapsed navigation menu, single-column feature cards, full-width buttons, and touch-friendly padding.
* **Desktop ($\ge$768px):** Multi-column grid, card hover elevation effects, and side-by-side button groupings.
