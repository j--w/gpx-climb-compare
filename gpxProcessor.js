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
 * @param {Object} options - Processing options
 * @returns {Object} {distances: [], elevations: [], stats: {}}
 */
export function processTrack(trackpoints, options = {}) {
    if (!trackpoints || trackpoints.length === 0) {
        throw new Error('No trackpoints to process');
    }
    
    const {
        smoothingWindow = 5,      // Number of points for moving average
        gainThreshold = 3         // Minimum gain in meters to count
    } = options;
    
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
    
    // Apply smoothing if requested
    const smoothedElevations = smoothingWindow > 0 
        ? smoothElevations(elevations, smoothingWindow) 
        : elevations;
    
    // Calculate statistics with smoothing
    const stats = calculateStats(smoothedElevations, distances, gainThreshold);
    
    return {
        distances,
        elevations: smoothedElevations,
        stats
    };
}

/**
 * Smooth elevation data using moving average
 * @param {Array} elevations - Array of elevation values
 * @param {number} windowSize - Size of the moving average window
 * @returns {Array} Smoothed elevation values
 */
function smoothElevations(elevations, windowSize) {
    if (windowSize <= 1 || elevations.length < windowSize) {
        return elevations;
    }
    
    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < elevations.length; i++) {
        // Determine window bounds
        const start = Math.max(0, i - halfWindow);
        const end = Math.min(elevations.length, i + halfWindow + 1);
        
        // Calculate average
        let sum = 0;
        let count = 0;
        for (let j = start; j < end; j++) {
            sum += elevations[j];
            count++;
        }
        
        smoothed.push(sum / count);
    }
    
    return smoothed;
}

/**
 * Calculate track statistics
 * @param {Array} elevations - Array of elevation values
 * @param {Array} distances - Array of distance values
 * @param {number} gainThreshold - Minimum elevation gain to count (meters)
 * @returns {Object} Statistics object
 */
