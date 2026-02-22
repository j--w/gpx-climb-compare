/**
 * GPX Data Processing Module
 * Library-agnostic data layer for parsing and processing GPX files
 */

/**
 * Parse GPX XML string and extract trackpoints
 * @param {string} xmlString - GPX file content as XML string
 * @returns {Array} Array of trackpoints with {lat, lon, elevation}
 */
export function parseGPX(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error('Invalid XML format');
    }
    
    // Get all trackpoints (trkpt elements)
    const trackpoints = xmlDoc.querySelectorAll('trkpt');
    
    if (trackpoints.length === 0) {
        throw new Error('No trackpoints found in GPX file');
    }
    
    const points = [];
    trackpoints.forEach(trkpt => {
        const lat = parseFloat(trkpt.getAttribute('lat'));
        const lon = parseFloat(trkpt.getAttribute('lon'));
        const eleElement = trkpt.querySelector('ele');
        
        if (!eleElement) {
            throw new Error('Missing elevation data in GPX file');
        }
        
        const elevation = parseFloat(eleElement.textContent);
        
        if (!isNaN(lat) && !isNaN(lon) && !isNaN(elevation)) {
            points.push({ lat, lon, elevation });
        }
    });
    
    if (points.length === 0) {
        throw new Error('No valid trackpoints with elevation data found');
    }
    
    return points;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

/**
 * Process trackpoints to calculate cumulative distances and extract elevations
 * @param {Array} trackpoints - Array of {lat, lon, elevation} objects
 * @returns {Object} {distances: [], elevations: [], stats: {}}
 */
export function processTrack(trackpoints) {
    if (!trackpoints || trackpoints.length === 0) {
        throw new Error('No trackpoints to process');
    }
    
    const distances = [0]; // Start at 0 meters
    const elevations = [trackpoints[0].elevation];
    let cumulativeDistance = 0;
    
    // Calculate cumulative distance for each point
    for (let i = 1; i < trackpoints.length; i++) {
        const prev = trackpoints[i - 1];
        const curr = trackpoints[i];
        
        const segmentDistance = calculateDistance(
            prev.lat, prev.lon,
            curr.lat, curr.lon
        );
        
        cumulativeDistance += segmentDistance;
        distances.push(cumulativeDistance);
        elevations.push(curr.elevation);
    }
    
    // Calculate statistics
    const stats = calculateStats(elevations, distances);
    
    return {
        distances,
        elevations,
        stats
    };
}

/**
 * Calculate track statistics
 * @param {Array} elevations - Array of elevation values
 * @param {Array} distances - Array of distance values
 * @returns {Object} Statistics object
 */
function calculateStats(elevations, distances) {
    let elevationGain = 0;
    let elevationLoss = 0;
    
    for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1];
        if (diff > 0) {
            elevationGain += diff;
        } else {
            elevationLoss += Math.abs(diff);
        }
    }
    
    return {
        totalDistance: distances[distances.length - 1],
        elevationGain,
        elevationLoss,
        maxElevation: Math.max(...elevations),
        minElevation: Math.min(...elevations)
    };
}

/**
 * Linear interpolation helper
 * @param {Array} xArray - Array of x values (must be sorted)
 * @param {Array} yArray - Array of y values
 * @param {number} x - X value to interpolate at
 * @returns {number} Interpolated y value
 */
function interpolate(xArray, yArray, x) {
    // Handle edge cases
    if (x <= xArray[0]) return yArray[0];
    if (x >= xArray[xArray.length - 1]) return yArray[yArray.length - 1];
    
    // Find the two points to interpolate between
    for (let i = 0; i < xArray.length - 1; i++) {
        if (x >= xArray[i] && x <= xArray[i + 1]) {
            const x0 = xArray[i];
            const x1 = xArray[i + 1];
            const y0 = yArray[i];
            const y1 = yArray[i + 1];
            
            // Linear interpolation formula
            return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
        }
    }
    
    return yArray[yArray.length - 1];
}

/**
 * Normalize two tracks to a common distance scale with relative elevation
 * Each track only includes points up to its actual distance (no flat-line extension)
 * Elevation is relative to starting point (baseline = 0)
 * @param {Object} track1 - First track {distances, elevations, stats}
 * @param {Object} track2 - Second track {distances, elevations, stats}
 * @returns {Object} Normalized data for both tracks
 */
export function normalizeTracks(track1, track2) {
    // Determine the longer track for the scale
    const maxDistance = Math.max(
        track1.stats.totalDistance,
        track2.stats.totalDistance
    );
    
    // Sample interval for interpolation
    const sampleInterval = 100; // meters
    
    // Helper function to create normalized data for a single track
    const normalizeTrack = (track) => {
        const numSamples = Math.ceil(track.stats.totalDistance / sampleInterval);
        const data = [];
        
        // Get baseline elevation (starting elevation)
        const baselineElevation = track.elevations[0];
        
        for (let i = 0; i <= numSamples; i++) {
            const distance = i * sampleInterval;
            // Only include points up to this track's actual distance
            if (distance <= track.stats.totalDistance) {
                const absoluteElevation = interpolate(track.distances, track.elevations, distance);
                // Convert to relative elevation from start
                const relativeElevation = absoluteElevation - baselineElevation;
                data.push({
                    x: distance / 1000, // Convert to km for display
                    y: relativeElevation
                });
            }
        }
        
        return data;
    };
    
    // Interpolate both tracks to their respective distances
    const track1Normalized = {
        data: normalizeTrack(track1),
        stats: track1.stats,
        label: 'Track 1'
    };
    
    const track2Normalized = {
        data: normalizeTrack(track2),
        stats: track2.stats,
        label: 'Track 2'
    };
    
    return {
        track1: track1Normalized,
        track2: track2Normalized,
        maxDistance
    };
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export function formatDistance(meters) {
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
}

/**
 * Format elevation for display
 * @param {number} meters - Elevation in meters
 * @returns {string} Formatted elevation string
 */
export function formatElevation(meters) {
    return `${Math.round(meters)} m`;
}
