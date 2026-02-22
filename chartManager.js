/**
 * Chart.js Visualization Manager
 * Handles two separate stacked charts with common x-axis
 */

let chart1Instance = null;
let chart2Instance = null;

// Climb highlight plugin definition
const climbHighlightPlugin = {
    id: 'climbHighlight',
    beforeDatasetsDraw: (chart) => {
        if (!chart._climbRegions || chart._climbRegions.length === 0) {
            return;
        }
        
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const xScale = chart.scales.x;
        const color = chart._climbColor || 'rgba(255, 193, 7, 0.2)';
        
        ctx.save();
        
        chart._climbRegions.forEach((climb, index) => {
            const startX = xScale.getPixelForValue(climb.startDistance / 1000);
            const endX = xScale.getPixelForValue(climb.endDistance / 1000);
            
            // Draw background rectangle
            ctx.fillStyle = color;
            ctx.fillRect(
                startX,
                chartArea.top,
                endX - startX,
                chartArea.bottom - chartArea.top
            );
            
            // Draw climb number badge at top
            const centerX = (startX + endX) / 2;
            const badgeY = chartArea.top + 15;
            
            ctx.fillStyle = 'rgba(52, 73, 94, 0.9)';
            ctx.beginPath();
            ctx.arc(centerX, badgeY, 12, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((index + 1).toString(), centerX, badgeY);
        });
        
        ctx.restore();
    }
};

/**
 * Get common x-axis configuration
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @param {boolean} showTitle - Whether to show the title
 * @returns {Object} Chart.js x-axis configuration
 */
function getCommonXAxisConfig(maxDistanceKm, showTitle = true) {
    return {
        type: 'linear',
        min: 0,
        max: maxDistanceKm,
        title: {
            display: showTitle,
            text: 'Distance (km)',
            font: {
                size: 14,
                weight: 'bold'
            }
        },
        ticks: {
            callback: function(value) {
                return value.toFixed(1);
            }
        },
        grid: {
            color: 'rgba(0, 0, 0, 0.1)'
        }
    };
}

/**
 * Get common y-axis configuration
 * @param {string} title - Y-axis title
 * @returns {Object} Chart.js y-axis configuration
 */
function getCommonYAxisConfig(title) {
    return {
        title: {
            display: true,
            text: title,
            font: {
                size: 12,
                weight: 'bold'
            }
        },
        ticks: {
            callback: function(value) {
                return (value > 0 ? '+' : '') + Math.round(value) + ' m';
            }
        },
        grid: {
            color: 'rgba(0, 0, 0, 0.1)'
        }
    };
}

/**
 * Initialize both charts
 * @param {string} canvasId1 - ID of first canvas element
 * @param {string} canvasId2 - ID of second canvas element
 * @returns {Object} Both chart instances
 */
export function initChart(canvasId1, canvasId2) {
    const canvas1 = document.getElementById(canvasId1);
    const canvas2 = document.getElementById(canvasId2);
    
    if (!canvas1 || !canvas2) {
        throw new Error('Canvas elements not found');
    }
    
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    
    // Destroy existing charts if they exist
    if (chart1Instance) chart1Instance.destroy();
    if (chart2Instance) chart2Instance.destroy();
    
    // Common plugin configuration
    const commonPlugins = {
        legend: {
            display: true,
            position: 'top',
            labels: {
                font: { size: 13 },
                padding: 15,
                usePointStyle: true
            }
        },
        tooltip: {
            callbacks: {
                title: function(context) {
                    const distanceKm = context[0].parsed.x;
                    return `Distance: ${distanceKm.toFixed(2)} km`;
                },
                label: function(context) {
                    const elevation = context.parsed.y;
                    return `${context.dataset.label}: ${elevation > 0 ? '+' : ''}${elevation.toFixed(0)} m`;
                }
            }
        }
    };
    
    // Chart 1 configuration (top chart)
    chart1Instance = new Chart(ctx1, {
        type: 'line',
        data: { datasets: [] },
        plugins: [climbHighlightPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                ...commonPlugins,
                title: {
                    display: false
                }
            },
            scales: {
                x: getCommonXAxisConfig(10, false), // Hide x-axis title on top chart
                y: getCommonYAxisConfig('Elevation Change from Start (m)')
            }
        }
    });
    
    // Store climb color
    chart1Instance._climbColor = 'rgba(255, 193, 7, 0.2)';
    
    // Chart 2 configuration (bottom chart)
    chart2Instance = new Chart(ctx2, {
        type: 'line',
        data: { datasets: [] },
        plugins: [climbHighlightPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 3,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                ...commonPlugins,
                title: {
                    display: false
                }
            },
            scales: {
                x: getCommonXAxisConfig(10, true), // Show x-axis title on bottom chart
                y: getCommonYAxisConfig('Elevation Change from Start (m)')
            }
        }
    });
    
    // Store climb color
    chart2Instance._climbColor = 'rgba(255, 152, 0, 0.2)';
    
    return { chart1: chart1Instance, chart2: chart2Instance };
}

/**
 * Update charts with normalized track data
 * @param {Object} normalizedData - Data from normalizeTracks()
 * @param {Array} climbs1 - Optional array of climbs for track 1
 * @param {Array} climbs2 - Optional array of climbs for track 2
 */
export function updateChart(normalizedData, climbs1 = [], climbs2 = []) {
    if (!chart1Instance || !chart2Instance) {
        throw new Error('Charts not initialized. Call initChart() first.');
    }
    
    const { track1, track2, maxDistance } = normalizedData;
    const maxDistanceKm = maxDistance / 1000;
    
    // Update x-axis range for both charts
    chart1Instance.options.scales.x.max = maxDistanceKm;
    chart2Instance.options.scales.x.max = maxDistanceKm;
    
    // Store climbs for highlighting
    chart1Instance._climbRegions = climbs1;
    chart2Instance._climbRegions = climbs2;
    
    // Update Chart 1 (Track 1)
    chart1Instance.data.datasets = [{
        label: track1.label || 'Track 1',
        data: track1.data,
        borderColor: 'rgb(52, 152, 219)',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.1,
        fill: true
    }];
    
    // Update Chart 2 (Track 2)
    chart2Instance.data.datasets = [{
        label: track2.label || 'Track 2',
        data: track2.data,
        borderColor: 'rgb(231, 76, 60)',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.1,
        fill: true
    }];
    
    // Update both charts
    chart1Instance.update();
    chart2Instance.update();
}

/**
 * Clear both charts
 */
export function clearChart() {
    if (chart1Instance) {
        chart1Instance.data.datasets = [];
        chart1Instance.update();
    }
    if (chart2Instance) {
        chart2Instance.data.datasets = [];
        chart2Instance.update();
    }
}

/**
 * Get chart instances (for advanced customization)
 * @returns {Object} Both chart instances
 */
export function getChartInstance() {
    return { chart1: chart1Instance, chart2: chart2Instance };
}
