import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// We will test against the live running server or import express app
describe('PhishGuard API Tests', () => {
  let serverProcess;
  const BASE_URL = 'http://localhost:3000';

  test('GET /api/health should return status healthy', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.ok(data.engine);
  });

  test('GET /api/examples should return list of samples', async () => {
    const res = await fetch(`${BASE_URL}/api/examples`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'success');
    assert.ok(Array.isArray(data.samples));
    assert.ok(data.samples.length > 0);
  });

  test('POST /api/detect-phishing with phishing email', async () => {
    const res = await fetch(`${BASE_URL}/api/detect-phishing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'URGENT: Your account is suspended',
        body: 'Click here immediately to enter your password and SSN or your account will be deleted within 24 hours: https://fake-bank-auth.com/login'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'success');
    assert.equal(data.result.isPhishing, true);
    assert.ok(data.result.confidenceScore >= 0.5);
    assert.ok(Array.isArray(data.result.reasons));
    assert.ok(data.result.reasons.length > 0);
  });

  test('POST /api/detect-phishing with legitimate email', async () => {
    const res = await fetch(`${BASE_URL}/api/detect-phishing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Sprint Planning Notes',
        body: 'Hi team, thanks for joining the retrospective today. The notes and ticket backlog are updated on Jira. Have a great weekend!'
      })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'success');
    assert.equal(data.result.isPhishing, false);
    assert.ok(data.result.confidenceScore < 0.5);
  });

  test('POST /api/detect-phishing with empty body should return 400', async () => {
    const res = await fetch(`${BASE_URL}/api/detect-phishing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 400);
  });
});
