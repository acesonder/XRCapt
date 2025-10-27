# XRCapt - Developer Documentation

## Architecture Overview

XRCapt is a client-side WebXR application built with vanilla JavaScript, Three.js, and the WebXR Device API. It runs entirely in the browser with no backend dependencies.

### Technology Stack

- **WebXR Device API**: AR session management and device interaction
- **Three.js r128**: 3D rendering and scene management
- **IndexedDB**: Browser-based persistent storage
- **Canvas API**: Dynamic HUD texture generation
- **Gamepad API**: Controller input handling

## Core Components

### 1. XRCaptApp Class

Main application controller that orchestrates all functionality.

#### Key Properties

```javascript
{
  scene: THREE.Scene,           // Three.js scene
  camera: THREE.Camera,         // Main camera
  renderer: THREE.WebGLRenderer, // WebGL renderer
  xrSession: XRSession,         // Active XR session
  db: IDBDatabase,              // IndexedDB connection
  detectedPersons: Map,         // Active persons in view
  personHUDs: Map,              // HUD sprites and glows
  selectedPersonId: string,     // Currently selected person
  gamepadState: Object,         // Controller button states
  filters: Object               // Visibility filters
}
```

### 2. Database Schema

#### Persons ObjectStore

```javascript
{
  id: string,                   // Unique identifier (p_timestamp_random)
  name: string,                 // Display name
  firstSeen: timestamp,         // Unix timestamp of first encounter
  lastSeen: timestamp,          // Unix timestamp of last encounter
  encounterCount: number,       // Total number of encounters
  locations: Array[{            // History of location encounters
    timestamp: number,
    position: {x, y, z}
  }],
  tags: Array[string],          // Custom tags (future use)
  notes: string                 // User notes
}
```

#### Indexes
- `lastSeen`: For sorting by recency
- `encounterCount`: For filtering by frequency
- `name`: For searching by name

### 3. Person Detection System

#### Current Implementation (Simulated)

The `startPersonDetection()` method currently creates simulated person detections for demonstration:

```javascript
setInterval(() => {
    if (Math.random() > 0.95 && this.detectedPersons.size < 5) {
        this.detectNewPerson();
    }
}, 1000);
```

#### Production Implementation (To-Do)

Replace with actual ML-based detection:

```javascript
async detectRealPerson(frame) {
    // 1. Get camera frame
    const glBinding = new XRWebGLBinding(session, gl);
    const cameraTexture = glBinding.getCameraImage(view);
    
    // 2. Run ML model (e.g., MediaPipe, TensorFlow.js)
    const detections = await personDetector.detect(cameraTexture);
    
    // 3. Convert 2D detections to 3D positions
    detections.forEach(detection => {
        const worldPosition = this.screenToWorld(
            detection.boundingBox,
            frame
        );
        this.handlePersonDetection(worldPosition);
    });
}
```

### 4. HUD System

#### Canvas-Based Texture Generation

HUDs are created using HTML5 Canvas rendered onto Three.js sprites:

```javascript
createPersonHUD(personData, position) {
    // 1. Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 2. Draw speech bubble background
    this.drawSpeechBubble(ctx, ...);
    
    // 3. Add text content
    ctx.fillText(personData.name, ...);
    
    // 4. Create sprite from canvas texture
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(material);
    
    // 5. Position in 3D space
    sprite.position.set(x, y, z);
}
```

#### Color Coding Logic

```javascript
if (encounterCount <= 2) {
    color = '#2196F3'; // Blue - New
} else if (encounterCount <= 5) {
    color = '#ff9800'; // Amber - Occasional  
} else {
    color = '#f44336'; // Red - Frequent
}
```

### 5. Input Processing

#### Gamepad Button Mapping

Meta Quest Controllers:
- Button 4: X button (left controller)
- Button 5: A button (right controller)
- Axes 2: Thumbstick horizontal (left controller)
- Axes 3: Thumbstick vertical (left controller)

#### Selection State Machine

```
IDLE → (X/A press) → SELECTING → (arrow) → NAVIGATING → (release) → IDLE
                                    ↑           |
                                    └───────────┘
```

### 6. Filter System

Filters control HUD visibility in real-time:

```javascript
updateHUDVisibility() {
    this.detectedPersons.forEach((personData, id) => {
        let visible = true;
        
        if (!this.filters.showNew && personData.encounterCount <= 2) {
            visible = false;
        }
        // ... more filter checks
        
        hud.visible = visible;
    });
}
```

## Performance Considerations

### Optimization Strategies

1. **Sprite Billboarding**: HUDs always face camera, updated each frame
2. **Canvas Texture Caching**: Textures only regenerated when person data changes
3. **Culling**: Filter system removes non-visible HUDs from render
4. **Detection Throttling**: Person detection runs at limited frequency
5. **IndexedDB Indexes**: Fast queries by lastSeen and encounterCount

### Memory Management

- Maximum 5 simultaneous detections (configurable)
- HUDs removed when person leaves detection range
- Database records persist indefinitely (user-managed)

## Extension Points

### Adding Real Person Detection

