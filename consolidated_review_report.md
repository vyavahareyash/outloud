# OutLoud: Consolidated EGM Review Report

* **Target File:** `/Users/yash/Documents/Repos/outloud/docs/designs/outloud.md`
* **Audit Mode:** Full Uninterrupted Review (Stages 5, 6, 7, 8, 9)
* **Date:** 2026-11-02
* **Auditor:** EGM Multi-Agent Review Swarm (Elephant-Goldfish Protocol)

---

## Executive Summary

A comprehensive document audit of the OutLoud technical design document was conducted across all five specialized EGM evaluation stages:
1. **Stage 5 (Initial Zoom Out)**: High-altitude architecture, YAGNI, simplicity, and anti-weeds.
2. **Stage 6 (Comprehension Test)**: Re-implementation viability and zero-assumption rule.
3. **Stage 7 (Critic Review)**: Deep architectural critique, failure modes, layout, and style.
4. **Stage 8 (Intermediate Zoom Out)**: Holistic system invariants and cross-process boundaries.
5. **Stage 9 (Implementation Readiness Test)**: Actionability of detailed plan and zero-decision rule.

### Severity Breakdown
* 🔴 **Blockers:** 6
* 🟡 **Major Issues:** 8
* 🟢 **Nits:** 5
* **Total Action Items:** 19

**Audit Verdict:** 🟡 **Conditional Pass / Requires Remediation**. The core architecture (MV3 Offscreen Web Audio + Shadow DOM Floating Pill + Background Message Router) is well-founded. However, before engineering begins, 6 critical blockers must be resolved in `docs/designs/outloud.md` to prevent implementation failures regarding CORS daemon access, audio context autoplay activation, text selection collapse during clicks, undefined Ollama API payload schemas, and unbounded audio buffer memory consumption.

---

## Prioritized Consolidated Findings

### 🔴 Blockers

#### ACT-01: Resolve Ollama Server CORS (`OLLAMA_ORIGINS`) and Extension Origin Policy
* **Affected Scope:** `Lines 44-45, 146, 254`
* **Discrepancy:** The document claims `"host_permissions": ["http://localhost:11434/*"]` resolves network communication constraints, yet acknowledges in Open Questions that standard Ollama daemons enforce strict CORS against `chrome-extension://` origins unless launched with `OLLAMA_ORIGINS="*"`. MV3 host permissions bypass client-side web page CSP, but do not bypass server-side CORS origin filtering on the local daemon.
* **Resolution:** Close Open Question #2. Document that local Ollama must be launched with `OLLAMA_ORIGINS="*"`. Update the `CHECK_DAEMON_HEALTH` endpoint test to explicitly check for CORS preflight errors and display actionable terminal instructions if preflight fails.

#### ACT-02: Formalize Ollama `/v1/audio/speech` Request Payload Schema and Binary Audio Format
* **Affected Scope:** `Lines 102, 110, 238, 340`
* **Discrepancy:** `POST /v1/audio/speech` is referenced without defining the required JSON request body, headers, or expected binary audio container format (MP3 vs WAV). `AudioContext.decodeAudioData()` fails if passed raw PCM bytes or fragmented containers.
* **Resolution:** Explicitly document the TypeScript interface:
  ```typescript
  interface OllamaSpeechRequest {
    model: string;
    input: string;
    voice?: string;
    response_format?: 'mp3' | 'wav';
  }
  ```
  Specify that each chunk request returns a complete, headered MP3 or WAV binary container compatible with `decodeAudioData()`.

#### ACT-03: Complete TypeScript Message Schemas and Session Identification Contract
* **Affected Scope:** `Lines 95, 118, 170-178, 272-279, 311`
* **Discrepancy:** `START_PLAYBACK` lacks a `sessionId` property, making it impossible for the Content Script to know which session ID to supply when calling `STOP_PLAYBACK { sessionId }`. `CHECK_DAEMON_HEALTH` also lacks a typed response payload.
* **Resolution:** Standardize the contract so the Content Script generates a unique `sessionId` (`crypto.randomUUID()`) upon click and includes it in `START_PLAYBACK`. Add typed message schemas for `DAEMON_HEALTH_STATUS` in `src/common/types.ts`.

#### ACT-04: Intercept Pointer Events on Floating Pill to Prevent Text Selection Collapse
* **Affected Scope:** `Lines 90-94, 134-141, 293-300`
* **Discrepancy:** In desktop browsers, clicking any DOM element outside an active selection triggers `selectionchange` and collapses the highlighted range. Without intercepting pointer events, clicking "Play" collapses the selection before the click event resolves, causing the pill to disappear and losing the text payload.
* **Resolution:** Mandate that the floating pill root container binds `mousedown` and `pointerdown` listeners with `event.preventDefault()` to preserve browser selection focus.

