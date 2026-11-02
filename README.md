# OutLoud: Local Phonon Text-to-Speech Chrome Extension

OutLoud is a Manifest V3 Chrome extension that allows you to highlight text on any webpage and read it aloud using the local [Phonon](https://ollama.com/library/phonon) neural speech synthesis model running on Ollama.

## Features

- **100% Offline & Private**: Audio generation occurs entirely on your local machine (`http://localhost:11434`) with zero cloud data transmission.
- **Fast Time-to-First-Audio**: Uses sentence-boundary segmentation (`Intl.Segmenter`) and pipelined Web Audio scheduling to begin playback within hundreds of milliseconds.
- **Isolated Shadow DOM Pill**: A floating selection button appears adjacent to selected text without interfering with host page styles or editable input fields.
- **Deterministic Control**: Instant Play and Stop buttons; clicking Stop aborts active HTTP requests and cancels all scheduled audio nodes.
- **Voice Selection**: Choose your preferred voice checkpoint (`default`, `Zoey`, `Easton`, `Freya`).

---

## Prerequisites

1. **Install Ollama**: Follow instructions at [ollama.com](https://ollama.com).
2. **Pull the Phonon TTS Model**:
   ```bash
   ollama pull phonon
   ```
3. **Launch Ollama with CORS Permissions**:
   Chrome extensions communicate from an extension origin (`chrome-extension://<id>`). Run Ollama with permissive origins:
   ```bash
   OLLAMA_ORIGINS="*" ollama serve
   ```

---

## Development & Build

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Tests**:
   ```bash
   npm test
   ```

3. **Type-Check**:
   ```bash
   npm run type-check
   ```

4. **Build the Extension**:
   ```bash
   npm run build
   ```
   Build output will be bundled into the `dist/` directory.

---

## Loading into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in top right).
3. Click **Load unpacked**.
4. Select the `dist/` folder inside this repository.
5. Click the OutLoud extension icon to verify daemon connectivity and select your preferred voice.
6. Highlight text on any web page to see the floating pill and listen!
