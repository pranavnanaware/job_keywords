// Background Script for Job Keywords Optimizer
// Service Worker for Chrome Extension

// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Job Keywords Optimizer installed');
    
    if (details.reason === 'install') {
        // First time installation
        console.log('Extension installed for the first time');
        
        // Set default settings
        chrome.storage.local.set({
            'settingsInitialized': true,
            'autoExtract': true,
            'showNotifications': true
        });
    } else if (details.reason === 'update') {
        // Extension updated
        console.log('Extension updated');
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Job Keywords Optimizer started');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    switch (request.action) {
        case 'getStoredData':
            // Return stored job description and resume data
            chrome.storage.local.get(['jobDescription', 'resumeBullets'], (result) => {
                sendResponse({
                    success: true,
                    data: result
                });
            });
            return true; // Keep the message channel open for async response
            
        case 'saveAnalysisResult':
            // Save analysis results for future reference
            chrome.storage.local.set({
                'lastAnalysis': {
                    timestamp: Date.now(),
                    score: request.score,
                    keywords: request.keywords,
                    suggestions: request.suggestions,
                    url: request.url
                }
            }, () => {
                sendResponse({ success: true });
            });
            return true;
            
        case 'clearData':
            // Clear all stored data
            chrome.storage.local.clear(() => {
                sendResponse({ success: true });
            });
            return true;
            
        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Handle tab updates to potentially auto-extract job descriptions
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only process when page is completely loaded
    if (changeInfo.status === 'complete' && tab.url) {
        const url = new URL(tab.url);
        const hostname = url.hostname.toLowerCase();
        
        // Check if it's a job site
        const jobSites = [
            'linkedin.com',
            'indeed.com',
            'glassdoor.com',
            'angel.co',
            'wellfound.com',
            'ziprecruiter.com',
            'monster.com',
            'careerbuilder.com',
            'dice.com',
            'stackoverflow.com',
            'github.com',
            'remoteok.io',
            'weworkremotely.com',
            'lever.co',
            'greenhouse.io',
            'bamboohr.com'
        ];
        
        const isJobSite = jobSites.some(site => hostname.includes(site));
        
        if (isJobSite) {
            console.log(`Detected job site: ${hostname}`);
            
            // Store the current tab info for potential extraction
            chrome.storage.local.set({
                'currentJobSite': {
                    url: tab.url,
                    title: tab.title,
                    hostname: hostname,
                    timestamp: Date.now()
                }
            });
        }
    }
});

// Context menu for quick access (optional feature)
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'extractJobDescription',
        title: 'Extract Job Description',
        contexts: ['page', 'selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extractJobDescription') {
        // Send message to content script to extract job description
        chrome.tabs.sendMessage(tab.id, { action: 'extractJobDescription' }, (response) => {
            if (response && response.success) {
                // Store the extracted description
                chrome.storage.local.set({
                    'extractedJobDescription': {
                        text: response.jobDescription,
                        url: tab.url,
                        timestamp: Date.now()
                    }
                });
                
                // Show notification if enabled
                chrome.storage.local.get(['showNotifications'], (result) => {
                    if (result.showNotifications !== false) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon48.png',
                            title: 'Job Description Extracted',
                            message: 'Job description has been extracted and saved!'
                        });
                    }
                });
            }
        });
    }
});

// Alarm for periodic cleanup of old data
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        cleanupOldData();
    }
});

// Set up periodic cleanup (once a week)
chrome.alarms.create('cleanup', { 
    delayInMinutes: 1,
    periodInMinutes: 10080 // 7 days
});

function cleanupOldData() {
    chrome.storage.local.get(null, (items) => {
        const keysToRemove = [];
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const [key, value] of Object.entries(items)) {
            if (value && typeof value === 'object' && value.timestamp) {
                if (value.timestamp < oneWeekAgo) {
                    keysToRemove.push(key);
                }
            }
        }
        
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, () => {
                console.log(`Cleaned up ${keysToRemove.length} old data entries`);
            });
        }
    });
}

// Handle extension uninstall (for cleanup)
chrome.runtime.setUninstallURL('https://forms.gle/feedback-url-here', () => {
    console.log('Uninstall URL set');
});

console.log('Job Keywords Optimizer background script loaded');