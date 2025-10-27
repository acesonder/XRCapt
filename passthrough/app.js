// XRCapt Passthrough - Main Application
// Meta Quest 3S Compatible WebXR Passthrough Application

class PassthroughApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.db = null;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        
        this.init();
    }
    
    async init() {
        await this.initDatabase();
        this.setupUI();
        this.checkWebXRSupport();
    }
    
    // ===== DATABASE MANAGEMENT =====
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PassthroughDB', 1);
            
            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database initialized');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('sessionData')) {
                    const objectStore = db.createObjectStore('sessionData', { keyPath: 'id' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }
    
    async clearSessionData() {
        // Clear all data when leaving the app
        if (!this.db) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessionData'], 'readwrite');
            const objectStore = transaction.objectStore('sessionData');
            const request = objectStore.clear();
            
            request.onsuccess = () => {
                console.log('Session data cleared');
                resolve();
            };
            request.onerror = () => {
                console.error('Error clearing data:', request.error);
                reject(request.error);
            };
        });
    }
    
    // ===== UI SETUP =====
    setupUI() {
        const startButton = document.getElementById('startButton');
        const toggleDebug = document.getElementById('toggleDebug');
        const exitAR = document.getElementById('exitAR');
        
        startButton.addEventListener('click', () => this.startXR());
        toggleDebug.addEventListener('click', () => this.toggleDebug());
        exitAR.addEventListener('click', () => this.endXR());
        
        // Handle page unload - clear session data
        window.addEventListener('beforeunload', async () => {
            await this.clearSessionData();
        });
    }
    
    checkWebXRSupport() {
        const statusText = document.getElementById('statusText');
        const debugWebXR = document.getElementById('debugWebXR');
        
        if (!navigator.xr) {
            statusText.textContent = '❌ WebXR not available in this browser';
            debugWebXR.innerHTML = '<span class="status-error">Not Available</span>';
            document.getElementById('startButton').disabled = true;
            return;
        }
        
        navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
            if (supported) {
                statusText.textContent = '✅ WebXR AR is supported! Ready to start.';
                debugWebXR.innerHTML = '<span class="status-ok">Supported</span>';
                document.getElementById('startButton').disabled = false;
            } else {
                statusText.textContent = '❌ WebXR AR not supported on this device';
                debugWebXR.innerHTML = '<span class="status-error">Not Supported</span>';
                document.getElementById('startButton').disabled = true;
            }
        }).catch(error => {
            statusText.textContent = '❌ Error checking WebXR support';
            debugWebXR.innerHTML = '<span class="status-error">Error</span>';
            document.getElementById('startButton').disabled = true;
            console.error('WebXR check error:', error);
        });
    }
    
    // ===== WEBXR SESSION MANAGEMENT =====
    async startXR() {
        try {
            console.log('Requesting XR session...');
            
            // Request immersive-ar session with optional features for Quest 3S
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking', 'layers', 'dom-overlay'],
                domOverlay: { root: document.body }
            });
            
            console.log('XR session started successfully');
            this.updateDebug('debugSession', '<span class="status-ok">Active</span>');
            this.updateDebug('debugPassthrough', '<span class="status-ok">Enabled</span>');
            
            // Hide start screen
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('controlPanel').classList.add('active');
            document.getElementById('debugInfo').classList.add('active');
            
            // Initialize Three.js
            this.setupThreeJS();
            
            // Set up XR rendering
            await this.renderer.xr.setSession(this.xrSession);
            
            // Handle session end
            this.xrSession.addEventListener('end', () => {
                this.onSessionEnd();
            });
            
            // Start animation loop
            this.renderer.setAnimationLoop((time, frame) => this.onXRFrame(time, frame));
            
            // Add some demo content
            this.addDemoContent();
            
        } catch (error) {
            console.error('XR Error:', error);
            this.updateDebug('debugErrors', `<span class="status-error">${error.message}</span>`);
            alert(`Failed to start AR session: ${error.message}\n\nMake sure you're using a Meta Quest 3S or compatible device.`);
        }
    }
    
    setupThreeJS() {
        const container = document.getElementById('container');
        
        // Scene
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        container.appendChild(this.renderer.domElement);
        
        // Add ambient lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);
    }
    
    addDemoContent() {
        // Add a welcome message cube that floats in front of user
        const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x667eea,
            metalness: 0.5,
            roughness: 0.2
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 1.5, -2);
        this.scene.add(cube);
        
        // Add rotation animation
        cube.userData.animate = (time) => {
            cube.rotation.x = time * 0.001;
            cube.rotation.y = time * 0.002;
        };
        this.animatedObjects = [cube];
    }
    
    onXRFrame(time, frame) {
        if (!frame || !this.xrSession) return;
        
        const refSpace = this.renderer.xr.getReferenceSpace();
        if (!refSpace) return;
        
        const pose = frame.getViewerPose(refSpace);
        
        if (pose) {
            // Update camera
            this.camera.position.copy(pose.transform.position);
            this.camera.quaternion.copy(pose.transform.orientation);
            
            // Animate demo objects
            if (this.animatedObjects) {
                this.animatedObjects.forEach(obj => {
                    if (obj.userData.animate) {
                        obj.userData.animate(time);
                    }
                });
            }
        }
        
        // Update FPS
        this.frameCount++;
        if (time - this.lastFPSUpdate > 1000) {
            const fps = Math.round(this.frameCount * 1000 / (time - this.lastFPSUpdate));
            this.updateDebug('debugFPS', `${fps} FPS`);
            this.frameCount = 0;
            this.lastFPSUpdate = time;
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    async endXR() {
        if (this.xrSession) {
            await this.xrSession.end();
        }
    }
    
    async onSessionEnd() {
        console.log('XR session ended');
        
        // Clear session data
        await this.clearSessionData();
        
        // Update UI
        this.updateDebug('debugSession', '<span class="status-warn">Ended</span>');
        this.updateDebug('debugPassthrough', '<span class="status-warn">Disabled</span>');
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('controlPanel').classList.remove('active');
        
        // Stop animation
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
        }
        
        this.xrSession = null;
    }
    
    // ===== UI UTILITIES =====
    toggleDebug() {
        const debugInfo = document.getElementById('debugInfo');
        debugInfo.classList.toggle('active');
    }
    
    updateDebug(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = value;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.passthroughApp = new PassthroughApp();
});
