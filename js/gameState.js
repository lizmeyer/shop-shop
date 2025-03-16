/**
 * gameState.js - Core game state management for cozy shop game
 * Handles game state, saving/loading, and core game data
 */

// Main game state object - single source of truth
const gameState = {
    // Player stats
    player: {
        name: "Shopkeeper",
        coins: 100,
        level: 1,
        experience: 0,
        reputation: 5, // 1-10 scale
    },
    
    // Shop properties
    shop: {
        name: "Cozy Corner",
        theme: "pastel",
        decorations: [],
        shelves: [],
        isOpen: false,
        dailyCustomers: 0,
        maxCustomers: 8, // increases with reputation
    },
    
    // Game time
    time: {
        day: 1,
        hour: 8, // 24-hour format (8am)
        minute: 0,
        dayPhase: "morning", // morning, day, evening, night
        isPaused: false,
    },
    
    // Inventory - all items the player owns
    inventory: [],
    
    // Stock - items currently on display in the shop
    stock: [],
    
    // Active customers in the shop
    customers: [],
    
    // Orders that need to be fulfilled
    orders: [],
    
    // Game settings
    settings: {
        musicVolume: 0.5,
        soundVolume: 0.7,
        timeScale: 1.0, // game speed multiplier
        autosave: true,
    },
    
    // Tutorial progress
    tutorial: {
        completed: false,
        currentStep: 0,
        steps: ["welcome", "inventory", "customers", "sales", "closing"],
    },
    
    // Game flags for special events
    flags: {
        firstSale: false,
        metMentor: false,
    },
    
    // Active UI state
    ui: {
        activeTab: "shop",
        notifications: [],
        selectedItem: null,
    }
};

// Item catalog - all possible items in the game
const itemCatalog = [
    {
        id: "plushie_cat",
        name: "Cat Plushie",
        category: "Toys",
        basePrice: 15,
        image: "assets/images/items/plushie_cat.png",
        description: "A soft, huggable cat plushie.",
        tags: ["cute", "soft", "animal"],
        popularity: 0.7, // 0-1 scale of general popularity
        stock: 0,
        unlocked: true
    },
    {
        id: "plushie_bunny",
        name: "Bunny Plushie",
        category: "Toys",
        basePrice: 12,
        image: "assets/images/items/plushie_bunny.png",
        description: "An adorable bunny with floppy ears.",
        tags: ["cute", "soft", "animal"],
        popularity: 0.6,
        stock: 0,
        unlocked: true
    },
    {
        id: "teacup_pink",
        name: "Pink Teacup",
        category: "Kitchenware",
        basePrice: 8,
        image: "assets/images/items/teacup_pink.png",
        description: "A delicate pink teacup with gold trim.",
        tags: ["kitchen", "elegant", "gift"],
        popularity: 0.5,
        stock: 0,
        unlocked: true
    },
    {
        id: "notebook_floral",
        name: "Floral Notebook",
        category: "Stationery",
        basePrice: 10,
        image: "assets/images/items/notebook_floral.png",
        description: "A pretty notebook with floral patterns.",
        tags: ["stationery", "gift", "floral"],
        popularity: 0.8,
        stock: 0,
        unlocked: true
    },
    {
        id: "candle_lavender",
        name: "Lavender Candle",
        category: "Home",
        basePrice: 14,
        image: "assets/images/items/candle_lavender.png",
        description: "A soothing lavender-scented candle.",
        tags: ["home", "relaxing", "scented"],
        popularity: 0.7,
        stock: 0,
        unlocked: true
    }
    // More items would be defined here
];

// Customer types with preferences
const customerTypes = [
    {
        id: "student",
        name: "Student",
        image: "assets/images/characters/student.png",
        budget: [10, 25], // min-max range
        preferences: ["Stationery", "Books"],
        tagPreferences: ["cute", "gift"],
        patience: 0.6, // 0-1 scale
        generosity: 0.4, // willingness to pay more than base price
        frequency: 0.7 // how often they appear
    },
    {
        id: "collector",
        name: "Collector",
        image: "assets/images/characters/collector.png",
        budget: [20, 50],
        preferences: ["Toys", "Collectibles"],
        tagPreferences: ["rare", "limited"],
        patience: 0.8,
        generosity: 0.9,
        frequency: 0.3
    },
    {
        id: "parent",
        name: "Parent",
        image: "assets/images/characters/parent.png",
        budget: [15, 40],
        preferences: ["Toys", "Books"],
        tagPreferences: ["educational", "cute", "gift"],
        patience: 0.5,
        generosity: 0.6,
        frequency: 0.5
    }
    // More customer types would be defined here
];

