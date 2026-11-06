# Chrome Web Store Listing & Submission Guide

- **Published URL:** [Chrome Web Store Listing](https://chromewebstore.google.com/detail/ccbgbiimgikekfeeacgimhhbdchlfmpn)
- **Extension ID:** `ccbgbiimgikekfeeacgimhhbdchlfmpn`

Use this reference to copy and paste metadata directly into the Chrome Web Store Developer Dashboard.

---

## Store Metadata

- **Name:** OutLoud - Local AI Text-to-Speech (Phonon TTS)
- **Summary (Short Description, max 132 chars):**
  `Listen to any web article offline. Private, zero-latency neural text-to-speech powered by local Ollama Phonon. 100% on-device.`
  *(124 / 132 characters)*

- **Category:** `Accessibility` (Secondary: `Productivity`)
- **Language:** `English`
- **Pricing:** `Free` (Zero ads, zero subscriptions, zero telemetry)

---

## Detailed Store Description

*Copy the text below directly into the "Detailed description" field in the Chrome Web Store Developer Dashboard:*

```text
Turn any webpage into an instant, natural-sounding audiobook. OutLoud is an edge-native, privacy-first text-to-speech extension that synthesizes human-like voice directly on your computer using the local Phonon neural speech model running on Ollama.

No monthly subscriptions ($150–$300/year saved vs. cloud readers). No privacy hazards. Zero data egress.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 WHY OUTLOUD?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Traditional text-to-speech extensions either sound like robotic 1990s synthesizers or demand expensive recurring SaaS subscriptions. Worst of all, cloud-based readers transmit your sensitive documents, personal emails, confidential research, and private browsing data to remote servers.

OutLoud changes the paradigm:
• 100% On-Device: Audio inference runs entirely on your hardware via Ollama (http://localhost:11434). Not a single word ever leaves your machine.
• Natural Neural Voice: Powered by Phonon, delivering human-like inflection, expressive cadence, and clean pauses.
• Zero Latency: Intelligent sentence boundary tokenization streams audio in sub-second intervals—no waiting for long articles to buffer.
• Unmatched Privacy: Perfect for developers, researchers, legal professionals, and anyone reading confidential or proprietary documents.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ KEY FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔊 Instant Text-to-Speech: Highlight any text on any page to reveal a sleek floating audio pill. Click Play to listen immediately.
⚡ Pipelined Streaming Audio: Employs sentence-boundary segmentation (Intl.Segmenter) and an MV3 offscreen Web Audio pipeline for immediate playback.
🎛️ Full Playback & Voice Control: Switch between distinct voices (default, Zoey, Easton, Freya) and adjust playback speed on the fly.
🎯 Isolated Shadow DOM: The floating pill renders within an isolated Shadow DOM boundary, preventing CSS clashes with host pages.
⏹️ Deterministic Instant Stop: Cancels scheduled audio nodes and aborts pending local inference instantly.
🛡️ Zero Tracking & Open Source: No telemetry, no analytics, no third-party scripts. Free forever.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 3-MINUTE QUICK START
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install and launch Ollama (https://ollama.com).
2. Download the Phonon speech synthesis model:
   ollama pull phonon
3. Start Ollama with extension origin support:
   OLLAMA_ORIGINS="*" ollama serve
4. Highlight any text on any website and click "Play"!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☕ SUPPORT INDEPENDENT SOFTWARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OutLoud is 100% free, private, and open-source. If OutLoud helps you read articles, papers, or docs hands-free, consider buying a coffee to support development:
https://buymeacoffee.com/vyavahareyash
```

---

## Privacy Tab & Justifications (Required by CWS Reviewers)

### Single Purpose Description
> OutLoud provides on-device neural text-to-speech synthesis for user-selected webpage text via a locally running Ollama instance, operating with zero external network transmission.

### Permission Justifications

| Permission | Justification for CWS Reviewers |
| :--- | :--- |
| **`storage`** | Stores user preferences (selected voice checkpoint, playback speed, and daemon endpoint) locally across browser sessions. |
| **`offscreen`** | Required in Manifest V3 to host an AudioContext document for streaming audio decoding and playback, which service workers cannot perform. |
| **`host_permissions` (`http://localhost:11434/*`)** | Required to send user-highlighted text to and receive streaming synthesized PCM audio from the user's locally running Ollama instance. |
| **`<all_urls>` (Content Script)** | Required to detect text selections and render the isolated Shadow DOM playback pill on any webpage the user chooses to read. |

### Data Usage Declarations
- **Does your product collect or transmit user data?** Select **No** (all inference, synthesis, and storage are strictly local).
- **Privacy Policy URL:** `https://github.com/vyavahareyash/outloud/blob/main/PRIVACY.md`

---

## Media & Visual Assets Checklist

All assets are pre-formatted and available in `assets/store/`:

| Asset Type | Specifications | File Location |
| :--- | :--- | :--- |
| **Store Icon** | 128x128 PNG | `src/icons/icon-128.png` |
| **Marquee Promo Banner** | 1400x560 PNG | `assets/store/promo-marquee-1400x560.png` |
| **Small Promo Tile** | 440x280 PNG | `assets/store/promo-small-440x280.png` |
| **Screenshot 1: Text Selection** | 1280x800 PNG | `assets/store/screenshot-1-reading-1280x800.png` |
| **Screenshot 2: Popup Controls** | 1280x800 PNG | `assets/store/screenshot-2-popup-1280x800.png` |
