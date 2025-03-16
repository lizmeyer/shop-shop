/**
 * Store visualization integration for the shop game
 * Add this code to your main.js file or create a new storeViewIntegration.js file
 */

// Initialize the store visualization when the UI is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for UI and Three.js to be loaded
  waitForElements(['#storeViewContainer', 'THREE'], function() {
    initializeStoreView();
  });
});

// Function to wait for required elements and libraries
function waitForElements(selectors, callback) {
  let elementsReady = selectors.map(() => false);
  
  function checkElements() {
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      
      if (!elementsReady[i]) {
        if (selector.startsWith('#') || selector.startsWith('.')) {
          // Check for DOM element
          elementsReady[i] = document.querySelector(selector) !== null;
        } else {
          // Check for global variable
          elementsReady[i] = window[selector] !== undefined;
        }
      }
    }
    
    if (elementsReady.every(ready => ready)) {
      callback();
    } else {
      setTimeout(checkElements, 100);
    }
  }
  
  checkElements();
}

// Initialize the 3D store visualization
function initializeStoreView() {
  console.log('Initializing 3D store visualization');
  
  // Initialize Three.js store view
  if (window.StoreView) {
    StoreView.init('storeViewContainer');
    
    // Sync the 3D view with the game state
    syncStoreWithGameState();
    
    // Set up event listeners for the store controls
    setupStoreControls();
  } else {
    console.error('StoreView module not found!');
  }
}

// Sync the 3D store with the current game state
function syncStoreWithGameState() {
  // Ensure GameState is available
  if (!window.GameState) return;
  
  const gameState = GameState.get();
  
  // Add products from inventory to the store
  gameState.stock.forEach(item => {
    const itemData = GameState.getItemById(item.id);
    if (itemData) {
      // Create a position based on displayPosition or default
      const position = item.displayPosition
        ? new THREE.Vector3(
            (item.displayPosition.x / 100) * 10 - 5, // Scale and center x position
            0.5, // Fixed height slightly above surfaces
            (item.displayPosition.y / 100) * -10 + 3 // Scale and invert y to z
          )
        : null;
      
      // Add the product to the 3D view
      StoreView.addProduct(
        item.id,
        itemData.name,
        position,
        {
          // Generate color based on category
          color: getCategoryColor(itemData.category),
          size: {
            width: 0.5,
            height: 0.5,
            depth: 0.5
          }
        }
      );
    }
  });
  
  // Add decorations from shop state
  if (gameState.shop.decorations) {
    gameState.shop.decorations.forEach(decor => {
      if (decor.isActive) {
        const position = decor.position
          ? new THREE.Vector3(
              (decor.position.x / 100) * 10 - 5,
              decor.category === 'Wallpaper' ? 4 : 0.5,
              decor.category === 'Wallpaper' ? -7.4 : (decor.position.y / 100) * -10 + 3
            )
          : null;
        
        // Add decoration to 3D view
        if (decor.category === 'Wallpaper') {
          // Change wall color instead of adding an object
          StoreView.changeWallColor('backWall', decor.image || '#ffffff');
        } else {
          StoreView.addDecoration(
            decor.id,
            decor.name,
            position,
            {
              type: decor.category.toLowerCase(),
              color: 0xf0c0a0 // Default decoration color
            }
          );
        }
      }
    });
  }
  
  // Listen for changes in the game state
  document.addEventListener('stockUpdated', syncStoreWithGameState);
}

