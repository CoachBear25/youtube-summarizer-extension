let summaryOverlay = null;

console.log('🎯 YouTube Summarizer: Content script loaded');

function createSummarizeButton() {
  // Prevent duplicate buttons
  if (document.getElementById('yt-summarize-btn')) {
    console.log('🔄 Button already exists, skipping injection');
    return;
  }

  const btn = document.createElement('button');
  btn.id = 'yt-summarize-btn';
  btn.innerText = '🧠 Summarize Video';

  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 12px 20px;
    background: #065fd4;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    font-family: 'Roboto', 'Arial', sans-serif;
    transition: all 0.2s ease;
    user-select: none;
  `;

  // Add hover effects
  btn.addEventListener('mouseenter', () => {
    btn.style.backgroundColor = '#1976d2';
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 15px rgba(0,0,0,0.3)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.backgroundColor = '#065fd4';
    btn.style.transform = 'translateY(0)';
    btn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
  });

  btn.onclick = handleSummarize;
  document.body.appendChild(btn);

  console.log('✅ Floating Summarize button injected');
}

function createSummaryOverlay() {
  if (summaryOverlay && document.contains(summaryOverlay)) {
    summaryOverlay.remove();
  }

  summaryOverlay = document.createElement('div');
  summaryOverlay.id = 'yt-summary-overlay';
  summaryOverlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    background: var(--yt-spec-base-background, #fff);
    border: 1px solid var(--yt-spec-10-percent-layer, #ccc);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 10000;
    overflow: hidden;
    font-family: Roboto, Arial, sans-serif;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--yt-spec-10-percent-layer, #eee);
    background: var(--yt-spec-brand-button-text, #065fd4);
    color: white;
  `;

  header.innerHTML = `
    <h3 style="margin: 0; font-size: 16px; font-weight: 500;">Video Summary</h3>
    <button id="close-summary" style="
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">×</button>
  `;

  const content = document.createElement('div');
  content.id = 'summary-content';
  content.style.cssText = `
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
    color: var(--yt-spec-text-primary, #000);
    line-height: 1.6;
  `;

  summaryOverlay.appendChild(header);
  summaryOverlay.appendChild(content);
  document.body.appendChild(summaryOverlay);

  document.getElementById('close-summary').addEventListener('click', () => {
    summaryOverlay.remove();
  });

  summaryOverlay.addEventListener('click', (e) => {
    if (e.target === summaryOverlay) {
      summaryOverlay.remove();
    }
  });

  return content;
}

