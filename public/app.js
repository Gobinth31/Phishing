/**
 * PhishGuard AI - Client Controller
 */

// Sample scenarios dictionary for immediate offline / quick access
const SAMPLE_PRESETS = {
  'urgent-bank': {
    subject: 'URGENT: Unauthorized access detected on your bank account',
    body: 'Attention Account Holder,\n\nOur fraud prevention security team has detected multiple unauthorized login attempts on your account. Your online access will be permanently suspended within 24 hours to prevent fraud.\n\nPlease click the secure verification link below immediately to confirm your identity and reset your PIN/password:\nhttps://auth-security-verification.online/restore-access\n\nFailure to comply will result in an immediate security lock.\n\nFraud Prevention Team,\nAlex Martinez'
  },
  'password-reset': {
    subject: 'Security Alert: Mandatory Microsoft 365 Password Update',
    body: 'Hello User,\n\nYour organization password for Office 365 is set to expire today. To keep your access active without interruption, you must synchronize your password immediately.\n\nVisit: https://portal-microsoft-auth365.net/sync-login\nEnter your username, current password, and 2FA code to complete verification.\n\nSincerely,\nGlobal IT Support Desk'
  },
  'refund-lure': {
    subject: 'Notification: Approved Tax / Payment Refund of $8,450.00',
    body: 'Dear Taxpayer,\n\nCongratulations! You have an uncollected tax rebate and financial refund totaling $8,450.00 waiting in your account.\n\nTo release these funds directly to your credit card or bank account today, fill out the confidential claims form:\nhttps://irs-refund-portal-claim.cc/collect-sum\n\nThis claim link will expire at midnight tonight.\n\nFinancial Compliance Bureau'
  },
  'meeting-notes': {
    subject: 'Meeting Notes & Action Items - Q3 Strategy Review',
    body: 'Hi Team,\n\nThanks for participating in our Q3 planning session earlier today. I have attached the meeting notes and roadmap milestones.\n\nPlease review slides 4-8 and add your departmental feedback to the shared doc before our sync next Wednesday.\n\nBest regards,\nTaylor Khan\nProduct Operations'
  },
  'doc-review': {
    subject: 'Draft Architecture Proposal for Feedback',
    body: 'Hi team,\n\nI have finished drafting the RFC for the new threat intelligence logging pipeline. Please take a look at the pull request when you have a moment this week.\n\nLet me know if you have any questions or suggestions.\n\nThanks,\nJamie Singh'
  }
};

let currentResult = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  checkBackendHealth();
  setupEventListeners();
}

// Health Check to determine backend status & active AI engine
async function checkBackendHealth() {
  const engineStatusText = document.getElementById('engine-status-text');
  const systemStatus = document.getElementById('system-status');

  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    engineStatusText.textContent = `${data.engine || 'AI Engine'} Active`;
    systemStatus.classList.remove('status-offline');
  } catch (error) {
    console.warn('Backend health check note:', error.message);
    engineStatusText.textContent = 'Threat Engine Ready';
  }
}

