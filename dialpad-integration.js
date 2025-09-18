// Dialpad CTI Integration Content Script
console.log('Dialpad CTI Integration loaded');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'makeCall') {
    console.log('Making call to:', request.phoneNumber);
    
    try {
      // Method 1: Try to find and click the "Make a Call" button
      const makeCallButton = findMakeCallButton();
      if (makeCallButton) {
        makeCallButton.click();
        
        // Wait for input field to appear
        setTimeout(() => {
          enterPhoneNumber(request.phoneNumber);
        }, 500);
        
        sendResponse({ success: true, message: 'Call initiated' });
      } else {
        // Method 2: Try to directly input number in search/dial field
        const dialInput = findDialInput();
        if (dialInput) {
          dialInput.value = request.phoneNumber;
          dialInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Trigger call
          setTimeout(() => {
            triggerCall();
          }, 500);
          
          sendResponse({ success: true, message: 'Call initiated via input' });
        } else {
          // Method 3: Try using keyboard shortcut or URL
          initiateCallViaURL(request.phoneNumber);
          sendResponse({ success: true, message: 'Call initiated via URL' });
        }
      }
    } catch (error) {
      console.error('Error making call:', error);
      sendResponse({ success: false, error: error.message });
    }
    
    return true; // Keep message channel open for async response
  }
});

// Find the "Make a Call" button
function findMakeCallButton() {
  // Try multiple selectors as Dialpad might use different ones
  const selectors = [
    'button[aria-label*="Make a call"]',
    'button[aria-label*="MAKE A CALL"]',
    'button:contains("Make a Call")',
    '[data-qa="make-call-button"]',
    '.make-call-button',
    'button[class*="call-button"]'
  ];
  
  for (const selector of selectors) {
    try {
      const button = document.querySelector(selector);
      if (button) return button;
    } catch (e) {
      // Try next selector
    }
  }
  
  // Try finding by text content
  const buttons = document.querySelectorAll('button');
  for (const button of buttons) {
    if (button.textContent && button.textContent.toLowerCase().includes('make') && 
        button.textContent.toLowerCase().includes('call')) {
      return button;
    }
  }
  
  return null;
}

// Find the dial input field
function findDialInput() {
  const selectors = [
    'input[type="tel"]',
    'input[placeholder*="phone"]',
    'input[placeholder*="number"]',
    'input[placeholder*="dial"]',
    'input[aria-label*="phone"]',
    '[data-qa="dial-input"]',
    '.dial-input',
    'input[name="phoneNumber"]'
  ];
  
  for (const selector of selectors) {
    const input = document.querySelector(selector);
    if (input && input.offsetParent !== null) { // Check if visible
      return input;
    }
  }
  
  return null;
}

// Enter phone number in the input field
function enterPhoneNumber(phoneNumber) {
  const input = findDialInput();
  if (input) {
    // Clear existing value
    input.value = '';
    
    // Set new value
    input.value = phoneNumber;
    
    // Trigger various events to ensure Dialpad recognizes the input
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    
    // Try to find and click call button
    setTimeout(() => {
      triggerCall();
    }, 300);
  }
}

// Trigger the call
function triggerCall() {
  // Look for call/dial button
  const callButtons = [
    'button[aria-label*="Call"]',
    'button[aria-label*="Dial"]',
    'button[class*="call-action"]',
    'button[class*="dial-button"]',
    '[data-qa="call-button"]',
    '.call-button',
    'button svg[class*="phone"]'
  ];
  
  for (const selector of callButtons) {
    const button = document.querySelector(selector);
    if (button && button.offsetParent !== null) {
      button.click();
      return true;
    }
  }
  
  // If no button found, try Enter key on input
  const input = findDialInput();
  if (input) {
    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', keyCode: 13, bubbles: true }));
  }
  
  return false;
}

// Initiate call via URL change
function initiateCallViaURL(phoneNumber) {
  // Some web apps respond to URL changes
  const currentURL = window.location.href;
  
  // Try different URL patterns
  if (currentURL.includes('dialpad.com')) {
    // Try to navigate to a call URL
    window.location.href = `https://dialpad.com/app/calls/new?number=${phoneNumber}`;
  }
}

// Notify extension that Dialpad is loaded
chrome.runtime.sendMessage({ 
  action: 'dialpadConnected',
  url: window.location.href 
});

// Monitor for Dialpad UI changes
const observer = new MutationObserver((mutations) => {
  // Can be used to detect when Dialpad UI updates
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('Dialpad CTI Integration ready');