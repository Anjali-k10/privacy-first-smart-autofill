const ALLOWED_SITES_KEY = 'allowedSites';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CHECK_SITE_PERMISSION') {
    const origin = message.origin;

    if (!origin) {
      sendResponse({ allowed: false });
      return true;
    }

    chrome.storage.local.get([ALLOWED_SITES_KEY], (result) => {
      const allowedSites = result[ALLOWED_SITES_KEY] || {};
      sendResponse({ allowed: Boolean(allowedSites[origin]) });
    });

    return true;
  }
});
