import { expect, fixture, html } from '@open-wc/testing';
import '../components/file-uploader.js';

describe('FileUploader', () => {
  it('renders two file inputs', async () => {
    const el = await fixture(html`<file-uploader></file-uploader>`);
    
    const inputs = el.shadowRoot.querySelectorAll('input[type="file"]');
    expect(inputs).to.have.lengthOf(2);
  });

  it('shows "No file chosen" initially', async () => {
    const el = await fixture(html`<file-uploader></file-uploader>`);
    
    const fileNames = el.shadowRoot.querySelectorAll('.file-name');
    expect(fileNames[0].textContent).to.equal('No file chosen');
    expect(fileNames[1].textContent).to.equal('No file chosen');
  });

  it('has proper accessibility labels', async () => {
    const el = await fixture(html`<file-uploader></file-uploader>`);
    
    const labels = el.shadowRoot.querySelectorAll('label');
    expect(labels).to.have.lengthOf(2);
    
    const labelTexts = Array.from(labels).map(l => 
      l.querySelector('.label-text').textContent
    );
    expect(labelTexts).to.include('Track 1:');
    expect(labelTexts).to.include('Track 2:');
  });

  it('accepts .gpx files only', async () => {
    const el = await fixture(html`<file-uploader></file-uploader>`);
    
    const inputs = el.shadowRoot.querySelectorAll('input[type="file"]');
    expect(inputs[0].accept).to.equal('.gpx');
    expect(inputs[1].accept).to.equal('.gpx');
  });
});
