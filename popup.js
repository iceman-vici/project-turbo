// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await loadSettings();
  
  // Set toggle states
  document.getElementById('turboToggle').checked = settings.turboEnabled;
  document.getElementById('cacheToggle').checked = settings.cacheEnabled;
  document.getElementById('preloadToggle').checked = settings.preloadEnabled;
  
  // Update status indicator
  updateStatusIndicator(settings.turboEnabled);
  
  // Load and display stats
  updateStats();
  
  // Add event listeners
  setupEventListeners();
});

// Load settings from Chrome storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      turboEnabled: true,
      cacheEnabled: true,
      preloadEnabled: false,
      stats: {
        avgLoadTime: 0,
        dataSaved: 0
      }
    }, (items) => {
      resolve(items);
    });
  });
}

// Save settings to Chrome storage
function saveSettings(settings) {
  chrome.storage.sync.set(settings);
}

// Update status indicator
function updateStatusIndicator(isActive) {
  const indicator = document.getElementById('statusIndicator');
  const dot = indicator.querySelector('.status-dot');
  const text = indicator.querySelector('.status-text');
  
  if (isActive) {
    dot.classList.add('active');
    text.textContent = 'Active';
  } else {
    dot.classList.remove('active');
    text.textContent = 'Inactive';
  }
}

// Update statistics display
async function updateStats() {
  const settings = await loadSettings();
  const stats = settings.stats || { avgLoadTime: 0, dataSaved: 0 };
  
  // Update UI
  document.getElementById('pageSpeed').textContent = `${stats.avgLoadTime}ms`;
  document.getElementById('dataSaved').textContent = formatDataSize(stats.dataSaved);
}

// Format data size for display
function formatDataSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// Setup event listeners
function setupEventListeners() {
  // Turbo toggle
  document.getElementById('turboToggle').addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    saveSettings({ turboEnabled: isEnabled });
    updateStatusIndicator(isEnabled);
    
    // Send message to background script
    chrome.runtime.sendMessage({ 
      action: 'toggleTurbo', 
      enabled: isEnabled 
    });
  });
  
  // Cache toggle
  document.getElementById('cacheToggle').addEventListener('change', (e) => {
    saveSettings({ cacheEnabled: e.target.checked });
    
    chrome.runtime.sendMessage({ 
      action: 'toggleCache', 
      enabled: e.target.checked 
    });
  });
  
  // Preload toggle
  document.getElementById('preloadToggle').addEventListener('change', (e) => {
    saveSettings({ preloadEnabled: e.target.checked });
    
    chrome.runtime.sendMessage({ 
      action: 'togglePreload', 
      enabled: e.target.checked 
    });
  });
  
  // Welcome button - shows alert with Welcome message
  document.getElementById('welcomeBtn').addEventListener('click', () => {
    alert('Welcome to Turbo Extension! 🚀\n\nBoost your browsing speed with intelligent optimizations.');
  });
  
  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Listen for stats updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'statsUpdate') {
    updateStats();
  }
});