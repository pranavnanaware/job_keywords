# 🤖 AI Resume Optimizer - Chrome Extension

A comprehensive Chrome extension that uses AI to analyze job postings, optimize your resume, and provide intelligent career insights. Get real-time feedback on job compatibility and actionable recommendations to improve your applications.

## 🚀 Features

### 🧠 AI-Powered Analysis
- **Semantic Skill Matching**: Uses OpenAI's GPT models to understand context and meaning, not just keyword matching
- **Comprehensive Analysis**: Three analysis modes - Quick Match, Comprehensive Analysis, and Resume Optimization
- **Smart Recommendations**: Get specific, actionable advice on how to improve your resume for each job

### 📄 Multi-Format Resume Support
- **PDF Text Extraction**: Advanced PDF parsing using PDF.js library
- **Multiple Formats**: Supports PDF, TXT, and DOCX files (DOCX coming soon)
- **Persistent Storage**: Your resume is saved securely and loaded automatically

### 🎯 Visual Keyword Highlighting
- **Real-time Highlighting**: See matched and missing skills highlighted directly on job posting pages
- **Color-coded System**: Green for matched skills, red for missing skills
- **Smart Detection**: Works across major job sites and ATS platforms

### 🌐 Universal Job Site Support
- **Major Platforms**: LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, CareerBuilder, Dice, Stack Overflow
- **Generic Support**: Advanced scraping for any job posting website
- **Auto-detection**: Automatically detects when you're viewing a job posting

### 📊 Advanced Analytics
- **Match Scoring**: Intelligent percentage-based compatibility scoring
- **Skill Gap Analysis**: Identify exactly what skills you're missing
- **Career Recommendations**: AI-powered suggestions for career growth
- **Historical Tracking**: Keep track of all your job analyses

### ⚙️ Customizable Settings
- **API Key Management**: Secure storage of your OpenAI API key
- **Model Selection**: Choose between GPT-4o, GPT-4o Mini, or GPT-3.5 Turbo
- **Auto-analysis**: Optional automatic analysis when visiting job sites
- **Highlight Control**: Enable/disable keyword highlighting

## 🛠 Installation

### Prerequisites
- Google Chrome browser
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

### Setup Steps

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/ai-resume-optimizer
   cd ai-resume-optimizer
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the extension folder
   - The extension icon should appear in your toolbar

3. **Configure Settings**
   - Click the extension icon
   - Go to the Settings tab
   - Enter your OpenAI API key
   - Choose your preferred analysis model
   - Configure auto-analysis and highlighting preferences

4. **Upload Your Resume**
   - Go to the Analyze tab
   - Upload your resume (PDF or TXT format)
   - The extension will automatically save it for future use

## 🎯 How to Use

### Basic Analysis
1. Navigate to any job posting (LinkedIn, Indeed, etc.)
2. Click the extension icon
3. Choose your analysis type:
   - **Quick Match**: Fast compatibility score
   - **Comprehensive**: Detailed analysis with recommendations
   - **Optimization**: Focus on resume improvement suggestions
4. Click "Analyze Current Job Posting"
5. Review the AI-generated insights and recommendations

### Advanced Features

#### Keyword Highlighting
- Enable in Settings → "Highlight keywords on page"
- After analysis, matched skills appear in green, missing skills in red
- Hover over highlights to see tooltips

#### Auto-Analysis
- Enable in Settings → "Auto-analyze on job sites"
- Automatically analyzes job postings when you visit supported sites
- Shows notifications when job postings are detected

#### History Tracking
- Go to the History tab to see all previous analyses
- Click on any item to review past insights
- Track your improvement over time

## 🔧 Configuration

### API Models
- **GPT-4o**: Best quality analysis, higher cost
- **GPT-4o Mini**: Balanced performance and cost (recommended)
- **GPT-3.5 Turbo**: Fastest and most economical

