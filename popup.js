// AI Resume Optimizer - Comprehensive Chrome Extension
let resumeText = '';
let currentTab = 'analyze';
let settings = {
  apiKey: '',
  model: 'gpt-4o-mini',
  autoAnalyze: false,
  highlightKeywords: true
};

document.addEventListener('DOMContentLoaded', function() {
  initializeUI();
  loadSettings();
  loadResumeFromStorage();
  setupEventListeners();
});

function initializeUI() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabName);
  });
  
  currentTab = tabName;
  
  // Load specific tab data
  if (tabName === 'history') {
    loadAnalysisHistory();
  }
}

function loadSettings() {
  chrome.storage.local.get(['settings'], function(result) {
    if (result.settings) {
      settings = { ...settings, ...result.settings };
      updateSettingsUI();
    }
  });
}

function updateSettingsUI() {
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('modelSelect').value = settings.model;
  document.getElementById('autoAnalyze').checked = settings.autoAnalyze;
  document.getElementById('highlightKeywords').checked = settings.highlightKeywords;
}

function loadResumeFromStorage() {
  chrome.storage.local.get(['resumeText'], function(result) {
    if (result.resumeText) {
      resumeText = result.resumeText;
      document.getElementById('fileName').textContent = '✅ Resume loaded from storage';
      document.getElementById('analyzeBtn').disabled = false;
    }
  });
}

function setupEventListeners() {
  // File upload
  document.getElementById('resumeFile').addEventListener('change', handleFileUpload);
  
  // Analysis
  document.getElementById('analyzeBtn').addEventListener('click', performAnalysis);
  
  // Settings
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  
  // History
  document.getElementById('clearHistory').addEventListener('click', clearHistory);
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const fileName = document.getElementById('fileName');
  fileName.textContent = `📄 ${file.name}`;
  
  try {
    if (file.type === 'application/pdf') {
      showStatus('📄 Extracting text from PDF...', 'loading');
      resumeText = await extractTextFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      showStatus('📄 DOCX files not yet supported. Please save as PDF or TXT', 'error');
      return;
    } else {
      resumeText = await readTextFile(file);
    }
    
    // Save to storage
    chrome.storage.local.set({'resumeText': resumeText}, function() {
      showStatus('✅ Resume uploaded and saved', 'success');
      document.getElementById('analyzeBtn').disabled = false;
    });
    
  } catch (error) {
    showStatus('❌ Error reading file: ' + error.message, 'error');
  }
}

async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async function(e) {
      try {
        const typedArray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({data: typedArray}).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

async function performAnalysis() {
  if (!resumeText) {
    showStatus('Please upload your resume first', 'error');
    return;
  }
  
  if (!settings.apiKey) {
    showStatus('Please set your OpenAI API key in settings', 'error');
    switchTab('settings');
    return;
  }
  
  const analyzeBtn = document.getElementById('analyzeBtn');
  analyzeBtn.disabled = true;
  
  try {
    showStatus('🔍 Scraping job posting...', 'loading');
    showProgress(20);
    
    // Get job posting content
    const jobData = await scrapeCurrentJobPosting();
    
    if (!jobData.jobText) {
      showStatus('❌ No job posting found on this page', 'error');
      return;
    }
    
    showStatus('🤖 Analyzing with AI...', 'loading');
    showProgress(50);
    
    // Get analysis type
    const analysisType = document.querySelector('input[name="analysisType"]:checked').value;
    
    // Perform AI analysis
    const analysis = await performAIAnalysis(resumeText, jobData, analysisType);
    
    showProgress(100);
    displayResults(analysis);
    
    // Save to history
    saveAnalysisToHistory(analysis, jobData);
    
    showStatus('✅ Analysis complete', 'success');
    
  } catch (error) {
    showStatus('❌ Error: ' + error.message, 'error');
    console.error('Analysis error:', error);
  } finally {
    analyzeBtn.disabled = false;
    hideProgress();
  }
}

function scrapeCurrentJobPosting() {
  return new Promise((resolve) => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'scrapeJob'
      }, function(response) {
        if (chrome.runtime.lastError) {
          resolve({jobText: '', url: tabs[0].url});
        } else {
          resolve({
            jobText: response?.jobText || '',
            url: tabs[0].url,
            title: tabs[0].title
          });
        }
      });
    });
  });
}