async function getVideoTranscript(videoId) {
  // Debug toggle - set to false to suppress logs for performance/privacy
  const debugTranscript = true;
  
  // Helper function to log response metadata
  function logResponseMeta(response, text, videoId, type) {
    if (!debugTranscript) return;
    
    const contentType = response.headers.get('Content-Type') || 'unknown';
    const isUnexpectedHTML = contentType.includes('text/html') && type !== 'legacy';
    
    console.log(`📋 Response status: ${response.status} (${response.ok ? 'OK' : 'ERROR'})`);
    console.log(`📋 Response URL: ${response.url}`);
    console.log(`📋 Content-Type: ${contentType}`);
    console.log(`📋 Response length: ${text.length} characters`);
    console.log(`📋 Raw ${type} response for video ${videoId}:`, text.substring(0, 200));
    
    if (isUnexpectedHTML) {
      console.warn(`⚠️ Unexpected HTML content-type for ${type} captions (likely error page)`);
    }
    
    // Final guard: Confirm when transcript truly isn't available
    if (text.length === 0 && contentType.includes('html')) {
      console.warn(`⚠️ ${type} response for ${videoId} was an empty HTML page — likely no transcript available`);
    }
  }
  
  // Helper function to attempt transcript fetch with comprehensive debugging
  async function attemptFetch(url, type, attemptNumber, customHeaders = {}) {
    if (debugTranscript) {
      console.log(`----- Attempting ${type} captions for ${videoId} (attempt ${attemptNumber}) -----`);
      console.log(`📋 Fetching URL: ${url}`);
    }
    
    try {
      const headers = { ...customHeaders };
      const response = await fetch(url, { headers });
      
      // Check response status before reading text
      if (!response.ok) {
        if (debugTranscript) {
          console.warn(`⚠️ ${type} request failed with status ${response.status} for video: ${videoId}`);
        }
        return null;
      }
      
      const text = await response.text();
      logResponseMeta(response, text, videoId, type);

      // Enhanced response validation
      if (!text || text.trim() === '') {
        if (debugTranscript) console.warn(`⚠️ Empty ${type} response received for video: ${videoId}`);
        return null;
      }
      
      if (text.length < 20) {
        if (debugTranscript) console.warn(`⚠️ Suspiciously short ${type} response (${text.length} chars) for video: ${videoId}`);
        return null;
      }

      // Determine if response is JSON or XML
      const trimmedText = text.trim();
      const isXML = trimmedText.startsWith('<');
      const isHTML = trimmedText.toLowerCase().includes('<!doctype html') || 
                     trimmedText.toLowerCase().includes('<html');
      
      if (isHTML) {
        if (debugTranscript) console.warn(`⚠️ ${type} response appears to be HTML (likely error page) for video: ${videoId}`);
        return null;
      }
      
      if (isXML) {
        // Parse XML response (Legacy Google API)
        if (debugTranscript) console.log(`📋 Processing XML ${type} response for video: ${videoId}`);
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
          if (debugTranscript) {
            console.log(`📋 Failed to parse XML ${type} response for video: ${videoId}`);
            console.log(`📋 XML parse error:`, parseError.textContent);
          }
          return null;
        }

        // Extract text elements from XML
        const textElements = xmlDoc.querySelectorAll('text');
        if (textElements.length === 0) {
          if (debugTranscript) console.log(`📋 No text elements found in ${type} XML response for video: ${videoId}`);
          return null;
        }

        if (debugTranscript) console.log(`📋 Found ${textElements.length} text elements in ${type} XML response`);

        // Enhanced transcript parsing with edge-case handling
        const transcriptLines = Array.from(textElements)
          .map(element => {
            const start = parseFloat(element.getAttribute('start') || '0');
            const duration = parseFloat(element.getAttribute('dur') || '0');
            const text = element.textContent?.trim() || '';
            
            // Enhanced HTML entity decoding
            const decodedText = text
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&#x27;/g, "'")
              .replace(/&apos;/g, "'")
              .replace(/&nbsp;/g, ' ')
              .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
              .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
              
            return { 
              text: decodedText, 
              timestamp: Math.floor(start),
              duration: Math.floor(duration)
            };
          })
          .filter(item => item.text && item.text.length > 0)
          .map(item => `[${formatTime(item.timestamp)}] ${item.text}`);

        if (transcriptLines.length === 0) {
          if (debugTranscript) console.log(`📋 No valid transcript content found in ${type} XML response for video: ${videoId}`);
          return null;
        }

        if (debugTranscript) console.log(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} captions used for video: ${videoId} (${transcriptLines.length} lines)`);
        return transcriptLines.join('\n');

      } else {
        // Parse JSON response (YouTube API)
        if (debugTranscript) console.log(`📋 Processing JSON ${type} response for video: ${videoId}`);
        
        // Guard clause before JSON parsing to prevent errors
        if (!text || text.trim().length < 20 || text.trim().startsWith('<')) {
          if (debugTranscript) console.warn(`⚠️ Skipping ${type} parsing for video ${videoId} — response too short or likely HTML`);
          return null;
        }
        
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          if (debugTranscript) {
            console.log(`📋 Failed to parse JSON ${type} response for video ${videoId}:`, text.substring(0, 200));
            console.log(`📋 JSON parse error:`, parseError.message);
          }
          return null;
        }

        if (!data.events || !Array.isArray(data.events)) {
          if (debugTranscript) {
            console.log(`📋 No transcript events found in ${type} response for video: ${videoId}`);
            console.log(`📋 Response structure:`, Object.keys(data));
          }
          return null;
        }

        if (debugTranscript) console.log(`📋 Found ${data.events.length} events in ${type} JSON response`);

        // Enhanced transcript parsing with edge-case handling
        const transcriptLines = data.events
          .filter(event => event.segs && Array.isArray(event.segs) && event.segs.length > 0)
          .map(event => {
            // Handle various seg structures
            const text = event.segs
              .map(seg => {
                // Support both utf8 and text properties
                return seg.utf8 || seg.text || '';
              })
              .join('')
              .trim();
              
            const timestamp = Math.floor((event.tStartMs || event.start || 0) / 1000);
            return { text, timestamp };
          })
          .filter(item => item.text && item.text.length > 0)
          .map(item => `[${formatTime(item.timestamp)}] ${item.text}`);

        if (transcriptLines.length === 0) {
          if (debugTranscript) console.log(`📋 No valid transcript content found in ${type} response for video: ${videoId}`);
          return null;
        }

        if (debugTranscript) console.log(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} captions used for video: ${videoId} (${transcriptLines.length} lines)`);
        return transcriptLines.join('\n');
      }

    } catch (error) {
      if (debugTranscript) {
        console.error(`📋 Error fetching ${type} captions for video ${videoId}:`, error.message);
        console.error(`📋 Error stack:`, error.stack);
      }
      return null;
    }
  }

  try {
    // First attempt: Try manual captions
    const manualUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`;
    const manualTranscript = await attemptFetch(manualUrl, 'manual', 1);
    
    if (manualTranscript) {
      return manualTranscript;
    }

    // Second attempt: Try auto-generated captions
    if (debugTranscript) console.log(`🔄 Manual captions failed for video: ${videoId}, trying auto-generated captions...`);
    const autoUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3&caps=asr`;
    const autoTranscript = await attemptFetch(autoUrl, 'auto', 2);
    
    if (autoTranscript) {
      return autoTranscript;
    }

    // Third attempt: Try legacy Google transcript endpoint
    if (debugTranscript) console.log(`🔄 YouTube API methods failed for video: ${videoId}, trying legacy Google transcript endpoint...`);
    const legacyUrl = `https://video.google.com/timedtext?lang=en&v=${videoId}`;
    const legacyTranscript = await attemptFetch(legacyUrl, 'legacy', 3);
    
    if (legacyTranscript) {
      return legacyTranscript;
    }

    // All attempts failed
    if (debugTranscript) console.log(`❌ All transcript fetch attempts failed for video: ${videoId} (manual, auto-generated, and legacy)`);
    throw new Error('Transcript not available or captions may be disabled.');

  } catch (error) {
    if (debugTranscript) console.error(`❌ Transcript fetch failed for video: ${videoId}:`, error.message);
    throw error;
  }
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getVideoId() {
  // Handle regular YouTube videos
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');
  
  if (videoId) {
    console.log('📹 Video ID detected:', videoId);
    return videoId;
  }
  
  // Handle YouTube Shorts
  const shortsMatch = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    console.log('📹 Shorts video ID detected:', shortsMatch[1]);
    return shortsMatch[1];
  }
  
  console.log('❌ No video ID found in URL:', window.location.href);
  return null;
}