function calculateStats(elevations, distances, gainThreshold = 0) {
    let elevationGain = 0;
    let elevationLoss = 0;
    let pendingGain = 0;
    let pendingLoss = 0;
    
    for (let i = 1; i < elevations.length; i++) {
        const diff = elevations[i] - elevations[i - 1];
        
        if (diff > 0) {
            pendingGain += diff;
            // If we've accumulated enough gain, count it
            if (pendingGain >= gainThreshold) {
                elevationGain += pendingGain;
                pendingGain = 0;
            }
            // Reset pending loss when going up
            if (pendingLoss >= gainThreshold) {
                elevationLoss += pendingLoss;
            }
            pendingLoss = 0;
        } else if (diff < 0) {
            pendingLoss += Math.abs(diff);
            // If we've accumulated enough loss, count it
            if (pendingLoss >= gainThreshold) {
                elevationLoss += pendingLoss;
                pendingLoss = 0;
            }
            // Reset pending gain when going down
            if (pendingGain >= gainThreshold) {
                elevationGain += pendingGain;
            }
            pendingGain = 0;
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

/**
 * Detect climbs in a track based on sustained elevation gain
 * @param {Array} distances - Array of distances in meters
 * @param {Array} elevations - Array of elevations in meters
 * @param {Object} options - Detection options
 * @returns {Array} Array of climb objects
 */
export function detectClimbs(distances, elevations, options = {}) {
    const {
        minGain = 100,        // Minimum elevation gain in meters
        minDistance = 500,    // Minimum distance in meters
        minGradient = 3,      // Minimum average gradient in %
        tolerance = 20        // Allow descent within climb (meters)
    } = options;
    
    const climbs = [];
    let climbStart = null;
    let climbStartElevation = null;
    let highestElevation = null;
    let highestIndex = null;
    
    for (let i = 0; i < elevations.length; i++) {
        const elevation = elevations[i];
        
        // Not currently in a climb
        if (climbStart === null) {
            // Start a potential climb if elevation is increasing
            if (i > 0 && elevation > elevations[i - 1]) {
                climbStart = i;
                climbStartElevation = elevations[i - 1];
                highestElevation = elevation;
                highestIndex = i;
            }
        } else {
            // Currently in a climb
            if (elevation > highestElevation) {
                highestElevation = elevation;
                highestIndex = i;
            }
            
            // Check if we've descended too much from the highest point
            const descentFromHigh = highestElevation - elevation;
            
            if (descentFromHigh > tolerance) {
                // End the climb at the highest point
                const gain = highestElevation - climbStartElevation;
                const distance = distances[highestIndex] - distances[climbStart];
                const avgGradient = (gain / distance) * 100;
                
                // Check if this climb meets our criteria
                if (gain >= minGain && distance >= minDistance && avgGradient >= minGradient) {
                    climbs.push({
                        startIndex: climbStart,
                        endIndex: highestIndex,
                        startDistance: distances[climbStart],
                        endDistance: distances[highestIndex],
                        startElevation: climbStartElevation,
                        endElevation: highestElevation,
                        gain,
                        distance,
                        avgGradient,
                        maxGradient: calculateMaxGradient(distances, elevations, climbStart, highestIndex)
                    });
                }
                
                // Reset for next climb
                climbStart = null;
                climbStartElevation = null;
                highestElevation = null;
                highestIndex = null;
            }
        }
    }
    
    // Check if we ended while still in a climb
    if (climbStart !== null) {
        const gain = highestElevation - climbStartElevation;
        const distance = distances[highestIndex] - distances[climbStart];
        const avgGradient = (gain / distance) * 100;
        
        if (gain >= minGain && distance >= minDistance && avgGradient >= minGradient) {
            climbs.push({
                startIndex: climbStart,
                endIndex: highestIndex,
                startDistance: distances[climbStart],
                endDistance: distances[highestIndex],
                startElevation: climbStartElevation,
                endElevation: highestElevation,
                gain,
                distance,
                avgGradient,
                maxGradient: calculateMaxGradient(distances, elevations, climbStart, highestIndex)
            });
        }
    }
    
    return climbs;
}

/**
 * Calculate maximum gradient in a segment
 * @param {Array} distances - Array of distances
 * @param {Array} elevations - Array of elevations
 * @param {number} startIndex - Start index
 * @param {number} endIndex - End index
 * @returns {number} Maximum gradient in %
 */
function calculateMaxGradient(distances, elevations, startIndex, endIndex) {
    let maxGradient = 0;
    const windowSize = 10; // Look at 10-point windows for max gradient
    
    for (let i = startIndex; i < endIndex - windowSize; i++) {
        const elevGain = elevations[i + windowSize] - elevations[i];
        const dist = distances[i + windowSize] - distances[i];
        if (dist > 0) {
            const gradient = (elevGain / dist) * 100;
            maxGradient = Math.max(maxGradient, gradient);
        }
    }
    
    return maxGradient;
}

/**
 * Match similar climbs between two tracks
 * @param {Array} climbs1 - Climbs from track 1
 * @param {Array} climbs2 - Climbs from track 2
 * @param {Object} options - Matching options
 * @returns {Array} Array of matched climb pairs
 */
export function matchClimbs(climbs1, climbs2, options = {}) {
    const {
        gainTolerance = 0.25,      // 25% tolerance for gain difference
        distanceTolerance = 0.25,  // 25% tolerance for distance difference
        gradientTolerance = 2      // 2% tolerance for gradient difference
    } = options;
    
    const matches = [];
    const used2 = new Set();
    
    for (const climb1 of climbs1) {
        let bestMatch = null;
        let bestScore = -1;
        
        for (let i = 0; i < climbs2.length; i++) {
            if (used2.has(i)) continue;
            
            const climb2 = climbs2[i];
            
            // Calculate similarity scores (0-1, higher is better)
            const gainDiff = Math.abs(climb1.gain - climb2.gain) / Math.max(climb1.gain, climb2.gain);
            const distDiff = Math.abs(climb1.distance - climb2.distance) / Math.max(climb1.distance, climb2.distance);
            const gradDiff = Math.abs(climb1.avgGradient - climb2.avgGradient);
            
            // Check if within tolerances
            if (gainDiff <= gainTolerance && 
                distDiff <= distanceTolerance && 
                gradDiff <= gradientTolerance) {
                
                // Calculate overall similarity score (inverse of differences)
                const score = (1 - gainDiff) * 0.4 + 
                             (1 - distDiff) * 0.3 + 
                             (1 - gradDiff / 10) * 0.3;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = { climb: climb2, index: i };
                }
            }
        }
        
        if (bestMatch) {
            matches.push({
                climb1,
                climb2: bestMatch.climb,
                similarityScore: bestScore
            });
            used2.add(bestMatch.index);
        }
    }
    
    return matches;
}

/**
 * Calculate climb difficulty score (0-100)
 * Based on combination of gain and gradient
 * @param {Object} climb - Climb object
 * @returns {number} Difficulty score
 */
export function calculateClimbDifficulty(climb) {
    // Fiets formula adaptation: (elevation gain ^ 2 * distance) / 1000
    // Normalized to 0-100 scale
    const score = Math.min(100, (Math.pow(climb.gain, 1.3) * climb.avgGradient) / 100);
    return Math.round(score);
}

/**
 * Format gradient for display
 * @param {number} gradient - Gradient in %
 * @returns {string} Formatted gradient string
 */
export function formatGradient(gradient) {
    return `${gradient.toFixed(1)}%`;
}
