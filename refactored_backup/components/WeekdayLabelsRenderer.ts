/**
 * Renders weekday labels for the heatmap
 */

import { StyleMap } from '../../types';
import { applyStyles, createElement } from '../../utils/domUtils';
import { WEEKDAY_LABELS } from '../../constants';

export class WeekdayLabelsRenderer {
	private cellSize: number;

	constructor(cellSize: number) {
		this.cellSize = cellSize;
	}

	/**
	 * Render weekday labels
	 */
	render(container: HTMLElement): void {
		const labelContainer = this.createLabelContainer(container);
		this.renderLabels(labelContainer);
	}

	/**
	 * Create container for labels
	 */
	private createLabelContainer(parent: HTMLElement): HTMLElement {
		return createElement(parent, 'div', {
			styles: this.getContainerStyles()
		});
	}

	/**
	 * Render individual labels
	 */
	private renderLabels(container: HTMLElement): void {
		WEEKDAY_LABELS.forEach(label => {
			this.renderLabel(container, label);
		});
	}

	/**
	 * Render a single label
	 */
	private renderLabel(container: HTMLElement, label: string): void {
		createElement(container, 'div', {
			text: label,
			styles: this.getLabelStyles()
		});
	}

	/**
	 * Get container styles
	 */
	private getContainerStyles(): StyleMap {
		return {
			display: 'flex',
			flexDirection: 'column',
			gap: '2px',
			fontSize: '10px',
			color: 'var(--text-muted)',
			marginTop: '0px'
		};
	}

	/**
	 * Get label styles
	 */
	private getLabelStyles(): StyleMap {
		const height = this.cellSize + 2;
		
		return {
			height: `${height}px`,
			lineHeight: `${height}px`,
			textAlign: 'right',
			paddingRight: '5px',
			minWidth: '20px'
		};
	}
}
