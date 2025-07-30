// Content script for scraping job postings from various sites

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'scrapeJob') {
    const jobData = scrapeJobPosting();
    sendResponse(jobData);
  } else if (request.action === 'highlightKeywords') {
    highlightKeywordsOnPage(request.matchedKeywords, request.missingKeywords);
    sendResponse({success: true});
  } else if (request.action === 'clearHighlights') {
    clearHighlights();
    sendResponse({success: true});
  } else if (request.action === 'autoAnalyze') {
    // Auto-analyze triggered by background script
    const jobData = scrapeJobPosting();
    if (jobData.jobText) {
      showAnalysisNotification();
    }
  }
});

function scrapeJobPosting() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: '',
    url: url,
    hostname: hostname
  };
  
  try {
    if (hostname.includes('linkedin.com')) {
      jobData = scrapeLinkedIn();
    } else if (hostname.includes('indeed.com')) {
      jobData = scrapeIndeed();
    } else if (hostname.includes('glassdoor.com')) {
      jobData = scrapeGlassdoor();
    } else if (hostname.includes('monster.com')) {
      jobData = scrapeMonster();
    } else if (hostname.includes('ziprecruiter.com')) {
      jobData = scrapeZipRecruiter();
    } else if (hostname.includes('careerbuilder.com')) {
      jobData = scrapeCareerBuilder();
    } else if (hostname.includes('dice.com')) {
      jobData = scrapeDice();
    } else if (hostname.includes('stackoverflow.com')) {
      jobData = scrapeStackOverflow();
    } else {
      // Generic scraping for other sites
      jobData = scrapeGeneric();
    }
    
    // Clean up the text
    jobData.jobText = cleanJobText(jobData.jobText);
    jobData.url = url;
    jobData.hostname = hostname;
    
  } catch (error) {
    console.error('Error scraping job posting:', error);
  }
  
  return jobData;
}

function scrapeLinkedIn() {
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  // Job Description
  const descriptionSelectors = [
    '.description__text',
    '.jobs-description-content__text',
    '.jobs-box__html-content',
    '.jobs-description__content',
    '[data-job-id] .jobs-description-content__text',
    '.job-view-layout .jobs-description-content__text'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      jobData.jobText = element.innerText || element.textContent;
      break;
    }
  }
  
  // Job Title
  const titleSelectors = [
    '.jobs-unified-top-card__job-title',
    '.job-title',
    '.jobs-details-top-card__job-title',
    '.jobs-unified-top-card__job-title h1'
  ];
  
  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement && titleElement.innerText) {
      jobData.jobTitle = titleElement.innerText.trim();
      break;
    }
  }
  
  // Company Name
  const companySelectors = [
    '.jobs-unified-top-card__company-name',
    '.jobs-unified-top-card__subtitle-primary-grouping .jobs-unified-top-card__company-name',
    '.job-details-jobs-unified-top-card__company-name'
  ];
  
  for (const selector of companySelectors) {
    const companyElement = document.querySelector(selector);
    if (companyElement && companyElement.innerText) {
      jobData.company = companyElement.innerText.trim();
      break;
    }
  }
  
  // Location
  const locationSelectors = [
    '.jobs-unified-top-card__bullet',
    '.jobs-unified-top-card__subtitle-secondary-grouping'
  ];
  
  for (const selector of locationSelectors) {
    const locationElement = document.querySelector(selector);
    if (locationElement && locationElement.innerText) {
      jobData.location = locationElement.innerText.trim();
      break;
    }
  }
  
  // Job Type (Remote/Hybrid/On-site, Full-time/Part-time)
  const jobTypeSelectors = [
    '.jobs-unified-top-card__workplace-type',
    '.jobs-unified-top-card__job-insight'
  ];
  
  for (const selector of jobTypeSelectors) {
    const jobTypeElement = document.querySelector(selector);
    if (jobTypeElement && jobTypeElement.innerText) {
      jobData.jobType += jobTypeElement.innerText.trim() + ' ';
    }
  }
  
  // Combine title and description for full job text
  if (jobData.jobTitle) {
    jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
  }
  
  return jobData;
}

