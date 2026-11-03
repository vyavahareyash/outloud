import "./setup.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("service-worker message handler", () => {
	let messageListener: (
		message: unknown,
		sender: unknown,
		sendResponse?: unknown,
	) => boolean | undefined;

	let mockSendMessage: ReturnType<typeof vi.fn>;
	let mockCreateDocument: ReturnType<typeof vi.fn>;
	let mockHasDocument: ReturnType<typeof vi.fn>;
	let mockTabsSendMessage: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.resetModules();

		mockSendMessage = vi.fn().mockResolvedValue(undefined);
		mockCreateDocument = vi.fn().mockResolvedValue(undefined);
		mockHasDocument = vi.fn().mockResolvedValue(false);
		mockTabsSendMessage = vi.fn().mockResolvedValue(undefined);

		(globalThis as unknown as { chrome: unknown }).chrome = {
			offscreen: {
				Reason: { AUDIO_PLAYBACK: "AUDIO_PLAYBACK" },
				hasDocument: mockHasDocument,
				createDocument: mockCreateDocument,
				closeDocument: vi.fn().mockResolvedValue(undefined),
			},
			runtime: {
				sendMessage: mockSendMessage,
				onMessage: {
					addListener: vi.fn((cb) => {
						messageListener = cb;
					}),
				},
			},
			tabs: {
				sendMessage: mockTabsSendMessage,
				query: vi.fn(),
			},
		};

		await import("../src/background/service-worker.js");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("registers a runtime onMessage listener", () => {
		expect(messageListener).toBeDefined();
	});

	it("creates offscreen document and sends SYNTHESIZE_AND_PLAY on START_PLAYBACK", async () => {
		const sender = { tab: { id: 42 } };
		messageListener(
			{
				type: "START_PLAYBACK",
				sessionId: "test-session",
				text: "Hello world.",
				voice: "Freya",
			},
			sender,
		);

		await new Promise((r) => setTimeout(r, 10));

		expect(mockHasDocument).toHaveBeenCalled();
		expect(mockCreateDocument).toHaveBeenCalledWith(
			expect.objectContaining({
				url: "offscreen/offscreen.html",
			}),
		);
		expect(mockSendMessage).toHaveBeenCalledWith({
			type: "SYNTHESIZE_AND_PLAY",
			sessionId: "test-session",
			text: "Hello world.",
			voice: "Freya",
		});
	});

	it("routes PLAYBACK_STATUS_UPDATE only to originating active tab", async () => {
		const sender = { tab: { id: 99 } };
		messageListener(
			{
				type: "START_PLAYBACK",
				sessionId: "sess-1",
				text: "Audio test",
				voice: "default",
			},
			sender,
		);

		await new Promise((r) => setTimeout(r, 10));

		messageListener(
			{
				type: "PLAYBACK_STATUS_UPDATE",
				sessionId: "sess-1",
				state: "PLAYING",
			},
			{},
		);

		expect(mockTabsSendMessage).toHaveBeenCalledWith(99, {
			type: "PLAYBACK_STATUS_UPDATE",
			sessionId: "sess-1",
			state: "PLAYING",
		});
	});

	it("sends CANCEL_PLAYBACK on STOP_PLAYBACK", () => {
		messageListener(
			{
				type: "STOP_PLAYBACK",
				sessionId: "sess-2",
			},
			{},
		);

		expect(mockSendMessage).toHaveBeenCalledWith({
			type: "CANCEL_PLAYBACK",
			sessionId: "sess-2",
		});
	});
});
