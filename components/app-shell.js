import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import './settings-drawer.js';
import './file-uploader.js';
import './stats-display.js';
import './chart-display.js';
import './climbs-display.js';
import './descents-display.js';
import { parseGPX, processTrack, normalizeTracks, detectClimbs, detectDescents, matchClimbs, matchDescents } from '../gpxProcessor.js';

export class AppShell extends LitElement {
  static properties = {
    track1: { type: Object, state: true },
    track2: { type: Object, state: true },
    track1FileName: { type: String, state: true },
    track2FileName: { type: String, state: true },
    track1RawPoints: { type: Array, state: true },
    track2RawPoints: { type: Array, state: true },
    normalizedData: { type: Object, state: true },
    climbs1: { type: Array, state: true },
    climbs2: { type: Array, state: true },
    descents1: { type: Array, state: true },
    descents2: { type: Array, state: true },
    matchedClimbs: { type: Array, state: true },
    matchedDescents: { type: Array, state: true },
    errorMessage: { type: String, state: true },
    // Settings
    smoothingWindow: { type: Number, state: true },
    gainThreshold: { type: Number, state: true },
    minGain: { type: Number, state: true },
    minDistance: { type: Number, state: true },
    minGradient: { type: Number, state: true },
    tolerance: { type: Number, state: true },
    gainTolerance: { type: Number, state: true },
    distanceTolerance: { type: Number, state: true },
    gradientTolerance: { type: Number, state: true },
  };

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    
    .error-section {
      margin: 20px 0;
      padding: 15px 20px;
      background-color: #fee;
      border-left: 4px solid #e74c3c;
      border-radius: 6px;
      color: #c0392b;
    }
    
    .hidden {
      display: none;
    }
  `;

  constructor() {
    super();
    this.track1 = null;
    this.track2 = null;
    this.track1FileName = '';
    this.track2FileName = '';
    this.track1RawPoints = null;
    this.track2RawPoints = null;
    this.normalizedData = null;
    this.climbs1 = [];
    this.climbs2 = [];
    this.descents1 = [];
    this.descents2 = [];
    this.matchedClimbs = [];
    this.matchedDescents = [];
    this.errorMessage = '';
    
    // Default settings
    this.smoothingWindow = 5;
    this.gainThreshold = 3;
    this.minGain = 100;
    this.minDistance = 500;
    this.minGradient = 3;
    this.tolerance = 20;
    this.gainTolerance = 0.25;
    this.distanceTolerance = 0.25;
    this.gradientTolerance = 2;
  }

  render() {
    return html`
      <settings-drawer
        .smoothingWindow=${this.smoothingWindow}
        .gainThreshold=${this.gainThreshold}
        .minGain=${this.minGain}
        .minDistance=${this.minDistance}
        .minGradient=${this.minGradient}
        .tolerance=${this.tolerance}
        .gainTolerance=${this.gainTolerance}
        .distanceTolerance=${this.distanceTolerance}
        .gradientTolerance=${this.gradientTolerance}
        @settings-changed=${this._handleSettingsChange}
      ></settings-drawer>

      <file-uploader
        @file-uploaded=${this._handleFileUpload}
      ></file-uploader>

      ${this.errorMessage ? html`
        <div class="error-section">
          <p>${this.errorMessage}</p>
        </div>
      ` : ''}

      ${this.track1 || this.track2 ? html`
        <stats-display
          .track1Stats=${this.track1?.stats}
          .track2Stats=${this.track2?.stats}
          .track1Name=${this.track1FileName}
          .track2Name=${this.track2FileName}
        ></stats-display>
      ` : ''}

      ${this.normalizedData ? html`
        <chart-display
          .normalizedData=${this.normalizedData}
          .climbs1=${this.climbs1}
          .climbs2=${this.climbs2}
          .descents1=${this.descents1}
          .descents2=${this.descents2}
        ></chart-display>
      ` : ''}

      ${(this.climbs1.length > 0 || this.climbs2.length > 0) ? html`
        <climbs-display
          .climbs1=${this.climbs1}
          .climbs2=${this.climbs2}
          .matchedClimbs=${this.matchedClimbs}
          .track1Name=${this.track1FileName}
          .track2Name=${this.track2FileName}
        ></climbs-display>
      ` : ''}

