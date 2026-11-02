import { getConfig } from "../common/config.js";
import type { ExtensionMessage } from "../common/types.js";
import { FloatingPill } from "./pill.js";
import { isEditableElement, isValidSelection } from "./selection-handler.js";

let pill: FloatingPill | null = null;
let currentSessionId: string | null = null;
let activeSelectedText = "";

async function init() {
	pill = new FloatingPill();

	pill.onPlay(async () => {
		if (!activeSelectedText) return;
		const latestConfig = await getConfig();
		currentSessionId = crypto.randomUUID();

		pill?.setState("BUFFERING");

		chrome.runtime.sendMessage<ExtensionMessage>({
			type: "START_PLAYBACK",
			sessionId: currentSessionId,
			text: activeSelectedText,
			voice: latestConfig.selectedVoice,
		});
	});

	pill.onStop(() => {
		if (!currentSessionId) return;

		chrome.runtime.sendMessage<ExtensionMessage>({
			type: "STOP_PLAYBACK",
			sessionId: currentSessionId,
		});

		pill?.setState("IDLE");
	});

	const checkSelection = async () => {
		const selection = window.getSelection();
		if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
			pill?.hide();
			return;
		}

		const anchorNode = selection.anchorNode;
		if (
			isEditableElement(anchorNode) ||
			isEditableElement(document.activeElement)
		) {
			pill?.hide();
			return;
		}

		const text = selection.toString();
		if (!isValidSelection(text)) {
			pill?.hide();
			return;
		}

		activeSelectedText = text;
		const range = selection.getRangeAt(0);
		const rect = range.getBoundingClientRect();

		if (rect.width === 0 && rect.height === 0) {
			pill?.hide();
			return;
		}

		const latestConfig = await getConfig();
		pill?.show(rect, latestConfig.selectedVoice);
	};

	document.addEventListener("selectionchange", () => {
		setTimeout(checkSelection, 20);
	});

	document.addEventListener("mouseup", () => {
		setTimeout(checkSelection, 20);
	});

	chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
		if (message.type === "PLAYBACK_STATUS_UPDATE") {
			if (!currentSessionId || message.sessionId === currentSessionId) {
				pill?.setState(message.state, message.errorMessage);
				if (message.state === "IDLE") {
					currentSessionId = null;
				}
			}
		}
	});
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
