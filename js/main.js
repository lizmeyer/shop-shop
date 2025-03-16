/**
 * main.js - Entry point for cozy shop game
 * Initializes the game and coordinates modules
 */

// Main Game object
const Game = {
    // Game state
    initialized: false,
    assetsLoaded: false,
    activeModules: {},
    
    // Initialize the game
    init() {
        console.log('Initializing game...');
        
        // Check if required modules are available
        if (!window.GameState || !window.UI || !window.Shop) {
            console.error('Required modules not loaded!');
            this.showErrorMessage([
                'Some game modules failed to load.',
                'Check the console for more information.',
                'Try refreshing the page or check your internet connection.'
            ]);
            return false;
        }
        
        // Add error handling for uncaught errors
        window.addEventListener('error', this.handleError.bind(this));
        
        // Load assets
        this.loadAssets().then(() => {
            // Initialize game state first
            this.activeModules.gameState = window.GameState;
            
            // Initialize UI
            this.activeModules.ui = window.UI;
            
            // Initialize shop
            this.activeModules.shop = window.Shop;
            
            // Register event handlers
            this.setupEventHandlers();
            
            // Game successfully initialized
            this.initialized = true;
            console.log('Game initialized successfully!');
            
            // Show welcome message or tutorial for new players
            const gameState = window.GameState.get();
            
            if (gameState.player.level === 1 && gameState.time.day === 1 && !gameState.tutorial.completed) {
                // New player, show tutorial after a short delay
                setTimeout(() => {
                    window.UI.showTutorial();
                }, 1000);
            }
        }).catch(error => {
            console.error('Failed to load game assets:', error);
            this.showErrorMessage([
                'Failed to load game assets.',
                'Try refreshing the page or check your internet connection.'
            ]);
        });
    },
    
    // Load game assets
    async loadAssets() {
        // Show loading progress
        this.updateLoadingProgress(10, 'Initializing...');
        
        // Create array of asset loading promises
        const assetPromises = [];
        
        // Preload shop background
        assetPromises.push(this.preloadImage('assets/images/shop/default_wallpaper.png'));
        
        // Preload UI elements
        assetPromises.push(this.preloadImage('assets/images/ui/coin.png'));
        assetPromises.push(this.preloadImage('assets/images/ui/star.png'));
        assetPromises.push(this.preloadImage('assets/images/ui/menu.png'));
        
        // Preload shop elements
        assetPromises.push(this.preloadImage('assets/images/shop/counter.png'));
        
        // Update loading progress
        this.updateLoadingProgress(30, 'Loading shop assets...');
        
        // Preload customer images
        const customerTypes = window.GameState.customerTypes;
        for (const customer of customerTypes) {
            assetPromises.push(this.preloadImage(customer.image));
        }
        
        // Update loading progress
        this.updateLoadingProgress(50, 'Loading inventory items...');
        
        // Preload item images
        const itemCatalog = window.GameState.itemCatalog;
        for (const item of itemCatalog) {
            assetPromises.push(this.preloadImage(item.image));
        }
        
        // Update loading progress
        this.updateLoadingProgress(70, 'Loading decorations...');
        
        // Preload decoration images
        const decorations = window.GameState.decorationOptions;
        for (const decor of decorations) {
            assetPromises.push(this.preloadImage(decor.image));
        }
        
        // Wait for all assets to load
        this.updateLoadingProgress(90, 'Finalizing...');
        
        await Promise.all(assetPromises);
        
        // All assets loaded
        this.assetsLoaded = true;
        this.updateLoadingProgress(100, 'Ready!');
        
        // Wait a moment to show 100% before hiding loading screen
        return new Promise(resolve => setTimeout(resolve, 500));
    },
    
    // Preload an image
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Failed to load image: ${src}`);
                // Resolve anyway to prevent blocking game load
                resolve(null);
            };
            img.src = src;
        });
    },
    
    // Update loading progress bar
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
    
    // Set up global event handlers
    setupEventHandlers() {
        // Game-specific keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only if game is initialized
            if (!this.initialized) return;
            
            // Escape key closes modals
            if (e.key === 'Escape') {
                window.UI.closeModal();
            }
            
            // F5 or Ctrl+S to save game
            if (e.key === 'F5' || (e.ctrlKey && e.key === 's')) {
                e.preventDefault();
                window.GameState.save();
                window.UI.showNotification('Game saved!', 'success');
            }
        });
        
        // Handle visibility change (pause game when tab is inactive)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden (user switched tabs)
                this.pauseGame();
            } else {
                // Page is visible again
                this.resumeGame();
            }
        });
        
        // Handle window resize (adjust UI elements)
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Initial resize handling
        this.handleResize();
    },
    
    // Handle window resize
    handleResize() {
        // Get game container
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;
        
        // Add appropriate classes based on window size
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
    
    // Pause the game (when tab is inactive)
    pauseGame() {
        if (!this.initialized) return;
        
        // Set game to paused state
        GameState.get().time.isPaused = true;
        
        // Stop any active timers in Shop module
        if (window.Shop && window.Shop.isOpen) {
            clearInterval(window.Shop.dayTimer);
            window.Shop.customerTimers.forEach(timer => clearTimeout(timer));
        }
        
        console.log('Game paused');
    },
    
    // Resume the game (when tab is active again)
    resumeGame() {
        if (!this.initialized) return;
        
        // Set game to unpaused state
        GameState.get().time.isPaused = false;
        
        // Restart shop timers if shop is open
        if (window.Shop && window.Shop.isOpen) {
            window.Shop.startDayCycle();
        }
        
        console.log('Game resumed');
    },
    
    // Handle uncaught errors
    handleError(event) {
        console.error('Uncaught error:', event.error || event.message);
        
        // Prevent showing too many error messages
        if (!this.errorShown) {
            this.errorShown = true;
            
            // Show error message to user
            this.showErrorMessage([
                'An unexpected error occurred.',
                event.error ? event.error.toString() : event.message,
                'Try refreshing the page.'
            ]);
        }
        
        // Prevent default handling
        event.preventDefault();
    },
    
    // Show error message to user
    showErrorMessage(errors) {
        const errorMessage = document.getElementById('errorMessage');
        const errorDetails = document.getElementById('errorDetails');
        
        if (!errorMessage || !errorDetails) {
            // Can't find error message elements, show alert instead
            alert('Game error: ' + errors.join('\n'));
            return;
        }
        
        // Clear existing errors
        errorDetails.innerHTML = '';
        
        // Add each error as a list item
        errors.forEach(error => {
            const li = document.createElement('li');
            li.textContent = error;
            errorDetails.appendChild(li);
        });
        
        // Show error message
        errorMessage.style.display = 'block';
        
        // Hide loading screen if it's still visible
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
};

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Start game initialization after a short delay to allow other modules to load
    setTimeout(() => {
        Game.init();
    }, 100);
});

// Make Game object available globally
window.Game = Game;
