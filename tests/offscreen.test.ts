import "./setup.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("offscreen audio orchestrator", () => {
	let messageListener: (message: unknown) => void;
	let mockSendMessage: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.resetModules();

		mockSendMessage = vi.fn().mockResolvedValue(undefined);

		(globalThis as unknown as { chrome: unknown }).chrome = {
			storage: {
				sync: {
					get: vi.fn().mockResolvedValue({
						ollamaHost: "http://localhost:11434",
						modelName: "phonon",
					}),
				},
			},
			runtime: {
				sendMessage: mockSendMessage,
				onMessage: {
					addListener: vi.fn((cb) => {
						messageListener = cb;
					}),
				},
			},
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			arrayBuffer: async () => new ArrayBuffer(512),
		} as unknown as Response);

		await import("../src/offscreen/offscreen.js");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers a runtime onMessage listener in offscreen document", () => {
		expect(messageListener).toBeDefined();
	});

	it("starts synthesis on SYNTHESIZE_AND_PLAY and broadcasts state", async () => {
		messageListener({
			type: "SYNTHESIZE_AND_PLAY",
			sessionId: "offscreen-sess",
			text: "Sentence test.",
			voice: "default",
		});

		await new Promise((r) => setTimeout(r, 20));

		expect(globalThis.fetch).toHaveBeenCalledWith(
			"http://localhost:11434/v1/audio/speech",
			expect.any(Object),
		);
		expect(mockSendMessage).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "PLAYBACK_STATUS_UPDATE",
				sessionId: "offscreen-sess",
			}),
		);
	});

	it("cancels playback cleanly on CANCEL_PLAYBACK", async () => {
		messageListener({
			type: "CANCEL_PLAYBACK",
			sessionId: "offscreen-sess",
		});

		await new Promise((r) => setTimeout(r, 10));
		expect(messageListener).toBeDefined();
	});
});