1. **Install ML Library**:
```bash
npm install @mediapipe/pose @tensorflow/tfjs
```

2. **Replace Detection Method**:
```javascript
// In startPersonDetection()
import { Pose } from '@mediapipe/pose';

const pose = new Pose({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    }
});

pose.onResults((results) => {
    if (results.poseLandmarks) {
        this.handlePoseDetection(results);
    }
});
```

3. **Convert 2D to 3D**:
```javascript
screenToWorld(screenX, screenY, depth) {
    const ndc = new THREE.Vector3(
        (screenX / width) * 2 - 1,
        -(screenY / height) * 2 + 1,
        depth
    );
    
    ndc.unproject(this.camera);
    return ndc;
}
```

### Adding Facial Recognition

1. **Install Face Recognition Library**:
```bash
npm install face-api.js
```

2. **Implement Face Matching**:
```javascript
async findSimilarPerson(faceDescriptor) {
    const allPersons = await this.getAllPersons();
    
    for (const person of allPersons) {
        if (person.faceDescriptor) {
            const distance = this.euclideanDistance(
                faceDescriptor,
                person.faceDescriptor
            );
            
            if (distance < 0.6) { // Similarity threshold
                return person;
            }
        }
    }
    
    return null;
}
```

### Adding Voice Transcription

1. **Use Web Speech API**:
```javascript
startVoiceRecording(personId) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.saveConversation(personId, transcript);
    };
    
    recognition.start();
}
```

### Adding Spatial Audio

1. **Create Positional Audio**:
```javascript
createNotificationSound(position) {
    const listener = new THREE.AudioListener();
    this.camera.add(listener);
    
    const sound = new THREE.PositionalAudio(listener);
    const audioLoader = new THREE.AudioLoader();
    
    audioLoader.load('notification.mp3', (buffer) => {
        sound.setBuffer(buffer);
        sound.setRefDistance(20);
        sound.position.set(position.x, position.y, position.z);
        sound.play();
    });
}
```

## Testing

### Local Testing Without VR Headset

1. **Use WebXR Emulator**:
   - Install [WebXR API Emulator](https://chrome.google.com/webstore/detail/webxr-api-emulator/) Chrome extension
   - Select "Oculus Quest" device
   - Test AR interactions in desktop browser

2. **Mock Person Detection**:
   - Current implementation already includes simulated detection
   - Adjust detection frequency in `startPersonDetection()`

### Testing on Meta Quest

1. **Enable Developer Mode**:
   - Install Meta Quest Developer Hub
   - Enable developer mode in headset settings

2. **Access via WiFi**:
   - Find local IP: `ifconfig` or `ipconfig`
   - Serve on LAN: `python -m http.server 8000`
   - Navigate to `http://YOUR_IP:8000` in Quest Browser

3. **Debugging**:
   - Enable debug overlay in app
   - Use Chrome DevTools via USB connection
   - Check browser console for errors

## Security & Privacy

### Data Privacy

- **No Server Communication**: Zero network requests after initial page load
- **Local-Only Storage**: IndexedDB confined to browser origin
- **No Telemetry**: No analytics or tracking
- **User Control**: Full CRUD access to all stored data

### Best Practices

1. **Inform Users**: Clear privacy policy about local data storage
2. **Data Encryption**: Consider encrypting sensitive IndexedDB data
3. **Consent**: Request explicit consent before face recognition
4. **Data Retention**: Implement auto-cleanup of old records
5. **Export/Delete**: Provide data export and full deletion options

### GDPR Compliance

Even though data is local, consider:
- Right to access (export function)
- Right to erasure (delete all function)
- Data minimization (only collect necessary data)
- Purpose limitation (clear use case communication)

## Troubleshooting

### Common Issues

**WebXR Not Supported**
- Check browser compatibility (Meta Quest Browser, Chrome)
- Ensure HTTPS (required for WebXR)
- Update headset firmware

**IndexedDB Errors**
- Check browser storage quota
- Clear site data and retry
- Verify IndexedDB is enabled in browser settings

**Three.js Not Loading**
- Check CDN availability
- Use local copy if CDN blocked
- Verify script load order in HTML

**Person Detection Not Working**
- Check console for ML model errors
- Verify camera permissions granted
- Ensure adequate lighting conditions

**HUD Not Visible**
- Check filter settings
- Verify person is within detection range
- Inspect Three.js scene hierarchy

## Contributing

### Code Style

- ES6+ JavaScript
- 4-space indentation
- Descriptive variable names
- JSDoc comments for public methods

### Pull Request Guidelines

1. Test on actual Meta Quest device
2. Include screenshots/videos of changes
3. Update documentation
4. Maintain backward compatibility
5. Add inline comments for complex logic

## License

MIT License - See LICENSE file for full text.

## Resources

- [WebXR Device API Spec](https://www.w3.org/TR/webxr/)
- [Three.js Documentation](https://threejs.org/docs/)
- [IndexedDB API Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Meta Quest Development](https://developer.oculus.com/documentation/web/)
- [MediaPipe Solutions](https://google.github.io/mediapipe/)
