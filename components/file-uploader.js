import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';

export class FileUploader extends LitElement {
  static properties = {
    file1Name: { type: String, state: true },
    file2Name: { type: String, state: true },
  };

  static styles = css`
    .file-input-section {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .file-input-group {
      flex: 1;
      min-width: 300px;
    }

    .file-input-group label {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 20px;
      background-color: white;
      border-radius: 6px;
      border: 2px dashed #bdc3c7;
      cursor: pointer;
      transition: all 0.3s;
    }

    .file-input-group label:hover {
      border-color: #3498db;
      background-color: #ecf0f1;
    }

    .file-input-group label.file-selected {
      border-color: #27ae60;
      border-style: solid;
      background-color: #d5f4e6;
    }

    .label-text {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    input[type="file"] {
      display: none;
    }

    .file-name {
      font-size: 0.9rem;
      color: #7f8c8d;
      font-style: italic;
    }

    .file-selected .file-name {
      color: #27ae60;
      font-weight: 600;
      font-style: normal;
    }
  `;

  constructor() {
    super();
    this.file1Name = 'No file chosen';
    this.file2Name = 'No file chosen';
  }

  render() {
    return html`
      <section class="file-input-section">
        <div class="file-input-group">
          <label class="${this.file1Name !== 'No file chosen' ? 'file-selected' : ''}">
            <span class="label-text">Track 1:</span>
            <input
              type="file"
              accept=".gpx"
              @change=${(e) => this._handleFileChange(e, 1)}
            />
            <span class="file-name">${this.file1Name}</span>
          </label>
        </div>

        <div class="file-input-group">
          <label class="${this.file2Name !== 'No file chosen' ? 'file-selected' : ''}">
            <span class="label-text">Track 2:</span>
            <input
              type="file"
              accept=".gpx"
              @change=${(e) => this._handleFileChange(e, 2)}
            />
            <span class="file-name">${this.file2Name}</span>
          </label>
        </div>
      </section>
    `;
  }

  async _handleFileChange(e, trackNumber) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (trackNumber === 1) {
      this.file1Name = file.name;
    } else {
      this.file2Name = file.name;
    }

    try {
      const content = await this._readFile(file);
      
      this.dispatchEvent(new CustomEvent('file-uploaded', {
        detail: { trackNumber, file, content },
        bubbles: true,
        composed: true
      }));
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }

  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

customElements.define('file-uploader', FileUploader);
