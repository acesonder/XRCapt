// Object Detection MR App - Staging App 1
// Detects cars, humans, animals, and landmarks with HUD bubbles

class ObjectDetectionApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.db = null;
        
        this.detectedObjects = new Map();
        this.objectHUDs = new Map();
        this.objectTypes = ['car', 'human', 'animal', 'landmark'];
        
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        
        this.init();
    }
    
    async init() {
        await this.initDatabase();
        this.setupUI();
        this.checkWebXRSupport();
    }
    
    // Database for temporary session storage
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ObjectDetectionDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('objects')) {
                    const objectStore = db.createObjectStore('objects', { keyPath: 'id' });
                    objectStore.createIndex('type', 'type', { unique: false });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }
    
    async clearDatabase() {
        if (!this.db) return;
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['objects'], 'readwrite');
            const objectStore = transaction.objectStore('objects');
            objectStore.clear();
            transaction.oncomplete = () => resolve();
        });
    }
    
    setupUI() {
        document.getElementById('startButton').addEventListener('click', () => this.startXR());
        document.getElementById('toggleObjects').addEventListener('click', () => this.toggleObjectList());
        document.getElementById('toggleDebug').addEventListener('click', () => this.toggleDebug());
        document.getElementById('exitButton').addEventListener('click', () => this.endXR());
        
        window.addEventListener('beforeunload', () => this.clearDatabase());
    }
    
    checkWebXRSupport() {
        if (!navigator.xr) {
            document.getElementById('statusText').textContent = '❌ WebXR not available';
            document.getElementById('startButton').disabled = true;
            return;
        }
        
        navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
            if (supported) {
                document.getElementById('statusText').textContent = '✅ Ready to start';
                document.getElementById('startButton').disabled = false;
            } else {
                document.getElementById('statusText').textContent = '❌ AR not supported';
                document.getElementById('startButton').disabled = true;
            }
        });
    }
    
    async startXR() {
        try {
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking', 'layers']
            });
            
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('controls').classList.add('active');
            document.getElementById('debugPanel').classList.add('active');
            
            this.setupThreeJS();
            await this.renderer.xr.setSession(this.xrSession);
            
            this.xrSession.addEventListener('end', () => this.onSessionEnd());
            this.renderer.setAnimationLoop((time, frame) => this.onXRFrame(time, frame));
            
            // Start object detection simulation
            this.startObjectDetection();
            
            document.getElementById('debugStatus').textContent = 'Active';
            
        } catch (error) {
            alert('Failed to start AR: ' + error.message);
            console.error(error);
        }
    }
    
    setupThreeJS() {
        const container = document.getElementById('container');
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        container.appendChild(this.renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(10, 10, 5);
        this.scene.add(directionalLight);
    }
    
    startObjectDetection() {
        // Simulate object detection (in production, use ML models like TensorFlow.js)
        setInterval(() => {
            if (this.xrSession && this.detectedObjects.size < 8) {
                if (Math.random() > 0.7) {
                    this.detectNewObject();
                }
            }
        }, 2000);
    }
    
    async detectNewObject() {
        const type = this.objectTypes[Math.floor(Math.random() * this.objectTypes.length)];
        const id = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Random position around user
        const angle = Math.random() * Math.PI * 2;
        const distance = 3 + Math.random() * 5;
        const position = {
            x: Math.cos(angle) * distance,
            y: 0.5 + Math.random() * 2,
            z: Math.sin(angle) * distance
        };
        
        const objectData = {
            id: id,
            type: type,
            name: this.getObjectName(type),
            timestamp: Date.now(),
            position: position,
            detectionCount: 1
        };
        
        // Save to temp database
        await this.saveObject(objectData);
        
        // Add to active objects
        this.detectedObjects.set(id, objectData);
        
        // Create HUD
        this.createObjectHUD(objectData);
        
        // Update UI
        this.updateObjectList();
        document.getElementById('debugDetected').textContent = this.detectedObjects.size;
        
        console.log('Detected:', objectData.name);
    }
    
    getObjectName(type) {
        const names = {
            car: ['Sedan', 'SUV', 'Truck', 'Motorcycle', 'Van'],
            human: ['Person', 'Individual', 'Pedestrian'],
            animal: ['Dog', 'Cat', 'Bird', 'Squirrel'],
            landmark: ['Building', 'Monument', 'Intersection', 'Bridge', 'Park']
        };
        const list = names[type] || ['Object'];
        return list[Math.floor(Math.random() * list.length)];
    }
    
    async saveObject(objectData) {
        if (!this.db) return;
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['objects'], 'readwrite');
            const objectStore = transaction.objectStore('objects');
            objectStore.put(objectData);
            transaction.oncomplete = () => resolve();
        });
    }
    
    createObjectHUD(objectData) {
        // Create HUD bubble
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Determine color by object type
        const colors = {
            car: '#ef4444',
            human: '#3b82f6',
            animal: '#10b981',
            landmark: '#f59e0b'
        };
        const color = colors[objectData.type] || '#6b7280';
        
        // Draw bubble
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        this.drawBubble(ctx, 0, 0, 512, 200);
        ctx.globalAlpha = 1.0;
        
        // Draw icon
        const icons = { car: '🚗', human: '👤', animal: '🐾', landmark: '🏛️' };
        ctx.font = '48px Arial';
        ctx.fillText(icons[objectData.type] || '📍', 20, 70);
        
        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(objectData.name, 90, 50);
        
        ctx.font = '24px Arial';
        ctx.fillText(`Type: ${objectData.type}`, 90, 85);
        ctx.fillText(`Detected: ${new Date(objectData.timestamp).toLocaleTimeString()}`, 90, 115);
        
        // Create sprite
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.set(objectData.position.x, objectData.position.y + 0.5, objectData.position.z);
        sprite.scale.set(1.2, 0.6, 1);
        sprite.userData = { objectId: id };
        
        this.scene.add(sprite);
        this.objectHUDs.set(objectData.id, sprite);
    }
    
    drawBubble(ctx, x, y, width, height) {
        const radius = 15;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }
    
    updateObjectList() {
        const listContent = document.getElementById('objectListContent');
        listContent.innerHTML = '';
        
        const objectsArray = Array.from(this.detectedObjects.values());
        objectsArray.sort((a, b) => b.timestamp - a.timestamp);
        
        objectsArray.forEach(obj => {
            const div = document.createElement('div');
            div.className = 'object-item';
            div.innerHTML = `
                <h4>${obj.name}</h4>
                <p>Type: ${obj.type}</p>
                <p>Time: ${new Date(obj.timestamp).toLocaleTimeString()}</p>
            `;
            listContent.appendChild(div);
        });
    }
    
    onXRFrame(time, frame) {
        if (!frame || !this.xrSession) return;
        
        const refSpace = this.renderer.xr.getReferenceSpace();
        if (!refSpace) return;
        
        const pose = frame.getViewerPose(refSpace);
        
        if (pose) {
            this.camera.position.copy(pose.transform.position);
            this.camera.quaternion.copy(pose.transform.orientation);
            
            // Make HUDs face camera
            this.objectHUDs.forEach(hud => {
                hud.lookAt(this.camera.position);
            });
        }
        
        // Update FPS
        this.frameCount++;
        if (time - this.lastFPSUpdate > 1000) {
            const fps = Math.round(this.frameCount * 1000 / (time - this.lastFPSUpdate));
            document.getElementById('debugFPS').textContent = fps;
            this.frameCount = 0;
            this.lastFPSUpdate = time;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    async endXR() {
        if (this.xrSession) {
            await this.xrSession.end();
        }
    }
    
    async onSessionEnd() {
        await this.clearDatabase();
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('controls').classList.remove('active');
        document.getElementById('objectList').classList.remove('active');
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
        }
        this.xrSession = null;
    }
    
    toggleObjectList() {
        document.getElementById('objectList').classList.toggle('active');
    }
    
    toggleDebug() {
        document.getElementById('debugPanel').classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.objectDetectionApp = new ObjectDetectionApp();
});
