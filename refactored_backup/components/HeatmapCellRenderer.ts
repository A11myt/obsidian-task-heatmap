/**
 * Renders individual heatmap cells
 */

import { HeatmapSettings } from '../../settings/settings';
import { TaskDayData, StyleMap } from '../../types';
import { applyStyles, createElement } from '../../utils/domUtils';
import { getColorForDay } from '../../utils/colorUtils';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { CSS_CLASSES } from '../../constants';

export class HeatmapCellRenderer {
	private settings: HeatmapSettings;
	private onCellClick: (cellWrapper: HTMLElement, day: TaskDayData) => void;

	constructor(
		settings: HeatmapSettings,
		onCellClick: (cellWrapper: HTMLElement, day: TaskDayData) => void
	) {
		this.settings = settings;
		this.onCellClick = onCellClick;
	}

	/**
	 * Render a day cell
	 */
	render(container: HTMLElement, day: TaskDayData): void {
		const cellWrapper = this.createCellWrapper(container);
		const cell = this.createCell(cellWrapper, day);
		
		this.setupCellInteractions(cell, cellWrapper, day);
	}

	/**
	 * Create cell wrapper
	 */
	private createCellWrapper(parent: HTMLElement): HTMLElement {
		return createElement(parent, 'div', {
			styles: {
				position: 'relative',
				width: `${this.settings.cellSize}px`
			}
		});
	}

	/**
	 * Create the cell element
	 */
	private createCell(wrapper: HTMLElement, day: TaskDayData): HTMLElement {
		const cell = createElement(wrapper, 'div', {
			className: CSS_CLASSES.CELL_CLICKABLE,
			styles: this.getCellStyles(day)
		});

		cell.title = this.generateTooltip(day);
		(cell as any).dayData = day;

		return cell;
	}

	/**
	 * Get cell styles
	 */
	private getCellStyles(day: TaskDayData): StyleMap {
		return {
			width: `${this.settings.cellSize}px`,
			height: `${this.settings.cellSize}px`,
			backgroundColor: getColorForDay(day, this.settings),
			borderRadius: '2px',
			cursor: 'pointer',
			position: 'relative',
			zIndex: '10',
			userSelect: 'none',
			border: '1px solid transparent',
			transition: 'all 0.15s ease'
		};
	}

	/**
	 * Generate tooltip text
	 */
	private generateTooltip(day: TaskDayData): string {
		const dateDisplay = formatDateForDisplay(day.date, {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});

		if (day.totalTasks > 0) {
			return `${dateDisplay} - ${day.completedTasks}/${day.totalTasks} tasks completed`;
		} else if (day.hasNote) {
			return `${dateDisplay} - Note exists (no tasks)`;
		} else {
			return `${dateDisplay} - No note for this date`;
		}
	}

	/**
	 * Setup cell interactions (click and hover)
	 */
	private setupCellInteractions(
		cell: HTMLElement,
		cellWrapper: HTMLElement,
		day: TaskDayData
	): void {
		this.setupClickHandler(cell, cellWrapper, day);
		this.setupHoverEffects(cell);
	}

	/**
	 * Setup click handler
	 */
	private setupClickHandler(
		cell: HTMLElement,
		cellWrapper: HTMLElement,
		day: TaskDayData
	): void {
		const handler = this.createClickHandler(cellWrapper, day);
		
		cell.addEventListener('click', handler, true);
		cell.addEventListener('mouseup', handler, true);
	}

	/**
	 * Create click handler function
	 */
	private createClickHandler(
		cellWrapper: HTMLElement,
		day: TaskDayData
	): (event: Event) => void {
		return (event: Event) => {
			event.preventDefault();
			event.stopPropagation();
			
			this.onCellClick(cellWrapper, day);
		};
	}

	/**
	 * Setup hover effects
	 */
	private setupHoverEffects(cell: HTMLElement): void {
		cell.addEventListener('mouseenter', () => {
			applyStyles(cell, {
				opacity: '0.8',
				transform: 'scale(1.1)',
				border: '1px solid #666'
			});
		});

		cell.addEventListener('mouseleave', () => {
			applyStyles(cell, {
				opacity: '1',
				transform: 'scale(1)',
				border: '1px solid transparent'
			});
		});

		cell.addEventListener('mousedown', () => {
			cell.style.transform = 'scale(0.95)';
		});
	}
}
