/**
 * PhishGuard AI — Frontend Application Logic
 * College Project: AI-Based Phishing Email and Malicious URL Detection
 * 
 * Handles client-side validation, UI state transitions, API communication with Flask backend,
 * scan history management, explainable detection indicator extraction, and dashboard stats.
 */

// Global Configuration
const CONFIG = {
  API_BASE_URL: 'http://127.0.0.1:5000', // Default local Flask server URL
  API_TIMEOUT_MS: 5000,
  HISTORY_STORAGE_KEY: 'phishguard_scan_history'
};

// ==========================================
// 1. Scan History Storage Layer (localStorage)
// ==========================================
const HistoryStore = {
  getHistory() {
    try {
      const raw = localStorage.getItem(CONFIG.HISTORY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Unable to load history from localStorage:', e);
      return [];
    }
  },

  saveScan(record) {
    try {
      const history = this.getHistory();
      const newRecord = {
        id: 'scan_' + Date.now(),
        type: record.type, // 'Email' or 'URL'
        input: record.input,
        prediction: record.prediction, // 'Phishing' or 'Legitimate'
        score: record.score, // formatted string, e.g. "91.42%"
        scoreNum: parseFloat(record.score) || 0,
        isPhishing: record.isPhishing,
        timestamp: this.formatTime(new Date()),
        date: new Date().toISOString()
      };
      // Prepend and keep latest 50 records
      history.unshift(newRecord);
      if (history.length > 50) history.pop();
      localStorage.setItem(CONFIG.HISTORY_STORAGE_KEY, JSON.stringify(history));
      return newRecord;
    } catch (e) {
      console.warn('Unable to save history to localStorage:', e);
      return null;
    }
  },

  clearHistory() {
    try {
      localStorage.removeItem(CONFIG.HISTORY_STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  },

  getStats() {
    const history = this.getHistory();
    const total = history.length;
    if (total === 0) {
      return { total: 0, phishing: 0, legit: 0, avgScore: '0.0%' };
    }
    const phishing = history.filter(h => h.isPhishing).length;
    const legit = total - phishing;
    const sumScore = history.reduce((acc, curr) => acc + (curr.scoreNum || 0), 0);
    const avgScore = (sumScore / total).toFixed(1) + '%';
    return { total, phishing, legit, avgScore };
  },

  getLatest() {
    const history = this.getHistory();
    return history.length > 0 ? history[0] : null;
  },

  formatTime(date) {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const timeStr = `${formattedHours}:${minutes} ${ampm}`;

    if (isToday) {
      return `Today ${timeStr}`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${timeStr}`;
  }
};

// ==========================================
// 2. Core API Service Layer
// ==========================================
const ApiService = {
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (e) {
      return false;
    }
  },

  async analyzeEmail(subject, content) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/scan-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_text: content, subject: subject, content: content }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred during email analysis.');
      }
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        isNetworkError: error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'),
        error: error.message
      };
    }
  },

  async analyzeUrl(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred during URL analysis.');
      }
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        isNetworkError: error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'),
        error: error.message
      };
    }
  }
};

// ==========================================
// 3. "Why This Was Detected" Indicator Generators
// ==========================================
const DetectionReasons = {
  forUrl(url, isPhishing, featDict) {
    const reasons = [];
    const lowerUrl = (url || '').toLowerCase();

    if (isPhishing) {
      if (featDict) {
        if (featDict['Shortining_Service'] === -1) {
          reasons.push('URL Shortening service detected (masks destination host and redirects through intermediary)');
        }
        if (featDict['having_IP_Address'] === -1) {
          reasons.push('Direct numerical IP address used instead of legitimate registered domain name');
        }
        if (featDict['Prefix_Suffix'] === -1) {
          reasons.push('Suspicious hyphen (-) prefix/suffix used in domain name (brand spoofing & typosquatting trick)');
        }
        if (featDict['having_Sub_Domain'] === -1) {
          reasons.push('Excessive subdomain depth / multiple nested subdomains observed');
        }
        if (featDict['HTTPS_token'] === -1) {
          reasons.push('Deceptive "https" token embedded in hostname to create false sense of security');
        }
        if (featDict['SSLfinal_State'] === -1) {
          reasons.push('Insecure plain HTTP connection with no SSL encryption certificate');
        } else if (featDict['SSLfinal_State'] === 0) {
          reasons.push('Unverified or suspicious SSL certificate lineage on unrecognized domain');
        }
        if (featDict['URL_Length'] === -1) {
          reasons.push('Abnormally long URL length (>75 characters) with potential obfuscated query payload');
        }
        if (featDict['Redirect'] === -1) {
          reasons.push('Suspicious URL redirection parameter detected (e.g., redirect=, next=, dest=)');
        }
        if (featDict['Statistical_report'] === -1) {
          reasons.push('High-risk security keywords found (login, verify, billing, update, secure, alert)');
        }
      }

      // Fallback heuristics if specific feature markers were not populated
      if (reasons.length === 0) {
        if (lowerUrl.includes('login') || lowerUrl.includes('verify') || lowerUrl.includes('security')) {
          reasons.push('Target URL matches credential harvesting and security verification keywords');
        }
        if (lowerUrl.includes('-')) {
          reasons.push('Hyphen-separated brand token pattern detected in web address');
        }
        if (reasons.length === 0) {
          reasons.push('Neural network identified composite lexical and structural anomalies matching phishing vectors');
        }
      }
    } else {
      reasons.push('Clean domain structure without prefix/suffix hyphen spoofing or masking');
      reasons.push('Established domain authority & authentic root hierarchy');
      reasons.push('Standard URL character length and clean parameter structure');
      if (lowerUrl.startsWith('https://')) {
        reasons.push('Secure HTTPS protocol on recognized established destination');
      }
    }

    return reasons;
  },

  forEmail(subject, content, isPhishing) {
    const reasons = [];
    const text = `${subject || ''} ${content || ''}`.toLowerCase();

    if (isPhishing) {
      if (/urgent|suspended|immediately|24 hours|locked|final notice|overdue|deactivated|action required|expires today|illegal/.test(text)) {
        reasons.push('Artificial urgency and account suspension pressure triggers');
      }
      if (/password|credential|verify|signin|login|authenticate|passcode|synchronize|validate|ssn/.test(text)) {
        reasons.push('Direct credential harvesting, password change, or login verification solicitation');
      }
      if (/invoice|wire|bank|payout|refund|bitcoin|crypto|payment|direct deposit|remittance|\$\d+/.test(text)) {
        reasons.push('Financial transaction, invoice collection, or unexpected monetary refund language');
      }
      if (/http:\/\/|\.xyz|\.top|\.click|tinyurl|bit\.ly/.test(text)) {
        reasons.push('Embedded suspicious external links or untrusted top-level domain redirects');
      }
      if (/congratulations|won|prize|gift card|reward|lottery|selected as/.test(text)) {
        reasons.push('Unsolicited prize, lottery reward, or loyalty incentive bait');
      }
      if (reasons.length === 0) {
        reasons.push('Linguistic token distributions strongly correspond with social engineering attack profiles');
      }
    } else {
      reasons.push('Standard professional communication vocabulary and natural conversational syntax');
      reasons.push('Absence of artificial urgency, threatening deadlines, or account freeze intimidation');
      reasons.push('No anomalous credential harvesting prompts or deceptive financial wire instructions');
      reasons.push('Consistent semantic structure conforming to standard legitimate message patterns');
    }

    return reasons;
  }
};

// ==========================================
// 4. Email Scanner UI Controller
// ==========================================
function initEmailScanner() {
  const form = document.getElementById('emailScanForm');
  if (!form) return;

  const subjectInput = document.getElementById('emailSubject');
  const contentInput = document.getElementById('emailContent');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const alertContainer = document.getElementById('alertContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultContainer = document.getElementById('resultContainer');
  const charCounter = document.getElementById('charCounter');
  const scannerCard = document.getElementById('emailScannerCard');

  let isScanning = false;

  // Character counter
  if (contentInput && charCounter) {
    contentInput.addEventListener('input', () => {
      const length = contentInput.value.length;
      charCounter.textContent = `${length} characters`;
    });
  }

  // Clear button logic
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (isScanning) return;
      if (subjectInput) subjectInput.value = '';
      if (contentInput) contentInput.value = '';
      if (charCounter) charCounter.textContent = '0 characters';
      hideAlert();
      hideResults();
      if (contentInput) contentInput.focus();
    });
  }

  // Form submission / Analysis logic
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isScanning) return;

    hideAlert();
    hideResults();

    const subject = subjectInput ? subjectInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';

    if (!content) {
      showAlert('danger', 'Please enter or paste the email body text to perform analysis.');
      if (contentInput) contentInput.focus();
      return;
    }

    if (content.length < 15) {
      showAlert('warning', 'Email text is too short for reliable ML token analysis. Please provide at least 15 characters.');
      return;
    }

    isScanning = true;
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = true;
    setLoadingState(true, analyzeBtn, loadingIndicator, 'Analyzing email...', scannerCard);

    try {
      const result = await ApiService.analyzeEmail(subject, content);
      setLoadingState(false, analyzeBtn, loadingIndicator, 'Analyze Email', scannerCard);
      if (analyzeBtn) analyzeBtn.disabled = false;
      if (clearBtn) clearBtn.disabled = false;
      isScanning = false;

      if (result.success) {
        if (result.data && result.data.prediction) {
          displayEmailResult(result.data, subject, content);
        } else {
          showAlert('info', `Backend connected! ${result.data.message || 'Ready for model inference.'}`);
        }
      } else {
        if (result.isNetworkError) {
          showBackendDisconnectedMessage('Email Detection Service');
        } else {
          showAlert('danger', `Analysis Error: ${result.error}`);
        }
      }
    } catch (err) {
      setLoadingState(false, analyzeBtn, loadingIndicator, 'Analyze Email', scannerCard);
      if (analyzeBtn) analyzeBtn.disabled = false;
      if (clearBtn) clearBtn.disabled = false;
      isScanning = false;
      showAlert('danger', 'Unable to analyze this email. Please try again.');
    }
  });

  // Sample Email Collections
  const PHISHING_SAMPLES = [
    {
      subject: 'URGENT: Your Account Has Been Suspended!',
      content: 'Dear Customer,\n\nWe detected unauthorized login attempts on your banking account. Your access is currently frozen. Please click the secure link below to verify your identity and restore access within 24 hours:\n\nhttp://security-verify-bank-update.xyz/login\n\nFailure to do so will result in permanent suspension.\n\nSecurity Department'
    },
    {
      subject: 'Delivery Exception: Package #USPS-98412 On Hold',
      content: 'Your parcel could not be delivered due to an incorrect street address and an outstanding unpaid customs fee of $2.49. Please confirm your delivery address and pay the fee at the following link to reschedule delivery:\n\nhttp://postal-tracking-reschedule.xyz/parcel?id=98412\n\nPackages not claimed within 48 hours will be returned to the sender.'
    },
    {
      subject: 'URGENT: Overdue Invoice #INV-88912 - Final Notice',
      content: 'Dear Accounting Department,\n\nOur records show invoice #INV-88912 for $4,850.00 is now 15 days overdue. Please review the attached remittance instructions and wire the balance immediately to avoid legal collection procedures:\n\nhttp://corporate-billing-invoice-portal.xyz/pay/88912\n\nRegards,\nGlobal Supplier Billing Team'
    },
    {
      subject: 'CONGRATULATIONS: You Won a $1,000 Walmart Gift Card!',
      content: 'Congratulations! Your email address was selected as the 1st prize winner in our annual customer loyalty rewards program. Claim your $1,000 gift card reward now before it expires in 6 hours:\n\nhttp://rewards-giftcard-claims.xyz/redeem?user=winner\n\nEnter your shipping address and contact number to receive your instant payout voucher.'
    },
    {
      subject: 'Action Required: Your Office365 Password Expires Today',
      content: 'Attention Employee,\n\nYour corporate Microsoft Office365 password will expire in 2 hours. To keep your current password and prevent email account lock-out, click the validation portal below to synchronize your credentials:\n\nhttp://sso-portal-auth-microsoft.xyz/login\n\nInternal IT Support Helpdesk'
    }
  ];

  const LEGITIMATE_SAMPLES = [
    {
      subject: 'Project Review Meeting - Agenda for Thursday',
      content: 'Hi Team,\n\nPlease find attached the agenda for our sprint review on Thursday at 2:00 PM. We will go over the feature milestones, code reviews, and test coverage metrics.\n\nLet me know if you would like to add any discussion points.\n\nBest regards,\nAlex'
    },
    {
      subject: 'Order Confirmation #408-92183 - Thank you for your purchase',
      content: 'Hi Sarah,\n\nThanks for shopping with us! We have received your order #408-92183 for the Ergonomic Wireless Mouse. We are currently processing your package and will send a tracking link as soon as it ships.\n\nYou can view your order summary in your account dashboard anytime.\n\nCustomer Care Team'
    },
    {
      subject: 'Appointment Reminder: Routine Dental Checkup on Monday',
      content: 'Dear Michael,\n\nThis is a friendly reminder of your upcoming dental cleaning and checkup appointment scheduled for Monday, October 12th at 10:30 AM with Dr. Patterson.\n\nIf you need to reschedule, please call our office at least 24 hours in advance.\n\nBest regards,\nOakridge Dental Clinic'
    }
  ];

  let lastPhishIndex = -1;
  let lastSafeIndex = -1;

  function getRandomSample(collection, lastIndex) {
    if (!collection || collection.length === 0) return null;
    if (collection.length === 1) return { sample: collection[0], index: 0 };
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * collection.length);
    } while (newIndex === lastIndex);
    return { sample: collection[newIndex], index: newIndex };
  }

  const samplePhishBtn = document.getElementById('samplePhishBtn');
  const sampleSafeBtn = document.getElementById('sampleSafeBtn');

  if (samplePhishBtn) {
    samplePhishBtn.addEventListener('click', () => {
      const selected = getRandomSample(PHISHING_SAMPLES, lastPhishIndex);
      if (selected) {
        lastPhishIndex = selected.index;
        if (subjectInput) subjectInput.value = selected.sample.subject;
        if (contentInput) {
          contentInput.value = selected.sample.content;
          contentInput.dispatchEvent(new Event('input'));
          contentInput.focus();
        }
        hideAlert();
        hideResults();
        if (scannerCard) scannerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (sampleSafeBtn) {
    sampleSafeBtn.addEventListener('click', () => {
      const selected = getRandomSample(LEGITIMATE_SAMPLES, lastSafeIndex);
      if (selected) {
        lastSafeIndex = selected.index;
        if (subjectInput) subjectInput.value = selected.sample.subject;
        if (contentInput) {
          contentInput.value = selected.sample.content;
          contentInput.dispatchEvent(new Event('input'));
          contentInput.focus();
        }
        hideAlert();
        hideResults();
        if (scannerCard) scannerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function showAlert(type, message) {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-custom-${type} d-flex align-items-center mb-4" role="alert">
        <i class="bi bi-${type === 'danger' ? 'exclamation-octagon-fill' : type === 'warning' ? 'exclamation-triangle-fill' : 'info-circle-fill'} fs-5 me-2"></i>
        <div>${message}</div>
      </div>
    `;
    alertContainer.style.display = 'block';
  }

  function hideAlert() {
    if (alertContainer) {
      alertContainer.innerHTML = '';
      alertContainer.style.display = 'none';
    }
  }

  function hideResults() {
    if (resultContainer) {
      resultContainer.style.display = 'none';
      resultContainer.innerHTML = '';
    }
  }

  function showBackendDisconnectedMessage(serviceName) {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-custom-warning mb-4" role="alert">
        <div class="d-flex align-items-start gap-2">
          <i class="bi bi-hdd-network text-warning fs-4"></i>
          <div>
            <h6 class="fw-bold text-white mb-1">Backend Detection Service Not Connected</h6>
            <p class="mb-2 text-muted-custom" style="font-size: 0.9rem;">
              The frontend is operational, but the Python Flask backend server is not running on <code>http://127.0.0.1:5000</code>.
            </p>
            <div class="service-notice mb-0 text-white" style="font-size: 0.85rem;">
              <strong>To start backend for live ML inference:</strong>
              <div class="mt-1 code-font text-cyan">
                cd backend &amp;&amp; python app.py
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    alertContainer.style.display = 'block';
  }

  function displayEmailResult(data, subject, content) {
    if (!resultContainer) return;
    const isPhishing = data.is_phishing !== undefined ? data.is_phishing : (data.prediction === 'Phishing/Spam' || data.prediction === 'Phishing' || data.label === 1);

    let phishRiskDecimal = null;
    if (data.phishing_risk !== undefined && data.phishing_risk !== null && !isNaN(data.phishing_risk)) {
      phishRiskDecimal = parseFloat(data.phishing_risk);
    } else if (data.probabilities && data.probabilities.phishing !== undefined && data.probabilities.phishing !== null && !isNaN(data.probabilities.phishing)) {
      phishRiskDecimal = parseFloat(data.probabilities.phishing);
    } else if (data.confidence !== undefined && data.confidence !== null && !isNaN(data.confidence)) {
      const confVal = parseFloat(data.confidence) > 1.0 ? parseFloat(data.confidence) / 100.0 : parseFloat(data.confidence);
      phishRiskDecimal = isPhishing ? confVal : (1.0 - confVal);
    }

    const hasPhishRisk = phishRiskDecimal !== null;
    const phishRiskPct = hasPhishRisk ? Math.min(100, Math.max(0, phishRiskDecimal * 100)) : (isPhishing ? 95.0 : 5.0);
    const phishRiskText = phishRiskPct.toFixed(2) + '%';
    const phishRiskWidth = phishRiskPct;
    const phishRiskColor = phishRiskPct > 50 ? '#FF727A' : '#43D6A0';

    // Store into scan history
    const inputPreview = subject ? `[${subject}] ${(content || '').substring(0, 80)}...` : (content || '').substring(0, 100);
    HistoryStore.saveScan({
      type: 'Email',
      input: inputPreview,
      prediction: isPhishing ? 'Phishing' : 'Legitimate',
      score: phishRiskText,
      isPhishing: isPhishing
    });

    // Generate specific "Why This Was Detected" reasons
    const whyReasons = DetectionReasons.forEmail(subject, content, isPhishing);

    const explanation = data.explanation || (isPhishing 
      ? 'The machine learning model identified strong phishing signals including urgent action triggers, security threat vocabulary, or deceptive domain links.'
      : 'The machine learning model identified standard communication patterns with no anomalous linguistic phishing signals.');

    const recommendations = data.recommendations || (isPhishing ? [
      'Do not click any embedded links or download attachments.',
      'Verify sender email headers and domain origin.',
      'Report the message to your organization security team.',
      'Never supply credentials or financial details in response to an email.'
    ] : [
      'Message appears standard, but always exercise routine digital vigilance.',
      'Double check sender authenticity if confidential documents are requested.'
    ]);

    resultContainer.innerHTML = `
      <div class="result-card ${isPhishing ? 'is-phishing' : 'is-safe'}">
        <!-- Detection Result Header -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3" style="border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
          <div class="d-flex align-items-center gap-3">
            <div class="cyber-brand">
              <span class="brand-icon" style="background: ${isPhishing ? 'linear-gradient(135deg, #FF727A, #d4555c)' : 'linear-gradient(135deg, #43D6A0, #2db87e)'}; color: #fff; width: 42px; height: 42px; font-size: 1.2rem;">
                <i class="bi bi-${isPhishing ? 'shield-exclamation' : 'shield-check'}"></i>
              </span>
            </div>
            <div>
              <span class="text-muted-custom small text-uppercase fw-semibold" style="letter-spacing: 0.05em; font-size: 0.72rem;">Detection Result</span>
              <h4 class="mb-0 fw-bold" style="color: ${isPhishing ? '#FF727A' : '#43D6A0'}; font-size: 1.28rem;">
                ${isPhishing ? '⚠ Phishing / Spam Detected' : '✓ Legitimate / Safe Email'}
              </h4>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="cyber-badge ${isPhishing ? 'cyber-badge-danger' : 'cyber-badge-safe'}">
              <i class="bi bi-${isPhishing ? 'exclamation-circle' : 'check-circle'}"></i>
              ${isPhishing ? 'High Phishing Threat' : 'Verified Legitimate'}
            </span>
          </div>
        </div>

        <!-- Phishing Score Progress Bar -->
        <div class="p-3 mb-4 rounded-3" style="background: var(--bg-input); border: 1px solid var(--border-glass);">
          <div class="metric-row-header">
            <span class="text-muted-custom fw-medium">Phishing Score</span>
            <span id="emailPhishingScoreDisplay" class="fw-bold" style="color: ${phishRiskColor};">0.00%</span>
          </div>
          <div class="progress-custom">
            <div class="progress-bar" style="width: 0%; background: ${phishRiskColor};"></div>
          </div>
        </div>

        <!-- Why This Was Detected Section -->
        <div class="why-detected-box mb-4">
          <h6 class="fw-semibold text-white mb-3" style="font-size: 0.92rem;">
            <i class="bi bi-${isPhishing ? 'exclamation-triangle-fill text-warning' : 'check-circle-fill text-success'} me-2"></i>
            ${isPhishing ? 'Why This Was Detected' : 'Why This Was Classified as Legitimate'}
          </h6>
          <ul class="why-detected-list">
            ${whyReasons.map(r => `
              <li class="why-detected-item">
                <i class="bi bi-${isPhishing ? 'exclamation-circle text-danger' : 'check2 text-success'}"></i>
                <span>${r}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Explainable AI Summary -->
        <div class="mb-4">
          <h6 class="fw-semibold text-white mb-2" style="font-size: 0.92rem;">
            <i class="bi bi-cpu text-cyan me-2"></i>Explainable AI Summary
          </h6>
          <p class="text-muted-custom mb-0" style="font-size: 0.88rem; line-height: 1.6;">
            ${explanation}
          </p>
        </div>

        <!-- Safety Recommendations -->
        <div class="pt-3 mb-4" style="border-top: 1px solid rgba(255, 255, 255, 0.06);">
          <h6 class="fw-semibold text-white mb-2" style="font-size: 0.92rem;">
            <i class="bi bi-shield-check text-cyan me-2"></i>Safety Recommendations
          </h6>
          <ul class="list-unstyled mb-0">
            ${recommendations.map(r => `
              <li class="d-flex align-items-start gap-2 text-muted-custom mb-1" style="font-size: 0.86rem;">
                <i class="bi bi-chevron-right text-cyan mt-1" style="font-size: 0.72rem;"></i>
                <span>${r}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Scan Another Button -->
        <div class="pt-3 d-flex justify-content-between align-items-center border-top border-secondary border-opacity-25">
          <a href="history.html" class="small text-cyan text-decoration-none">
            <i class="bi bi-clock-history me-1"></i>View in Scan History
          </a>
          <button type="button" class="btn-cyber-primary scan-again-btn" id="scanAnotherEmailBtn">
            <i class="bi bi-arrow-repeat me-1"></i> Scan Another Email
          </button>
        </div>
      </div>
    `;
    resultContainer.style.display = 'block';

    // Direct smooth navigation to Detection Result
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Handle Scan Another Button Click
    const scanAnotherBtn = document.getElementById('scanAnotherEmailBtn');
    if (scanAnotherBtn) {
      scanAnotherBtn.addEventListener('click', () => {
        if (subjectInput) subjectInput.value = '';
        if (contentInput) {
          contentInput.value = '';
          contentInput.dispatchEvent(new Event('input'));
          contentInput.focus();
        }
        hideAlert();
        hideResults();
        if (scannerCard) scannerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Number Count-Up Animation
    const scoreDisplay = document.getElementById('emailPhishingScoreDisplay');
    const progressBar = resultContainer.querySelector('.progress-bar');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      if (scoreDisplay) scoreDisplay.textContent = phishRiskText;
      if (progressBar) progressBar.style.width = `${phishRiskWidth}%`;
      return;
    }

    if (progressBar) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.width = `${phishRiskWidth}%`;
        });
      });
    }

    if (scoreDisplay) {
      const animationDurationMs = 800;
      const startTime = performance.now();
      function updateNumberCount(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / animationDurationMs);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = easeOut * phishRiskPct;

        if (progress < 1) {
          scoreDisplay.textContent = currentVal.toFixed(2) + '%';
          requestAnimationFrame(updateNumberCount);
        } else {
          scoreDisplay.textContent = phishRiskText;
        }
      }
      requestAnimationFrame(updateNumberCount);
    }
  }
}

// ==========================================
// 5. URL Scanner UI Controller
// ==========================================
function initUrlScanner() {
  const form = document.getElementById('urlScanForm');
  if (!form) return;

  const urlInput = document.getElementById('urlInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const sampleMaliciousBtn = document.getElementById('sampleMaliciousBtn');
  const sampleSafeUrlBtn = document.getElementById('sampleSafeUrlBtn');
  const alertContainer = document.getElementById('alertContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultContainer = document.getElementById('resultContainer');
  const scannerCard = document.getElementById('urlScannerCard');

  let isScanning = false;

  // Clear button logic
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (isScanning) return;
      if (urlInput) urlInput.value = '';
      hideAlert();
      hideResults();
      if (urlInput) urlInput.focus();
    });
  }

  function isValidUrlFormat(string) {
    if (!string || string.trim().length === 0) return false;
    const trimmed = string.trim();
    const urlPattern = /^(https?:\/\/)?((([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(:[0-9]{1,5})?(\/.*)?$/i;
    return urlPattern.test(trimmed);
  }

  function setScannerControlsDisabled(disabled) {
    if (analyzeBtn) analyzeBtn.disabled = disabled;
    if (clearBtn) clearBtn.disabled = disabled;
    if (sampleMaliciousBtn) sampleMaliciousBtn.disabled = disabled;
    if (sampleSafeUrlBtn) sampleSafeUrlBtn.disabled = disabled;
    if (urlInput) urlInput.disabled = disabled;
  }

  async function executeUrlScan(rawUrl) {
    if (isScanning) return;
    isScanning = true;

    hideAlert();
    hideResults();

    const trimmedUrl = (rawUrl || '').trim();

    if (!trimmedUrl) {
      showAlert('danger', 'Please enter a website URL to analyze.');
      if (urlInput) urlInput.focus();
      isScanning = false;
      return;
    }

    if (!isValidUrlFormat(trimmedUrl)) {
      showAlert('warning', 'Please enter a valid web address or IP format (e.g. example.com, https://secure-login.net/auth, or 192.168.1.1).');
      isScanning = false;
      return;
    }

    setScannerControlsDisabled(true);
    setLoadingState(true, analyzeBtn, loadingIndicator, 'Inspecting URL...', scannerCard);

    try {
      const result = await ApiService.analyzeUrl(trimmedUrl);
      setLoadingState(false, analyzeBtn, loadingIndicator, 'Check URL', scannerCard);
      setScannerControlsDisabled(false);
      isScanning = false;

      if (result.success) {
        if (result.data && result.data.prediction) {
          displayUrlResult(result.data, trimmedUrl);
        } else {
          showAlert('info', `Backend connected! ${result.data.message || 'Ready for model inference.'}`);
        }
      } else {
        if (result.isNetworkError) {
          showBackendDisconnectedMessage('URL Detection Service');
        } else {
          showAlert('danger', result.error ? `Unable to analyze this URL: ${result.error}` : 'Unable to analyze this URL. Please try again.');
        }
      }
    } catch (err) {
      setLoadingState(false, analyzeBtn, loadingIndicator, 'Check URL', scannerCard);
      setScannerControlsDisabled(false);
      isScanning = false;
      showAlert('danger', 'Unable to analyze this URL. Please try again.');
    }
  }

  // Form submission handler (Manual scan)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawUrl = urlInput ? urlInput.value.trim() : '';
    await executeUrlScan(rawUrl);
  });

  // Sample URL Collections
  const MALICIOUS_URL_SAMPLES = [
    'https://appleid-cloud-security-verification-portal.example.com/login',
    'https://bit.ly/3xFakeBankVerificationLink',
    'https://urgent-security-warning-detected.example-alert.com/action/remediate',
    'https://streaming-service-subscription-renew.example-billing.com/billing',
    'https://delivery-tracking-parcel-alert.example-shipping.com/track?pkg=984120',
    'http://192.0.2.10/login/verify',
    'http://secure-login.example.com/account/verify',
    'http://paypal-login.example.com/security',
    'http://account-verification.example.com/login',
    'http://bank-security.example.com/update',
    'http://password-reset.example.com/confirm',
    'http://secure-online-banking-login.suspicious-domain.xyz/auth/signin'
  ];

  const LEGITIMATE_URL_SAMPLES = [
    'https://www.google.com',
    'https://www.microsoft.com',
    'https://www.apple.com',
    'https://www.amazon.com',
    'https://www.wikipedia.org',
    'https://www.github.com',
    'https://www.python.org',
    'https://www.mozilla.org',
    'https://www.linkedin.com',
    'https://www.cloudflare.com'
  ];

  let lastMaliciousUrlIndex = -1;
  let lastLegitimateUrlIndex = -1;

  function getRandomUrlSample(collection, lastIndex) {
    if (!collection || collection.length === 0) return null;
    if (collection.length === 1) return { sample: collection[0], index: 0 };
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * collection.length);
    } while (newIndex === lastIndex);
    return { sample: collection[newIndex], index: newIndex };
  }

  // Sample buttons: populate input without auto-scanning
  if (sampleMaliciousBtn) {
    sampleMaliciousBtn.addEventListener('click', () => {
      if (isScanning) return;
      const selected = getRandomUrlSample(MALICIOUS_URL_SAMPLES, lastMaliciousUrlIndex);
      if (selected) {
        lastMaliciousUrlIndex = selected.index;
        if (urlInput) {
          urlInput.value = selected.sample;
          urlInput.focus();
        }
        hideAlert();
        hideResults();
        if (scannerCard) scannerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  if (sampleSafeUrlBtn) {
    sampleSafeUrlBtn.addEventListener('click', () => {
      if (isScanning) return;
      const selected = getRandomUrlSample(LEGITIMATE_URL_SAMPLES, lastLegitimateUrlIndex);
      if (selected) {
        lastLegitimateUrlIndex = selected.index;
        if (urlInput) {
          urlInput.value = selected.sample;
          urlInput.focus();
        }
        hideAlert();
        hideResults();
        if (scannerCard) scannerCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  function showAlert(type, message) {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-custom-${type} d-flex align-items-center mb-4" role="alert">
        <i class="bi bi-${type === 'danger' ? 'exclamation-octagon-fill' : type === 'warning' ? 'exclamation-triangle-fill' : 'info-circle-fill'} fs-5 me-2"></i>
        <div>${message}</div>
      </div>
    `;
    alertContainer.style.display = 'block';
  }

  function hideAlert() {
    if (alertContainer) {
      alertContainer.innerHTML = '';
      alertContainer.style.display = 'none';
    }
  }

  function hideResults() {
    if (resultContainer) {
      resultContainer.style.display = 'none';
      resultContainer.innerHTML = '';
    }
  }

  function showBackendDisconnectedMessage(serviceName) {
    if (!alertContainer) return;
    alertContainer.innerHTML = `
      <div class="alert alert-custom-warning mb-4" role="alert">
        <div class="d-flex align-items-start gap-2">
          <i class="bi bi-hdd-network text-warning fs-4"></i>
          <div>
            <h6 class="fw-bold text-white mb-1">Backend Detection Service Not Connected</h6>
            <p class="mb-2 text-muted-custom" style="font-size: 0.9rem;">
              The frontend is operational, but the Python Flask backend server is not running on <code>http://127.0.0.1:5000</code>.
            </p>
            <div class="service-notice mb-0 text-white" style="font-size: 0.85rem;">
              <strong>To start backend for live ML inference:</strong>
              <div class="mt-1 code-font text-cyan">
                cd backend &amp;&amp; python app.py
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    alertContainer.style.display = 'block';
  }

  function displayUrlResult(data, urlString) {
    if (!resultContainer) return;
    const isMalicious = data.prediction === 'Malicious' || data.is_phishing === true || data.prediction === 'Phishing';
    
    const riskRaw = data.phishing_percentage !== undefined && data.phishing_percentage !== null
      ? parseFloat(data.phishing_percentage)
      : (data.risk_percentage !== undefined && data.risk_percentage !== null 
        ? parseFloat(data.risk_percentage) 
        : (data.phishing_probability !== undefined && data.phishing_probability !== null 
          ? parseFloat(data.phishing_probability) * 100 
          : (data.phishing_risk !== undefined && data.phishing_risk !== null ? parseFloat(data.phishing_risk) * 100 : 0)));
    const riskClamped = Math.min(100, Math.max(0, isNaN(riskRaw) ? 0 : riskRaw));
    const riskText = riskClamped.toFixed(2) + '%';
    const riskWidth = riskClamped;
    const barColor = isMalicious ? '#FF727A' : '#43D6A0';

    // Store into scan history
    HistoryStore.saveScan({
      type: 'URL',
      input: urlString,
      prediction: isMalicious ? 'Phishing' : 'Legitimate',
      score: riskText,
      isPhishing: isMalicious
    });

    // Extract exact "Why This Was Detected" reasons from model features
    const whyReasons = DetectionReasons.forUrl(urlString, isMalicious, data.features);

    const explanation = data.explanation || (isMalicious 
      ? 'The deep learning model flagged high phishing risk due to lexical anomalies: multiple subdomains, suspicious non-standard TLD, brand keyword spoofing, or absence of trusted SSL lineage.'
      : 'The lexical and domain characteristics correspond with established legitimate patterns and trusted authority structures.');

    const recommendations = data.recommendations || (isMalicious ? [
      'Do not visit or enter credentials on this destination.',
      'Verify the official root domain directly via search engines.',
      'Check SSL certificate details and look out for typo-squatting.',
      'Add URL to enterprise security blocklists.'
    ] : [
      'The URL structure appears standard and legitimate.',
      'Always verify that HTTPS encryption is active before submitting sensitive info.'
    ]);

    resultContainer.innerHTML = `
      <div class="result-card ${isMalicious ? 'is-phishing' : 'is-safe'}">
        <!-- Detection Result Header -->
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3" style="border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
          <div class="d-flex align-items-center gap-3">
            <div class="cyber-brand">
              <span class="brand-icon" style="background: ${isMalicious ? 'linear-gradient(135deg, #FF727A, #d4555c)' : 'linear-gradient(135deg, #43D6A0, #2db87e)'}; color: #fff; width: 42px; height: 42px; font-size: 1.2rem;">
                <i class="bi bi-${isMalicious ? 'shield-exclamation' : 'shield-check'}"></i>
              </span>
            </div>
            <div>
              <span class="text-muted-custom small text-uppercase fw-semibold" style="letter-spacing: 0.05em; font-size: 0.72rem;">Detection Result</span>
              <h4 class="mb-0 fw-bold" style="color: ${isMalicious ? '#FF727A' : '#43D6A0'}; font-size: 1.28rem;">
                ${isMalicious ? '⚠ Phishing Detected' : '✓ Legitimate URL'}
              </h4>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="cyber-badge ${isMalicious ? 'cyber-badge-danger' : 'cyber-badge-safe'}">
              <i class="bi bi-${isMalicious ? 'exclamation-circle' : 'check-circle'}"></i>
              ${isMalicious ? 'Phishing Risk Detected' : 'Legitimate Destination'}
            </span>
          </div>
        </div>

        <div class="p-3 mb-4 rounded-3" style="background: var(--bg-input); border: 1px solid var(--border-glass);">
          <div class="small text-muted-custom mb-1">Target Scanned (Static Reference):</div>
          <div class="code-font text-cyan text-break" style="font-size: 0.92rem;">${escapeHtml(urlString)}</div>
        </div>

        <!-- Phishing Score Metric -->
        <div class="mb-4">
          <div class="p-3 rounded-3" style="background: var(--bg-input); border: 1px solid var(--border-glass);">
            <div class="metric-row-header">
              <span class="text-muted-custom fw-medium">Phishing Score</span>
              <span id="urlPhishingScoreDisplay" class="fw-bold" style="color: ${barColor};">0.00%</span>
            </div>
            <div class="progress-custom">
              <div class="progress-bar" style="width: 0%; background: ${barColor};"></div>
            </div>
          </div>
        </div>

        <!-- Why This Was Detected Section -->
        <div class="why-detected-box mb-4">
          <h6 class="fw-semibold text-white mb-3" style="font-size: 0.92rem;">
            <i class="bi bi-${isMalicious ? 'exclamation-triangle-fill text-warning' : 'check-circle-fill text-success'} me-2"></i>
            ${isMalicious ? 'Why This Was Detected' : 'Why This Was Classified as Legitimate'}
          </h6>
          <ul class="why-detected-list">
            ${whyReasons.map(r => `
              <li class="why-detected-item">
                <i class="bi bi-${isMalicious ? 'exclamation-circle text-danger' : 'check2 text-success'}"></i>
                <span>${r}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Explainable AI Summary -->
        <div class="mb-4">
          <h6 class="fw-semibold text-white mb-2" style="font-size: 0.92rem;"><i class="bi bi-cpu text-cyan me-2"></i>Explainable AI Summary</h6>
          <p class="text-muted-custom mb-0" style="font-size: 0.88rem; line-height: 1.6;">
            ${explanation}
          </p>
        </div>

        <!-- Safety Recommendations -->
        <div class="pt-3 mb-4" style="border-top: 1px solid rgba(255, 255, 255, 0.06);">
          <h6 class="fw-semibold text-white mb-2" style="font-size: 0.92rem;"><i class="bi bi-shield-check text-cyan me-2"></i>Safety Recommendations</h6>
          <ul class="list-unstyled mb-0">
            ${recommendations.map(r => `
              <li class="d-flex align-items-start gap-2 text-muted-custom mb-1" style="font-size: 0.86rem;">
                <i class="bi bi-chevron-right text-cyan mt-1" style="font-size: 0.72rem;"></i>
                <span>${r}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Scan Another Button -->
        <div class="pt-3 d-flex justify-content-between align-items-center border-top border-secondary border-opacity-25">
          <a href="history.html" class="small text-cyan text-decoration-none">
            <i class="bi bi-clock-history me-1"></i>View in Scan History
          </a>
          <button type="button" class="btn-cyber-primary scan-again-btn" id="scanAnotherUrlBtn">
            <i class="bi bi-arrow-repeat me-1"></i> Scan Another URL
          </button>
        </div>
      </div>
    `;
    resultContainer.style.display = 'block';

    // Direct smooth scroll to result
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Handle Scan Another Button Click
    const scanAnotherBtn = document.getElementById('scanAnotherUrlBtn');
    if (scanAnotherBtn) {
      scanAnotherBtn.addEventListener('click', () => {
        if (urlInput) {
          urlInput.value = '';
          urlInput.focus();
        }
        hideAlert();
        hideResults();
        if (scannerCard) scannerCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scoreDisplay = document.getElementById('urlPhishingScoreDisplay');
    const progressBar = resultContainer.querySelector('.progress-bar');

    if (prefersReducedMotion) {
      if (scoreDisplay) scoreDisplay.textContent = riskText;
      if (progressBar) progressBar.style.width = `${riskWidth}%`;
      return;
    }

    if (progressBar) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.width = `${riskWidth}%`;
        });
      });
    }

    if (scoreDisplay) {
      const animationDurationMs = 850;
      const startTime = performance.now();

      function updateNumberCount(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / animationDurationMs);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = easeOut * riskClamped;

        if (progress < 1) {
          scoreDisplay.textContent = currentVal.toFixed(2) + '%';
          requestAnimationFrame(updateNumberCount);
        } else {
          scoreDisplay.textContent = riskText;
        }
      }

      requestAnimationFrame(updateNumberCount);
    }
  }
}

// ==========================================
// 6. Dashboard Controller (index.html)
// ==========================================
function initDashboard() {
  const dashTotal = document.getElementById('dashTotalScans');
  const dashPhish = document.getElementById('dashPhishScans');
  const dashLegit = document.getElementById('dashLegitScans');
  const dashAvg = document.getElementById('dashAvgRisk');
  const heroLatestScanBox = document.getElementById('heroLatestScanBox');

  if (dashTotal && dashPhish && dashLegit && dashAvg) {
    const stats = HistoryStore.getStats();
    dashTotal.textContent = stats.total;
    dashPhish.textContent = stats.phishing;
    dashLegit.textContent = stats.legit;
    dashAvg.textContent = stats.avgScore;
  }

  if (heroLatestScanBox) {
    const latest = HistoryStore.getLatest();
    if (latest) {
      const isPhish = latest.isPhishing;
      heroLatestScanBox.innerHTML = `
        <div class="rounded-3 p-3 mb-3" style="background: rgba(8, 13, 16, 0.85); border: 1px solid ${isPhish ? 'rgba(255, 114, 122, 0.3)' : 'rgba(67, 214, 160, 0.3)'};">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="badge ${isPhish ? 'bg-danger' : 'bg-success'} bg-opacity-25 ${isPhish ? 'text-danger' : 'text-success'} border ${isPhish ? 'border-danger' : 'border-success'} border-opacity-50">
              <i class="bi bi-${isPhish ? 'exclamation-octagon-fill' : 'shield-check'} me-1"></i>${isPhish ? '⚠ Phishing Detected' : '✓ Legitimate ' + latest.type}
            </span>
            <span class="small text-muted-custom">${escapeHtml(latest.timestamp)}</span>
          </div>
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="small text-muted-custom">Phishing Score:</span>
            <span class="fw-bold" style="color: ${isPhish ? '#FF727A' : '#43D6A0'};">${escapeHtml(latest.score)}</span>
          </div>
          <div class="code-font text-cyan small text-truncate" title="${escapeHtml(latest.input)}">
            <span class="text-dim">&gt;</span> ${escapeHtml(latest.input)}
          </div>
        </div>
      `;
    }
  }
}

// ==========================================
// 7. History Page Controller (history.html)
// ==========================================
function initHistoryPage() {
  const container = document.getElementById('historyListContainer');
  if (!container) return;

  const countBadge = document.getElementById('historyCount');
  const clearBtn = document.getElementById('clearHistoryBtn');
  const filterBtns = document.querySelectorAll('#historyFilterGroup .btn-cyber-filter');
  const histStatTotal = document.getElementById('histStatTotal');
  const histStatPhish = document.getElementById('histStatPhish');
  const histStatLegit = document.getElementById('histStatLegit');
  const histStatAvg = document.getElementById('histStatAvg');

  let activeFilter = 'all';

  function renderHistory() {
    const stats = HistoryStore.getStats();
    if (histStatTotal) histStatTotal.textContent = stats.total;
    if (histStatPhish) histStatPhish.textContent = stats.phishing;
    if (histStatLegit) histStatLegit.textContent = stats.legit;
    if (histStatAvg) histStatAvg.textContent = stats.avgScore;

    let items = HistoryStore.getHistory();

    if (activeFilter === 'URL') {
      items = items.filter(h => h.type === 'URL');
    } else if (activeFilter === 'Email') {
      items = items.filter(h => h.type === 'Email');
    } else if (activeFilter === 'Phishing') {
      items = items.filter(h => h.isPhishing);
    } else if (activeFilter === 'Legitimate') {
      items = items.filter(h => !h.isPhishing);
    }

    if (countBadge) countBadge.textContent = items.length;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-inbox text-dim" style="font-size: 3rem;"></i>
          <h5 class="fw-bold text-white mt-3 mb-1">No Scan Records Found</h5>
          <p class="text-muted-custom small mb-4">
            ${activeFilter === 'all' ? 'You have not scanned any emails or URLs yet. Run your first inspection to start recording history.' : 'No records match the selected filter criteria.'}
          </p>
          <div class="d-flex justify-content-center gap-2">
            <a href="email.html" class="btn-cyber-primary btn-sm text-decoration-none">
              <i class="bi bi-envelope-fill me-1"></i> Scan an Email
            </a>
            <a href="url.html" class="btn-cyber-secondary btn-sm text-decoration-none">
              <i class="bi bi-globe2 me-1"></i> Check a URL
            </a>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(item => {
      const isPhish = item.isPhishing;
      const typeBadgeClass = item.type === 'URL' ? 'cyber-badge-cyan' : 'cyber-badge-blue';
      const statusBadgeClass = isPhish ? 'cyber-badge-danger' : 'cyber-badge-safe';
      const statusIcon = isPhish ? 'exclamation-octagon-fill' : 'shield-check';

      return `
        <div class="history-record-item ${isPhish ? 'is-phishing' : 'is-legit'}">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
            <div class="d-flex align-items-center gap-2">
              <span class="cyber-badge ${typeBadgeClass}">
                <i class="bi bi-${item.type === 'URL' ? 'link-45deg' : 'envelope-fill'}"></i> ${item.type}
              </span>
              <span class="cyber-badge ${statusBadgeClass}">
                <i class="bi bi-${statusIcon}"></i> ${item.prediction}
              </span>
            </div>
            <div class="d-flex align-items-center gap-3">
              <span class="small text-muted-custom"><i class="bi bi-clock me-1"></i>${escapeHtml(item.timestamp)}</span>
              <span class="fw-bold" style="color: ${isPhish ? '#FF727A' : '#43D6A0'}; font-size: 1rem;">
                ${escapeHtml(item.score)}
              </span>
            </div>
          </div>
          <div class="code-font text-cyan small text-break mb-0" style="font-size: 0.88rem;">
            ${escapeHtml(item.input)}
          </div>
        </div>
      `;
    }).join('');
  }

  // Filter button clicks
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      renderHistory();
    });
  });

  // Clear History
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all scan history records from your browser?')) {
        HistoryStore.clearHistory();
        renderHistory();
      }
    });
  }

  renderHistory();
}

// ==========================================
// 8. Shared Helpers & UI Utilities
// ==========================================
function setLoadingState(isLoading, buttonEl, indicatorEl, statusText = 'Analyzing...', cardEl = null) {
  if (buttonEl) {
    buttonEl.disabled = isLoading;
    if (isLoading) {
      buttonEl.dataset.originalHtml = buttonEl.innerHTML;
      buttonEl.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${escapeHtml(statusText)}`;
    } else {
      if (buttonEl.dataset.originalHtml) {
        buttonEl.innerHTML = buttonEl.dataset.originalHtml;
      }
    }
  }

  if (cardEl) {
    if (isLoading) {
      cardEl.classList.add('scanning-active-box');
    } else {
      cardEl.classList.remove('scanning-active-box');
    }
  }

  if (indicatorEl) {
    indicatorEl.style.display = isLoading ? 'flex' : 'none';
  }
}

function escapeHtml(string) {
  if (!string) return '';
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

// ==========================================
// 9. Initialize on DOMContentLoaded
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
  initEmailScanner();
  initUrlScanner();
  initHistoryPage();
});