// Shop decoration options
const decorationOptions = [
    {
        id: "wallpaper_pink",
        name: "Pink Wallpaper",
        category: "Wallpaper",
        price: 50,
        image: "assets/images/shop/wallpaper_pink.png",
        boostType: "attractiveness",
        boostValue: 0.1, // 10% boost to shop attractiveness
        unlocked: true
    },
    {
        id: "plant_succulent",
        name: "Succulent Plant",
        category: "Plants",
        price: 25,
        image: "assets/images/shop/plant_succulent.png",
        boostType: "mood",
        boostValue: 0.05, // 5% boost to customer mood
        unlocked: true
    }
    // More decorations would be defined here
];

// GAME STATE FUNCTIONS

/**
 * Initialize a new game with default values
 */
function initNewGame() {
    // Reset to default values
    gameState.player.coins = 100;
    gameState.player.level = 1;
    gameState.player.experience = 0;
    gameState.player.reputation = 5;
    
    gameState.time.day = 1;
    gameState.time.hour = 8;
    gameState.time.minute = 0;
    
    gameState.inventory = [];
    gameState.stock = [];
    gameState.customers = [];
    gameState.orders = [];
    
    gameState.tutorial.completed = false;
    gameState.tutorial.currentStep = 0;
    
    // Reset all flags
    Object.keys(gameState.flags).forEach(key => {
        gameState.flags[key] = false;
    });
    
    // Add starter inventory
    addToInventory("plushie_cat", 2);
    addToInventory("notebook_floral", 3);
    addToInventory("teacup_pink", 2);
    
    // Save the initialized state
    saveGameState();
}

/**
 * Add item to inventory
 * @param {string} itemId - The ID of the item to add
 * @param {number} quantity - Number of items to add
 * @return {boolean} - Success or failure
 */
function addToInventory(itemId, quantity = 1) {
    const itemData = itemCatalog.find(item => item.id === itemId);
    
    if (!itemData) {
        console.error(`Item with ID ${itemId} not found in catalog`);
        return false;
    }
    
    // Check if item already exists in inventory
    const existingItem = gameState.inventory.find(item => item.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        // Add new item to inventory
        gameState.inventory.push({
            id: itemId,
            quantity: quantity,
            price: itemData.basePrice, // Default price is base price
            display: false // Not displayed in shop by default
        });
    }
    
    // Trigger inventory update events
    triggerEvent("inventoryUpdated");
    return true;
}

/**
 * Remove item from inventory
 * @param {string} itemId - The ID of the item to remove
 * @param {number} quantity - Number of items to remove
 * @return {boolean} - Success or failure
 */
function removeFromInventory(itemId, quantity = 1) {
    const itemIndex = gameState.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
        console.error(`Item with ID ${itemId} not found in inventory`);
        return false;
    }
    
    const item = gameState.inventory[itemIndex];
    
    if (item.quantity < quantity) {
        console.error(`Not enough ${itemId} in inventory`);
        return false;
    }
    
    item.quantity -= quantity;
    
    // Remove item completely if quantity is 0
    if (item.quantity <= 0) {
        gameState.inventory.splice(itemIndex, 1);
    }
    
    // Trigger inventory update events
    triggerEvent("inventoryUpdated");
    return true;
}

/**
 * Place item from inventory onto shop display
 * @param {string} itemId - The ID of the item to display
 * @param {number} quantity - Number of items to put on display
 * @param {number} price - Price to sell the item for
 * @return {boolean} - Success or failure
 */
function displayItem(itemId, quantity = 1, price = null) {
    const inventoryItem = gameState.inventory.find(item => item.id === itemId);
    
    if (!inventoryItem || inventoryItem.quantity < quantity) {
        console.error(`Not enough ${itemId} in inventory to display`);
        return false;
    }
    
    // Get item data from catalog
    const itemData = itemCatalog.find(item => item.id === itemId);
    
    // Use specified price or default to the inventory item price
    const sellingPrice = price || inventoryItem.price;
    
    // Check if item is already on display
    const stockItem = gameState.stock.find(item => item.id === itemId);
    
    if (stockItem) {
        stockItem.quantity += quantity;
        stockItem.price = sellingPrice; // Update price
    } else {
        // Add new item to stock
        gameState.stock.push({
            id: itemId,
            quantity: quantity,
            price: sellingPrice,
            category: itemData.category,
            tags: itemData.tags,
            popularity: itemData.popularity,
            displayPosition: { x: 0, y: 0 } // Default position
        });
    }
    
    // Remove from inventory
    removeFromInventory(itemId, quantity);
    
    // Trigger stock update events
    triggerEvent("stockUpdated");
    return true;
}

