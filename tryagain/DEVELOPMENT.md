# Development Documentation

This document provides technical information for developers who want to understand, modify, or extend the XR Memory Assistant application.

## Architecture Overview

The application follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│           User Interface Layer              │
│  (HTML, CSS, UI Manager)                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Application Core (app.js)           │
│  - Coordinates all modules                  │
│  - Event handling                           │
│  - State management                         │
└─────┬────────┬────────┬──────────┬──────────┘
      │        │        │          │
      ▼        ▼        ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│ Database │ │   XR   │ │ Person │ │    UI    │
│ Manager  │ │Manager │ │Tracker │ │ Manager  │
└──────────┘ └────────┘ └────────┘ └──────────┘
      │         │          │           │
      ▼         ▼          ▼           ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│IndexedDB │ │ WebXR  │ │MediaPipe│ │   DOM    │
│   API    │ │  API   │ │  (TBD)  │ │Elements  │
└──────────┘ └────────┘ └────────┘ └──────────┘
```

## Module Documentation

### app.js - Application Core

**Purpose**: Main entry point and orchestration layer

**Key Responsibilities**:
- Initialize all subsystems
- Coordinate between modules
- Manage application lifecycle
- Handle global error states

**Main Class**: `XRMemoryApp`

**Methods**:
- `init()` - Initialize application
- `startXR()` - Start XR session
- `stopXR()` - End XR session
- `updatePersonData(id, updates)` - Update person record
- `getAllPersons()` - Retrieve all stored persons

**Events**:
- Application initialization
- XR session start/stop
- Data updates

### database.js - Data Persistence

**Purpose**: Manage local data storage using IndexedDB

**Key Responsibilities**:
- Store person records
- Query and retrieve data
- Update existing records
- Handle data migrations

**Main Class**: `DatabaseManager`

**Database Schema**:
```javascript
{
  id: number (auto-increment),
  name: string | null,
  timestamp: number (Unix timestamp),
  lastSeen: number (Unix timestamp),
  encounters: number,
  locations: string[],
  tags: string[],
  notes: string,
  conversationHistory: [
    {
      timestamp: number,
      content: string
    }
  ],
  features: object,
  clothing: string
}
```

**Methods**:
- `init()` - Initialize database
- `addPerson(data)` - Create new person record
- `updatePerson(id, updates)` - Update existing record
- `getAllPersons()` - Get all records
- `getPersonById(id)` - Get specific record
- `deletePerson(id)` - Remove record
- `incrementEncounter(id, location)` - Update encounter count
- `addConversation(id, conversation)` - Add conversation entry
- `searchPersons(query)` - Search records

### xr-manager.js - WebXR Session Management

**Purpose**: Handle WebXR API interactions and 3D rendering

**Key Responsibilities**:
- Create and manage XR sessions
- Render 3D scene with Three.js
- Create and update HUD overlays
- Handle controller input
- Manage spatial tracking

**Main Class**: `XRManager`

**Properties**:
- `xrSession` - Active WebXR session
- `scene` - Three.js scene
- `camera` - Three.js camera
- `renderer` - Three.js WebGL renderer
- `hudOverlays` - Map of person ID to 3D bubble objects
- `selectedPersonId` - Currently selected person

**Methods**:
- `init()` - Start XR session
- `setupThreeJS()` - Initialize 3D scene
- `setupInputHandling()` - Configure controllers
- `createHUDOverlay(data, position)` - Create 3D bubble
- `updateHUDOverlay(id, data)` - Update bubble appearance
- `removeHUDOverlay(id)` - Remove bubble
- `navigatePersons(direction)` - Cycle through persons
- `onXRFrame(time, frame)` - Render loop callback
- `stop()` - End XR session

**HUD Overlay Colors**:
```javascript
Blue (0x4a90e2)  - encounters < 2
Amber (0xf5a623) - encounters 3-5
Red (0xe74c3c)   - encounters > 5
```

### person-tracker.js - Human Detection

**Purpose**: Detect and track people in the environment

**Key Responsibilities**:
- Process camera feed (planned)
- Detect human poses using ML (planned)
- Match detected persons to database
- Update positions and tracking data

**Main Class**: `PersonTracker`

**Properties**:
- `detectedPersons` - Map of active detections
- `isTracking` - Tracking state flag
- `scanInterval` - Time between scans (ms)

**Methods**:
- `init()` - Initialize tracker
- `update(frame, pose)` - Process each frame
- `detectPerson(features, position)` - Handle detection
- `matchPerson(features)` - Match to existing record
- `manuallyTagPerson(position)` - Manual tagging
- `stop()` - Stop tracking

**Note**: Current version uses simulated detection. Production implementation should use:
- MediaPipe Pose Detection
- WebXR Hit Testing API
- Computer vision for feature extraction

### ui-manager.js - User Interface

**Purpose**: Manage DOM elements and user interactions

**Key Responsibilities**:
- Render dashboard and overlays
- Handle user input events
- Display notifications and errors
- Format data for presentation

**Main Class**: `UIManager`

**Methods**:
- `init()` - Initialize UI
- `showDashboard()` - Display person list
- `hideDashboard()` - Hide person list
- `refreshDashboard()` - Update person list
- `createPersonCard(person)` - Generate person UI card
- `handlePersonAction(action, id, person)` - Process user actions
- `playMemoryTrail(person)` - Activate memory replay
- `showError(message)` - Display error toast
- `formatLastSeen(timestamp)` - Format time strings

## Data Flow

### Person Detection Flow

```
1. XR Frame Update
   ↓
