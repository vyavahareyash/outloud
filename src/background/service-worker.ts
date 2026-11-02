import { checkDaemonHealth, getConfig } from "../common/config.js";
import type { ExtensionMessage } from "../common/types.js";

let teardownTimeoutId: NodeJS.Timeout | null = null;

async function ensureOffscreenDocument(): Promise<void> {
	const hasDoc = await chrome.offscreen.hasDocument();
	if (!hasDoc) {
		await chrome.offscreen.createDocument({
			url: "offscreen/offscreen.html",
			reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
			justification: "Synthesize and play speech via Web Audio API",
		});
	}
}

function scheduleTeardown(): void {
	if (teardownTimeoutId) {
		clearTimeout(teardownTimeoutId);
	}
	teardownTimeoutId = setTimeout(async () => {
		const hasDoc = await chrome.offscreen.hasDocument();
		if (hasDoc) {
			await chrome.offscreen.closeDocument();
		}
		teardownTimeoutId = null;
	}, 15000);
}

chrome.runtime.onMessage.addListener(
	(
		message: ExtensionMessage,
		_sender: chrome.runtime.MessageSender,
		sendResponse: (response?: unknown) => void,
	) => {
		if (message.type === "START_PLAYBACK") {
			if (teardownTimeoutId) {
				clearTimeout(teardownTimeoutId);
				teardownTimeoutId = null;
			}

			ensureOffscreenDocument().then(() => {
				chrome.runtime.sendMessage<ExtensionMessage>({
					type: "SYNTHESIZE_AND_PLAY",
					sessionId: message.sessionId,
					text: message.text,
					voice: message.voice || "default",
				});
			});
			return false;
		}

		if (message.type === "STOP_PLAYBACK") {
			chrome.runtime.sendMessage<ExtensionMessage>({
				type: "CANCEL_PLAYBACK",
				sessionId: message.sessionId,
			});
			scheduleTeardown();
			return false;
		}

		if (message.type === "PLAYBACK_STATUS_UPDATE") {
			// Broadcast to content scripts across all active tabs
			chrome.tabs.query({}, (tabs) => {
				for (const tab of tabs) {
					if (tab.id) {
						chrome.tabs.sendMessage(tab.id, message).catch(() => {
							// Ignore tabs without content script loaded
						});
					}
				}
			});

			if (message.state === "IDLE" || message.state === "ERROR") {
				scheduleTeardown();
			}
			return false;
		}

		if (message.type === "CHECK_DAEMON_HEALTH") {
			getConfig().then((cfg) => {
				checkDaemonHealth(cfg.ollamaHost, cfg.modelName).then((health) => {
					sendResponse({
						type: "DAEMON_HEALTH_STATUS",
						isOnline: health.isOnline,
						hasModel: health.hasModel,
						corsValid: health.corsValid,
						errorMessage: health.errorMessage,
					});
				});
			});
			return true; // Keep channel open for async response
		}
	},
);
