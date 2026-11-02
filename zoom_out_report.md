# Goldfish Review Report: Stage 5 - Initial Zoom Out Review

**Target:** `/Users/yash/Documents/Repos/outloud/docs/designs/outloud.md` (`Lines 1-402`)  
**Standard:** `resources/document_standards/zoom-out-standard.md`  
**Reviewer Lens:** `egm-zoom-out` (Skeptical Architect)

---

## Prioritized Findings (Blockers -> Major -> Nits)

### Ollama Server CORS (`OLLAMA_ORIGINS`) and Extension Host Permissions Conflict - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 44-45, 146, 254`
* **Discrepancy Description**: The document claims in line 146 that declaring `"host_permissions": ["http://localhost:11434/*"]` in `manifest.json` completely resolves network communication constraints because requests are issued from privileged extension execution contexts. However, in Open Question line 44, the document notes that standard Ollama daemons enforce strict CORS and bind to `127.0.0.1:11434`, rejecting requests with `Origin: chrome-extension://<id>` unless launched with `OLLAMA_ORIGINS="*"`. Host permissions in Chrome Manifest V3 bypass client-side Content Security Policy restrictions imposed by host webpages (`connect-src`), but they do NOT bypass server-side CORS verification on the Ollama daemon. If the daemon rejects the extension origin with HTTP 403 or missing `Access-Control-Allow-Origin` response headers, all speech requests will fail out of the box on standard user machines.
* **Rationale & Recommendation**: Leaving this core operational hurdle as an unresolved Open Question while asserting architectural feasibility is unacceptable. The architecture must:
  1. Determine exact origin behavior: Chrome service workers and offscreen documents send an `Origin: chrome-extension://<extension_id>` header during cross-origin fetch operations.
  2. Document the mandatory requirement for users to configure `OLLAMA_ORIGINS="*"`, or provide an automated connection test in `CHECK_DAEMON_HEALTH` that specifically detects CORS preflight failures and outputs actionable terminal commands (`launchctl setenv OLLAMA_ORIGINS "*"` or systemd service overrides).
  3. Close Open Question #2 with this resolved operating model.

---

### Concurrency Model Conflict: Sequence Diagram vs. Queue Worker Architecture - Severity: 🟡 Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 110, 155`
* **Discrepancy Description**: The Mermaid sequence diagram (line 110) states: `Offscreen->>Ollama: POST /v1/audio/speech (Chunk S2 concurrently)` while Chunk S1 is being decoded and played. In direct contradiction, the component specification in line 155 states: `An internal queue worker fetches sentence audio chunks sequentially with an active AbortController`.
* **Rationale & Recommendation**: By default, local Ollama instances serialize LLM/TTS model inference unless configured with high parallel slot allocations (`OLLAMA_NUM_PARALLEL`), which consumes multiplied GPU VRAM. Firing unbounded concurrent synthesis requests risks saturating local hardware and causing request timeouts. The architecture should strictly formalize a sequential look-ahead pipeline with a bounded buffer depth of 1 (prefetch sentence $N+1$ while playing sentence $N$). Update the sequence diagram to reflect sequential look-ahead prefetching rather than unrestricted concurrency.

---

### Offscreen Web Audio Autoplay Policy & Suspended AudioContext State - Severity: 🟡 Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 144, 156-163, 339`
* **Discrepancy Description**: Chrome enforces strict Autoplay policies for the Web Audio API. While `chrome.offscreen.createDocument({ reasons: ['AUDIO_PLAYBACK'] })` permits audio output, an `AudioContext` created in an offscreen DOM context (which receives no direct user mouse clicks or keyboard gestures) often initializes in the `'suspended'` state.
* **Rationale & Recommendation**: If `AudioContext.state === 'suspended'`, calling `sourceNode.start()` will either fail silently or buffer indefinitely without emitting audio until resumed. The audio engine architecture must explicitly mandate verifying context state and invoking `await audioContext.resume()` prior to scheduling the first audio buffer.

---

### Teardown Timer Race Condition & Session Overlap Invalidation - Severity: 🟡 Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 128-129, 145, 313`
* **Discrepancy Description**: The background service worker initiates a 15-second idle timer upon receiving `PLAYBACK_FINISHED` or `CANCEL_PLAYBACK` to close the offscreen document. If a user highlights a new passage and clicks "Play" at second 14, the existing timer may fire one second into the new session, invoking `chrome.offscreen.closeDocument()` and terminating active playback.
* **Rationale & Recommendation**: The service worker lifecycle manager must maintain a reference to the active teardown timer handle (`teardownTimeoutId`) and explicitly call `clearTimeout(teardownTimeoutId)` upon receiving any new `START_PLAYBACK` intent before proceeding with session routing.

---

### Premature Implementation Snippets & Altitude Drops in Architecture Specification - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 151-153, 158-162`
* **Discrepancy Description**: The high-level Architecture section embeds concrete regex code (`text.match(/[^.!?\n]+[.!?\n]+(?:\s+|$)|[^.!?\n]+$/g)`) and raw JavaScript scheduling lines (`nextScheduledTime = startTime + buffer.duration`).
* **Rationale & Recommendation**: Under the Zoom-Out Standard (Anti-Weeds), high-level architecture must define interfaces, component responsibilities, and data contracts. Embedding concrete regex logic and scheduling pseudocode in Section 3 of the technical plan creates maintenance drift. Retain interface contracts in the architecture section and delegate concrete regex and math details to Section 244 (Detailed Implementation Plan).
