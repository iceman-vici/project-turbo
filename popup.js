// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await loadSettings();
  
  // Set toggle states
  document.getElementById('turboToggle').checked = settings.turboEnabled;
  
  // Update status indicator
  updateStatusIndicator(settings.turboEnabled);
  
  // Load and display stats
  updateStats();
  
  // Check Dialpad connection
  checkDialpadConnection();
  
  // Add event listeners
  setupEventListeners();
});

// Load settings from Chrome storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      turboEnabled: true,
      callCount: 0,
      lastPhoneNumber: '',
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
    text.textContent = 'Ready';
  } else {
    dot.classList.remove('active');
    text.textContent = 'Disabled';
  }
}

// Update statistics display
async function updateStats() {
  const settings = await loadSettings();
  
  // Update UI
  document.getElementById('callCount').textContent = settings.callCount || 0;
  document.getElementById('callStatus').textContent = 'Ready';
}

// Check Dialpad connection
function checkDialpadConnection() {
  // Check if Dialpad tab is open
  chrome.tabs.query({ url: '*://*.dialpad.com/*' }, (tabs) => {
    const dialpadStatus = document.getElementById('dialpadStatus');
    const statusIcon = dialpadStatus.querySelector('.status-icon');
    const statusText = dialpadStatus.querySelector('.status-text');
    
    if (tabs.length > 0) {
      dialpadStatus.classList.add('connected');
      statusIcon.textContent = '🔵';
      statusText.textContent = 'Dialpad: Connected';
      
      // Store the Dialpad tab ID
      chrome.storage.local.set({ dialpadTabId: tabs[0].id });
    } else {
      dialpadStatus.classList.remove('connected');
      statusIcon.textContent = '🔴';
      statusText.textContent = 'Dialpad: Not Connected - Please open Dialpad';
    }
  });
}

// Make a call using Dialpad CTI
async function makeDialpadCall(phoneNumber) {
  const button = document.getElementById('makeCallBtn');
  const statusText = document.getElementById('callStatus');
  
  // Update UI to show calling state
  button.classList.add('calling');
  button.innerHTML = '<span>📞</span> Calling...';
  statusText.textContent = 'Dialing';
  
  try {
    // Get Dialpad tab ID
    const result = await chrome.storage.local.get(['dialpadTabId']);
    const dialpadTabId = result.dialpadTabId;
    
    if (!dialpadTabId) {
      // Open Dialpad if not already open
      const newTab = await chrome.tabs.create({ 
        url: 'https://dialpad.com/app',
        active: false 
      });
      
      // Wait for tab to load
      setTimeout(() => {
        initiateCall(newTab.id, phoneNumber);
      }, 3000);
    } else {
      // Check if tab still exists
      chrome.tabs.get(dialpadTabId, (tab) => {
        if (chrome.runtime.lastError) {
          // Tab doesn't exist, create new one
          chrome.tabs.create({ 
            url: 'https://dialpad.com/app',
            active: false 
          }).then((newTab) => {
            setTimeout(() => {
              initiateCall(newTab.id, phoneNumber);
            }, 3000);
          });
        } else {
          // Use existing tab
          initiateCall(dialpadTabId, phoneNumber);
        }
      });
    }
  } catch (error) {
    console.error('Error making call:', error);
    resetCallButton();
    alert('Error connecting to Dialpad. Please ensure Dialpad is open.');
  }
}

// Initiate the actual call
function initiateCall(tabId, phoneNumber) {
  // Clean phone number (remove spaces, dashes, parentheses)
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Send message to content script to initiate call
  chrome.tabs.sendMessage(tabId, {
    action: 'makeCall',
    phoneNumber: cleanNumber
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      alert('Please make sure Dialpad is fully loaded and try again.');
      resetCallButton();
    } else {
      // Update call count
      chrome.storage.sync.get(['callCount'], (result) => {
        const newCount = (result.callCount || 0) + 1;
        chrome.storage.sync.set({ callCount: newCount });
        document.getElementById('callCount').textContent = newCount;
      });
      
      // Reset button after 2 seconds
      setTimeout(() => {
        resetCallButton();
        document.getElementById('callStatus').textContent = 'Call Initiated';
      }, 2000);
    }
  });
  
  // Focus on Dialpad tab
  chrome.tabs.update(tabId, { active: true });
}

// Reset call button to original state
function resetCallButton() {
  const button = document.getElementById('makeCallBtn');
  button.classList.remove('calling');
  button.innerHTML = '<span>📞</span> Start Automated Call';
  document.getElementById('callStatus').textContent = 'Ready';
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
  
  // Make Call button
  document.getElementById('makeCallBtn').addEventListener('click', () => {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();
    
    if (!phoneNumber) {
      alert('Please enter a phone number');
      phoneInput.focus();
      return;
    }
    
    // Validate phone number (basic validation)
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert('Please enter a valid phone number');
      phoneInput.focus();
      return;
    }
    
    // Save last phone number
    saveSettings({ lastPhoneNumber: phoneNumber });
    
    // Make the call
    makeDialpadCall(phoneNumber);
  });
  
  // Quick dial buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const number = btn.dataset.number;
      document.getElementById('phoneNumber').value = number;
      makeDialpadCall(number);
    });
  });
  
  // Phone input enter key
  document.getElementById('phoneNumber').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('makeCallBtn').click();
    }
  });
  
  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Load last phone number
  chrome.storage.sync.get(['lastPhoneNumber'], (result) => {
    if (result.lastPhoneNumber) {
      document.getElementById('phoneNumber').value = result.lastPhoneNumber;
    }
  });
}

// Listen for stats updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'statsUpdate') {
    updateStats();
  } else if (request.action === 'dialpadConnected') {
    checkDialpadConnection();
  }
});

// Check Dialpad connection every 5 seconds
setInterval(checkDialpadConnection, 5000);