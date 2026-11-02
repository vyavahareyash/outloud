import type { PlaybackState } from "../common/types.js";
import { interceptPointerDown } from "./selection-handler.js";

export class FloatingPill {
	private host: HTMLElement;
	private shadow: ShadowRoot;
	private playBtn: HTMLButtonElement;
	private voiceBadge: HTMLElement;
	private statusText: HTMLElement;
	private onPlayCallback: (() => void) | null = null;
	private onStopCallback: (() => void) | null = null;
	private currentState: PlaybackState = "IDLE";

	constructor() {
		this.host = document.createElement("div");
		this.host.id = "outloud-selection-pill-root";
		this.host.style.position = "absolute";
		this.host.style.zIndex = "2147483647";
		this.host.style.display = "none";

		this.shadow = this.host.attachShadow({ mode: "closed" });

		// Intercept pointer down to preserve page selection range
		this.host.addEventListener("mousedown", interceptPointerDown);
		this.host.addEventListener("pointerdown", interceptPointerDown);

		const style = document.createElement("style");
		style.textContent = `
      .pill-container {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #1e1e24;
        color: #f4f4f6;
        padding: 4px 8px;
        border-radius: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 12px;
        user-select: none;
        border: 1px solid rgba(255, 255, 255, 0.12);
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        background: #3b82f6;
        color: #fff;
        border: none;
        border-radius: 14px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }
      .btn:hover {
        background: #2563eb;
      }
      .btn.stop {
        background: #ef4444;
      }
      .btn.stop:hover {
        background: #dc2626;
      }
      .badge {
        font-size: 10px;
        color: #9ca3af;
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 6px;
        border-radius: 8px;
      }
      .error-tip {
        color: #f87171;
        font-size: 10px;
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;

		const container = document.createElement("div");
		container.className = "pill-container";

		this.playBtn = document.createElement("button");
		this.playBtn.className = "btn";
		this.playBtn.textContent = "▶ Read";

		this.playBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (
				this.currentState === "PLAYING" ||
				this.currentState === "BUFFERING"
			) {
				this.onStopCallback?.();
			} else {
				this.onPlayCallback?.();
			}
		});

		this.voiceBadge = document.createElement("span");
		this.voiceBadge.className = "badge";
		this.voiceBadge.textContent = "default";

		this.statusText = document.createElement("span");
		this.statusText.className = "error-tip";

		container.appendChild(this.playBtn);
		container.appendChild(this.voiceBadge);
		container.appendChild(this.statusText);

		this.shadow.appendChild(style);
		this.shadow.appendChild(container);

		document.body.appendChild(this.host);
	}

	onPlay(cb: () => void): void {
		this.onPlayCallback = cb;
	}

	onStop(cb: () => void): void {
		this.onStopCallback = cb;
	}

	show(rect: DOMRect, voice = "default"): void {
		this.voiceBadge.textContent = voice;
		this.statusText.textContent = "";

		const scrollX = window.scrollX || document.documentElement.scrollLeft;
		const scrollY = window.scrollY || document.documentElement.scrollTop;

		const pillHeight = 36;
		let top = rect.top + scrollY - pillHeight - 8;
		if (rect.top - pillHeight - 8 < 0) {
			// Flip below selection if above viewport
			top = rect.bottom + scrollY + 8;
		}

		const left = Math.max(8, rect.left + scrollX);

		this.host.style.top = `${top}px`;
		this.host.style.left = `${left}px`;
		this.host.style.display = "block";
	}

	hide(): void {
		if (this.currentState === "IDLE" || this.currentState === "ERROR") {
			this.host.style.display = "none";
			this.statusText.textContent = "";
		}
	}

	setState(state: PlaybackState, errorMessage?: string): void {
		this.currentState = state;

		if (state === "BUFFERING") {
			this.playBtn.className = "btn stop";
			this.playBtn.textContent = "⏳ Buffering...";
			this.statusText.textContent = "";
		} else if (state === "PLAYING") {
			this.playBtn.className = "btn stop";
			this.playBtn.textContent = "■ Stop";
			this.statusText.textContent = "";
		} else if (state === "ERROR") {
			this.playBtn.className = "btn";
			this.playBtn.textContent = "▶ Read";
			this.statusText.textContent = errorMessage || "Failed";
			this.statusText.title = errorMessage || "Failed";
		} else {
			this.playBtn.className = "btn";
			this.playBtn.textContent = "▶ Read";
			this.statusText.textContent = "";
		}
	}

	destroy(): void {
		this.host.remove();
	}
}
