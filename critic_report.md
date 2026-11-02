# Goldfish Review Report: Stage 7 - Critic Review

**Target:** `/Users/yash/Documents/Repos/outloud/docs/designs/outloud.md` (`FeatureRange: Lines 1-243`)  
**Standards:** `resources/document_standards/feature-spec-standard.md`, `agents/design_critic.md`, `agents/structural.md`, `agents/style.md`  
**Reviewer Lenses:** `egm-design`, `egm-structural`, `egm-style`

---

## Prioritized Findings (Blockers -> Major -> Nits)

### User Text Selection Collapse on Floating Pill Click Interaction - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 90-94, 134-141`
* **Discrepancy Description**: When a user highlights text on a webpage and clicks any external DOM element, browsers dispatch a `selectionchange` event and collapse the active range (`window.getSelection().removeAllRanges()`). If the floating pill does not intercept pointer interaction, clicking the "Play" button triggers selection collapse before the click handler executes! The content script's selection observer will detect an empty selection, trigger the pill dismissal logic, and lose the selected text before the `START_PLAYBACK` message can be sent.
* **Rationale & Recommendation**: The floating pill component must register `mousedown` and `pointerdown` event listeners on its root container and invoke `event.preventDefault()`. This prevents the host document from losing focus or collapsing the text selection when the user clicks the pill controls.

---

### Unbounded AudioBuffer Accumulation and Memory Pressure on Long Selections - Severity: 🟡 Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 137, 164, 231`
* **Discrepancy Description**: The document permits text selections up to 10,000 characters (line 137), translating to approximately 60 to 100 sentences. If the offscreen queue fetches and decodes chunks faster than real-time playback (or if Ollama completes inference rapidly on GPU), dozens of uncompressed PCM `AudioBuffer` objects will be held in memory simultaneously. A 10-minute speech selection decompresses to ~100MB of 44.1kHz audio buffers in memory, directly violating the "< 40MB total memory footprint" non-functional requirement (line 231). Furthermore, storing references to all scheduled `AudioBufferSourceNode`s in an array without cleaning them up after completion creates a memory leak.
* **Rationale & Recommendation**: Introduce a sliding window prefetch limiter:
  1. Cap the offscreen fetch pipeline to a maximum prefetch watermark of 2 chunks ahead of the actively playing chunk.
  2. Listen to `AudioBufferSourceNode.onended` to unreference completed nodes and allow garbage collection of finished `AudioBuffer`s immediately.

---

### Missing Network Request Timeout on Local Ollama HTTP Daemon Calls - Severity: 🟡 Major
* **Reviewer Lens:** `egm-design`
* **Affected Scope:** `Lines 102, 155, 340`
* **Discrepancy Description**: While the document specifies cancellation via `AbortController` when the user clicks "Stop", it specifies no automated timeout for HTTP fetch calls to `http://localhost:11434`. If Ollama deadlocks, hangs during inference, or is paused, `fetch()` will remain pending indefinitely. The extension UI will stay trapped in the "Buffering" state without displaying an actionable error.
* **Rationale & Recommendation**: Enforce an explicit per-chunk network timeout (e.g. 15 seconds) using `AbortSignal.any([userAbortSignal, AbortSignal.timeout(15000)])`. If the timeout fires, transition to `ERROR` state with an actionable message: "Ollama request timed out after 15s."

---

### Open Questions Section Retained in an Architectural Specification - Severity: 🟡 Major
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** `Lines 41-45`
* **Discrepancy Description**: Under the Feature Specification Standard, a technical design advancing to implementation must not leave critical architectural mechanisms unresolved in an "Open Questions" section. Lines 41-45 leave CORS daemon configuration and voice discovery unresolved, yet later sections make contradictory or brittle assumptions regarding both.
* **Rationale & Recommendation**: Transition all items from "Open Questions" into the "Architectural Decisions" or "Technical Plan" sections with clear, binding resolutions (e.g., binding `OLLAMA_ORIGINS` setup and defining a static voice fallback list).

---

### Sequence Diagram Concurrency Formatting and Lifeline Syntax - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-structural`
* **Affected Scope:** `Lines 81-130`
* **Discrepancy Description**: The Mermaid sequence diagram in lines 81-130 lacks explicit context activation bars (`activate`/`deactivate`) and depicts Chunk S2 synthesis as concurrent without indicating how promises/callbacks are synchronized in the offscreen worker.
* **Rationale & Recommendation**: Clean up the Mermaid diagram with explicit lifelines and align sequence step numbering with the sequential lookahead model.

---

### Promotional Phrasing, Decorative Adverbs, and Unmeasurable Performance Claims - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** `Lines 23, 28, 202, 216`
* **Discrepancy Description**: Several phrases violate the plain-English, objective documentation standard:
  - Line 23: "turning highlighted text into real-time spoken audio with zero data egress" (promotional flair).
  - Line 28: "Low Time-to-First-Audio (TTFA)" (subjective adjective; metric is already defined as 600ms).
  - Line 202: "Architectural over-engineering" (subjective editorializing).
* **Rationale & Recommendation**: Rephrase to maintain dry, factual, objective technical descriptions throughout the document.
