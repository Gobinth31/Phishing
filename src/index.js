import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Load dataset examples
const datasetPath = path.join(__dirname, '../data/dataset.json');
const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf-8'));

function buildSystemPrompt(examples) {
  const exampleString = examples
    .map(
      (ex, idx) => `
[Example ${idx + 1} - ${ex.type.toUpperCase()}]
Content:
${ex.body}

Output:
{
  "isPhishing": ${ex.type === 'phishing'},
  "confidenceScore": ${ex.type === 'phishing' ? 0.95 : 0.05},
  "reasons": ${JSON.stringify(ex.reasons)}
}`
    )
    .join('\n');

  return `You are a cybersecurity AI. Analyze raw emails and classify them as Phishing or Legitimate.

--- EXAMPLES ---
${exampleString}
--- END EXAMPLES ---

Respond strictly in JSON format:
{
  "isPhishing": true/false,
  "confidenceScore": 0.0 to 1.0,
  "reasons": ["reason 1", "reason 2"]
}`;
}

const SYSTEM_PROMPT = buildSystemPrompt(dataset);

app.post('/api/detect-phishing', async (req, res) => {
  const { emailText } = req.body;

  if (!emailText) {
    return res.status(400).json({ error: 'emailText field is required' });
  }

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        system: SYSTEM_PROMPT,
        prompt: `Analyze this email:\n${emailText}`,
        format: 'json',
        stream: false,
        options: { temperature: 0.1 }
      })
    });

    const data = await response.json();
    return res.json({ status: 'success', result: JSON.parse(data.response) });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Failed to communicate with Ollama' });
  }
});

app.listen(3000, () => console.log('Phishing Detector API listening on http://localhost:3000'));
