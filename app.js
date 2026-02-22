/**
 * Main Application Logic
 * Coordinates file uploads, data processing, and visualization
 */

import { 
    parseGPX, 
    processTrack, 
    normalizeTracks, 
    formatDistance, 
    formatElevation,
    detectClimbs,
    matchClimbs,
    calculateClimbDifficulty,
    formatGradient
} from './gpxProcessor.js';
import { initChart, updateChart, clearChart } from './chartManager.js';

// Application state
const state = {
    track1: null,
    track2: null,
    track1FileName: '',
    track2FileName: '',
    track1RawPoints: null,  // Store raw trackpoints for reprocessing
    track2RawPoints: null,
    smoothingWindow: 5,     // Default smoothing
    gainThreshold: 3        // Default threshold in meters
};

// DOM elements
const gpx1Input = document.getElementById('gpx1');
const gpx2Input = document.getElementById('gpx2');
const file1Name = document.getElementById('file1-name');
const file2Name = document.getElementById('file2-name');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const statsSection = document.getElementById('stats-section');
const smoothingSection = document.getElementById('smoothing-section');
const smoothingSlider = document.getElementById('smoothing-slider');
const smoothingValue = document.getElementById('smoothing-value');
const thresholdInput = document.getElementById('threshold-input');

/**
 * Initialize the application
 */
function init() {
    // Initialize both charts
    initChart('elevationChart1', 'elevationChart2');
    
    // Set up file input handlers
    gpx1Input.addEventListener('change', (e) => handleFileUpload(e, 1));
    gpx2Input.addEventListener('change', (e) => handleFileUpload(e, 2));
    
    // Set up smoothing controls
    smoothingSlider.addEventListener('input', handleSmoothingChange);
    thresholdInput.addEventListener('change', handleThresholdChange);
    
    // Update initial slider display
    updateSmoothingDisplay();
    
    console.log('GPX Elevation Comparison Tool initialized');
}

/**
 * Handle file upload
 * @param {Event} event - File input change event
 * @param {number} trackNumber - 1 or 2
 */
async function handleFileUpload(event, trackNumber) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Update UI to show file name
    const fileNameElement = trackNumber === 1 ? file1Name : file2Name;
    fileNameElement.textContent = file.name;
    
    // Add visual feedback
    const label = event.target.parentElement;
    label.classList.add('file-selected');
    
    try {
        // Read file contents
        const fileContent = await readFile(file);
        
        // Parse GPX and store raw trackpoints
        const trackpoints = parseGPX(fileContent);
        
        // Process with current smoothing settings
        const processedTrack = processTrack(trackpoints, {
            smoothingWindow: state.smoothingWindow,
            gainThreshold: state.gainThreshold
        });
        
        // Store in state
        if (trackNumber === 1) {
            state.track1 = processedTrack;
            state.track1FileName = file.name;
            state.track1RawPoints = trackpoints;  // Store raw for reprocessing
        } else {
            state.track2 = processedTrack;
            state.track2FileName = file.name;
            state.track2RawPoints = trackpoints;  // Store raw for reprocessing
        }
        
        // Clear any previous errors
        hideError();
        
        // Show smoothing controls once files are loaded
        if (state.track1 || state.track2) {
            smoothingSection.classList.remove('hidden');
        }
        
        // If both tracks are loaded, compare them
        if (state.track1 && state.track2) {
            compareTracksAndVisualize();
        }
        
    } catch (error) {
        console.error('Error processing GPX file:', error);
        showError(`Error processing ${file.name}: ${error.message}`);
        
        // Clear the failed track from state
        if (trackNumber === 1) {
            state.track1 = null;
            state.track1FileName = '';
            state.track1RawPoints = null;
        } else {
            state.track2 = null;
            state.track2FileName = '';
            state.track2RawPoints = null;
        }
        
        // Remove visual feedback
        label.classList.remove('file-selected');
    }
}

/**
 * Handle smoothing slider change
 */
function handleSmoothingChange() {
    state.smoothingWindow = parseInt(smoothingSlider.value);
    updateSmoothingDisplay();
    reprocessTracks();
}

/**
 * Handle threshold input change
 */
function handleThresholdChange() {
    state.gainThreshold = parseFloat(thresholdInput.value);
    reprocessTracks();
}

/**
 * Update smoothing display text
 */
function updateSmoothingDisplay() {
    const value = state.smoothingWindow;
    if (value === 0) {
        smoothingValue.textContent = 'None (Raw GPS)';
    } else {
        smoothingValue.textContent = `${value} points`;
    }
}

/**
 * Reprocess both tracks with current smoothing settings
 */
