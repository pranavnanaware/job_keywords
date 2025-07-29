let resumeText = '';

document.addEventListener('DOMContentLoaded', function() {
  const resumeFile = document.getElementById('resumeFile');
  const fileName = document.getElementById('fileName');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const status = document.getElementById('status');
  const results = document.getElementById('results');

  // Load saved resume if exists
  chrome.storage.local.get(['resumeText'], function(result) {
    if (result.resumeText) {
      resumeText = result.resumeText;
      fileName.textContent = '✅ Resume loaded from storage';
      analyzeBtn.disabled = false;
    }
  });

  resumeFile.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
      fileName.textContent = `📄 ${file.name}`;
      readFile(file);
    }
  });

  analyzeBtn.addEventListener('click', function() {
    if (!resumeText) {
      showStatus('Please upload your resume first', 'error');
      return;
    }
    
    analyzeBtn.disabled = true;
    showStatus('🔍 Analyzing job posting...');
    
    // Get current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Send message to content script
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'scrapeJob'
      }, function(response) {
        analyzeBtn.disabled = false;
        
        if (chrome.runtime.lastError) {
          showStatus('❌ Error: Could not access page content. Please refresh the page and try again.', 'error');
          return;
        }
        
        if (response && response.jobText) {
          performKeywordAnalysis(response.jobText);
        } else {
          showStatus('❌ No job posting found on this page', 'error');
        }
      });
    });
  });

  function readFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const content = e.target.result;
      
      if (file.type === 'application/pdf') {
        showStatus('📄 PDF detected - extracting text...');
        // For now, ask user to copy-paste or use a txt file
        showStatus('⚠️ Please save your resume as a .txt file for now', 'error');
        return;
      }
      
      resumeText = content;
      
      // Save to storage
      chrome.storage.local.set({'resumeText': resumeText}, function() {
        showStatus('✅ Resume uploaded and saved');
        analyzeBtn.disabled = false;
      });
    };
    
    reader.onerror = function() {
      showStatus('❌ Error reading file', 'error');
    };
    
    reader.readAsText(file);
  }

  function performKeywordAnalysis(jobText) {
    showStatus('🧠 Processing keywords...');
    
    // Extract keywords from both texts
    const resumeKeywords = extractKeywords(resumeText);
    const jobKeywords = extractKeywords(jobText);
    
    // Find matches
    const matchedKeywords = resumeKeywords.filter(keyword => 
      jobKeywords.some(jobKeyword => 
        jobKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(jobKeyword.toLowerCase())
      )
    );
    
    const missingKeywords = jobKeywords.filter(keyword => 
      !resumeKeywords.some(resumeKeyword => 
        resumeKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(resumeKeyword.toLowerCase())
      )
    );
    
    // Calculate match score
    const matchScore = Math.round((matchedKeywords.length / jobKeywords.length) * 100);
    
    displayResults(matchScore, matchedKeywords, missingKeywords);
    showStatus('✅ Analysis complete');
  }

  function extractKeywords(text) {
    // Common tech keywords and skills
    const techKeywords = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'TypeScript',
      'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'SQL', 'HTML', 'CSS', 'Dart',
      
      // Frameworks & Libraries
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'Laravel', 'Rails', 'Flutter', 'React Native', 'jQuery', 'Bootstrap',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'Elasticsearch',
      'Oracle', 'SQL Server', 'DynamoDB', 'Cassandra',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',
      'GitLab', 'Terraform', 'Ansible', 'Linux', 'Ubuntu', 'CentOS',
      
      // Other Skills
      'Machine Learning', 'AI', 'Data Science', 'Analytics', 'API', 'REST',
      'GraphQL', 'Microservices', 'Agile', 'Scrum', 'CI/CD', 'TDD', 'DevOps'
    ];
    
    const words = text.toLowerCase().match(/\b[a-zA-Z+#.]{2,}\b/g) || [];
    const foundKeywords = [];
    
    // Find tech keywords
    techKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    });
    
    // Find other potential keywords (3+ chars, appears multiple times)
    const wordCount = {};
    words.forEach(word => {
      if (word.length >= 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    // Add words that appear multiple times
    Object.keys(wordCount).forEach(word => {
      if (wordCount[word] >= 2 && word.length >= 4) {
        foundKeywords.push(word.charAt(0).toUpperCase() + word.slice(1));
      }
    });
    
    return [...new Set(foundKeywords)].slice(0, 50); // Remove duplicates and limit
  }

  function displayResults(matchScore, matchedKeywords, missingKeywords) {
    const matchScoreEl = document.getElementById('matchScore');
    const matchedKeywordsEl = document.getElementById('matchedKeywords');
    const missingKeywordsEl = document.getElementById('missingKeywords');
    
    // Display match score with color
    let scoreColor = '#f44336'; // Red
    if (matchScore >= 70) scoreColor = '#4CAF50'; // Green
    else if (matchScore >= 50) scoreColor = '#ff9800'; // Orange
    
    matchScoreEl.innerHTML = `<span style="color: ${scoreColor};">${matchScore}% Match</span>`;
    
    // Display matched keywords
    matchedKeywordsEl.innerHTML = '';
    matchedKeywords.slice(0, 20).forEach(keyword => {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag matched';
      tag.textContent = keyword;
      matchedKeywordsEl.appendChild(tag);
    });
    
    // Display missing keywords
    missingKeywordsEl.innerHTML = '';
    missingKeywords.slice(0, 20).forEach(keyword => {
      const tag = document.createElement('span');
      tag.className = 'keyword-tag missing';
      tag.textContent = keyword;
      missingKeywordsEl.appendChild(tag);
    });
    
    results.style.display = 'block';
  }

  function showStatus(message, type = '') {
    status.textContent = message;
    status.className = `status ${type}`;
  }
});