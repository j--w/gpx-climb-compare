/**
 * Main Application Logic
 * Coordinates file uploads, data processing, and visualization
 */

import { parseGPX, processTrack, normalizeTracks, formatDistance, formatElevation } from './gpxProcessor.js';
import { initChart, updateChart, clearChart } from './chartManager.js';

// Application state
const state = {
    track1: null,
    track2: null,
    track1FileName: '',
    track2FileName: ''
};

// DOM elements
const gpx1Input = document.getElementById('gpx1');
const gpx2Input = document.getElementById('gpx2');
const file1Name = document.getElementById('file1-name');
const file2Name = document.getElementById('file2-name');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const statsSection = document.getElementById('stats-section');

/**
 * Initialize the application
 */
function init() {
    // Initialize both charts
    initChart('elevationChart1', 'elevationChart2');
    
    // Set up file input handlers
    gpx1Input.addEventListener('change', (e) => handleFileUpload(e, 1));
    gpx2Input.addEventListener('change', (e) => handleFileUpload(e, 2));
    
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
        
        // Parse and process GPX
        const trackpoints = parseGPX(fileContent);
        const processedTrack = processTrack(trackpoints);
        
        // Store in state
        if (trackNumber === 1) {
            state.track1 = processedTrack;
            state.track1FileName = file.name;
        } else {
            state.track2 = processedTrack;
            state.track2FileName = file.name;
        }
        
        // Clear any previous errors
        hideError();
        
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
        } else {
            state.track2 = null;
            state.track2FileName = '';
        }
        
        // Remove visual feedback
        label.classList.remove('file-selected');
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
        
        // Update chart
        updateChart(normalizedData);
        
        // Update statistics display
        updateStats(state.track1.stats, state.track2.stats);
        
        console.log('Tracks compared and visualized successfully');
        
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
