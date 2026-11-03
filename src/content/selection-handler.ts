/**
 * Helper to identify whether a target DOM element is an editable input or container.
 */
export function isEditableElement(target: Node | null): boolean {
	if (!target) {
		return false;
	}

	const el =
		target.nodeType === 3
			? (target.parentElement as HTMLElement | null)
			: (target as HTMLElement);
	if (!el) {
		return false;
	}

	const tagName = el.tagName?.toUpperCase();
	if (tagName === "INPUT" || tagName === "TEXTAREA" || el.isContentEditable) {
		return true;
	}

	if (typeof el.getAttribute === "function") {
		return (
			el.getAttribute("contenteditable") === "true" ||
			el.getAttribute("role") === "textbox"
		);
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
