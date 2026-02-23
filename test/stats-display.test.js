import { expect, fixture, html } from '@open-wc/testing';
import '../components/stats-display.js';

describe('StatsDisplay', () => {
  it('renders nothing when no stats provided', async () => {
    const el = await fixture(html`<stats-display></stats-display>`);
    expect(el.shadowRoot.textContent.trim()).to.equal('');
  });

  it('renders track1 stats when provided', async () => {
    const track1Stats = {
      totalDistance: 10000,
      elevationGain: 500,
      elevationLoss: 450,
      maxElevation: 1200,
      minElevation: 800
    };
    
    const el = await fixture(html`
      <stats-display 
        .track1Stats=${track1Stats}
        .track1Name=${'Test Track'}
      ></stats-display>
    `);
    
    const heading = el.shadowRoot.querySelector('h3');
    expect(heading.textContent).to.equal('Test Track');
    
    const statValues = Array.from(el.shadowRoot.querySelectorAll('.stat-value'))
      .map(v => v.textContent);
    
    expect(statValues.length).to.equal(5);
    expect(statValues[0]).to.equal('10.00 km'); // Distance
    expect(statValues[1]).to.equal('500 m');    // Elevation Gain
  });

  it('renders both tracks side by side', async () => {
    const track1Stats = {
      totalDistance: 10000,
      elevationGain: 500,
      elevationLoss: 450,
      maxElevation: 1200,
      minElevation: 800
    };
    
    const track2Stats = {
      totalDistance: 12000,
      elevationGain: 600,
      elevationLoss: 550,
      maxElevation: 1300,
      minElevation: 750
    };
    
    const el = await fixture(html`
      <stats-display 
        .track1Stats=${track1Stats}
        .track2Stats=${track2Stats}
        .track1Name=${'Track A'}
        .track2Name=${'Track B'}
      ></stats-display>
    `);
    
    const cards = el.shadowRoot.querySelectorAll('.stat-card');
    expect(cards).to.have.lengthOf(2);
    
    const headings = Array.from(el.shadowRoot.querySelectorAll('h3'))
      .map(h => h.textContent);
    expect(headings).to.include('Track A');
    expect(headings).to.include('Track B');
  });
});
