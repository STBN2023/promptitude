// Logs pour le débogage
console.log('Service worker background.js démarré');

// Écoute les messages du script de contenu
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message reçu dans background.js:', request);
  
  if (request.action === 'triggerPopup') {
    console.log('Action triggerPopup reçue de:', sender.tab.id);
    
    // En Manifest V3, nous ne pouvons pas ouvrir le popup programmatiquement
    // comme en V2, alors nous utilisons un badge pour notifier l'utilisateur
    chrome.action.setBadgeText({ text: '!', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5', tabId: sender.tab.id });
    
    // Stocker l'ID de l'onglet qui a déclenché l'action
    chrome.storage.local.set({ 
      activeTabId: sender.tab.id,
      popupTriggered: true,
      triggerTimestamp: Date.now()
    }, () => {
      console.log('activeTabId stocké:', sender.tab.id);
      
      // Créer une notification pour informer l'utilisateur
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon128.png',
        title: 'Optimiseur de Prompts',
        message: 'Cliquez sur l\'icône de l\'extension pour analyser votre prompt',
      });
      
      // Répondre au script de contenu
      sendResponse({ success: true, message: 'Badge affiché, cliquez sur l\'icône' });
    });
  }
  
  return true; // Important pour les réponses asynchrones
});

// Écouter l'événement d'ouverture du popup
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === "popup") {
    console.log("Popup connecté");
    
    // Envoyer un message au popup lorsqu'il s'ouvre
    port.postMessage({action: "popupOpened"});
    
    // Effacer le badge lorsque le popup est ouvert
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.action.setBadgeText({ text: '', tabId: tabs[0].id });
      }
    });
  }
});

// Lors de l'installation de l'extension
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Extension installée ou mise à jour:', details.reason);
  
  if (details.reason === 'install') {
    // Ouvrir une page d'accueil ou tutoriel
    chrome.tabs.create({
      url: 'https://unequaled-persimmon-f86.notion.site/Promptitude-l-extension-chrome-1c189f61364c801197fbff903264c884'
    });
  }
});

// Écouter le clic sur l'icône de l'extension pour effacer le badge
chrome.action.onClicked.addListener((tab) => {
  console.log('Icône de l\'extension cliquée dans l\'onglet:', tab.id);
  chrome.action.setBadgeText({ text: '', tabId: tab.id });
});