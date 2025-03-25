chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === 'triggerPopup') {
    chrome.action.openPopup({ tabId: sender.tab.id });
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