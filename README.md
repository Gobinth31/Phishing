# 🛡️ PhishGuard AI — Advanced Email Threat & Phishing Detection

[![Node.js](https://img.shields.io/badge/Node.js-18+-68a063?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app)

An intelligent, cloud-ready cybersecurity web application and API that inspects incoming emails to detect phishing, social engineering, credential harvesting, authority spoofing, and fraud vectors in real time.

---

## ✨ Features

- 🤖 **Multi-Tier Detection Engine**:
  - **Tier 1 (Cloud AI)**: Powered by Google Gemini AI with few-shot classification trained on cybersecurity datasets.
  - **Tier 2 (Heuristic Security Engine)**: Built-in offline fallback engine detecting urgency coercion, credential harvesting, financial lures, and suspicious hyperlinks.
- ⚡ **Interactive Threat Dashboard**:
  - Real-time confidence score & risk classification (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `SAFE`).
  - Vector indicator chips (`Urgency`, `Credential Harvesting`, `Financial Pressure`, `Authority Spoofing`, `Deceptive Links`).
  - Key security findings and actionable recommendations.
  - One-click copyable incident reports.
- 🎯 **1-Click Test Scenarios**: Quick-load phishing and legitimate email samples for immediate testing.
- 🚀 **Railway & Cloud Ready**: Pre-configured with `railway.json`, `Procfile`, health checks (`/api/health`), and dynamic port binding (`0.0.0.0:$PORT`).

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Gobinth31/Phishing.git
cd Phishing
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Google Gemini API key:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.6-flash
```
*(Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey))*.

### 3. Run Application
```bash
# Start server
npm start

# Or development mode with auto-reload
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 4. Run Automated Tests
```bash
npm test
```

---

## ☁️ Deploy to Railway

### Method 1: Deploy via Railway Web Dashboard (Recommended)

1. Push your latest code to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete phishing detection system with Railway support"
   git push origin main
   ```
2. Go to **[railway.app](https://railway.app)** and log in.
3. Click **"New Project"** → **"Deploy from GitHub repo"**.
4. Select your **`Gobinth31/Phishing`** repository.
5. In the project dashboard:
   - Go to **Variables** → Add `GEMINI_API_KEY` = `your_api_key`.
   - Go to **Settings** → **Networking** → Click **Generate Domain**.
6. Railway will automatically build and deploy the app with a public HTTPS link!

---

### Method 2: Deploy via Railway CLI

1. Authenticate with Railway:
   ```bash
   railway login
   ```
2. Initialize or link your project:
   ```bash
   railway init
   ```
3. Set your environment variable:
   ```bash
   railway variables --set GEMINI_API_KEY="your_api_key_here"
   ```
4. Deploy the application:
   ```bash
   railway up
   ```
5. Generate a public domain:
   ```bash
   railway domain
   ```

---

## 📡 API Endpoints

### 1. Health Check
`GET /api/health`
```json
{
  "status": "healthy",
  "uptimeSeconds": 142,
  "engine": "Gemini AI (gemini-3.6-flash)",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Detect Phishing
`POST /api/detect-phishing`

**Request Body:**
```json
{
  "subject": "URGENT: Verify your account immediately",
  "body": "Dear User, your account will be suspended in 24 hours. Click here to verify: https://fake-auth-login.com"
}
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "isPhishing": true,
    "confidenceScore": 0.98,
    "riskLevel": "CRITICAL",
    "summary": "This email is a high-risk credential harvesting attempt.",
    "reasons": [
      "Uses coercive urgency tactics threatening suspension within 24 hours",
      "Contains unverified third-party authentication link"
    ],
    "indicators": {
      "urgency": true,
      "credentialHarvesting": true,
      "financialPressure": false,
      "authorityImpersonation": true,
      "suspiciousLinks": true
    },
    "recommendations": [
      "Do not click any embedded links",
      "Report email to security operations"
    ]
  },
  "meta": {
    "engine": "gemini:gemini-3.6-flash",
    "processingTimeMs": 312
  }
}
```

### 3. Load Sample Scenarios
`GET /api/examples`

---

## 🔒 Security & Architecture
- **Fail-Safe Operation**: If the AI API experiences network hiccups or rate limits, the built-in Heuristic Security Engine steps in automatically to provide uninterrupted analysis.
- **Privacy-First**: No email content is stored or persisted in databases.

---

## 📄 License
ISC License.
