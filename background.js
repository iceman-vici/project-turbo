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
    // Enable performance optimizations
    enableOptimizations();
  } else {
    console.log('Turbo mode disabled');
    // Disable performance optimizations
    disableOptimizations();
  }
}

// Handle cache toggle
function handleCacheToggle(enabled) {
  console.log(`Cache ${enabled ? 'enabled' : 'disabled'}`);
  // Update cache headers for requests
  updateCacheHeaders(enabled);
}

// Handle preload toggle
function handlePreloadToggle(enabled) {
  console.log(`Preload ${enabled ? 'enabled' : 'disabled'}`);
  // Send message to content scripts
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updatePreload',
        enabled: enabled
      });
    });
  });
}

// Enable performance optimizations
function enableOptimizations() {
  // Set up request interception for optimization
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'Accept-Encoding',
              operation: 'set',
              value: 'gzip, deflate, br'
            }
          ]
        },
        condition: {
          urlFilter: '*',
          resourceTypes: ['main_frame', 'sub_frame', 'stylesheet', 'script']
        }
      }
    ],
    removeRuleIds: []
  });
}

// Disable performance optimizations
function disableOptimizations() {
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [],
    removeRuleIds: [1]
  });
}

// Update cache headers
function updateCacheHeaders(enabled) {
  if (enabled) {
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id: 2,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                header: 'Cache-Control',
                operation: 'set',
                value: 'max-age=3600'
              }
            ]
          },
          condition: {
            urlFilter: '*',
            resourceTypes: ['stylesheet', 'script', 'image']
          }
        }
      ],
      removeRuleIds: []
    });
  } else {
    chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [],
      removeRuleIds: [2]
    });
  }
}

// Update performance statistics
function updatePerformanceStats(data) {
  performanceData.requests.push(data);
  
  // Keep only last 100 requests
  if (performanceData.requests.length > 100) {
    performanceData.requests.shift();
  }
  
  // Calculate average load time
  const avgLoadTime = performanceData.requests.reduce((sum, req) => sum + req.loadTime, 0) / performanceData.requests.length;
  
  // Update stored stats
  chrome.storage.sync.get(['stats'], (result) => {
    const stats = result.stats || {};
    stats.avgLoadTime = Math.round(avgLoadTime);
    stats.totalRequests = (stats.totalRequests || 0) + 1;
    
    chrome.storage.sync.set({ stats });
    
    // Notify popup if it's open
    chrome.runtime.sendMessage({ action: 'statsUpdate', stats });
  });
}

// Monitor web navigation for performance tracking
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    // Main frame loaded
    chrome.tabs.sendMessage(details.tabId, {
      action: 'measurePerformance'
    });
  }
});

// Handle extension icon click (open popup is default behavior)
chrome.action.onClicked.addListener((tab) => {
  // This won't fire if default_popup is set in manifest
  // But keeping it here for potential future use
  console.log('Extension icon clicked');
});