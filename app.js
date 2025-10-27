// XRCapt - Person Memory Assistant
// Main Application Logic

class XRCaptApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.xrSession = null;
        this.db = null;
        
        // Person tracking
        this.detectedPersons = new Map(); // Active persons in view
        this.personHUDs = new Map(); // HUD elements for each person
        this.selectedPersonId = null;
        
        // Input state
        this.gamepadState = {
            xButton: false,
            aButton: false,
            leftArrow: false,
            rightArrow: false
        };
        
        // Filters
        this.filters = {
            showNew: true,
            showKnown: true,
            showFrequent: true,
            showNearby: true
        };
        
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
            const request = indexedDB.open('XRCaptDB', 1);
            
            request.onerror = () => {
                this.debugLog('Database error', 'error');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.debugLog('Database initialized', 'success');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('persons')) {
                    const objectStore = db.createObjectStore('persons', { keyPath: 'id' });
                    objectStore.createIndex('lastSeen', 'lastSeen', { unique: false });
                    objectStore.createIndex('encounterCount', 'encounterCount', { unique: false });
                    objectStore.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }
    
    async savePerson(personData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readwrite');
            const objectStore = transaction.objectStore('persons');
            const request = objectStore.put(personData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getPerson(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readonly');
            const objectStore = transaction.objectStore('persons');
            const request = objectStore.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getAllPersons() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['persons'], 'readonly');
            const objectStore = transaction.objectStore('persons');
            const request = objectStore.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async updatePerson(id, updates) {
        const person = await this.getPerson(id);
        if (!person) return null;
        
        const updated = { ...person, ...updates };
        await this.savePerson(updated);
        return updated;
    }
    
    // ===== UI SETUP =====
    setupUI() {
        const startButton = document.getElementById('startButton');
        const dashboardButton = document.getElementById('dashboardButton');
        const closeButton = document.getElementById('closeButton');
        const toggleDebug = document.getElementById('toggleDebug');
        const toggleFilter = document.getElementById('toggleFilter');
        
        startButton.addEventListener('click', () => this.startXR());
        dashboardButton.addEventListener('click', () => this.showDashboard());
        closeButton.addEventListener('click', () => this.hideDashboard());
        toggleDebug.addEventListener('click', () => this.toggleDebugOverlay());
        toggleFilter.addEventListener('click', () => this.toggleFilterPanel());
        
        // Filter checkboxes
        document.getElementById('filterNew').addEventListener('change', (e) => {
            this.filters.showNew = e.target.checked;
            this.updateHUDVisibility();
        });
        document.getElementById('filterKnown').addEventListener('change', (e) => {
            this.filters.showKnown = e.target.checked;
            this.updateHUDVisibility();
        });
        document.getElementById('filterFrequent').addEventListener('change', (e) => {
            this.filters.showFrequent = e.target.checked;
            this.updateHUDVisibility();
        });
        document.getElementById('filterNearby').addEventListener('change', (e) => {
            this.filters.showNearby = e.target.checked;
            this.updateHUDVisibility();
        });
    }
    
    checkWebXRSupport() {
        const statusText = document.getElementById('statusText');
        const debugWebXR = document.getElementById('debugWebXR');
        
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
                if (supported) {
                    statusText.textContent = '✅ WebXR AR Supported';
                    debugWebXR.textContent = 'WebXR: ✅ Supported';
                    document.getElementById('startButton').disabled = false;
                } else {
                    statusText.textContent = '❌ WebXR AR not supported on this device';
                    debugWebXR.textContent = 'WebXR: ❌ Not Supported';
                    document.getElementById('startButton').disabled = true;
                }
            });
        } else {
            statusText.textContent = '❌ WebXR not available';
            debugWebXR.textContent = 'WebXR: ❌ Not Available';
            document.getElementById('startButton').disabled = true;
        }
    }
    
    // ===== WEBXR SESSION MANAGEMENT =====
    async startXR() {
        try {
            this.debugLog('Starting XR session...', 'info');
            
            // Request XR session with passthrough
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking', 'layers']
            });
            
            this.debugLog('XR session started', 'success');
            document.getElementById('debugSession').textContent = 'Session: ✅ Started';
            
            // Hide start screen
            document.getElementById('startScreen').style.display = 'none';
            document.getElementById('controls').classList.add('active');
            document.getElementById('debugOverlay').classList.add('active');
            
            // Initialize Three.js
            this.setupThreeJS();
            
            // Set up XR session
            await this.renderer.xr.setSession(this.xrSession);
            
            this.xrSession.addEventListener('end', () => {
                this.debugLog('XR session ended', 'info');
                document.getElementById('debugSession').textContent = 'Session: Ended';
                document.getElementById('startScreen').style.display = 'flex';
                document.getElementById('controls').classList.remove('active');
                document.getElementById('debugOverlay').classList.remove('active');
                
                // Stop animation loop to prevent errors after session ends
                this.renderer.setAnimationLoop(null);
                
                // Clear session reference
                this.xrSession = null;
            });
            
            // Start animation loop
            this.renderer.setAnimationLoop((time, frame) => this.onXRFrame(time, frame));
            
            // Start person detection simulation
            this.startPersonDetection();
            
        } catch (error) {
            this.debugLog(`XR Error: ${error.message}`, 'error');
            document.getElementById('debugError').textContent = `Errors: ${error.message}`;
            alert('Failed to start AR session. Make sure you are using a compatible VR headset.');
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
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 10, 0);
        this.scene.add(directionalLight);
    }
    
    onXRFrame(time, frame) {
        if (!frame) return;
        
        // Check if XR session is still active
        if (!this.xrSession) return;
        
        const session = frame.session;
        const refSpace = this.renderer.xr.getReferenceSpace();
        if (!refSpace) return;
        
        const pose = frame.getViewerPose(refSpace);
        
        if (pose) {
            // Update camera position
            this.camera.position.copy(pose.transform.position);
            this.camera.quaternion.copy(pose.transform.orientation);
            
            // Process gamepad input
            this.processInput(session);
            
            // Update HUD positions
            this.updateHUDPositions();
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    processInput(session) {
        const gamepads = session.inputSources;
        
        for (const inputSource of gamepads) {
            if (inputSource.gamepad) {
                const gamepad = inputSource.gamepad;
                
                // Check button states (X/A buttons typically on index 4 and 5)
                const xButton = gamepad.buttons[4] && gamepad.buttons[4].pressed;
                const aButton = gamepad.buttons[5] && gamepad.buttons[5].pressed;
                
                // Check thumbstick for left/right (typically axes 2 and 3)
                const thumbstickX = gamepad.axes[2] || 0;
                const leftArrow = thumbstickX < -0.5;
                const rightArrow = thumbstickX > 0.5;
                
                // Handle selection navigation
                if ((xButton || aButton) && !this.gamepadState.xButton && !this.gamepadState.aButton) {
                    // Button just pressed
                    this.startSelection();
                } else if (!(xButton || aButton) && (this.gamepadState.xButton || this.gamepadState.aButton)) {
                    // Button just released
                    this.endSelection();
                }
                
                // Handle left/right navigation during selection
                if ((xButton || aButton) && (leftArrow || rightArrow)) {
                    if (leftArrow && !this.gamepadState.leftArrow) {
                        this.selectPreviousPerson();
                    } else if (rightArrow && !this.gamepadState.rightArrow) {
                        this.selectNextPerson();
                    }
                }
                
                // Update state
                this.gamepadState.xButton = xButton;
                this.gamepadState.aButton = aButton;
                this.gamepadState.leftArrow = leftArrow;
                this.gamepadState.rightArrow = rightArrow;
            }
        }
    }
    
    // ===== PERSON DETECTION =====
    startPersonDetection() {
        // Simulate person detection (in real app, this would use ML models)
        // For demo purposes, we'll create a few simulated detections
        
        setInterval(() => {
            // Randomly detect new persons for demonstration
            if (Math.random() > 0.95 && this.detectedPersons.size < 5) {
                this.detectNewPerson();
            }
            
            // Update detection count
            document.getElementById('debugDetections').textContent = 
                `Detections: ${this.detectedPersons.size} active`;
        }, 1000);
    }
    
    async detectNewPerson() {
        const id = this.generatePersonId();
        const timestamp = Date.now();
        
        // Random position around user (for demo)
        const angle = Math.random() * Math.PI * 2;
        const distance = 2 + Math.random() * 3;
        const position = {
            x: Math.cos(angle) * distance,
            y: 1.6, // Average head height
            z: Math.sin(angle) * distance
        };
        
        // Check if person exists in database
        let personData = await this.findSimilarPerson(position);
        
        if (!personData) {
            // New person
            personData = {
                id: id,
                name: `Person ${id.substring(0, 4)}`,
                firstSeen: timestamp,
                lastSeen: timestamp,
                encounterCount: 1,
                locations: [{ timestamp, position }],
                tags: [],
                notes: ''
            };
        } else {
            // Existing person - update
            personData.lastSeen = timestamp;
            personData.encounterCount += 1;
            personData.locations.push({ timestamp, position });
        }
        
        await this.savePerson(personData);
        
        // Add to active detections
        this.detectedPersons.set(personData.id, {
            ...personData,
            position: position
        });
        
        // Create HUD
        this.createPersonHUD(personData, position);
        
        this.debugLog(`Detected: ${personData.name}`, 'info');
    }
    
    async findSimilarPerson(position) {
        // In real app, this would use facial recognition or other ML
        // For demo, we just check if there's a person nearby in recent history
        const allPersons = await this.getAllPersons();
        const now = Date.now();
        const HOUR = 3600000;
        
        for (const person of allPersons) {
            if (now - person.lastSeen < 24 * HOUR) {
                // Check if person was seen in similar location recently
                const lastLocation = person.locations[person.locations.length - 1];
                const dist = Math.sqrt(
                    Math.pow(position.x - lastLocation.position.x, 2) +
                    Math.pow(position.z - lastLocation.position.z, 2)
                );
                
                if (dist < 2.0) { // Within 2 meters
                    return person;
                }
            }
        }
        
        return null;
    }
    
    generatePersonId() {
        return 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // ===== HUD MANAGEMENT =====
    createPersonHUD(personData, position) {
        // Create speech bubble HUD
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Determine color based on encounter count
        let color;
        if (personData.encounterCount <= 2) {
            color = '#2196F3'; // Blue - New
        } else if (personData.encounterCount <= 5) {
            color = '#ff9800'; // Amber - Occasional
        } else {
            color = '#f44336'; // Red - Frequent
        }
        
        // Draw bubble background
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        this.drawSpeechBubble(ctx, 0, 0, 512, 200);
        ctx.globalAlpha = 1.0;
        
        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(personData.name, 20, 50);
        
        ctx.font = '24px Arial';
        const timeSince = this.getTimeSince(personData.lastSeen);
        ctx.fillText(`Last seen: ${timeSince}`, 20, 90);
        ctx.fillText(`Encounters: ${personData.encounterCount}`, 20, 120);
        
        const lastLocation = personData.locations[personData.locations.length - 1];
        ctx.font = '20px Arial';
        ctx.fillText(`Location: (${lastLocation.position.x.toFixed(1)}, ${lastLocation.position.z.toFixed(1)})`, 20, 150);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            depthTest: false
        });
        const sprite = new THREE.Sprite(material);
        
        sprite.position.set(position.x, position.y + 0.3, position.z);
        sprite.scale.set(1, 0.5, 1);
        sprite.userData = { personId: personData.id };
        
        this.scene.add(sprite);
        this.personHUDs.set(personData.id, sprite);
        
        // Create glow effect
        const glowGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(position.x, position.y, position.z);
        glow.userData = { personId: personData.id, isGlow: true };
        
        this.scene.add(glow);
        this.personHUDs.set(personData.id + '_glow', glow);
    }
    
    drawSpeechBubble(ctx, x, y, width, height) {
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
        
        // Draw pointer
        ctx.beginPath();
        ctx.moveTo(x + width / 2 - 20, y + height);
        ctx.lineTo(x + width / 2, y + height + 30);
        ctx.lineTo(x + width / 2 + 20, y + height);
        ctx.closePath();
        ctx.fill();
    }
    
    updateHUDPositions() {
        // Keep HUDs facing the camera
        this.personHUDs.forEach((hud, id) => {
            if (!hud.userData.isGlow) {
                hud.lookAt(this.camera.position);
            }
        });
    }
    
    updateHUDVisibility() {
        this.detectedPersons.forEach((personData, id) => {
            const hud = this.personHUDs.get(id);
            if (hud) {
                let visible = true;
                
                // Apply filters
                if (!this.filters.showNew && personData.encounterCount <= 2) {
                    visible = false;
                } else if (!this.filters.showKnown && personData.encounterCount >= 3 && personData.encounterCount <= 5) {
                    visible = false;
                } else if (!this.filters.showFrequent && personData.encounterCount > 5) {
                    visible = false;
                }
                
                hud.visible = visible;
                const glow = this.personHUDs.get(id + '_glow');
                if (glow) glow.visible = visible;
            }
        });
    }
    
    // ===== SELECTION & INTERACTION =====
    startSelection() {
        // Highlight first person
        if (this.detectedPersons.size > 0) {
            const firstId = Array.from(this.detectedPersons.keys())[0];
            this.selectPerson(firstId);
        }
    }
    
    endSelection() {
        // Remove highlight
        if (this.selectedPersonId) {
            this.unhighlightPerson(this.selectedPersonId);
            this.selectedPersonId = null;
        }
    }
    
    selectPerson(personId) {
        if (this.selectedPersonId) {
            this.unhighlightPerson(this.selectedPersonId);
        }
        
        this.selectedPersonId = personId;
        this.highlightPerson(personId);
    }
    
    selectNextPerson() {
        const ids = Array.from(this.detectedPersons.keys());
        if (ids.length === 0) return;
        
        const currentIndex = ids.indexOf(this.selectedPersonId);
        const nextIndex = (currentIndex + 1) % ids.length;
        this.selectPerson(ids[nextIndex]);
    }
    
    selectPreviousPerson() {
        const ids = Array.from(this.detectedPersons.keys());
        if (ids.length === 0) return;
        
        const currentIndex = ids.indexOf(this.selectedPersonId);
        const prevIndex = (currentIndex - 1 + ids.length) % ids.length;
        this.selectPerson(ids[prevIndex]);
    }
    
    highlightPerson(personId) {
        const glow = this.personHUDs.get(personId + '_glow');
        if (glow) {
            glow.material.opacity = 0.7;
            glow.scale.set(1.5, 1.5, 1.5);
            
            // Animate glow
            const animate = () => {
                if (this.selectedPersonId === personId && glow) {
                    glow.material.opacity = 0.3 + Math.sin(Date.now() / 200) * 0.4;
                    requestAnimationFrame(animate);
                }
            };
            animate();
        }
    }
    
    unhighlightPerson(personId) {
        const glow = this.personHUDs.get(personId + '_glow');
        if (glow) {
            glow.material.opacity = 0.3;
            glow.scale.set(1, 1, 1);
        }
    }
    
    // ===== DASHBOARD =====
    async showDashboard() {
        const dashboard = document.getElementById('dashboard');
        const personList = document.getElementById('personList');
        
        // Get all persons sorted by last seen
        const persons = await this.getAllPersons();
        persons.sort((a, b) => b.lastSeen - a.lastSeen);
        
        // Clear existing list
        personList.innerHTML = '';
        
        if (persons.length === 0) {
            personList.innerHTML = '<p style="text-align: center; color: #888;">No encounters recorded yet.</p>';
        } else {
            persons.forEach(person => {
                const entry = this.createPersonEntry(person);
                personList.appendChild(entry);
            });
        }
        
        dashboard.style.display = 'block';
    }
    
    hideDashboard() {
        document.getElementById('dashboard').style.display = 'none';
    }
    
    createPersonEntry(person) {
        const div = document.createElement('div');
        div.className = 'person-entry';
        
        if (person.encounterCount > 5) {
            div.classList.add('frequent');
        } else if (person.encounterCount >= 3) {
            div.classList.add('occasional');
        }
        
        const timeSince = this.getTimeSince(person.lastSeen);
        const firstSeenDate = new Date(person.firstSeen).toLocaleDateString();
        const daysSince = Math.floor((Date.now() - person.firstSeen) / (1000 * 60 * 60 * 24));
        
        div.innerHTML = `
            <h3>${person.name}</h3>
            <p>👁️ Seen ${person.encounterCount}× in ${daysSince} days</p>
            <p>⏰ Last seen: ${timeSince}</p>
            <p>📍 First encounter: ${firstSeenDate}</p>
            <p>📝 Notes: ${person.notes || '(none)'}</p>
        `;
        
        // Rename button
        const renameBtn = document.createElement('button');
        renameBtn.textContent = '✏️ Rename';
        renameBtn.onclick = () => this.renamePerson(person.id);
        div.appendChild(renameBtn);
        
        // Add note button
        const noteBtn = document.createElement('button');
        noteBtn.textContent = '📝 Add Note';
        noteBtn.onclick = () => this.addNote(person.id);
        div.appendChild(noteBtn);
        
        // Memory trail button
        const trailBtn = document.createElement('button');
        trailBtn.textContent = '👻 Memory Trail';
        trailBtn.onclick = () => this.showMemoryTrail(person.id);
        div.appendChild(trailBtn);
        
        return div;
    }
    
    async renamePerson(personId) {
        const person = await this.getPerson(personId);
        if (!person) return;
        
        const newName = prompt('Enter new name:', person.name);
        if (newName && newName.trim()) {
            await this.updatePerson(personId, { name: newName.trim() });
            this.showDashboard(); // Refresh
            
            // Update HUD if person is currently visible
            if (this.detectedPersons.has(personId)) {
                const personData = this.detectedPersons.get(personId);
                personData.name = newName.trim();
                this.refreshPersonHUD(personId);
            }
        }
    }
    
    async addNote(personId) {
        const person = await this.getPerson(personId);
        if (!person) return;
        
        const note = prompt('Add a note:', person.notes);
        if (note !== null) {
            await this.updatePerson(personId, { notes: note });
            this.showDashboard(); // Refresh
        }
    }
    
    async showMemoryTrail(personId) {
        const person = await this.getPerson(personId);
        if (!person || !person.locations.length) return;
        
        this.hideDashboard();
        
        // Get last known location
        const lastLocation = person.locations[person.locations.length - 1];
        
        // Create ghost avatar
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        const ghost = new THREE.Mesh(geometry, material);
        ghost.position.set(
            lastLocation.position.x,
            lastLocation.position.y,
            lastLocation.position.z
        );
        this.scene.add(ghost);
        
        // Animate and remove after 6 seconds
        let startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 6000) {
                ghost.material.opacity = 0.5 * (1 - elapsed / 6000);
                ghost.rotation.y += 0.05;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ghost);
            }
        };
        animate();
        
        this.debugLog(`Memory trail for ${person.name}`, 'info');
    }
    
    refreshPersonHUD(personId) {
        // Remove old HUD
        const oldHUD = this.personHUDs.get(personId);
        if (oldHUD) {
            this.scene.remove(oldHUD);
            this.personHUDs.delete(personId);
        }
        
        const oldGlow = this.personHUDs.get(personId + '_glow');
        if (oldGlow) {
            this.scene.remove(oldGlow);
            this.personHUDs.delete(personId + '_glow');
        }
        
        // Create new HUD
        const personData = this.detectedPersons.get(personId);
        if (personData) {
            this.createPersonHUD(personData, personData.position);
        }
    }
    
    // ===== UI TOGGLES =====
    toggleDebugOverlay() {
        const overlay = document.getElementById('debugOverlay');
        overlay.classList.toggle('active');
    }
    
    toggleFilterPanel() {
        const panel = document.getElementById('filterPanel');
        panel.classList.toggle('active');
    }
    
    // ===== UTILITIES =====
    getTimeSince(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
    
    debugLog(message, type = 'info') {
        console.log(`[XRCapt] ${message}`);
        
        const debugError = document.getElementById('debugError');
        if (type === 'error') {
            debugError.textContent = `Errors: ${message}`;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.xrCaptApp = new XRCaptApp();
});
