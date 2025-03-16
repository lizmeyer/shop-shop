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
        
        // Rest of your initialization code...
    },
    
    // Other Game object methods...
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

// ADD THE NEW IMAGE ERROR HANDLING CODE RIGHT HERE:
// Setup image error handling to prevent game from breaking on missing images
(function setupImageErrorHandling() {
  // Handle image loading errors globally
  window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
      console.warn(`Image failed to load: ${e.target.src}`);
      // Replace with inline SVG fallback
      e.target.style.display = 'inline-block';
      e.target.style.width = '100%';
      e.target.style.height = '100%';
      e.target.style.backgroundColor = getRandomPastelColor(e.target.alt || 'item');
      e.target.style.borderRadius = '4px';
      
      // Prevent the error from bubbling up and breaking the game
      e.stopPropagation();
      e.preventDefault();
      return true;
    }
  }, true);
  
  // Generate a consistent pastel color based on string
  function getRandomPastelColor(str) {
    // Generate a consistent hash from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to generate a pastel color
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 80%)`;
  }
})();

// Add placeholder image generator
window.generatePlaceholderImage = function(name, category) {
  // Create a SVG data URL based on the name
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
