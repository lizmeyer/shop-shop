/**
 * main.js - Entry point for cozy shop game
 * Initializes the game and coordinates modules
 */

const Game = {
  initialized: false,
  assetsLoaded: false,
  activeModules: {},
  errorShown: false,

  init() {
    console.log('Initializing game...');

    // Ensure required modules are available
    if (!window.GameState || !window.UI || !window.Shop) {
      console.error('Required modules not loaded!');
      this.showErrorMessage([
        'Some game modules failed to load.',
        'Check the console for more information.',
        'Try refreshing the page or check your internet connection.'
      ]);
      return;
    }

    // Setup global error handling
    window.addEventListener('error', this.handleError.bind(this));

    // Begin asset preloading, then initialize modules
    this.loadAssets()
      .then(() => {
        // Save references to essential modules
        this.activeModules.gameState = window.GameState;
        this.activeModules.ui = window.UI;
        this.activeModules.shop = window.Shop;

        // Register global event handlers
        this.setupEventHandlers();

        // Enhance button functionality (for visual feedback and logging)
        this.enhanceButtonFunctionality();

        this.initialized = true;
        console.log('Game initialized successfully!');

        // Hide the loading screen if present
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
          loadingScreen.style.display = 'none';
        }

        // Show tutorial for new players if applicable
        const gameState = window.GameState.get();
        if (
          gameState.player.level === 1 &&
          gameState.time.day === 1 &&
          !gameState.tutorial.completed
        ) {
          setTimeout(() => {
            window.UI.showTutorial();
          }, 1000);
        }
      })
      .catch(error => {
        console.error('Failed to load game assets:', error);
        this.showErrorMessage([
          'Failed to load game assets.',
          'Try refreshing the page or check your internet connection.'
        ]);
      });
  },

  async loadAssets() {
    this.updateLoadingProgress(10, 'Initializing...');
    const assetPromises = [];

    // Preload shop background
    assetPromises.push(this.preloadImage('assets/images/shop/default_wallpaper.png'));

    // Preload UI elements
    assetPromises.push(this.preloadImage('assets/images/ui/coin.png'));
    assetPromises.push(this.preloadImage('assets/images/ui/star.png'));
    assetPromises.push(this.preloadImage('assets/images/ui/menu.png'));

    // Preload shop elements
    assetPromises.push(this.preloadImage('assets/images/shop/counter.png'));

    this.updateLoadingProgress(30, 'Loading shop assets...');

    // Preload customer images, if defined in GameState
    if (window.GameState && window.GameState.customerTypes) {
      const customerTypes = window.GameState.customerTypes;
      for (const customer of customerTypes) {
        assetPromises.push(this.preloadImage(customer.image));
      }
    }

    this.updateLoadingProgress(50, 'Loading inventory items...');

    // Preload item images from itemCatalog
    if (window.GameState && window.GameState.itemCatalog) {
      const itemCatalog = window.GameState.itemCatalog;
      for (const item of itemCatalog) {
        assetPromises.push(this.preloadImage(item.image));
      }
    }

    this.updateLoadingProgress(70, 'Loading decorations...');

    // Preload decoration images from decorationOptions
    if (window.GameState && window.GameState.decorationOptions) {
      const decorations = window.GameState.decorationOptions;
      for (const decor of decorations) {
        assetPromises.push(this.preloadImage(decor.image));
      }
    }

    this.updateLoadingProgress(90, 'Finalizing...');

    await Promise.all(assetPromises);

    this.assetsLoaded = true;
    this.updateLoadingProgress(100, 'Ready!');

    // Wait briefly to let users see 100% progress before continuing
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  preloadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}`);
        // Use a placeholder if available
        if (window.generatePlaceholderImage) {
          img.src = window.generatePlaceholderImage('Missing', '');
        }
        resolve(img); // Resolve even on error to prevent blocking
      };
      img.src = src;
    });
  },

  updateLoadingProgress(percent, message) {
    const loadingBar = document.getElementById('loadingBar');
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingBar) {
      loadingBar.style.width = `${percent}%`;
    }
    if (loadingScreen) {
      const messageElement = loadingScreen.querySelector('h2');
      if (messageElement) {
        messageElement.textContent = message || 'Loading...';
      }
    }
  },

  enhanceButtonFunctionality() {
    console.log("Enhancing button functionality");
    // Enhance all existing buttons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
      // Clone and replace to remove duplicate listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      newButton.addEventListener('click', function () {
        console.log("Button clicked:", this.textContent || this.className);
        this.classList.add('button-pressed');
        setTimeout(() => {
          this.classList.remove('button-pressed');
        }, 200);
      });
    });
    // Set up observer for dynamically added buttons
    const observer = new MutationObserver(mutations => {
      let newButtonsFound = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
              const newButtons = node.querySelectorAll('button');
              if (newButtons.length > 0) {
                console.log("New buttons detected:", newButtons.length);
                newButtonsFound = true;
              }
            }
          });
        }
      });
      if (newButtonsFound) {
        setTimeout(() => {
          this.enhanceButtonFunctionality();
        }, 100);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },

  checkElementsExist() {
    const elements = [
      'shopView', 'shopScene', 'shopShelves', 'shopFloor',
      'storeViewContainer', 'gameContainer'
    ];
    const results = {};
    elements.forEach(id => {
      const element = document.getElementById(id);
      results[id] = !!element;
      console.log(`Element #${id} exists:`, !!element);
    });
    return results;
  },

  setupEventHandlers() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.initialized) return;
      if (e.key === 'Escape') {
        window.UI.closeModal();
      }
      if (e.key === 'F5' || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        window.GameState.save();
        window.UI.showNotification('Game saved!', 'success');
      }
      if (e.key === 'F12') {
        e.preventDefault();
        document.body.classList.toggle('debug-outline');
        console.log('Debug outline mode:', document.body.classList.contains('debug-outline'));
      }
    });

    // Pause game when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseGame();
      } else {
        this.resumeGame();
      }
    });

    // Adjust UI on window resize
    window.addEventListener('resize', () => {
      this.handleResize();
      this.preserveShopState();
    });
    // Initial resize handling
    this.handleResize();
  },

  preserveShopState() {
    if (!window.UI) return;
    const currentTab = window.UI.activeTab;
    setTimeout(() => {
      if (window.UI.updateViewContent) {
        window.UI.updateViewContent(currentTab);
      }
      if (window.StoreView && window.StoreView.onWindowResize) {
        window.StoreView.onWindowResize();
      }
      this.checkElementsExist();
    }, 100);
  },

  handleResize() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    if (window.innerWidth < 600) {
      gameContainer.classList.add('mobile-view');
      gameContainer.classList.remove('tablet-view', 'desktop-view');
    } else if (window.innerWidth < 1024) {
      gameContainer.classList.add('tablet-view');
      gameContainer.classList.remove('mobile-view', 'desktop-view');
    } else {
      gameContainer.classList.add('desktop-view');
      gameContainer.classList.remove('mobile-view', 'tablet-view');
    }
  },

  pauseGame() {
    if (!this.initialized) return;
    if (window.GameState) {
      window.GameState.get().time.isPaused = true;
    }
    if (window.Shop && window.Shop.isOpen) {
      clearInterval(window.Shop.dayTimer);
      if (window.Shop.customerTimers) {
        window.Shop.customerTimers.forEach(timer => clearTimeout(timer));
      }
    }
    console.log('Game paused');
  },

  resumeGame() {
    if (!this.initialized) return;
    if (window.GameState) {
      window.GameState.get().time.isPaused = false;
    }
    if (window.Shop && window.Shop.isOpen) {
      window.Shop.startDayCycle();
    }
    console.log('Game resumed');
  },

  handleError(event) {
    console.error('Uncaught error:', event.error || event.message);
    if (!this.errorShown) {
      this.errorShown = true;
      this.showErrorMessage([
        'An unexpected error occurred.',
        event.error ? event.error.toString() : event.message,
        'Try refreshing the page.'
      ]);
    }
    event.preventDefault();
  },

  showErrorMessage(errors) {
    const errorMessage = document.getElementById('errorMessage');
    const errorDetails = document.getElementById('errorDetails');
    if (!errorMessage || !errorDetails) {
      alert('Game error: ' + errors.join('\n'));
      return;
    }
    errorDetails.innerHTML = '';
    errors.forEach(error => {
      const li = document.createElement('li');
      li.textContent = error;
      errorDetails.appendChild(li);
    });
    errorMessage.style.display = 'block';
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
  }
};