function reprocessTracks() {
    if (!state.track1RawPoints && !state.track2RawPoints) {
        return;  // No tracks to reprocess
    }
    
    try {
        // Reprocess track 1 if available
        if (state.track1RawPoints) {
            state.track1 = processTrack(state.track1RawPoints, {
                smoothingWindow: state.smoothingWindow,
                gainThreshold: state.gainThreshold
            });
        }
        
        // Reprocess track 2 if available
        if (state.track2RawPoints) {
            state.track2 = processTrack(state.track2RawPoints, {
                smoothingWindow: state.smoothingWindow,
                gainThreshold: state.gainThreshold
            });
        }
        
        // Update visualization if both tracks exist
        if (state.track1 && state.track2) {
            compareTracksAndVisualize();
        }
        
        console.log(`Reprocessed with smoothing=${state.smoothingWindow}, threshold=${state.gainThreshold}m`);
        
    } catch (error) {
        console.error('Error reprocessing tracks:', error);
        showError(`Error reprocessing: ${error.message}`);
    }
}

/**
 * Read file as text
 * @param {File} file - File object
 * @returns {Promise<string>} File contents
 */
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        
        reader.readAsText(file);
    });
}

/**
 * Compare tracks and update visualization
 */
function compareTracksAndVisualize() {
    try {
        // Normalize tracks to common distance scale
        const normalizedData = normalizeTracks(state.track1, state.track2);
        
        // Update track labels with file names
        normalizedData.track1.label = state.track1FileName || 'Track 1';
        normalizedData.track2.label = state.track2FileName || 'Track 2';
        
        // Detect climbs in both tracks
        const climbs1 = detectClimbs(state.track1.distances, state.track1.elevations, {
            minGain: 100,
            minDistance: 500,
            minGradient: 3,
            tolerance: 20
        });
        
        const climbs2 = detectClimbs(state.track2.distances, state.track2.elevations, {
            minGain: 100,
            minDistance: 500,
            minGradient: 3,
            tolerance: 20
        });
        
        // Match similar climbs between tracks
        const matchedClimbs = matchClimbs(climbs1, climbs2);
        
        // Update chart with climb highlighting
        updateChart(normalizedData, climbs1, climbs2);
        
        // Update statistics display
        updateStats(state.track1.stats, state.track2.stats);
        
        // Update climbs display
        updateClimbsDisplay(climbs1, climbs2, matchedClimbs);
        
        console.log('Tracks compared and visualized successfully');
        console.log(`Detected ${climbs1.length} climbs in Track 1, ${climbs2.length} climbs in Track 2`);
        console.log(`Matched ${matchedClimbs.length} similar climb pairs`);
        
    } catch (error) {
        console.error('Error comparing tracks:', error);
        showError(`Error comparing tracks: ${error.message}`);
    }
}

/**
 * Update statistics display
 * @param {Object} stats1 - Track 1 statistics
 * @param {Object} stats2 - Track 2 statistics
 */
function updateStats(stats1, stats2) {
    // Show stats section
    statsSection.classList.remove('hidden');
    
    // Update track names
    document.getElementById('track1-name').textContent = state.track1FileName || 'Track 1';
    document.getElementById('track2-name').textContent = state.track2FileName || 'Track 2';
    
    // Update Track 1 stats
    document.getElementById('distance1').textContent = formatDistance(stats1.totalDistance);
    document.getElementById('gain1').textContent = formatElevation(stats1.elevationGain);
    document.getElementById('max1').textContent = formatElevation(stats1.maxElevation);
    
    // Update Track 2 stats
    document.getElementById('distance2').textContent = formatDistance(stats2.totalDistance);
    document.getElementById('gain2').textContent = formatElevation(stats2.elevationGain);
    document.getElementById('max2').textContent = formatElevation(stats2.maxElevation);
}

/**
 * Update climbs display
 * @param {Array} climbs1 - Climbs from track 1
 * @param {Array} climbs2 - Climbs from track 2
 * @param {Array} matchedClimbs - Matched climb pairs
 */
