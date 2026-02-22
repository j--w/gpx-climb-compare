import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { formatDistance, formatElevation } from '../gpxProcessor.js';

export class StatsDisplay extends LitElement {
  static properties = {
    track1Stats: { type: Object },
    track2Stats: { type: Object },
    track1Name: { type: String },
    track2Name: { type: String },
  };

  static styles = css`
    .stats-section {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .stat-card {
      flex: 1;
      min-width: 300px;
      padding: 20px;
      background-color: white;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .stat-card h3 {
      color: #2c3e50;
      margin: 0 0 15px 0;
      font-size: 1.2rem;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #ecf0f1;
    }

    .stat-item:last-child {
      border-bottom: none;
    }

    .stat-label {
      font-weight: 600;
      color: #7f8c8d;
    }

    .stat-value {
      color: #2c3e50;
      font-weight: 700;
    }
  `;

  render() {
    if (!this.track1Stats && !this.track2Stats) return html``;

    return html`
      <section class="stats-section">
        ${this.track1Stats ? html`
          <div class="stat-card">
            <h3>${this.track1Name || 'Track 1'}</h3>
            <div class="stat-item">
              <span class="stat-label">Distance:</span>
              <span class="stat-value">${formatDistance(this.track1Stats.totalDistance)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Elevation Gain:</span>
              <span class="stat-value">${formatElevation(this.track1Stats.elevationGain)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Elevation Loss:</span>
              <span class="stat-value">${formatElevation(this.track1Stats.elevationLoss)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Max Elevation:</span>
              <span class="stat-value">${formatElevation(this.track1Stats.maxElevation)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Min Elevation:</span>
              <span class="stat-value">${formatElevation(this.track1Stats.minElevation)}</span>
            </div>
          </div>
        ` : ''}

        ${this.track2Stats ? html`
          <div class="stat-card">
            <h3>${this.track2Name || 'Track 2'}</h3>
            <div class="stat-item">
              <span class="stat-label">Distance:</span>
              <span class="stat-value">${formatDistance(this.track2Stats.totalDistance)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Elevation Gain:</span>
              <span class="stat-value">${formatElevation(this.track2Stats.elevationGain)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Elevation Loss:</span>
              <span class="stat-value">${formatElevation(this.track2Stats.elevationLoss)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Max Elevation:</span>
              <span class="stat-value">${formatElevation(this.track2Stats.maxElevation)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Min Elevation:</span>
              <span class="stat-value">${formatElevation(this.track2Stats.minElevation)}</span>
            </div>
          </div>
        ` : ''}
      </section>
    `;
  }
}

customElements.define('stats-display', StatsDisplay);
