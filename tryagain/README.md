# XR Memory Assistant

A mixed-reality memory assistant that lets you visually "tag" people you meet in the real world using passthrough AR on the Meta Quest 3 / 3S.

## Overview

XR Memory Assistant helps you remember people you encounter in your daily life by:
- Detecting humans in your environment using passthrough mode
- Creating persistent local records with timestamp, location, and metadata
- Displaying in-scene speech-bubble overlays that change color based on encounter frequency
- Storing all data locally on your device (no cloud storage, complete privacy)

## Features

### Core Functionality
- **Passthrough AR Mode**: Uses Meta Quest 3/3S passthrough to overlay information on real-world people
- **Human Detection**: Continuously scans for people around you (simulated in current version)
- **Local Storage**: All data stored in browser IndexedDB - completely private
- **HUD Overlays**: Color-coded bubbles appear above detected persons:
  - 🔵 **Blue** = New (<2 encounters)
  - 🟡 **Amber** = Occasional (3-5 encounters)
  - 🔴 **Red** = Frequent (>5 encounters)

### Dashboard Features
- View all encountered persons, sorted by most recent
- See detailed information:
  - Name (editable)
  - Last seen timestamp
  - Encounter count
  - Location history
  - Custom tags and notes
  - Conversation history (if recorded)
- **Memory Trail Replay**: Spawns a translucent "ghost" avatar at last-known spot for 6 seconds

### Enhanced HUD Details
Each person overlay shows:
- Name or identifier
- Last seen time (e.g., "3h ago")
- Encounter count (e.g., "Seen 5× in 2 weeks")
- Last location
- Small circular avatar slot

### Interaction Controls
- Hold **X button** (right controller) or **A button** (left controller)
- Use **← →** arrows to navigate between detected persons
- Release button to select and view details
- Selected person glows with visual highlight

## Technical Stack

- **WebXR API**: For immersive AR sessions
- **Three.js**: 3D rendering and scene management
- **IndexedDB**: Local data persistence
- **MediaPipe** (planned): Human pose detection
- **Vanilla JavaScript**: No heavy framework dependencies

## Browser & Device Requirements

### Supported Devices
- Meta Quest 3
- Meta Quest 3S
- Other WebXR-compatible AR headsets

### Browser Requirements
- WebXR support (Meta Quest Browser, Firefox Reality, etc.)
- IndexedDB support
- WebGL support

## Installation Instructions

### Option 1: Local Development

1. **Clone or download** this repository
2. **Navigate** to the `tryagain` folder
3. **Serve** the files using a local web server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js http-server
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```
4. **Access** the app at `http://localhost:8000` in your Meta Quest browser

### Option 2: cPanel Deployment

See [CPANEL_SETUP.md](CPANEL_SETUP.md) for detailed cPanel installation instructions.

### Quick cPanel Steps:
1. Log into your cPanel account
2. Navigate to **File Manager**
3. Create a new folder (e.g., `xr-memory`)
4. Upload all files from the `tryagain` folder
5. Access via `https://yourdomain.com/xr-memory/`

## Usage Guide

### First Time Setup

1. **Open the app** on your Meta Quest browser
2. **Click "Enter VR Mode"** to start the AR session
3. **Allow permissions** for camera/sensors when prompted
4. **Put on your headset** and look around

### Tagging People

1. The app automatically detects people in your view
2. Color-coded bubbles appear above their heads
3. Use controller buttons to select and interact:
   - Hold **X/A button**
   - Press **← →** to cycle through detected persons
   - Release to select

### Managing Encounters

1. **Open Dashboard**: Click the "📋 History" button in VR
2. **View Details**: See all recorded encounters
3. **Edit Information**:
   - Rename people
   - Add notes
   - Add tags
   - View encounter history
4. **Memory Trail**: Replay where you last saw someone

### Privacy & Data

- All data is stored **locally** on your device
- No information is sent to servers
- No data is shared between users
- Clear your browser data to delete all records

## File Structure

```
tryagain/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # Application styles
├── js/
│   ├── app.js             # Main application entry point
│   ├── database.js        # IndexedDB management
│   ├── xr-manager.js      # WebXR session handling
│   ├── person-tracker.js  # Human detection logic
│   └── ui-manager.js      # UI and dashboard management
├── assets/                # Images and resources
├── README.md              # This file
├── CPANEL_SETUP.md        # cPanel installation guide
└── DEVELOPMENT.md         # Development documentation
```

## Configuration

### Scan Interval
Edit `js/person-tracker.js` to adjust detection frequency:
```javascript
this.scanInterval = 1000; // Milliseconds between scans
```

### HUD Colors
Edit `js/xr-manager.js` to customize bubble colors:
```javascript
// Blue for new encounters
if (encounters < 2) {
    color = 0x4a90e2;
}
```

## Future Enhancements

### Planned Features
- Real computer vision integration (MediaPipe)
- Face recognition (with consent)
- Clothing color detection
- GPS location tagging
- Voice notes support
- Export/import data
- Customizable HUD layouts
- Multi-language support

### Integration Opportunities
- Calendar integration
- Contact sync
- Social media linking (optional)
- Reminder system

## Troubleshooting

### App doesn't start
- Ensure you're using a WebXR-compatible browser on Meta Quest
- Check browser console for errors (F12 or Settings > Developer)
- Verify HTTPS is enabled (required for WebXR)

### No persons detected
- Current version uses simulated detection
- Production version will require MediaPipe integration
- Ensure camera permissions are granted

### Dashboard is empty
- No encounters have been recorded yet
- Try manually tagging a location using controllers

### Performance issues
- Reduce scan interval in settings
- Clear old encounter data
- Update Quest firmware

## Security & Privacy

This application takes privacy seriously:
- ✅ All data stored locally
- ✅ No cloud synchronization
- ✅ No analytics tracking
- ✅ No user accounts required
- ✅ No network requests (except CDN libraries)

### Data Storage
Data is stored in browser IndexedDB under the name `XRMemoryAssistant`. To clear:
1. Open Quest Browser settings
2. Privacy & Security > Clear browsing data
3. Select "Cookies and site data"

## Credits & License

**Created by**: acesonder
**License**: MIT (see LICENSE file)
**Version**: 1.0.0

### Third-Party Libraries
- Three.js (MIT License)
- MediaPipe (Apache 2.0) - planned integration

## Support & Contributing

### Getting Help
- Check troubleshooting section above
- Review console logs for errors
- Open an issue on GitHub

### Contributing
Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## Disclaimer

This application is for personal memory assistance only. Users are responsible for:
- Obtaining consent when recording information about others
- Complying with local privacy laws
- Using the app ethically and responsibly

The developers assume no liability for misuse of this application.

## Changelog

### Version 1.0.0 (2025-10-27)
- Initial release
- Core WebXR functionality
- Local IndexedDB storage
- Dashboard interface
- HUD overlay system
- Controller navigation
- Memory trail replay feature

---

For detailed development documentation, see [DEVELOPMENT.md](DEVELOPMENT.md)
For cPanel setup instructions, see [CPANEL_SETUP.md](CPANEL_SETUP.md)
