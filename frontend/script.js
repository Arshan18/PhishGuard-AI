/**
 * PhishGuard AI — Frontend Application Logic
 * College Project: AI-Based Phishing Email and Malicious URL Detection
 * 
 * Handles client-side validation, UI state transitions, and API communication with Flask backend.
 */

// Global Configuration
const CONFIG = {
  API_BASE_URL: 'http://127.0.0.1:5000', // Default local Flask server URL
  API_TIMEOUT_MS: 5000
};

// ==========================================
// 1. Core API Service Layer (Separated)
// ==========================================
const ApiService = {
  /**
   * Check if backend Flask server is reachable
   */
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

  /**
   * Request Email Phishing ML Analysis from Flask Backend
   */
  async analyzeEmail(subject, content) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/scan-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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

  /**
   * Request Malicious URL ML Analysis from Flask Backend
   */
  async analyzeUrl(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/analyze-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
// 2. Email Scanner UI Controller
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

  // Character counter helper
  if (contentInput && charCounter) {
    contentInput.addEventListener('input', () => {
      const length = contentInput.value.length;
      charCounter.textContent = `${length} characters`;
    });
  }

  // Clear button logic
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
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
    hideAlert();
    hideResults();

    const subject = subjectInput ? subjectInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';

    // Empty input validation
    if (!content) {
      showAlert('danger', 'Please enter or paste the email body text to perform analysis.');
      if (contentInput) contentInput.focus();
      return;
    }

    if (content.length < 15) {
      showAlert('warning', 'Email text is too short for reliable ML token analysis. Please provide at least 15 characters.');
      return;
    }

    // Show Loading State with active card scan animation
    const scannerCard = document.getElementById('emailScannerCard');
    setLoadingState(true, analyzeBtn, loadingIndicator, 'Analyzing email...', scannerCard);

    // Call API Layer
    const result = await ApiService.analyzeEmail(subject, content);

    // Stop Loading State
    setLoadingState(false, analyzeBtn, loadingIndicator, 'Analyze Email', scannerCard);

    if (result.success) {
      // If backend returns a classification model result
      if (result.data && result.data.prediction) {
        displayEmailResult(result.data);
      } else {
        // Backend connected but model training pipeline message
        showAlert('info', `Backend connected! ${result.data.message || 'Ready for model inference.'}`);
      }
    } else {
      // Clear message stating backend connection is needed
      if (result.isNetworkError) {
        showBackendDisconnectedMessage('Email Detection Service');
      } else {
        showAlert('danger', `Analysis Error: ${result.error}`);
      }
    }
  });

  // ==========================================
  // Sample Email Collections & Random Selector
  // ==========================================
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
    },
    {
      subject: 'Exclusive Investment: Earn 350% Weekly Returns with AI Trading',
      content: 'Dear Investor,\n\nOur automated cryptocurrency trading algorithm guarantees a 350% return on investment every week with zero risk. Deposit a minimum of 0.05 BTC today to start generating automated passive income:\n\nhttp://instant-crypto-yield-matrix.xyz/signup\n\nLimited spots available for early access investors.'
    },
    {
      subject: 'HR Notice: Update Direct Deposit Details for Next Payroll',
      content: 'All Staff,\n\nDue to our annual banking system migration, all employees must verify and re-enter their direct deposit routing details before Friday to avoid payroll delays:\n\nhttp://employee-portal-hr-payroll.xyz/direct-deposit\n\nThank you for your prompt cooperation.\nHuman Resources Dept'
    },
    {
      subject: 'Critical Alert: Cloud Storage Full - Incoming Emails Blocked',
      content: 'Your cloud storage mailbox has reached 99.8% capacity. Incoming emails are currently being held and will be permanently bounced within 24 hours. Click below to upgrade your quota and release pending messages:\n\nhttp://cloud-mailbox-storage-upgrade.xyz/verify\n\nMailbox Admin Team'
    },
    {
      subject: 'Notice of Tax Refund Status: $842.50 Pending Approval',
      content: 'Dear Taxpayer,\n\nAfter recalculating your recent annual tax assessment, our revenue service identified an overpayment of $842.50 in your favor. Submit your refund claim form and banking details online to receive direct deposit:\n\nhttp://tax-refund-claim-portal.xyz/process\n\nRevenue Service Department'
    },
    {
      subject: 'Copyright Infringement Notice - Account Scheduled for Deletion',
      content: 'We received multiple copyright infringement reports regarding media posted on your profile. If you believe this is an error, submit an appeal within 12 hours or your account will be permanently deactivated:\n\nhttp://social-account-appeal-center.xyz/appeal\n\nSecurity and Compliance Center'
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
    },
    {
      subject: 'Weekly Project Status: Milestone 3 Completed Ahead of Schedule',
      content: 'Hi everyone,\n\nI am pleased to share that Milestone 3 for the client portal redesign has been completed and passed QA testing today. The staging deployment is scheduled for Tuesday morning.\n\nPlease review the attached release notes when you have a moment.\n\nThanks,\nDavid Clark\nEngineering Lead'
    },
    {
      subject: 'Upcoming Public Holiday Office Closure Schedule',
      content: 'Dear Colleagues,\n\nPlease note that our offices will be closed on Monday in observance of the upcoming public holiday. Normal business operations and customer support services will resume on Tuesday at 8:30 AM.\n\nHave a safe and restful long weekend!\n\nHuman Resources'
    },
    {
      subject: 'Support Ticket #78219 - Issue Resolved: VPN Access Configured',
      content: 'Hello Kevin,\n\nYour support ticket regarding the VPN certificate renewal has been resolved. The updated configuration profile has been applied to your workstation.\n\nPlease test your remote login and reply to this thread if you experience any further connection issues.\n\nBest,\nIT Helpdesk Support'
    },
    {
      subject: 'CS 401: Lecture Notes & Assignment 2 Submission Deadline',
      content: 'Dear Students,\n\nThe slides from yesterday\'s lecture on Distributed Systems and the grading rubric for Assignment 2 are now posted on the course portal. The assignment is due next Friday at 11:59 PM.\n\nOffice hours will be held on Wednesday from 3:00 PM to 5:00 PM in Room 410.\n\nProf. Williams'
    },
    {
      subject: 'Flight Booking Confirmation: SFO to JFK - Booking Reference #KL982Q',
      content: 'Dear Passenger,\n\nYour flight reservation is confirmed. Flight AA-240 departs San Francisco (SFO) on Friday, Nov 14 at 8:15 AM and arrives at New York (JFK) at 4:45 PM. Seat assignment: 14B (Window).\n\nOnline check-in opens 24 hours prior to departure.\n\nSafe travels,\nAirline Reservations'
    },
    {
      subject: 'Draft Q4 Budget Estimates - Please Review by Wednesday',
      content: 'Hi Maria,\n\nI have drafted the departmental budget estimates for Q4 taking into account our revised software tooling and cloud infrastructure expenses. The spreadsheet is available on our shared team drive.\n\nPlease review the line items and send over any adjustments before our Wednesday finance call.\n\nThanks,\nRobert'
    },
    {
      subject: 'Invitation: Technical Workshop on Container Security Best Practices',
      content: 'Hi everyone,\n\nYou are invited to attend our upcoming internal engineering workshop on container hardening and vulnerability scanning. The session will take place on Thursday at 4:00 PM via Google Meet.\n\nA calendar invite with the meeting link has been sent to your inbox.\n\nBest regards,\nDevOps Team'
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

  // Sample Loader Buttons for Demonstration
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
        }
        hideAlert();
        hideResults();
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
        }
        hideAlert();
        hideResults();
      }
    });
  }

  // Helpers
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

  function displayEmailResult(data) {
    if (!resultContainer) return;
    const isPhishing = data.is_phishing !== undefined ? data.is_phishing : (data.prediction === 'Phishing/Spam' || data.prediction === 'Phishing' || data.label === 1);

    // Phishing Risk: Decimal (0.0 - 1.0) specifically for phishing class
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
    const phishRiskPct = hasPhishRisk ? Math.min(100, Math.max(0, phishRiskDecimal * 100)) : null;
    const phishRiskText = phishRiskPct !== null ? phishRiskPct.toFixed(2) + '%' : 'Unavailable';
    const phishRiskWidth = phishRiskPct !== null ? phishRiskPct : 0;

    // Status colors
    const phishRiskColor = (phishRiskPct !== null ? phishRiskPct : (isPhishing ? 90 : 10)) > 50 ? '#FF727A' : '#43D6A0';

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
                ${isPhishing ? 'Phishing / Spam Detected' : 'Legitimate / Safe Email'}
              </h4>
            </div>
          </div>
          <div>
            <span class="cyber-badge ${isPhishing ? 'cyber-badge-danger' : 'cyber-badge-safe'}">
              <i class="bi bi-${isPhishing ? 'exclamation-circle' : 'check-circle'}"></i>
              ${isPhishing ? 'High Phishing Threat' : 'Verified Legitimate'}
            </span>
          </div>
        </div>

        <!-- Single Phishing Risk Indicator -->
        <div class="p-3 mb-4 rounded-3" style="background: var(--bg-input); border: 1px solid var(--border-glass);">
          <div class="metric-row-header">
            <span class="text-muted-custom fw-medium">Phishing Risk</span>
            <span class="fw-bold" style="color: ${phishRiskColor};">${phishRiskText}</span>
          </div>
          <div class="progress-custom">
            <div class="progress-bar" style="width: 0%; background: ${phishRiskColor};"></div>
          </div>
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
        <div class="pt-3" style="border-top: 1px solid rgba(255, 255, 255, 0.06);">
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
      </div>
    `;
    resultContainer.style.display = 'block';

    // Smoothly animate progress-bar width to actual ML model percentage
    const progressBar = resultContainer.querySelector('.progress-bar');
    if (progressBar) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.width = `${phishRiskWidth}%`;
        });
      });
    }
  }
}

// ==========================================
// 3. URL Scanner UI Controller
// ==========================================
function initUrlScanner() {
  const form = document.getElementById('urlScanForm');
  if (!form) return;

  const urlInput = document.getElementById('urlInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const alertContainer = document.getElementById('alertContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultContainer = document.getElementById('resultContainer');

  // Clear button logic
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (urlInput) urlInput.value = '';
      hideAlert();
      hideResults();
      if (urlInput) urlInput.focus();
    });
  }

  // URL input validation helper
  function isValidUrlFormat(string) {
    if (!string || string.trim().length === 0) return false;
    const trimmed = string.trim();
    // Support URLs with or without http/https, domain or IPv4
    const urlPattern = /^(https?:\/\/)?((([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(:[0-9]{1,5})?(\/.*)?$/i;
    return urlPattern.test(trimmed);
  }

  // Form submission / Analysis logic
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    hideResults();

    const rawUrl = urlInput ? urlInput.value.trim() : '';

    // Empty input validation
    if (!rawUrl) {
      showAlert('danger', 'Please enter a website URL to analyze.');
      if (urlInput) urlInput.focus();
      return;
    }

    // Format validation
    if (!isValidUrlFormat(rawUrl)) {
      showAlert('warning', 'Please enter a valid web address or IP format (e.g. example.com, https://secure-login.net/auth, or 192.168.1.1).');
      return;
    }

    // Show Loading State with active card scan animation
    const scannerCard = document.getElementById('urlScannerCard');
    setLoadingState(true, analyzeBtn, loadingIndicator, 'Inspecting URL...', scannerCard);

    // Call API Layer
    const result = await ApiService.analyzeUrl(rawUrl);

    // Stop Loading State
    setLoadingState(false, analyzeBtn, loadingIndicator, 'Check URL', scannerCard);

    if (result.success) {
      if (result.data && result.data.prediction) {
        displayUrlResult(result.data, rawUrl);
      } else {
        showAlert('info', `Backend connected! ${result.data.message || 'Ready for model inference.'}`);
      }
    } else {
      if (result.isNetworkError) {
        showBackendDisconnectedMessage('URL Detection Service');
      } else {
        showAlert('danger', `Analysis Error: ${result.error}`);
      }
    }
  });

  // Sample Loader Buttons for Demonstration
  const sampleMaliciousBtn = document.getElementById('sampleMaliciousBtn');
  const sampleSafeUrlBtn = document.getElementById('sampleSafeUrlBtn');

  if (sampleMaliciousBtn) {
    sampleMaliciousBtn.addEventListener('click', () => {
      if (urlInput) {
        urlInput.value = 'http://paypal-account-security-update.suspicious-domain.xyz/login/verify.php';
        hideAlert();
      }
    });
  }

  if (sampleSafeUrlBtn) {
    sampleSafeUrlBtn.addEventListener('click', () => {
      if (urlInput) {
        urlInput.value = 'https://www.github.com/security';
        hideAlert();
      }
    });
  }

  // Helpers
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
    
    // Confidence calculation & formatting
    const hasConfidence = data.confidence !== null && data.confidence !== undefined && !isNaN(data.confidence);
    const confidenceRaw = hasConfidence ? Math.min(100, Math.max(0, parseFloat(data.confidence))) : null;
    const confidenceText = confidenceRaw !== null ? confidenceRaw.toFixed(2) + '%' : 'Unavailable';
    const confidenceWidth = confidenceRaw !== null ? confidenceRaw : 0;

    const barColor = isMalicious ? '#FF727A' : '#43D6A0';
    const barGlow = isMalicious ? 'rgba(255, 114, 122, 0.3)' : 'rgba(67, 214, 160, 0.3)';

    const explanation = data.explanation || (isMalicious 
      ? 'The model flagged high risk due to lexical anomalies: multiple subdomains, suspicious non-standard TLD, brand keyword spoofing, or absence of trusted SSL lineage.'
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

    // Sanitized display of URL (never auto-open or clickable to prevent accidental execution)
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
                ${data.prediction || (isMalicious ? 'Malicious / Phishing URL' : 'Legitimate / Safe URL')}
              </h4>
            </div>
          </div>
          <div>
            <span class="cyber-badge ${isMalicious ? 'cyber-badge-danger' : 'cyber-badge-safe'}">
              <i class="bi bi-${isMalicious ? 'exclamation-circle' : 'check-circle'}"></i>
              ${isMalicious ? 'High Risk Threat' : 'Safe Destination'}
            </span>
          </div>
        </div>

        <div class="p-3 mb-4 rounded-3" style="background: var(--bg-input); border: 1px solid var(--border-glass);">
          <div class="small text-muted-custom mb-1">Target Scanned (Static Reference):</div>
          <div class="code-font text-cyan text-break" style="font-size: 0.92rem;">${escapeHtml(urlString)}</div>
        </div>

        <div class="mb-4">
          <div class="p-3 rounded-3" style="background: var(--bg-input); border: 1px solid var(--border-glass);">
            <div class="metric-row-header">
              <span class="text-muted-custom fw-medium">Model Confidence</span>
              <span class="fw-bold" style="color: ${barColor};">${confidenceText}</span>
            </div>
            <div class="progress-custom">
              <div class="progress-bar" style="width: 0%; background: ${barColor};"></div>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <h6 class="fw-semibold text-white mb-2" style="font-size: 0.92rem;"><i class="bi bi-cpu text-cyan me-2"></i>Explainable AI Summary</h6>
          <p class="text-muted-custom mb-0" style="font-size: 0.88rem; line-height: 1.6;">
            ${explanation}
          </p>
        </div>

        <div class="pt-3" style="border-top: 1px solid rgba(255, 255, 255, 0.06);">
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
      </div>
    `;
    resultContainer.style.display = 'block';

    // Smoothly animate progress-bar width to actual ML model percentage
    const progressBar = resultContainer.querySelector('.progress-bar');
    if (progressBar) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          progressBar.style.width = `${confidenceWidth}%`;
        });
      });
    }
  }
}

// ==========================================
// 4. Shared Helpers & UI Utilities
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
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

// ==========================================
// 5. Initialize on DOMContentLoaded
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initEmailScanner();
  initUrlScanner();
});
