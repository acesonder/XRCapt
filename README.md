# XRCapt - Person Memory Assistant

A mixed-reality memory assistant that lets you visually "tag" people you meet in the real world using passthrough AR on the Meta Quest 3 / 3S. Each tag creates a persistent local record — time, place, and metadata — with an in-scene speech-bubble overlay that changes color and message depending on whether the person is new or previously encountered.

## Features

### 🎯 Core Functionality
- **WebXR Passthrough Mode**: Full AR experience on Meta Quest 3/3S
- **Person Detection**: Continuously scans for people around you
- **Local Database**: All data stored locally using IndexedDB (no cloud storage)
- **Privacy-First**: No data shared between users or uploaded anywhere

### 🎨 Visual HUD Overlay
- **Speech Bubble Design**: Colored bubbles appear above detected people
- **Color-Coded System**:
  - 🔵 **Blue** = New (<2 encounters)
  - 🟠 **Amber** = Occasional (3-5 encounters)
  - 🔴 **Red** = Frequent (>5 encounters)
- **Real-Time Stats**: Shows name, last seen time, encounter count, and location
- **Glow Effects**: Visual highlights when selecting people

### 🎮 Interactive Controls
- **X/A Button Navigation**: Hold X or A button to enter selection mode
- **Left/Right Arrows**: Navigate between detected people
- **Visual Feedback**: Selected person glows with pulsing animation

### 📊 Dashboard & History
- **Encounter History**: View all people you've met, sorted by most recent
- **Detailed Stats**: See encounter count, first/last seen dates, time since last meeting
- **Rename Function**: Give custom names to people you meet
- **Add Notes**: Record conversation topics, context, or any information
- **Memory Trail Replay**: Spawns a translucent "ghost" avatar at last known location for 6 seconds

### 🔍 Smart Filtering
- **Show New**: Toggle visibility of people with <2 encounters
- **Show Known**: Toggle people with 3-5 encounters
- **Show Frequent**: Toggle people with >5 encounters  
- **Show Nearby**: Filter by proximity (<8m) - currently stubbed for future enhancement

### 🐛 Debug Overlay
- **WebXR Support Status**: Check if device supports WebXR AR
- **Session Lifecycle**: Monitor session start/end states
- **Error Messages**: See any errors directly in headset
- **Detection Count**: Live count of currently detected people

## Installation

### Prerequisites
- Meta Quest 3 or Meta Quest 3S headset
- Web browser with WebXR support (Meta Quest Browser)
- Local web server (for development/testing)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/acesonder/XRCapt.git
cd XRCapt
```

2. Serve the files using a local web server:

**Option A - Python:**
```bash
python -m http.server 8000
```

**Option B - Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Option C - PHP:**
```bash
php -S localhost:8000
```

3. On your Meta Quest headset:
   - Open the Meta Quest Browser
   - Navigate to your computer's IP address on port 8000 (e.g., `http://192.168.1.100:8000`)
   - Or use localhost if testing in browser: `http://localhost:8000`

## Usage

### Getting Started
1. Click "Enter AR Mode" on the start screen
2. Grant camera/sensor permissions if prompted
3. The AR session will start with passthrough enabled

### Basic Interaction
- **View Dashboard**: Click the 📋 Dashboard button in top-right
- **Toggle Debug Info**: Click 🐛 Debug button
- **Toggle Filters**: Click 🔍 Filters button
- **Select Person**: Hold X or A button, use left/right to navigate, release to deselect

### Managing Encounters
1. **Rename a Person**: 
   - Open dashboard
   - Click ✏️ Rename button
   - Enter new name
   
2. **Add Notes**:
   - Open dashboard
   - Click 📝 Add Note button
   - Enter your notes

3. **View Memory Trail**:
   - Open dashboard
   - Click 👻 Memory Trail button
   - A ghost avatar appears at last known location for 6 seconds

### Filters
- Access via 🔍 Filters button
- Check/uncheck categories to show/hide people
- Filters apply in real-time to HUD overlays

## Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **3D Rendering**: Three.js (r128)
- **Database**: IndexedDB for local storage
- **WebXR**: Native WebXR Device API

### Data Structure
Each person record contains:
```javascript
{
  id: "unique_identifier",
  name: "Person Name",
  firstSeen: timestamp,
  lastSeen: timestamp,
  encounterCount: number,
  locations: [
    { timestamp, position: {x, y, z} }
  ],
  tags: [],
  notes: "user notes"
}
```

### Browser Compatibility
- ✅ Meta Quest Browser (Quest 3/3S)
- ✅ Chrome/Edge with WebXR emulator (for development)
- ❌ Safari (WebXR not supported)
- ❌ Firefox (limited WebXR support)

## Development

### Person Detection
The current implementation uses a simulated person detection system for demonstration purposes. In a production version, this would be replaced with:
- Computer vision ML models (e.g., MediaPipe, TensorFlow.js)
- Facial recognition (with user consent)
- LIDAR/depth sensing for spatial awareness
- Hand-tracking for gesture controls

### Future Enhancements
- [ ] Real ML-based person detection
- [ ] Facial recognition with privacy controls
- [ ] Voice conversation transcription
- [ ] Spatial audio cues for nearby encounters
- [ ] Export/import data functionality
- [ ] Multi-language support
- [ ] Gesture-based controls
- [ ] Distance-based HUD scaling

## Privacy & Security

- **100% Local**: All data stored on device using IndexedDB
- **No Cloud**: Zero data transmission to external servers
- **No Sharing**: Each user's data is completely isolated
- **User Control**: Full ability to rename, edit, or delete any record
- **Transparent**: Open-source code for full audit capability

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Note**: This is a demonstration application. Person detection is simulated. For production use, implement proper computer vision ML models and ensure compliance with all privacy regulations in your jurisdiction.
