# Quick Start Guide - XR Memory Assistant

Get up and running in 5 minutes!

## For Meta Quest Users

### Step 1: Deploy to Your Server
1. Upload the entire `tryagain` folder to your web server
2. Ensure HTTPS is enabled (required for WebXR)
3. Access via: `https://yourdomain.com/tryagain/`

**Need help?** See [CPANEL_SETUP.md](CPANEL_SETUP.md) for detailed cPanel instructions.

### Step 2: Access on Quest
1. Open **Meta Quest Browser** on your Quest 3/3S
2. Navigate to your website URL
3. Click **"Enter VR Mode"** button
4. Grant permissions when prompted
5. Put on your headset

### Step 3: Start Using
- Look around - the app will detect people (currently simulated)
- Color-coded bubbles appear above detected persons
- Hold **X/A button** + **← →** arrows to select people
- Click **📋 History** to view all encounters

## For Developers

### Local Development
```bash
# Navigate to folder
cd tryagain

# Start local server (choose one):
python3 -m http.server 8000
# OR
npx http-server -p 8000

# Access at: http://localhost:8000
```

### Testing
- Desktop: Use WebXR emulator extension
- Quest: Enable Developer Mode for debugging
- Console: Access via `window.xrApp`

## Main Features

### 🎯 Person Tracking
- Automatic detection in passthrough mode
- Color-coded encounter history:
  - 🔵 Blue = New (<2 encounters)
  - 🟡 Amber = Occasional (3-5)
  - 🔴 Red = Frequent (>5)

### 📋 Dashboard
- View all tracked persons
- Edit names, add notes, create tags
- See encounter statistics
- Memory trail replay

### 🎮 Controls
- **Hold X/A**: Enable selection mode
- **← → Arrows**: Navigate between persons
- **Release**: Select current person
- **📋 Button**: Open dashboard

### 🔒 Privacy
- All data stored **locally** on your device
- No cloud storage
- No data sharing
- No tracking

## Common Tasks

### Rename a Person
1. Open Dashboard (📋 button)
2. Find the person
3. Click "✏️ Rename"
4. Enter new name

### Add Notes
1. Open Dashboard
2. Click "📝 Add Note"
3. Type your note
4. Save

### View History
1. Click 📋 History button
2. Browse list (sorted by most recent)
3. See encounter count, last seen, locations

### Memory Trail
1. Open Dashboard
2. Click "👻 Memory Trail" on any person
3. See ghostly avatar at last known location (6 seconds)

## Troubleshooting

**App won't start in VR mode**
- ✅ Verify HTTPS is enabled
- ✅ Use Meta Quest Browser (not desktop)
- ✅ Update Quest firmware
- ✅ Grant camera/sensor permissions

**No persons detected**
- ⚠️ Current version uses simulated detection
- ⚠️ Production version needs MediaPipe integration
- ✅ See DEVELOPMENT.md for implementation details

**Dashboard is empty**
- ✅ No encounters recorded yet
- ✅ Enter VR mode and look around
- ✅ Wait for detection (simulated)

**Data disappeared**
- ⚠️ Clearing browser data deletes all records
- ⚠️ Data is stored locally per-device
- ✅ Export feature coming in future update

## File Structure
```
tryagain/
├── index.html          # Main page
├── css/styles.css      # Styling
├── js/
│   ├── app.js         # Main app
│   ├── database.js    # Data storage
│   ├── xr-manager.js  # WebXR handling
│   ├── person-tracker.js  # Detection
│   └── ui-manager.js  # Interface
└── docs/
    ├── README.md           # Full documentation
    ├── CPANEL_SETUP.md     # Hosting guide
    └── DEVELOPMENT.md      # Dev guide
```

## Next Steps

- 📖 Read [README.md](README.md) for full documentation
- 🚀 See [CPANEL_SETUP.md](CPANEL_SETUP.md) for deployment
- 💻 Check [DEVELOPMENT.md](DEVELOPMENT.md) for development

## Support

- **Issues**: Open on GitHub
- **Questions**: Check documentation
- **Updates**: Watch repository for releases

---

**Ready to start?** Click "Enter VR Mode" and experience augmented memory!

Version 1.0.0 | MIT License | Created by acesonder