async function performAIAnalysis(resumeText, jobData, analysisType) {
  const prompts = {
    comprehensive: `You are an expert career counselor and ATS specialist. Analyze this resume against the job posting and provide detailed insights.

RESUME:
${resumeText}

JOB POSTING:
${jobData.jobText}

Provide a comprehensive analysis in the following JSON format:
{
  "matchScore": 85,
  "matchedKeywords": ["JavaScript", "React", "Node.js"],
  "missingKeywords": ["Python", "AWS", "Docker"],
  "recommendedKeywords": ["TypeScript", "GraphQL"],
  "insights": "Detailed analysis of strengths and gaps...",
  "recommendations": "Specific actionable recommendations...",
  "bulletSuggestions": [
    {
      "type": "new",
      "content": "Developed scalable web applications using React and Node.js, serving 10,000+ users daily"
    },
    {
      "type": "modify",
      "original": "Worked on web development projects",
      "improved": "Architected and delivered 5+ full-stack web applications using modern JavaScript frameworks, improving user engagement by 40%"
    }
  ],
  "atsOptimization": "Tips for ATS optimization...",
  "salaryInsights": "Market salary insights based on keywords...",
  "careerPath": "Suggested career progression..."
}`,
    
    quick: `Quickly analyze this resume against the job posting for keyword matching.

RESUME: ${resumeText}
JOB POSTING: ${jobData.jobText}

Return JSON: {"matchScore": 75, "matchedKeywords": ["keyword1"], "missingKeywords": ["keyword2"], "insights": "brief analysis"}`,
    
    optimization: `You are a resume optimization expert. Help improve this resume for the specific job posting.

RESUME: ${resumeText}
JOB POSTING: ${jobData.jobText}

Return JSON with optimization suggestions: {
  "matchScore": 70,
  "matchedKeywords": ["keyword1"],
  "missingKeywords": ["keyword2"],
  "recommendations": "specific improvements",
  "bulletSuggestions": [
    {
      "type": "new",
      "content": "New bullet point that addresses missing keywords"
    },
    {
      "type": "modify",
      "original": "Existing bullet from resume",
      "improved": "Enhanced version with relevant keywords"
    }
  ],
  "keywordSuggestions": ["keyword1"],
  "resumeRewrite": "suggested sections to rewrite"
}`
  };

  // Clean and validate API key
  const cleanApiKey = settings.apiKey.trim().replace(/[^\x00-\x7F]/g, "");
  
  if (!cleanApiKey || cleanApiKey.length < 10) {
    throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanApiKey}`
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert career counselor specializing in resume optimization and job matching. Always respond with valid JSON only, no markdown formatting or code blocks.'
        },
        {
          role: 'user',
          content: prompts[analysisType]
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    // Extract JSON from markdown code blocks if present
    let jsonContent = content.trim();
    
    // Remove markdown code block wrapper if present
    const codeBlockMatch = jsonContent.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1].trim();
    }
    
    // Remove any remaining backticks or markdown
    jsonContent = jsonContent.replace(/^`+|`+$/g, '').trim();
    
    const parsed = JSON.parse(jsonContent);
    console.log('Successfully parsed JSON:', parsed);
    return parsed;
    
  } catch (parseError) {
    console.error('JSON parsing error:', parseError);
    console.log('Raw content:', content);
    
    // Try to extract JSON manually from the response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = JSON.parse(jsonMatch[0]);
        console.log('Extracted JSON successfully:', extractedJson);
        return extractedJson;
      }
    } catch (extractError) {
      console.error('Manual extraction failed:', extractError);
    }
    
    // If all parsing fails, create a fallback response
    return {
      matchScore: 0,
      matchedKeywords: [],
      missingKeywords: [],
      insights: 'Unable to parse AI response. Raw response: ' + content,
      recommendations: 'Please try the analysis again. If the issue persists, check your API settings.',
      bulletSuggestions: [],
      error: 'Failed to parse AI response'
    };
  }
}

function displayResults(analysis) {
  const results = document.getElementById('results');
  
  // Match Score
  const matchScore = analysis.matchScore || 0;
  let scoreColor = '#f44336';
  if (matchScore >= 70) scoreColor = '#4CAF50';
  else if (matchScore >= 50) scoreColor = '#FF9800';
  
  document.getElementById('matchScore').innerHTML = 
    `<span style="color: ${scoreColor};">${matchScore}% Match</span>`;
  
  // AI Insights - Format properly
  const insights = analysis.insights || 'No insights available';
  document.getElementById('aiInsights').innerHTML = 
    `<div style="white-space: pre-wrap; line-height: 1.5;">${insights}</div>`;
  
  // Matched Keywords
  const matchedKeywords = document.getElementById('matchedKeywords');
  matchedKeywords.innerHTML = '';
  (analysis.matchedKeywords || []).forEach(keyword => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag matched';
    tag.textContent = keyword;
    matchedKeywords.appendChild(tag);
  });
  
  // Add message if no matched keywords
  if (!analysis.matchedKeywords || analysis.matchedKeywords.length === 0) {
    matchedKeywords.innerHTML = '<span class="no-keywords">No matched keywords found</span>';
  }
  
  // Missing Keywords
  const missingKeywords = document.getElementById('missingKeywords');
  missingKeywords.innerHTML = '';
  (analysis.missingKeywords || []).forEach(keyword => {
    const tag = document.createElement('span');
    tag.className = 'keyword-tag missing';
    tag.textContent = keyword;
    missingKeywords.appendChild(tag);
  });
  
  // Add message if no missing keywords
  if (!analysis.missingKeywords || analysis.missingKeywords.length === 0) {
    missingKeywords.innerHTML = '<span class="no-keywords">No missing keywords identified</span>';
  }
  
  // Bullet Suggestions
  const bulletSuggestions = document.getElementById('bulletSuggestions');
  bulletSuggestions.innerHTML = '';
  
  if (analysis.bulletSuggestions && analysis.bulletSuggestions.length > 0) {
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'bullet-suggestions';
    
    analysis.bulletSuggestions.forEach(suggestion => {
      const bulletItem = document.createElement('div');
      bulletItem.className = 'bullet-item';
      
      const bulletType = document.createElement('div');
      bulletType.className = 'bullet-type';
      bulletType.textContent = suggestion.type === 'new' ? '✨ New Bullet Point' : '🔄 Improved Bullet Point';
      
      const bulletContent = document.createElement('div');
      bulletContent.style.cssText = 'line-height: 1.4; margin-top: 5px;';
      
      if (suggestion.type === 'modify') {
        bulletContent.innerHTML = `
          <div style="color: #FFB74D; font-size: 12px; margin-bottom: 5px;">Original:</div>
          <div style="color: #ccc; font-style: italic; margin-bottom: 8px;">"${suggestion.original}"</div>
          <div style="color: #FFB74D; font-size: 12px; margin-bottom: 5px;">Improved:</div>
          <div style="color: #fff; font-weight: 500;">"${suggestion.improved}"</div>
        `;
      } else {
        bulletContent.innerHTML = `<div style="color: #fff; font-weight: 500;">"${suggestion.content}"</div>`;
      }
      
      bulletItem.appendChild(bulletType);
      bulletItem.appendChild(bulletContent);
      suggestionsContainer.appendChild(bulletItem);
    });
    
    bulletSuggestions.appendChild(suggestionsContainer);
  } else {
    bulletSuggestions.innerHTML = '<div style="color: #ccc; font-style: italic;">No bullet suggestions available</div>';
  }
  
  // Recommendations - Format properly
  const recommendations = analysis.recommendations || 'No recommendations available';
  document.getElementById('recommendations').innerHTML = 
    `<div style="white-space: pre-wrap; line-height: 1.5;">${recommendations}</div>`;
  
  results.style.display = 'block';
  
  // Highlight keywords on page if enabled
  if (settings.highlightKeywords) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'highlightKeywords',
        matchedKeywords: analysis.matchedKeywords || [],
        missingKeywords: analysis.missingKeywords || []
      });
    });
  }
}

function saveAnalysisToHistory(analysis, jobData) {
  const historyItem = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    url: jobData.url,
    title: jobData.title,
    matchScore: analysis.matchScore,
    analysis: analysis
  };
  
  chrome.storage.local.get(['analysisHistory'], (result) => {
    const history = result.analysisHistory || [];
    history.unshift(historyItem);
    const trimmedHistory = history.slice(0, 50); // Keep last 50
    
    chrome.storage.local.set({'analysisHistory': trimmedHistory});
  });
}

function loadAnalysisHistory() {
  chrome.storage.local.get(['analysisHistory'], (result) => {
    const history = result.analysisHistory || [];
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
      historyList.innerHTML = '<div class="status">No analysis history yet</div>';
      return;
    }
    
    historyList.innerHTML = history.map(item => `
      <div class="history-item" onclick="viewHistoryItem('${item.id}')">
        <div class="history-header">
          <div class="history-title">${item.title || 'Job Analysis'}</div>
          <div class="history-score">${item.matchScore}%</div>
        </div>
        <div class="history-meta">
          ${new Date(item.timestamp).toLocaleDateString()} • 
          ${new URL(item.url).hostname}
        </div>
      </div>
    `).join('');
  });
}

function viewHistoryItem(id) {
  chrome.storage.local.get(['analysisHistory'], (result) => {
    const history = result.analysisHistory || [];
    const item = history.find(h => h.id === id);
    if (item) {
      displayResults(item.analysis);
      switchTab('analyze');
    }
  });
}

function saveSettings() {
  settings = {
    apiKey: document.getElementById('apiKey').value,
    model: document.getElementById('modelSelect').value,
    autoAnalyze: document.getElementById('autoAnalyze').checked,
    highlightKeywords: document.getElementById('highlightKeywords').checked
  };
  
  chrome.storage.local.set({'settings': settings}, () => {
    document.getElementById('settingsStatus').textContent = '✅ Settings saved';
    document.getElementById('settingsStatus').className = 'status success';
    
    setTimeout(() => {
      document.getElementById('settingsStatus').textContent = '';
    }, 2000);
  });
}

function clearHistory() {
  chrome.storage.local.set({'analysisHistory': []}, () => {
    loadAnalysisHistory();
  });
}

function showStatus(message, type = '') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
}

function showProgress(percent) {
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  
  progressBar.style.display = 'block';
  progressFill.style.width = percent + '%';
}

function hideProgress() {
  setTimeout(() => {
    document.getElementById('progressBar').style.display = 'none';
  }, 1000);
}

// Initialize PDF.js
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('lib/pdf.worker.min.js');
}