function scrapeIndeed() {
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  // Job Description
  const descriptionSelectors = [
    '[data-jk] .jobsearch-jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    '.jobsearch-JobComponent-description',
    '#jobDescriptionText',
    '.css-1w472lf'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      jobData.jobText = element.innerText || element.textContent;
      break;
    }
  }
  
  // Job Title
  const titleElement = document.querySelector('.jobsearch-JobInfoHeader-title span, h1, .it2bs');
  if (titleElement) {
    jobData.jobTitle = titleElement.innerText.trim();
  }
  
  // Company
  const companyElement = document.querySelector('[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating .icl-u-lg-mr--sm');
  if (companyElement) {
    jobData.company = companyElement.innerText.trim();
  }
  
  // Location
  const locationElement = document.querySelector('[data-testid="job-location"], .jobsearch-JobInfoHeader-subtitle');
  if (locationElement) {
    jobData.location = locationElement.innerText.trim();
  }
  
  // Salary
  const salaryElement = document.querySelector('.jobsearch-JobMetadataHeader-item, .attribute_snippet');
  if (salaryElement && salaryElement.innerText.includes('$')) {
    jobData.salary = salaryElement.innerText.trim();
  }
  
  // Combine title and description
  if (jobData.jobTitle) {
    jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
  }
  
  return jobData;
}

function scrapeGlassdoor() {
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  const selectors = [
    '[data-test="jobDescription"]',
    '.jobDescriptionContent',
    '.desc',
    '.jobDesc'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      jobData.jobText = element.innerText || element.textContent;
      break;
    }
  }
  
  // Get job title and other info
  const titleElement = document.querySelector('.jobHeader .jobTitle, h1');
  if (titleElement) {
    jobData.jobTitle = titleElement.innerText.trim();
    jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
  }
  
  return jobData;
}

function scrapeMonster() {
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  const element = document.querySelector('.job-description, .job-posting-description, .description');
  jobData.jobText = element ? element.innerText || element.textContent : '';
  
  const titleElement = document.querySelector('.job-title, h1');
  if (titleElement) {
    jobData.jobTitle = titleElement.innerText.trim();
    jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
  }
  
  return jobData;
}

function scrapeZipRecruiter() {
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  const element = document.querySelector('.job_description, .jobDescriptionSection, .job-description-container');
  jobData.jobText = element ? element.innerText || element.textContent : '';
  
  const titleElement = document.querySelector('.job-title, h1');
  if (titleElement) {
    jobData.jobTitle = titleElement.innerText.trim();
    jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
  }
  
  return jobData;
}

function scrapeCareerBuilder() {
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  const element = document.querySelector('.job-description, .jdp-job-description-details, .data-details');
  jobData.jobText = element ? element.innerText || element.textContent : '';
  
  const titleElement = document.querySelector('.job-title, h1');
  if (titleElement) {
    jobData.jobTitle = titleElement.innerText.trim();
    jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
  }
  
  return jobData;
}

function scrapeDice() {
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  const element = document.querySelector('.job-description, .jobDescription, .job-details');
  jobData.jobText = element ? element.innerText || element.textContent : '';
  
  const titleElement = document.querySelector('.job-title, h1');
  if (titleElement) {
    jobData.jobTitle = titleElement.innerText.trim();
    jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
  }
  
  return jobData;
}

function scrapeStackOverflow() {
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  const element = document.querySelector('.job-description, .js-job-description, .job-details');
  jobData.jobText = element ? element.innerText || element.textContent : '';
  
  const titleElement = document.querySelector('.job-title, h1');
  if (titleElement) {
    jobData.jobTitle = titleElement.innerText.trim();
    jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
  }
  
  return jobData;
}

function scrapeGeneric() {
  // Generic scraping approach for unknown sites
  let jobData = {
    jobText: '',
    jobTitle: '',
    company: '',
    location: '',
    salary: '',
    jobType: ''
  };
  
  // Look for common job posting indicators
  const commonSelectors = [
    '[class*="job"][class*="description"]',
    '[class*="description"]',
    '[id*="job"][id*="description"]',
    '[id*="description"]',
    '.job-posting',
    '.job-details',
    '.posting-description',
    '.job-content',
    '.position-description',
    'article',
    'main',
    '.content'
  ];
  
  for (const selector of commonSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.innerText || element.textContent;
      if (text && text.length > 200) { // Assume job descriptions are at least 200 chars
        jobData.jobText = text;
        break;
      }
    }
    if (jobData.jobText) break;
  }
  
  // If still no text found, try to get the largest text block
  if (!jobData.jobText) {
    const textElements = document.querySelectorAll('div, section, article, p');
    let longestText = '';
    
    textElements.forEach(element => {
      const text = element.innerText || element.textContent;
      if (text && text.length > longestText.length && text.length > 200) {
        longestText = text;
      }
    });
    
    jobData.jobText = longestText;
  }
  
  // Try to get job title
  const titleElement = document.querySelector('h1, .job-title, .title, [class*="title"]');
  if (titleElement) {
    jobData.jobTitle = titleElement.innerText.trim();
    if (jobData.jobTitle) {
      jobData.jobText = jobData.jobTitle + '\n\n' + jobData.jobText;
    }
  }
  
  return jobData;
}

