import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';
import { formatDistance, formatElevation, formatGradient } from '../gpxProcessor.js';

export class DescentsDisplay extends LitElement {
  static properties = {
    descents1: { type: Array },
    descents2: { type: Array },
    matchedDescents: { type: Array },
    track1Name: { type: String },
    track2Name: { type: String },
  };

  static styles = css`
    .descents-section {
      margin-top: 30px;
      padding: 25px;
      background-color: white;
      border-radius: 6px;
      border-left: 4px solid #3498db;
    }

    .descents-section h2 {
      color: #2c3e50;
      font-size: 1.3rem;
      margin-bottom: 20px;
    }

    .descent-category {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }

    .descent-category h3 {
      color: #2c3e50;
      font-size: 1.1rem;
      margin: 0 0 15px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .descent-category-badge {
      display: inline-block;
      padding: 4px 10px;
      background-color: #3498db;
      color: white;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .matched-badge {
      background-color: #27ae60;
    }

    .descents-side-by-side {
      display: flex;
      gap: 20px;
    }

    .descent-category-half {
      flex: 1;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background-color: white;
      border-radius: 4px;
      overflow: hidden;
    }

    th {
      background-color: #2980b9;
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
    }

    td {
      padding: 10px;
      border-bottom: 1px solid #ecf0f1;
      font-size: 0.9rem;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover {
      background-color: #f8f9fa;
    }

    .descent-number {
      display: inline-block;
      width: 24px;
      height: 24px;
      background-color: #3498db;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .similarity-indicator {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.85rem;
      color: #27ae60;
      font-weight: 600;
    }

    .similarity-bar {
      width: 50px;
      height: 8px;
      background-color: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }

    .similarity-fill {
      height: 100%;
      background-color: #27ae60;
    }

    @media (max-width: 768px) {
      .descents-side-by-side {
        flex-direction: column;
      }
    }
  `;

  render() {
    return html`
      <section class="descents-section">
        <h2>Detected Descents</h2>
        
        ${this.matchedDescents?.length > 0 ? html`
          <div class="descent-category">
            <h3>
              Similar Descents Between Tracks
              <span class="descent-category-badge matched-badge">${this.matchedDescents.length} Matches</span>
            </h3>
            ${this._renderMatchedDescentsTable()}
          </div>
        ` : ''}

        ${(this.descents1?.length > 0 || this.descents2?.length > 0) ? html`
          <div class="descents-side-by-side">
            ${this.descents1?.length > 0 ? html`
              <div class="descent-category descent-category-half">
                <h3>
                  ${this.track1Name || 'Track 1'}
                  <span class="descent-category-badge">${this.descents1.length} Descents</span>
                </h3>
                ${this._renderDescentsTable(this.descents1)}
              </div>
            ` : ''}
            
            ${this.descents2?.length > 0 ? html`
              <div class="descent-category descent-category-half">
                <h3>
                  ${this.track2Name || 'Track 2'}
                  <span class="descent-category-badge">${this.descents2.length} Descents</span>
                </h3>
                ${this._renderDescentsTable(this.descents2)}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </section>
    `;
  }

  _renderMatchedDescentsTable() {
    const t1Name = this.track1Name || 'Track 1';
    const t2Name = this.track2Name || 'Track 2';

    return html`
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Location</th>
            <th>Loss</th>
            <th>Distance</th>
            <th>Avg Grade</th>
            <th>Similarity</th>
          </tr>
        </thead>
        <tbody>
          ${this.matchedDescents.map((match, index) => {
            const similarity = Math.round(match.similarityScore * 100);
            return html`
              <tr>
                <td><span class="descent-number">${index + 1}</span></td>
                <td>
                  ${t1Name}: ${formatDistance(match.descent1.startDistance)} - ${formatDistance(match.descent1.endDistance)}<br>
                  ${t2Name}: ${formatDistance(match.descent2.startDistance)} - ${formatDistance(match.descent2.endDistance)}
                </td>
                <td>
                  ${t1Name}: ${formatElevation(match.descent1.loss)}<br>
                  ${t2Name}: ${formatElevation(match.descent2.loss)}
                </td>
                <td>
                  ${t1Name}: ${formatDistance(match.descent1.distance)}<br>
                  ${t2Name}: ${formatDistance(match.descent2.distance)}
                </td>
                <td>
                  ${t1Name}: ${formatGradient(match.descent1.avgGradient)}<br>
                  ${t2Name}: ${formatGradient(match.descent2.avgGradient)}
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
          })}
        </tbody>
      </table>
    `;
  }

  _renderDescentsTable(descents) {
    return html`
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Location</th>
            <th>Loss</th>
            <th>Distance</th>
            <th>Avg Grade</th>
            <th>Max Grade</th>
          </tr>
        </thead>
        <tbody>
          ${descents.map((descent, index) => html`
            <tr>
              <td><span class="descent-number">${index + 1}</span></td>
              <td>${formatDistance(descent.startDistance)} - ${formatDistance(descent.endDistance)}</td>
              <td>${formatElevation(descent.loss)}</td>
              <td>${formatDistance(descent.distance)}</td>
              <td>${formatGradient(descent.avgGradient)}</td>
              <td>${formatGradient(descent.maxGradient)}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }
}

customElements.define('descents-display', DescentsDisplay);