async function handleSummarize() {
  const videoId = getVideoId();
  if (!videoId) {
    alert('Could not detect video ID');
    return;
  }

  const contentDiv = createSummaryOverlay();
  contentDiv.innerHTML = `
    <div style="text-align: center; padding: 20px;">
      <div style="
        width: 40px;
        height: 40px;
        border: 4px solid var(--yt-spec-10-percent-layer, #eee);
        border-top: 4px solid var(--yt-spec-brand-button-text, #065fd4);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      "></div>
      <p>Fetching transcript and generating summary...</p>
    </div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  try {
    const transcript = await getVideoTranscript(videoId);
    
    chrome.runtime.sendMessage({
      action: 'summarize',
      transcript: transcript,
      videoId: videoId
    }, (response) => {
      if (response.error) {
        contentDiv.innerHTML = `
          <div style="color: #d32f2f; padding: 20px;">
            <h4>Error generating summary:</h4>
            <p>${response.error}</p>
            <p style="margin-top: 16px; font-size: 14px; color: #666;">
              Make sure you've configured your API key in the extension settings.
            </p>
          </div>
        `;
      } else {
        contentDiv.innerHTML = `
          <div style="white-space: pre-wrap;">${response.summary}</div>
        `;
      }
    });
  } catch (error) {
    contentDiv.innerHTML = `
      <div style="color: #d32f2f; padding: 20px;">
        <h4>❌ Error fetching transcript:</h4>
        <p style="margin: 12px 0; font-weight: 500;">${error.message}</p>
        <div style="margin-top: 16px; padding: 12px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #e65100;">
            💡 <strong>Possible reasons:</strong><br>
            • This video may not have captions available<br>
            • Captions may be auto-generated or region-locked<br>
            • The video may be private or have restricted access<br>
            • Try videos with manual captions for better results
          </p>
        </div>
      </div>
    `;
  }
}

function shouldInjectButton() {
  const url = window.location.href;
  return url.includes('youtube.com/watch') || url.includes('youtube.com/shorts');
}

function init() {
  console.log('🚀 Initializing YouTube Summarizer on:', window.location.href);
  if (shouldInjectButton()) {
    createSummarizeButton();
  }
}

// Track URL changes for SPA navigation
let lastUrl = location.href;

const observer = new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    console.log('🔄 URL changed from', lastUrl, 'to', currentUrl);
    lastUrl = currentUrl;
    
    // Remove existing button if navigating away from video pages
    if (!shouldInjectButton()) {
      const existingBtn = document.getElementById('yt-summarize-btn');
      if (existingBtn) {
        existingBtn.remove();
        console.log('🗑️ Button removed - not on video page');
      }
    } else {
      // Inject button on video pages
      createSummarizeButton();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initialize
init();

// Also inject after a short delay to ensure DOM is ready
setTimeout(() => {
  if (shouldInjectButton()) {
    createSummarizeButton();
  }
}, 1000);