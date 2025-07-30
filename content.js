// Content Script for Job Keywords Optimizer
// Extracts job descriptions from various job sites

class JobDescriptionExtractor {
    constructor() {
        this.initializeMessageListener();
        this.siteSelectors = this.initializeSiteSelectors();
    }

    initializeMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'extractJobDescription') {
                const jobDescription = this.extractJobDescription();
                sendResponse({
                    success: !!jobDescription,
                    jobDescription: jobDescription || '',
                    url: window.location.href
                });
            }
        });
    }

    initializeSiteSelectors() {
        return {
            // LinkedIn
            'linkedin.com': [
                '.jobs-description__content',
                '.jobs-box__html-content',
                '.job-view-layout .jobs-description',
                '.jobs-description-content__text',
                '#job-details',
                '.jobs-description'
            ],
            
            // Indeed
            'indeed.com': [
                '#jobDescriptionText',
                '.jobsearch-jobDescriptionText',
                '.jobsearch-JobComponent-description',
                '.icl-u-lg-mr--sm',
                '.jobdescription'
            ],
            
            // Glassdoor
            'glassdoor.com': [
                '#JobDescriptionContainer',
                '.jobDescriptionContent',
                '#JobDescription',
                '.desc'
            ],
            
            // AngelList/Wellfound
            'angel.co': [
                '.job-description',
                '.startup-job-description',
                '.job_description'
            ],
            'wellfound.com': [
                '.job-description',
                '.startup-job-description',
                '.job_description'
            ],
            
            // ZipRecruiter
            'ziprecruiter.com': [
                '.jobDescriptionSection',
                '#job_description',
                '.job_description'
            ],
            
            // Monster
            'monster.com': [
                '#JobDescription',
                '.jobview-description',
                '.job-description'
            ],
            
            // CareerBuilder
            'careerbuilder.com': [
                '.job-description',
                '#job-description-container',
                '.jdp-job-description-details'
            ],
            
            // Dice
            'dice.com': [
                '#jobdescSec',
                '.job-description',
                '#job-description'
            ],
            
            // Stack Overflow Jobs
            'stackoverflow.com': [
                '.job-description',
                '.job-details-description'
            ],
            
            // GitHub Jobs
            'github.com': [
                '.job-description',
                '.markdown-body'
            ],
            
            // RemoteOK
            'remoteok.io': [
                '.job-description',
                '.markdown'
            ],
            
            // WeWorkRemotely
            'weworkremotely.com': [
                '.listing-container-description',
                '.listing-description'
            ],
            
            // Lever
            'lever.co': [
                '.section-wrapper .section',
                '.posting-description',
                '.content'
            ],
            
            // Greenhouse
            'boards.greenhouse.io': [
                '#content',
                '.body-text',
                '.job-post'
            ],
            
            // BambooHR
            'bamboohr.com': [
                '.jobDescription',
                '.job-description'
            ],
            
            // Generic selectors for other sites
            'default': [
                '[class*="job-description"]',
                '[class*="jobdescription"]',
                '[class*="job_description"]',
                '[id*="job-description"]',
                '[id*="jobdescription"]',
                '[id*="job_description"]',
                '.description',
                '#description',
                '.content',
                '.job-content',
                '.posting-description',
                '.job-posting-description',
                '.job-details',
                '.position-description',
                '.role-description'
            ]
        };
    }

    extractJobDescription() {
        const currentDomain = this.getCurrentDomain();
        console.log(`Extracting job description from: ${currentDomain}`);

        // Try site-specific selectors first
        const siteSelectors = this.siteSelectors[currentDomain] || this.siteSelectors['default'];
        
        for (const selector of siteSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = this.cleanText(element);
                if (text && text.length > 100) { // Minimum length check
                    console.log(`Found job description using selector: ${selector}`);
                    return text;
                }
            }
        }

        // Fallback: try to find job description using common patterns
        const fallbackText = this.fallbackExtraction();
        if (fallbackText) {
            console.log('Found job description using fallback method');
            return fallbackText;
        }

        // Last resort: extract from meta description or title
        const metaDescription = this.extractFromMeta();
        if (metaDescription) {
            console.log('Found job description from meta tags');
            return metaDescription;
        }

        console.log('No job description found');
        return null;
    }

    getCurrentDomain() {
        return window.location.hostname.replace('www.', '');
    }

    cleanText(element) {
        if (!element) return '';

        // Clone the element to avoid modifying the original
        const clone = element.cloneNode(true);

        // Remove unwanted elements
        const unwantedSelectors = [
            'script', 'style', 'nav', 'header', 'footer',
            '.navigation', '.nav', '.menu', '.sidebar',
            '.advertisement', '.ad', '.ads',
            '.social-share', '.share-buttons',
            '.related-jobs', '.similar-jobs',
            '.company-info', '.salary-info'
        ];

        unwantedSelectors.forEach(selector => {
            const elements = clone.querySelectorAll(selector);
            elements.forEach(el => el.remove());
        });

        // Get text content
        let text = clone.textContent || clone.innerText || '';

        // Clean up the text
        text = text
            .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
            .replace(/\n\s*\n/g, '\n') // Remove empty lines
            .trim();

        // Filter out very short text
        if (text.length < 50) return '';

        // Basic validation - should contain job-related keywords
        const jobKeywords = /\b(responsibilities|requirements|qualifications|experience|skills|duties|role|position|job|work|team|company|candidate|applicant)\b/i;
        if (!jobKeywords.test(text)) return '';

        return text;
    }

    fallbackExtraction() {
        // Try to find text blocks that look like job descriptions
        const textBlocks = Array.from(document.querySelectorAll('p, div, section, article'))
            .map(el => this.cleanText(el))
            .filter(text => text && text.length > 200) // Longer text blocks
            .filter(text => {
                // Must contain job-related keywords
                const jobKeywords = /\b(responsibilities|requirements|qualifications|experience|skills|duties|role|position|looking for|seeking|candidate|applicant)\b/i;
                return jobKeywords.test(text);
            })
            .sort((a, b) => b.length - a.length); // Sort by length, longest first

        return textBlocks.length > 0 ? textBlocks[0] : null;
    }

    extractFromMeta() {
        // Try meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            const content = metaDescription.getAttribute('content');
            if (content && content.length > 100) {
                return content;
            }
        }

        // Try Open Graph description
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            const content = ogDescription.getAttribute('content');
            if (content && content.length > 100) {
                return content;
            }
        }

        // Try page title if it looks like a job posting
        const title = document.title;
        if (title && /\b(job|position|role|career|hiring|opening)\b/i.test(title)) {
            return `Job Title: ${title}`;
        }

        return null;
    }

    // Method to highlight job description on page (for debugging)
    highlightJobDescription() {
        const currentDomain = this.getCurrentDomain();
        const siteSelectors = this.siteSelectors[currentDomain] || this.siteSelectors['default'];
        
        for (const selector of siteSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                element.style.border = '3px solid #ff0000';
                element.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                break;
            }
        }
    }
}

// Initialize the extractor
const extractor = new JobDescriptionExtractor();

// For debugging purposes - uncomment the line below to highlight job descriptions
// extractor.highlightJobDescription();