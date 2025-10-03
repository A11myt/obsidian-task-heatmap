/**
 * Renders statistics panels for heatmap cells
 */

import { HeatmapSettings } from '../../settings/settings';
import { TaskDayData, StyleMap } from '../../types';
import { applyStyles, createElement } from '../../utils/domUtils';
import { formatDateForDisplay } from '../../utils/dateUtils';
import { getStatusIcon } from '../../utils/colorUtils';
import { ensureFadeAnimations } from '../../utils/animationUtils';
import { CSS_CLASSES, PANEL_CONFIG, TIMING } from '../../constants';
import { createLogger } from '../../utils/loggerUtils';

const logger = createLogger('StatisticsPanel');

export class StatisticsPanelRenderer {
	private settings: HeatmapSettings;

	constructor(settings: HeatmapSettings) {
		this.settings = settings;
	}

	/**
	 * Toggle statistics panel visibility
	 */
	togglePanel(cellWrapper: HTMLElement, day: TaskDayData): void {
		logger.debug('Toggling panel for', day.dateStr);

		const existingPanel = this.findExistingPanel(cellWrapper);
		
		if (existingPanel) {
			this.removePanel(existingPanel);
			return;
		}

		this.removeAllPanels();
		this.createPanel(cellWrapper, day);
	}

	/**
	 * Find existing panel in cell wrapper
	 */
	private findExistingPanel(cellWrapper: HTMLElement): HTMLElement | null {
		return cellWrapper.querySelector(`.${CSS_CLASSES.STATISTICS_PANEL}`) as HTMLElement | null;
	}

	/**
	 * Remove a panel
	 */
	private removePanel(panel: HTMLElement): void {
		logger.debug('Removing panel');
		panel.remove();
	}

	/**
	 * Remove all panels from document
	 */
	private removeAllPanels(): void {
		const panels = document.querySelectorAll(`.${CSS_CLASSES.STATISTICS_PANEL}`);
		logger.debug(`Removing ${panels.length} existing panels`);
		panels.forEach(panel => panel.remove());
	}

	/**
	 * Create and display panel
	 */
	private createPanel(cellWrapper: HTMLElement, day: TaskDayData): void {
		logger.debug('Creating panel');

		try {
			ensureFadeAnimations();
			
			const panel = this.createPanelElement(cellWrapper);
			this.populatePanel(panel, day);
			this.setupPanelBehavior(panel);
			
			logger.success('Panel created successfully');
		} catch (error) {
			logger.error('Failed to create panel', error);
		}
	}

	/**
	 * Create panel DOM element
	 */
	private createPanelElement(cellWrapper: HTMLElement): HTMLElement {
		return createElement(cellWrapper, 'div', {
			className: CSS_CLASSES.STATISTICS_PANEL,
			styles: this.getPanelStyles()
		});
	}

	/**
	 * Get panel styles
	 */
	private getPanelStyles(): StyleMap {
		return {
			position: 'absolute',
			top: `${this.settings.cellSize + 3}px`,
			left: '0',
			minWidth: PANEL_CONFIG.MIN_WIDTH,
			maxWidth: PANEL_CONFIG.MAX_WIDTH,
			backgroundColor: 'var(--background-primary)',
			border: '1px solid var(--background-modifier-border)',
			borderRadius: PANEL_CONFIG.BORDER_RADIUS,
			padding: PANEL_CONFIG.PADDING,
			fontSize: '12px',
			lineHeight: '1.4',
			zIndex: '1000',
			boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
			animation: 'fadeIn 0.2s ease-out'
		};
	}

	/**
	 * Populate panel with content
	 */
	private populatePanel(panel: HTMLElement, day: TaskDayData): void {
		this.addHeader(panel, day);
		this.addSummary(panel, day);
		
		if (day.taskDetails.length > 0) {
			this.addTaskList(panel, day);
		}
		
		this.addCloseButton(panel);
	}

	/**
	 * Add panel header with date
	 */
	private addHeader(panel: HTMLElement, day: TaskDayData): void {
		const dateDisplay = formatDateForDisplay(day.date, {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});

		createElement(panel, 'div', {
			text: dateDisplay,
			styles: {
				fontWeight: 'bold',
				marginBottom: '8px',
				color: 'var(--text-accent)'
			}
		});
	}

