// Background service worker for the Job Keywords Matcher extension

// Install event
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Keywords Matcher extension installed');
  
  // Set default settings
  chrome.storage.local.set({
    'extensionEnabled': true,
    'autoAnalyze': false,
    'highlightKeywords': true
  });
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Job Keywords Matcher extension started');
});

// Listen for tab updates to potentially auto-analyze
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if the tab is completely loaded
  if (changeInfo.status === 'complete' && tab.url) {
    checkIfJobSite(tab.url, tabId);
  }
});

function checkIfJobSite(url, tabId) {
  const jobSites = [
    'linkedin.com',
    'indeed.com',
    'glassdoor.com',
    'monster.com',
    'ziprecruiter.com',
    'careerbuilder.com',
    'dice.com',
    'stackoverflow.com'
  ];
  
  const isJobSite = jobSites.some(site => url.includes(site));
  
  if (isJobSite) {
    // Check if auto-analyze is enabled
    chrome.storage.local.get(['autoAnalyze'], (result) => {
      if (result.autoAnalyze) {
        // Automatically trigger analysis
        chrome.tabs.sendMessage(tabId, {
          action: 'autoAnalyze'
        });
      }
    });
    
    // Update extension icon to indicate we're on a job site
    chrome.action.setBadgeText({
      text: '!',
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#4CAF50',
      tabId: tabId
    });
  } else {
    // Clear badge for non-job sites
    chrome.action.setBadgeText({
      text: '',
      tabId: tabId
    });
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'saveAnalysisResult':
      saveAnalysisResult(request.data);
      sendResponse({success: true});
      break;
      
    case 'getAnalysisHistory':
      getAnalysisHistory(sendResponse);
      return true; // Will respond asynchronously
      
    case 'clearHistory':
      clearAnalysisHistory(sendResponse);
      return true;
      
    case 'updateSettings':
      updateSettings(request.settings, sendResponse);
      return true;
      
    default:
      sendResponse({error: 'Unknown action'});
  }
});

function saveAnalysisResult(data) {
  const timestamp = new Date().toISOString();
  const result = {
    id: Date.now().toString(),
    timestamp: timestamp,
    url: data.url,
    jobTitle: data.jobTitle,
    company: data.company,
    matchScore: data.matchScore,
    matchedKeywords: data.matchedKeywords,
    missingKeywords: data.missingKeywords
  };
  
  // Get existing history
  chrome.storage.local.get(['analysisHistory'], (storageResult) => {
    const history = storageResult.analysisHistory || [];
    
    // Add new result to the beginning
    history.unshift(result);
    
    // Keep only the last 50 results
    const trimmedHistory = history.slice(0, 50);
    
    // Save back to storage
    chrome.storage.local.set({'analysisHistory': trimmedHistory});
  });
}

function getAnalysisHistory(sendResponse) {
  chrome.storage.local.get(['analysisHistory'], (result) => {
    sendResponse({history: result.analysisHistory || []});
  });
}

function clearAnalysisHistory(sendResponse) {
  chrome.storage.local.set({'analysisHistory': []}, () => {
    sendResponse({success: true});
  });
}

function updateSettings(settings, sendResponse) {
  chrome.storage.local.set(settings, () => {
    sendResponse({success: true});
  });
}

// Context menu (right-click) integration
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyzeJobPosting',
    title: 'Analyze Job Posting',
    contexts: ['page'],
    documentUrlPatterns: ['*://*/*']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeJobPosting') {
    // Send message to content script to analyze
    chrome.tabs.sendMessage(tab.id, {
      action: 'scrapeJob'
    }, (response) => {
      if (response && response.jobText) {
        // Open popup programmatically or show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Job Analysis Complete',
          message: 'Job posting analyzed. Click the extension icon to view results.'
        });
      }
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'analyze-job') {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'scrapeJob'
      });
    });
  }
});

// Periodic cleanup of old data
setInterval(() => {
  chrome.storage.local.get(['analysisHistory'], (result) => {
    if (result.analysisHistory) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const filteredHistory = result.analysisHistory.filter(item => 
        new Date(item.timestamp) > oneMonthAgo
      );
      
      if (filteredHistory.length !== result.analysisHistory.length) {
        chrome.storage.local.set({'analysisHistory': filteredHistory});
      }
    }
  });
}, 24 * 60 * 60 * 1000); // Run daily