// Complete MR Experience - Staging App 4
// Combines all features: object detection, photo gallery, statistics, HUD overlays

class CompleteMRApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.db = null;
        
        // Object tracking
        this.detectedObjects = new Map();
        this.objectHUDs = new Map();
        
        // Photo tracking
        this.photoFrames = new Map();
        this.photos = [];
        
        // Statistics
        this.stats = {
            objectsDetected: 0,
            photosCaptured: 0,
            sessionStart: 0,
            totalEncounters: 0
        };
        
        // Performance
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 0;
        
        this.init();
    }
    
    async init() {
        await this.initDatabase();
        this.setupUI();
        this.checkWebXRSupport();
    }
    
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('CompleteMRDB', 1);
            
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
                    objectStore.createIndex('lastSeen', 'lastSeen', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('photos')) {
                    const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
                    photoStore.createIndex('timestamp', 'timestamp', { unique: false });
                    photoStore.createIndex('objectId', 'objectId', { unique: false });
                }
            };
        });
    }
    
    async clearAllData() {
        if (!this.db) return;
        
        return Promise.all([
            new Promise(resolve => {
                const transaction = this.db.transaction(['objects'], 'readwrite');
                transaction.objectStore('objects').clear();
                transaction.oncomplete = () => resolve();
            }),
            new Promise(resolve => {
                const transaction = this.db.transaction(['photos'], 'readwrite');
                transaction.objectStore('photos').clear();
                transaction.oncomplete = () => resolve();
            })
        ]);
    }
    
    setupUI() {
        document.getElementById('startButton').addEventListener('click', () => this.startXR());
        document.getElementById('captureButton').addEventListener('click', () => this.capturePhoto());
        document.getElementById('dashboardButton').addEventListener('click', () => this.showDashboard());
        document.getElementById('closeButton').addEventListener('click', () => this.hideDashboard());
        document.getElementById('toggleStats').addEventListener('click', () => this.toggleStats());
        document.getElementById('exitButton').addEventListener('click', () => this.endXR());
        
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById(e.target.dataset.tab + 'Tab').classList.add('active');
            });
        });
        
        window.addEventListener('beforeunload', () => this.clearAllData());
    }
    
    checkWebXRSupport() {
        if (!navigator.xr) {
            document.getElementById('statusText').textContent = '❌ WebXR not available';
            document.getElementById('startButton').disabled = true;
            return;
        }
        
        navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
            if (supported) {
                document.getElementById('statusText').textContent = '✅ Ready to launch';
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
                optionalFeatures: ['hand-tracking', 'layers', 'dom-overlay'],
                domOverlay: { root: document.body }
            });
            
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('controls').classList.add('active');
            document.getElementById('statsOverlay').classList.add('active');
            
            this.setupThreeJS();
            await this.renderer.xr.setSession(this.xrSession);
            
            this.xrSession.addEventListener('end', () => this.onSessionEnd());
            this.renderer.setAnimationLoop((time, frame) => this.onXRFrame(time, frame));
            
            this.stats.sessionStart = Date.now();
            this.startObjectDetection();
            this.startStatisticsUpdates();
            
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
        setInterval(() => {
            if (this.xrSession && this.detectedObjects.size < 10) {
                if (Math.random() > 0.7) {
                    this.detectObject();
                }
            }
        }, 2500);
    }
    
    startStatisticsUpdates() {
        setInterval(() => {
            if (this.xrSession) {
                this.updateLiveStats();
            }
        }, 1000);
    }
    
    async detectObject() {
        const objectTypes = [
            { type: 'car', name: 'Car', icon: '🚗', color: '#ef4444' },
            { type: 'human', name: 'Person', icon: '👤', color: '#3b82f6' },
            { type: 'animal', name: 'Dog', icon: '🐕', color: '#10b981' },
            { type: 'landmark', name: 'Building', icon: '🏛️', color: '#f59e0b' }
        ];
        
        const objType = objectTypes[Math.floor(Math.random() * objectTypes.length)];
        const id = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Random position around user
        const angle = Math.random() * Math.PI * 2;
        const distance = 2.5 + Math.random() * 4;
        const position = {
            x: Math.cos(angle) * distance,
            y: 0.8 + Math.random() * 1.5,
            z: Math.sin(angle) * distance
        };
        
        const objectData = {
            id: id,
            type: objType.type,
            name: objType.name,
            customName: null,
            icon: objType.icon,
            color: objType.color,
            seenCount: 1,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            position: position,
            photos: []
        };
        
        // Save to database
        await this.saveObject(objectData);
        
        this.detectedObjects.set(id, objectData);
        this.createObjectHUD(objectData);
        
        this.stats.objectsDetected++;
        this.stats.totalEncounters++;
        
        console.log('Detected:', objectData.name);
    }
    
    async saveObject(objectData) {
        if (!this.db) return;
        return new Promise(resolve => {
            const transaction = this.db.transaction(['objects'], 'readwrite');
            transaction.objectStore('objects').put(objectData);
            transaction.oncomplete = () => resolve();
        });
    }
    
    async getAllObjects() {
        if (!this.db) return [];
        return new Promise(resolve => {
            const transaction = this.db.transaction(['objects'], 'readonly');
            const request = transaction.objectStore('objects').getAll();
            request.onsuccess = () => resolve(request.result || []);
        });
    }
    
    createObjectHUD(objectData) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        this.drawObjectHUD(ctx, objectData);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.set(objectData.position.x, objectData.position.y + 0.5, objectData.position.z);
        sprite.scale.set(1.4, 0.8, 1);
        sprite.userData = { objectId: objectData.id, canvas: canvas };
        
        this.scene.add(sprite);
        this.objectHUDs.set(objectData.id, sprite);
    }
    
    drawObjectHUD(ctx, objectData) {
        ctx.clearRect(0, 0, 512, 300);
        
        // Draw bubble
        ctx.fillStyle = objectData.color;
        ctx.globalAlpha = 0.92;
        this.drawBubble(ctx, 0, 0, 512, 260);
        ctx.globalAlpha = 1.0;
        
        // Draw icon and name
        ctx.font = '48px Arial';
        ctx.fillText(objectData.icon, 20, 65);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px Arial';
        const displayName = objectData.customName || objectData.name;
        ctx.fillText(displayName, 90, 55);
        
        // Draw stats
        ctx.font = '24px Arial';
        ctx.fillText(`👁️ Seen: ${objectData.seenCount} times`, 90, 95);
        ctx.fillText(`⏰ ${this.getTimeAgo(objectData.lastSeen)}`, 90, 130);
        
        // Draw photo count
        if (objectData.photos.length > 0) {
            ctx.font = '22px Arial';
            ctx.fillText(`📷 ${objectData.photos.length} photos saved`, 90, 165);
        }
        
        // Draw location
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffffee';
        ctx.fillText(`📍 (${objectData.position.x.toFixed(1)}, ${objectData.position.z.toFixed(1)})`, 20, 210);
    }
    
    drawBubble(ctx, x, y, width, height) {
        const radius = 18;
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
    
    async capturePhoto() {
        if (this.detectedObjects.size === 0) {
            alert('No objects detected to photograph!');
            return;
        }
        
        // Capture photo of nearest object
        const objectsArray = Array.from(this.detectedObjects.values());
        const nearest = objectsArray.reduce((prev, curr) => {
            const prevDist = Math.sqrt(prev.position.x ** 2 + prev.position.z ** 2);
            const currDist = Math.sqrt(curr.position.x ** 2 + curr.position.z ** 2);
            return currDist < prevDist ? curr : prev;
        });
        
        const photoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const photoData = {
            id: photoId,
            objectId: nearest.id,
            objectName: nearest.customName || nearest.name,
            timestamp: Date.now(),
            color: nearest.color
        };
        
        // Save photo
        if (this.db) {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            transaction.objectStore('photos').put(photoData);
        }
        
        // Update object with photo
        nearest.photos.push(photoData);
        await this.saveObject(nearest);
        
        this.stats.photosCaptured++;
        this.updateObjectHUD(nearest);
        
        alert(`📷 Photo captured of ${nearest.customName || nearest.name}!`);
    }
    
    updateObjectHUD(objectData) {
        const hud = this.objectHUDs.get(objectData.id);
        if (hud) {
            const ctx = hud.userData.canvas.getContext('2d');
            this.drawObjectHUD(ctx, objectData);
            hud.material.map.needsUpdate = true;
        }
    }
    
    async showDashboard() {
        document.getElementById('dashboard').classList.add('active');
        await this.updateDashboard();
    }
    
    hideDashboard() {
        document.getElementById('dashboard').classList.remove('active');
    }
    
    async updateDashboard() {
        // Update objects tab
        const objects = await this.getAllObjects();
        objects.sort((a, b) => b.lastSeen - a.lastSeen);
        
        const objectsList = document.getElementById('objectsList');
        objectsList.innerHTML = objects.length === 0 ? 
            '<p style="text-align: center; color: #888;">No objects detected yet</p>' : '';
        
        objects.forEach(obj => {
            const card = document.createElement('div');
            card.className = 'object-card';
            card.innerHTML = `
                <h3>${obj.icon} ${obj.customName || obj.name}</h3>
                <p>Type: ${obj.type}</p>
                <p>Seen: ${obj.seenCount} times</p>
                <p>Last seen: ${this.getTimeAgo(obj.lastSeen)}</p>
                <p>Photos: ${obj.photos.length}</p>
                <button onclick="window.completeMRApp.editObjectName('${obj.id}')">✏️ Rename</button>
                <button onclick="window.completeMRApp.viewObjectPhotos('${obj.id}')">📷 Photos</button>
            `;
            objectsList.appendChild(card);
        });
        
        // Update statistics tab
        const sessionTime = Math.floor((Date.now() - this.stats.sessionStart) / 1000);
        const statisticsContent = document.getElementById('statisticsContent');
        statisticsContent.innerHTML = `
            <div class="object-card">
                <h3>📊 Session Overview</h3>
                <p>Session Duration: ${this.formatDuration(sessionTime)}</p>
                <p>Objects Detected: ${this.stats.objectsDetected}</p>
                <p>Photos Captured: ${this.stats.photosCaptured}</p>
                <p>Total Encounters: ${this.stats.totalEncounters}</p>
                <p>Active HUDs: ${this.objectHUDs.size}</p>
            </div>
            <div class="object-card">
                <h3>📈 Performance Metrics</h3>
                <p>Average FPS: ${this.currentFPS}</p>
                <p>Detection Rate: ${sessionTime > 0 ? (this.stats.objectsDetected / (sessionTime / 60)).toFixed(1) : '0'} per min</p>
                <p>Photos per Object: ${this.stats.objectsDetected > 0 ? (this.stats.photosCaptured / this.stats.objectsDetected).toFixed(1) : '0'}</p>
            </div>
        `;
    }
    
    async editObjectName(objectId) {
        const obj = this.detectedObjects.get(objectId);
        if (!obj) return;
        
        const newName = prompt('Enter new name:', obj.customName || obj.name);
        if (newName && newName.trim()) {
            obj.customName = newName.trim();
            await this.saveObject(obj);
            this.updateObjectHUD(obj);
            await this.updateDashboard();
        }
    }
    
    async viewObjectPhotos(objectId) {
        const obj = this.detectedObjects.get(objectId);
        if (!obj || obj.photos.length === 0) {
            alert('No photos for this object');
            return;
        }
        
        alert(`${obj.photos.length} photos of ${obj.customName || obj.name}`);
    }
    
    updateLiveStats() {
        const sessionTime = Math.floor((Date.now() - this.stats.sessionStart) / 1000);
        document.getElementById('statObjects').textContent = this.stats.objectsDetected;
        document.getElementById('statPhotos').textContent = this.stats.photosCaptured;
        document.getElementById('statTime').textContent = this.formatDuration(sessionTime);
        document.getElementById('statHUDs').textContent = this.objectHUDs.size;
        document.getElementById('statFPS').textContent = this.currentFPS;
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${secs}s`;
        return `${secs}s`;
    }
    
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
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
            this.currentFPS = Math.round(this.frameCount * 1000 / (time - this.lastFPSUpdate));
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
        await this.clearAllData();
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('controls').classList.remove('active');
        document.getElementById('dashboard').classList.remove('active');
        document.getElementById('statsOverlay').classList.remove('active');
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
        }
        this.xrSession = null;
    }
    
    toggleStats() {
        document.getElementById('statsOverlay').classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.completeMRApp = new CompleteMRApp();
});
