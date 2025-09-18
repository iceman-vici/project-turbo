// Content script for Turbo extension

// Initialize content script
console.log('Turbo content script loaded');

// Performance observer for monitoring page metrics
let performanceObserver = null;
let settings = {
  turboEnabled: true,
  cacheEnabled: true,
  preloadEnabled: false
};

// Load settings from storage
chrome.storage.sync.get(['turboEnabled', 'cacheEnabled', 'preloadEnabled'], (result) => {
  settings = { ...settings, ...result };
  initialize();
});

// Initialize features based on settings
function initialize() {
  if (settings.turboEnabled) {
    optimizePageLoad();
    measurePerformance();
  }
  
  if (settings.preloadEnabled) {
    enableLinkPreloading();
  }
}

// Optimize page load
function optimizePageLoad() {
  // Lazy load images
  lazyLoadImages();
  
  // Defer non-critical scripts
  deferNonCriticalScripts();
  
  // Optimize resource hints
  addResourceHints();
}

// Lazy load images
function lazyLoadImages() {
  const images = document.querySelectorAll('img[src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    images.forEach(img => {
      if (img.getBoundingClientRect().top > window.innerHeight * 1.5) {
        img.dataset.src = img.src;
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E';
        imageObserver.observe(img);
      }
    });
  }
}

// Defer non-critical scripts
function deferNonCriticalScripts() {
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    // Skip critical scripts
    if (script.src.includes('critical') || script.hasAttribute('async')) {
      return;
    }
    
    // Add defer attribute if not present
    if (!script.hasAttribute('defer')) {
      script.setAttribute('defer', '');
    }
  });
}

// Add resource hints for faster loading
function addResourceHints() {
  // Find all external links and add prefetch hints
  const links = document.querySelectorAll('a[href^="http"]');
  const domains = new Set();
  
  links.forEach(link => {
    try {
      const url = new URL(link.href);
      if (url.hostname !== window.location.hostname) {
        domains.add(url.hostname);
      }
    } catch (e) {
      // Invalid URL
    }
  });
  
  // Add DNS prefetch for external domains
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
}

// Enable link preloading on hover
function enableLinkPreloading() {
  const links = document.querySelectorAll('a[href^="http"]');
  const preloadedUrls = new Set();
  
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const url = link.href;
      
      // Skip if already preloaded or external link
      if (preloadedUrls.has(url) || new URL(url).hostname !== window.location.hostname) {
        return;
      }
      
      // Create prefetch link
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = url;
      document.head.appendChild(prefetchLink);
      
      preloadedUrls.add(url);
    }, { passive: true });
  });
}

// Measure page performance
function measurePerformance() {
  // Use Performance Observer API
  if ('PerformanceObserver' in window) {
    performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          const loadTime = Math.round(entry.loadEventEnd - entry.fetchStart);
          const domContentLoaded = Math.round(entry.domContentLoadedEventEnd - entry.fetchStart);
          
          // Send performance data to background script
          chrome.runtime.sendMessage({
            action: 'reportPerformance',
            data: {
              url: window.location.href,
              loadTime: loadTime,
              domContentLoaded: domContentLoaded,
              transferSize: entry.transferSize || 0,
              encodedBodySize: entry.encodedBodySize || 0,
              decodedBodySize: entry.decodedBodySize || 0
            }
          });
        }
      });
    });
    
    performanceObserver.observe({ entryTypes: ['navigation'] });
  }
  
  // Fallback to Navigation Timing API
  else if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.fetchStart;
        const domContentLoaded = timing.domContentLoadedEventEnd - timing.fetchStart;
        
        chrome.runtime.sendMessage({
          action: 'reportPerformance',
          data: {
            url: window.location.href,
            loadTime: loadTime,
            domContentLoaded: domContentLoaded
          }
        });
      }, 0);
    });
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case 'updatePreload':
      settings.preloadEnabled = request.enabled;
      if (request.enabled) {
        enableLinkPreloading();
      }
      break;
    case 'measurePerformance':
      measurePerformance();
      break;
  }
});

// Monitor for dynamically added content
const contentObserver = new MutationObserver((mutations) => {
  if (settings.turboEnabled) {
    // Re-run optimizations for new content
    lazyLoadImages();
    
    if (settings.preloadEnabled) {
      enableLinkPreloading();
    }
  }
});

// Start observing DOM changes
contentObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (performanceObserver) {
    performanceObserver.disconnect();
  }
  contentObserver.disconnect();
});