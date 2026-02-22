# GPX Elevation Profile Comparison Tool

A client-side web application for comparing elevation profiles of two GPX tracks. Perfect for trail runners looking to find similar elevation profiles for training.

## Features

- 📊 **Dual-chart comparison** - View tracks separately with common baseline and distance scale
- 📏 **Relative elevation** - Both tracks start at 0m for easy comparison regardless of absolute elevation
- 🏔️ **Automatic climb detection** - Identifies climbs >100m gain with >3% gradient
- 🔍 **Climb matching** - Finds similar climbs between tracks for training comparison
- 📈 **Climb statistics** - View gain, distance, gradient, and difficulty for each climb
- 🎨 **Visual highlighting** - Climbs are shaded on charts with numbered badges
- 📊 **Track statistics** - View distance, elevation gain, and max elevation for each track
- 🎯 **Interactive charts** - Hover to see exact elevation at any point
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
3. The elevation profiles will automatically display in two stacked charts with:
   - Relative elevation from each track's starting point
   - Common distance scale for easy comparison
   - Shaded regions highlighting detected climbs
4. View track statistics below the file inputs
5. Scroll down to see detailed climb analysis:
   - **Similar Climbs**: Matched climbs between both tracks with similarity scores
   - **Track 1 Climbs**: All detected climbs with difficulty ratings
   - **Track 2 Climbs**: All detected climbs with difficulty ratings
6. Hover over the chart to see exact elevations at any distance

### Climb Detection Criteria

Climbs are automatically detected based on:
- Minimum elevation gain: 100m
- Minimum distance: 0.5km
- Minimum average gradient: 3%
- Allows brief descents within a climb (20m tolerance)

Difficulty is calculated based on a combination of elevation gain and gradient.

## Architecture

The project uses a clean separation of concerns:

- **`gpxProcessor.js`** - Data layer (library-agnostic)
  - GPX parsing and validation
  - Distance calculations using Haversine formula
  - Track normalization via linear interpolation
  - Relative elevation calculation (common baseline)
  - Climb detection algorithm
  - Climb matching and similarity scoring
  - Statistics computation
  
- **`chartManager.js`** - Visualization layer (Chart.js)
  - Dual-chart initialization and configuration
  - Data rendering with climb highlighting
  - Visual annotations (numbered climb badges)
  - Can be swapped for D3.js or other libraries
  
- **`app.js`** - Application coordination
  - File upload handling
  - Climb detection and matching orchestration
  - UI updates (stats, climb tables)
  - Error handling

## Future Enhancements

Planned features for future versions:

- 🔄 **Drag-to-align** - Manually shift tracks horizontally to overlay specific climb segments
- 🗺️ **Map integration** - Show tracks on a map with synchronized chart interaction
- 📊 **Advanced statistics** - VAM (vertical meters per hour), gradient distribution analysis
- 🎯 **Climb filtering** - Filter/sort climbs by difficulty, gain, gradient
- 🔍 **Climb search** - Find climbs matching specific criteria (e.g., "200m gain, 8% grade")
- 💾 **Export comparisons** - Save comparison results and climb analysis
- 📱 **Responsive design improvements** - Better mobile experience
- 🎨 **Custom climb thresholds** - User-configurable detection parameters

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
