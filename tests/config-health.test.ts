import "./setup.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkDaemonHealth,
	getConfig,
	saveConfig,
} from "../src/common/config.js";
import { DEFAULT_CONFIG } from "../src/common/types.js";

describe("config & health check", () => {
	let mockStorage: Record<string, unknown> = {};

	beforeEach(() => {
		mockStorage = {};
		(globalThis as unknown as { chrome: unknown }).chrome = {
			storage: {
				sync: {
					get: vi.fn(async (keys: string | string[]) => {
						if (typeof keys === "string") {
							return { [keys]: mockStorage[keys] };
						}
						const res: Record<string, unknown> = {};
						for (const k of keys) {
							if (k in mockStorage) res[k] = mockStorage[k];
						}
						return res;
					}),
					set: vi.fn(async (items: Record<string, unknown>) => {
						Object.assign(mockStorage, items);
					}),
				},
			},
		};
	});

	it("returns default config when storage is empty", async () => {
		const config = await getConfig();
		expect(config).toEqual(DEFAULT_CONFIG);
	});

	it("returns default config when chrome.storage.sync throws", async () => {
		(globalThis as unknown as { chrome: unknown }).chrome = {
			storage: {
				sync: {
					get: vi
						.fn()
						.mockRejectedValue(new Error("Extension context invalidated")),
					set: vi
						.fn()
						.mockRejectedValue(new Error("Extension context invalidated")),
				},
			},
		};
		const config = await getConfig();
		expect(config).toEqual(DEFAULT_CONFIG);
	});

	it("saves and retrieves updated config", async () => {
		await saveConfig({ selectedVoice: "Zoey" });
		const config = await getConfig();
		expect(config.selectedVoice).toBe("Zoey");
		expect(config.ollamaHost).toBe("http://localhost:11434");
	});

	it("reports healthy daemon when model exists and endpoint responds", async () => {
		globalThis.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				models: [{ name: "phonon:latest" }],
			}),
		} as unknown as Response);

		const health = await checkDaemonHealth("http://localhost:11434", "phonon");
		expect(health.isOnline).toBe(true);
		expect(health.hasModel).toBe(true);
		expect(health.corsValid).toBe(true);
	});

	it("reports missing model when model is not in registry", async () => {
		globalThis.fetch = vi.fn().mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				models: [{ name: "llama3:latest" }],
			}),
		} as unknown as Response);

		const health = await checkDaemonHealth("http://localhost:11434", "phonon");
		expect(health.isOnline).toBe(true);
		expect(health.hasModel).toBe(false);
		expect(health.errorMessage).toContain("Model 'phonon' not found");
	});

	it("reports offline and instructions when daemon is unreachable", async () => {
		globalThis.fetch = vi
			.fn()
			.mockRejectedValueOnce(new TypeError("Failed to fetch"));

		const health = await checkDaemonHealth("http://localhost:11434", "phonon");
		expect(health.isOnline).toBe(false);
		expect(health.corsValid).toBe(false);
		expect(health.errorMessage).toContain("OLLAMA_ORIGINS");
	});
});
