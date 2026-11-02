# Goldfish Review Report: Stage 8 - Intermediate Zoom Out Review

**Target:** `/Users/yash/Documents/Repos/outloud/docs/designs/outloud.md` (`Full File: Lines 1-402`)  
**Standard:** `resources/document_standards/zoom-out-standard.md`  
**Reviewer Lens:** `egm-zoom-out` (Skeptical Architect - Intermediate Check)

---

## Prioritized Findings (Blockers -> Major -> Nits)

### Ephemeral Service Worker Termination Severing Offscreen Playback State - Severity: 🟡 Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 72-78, 142-147, 166-179`
* **Discrepancy Description**: In Manifest V3, background service workers terminate after 30 seconds of inactivity. If a user starts audio playback on a long document, the offscreen document will continue generating and playing audio for several minutes. During this period, if no messages pass through the service worker, Chrome will terminate the service worker thread. When the offscreen document later finishes playback or encounters an error and sends `{ type: 'PLAYBACK_FINISHED' }`, the service worker must wake up to receive it. If the content script queries playback state while the service worker is reviving, state synchronization can break.
* **Rationale & Recommendation**: Architect the offscreen document as the sole authoritative state holder for playback session lifecycle. Ensure message listeners in the service worker do not hold ephemeral session state in unpersisted global variables; either store active session metadata in `chrome.storage.session` or establish direct port connections between the Content Script and Offscreen Document using `chrome.runtime.connect()`.

---

### Teardown Timer Invalidation & Session Overlap Invariant - Severity: 🟡 Major
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 128-129, 145, 313`
* **Discrepancy Description**: As identified in Stage 5, the 15-second idle teardown timer in the Service Worker lacks an explicit cancellation contract when new playback sessions are initiated during the cooldown window.
* **Rationale & Recommendation**: Explicitly document the invariant: `ensureOffscreenDocument()` must always check and clear any active `teardownTimerId`. If a document already exists, reuse it immediately and reset the idle timer.

---

### Inefficient Asset Bundling via `web_accessible_resources` for Shadow DOM - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 139, 257, 301-307`
* **Discrepancy Description**: Declaring floating pill SVG icons and CSS files in `web_accessible_resources` exposes extension asset paths to host web page scripts, allowing host pages to detect the extension's presence.
* **Rationale & Recommendation**: Because the floating pill is rendered inside a closed Shadow Root created by the content script, all SVG icons and CSS rules can be bundled directly into `src/content/pill.ts` as inline SVG strings and CSS template literals (`adoptedStyleSheets` or `<style>` elements). This removes the need for `web_accessible_resources`, reduces packaging complexity, and improves privacy.

---

### Architectural Fit of Client-Side Text Segmentation vs Platform APIs (`Intl.Segmenter`) - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-zoom-out`
* **Affected Scope:** `Lines 150-153, 329-335`
* **Discrepancy Description**: Implementing custom regex tokenization and abbreviation handling in `sentence-tokenizer.ts` introduces unnecessary code maintenance. Modern Chrome desktop runtimes (v87+) provide `Intl.Segmenter` natively.
* **Rationale & Recommendation**: Relying on standard web platform APIs simplifies the codebase, reduces bundle size, and improves segmentation accuracy across languages.