// Global image error handling and placeholder generation
(function setupImageErrorHandling() {
  window.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG') {
      console.warn(`Image failed to load: ${e.target.src}`);
      e.target.style.display = 'inline-block';
      e.target.style.width = '100%';
      e.target.style.height = '100%';
      e.target.style.backgroundColor = getRandomPastelColor(e.target.alt || 'item');
      e.target.style.borderRadius = '4px';
      e.stopPropagation();
      e.preventDefault();
      return true;
    }
  }, true);

  function getRandomPastelColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 80%)`;
  }
})();

// Expose a placeholder image generator globally
window.generatePlaceholderImage = function(name, category) {
  const text = name || 'Item';
  const color = getCategoryColor(category || 'item');
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="${color}" />
      <text x="50" y="50" font-family="Arial" font-size="12" fill="#000" text-anchor="middle">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

  function getCategoryColor(category) {
    const colors = {
      'Toys': '#ffcccc',
      'Stationery': '#ccffcc',
      'Kitchenware': '#ccccff',
      'Home': '#ffffcc',
      'item': '#f0e0d0'
    };
    return colors[category] || colors.item;
  }
};

// Initialize game when DOM is ready
function initializeGame() {
  // Delay slightly to ensure all modules are loaded
  setTimeout(() => {
    Game.init();
  }, 300);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}

// Expose the Game object globally
window.Game = Game;
