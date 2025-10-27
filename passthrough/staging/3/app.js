// Object Statistics Tracker - Staging App 3
// Tracks object statistics: encounter count, last seen, location, editable names

class ObjectStatsApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.db = null;
        
        this.trackedObjects = new Map();
        this.objectHUDs = new Map();
        this.statistics = {
            totalEncounters: 0,
            uniqueObjects: 0,
            sessionDuration: 0,
            startTime: 0
        };
        
        this.init();
    }
    
    async init() {
        await this.initDatabase();
        this.setupUI();
        this.checkWebXRSupport();
    }
    
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ObjectStatsDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('objects')) {
                    const objectStore = db.createObjectStore('objects', { keyPath: 'id' });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('seenCount', 'seenCount', { unique: false });
                    objectStore.createIndex('lastSeen', 'lastSeen', { unique: false });
                }
            };
        });
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
    
    async getObject(id) {
        if (!this.db) return null;
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['objects'], 'readonly');
            const objectStore = transaction.objectStore('objects');
            const request = objectStore.get(id);
            request.onsuccess = () => resolve(request.result);
        });
    }
    
    async getAllObjects() {
        if (!this.db) return [];
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['objects'], 'readonly');
            const objectStore = transaction.objectStore('objects');
            const request = objectStore.getAll();
            request.onsuccess = () => resolve(request.result || []);
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
        document.getElementById('toggleStats').addEventListener('click', () => this.toggleStats());
        document.getElementById('toggleDetails').addEventListener('click', () => this.toggleDetails());
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
            document.getElementById('statsPanel').classList.add('active');
            
            this.setupThreeJS();
            await this.renderer.xr.setSession(this.xrSession);
            
            this.xrSession.addEventListener('end', () => this.onSessionEnd());
            this.renderer.setAnimationLoop((time, frame) => this.onXRFrame(time, frame));
            
            this.statistics.startTime = Date.now();
            this.startObjectTracking();
            
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
    
    startObjectTracking() {
        // Simulate object detection and tracking
        setInterval(() => {
            if (this.xrSession && this.trackedObjects.size < 6) {
                if (Math.random() > 0.75) {
                    this.trackNewObject();
                }
            }
        }, 3000);
        
        // Update statistics every second
        setInterval(() => {
            if (this.xrSession) {
                this.updateStatistics();
            }
        }, 1000);
    }
    
    async trackNewObject() {
        const objectTypes = ['Car', 'Person', 'Dog', 'Building', 'Tree', 'Bicycle'];
        const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];
        
        // Random position
        const angle = Math.random() * Math.PI * 2;
        const distance = 3 + Math.random() * 4;
        const position = {
            x: Math.cos(angle) * distance,
            y: 1 + Math.random() * 1.5,
            z: Math.sin(angle) * distance
        };
        
        // Check if similar object exists
        const existing = await this.findExistingObject(type, position);
        
        if (existing) {
            // Update existing object
            existing.seenCount++;
            existing.lastSeen = Date.now();
            existing.locations.push({
                timestamp: Date.now(),
                position: position
            });
            await this.saveObject(existing);
            
            this.trackedObjects.set(existing.id, existing);
            this.updateObjectHUD(existing);
            this.statistics.totalEncounters++;
        } else {
            // Create new object
            const id = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const objectData = {
                id: id,
                name: type,
                customName: null,
                type: type,
                seenCount: 1,
                firstSeen: Date.now(),
                lastSeen: Date.now(),
                locations: [{
                    timestamp: Date.now(),
                    position: position
                }]
            };
            
            await this.saveObject(objectData);
            this.trackedObjects.set(id, objectData);
            this.createObjectHUD(objectData);
            
            this.statistics.totalEncounters++;
            this.statistics.uniqueObjects++;
        }
        
        this.updateDetailsPanel();
    }
    
    async findExistingObject(type, position) {
        const objects = await this.getAllObjects();
        const recentObjects = objects.filter(obj => 
            obj.type === type && 
            (Date.now() - obj.lastSeen) < 3600000 // Within 1 hour
        );
        
        for (const obj of recentObjects) {
            const lastLoc = obj.locations[obj.locations.length - 1];
            const dist = Math.sqrt(
                Math.pow(position.x - lastLoc.position.x, 2) +
                Math.pow(position.z - lastLoc.position.z, 2)
            );
            
            if (dist < 3.0) { // Within 3 meters
                return obj;
            }
        }
        
        return null;
    }
    
    createObjectHUD(objectData) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        
        this.drawObjectStats(ctx, objectData);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        
        const lastLoc = objectData.locations[objectData.locations.length - 1];
        sprite.position.set(lastLoc.position.x, lastLoc.position.y + 0.5, lastLoc.position.z);
        sprite.scale.set(1.3, 0.8, 1);
        sprite.userData = { objectId: objectData.id, canvas: canvas };
        
        this.scene.add(sprite);
        this.objectHUDs.set(objectData.id, sprite);
    }
    
    drawObjectStats(ctx, objectData) {
        // Clear canvas
        ctx.clearRect(0, 0, 512, 320);
        
        // Draw bubble background
        ctx.fillStyle = '#f59e0b';
        ctx.globalAlpha = 0.95;
        this.drawBubble(ctx, 0, 0, 512, 280);
        ctx.globalAlpha = 1.0;
        
        // Draw object name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        const displayName = objectData.customName || objectData.name;
        ctx.fillText(displayName, 20, 50);
        
        // Draw statistics
        ctx.font = '24px Arial';
        ctx.fillText(`👁️ Seen: ${objectData.seenCount} times`, 20, 95);
        
        const lastSeenTime = this.getTimeAgo(objectData.lastSeen);
        ctx.fillText(`⏰ Last seen: ${lastSeenTime}`, 20, 130);
        
        const firstSeenDate = new Date(objectData.firstSeen).toLocaleDateString();
        ctx.fillText(`📅 First: ${firstSeenDate}`, 20, 165);
        
        const lastLoc = objectData.locations[objectData.locations.length - 1];
        ctx.font = '20px Arial';
        ctx.fillText(`📍 Location: (${lastLoc.position.x.toFixed(1)}, ${lastLoc.position.z.toFixed(1)})`, 20, 205);
        
        // Draw edit hint
        ctx.font = 'italic 18px Arial';
        ctx.fillStyle = '#ffffee';
        ctx.fillText('✏️ Edit name in Object Details panel', 20, 250);
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
    
    updateObjectHUD(objectData) {
        const hud = this.objectHUDs.get(objectData.id);
        if (hud) {
            const ctx = hud.userData.canvas.getContext('2d');
            this.drawObjectStats(ctx, objectData);
            hud.material.map.needsUpdate = true;
        }
    }
    
    updateStatistics() {
        this.statistics.sessionDuration = Math.floor((Date.now() - this.statistics.startTime) / 1000);
        
        const statsContent = document.getElementById('statsContent');
        statsContent.innerHTML = `
            <div class="stat-item">
                <h5>📊 Session Overview</h5>
                <p>Duration: ${this.formatDuration(this.statistics.sessionDuration)}</p>
                <p>Total Encounters: ${this.statistics.totalEncounters}</p>
                <p>Unique Objects: ${this.statistics.uniqueObjects}</p>
                <p>Currently Tracking: ${this.trackedObjects.size}</p>
            </div>
            <div class="stat-item">
                <h5>📈 Average Stats</h5>
                <p>Encounters per Object: ${this.statistics.uniqueObjects > 0 ? 
                    (this.statistics.totalEncounters / this.statistics.uniqueObjects).toFixed(1) : '0'}</p>
                <p>Detection Rate: ${this.statistics.sessionDuration > 0 ? 
                    (this.statistics.totalEncounters / (this.statistics.sessionDuration / 60)).toFixed(1) : '0'} per min</p>
            </div>
        `;
    }
    
    async updateDetailsPanel() {
        const objects = await this.getAllObjects();
        objects.sort((a, b) => b.lastSeen - a.lastSeen);
        
        const detailsContent = document.getElementById('detailsContent');
        detailsContent.innerHTML = '';
        
        objects.forEach(obj => {
            const div = document.createElement('div');
            div.className = 'detail-item';
            div.innerHTML = `
                <h4>${obj.customName || obj.name}</h4>
                <p>Type: ${obj.type}</p>
                <p>Seen: ${obj.seenCount} times</p>
                <p>Last seen: ${this.getTimeAgo(obj.lastSeen)}</p>
                <p>First seen: ${new Date(obj.firstSeen).toLocaleDateString()}</p>
                <button class="edit-button" onclick="window.objectStatsApp.editObjectName('${obj.id}')">✏️ Edit Name</button>
            `;
            detailsContent.appendChild(div);
        });
    }
    
    async editObjectName(objectId) {
        const obj = await this.getObject(objectId);
        if (!obj) return;
        
        const newName = prompt('Enter new name:', obj.customName || obj.name);
        if (newName && newName.trim()) {
            obj.customName = newName.trim();
            await this.saveObject(obj);
            
            // Update HUD if object is currently tracked
            if (this.trackedObjects.has(objectId)) {
                this.trackedObjects.set(objectId, obj);
                this.updateObjectHUD(obj);
            }
            
            this.updateDetailsPanel();
        }
    }
    
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
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
        document.getElementById('statsPanel').classList.remove('active');
        document.getElementById('objectDetails').classList.remove('active');
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
        }
        this.xrSession = null;
    }
    
    toggleStats() {
        document.getElementById('statsPanel').classList.toggle('active');
    }
    
    toggleDetails() {
        document.getElementById('objectDetails').classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.objectStatsApp = new ObjectStatsApp();
});