// Set up event listeners for the store controls
function setupStoreControls() {
  // Reset view button
  const resetViewBtn = document.querySelector('.reset-view-btn');
  if (resetViewBtn) {
    resetViewBtn.addEventListener('click', function() {
      if (StoreView.camera) {
        StoreView.camera.position.set(0, 5, 10);
        StoreView.camera.lookAt(0, 0, 0);
        if (StoreView.controls) {
          StoreView.controls.reset();
        }
      }
    });
  }
  
  // Toggle rotation button
  let autoRotate = false;
  const rotateViewBtn = document.querySelector('.rotate-view-btn');
  if (rotateViewBtn && StoreView.controls) {
    rotateViewBtn.addEventListener('click', function() {
      autoRotate = !autoRotate;
      StoreView.controls.autoRotate = autoRotate;
      rotateViewBtn.classList.toggle('active', autoRotate);
    });
  }
  
  // Customize store button
  const customizeBtn = document.querySelector('.customize-btn');
  const customizationPanel = document.getElementById('storeCustomization');
  if (customizeBtn && customizationPanel) {
    customizeBtn.addEventListener('click', function() {
      customizationPanel.classList.toggle('open');
    });
    
    // Close customization panel
    const closePanel = customizationPanel.querySelector('.close-panel');
    if (closePanel) {
      closePanel.addEventListener('click', function() {
        customizationPanel.classList.remove('open');
      });
    }
  }
  
  // Color options for walls and floor
  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.addEventListener('click', function() {
      const target = this.getAttribute('data-target');
      const wall = this.getAttribute('data-wall');
      const color = this.getAttribute('data-color');
      
      if (target === 'floor') {
        StoreView.changeFloorColor(color);
      } else if (wall) {
        StoreView.changeWallColor(wall, color);
      }
      
      // Mark selected color
      const siblings = this.parentElement.querySelectorAll('.color-option');
      siblings.forEach(sib => sib.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
  
  // Store layout selection
  const layoutSelect = document.getElementById('storeLayoutSelect');
  if (layoutSelect) {
    layoutSelect.addEventListener('change', function() {
      const layout = this.value;
      loadStoreLayout(layout);
    });
  }
  
  // Save current layout
  const saveLayoutBtn = document.getElementById('saveLayoutBtn');
  if (saveLayoutBtn) {
    saveLayoutBtn.addEventListener('click', function() {
      const layout = StoreView.saveStoreLayout();
      // Save to localStorage
      try {
        localStorage.setItem('customStoreLayout', JSON.stringify(layout));
        UI.showNotification('Store layout saved!', 'success');
      } catch (error) {
        console.error('Failed to save store layout:', error);
        UI.showNotification('Failed to save layout', 'error');
      }
    });
  }
  
  // Handle window resize
  window.addEventListener('resize', function() {
    if (StoreView.onWindowResize) {
      StoreView.onWindowResize();
    }
  });
}

// Load a store layout by name
function loadStoreLayout(layoutName) {
  if (layoutName === 'default') {
    // Reset to default layout
    StoreView.clearStore();
    syncStoreWithGameState();
    UI.showNotification('Default layout loaded', 'info');
  } else if (layoutName === 'custom') {
    // Load custom layout from localStorage
    try {
      const savedLayout = localStorage.getItem('customStoreLayout');
      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        StoreView.loadStoreLayout(layout);
        UI.showNotification('Custom layout loaded', 'success');
      } else {
        UI.showNotification('No custom layout found', 'error');
      }
    } catch (error) {
      console.error('Failed to load custom layout:', error);
      UI.showNotification('Failed to load layout', 'error');
    }
  } else {
    // Load predefined layouts
    const layouts = {
      'cozy': {
        walls: {
          backWall: {
            color: '#ffecf0', // Soft pink
            position: { x: 0, y: 4, z: -7.5 }
          },
          leftWall: {
            color: '#f8e8e8', // Light pink
            position: { x: -10, y: 4, z: 0 }
          },
          rightWall: {
            color: '#f8e8e8', // Light pink
            position: { x: 10, y: 4, z: 0 }
          }
        },
        floor: {
          color: '#e8d0c0' // Warm wood
        },
        furniture: {
          counter: {
            position: { x: 0, y: 0.5, z: 5 }
          },
          shelf_1: {
            position: { x: -4, y: 2, z: -7 }
          },
          shelf_2: {
            position: { x: -4, y: 4, z: -7 }
          },
          shelf_3: {
            position: { x: -4, y: 6, z: -7 }
          },
          side_shelf_1: {
            position: { x: -9.5, y: 2, z: -3 }
          }
        }
      },
      'modern': {
        walls: {
          backWall: {
            color: '#ffffff', // White
            position: { x: 0, y: 4, z: -7.5 }
          },
          leftWall: {
            color: '#e0f0ff', // Light blue
            position: { x: -10, y: 4, z: 0 }
          },
          rightWall: {
            color: '#e0f0ff', // Light blue
            position: { x: 10, y: 4, z: 0 }
          }
        },
        floor: {
          color: '#d0d0d0' // Gray
        },
        furniture: {
          counter: {
            position: { x: 0, y: 0.5, z: 5 }
          },
          shelf_1: {
            position: { x: 4, y: 2, z: -7 }
          },
          shelf_2: {
            position: { x: 0, y: 4, z: -7 }
          },
          shelf_3: {
            position: { x: -4, y: 6, z: -7 }
          }
        }
      }
    };
    
    if (layouts[layoutName]) {
      StoreView.loadStoreLayout(layouts[layoutName]);
      UI.showNotification(`${layoutName.charAt(0).toUpperCase() + layoutName.slice(1)} layout loaded`, 'success');
    } else {
      UI.showNotification('Layout not found', 'error');
    }
  }
}

// Helper function to get color based on item category
function getCategoryColor(category) {
  const colors = {
    'Toys': 0xffcccc,        // Soft red
    'Stationery': 0xccffcc,  // Soft green
    'Kitchenware': 0xccccff, // Soft blue
    'Home': 0xffffcc,        // Soft yellow
    'Books': 0xffccff,       // Soft purple
    'Collectibles': 0xffddbb // Soft orange
  };
  
  return colors[category] || 0xf0f0f0; // Default light gray
}
