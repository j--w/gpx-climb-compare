import { expect, fixture, html } from '@open-wc/testing';
import '../components/descents-display.js';

describe('DescentsDisplay', () => {
  it('renders section header even with no descents', async () => {
    const el = await fixture(html`<descents-display></descents-display>`);
    const section = el.shadowRoot.querySelector('.descents-section');
    expect(section).to.not.be.null;
    
    const heading = section.querySelector('h2');
    expect(heading.textContent).to.equal('Detected Descents');
    
    // But no descent tables
    const tables = section.querySelectorAll('table');
    expect(tables).to.have.lengthOf(0);
  });

  it('renders descents for track 1', async () => {
    const descents1 = [{
      loss: 200,
      distance: 2000,
      startDistance: 0,
      endDistance: 2000,
      avgGradient: -10,
      maxGradient: -15
    }];
    
    const el = await fixture(html`
      <descents-display 
        .descents1=${descents1}
        .track1Name=${'Test Track'}
      ></descents-display>
    `);
    
    const section = el.shadowRoot.querySelector('.descents-section');
    expect(section).to.not.be.null;
    
    const heading = section.querySelector('h2');
    expect(heading.textContent).to.equal('Detected Descents');
  });

  it('displays matched descents section', async () => {
    const descents1 = [{
      loss: 200,
      distance: 2000,
      startDistance: 0,
      endDistance: 2000,
      avgGradient: -10,
      maxGradient: -15
    }];
    
    const descents2 = [{
      loss: 210,
      distance: 2100,
      startDistance: 0,
      endDistance: 2100,
      avgGradient: -10,
      maxGradient: -16
    }];
    
    const matchedDescents = [{
      descent1: descents1[0],
      descent2: descents2[0],
      similarityScore: 0.93
    }];
    
    const el = await fixture(html`
      <descents-display 
        .descents1=${descents1}
        .descents2=${descents2}
        .matchedDescents=${matchedDescents}
        .track1Name=${'Track A'}
        .track2Name=${'Track B'}
      ></descents-display>
    `);
    
    const matchedSection = el.shadowRoot.querySelector('.descent-category');
    expect(matchedSection).to.not.be.null;
    
    const heading = matchedSection.querySelector('h3');
    expect(heading.textContent).to.include('Similar Descents Between Tracks');
    
    const badge = matchedSection.querySelector('.matched-badge');
    expect(badge.textContent).to.equal('1 Matches');
  });

  it('renders side-by-side when both tracks have descents', async () => {
    const descents1 = [{
      loss: 200,
      distance: 2000,
      startDistance: 0,
      endDistance: 2000,
      avgGradient: -10,
      maxGradient: -15
    }];
    
    const descents2 = [{
      loss: 180,
      distance: 1800,
      startDistance: 0,
      endDistance: 1800,
      avgGradient: -10,
      maxGradient: -14
    }];
    
    const el = await fixture(html`
      <descents-display 
        .descents1=${descents1}
        .descents2=${descents2}
      ></descents-display>
    `);
    
    const sideBySide = el.shadowRoot.querySelector('.descents-side-by-side');
    expect(sideBySide).to.not.be.null;
    
    const categories = sideBySide.querySelectorAll('.descent-category-half');
    expect(categories).to.have.lengthOf(2);
  });

  it('displays descent count badges', async () => {
    const descents = [
      { loss: 200, distance: 2000, startDistance: 0, endDistance: 2000, avgGradient: -10, maxGradient: -15 },
      { loss: 150, distance: 1500, startDistance: 2000, endDistance: 3500, avgGradient: -10, maxGradient: -12 }
    ];
    
    const el = await fixture(html`
      <descents-display .descents1=${descents}></descents-display>
    `);
    
    const badge = el.shadowRoot.querySelector('.descent-category-badge');
    expect(badge.textContent).to.equal('2 Descents');
  });

  it('displays similarity indicators', async () => {
    const descents1 = [{
      loss: 200,
      distance: 2000,
      startDistance: 0,
      endDistance: 2000,
      avgGradient: -10,
      maxGradient: -15
    }];
    
    const descents2 = [{
      loss: 200,
      distance: 2000,
      startDistance: 0,
      endDistance: 2000,
      avgGradient: -10,
      maxGradient: -15
    }];
    
    const matchedDescents = [{
      descent1: descents1[0],
      descent2: descents2[0],
      similarityScore: 0.88
    }];
    
    const el = await fixture(html`
      <descents-display 
        .descents1=${descents1}
        .descents2=${descents2}
        .matchedDescents=${matchedDescents}
      ></descents-display>
    `);
    
    const similarityIndicator = el.shadowRoot.querySelector('.similarity-indicator');
    expect(similarityIndicator).to.not.be.null;
    expect(similarityIndicator.textContent).to.include('88%');
  });
});
