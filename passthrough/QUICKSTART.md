# Quick Start Guide - XRCapt Passthrough

Get your XRCapt Passthrough apps running in under 5 minutes!

## 🚀 Fastest Path to Testing

### Option 1: Local Development (Recommended for Testing)

**Requirements**: Python installed on your computer

1. **Navigate to the passthrough folder**:
   ```bash
   cd passthrough
   ```

2. **Start a local server**:
   ```bash
   python -m http.server 8000
   ```
   Or if you have Python 2:
   ```bash
   python -m SimpleHTTPServer 8000
   ```

3. **Find your computer's IP address**:
   - **Windows**: Open Command Prompt → Type `ipconfig` → Look for "IPv4 Address"
   - **Mac**: System Preferences → Network → Your connection
   - **Linux**: Terminal → Type `hostname -I`

4. **On your Meta Quest 3S**:
   - Put on your headset
   - Open Meta Quest Browser
   - Go to: `http://YOUR_IP:8000/test-suite.html`
   - Example: `http://192.168.1.100:8000/test-suite.html`

5. **Choose an app and launch!**

**Note**: Local development works but WebXR features may be limited without HTTPS.

---

### Option 2: Deploy to cPanel (Production)

**Requirements**: cPanel hosting account

1. **Login to cPanel** → **File Manager**

2. **Navigate** to `public_html`

3. **Upload** the entire `passthrough` folder

4. **Set Permissions**:
   - Folders: 755
   - Files: 644

5. **Access** your apps:
   - Main: `https://yourdomain.com/passthrough/`
   - Test Suite: `https://yourdomain.com/passthrough/test-suite.html`

**Full details**: See [CPANEL_INSTALL_GUIDE.md](CPANEL_INSTALL_GUIDE.md)

---

## 📱 Testing on Meta Quest 3S

### Prerequisites
- Meta Quest 3S with latest OS
- Meta Quest Browser installed
- WiFi connection

### Steps
1. **Put on your headset**
2. **Open Meta Quest Browser** (not another browser)
3. **Navigate to your URL**:
   - Local: `http://YOUR_IP:8000/passthrough/`
   - Production: `https://yourdomain.com/passthrough/`
4. **Click "Enter AR Mode"** or equivalent button
5. **Grant permissions** if prompted
6. **Experience AR!**

---

## 🎯 Which App Should I Try First?

### For First-Time Users
**Start with**: App 4 (Complete MR Experience)
- Location: `passthrough/staging/4/`
- Has all features in one place
- Best demonstration of capabilities

### For Specific Features

**Object Detection Only** → App 1
- Location: `passthrough/staging/1/`
- Focus on detection and HUD bubbles

**Photo Gallery** → App 2
- Location: `passthrough/staging/2/`
- See sliding photo frames

**Statistics & Tracking** → App 3
- Location: `passthrough/staging/3/`
- Detailed analytics and editing

**Basic Passthrough** → Main App
- Location: `passthrough/`
- Simple AR foundation

---

## 🐛 Quick Troubleshooting

### "WebXR not available"
**Solution**: 
- Use HTTPS (not HTTP)
- Use Meta Quest Browser
- Update Quest OS to latest version

### Nothing appears in AR
**Solution**:
- Check browser console (F12 on desktop)
- Verify Three.js loaded successfully
- Try refreshing the page
- Check internet connection for CDN access

### App loads but no objects appear
**Solution**:
- **This is normal!** Objects are simulated and appear randomly
- Wait 2-3 seconds for first object
- Check debug overlay for detection count
- Maximum 6-10 objects at once

### Performance issues
**Solution**:
- Close other browser tabs
- Restart Meta Quest Browser
- Reduce number of active HUD bubbles
- Check WiFi signal strength

---

## 🎮 Basic Controls

### Common to All Apps
- **Start Button**: Enters AR/Passthrough mode
- **Exit Button**: Exits AR session
- **Debug/Stats Button**: Toggle information overlay

### App-Specific Controls

**App 1 (Object Detection)**
- 📋 Object List: View detected objects
- 🐛 Debug: Show debug information

**App 2 (Photo Gallery)**
- 📷 Capture: Take a photo
- 🖼️ Gallery: View photo list
- ℹ️ Info: Gallery statistics

**App 3 (Statistics)**
- 📊 Statistics: View session stats
- 📝 Object Details: Edit object names

**App 4 (Complete MR)**
- 📷 Capture: Take photos
- 📊 Dashboard: Access all features
- 📈 Stats: Live statistics

---

## 📚 Additional Resources

### Documentation
- [README.md](README.md) - Full documentation
- [CPANEL_INSTALL_GUIDE.md](CPANEL_INSTALL_GUIDE.md) - Deployment guide
- [FUTURE_UPDATES.md](FUTURE_UPDATES.md) - Roadmap
- [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md) - Technical details

### Online Resources
- [WebXR Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [Three.js Docs](https://threejs.org/docs/)
- [Meta Quest Developer Portal](https://developer.oculus.com/)

---

## ⚡ Power User Tips

### Use Test Suite
Access `passthrough/test-suite.html` for:
- Quick access to all apps
- Status verification
- Easy navigation

### Enable Debug Mode
Most apps have a debug overlay showing:
- FPS (frames per second)
- Object/detection counts
- Session status
- Error messages

### Keyboard Shortcuts (Desktop Testing)
- F12: Open browser console
- Ctrl+Shift+I: Developer tools
- F5: Refresh page
- Esc: Exit fullscreen (if applicable)

---

## 🔄 Quick App Comparison

| App | Objects | Photos | Stats | Editing | Complexity |
|-----|---------|--------|-------|---------|------------|
| Main | Basic demo | ❌ | ❌ | ❌ | ⭐ Simple |
| App 1 | ✅ Detection | ❌ | Basic | ❌ | ⭐⭐ Easy |
| App 2 | ❌ | ✅ Gallery | Basic | ❌ | ⭐⭐ Easy |
| App 3 | ✅ Detection | ❌ | ✅ Full | ✅ Names | ⭐⭐⭐ Medium |
| App 4 | ✅ Detection | ✅ Gallery | ✅ Full | ✅ All | ⭐⭐⭐⭐ Advanced |

---

## 🎯 Next Steps After Testing

1. **Gather Feedback**
   - Note what works well
   - Document any issues
   - Identify desired features

2. **Review Roadmap**
   - Check [FUTURE_UPDATES.md](FUTURE_UPDATES.md)
   - See planned enhancements
   - Provide input on priorities

3. **Production Deployment**
   - Follow [CPANEL_INSTALL_GUIDE.md](CPANEL_INSTALL_GUIDE.md)
   - Set up SSL/HTTPS
   - Configure domain

4. **Customization**
   - Modify colors/themes
   - Adjust detection intervals
   - Customize text/labels

---

## 💬 Need Help?

- **Issues**: Open a GitHub issue
- **Questions**: Check documentation first
- **Bugs**: Include browser console output
- **Features**: See FUTURE_UPDATES.md or request new ones

---

## ✅ Verification Checklist

Before reporting issues, verify:
- [ ] Using Meta Quest 3S with latest OS
- [ ] Using Meta Quest Browser (not another browser)
- [ ] Connected to stable WiFi
- [ ] HTTPS enabled (for production)
- [ ] Three.js loaded successfully (check console)
- [ ] Permissions granted when prompted
- [ ] Tried refreshing the page
- [ ] Checked debug overlay for errors

---

**Ready to start?** Open `test-suite.html` and launch your first app! 🚀

**Version**: 1.0.0  
**Last Updated**: October 2025
