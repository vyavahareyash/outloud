import "./setup.js";
import { describe, expect, it, vi } from "vitest";
import {
	interceptPointerDown,
	isEditableElement,
	isValidSelection,
} from "../src/content/selection-handler.js";

describe("SelectionHandler", () => {
	it("identifies editable input elements and contenteditable containers", () => {
		const inputEl = { tagName: "INPUT" } as unknown as Node;
		const textareaEl = { tagName: "TEXTAREA" } as unknown as Node;
		const editableEl = {
			tagName: "DIV",
			isContentEditable: true,
			getAttribute: () => "true",
		} as unknown as Node;
		const roleTextboxEl = {
			tagName: "DIV",
			isContentEditable: false,
			getAttribute: (attr: string) => (attr === "role" ? "textbox" : null),
		} as unknown as Node;
		const standardEl = {
			tagName: "P",
			isContentEditable: false,
			getAttribute: () => null,
		} as unknown as Node;

		const textNodeInEditable = {
			nodeType: 3,
			parentElement: editableEl,
		} as unknown as Node;

		expect(isEditableElement(inputEl)).toBe(true);
		expect(isEditableElement(textareaEl)).toBe(true);
		expect(isEditableElement(editableEl)).toBe(true);
		expect(isEditableElement(roleTextboxEl)).toBe(true);
		expect(isEditableElement(textNodeInEditable)).toBe(true);
		expect(isEditableElement(standardEl)).toBe(false);
	});

	it("validates selection text length boundaries", () => {
		expect(isValidSelection("")).toBe(false);
		expect(isValidSelection("   ")).toBe(false);
		expect(isValidSelection("hi")).toBe(false); // < 3 chars
		expect(isValidSelection("Valid text")).toBe(true);
		expect(isValidSelection("a".repeat(10001))).toBe(false); // > 10000 chars
	});

	it("prevents default on mousedown and pointerdown to protect text selection", () => {
		const mockEvent = {
			preventDefault: vi.fn(),
		} as unknown as Event;

		interceptPointerDown(mockEvent);
		expect(mockEvent.preventDefault).toHaveBeenCalled();
	});
});
