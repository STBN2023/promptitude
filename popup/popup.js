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
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "applyImprovedPrompt",
        text: improvedText
      });
    });

    showNotification("Prompt appliqué avec succès !");
    tabEditor.click();
  });

  helpBtn.addEventListener('click', () => {
    chrome.tabs.create({
      url: "https://unequaled-persimmon-f86.notion.site/Promptitude-l-extension-chrome-1c189f61364c801197fbff903264c884"
    });
  });

  async function analyzePrompt(text) {
    const improvedText = await analyzePromptWithAPI(text);
    improvedPromptElement.textContent = improvedText;

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
  }

  async function analyzePromptWithAPI(text) {
    const apiKey = 'mUoVsa1tzC2VVXj58kfUWgDAVUI1RYXR'; // Remplacez par votre clé API
    const apiUrl = 'https://api.example.com/analyze'; // Remplacez par l'URL de l'API

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ prompt: text })
    });

    if (response.ok) {
      const data = await response.json();
      return data.improvedPrompt; // Supposons que l'API retourne un champ 'improvedPrompt'
    } else {
      console.error('Erreur lors de l\'analyse du prompt:', response.statusText);
      return text;
    }
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
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  chrome.storage.local.get(['lastPrompt'], function(result) {
    if (result.lastPrompt) {
      promptInput.value = result.lastPrompt;
    }
  });

  window.addEventListener('beforeunload', () => {
    chrome.storage.local.set({
      lastPrompt: promptInput.value
    });
  });
});
