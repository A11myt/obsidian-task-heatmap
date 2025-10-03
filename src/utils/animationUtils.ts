/**
 * Animation and visual effects utilities
 */

// ============================================================
// ANIMATION SETUP
// ============================================================

/**
 * Ensure fade animations are available in the document
 */
export function ensureFadeAnimations(): void {
	if (document.head.querySelector('[data-heatmap-animations]')) {
		return; // Already added
	}

	const styleEl = document.createElement('style');
	styleEl.textContent = getAnimationStyles();
	styleEl.setAttribute('data-heatmap-animations', 'true');
	document.head.appendChild(styleEl);
}

/**
 * Get animation CSS
 */
function getAnimationStyles(): string {
	return `
		@keyframes fadeIn {
			from {
				opacity: 0;
				transform: translateY(-5px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		@keyframes fadeOut {
			from {
				opacity: 1;
				transform: translateY(0);
			}
			to {
				opacity: 0;
				transform: translateY(-5px);
			}
		}
		
		.heatmap-fade-in {
			animation: fadeIn 0.2s ease-out;
		}
		
		.heatmap-fade-out {
			animation: fadeOut 0.15s ease-in;
		}
	`;
}

// ============================================================
// ANIMATION HELPERS
// ============================================================

/**
 * Add fade-in class to element
 */
export function addFadeIn(element: HTMLElement): void {
	element.classList.add('heatmap-fade-in');
}

/**
 * Add fade-out class and remove element after animation
 */
export function fadeOutAndRemove(element: HTMLElement, delay: number = 150): void {
	element.classList.add('heatmap-fade-out');
	setTimeout(() => element.remove(), delay);
}
