# XRCapt Passthrough - Mixed Reality Suite for Meta Quest 3S

A comprehensive collection of WebXR passthrough applications designed specifically for the Meta Quest 3S, providing cutting-edge mixed reality experiences.

## 🌟 Overview

This suite includes 5 fully-functional web-based mixed reality applications:

1. **Main Passthrough App** - Base WebXR passthrough experience
2. **App 1: Object Detection MR** - Detects and tracks cars, humans, animals, and landmarks
3. **App 2: Photo Gallery MR** - Displays photos in HUD bubbles with sliding frame animations
4. **App 3: Object Statistics Tracker** - Comprehensive tracking with editable names and detailed stats
5. **App 4: Complete MR Experience** - All features combined in one powerful application

## 📁 Project Structure

```
passthrough/
├── index.html                    # Main passthrough app
├── app.js                       # Main app logic
├── CPANEL_INSTALL_GUIDE.md     # Deployment instructions
├── FUTURE_UPDATES.md           # Roadmap and planned features
├── README.md                   # This file
└── staging/
    ├── 1/                      # Object Detection App
    │   ├── index.html
    │   └── app.js
    ├── 2/                      # Photo Gallery App
    │   ├── index.html
    │   └── app.js
    ├── 3/                      # Statistics Tracker App
    │   ├── index.html
    │   └── app.js
    └── 4/                      # Complete MR Experience
        ├── index.html
        └── app.js
```

## ✨ Features

### Main Passthrough App
- ✅ WebXR passthrough mode support
- ✅ Session management
- ✅ Debug overlay
- ✅ Performance monitoring
- ✅ Clean UI with controls

### App 1: Object Detection MR
- 🎯 Detects multiple object types (cars, humans, animals, landmarks)
- 🎨 Color-coded HUD bubbles by object type
- 📊 Real-time detection statistics
- 🗂️ Object list with details
- 💾 Temporary local storage (clears on exit)

### App 2: Photo Gallery MR
- 📸 Photo capture simulation
- 🖼️ Sliding photo frames in HUD bubbles
- ⏱️ Auto-sliding gallery (3-second intervals)
- 📍 Location-based photo frames
- 🎞️ Multiple photos per object

### App 3: Object Statistics Tracker
- 📊 Detailed encounter statistics
- ✏️ Editable object names
- ⏰ Time-based tracking (first seen, last seen)
- 📈 Session analytics
- 📍 Location tracking with coordinates

### App 4: Complete MR Experience
- 🌟 All features from Apps 1-3 combined
- 📋 Unified dashboard with tabs
- 📊 Live statistics overlay
- 📷 Photo capture with object association
- 🎯 Comprehensive object detection and tracking
- ✏️ Full editing capabilities
- 📈 Advanced analytics

## 🚀 Quick Start

### Local Development

1. **Clone or download** this repository
2. **Start a local server**:

   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server -p 8000
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Access on Meta Quest 3S**:
   - Put on your headset
   - Open Meta Quest Browser
   - Navigate to `http://YOUR_IP:8000/passthrough/`

### cPanel Deployment

See [CPANEL_INSTALL_GUIDE.md](CPANEL_INSTALL_GUIDE.md) for detailed deployment instructions.

## 🎮 Usage

### Starting an App

1. Navigate to the desired app URL
2. Click "Enter AR Mode" / "Start Detection" / etc.
3. Grant necessary permissions if prompted
4. The AR session will start with passthrough enabled

### Controls

Each app has its own control panel with buttons for:
- Dashboard/Object List
- Debug/Statistics toggle
- Photo capture (where applicable)
- Exit AR

### Navigating the Dashboard

Apps 3 and 4 feature comprehensive dashboards:
- **Objects Tab**: View all detected objects
- **Photos Tab**: Browse captured photos (App 4 only)
- **Statistics Tab**: Detailed session analytics

### Editing Object Names

In Apps 3 and 4:
1. Open the dashboard
2. Navigate to Objects tab
3. Click "✏️ Rename" button
4. Enter new name
5. Changes update immediately in HUD

