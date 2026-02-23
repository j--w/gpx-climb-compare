import { expect, fixture, html } from '@open-wc/testing';
import '../components/climbs-display.js';

describe('ClimbsDisplay', () => {
  it('renders section header even with no climbs', async () => {
    const el = await fixture(html`<climbs-display></climbs-display>`);
    const section = el.shadowRoot.querySelector('.climbs-section');
    expect(section).to.not.be.null;
    
    const heading = section.querySelector('h2');
    expect(heading.textContent).to.equal('Detected Climbs');
    
    // But no climb tables
    const tables = section.querySelectorAll('table');
    expect(tables).to.have.lengthOf(0);
  });

  it('renders climbs for track 1', async () => {
    const climbs1 = [{
      gain: 200,
      distance: 2000,
      startDistance: 0,
      endDistance: 2000,
      avgGradient: 10,
      maxGradient: 15,
      difficulty: 45
    }];
    
    const el = await fixture(html`
      <climbs-display 
        .climbs1=${climbs1}
        .track1Name=${'Test Track'}
      ></climbs-display>
    `);
    
    const section = el.shadowRoot.querySelector('.climbs-section');
    expect(section).to.not.be.null;
    
    const heading = section.querySelector('h2');
    expect(heading.textContent).to.equal('Detected Climbs');
  });

  it('displays matched climbs section', async () => {
    const climbs1 = [{
      gain: 200,
      distance: 2000,
      startDistance: 0,
      endDistance: 2000,
      avgGradient: 10,
      maxGradient: 15,
      difficulty: 45
    }];
    
    const climbs2 = [{
      gain: 210,
      distance: 2100,
      startDistance: 0,
      endDistance: 2100,
      avgGradient: 10,
      maxGradient: 16,
      difficulty: 47
    }];
    
    const matchedClimbs = [{
      climb1: climbs1[0],
      climb2: climbs2[0],
      similarityScore: 0.95
    }];
    
    const el = await fixture(html`
      <climbs-display 
        .climbs1=${climbs1}
        .climbs2=${climbs2}
        .matchedClimbs=${matchedClimbs}
        .track1Name=${'Track A'}
        .track2Name=${'Track B'}
      ></climbs-display>
    `);
    
    const matchedSection = el.shadowRoot.querySelector('.climb-category');
    expect(matchedSection).to.not.be.null;
    
    const heading = matchedSection.querySelector('h3');
    expect(heading.textContent).to.include('Similar Climbs Between Tracks');
    
    const badge = matchedSection.querySelector('.climb-category-badge');
    expect(badge.textContent).to.equal('1 Matches');
  });

  it('displays difficulty badges', async () => {
    const climbs = [
      { gain: 100, distance: 2000, startDistance: 0, endDistance: 2000, avgGradient: 5, maxGradient: 8, difficulty: 25 },
      { gain: 300, distance: 3000, startDistance: 2000, endDistance: 5000, avgGradient: 10, maxGradient: 15, difficulty: 65 }
    ];
    
    const el = await fixture(html`
      <climbs-display .climbs1=${climbs}></climbs-display>
    `);
    
    const badges = el.shadowRoot.querySelectorAll('.climb-difficulty');
    expect(badges).to.have.lengthOf(2);
    
    // First is easy (difficulty 25)
    expect(badges[0].classList.contains('difficulty-easy')).to.be.true;
    expect(badges[0].textContent).to.include('Easy');
    
    // Second is hard (difficulty 65)
    expect(badges[1].classList.contains('difficulty-hard')).to.be.true;
    expect(badges[1].textContent).to.include('Hard');
  });

  it('renders side-by-side when both tracks have climbs', async () => {
    const climbs1 = [{
      gain: 200,
      distance: 2000,
      startDistance: 0,
      endDistance: 2000,
      avgGradient: 10,
      maxGradient: 15,
      difficulty: 45
    }];
    
    const climbs2 = [{
      gain: 180,
      distance: 1800,
      startDistance: 0,
      endDistance: 1800,
      avgGradient: 10,
      maxGradient: 14,
      difficulty: 42
    }];
    
    const el = await fixture(html`
      <climbs-display 
        .climbs1=${climbs1}
        .climbs2=${climbs2}
      ></climbs-display>
    `);
    
    const sideBySide = el.shadowRoot.querySelector('.climbs-side-by-side');
    expect(sideBySide).to.not.be.null;
    
    const categories = sideBySide.querySelectorAll('.climb-category-half');
    expect(categories).to.have.lengthOf(2);
  });

  it('displays climb count badges', async () => {
    const climbs = [
      { gain: 200, distance: 2000, startDistance: 0, endDistance: 2000, avgGradient: 10, maxGradient: 15, difficulty: 45 },
      { gain: 150, distance: 1500, startDistance: 2000, endDistance: 3500, avgGradient: 10, maxGradient: 12, difficulty: 38 }
    ];
    
    const el = await fixture(html`
      <climbs-display .climbs1=${climbs}></climbs-display>
    `);
    
    const badge = el.shadowRoot.querySelector('.climb-category-badge');
    expect(badge.textContent).to.equal('2 Climbs');
  });
});
