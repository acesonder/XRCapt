# Contributing to XRCapt

Thank you for your interest in contributing to XRCapt! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Basic knowledge of JavaScript (ES6+)
- Understanding of WebXR and AR concepts
- Access to Meta Quest 3 or 3S for testing (optional but recommended)
- Git for version control

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/XRCapt.git
   cd XRCapt
   ```

2. **Start local development server**
   ```bash
   python -m http.server 8000
   # or
   npx http-server -p 8000
   ```

3. **Test in browser**
   - Desktop: `http://localhost:8000`
   - Quest: `http://YOUR_LOCAL_IP:8000`

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues. When creating a bug report, include:

- **Clear title**: Summarize the issue
- **Description**: Detailed description of the bug
- **Steps to reproduce**: Step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, headset model, OS version
- **Screenshots/Videos**: If applicable
- **Console errors**: Any error messages

### Suggesting Features

Feature requests are welcome! Please include:

- **Use case**: Why is this feature needed?
- **Description**: What should the feature do?
- **Alternatives**: Other solutions you've considered
- **Implementation ideas**: If you have technical suggestions

### Pull Requests

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test thoroughly**
   - Test on desktop browser with WebXR emulator
   - Test on actual Meta Quest device if possible
   - Verify no console errors
   - Check all affected features work

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: brief description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your feature branch
   - Fill in the PR template
   - Add screenshots/videos of changes

## Code Style Guidelines

### JavaScript

- **ES6+**: Use modern JavaScript features
- **Indentation**: 4 spaces (no tabs)
- **Naming**:
  - Classes: `PascalCase`
  - Functions/Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private properties: `_prefixWithUnderscore`
- **Comments**: 
  - Use JSDoc for public methods
  - Inline comments for complex logic
  - TODO comments for future work

Example:
```javascript
/**
 * Creates a HUD overlay for a detected person
 * @param {Object} personData - Person data from database
 * @param {Object} position - 3D position {x, y, z}
 * @returns {THREE.Sprite} The created HUD sprite
 */
createPersonHUD(personData, position) {
    // Create canvas texture
    const canvas = document.createElement('canvas');
    // ... implementation
}
```

### HTML/CSS

- **Indentation**: 4 spaces
- **Class names**: Use descriptive kebab-case
- **IDs**: Use camelCase
- **CSS**: Group related properties
- **Comments**: Section comments for major UI blocks

### File Organization

```
XRCapt/
├── index.html          # Main UI
├── app.js              # Application logic
├── config.json         # Configuration
├── README.md           # User documentation
├── DEVELOPER.md        # Developer documentation
├── CONTRIBUTING.md     # This file
└── LICENSE             # MIT License
```

## Development Workflow

### Adding New Features

1. **Plan**: Think through the feature design
2. **Branch**: Create feature branch
3. **Implement**: Write code following style guide
4. **Test**: Verify on desktop and Quest
5. **Document**: Update relevant documentation
6. **PR**: Submit pull request with description

### Testing Checklist

Before submitting a PR, verify:

- [ ] Code runs without errors in browser console
- [ ] WebXR session starts successfully
- [ ] All UI elements render correctly
- [ ] Database operations work (create, read, update, delete)
- [ ] HUD overlays display properly
- [ ] Filters work as expected
- [ ] Dashboard shows correct information
- [ ] No performance degradation
- [ ] Works on both desktop (emulator) and Quest
- [ ] Documentation updated if needed

## Priority Areas for Contribution

### High Priority

1. **Real Person Detection**: Integrate ML models (MediaPipe, TensorFlow.js)
2. **Facial Recognition**: Privacy-focused face matching
3. **Performance Optimization**: Improve rendering performance
4. **Testing Suite**: Add automated tests

### Medium Priority

1. **Voice Transcription**: Conversation recording
2. **Gesture Controls**: Hand tracking interactions
3. **Spatial Audio**: Positional audio cues
4. **Data Export/Import**: Backup and restore functionality

### Low Priority

1. **Themes**: UI color schemes
2. **Multi-language**: Internationalization
3. **Analytics Dashboard**: Encounter statistics
4. **Advanced Filters**: More filtering options

## ML Model Integration Guide

### Adding Person Detection

1. **Choose a model**:
   - MediaPipe Pose (lightweight)
   - TensorFlow.js PoseNet
   - Custom ONNX model

2. **Install dependencies**:
   ```bash
   npm install @mediapipe/pose
   ```

3. **Replace detection function**:
   ```javascript
   async detectRealPerson(frame) {
       // Get camera frame from WebXR
       const texture = this.getCameraTexture(frame);
       
       // Run ML model
       const results = await this.poseDetector.detect(texture);
       
       // Process results
       this.processPoseResults(results);
   }
   ```

4. **Test thoroughly**:
   - Check detection accuracy
   - Monitor performance impact
   - Verify battery usage acceptable

### Adding Facial Recognition

1. **Important**: Implement with privacy in mind
   - Request user consent
   - Store locally only
   - Allow opt-out
   - Provide clear explanations

2. **Implementation**:
   ```javascript
   async recognizeFace(imageData) {
       // Extract face descriptor
       const descriptor = await this.faceDetector.detectSingle(imageData);
       
       // Compare with stored descriptors
       const match = await this.findMatchingPerson(descriptor);
       
       return match;
   }
   ```

## Documentation Standards

### Code Comments

- **When to comment**:
  - Complex algorithms
  - Non-obvious logic
  - WebXR-specific code
  - ML model integration
  - Performance optimizations

- **When NOT to comment**:
  - Self-explanatory code
  - Simple getters/setters
  - Obvious operations

### README Updates

Update README.md when you:
- Add new features
- Change usage instructions
- Modify installation steps
- Update dependencies

### Developer Docs

Update DEVELOPER.md when you:
- Change architecture
- Add new modules
- Modify database schema
- Change API patterns

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

### Communication

- **Issues**: Use for bugs and feature requests
- **Discussions**: Use for questions and ideas
- **Pull Requests**: Use for code contributions
- **Comments**: Be constructive and helpful

## Questions?

If you have questions:

1. Check existing documentation
2. Search existing issues
3. Open a new discussion
4. Ask in pull request comments

## License

By contributing to XRCapt, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to XRCapt! 🎉
