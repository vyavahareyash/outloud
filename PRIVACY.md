# Privacy Policy for OutLoud - Local Phonon TTS

**Last updated:** November 3, 2026

## Overview
OutLoud is an open-source Chrome extension that reads selected webpage text aloud using a local speech synthesis model (Ollama Phonon). 

**OutLoud does not collect, store, transmit, or share any personal data.** All processing is performed 100% locally on your machine.

---

## 1. Information Handling & Data Collection
- **Zero Remote Telemetry:** OutLoud does not send analytics, telemetry, crash reports, or user behavior tracking to any remote server or third party.
- **Text & Audio Processing:** When you highlight text and click the read button, the text is sent exclusively to your local Ollama endpoint (`http://localhost:11434`). Audio streams returned by Ollama are played locally in your browser and are never saved to disk or transmitted elsewhere.
- **Local Settings Storage:** User preferences (voice selection, speech speed, host URL) are stored locally in your browser using Chrome's `chrome.storage.local` API and never leave your device.

---

## 2. Permissions Explained
OutLoud requests only the permissions necessary for local operation:

| Permission | Purpose |
| :--- | :--- |
| `storage` | Saves user settings (voice choice, speed, Ollama URL) locally in your browser. |
| `offscreen` | Provides an offscreen AudioContext document required in Manifest V3 to play streaming audio smoothly. |
| `host_permissions` (`http://localhost:11434/*`) | Communicates with your locally running Ollama instance on your machine. |
| `<all_urls>` (Content Script) | Detects user text selection and displays the floating play button on webpages you choose to read. |

---

## 3. Third-Party Services
OutLoud does not integrate with any third-party cloud APIs, analytics providers, or advertising networks.

---

## 4. Source Code & Verification
OutLoud is fully open source. You can inspect the complete source code and verify these privacy guarantees in the GitHub repository.

---

## 5. Contact
If you have any questions or feedback regarding this policy, please file an issue on GitHub.
