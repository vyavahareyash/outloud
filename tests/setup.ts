import { vi } from 'vitest';

export class MockAudioBuffer {
  duration: number;
  length: number;
  numberOfChannels: number;
  sampleRate: number;

  constructor({ duration = 1, length = 44100, numberOfChannels = 1, sampleRate = 44100 } = {}) {
    this.duration = duration;
    this.length = length;
    this.numberOfChannels = numberOfChannels;
    this.sampleRate = sampleRate;
  }
}

export class MockAudioBufferSourceNode {
  buffer: MockAudioBuffer | null = null;
  onended: (() => void) | null = null;
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  isStarted = false;
  isStopped = false;

  start = vi.fn((when = 0) => {
    this.isStarted = true;
    this.startedAt = when;
  });

  stop = vi.fn((when = 0) => {
    this.isStopped = true;
    this.stoppedAt = when;
    if (this.onended) {
      this.onended();
    }
  });

  connect = vi.fn();
  disconnect = vi.fn();
}

export class MockAudioContext {
  currentTime = 0;
  state: AudioContextState = 'running';
  destination = {};

  createBufferSource = vi.fn(() => new MockAudioBufferSourceNode());

  decodeAudioData = vi.fn(async (_data: ArrayBuffer): Promise<MockAudioBuffer> => {
    return new MockAudioBuffer({ duration: 1.5 });
  });

  resume = vi.fn(async () => {
    this.state = 'running';
  });

  suspend = vi.fn(async () => {
    this.state = 'suspended';
  });

  close = vi.fn(async () => {
    this.state = 'closed';
  });
}

// Attach to globalThis if in Node environment
if (typeof globalThis.AudioContext === 'undefined') {
  (globalThis as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;
}
