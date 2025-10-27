// app.js - Main application entry point
import { DatabaseManager } from './database.js';
import { XRManager } from './xr-manager.js';
import { UIManager } from './ui-manager.js';
import { PersonTracker } from './person-tracker.js';

class XRMemoryApp {
    constructor() {
        this.db = new DatabaseManager();
        this.xrManager = null;
        this.uiManager = new UIManager(this);
        this.personTracker = null;
        this.isVRActive = false;
    }

    async init() {
        console.log('Initializing XR Memory Assistant...');
        
        // Initialize database
        await this.db.init();
        
        // Initialize UI
        this.uiManager.init();
        
        // Check WebXR support
        if (!navigator.xr) {
            this.uiManager.showError('WebXR is not supported in this browser. Please use a WebXR-compatible browser on Meta Quest.');
            return;
        }

        // Check for immersive-ar support
        try {
            const supported = await navigator.xr.isSessionSupported('immersive-ar');
            if (!supported) {
                this.uiManager.showError('Immersive AR is not supported. This app requires a Meta Quest 3 or 3S.');
                return;
            }
            console.log('WebXR AR supported!');
        } catch (error) {
            console.error('Error checking XR support:', error);
            this.uiManager.showError('Error checking WebXR support: ' + error.message);
        }
    }

    async startXR() {
        try {
            console.log('Starting XR session...');
            
            // Initialize XR Manager
            this.xrManager = new XRManager(this);
            await this.xrManager.init();
            
            // Initialize Person Tracker
            this.personTracker = new PersonTracker(this);
            await this.personTracker.init();
            
            this.isVRActive = true;
            this.uiManager.onXRStarted();
            
            console.log('XR session started successfully');
        } catch (error) {
            console.error('Error starting XR:', error);
            this.uiManager.showError('Failed to start XR session: ' + error.message);
        }
    }

    async stopXR() {
        console.log('Stopping XR session...');
        
        if (this.xrManager) {
            await this.xrManager.stop();
            this.xrManager = null;
        }
        
        if (this.personTracker) {
            this.personTracker.stop();
            this.personTracker = null;
        }
        
        this.isVRActive = false;
        this.uiManager.onXRStopped();
    }

    async updatePersonData(personId, updates) {
        await this.db.updatePerson(personId, updates);
        this.uiManager.refreshDashboard();
    }

    async deletePerson(personId) {
        await this.db.deletePerson(personId);
        this.uiManager.refreshDashboard();
    }

    async getAllPersons() {
        return await this.db.getAllPersons();
    }

    async getPersonById(personId) {
        return await this.db.getPersonById(personId);
    }

    getXRManager() {
        return this.xrManager;
    }

    getPersonTracker() {
        return this.personTracker;
    }
}

// Initialize app when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
    window.xrApp = new XRMemoryApp();
    await window.xrApp.init();
});
