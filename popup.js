document.addEventListener('DOMContentLoaded', async () => {
  const elements = {
    provider: document.getElementById('provider'),
    apiKey: document.getElementById('apiKey'),
    model: document.getElementById('model'),
    format: document.getElementById('format'),
    saveSettings: document.getElementById('saveSettings'),
    testConnection: document.getElementById('testConnection'),
    status: document.getElementById('status'),
    summaryCount: document.getElementById('summaryCount')
  };

  await loadSettings();
  updateModelOptions();

  elements.provider.addEventListener('change', updateModelOptions);
  elements.saveSettings.addEventListener('click', saveSettings);
  elements.testConnection.addEventListener('click', testConnection);

  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'provider', 'apiKey', 'model', 'format', 'summaryCount'
      ]);

      elements.provider.value = result.provider || 'openai';
      elements.apiKey.value = result.apiKey || '';
      elements.model.value = result.model || 'gpt-3.5-turbo';
      elements.format.value = result.format || 'bullets';
      elements.summaryCount.textContent = result.summaryCount || 0;
    } catch (error) {
      showStatus('Error loading settings', 'error');
    }
  }

  function updateModelOptions() {
    const provider = elements.provider.value;
    const modelSelect = elements.model;
    
    modelSelect.innerHTML = '';
    
    if (provider === 'openai') {
      const models = [
        { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' },
        { value: 'gpt-4', text: 'GPT-4' },
        { value: 'gpt-4-turbo', text: 'GPT-4 Turbo' }
      ];
      models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.text;
        modelSelect.appendChild(option);
      });
    } else if (provider === 'claude') {
      const models = [
        { value: 'claude-3-haiku-20240307', text: 'Claude 3 Haiku' },
        { value: 'claude-3-sonnet-20240229', text: 'Claude 3 Sonnet' },
        { value: 'claude-3-opus-20240229', text: 'Claude 3 Opus' }
      ];
      models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.value;
        option.textContent = model.text;
        modelSelect.appendChild(option);
      });
    }
  }

  async function saveSettings() {
    const settings = {
      provider: elements.provider.value,
      apiKey: elements.apiKey.value.trim(),
      model: elements.model.value,
      format: elements.format.value
    };

    if (!settings.apiKey) {
      showStatus('Please enter an API key', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set(settings);
      showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      showStatus('Error saving settings', 'error');
    }
  }

  async function testConnection() {
    const settings = await chrome.storage.sync.get(['provider', 'apiKey', 'model']);
    
    if (!settings.apiKey) {
      showStatus('Please enter an API key first', 'error');
      return;
    }

    showStatus('Testing connection...', 'success');
    elements.testConnection.disabled = true;
    elements.testConnection.textContent = 'Testing...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'testConnection',
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model
      });

      if (response.success) {
        showStatus('Connection successful!', 'success');
      } else {
        showStatus(`Connection failed: ${response.error}`, 'error');
      }
    } catch (error) {
      showStatus('Test failed: Unable to connect', 'error');
    } finally {
      elements.testConnection.disabled = false;
      elements.testConnection.textContent = 'Test Connection';
      setTimeout(() => hideStatus(), 3000);
    }
  }

  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.className = `status ${type}`;
    elements.status.style.display = 'block';
  }

  function hideStatus() {
    elements.status.style.display = 'none';
  }
});