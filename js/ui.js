/**
 * ui.js - User interface management for cozy shop game
 * Handles UI rendering, interactions, and animations
 */

// UI state management
const UI = {
    elements: {}, // Will store DOM element references
    activeTab: 'shop',
    isTransitioning: false,
    notifications: [],
    tooltips: [],
    draggedItem: null,
    
    // Initialize UI
    init() {
        this.createMainLayout();
        this.setupEventListeners();
        this.updateTimeDisplay();
        this.updateCoinsDisplay();
        
        // Show loading screen initially
        this.showLoadingScreen();
        
        // Register for game events
        document.addEventListener('coinsUpdated', () => this.updateCoinsDisplay());
        document.addEventListener('timeUpdated', () => this.updateTimeDisplay());
        document.addEventListener('inventoryUpdated', () => this.updateInventoryDisplay());
        document.addEventListener('stockUpdated', () => this.updateShopDisplay());
        document.addEventListener('notificationAdded', (e) => this.showNotification(e.detail.message, e.detail.type));
        
        console.log('UI initialized');
    },
    
    // Create the main game layout
    createMainLayout() {
        const gameContainer = document.getElementById('gameContainer');
        
        // Clear container first
        gameContainer.innerHTML = '';
        
        // Create header with shop info and controls
        const header = document.createElement('header');
        header.classList.add('game-header');
        header.innerHTML = `
            <div class="shop-info">
                <h1 id="shopName">${GameState.get().shop.name}</h1>
                <div class="shop-stats">
                    <div class="stat-coins">
                        <img src="assets/images/ui/coin.png" alt="Coins">
                        <span id="coinDisplay">${GameState.get().player.coins}</span>
                    </div>
                    <div class="stat-reputation">
                        <img src="assets/images/ui/star.png" alt="Reputation">
                        <span id="reputationDisplay">${GameState.get().player.reputation}/10</span>
                    </div>
                </div>
            </div>
            <div class="time-display">
                <div id="dayDisplay">Day ${GameState.get().time.day}</div>
                <div id="timeDisplay">${this.formatTime(GameState.get().time.hour, GameState.get().time.minute)}</div>
            </div>
            <div class="shop-controls">
                <button id="openShopBtn" class="action-button">Open Shop</button>
                <button id="menuBtn" class="icon-button">
                    <img src="assets/images/ui/menu.png" alt="Menu">
                </button>
            </div>
        `;
        gameContainer.appendChild(header);
        
        // Create navigation tabs
        const nav = document.createElement('nav');
        nav.classList.add('game-nav');
        nav.innerHTML = `
            <button data-tab="shop" class="nav-tab active">
                <img src="assets/images/ui/shop.png" alt="Shop">
                <span>Shop</span>
            </button>
            <button data-tab="inventory" class="nav-tab">
                <img src="assets/images/ui/inventory.png" alt="Inventory">
                <span>Inventory</span>
            </button>
            <button data-tab="catalog" class="nav-tab">
                <img src="assets/images/ui/catalog.png" alt="Catalog">
                <span>Catalog</span>
            </button>
            <button data-tab="decor" class="nav-tab">
                <img src="assets/images/ui/decor.png" alt="Decorate">
                <span>Decorate</span>
            </button>
        `;
        gameContainer.appendChild(nav);
        
        // Create main content area
        const mainContent = document.createElement('main');
        mainContent.classList.add('game-content');
        
        // Create shop view (default)
        const shopView = document.createElement('div');
        shopView.id = 'shopView';
        shopView.classList.add('content-view', 'active');
        
        // Create shop scene (where customers and items appear)
        const shopScene = document.createElement('div');
        shopScene.id = 'shopScene';
        shopScene.classList.add('shop-scene');
        shopScene.innerHTML = `
            <div class="shop-background"></div>
            <div class="shop-shelves" id="shopShelves"></div>
            <div class="shop-floor" id="shopFloor"></div>
            <div class="shop-counter">
                <img src="assets/images/shop/counter.png" alt="Counter">
                <div class="shopkeeper" id="shopkeeper"></div>
            </div>
        `;
        shopView.appendChild(shopScene);
        
        // Add shop dashboard (stats, orders, etc.)
        const shopDashboard = document.createElement('div');
        shopDashboard.classList.add('shop-dashboard');
        shopDashboard.innerHTML = `
            <div class="dashboard-section">
                <h3>Today's Stats</h3>
                <div class="stat-row">
                    <span>Customers:</span>
                    <span id="customerCount">0</span>
                </div>
                <div class="stat-row">
                    <span>Sales:</span>
                    <span id="salesCount">0</span>
                </div>
                <div class="stat-row">
                    <span>Income:</span>
                    <span id="incomeCount">0</span>
                </div>
            </div>
            <div class="dashboard-section">
                <h3>Active Orders</h3>
                <div id="activeOrders" class="orders-list">
                    <p class="empty-notice">No active orders</p>
                </div>
            </div>
        `;
        shopView.appendChild(shopDashboard);
        
        // Add other views (initially hidden)
        const inventoryView = document.createElement('div');
        inventoryView.id = 'inventoryView';
        inventoryView.classList.add('content-view');
        inventoryView.innerHTML = `
            <h2>Inventory</h2>
            <div class="inventory-controls">
                <select id="inventoryFilter">
                    <option value="all">All Items</option>
                    <option value="Toys">Toys</option>
                    <option value="Kitchenware">Kitchenware</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Home">Home</option>
                </select>
                <div class="search-container">
                    <input type="text" id="inventorySearch" placeholder="Search items...">
                </div>
            </div>
            <div id="inventoryGrid" class="inventory-grid"></div>
        `;
        
        const catalogView = document.createElement('div');
        catalogView.id = 'catalogView';
        catalogView.classList.add('content-view');
        catalogView.innerHTML = `
            <h2>Wholesale Catalog</h2>
            <p>Buy new items to sell in your shop!</p>
            <div class="catalog-controls">
                <select id="catalogFilter">
                    <option value="all">All Categories</option>
                    <option value="Toys">Toys</option>
                    <option value="Kitchenware">Kitchenware</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Home">Home</option>
                </select>
                <div class="search-container">
                    <input type="text" id="catalogSearch" placeholder="Search catalog...">
                </div>
            </div>
            <div id="catalogGrid" class="catalog-grid"></div>
        `;
        
        const decorView = document.createElement('div');
        decorView.id = 'decorView';
        decorView.classList.add('content-view');
        decorView.innerHTML = `
            <h2>Decorate Shop</h2>
            <p>Customize your shop to attract more customers!</p>
            <div class="decor-options">
                <div class="decor-category">
                    <h3>Wallpapers</h3>
                    <div id="wallpaperOptions" class="decor-grid"></div>
                </div>
                <div class="decor-category">
                    <h3>Furniture</h3>
                    <div id="furnitureOptions" class="decor-grid"></div>
                </div>
                <div class="decor-category">
                    <h3>Plants & Decor</h3>
                    <div id="plantOptions" class="decor-grid"></div>
                </div>
            </div>
        `;
        
        // Add all views to main content
        mainContent.appendChild(shopView);
        mainContent.appendChild(inventoryView);
        mainContent.appendChild(catalogView);
        mainContent.appendChild(decorView);
        
        gameContainer.appendChild(mainContent);
        
        // Create notification area
        const notificationArea = document.createElement('div');
        notificationArea.id = 'notificationArea';
        notificationArea.classList.add('notification-area');
        gameContainer.appendChild(notificationArea);
        
        // Create modal container for popups
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        modalContainer.classList.add('modal-container');
        gameContainer.appendChild(modalContainer);
        
        // Store references to DOM elements
        this.elements = {
            gameContainer,
            header,
            nav,
            mainContent,
            shopView,
            inventoryView,
            catalogView,
            decorView,
            shopScene,
            shopShelves: document.getElementById('shopShelves'),
            shopFloor: document.getElementById('shopFloor'),
            shopkeeper: document.getElementById('shopkeeper'),
            coinDisplay: document.getElementById('coinDisplay'),
            reputationDisplay: document.getElementById('reputationDisplay'),
            dayDisplay: document.getElementById('dayDisplay'),
            timeDisplay: document.getElementById('timeDisplay'),
            openShopBtn: document.getElementById('openShopBtn'),
            notificationArea,
            modalContainer,
            inventoryGrid: document.getElementById('inventoryGrid'),
            catalogGrid: document.getElementById('catalogGrid')
        };
    },
    
    // Set up event listeners for UI interactions
    setupEventListeners() {
        // Tab navigation
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
        
        // Open/close shop button
        if (this.elements.openShopBtn) {
            this.elements.openShopBtn.addEventListener('click', () => {
                const isOpen = GameState.get().shop.isOpen;
                if (isOpen) {
                    Shop.closeShop();
                    this.elements.openShopBtn.textContent = 'Open Shop';
                } else {
                    Shop.openShop();
                    this.elements.openShopBtn.textContent = 'Close Shop';
                }
            });
        }
        
        // Menu button
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }
    },
    
    // Switch between UI tabs
    switchTab(tabName) {
        if (this.activeTab === tabName || this.isTransitioning) return;
        
        // Mark active tab in navigation
        const tabs = document.querySelectorAll('.nav-tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Hide old view, show new view
        const oldView = document.getElementById(`${this.activeTab}View`);
        const newView = document.getElementById(`${tabName}View`);
        
        if (oldView && newView) {
            this.isTransitioning = true;
            
            // Fade out old view
            oldView.classList.add('fade-out');
            
            setTimeout(() => {
                oldView.classList.remove('active', 'fade-out');
                
                // Update content for the new view before showing it
                this.updateViewContent(tabName);
                
                // Fade in new view
                newView.classList.add('active', 'fade-in');
                
                setTimeout(() => {
                    newView.classList.remove('fade-in');
                    this.isTransitioning = false;
                }, 300);
            }, 300);
        }
        
        this.activeTab = tabName;
    },
    
    // Update the content of a view before showing it
    updateViewContent(viewName) {
        switch (viewName) {
            case 'inventory':
                this.updateInventoryDisplay();
                break;
            case 'catalog':
                this.updateCatalogDisplay();
                break;
            case 'decor':
                this.updateDecorationDisplay();
                break;
            case 'shop':
                this.updateShopDisplay();
                break;
        }
    },
    
    // Update inventory display
    updateInventoryDisplay() {
        const inventoryGrid = document.getElementById('inventoryGrid');
        if (!inventoryGrid) return;
        
        // Clear existing items
        inventoryGrid.innerHTML = '';
        
        // Get filter value
        const filter = document.getElementById('inventoryFilter');
        const filterValue = filter ? filter.value : 'all';
        
        // Get search value
        const search = document.getElementById('inventorySearch');
        const searchValue = search ? search.value.toLowerCase() : '';
        
        // Get inventory items
        const inventory = GameState.get().inventory;
        
        if (inventory.length === 0) {
            // Show empty inventory message
            inventoryGrid.innerHTML = '<p class="empty-notice">Your inventory is empty. Visit the catalog to buy items!</p>';
            return;
        }
        
        // Filter and display items
        inventory.forEach(item => {
            // Get full item data
            const itemData = GameState.getItemById(item.id);
            
            // Apply filters
            if (filterValue !== 'all' && itemData.category !== filterValue) return;
            if (searchValue && !itemData.name.toLowerCase().includes(searchValue)) return;
            
            // Create item element
            const itemElement = document.createElement('div');
            itemElement.classList.add('inventory-item');
            itemElement.setAttribute('data-item-id', item.id);
            
            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${itemData.image}" alt="${itemData.name}">
                    <div class="item-quantity">${item.quantity}</div>
                </div>
                <div class="item-details">
                    <div class="item-name">${itemData.name}</div>
                    <div class="item-price">${item.price} coins</div>
                </div>
                <div class="item-actions">
                    <button class="display-btn" data-item-id="${item.id}">Display</button>
                </div>
            `;
            
            inventoryGrid.appendChild(itemElement);
            
            // Add event listener for displaying item
            const displayBtn = itemElement.querySelector('.display-btn');
            displayBtn.addEventListener('click', () => {
                this.showDisplayItemModal(item.id);
            });
        });
    },
    
    // Update catalog display
    updateCatalogDisplay() {
        const catalogGrid = document.getElementById('catalogGrid');
        if (!catalogGrid) return;
        
        // Clear existing items
        catalogGrid.innerHTML = '';
        
        // Get filter value
        const filter = document.getElementById('catalogFilter');
        const filterValue = filter ? filter.value : 'all';
        
        // Get search value
        const search = document.getElementById('catalogSearch');
        const searchValue = search ? search.value.toLowerCase() : '';
        
        // Get catalog items (filter to show only unlocked items)
        const catalog = GameState.itemCatalog.filter(item => item.unlocked);
        
        // Filter and display items
        catalog.forEach(item => {
            // Apply filters
            if (filterValue !== 'all' && item.category !== filterValue) return;
            if (searchValue && !item.name.toLowerCase().includes(searchValue)) return;
            
            // Create item element
            const itemElement = document.createElement('div');
            itemElement.classList.add('catalog-item');
            
            // Check if player has enough coins
            const canAfford = GameState.get().player.coins >= item.basePrice;
            
            if (!canAfford) {
                itemElement.classList.add('cannot-afford');
            }
            
            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-category">${item.category}</div>
                    <div class="item-description">${item.description}</div>
                    <div class="item-price">${item.basePrice} coins</div>
                </div>
                <div class="item-actions">
                    <button class="buy-btn" data-item-id="${item.id}" ${!canAfford ? 'disabled' : ''}>
                        Buy
                    </button>
                </div>
            `;
            
            catalogGrid.appendChild(itemElement);
            
            // Add event listener for buying item
            const buyBtn = itemElement.querySelector('.buy-btn');
            buyBtn.addEventListener('click', () => {
                this.showBuyItemModal(item.id);
            });
        });
    },
    
    // Update decoration display
    updateDecorationDisplay() {
        // Implement decoration display
        const wallpaperOptions = document.getElementById('wallpaperOptions');
        const furnitureOptions = document.getElementById('furnitureOptions');
        const plantOptions = document.getElementById('plantOptions');
        
        if (!wallpaperOptions || !furnitureOptions || !plantOptions) return;
        
        // Clear existing options
        wallpaperOptions.innerHTML = '';
        furnitureOptions.innerHTML = '';
        plantOptions.innerHTML = '';
        
        // Get decoration options
        const decorations = GameState.decorationOptions.filter(item => item.unlocked);
        
        // Filter and display decorations by category
        decorations.forEach(decor => {
            const decorElement = document.createElement('div');
            decorElement.classList.add('decor-item');
            
            // Check if player has enough coins
            const canAfford = GameState.get().player.coins >= decor.price;
            
            if (!canAfford) {
                decorElement.classList.add('cannot-afford');
            }
            
            // Check if already purchased
            const isPurchased = GameState.get().shop.decorations.some(d => d.id === decor.id);
            
            decorElement.innerHTML = `
                <div class="decor-image">
                    <img src="${decor.image}" alt="${decor.name}">
                </div>
                <div class="decor-details">
                    <div class="decor-name">${decor.name}</div>
                    <div class="decor-boost">+${decor.boostValue * 100}% ${decor.boostType}</div>
                    <div class="decor-price">${isPurchased ? 'Owned' : `${decor.price} coins`}</div>
                </div>
                <div class="decor-actions">
                    ${isPurchased ? 
                        `<button class="use-btn" data-decor-id="${decor.id}">Use</button>` : 
                        `<button class="buy-btn" data-decor-id="${decor.id}" ${!canAfford ? 'disabled' : ''}>Buy</button>`
                    }
                </div>
            `;
            
            // Add to appropriate category
            if (decor.category === 'Wallpaper') {
                wallpaperOptions.appendChild(decorElement);
            } else if (decor.category === 'Furniture') {
                furnitureOptions.appendChild(decorElement);
            } else {
                plantOptions.appendChild(decorElement);
            }
            
            // Add event listeners
            if (isPurchased) {
                const useBtn = decorElement.querySelector('.use-btn');
                useBtn.addEventListener('click', () => {
                    // Apply decoration
                    Shop.applyDecoration(decor.id);
                });
            } else {
                const buyBtn = decorElement.querySelector('.buy-btn');
                buyBtn.addEventListener('click', () => {
                    // Buy decoration
                    this.showBuyDecorationModal(decor.id);
                });
            }
        });
    },
    
    // Update shop display
    updateShopDisplay() {
        const shopShelves = this.elements.shopShelves;
        if (!shopShelves) return;
        
        // Clear existing items on shelves
        shopShelves.innerHTML = '';
        
        // Get shop stock
        const stock = GameState.get().stock;
        
        // Display items on shelves
        stock.forEach(item => {
            // Get full item data
            const itemData = GameState.getItemById(item.id);
            
            // Create item element
            const itemElement = document.createElement('div');
            itemElement.classList.add('shelf-item');
            itemElement.setAttribute('data-item-id', item.id);
            
            // Set position if available
            if (item.displayPosition) {
                itemElement.style.left = `${item.displayPosition.x}px`;
                itemElement.style.top = `${item.displayPosition.y}px`;
            }
            
            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${itemData.image}" alt="${itemData.name}">
                    <div class="item-quantity">${item.quantity}</div>
                </div>
                <div class="item-price-tag">${item.price} coins</div>
            `;
            
            shopShelves.appendChild(itemElement);
            
            // Make item draggable within the shelves
            this.makeElementDraggable(itemElement, shopShelves);
            
            // Add click event to show item details
            itemElement.addEventListener('click', (e) => {
                // Only show details if not dragging
                if (!this.isDragging) {
                    this.showItemDetailsModal(item.id);
                }
                e.stopPropagation();
            });
        });
        
        // Update shop appearance based on decorations
        this.updateShopAppearance();
    },
    
    // Update shop appearance based on applied decorations
    updateShopAppearance() {
        const shop = GameState.get().shop;
        const background = document.querySelector('.shop-background');
        
        if (!background) return;
        
        // Apply wallpaper if set
        const wallpaper = shop.decorations.find(d => d.category === 'Wallpaper' && d.isActive);
        
        if (wallpaper) {
            background.style.backgroundImage = `url(${wallpaper.image})`;
        } else {
            // Default wallpaper
            background.style.backgroundImage = 'url(assets/images/shop/default_wallpaper.png)';
        }
        
        // Apply other decorations
        shop.decorations.forEach(decor => {
            if (decor.category !== 'Wallpaper' && decor.isActive) {
                // Check if element already exists
                let decorElement = document.getElementById(`decor-${decor.id}`);
                
                if (!decorElement) {
                    decorElement = document.createElement('div');
                    decorElement.id = `decor-${decor.id}`;
                    decorElement.classList.add('shop-decoration');
                    decorElement.style.backgroundImage = `url(${decor.image})`;
                    
                    // Set position if available
                    if (decor.position) {
                        decorElement.style.left = `${decor.position.x}px`;
                        decorElement.style.top = `${decor.position.y}px`;
                    }
                    
                    this.elements.shopScene.appendChild(decorElement);
                    
                    // Make decoration draggable
                    this.makeElementDraggable(decorElement, this.elements.shopScene);
                }
            }
        });
    },
    
    // Make an element draggable within a container
    makeElementDraggable(element, container) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        element.onmousedown = dragMouseDown;
        
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            
            // Get the mouse cursor position at startup
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Set flag to prevent click events during drag
            UI.isDragging = true;
            element.classList.add('dragging');
            
            // Mark this as the dragged item
            UI.draggedItem = element;
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            
            // Calculate the new cursor position
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Set the element's new position
            const newTop = (element.offsetTop - pos2);
            const newLeft = (element.offsetLeft - pos1);
            
            // Keep element within container bounds
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            const minLeft = 0;
            const maxLeft = containerRect.width - elementRect.width;
            const minTop = 0;
            const maxTop = containerRect.height - elementRect.height;
            
            element.style.top = `${Math.max(minTop, Math.min(maxTop, newTop))}px`;
            element.style.left = `${Math.max(minLeft, Math.min(maxLeft, newLeft))}px`;
        }
        
        function closeDragElement() {
            // Stop moving when mouse button is released
            document.onmouseup = null;
            document.onmousemove = null;
            
            // Save the new position
            if (element.hasAttribute('data-item-id')) {
                const itemId = element.getAttribute('data-item-id');
                const stockItem = GameState.get().stock.find(item => item.id === itemId);
                
                if (stockItem) {
                    stockItem.displayPosition = {
                        x: parseInt(element.style.left),
                        y: parseInt(element.style.top)
                    };
                }
            } else if (element.id.startsWith('decor-')) {
                const decorId = element.id.replace('decor-', '');
                const decoration = GameState.get().shop.decorations.find(d => d.id === decorId);
                
                if (decoration) {
                    decoration.position = {
                        x: parseInt(element.style.left),
                        y: parseInt(element.style.top)
                    };
                }
            }
            
            // Clear dragging flags after a short delay (to prevent immediate click)
            setTimeout(() => {
                UI.isDragging = false;
                element.classList.remove('dragging');
                UI.draggedItem = null;
            }, 100);
        }
    },
    
    // Show modal to display an item from inventory to shop
    showDisplayItemModal(itemId) {
        const item = GameState.getItemById(itemId);
        const inventoryItem = GameState.get().inventory.find(i => i.id === itemId);
        
        if (!item || !inventoryItem) return;
        
        const modal = document.createElement('div');
        modal.classList.add('modal');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Display Item</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="item-preview">
                        <img src="${item.image}" alt="${item.name}">
                        <h4>${item.name}</h4>
                    </div>
                    <div class="form-group">
                        <label for="displayQuantity">Quantity:</label>
                        <input type="number" id="displayQuantity" min="1" max="${inventoryItem.quantity}" value="1">
                    </div>
                    <div class="form-group">
                        <label for="displayPrice">Selling Price:</label>
                        <input type="number" id="displayPrice" min="${Math.floor(item.basePrice * 0.5)}" value="${Math.floor(item.basePrice * 1.5)}">
                        <p class="price-suggestion">
                            Suggested: ${Math.floor(item.basePrice * 1.5)} coins (50% markup)<br>
                            Base cost: ${item.basePrice} coins
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Display Item</button>
                </div>
            </div>
        `;
        
        this.elements.modalContainer.innerHTML = '';
        this.elements.modalContainer.appendChild(modal);
        this.elements.modalContainer.classList.add('active');
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        confirmBtn.addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('displayQuantity').value);
            const price = parseInt(document.getElementById('displayPrice').value);
            
            if (quantity > 0 && quantity <= inventoryItem.quantity && price >= 0) {
                // Display item in shop
                GameState.displayItem(itemId, quantity, price);
                this.closeModal();
                this.showNotification(`Added ${quantity} ${item.name} to your shop!`, 'success');
            } else {
                this.showNotification('Please enter valid quantity and price.', 'error');
            }
        });
    },
    
    // Show modal to buy an item from catalog
    showBuyItemModal(itemId) {
        const item = GameState.itemCatalog.find(i => i.id === itemId);
        
        if (!item) return;
        
        // Check if player has enough coins
        if (GameState.get().player.coins < item.basePrice) {
            this.showNotification(`Not enough coins to buy ${item.name}!`, 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.classList.add('modal');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Buy Item</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="item-preview">
                        <img src="${item.image}" alt="${item.name}">
                        <h4>${item.name}</h4>
                    </div>
                    <div class="item-details">
                        <p>${item.description}</p>
                        <p class="item-category">Category: ${item.category}</p>
                        <p class="item-popularity">Popularity: ${this.formatPopularity(item.popularity)}</p>
                    </div>
                    <div class="form-group">
                        <label for="buyQuantity">Quantity:</label>
                        <input type="number" id="buyQuantity" min="1" value="1">
                        <p class="total-price">
                            Total cost: <span id="totalCost">${item.basePrice}</span> coins<br>
                            Your coins: ${GameState.get().player.coins} coins
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Buy Item</button>
                </div>
            </div>
        `;
        
        this.elements.modalContainer.innerHTML = '';
        this.elements.modalContainer.appendChild(modal);
        this.elements.modalContainer.classList.add('active');
        
        // Update total cost when quantity changes
        const quantityInput = document.getElementById('buyQuantity');
        const totalCostElement = document.getElementById('totalCost');
        
        quantityInput.addEventListener('input', () => {
            const quantity = parseInt(quantityInput.value) || 0;
            const totalCost = quantity * item.basePrice;
            totalCostElement.textContent = totalCost;
            
            // Disable confirm button if not enough coins
            const confirmBtn = modal.querySelector('.confirm-btn');
            if (totalCost > GameState.get().player.coins) {
                confirmBtn.disabled = true;
                confirmBtn.classList.add('disabled');
            } else {
                confirmBtn.disabled = false;
                confirmBtn.classList.remove('disabled');
            }
        });
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        confirmBtn.addEventListener('click', () => {
            const quantity = parseInt(quantityInput.value) || 0;
            const totalCost = quantity * item.basePrice;
            
            if (quantity > 0 && totalCost <= GameState.get().player.coins) {
                // Buy items
                GameState.updateCoins(-totalCost);
                GameState.addItem(item.id, quantity);
                this.closeModal();
                this.showNotification(`Purchased ${quantity} ${item.name}!`, 'success');
                
                // Update inventory display if on inventory tab
                if (this.activeTab === 'inventory') {
                    this.updateInventoryDisplay();
                }
            } else {
                this.showNotification('Please enter a valid quantity or check your coins.', 'error');
            }
        });
    },
    
    // Show modal to buy a decoration
    showBuyDecorationModal(decorId) {
        const decor = GameState.decorationOptions.find(d => d.id === decorId);
        
        if (!decor) return;
        
        // Check if player has enough coins
        if (GameState.get().player.coins < decor.price) {
            this.showNotification(`Not enough coins to buy ${decor.name}!`, 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.classList.add('modal');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Buy Decoration</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="item-preview">
                        <img src="${decor.image}" alt="${decor.name}">
                        <h4>${decor.name}</h4>
                    </div>
                    <div class="item-details">
                        <p class="item-boost">Boost: +${decor.boostValue * 100}% ${decor.boostType}</p>
                        <p class="item-price">Price: ${decor.price} coins</p>
                        <p class="your-coins">Your coins: ${GameState.get().player.coins} coins</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Buy & Apply</button>
                </div>
            </div>
        `;
        
        this.elements.modalContainer.innerHTML = '';
        this.elements.modalContainer.appendChild(modal);
        this.elements.modalContainer.classList.add('active');
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        confirmBtn.addEventListener('click', () => {
            // Buy and apply decoration
            if (GameState.get().player.coins >= decor.price) {
                GameState.updateCoins(-decor.price);
                Shop.buyDecoration(decor.id);
                this.closeModal();
                this.showNotification(`Purchased and applied ${decor.name}!`, 'success');
            } else {
                this.showNotification('Not enough coins!', 'error');
            }
        });
    },
    
    // Show modal with item details in shop view
    showItemDetailsModal(itemId) {
        const stockItem = GameState.get().stock.find(item => item.id === itemId);
        const itemData = GameState.getItemById(itemId);
        
        if (!stockItem || !itemData) return;
        
        const modal = document.createElement('div');
        modal.classList.add('modal');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Item Details</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="item-preview">
                        <img src="${itemData.image}" alt="${itemData.name}">
                        <h4>${itemData.name}</h4>
                    </div>
                    <div class="item-details">
                        <p>${itemData.description}</p>
                        <p class="item-category">Category: ${itemData.category}</p>
                        <p class="item-stats">
                            Quantity: ${stockItem.quantity}<br>
                            Selling Price: ${stockItem.price} coins<br>
                            Base Cost: ${itemData.basePrice} coins<br>
                            Profit Margin: ${stockItem.price - itemData.basePrice} coins (${Math.round((stockItem.price - itemData.basePrice) / itemData.basePrice * 100)}%)
                        </p>
                    </div>
                    <div class="form-group">
                        <label for="newPrice">Change Price:</label>
                        <input type="number" id="newPrice" min="1" value="${stockItem.price}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="remove-btn">Remove from Shop</button>
                    <button class="update-btn">Update Price</button>
                    <button class="close-modal-btn">Close</button>
                </div>
            </div>
        `;
        
        this.elements.modalContainer.innerHTML = '';
        this.elements.modalContainer.appendChild(modal);
        this.elements.modalContainer.classList.add('active');
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const closeModalBtn = modal.querySelector('.close-modal-btn');
        const removeBtn = modal.querySelector('.remove-btn');
        const updateBtn = modal.querySelector('.update-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        closeModalBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        removeBtn.addEventListener('click', () => {
            // Show confirmation before removing
            if (confirm(`Are you sure you want to remove ${itemData.name} from display?`)) {
                GameState.undisplayItem(itemId, stockItem.quantity);
                this.closeModal();
                this.showNotification(`Removed ${itemData.name} from shop display.`, 'info');
            }
        });
        
        updateBtn.addEventListener('click', () => {
            const newPrice = parseInt(document.getElementById('newPrice').value);
            
            if (newPrice > 0) {
                // Update price in stock
                stockItem.price = newPrice;
                
                // Update UI
                this.updateShopDisplay();
                this.closeModal();
                this.showNotification(`Updated price of ${itemData.name} to ${newPrice} coins.`, 'success');
            } else {
                this.showNotification('Please enter a valid price.', 'error');
            }
        });
    },
    
    // Close any open modal
      closeModal() {
    this.elements.modalContainer.classList.remove('active');
    
    // Clear content immediately to avoid DOM issues
    this.elements.modalContainer.innerHTML = '';
    
    // Reset any stuck state
    document.body.classList.remove('modal-open');
    
    console.log("Modal closed and cleared");
}
    
    // Show a notification message
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.classList.add('notification', `notification-${type}`);
        notification.innerHTML = `
            <div class="notification-icon"></div>
            <div class="notification-message">${message}</div>
        `;
        
        this.elements.notificationArea.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            
            // Remove from DOM after animation
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },
    
    // Show game menu
    showMenu() {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Game Menu</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body menu-body">
                    <button id="saveGameBtn" class="menu-btn">Save Game</button>
                    <button id="loadGameBtn" class="menu-btn">Load Game</button>
                    <button id="settingsBtn" class="menu-btn">Settings</button>
                    <button id="helpBtn" class="menu-btn">Help / Tutorial</button>
                    <button id="resetGameBtn" class="menu-btn warning">Reset Game</button>
                </div>
            </div>
        `;
        
        this.elements.modalContainer.innerHTML = '';
        this.elements.modalContainer.appendChild(modal);
        this.elements.modalContainer.classList.add('active');
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const saveGameBtn = document.getElementById('saveGameBtn');
        const loadGameBtn = document.getElementById('loadGameBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const helpBtn = document.getElementById('helpBtn');
        const resetGameBtn = document.getElementById('resetGameBtn');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        saveGameBtn.addEventListener('click', () => {
            if (GameState.save()) {
                this.showNotification('Game saved successfully!', 'success');
            } else {
                this.showNotification('Failed to save game.', 'error');
            }
            this.closeModal();
        });
        
        loadGameBtn.addEventListener('click', () => {
            if (confirm('Load saved game? Any unsaved progress will be lost.')) {
                if (GameState.load()) {
                    this.showNotification('Game loaded successfully!', 'success');
                    // Refresh UI
                    this.updateTimeDisplay();
                    this.updateCoinsDisplay();
                    this.updateShopDisplay();
                } else {
                    this.showNotification('No saved game found or failed to load.', 'error');
                }
                this.closeModal();
            }
        });
        
        settingsBtn.addEventListener('click', () => {
            this.closeModal();
            this.showSettings();
        });
        
        helpBtn.addEventListener('click', () => {
            this.closeModal();
            this.showTutorial();
        });
        
        resetGameBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the game? ALL PROGRESS WILL BE LOST!')) {
                if (GameState.reset()) {
                    this.showNotification('Game reset successfully!', 'success');
                    // Refresh UI
                    this.updateTimeDisplay();
                    this.updateCoinsDisplay();
                    this.updateShopDisplay();
                } else {
                    this.showNotification('Failed to reset game.', 'error');
                }
                this.closeModal();
            }
        });
    },
    
    // Show settings menu
    showSettings() {
        const settings = GameState.get().settings;
        
        const modal = document.createElement('div');
        modal.classList.add('modal');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Settings</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-group">
                        <label for="musicVolume">Music Volume:</label>
                        <input type="range" id="musicVolume" min="0" max="1" step="0.1" value="${settings.musicVolume}">
                        <span id="musicVolumeValue">${Math.round(settings.musicVolume * 100)}%</span>
                    </div>
                    <div class="settings-group">
                        <label for="soundVolume">Sound Effects Volume:</label>
                        <input type="range" id="soundVolume" min="0" max="1" step="0.1" value="${settings.soundVolume}">
                        <span id="soundVolumeValue">${Math.round(settings.soundVolume * 100)}%</span>
                    </div>
                    <div class="settings-group">
                        <label for="timeScale">Game Speed:</label>
                        <input type="range" id="timeScale" min="0.5" max="2" step="0.1" value="${settings.timeScale}">
                        <span id="timeScaleValue">${settings.timeScale}x</span>
                    </div>
                    <div class="settings-group checkbox">
                        <input type="checkbox" id="autosave" ${settings.autosave ? 'checked' : ''}>
                        <label for="autosave">Auto-save game</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="cancel-btn">Cancel</button>
                    <button class="save-btn">Save Changes</button>
                </div>
            </div>
        `;
        
        this.elements.modalContainer.innerHTML = '';
        this.elements.modalContainer.appendChild(modal);
        this.elements.modalContainer.classList.add('active');
        
        // Update values when sliders change
        const musicVolume = document.getElementById('musicVolume');
        const soundVolume = document.getElementById('soundVolume');
        const timeScale = document.getElementById('timeScale');
        
        musicVolume.addEventListener('input', () => {
            document.getElementById('musicVolumeValue').textContent = `${Math.round(musicVolume.value * 100)}%`;
        });
        
        soundVolume.addEventListener('input', () => {
            document.getElementById('soundVolumeValue').textContent = `${Math.round(soundVolume.value * 100)}%`;
        });
        
        timeScale.addEventListener('input', () => {
            document.getElementById('timeScaleValue').textContent = `${timeScale.value}x`;
        });
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        const saveBtn = modal.querySelector('.save-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        cancelBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        saveBtn.addEventListener('click', () => {
            // Save settings
            GameState.get().settings.musicVolume = parseFloat(musicVolume.value);
            GameState.get().settings.soundVolume = parseFloat(soundVolume.value);
            GameState.get().settings.timeScale = parseFloat(timeScale.value);
            GameState.get().settings.autosave = document.getElementById('autosave').checked;
            
            // Apply settings
            // (Audio and game speed would be implemented in respective modules)
            
            GameState.save();
            this.closeModal();
            this.showNotification('Settings saved!', 'success');
        });
    },
    
    // Show tutorial
    showTutorial() {
        // Get current tutorial step
        const tutorial = GameState.get().tutorial;
        const currentStep = tutorial.currentStep;
        const stepName = tutorial.steps[currentStep];
        
        let title, content;
        
        // Set content based on step
        switch (stepName) {
            case 'welcome':
                title = 'Welcome to Your Cozy Shop!';
                content = `
                    <p>Welcome to your very own shop! This tutorial will guide you through the basics of running your business.</p>
                    <p>As a shop owner, you'll buy items, display them in your shop, and sell them to customers for a profit.</p>
                `;
                break;
            case 'inventory':
                title = 'Managing Your Inventory';
                content = `
                    <p>Click the Inventory tab to see what items you have available.</p>
                    <p>Visit the Catalog tab to buy new items from wholesalers. Remember to buy at a good price!</p>
                    <p>From your inventory, you can choose which items to display in your shop.</p>
                `;
                break;
            case 'customers':
                title = 'Dealing with Customers';
                content = `
                    <p>When your shop is open, customers will visit throughout the day.</p>
                    <p>Different customers have different preferences and budgets.</p>
                    <p>Price your items strategically to maximize profits while keeping customers happy!</p>
                `;
                break;
            case 'sales':
                title = 'Making Sales';
                content = `
                    <p>Customers will browse your shop and may purchase items they like.</p>
                    <p>Each sale earns you coins and a bit of reputation.</p>
                    <p>The more satisfied your customers are, the better your reputation will become!</p>
                `;
                break;
            case 'closing':
                title = 'Day End & Shop Management';
                content = `
                    <p>At the end of the day, close your shop to see a summary of your sales.</p>
                    <p>Use your earnings to restock inventory and decorate your shop.</p>
                    <p>Better decorations will attract more customers!</p>
                `;
                break;
            default:
                title = 'Tutorial Complete!';
                content = `
                    <p>Congratulations! You now know the basics of running your shop.</p>
                    <p>Continue to grow your business, unlock new items, and become the coziest shop in town!</p>
                `;
        }
        
        const modal = document.createElement('div');
        modal.classList.add('modal', 'tutorial-modal');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body tutorial-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${currentStep > 0 ? '<button class="prev-btn">Previous</button>' : ''}
                    ${currentStep < tutorial.steps.length - 1 ? '<button class="next-btn">Next</button>' : ''}
                    <button class="finish-btn">Finish Tutorial</button>
                </div>
            </div>
        `;
        
        this.elements.modalContainer.innerHTML = '';
        this.elements.modalContainer.appendChild(modal);
        this.elements.modalContainer.classList.add('active');
        
        // Add event listeners
        const closeBtn = modal.querySelector('.close-btn');
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');
        const finishBtn = modal.querySelector('.finish-btn');
        
        closeBtn.addEventListener('click', () => {
            this.closeModal();
        });
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                // Go to previous step
                if (currentStep > 0) {
                    GameState.get().tutorial.currentStep = currentStep - 1;
                    this.closeModal();
                    this.showTutorial();
                }
            });
        }
        
      if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        // Go to next step
        if (currentStep < tutorial.steps.length - 1) {
            // Store new step in temporary variable (don't update gameState yet)
            const nextStep = currentStep + 1;
            
            // First completely close the current modal
            this.closeModal();
            
            // Then wait for animation to complete before showing next screen
            setTimeout(() => {
                // Now update the gameState with the new step
                GameState.get().tutorial.currentStep = nextStep;
                // And show the new tutorial screen
                this.showTutorial();
            }, 500); // Increase timeout to ensure modal is fully closed
        }
    });
}
        
        finishBtn.addEventListener('click', () => {
            // Complete tutorial
            GameState.get().tutorial.completed = true;
            this.closeModal();
            this.showNotification('Tutorial completed!', 'success');
        });
    },
    
    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    },
    
    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    },
    
    // Update coins display
    updateCoinsDisplay() {
        const coinDisplay = document.getElementById('coinDisplay');
        if (coinDisplay) {
            coinDisplay.textContent = GameState.get().player.coins;
        }
    },
    
    // Update time display
    updateTimeDisplay() {
        const timeDisplay = document.getElementById('timeDisplay');
        const dayDisplay = document.getElementById('dayDisplay');
        
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(GameState.get().time.hour, GameState.get().time.minute);
        }
        
        if (dayDisplay) {
            dayDisplay.textContent = `Day ${GameState.get().time.day}`;
        }
    },
    
    // Format time as HH:MM
    formatTime(hour, minute) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        const amPm = hour >= 12 ? 'PM' : 'AM';
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${amPm}`;
    },
    
    // Format popularity rating as stars
    formatPopularity(popularity) {
        const stars = Math.round(popularity * 5);
        let result = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < stars) {
                result += '★'; // Filled star
            } else {
                result += '☆'; // Empty star
            }
        }
        
        return result;
    }
};

// Make UI available globally
window.UI = UI;

// Initialize UI when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    
    // Hide loading screen after a short delay
    setTimeout(() => {
        UI.hideLoadingScreen();
    }, 1000);
});
