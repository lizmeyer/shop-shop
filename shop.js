/**
 * shop.js - Shop operations and customer simulation
 * Handles shop opening/closing, customer behavior, and sales
 */

// Shop management object
const Shop = {
    // Shop state
    isOpen: false,
    dayStats: {
        customers: 0,
        sales: 0,
        revenue: 0,
        profit: 0
    },
    customerPool: [],
    activeCustomers: [],
    dayTimer: null,
    customerTimers: [],
    
    // Initialize shop
    init() {
        console.log('Shop module initialized');
        // Set up event listeners
        document.addEventListener('stockUpdated', () => this.updateShopAttractiveness());
    },
    
    // Open the shop for business
    openShop() {
        if (this.isOpen) return;
        
        const gameState = GameState.get();
        
        // Can't open if no items on display
        if (gameState.stock.length === 0) {
            UI.showNotification('You need to display items before opening your shop!', 'error');
            return false;
        }
        
        this.isOpen = true;
        gameState.shop.isOpen = true;
        
        // Reset day stats
        this.dayStats = {
            customers: 0,
            sales: 0,
            revenue: 0,
            profit: 0
        };
        
        // Update UI
        UI.showNotification('Shop is now open for business!', 'success');
        
        // Start the day cycle
        this.startDayCycle();
        
        // Generate customer pool for the day
        this.generateCustomerPool();
        
        // Schedule first customer
        this.scheduleNextCustomer();
        
        return true;
    },
    
    // Close the shop
    closeShop() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        GameState.get().shop.isOpen = false;
        
        // Clear all timers
        clearInterval(this.dayTimer);
        this.customerTimers.forEach(timer => clearTimeout(timer));
        this.customerTimers = [];
        
        // Remove all customers
        this.activeCustomers.forEach(customer => this.removeCustomer(customer.id));
        this.activeCustomers = [];
        
        // Show day summary
        this.showDaySummary();
        
        // Update UI
        UI.showNotification('Shop is now closed.', 'info');
        
        return true;
    },
    
    // Start the day cycle (time passing)
    startDayCycle() {
        const gameState = GameState.get();
        const timeScale = gameState.settings.timeScale;
        
        // Day cycle updates time every second
        this.dayTimer = setInterval(() => {
            // Update minutes first
            gameState.time.minute += 1 * timeScale;
            
            // Handle hour rollover
            if (gameState.time.minute >= 60) {
                gameState.time.hour += 1;
                gameState.time.minute = 0;
                
                // Trigger hour change event
                this.onHourChange();
            }
            
            // Handle end of day (8pm/20:00)
            if (gameState.time.hour >= 20) {
                this.closeShop();
                
                // Reset to next morning
                gameState.time.day += 1;
                gameState.time.hour = 8;
                gameState.time.minute = 0;
            }
            
            // Update time display
            UI.updateTimeDisplay();
            
        }, 1000); // 1 real second per game minute
    },
    
    // Handle hour change events
    onHourChange() {
        // Update customer frequency based on time of day
        // Most customers during lunch (12-2) and after work (5-7)
        const hour = GameState.get().time.hour;
        
        if (hour === 12 || hour === 17) {
            // Rush hour - schedule extra customers
            this.scheduleRushHourCustomers();
            UI.showNotification("It's getting busy!", 'info');
        }
        
        // Auto-save game at noon if enabled
        if (hour === 12 && GameState.get().settings.autosave) {
            GameState.save();
            UI.showNotification('Game auto-saved.', 'info');
        }
    },
    
    // Generate the pool of potential customers for the day
    generateCustomerPool() {
        const gameState = GameState.get();
        const reputation = gameState.player.reputation;
        
        // Base number of potential customers scaled by reputation
        const baseCustomers = Math.floor(5 + (reputation * 2));
        const maxCustomers = gameState.shop.maxCustomers;
        
        // Determine how many customers might visit today (capped by maxCustomers)
        const potentialCustomers = Math.min(baseCustomers, maxCustomers);
        
        // Create the customer pool
        this.customerPool = [];
        
        // Generate random customers based on customer types
        for (let i = 0; i < potentialCustomers; i++) {
            // Select random customer type weighted by frequency
            const customerTypes = GameState.customerTypes;
            
            // Calculate total frequency for weighted random selection
            const totalFrequency = customerTypes.reduce((sum, type) => sum + type.frequency, 0);
            let random = Math.random() * totalFrequency;
            
            // Select customer type
            let selectedType;
            for (const type of customerTypes) {
                random -= type.frequency;
                if (random <= 0) {
                    selectedType = type;
                    break;
                }
            }
            
            // If somehow no type was selected, use the first one
            if (!selectedType) {
                selectedType = customerTypes[0];
            }
            
            // Generate budget within type's range
            const minBudget = selectedType.budget[0];
            const maxBudget = selectedType.budget[1];
            const budget = Math.floor(minBudget + Math.random() * (maxBudget - minBudget));
            
            // Create customer object
            const customer = {
                id: `customer_${Date.now()}_${i}`,
                type: selectedType.id,
                name: selectedType.name,
                image: selectedType.image,
                budget: budget,
                preferences: [...selectedType.preferences],
                tagPreferences: [...selectedType.tagPreferences],
                patience: selectedType.patience,
                generosity: selectedType.generosity,
                browsing: true,
                interestedItems: [],
                timeInShop: 0
            };
            
            this.customerPool.push(customer);
        }
        
        console.log(`Generated customer pool with ${this.customerPool.length} potential customers`);
    },
    
    // Schedule the next customer to enter the shop
    scheduleNextCustomer() {
        if (!this.isOpen || this.customerPool.length === 0) return;
        
        // Calculate time until next customer (2-5 minutes, adjusted by timeScale)
        const minDelay = 2 * 60 * 1000; // 2 minutes in milliseconds
        const maxDelay = 5 * 60 * 1000; // 5 minutes
        const timeScale = GameState.get().settings.timeScale;
        
        // Less delay for higher time scales to keep customer flow
        const delay = (Math.random() * (maxDelay - minDelay) + minDelay) / timeScale;
        
        // Schedule next customer
        const timer = setTimeout(() => {
            this.addCustomer();
            
            // Schedule next customer if there are more in the pool
            if (this.customerPool.length > 0) {
                this.scheduleNextCustomer();
            }
        }, delay);
        
        this.customerTimers.push(timer);
    },
    
    // Schedule extra customers during rush hour
    scheduleRushHourCustomers() {
        if (!this.isOpen || this.customerPool.length === 0) return;
        
        // Add 2-3 customers with short delays between them
        const count = Math.floor(Math.random() * 2) + 2; // 2-3 customers
        
        for (let i = 0; i < count; i++) {
            if (this.customerPool.length === 0) break;
            
            const timer = setTimeout(() => {
                this.addCustomer();
            }, i * 10000); // 10-second delay between each
            
            this.customerTimers.push(timer);
        }
    },
    
    // Add a customer to the shop
    addCustomer() {
        if (!this.isOpen || this.customerPool.length === 0) return;
        
        // Get a customer from the pool
        const customer = this.customerPool.shift();
        
        // Add to active customers
        this.activeCustomers.push(customer);
        
        // Create customer element in the shop
        this.createCustomerElement(customer);
        
        // Update daily stats
        this.dayStats.customers++;
        
        // Update shop UI
        const customerCountElement = document.getElementById('customerCount');
        if (customerCountElement) {
            customerCountElement.textContent = this.dayStats.customers;
        }
        
        // Schedule customer behavior
        this.simulateCustomerBehavior(customer);
        
        console.log(`Customer ${customer.name} entered the shop`);
    },
    
    // Create the visual representation of a customer in the shop
    createCustomerElement(customer) {
        const shopFloor = document.getElementById('shopFloor');
        if (!shopFloor) return;
        
        // Create customer element
        const customerElement = document.createElement('div');
        customerElement.classList.add('customer');
        customerElement.id = `customer-${customer.id}`;
        
        // Add customer appearance
        customerElement.innerHTML = `
            <div class="customer-avatar">
                <img src="${customer.image}" alt="${customer.name}">
            </div>
            <div class="customer-thought" id="thought-${customer.id}"></div>
        `;
        
        // Add to shop floor at random position
        const maxLeft = shopFloor.clientWidth - 60; // 60px is customer width
        customerElement.style.left = `${Math.random() * maxLeft}px`;
        
        shopFloor.appendChild(customerElement);
        
        // Add entrance animation
        customerElement.classList.add('entering');
        
        // Remove animation class after animation completes
        setTimeout(() => {
            customerElement.classList.remove('entering');
        }, 1000);
    },
    
    // Show customer's thought bubble
    showCustomerThought(customerId, thought, duration = 3000) {
        const thoughtBubble = document.getElementById(`thought-${customerId}`);
        if (!thoughtBubble) return;
        
        // Set thought content
        thoughtBubble.textContent = thought;
        thoughtBubble.classList.add('visible');
        
        // Hide after duration
        setTimeout(() => {
            thoughtBubble.classList.remove('visible');
        }, duration);
    },
    
    // Simulate customer behavior in the shop
    simulateCustomerBehavior(customer) {
        // Find items that match customer preferences
        const matchingItems = this.findMatchingItems(customer);
        
        // If no matching items, customer leaves disappointed
        if (matchingItems.length === 0) {
            this.showCustomerThought(customer.id, "Nothing interests me...");
            
            // Schedule departure
            setTimeout(() => {
                this.removeCustomer(customer.id);
            }, 5000);
            
            return;
        }
        
        // Customer is now browsing
        const browsingTime = Math.floor((30 + Math.random() * 30) * 1000); // 30-60 seconds
        
        // Show browsing thought
        setTimeout(() => {
            this.showCustomerThought(customer.id, "Let me see what they have...");
            
            // Move customer around the shop (could be enhanced with actual pathfinding)
            this.moveCustomerToShelf(customer.id);
        }, 2000);
        
        // After browsing, decide whether to buy
        setTimeout(() => {
            // Check if customer is still in shop
            if (!this.getCustomerById(customer.id)) return;
            
            // Determine if customer finds something they want to buy
            const interestedIndex = Math.floor(Math.random() * matchingItems.length);
            const interestedItem = matchingItems[interestedIndex];
            
            // Check if price is within budget (including generosity factor)
            const effectiveBudget = customer.budget * (1 + customer.generosity);
            
            if (interestedItem.price <= effectiveBudget) {
                // Customer decides to buy
                this.showCustomerThought(customer.id, `I'll take the ${interestedItem.name}!`);
                
                // Process purchase
                setTimeout(() => {
                    this.processPurchase(customer, interestedItem);
                }, 3000);
            } else {
                // Too expensive
                this.showCustomerThought(customer.id, "That's too expensive for me...");
                
                // Schedule departure
                setTimeout(() => {
                    this.removeCustomer(customer.id);
                }, 5000);
            }
        }, browsingTime);
    },
    
    // Find items in stock that match customer preferences
    findMatchingItems(customer) {
        const stock = GameState.get().stock;
        const matchingItems = [];
        
        // Loop through stock items
        for (const stockItem of stock) {
            // Get full item data
            const itemData = GameState.getItemById(stockItem.id);
            
            if (!itemData) continue;
            
            // Check category preference match
            const categoryMatch = customer.preferences.includes(itemData.category);
            
            // Check tag preference match (any tag matches)
            const tagMatch = customer.tagPreferences.some(tag => 
                itemData.tags.includes(tag)
            );
            
            // If either category or tags match, it's a potential purchase
            if (categoryMatch || tagMatch) {
                matchingItems.push({
                    id: stockItem.id,
                    name: itemData.name,
                    category: itemData.category,
                    price: stockItem.price,
                    basePrice: itemData.basePrice,
                    relevance: (categoryMatch ? 2 : 0) + (tagMatch ? 1 : 0) // Higher for better matches
                });
            }
        }
        
        // Sort by relevance (best matches first)
        matchingItems.sort((a, b) => b.relevance - a.relevance);
        
        return matchingItems;
    },
    
    // Move customer to a shelf (simple animation)
    moveCustomerToShelf(customerId) {
        const customerElement = document.getElementById(`customer-${customerId}`);
        if (!customerElement) return;
        
        const shopFloor = document.getElementById('shopFloor');
        if (!shopFloor) return;
        
        // Get random position near a shelf
        const targetX = Math.random() * (shopFloor.clientWidth - 60);
        const targetY = 20 + Math.random() * 40; // Keep near the shelves
        
        // Apply smooth transition
        customerElement.style.transition = 'left 2s, top 2s';
        customerElement.style.left = `${targetX}px`;
        customerElement.style.top = `${targetY}px`;
    },
    
    // Process a customer purchase
    processPurchase(customer, item) {
        // Check if customer is still in shop
        if (!this.getCustomerById(customer.id)) return;
        
        // Find the item in stock
        const stockItem = GameState.get().stock.find(i => i.id === item.id);
        if (!stockItem || stockItem.quantity <= 0) {
            // Item sold out
            this.showCustomerThought(customer.id, "Oh, it's sold out...");
            
            // Schedule departure
            setTimeout(() => {
                this.removeCustomer(customer.id);
            }, 5000);
            
            return;
        }
        
        // Process the sale
        const salePrice = stockItem.price;
        const profit = salePrice - item.basePrice;
        
        // Update stock
        stockItem.quantity -= 1;
        if (stockItem.quantity <= 0) {
            // Remove item from stock if quantity is 0
            const stockIndex = GameState.get().stock.findIndex(i => i.id === item.id);
            if (stockIndex !== -1) {
                GameState.get().stock.splice(stockIndex, 1);
            }
            
            // Trigger stock update event
            document.dispatchEvent(new Event('stockUpdated'));
        }
        
        // Add coins to player
        GameState.updateCoins(salePrice);
        
        // Update daily stats
        this.dayStats.sales++;
        this.dayStats.revenue += salePrice;
        this.dayStats.profit += profit;
        
        // Update shop UI
        const salesCountElement = document.getElementById('salesCount');
        if (salesCountElement) {
            salesCountElement.textContent = this.dayStats.sales;
        }
        
        const incomeCountElement = document.getElementById('incomeCount');
        if (incomeCountElement) {
            incomeCountElement.textContent = this.dayStats.revenue;
        }
        
        // Show sale notification
        UI.showNotification(`Sold ${item.name} for ${salePrice} coins!`, 'success');
        
        // Show customer leaving with purchase
        this.showCustomerThought(customer.id, "Thank you!");
        
        // Schedule customer departure
        setTimeout(() => {
            this.removeCustomer(customer.id);
        }, 5000);
        
        // Check if this was the player's first sale
        if (!GameState.get().flags.firstSale) {
            GameState.get().flags.firstSale = true;
            UI.showNotification('Congratulations on your first sale!', 'achievement');
        }
    },
    
    // Remove a customer from the shop
    removeCustomer(customerId) {
        // Find customer in active customers
        const index = this.activeCustomers.findIndex(c => c.id === customerId);
        if (index === -1) return;
        
        // Remove from active customers array
        this.activeCustomers.splice(index, 1);
        
        // Get customer element
        const customerElement = document.getElementById(`customer-${customerId}`);
        if (!customerElement) return;
        
        // Add leaving animation
        customerElement.classList.add('leaving');
        
        // Remove from DOM after animation
        setTimeout(() => {
            customerElement.remove();
        }, 1000);
    },
    
    // Get customer by ID
    getCustomerById(customerId) {
        return this.activeCustomers.find(c => c.id === customerId);
    },
    
    // Show day summary when closing shop
    showDaySummary() {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        
        modal.innerHTML = `
            <div class="modal-content day-summary">
                <div class="modal-header">
                    <h3>Day ${GameState.get().time.day} Summary</h3>
                </div>
                <div class="modal-body">
                    <div class="summary-stats">
                        <div class="stat-row">
                            <span>Customers:</span>
                            <span>${this.dayStats.customers}</span>
                        </div>
                        <div class="stat-row">
                            <span>Sales:</span>
                            <span>${this.dayStats.sales}</span>
                        </div>
                        <div class="stat-row">
                            <span>Revenue:</span>
                            <span>${this.dayStats.revenue} coins</span>
                        </div>
                        <div class="stat-row highlight">
                            <span>Profit:</span>
                            <span>${this.dayStats.profit} coins</span>
                        </div>
                    </div>
                    
                    <div class="reputation-change">
                        <p>Shop Reputation: ${GameState.get().player.reputation}/10</p>
                        <div class="reputation-meter">
                            <div class="reputation-fill" style="width: ${GameState.get().player.reputation * 10}%;"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="continue-btn">Continue</button>
                </div>
            </div>
        `;
        
        UI.elements.modalContainer.innerHTML = '';
        UI.elements.modalContainer.appendChild(modal);
        UI.elements.modalContainer.classList.add('active');
        
        // Add event listener to continue button
        const continueBtn = modal.querySelector('.continue-btn');
        continueBtn.addEventListener('click', () => {
            UI.closeModal();
            
            // Check if player reputation should change
            this.updateReputation();
            
            // Auto-save if enabled
            if (GameState.get().settings.autosave) {
                GameState.save();
            }
        });
    },
    
    // Update player reputation based on day performance
    updateReputation() {
        const currentReputation = GameState.get().player.reputation;
        let reputationChange = 0;
        
        // Calculate reputation change based on sales ratio and profit
        const salesRatio = this.dayStats.customers > 0 ? 
            this.dayStats.sales / this.dayStats.customers : 0;
        
        // Positive factors
        if (salesRatio > 0.7) reputationChange += 0.5; // Most customers bought something
        if (this.dayStats.sales > 5) reputationChange += 0.5; // Good number of sales
        if (this.dayStats.profit > 100) reputationChange += 0.5; // Good profit
        
        // Negative factors
        if (salesRatio < 0.3 && this.dayStats.customers > 3) reputationChange -= 0.5; // Few customers bought anything
        if (this.dayStats.sales === 0 && this.dayStats.customers > 0) reputationChange -= 1; // No sales despite customers
        
        // Apply change, capped between 1-10
        if (reputationChange !== 0) {
            const newReputation = Math.max(1, Math.min(10, currentReputation + reputationChange));
            GameState.get().player.reputation = newReputation;
            
            // Show notification if reputation changed
            if (newReputation > currentReputation) {
                UI.showNotification('Your shop reputation increased!', 'success');
            } else if (newReputation < currentReputation) {
                UI.showNotification('Your shop reputation decreased.', 'warning');
            }
            
            // Update reputation display
            const reputationDisplay = document.getElementById('reputationDisplay');
            if (reputationDisplay) {
                reputationDisplay.textContent = `${newReputation}/10`;
            }
        }
    },
    
    // Calculate and update shop attractiveness (affects customer generation)
    updateShopAttractiveness() {
        const gameState = GameState.get();
        
        // Base attractiveness is affected by:
        // 1. Number and variety of items
        // 2. Shop decorations
        // 3. Player reputation
        
        // Calculate variety bonus (unique categories)
        const categories = new Set();
        gameState.stock.forEach(item => {
            const itemData = GameState.getItemById(item.id);
            if (itemData) {
                categories.add(itemData.category);
            }
        });
        
        const categoryBonus = categories.size * 0.5; // +0.5 per unique category
        
        // Calculate decoration bonus
        let decorationBonus = 0;
        gameState.shop.decorations.forEach(decoration => {
            if (decoration.isActive) {
                decorationBonus += decoration.boostValue;
            }
        });
        
        // Calculate total attractiveness (reputation is already factored into customer generation)
        const totalAttractiveness = 1 + categoryBonus + decorationBonus;
        
        // Update max customers based on attractiveness
        gameState.shop.maxCustomers = Math.floor(8 * totalAttractiveness);
        
        console.log(`Shop attractiveness updated: ${totalAttractiveness.toFixed(2)}, max customers: ${gameState.shop.maxCustomers}`);
        
        return totalAttractiveness;
    },
    
    // Buy a decoration for the shop
    buyDecoration(decorId) {
        const gameState = GameState.get();
        const decoration = GameState.decorationOptions.find(d => d.id === decorId);
        
        if (!decoration) return false;
        
        // Check if already owned
        const existingDecor = gameState.shop.decorations.find(d => d.id === decorId);
        if (existingDecor) {
            // Already owned, just activate it
            this.applyDecoration(decorId);
            return true;
        }
        
        // Check if player has enough coins
        if (gameState.player.coins < decoration.price) {
            UI.showNotification(`Not enough coins to buy ${decoration.name}!`, 'error');
            return false;
        }
        
        // Add to shop decorations
        gameState.shop.decorations.push({
            id: decorId,
            name: decoration.name,
            category: decoration.category,
            image: decoration.image,
            boostType: decoration.boostType,
            boostValue: decoration.boostValue,
            isActive: true, // Activate by default
            position: { x: 100, y: 100 } // Default position
        });
        
        // Apply the decoration
        this.applyDecoration(decorId);
        
        // Update shop attractiveness
        this.updateShopAttractiveness();
        
        return true;
    },
    
    // Apply a decoration to the shop
    applyDecoration(decorId) {
        const gameState = GameState.get();
        
        // Find the decoration
        const decoration = gameState.shop.decorations.find(d => d.id === decorId);
        if (!decoration) return false;
        
        // Handle wallpaper specially (deactivate other wallpapers)
        if (decoration.category === 'Wallpaper') {
            // Deactivate all other wallpapers
            gameState.shop.decorations.forEach(d => {
                if (d.category === 'Wallpaper') {
                    d.isActive = false;
                }
            });
        }
        
        // Activate this decoration
        decoration.isActive = true;
        
        // Update shop appearance
        UI.updateShopAppearance();
        
        // Update shop attractiveness
        this.updateShopAttractiveness();
        
        return true;
    }
};

// Make Shop object available globally
window.Shop = Shop;

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    Shop.init();
});
