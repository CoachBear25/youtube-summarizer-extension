# 🎯 YouTube Video Summarizer Extension

AI-powered browser extension that automatically summarizes YouTube videos using OpenAI GPT or Anthropic Claude.  
![GitHub last commit](https://img.shields.io/github/last-commit/CoachBear25/youtube-summarizer-extension)
![GitHub repo size](https://img.shields.io/github/repo-size/CoachBear25/youtube-summarizer-extension)
![Chrome Extension Badge](https://img.shields.io/badge/Chrome_Extension-Coming_Soon-blue)

---

## ✨ Features

- **One-click summaries**: Adds a "Summarize Video" button to YouTube video pages  
- **Multiple AI providers**: Support for OpenAI GPT and Anthropic Claude  
- **Flexible formats**: Choose between bullet points, paragraphs, or detailed analysis  
- **Smart transcript extraction**: Automatically fetches video captions/transcripts  
- **Clean UI**: Styled overlay that matches YouTube's design  
- **Privacy-focused**: API keys stored locally, never shared  

---

## 🛠️ Tech Stack

- HTML, CSS, JavaScript  
- Chrome Extension APIs  
- YouTube Transcript API (fallback logic)  
- Claude/OpenAI API support (optional)  

---

## 🚀 Roadmap

- [ ] Add support for multiple languages  
- [ ] Save summaries to Notion/Docs  
- [ ] Export to PDF/Markdown  
- [ ] Add popup UI to choose summary style (bullet/short/long)  
- [ ] Publish to Chrome Web Store  

---

## 👨‍💻 Contributing

Pull requests are welcome! Open an issue first to discuss any major changes.

---

## 🚀 Installation

### Option 1: Load as Unpacked Extension (Recommended for Development)

1. Download or clone this repository  
2. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`  
3. Enable **Developer mode** in the top right  
4. Click **Load unpacked** and select the extension folder  
5. The extension should now appear in your extensions list  

### Option 2: Create CRX Package

1. In `chrome://extensions/`, click **Pack extension**  
2. Select the extension folder as "Extension root directory"  
3. Click **Pack Extension**  
4. Install the generated `.crx` file  

---

## ⚙️ Setup

1. Click the extension icon in your browser toolbar  
2. Choose your AI provider (OpenAI or Claude)  
3. Enter your API key:  
   - **OpenAI**: [Get your key](https://platform.openai.com/api-keys)  
   - **Claude**: [Get your key](https://console.anthropic.com/)  
4. Select your preferred model and summary format  
5. Click **Save Settings**  
6. Test the connection to ensure everything works  

---

## 📖 Usage

1. Navigate to any YouTube video  
2. Look for the blue **Summarize Video** button below the video title  
3. Click the button to generate a summary  
4. The summary will appear in a popup overlay  
5. Click the **X** or outside the overlay to close it  

---

## 🔧 Configuration Options

### AI Providers & Models

**OpenAI:**
- GPT-3.5 Turbo (fast, cost-effective)  
- GPT-4 (higher quality, more expensive)  
- GPT-4 Turbo (latest model)  

**Anthropic Claude:**
- Claude 3 Haiku (fastest, most economical)  
- Claude 3 Sonnet (balanced performance)  
- Claude 3 Opus (highest capability)  

### Summary Formats

- **Bullet Points**: 5–10 key takeaways with timestamps  
- **Paragraph**: 2–3 structured paragraphs  
- **Detailed Analysis**: Comprehensive summary with all major points  

---

## 🛠️ Development

### File Structure
youtube-summarizer-extension/
├── manifest.json # Extension configuration
├── content.js # Injects UI into YouTube pages
├── background.js # Handles API calls
├── popup.html # Settings interface
├── popup.js # Settings logic
└── README.md # This file
