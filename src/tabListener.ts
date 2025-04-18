console.log('Balance TabListener loaded');

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BLOCK_DOMAIN') {
    console.log('Redirecting to blocked page');        // Redirect to the blocked page
    const blockedUrl = chrome.runtime.getURL('blocked.html');
    const redirectUrl = `${blockedUrl}?domain=${message.domain}&requestedUrl=${encodeURIComponent(window.location.href)}`;
    window.location.href = redirectUrl;
  }
}); 