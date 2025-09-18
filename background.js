// Background service worker for Turbo extension

// Initialize extension settings
chrome.runtime.onInstalled.addListener(() => {
  console.log('Turbo Extension installed');
  
  // Set default settings
  chrome.storage.sync.set({
    turboEnabled: true,
    cacheEnabled: true,
    preloadEnabled: false,
    stats: {
      avgLoadTime: 0,
      dataSaved: 0,
      totalRequests: 0
    }
  });
});

// Track performance metrics
let performanceData = {
  requests: [],
  cacheHits: 0,
  cacheMisses: 0
};

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'toggleTurbo':
      handleTurboToggle(request.enabled);
      break;
    case 'toggleCache':
      handleCacheToggle(request.enabled);
      break;
    case 'togglePreload':
      handlePreloadToggle(request.enabled);
      break;
    case 'reportPerformance':
      updatePerformanceStats(request.data);
      break;
    case 'getStats':
      sendResponse(performanceData);
      break;
  }
  return true;
});

// Handle Turbo mode toggle
function handleTurboToggle(enabled) {
  if (enabled) {
    console.log('Turbo mode enabled');
    // Store the setting
    chrome.storage.sync.set({ turboEnabled: true });
  } else {
    console.log('Turbo mode disabled');
    // Store the setting
    chrome.storage.sync.set({ turboEnabled: false });
  }
}

// Handle cache toggle
function handleCacheToggle(enabled) {
  console.log(`Cache ${enabled ? 'enabled' : 'disabled'}`);
  // Store the setting
  chrome.storage.sync.set({ cacheEnabled: enabled });
}

// Handle preload toggle
function handlePreloadToggle(enabled) {
  console.log(`Preload ${enabled ? 'enabled' : 'disabled'}`);
  // Store the setting
  chrome.storage.sync.set({ preloadEnabled: enabled });
  
  // Send message to content scripts in active tabs
  chrome.tabs.query({active: true}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updatePreload',
          enabled: enabled
        }).catch(err => {
          // Ignore errors for tabs without content script
          console.log('Tab not ready for message:', tab.id);
        });
      }
    });
  });
}

// Update performance statistics
function updatePerformanceStats(data) {
  performanceData.requests.push(data);
  
  // Keep only last 100 requests
  if (performanceData.requests.length > 100) {
    performanceData.requests.shift();
  }
  
  // Calculate average load time
  if (performanceData.requests.length > 0) {
    const avgLoadTime = performanceData.requests.reduce((sum, req) => sum + req.loadTime, 0) / performanceData.requests.length;
    
    // Update stored stats
    chrome.storage.sync.get(['stats'], (result) => {
      const stats = result.stats || {};
      stats.avgLoadTime = Math.round(avgLoadTime);
      stats.totalRequests = (stats.totalRequests || 0) + 1;
      
      chrome.storage.sync.set({ stats });
      
      // Notify popup if it's open
      chrome.runtime.sendMessage({ action: 'statsUpdate', stats }).catch(err => {
        // Popup might be closed, ignore error
        console.log('Popup not available');
      });
    });
  }
}

// Handle extension icon click when no popup is set
// This won't fire since we have default_popup in manifest
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked for tab:', tab.id);
});

// Listen for tab updates to inject optimization settings
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Get current settings and send to content script
    chrome.storage.sync.get(['turboEnabled', 'cacheEnabled', 'preloadEnabled'], (settings) => {
      chrome.tabs.sendMessage(tabId, {
        action: 'updateSettings',
        settings: settings
      }).catch(err => {
        // Content script might not be ready yet
        console.log('Content script not ready in tab:', tabId);
      });
    });
  }
});

console.log('Turbo background service worker loaded');