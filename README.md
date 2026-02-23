# GPX Elevation Profile Comparison Tool

A client-side web application for comparing elevation profiles of two GPX tracks. Perfect for trail runners looking to find similar elevation profiles for training.

## Features

- 📊 **Dual-chart comparison** - View tracks separately with common baseline and distance scale
- 📏 **Relative elevation** - Both tracks start at 0m for easy comparison regardless of absolute elevation
- 🏔️ **Automatic climb detection** - Identifies climbs >100m gain with >3% gradient
- ⛰️ **Automatic descent detection** - Identifies significant descents with matching
- 🔍 **Similarity matching** - Finds similar climbs/descents between tracks for training comparison
- 📈 **Detailed statistics** - View gain, distance, gradient, and difficulty for each segment
- 🎨 **Visual highlighting** - Climbs and descents are shaded on charts with numbered badges
- ⚙️ **Configurable settings** - Adjust smoothing, detection thresholds, and matching tolerances
- 🎯 **Interactive charts** - Hover to see exact elevation at any point
- 🔒 **Privacy-focused** - All processing happens in your browser, no data uploaded
- ⚡ **Modern stack** - Built with Lit web components and buildless dev workflow

## Tech Stack

- **[Lit](https://lit.dev/)** - Fast, lightweight web components
- **[Chart.js](https://www.chartjs.org/)** - Interactive elevation charts
- **[@web/dev-server](https://modern-web.dev/docs/dev-server/overview/)** - Modern development server
- **[@web/test-runner](https://modern-web.dev/docs/test-runner/overview/)** - Fast test runner
- **[Rollup](https://rollupjs.org/)** - Production bundling

## Development

### Prerequisites

- Node.js 18+
- pnpm (or npm)

### Installation

```bash
pnpm install
```

This will install all dependencies and automatically download the Chromium browser for testing.

### Development Server

```bash
pnpm start
```

Runs the dev server at http://localhost:8000 with:
- ES module resolution
- Hot reloading
- No build step (buildless development)

### Build for Production

```bash
pnpm build
```

Creates an optimized production build in `dist/` with:
- Bundled and minified JavaScript
- Inlined dependencies
- Source maps

### Preview Production Build

```bash
pnpm preview
```

### Testing

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch
```

## Usage

## Usage

1. Load two GPX files using the file inputs
2. View automatic elevation comparison with highlighted climbs/descents
3. Adjust settings in the drawer to tune detection and matching
4. Review detected climbs/descents and matched segments

### Detection Settings

All thresholds are configurable in the Settings drawer:

**Smoothing:**
- Smoothing level: 0-15 points (reduce GPS noise)
- Gain threshold: Ignore elevation changes smaller than this

**Detection:**
- Minimum elevation change: 100m (default)
- Minimum distance: 0.5km (default)
- Minimum gradient: 3% (default)
- Tolerance: Allow brief opposite changes within a segment

**Similarity Matching:**
- Gain tolerance: 25% (default)
- Distance tolerance: 25% (default)
- Gradient tolerance: 2% (default)

## Architecture

**Component-Based Structure:**

```
components/
├── app-shell.js       # Main container, state management
├── settings-drawer.js # Collapsible settings panel
├── file-uploader.js   # File input handling
├── stats-display.js   # Track statistics cards
├── chart-display.js   # Chart.js wrapper
├── climbs-display.js  # Climb tables and matches
└── descents-display.js # Descent tables and matches
```

**Data Processing:**

- **`gpxProcessor.js`** - Core processing (library-agnostic)
  - GPX parsing and validation
  - Haversine distance calculations
  - Track normalization via linear interpolation
  - Climb/descent detection algorithms
  - Similarity matching and scoring
  
- **`chartManager.js`** - Visualization (Chart.js)
  - Dual-chart initialization
  - Climb/descent highlighting
  - Interactive tooltips

**Design Principles:**

- **Buildless development** - ES modules work directly in browser during dev
- **Event-driven** - Components communicate via custom events
- **State hoisting** - All state managed in app-shell component
- **Shadow DOM** - Conditionally disabled for Chart.js compatibility
- **Separation of concerns** - Data layer independent of UI framework

## Deployment

The production build bundles all dependencies into optimized files in `dist/`:

```bash
pnpm build
```

Then deploy the `dist/` folder to any static hosting service:

- **GitHub Pages**: Push `dist/` to `gh-pages` branch
- **Netlify**: Drag and drop `dist/` folder or connect to repo
- **Vercel**: Deploy with `vercel --prod`
- **Any static host**: Upload contents of `dist/`

The app is fully client-side with no backend requirements.

## Project Structure

```
├── components/           # Lit web components
├── test/                # Test files
├── gpxProcessor.js      # GPX parsing and processing
├── chartManager.js      # Chart.js visualization
├── index.html           # Entry point
├── package.json
├── rollup.config.js     # Production build config
├── web-dev-server.config.mjs
└── web-test-runner.config.mjs
```

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
