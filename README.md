# GPX Elevation Profile Comparison Tool

A client-side web application for comparing elevation profiles of two GPX tracks. Perfect for trail runners looking to find similar elevation profiles for training.

## Features

- 📊 **Side-by-side elevation comparison** - Overlay two GPX tracks on a single chart
- 📏 **Automatic normalization** - Scales both tracks to the longer track's distance
- 📈 **Track statistics** - View distance, elevation gain, and max elevation for each track
- 🎨 **Interactive charts** - Hover to see exact elevation at any point
- 🔒 **Privacy-focused** - All processing happens in your browser, no data uploaded

## Quick Start

### Option 1: Open Directly (Limited)

Simply open `index.html` in your browser. 

**Note:** ES6 modules may not work with `file://` protocol in some browsers.

### Option 2: Local Server (Recommended)

Run a local HTTP server to avoid CORS issues:

**Python 3:**
```bash
python3 -m http.server 8000
```

**Node.js (if you have http-server installed):**
```bash
npx http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

Then open: `http://localhost:8000`

## Usage

1. Click on "Track 1" area and select your first GPX file
2. Click on "Track 2" area and select your second GPX file
3. The elevation profiles will automatically display overlaid on the chart
4. View track statistics below the file inputs
5. Hover over the chart to see exact elevations at any distance

## Architecture

The project uses a clean separation of concerns:

- **`gpxProcessor.js`** - Data layer (library-agnostic)
  - GPX parsing and validation
  - Distance calculations using Haversine formula
  - Track normalization via linear interpolation
  - Statistics computation
  
- **`chartManager.js`** - Visualization layer (Chart.js)
  - Chart initialization and configuration
  - Data rendering
  - Can be swapped for D3.js or other libraries
  
- **`app.js`** - Application coordination
  - File upload handling
  - UI updates
  - Error handling

## Future Enhancements

Planned features for future versions:

- 🎯 **Automatic climb detection** - Identify and highlight similar climbing segments
- 🔄 **Drag-to-align** - Manually shift tracks to overlay specific segments
- 🗺️ **Map integration** - Show tracks on a map with synchronized chart interaction
- 📊 **Advanced statistics** - Gradient analysis, VAM (vertical meters per hour)
- 💾 **Export comparisons** - Save comparison results
- 📱 **Responsive design improvements** - Better mobile experience

## Technical Details

- **Zero dependencies** (except Chart.js via CDN)
- **No build process required**
- **Pure client-side processing**
- **Modular ES6 architecture**
- Works with standard GPX 1.0/1.1 files

## Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- GPX files with elevation data (`<ele>` tags)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Works (better with local server)

## License

MIT

## Notes

This tool is designed with extensibility in mind. The data processing layer is completely separate from visualization, making it easy to swap Chart.js for D3.js or other libraries when adding more advanced features like drag-to-align or climb detection.
