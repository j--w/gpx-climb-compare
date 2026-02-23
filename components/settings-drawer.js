import { LitElement, html, css } from 'lit';

export class SettingsDrawer extends LitElement {
  static properties = {
    isOpen: { type: Boolean, state: true },
    smoothingWindow: { type: Number },
    gainThreshold: { type: Number },
    minGain: { type: Number },
    minDistance: { type: Number },
    minGradient: { type: Number },
    tolerance: { type: Number },
    gainTolerance: { type: Number },
    distanceTolerance: { type: Number },
    gradientTolerance: { type: Number },
  };

  static styles = css`
    .help-section {
      margin-bottom: 20px;
    }

    .help-toggle {
      width: 100%;
      padding: 15px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .help-toggle:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .help-icon {
      font-size: 1.2rem;
    }

    .help-content {
      margin-top: 15px;
      padding: 25px;
      background-color: white;
      border-radius: 6px;
      border: 2px solid #667eea;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .help-sections {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .help-section-group {
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }

    .help-section-group h3 {
      color: #2c3e50;
      font-size: 1.2rem;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-icon {
      font-size: 1.3rem;
    }

    .section-description {
      color: #7f8c8d;
      font-size: 0.9rem;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .smoothing-controls,
    .detection-controls {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .detection-controls {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 15px;
    }

    .control-group {
      background-color: white;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }

    .control-group label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 8px;
    }

    .control-label {
      flex: 1;
    }

    input[type="number"],
    input[type="range"] {
      padding: 5px 10px;
      border: 2px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      text-align: center;
    }

    input[type="number"]:focus {
      outline: none;
      border-color: #e67e22;
    }

    .control-description {
      font-size: 0.8rem;
      color: #7f8c8d;
      margin: 0;
    }

    .hidden {
      display: none;
    }
  `;

  constructor() {
    super();
    this.isOpen = false;
  }

  render() {
    return html`
      <section class="help-section">
        <button class="help-toggle" @click=${this._toggleDrawer}>
          <span class="help-icon">${this.isOpen ? '✖️' : '⚙️'}</span>
          ${this.isOpen ? 'Close' : 'Settings & Help'}
        </button>
        
        <div class="help-content ${this.isOpen ? '' : 'hidden'}">
          <div class="help-sections">
            ${this._renderSmoothingSection()}
            ${this._renderDetectionSection()}
            ${this._renderSimilaritySection()}
            ${this._renderHelpSection()}
          </div>
        </div>
      </section>
    `;
  }

  _renderSmoothingSection() {
    return html`
      <div class="help-section-group">
        <h3><span class="section-icon">🎚️</span> Smoothing & Elevation Settings</h3>
        <p class="section-description">
          GPS elevation data contains noise. Adjust these to match your data quality.
        </p>
        <div class="smoothing-controls">
          <div class="control-group">
            <label>
              <span class="control-label">Smoothing Level: ${this.smoothingWindow} points</span>
            </label>
            <input
              type="range"
              min="0"
              max="15"
              .value=${this.smoothingWindow}
              @input=${this._handleSmoothingChange}
            />
          </div>
          <div class="control-group">
            <label>
              <span class="control-label">Gain Threshold:</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                .value=${this.gainThreshold}
                @input=${this._handleThresholdChange}
              />
              <span>meters</span>
            </label>
            <p class="control-description">Ignore elevation changes smaller than this value</p>
          </div>
        </div>
      </div>
    `;
  }

  _renderDetectionSection() {
    return html`
      <div class="help-section-group">
        <h3><span class="section-icon">🏔️</span> Climb & Descent Detection</h3>
        <p class="section-description">
          Adjust thresholds for what qualifies as a notable climb or descent.
        </p>
        <div class="detection-controls">
          <div class="control-group">
            <label>
              <span class="control-label">Min Elevation Change:</span>
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                .value=${this.minGain}
                @input=${this._handleDetectionChange}
                data-field="minGain"
              />
              <span>meters</span>
            </label>
            <p class="control-description">Minimum gain/loss to qualify</p>
          </div>
          <div class="control-group">
            <label>
              <span class="control-label">Min Distance:</span>
              <input
                type="number"
                min="0.1"
                max="5"
                step="0.1"
                .value=${this.minDistance / 1000}
                @input=${this._handleDistanceChange}
              />
              <span>km</span>
            </label>
            <p class="control-description">Minimum length to qualify</p>
          </div>
          <div class="control-group">
            <label>
              <span class="control-label">Min Gradient:</span>
              <input
                type="number"
                min="1"
                max="15"
                step="0.5"
                .value=${this.minGradient}
                @input=${this._handleDetectionChange}
                data-field="minGradient"
              />
              <span>%</span>
            </label>
            <p class="control-description">Minimum steepness</p>
          </div>
          <div class="control-group">
            <label>
              <span class="control-label">Tolerance:</span>
              <input
                type="number"
                min="5"
                max="100"
                step="5"
                .value=${this.tolerance}
                @input=${this._handleDetectionChange}
                data-field="tolerance"
              />
              <span>meters</span>
            </label>
            <p class="control-description">Allow brief opposite changes</p>
          </div>
        </div>
      </div>
    `;
  }