### Cost Considerations
- Typical analysis costs $0.01-0.05 per job posting
- Quick matches are cheaper than comprehensive analyses
- Consider using GPT-4o Mini for regular use

## 📝 Analysis Types Explained

### 🔍 Quick Match
- Fast compatibility scoring
- Basic skill matching
- Minimal API usage
- Best for quick screening

### 🧠 Comprehensive Analysis
- Detailed skill gap analysis
- Career progression suggestions
- ATS optimization tips
- Market salary insights
- Best for serious applications

### 📈 Resume Optimization
- Specific resume improvement suggestions
- Keyword recommendations
- Section rewriting advice
- Best for resume updates

## 🌟 Supported Job Sites

### Fully Optimized
- **LinkedIn** - Complete extraction of job details, company info, location
- **Indeed** - Job description, title, company, salary information
- **Glassdoor** - Job posting content and company details

### Basic Support
- Monster, ZipRecruiter, CareerBuilder, Dice, Stack Overflow
- Any website with job postings (generic extraction)

## 🔒 Privacy & Security

- **API Key Security**: Keys are stored locally in Chrome's secure storage
- **Data Protection**: Resume text is stored locally, never sent to our servers
- **OpenAI Integration**: Only job posting and resume text are sent to OpenAI for analysis
- **No Tracking**: No user analytics or data collection

## 🚨 Troubleshooting

### Common Issues

1. **"No job posting found"**
   - Refresh the page and try again
   - The site might use dynamic loading - wait for content to load
   - Some sites may block content script access

2. **API Errors**
   - Check your API key in Settings
   - Ensure you have sufficient OpenAI credits
   - Try switching to a different model

3. **PDF Upload Issues**
   - Try saving the PDF as text file instead
   - Ensure the PDF contains selectable text (not scanned images)
   - File size should be under 10MB

4. **Extension Not Working**
   - Refresh the page after loading the extension
   - Check that the extension is enabled in Chrome
   - Try reloading the extension in chrome://extensions/

### Advanced Troubleshooting

- **Content Script Issues**: Some sites may block content scripts. Try refreshing or using incognito mode.
- **CORS Errors**: The extension handles API calls through the popup to avoid CORS issues.
- **Memory Issues**: Large PDFs may cause memory issues. Try using smaller files or text format.

## 🛣 Roadmap

### Upcoming Features
- **DOCX Support**: Full Microsoft Word document parsing
- **Resume Builder**: AI-powered resume generation
- **Cover Letter Generator**: Customized cover letters for each job
- **Interview Prep**: AI-generated interview questions based on job requirements
- **Salary Negotiation**: Market rate analysis and negotiation tips
- **Chrome Sync**: Sync resumes and settings across devices

### Integrations
- **LinkedIn Integration**: Direct profile import and job application tracking
- **ATS Testing**: Test how well your resume performs with different ATS systems
- **Job Alerts**: Notify when high-match jobs are posted
- **Portfolio Integration**: Connect GitHub, Behance, and other portfolio sites

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Bug Reports**: Use GitHub issues to report bugs
2. **Feature Requests**: Suggest new features via issues
3. **Code Contributions**: Fork the repo and submit pull requests
4. **Documentation**: Help improve documentation and guides

### Development Setup
```bash
git clone https://github.com/yourusername/ai-resume-optimizer
cd ai-resume-optimizer
# Load as unpacked extension in Chrome for development
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT models that power the AI analysis
- **PDF.js** for PDF text extraction capabilities
- **Chrome Extensions API** for the platform foundation
- **Job Sites** for making their content accessible for analysis

## 📞 Support

- **GitHub Issues**: For bug reports and feature requests
- **Email**: support@ai-resume-optimizer.com
- **Documentation**: Check this README and inline help text

---

**Made with ❤️ to help job seekers land their dream jobs**

*Disclaimer: This extension is not affiliated with any job posting websites. Always follow the terms of service of the websites you visit.*
