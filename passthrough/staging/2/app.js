// Photo Gallery MR App - Staging App 2
// Displays photos in HUD bubbles with sliding frame feature

class PhotoGalleryApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.db = null;
        
        this.photoFrames = new Map();
        this.photos = [];
        this.sessionPhotos = 0;
        
        this.init();
    }
    
    async init() {
        await this.initDatabase();
        this.setupUI();
        this.checkWebXRSupport();
    }
    
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PhotoGalleryDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                this.loadPhotos();
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('photos')) {
                    const objectStore = db.createObjectStore('photos', { keyPath: 'id' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('objectId', 'objectId', { unique: false });
                }
            };
        });
    }
    
    async loadPhotos() {
        if (!this.db) return;
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['photos'], 'readonly');
            const objectStore = transaction.objectStore('photos');
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                this.photos = request.result || [];
                this.updateGalleryStats();
                resolve();
            };
        });
    }
    
    async savePhoto(photoData) {
        if (!this.db) return;
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const objectStore = transaction.objectStore('photos');
            objectStore.put(photoData);
            transaction.oncomplete = () => {
                this.photos.push(photoData);
                resolve();
            };
        });
    }
    
    async clearSessionData() {
        if (!this.db) return;
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['photos'], 'readwrite');
            const objectStore = transaction.objectStore('photos');
            objectStore.clear();
            transaction.oncomplete = () => {
                this.photos = [];
                resolve();
            };
        });
    }
    
    setupUI() {
        document.getElementById('startButton').addEventListener('click', () => this.startXR());
        document.getElementById('captureButton').addEventListener('click', () => this.capturePhoto());
        document.getElementById('toggleGallery').addEventListener('click', () => this.toggleGallery());
        document.getElementById('toggleInfo').addEventListener('click', () => this.toggleInfo());
        document.getElementById('exitButton').addEventListener('click', () => this.endXR());
        
        window.addEventListener('beforeunload', () => this.clearSessionData());
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
            document.getElementById('photoInfo').classList.add('active');
            
            this.setupThreeJS();
            await this.renderer.xr.setSession(this.xrSession);
            
            this.xrSession.addEventListener('end', () => this.onSessionEnd());
            this.renderer.setAnimationLoop((time, frame) => this.onXRFrame(time, frame));
            
            // Create some demo photo frames
            this.createDemoPhotoFrames();
            
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
    
    createDemoPhotoFrames() {
        // Create demo photo frames in various positions
        const positions = [
            { x: -2, y: 1.6, z: -3 },
            { x: 2, y: 1.6, z: -3 },
            { x: 0, y: 1.6, z: -4 }
        ];
        
        positions.forEach((pos, index) => {
            this.createPhotoFrame(pos, `Demo Location ${index + 1}`);
        });
    }
    
    createPhotoFrame(position, objectName) {
        const frameId = 'frame_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create photo data
        const photoData = {
            id: frameId,
            objectId: 'obj_' + Math.random().toString(36).substr(2, 6),
            objectName: objectName,
            timestamp: Date.now(),
            position: position,
            photos: this.generateDemoPhotos(3) // 3 demo photos that will slide
        };
        
        // Create the frame with sliding photos
        this.createSlidingPhotoFrame(photoData);
        
        this.updateGalleryStats();
    }
    
    generateDemoPhotos(count) {
        const photos = [];
        const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
        
        for (let i = 0; i < count; i++) {
            photos.push({
                id: 'photo_' + i,
                color: colors[i % colors.length],
                timestamp: Date.now() - (i * 60000), // Each 1 minute apart
                caption: `Photo ${i + 1}`
            });
        }
        
        return photos;
    }
    
    createSlidingPhotoFrame(photoData) {
        // Create a group to hold the frame and photos
        const frameGroup = new THREE.Group();
        frameGroup.position.set(photoData.position.x, photoData.position.y, photoData.position.z);
        
        // Create the HUD bubble canvas
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        
        // Store current photo index
        frameGroup.userData = {
            frameId: photoData.id,
            photos: photoData.photos,
            currentPhotoIndex: 0,
            lastSlideTime: Date.now(),
            slideInterval: 3000, // Slide every 3 seconds
            canvas: canvas,
            objectName: photoData.objectName
        };
        
        // Initial draw
        this.drawPhotoFrame(frameGroup);
        
        // Create sprite from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.5, 1.5, 1);
        
        frameGroup.add(sprite);
        this.scene.add(frameGroup);
        this.photoFrames.set(photoData.id, frameGroup);
    }
    
    drawPhotoFrame(frameGroup) {
        const canvas = frameGroup.userData.canvas;
        const ctx = canvas.getContext('2d');
        const photos = frameGroup.userData.photos;
        const currentIndex = frameGroup.userData.currentPhotoIndex;
        const currentPhoto = photos[currentIndex];
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw bubble background
        ctx.fillStyle = 'rgba(236, 72, 153, 0.9)';
        this.drawBubble(ctx, 0, 0, 512, 512);
        
        // Draw photo frame (simulated photo with colored background)
        ctx.fillStyle = currentPhoto.color;
        ctx.fillRect(40, 80, 432, 280);
        
        // Draw frame border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.strokeRect(40, 80, 432, 280);
        
        // Draw photo caption
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentPhoto.caption, 256, 50);
        
        // Draw object name
        ctx.font = '24px Arial';
        ctx.fillText(frameGroup.userData.objectName, 256, 400);
        
        // Draw photo indicator
        ctx.font = '20px Arial';
        ctx.fillText(`${currentIndex + 1} / ${photos.length}`, 256, 440);
        
        // Draw timestamp
        const timeAgo = this.getTimeAgo(currentPhoto.timestamp);
        ctx.font = '18px Arial';
        ctx.fillText(`Captured ${timeAgo}`, 256, 470);
        
        // Update texture
        const sprite = frameGroup.children[0];
        if (sprite && sprite.material && sprite.material.map) {
            sprite.material.map.needsUpdate = true;
        }
    }
    
    drawBubble(ctx, x, y, width, height) {
        const radius = 20;
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
    
    updatePhotoFrames(time) {
        this.photoFrames.forEach((frameGroup) => {
            const userData = frameGroup.userData;
            
            // Check if it's time to slide to next photo
            if (time - userData.lastSlideTime > userData.slideInterval) {
                userData.currentPhotoIndex = (userData.currentPhotoIndex + 1) % userData.photos.length;
                userData.lastSlideTime = time;
                this.drawPhotoFrame(frameGroup);
            }
            
            // Make frame face camera
            frameGroup.lookAt(this.camera.position);
        });
    }
    
    async capturePhoto() {
        // Simulate capturing a photo at current location
        const position = {
            x: this.camera.position.x + (Math.random() - 0.5) * 2,
            y: this.camera.position.y,
            z: this.camera.position.z - 3
        };
        
        this.createPhotoFrame(position, 'New Capture');
        this.sessionPhotos++;
        this.updateGalleryStats();
        
        alert('Photo captured! Frame added to scene.');
    }
    
    updateGalleryStats() {
        document.getElementById('totalPhotos').textContent = this.photos.length;
        document.getElementById('sessionPhotos').textContent = this.sessionPhotos;
        document.getElementById('activeFrames').textContent = this.photoFrames.size;
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
            
            // Update photo frames (sliding animation)
            this.updatePhotoFrames(time);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    async endXR() {
        if (this.xrSession) {
            await this.xrSession.end();
        }
    }
    
    async onSessionEnd() {
        await this.clearSessionData();
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('controls').classList.remove('active');
        document.getElementById('gallery').classList.remove('active');
        document.getElementById('photoInfo').classList.remove('active');
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
        }
        this.xrSession = null;
        this.sessionPhotos = 0;
    }
    
    toggleGallery() {
        document.getElementById('gallery').classList.toggle('active');
    }
    
    toggleInfo() {
        document.getElementById('photoInfo').classList.toggle('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.photoGalleryApp = new PhotoGalleryApp();
});
