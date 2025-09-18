// Options page script for Turbo extension

// Load settings when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadStatistics();
  setupEventListeners();
});

// Load current settings
function loadSettings() {
  chrome.storage.sync.get({
    turboEnabled: true,
    cacheEnabled: true,
    preloadEnabled: false,
    lazyLoadEnabled: true,
    cacheDuration: 24,
    preloadDelay: 100
  }, (items) => {
    document.getElementById('turboEnabled').checked = items.turboEnabled;
    document.getElementById('cacheEnabled').checked = items.cacheEnabled;
    document.getElementById('preloadEnabled').checked = items.preloadEnabled;
    document.getElementById('lazyLoadEnabled').checked = items.lazyLoadEnabled;
    document.getElementById('cacheDuration').value = items.cacheDuration;
    document.getElementById('preloadDelay').value = items.preloadDelay;
  });
}

// Load statistics
function loadStatistics() {
  chrome.storage.local.get({
    stats: {
      totalPageLoads: 0,
      avgSpeedImprovement: 0,
      totalDataSaved: 0,
      cacheHitRate: 0
    }
  }, (items) => {
    const stats = items.stats;
    document.getElementById('totalPageLoads').textContent = stats.totalPageLoads.toLocaleString();
    document.getElementById('avgSpeedImprovement').textContent = `${stats.avgSpeedImprovement}%`;
    document.getElementById('totalDataSaved').textContent = formatDataSize(stats.totalDataSaved);
    document.getElementById('cacheHitRate').textContent = `${stats.cacheHitRate}%`;
  });
}

// Format data size
function formatDataSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
}

// Setup event listeners
function setupEventListeners() {
  // Save settings button
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
  
  // Reset settings button
  document.getElementById('resetSettings').addEventListener('click', resetSettings);
  
  // Clear statistics button
  document.getElementById('clearStats').addEventListener('click', clearStatistics);
  
  // Auto-save on change for toggles
  const toggles = document.querySelectorAll('input[type="checkbox"]');
  toggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      saveSettings(true);
    });
  });
  
  // Validate number inputs
  document.getElementById('cacheDuration').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value < 1) e.target.value = 1;
    if (value > 168) e.target.value = 168;
  });
  
  document.getElementById('preloadDelay').addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (value < 0) e.target.value = 0;
    if (value > 1000) e.target.value = 1000;
  });
}

// Save settings
function saveSettings(silent = false) {
  const settings = {
    turboEnabled: document.getElementById('turboEnabled').checked,
    cacheEnabled: document.getElementById('cacheEnabled').checked,
    preloadEnabled: document.getElementById('preloadEnabled').checked,
    lazyLoadEnabled: document.getElementById('lazyLoadEnabled').checked,
    cacheDuration: parseInt(document.getElementById('cacheDuration').value),
    preloadDelay: parseInt(document.getElementById('preloadDelay').value)
  };
  
  chrome.storage.sync.set(settings, () => {
    if (!silent) {
      // Show save confirmation
      const saveBtn = document.getElementById('saveSettings');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '✓ Saved!';
      saveBtn.classList.add('save-success');
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('save-success');
      }, 2000);
    }
    
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'settingsUpdated',
      settings: settings
    });
  });
}

// Reset settings to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    const defaults = {
      turboEnabled: true,
      cacheEnabled: true,
      preloadEnabled: false,
      lazyLoadEnabled: true,
      cacheDuration: 24,
      preloadDelay: 100
    };
    
    chrome.storage.sync.set(defaults, () => {
      loadSettings();
      
      // Show reset confirmation
      const resetBtn = document.getElementById('resetSettings');
      const originalText = resetBtn.textContent;
      resetBtn.textContent = '✓ Reset Complete';
      
      setTimeout(() => {
        resetBtn.textContent = originalText;
      }, 2000);
    });
  }
}

// Clear statistics
function clearStatistics() {
  if (confirm('Are you sure you want to clear all statistics?')) {
    const emptyStats = {
      stats: {
        totalPageLoads: 0,
        avgSpeedImprovement: 0,
        totalDataSaved: 0,
        cacheHitRate: 0
      }
    };
    
    chrome.storage.local.set(emptyStats, () => {
      loadStatistics();
      
      // Show clear confirmation
      const clearBtn = document.getElementById('clearStats');
      const originalText = clearBtn.textContent;
      clearBtn.textContent = '✓ Cleared';
      
      setTimeout(() => {
        clearBtn.textContent = originalText;
      }, 2000);
    });
  }
}

// Listen for real-time statistics updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'statsUpdate') {
    loadStatistics();
  }
});