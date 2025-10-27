// ui-manager.js - User interface management
export class UIManager {
    constructor(app) {
        this.app = app;
        this.elements = {};
    }

    init() {
        // Get DOM elements
        this.elements.splashScreen = document.getElementById('splash-screen');
        this.elements.startXRBtn = document.getElementById('start-xr-btn');
        this.elements.dashboard = document.getElementById('dashboard');
        this.elements.closeDashboard = document.getElementById('close-dashboard');
        this.elements.openDashboardVR = document.getElementById('open-dashboard-vr');
        this.elements.personList = document.getElementById('person-list');
        this.elements.vrOverlay = document.getElementById('vr-overlay');
        this.elements.errorMessage = document.getElementById('error-message');

        // Set up event listeners
        this.setupEventListeners();

        console.log('UI Manager initialized');
    }

    setupEventListeners() {
        // Start XR button
        this.elements.startXRBtn.addEventListener('click', async () => {
            await this.app.startXR();
        });

        // Dashboard controls
        this.elements.closeDashboard.addEventListener('click', () => {
            this.hideDashboard();
        });

        this.elements.openDashboardVR.addEventListener('click', () => {
            this.showDashboard();
        });

        // Close dashboard on background click
        this.elements.dashboard.addEventListener('click', (e) => {
            if (e.target === this.elements.dashboard) {
                this.hideDashboard();
            }
        });
    }

    onXRStarted() {
        // Hide splash screen
        this.elements.splashScreen.classList.add('hidden');
        
        // Show VR overlay
        this.elements.vrOverlay.classList.remove('hidden');

        console.log('UI updated for XR mode');
    }

    onXRStopped() {
        // Show splash screen
        this.elements.splashScreen.classList.remove('hidden');
        
        // Hide VR overlay
        this.elements.vrOverlay.classList.add('hidden');
        
        // Hide dashboard
        this.hideDashboard();

        console.log('UI updated for non-XR mode');
    }

    async showDashboard() {
        await this.refreshDashboard();
        this.elements.dashboard.classList.remove('hidden');
    }

    hideDashboard() {
        this.elements.dashboard.classList.add('hidden');
    }

    async refreshDashboard() {
        const persons = await this.app.getAllPersons();
        this.renderPersonList(persons);
    }

    renderPersonList(persons) {
        this.elements.personList.innerHTML = '';

        if (persons.length === 0) {
            this.elements.personList.innerHTML = `
                <div style="text-align: center; padding: 2rem; opacity: 0.7;">
                    <p>No encounters recorded yet.</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem;">
                        Start detecting people in VR mode!
                    </p>
                </div>
            `;
            return;
        }

        persons.forEach(person => {
            const card = this.createPersonCard(person);
            this.elements.personList.appendChild(card);
        });
    }

    createPersonCard(person) {
        const card = document.createElement('div');
        card.className = 'person-card';
        
        // Determine category
        if (person.encounters < 2) {
            card.classList.add('new');
        } else if (person.encounters <= 5) {
            card.classList.add('occasional');
        } else {
            card.classList.add('frequent');
        }

        const lastSeenText = this.formatLastSeen(person.lastSeen);
        const firstSeenText = this.formatDate(person.timestamp);
        const locationText = person.locations[person.locations.length - 1] || 'Unknown';

        card.innerHTML = `
            <div class="person-header">
                <div class="person-name">${person.name || `Person #${person.id}`}</div>
                <div class="encounter-badge">${person.encounters}× encounters</div>
            </div>
            <div class="person-info">
                <div>📍 Last seen: ${lastSeenText}</div>
                <div>📅 First met: ${firstSeenText}</div>
                <div>🗺️ Location: ${locationText}</div>
                <div>👕 Clothing: ${person.clothing || 'Not recorded'}</div>
            </div>
            ${person.tags && person.tags.length > 0 ? `
                <div class="person-tags" style="margin-bottom: 1rem;">
                    ${person.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            ${person.notes ? `
                <div class="person-notes" style="margin-bottom: 1rem; font-style: italic; opacity: 0.8;">
                    "${person.notes}"
                </div>
            ` : ''}
            <div class="person-actions">
                <button class="action-btn" data-action="rename" data-id="${person.id}">
                    ✏️ Rename
                </button>
                <button class="action-btn" data-action="add-note" data-id="${person.id}">
                    📝 Add Note
                </button>
                <button class="action-btn" data-action="add-tag" data-id="${person.id}">
                    🏷️ Add Tag
                </button>
                <button class="action-btn" data-action="replay" data-id="${person.id}">
                    👻 Memory Trail
                </button>
                <button class="action-btn" data-action="delete" data-id="${person.id}" style="background: rgba(231, 76, 60, 0.2);">
                    🗑️ Delete
                </button>
            </div>
        `;

        // Add event listeners to action buttons
        card.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const personId = parseInt(e.currentTarget.dataset.id);
                this.handlePersonAction(action, personId, person);
            });
        });

        return card;
    }

    async handlePersonAction(action, personId, person) {
        switch (action) {
            case 'rename':
                const newName = prompt('Enter new name:', person.name || '');
                if (newName !== null && newName.trim()) {
                    await this.app.updatePersonData(personId, { name: newName.trim() });
                }
                break;

            case 'add-note':
                const note = prompt('Enter note:', person.notes || '');
                if (note !== null) {
                    await this.app.updatePersonData(personId, { notes: note });
                }
                break;

            case 'add-tag':
                const tag = prompt('Enter tag:');
                if (tag !== null && tag.trim()) {
                    const tags = person.tags || [];
                    tags.push(tag.trim());
                    await this.app.updatePersonData(personId, { tags: tags });
                }
                break;

            case 'replay':
                await this.playMemoryTrail(person);
                break;

            case 'delete':
                if (confirm(`Delete ${person.name || 'this person'}?`)) {
                    await this.app.deletePerson(personId);
                }
                break;
        }
    }

    async playMemoryTrail(person) {
        // Close dashboard
        this.hideDashboard();

        // Create ghost avatar at last known position
        if (this.app.isVRActive && this.app.xrManager) {
            this.showInfo('Playing memory trail for ' + (person.name || 'person'));
            
            // In production, this would:
            // 1. Get the last known 3D position
            // 2. Create a translucent avatar mesh
            // 3. Display it for 6 seconds
            // 4. Fade it out
            
            console.log('Memory trail replay:', person);
            
            // Simulate delay
            setTimeout(() => {
                this.showInfo('Memory trail ended');
            }, 6000);
        }
    }

    showPersonDetails(person) {
        const details = `
            Name: ${person.name || 'Unknown'}
            Encounters: ${person.encounters}
            Last Seen: ${this.formatLastSeen(person.lastSeen)}
        `;
        
        console.log('Person details:', details);
        // In VR, this could show a floating panel
    }

    formatLastSeen(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);

        if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
        
        setTimeout(() => {
            this.elements.errorMessage.classList.add('hidden');
        }, 5000);
    }

    showInfo(message) {
        console.log('Info:', message);
        // Could show a toast notification
    }
}
