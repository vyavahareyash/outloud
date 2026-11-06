# Chrome Web Store Listing & Submission Guide

- **Published URL:** [Chrome Web Store Listing](https://chromewebstore.google.com/detail/ccbgbiimgikekfeeacgimhhbdchlfmpn)

Use this reference to copy and paste metadata directly into the Chrome Web Store Developer Dashboard.

---

## Store Metadata

- **Name:** OutLoud - Local Phonon TTS
- **Published Extension ID:** `ccbgbiimgikekfeeacgimhhbdchlfmpn`
- **Store URL:** `https://chromewebstore.google.com/detail/ccbgbiimgikekfeeacgimhhbdchlfmpn`
- **Summary (Short Description, max 132 chars):**
  `Highlight webpage text to read aloud using local Ollama Phonon speech synthesis. 100% private, runs entirely on-device.`
  *(120 / 132 characters)*

- **Category:** `Accessibility` (Secondary: `Productivity`)
- **Language:** `English`

---

## Detailed Description

```markdown
OutLoud is a private, lightweight text-to-speech extension that reads any webpage text aloud using your locally running Ollama Phonon speech model.

No cloud subscriptions. No telemetry. 100% on-device speech synthesis.

### Key Features
- 🔊 Instant Text-to-Speech: Highlight text on any page to show a floating playback pill.
- 🔒 100% Local & Private: Audio synthesis runs on your machine via Ollama. No text ever leaves your computer.
- ⚡ Ultra Low Latency: Sentence-level tokenization and streaming playback for seamless audio.
- 🎛️ Full Playback Control: Play, pause, adjust reading speed, and switch voices directly from the popup.
- 🪶 Lightweight MV3 Architecture: Uses modern Manifest V3 offscreen documents for uninterrupted playback with minimal CPU and memory impact.

### Prerequisites
1. Install Ollama (https://ollama.com).
2. Pull the Phonon speech synthesis model:
   `ollama pull phonon`
3. Ensure Ollama is running (`http://localhost:11434`).

### How to Use
1. Highlight any text on a webpage.
2. Click the floating "Read" button that appears near your selection.
3. Use the popup menu to pause, change playback speed, or test your connection.
```

---

## Privacy Tab & Justifications (Required by CWS Reviewers)

### Single Purpose Description
> OutLoud provides on-device text-to-speech playback for user-selected webpage text via a local Ollama instance.

### Permission Justifications

| Permission | Justification for CWS Reviewers |
| :--- | :--- |
| **`storage`** | Stores user preferences (voice selection, speech speed, Ollama port/URL) locally across sessions. |
| **`offscreen`** | Required in Manifest V3 to host an AudioContext document for streaming audio decoding and playback, which service workers cannot perform. |
| **`host_permissions` (`http://localhost:11434/*`)** | Required to send selected text to and receive streaming synthesized audio from the user's locally running Ollama instance. |
| **`<all_urls>` (Content Script)** | Required to detect text selections and render the floating "Read" control on whatever webpage the user chooses to read aloud. |

### Data Usage Declarations
- **Does your product collect or transmit user data?** Select **No** (all inference and storage is local).
- **Privacy Policy URL:** `https://github.com/vyavahareyash/outloud/blob/main/PRIVACY.md`

---

## Media Requirements

- **Store Icon:** 128x128 PNG (use `src/icons/icon-128.png`).
- **Screenshots:** Minimum 1 screenshot (1280x800 or 640x400 PNG/JPEG) showing text selection and popup settings.
