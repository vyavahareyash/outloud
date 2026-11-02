/**
 * Helper to identify whether a target DOM element is an editable input or container.
 */
export function isEditableElement(target: Node | null): boolean {
	if (!target || !(target instanceof Object)) {
		return false;
	}

	const el = target as HTMLElement;
	const tagName = el.tagName?.toUpperCase();

	if (tagName === "INPUT" || tagName === "TEXTAREA") {
		return true;
	}

	if (el.isContentEditable) {
		return true;
	}

	if (typeof el.getAttribute === "function") {
		if (el.getAttribute("contenteditable") === "true") {
			return true;
		}
		if (el.getAttribute("role") === "textbox") {
			return true;
		}
	}

	return false;
}

/**
 * Validates that highlighted text meets length requirements.
 */
export function isValidSelection(text: string): boolean {
	if (!text) {
		return false;
	}
	const trimmed = text.trim();
	return trimmed.length >= 3 && trimmed.length <= 10000;
}

/**
 * Intercepts mousedown/pointerdown events to prevent the host page from collapsing selection.
 */
export function interceptPointerDown(event: Event): void {
	event.preventDefault();
}