      ${(this.descents1.length > 0 || this.descents2.length > 0) ? html`
        <descents-display
          .descents1=${this.descents1}
          .descents2=${this.descents2}
          .matchedDescents=${this.matchedDescents}
          .track1Name=${this.track1FileName}
          .track2Name=${this.track2FileName}
        ></descents-display>
      ` : ''}
    `;
  }

  async _handleFileUpload(e) {
    const { trackNumber, file, content } = e.detail;
    
    try {
      const trackpoints = parseGPX(content);
      const processedTrack = processTrack(trackpoints, {
        smoothingWindow: this.smoothingWindow,
        gainThreshold: this.gainThreshold
      });

      if (trackNumber === 1) {
        this.track1 = processedTrack;
        this.track1FileName = file.name;
        this.track1RawPoints = trackpoints;
      } else {
        this.track2 = processedTrack;
        this.track2FileName = file.name;
        this.track2RawPoints = trackpoints;
      }

      this.errorMessage = '';
      
      if (this.track1 && this.track2) {
        this._compareTracksAndVisualize();
      }
    } catch (error) {
      this.errorMessage = `Error processing ${file.name}: ${error.message}`;
      console.error('Error processing GPX file:', error);
    }
  }

  _handleSettingsChange(e) {
    const { type, settings } = e.detail;
    
    Object.assign(this, settings);
    
    if (type === 'smoothing') {
      this._reprocessTracks();
    } else if (this.track1 && this.track2) {
      this._compareTracksAndVisualize();
    }
  }

  _reprocessTracks() {
    if (!this.track1RawPoints && !this.track2RawPoints) return;

    try {
      if (this.track1RawPoints) {
        this.track1 = processTrack(this.track1RawPoints, {
          smoothingWindow: this.smoothingWindow,
          gainThreshold: this.gainThreshold
        });
      }

      if (this.track2RawPoints) {
        this.track2 = processTrack(this.track2RawPoints, {
          smoothingWindow: this.smoothingWindow,
          gainThreshold: this.gainThreshold
        });
      }

      if (this.track1 && this.track2) {
        this._compareTracksAndVisualize();
      }
    } catch (error) {
      this.errorMessage = `Error reprocessing: ${error.message}`;
      console.error('Error reprocessing tracks:', error);
    }
  }

  _compareTracksAndVisualize() {
    try {
      this.normalizedData = normalizeTracks(this.track1, this.track2);
      this.normalizedData.track1.label = this.track1FileName || 'Track 1';
      this.normalizedData.track2.label = this.track2FileName || 'Track 2';

      const detectionOptions = {
        minGain: this.minGain,
        minDistance: this.minDistance,
        minGradient: this.minGradient,
        tolerance: this.tolerance
      };

      this.climbs1 = detectClimbs(this.track1.distances, this.track1.elevations, detectionOptions);
      this.climbs2 = detectClimbs(this.track2.distances, this.track2.elevations, detectionOptions);
      
      this.descents1 = detectDescents(this.track1.distances, this.track1.elevations, {
        ...detectionOptions,
        minLoss: this.minGain
      });
      this.descents2 = detectDescents(this.track2.distances, this.track2.elevations, {
        ...detectionOptions,
        minLoss: this.minGain
      });

      const matchOptions = {
        gainTolerance: this.gainTolerance,
        distanceTolerance: this.distanceTolerance,
        gradientTolerance: this.gradientTolerance
      };

      this.matchedClimbs = matchClimbs(this.climbs1, this.climbs2, matchOptions);
      this.matchedDescents = matchDescents(this.descents1, this.descents2, {
        ...matchOptions,
        lossTolerance: this.gainTolerance
      });

      console.log('Tracks compared and visualized successfully');
    } catch (error) {
      this.errorMessage = `Error comparing tracks: ${error.message}`;
      console.error('Error comparing tracks:', error);
    }
  }
}

customElements.define('app-shell', AppShell);