// Setup Event Listeners
function setupEventListeners() {
  const form = document.getElementById('phishing-form');
  const subjectInput = document.getElementById('email-subject');
  const bodyInput = document.getElementById('email-body');
  const clearBtn = document.getElementById('clear-btn');
  const copyReportBtn = document.getElementById('copy-report-btn');
  const resetScanBtn = document.getElementById('reset-scan-btn');
  const bodyCharCount = document.getElementById('body-char-count');

  // Character counter
  bodyInput.addEventListener('input', () => {
    const len = bodyInput.value.length;
    bodyCharCount.textContent = `${len} char${len === 1 ? '' : 's'}`;
  });

  // Sample Preset Buttons
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleId = chip.getAttribute('data-sample-id');
      loadPreset(sampleId);
    });
  });

  // Form Submit
  form.addEventListener('submit', handleFormSubmit);

  // Clear Button
  clearBtn.addEventListener('click', () => {
    subjectInput.value = '';
    bodyInput.value = '';
    bodyCharCount.textContent = '0 chars';
    subjectInput.focus();
  });

  // Reset / New Scan Button
  resetScanBtn.addEventListener('click', () => {
    const resultsCard = document.getElementById('results-card');
    resultsCard.classList.add('hidden');
    subjectInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Copy Report Button
  copyReportBtn.addEventListener('click', copySecurityReport);
}

// Load Preset
function loadPreset(sampleId) {
  const preset = SAMPLE_PRESETS[sampleId];
  if (!preset) return;

  const subjectInput = document.getElementById('email-subject');
  const bodyInput = document.getElementById('email-body');
  const bodyCharCount = document.getElementById('body-char-count');

  subjectInput.value = preset.subject;
  bodyInput.value = preset.body;
  bodyCharCount.textContent = `${preset.body.length} chars`;

  // Flash highlight input card
  const inputCard = document.querySelector('.input-card');
  inputCard.style.borderColor = 'var(--accent-cyan)';
  setTimeout(() => {
    inputCard.style.borderColor = '';
  }, 400);
}

// Handle Form Submit
async function handleFormSubmit(e) {
  e.preventDefault();

  const subject = document.getElementById('email-subject').value.trim();
  const body = document.getElementById('email-body').value.trim();
  const analyzeBtn = document.getElementById('analyze-btn');
  const scanningState = document.getElementById('scanning-state');
  const resultsCard = document.getElementById('results-card');

  if (!subject && !body) {
    alert('Please enter a subject or email body to analyze.');
    return;
  }

  // UI state: Scanning
  resultsCard.classList.add('hidden');
  scanningState.classList.remove('hidden');
  analyzeBtn.disabled = true;

  const emailText = `Subject: ${subject}\n\n${body}`;

  try {
    const response = await fetch('/api/detect-phishing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emailText, subject, body })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned error ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success' && data.result) {
      currentResult = {
        ...data.result,
        meta: data.meta || {},
        analyzedSubject: subject,
        analyzedBody: body
      };
      renderResults(currentResult);
    } else {
      throw new Error(data.error || 'Invalid analysis response.');
    }
  } catch (error) {
    console.error('Scan Error:', error);
    alert(`Analysis error: ${error.message}`);
  } finally {
    scanningState.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
}

// Render Results to UI
function renderResults(res) {
  const resultsCard = document.getElementById('results-card');
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictIcon = document.getElementById('verdict-icon');
  const riskBadge = document.getElementById('risk-level-badge');
  const verdictLabel = document.getElementById('verdict-label');
  const verdictSummary = document.getElementById('verdict-summary');
  const confidencePercent = document.getElementById('confidence-percentage');
  const threatMeterFill = document.getElementById('threat-meter-fill');
  const indicatorsGrid = document.getElementById('indicators-grid');
  const reasonsList = document.getElementById('reasons-list');
  const recommendationsList = document.getElementById('recommendations-list');
  const metaEngine = document.getElementById('meta-engine');
  const metaTime = document.getElementById('meta-time');

  // Reset classes
  resultsCard.classList.remove('hidden', 'phishing', 'suspicious', 'legitimate');

  const scorePct = Math.round((res.confidenceScore ?? (res.isPhishing ? 0.95 : 0.05)) * 100);
  confidencePercent.textContent = `${scorePct}%`;
  threatMeterFill.style.width = `${scorePct}%`;

  const riskLevel = (res.riskLevel || (res.isPhishing ? 'HIGH' : 'SAFE')).toUpperCase();
  riskBadge.textContent = `${riskLevel} RISK`;

  if (res.isPhishing || scorePct >= 65) {
    resultsCard.classList.add('phishing');
    verdictIcon.className = 'fa-solid fa-triangle-exclamation';
    verdictLabel.textContent = 'Phishing Threat Detected';
    if (!res.summary) {
      verdictSummary.textContent = 'High probability of malicious intent. Do not click links or respond.';
    } else {
      verdictSummary.textContent = res.summary;
    }
  } else if (scorePct >= 35) {
    resultsCard.classList.add('suspicious');
    verdictIcon.className = 'fa-solid fa-circle-exclamation';
    verdictLabel.textContent = 'Suspicious Patterns Found';
    verdictSummary.textContent = res.summary || 'Email exhibits mild threat indicators. Exercise caution.';
  } else {
    resultsCard.classList.add('legitimate');
    verdictIcon.className = 'fa-solid fa-circle-check';
    verdictLabel.textContent = 'Email Appears Legitimate';
    verdictSummary.textContent = res.summary || 'No standard phishing indicators identified. Safe for standard handling.';
  }

  // Populate Indicator Badges
  indicatorsGrid.innerHTML = '';
  const indicators = res.indicators || {};
  const indicatorDefs = [
    { key: 'urgency', label: 'Urgency & Coercion', icon: 'fa-bolt' },
    { key: 'credentialHarvesting', label: 'Credential Harvesting', icon: 'fa-key' },
    { key: 'financialPressure', label: 'Financial Lure / Pressure', icon: 'fa-money-bill-wave' },
    { key: 'authorityImpersonation', label: 'Authority Spoofing', icon: 'fa-user-shield' },
    { key: 'suspiciousLinks', label: 'Deceptive Links', icon: 'fa-link' }
  ];

  let anyActiveIndicator = false;
  indicatorDefs.forEach(def => {
    const isActive = Boolean(indicators[def.key]);
    if (isActive) anyActiveIndicator = true;
    
    const tag = document.createElement('div');
    tag.className = `indicator-tag ${isActive ? 'active-danger' : ''}`;
    tag.innerHTML = `<i class="fa-solid ${def.icon}"></i> <span>${def.label}: <strong>${isActive ? 'Detected' : 'Clean'}</strong></span>`;
    indicatorsGrid.appendChild(tag);
  });

  if (!anyActiveIndicator && !res.isPhishing) {
    const safeTag = document.createElement('div');
    safeTag.className = 'indicator-tag active-safe';
    safeTag.innerHTML = `<i class="fa-solid fa-shield-check"></i> <span>All Vector Checks: <strong>Passed</strong></span>`;
    indicatorsGrid.prepend(safeTag);
  }

  // Populate Findings / Reasons
  reasonsList.innerHTML = '';
  const reasons = (res.reasons && res.reasons.length > 0) ? res.reasons : ['No specific threat markers flagged.'];
  reasons.forEach(reason => {
    const li = document.createElement('li');
    const iconClass = res.isPhishing ? 'fa-solid fa-triangle-exclamation list-icon-danger' : 'fa-solid fa-check list-icon-safe';
    li.innerHTML = `<i class="${iconClass}"></i> <span>${escapeHtml(reason)}</span>`;
    reasonsList.appendChild(li);
  });

  // Populate Recommendations
  recommendationsList.innerHTML = '';
  const recommendations = (res.recommendations && res.recommendations.length > 0) 
    ? res.recommendations 
    : [
        res.isPhishing 
          ? 'Do not interact with embedded URLs or provide sensitive details.' 
          : 'Normal caution advised when reviewing unexpected messages.'
      ];

  recommendations.forEach(rec => {
    const li = document.createElement('li');
    li.innerHTML = `<i class="fa-solid fa-shield-halved list-icon-info"></i> <span>${escapeHtml(rec)}</span>`;
    recommendationsList.appendChild(li);
  });

  // Metadata
  metaEngine.textContent = res.engine || res.meta?.engine || 'Cloud AI';
  metaTime.textContent = `${res.meta?.processingTimeMs || 350}ms`;

  // Scroll smoothly to results
  resultsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Copy Security Report to Clipboard
function copySecurityReport() {
  if (!currentResult) return;

  const copyBtn = document.getElementById('copy-report-btn');
  const isPhish = currentResult.isPhishing ? '🚨 MALICIOUS / PHISHING' : '🛡️ LEGITIMATE / SAFE';
  const score = Math.round((currentResult.confidenceScore || 0) * 100);

  const reportText = `=== PHISHGUARD AI SECURITY THREAT REPORT ===
Status: ${isPhish}
Risk Level: ${currentResult.riskLevel || 'UNKNOWN'}
Confidence Score: ${score}%
Subject Analyzed: ${currentResult.analyzedSubject || '(None)'}

Summary:
${currentResult.summary || 'N/A'}

Key Findings:
${(currentResult.reasons || []).map(r => ` - ${r}`).join('\n')}

Recommended Actions:
${(currentResult.recommendations || []).map(a => ` - ${a}`).join('\n')}

Engine: ${currentResult.engine || 'PhishGuard Cloud AI'}
Timestamp: ${new Date().toISOString()}
============================================`;

  navigator.clipboard.writeText(reportText).then(() => {
    const origHtml = copyBtn.innerHTML;
    copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
    setTimeout(() => {
      copyBtn.innerHTML = origHtml;
    }, 2000);
  }).catch(err => {
    console.error('Clipboard copy failed:', err);
    alert('Unable to copy to clipboard automatically.');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
