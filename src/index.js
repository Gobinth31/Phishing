import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// -------------------------------------------------------------
// Cloud AI Configuration (Google Gemini)
// -------------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

let geminiClient = null;
if (GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  } catch (err) {
    console.warn('[Gemini Client Init Warning]:', err.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Load dataset examples for few-shot prompt injection
const datasetPath = path.join(__dirname, '../data/dataset.json');
let dataset = [];
try {
  if (fs.existsSync(datasetPath)) {
    dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[Dataset] Fallback to default examples:', e.message);
  dataset = [
    {
      type: 'phishing',
      subject: 'Security Alert: Account Verification Required',
      body: 'Your account is scheduled for deactivation in 24 hours. Click here to verify credentials.',
      reasons: ['Urgency tactic', 'Credential harvesting']
    },
    {
      type: 'legitimate',
      subject: 'Meeting notes and weekly sync',
      body: 'Hi team, thanks for joining today. Here are the action items for next week.',
      reasons: ['Normal internal team communication']
    }
  ];
}

// Build Few-Shot System Prompt
function buildSystemPrompt(examples) {
  const exampleString = examples
    .map(
      (ex, idx) => `
[Example ${idx + 1} - ${ex.type.toUpperCase()}]
Content:
${ex.body || ex.subject}

Output:
{
  "isPhishing": ${ex.type === 'phishing'},
  "confidenceScore": ${ex.type === 'phishing' ? 0.95 : 0.05},
  "riskLevel": "${ex.type === 'phishing' ? 'HIGH' : 'SAFE'}",
  "summary": "${ex.type === 'phishing' ? 'Suspicious email with phishing indicators' : 'Standard legitimate communication'}",
  "reasons": ${JSON.stringify(ex.reasons || [])},
  "indicators": {
    "urgency": ${Boolean(ex.reasons && ex.reasons.some(r => /urgenc|expir|action/i.test(r)))},
    "credentialHarvesting": ${Boolean(ex.reasons && ex.reasons.some(r => /credential|password|pin|verify/i.test(r)))},
    "financialPressure": ${Boolean(ex.reasons && ex.reasons.some(r => /financial|refund|money|sum|contest/i.test(r)))},
    "authorityImpersonation": ${Boolean(ex.reasons && ex.reasons.some(r => /authority|prevention|team|official/i.test(r)))},
    "suspiciousLinks": ${ex.type === 'phishing'}
  },
  "recommendations": [
    "${ex.type === 'phishing' ? 'Do not click any embedded links or provide credentials.' : 'Email appears safe for regular processing.'}"
  ]
}`
    )
    .join('\n');

  return `You are a world-class cybersecurity AI specialized in email threat and phishing detection. Analyze incoming email messages thoroughly and determine if they are Phishing or Legitimate.

--- EXAMPLES ---
${exampleString}
--- END EXAMPLES ---

Respond STRICTLY in valid JSON format matching this schema:
{
  "isPhishing": boolean,
  "confidenceScore": number between 0.00 and 1.00,
  "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE",
  "summary": "1-2 sentence overview of threat analysis findings",
  "reasons": ["detailed finding 1", "detailed finding 2"],
  "indicators": {
    "urgency": boolean,
    "credentialHarvesting": boolean,
    "financialPressure": boolean,
    "authorityImpersonation": boolean,
    "suspiciousLinks": boolean
  },
  "recommendations": ["actionable advice 1", "actionable advice 2"]
}`;
}

const SYSTEM_PROMPT = buildSystemPrompt(dataset);

// -------------------------------------------------------------
// AI Analysis Engines
// -------------------------------------------------------------

// Online Cloud Engine: Google Gemini AI
async function analyzeWithGemini(emailText) {
  if (!geminiClient) {
    throw new Error('Gemini API key is not configured in GEMINI_API_KEY environment variable.');
  }

  const candidateModels = [GEMINI_MODEL, 'gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await geminiClient.models.generateContent({
        model,
        contents: `Analyze this email for phishing & fraud threats:\n\n${emailText}`,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text);
        parsed.engine = `Google Gemini (${model})`;
        if (typeof parsed.confidenceScore !== 'number') {
          parsed.confidenceScore = parsed.isPhishing ? 0.95 : 0.05;
        }
        if (!parsed.riskLevel) {
          parsed.riskLevel = parsed.isPhishing
            ? parsed.confidenceScore >= 0.85 ? 'CRITICAL' : 'HIGH'
            : 'SAFE';
        }
        return parsed;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Model ${model} Attempt Failed]:`, err.message);
    }
  }

  throw lastError || new Error('Failed to analyze with Google Gemini API.');
}

// Fallback Heuristic Security Engine (Offline / Safe Fallback)
function analyzeWithHeuristics(emailText) {
  const text = emailText.toLowerCase();
  const reasons = [];
  let score = 0.05;

  const indicators = {
    urgency: false,
    credentialHarvesting: false,
    financialPressure: false,
    authorityImpersonation: false,
    suspiciousLinks: false
  };

  // 1. Urgency & Coercion
  const urgencyPatterns = [
    /\b(urgent|immediate action|act now|suspended|locked|expires? (today|midnight|soon)|24 hours|last chance|time sensitive|restricted|deactivation)\b/i
  ];
  if (urgencyPatterns.some(p => p.test(text))) {
    indicators.urgency = true;
    score += 0.35;
    reasons.push('High-pressure urgency tactics detected (demanding prompt action or threatening loss of account access).');
  }

  // 2. Credential Harvesting & Sensitive Data
  const credentialPatterns = [
    /\b(password|pin|verification code|ssn|social security|credit card|login credentials|sign in to verify|restore access|update your details|enter your code)\b/i
  ];
  if (credentialPatterns.some(p => p.test(text))) {
    indicators.credentialHarvesting = true;
    score += 0.40;
    reasons.push('Requests sensitive credentials, authentication codes, or personal identification details.');
  }

  // 3. Financial & Prize Scams
  const financialPatterns = [
    /\b(refund|wire transfer|\$([0-9,]+)|lottery|prize|winner|bitcoin|crypto|unclaimed funds|inheritance|gift card|invoice overdue)\b/i
  ];
  if (financialPatterns.some(p => p.test(text))) {
    indicators.financialPressure = true;
    score += 0.30;
    reasons.push('Financial incentive, unexpected refund, or monetary lure identified.');
  }

  // 4. Authority & Impersonation
  const authorityPatterns = [
    /\b(fraud prevention|compliance team|security team|support desk|it department|irs|paypal security|apple support|microsoft account team|bank security)\b/i
  ];
  if (authorityPatterns.some(p => p.test(text))) {
    indicators.authorityImpersonation = true;
    score += 0.25;
    reasons.push('Simulated authority figure or organizational impersonation detected.');
  }

  // 5. Suspicious Links or IP addresses
  const urlMatches = emailText.match(/https?:\/\/[^\s$.?#].[^\s]*/gi) || [];
  const suspiciousUrlFound = urlMatches.some(url => {
    return /((bit\.ly|tinyurl\.com|is\.gd|t\.co|ngrok|fake|verify|security-login|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))/i.test(url);
  });
  if (suspiciousUrlFound || (urlMatches.length > 0 && indicators.credentialHarvesting)) {
    indicators.suspiciousLinks = true;
    score += 0.30;
    reasons.push('Contains unverified, shortened, or suspicious destination hyperlinks.');
  }

  // Cap score between 0.05 and 0.99
  score = Math.min(0.99, Math.max(0.05, Math.round(score * 100) / 100));
  const isPhishing = score >= 0.50;

  let riskLevel = 'SAFE';
  if (score >= 0.85) riskLevel = 'CRITICAL';
  else if (score >= 0.70) riskLevel = 'HIGH';
  else if (score >= 0.50) riskLevel = 'MEDIUM';
  else if (score >= 0.25) riskLevel = 'LOW';

  const recommendations = [];
  if (isPhishing) {
    recommendations.push('Do NOT click any links, open attachments, or reply to the sender.');
    recommendations.push('Report this email immediately to your cybersecurity or IT operations team.');
    recommendations.push('Verify any urgent claims via official independent channels or company directories.');
  } else {
    recommendations.push('Email does not exhibit prominent phishing threat markers.');
    recommendations.push('Always practice standard email safety before clicking unknown links.');
  }

  const summary = isPhishing
    ? `Heuristic scan flagged ${reasons.length} risk factor(s) indicating a probable phishing attack.`
    : 'Heuristic scan completed: No significant phishing patterns identified.';

  if (reasons.length === 0) {
    reasons.push('No malicious indicators, urgency triggers, or credential requests detected.');
  }

  return {
    isPhishing,
    confidenceScore: score,
    riskLevel,
    summary,
    reasons,
    indicators,
    recommendations,
    engine: 'Heuristic Security Engine (Offline Fallback)'
  };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health Check (Railway Deployment Health Monitor)
app.get(['/health', '/api/health'], (req, res) => {
  const activeEngine = geminiClient
    ? `Google Gemini AI (${GEMINI_MODEL})`
    : 'Heuristic Security Engine';

  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    engine: activeEngine,
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// Sample Dataset Examples for 1-Click UI Testing
app.get('/api/examples', (req, res) => {
  const samples = dataset.map((item, index) => ({
    id: index + 1,
    type: item.type,
    label: item.subject?.replace(/^Subject:\s*/i, '') || `Example ${index + 1}`,
    subject: item.subject?.replace(/^Subject:\s*/i, '') || '',
    body: item.body || ''
  }));
  res.json({ status: 'success', samples });
});

// Primary Phishing Detection Endpoint
app.post('/api/detect-phishing', async (req, res) => {
  const startTime = Date.now();
  let { emailText, subject, body } = req.body;

  // Format email text if separated
  if (!emailText && (subject || body)) {
    emailText = `Subject: ${subject || '(No Subject)'}\n\n${body || ''}`;
  }

  if (!emailText || !emailText.trim()) {
    return res.status(400).json({
      status: 'error',
      error: 'emailText or subject/body is required for analysis.'
    });
  }

  let result = null;
  let engineUsed = 'unknown';

  // Strategy 1: Google Gemini Online Cloud AI
  if (geminiClient) {
    try {
      result = await analyzeWithGemini(emailText);
      engineUsed = result.engine || 'Google Gemini AI';
    } catch (err) {
      console.warn('[Gemini Online AI Error, using fallback engine]:', err.message);
    }
  }

  // Strategy 2: Fallback Heuristic Security Engine
  if (!result) {
    result = analyzeWithHeuristics(emailText);
    engineUsed = result.engine || 'Heuristic Security Engine';
  }

  const processingTimeMs = Date.now() - startTime;

  return res.json({
    status: 'success',
    result,
    meta: {
      engine: engineUsed,
      processingTimeMs,
      timestamp: new Date().toISOString()
    }
  });
});

// Export app for Vercel Serverless Functions
export default app;

// Start Server when running directly (Local development, Railway, Docker)
if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🛡️  PhishGuard AI — Online Cloud Threat Detector`);
    console.log(`🚀  Port: ${PORT} (Bound to 0.0.0.0 for Railway)`);
    console.log(`🌐  Local URL: http://localhost:${PORT}`);
    console.log(`🤖  Active Engine: ${geminiClient ? 'Google Gemini Cloud AI (' + GEMINI_MODEL + ')' : 'Heuristic Engine'}`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown for Railway & Docker
  const handleShutdown = (signal) => {
    console.log(`[${signal}] Shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed successfully.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}
