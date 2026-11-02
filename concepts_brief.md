# Local Phonon Text-to-Speech Chrome Extension

* **Author:** EGM Synthesizer
* **Date:** 2026-11-02

## Overview

This feature is a Manifest V3 Chrome extension that reads selected web page text aloud using a locally running Phonon text-to-speech model hosted on an Ollama daemon. The extension captures user-highlighted text in the browser document, renders an isolated Shadow DOM floating pill with playback and voice controls, routes synthesis requests to the local Ollama API endpoint (`POST http://localhost:11434/v1/audio/speech`), and decodes and plays the audio via a dedicated Manifest V3 offscreen document.

The primary target user is any user who reads long-form articles, documentation, or study material in Chrome and requires offline, privacy-preserving text-to-speech without sending page text to third-party cloud services.

## Analysis

### 1. Contrarian Architecture & Web Platform Alternatives (Zoom-Out Lens)
* **Web Speech API vs. Local Ollama**: Modern browsers already ship with `window.speechSynthesis`. The Web Speech API operates directly inside the DOM context with zero setup, zero network overhead, and zero extra memory consumption. Relying on Ollama requires users to install Ollama, download a dedicated TTS model, keep a local daemon running on port 11434, and dedicate significant CPU/GPU resources. The feature concept is only justified if Phonon provides substantially superior prosody, naturalness, or voice customization that offline browser voices cannot match.
* **The "Fire-and-Forget" Contradiction**: The original concept specified fire-and-forget play/stop controls. For streaming audio synthesis, fire-and-forget is technically unworkable. If a play action is fire-and-forget, the user cannot halt audio when navigating or clicking stop. Clicking stop must immediately trigger an `AbortController.abort()` to terminate the pending HTTP fetch to Ollama and call `AudioContext.suspend()` or `AudioBufferSourceNode.stop()`. Otherwise, the local machine continues burning GPU/CPU cycles generating unused audio while orphaned buffers play out.
* **Offscreen Document vs. Content Script Audio**: The Web Audio API can play directly inside the content script when triggered by a user gesture (such as clicking the floating pill). However, tab-bound audio halts immediately when the user navigates, refreshes, or closes the tab. Delegating audio playback to an MV3 offscreen document managed by the background service worker is necessary if playback must persist across page navigation or tab switches.

### 2. Binary Audio Streaming & Web Audio Decoding Limits (Implementation Lens)
* **Web Audio Decoding Fragmentation**: The concept specifies streaming binary audio chunks from `POST /v1/audio/speech`. In Web standards, `AudioContext.decodeAudioData()` cannot decode incomplete or streaming audio chunks; it requires a complete file container (e.g., complete WAV header or MP3 frame structure) and throws an encoding error when passed arbitrary byte slices.
* **Stream Delivery Mechanisms**: True real-time audio playback requires one of three explicit architectures:
  1. *Sentence-Level Chunking (Recommended)*: Split selected text into sentences client-side. Request sentence audio chunks sequentially, decode each complete sentence buffer, and schedule them back-to-back in Web Audio.
  2. *Raw PCM Streaming*: Stream raw 16-bit or 32-bit float PCM over the HTTP stream and feed samples directly into an `AudioWorkletNode` ring buffer.
  3. *MediaSource Extensions (MSE)*: Feed an `audio/mpeg` byte stream into a `SourceBuffer`.
* **CORS and MV3 Permissions**: Content scripts cannot directly fetch `http://localhost:11434` if the host webpage enforces a strict Content Security Policy (`connect-src`). Fetch requests must be executed from the background service worker or the offscreen document, which require `"host_permissions": ["http://localhost:11434/*"]` in `manifest.json`. Furthermore, Ollama must accept the `chrome-extension://` origin, which may require configuring `OLLAMA_ORIGINS` on the user's local daemon.

### 3. Local Compute Footprint & Latency (Design Critic Lens)
* **GPU/CPU Saturation & Concurrency**: Running neural text-to-speech locally consumes notable CPU threads or GPU VRAM. Ollama queues requests sequentially by default. If a user highlights a 3,000-word article, sending the entire text in one request creates high time-to-first-audio latency and risks memory exhaustion on laptops without dedicated GPUs.
* **Selection Boundaries & Throttling**: The extension must enforce a maximum character threshold per synthesis request (e.g., 2,500 characters) and reject or auto-paginate larger text blocks. Concurrent play requests must be blocked; initiating a new play request must cancel any active job before dispatching a new one.

### 4. DOM Contention & User Friction (Comprehension & UX Lens)
* **Selection Interference**: Spawning a floating pill on every text selection disrupts standard browsing operations (e.g., copying text, selecting form inputs, clicking within text fields). The pill must only render on valid text nodes outside editable fields (`input`, `textarea`, `[contenteditable]`), must reposition cleanly near the selection boundary, and must dismiss immediately when the user clicks elsewhere.
* **Daemon Connectivity & Actionable Feedback**: If Ollama is offline or the Phonon model is not pulled, silent failure degrades user trust. The floating pill must reflect real-time daemon state:
  * Connection failure: "Ollama not running on localhost:11434."
  * Model missing: "Model 'phonon' not found. Run 'ollama pull phonon'."
  * Active states: Buffering, Playing, Stopped.
