// Content script for scraping job postings from various sites

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'scrapeJob') {
    const jobText = scrapeJobPosting();
    sendResponse({jobText: jobText});
  }
});

function scrapeJobPosting() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  
  let jobText = '';
  
  try {
    if (hostname.includes('linkedin.com')) {
      jobText = scrapeLinkedIn();
    } else if (hostname.includes('indeed.com')) {
      jobText = scrapeIndeed();
    } else if (hostname.includes('glassdoor.com')) {
      jobText = scrapeGlassdoor();
    } else if (hostname.includes('monster.com')) {
      jobText = scrapeMonster();
    } else if (hostname.includes('ziprecruiter.com')) {
      jobText = scrapeZipRecruiter();
    } else if (hostname.includes('careerbuilder.com')) {
      jobText = scrapeCareerBuilder();
    } else if (hostname.includes('dice.com')) {
      jobText = scrapeDice();
    } else if (hostname.includes('stackoverflow.com')) {
      jobText = scrapeStackOverflow();
    } else {
      // Generic scraping for other sites
      jobText = scrapeGeneric();
    }
    
    // Clean up the text
    jobText = cleanJobText(jobText);
    
  } catch (error) {
    console.error('Error scraping job posting:', error);
  }
  
  return jobText;
}

function scrapeLinkedIn() {
  let jobText = '';
  
  // Try different selectors for LinkedIn job postings
  const selectors = [
    '.description__text',
    '.jobs-description-content__text',
    '.jobs-box__html-content',
    '.jobs-description__content',
    '[data-job-id] .jobs-description-content__text',
    '.job-view-layout .jobs-description-content__text'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      jobText = element.innerText || element.textContent;
      break;
    }
  }
  
  // Also get job title
  const titleSelectors = [
    '.jobs-unified-top-card__job-title',
    '.job-title',
    '.jobs-details-top-card__job-title',
    'h1'
  ];
  
  for (const selector of titleSelectors) {
    const titleElement = document.querySelector(selector);
    if (titleElement && titleElement.innerText) {
      jobText = titleElement.innerText + '\n\n' + jobText;
      break;
    }
  }
  
  return jobText;
}

function scrapeIndeed() {
  let jobText = '';
  
  const selectors = [
    '[data-jk] .jobsearch-jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    '.jobsearch-JobComponent-description',
    '#jobDescriptionText',
    '.css-1w472lf'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      jobText = element.innerText || element.textContent;
      break;
    }
  }
  
  // Get job title
  const titleElement = document.querySelector('.jobsearch-JobInfoHeader-title span, h1, .it2bs');
  if (titleElement) {
    jobText = titleElement.innerText + '\n\n' + jobText;
  }
  
  return jobText;
}

function scrapeGlassdoor() {
  let jobText = '';
  
  const selectors = [
    '[data-test="jobDescription"]',
    '.jobDescriptionContent',
    '.desc',
    '.jobDesc'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      jobText = element.innerText || element.textContent;
      break;
    }
  }
  
  return jobText;
}

function scrapeMonster() {
  const element = document.querySelector('.job-description, .job-posting-description, .description');
  return element ? element.innerText || element.textContent : '';
}

function scrapeZipRecruiter() {
  const element = document.querySelector('.job_description, .jobDescriptionSection, .job-description-container');
  return element ? element.innerText || element.textContent : '';
}

function scrapeCareerBuilder() {
  const element = document.querySelector('.job-description, .jdp-job-description-details, .data-details');
  return element ? element.innerText || element.textContent : '';
}

function scrapeDice() {
  const element = document.querySelector('.job-description, .jobDescription, .job-details');
  return element ? element.innerText || element.textContent : '';
}

function scrapeStackOverflow() {
  const element = document.querySelector('.job-description, .js-job-description, .job-details');
  return element ? element.innerText || element.textContent : '';
}

function scrapeGeneric() {
  // Generic scraping approach for unknown sites
  let jobText = '';
  
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
        jobText = text;
        break;
      }
    }
    if (jobText) break;
  }
  
  // If still no text found, try to get the largest text block
  if (!jobText) {
    const textElements = document.querySelectorAll('div, section, article, p');
    let longestText = '';
    
    textElements.forEach(element => {
      const text = element.innerText || element.textContent;
      if (text && text.length > longestText.length && text.length > 200) {
        longestText = text;
      }
    });
    
    jobText = longestText;
  }
  
  return jobText;
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

// Highlight matched keywords on the page (optional feature)
function highlightKeywords(keywords) {
  if (!keywords || keywords.length === 0) return;
  
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  textNodes.forEach(textNode => {
    let content = textNode.textContent;
    let modified = false;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(content)) {
        content = content.replace(regex, `<mark style="background-color: yellow; padding: 2px 4px; border-radius: 3px;">$&</mark>`);
        modified = true;
      }
    });
    
    if (modified) {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = content;
      textNode.parentNode.replaceChild(wrapper, textNode);
    }
  });
}