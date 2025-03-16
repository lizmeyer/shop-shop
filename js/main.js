// Simple main.js to get basic functionality working
document.addEventListener('DOMContentLoaded', function() {
  // Show content instead of error
  const gameContainer = document.getElementById('gameContainer');
  if (gameContainer) {
    gameContainer.innerHTML = '<h1>Cozy Shop Game</h1><p>Loading modules...</p>';
  }
  
  // Initialize modules in order
  try {
    // Check if modules exist
    if (typeof GameState === 'undefined') {
      throw new Error('GameState module not loaded');
    }
    
    // Initialize UI
    if (typeof UI !== 'undefined') {
      UI.init();
    } else {
      throw new Error('UI module not loaded');
    }
    
    // Initialize Shop
    if (typeof Shop !== 'undefined') {
      Shop.init();
    } else {
      console.warn('Shop module not loaded yet');
    }
    
    console.log('Game initialized successfully!');
  } catch (error) {
    console.error('Error initializing game:', error);
    const errorContainer = document.createElement('div');
    errorContainer.style.padding = '20px';
    errorContainer.style.backgroundColor = '#ffeeee';
    errorContainer.style.border = '1px solid red';
    errorContainer.style.margin = '20px';
    errorContainer.innerHTML = `
      <h2>Error Loading Game</h2>
      <p>${error.message}</p>
      <p>Check the console for more details (F12)</p>
      <button onclick="location.reload()">Reload Page</button>
    `;
    if (gameContainer) {
      gameContainer.appendChild(errorContainer);
    }
  }
});
