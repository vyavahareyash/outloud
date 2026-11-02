import "./setup.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayer } from "../src/offscreen/audio-player.js";

describe("AudioPlayer", () => {
	let player: AudioPlayer;
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		player = new AudioPlayer({
			ollamaHost: "http://localhost:11434",
			modelName: "phonon",
		});
		mockFetch = vi.fn().mockImplementation(async () => {
			return {
				ok: true,
				arrayBuffer: async () => new ArrayBuffer(1024),
			};
		});
		globalThis.fetch = mockFetch as unknown as typeof fetch;
	});

	afterEach(() => {
		player.cancel();
		vi.restoreAllMocks();
	});

	it("resumes suspended AudioContext on play", async () => {
		const ctx = player.getAudioContext();
		(ctx as unknown as { state: string }).state = "suspended";

		await player.play("First sentence.", "default");

		expect(ctx.resume).toHaveBeenCalled();
	});

	it("fetches and schedules gapless playback across multiple sentences", async () => {
		const text = "First sentence. Second sentence.";
		const statusHistory: string[] = [];
		player.onStatusChange((status) => statusHistory.push(status.state));

		await player.play(text, "default");

		expect(mockFetch).toHaveBeenCalledTimes(2);
		expect(statusHistory).toContain("BUFFERING");
		expect(statusHistory).toContain("PLAYING");
		expect(player.getActiveSourceCount()).toBe(2);
	});

	it("immediately cancels playback and stops active audio nodes", async () => {
		const text = "First sentence. Second sentence.";
		await player.play(text, "default");

		player.cancel();

		expect(player.getState()).toBe("IDLE");
		expect(player.getActiveSourceCount()).toBe(0);
	});

	it("transitions to ERROR state when Ollama fetch fails", async () => {
		mockFetch.mockRejectedValueOnce(new Error("Connection refused"));
		let capturedError: string | undefined;

		player.onStatusChange((status) => {
			if (status.state === "ERROR") {
				capturedError = status.errorMessage;
			}
		});

		await player.play("Test sentence.", "default");

		expect(player.getState()).toBe("ERROR");
		expect(capturedError).toContain("Connection refused");
	});

	it("transitions to ERROR state with parsed HTTP status and body message", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			text: async () => JSON.stringify({ error: "model 'phonon' not found" }),
		});
		let capturedError: string | undefined;

		player.onStatusChange((status) => {
			if (status.state === "ERROR") {
				capturedError = status.errorMessage;
			}
		});

		await player.play("Test sentence.", "default");

		expect(player.getState()).toBe("ERROR");
		expect(capturedError).toBe("HTTP 404 - model 'phonon' not found");
	});
});