#### ACT-05: Specify Concrete AudioPlayer Concurrency, Lookahead Watermark, and Queue Engine
* **Affected Scope:** `Lines 110, 137, 155, 164, 231, 336-344`
* **Discrepancy:** The plan specifies queuing and scheduling in broad terms without defining the concurrency pipeline, prefetch depth, timeline drift compensation (`nextScheduledTime`), or memory release for finished nodes. Selecting 10,000 characters could decompress into 100MB+ of audio buffers, violating memory limits.
* **Resolution:** Define `AudioPlayer` class specifications:
  1. Implement a sliding lookahead window: prefetch and decode at most 1 sentence chunk ahead of the actively playing chunk.
  2. Maintain `activeSources: Set<AudioBufferSourceNode>`, attaching `.onended` to unreference and garbage collect finished buffers.
  3. Reconcile sequence diagram and text: use sequential lookahead prefetching rather than unbounded concurrency.

#### ACT-06: Formulate Binding Voice Discovery and Fallback Contract
* **Affected Scope:** `Lines 43, 172, 277, 348`
* **Discrepancy:** Line 43 leaves voice discovery open, while `popup.html` hardcodes `default, Zoey, Easton, Freya` without documenting how voices are validated, queried, or selected if models change.
* **Resolution:** Close Open Question #1. Define a static voice catalog mapping supported voices for `phonon`, persist preference in `chrome.storage.sync`, and fallback to `"default"` if an unrecognized voice is provided.

---

### 🟡 Major Issues

#### ACT-07: Mandate Explicit `AudioContext.resume()` Activation in Offscreen Document
* **Affected Scope:** `Lines 144, 156-163, 339`
* **Discrepancy:** Chrome's Autoplay policy causes `AudioContext` instances created in offscreen documents to initialize in the `'suspended'` state. Calling `sourceNode.start()` on a suspended context buffers silently without playing sound.
* **Resolution:** Explicitly specify calling `if (this.ctx.state === 'suspended') await this.ctx.resume();` prior to scheduling audio playback.

#### ACT-08: Standardize Teardown Timer Cancellation on Session Overlap in Service Worker
* **Affected Scope:** `Lines 128-129, 145, 313`
* **Discrepancy:** The 15-second idle teardown timer in the Service Worker is not cancelled if a user highlights a new passage and clicks "Play" before the timer expires, causing the offscreen document to be destroyed mid-session.
* **Resolution:** Maintain `teardownTimeoutId` in the background worker and unconditionally execute `clearTimeout(teardownTimeoutId)` upon receiving any new `START_PLAYBACK` intent.

#### ACT-09: Adopt Platform `Intl.Segmenter` Over Fragile Regular Expressions
* **Affected Scope:** `Lines 150-153, 329-335, 365-367`
* **Discrepancy:** The proposed regex `text.match(/[^.!?\n]+[.!?\n]+(?:\s+|$)|[^.!?\n]+$/g)` fragments decimals ("version 1.2"), abbreviations ("Dr. Smith"), ellipses, and URLs.
* **Resolution:** Replace custom regex tokenization with the native `Intl.Segmenter('en', { granularity: 'sentence' })` API built into Chrome 87+.

#### ACT-10: Define Synthesis Error Propagation, Recovery, and Retries State Machine
* **Affected Scope:** `Lines 176, 327, 340-344`
* **Discrepancy:** The document specifies an `ERROR` state in `ExtensionMessage` but does not specify how in-flight nodes are halted, whether retries are attempted, or how the floating pill UI recovers back to the "Play" state.
* **Resolution:** Define explicit error transitions: on network/decode failure, abort active queue fetches, stop scheduled buffer sources, broadcast `PLAYBACK_STATUS_UPDATE` with `state: 'ERROR'`, and reset the pill to "Play" with an error tooltip.

#### ACT-11: Enforce Client-Side Request Timeout on Local Ollama HTTP Fetch
* **Affected Scope:** `Lines 102, 155, 340`
* **Discrepancy:** HTTP fetch requests to Ollama rely solely on user cancellation via `AbortController`. If Ollama deadlocks or hangs, requests hang indefinitely with a stuck buffering indicator.
* **Resolution:** Wrap all fetch requests with `AbortSignal.any([userAbortSignal, AbortSignal.timeout(15000)])` to guarantee fail-fast behavior after 15 seconds of inactivity.

