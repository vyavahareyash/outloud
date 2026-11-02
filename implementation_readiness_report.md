# Goldfish Review Report: Stage 9 - Implementation Readiness Test

**Target:** `/Users/yash/Documents/Repos/outloud/docs/designs/outloud.md` (`DetailedRange: Lines 244-401`)  
**Standard:** `resources/document_standards/implementation-readiness-standard.md`  
**Reviewer Lenses:** `egm-implementation-readiness`, `egm-codebase-details`, `egm-style`

---

## Prioritized Findings (Blockers -> Major -> Nits)

### Underspecified AudioPlayer Concurrency & Queue Engine Architecture - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** `Lines 336-344 (src/offscreen/audio-player.ts)`
* **Discrepancy Description**: File 13 (`src/offscreen/audio-player.ts`) lists broad behavioral points ("maintain singleton AudioContext", "queue and schedule AudioBufferSourceNode objects", "implement cancel()"), but leaves critical architectural and concurrency mechanisms completely to the implementer:
  1. Queue data structure: How is the sentence queue represented (array, async iterator, generator)?
  2. Prefetch limit: How many chunks ahead are fetched and decoded while Chunk 0 is playing?
  3. Timeline drift: How does `nextScheduledTime` handle gaps where sentence decoding takes longer than sentence audio playback duration?
  4. Memory reclamation: How are finished `AudioBufferSourceNode` objects released to prevent heap exhaustion?
* **Rationale & Recommendation**: This violates the Zero-Decision Rule. Specify the exact class interface, state transitions, and scheduling algorithms:
  ```typescript
  export class AudioPlayer {
    private ctx: AudioContext;
    private queue: string[] = [];
    private activeSources: Set<AudioBufferSourceNode> = new Set();
    private nextScheduledTime: number = 0;
    private abortController: AbortController | null = null;
    private isPlaying: boolean = false;

    async play(sentences: string[], voice: string): Promise<void>;
    cancel(): void;
    private async scheduleNextChunk(): Promise<void>;
  }
  ```
  Explicitly mandate: `nextScheduledTime = Math.max(this.ctx.currentTime, this.nextScheduledTime);`, attach `.onended` to delete sources from `activeSources`, and cap prefetch concurrency to 1 chunk ahead.

---

### Incomplete TypeScript Message Schemas and Missing Error Payloads - Severity: 🔴 Blocker
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** `Lines 170-178, 272-279 (src/common/types.ts)`
* **Discrepancy Description**: The `ExtensionMessage` discriminated union in `src/common/types.ts` is incomplete:
  1. `START_PLAYBACK` lacks a `sessionId` property. If the Service Worker generates `sessionId`, the Content Script cannot know it when later calling `STOP_PLAYBACK { sessionId }`.
  2. `CHECK_DAEMON_HEALTH` lacks a corresponding response type (`DAEMON_HEALTH_RESPONSE`) containing `{ online: boolean, models: string[], error?: string }`.
  3. `AudioChunkPayload` mentioned in line 278 is never defined.
* **Rationale & Recommendation**: Complete the schema in `src/common/types.ts`:
  ```typescript
  export interface ExtensionConfig {
    ollamaHost: string;
    modelName: string;
    selectedVoice: string;
  }

  export type ExtensionMessage =
    | { type: 'START_PLAYBACK'; sessionId: string; text: string; voice?: string }
    | { type: 'STOP_PLAYBACK'; sessionId: string }
    | { type: 'SYNTHESIZE_AND_PLAY'; sessionId: string; text: string; voice: string }
    | { type: 'CANCEL_PLAYBACK'; sessionId: string }
    | { type: 'PLAYBACK_STATUS_UPDATE'; sessionId: string; state: 'IDLE' | 'BUFFERING' | 'PLAYING' | 'ERROR'; errorMessage?: string }
    | { type: 'CHECK_DAEMON_HEALTH' }
    | { type: 'DAEMON_HEALTH_STATUS'; isOnline: boolean; models: string[]; error?: string };
  ```

---

### Undefined Toolchain & Bundler Build Configuration - Severity: 🟡 Major
* **Reviewer Lens:** `egm-implementation-readiness`
* **Affected Scope:** `Lines 260-266 (package.json)`
* **Discrepancy Description**: Line 264 notes "bundler (e.g., `esbuild` targeting Chrome MV3)". It leaves the build script, bundling entrypoints, and asset compilation unspecified. For a multi-entrypoint MV3 extension with Content Script, Service Worker, Offscreen Document, and Popup, an engineer cannot execute `npm run build` without deciding on the build orchestration.
* **Rationale & Recommendation**: Lock down the build tooling. Mandate `esbuild` and document a standalone `build.mjs` script in the plan:
  ```javascript
  import esbuild from 'esbuild';

  await esbuild.build({
    entryPoints: {
      'content/content': 'src/content/content.ts',
      'background/service-worker': 'src/background/service-worker.ts',
      'offscreen/offscreen': 'src/offscreen/offscreen.ts',
      'popup/popup': 'src/popup/popup.ts'
    },
    bundle: true,
    outdir: 'dist',
    format: 'esm',
    target: 'chrome120',
    sourcemap: true
  });
  ```

---

### Missing Web Audio Testing Infrastructure and Mocking Strategy - Severity: 🟡 Major
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** `Lines 368-374 (tests/audio-player.test.ts)`
* **Discrepancy Description**: Running unit tests for `AudioPlayer` in Vitest fails out of the box because Node/jsdom does not implement the Web Audio API (`AudioContext`, `AudioBufferSourceNode`, `decodeAudioData`). Stating "Mock AudioContext..." without detailing the mock implementation or library forces the developer to write custom Web Audio shims from scratch.
* **Rationale & Recommendation**: Detail the test setup in `tests/audio-player.test.ts`: specify `standardized-audio-context-mock` or provide explicit mock stubs for `createBufferSource`, `decodeAudioData`, and `currentTime` in a dedicated test setup helper (`tests/setup.ts`).

---

### Missing Linter/Formatter Toolchain Configuration in Target Scope - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-codebase-details`
* **Affected Scope:** `Lines 260-271`
* **Discrepancy Description**: `package.json` declares a `"lint"` script in line 263, but no configuration file (such as `biome.json` or `.eslintrc.json`) is listed in the "Target Files to Create/Modify" section.
* **Rationale & Recommendation**: Add `biome.json` or `eslint.config.js` to the Target Files list in Section 244.

---

### Non-Uniform Verification Plan Step Phrasing - Severity: 🟢 Nit
* **Reviewer Lens:** `egm-style`
* **Affected Scope:** `Lines 385-398`
* **Discrepancy Description**: Steps under Manual Integration & E2E Validation shift between imperative verbs ("Load unpacked extension", "Navigate to") and declarative phrases ("Open options popup; verify...").
* **Rationale & Recommendation**: Standardize each validation step into a consistent "Action -> Expected Outcome" format.