2. PersonTracker.update()
   ↓
3. Analyze camera feed (simulated)
   ↓
4. Extract features
   ↓
5. Match against database
   ↓
6a. Known Person → Update encounter
6b. New Person → Create record
   ↓
7. Create/Update HUD overlay
   ↓
8. Render in XR scene
```

### User Interaction Flow

```
1. User holds X/A button
   ↓
2. Input detected in XRManager
   ↓
3. Navigate persons with arrows
   ↓
4. Update HUD highlights
   ↓
5. User releases button
   ↓
6. Trigger interaction
   ↓
7. Display person details
```

### Dashboard Update Flow

```
1. User clicks "History" button
   ↓
2. UIManager.showDashboard()
   ↓
3. Database.getAllPersons()
   ↓
4. Sort by last seen
   ↓
5. Create person cards
   ↓
6. Render to DOM
   ↓
7. Attach event listeners
```

## Configuration Options

### Scan Interval

**File**: `js/person-tracker.js`
**Default**: 1000ms (1 second)

```javascript
this.scanInterval = 1000; // Adjust as needed
```

Lower values = more frequent scanning = higher CPU usage
Higher values = less frequent scanning = better battery life

### HUD Bubble Size

**File**: `js/xr-manager.js`

```javascript
const geometry = new THREE.SphereGeometry(0.3, 32, 32);
// First parameter is radius in meters
```

### Encounter Categories

**File**: `js/xr-manager.js`, `js/ui-manager.js`

```javascript
if (encounters < 2) {
    // New person
} else if (encounters <= 5) {
    // Occasional
} else {
    // Frequent
}
```

## Adding New Features

### Adding a New Data Field

1. **Update Database Schema** (`database.js`):
```javascript
const person = {
    ...personData,
    yourNewField: defaultValue // Add here
};
```

2. **Update UI Display** (`ui-manager.js`):
```javascript
<div>🆕 New Field: ${person.yourNewField}</div>
```

3. **Add Update Functionality** (`database.js`):
```javascript
async updateYourField(personId, value) {
    return this.updatePerson(personId, {
        yourNewField: value
    });
}
```

### Adding a New Action Button

1. **Update UI Card** (`ui-manager.js`):
```javascript
<button class="action-btn" 
        data-action="your-action" 
        data-id="${person.id}">
    🆕 Your Action
</button>
```

2. **Handle Action** (`ui-manager.js`):
```javascript
case 'your-action':
    await this.handleYourAction(personId, person);
    break;
```

3. **Implement Handler**:
```javascript
async handleYourAction(personId, person) {
    // Your logic here
    await this.app.updatePersonData(personId, updates);
}
```

### Integrating Real Computer Vision

To replace simulated detection with real CV:

1. **Add MediaPipe**:
```html
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/pose"></script>
```

2. **Initialize in PersonTracker** (`person-tracker.js`):
```javascript
async init() {
    this.pose = new Pose({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
    });
    
    this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    this.pose.onResults(this.onPoseResults.bind(this));
}
```

3. **Process Results**:
```javascript
onPoseResults(results) {
    if (results.poseLandmarks) {
        const features = this.extractFeatures(results);
        const position = this.calculatePosition(results);
        await this.detectPerson(features, position);
    }
}
```

## Testing

### Testing in Desktop Browser

While full XR functionality requires a headset, you can test the UI:

1. Comment out WebXR checks in `app.js`:
```javascript
// const supported = await navigator.xr.isSessionSupported('immersive-ar');
// if (!supported) { ... }
```

2. Use WebXR emulator extension for Chrome/Firefox

3. Test database operations in console:
```javascript
// Add test person
window.xrApp.db.addPerson({
    name: 'Test Person',
    location: 'Test Location',
    clothing: 'Blue shirt'
});

