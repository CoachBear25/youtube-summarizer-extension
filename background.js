console.log('🎯 YouTube Summarizer: Background script loaded');
console.log('🚀 Service worker ready for API calls');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Received message:', request.action, 'from tab:', sender.tab?.id);
  
  if (request.action === 'summarize') {
    handleSummarizeRequest(request, sendResponse);
    return true; // Keep message channel open for async response
  } else if (request.action === 'testConnection') {
    handleTestConnection(request, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  return false; // Close message channel for unknown actions
});

async function handleSummarizeRequest(request, sendResponse) {
  const startTime = Date.now();
  console.log('🤖 Starting summarization for video:', request.videoId);
  
  try {
    // Get settings from storage
    const settings = await chrome.storage.sync.get(['provider', 'apiKey', 'model', 'format']);
    console.log('⚙️ Settings loaded:', {
      provider: settings.provider,
      model: settings.model,
      format: settings.format,
      hasApiKey: !!settings.apiKey
    });
    
    // Validate API key
    if (!settings.apiKey || settings.apiKey.trim() === '') {
      console.log('❌ API key not configured');
      sendResponse({ 
        summary: null,
        error: 'API key not configured. Please set up your API key in the extension settings.' 
      });
      return;
    }

    // Validate transcript
    if (!request.transcript || request.transcript.trim() === '') {
      console.log('❌ Empty transcript received');
      sendResponse({ 
        summary: null,
        error: 'No transcript content to summarize.' 
      });
      return;
    }

    console.log('📝 Transcript length:', request.transcript.length, 'characters');

    // Generate summary
    const summary = await generateSummary(
      request.transcript,
      settings.provider || 'openai',
      settings.apiKey,
      settings.model || 'gpt-3.5-turbo',
      settings.format || 'bullets'
    );

    // Increment counter and send response
    await incrementSummaryCount();
    
    const duration = Date.now() - startTime;
    console.log('✅ Summary generated successfully in', duration + 'ms');
    
    sendResponse({ 
      summary: summary,
      error: null 
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Summarization failed after', duration + 'ms:', error);
    
    // Send user-friendly error message
    sendResponse({ 
      summary: null,
      error: getUserFriendlyError(error.message)
    });
  }
}

async function handleTestConnection(request, sendResponse) {
  console.log('🔍 Testing connection to:', request.provider, 'with model:', request.model);
  
  try {
    const testPrompt = "This is a test. Please respond with 'Connection successful!'";
    
    if (request.provider === 'openai') {
      const result = await callOpenAI(testPrompt, request.apiKey, request.model);
      console.log('✅ OpenAI test successful:', result);
    } else if (request.provider === 'claude') {
      const result = await callClaude(testPrompt, request.apiKey, request.model);
      console.log('✅ Claude test successful:', result);
    } else {
      throw new Error('Unsupported provider: ' + request.provider);
    }
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    sendResponse({ 
      success: false, 
      error: getUserFriendlyError(error.message) 
    });
  }
}

async function generateSummary(transcript, provider, apiKey, model, format) {
  const formatInstructions = {
    bullets: "Summarize this YouTube video transcript into 5-10 clear bullet points with timestamps where possible. Focus on the main points and key takeaways.",
    paragraph: "Summarize this YouTube video transcript into 2-3 well-structured paragraphs. Include the main themes and key insights.",
    detailed: "Provide a comprehensive summary of this YouTube video transcript. Include main topics, key arguments, conclusions, and important details with timestamps where relevant."
  };

  // Truncate transcript if too long (keep within API limits)
  const maxTranscriptLength = 8000; // Conservative limit for API context
  const truncatedTranscript = transcript.length > maxTranscriptLength 
    ? transcript.substring(0, maxTranscriptLength) + '\n\n[Transcript truncated due to length]'
    : transcript;

  const prompt = `${formatInstructions[format] || formatInstructions.bullets}

Transcript:
${truncatedTranscript}

Please provide a clear, well-organized summary:`;

  console.log('💬 Generating summary with:', { provider, model, format, promptLength: prompt.length });

  if (provider === 'openai') {
    return await callOpenAI(prompt, apiKey, model);
  } else if (provider === 'claude') {
    return await callClaude(prompt, apiKey, model);
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

async function callOpenAI(prompt, apiKey, model) {
  console.log('🤖 Calling OpenAI API with model:', model);
  
  const requestBody = {
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that creates clear, concise summaries of video content. Always provide well-structured, informative summaries.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 1024,
    temperature: 0.3,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ OpenAI API error response:', responseText);
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        throw new Error(`OpenAI API error (${response.status}): ${responseText}`);
      }
      
      const errorMessage = errorData.error?.message || `OpenAI API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API');
    }

    const summary = data.choices[0].message.content;
    console.log('✅ OpenAI API response received, length:', summary.length);
    
    return summary;
    
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to OpenAI API');
    }
    throw error;
  }
}

async function callClaude(prompt, apiKey, model) {
  console.log('🤖 Calling Claude API with model:', model);
  
  const requestBody = {
    model: model,
    max_tokens: 1024,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Claude API error response:', responseText);
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        throw new Error(`Claude API error (${response.status}): ${responseText}`);
      }
      
      const errorMessage = errorData.error?.message || `Claude API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude API');
    }

    const summary = data.content[0].text;
    console.log('✅ Claude API response received, length:', summary.length);
    
    return summary;
    
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to Claude API');
    }
    throw error;
  }
}

async function incrementSummaryCount() {
  try {
    const result = await chrome.storage.sync.get(['summaryCount']);
    const count = (result.summaryCount || 0) + 1;
    await chrome.storage.sync.set({ summaryCount: count });
    console.log('📊 Summary count updated to:', count);
  } catch (error) {
    console.error('❌ Failed to update summary count:', error);
  }
}

function getUserFriendlyError(errorMessage) {
  // Convert technical API errors to user-friendly messages
  if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
    return 'Invalid API key. Please check your API key in the extension settings.';
  }
  if (errorMessage.includes('402') || errorMessage.includes('quota')) {
    return 'API quota exceeded. Please check your account billing or try again later.';
  }
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
    return 'API service temporarily unavailable. Please try again in a few minutes.';
  }
  if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (errorMessage.includes('model') && errorMessage.includes('not found')) {
    return 'Selected AI model not available. Please choose a different model in settings.';
  }
  
  // Return original message if no specific pattern matches
  return errorMessage;
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ YouTube Summarizer Extension installed and ready');
});
