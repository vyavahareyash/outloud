export interface OllamaSpeechRequest {
	model: string;
	input: string;
	voice?: string;
	response_format?: "wav" | "pcm";
}

export type PlaybackState = "IDLE" | "BUFFERING" | "PLAYING" | "ERROR";

export const SUPPORTED_VOICES = ["default", "Zoey", "Easton", "Freya"] as const;
export type SupportedVoice = (typeof SUPPORTED_VOICES)[number];

export interface ExtensionConfig {
	ollamaHost: string;
	modelName: string;
	selectedVoice: SupportedVoice;
}

export const DEFAULT_CONFIG: ExtensionConfig = {
	ollamaHost: "http://localhost:11434",
	modelName: "phonon",
	selectedVoice: "default",
};

export type ExtensionMessage =
	| { type: "START_PLAYBACK"; sessionId: string; text: string; voice?: string }
	| { type: "STOP_PLAYBACK"; sessionId: string }
	| {
			type: "SYNTHESIZE_AND_PLAY";
			sessionId: string;
			text: string;
			voice: string;
	  }
	| { type: "CANCEL_PLAYBACK"; sessionId: string }
	| {
			type: "PLAYBACK_STATUS_UPDATE";
			sessionId: string;
			state: PlaybackState;
			errorMessage?: string;
	  }
	| { type: "CHECK_DAEMON_HEALTH" }
	| {
			type: "DAEMON_HEALTH_STATUS";
			isOnline: boolean;
			hasModel: boolean;
			corsValid: boolean;
			errorMessage?: string;
	  };
