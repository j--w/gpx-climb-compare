import { LitElement, html, css } from 'lit';
import { initChart, updateChart } from '../chartManager.js';

export class ChartDisplay extends LitElement {
  static properties = {
    normalizedData: { type: Object },
    climbs1: { type: Array },
    climbs2: { type: Array },
    descents1: { type: Array },
    descents2: { type: Array },
  };

  static styles = css`
    .chart-section {
      margin-top: 30px;
      padding: 20px;
      background-color: #fafafa;
      border-radius: 6px;
    }

    .chart-container {
      background-color: white;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 0;
    }

    .chart-container-bottom {
      margin-top: -1px;
      border-top: 2px solid #e0e0e0;
    }

    canvas {
      max-width: 100%;
      height: auto;
    }
  `;

  // Disable shadow DOM for Chart.js compatibility
  createRenderRoot() {
    return this;
  }

  _initializeChartsIfNeeded() {
    if (!this.charts) {
      // Query within the component's own DOM
      const canvas1 = this.querySelector('#elevationChart1');
      const canvas2 = this.querySelector('#elevationChart2');
      
      console.log('Looking for canvas elements...', { canvas1, canvas2, thisElement: this });
      
      if (canvas1 && canvas2) {
        console.log('Initializing charts with canvas elements', canvas1, canvas2);
        // Pass the actual canvas elements instead of IDs
        this.charts = initChart(canvas1, canvas2);
      } else {
        console.warn('Canvas elements not found', {
          canvas1Found: !!canvas1,
          canvas2Found: !!canvas2,
          childNodes: Array.from(this.childNodes).map(n => n.nodeName)
        });
      }
    }
  }

  firstUpdated() {
    // Initialize charts after first render
    setTimeout(() => {
      this._initializeChartsIfNeeded();
      
      // If we already have data, update the charts
      if (this.normalizedData && this.charts) {
        console.log('Updating charts with initial data');
        updateChart(
          this.normalizedData,
          this.climbs1 || [],
          this.climbs2 || [],
          this.descents1 || [],
          this.descents2 || []
        );
      }
    }, 0);
  }

  updated(changedProperties) {
    if (changedProperties.has('normalizedData') && this.normalizedData) {
      // Make sure charts are initialized
      this._initializeChartsIfNeeded();
      
      if (this.charts) {
        console.log('Updating charts with new data');
        updateChart(
          this.normalizedData,
          this.climbs1 || [],
          this.climbs2 || [],
          this.descents1 || [],
          this.descents2 || []
        );
      }
    }
  }

  render() {
    return html`
      <style>
        .chart-section {
          margin-top: 30px;
          padding: 20px;
          background-color: #fafafa;
          border-radius: 6px;
        }

        .chart-container {
          background-color: white;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 0;
          min-height: 300px;
        }

        .chart-container-bottom {
          margin-top: -1px;
          border-top: 2px solid #e0e0e0;
        }

        canvas {
          max-width: 100%;
          height: auto;
        }
      </style>
      <section class="chart-section">
        <div class="chart-container">
          <canvas id="elevationChart1" width="800" height="300"></canvas>
        </div>
        <div class="chart-container chart-container-bottom">
          <canvas id="elevationChart2" width="800" height="300"></canvas>
        </div>
      </section>
    `;
  }
}

customElements.define('chart-display', ChartDisplay);
