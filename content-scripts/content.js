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
  } else if (url.includes('bard.google.com')) {
    platform = 'bard';
  } else {
    console.log('Plateforme non supportée:', url);
    return; // Pas une plateforme supportée
  }
  
  console.log('Plateforme détectée:', platform);
  
  // Fonction pour trouver dynamiquement la zone de texte pour chaque plateforme
  function findTextArea(platform) {
    console.log('Recherche de la zone de texte pour:', platform);
    let textarea;
    
    switch (platform) {
      case 'chatgpt':
        // Essayer plusieurs sélecteurs possibles pour ChatGPT
        textarea = document.querySelector('textarea[data-id="root"]') || 
               document.querySelector('textarea[placeholder*="Send a message"]') ||
               document.querySelector('.flex.flex-col.w-full textarea');
        break;
        
      case 'claude':
        // Claude utilise un div contentEditable
        textarea = document.querySelector('[contenteditable="true"][data-placeholder*="Send a message"]') ||
               document.querySelector('[contenteditable="true"]');
        break;
        
      case 'bard':
        textarea = document.querySelector('textarea[aria-label="Message Bard"]') ||
               document.querySelector('textarea[placeholder*="Ask me anything"]');
        break;
        
      case 'mistral':
        textarea = document.querySelector('textarea.chatmessage') ||
               document.querySelector('textarea[placeholder*="Posez votre question"]') ||
               document.querySelector('.chat-input textarea');
        break;
        
      default:
        // Essayer de détecter une zone de texte générique
        textarea = document.querySelector('textarea[placeholder*="message"]') || 
               document.querySelector('textarea[placeholder*="Message"]') ||
               document.querySelector('[contenteditable="true"]');
        break;
    }
    
    if (textarea) {
      console.log('Zone de texte trouvée:', textarea);
    } else {
      console.warn('Aucune zone de texte trouvée pour', platform);
    }
    
    return textarea;
  }
  
  // Fonction pour placer intelligemment le bouton
  function placeButton(textarea, platform, buttonContainer) {
    // Trouver le conteneur parent approprié
    let container;
    
    if (!textarea) return false;
    
    try {
      if (platform === 'claude') {
        // Pour Claude, chercher un parent avec position relative/absolute
        container = textarea.closest('[class*="relative"]') || textarea.parentNode;
      } else if (platform === 'chatgpt') {
        // Pour ChatGPT, chercher le conteneur de saisie
        container = textarea.closest('.flex.flex-col.w-full') || 
                  textarea.closest('[class*="input-container"]') ||
                  textarea.parentNode.parentNode;
      } else {
        // Stratégie générique
        container = textarea.parentNode.parentNode;
      }
      
      if (container) {
        // S'assurer que le conteneur a un positionnement relatif
        if (getComputedStyle(container).position === 'static') {
          container.style.position = 'relative';
        }
        
        container.appendChild(buttonContainer);
        console.log('Bouton placé avec succès');
        return true;
      }
    } catch (error) {
      console.error('Erreur lors du placement du bouton:', error);
    }
    
    return false;
  }
  
  // Injecter le bouton d'optimisation
  function injectOptimizerButton() {
    console.log('Tentative d\'injection du bouton d\'optimisation');
    
    // Supprimer d'abord tout bouton existant
    const existingButton = document.querySelector('.prompt-optimizer-button-container');
    if (existingButton) {
      existingButton.remove();
    }
    
    // Trouver la zone de texte appropriée
    const textarea = findTextArea(platform);
    
    if (!textarea) {
      console.warn('Aucune zone de texte trouvée, impossible d\'injecter le bouton');
      return;
    }
    
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
      console.log('Bouton d\'optimisation cliqué');
      let text = '';
      
      try {
        if (platform === 'claude' && textarea.getAttribute('contenteditable') === 'true') {
          text = textarea.innerText.trim();  // Utiliser innerText pour Claude
          console.log('Texte récupéré depuis contentEditable:', text);
        } else if (textarea.value) {
          text = textarea.value.trim();
          console.log('Texte récupéré depuis textarea:', text);
        }
      
        if (!text) {
          alert('Veuillez d\'abord saisir un prompt.');
          return;
        }
      
        console.log('Stockage du prompt:', text);
        chrome.storage.local.set({ lastPrompt: text }, function() {
          if (chrome.runtime.lastError) {
            console.error('Erreur lors du stockage:', chrome.runtime.lastError);
          } else {
            console.log('Prompt stocké avec succès');
            // Ouvrir le popup correctement en Manifest V3
            chrome.runtime.sendMessage({ action: 'triggerPopup' }, response => {
              console.log('Réponse de triggerPopup:', response);
            });
          }
        });
      } catch (error) {
        console.error('Erreur lors de la récupération ou du stockage du texte:', error);
      }
    });
    
    // Ajouter le bouton au conteneur
    buttonContainer.appendChild(button);
    
    // Placer le bouton à côté de la zone de texte
    const placed = placeButton(textarea, platform, buttonContainer);
    if (!placed) {
      console.warn('Impossible de placer le bouton, tentative de méthode alternative');
      // Méthode alternative si le placement intelligent échoue
      if (textarea.parentNode) {
        textarea.parentNode.style.position = 'relative';
        textarea.parentNode.appendChild(buttonContainer);
      }
    }
  }
  
  // Observer les changements DOM pour s'assurer que le bouton est toujours présent
  function observeDOM() {
    console.log('Démarrage de l\'observation DOM');
    const targetNode = document.body;
    const config = { childList: true, subtree: true };
    
    const callback = function(mutationsList, observer) {
      const button = document.querySelector('.prompt-optimizer-button');
      if (!button) {
        console.log('Bouton non trouvé, réinjection...');
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
    console.log('DOM en cours de chargement, attente...');
    document.addEventListener('DOMContentLoaded', observeDOM);
  } else {
    console.log('DOM déjà chargé, démarrage immédiat');
    observeDOM();
  }
  
  // Écouter les messages du popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Message reçu:', request);
    
    if (request.action === "applyImprovedPrompt") {
      const textarea = findTextArea(platform);
      
      if (textarea) {
        console.log('Application du prompt amélioré:', request.text);
        try {
          if (platform === 'claude' && textarea.getAttribute('contenteditable') === 'true') {
            textarea.textContent = request.text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            sendResponse({ success: true });
          } else {
            textarea.value = request.text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            // Pour certaines interfaces, il faut aussi déclencher un événement keydown pour simuler la saisie
            textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
            sendResponse({ success: true });
          }
        } catch (error) {
          console.error('Erreur lors de l\'application du texte:', error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        console.error('Impossible de trouver la zone de texte pour appliquer le prompt');
        sendResponse({ success: false, error: "Impossible de trouver la zone de texte" });
      }
    } else if (request.action === "checkConnection") {
      // Vérifier que le script de contenu est bien chargé
      sendResponse({ connected: true, platform: platform });
    }
    
    return true; // Important pour les réponses asynchrones
  });
  
  // Indiquer que le script de contenu est chargé
  console.log('Script de contenu chargé pour la plateforme:', platform);
})();