	/**
	 * Add task summary
	 */
	private addSummary(panel: HTMLElement, day: TaskDayData): void {
		const summary = createElement(panel, 'div', {
			styles: { marginBottom: '10px' }
		});

		const message = this.getSummaryMessage(day);
		summary.innerHTML = message;
	}

	/**
	 * Get summary message HTML
	 */
	private getSummaryMessage(day: TaskDayData): string {
		if (day.totalTasks === 0) {
			const message = day.hasNote
				? '📝 Note exists but no tasks found'
				: '📄 No note for this date';
			return `<span style="color: var(--text-muted);">${message}</span>`;
		}

		const percentage = Math.round((day.completedTasks / day.totalTasks) * 100);
		const icon = getStatusIcon(percentage);
		
		return `${icon} <strong>${day.completedTasks}/${day.totalTasks}</strong> tasks completed (${percentage}%)`;
	}

	/**
	 * Add task list
	 */
	private addTaskList(panel: HTMLElement, day: TaskDayData): void {
		createElement(panel, 'div', {
			text: 'Tasks:',
			styles: {
				fontWeight: 'bold',
				marginTop: '10px',
				marginBottom: '6px'
			}
		});

		const listContainer = createElement(panel, 'div', {
			styles: {
				maxHeight: PANEL_CONFIG.MAX_HEIGHT,
				overflowY: 'auto',
				paddingRight: '5px'
			}
		});

		day.taskDetails.forEach((task, index) => {
			this.addTaskItem(listContainer, task, index === day.taskDetails.length - 1);
		});
	}

	/**
	 * Add individual task item
	 */
	private addTaskItem(container: HTMLElement, task: any, isLast: boolean): void {
		const item = createElement(container, 'div', {
			styles: {
				padding: '3px 0',
				borderBottom: isLast ? 'none' : '1px solid var(--background-modifier-border-hover)',
				display: 'flex',
				alignItems: 'flex-start',
				gap: '6px'
			}
		});

		// Checkbox
		createElement(item, 'span', {
			text: task.completed ? '✅' : '☐',
			styles: {
				fontSize: '12px',
				flexShrink: '0',
				marginTop: '1px'
			}
		});

		// Task text
		const textStyles: StyleMap = {
			flex: '1',
			wordBreak: 'break-word'
		};
		
		if (task.completed) {
			textStyles.textDecoration = 'line-through';
			textStyles.color = 'var(--text-muted)';
		}

		createElement(item, 'span', {
			text: task.text,
			styles: textStyles
		});

		// Line number
		createElement(item, 'span', {
			text: `L${task.line}`,
			styles: {
				fontSize: '10px',
				color: 'var(--text-faint)',
				flexShrink: '0'
			}
		});
	}

	/**
	 * Add close button
	 */
	private addCloseButton(panel: HTMLElement): void {
		const button = createElement(panel, 'button', {
			text: '×',
			styles: {
				position: 'absolute',
				top: '5px',
				right: '8px',
				background: 'none',
				border: 'none',
				fontSize: '16px',
				cursor: 'pointer',
				color: 'var(--text-muted)',
				width: '20px',
				height: '20px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center'
			}
		});

		this.setupCloseButton(button, panel);
	}

	/**
	 * Setup close button behavior
	 */
	private setupCloseButton(button: HTMLElement, panel: HTMLElement): void {
		button.addEventListener('click', (e) => {
			e.stopPropagation();
			panel.remove();
		});

		button.addEventListener('mouseenter', () => {
			applyStyles(button, {
				backgroundColor: 'var(--background-modifier-hover)',
				borderRadius: '3px'
			});
		});

		button.addEventListener('mouseleave', () => {
			button.style.backgroundColor = 'transparent';
		});
	}

	/**
	 * Setup panel behavior (click outside to close)
	 */
	private setupPanelBehavior(panel: HTMLElement): void {
		setTimeout(() => {
			const handler = (e: MouseEvent) => {
				if (!panel.contains(e.target as Node)) {
					panel.remove();
					document.removeEventListener('click', handler);
				}
			};
			document.addEventListener('click', handler);
		}, TIMING.CLICK_OUTSIDE_DELAY);
	}
}