* **Voice Selection Ergonomics**: The floating pill must remain compact. Embedding an extensive voice list inside a tiny floating pill creates UI clutter. Voice selection, default speed, and model settings should live in the extension options/popup, while the pill exposes simple Play, Pause/Stop, and a quick-toggle voice selector.

### 5. Multi-Process Lifecycle & Observability (Codebase Details Lens)
* **MV3 Service Worker Inactivity**: Chrome MV3 service workers terminate after 30 seconds of idle time. The service worker must not maintain streaming state in memory. The offscreen document must manage the active streaming connection and audio buffer lifecycle directly, reporting high-level state changes (`PLAYING`, `ENDED`, `ERROR`) back to the background worker.
* **Offscreen Document Resource Leaks**: Offscreen documents consume memory continuously if left open. The service worker must create the offscreen document on demand (`chrome.offscreen.createDocument`) when playback begins and close it (`chrome.offscreen.closeDocument`) after audio finishes or the user clicks stop.
* **Diagnostic Logging & Context Prefixing**: The system spans four isolated runtimes: Content Script, Background Service Worker, Offscreen Document, and Ollama HTTP server. All errors and lifecycle events must include structured logging prefixes (`[Phonon:CS]`, `[Phonon:SW]`, `[Phonon:Offscreen]`) to allow rapid diagnosis via Chrome DevTools.

### 6. Decoupling & Long-Term Maintainability (Structural Lens)
* **Audio Provider Abstraction**: Tightly coupling the UI and playback pipeline to Ollama's specific endpoint structure creates technical debt. The background communication layer must define an `AudioProvider` interface (`synthesize(text, voice, signal) -> ReadableStream`). This allows substituting alternative local runners (e.g., llama.cpp, Piper TTS, Kokoro) without restructuring the DOM or offscreen audio layers.
* **Stateless UI Pill**: The Shadow DOM floating pill must remain a presentation component. It dispatches user intents (`PLAY`, `STOP`, `SELECT_VOICE`) to the extension runtime and renders incoming status updates (`STATE_CHANGE`). It must not attempt to manage network connections or decode audio directly.

## Goals vs. Non-Goals

### In-Scope Goals
* **Isolated Floating Pill UI**: Render a lightweight Shadow DOM floating pill adjacent to user-highlighted text on web pages, isolated from page CSS.
* **Local Ollama Integration**: Communicate with a local Ollama instance at `http://localhost:11434/v1/audio/speech` using configurable model names and voice parameters.
* **Sentence-Pipelined Audio Playback**: Implement sentence-boundary chunking to stream and play audio segments with low time-to-first-audio latency using an MV3 offscreen document.
* **Deterministic Stop & Cancellation**: Provide an instant Stop control that terminates network requests via `AbortController`, purges buffered audio, and frees the Web Audio context.
* **Health Check & Error Feedback**: Query Ollama tags on initialization and display actionable error messages in the pill or options page when the daemon or model is unavailable.
* **Offscreen Lifecycle Management**: Automatically spawn the offscreen document when playback begins and terminate it when playback stops or goes idle.

### Out-of-Scope Non-Goals
* **Cloud TTS Fallbacks**: No support for remote third-party speech APIs (e.g., ElevenLabs, OpenAI, Google Cloud). The extension operates strictly on local infrastructure.
* **Full-Page Scraping / Readability Mode**: The extension will not parse entire web pages or extract article reader views; it only processes text explicitly selected by the user.
* **Text-to-Audio File Export**: Downloading or saving generated speech as MP3/WAV files to disk is excluded from the initial release.
* **Mobile / Non-Chrome Browser Support**: The initial target is desktop Google Chrome (Manifest V3). Firefox, Safari, and mobile browsers are excluded.

## Key Decisions & Staging for Next Steps

1. **Audio Decoding Strategy**: Abandon raw binary chunk streaming into `decodeAudioData`. Adopt sentence-level text chunking on the client: split text into sentences, dispatch sequential requests to Ollama, and schedule decoded audio buffers gaplessly in the Web Audio context.
2. **Cancellation Pipeline**: Replace "fire-and-forget" with explicit `AbortController` handles tied to a single active session ID. A user click on "Stop" or highlighting new text aborts any in-flight Ollama fetch immediately.
3. **Network Routing via Extension Context**: Route all HTTP requests to `localhost:11434` through the background service worker or offscreen document to circumvent host page Content Security Policy limitations.
4. **Offscreen Lifecycle Invariant**: Offscreen document is created strictly on `AUDIO_PLAYBACK` demand and torn down after a 15-second idle timeout post-playback.
5. **Next Step**: Ingest `concepts_brief.md` into `/egm-draft` to produce the full Technical Design and Architecture Document.
