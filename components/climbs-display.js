import { LitElement, html, css } from 'lit';
import { formatDistance, formatElevation, formatGradient, calculateClimbDifficulty } from '../gpxProcessor.js';

export class ClimbsDisplay extends LitElement {
  static properties = {
    climbs1: { type: Array },
    climbs2: { type: Array },
    matchedClimbs: { type: Array },
    track1Name: { type: String },
    track2Name: { type: String },
  };

  static styles = css`
    .climbs-section {
      margin-top: 30px;
      padding: 25px;
      background-color: white;
      border-radius: 6px;
      border-left: 4px solid #9b59b6;
    }

    .climbs-section h2 {
      color: #2c3e50;
      font-size: 1.3rem;
      margin-bottom: 20px;
    }

    .climb-category {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }

    .climb-category h3 {
      color: #2c3e50;
      font-size: 1.1rem;
      margin: 0 0 15px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .climb-category-badge {
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

    .climbs-side-by-side {
      display: flex;
      gap: 20px;
    }

    .climb-category-half {
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
      background-color: #34495e;
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

    .climb-number {
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

    .climb-difficulty {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .difficulty-easy {
      background-color: #d4edda;
      color: #155724;
    }

    .difficulty-moderate {
      background-color: #fff3cd;
      color: #856404;
    }

    .difficulty-hard {
      background-color: #f8d7da;
      color: #721c24;
    }

    @media (max-width: 768px) {
      .climbs-side-by-side {
        flex-direction: column;
      }
    }
  `;

  render() {
    return html`
      <section class="climbs-section">
        <h2>Detected Climbs</h2>
        
        ${this.matchedClimbs?.length > 0 ? html`
          <div class="climb-category">
            <h3>
              Similar Climbs Between Tracks
              <span class="climb-category-badge matched-badge">${this.matchedClimbs.length} Matches</span>
            </h3>
            ${this._renderMatchedClimbsTable()}
          </div>
        ` : ''}

        ${(this.climbs1?.length > 0 || this.climbs2?.length > 0) ? html`
          <div class="climbs-side-by-side">
            ${this.climbs1?.length > 0 ? html`
              <div class="climb-category climb-category-half">
                <h3>
                  ${this.track1Name || 'Track 1'}
                  <span class="climb-category-badge">${this.climbs1.length} Climbs</span>
                </h3>
                ${this._renderClimbsTable(this.climbs1)}
              </div>
            ` : ''}
            
            ${this.climbs2?.length > 0 ? html`
              <div class="climb-category climb-category-half">
                <h3>
                  ${this.track2Name || 'Track 2'}
                  <span class="climb-category-badge">${this.climbs2.length} Climbs</span>
                </h3>
                ${this._renderClimbsTable(this.climbs2)}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </section>
    `;
  }

  _renderMatchedClimbsTable() {
    const t1Name = this.track1Name || 'Track 1';
    const t2Name = this.track2Name || 'Track 2';

    return html`
      <table>
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
          ${this.matchedClimbs.map((match, index) => {
            const similarity = Math.round(match.similarityScore * 100);
            return html`
              <tr>
                <td><span class="climb-number">${index + 1}</span></td>
                <td>
                  ${t1Name}: ${formatDistance(match.climb1.startDistance)} - ${formatDistance(match.climb1.endDistance)}<br>
                  ${t2Name}: ${formatDistance(match.climb2.startDistance)} - ${formatDistance(match.climb2.endDistance)}
                </td>
                <td>
                  ${t1Name}: ${formatElevation(match.climb1.gain)}<br>
                  ${t2Name}: ${formatElevation(match.climb2.gain)}
                </td>
                <td>
                  ${t1Name}: ${formatDistance(match.climb1.distance)}<br>
                  ${t2Name}: ${formatDistance(match.climb2.distance)}
                </td>
                <td>
                  ${t1Name}: ${formatGradient(match.climb1.avgGradient)}<br>
                  ${t2Name}: ${formatGradient(match.climb2.avgGradient)}
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

  _renderClimbsTable(climbs) {
    return html`
      <table>
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
          ${climbs.map((climb, index) => {
            const difficulty = calculateClimbDifficulty(climb);
            const difficultyClass = difficulty < 30 ? 'difficulty-easy' : 
                                   difficulty < 60 ? 'difficulty-moderate' : 'difficulty-hard';
            const difficultyLabel = difficulty < 30 ? 'Easy' : 
                                   difficulty < 60 ? 'Moderate' : 'Hard';
            
            return html`
              <tr>
                <td><span class="climb-number">${index + 1}</span></td>
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
          })}
        </tbody>
      </table>
    `;
  }
}

customElements.define('climbs-display', ClimbsDisplay);
