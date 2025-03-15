// Game state object
const gameState = {
    coins: 100,
    businessPath: 'curator',
    activeTab: 'shop',
    inventory: [],
    orders: [],
    // Other state properties
};

// Data collections
const wholesaleCatalog = [
    { id: 1, name: 'Cute Plushie', category: 'Toys', price: 15, image: 'images/products/plushie.png', markup: 10 },
    // More items
];

const productTemplates = [
    // Templates data
];

const animals = [
    // Animal data
];

// Save/load functions
function saveGameState() {
    try {
        const stateToSave = {
            coins: gameState.coins,
            // Other properties to save
        };
        localStorage.setItem('kittenSorbetGameState', JSON.stringify(stateToSave));
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

function loadGameState() {
    try {
        const savedState = localStorage.getItem('kittenSorbetGameState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            Object.keys(parsedState).forEach(key => {
                gameState[key] = parsedState[key];
            });
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}