function cleanJobText(text) {
  if (!text) return '';
  
  // Remove extra whitespace and clean up
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove common noise
  text = text.replace(/Apply Now|Apply for this job|Submit Application/gi, '');
  text = text.replace(/Share this job|Save job|View similar jobs/gi, '');
  text = text.replace(/Copyright.*?rights reserved/gi, '');
  
  return text;
}

// Enhanced keyword highlighting with different colors for matched/missing keywords
function highlightKeywordsOnPage(matchedKeywords, missingKeywords) {
  // Clear existing highlights first
  clearHighlights();
  
  const allKeywords = [...(matchedKeywords || []), ...(missingKeywords || [])];
  if (allKeywords.length === 0) return;
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    // Skip script, style, and other non-visible elements
    if (node.parentElement.tagName === 'SCRIPT' || 
        node.parentElement.tagName === 'STYLE' ||
        node.parentElement.tagName === 'NOSCRIPT') {
      continue;
    }
    textNodes.push(node);
  }
  
  textNodes.forEach(textNode => {
    let content = textNode.textContent;
    let modified = false;
    
    // Highlight matched keywords in green
    (matchedKeywords || []).forEach(keyword => {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(content)) {
        content = content.replace(regex, 
          `<mark class="ai-resume-highlight ai-resume-matched" 
                 style="background-color: #4CAF50; color: white; padding: 2px 4px; border-radius: 3px; font-weight: 500;" 
                 title="✅ Matched keyword: ${keyword}">$&</mark>`);
        modified = true;
      }
    });
    
    // Highlight missing keywords in red
    (missingKeywords || []).forEach(keyword => {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'gi');
      if (regex.test(content)) {
        content = content.replace(regex, 
          `<mark class="ai-resume-highlight ai-resume-missing" 
                 style="background-color: #f44336; color: white; padding: 2px 4px; border-radius: 3px; font-weight: 500;" 
                 title="❌ Missing keyword: ${keyword}">$&</mark>`);
        modified = true;
      }
    });
    
    if (modified) {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = content;
      wrapper.classList.add('ai-resume-highlight-wrapper');
      textNode.parentNode.replaceChild(wrapper, textNode);
    }
  });
  
  // Show highlight summary
  showHighlightSummary(matchedKeywords?.length || 0, missingKeywords?.length || 0);
}

function clearHighlights() {
  // Remove all highlight wrappers
  const highlights = document.querySelectorAll('.ai-resume-highlight-wrapper, .ai-resume-highlight');
  highlights.forEach(highlight => {
    if (highlight.parentNode) {
      highlight.parentNode.replaceChild(document.createTextNode(highlight.textContent), highlight);
    }
  });
  
  // Remove summary notification
  const existingSummary = document.querySelector('.ai-resume-highlight-summary');
  if (existingSummary) {
    existingSummary.remove();
  }
}

function showHighlightSummary(matchedCount, missingCount) {
  // Remove existing summary
  const existingSummary = document.querySelector('.ai-resume-highlight-summary');
  if (existingSummary) {
    existingSummary.remove();
  }
  
  const summary = document.createElement('div');
  summary.className = 'ai-resume-highlight-summary';
  summary.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px;
    border-radius: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    max-width: 300px;
  `;
  
  summary.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px;">🤖 AI Resume Analysis</div>
    <div style="margin-bottom: 5px;">
      <span style="color: #4CAF50;">✅ ${matchedCount} matched keywords</span>
    </div>
    <div style="margin-bottom: 10px;">
      <span style="color: #f44336;">❌ ${missingCount} missing keywords</span>
    </div>
    <div style="font-size: 12px; opacity: 0.8; cursor: pointer;" onclick="this.parentElement.remove()">
      Click to dismiss
    </div>
  `;
  
  document.body.appendChild(summary);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (summary.parentNode) {
      summary.remove();
    }
  }, 10000);
}

function showAnalysisNotification() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: transform 0.3s ease;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 5px;">🎯 Job posting detected!</div>
    <div style="font-size: 12px; opacity: 0.9;">Click the extension icon to analyze</div>
  `;
  
  notification.onclick = () => notification.remove();
  
  // Hover effect
  notification.onmouseenter = () => {
    notification.style.transform = 'translateY(-2px)';
  };
  notification.onmouseleave = () => {
    notification.style.transform = 'translateY(0)';
  };
  
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Legacy function for backwards compatibility
function highlightKeywords(keywords) {
  highlightKeywordsOnPage(keywords, []);
}