#### ACT-12: Architect Authoritative Offscreen State to Handle Ephemeral MV3 Service Worker Unloading
* **Affected Scope:** `Lines 72-78, 142-147, 166-179`
* **Discrepancy:** MV3 service workers terminate after 30s of inactivity. In multi-minute playback sessions, service worker termination risks severing state synchronization between the offscreen document and content scripts.
* **Resolution:** Designate the Offscreen Document as the authoritative state container for active playback, using `chrome.storage.session` for shared cross-context state caching.

#### ACT-13: Specify Exact `esbuild` Multi-Entrypoint Build Script and Toolchain Setup
* **Affected Scope:** `Lines 260-266`
* **Discrepancy:** The plan specifies "bundler (e.g. esbuild)" without documenting the multi-target build script or configuration required for MV3 extensions.
* **Resolution:** Standardize on `esbuild` and include a documented `build.mjs` script mapping `content.ts`, `service-worker.ts`, `offscreen.ts`, and `popup.ts` to `dist/`.

#### ACT-14: Detail Web Audio Unit Testing Mocking Infrastructure for Vitest
* **Affected Scope:** `Lines 368-374`
* **Discrepancy:** Vitest runs in Node/jsdom where `AudioContext` and `AudioBufferSourceNode` do not exist. Direct testing fails without mock infrastructure.
* **Resolution:** Document a concrete mock setup in `tests/setup.ts` using `standardized-audio-context-mock` or explicit in-memory stubs.

---

### 🟢 Nits

#### ACT-15: Remove Superfluous `activeTab` Permission from `manifest.json`
* **Affected Scope:** `Lines 253, 255`
* **Discrepancy:** `activeTab` is redundant because content scripts are declaratively registered across `<all_urls>`.
* **Resolution:** Delete `"activeTab"` from the `permissions` array in `manifest.json`.

#### ACT-16: Bundle Pill Assets Directly into Shadow DOM Script to Eliminate `web_accessible_resources`
* **Affected Scope:** `Lines 139, 257, 301-307`
* **Discrepancy:** Listing pill icons in `web_accessible_resources` exposes extension assets to fingerprinting by host pages.
* **Resolution:** Inline SVG icons and CSS template strings directly into `src/content/pill.ts` inside the closed Shadow Root.

#### ACT-17: Remove Implementation Regex/Snippets from High-Altitude Architecture Section
* **Affected Scope:** `Lines 151-153, 158-162`
* **Discrepancy:** Low-level regex strings and variable assignments in Section 3 violate the Anti-Weeds principle.
* **Resolution:** Replace inline implementation code in Section 3 with interface contracts; keep implementation details in Section 244.

#### ACT-18: Standardize Tone, Strip Promotional Phrasing, and Refine Mermaid Sequence Lifelines
* **Affected Scope:** `Lines 23, 28, 81-130, 202, 216`
* **Discrepancy:** Minor promotional phrases ("zero data egress", "low TTFA") and lack of sequence activation bars.
* **Resolution:** Rephrase with dry, factual language and add activation lifelines to the sequence diagram.

#### ACT-19: Include Linter Configuration File (`biome.json` or `eslint.config.js`) in Target Files
* **Affected Scope:** `Lines 260-271`
* **Discrepancy:** `package.json` specifies `"lint"`, but no config file is listed in the files breakdown.
* **Resolution:** Add `biome.json` or `eslint.config.js` to the Target Files list.

---

## Traceability Matrix

