# 🎯 YouTube Video Summarizer Extension

AI-powered browser extension that automatically summarizes YouTube videos using OpenAI GPT or Anthropic Claude.
![GitHub last commit](https://img.shields.io/github/last-commit/CoachBear25/youtube-summarizer-extension)
![GitHub repo size](https://img.shields.io/github/repo-size/CoachBear25/youtube-summarizer-extension)
![Chrome Extension Badge](https://img.shields.io/badge/Chrome_Extension-Coming_Soon-blue)

## ✨ Features

- **One-click summaries**: Adds a "Summarize Video" button to YouTube video pages
- **Multiple AI providers**: Support for OpenAI GPT and Anthropic Claude
- **Flexible formats**: Choose between bullet points, paragraphs, or detailed analysis
- **Smart transcript extraction**: Automatically fetches video captions/transcripts
- **Clean UI**: Styled overlay that matches YouTube's design
- **Privacy-focused**: API keys stored locally, never shared


🛠️ Tech Stack
HTML, CSS, JavaScript

Chrome Extension APIs

YouTube Transcript API (fallback logic)

Claude/OpenAI API support (optional)

🚀 Roadmap
 Add support for multiple languages

 Save summaries to Notion/Docs

 Export to PDF/Markdown

 Add popup UI to choose summary style (bullet/short/long)

 Publish to Chrome Web Store

👨‍💻 Contributing
Pull requests are welcome! Open an issue first to discuss any major changes.

## 🚀 Installation

### Option 1: Load as Unpacked Extension (Recommended for Development)

1. Download or clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your extensions list

### Option 2: Create CRX Package

1. In `chrome://extensions/`, click "Pack extension"
2. Select the extension folder as "Extension root directory"
3. Click "Pack Extension"
4. Install the generated `.crx` file

## ⚙️ Setup

1. Click the extension icon in your browser toolbar
2. Choose your AI provider (OpenAI or Claude)
3. Enter your API key:
   - **OpenAI**: Get your key from [OpenAI API Keys](https://platform.openai.com/api-keys)
   - **Claude**: Get your key from [Anthropic Console](https://console.anthropic.com/)
4. Select your preferred model and summary format
5. Click "Save Settings"
6. Test the connection to ensure everything works

## 📖 Usage

1. Navigate to any YouTube video
2. Look for the blue "Summarize Video" button below the video title
3. Click the button to generate a summary
4. The summary will appear in a popup overlay
5. Click the X or outside the overlay to close it

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

- **Bullet Points**: 5-10 key takeaways with timestamps
- **Paragraph**: 2-3 structured paragraphs
- **Detailed Analysis**: Comprehensive summary with all major points

## 🛠️ Development

### File Structure
```
youtube-summarizer-extension/
├── manifest.json          # Extension configuration
├── content.js            # Injects UI into YouTube pages
├── background.js         # Handles API calls
├── popup.html           # Settings interface
├── popup.js             # Settings logic
└── README.md            # This file
```

### Key Components

- **Content Script**: Injects the summarize button and handles UI interactions
- **Background Script**: Manages API calls securely
- **Popup**: Provides settings interface for API configuration
- **Manifest**: Defines permissions and extension metadata

## 🔒 Privacy & Security

- API keys are stored locally using Chrome's sync storage
- No data is sent to third-party servers except the chosen AI provider
- Transcripts are only used for summarization and not stored
- All network requests are made directly to official AI APIs

## 📋 Requirements

- Chrome 88+ or Edge 88+
- Valid API key from OpenAI or Anthropic
- YouTube videos with available captions/transcripts

## ❗ Troubleshooting

### "Transcript not available" error
- The video may not have captions enabled
- Try videos with auto-generated or manual captions
- Some private or restricted videos may not have accessible transcripts

### API connection issues
- Verify your API key is correct and active
- Check your account has sufficient credits/quota
- Ensure you're using the correct model name for your provider

### Button not appearing
- Try refreshing the YouTube page
- Check if you're on a video page (not channel or playlist)
- Disable other YouTube extensions that might interfere

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to modify and distribute as needed.

---

**Note**: This extension requires valid API keys from OpenAI or Anthropic. API usage will incur costs based on your chosen provider's pricing.