/**
 * Take item from shop display back to inventory
 * @param {string} itemId - The ID of the item to remove from display
 * @param {number} quantity - Number of items to remove
 * @return {boolean} - Success or failure
 */
function undisplayItem(itemId, quantity = 1) {
    const stockItem = gameState.stock.find(item => item.id === itemId);
    
    if (!stockItem || stockItem.quantity < quantity) {
        console.error(`Not enough ${itemId} on display`);
        return false;
    }
    
    // Add back to inventory
    addToInventory(itemId, quantity);
    
    // Remove from stock
    stockItem.quantity -= quantity;
    
    // Remove item completely if quantity is 0
    if (stockItem.quantity <= 0) {
        const stockIndex = gameState.stock.findIndex(item => item.id === itemId);
        gameState.stock.splice(stockIndex, 1);
    }
    
    // Trigger stock update events
    triggerEvent("stockUpdated");
    return true;
}

/**
 * Save game state to localStorage
 */
function saveGameState() {
    try {
        const savedState = JSON.stringify(gameState);
        localStorage.setItem('cozyShopGameState', savedState);
        console.log("Game saved successfully");
        return true;
    } catch (error) {
        console.error("Failed to save game:", error);
        return false;
    }
}

/**
 * Load game state from localStorage
 */
function loadGameState() {
    try {
        const savedState = localStorage.getItem('cozyShopGameState');
        
        if (!savedState) {
            console.log("No saved game found, starting new game");
            return false;
        }
        
        const parsedState = JSON.parse(savedState);
        
        // Update each property of the game state
        Object.keys(parsedState).forEach(key => {
            gameState[key] = parsedState[key];
        });
        
        console.log("Game loaded successfully");
        return true;
    } catch (error) {
        console.error("Failed to load game:", error);
        return false;
    }
}

/**
 * Reset game and remove saved data
 */
function resetGame() {
    try {
        localStorage.removeItem('cozyShopGameState');
        initNewGame();
        return true;
    } catch (error) {
        console.error("Failed to reset game:", error);
        return false;
    }
}

/**
 * Add or subtract coins from player
 * @param {number} amount - Amount to change (positive to add, negative to subtract)
 * @return {boolean} - Success or failure
 */
function updateCoins(amount) {
    // Check if we have enough coins when subtracting
    if (amount < 0 && gameState.player.coins + amount < 0) {
        console.error("Not enough coins for this transaction");
        return false;
    }
    
    gameState.player.coins += amount;
    
    // Trigger UI update
    triggerEvent("coinsUpdated");
    return true;
}

/**
 * Trigger an event for other modules to respond to
 * @param {string} eventName - Name of the event
 * @param {object} data - Additional data to pass with the event
 */
function triggerEvent(eventName, data = {}) {
    // Create a custom event that other modules can listen for
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
}

/**
 * Get item data by ID (combines catalog data with inventory/stock data)
 * @param {string} itemId - The ID of the item to get
 * @return {object} - Combined item data or null if not found
 */
function getItemById(itemId) {
    const catalogItem = itemCatalog.find(item => item.id === itemId);
    
    if (!catalogItem) {
        return null;
    }
    
    // Get inventory data if it exists
    const inventoryItem = gameState.inventory.find(item => item.id === itemId);
    
    // Get stock data if it exists
    const stockItem = gameState.stock.find(item => item.id === itemId);
    
    // Combine data
    return {
        ...catalogItem,
        inventoryQuantity: inventoryItem ? inventoryItem.quantity : 0,
        stockQuantity: stockItem ? stockItem.quantity : 0,
        currentPrice: stockItem ? stockItem.price : catalogItem.basePrice
    };
}

// Public API
window.GameState = {
    get: () => gameState,
    init: initNewGame,
    save: saveGameState,
    load: loadGameState,
    reset: resetGame,
    addItem: addToInventory,
    removeItem: removeFromInventory,
    displayItem: displayItem,
    undisplayItem: undisplayItem,
    updateCoins: updateCoins,
    getItemById: getItemById,
    itemCatalog: itemCatalog,
    customerTypes: customerTypes,
    decorationOptions: decorationOptions
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Try to load saved game, or initialize new game if no save exists
    if (!loadGameState()) {
        initNewGame();
    }
});