## 🔒 Privacy & Data

All applications use **local-only storage**:
- ✅ IndexedDB for temporary session data
- ✅ No cloud uploads or external storage
- ✅ Data cleared automatically on app exit
- ✅ No tracking or analytics sent anywhere
- ✅ 100% privacy-focused design

## 🛠️ Technical Details

### Technologies Used

- **WebXR Device API** - AR session management
- **Three.js (r128)** - 3D rendering and scene management
- **IndexedDB** - Local data storage
- **Canvas API** - HUD bubble rendering
- **Vanilla JavaScript** - No framework dependencies

### Browser Requirements

- ✅ Meta Quest Browser (Quest 3/3S)
- ✅ Chrome/Edge with WebXR emulator (development)
- ❌ Safari (no WebXR support)
- ❌ Firefox (limited WebXR support)

### Performance

- Target: 72+ FPS
- Recommended: Up to 10 active HUD bubbles
- Memory: ~50-100MB per app
- Storage: Temporary IndexedDB (cleared on exit)

## 🐛 Troubleshooting

### "WebXR not available"
- Ensure you're using HTTPS
- Verify you're on Meta Quest Browser
- Check Quest OS is up to date

### HUD bubbles not appearing
- Check debug console for errors
- Verify Three.js loaded successfully
- Try refreshing the page

### Performance issues
- Reduce number of active detections
- Close other apps/browser tabs
- Restart Meta Quest Browser

### Data not persisting
- **This is intentional!** Data clears on exit for privacy
- To save data permanently, see FUTURE_UPDATES.md for planned features

## 📚 Documentation

- [CPANEL_INSTALL_GUIDE.md](CPANEL_INSTALL_GUIDE.md) - Deployment guide
- [FUTURE_UPDATES.md](FUTURE_UPDATES.md) - Roadmap and planned features
- [../README.md](../README.md) - Main project README
- [../CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines

## 🎯 App-Specific URLs

After deployment to `https://yourdomain.com/`:

- Main: `https://yourdomain.com/passthrough/`
- App 1: `https://yourdomain.com/passthrough/staging/1/`
- App 2: `https://yourdomain.com/passthrough/staging/2/`
- App 3: `https://yourdomain.com/passthrough/staging/3/`
- App 4: `https://yourdomain.com/passthrough/staging/4/`

## 🔮 Future Enhancements

See [FUTURE_UPDATES.md](FUTURE_UPDATES.md) for a comprehensive roadmap including:
- Real ML-based object detection
- Actual camera integration
- Voice commands
- Cloud sync (optional)
- Advanced analytics
- Multi-user features
- And much more!

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md) for:
- Code of conduct
- Development setup
- Pull request process
- Bug reporting

## 📄 License

MIT License - See [LICENSE](../LICENSE) file for details

## 🙏 Acknowledgments

- **Meta Quest** - For WebXR and passthrough API
- **Three.js** - For 3D rendering capabilities
- **Open Source Community** - For tools and inspiration

## 📞 Support

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **Documentation**: Check this README and related docs

## ⚠️ Important Notes

1. **Simulated Detection**: Current object detection is simulated for demonstration. Real ML integration planned in Phase 1 (see FUTURE_UPDATES.md)

2. **HTTPS Required**: WebXR only works over HTTPS. Use SSL certificate for production deployment.

3. **Privacy First**: All data is stored locally and cleared on exit. This is intentional and by design.

4. **Quest 3S Optimized**: Apps are specifically designed and tested for Meta Quest 3S with latest OS.

5. **Active Development**: This is version 1.0. Check FUTURE_UPDATES.md for upcoming features.

## 🎓 Learning Resources

- [WebXR Device API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Three.js Documentation](https://threejs.org/docs/)
- [Meta Quest Developer Portal](https://developer.oculus.com/)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

**Built with ❤️ for the Meta Quest 3S community**

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Compatibility**: Meta Quest 3S (Latest OS)
