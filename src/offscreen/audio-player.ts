import type { OllamaSpeechRequest, PlaybackState } from '../common/types.js';
import { tokenizeSentences } from './sentence-tokenizer.js';

export interface AudioPlayerConfig {
  ollamaHost: string;
  modelName: string;
}

export interface PlayerStatusUpdate {
  state: PlaybackState;
  errorMessage?: string;
}

export class AudioPlayer {
  private config: AudioPlayerConfig;
  private audioContext: AudioContext;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private abortController: AbortController | null = null;
  private nextScheduledTime = 0;
  private state: PlaybackState = 'IDLE';
  private statusListeners: Array<(status: PlayerStatusUpdate) => void> = [];

  constructor(config: AudioPlayerConfig) {
    this.config = config;
    const AudioCtx = globalThis.AudioContext || (window as unknown as { AudioContext: typeof AudioContext }).AudioContext;
    this.audioContext = new AudioCtx();
  }

  getAudioContext(): AudioContext {
    return this.audioContext;
  }

  getState(): PlaybackState {
    return this.state;
  }

  getActiveSourceCount(): number {
    return this.activeSources.size;
  }

  onStatusChange(listener: (status: PlayerStatusUpdate) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private updateState(state: PlaybackState, errorMessage?: string): void {
    this.state = state;
    for (const listener of this.statusListeners) {
      listener({ state, errorMessage });
    }
  }

  async play(text: string, voice = 'default'): Promise<void> {
    this.cancel();

    const sentences = tokenizeSentences(text);
    if (sentences.length === 0) {
      this.updateState('IDLE');
      return;
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.abortController = new AbortController();
    this.nextScheduledTime = this.audioContext.currentTime;
    this.updateState('BUFFERING');

    try {
      for (let i = 0; i < sentences.length; i++) {
        if (this.abortController.signal.aborted) {
          break;
        }

        const sentence = sentences[i];
        const audioBuffer = await this.fetchAndDecodeChunk(sentence, voice, this.abortController.signal);

        if (this.abortController.signal.aborted) {
          break;
        }

        this.scheduleBuffer(audioBuffer, i === sentences.length - 1);
        if (this.state === 'BUFFERING') {
          this.updateState('PLAYING');
        }
      }
    } catch (err: unknown) {
      if (this.abortController?.signal.aborted) {
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      this.cancel();
      this.updateState('ERROR', message);
    }
  }

  private async fetchAndDecodeChunk(
    sentence: string,
    voice: string,
    userSignal: AbortSignal
  ): Promise<AudioBuffer> {
    const timeoutSignal = AbortSignal.timeout ? AbortSignal.timeout(15000) : new AbortController().signal;
    const combinedSignal = AbortSignal.any ? AbortSignal.any([userSignal, timeoutSignal]) : userSignal;

    const body: OllamaSpeechRequest = {
      model: this.config.modelName,
      input: sentence,
      voice,
      response_format: 'mp3'
    };

    const response = await fetch(`${this.config.ollamaHost}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: combinedSignal
    });

    if (!response.ok) {
      throw new Error(`Ollama speech request failed: HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return await this.audioContext.decodeAudioData(arrayBuffer);
  }

  private scheduleBuffer(buffer: AudioBuffer, isLastChunk: boolean): void {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const startTime = Math.max(this.audioContext.currentTime, this.nextScheduledTime);
    source.start(startTime);
    this.nextScheduledTime = startTime + buffer.duration;

    this.activeSources.add(source);

    source.onended = () => {
      this.activeSources.delete(source);
      if (isLastChunk && this.activeSources.size === 0 && this.state === 'PLAYING') {
        this.updateState('IDLE');
      }
    };
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    for (const source of this.activeSources) {
      try {
        source.stop(0);
        source.disconnect();
      } catch {
        // Node already stopped
      }
    }
    this.activeSources.clear();
    this.nextScheduledTime = 0;
    this.updateState('IDLE');
  }
}
