chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'openPopup') {
    // Stocker temporairement le texte du prompt
    chrome.storage.local.set({
      lastPrompt: request.text
    }, function() {
      // Ouvrir le popup
      chrome.action.openPopup();
    });
  }
});

// Lors de l'installation de l'extension
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // Ouvrir une page d'accueil ou tutoriel
    chrome.tabs.create({
      url: 'https://unequaled-persimmon-f86.notion.site/Promptitude-l-extension-chrome-1c189f61364c801197fbff903264c884'
    });
  }
});