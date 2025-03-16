/**
 * storeView.js - 3D Store Visualization Module with Three.js
 * Creates an interactive 3D view of the shop that can be customized
 */

// StoreView object to manage the 3D visualization
const StoreView = {
    // Three.js components
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // Store objects
    storeItems: {},
    storeFurniture: {},
    storeWalls: {},
    storeFloor: null,
    
    // Raycaster for interaction
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    
    // Animation
    clock: new THREE.Clock(),
    mixer: null,
    animations: {},
    
    // State
    isInitialized: false,
    selectedObject: null,
    isDragging: false,
    
    // Initialize the 3D view
    init(containerId) {
        console.log('Initializing 3D Store View...');
        
        if (!THREE) {
            console.error('Three.js not loaded!');
            return false;
        }
        
        // Get container element
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container element #${containerId} not found!`);
            return false;
        }
        
        // Set up scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf8f8f8);
        
        // Set up camera
        const width = container.clientWidth;
        const height = container.clientHeight;
        const aspectRatio = width / height;
        this.camera = new THREE.PerspectiveCamera(60, aspectRatio, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);
        
        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Set up orbit controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI / 2;
        
        // Create basic store layout
        this.createStore();
        
        // Set up lights
        this.setupLights();
        
        // Set up event listeners
        this.setupEventListeners(container);
        
        // Start animation loop
        this.animate();
        
        this.isInitialized = true;
        console.log('3D Store View initialized');
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        return true;
    },
    
    // Create the basic store layout
    createStore() {
        // Create floor
        const floorGeometry = new THREE.PlaneGeometry(20, 15);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xe8e0d0,
            roughness: 0.8,
            metalness: 0.2
        });
        this.storeFloor = new THREE.Mesh(floorGeometry, floorMaterial);
        this.storeFloor.rotation.x = -Math.PI / 2;
        this.storeFloor.receiveShadow = true;
        this.scene.add(this.storeFloor);
        
        // Create walls
        this.createWalls();
        
        // Add some default furniture
        this.addDefaultFurniture();
    },
    
    // Create store walls
    createWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            roughness: 0.9,
            metalness: 0.1
        });
        
        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(20, 8);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, 4, -7.5);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.scene.add(backWall);
        this.storeWalls.backWall = backWall;
        
        // Left wall
        const leftWallGeometry = new THREE.PlaneGeometry(15, 8);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-10, 4, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        this.storeWalls.leftWall = leftWall;
        
        // Right wall
        const rightWallGeometry = new THREE.PlaneGeometry(15, 8);
        const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
        rightWall.position.set(10, 4, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
        this.storeWalls.rightWall = rightWall;
    },
    
    // Add default furniture to the store
    addDefaultFurniture() {
        // Add counter
        this.addCounter();
        
        // Add shelves
        this.addShelves();
    },
    
    // Add a counter to the store
    addCounter() {
        // Create counter geometry
        const counterWidth = 6;
        const counterHeight = 1;
        const counterDepth = 2;
        
        const counterGeometry = new THREE.BoxGeometry(counterWidth, counterHeight, counterDepth);
        const counterMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xb97a57, // Wood color
            roughness: 0.7,
            metalness: 0.2
        });
        
        const counter = new THREE.Mesh(counterGeometry, counterMaterial);
        counter.position.set(0, counterHeight/2, 5);
        counter.castShadow = true;
        counter.receiveShadow = true;
        counter.userData = { type: 'furniture', name: 'Counter', isDraggable: true };
        
        this.scene.add(counter);
        this.storeFurniture.counter = counter;
        
        // Add counter top
        const topGeometry = new THREE.BoxGeometry(counterWidth, 0.1, counterDepth);
        const topMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xd8c0a8, // Lighter wood color
            roughness: 0.5,
            metalness: 0.3
        });
        
        const counterTop = new THREE.Mesh(topGeometry, topMaterial);
        counterTop.position.set(0, counterHeight + 0.05, 0);
        counter.add(counterTop);
    },
    
    // Add shelves to the store
    addShelves() {
        // Create shelf material
        const shelfMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xa67c52, // Wood color
            roughness: 0.7,
            metalness: 0.2
        });
        
        // Create shelves on the back wall
        for (let i = 0; i < 3; i++) {
            const shelfGeometry = new THREE.BoxGeometry(8, 0.2, 1);
            const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            
            shelf.position.set(-4, 2 + i * 2, -7);
            shelf.castShadow = true;
            shelf.receiveShadow = true;
            shelf.userData = { 
                type: 'furniture', 
                name: `Shelf ${i+1}`, 
                isDraggable: true 
            };
            
            this.scene.add(shelf);
            this.storeFurniture[`shelf_${i+1}`] = shelf;
        }
        
        // Create shelves on the left wall
        for (let i = 0; i < 3; i++) {
            const shelfGeometry = new THREE.BoxGeometry(1, 0.2, 6);
            const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            
            shelf.position.set(-9.5, 2 + i * 2, -3);
            shelf.castShadow = true;
            shelf.receiveShadow = true;
            shelf.userData = { 
                type: 'furniture', 
                name: `Side Shelf ${i+1}`, 
                isDraggable: true 
            };
            
            this.scene.add(shelf);
            this.storeFurniture[`side_shelf_${i+1}`] = shelf;
        }
    },
    
    // Set up lights in the scene
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        
        // Configure shadow properties
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 30;
        mainLight.shadow.camera.left = -15;
        mainLight.shadow.camera.right = 15;
        mainLight.shadow.camera.top = 15;
        mainLight.shadow.camera.bottom = -15;
        
        this.scene.add(mainLight);
        
        // Add some point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0xfff8e0, 0.6, 8);
        pointLight1.position.set(0, 6, 0);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xfff8e0, 0.4, 6);
        pointLight2.position.set(-5, 4, 2);
        this.scene.add(pointLight2);
    },
    
    // Set up event listeners for interaction
    setupEventListeners(container) {
        // Mouse move for hover effects
        container.addEventListener('mousemove', (event) => {
            // Calculate mouse position in normalized device coordinates
            // (-1 to +1) for both components
            const rect = container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
            
            this.checkIntersection();
        });
        
        // Mouse down for selecting objects
        container.addEventListener('mousedown', () => {
            if (this.intersectedObject) {
                this.selectedObject = this.intersectedObject;
                
                if (this.selectedObject.userData && this.selectedObject.userData.isDraggable) {
                    this.isDragging = true;
                    this.controls.enabled = false;
                }
                
                // Dispatch select event
                const selectEvent = new CustomEvent('storeViewSelect', {
                    detail: {
                        object: this.selectedObject,
                        userData: this.selectedObject.userData
                    }
                });
                document.dispatchEvent(selectEvent);
            }
        });
        
        // Mouse up for releasing objects
        container.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.controls.enabled = true;
                
                // Dispatch position change event
                if (this.selectedObject) {
                    const positionEvent = new CustomEvent('storeViewPositionChange', {
                        detail: {
                            object: this.selectedObject,
                            position: this.selectedObject.position.clone(),
                            userData: this.selectedObject.userData
                        }
                    });
                    document.dispatchEvent(positionEvent);
                }
            }
            
            this.selectedObject = null;
        });
    },
    
    // Check for object intersection (hovering)
    checkIntersection() {
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        // Reset previously intersected object
        if (this.intersectedObject) {
            this.intersectedObject.material.emissive.setHex(this.intersectedObject.currentHex);
            this.intersectedObject = null;
        }
        
        // Set new intersected object
        if (intersects.length > 0) {
            const object = intersects[0].object;
            
            // Skip objects that aren't interactive
            if (!object.userData || !object.userData.type) {
                return;
            }
            
            // Store reference to intersected object
            this.intersectedObject = object;
            this.intersectedObject.currentHex = this.intersectedObject.material.emissive.getHex();
            this.intersectedObject.material.emissive.setHex(0x555555);
            
            // Show cursor as pointer for interactive objects
            document.body.style.cursor = 'pointer';
        } else {
            // Reset cursor
            document.body.style.cursor = 'auto';
        }
    },
    
    // Add a product item to the store
    addProduct(id, name, position, options = {}) {
        // Default options
        const config = {
            color: options.color || 0xf0f0f0,
            size: options.size || { width: 0.5, height: 0.5, depth: 0.5 },
            model: options.model || null
        };
        
        let product;
        
        // Use 3D model if provided
        if (config.model) {
            // Load model code would go here
            // For now, use a placeholder box
            product = this.createProductBox(config);
        } else {
            // Create simple box representation
            product = this.createProductBox(config);
        }
        
        // Set product position
        if (position) {
            product.position.copy(position);
        } else {
            // Default position on counter
            product.position.set(0, 1.5, 5);
        }
        
        // Add product metadata
        product.userData = {
            type: 'product',
            id: id,
            name: name,
            isDraggable: true
        };
        
        // Add to scene and store
        this.scene.add(product);
        this.storeItems[id] = product;
        
        return product;
    },
    
    // Create a simple box to represent a product
    createProductBox(config) {
        const { width, height, depth } = config.size;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const box = new THREE.Mesh(geometry, material);
        box.castShadow = true;
        box.receiveShadow = true;
        
        return box;
    },
    
    // Change wall color/texture
    changeWallColor(wallKey, color) {
        const wall = this.storeWalls[wallKey];
        if (!wall) return false;
        
        if (wall.material) {
            wall.material.color.set(color);
        }
        
        return true;
    },
    
    // Change floor color/texture
    changeFloorColor(color) {
        if (this.storeFloor && this.storeFloor.material) {
            this.storeFloor.material.color.set(color);
            return true;
        }
        return false;
    },
    
    // Add decoration to the store
    addDecoration(id, name, position, options = {}) {
        // Similar to addProduct but for decorative items
        const config = {
            color: options.color || 0xf0f0f0,
            size: options.size || { width: 0.5, height: 0.5, depth: 0.5 },
            model: options.model || null
        };
        
        let decoration;
        
        if (config.model) {
            // Load model code would go here
            decoration = this.createDecorationBox(config);
        } else {
            decoration = this.createDecorationBox(config);
        }
        
        // Set decoration position
        if (position) {
            decoration.position.copy(position);
        } else {
            // Default position on a wall
            decoration.position.set(0, 4, -7.4);
        }
        
        // Add decoration metadata
        decoration.userData = {
            type: 'decoration',
            id: id,
            name: name,
            isDraggable: true
        };
        
        // Add to scene and store
        this.scene.add(decoration);
        this.storeFurniture[id] = decoration;
        
        return decoration;
    },
    
    // Create a simple representation for a decoration
    createDecorationBox(config) {
        const { width, height, depth } = config.size;
        
        // For decorations, create something more interesting than a box
        // For a picture frame, for example
        if (config.type === 'picture') {
            return this.createPictureFrame(config);
        }
        
        // Default to simple box
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            roughness: 0.7,
            metalness: 0.3
        });
        
        const box = new THREE.Mesh(geometry, material);
        box.castShadow = true;
        box.receiveShadow = true;
        
        return box;
    },
    
    // Create a picture frame decoration
    createPictureFrame(config) {
        const { width, height } = config.size;
        const depth = 0.05;
        
        // Create frame group
        const frame = new THREE.Group();
        
        // Create canvas with image
        const frameGeometry = new THREE.BoxGeometry(width, height, depth);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513, // Brown frame
            roughness: 0.8,
            metalness: 0.2
        });
        
        const frameBox = new THREE.Mesh(frameGeometry, frameMaterial);
        frameBox.castShadow = true;
        frame.add(frameBox);
        
        // Create picture inside frame
        const pictureGeometry = new THREE.PlaneGeometry(width * 0.9, height * 0.9);
        const pictureMaterial = new THREE.MeshBasicMaterial({
            color: config.color || 0xffffff
        });
        
        const picture = new THREE.Mesh(pictureGeometry, pictureMaterial);
        picture.position.z = depth / 2 + 0.01;
        frame.add(picture);
        
        return frame;
    },
    
    // Handle window resize
    onWindowResize() {
        if (!this.isInitialized) return;
        
        const container = this.renderer.domElement.parentElement;
        if (!container) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    },
    
    // Animation loop
    animate() {
        if (!this.isInitialized) return;
        
        requestAnimationFrame(() => this.animate());
        
        // Update controls
        this.controls.update();
        
        // Update any animations
        const delta = this.clock.getDelta();
        if (this.mixer) {
            this.mixer.update(delta);
        }
        
        // Handle dragging objects
        this.handleDragging();
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    },
    
    // Handle dragging objects in the scene
    handleDragging() {
        if (!this.isDragging || !this.selectedObject) return;
        
        // Calculate new position based on mouse and camera
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // For dragging on a horizontal plane (the floor)
        const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        
        this.raycaster.ray.intersectPlane(dragPlane, intersectPoint);
        
        // Set new position, but keep y position constant for furniture
        if (this.selectedObject.userData.type === 'furniture') {
            const originalY = this.selectedObject.position.y;
            this.selectedObject.position.x = intersectPoint.x;
            this.selectedObject.position.z = intersectPoint.z;
            this.selectedObject.position.y = originalY;
        } else {
            this.selectedObject.position.copy(intersectPoint);
            // Add a small offset for items to sit on surfaces
            this.selectedObject.position.y = Math.max(this.selectedObject.geometry.parameters.height / 2, 0.5);
        }
    },
    
    // Clear the entire store
    clearStore() {
        // Remove all items and furniture
        Object.values(this.storeItems).forEach(item => {
            this.scene.remove(item);
        });
        
        Object.values(this.storeFurniture).forEach(furniture => {
            this.scene.remove(furniture);
        });
        
        // Reset collections
        this.storeItems = {};
        this.storeFurniture = {};
        
        // Recreate basic elements
        this.createStore();
    },
    
    // Save the current store layout
    saveStoreLayout() {
        const layout = {
            walls: {},
            floor: {},
            furniture: {},
            items: {}
        };
        
        // Save wall properties
        Object.keys(this.storeWalls).forEach(key => {
            const wall = this.storeWalls[key];
            layout.walls[key] = {
                color: wall.material ? '#' + wall.material.color.getHexString() : '#ffffff',
                position: {
                    x: wall.position.x,
                    y: wall.position.y,
                    z: wall.position.z
                }
            };
        });
        
        // Save floor properties
        if (this.storeFloor) {
            layout.floor = {
                color: this.storeFloor.material ? '#' + this.storeFloor.material.color.getHexString() : '#e8e0d0'
            };
        }
        
        // Save furniture positions
        Object.keys(this.storeFurniture).forEach(key => {
            const furniture = this.storeFurniture[key];
            layout.furniture[key] = {
                id: key,
                name: furniture.userData.name || key,
                position: {
                    x: furniture.position.x,
                    y: furniture.position.y,
                    z: furniture.position.z
                }
            };
        });
        
        // Save item positions
        Object.keys(this.storeItems).forEach(key => {
            const item = this.storeItems[key];
            layout.items[key] = {
                id: key,
                name: item.userData.name || key,
                position: {
                    x: item.position.x,
                    y: item.position.y,
                    z: item.position.z
                }
            };
        });
        
        return layout;
    },
    
    // Load a store layout
    loadStoreLayout(layout) {
        // Clear current store
        this.clearStore();
        
        // Set wall colors
        if (layout.walls) {
            Object.keys(layout.walls).forEach(key => {
                if (this.storeWalls[key] && layout.walls[key].color) {
                    this.changeWallColor(key, layout.walls[key].color);
                }
            });
        }
        
        // Set floor color
        if (layout.floor && layout.floor.color) {
            this.changeFloorColor(layout.floor.color);
        }
        
        // Add furniture
        if (layout.furniture) {
            Object.keys(layout.furniture).forEach(key => {
                const furnitureData = layout.furniture[key];
                
                // Check if it's a standard furniture item we have a method for
                if (key.includes('shelf')) {
                    // We'll let the default furniture generation handle this
                    // and then move it to the right position later
                } else if (key === 'counter') {
                    // Counter will be added by default and moved to position later
                } else {
                    // Custom furniture - add it
                    this.addDecoration(
                        furnitureData.id,
                        furnitureData.name,
                        new THREE.Vector3(
                            furnitureData.position.x,
                            furnitureData.position.y,
                            furnitureData.position.z
                        )
                    );
                }
            });
            
            // Now update positions of standard furniture that was auto-created
            Object.keys(this.storeFurniture).forEach(key => {
                if (layout.furniture[key] && layout.furniture[key].position) {
                    const pos = layout.furniture[key].position;
                    this.storeFurniture[key].position.set(pos.x, pos.y, pos.z);
                }
            });
        }
        
        // Add items
        if (layout.items) {
            Object.keys(layout.items).forEach(key => {
                const itemData = layout.items[key];
                
                this.addProduct(
                    itemData.id,
                    itemData.name,
                    new THREE.Vector3(
                        itemData.position.x,
                        itemData.position.y,
                        itemData.position.z
                    )
                );
            });
        }
        
        return true;
    }
};

// Make StoreView available globally
window.StoreView = StoreView;
