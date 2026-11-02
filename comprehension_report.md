# Goldfish Review Report: Stage 6 - Comprehension Test

**Target:** `/Users/yash/Documents/Repos/outloud/docs/designs/outloud.md` (`FeatureRange: Lines 1-243 & DetailedRange: Lines 244-401`)  
**Standard:** `resources/document_standards/re-implementation-standard.md`  
**Reviewer Lens:** `egm-comprehension` (Comprehension Goldfish / Naive Reader)

---

## Prioritized Findings (Blockers -> Major -> Nits)

### Undefined Ollama Speech Synthesis Request Schema & Audio Encoding Contract - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-comprehension`
* **Affected Scope:** `Lines 102, 110, 238, 340`
* **Discrepancy Description**: The document repeatedly references `POST /v1/audio/speech`, describing it as an "OpenAI-compatible speech endpoint specification" (line 238). However, it never defines the required JSON request body, headers, or expected binary container format. An implementing engineer has no specification for:
  1. The exact JSON request payload keys (e.g., does it expect `{ "model": "phonon", "input": text, "voice": voice }`, `{ "text": text }`, or `{ "prompt": text }`?).
  2. The binary audio format returned by Ollama/Phonon: Does it return `audio/mpeg` (MP3), `audio/wav` (PCM WAV), or raw unheadered PCM bytes?
  3. `AudioContext.decodeAudioData()` requires a complete audio container (WAV header or MP3 frame structure) and throws `EncodingError` if passed raw PCM or fragmented containers.
* **Rationale & Recommendation**: Violates the Zero-Assumption Rule. Document the exact request JSON schema and response headers in `src/offscreen/audio-player.ts` and `src/common/types.ts`:
  ```typescript
  interface OllamaSpeechRequest {
    model: string;
    input: string;
    voice?: string;
    response_format?: 'mp3' | 'wav';
  }
  ```
  Explicitly verify and state that Phonon via Ollama outputs complete, standard MP3 or WAV binary bytes per chunk.

---

### Unresolved Voice Discovery Contract in Options Popup and Floating Pill - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-comprehension`
* **Affected Scope:** `Lines 43, 172, 277, 348`
* **Discrepancy Description**: Open Question line 43 states that Ollama lacks a `/v1/audio/voices` endpoint and asks whether the extension should maintain a curated list or query `/api/show`. In line 348, `src/popup/popup.html` lists hardcoded options: `Voice dropdown (default, Zoey, Easton, Freya)`. However:
  1. No contract defines how `src/popup/popup.ts` populates this list.
  2. If the user changes `modelName` from `phonon` to another model, does the extension still display `Zoey, Easton, Freya`?
  3. What happens if an invalid voice string is sent to Ollama?
* **Rationale & Recommendation**: An implementer must guess how voices are enumerated, validated, and persisted. Define a concrete schema and fallback strategy: specify a default static voice map for `phonon`, document fallback behavior (`default`), and define whether `/api/show` response inspection is supported.

---

### Ambiguous Sentence Segmentation Boundary Logic and Punctuation Edge Cases - Severity: 🟡 Major
* **Reviewer Lens:** `egm-comprehension`
* **Affected Scope:** `Lines 150-153, 332-335, 365-367`
* **Discrepancy Description**: The regex provided in line 152:
  ```javascript
  const sentences = text.match(/[^.!?\n]+[.!?\n]+(?:\s+|$)|[^.!?\n]+$/g) || [text];
  ```
  breaks on common English text patterns:
  - Decimals and version numbers ("Phonon 1.2 is fast"): splits at `1.` and `2 is fast`.
  - Abbreviations ("Dr. Smith, e.g., in the U.S."): splits into multiple broken micro-sentences.
  - Ellipses ("Wait... what?"): generates empty or fragmented chunks.
  - URLs and technical terms ("Visit localhost:11434"): splits at punctuation marks.
  While line 333 notes "preserving abbreviations and quotes", no algorithm or boundary rule is provided.
* **Rationale & Recommendation**: Rather than inventing fragile bespoke regular expressions, the specification should mandate standard platform tools: modern Chrome supports `Intl.Segmenter` natively:
  ```javascript
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const sentences = Array.from(segmenter.segment(text), s => s.segment.trim()).filter(Boolean);
  ```
  This handles abbreviations, quotes, multilingual sentence boundaries, and ellipses deterministically without custom parsing logic.

---

### Undefined Synthesis Error Propagation, Recovery, and Retries - Severity: 🟡 Major
* **Reviewer Lens:** `egm-comprehension`
* **Affected Scope:** `Lines 176, 327, 340-344`
* **Discrepancy Description**: `ExtensionMessage` specifies `{ type: 'PLAYBACK_STATUS_UPDATE', state: 'ERROR', errorMessage?: string }`. However, the document does not define the system response when an error occurs during pipelined playback:
  1. If Chunk 3 of 5 fails with an HTTP 500 or network timeout from Ollama, does playback immediately halt, or do Chunks 1 and 2 finish playing?
  2. Does the audio player attempt retries?
  3. How is the floating pill UI notified, and does the pill reset from "Stop" back to "Play"?
* **Rationale & Recommendation**: Detail the error state machine: on network or decode failure for chunk $N$, abort all pending chunk fetches, stop scheduled nodes immediately, set state to `ERROR`, relay `errorMessage` to the service worker and content script, and reset the floating pill to the initial "Play" state displaying an error badge.

---

### Undefined Client Session Identification Contract across Async Contexts - Severity: 🟡 Major
* **Reviewer Lens:** `egm-comprehension`
* **Affected Scope:** `Lines 95, 118, 170-178, 311`
* **Discrepancy Description**: Step 95 states `SW->>SW: Generate unique sessionId`, and step 118 shows the Content Script sending `STOP_PLAYBACK` with `sessionId`. But `START_PLAYBACK` (line 172) does not include a `sessionId`. If the Service Worker generates `sessionId`, the Content Script has no mechanism to know `sessionId` unless the Service Worker sends a synchronous or asynchronous acknowledgment containing `sessionId`.
* **Rationale & Recommendation**: Clarify the session identity contract. Either:
  1. The Content Script generates `sessionId` (e.g. `crypto.randomUUID()`) and includes it in `START_PLAYBACK`; OR
  2. The Service Worker returns `{ sessionId }` in response to `START_PLAYBACK`, and the Content Script stores it to pass with `STOP_PLAYBACK`. Option 1 is simpler and avoids race conditions.

---

### Superfluous `activeTab` Permission Declaration in Manifest - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-comprehension`
* **Affected Scope:** `Lines 253, 255`
* **Discrepancy Description**: Line 253 declares `permissions: ["offscreen", "storage", "activeTab"]`, while line 255 declares `content_scripts` running on `<all_urls>`.
* **Rationale & Recommendation**: `activeTab` is intended for extensions that inject scripts on explicit user invocation via the action/popup menu. Because OutLoud uses declaratively injected content scripts across all URLs to observe selection events, `activeTab` is redundant. Remove `activeTab` from `manifest.json`.
