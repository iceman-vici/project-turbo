# Turbo Chrome Extension

⚡ **Turbo** - Accelerate your browsing experience with intelligent performance optimizations.

## Features

- **🚀 Turbo Mode**: Core performance optimizations for faster page loads
- **💾 Smart Cache**: Intelligent resource caching to reduce load times
- **🔗 Link Preloading**: Preload links on hover for instant navigation
- **🖼️ Lazy Loading**: Load images only when they're about to be viewed
- **📊 Performance Metrics**: Real-time tracking of load times and data saved
- **⚙️ Customizable Settings**: Fine-tune performance options to your needs

## Installation

### Developer Mode Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The Turbo extension icon will appear in your browser toolbar

### From Chrome Web Store

*Coming soon*

## Usage

1. Click the Turbo extension icon in your toolbar to open the popup
2. Toggle features on/off as needed:
   - **Turbo Mode**: Main optimization switch
   - **Smart Cache**: Enable intelligent caching
   - **Preload Links**: Enable link preloading on hover
3. Click the Settings button to access advanced options
4. Monitor your performance improvements in real-time

## Configuration

### Basic Settings

- **Turbo Mode**: Enable/disable all performance optimizations
- **Smart Cache**: Cache static resources for faster repeat visits
- **Link Preloading**: Prefetch pages when hovering over links
- **Image Lazy Loading**: Defer image loading until needed

### Advanced Settings

- **Cache Duration**: How long to keep cached resources (1-168 hours)
- **Preload Delay**: Hover duration before preloading (0-1000ms)

## Performance Metrics

The extension tracks:
- Average page load time reduction
- Total data saved through caching
- Number of optimized pages
- Cache hit rate percentage

## Development

### Project Structure

```
project-turbo/
├── manifest.json       # Extension manifest
├── background.js       # Service worker for background tasks
├── content.js         # Content script for page optimizations
├── popup.html         # Extension popup interface
├── popup.js          # Popup functionality
├── popup.css         # Popup styles
├── options.html      # Settings page
├── options.js        # Settings functionality
├── options.css       # Settings page styles
└── README.md         # Documentation
```

### Building from Source

1. Clone the repository:
   ```bash
   git clone https://github.com/iceman-vici/project-turbo.git
   ```
2. Make your modifications
3. Test in Chrome using Developer Mode
4. Submit pull requests for improvements

## Privacy

Turbo respects your privacy:
- No personal data is collected or transmitted
- All optimizations happen locally in your browser
- Statistics are stored locally and never shared

## Browser Compatibility

- Chrome/Chromium 88+
- Edge 88+
- Other Chromium-based browsers

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions, please open an issue on GitHub.

---

Made with ⚡ by iceman-vici