  _renderSimilaritySection() {
    return html`
      <div class="help-section-group">
        <h3><span class="section-icon">🔗</span> Similarity Matching</h3>
        <p class="section-description">
          Controls how similar climbs must be to match. Lower = stricter.
        </p>
        <div class="detection-controls">
          <div class="control-group">
            <label>
              <span class="control-label">Gain/Loss Tolerance:</span>
              <input
                type="number"
                min="5"
                max="50"
                step="5"
                .value=${this.gainTolerance * 100}
                @input=${this._handleSimilarityChange}
                data-field="gainTolerance"
              />
              <span>%</span>
            </label>
            <p class="control-description">Max % difference in elevation</p>
          </div>
          <div class="control-group">
            <label>
              <span class="control-label">Distance Tolerance:</span>
              <input
                type="number"
                min="5"
                max="50"
                step="5"
                .value=${this.distanceTolerance * 100}
                @input=${this._handleSimilarityChange}
                data-field="distanceTolerance"
              />
              <span>%</span>
            </label>
            <p class="control-description">Max % difference in distance</p>
          </div>
          <div class="control-group">
            <label>
              <span class="control-label">Gradient Tolerance:</span>
              <input
                type="number"
                min="1"
                max="5"
                step="0.5"
                .value=${this.gradientTolerance}
                @input=${this._handleSimilarityChange}
                data-field="gradientTolerance"
              />
              <span>%</span>
            </label>
            <p class="control-description">Max difference in gradient</p>
          </div>
        </div>
      </div>
    `;
  }

  _renderHelpSection() {
    return html`
      <div class="help-section-group">
        <h3><span class="section-icon">📖</span> How Metrics Are Calculated</h3>
        <p class="section-description">
          Understanding the numbers: formulas, methods, and scoring systems used in the analysis.
        </p>
      </div>
    `;
  }

  _toggleDrawer() {
    this.isOpen = !this.isOpen;
  }

  _handleSmoothingChange(e) {
    this.dispatchEvent(new CustomEvent('settings-changed', {
      detail: {
        type: 'smoothing',
        settings: { smoothingWindow: parseInt(e.target.value) }
      },
      bubbles: true,
      composed: true
    }));
  }

  _handleThresholdChange(e) {
    this.dispatchEvent(new CustomEvent('settings-changed', {
      detail: {
        type: 'smoothing',
        settings: { gainThreshold: parseFloat(e.target.value) }
      },
      bubbles: true,
      composed: true
    }));
  }

  _handleDetectionChange(e) {
    const field = e.target.dataset.field;
    const value = parseFloat(e.target.value);
    
    this.dispatchEvent(new CustomEvent('settings-changed', {
      detail: {
        type: 'detection',
        settings: { [field]: value }
      },
      bubbles: true,
      composed: true
    }));
  }

  _handleDistanceChange(e) {
    this.dispatchEvent(new CustomEvent('settings-changed', {
      detail: {
        type: 'detection',
        settings: { minDistance: parseFloat(e.target.value) * 1000 }
      },
      bubbles: true,
      composed: true
    }));
  }

  _handleSimilarityChange(e) {
    const field = e.target.dataset.field;
    let value = parseFloat(e.target.value);
    
    if (field !== 'gradientTolerance') {
      value = value / 100; // Convert percentage to decimal
    }
    
    this.dispatchEvent(new CustomEvent('settings-changed', {
      detail: {
        type: 'similarity',
        settings: { [field]: value }
      },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('settings-drawer', SettingsDrawer);
