// xr-manager.js - WebXR session management
export class XRManager {
    constructor(app) {
        this.app = app;
        this.xrSession = null;
        this.xrRefSpace = null;
        this.gl = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.hudOverlays = new Map();
        this.selectedPersonId = null;
        this.inputSources = new Map();
    }

    async init() {
        try {
            // Request XR session with passthrough
            this.xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local-floor', 'hand-tracking'],
                optionalFeatures: ['bounded-floor', 'layers']
            });

            console.log('XR Session created');

            // Set up WebGL context
            const canvas = document.createElement('canvas');
            this.gl = canvas.getContext('webgl', { xrCompatible: true });
            
            await this.gl.makeXRCompatible();

            // Set up XR layer
            const layer = new XRWebGLLayer(this.xrSession, this.gl);
            await this.xrSession.updateRenderState({
                baseLayer: layer
            });

            // Get reference space
            this.xrRefSpace = await this.xrSession.requestReferenceSpace('local-floor');

            // Set up Three.js scene
            this.setupThreeJS();

            // Set up input handling
            this.setupInputHandling();

            // Handle session end
            this.xrSession.addEventListener('end', () => {
                this.app.stopXR();
            });

            // Start render loop
            this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));

        } catch (error) {
            console.error('Failed to initialize XR:', error);
            throw error;
        }
    }

    setupThreeJS() {
        // Create Three.js scene
        this.scene = new THREE.Scene();

        // Create camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.gl.canvas,
            context: this.gl,
            alpha: true
        });
        this.renderer.xr.enabled = true;
        this.renderer.xr.setSession(this.xrSession);

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);
    }

    setupInputHandling() {
        this.xrSession.addEventListener('inputsourceschange', (event) => {
            event.added?.forEach(input => {
                this.inputSources.set(input, { gamepad: input.gamepad });
            });
            event.removed?.forEach(input => {
                this.inputSources.delete(input);
            });
        });

        this.xrSession.addEventListener('selectstart', (event) => {
            this.handleSelectStart(event);
        });

        this.xrSession.addEventListener('selectend', (event) => {
            this.handleSelectEnd(event);
        });
    }

    handleSelectStart(event) {
        const inputSource = event.inputSource;
        console.log('Select started:', inputSource.handedness);
    }

    handleSelectEnd(event) {
        const inputSource = event.inputSource;
        console.log('Select ended:', inputSource.handedness);
        
        if (this.selectedPersonId) {
            // Perform action on selected person
            this.interactWithPerson(this.selectedPersonId);
        }
    }

    processInputs(frame) {
        for (const [inputSource, data] of this.inputSources) {
            const gamepad = inputSource.gamepad;
            if (!gamepad) continue;

            // Check for X/A button press
            if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
                // Button held - allow navigation
                const axes = gamepad.axes;
                if (axes.length >= 2) {
                    const horizontal = axes[0]; // -1 to 1
                    
                    if (Math.abs(horizontal) > 0.5) {
                        this.navigatePersons(horizontal > 0 ? 1 : -1);
                    }
                }
            }
        }
    }

    navigatePersons(direction) {
        // Get list of visible persons
        const visiblePersons = Array.from(this.hudOverlays.keys());
        if (visiblePersons.length === 0) return;

        const currentIndex = this.selectedPersonId ? 
            visiblePersons.indexOf(this.selectedPersonId) : -1;
        
        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = visiblePersons.length - 1;
        if (newIndex >= visiblePersons.length) newIndex = 0;

        this.selectedPersonId = visiblePersons[newIndex];
        this.updateHUDHighlights();
    }

    updateHUDHighlights() {
        this.hudOverlays.forEach((overlay, personId) => {
            if (personId === this.selectedPersonId) {
                overlay.material.emissive.setHex(0x0088ff);
                overlay.material.emissiveIntensity = 0.5;
            } else {
                overlay.material.emissive.setHex(0x000000);
                overlay.material.emissiveIntensity = 0;
            }
        });
    }

    async interactWithPerson(personId) {
        console.log('Interacting with person:', personId);
        const person = await this.app.getPersonById(personId);
        if (person) {
            // Show person details in UI
            this.app.uiManager.showPersonDetails(person);
        }
    }

    createHUDOverlay(personData, position) {
        const { id, name, encounters, lastSeen } = personData;

        // Determine bubble color based on encounters
        let color;
        if (encounters < 2) {
            color = 0x4a90e2; // Blue - New
        } else if (encounters <= 5) {
            color = 0xf5a623; // Amber - Occasional
        } else {
            color = 0xe74c3c; // Red - Frequent
        }

        // Create bubble geometry
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const bubble = new THREE.Mesh(geometry, material);
        bubble.position.set(position.x, position.y + 0.5, position.z);

        // Create text sprite for name/info
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;

        context.fillStyle = '#ffffff';
        context.font = 'Bold 48px Arial';
        context.textAlign = 'center';
        context.fillText(name || 'Unknown', 256, 60);

        context.font = '32px Arial';
        const lastSeenText = this.formatLastSeen(lastSeen);
        context.fillText(lastSeenText, 256, 110);
        context.fillText(`Seen ${encounters}×`, 256, 150);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(1, 0.5, 1);
        sprite.position.set(0, 0.5, 0);

        bubble.add(sprite);
        this.scene.add(bubble);
        this.hudOverlays.set(id, bubble);

        return bubble;
    }

    updateHUDOverlay(personId, personData) {
        const overlay = this.hudOverlays.get(personId);
        if (!overlay) return;

        // Update bubble color based on encounters
        let color;
        if (personData.encounters < 2) {
            color = 0x4a90e2;
        } else if (personData.encounters <= 5) {
            color = 0xf5a623;
        } else {
            color = 0xe74c3c;
        }

        overlay.material.color.setHex(color);

        // Update text (if needed, recreate sprite)
    }

    removeHUDOverlay(personId) {
        const overlay = this.hudOverlays.get(personId);
        if (overlay) {
            this.scene.remove(overlay);
            this.hudOverlays.delete(personId);
        }
    }

    formatLastSeen(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    onXRFrame(time, frame) {
        const session = frame.session;
        session.requestAnimationFrame(this.onXRFrame.bind(this));

        // Get pose
        const pose = frame.getViewerPose(this.xrRefSpace);
        if (!pose) return;

        // Process inputs
        this.processInputs(frame);

        // Update person tracker
        if (this.app.getPersonTracker()) {
            this.app.getPersonTracker().update(frame, pose);
        }

        // Render scene
        const layer = session.renderState.baseLayer;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);

        for (const view of pose.views) {
            const viewport = layer.getViewport(view);
            this.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

            // Update camera
            this.camera.matrix.fromArray(view.transform.matrix);
            this.camera.projectionMatrix.fromArray(view.projectionMatrix);
            this.camera.updateMatrixWorld(true);

            // Render
            this.renderer.render(this.scene, this.camera);
        }
    }

    async stop() {
        if (this.xrSession) {
            await this.xrSession.end();
            this.xrSession = null;
        }

        // Clean up overlays
        this.hudOverlays.forEach(overlay => {
            this.scene.remove(overlay);
        });
        this.hudOverlays.clear();
    }
}
