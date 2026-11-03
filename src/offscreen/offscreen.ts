import { getConfig } from "../common/config.js";
import type { ExtensionMessage } from "../common/types.js";
import { AudioPlayer } from "./audio-player.js";

let player: AudioPlayer | null = null;
let currentSessionId: string | null = null;

async function getOrCreatePlayer(): Promise<AudioPlayer> {
	if (!player) {
		const config = await getConfig();
		player = new AudioPlayer({
			ollamaHost: config.ollamaHost,
			modelName: config.modelName,
		});

		player.onStatusChange((status) => {
			if (currentSessionId) {
				const sid = currentSessionId;
				if (status.state === "IDLE" || status.state === "ERROR") {
					currentSessionId = null;
				}
				chrome.runtime.sendMessage<ExtensionMessage>({
					type: "PLAYBACK_STATUS_UPDATE",
					sessionId: sid,
					state: status.state,
					errorMessage: status.errorMessage,
				});
			}
		});
	}
	return player;
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
	if (message.type === "SYNTHESIZE_AND_PLAY") {
		currentSessionId = message.sessionId;
		Promise.all([getOrCreatePlayer(), getConfig()]).then(([p, config]) => {
			p.updateConfig({
				ollamaHost: config.ollamaHost,
				modelName: config.modelName,
			});
			p.play(message.text, message.voice);
		});
	} else if (message.type === "CANCEL_PLAYBACK") {
		if (player) {
			player.cancel();
			currentSessionId = null;
		}
	}
});
