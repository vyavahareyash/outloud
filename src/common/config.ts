import { DEFAULT_CONFIG, type ExtensionConfig } from "./types.js";

export interface DaemonHealth {
	isOnline: boolean;
	hasModel: boolean;
	corsValid: boolean;
	errorMessage?: string;
}

export async function getConfig(): Promise<ExtensionConfig> {
	if (typeof chrome !== "undefined" && chrome.storage?.sync) {
		const data = await chrome.storage.sync.get([
			"ollamaHost",
			"modelName",
			"selectedVoice",
		]);
		return {
			ollamaHost: (data.ollamaHost as string) || DEFAULT_CONFIG.ollamaHost,
			modelName: (data.modelName as string) || DEFAULT_CONFIG.modelName,
			selectedVoice:
				(data.selectedVoice as ExtensionConfig["selectedVoice"]) ||
				DEFAULT_CONFIG.selectedVoice,
		};
	}
	return { ...DEFAULT_CONFIG };
}

export async function saveConfig(
	partial: Partial<ExtensionConfig>,
): Promise<void> {
	if (typeof chrome !== "undefined" && chrome.storage?.sync) {
		await chrome.storage.sync.set(partial);
	}
}

export async function checkDaemonHealth(
	host: string,
	modelName: string,
): Promise<DaemonHealth> {
	try {
		const timeoutSignal = AbortSignal.timeout
			? AbortSignal.timeout(5000)
			: new AbortController().signal;
		const response = await fetch(`${host}/api/tags`, {
			method: "GET",
			signal: timeoutSignal,
		});

		if (!response.ok) {
			return {
				isOnline: false,
				hasModel: false,
				corsValid: false,
				errorMessage: `HTTP ${response.status}: Failed to reach Ollama daemon`,
			};
		}

		const data = (await response.json()) as {
			models?: Array<{ name: string }>;
		};
		const models = data.models || [];
		const hasModel = models.some((m) =>
			m.name.toLowerCase().startsWith(modelName.toLowerCase()),
		);

		if (!hasModel) {
			return {
				isOnline: true,
				hasModel: false,
				corsValid: true,
				errorMessage: `Model '${modelName}' not found in Ollama registry. Run 'ollama pull ${modelName}'.`,
			};
		}

		return {
			isOnline: true,
			hasModel: true,
			corsValid: true,
		};
	} catch (err: unknown) {
		return {
			isOnline: false,
			hasModel: false,
			corsValid: false,
			errorMessage: `Ollama offline or CORS rejected. Ensure Ollama is running with OLLAMA_ORIGINS='*': ${err instanceof Error ? err.message : String(err)}`,
		};
	}
}
