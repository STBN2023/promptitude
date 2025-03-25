(function() {
  // Déterminer quelle plateforme d'IA est actuellement utilisée
  const url = window.location.href;
  let platform = '';
  
  if (url.includes('chatgpt.com')) {
    platform = 'chatgpt';
  } else if (url.includes('claude.ai')) {
    platform = 'claude';
  } else if (url.includes('chat.mistral.ai')) {
    platform = 'mistral';
  } else {
    return; // Pas une plateforme supportée
  }
  
  // Injecter le bouton d'optimisation
  function injectOptimizerButton() {
    // Sélecteurs spécifiques à chaque plateforme
    let textarea;
    
    switch (platform) {
      case 'chatgpt':
        textarea = document.querySelector('textarea[data-id="root"]');
        break;
      case 'claude':
        textarea = document.querySelector('[contenteditable="true"]');
        break;
      case 'bard':
        textarea = document.querySelector('textarea[aria-label="Message Bard"]');
        break;
      default:
        return;
    }
    
    if (!textarea) return;
    
    // Créer le conteneur pour le bouton
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'prompt-optimizer-button-container';
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.right = '10px';
    buttonContainer.style.bottom = platform === 'claude' ? '50px' : '10px';
    buttonContainer.style.zIndex = '1000';
    
    // Créer le bouton
    const button = document.createElement('button');
    button.className = 'prompt-optimizer-button';
    button.innerHTML = '✨ Optimiser';
    button.style.backgroundColor = '#4f46e5';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '6px';
    button.style.padding = '8px 12px';
    button.style.fontSize = '12px';
    button.style.cursor = 'pointer';
    
    // Ajouter l'événement au clic sur le bouton
    button.addEventListener('click', function() {
      let text;
      if (platform === 'claude') {
        text = textarea.innerText.trim();  // Utiliser innerText pour Claude
      } else if (textarea.value) {
        text = textarea.value.trim();
      }
    
      if (!text) {
        alert('Veuillez d\'abord saisir un prompt.');
        return;
      }
    
      chrome.storage.local.set({ lastPrompt: text }, function() {
        // Ouvrir le popup correctement en Manifest V3
        chrome.runtime.sendMessage({ action: 'triggerPopup' });
      });
    });
    
    
    // Ajouter le bouton au conteneur et le conteneur au document
    buttonContainer.appendChild(button);
    
    // Ajouter le conteneur près de la zone de texte
    if (platform === 'claude') {
      textarea.parentNode.style.position = 'relative';
      textarea.parentNode.appendChild(buttonContainer);
    } else {
      textarea.parentNode.parentNode.style.position = 'relative';
      textarea.parentNode.parentNode.appendChild(buttonContainer);
    }
  }
  
  // Observer les changements DOM pour s'assurer que le bouton est toujours présent
  function observeDOM() {
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    
    const callback = function(mutationsList, observer) {
      const button = document.querySelector('.prompt-optimizer-button');
      if (!button) {
        injectOptimizerButton();
      }
    };
    
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);
    
    // Première injection
    injectOptimizerButton();
  }
  
  // Initialiser quand le DOM est complètement chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDOM);
  } else {
    observeDOM();
  }
  
  // Écouter les messages du popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "applyImprovedPrompt") {
      let textarea;
      
      switch (platform) {
        case 'chatgpt':
          textarea = document.querySelector('textarea[data-id="root"]');
          if (textarea) {
            textarea.value = request.text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
        case 'claude':
          textarea = document.querySelector('[contenteditable="true"]');
          if (textarea) {
            textarea.textContent = request.text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
        case 'bard':
          textarea = document.querySelector('textarea[aria-label="Message Bard"]');
          if (textarea) {
            textarea.value = request.text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
      }
      
      sendResponse({ success: true });
    }
  });
})();