| Stage | Raw Finding ID | Reviewer Lens | Scope | Consolidated Action Item |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 5** | 5.1 | `egm-zoom-out` | L44-45, 146 | **ACT-01** (🔴 Blocker - Ollama CORS) |
| **Stage 5** | 5.2 | `egm-zoom-out` | L110, 155 | **ACT-05** (🔴 Blocker - Concurrency Model) |
| **Stage 5** | 5.3 | `egm-zoom-out` | L144, 156-163 | **ACT-07** (🟡 Major - AudioContext Resume) |
| **Stage 5** | 5.4 | `egm-zoom-out` | L128-129, 145 | **ACT-08** (🟡 Major - Teardown Race Condition) |
| **Stage 5** | 5.5 | `egm-zoom-out` | L151-153, 158-162 | **ACT-17** (🟢 Nit - Anti-Weeds Altitude Drop) |
| **Stage 6** | 6.1 | `egm-comprehension` | L102, 110, 238 | **ACT-02** (🔴 Blocker - Ollama Payload Schema) |
| **Stage 6** | 6.2 | `egm-comprehension` | L43, 172, 348 | **ACT-06** (🔴 Blocker - Voice Discovery) |
| **Stage 6** | 6.3 | `egm-comprehension` | L150-153, 332 | **ACT-09** (🟡 Major - Sentence Segmentation) |
| **Stage 6** | 6.4 | `egm-comprehension` | L176, 327 | **ACT-10** (🟡 Major - Error State Recovery) |
| **Stage 6** | 6.5 | `egm-comprehension` | L95, 118, 170 | **ACT-03** (🔴 Blocker - Session ID Schema) |
| **Stage 6** | 6.6 | `egm-comprehension` | L253, 255 | **ACT-15** (🟢 Nit - Redundant activeTab) |
| **Stage 7** | 7.1 | `egm-design` | L90-94, 134-141 | **ACT-04** (🔴 Blocker - Selection Collapse) |
| **Stage 7** | 7.2 | `egm-design` | L137, 164, 231 | **ACT-05** (🔴 Blocker - Memory Pressure) |
| **Stage 7** | 7.3 | `egm-design` | L102, 155, 340 | **ACT-11** (🟡 Major - Fetch Timeout) |
| **Stage 7** | 7.4 | `egm-structural` | L41-45 | **ACT-01 / ACT-06** (🔴 Blocker - Open Questions) |
| **Stage 7** | 7.5 | `egm-structural` | L81-130 | **ACT-18** (🟢 Nit - Diagram Formatting) |
| **Stage 7** | 7.6 | `egm-style` | L23, 28, 202 | **ACT-18** (🟢 Nit - Promotional Phrasing) |
| **Stage 8** | 8.1 | `egm-zoom-out` | L72-78, 142 | **ACT-12** (🟡 Major - Service Worker Lifetime) |
| **Stage 8** | 8.2 | `egm-zoom-out` | L128-129, 313 | **ACT-08** (🟡 Major - Teardown Invalidation) |
| **Stage 8** | 8.3 | `egm-zoom-out` | L139, 257 | **ACT-16** (🟢 Nit - Asset Inlining) |
| **Stage 8** | 8.4 | `egm-zoom-out` | L150-153, 329 | **ACT-09** (🟡 Major - Intl.Segmenter) |
| **Stage 9** | 9.1 | `egm-implementation-readiness` | L336-344 | **ACT-05** (🔴 Blocker - AudioPlayer Engine) |
| **Stage 9** | 9.2 | `egm-implementation-readiness` | L170-178, 272 | **ACT-03** (🔴 Blocker - TypeScript Types) |
| **Stage 9** | 9.3 | `egm-implementation-readiness` | L260-266 | **ACT-13** (🟡 Major - Bundler Config) |
| **Stage 9** | 9.4 | `egm-codebase-details` | L368-374 | **ACT-14** (🟡 Major - Web Audio Mocking) |
| **Stage 9** | 9.5 | `egm-codebase-details` | L260-271 | **ACT-19** (🟢 Nit - Lint Config) |
| **Stage 9** | 9.6 | `egm-style` | L385-398 | **ACT-18** (🟢 Nit - Verification Phrasing) |

---

## Recommended Remediation Roadmap

1. **Step 1: Resolve Open Questions (ACT-01, ACT-06)**
   * Replace the "Open Questions" section with explicit architectural decisions: mandate `OLLAMA_ORIGINS="*"` and document setup; define a static voice whitelist for Phonon.
2. **Step 2: Update Core Protocols and Schemas (ACT-02, ACT-03, ACT-10)**
   * Document `OllamaSpeechRequest` payload and response headers in `src/common/types.ts`.
   * Standardize client-side `sessionId` generation and add `DAEMON_HEALTH_STATUS` message definition.
3. **Step 3: Fix DOM Selection Lifecycle (ACT-04)**
   * Add `mousedown` and `pointerdown` `preventDefault()` requirement to `src/content/pill.ts`.
4. **Step 4: Formalize Audio Engine Specifications (ACT-05, ACT-07, ACT-08, ACT-11)**
   * Document `AudioPlayer` class interface, sequential lookahead queue depth (depth = 1), `ctx.resume()` call, buffer garbage collection via `.onended`, and 15s request timeout.
5. **Step 5: Adopt Platform APIs and Build Tooling (ACT-09, ACT-13, ACT-14, ACT-15, ACT-16)**
   * Mandate `Intl.Segmenter` in `sentence-tokenizer.ts`.
   * Define `build.mjs` with `esbuild`, remove `activeTab`, and inline assets into the Shadow DOM root.
