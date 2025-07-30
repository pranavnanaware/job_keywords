// Job Keywords Optimizer - Main Popup Script

class JobKeywordsOptimizer {
    constructor() {
        this.jobDescription = '';
        this.resumeBullets = '';
        this.keywords = [];
        this.currentScore = 0;
        
        this.initializeEventListeners();
        this.loadSavedData();
    }

    initializeEventListeners() {
        // Extract job description from current page
        document.getElementById('extractJobBtn').addEventListener('click', () => {
            this.extractJobDescription();
        });

        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.analyzeAndSuggest();
        });

        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Auto-save input changes
        document.getElementById('jobDescription').addEventListener('input', (e) => {
            this.jobDescription = e.target.value;
            this.saveData();
        });

        document.getElementById('resumeBullets').addEventListener('input', (e) => {
            this.resumeBullets = e.target.value;
            this.saveData();
        });
    }

    async extractJobDescription() {
        try {
            // Get the current tab
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            // Send message to content script to extract job description
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractJobDescription' });
            
            if (response && response.success) {
                document.getElementById('jobDescription').value = response.jobDescription;
                this.jobDescription = response.jobDescription;
                this.saveData();
            } else {
                this.showError('Could not extract job description from this page. Please paste it manually.');
            }
        } catch (error) {
            console.error('Error extracting job description:', error);
            this.showError('Error extracting job description. Please paste it manually.');
        }
    }

    analyzeAndSuggest() {
        const jobDesc = document.getElementById('jobDescription').value.trim();
        const bullets = document.getElementById('resumeBullets').value.trim();

        if (!jobDesc || !bullets) {
            this.showError('Please provide both job description and resume bullets.');
            return;
        }

        this.jobDescription = jobDesc;
        this.resumeBullets = bullets;
        this.saveData();

        this.showLoading(true);
        
        setTimeout(() => {
            this.performAnalysis();
            this.showLoading(false);
        }, 1000); // Simulate analysis time
    }

    performAnalysis() {
        // Extract keywords from job description
        this.keywords = this.extractKeywords(this.jobDescription);
        
        // Calculate current match score
        this.currentScore = this.calculateMatchScore();
        
        // Generate suggestions
        const suggestions = this.generateSuggestions();
        
        // Update UI
        this.updateScoreDisplay();
        this.displaySuggestions(suggestions);
        this.displayMissingKeywords();
        
        document.getElementById('resultsSection').style.display = 'block';
    }

    extractKeywords(text) {
        // Common words to ignore
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'who', 'what', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
        ]);

        // Clean and split text
        const words = text.toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

        // Find phrases (2-3 words) and single words
        const phrases = [];
        const singleWords = [];

        // Extract 2-3 word phrases
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i] && words[i + 1]) {
                phrases.push(`${words[i]} ${words[i + 1]}`);
            }
            if (words[i] && words[i + 1] && words[i + 2]) {
                phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
            }
        }

        // Add single important words
        singleWords.push(...words);

        // Count occurrences and prioritize
        const wordCount = {};
        [...phrases, ...singleWords].forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });

        // Sort by frequency and importance
        const sortedKeywords = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50) // Top 50 keywords
            .map(([word]) => word);

        // Prioritize technical terms, skills, and tools
        const techPatterns = /(javascript|python|java|react|node|sql|aws|docker|kubernetes|agile|scrum|api|database|frontend|backend|fullstack|devops|ci\/cd|git|testing|automation|machine learning|data science|analytics|cloud|azure|gcp)/i;
        
        return sortedKeywords.sort((a, b) => {
            const aIsTech = techPatterns.test(a);
            const bIsTech = techPatterns.test(b);
            if (aIsTech && !bIsTech) return -1;
            if (!aIsTech && bIsTech) return 1;
            return wordCount[b] - wordCount[a];
        });
    }

    calculateMatchScore() {
        const resumeText = this.resumeBullets.toLowerCase();
        let matchedKeywords = 0;
        
        for (const keyword of this.keywords.slice(0, 30)) { // Check top 30 keywords
            if (resumeText.includes(keyword.toLowerCase())) {
                matchedKeywords++;
            }
        }
        
        return Math.round((matchedKeywords / Math.min(30, this.keywords.length)) * 100);
    }

    generateSuggestions() {
        const resumeText = this.resumeBullets.toLowerCase();
        const bulletPoints = this.resumeBullets.split('\n').filter(bullet => bullet.trim());
        const suggestions = [];
        
        // Find missing keywords
        const missingKeywords = this.keywords.slice(0, 20).filter(keyword => 
            !resumeText.includes(keyword.toLowerCase())
        );

        // Generate suggestions for missing keywords
        missingKeywords.slice(0, 8).forEach((keyword, index) => {
            const suggestion = this.generateBulletSuggestion(keyword, bulletPoints);
            if (suggestion) {
                suggestions.push({
                    type: 'NEW_BULLET',
                    keyword: keyword,
                    suggestion: suggestion,
                    improvement: '+12-15%'
                });
            }
        });

        // Generate modifications for existing bullets
        bulletPoints.slice(0, 5).forEach((bullet, index) => {
            const modification = this.generateBulletModification(bullet, missingKeywords);
            if (modification) {
                suggestions.push({
                    type: 'MODIFY_BULLET',
                    original: bullet.trim(),
                    suggestion: modification,
                    improvement: '+8-10%'
                });
            }
        });

        return suggestions;
    }

    generateBulletSuggestion(keyword, existingBullets) {
        // Define templates based on keyword type
        const templates = {
            technical: [
                `Developed and maintained applications using ${keyword}, improving system performance by 25%`,
                `Implemented ${keyword} solutions to optimize workflow efficiency and reduce processing time`,
                `Utilized ${keyword} to build scalable systems handling 10K+ daily transactions`,
                `Architected ${keyword}-based solutions that enhanced user experience and system reliability`
            ],
            management: [
                `Led cross-functional teams implementing ${keyword} methodologies, resulting in 30% faster delivery`,
                `Managed ${keyword} initiatives that improved team productivity and project outcomes`,
                `Coordinated ${keyword} processes across multiple departments to ensure seamless operations`,
                `Supervised ${keyword} implementation, training 15+ team members on best practices`
            ],
            analytical: [
                `Analyzed data using ${keyword} to identify trends and drive strategic decision-making`,
                `Leveraged ${keyword} for comprehensive reporting and business intelligence insights`,
                `Applied ${keyword} techniques to process large datasets and generate actionable recommendations`,
                `Utilized ${keyword} for predictive modeling and performance optimization strategies`
            ],
            general: [
                `Collaborated with stakeholders on ${keyword} initiatives to achieve business objectives`,
                `Contributed to ${keyword} projects that enhanced operational efficiency and quality`,
                `Participated in ${keyword} planning and execution, delivering results ahead of schedule`,
                `Supported ${keyword} implementation across various business functions and processes`
            ]
        };

        // Determine keyword category
        let category = 'general';
        if (/(javascript|python|java|react|node|sql|aws|docker|kubernetes|api|database|frontend|backend|fullstack|devops|ci\/cd|git|testing|automation|machine learning|data science|cloud|azure|gcp)/i.test(keyword)) {
            category = 'technical';
        } else if (/(manage|lead|supervise|coordinate|direct|oversee|agile|scrum|project)/i.test(keyword)) {
            category = 'management';
        } else if (/(analy|data|report|metric|insight|research|statistical)/i.test(keyword)) {
            category = 'analytical';
        }

        const categoryTemplates = templates[category];
        return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
    }

    generateBulletModification(bullet, missingKeywords) {
        if (!bullet || bullet.length < 20) return null;

        // Find 1-2 relevant missing keywords to incorporate
        const relevantKeywords = missingKeywords.slice(0, 3);
        if (relevantKeywords.length === 0) return null;

        // Simple modification strategies
        const keyword = relevantKeywords[0];
        
        // Strategy 1: Add keyword to technology stack
        if (bullet.includes('using') || bullet.includes('with')) {
            return bullet.replace(/(using|with)(\s+[\w\s,]+)/, `$1$2, ${keyword}`);
        }
        
        // Strategy 2: Add as method/tool
        if (bullet.includes('developed') || bullet.includes('created') || bullet.includes('built')) {
            return bullet.replace(/(developed|created|built)/, `$1 ${keyword}-based`);
        }
        
        // Strategy 3: Add as improvement method
        return `${bullet.trim()} leveraging ${keyword} methodologies`;
    }

    updateScoreDisplay() {
        const scoreCircle = document.getElementById('scoreCircle');
        const percentage = this.currentScore;
        
        scoreCircle.style.setProperty('--percentage', `${percentage * 3.6}deg`);
        scoreCircle.textContent = `${percentage}%`;
        
        // Color based on score
        let color = '#ef4444'; // red
        if (percentage >= 70) color = '#10b981'; // green
        else if (percentage >= 50) color = '#f59e0b'; // yellow
        
        scoreCircle.style.background = `conic-gradient(from 0deg, ${color} ${percentage * 3.6}deg, #e5e7eb ${percentage * 3.6}deg)`;
    }

    displaySuggestions(suggestions) {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';

        if (suggestions.length === 0) {
            suggestionsList.innerHTML = '<div class="suggestion-item">No suggestions available. Your resume already has good keyword coverage!</div>';
            return;
        }

        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            
            const typeText = suggestion.type === 'NEW_BULLET' ? 'New Bullet Point' : 'Modify Existing';
            
            div.innerHTML = `
                <div class="suggestion-type">${typeText}</div>
                ${suggestion.original ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;"><strong>Original:</strong> ${suggestion.original}</div>` : ''}
                <div class="suggestion-text">${suggestion.suggestion}</div>
                <div class="improvement-score">Potential Score Improvement: ${suggestion.improvement}</div>
            `;
            
            suggestionsList.appendChild(div);
        });
    }

    displayMissingKeywords() {
        const keywordsList = document.getElementById('keywordsList');
        const resumeText = this.resumeBullets.toLowerCase();
        
        const missingKeywords = this.keywords.slice(0, 20).filter(keyword => 
            !resumeText.includes(keyword.toLowerCase())
        );

        keywordsList.innerHTML = '';
        
        if (missingKeywords.length === 0) {
            keywordsList.innerHTML = '<div style="color: #10b981; font-weight: 600;">✓ All major keywords are present in your resume!</div>';
            return;
        }

        missingKeywords.slice(0, 15).forEach(keyword => {
            const span = document.createElement('span');
            span.style.cssText = `
                display: inline-block;
                background: #fef3c7;
                color: #92400e;
                padding: 4px 8px;
                margin: 2px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
            `;
            span.textContent = keyword;
            keywordsList.appendChild(span);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    showLoading(show) {
        document.getElementById('loadingSection').style.display = show ? 'block' : 'none';
        document.getElementById('resultsSection').style.display = show ? 'none' : 'block';
        document.getElementById('analyzeBtn').disabled = show;
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper modal
        alert(message);
    }

    saveData() {
        chrome.storage.local.set({
            jobDescription: this.jobDescription,
            resumeBullets: this.resumeBullets
        });
    }

    loadSavedData() {
        chrome.storage.local.get(['jobDescription', 'resumeBullets'], (result) => {
            if (result.jobDescription) {
                document.getElementById('jobDescription').value = result.jobDescription;
                this.jobDescription = result.jobDescription;
            }
            if (result.resumeBullets) {
                document.getElementById('resumeBullets').value = result.resumeBullets;
                this.resumeBullets = result.resumeBullets;
            }
        });
    }
}

// Initialize the app when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new JobKeywordsOptimizer();
});