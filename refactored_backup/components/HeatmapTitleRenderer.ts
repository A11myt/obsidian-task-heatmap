/**
 * Renders the heatmap title
 */

import { StyleMap } from '../../types';
import { applyStyles, createElement } from '../../utils/domUtils';
import { createLogger } from '../../utils/loggerUtils';

const logger = createLogger('TitleRenderer');

export class HeatmapTitleRenderer {
	/**
	 * Render the heatmap title
	 */
	render(container: HTMLElement, title: string = 'Task Heatmap'): void {
		logger.debug('Rendering title');

		const titleContainer = this.createTitleContainer(container);
		const titleElement = this.createTitleElement(titleContainer, title);

		logger.success(`Title rendered: ${title}`);
	}

	/**
	 * Create title container with styling
	 */
	private createTitleContainer(parent: HTMLElement): HTMLElement {
		return createElement(parent, 'div', {
			styles: this.getTitleContainerStyles()
		});
	}

	/**
	 * Create title element with styling
	 */
	private createTitleElement(parent: HTMLElement, text: string): HTMLElement {
		return createElement(parent, 'h3', {
			text,
			styles: this.getTitleElementStyles()
		});
	}

	/**
	 * Get title container styles
	 */
	private getTitleContainerStyles(): StyleMap {
		return {
			width: '100%',
			textAlign: 'center',
			marginBottom: '20px',
			padding: '10px 0'
		};
	}

	/**
	 * Get title element styles
	 */
	private getTitleElementStyles(): StyleMap {
		return {
			margin: '0',
			fontSize: '20px',
			fontWeight: 'bold',
			color: 'var(--text-normal)',
			display: 'block',
			visibility: 'visible'
		};
	}
}