function updateClimbsDisplay(climbs1, climbs2, matchedClimbs) {
    const climbsSection = document.getElementById('climbs-section');
    const climbsContent = document.getElementById('climbs-content');
    
    if (climbs1.length === 0 && climbs2.length === 0) {
        climbsSection.classList.add('hidden');
        return;
    }
    
    climbsSection.classList.remove('hidden');
    climbsContent.innerHTML = '';
    
    // Display matched climbs
    if (matchedClimbs.length > 0) {
        const matchedSection = document.createElement('div');
        matchedSection.className = 'climb-category';
        matchedSection.innerHTML = `
            <h3>
                Similar Climbs Between Tracks
                <span class="climb-category-badge matched-badge">${matchedClimbs.length} Matches</span>
            </h3>
            ${createMatchedClimbsTable(matchedClimbs, state.track1FileName, state.track2FileName)}
        `;
        climbsContent.appendChild(matchedSection);
    }
    
    // Display Track 1 and Track 2 climbs side by side
    if (climbs1.length > 0 || climbs2.length > 0) {
        const sideBySideContainer = document.createElement('div');
        sideBySideContainer.className = 'climbs-side-by-side';
        
        // Display all climbs from Track 1
        if (climbs1.length > 0) {
            const track1Section = document.createElement('div');
            track1Section.className = 'climb-category climb-category-half';
            const track1Name = state.track1FileName || 'Track 1';
            track1Section.innerHTML = `
                <h3>
                    ${track1Name}
                    <span class="climb-category-badge">${climbs1.length} Climbs</span>
                </h3>
                ${createClimbsTable(climbs1, 'track1')}
            `;
            sideBySideContainer.appendChild(track1Section);
        }
        
        // Display all climbs from Track 2
        if (climbs2.length > 0) {
            const track2Section = document.createElement('div');
            track2Section.className = 'climb-category climb-category-half';
            const track2Name = state.track2FileName || 'Track 2';
            track2Section.innerHTML = `
                <h3>
                    ${track2Name}
                    <span class="climb-category-badge">${climbs2.length} Climbs</span>
                </h3>
                ${createClimbsTable(climbs2, 'track2')}
            `;
            sideBySideContainer.appendChild(track2Section);
        }
        
        climbsContent.appendChild(sideBySideContainer);
    }
}

/**
 * Create HTML table for matched climbs
 * @param {Array} matchedClimbs - Array of matched climb pairs
 * @param {string} track1Name - Name of track 1
 * @param {string} track2Name - Name of track 2
 * @returns {string} HTML string
 */
function createMatchedClimbsTable(matchedClimbs, track1Name, track2Name) {
    const t1Name = track1Name || 'Track 1';
    const t2Name = track2Name || 'Track 2';
    
    const rows = matchedClimbs.map((match, index) => {
        const c1 = match.climb1;
        const c2 = match.climb2;
        const similarity = Math.round(match.similarityScore * 100);
        
        return `
            <tr>
                <td><span class="climb-number">${index + 1}</span></td>
                <td>
                    ${t1Name}: ${formatDistance(c1.startDistance)} - ${formatDistance(c1.endDistance)}<br>
                    ${t2Name}: ${formatDistance(c2.startDistance)} - ${formatDistance(c2.endDistance)}
                </td>
                <td>
                    ${t1Name}: ${formatElevation(c1.gain)}<br>
                    ${t2Name}: ${formatElevation(c2.gain)}
                </td>
                <td>
                    ${t1Name}: ${formatDistance(c1.distance)}<br>
                    ${t2Name}: ${formatDistance(c2.distance)}
                </td>
                <td>
                    ${t1Name}: ${formatGradient(c1.avgGradient)}<br>
                    ${t2Name}: ${formatGradient(c2.avgGradient)}
                </td>
                <td>
                    <div class="similarity-indicator">
                        ${similarity}%
                        <div class="similarity-bar">
                            <div class="similarity-fill" style="width: ${similarity}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    return `
        <table class="climb-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Location</th>
                    <th>Gain</th>
                    <th>Distance</th>
                    <th>Avg Grade</th>
                    <th>Similarity</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

/**
 * Create HTML table for climbs
 * @param {Array} climbs - Array of climb objects
 * @param {string} trackClass - CSS class for track identification
 * @returns {string} HTML string
 */
function createClimbsTable(climbs, trackClass) {
    const rows = climbs.map((climb, index) => {
        const difficulty = calculateClimbDifficulty(climb);
        const difficultyClass = difficulty < 30 ? 'difficulty-easy' : 
                               difficulty < 60 ? 'difficulty-moderate' : 
                               'difficulty-hard';
        const difficultyLabel = difficulty < 30 ? 'Easy' : 
                               difficulty < 60 ? 'Moderate' : 
                               'Hard';
        
        return `
            <tr>
                <td><span class="climb-number ${trackClass}-climb">${index + 1}</span></td>
                <td>${formatDistance(climb.startDistance)} - ${formatDistance(climb.endDistance)}</td>
                <td>${formatElevation(climb.gain)}</td>
                <td>${formatDistance(climb.distance)}</td>
                <td>${formatGradient(climb.avgGradient)}</td>
                <td>${formatGradient(climb.maxGradient)}</td>
                <td>
                    <span class="climb-difficulty ${difficultyClass}">
                        ${difficultyLabel} (${difficulty})
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    return `
        <table class="climb-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Location</th>
                    <th>Gain</th>
                    <th>Distance</th>
                    <th>Avg Grade</th>
                    <th>Max Grade</th>
                    <th>Difficulty</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
    errorSection.classList.add('hidden');
    errorMessage.textContent = '';
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
