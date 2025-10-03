/**
 * DOM manipulation utilities
 */

import { StyleMap } from '../types';

// ============================================================
// STYLE UTILITIES
// ============================================================

/**
 * Apply multiple CSS styles to an element
 */
export function applyStyles(element: HTMLElement, styles: StyleMap): void {
	Object.entries(styles).forEach(([property, value]) => {
		(element.style as any)[property] = value;
	});
}

/**
 * Create an element with optional styles and text
 */
export function createElement(
	parent: HTMLElement,
	tagName: string,
	options?: {
		styles?: StyleMap;
		text?: string;
		className?: string;
	}
): HTMLElement {
	const element = parent.createEl(tagName as keyof HTMLElementTagNameMap);
	
	if (options?.styles) {
		applyStyles(element, options.styles);
	}
	
	if (options?.text) {
		element.textContent = options.text;
	}
	
	if (options?.className) {
		element.className = options.className;
	}
	
	return element;
}

// ============================================================
// CLEANUP UTILITIES
// ============================================================

/**
 * Remove all elements matching a selector
 */
export function removeAllElements(selector: string): void {
	const elements = document.querySelectorAll(selector);
	elements.forEach(element => element.remove());
}

/**
 * Clear all children of an element
 */
export function clearElement(element: HTMLElement): void {
	while (element.firstChild) {
		element.removeChild(element.firstChild);
	}
}

// ============================================================
// QUERY UTILITIES
// ============================================================

/**
 * Find a single element (type-safe)
 */
export function findElement<T extends HTMLElement>(
	parent: HTMLElement | Document,
	selector: string
): T | null {
	return parent.querySelector(selector) as T | null;
}

/**
 * Find all elements (type-safe)
 */
export function findAllElements<T extends HTMLElement>(
	parent: HTMLElement | Document,
	selector: string
): T[] {
	return Array.from(parent.querySelectorAll(selector)) as T[];
}
