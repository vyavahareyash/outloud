import type { ExtensionMessage } from "../common/types.js";

let teardownTimeoutId: NodeJS.Timeout | null = null;
let creatingDoc: Promise<void> | null = null;
let activeTabId: number | null = null;

async function ensureOffscreenDocument(): Promise<void> {
	if (await chrome.offscreen.hasDocument()) return;
	if (!creatingDoc) {
		creatingDoc = chrome.offscreen
			.createDocument({
				url: "offscreen/offscreen.html",
				reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
				justification: "Synthesize and play speech via Web Audio API",
			})
			.finally(() => {
				creatingDoc = null;
			});
	}
	await creatingDoc;
}

async function sendToOffscreen(
	message: ExtensionMessage,
	retries = 5,
): Promise<void> {
	await ensureOffscreenDocument();
	for (let i = 0; i < retries; i++) {
		try {
			await chrome.runtime.sendMessage(message);
			return;
		} catch {
			await new Promise((r) => setTimeout(r, 60));
		}
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
	(message: ExtensionMessage, sender: chrome.runtime.MessageSender) => {
		if (message.type === "START_PLAYBACK") {
			if (teardownTimeoutId) {
				clearTimeout(teardownTimeoutId);
				teardownTimeoutId = null;
			}
			activeTabId = sender.tab?.id ?? null;

			sendToOffscreen({
				type: "SYNTHESIZE_AND_PLAY",
				sessionId: message.sessionId,
				text: message.text,
				voice: message.voice || "default",
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
			if (activeTabId) {
				chrome.tabs.sendMessage(activeTabId, message).catch(() => {});
			} else {
				chrome.tabs.query({}, (tabs) => {
					for (const tab of tabs) {
						if (tab.id) {
							chrome.tabs.sendMessage(tab.id, message).catch(() => {});
						}
					}
				});
			}

			if (message.state === "IDLE" || message.state === "ERROR") {
				activeTabId = null;
				scheduleTeardown();
			}
			return false;
		}
	},
);
