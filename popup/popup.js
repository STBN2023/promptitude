document.addEventListener('DOMContentLoaded', function() {
  const promptInput = document.getElementById('prompt-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const scoreElement = document.getElementById('score');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const improvedPromptElement = document.getElementById('improved-prompt');
  const useImprovedBtn = document.getElementById('use-improved-btn');
  const tabEditor = document.getElementById('tab-editor');
  const tabImproved = document.getElementById('tab-improved');
  const editorPanel = document.getElementById('editor-panel');
  const improvedPanel = document.getElementById('improved-panel');
  const helpBtn = document.getElementById('help-btn');

  // Récupérer le prompt stocké dès l'ouverture du popup
  chrome.storage.local.get(['lastPrompt'], function(result) {
    console.log('Récupération du prompt:', result);
    if (result.lastPrompt) {
      promptInput.value = result.lastPrompt;
      // Analyser automatiquement le prompt récupéré
      analyzePrompt(result.lastPrompt);
    }
  });

  tabEditor.addEventListener('click', () => {
    tabEditor.classList.add('active');
    tabImproved.classList.remove('active');
    editorPanel.classList.add('active');
    improvedPanel.classList.remove('active');
  });

  tabImproved.addEventListener('click', () => {
    tabImproved.classList.add('active');
    tabEditor.classList.remove('active');
    improvedPanel.classList.add('active');
    editorPanel.classList.remove('active');
  });

  analyzeBtn.addEventListener('click', () => {
    const text = promptInput.value.trim();
    if (text) {
      analyzePrompt(text);
    }
  });

  useImprovedBtn.addEventListener('click', () => {
    const improvedText = improvedPromptElement.textContent;
    promptInput.value = improvedText;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "applyImprovedPrompt",
          text: improvedText
        }, function(response) {
          console.log('Réponse après envoi:', response);
          if (response && response.success) {
            showNotification("Prompt appliqué avec succès !");
          } else {
            showNotification("Erreur lors de l'application du prompt");
          }
        });
      } else {
        console.error("Impossible de trouver l'onglet actif");
        showNotification("Erreur: impossible de trouver l'onglet actif");
      }
    });

    tabEditor.click();
  });

  helpBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: "https://unequaled-persimmon-f86.notion.site/Promptitude-l-extension-chrome-1c189f61364c801197fbff903264c884"
    });
  });

  async function analyzePrompt(text) {
    showNotification("Analyse en cours...");
    
    try {
      const improvedText = await analyzePromptWithAPI(text);
      improvedPromptElement.textContent = improvedText;
      tabImproved.click(); // Basculer automatiquement vers l'onglet de version améliorée

      // Mettre à jour le score et les suggestions ici
      const newSuggestions = [];
      let newScore = 0;

      // Analyser la clarté et la spécificité
      if (text.length < 50) {
        newSuggestions.push({
          type: "clarity",
          icon: "target",
          color: "#f97316",
          title: "Manque de spécificité",
          description: "Votre prompt est trop court. Ajoutez plus de détails sur ce que vous attendez exactement.",
          example: "Au lieu de 'Parle-moi du marketing', essayez 'Explique les 3 stratégies de marketing digital les plus efficaces pour une startup B2B en 2025.'"
        });
      } else {
        newScore += 20;
      }

      // Analyser le contexte
      if (!text.includes("contexte") && !text.toLowerCase().includes("je suis") && !text.toLowerCase().includes("notre") && !text.toLowerCase().includes("mon")) {
        newSuggestions.push({
          type: "context",
          icon: "book-open",
          color: "#3b82f6",
          title: "Contexte insuffisant",
          description: "Vous n'avez pas fourni de contexte sur votre situation ou votre audience.",
          example: "Ajoutez des informations comme 'Je suis [fonction] dans [industrie]' ou 'Notre audience est composée de [description].'"
        });
      } else {
        newScore += 20;
      }

      // Analyser la structure
      if (!text.includes("•") && !text.includes("-") && !text.includes(":") && !text.includes("1.") && !text.includes("2.")) {
        newSuggestions.push({
          type: "structure",
          icon: "layout-template",
          color: "#8b5cf6",
          title: "Structure à améliorer",
          description: "Votre prompt pourrait bénéficier d'une meilleure organisation.",
          example: "Utilisez des puces, des numéros ou des sections clairement délimitées (Contexte, Demande, Format souhaité)."
        });
      } else {
        newScore += 20;
      }

      // Analyser l'exemplification
      if (!text.includes("exemple") && !text.includes("modèle") && !text.includes("comme ceci")) {
        newSuggestions.push({
          type: "example",
          icon: "feather",
          color: "#10b981",
          title: "Pas d'exemples",
          description: "Inclure un exemple de ce que vous attendez peut grandement améliorer les résultats.",
          example: "Ajoutez 'Voici un exemple du format que je recherche: [...]'"
        });
      } else {
        newScore += 20;
      }

      // Analyser le format requis
      if (!text.includes("format") && !text.toLowerCase().includes("présente") && !text.toLowerCase().includes("style") && !text.toLowerCase().includes("ton")) {
        newSuggestions.push({
          type: "format",
          icon: "pen-tool",
          color: "#ef4444",
          title: "Format non spécifié",
          description: "Vous n'avez pas précisé comment vous souhaitez que l'information soit présentée.",
          example: "Ajoutez des instructions comme 'Présente les résultats sous forme de tableau' ou 'Utilise un ton conversationnel et informatif.'"
        });
      } else {
        newScore += 20;
      }

      // Si le prompt est vraiment bon, ajouter un message positif
      if (newScore > 80) {
        newSuggestions.push({
          type: "positive",
          icon: "thumbs-up",
          color: "#10b981",
          title: "Excellent prompt!",
          description: "Votre prompt est bien structuré et spécifique. Bravo!",
          example: ""
        });
      }

      // Mettre à jour le score
      scoreElement.textContent = newScore;

      // Afficher les suggestions
      renderSuggestions(newSuggestions);
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      showNotification("Erreur pendant l'analyse. Veuillez réessayer.");
    }
  }

  async function analyzePromptWithAPI(text) {
    try {
      const apiKey = 'mUoVsa1tzC2VVXj58kfUWgDAVUI1RYXR'; // Remplacez par votre clé API
      const apiUrl = 'https://api.example.com/analyze'; // Remplacez par l'URL de l'API

      // Première tentative avec l'API
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout 5 secondes
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({ prompt: text }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          return data.improvedPrompt;
        }
      } catch (apiError) {
        console.warn('API non disponible, utilisation de l\'amélioration locale:', apiError);
      }
      
      // Si on arrive ici, c'est que l'API a échoué, on utilise l'amélioration locale
      return generateLocalImprovement(text);
    } catch (error) {
      console.error('Erreur complète:', error);
      return text; // En dernier recours, retourner le texte original
    }
  }
  
  // Fonction d'amélioration locale si l'API est indisponible
  function generateLocalImprovement(text) {
    // Amélioration basique basée sur des règles simples
    let improved = text;
    
    // Ajouter une structure si absente
    if (!text.includes("•") && !text.includes("-") && !text.includes(":") && !text.includes("1.")) {
      if (text.length > 100) {
        // Diviser en paragraphes logiques
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        improved = "## Contexte\n" + sentences.slice(0, Math.ceil(sentences.length / 3)).join(". ") + ".\n\n";
        improved += "## Demande précise\n" + sentences.slice(Math.ceil(sentences.length / 3), Math.ceil(2 * sentences.length / 3)).join(". ") + ".\n\n";
        improved += "## Format souhaité\n" + sentences.slice(Math.ceil(2 * sentences.length / 3)).join(". ") + ".";
      }
    }
    
    // Ajouter une demande de format si absente
    if (!text.includes("format") && !text.toLowerCase().includes("présente") && !text.toLowerCase().includes("style")) {
      improved += "\n\nPrésente ta réponse sous forme structurée avec des sections claires et des puces pour les points importants.";
    }
    
    // Ajouter une précision sur le niveau de détail
    if (!text.includes("détail") && !text.includes("approfondi") && !text.includes("résumé")) {
      if (text.length < 100) {
        improved += "\n\nDonne-moi une réponse détaillée avec des exemples concrets.";
      } else {
        improved += "\n\nAssure-toi d'inclure des exemples concrets pour illustrer chaque point important.";
      }
    }
    
    return improved;
  }

  function renderSuggestions(suggestions) {
    suggestionsContainer.innerHTML = '';

    if (suggestions.length === 0) {
      suggestionsContainer.innerHTML = `
        <div class="empty-state">
          Entrez votre prompt pour recevoir des suggestions d'amélioration
        </div>
      `;
      return;
    }

    function getEmoji(iconType) {
      switch(iconType) {
        case "target": return "🎯";
        case "book-open": return "📚";
        case "layout-template": return "📋";
        case "feather": return "✒️";
        case "pen-tool": return "🖋️";
        case "thumbs-up": return "👍";
        default: return "✨";
      }
    }

    suggestions.forEach(suggestion => {
      const suggestionElement = document.createElement('div');
      suggestionElement.className = 'suggestion';

      suggestionElement.innerHTML = `
        <div class="suggestion-header">
          <span style="font-size: 18px; margin-right: 8px; color: ${suggestion.color}">${getEmoji(suggestion.icon)}</span>
          <div class="suggestion-title">${suggestion.title}</div>
        </div>
        <div class="suggestion-description">${suggestion.description}</div>
        ${suggestion.example ? `<div class="suggestion-example"><strong>Conseil:</strong> ${suggestion.example}</div>` : ''}
      `;

      suggestionsContainer.appendChild(suggestionElement);
    });
  }

  function showNotification(message) {
    let notification = document.querySelector('.notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'notification';
      document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Sauvegarder le prompt lors de la fermeture du popup
  window.addEventListener('beforeunload', () => {
    chrome.storage.local.set({
      lastPrompt: promptInput.value
    });
  });
});