// Get all persons
window.xrApp.getAllPersons().then(console.log);
```

### Testing on Meta Quest

1. Enable Developer Mode on Quest
2. Use Quest's browser developer tools:
   - Settings → See All Settings → System → Developer
   - Enable USB Connection Dialog
3. Connect to Chrome DevTools via USB
4. Access console for debugging

### Common Test Cases

**Database Operations**:
- Add person
- Update person
- Delete person
- Search persons
- Increment encounters

**UI Interactions**:
- Open/close dashboard
- Rename person
- Add notes/tags
- Memory trail replay
- Navigation between persons

**XR Functionality**:
- Session start/stop
- HUD overlay creation
- Controller input
- Person selection

## Performance Optimization

### Database Queries

Use indexes for frequent queries:
```javascript
personStore.createIndex('lastSeen', 'lastSeen', { unique: false });
```

### 3D Rendering

Limit overlay complexity:
- Use simple geometries
- Reduce texture resolution
- Implement LOD (Level of Detail)
- Cull off-screen overlays

### Memory Management

Clean up resources:
```javascript
// Remove old overlays
this.hudOverlays.forEach(overlay => {
    overlay.geometry.dispose();
    overlay.material.dispose();
});
```

## Browser Compatibility

### Required APIs

- ✅ WebXR Device API
- ✅ WebGL 2.0
- ✅ IndexedDB
- ✅ ES6 Modules
- ✅ Async/Await

### Tested Browsers

- ✅ Meta Quest Browser (v28+)
- ✅ Firefox Reality
- ⚠️ Chrome (desktop - limited XR support)
- ❌ Safari (no WebXR support)

## Security Considerations

### Data Privacy

- All data stored locally (IndexedDB)
- No server communication
- No analytics tracking
- Clear data via browser settings

### Input Validation

Always validate user input:
```javascript
const sanitize = (input) => {
    return input.trim().substring(0, 200);
};

const newName = sanitize(prompt('Enter name:'));
```

### Content Security Policy

Recommended CSP header:
```
Content-Security-Policy: default-src 'self'; 
    script-src 'self' https://cdn.jsdelivr.net; 
    style-src 'self' 'unsafe-inline';
```

## Debugging Tips

### Enable Verbose Logging

Add to beginning of each module:
```javascript
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[ModuleName]', ...args);
```

### Common Issues

**IndexedDB not available**:
- Check HTTPS is enabled
- Verify browser supports IndexedDB
- Check browser's storage quota

**WebXR session fails**:
- Ensure HTTPS
- Check feature requirements
- Verify headset firmware
- Grant necessary permissions

**Three.js rendering issues**:
- Check WebGL context
- Verify XR compatibility
- Review console for errors

## Contributing Guidelines

### Code Style

- Use ES6+ features
- 4-space indentation
- Descriptive variable names
- Comments for complex logic
- JSDoc for public methods

### Example JSDoc:
```javascript
/**
 * Update a person's record in the database
 * @param {number} personId - The ID of the person to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated person object
 */
async updatePerson(personId, updates) {
    // Implementation
}
```

### Git Workflow

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit pull request

## Resources

### Documentation
- [WebXR Device API](https://immersive-web.github.io/webxr/)
- [Three.js Docs](https://threejs.org/docs/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MediaPipe](https://google.github.io/mediapipe/)

### Tools
- [WebXR Emulator](https://github.com/MozillaReality/WebXR-emulator-extension)
- [Three.js Editor](https://threejs.org/editor/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### Community
- [WebXR Discord](https://discord.gg/webxr)
- [Three.js Forum](https://discourse.threejs.org/)
- [Meta Quest Developer Forums](https://communityforums.atmeta.com/t5/Quest-Development/bd-p/quest-development)

## Future Roadmap

### Short Term (v1.1)
- [ ] Real MediaPipe integration
- [ ] Voice notes support
- [ ] Export/import data
- [ ] Improved UI/UX

### Medium Term (v1.2)
- [ ] Face recognition (with consent)
- [ ] GPS location tagging
- [ ] Calendar integration
- [ ] Customizable themes

### Long Term (v2.0)
- [ ] Multi-user mode (optional)
- [ ] Cloud backup (optional)
- [ ] Advanced analytics
- [ ] Mobile companion app

---

For questions or support, please open an issue on GitHub.
