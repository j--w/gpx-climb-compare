import { expect, fixture, html } from '@open-wc/testing';
import '../components/settings-drawer.js';

describe('SettingsDrawer', () => {
  it('renders with closed drawer by default', async () => {
    const el = await fixture(html`<settings-drawer></settings-drawer>`);
    
    const content = el.shadowRoot.querySelector('.help-content');
    expect(content.classList.contains('hidden')).to.be.true;
  });

  it('toggles drawer when button is clicked', async () => {
    const el = await fixture(html`<settings-drawer></settings-drawer>`);
    
    const button = el.shadowRoot.querySelector('.help-toggle');
    const content = el.shadowRoot.querySelector('.help-content');
    
    expect(content.classList.contains('hidden')).to.be.true;
    
    button.click();
    await el.updateComplete;
    
    expect(content.classList.contains('hidden')).to.be.false;
  });

  it('displays default settings values', async () => {
    const el = await fixture(html`
      <settings-drawer
        .smoothingWindow=${5}
        .gainThreshold=${3}
        .minGain=${100}
      ></settings-drawer>
    `);
    
    // Open the drawer first to access inputs
    el.isOpen = true;
    await el.updateComplete;
    
    const smoothingInput = el.shadowRoot.querySelector('input[type="range"]');
    expect(Number(smoothingInput.value)).to.equal(5);
    
    const thresholdInput = el.shadowRoot.querySelector('input[type="number"]');
    expect(Number(thresholdInput.value)).to.equal(3);
  });

  it('emits settings-changed event when smoothing changes', async () => {
    const el = await fixture(html`<settings-drawer></settings-drawer>`);
    
    el.isOpen = true;
    await el.updateComplete;
    
    let eventFired = false;
    let eventDetail = null;
    
    el.addEventListener('settings-changed', (e) => {
      eventFired = true;
      eventDetail = e.detail;
    });
    
    const smoothingInput = el.shadowRoot.querySelector('input[type="range"]');
    smoothingInput.value = '10';
    smoothingInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    await el.updateComplete;
    
    expect(eventFired).to.be.true;
    expect(eventDetail.type).to.equal('smoothing');
    expect(eventDetail.settings.smoothingWindow).to.equal(10);
  });

  it('has all four settings sections', async () => {
    const el = await fixture(html`<settings-drawer></settings-drawer>`);
    
    el.isOpen = true;
    await el.updateComplete;
    
    const sections = el.shadowRoot.querySelectorAll('.help-section-group');
    expect(sections).to.have.lengthOf(4);
    
    const headings = Array.from(el.shadowRoot.querySelectorAll('.help-section-group h3'))
      .map(h => h.textContent.trim());
    
    expect(headings.some(h => h.includes('Smoothing & Elevation Settings'))).to.be.true;
    expect(headings.some(h => h.includes('Climb & Descent Detection'))).to.be.true;
    expect(headings.some(h => h.includes('Similarity Matching'))).to.be.true;
  });

  it('updates smoothing value display', async () => {
    const el = await fixture(html`<settings-drawer .smoothingWindow=${7}></settings-drawer>`);
    
    el.isOpen = true;
    await el.updateComplete;
    
    const label = el.shadowRoot.querySelector('.control-label');
    expect(label.textContent).to.include('7');
  });
});
