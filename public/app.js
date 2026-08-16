document.getElementById('phishing-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const subject = document.getElementById('email-subject').value.trim();
  const body = document.getElementById('email-body').value.trim();
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultsCard = document.getElementById('results-card');

  // Combine subject and body into full email text string
  const emailText = `Subject: ${subject}\n\n${body}`;

  // UI Loading State
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...`;

  try {
    const response = await fetch('http://localhost:3000/api/detect-phishing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emailText })
    });

    const data = await response.json();

    if (data.status === 'success') {
      renderResults(data.result);
    } else {
      alert('Error analyzing email. Please ensure your backend server is active.');
    }
  } catch (error) {
    console.error('Request failed:', error);
    alert('Failed to reach backend server at http://localhost:3000.');
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Detect Threat`;
  }
});

function renderResults(result) {
  const resultsCard = document.getElementById('results-card');
  const statusIcon = document.getElementById('status-icon');
  const statusTitle = document.getElementById('status-title');
  const statusDesc = document.getElementById('status-desc');
  const confidenceFill = document.getElementById('confidence-fill');
  const confidenceValue = document.getElementById('confidence-value');
  const reasonsList = document.getElementById('reasons-list');

  resultsCard.classList.remove('hidden', 'phishing', 'legitimate');
  
  const scorePercent = Math.round(result.confidenceScore * 100);
  confidenceFill.style.width = `${scorePercent}%`;
  confidenceValue.textContent = `${scorePercent}%`;

  if (result.isPhishing) {
    resultsCard.classList.add('phishing');
    statusIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
    statusTitle.textContent = 'Phishing Threat Detected';
    statusTitle.style.color = 'var(--danger-red)';
    statusDesc.textContent = 'High probability of malicious intent. Do not click links or respond.';
  } else {
    resultsCard.classList.add('legitimate');
    statusIcon.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    statusTitle.textContent = 'Email Appears Legitimate';
    statusTitle.style.color = 'var(--safe-green)';
    statusDesc.textContent = 'No standard phishing indicators identified.';
  }

  // Populate Reasons
  reasonsList.innerHTML = '';
  if (result.reasons && result.reasons.length > 0) {
    result.reasons.forEach(reason => {
      const li = document.createElement('li');
      li.textContent = reason;
      reasonsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No specific threat markers provided.';
    reasonsList.appendChild(li);
  }

  resultsCard.scrollIntoView({ behavior: 'smooth' });
}
