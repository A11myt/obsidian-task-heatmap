import { HeatmapSettings, COLOR_SCHEMES } from '../settings/settings';
import HeatmapCalendarPlugin from '../main';

// ============================================================
// INTERFACES & TYPES
// ============================================================

interface TaskDetail {
	text: string;
	completed: boolean;
	line: number;
}

interface TaskDayData {
	date: Date;
	dateStr: string;
	completedTasks: number;
	totalTasks: number;
	dayOfWeek: number;
	hasNote: boolean;
	taskDetails: TaskDetail[];
}

interface DateRange {
	startDate: Date;
	endDate: Date;
}

interface TaskParseResult {
	completed: number;
	total: number;
	taskDetails: TaskDetail[];
}

// ============================================================
// CONSTANTS
// ============================================================

const CELLS_PER_ROW = 30;
const DATE_REGEX = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
const TASK_REGEX = /^[\s]*[-*]\s+\[([_\sxX])\](.*)$/;

const MONTH_MAP: Record<string, number> = {
	Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
	Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ============================================================
// MAIN RENDERER CLASS
// ============================================================

export class TaskHeatmapRenderer {
	private plugin: HeatmapCalendarPlugin;
	private settings: HeatmapSettings;

	constructor(plugin: HeatmapCalendarPlugin, settings: HeatmapSettings) {
		this.plugin = plugin;
		this.settings = settings;
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	async render(container: HTMLElement): Promise<void> {
		this.initializeContainer(container);
		this.renderTitle(container);

		const taskData = await this.collectTaskData();
		const dateRange = this.calculateDateRange();

		const heatmapContainer = this.createHeatmapContainer(container);
		const mainContainer = this.createMainContainer(heatmapContainer);
		
		this.renderWeekdayLabels(mainContainer);
		const gridContainer = this.createGridContainer(mainContainer);
		
		this.renderGrid(gridContainer, dateRange, taskData);
		this.renderLegend(heatmapContainer, taskData);
	}

	// ============================================================
	// INITIALIZATION
	// ============================================================

	private initializeContainer(container: HTMLElement): void {
		container.empty();
		container.addClass('heatmap-calendar-view');
		console.log('🎯 Starting Task Heatmap render...');
	}

	private createHeatmapContainer(parent: HTMLElement): HTMLElement {
		const container = parent.createEl('div');
		container.addClass('heatmap-container');
		return container;
	}

	private createMainContainer(parent: HTMLElement): HTMLElement {
		const container = parent.createEl('div');
		this.applyStyles(container, {
			display: 'flex',
			gap: '8px',
			alignItems: 'flex-start'
		});
		return container;
	}

	private createGridContainer(parent: HTMLElement): HTMLElement {
		const container = parent.createEl('div');
		this.applyStyles(container, {
			display: 'flex',
			gap: '2px',
			overflowX: 'auto',
			justifyContent: 'center',
			flexWrap: 'wrap',
			maxWidth: '100%'
		});
		return container;
	}

	// ============================================================
	// DATA COLLECTION & PROCESSING
	// ============================================================

	async collectTaskData(): Promise<Map<string, TaskDayData>> {
		const taskData = new Map<string, TaskDayData>();
		const files = this.plugin.app.vault.getMarkdownFiles();

		for (const file of files) {
			if (!this.isInNotesFolder(file.path)) continue;

			const dateInfo = this.parseDateFromFilename(file.basename);
			if (!dateInfo) continue;

			const content = await this.plugin.app.vault.read(file);
			const taskResult = this.parseTasksWithDetails(content);
			
			taskData.set(dateInfo.dateStr, this.createTaskDayData(dateInfo, taskResult));
		}

		return taskData;
	}

	private isInNotesFolder(filePath: string): boolean {
		return filePath.startsWith(this.settings.notesFolder);
	}

	private parseDateFromFilename(filename: string): { dateStr: string; date: Date } | null {
		const match = filename.match(DATE_REGEX);
		if (!match) return null;

		const [_, day, month, year] = match;
		const monthNum = MONTH_MAP[month];
		const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${day}`;
		const date = new Date(parseInt(year), monthNum, parseInt(day));

		return { dateStr, date };
	}

	private parseTasksWithDetails(content: string): TaskParseResult {
		const taskDetails: TaskDetail[] = [];
		const lines = content.split('\n');

		lines.forEach((line, index) => {
			const taskMatch = line.match(TASK_REGEX);
			if (!taskMatch) return;

			const isCompleted = taskMatch[1].toLowerCase() === 'x';
			const taskText = taskMatch[2].trim() || '(Empty task)';

			taskDetails.push({
				text: taskText,
				completed: isCompleted,
				line: index + 1
			});
		});

		const completed = taskDetails.filter(task => task.completed).length;
		return { completed, total: taskDetails.length, taskDetails };
	}

	private createTaskDayData(
		dateInfo: { dateStr: string; date: Date },
		taskResult: TaskParseResult
	): TaskDayData {
		return {
			date: dateInfo.date,
			dateStr: dateInfo.dateStr,
			completedTasks: taskResult.completed,
			totalTasks: taskResult.total,
			dayOfWeek: (dateInfo.date.getDay() + 6) % 7,
			hasNote: true,
			taskDetails: taskResult.taskDetails
		};
	}

	// ============================================================
	// DATE RANGE CALCULATION
	// ============================================================

	calculateDateRange(): DateRange {
		const today = new Date();
		const startDate = new Date(today);
		let endDate = new Date(today);

		if (this.settings.enableYearSelector && !this.settings.showAllYears) {
			return this.getYearRange(today);
		} else {
			startDate.setDate(startDate.getDate() - 365);
			return { startDate, endDate };
		}
	}

	private getYearRange(today: Date): DateRange {
		const startDate = new Date(this.settings.selectedYear, 0, 1);
		const yearEnd = new Date(this.settings.selectedYear, 11, 31);
		const currentYear = today.getFullYear();

		let endDate: Date;
		if (this.settings.selectedYear === currentYear) {
			endDate = yearEnd; // Show full current year
		} else if (yearEnd > today) {
			endDate = today; // Future year - show up to today
		} else {
			endDate = yearEnd; // Past year - show full year
		}

		return { startDate, endDate };
	}

	// ============================================================
	// RENDERING COMPONENTS
	// ============================================================

	private renderTitle(container: HTMLElement): void {
		const titleContainer = container.createEl('div');
		this.applyStyles(titleContainer, {
			width: '100%',
			textAlign: 'center',
			marginBottom: '20px',
			padding: '10px 0'
		});

		const title = titleContainer.createEl('h3', { text: 'Task Heatmap' });
		this.applyStyles(title, {
			margin: '0',
			fontSize: '20px',
			fontWeight: 'bold',
			color: 'var(--text-normal)',
			display: 'block',
			visibility: 'visible'
		});

		console.log('✅ Title rendered: Task Heatmap');
	}

	private renderWeekdayLabels(container: HTMLElement): void {
		const weekdayContainer = container.createEl('div');
		this.applyStyles(weekdayContainer, {
			display: 'flex',
			flexDirection: 'column',
			gap: '2px',
			fontSize: '10px',
			color: 'var(--text-muted)',
			marginTop: '0px'
		});

		WEEKDAY_LABELS.forEach(label => {
			const labelDiv = weekdayContainer.createEl('div');
			this.applyStyles(labelDiv, {
				height: `${this.settings.cellSize + 2}px`,
				lineHeight: `${this.settings.cellSize + 2}px`,
				textAlign: 'right',
				paddingRight: '5px',
				minWidth: '20px'
			});
			labelDiv.textContent = label;
		});
	}

	private renderGrid(container: HTMLElement, dateRange: DateRange, taskData: Map<string, TaskDayData>): void {
		const currentDate = new Date(dateRange.startDate);
		let dayCount = 0;
		let currentRow: HTMLElement | null = null;

		while (currentDate <= dateRange.endDate) {
			if (dayCount % CELLS_PER_ROW === 0) {
				currentRow = this.createGridRow(container);
			}

			const dayData = this.getOrCreateDayData(currentDate, taskData);
			this.renderDayCell(currentRow!, dayData);

			currentDate.setDate(currentDate.getDate() + 1);
			dayCount++;
		}
	}

	private createGridRow(container: HTMLElement): HTMLElement {
		const row = container.createEl('div');
		this.applyStyles(row, {
			display: 'flex',
			gap: '2px',
			marginBottom: '2px',
			justifyContent: 'center'
		});
		return row;
	}

	private getOrCreateDayData(currentDate: Date, taskData: Map<string, TaskDayData>): TaskDayData {
		const dateStr = currentDate.toISOString().split('T')[0];
		const existingData = taskData.get(dateStr);

		if (existingData) {
			return existingData;
		}

		return {
			date: new Date(currentDate),
			dateStr: dateStr,
			completedTasks: 0,
			totalTasks: 0,
			dayOfWeek: (currentDate.getDay() + 6) % 7,
			hasNote: false,
			taskDetails: []
		};
	}

	private renderDayCell(container: HTMLElement, day: TaskDayData): void {
		const cellWrapper = this.createCellWrapper(container);
		const cell = this.createCell(cellWrapper, day);
		
		this.setupCellEvents(cell, cellWrapper, day);
		this.applyCellStyling(cell, day);
	}

	private createCellWrapper(container: HTMLElement): HTMLElement {
		const wrapper = container.createEl('div');
		this.applyStyles(wrapper, {
			position: 'relative',
			width: `${this.settings.cellSize}px`
		});
		return wrapper;
	}

	private createCell(wrapper: HTMLElement, day: TaskDayData): HTMLElement {
		const cell = wrapper.createEl('div');
		this.applyStyles(cell, {
			width: `${this.settings.cellSize}px`,
			height: `${this.settings.cellSize}px`,
			backgroundColor: this.getColorForDay(day),
			borderRadius: '2px',
			cursor: 'pointer',
			position: 'relative',
			zIndex: '10',
			userSelect: 'none',
			border: '1px solid transparent',
			transition: 'all 0.15s ease'
		});

		cell.className = 'heatmap-cell-clickable';
		cell.title = this.generateTooltip(day);
		(cell as any).dayData = day;

		return cell;
	}

	private generateTooltip(day: TaskDayData): string {
		const dateDisplay = day.date.toLocaleDateString(this.settings.dateFormat, {
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

	private setupCellEvents(cell: HTMLElement, cellWrapper: HTMLElement, day: TaskDayData): void {
		const clickHandler = this.createClickHandler(cellWrapper, day);
		
		cell.addEventListener('click', clickHandler, true);
		cell.addEventListener('mouseup', clickHandler, true);

		this.setupHoverEffects(cell);
	}

	private createClickHandler(cellWrapper: HTMLElement, day: TaskDayData): (event: Event) => void {
		return (event: Event) => {
			event.preventDefault();
			event.stopPropagation();
			
			console.log('🔥 TASK HEATMAP CLICK:', {
				date: day.dateStr,
				hasNote: day.hasNote,
				totalTasks: day.totalTasks,
				completedTasks: day.completedTasks,
				eventType: event.type
			});

			try {
				this.toggleStatisticsPanel(cellWrapper, day);
				console.log('✅ Statistics panel toggled successfully');
			} catch (error) {
				console.error('❌ Error toggling statistics panel:', error);
			}
		};
	}

	private setupHoverEffects(cell: HTMLElement): void {
		cell.addEventListener('mouseenter', () => {
			this.applyStyles(cell, {
				opacity: '0.8',
				transform: 'scale(1.1)',
				border: '1px solid #666'
			});
		});

		cell.addEventListener('mouseleave', () => {
			this.applyStyles(cell, {
				opacity: '1',
				transform: 'scale(1)',
				border: '1px solid transparent'
			});
		});

		cell.addEventListener('mousedown', () => {
			cell.style.transform = 'scale(0.95)';
		});
	}

	private applyCellStyling(cell: HTMLElement, day: TaskDayData): void {
		// Additional cell styling if needed
	}

	// ============================================================
	// STATISTICS PANEL
	// ============================================================

	private toggleStatisticsPanel(cellWrapper: HTMLElement, day: TaskDayData): void {
		console.log('📊 Toggling statistics panel for:', day.dateStr);

		const existingPanel = cellWrapper.querySelector('.task-statistics-panel') as HTMLElement;
		if (existingPanel) {
			console.log('🗑️ Removing existing panel');
			existingPanel.remove();
			return;
		}

		this.removeAllExistingPanels();
		this.createStatisticsPanel(cellWrapper, day);
	}

	private removeAllExistingPanels(): void {
		const allPanels = document.querySelectorAll('.task-statistics-panel');
		console.log(`🧹 Removing ${allPanels.length} existing panels`);
		allPanels.forEach(panel => panel.remove());
	}

	private createStatisticsPanel(cellWrapper: HTMLElement, day: TaskDayData): void {
		console.log('🆕 Creating new statistics panel');
		
		try {
			const panel = this.createPanelElement(cellWrapper);
			this.populatePanelContent(panel, day);
			this.setupPanelInteractions(panel);
			console.log('✅ Statistics panel created successfully');
		} catch (error) {
			console.error('❌ Error creating statistics panel:', error);
		}
	}

	private createPanelElement(cellWrapper: HTMLElement): HTMLElement {
		const panel = cellWrapper.createEl('div');
		panel.className = 'task-statistics-panel';
		
		this.applyStyles(panel, {
			position: 'absolute',
			top: `${this.settings.cellSize + 3}px`,
			left: '0',
			minWidth: '250px',
			maxWidth: '400px',
			backgroundColor: 'var(--background-primary)',
			border: '1px solid var(--background-modifier-border)',
			borderRadius: '8px',
			padding: '12px',
			fontSize: '12px',
			lineHeight: '1.4',
			zIndex: '1000',
			boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
			animation: 'fadeIn 0.2s ease-out'
		});

		this.addFadeInAnimation();
		return panel;
	}

	private addFadeInAnimation(): void {
		if (document.head.querySelector('[data-heatmap-animations]')) return;

		const styleEl = document.createElement('style');
		styleEl.textContent = `
			@keyframes fadeIn {
				from { opacity: 0; transform: translateY(-5px); }
				to { opacity: 1; transform: translateY(0); }
			}
		`;
		styleEl.setAttribute('data-heatmap-animations', 'true');
		document.head.appendChild(styleEl);
	}

	private populatePanelContent(panel: HTMLElement, day: TaskDayData): void {
		this.addPanelHeader(panel, day);
		this.addTaskSummary(panel, day);
		
		if (day.taskDetails.length > 0) {
			this.addTaskDetails(panel, day);
		}
		
		this.addCloseButton(panel);
	}

	private addPanelHeader(panel: HTMLElement, day: TaskDayData): void {
		const header = panel.createEl('div');
		this.applyStyles(header, {
			fontWeight: 'bold',
			marginBottom: '8px',
			color: 'var(--text-accent)'
		});

		const dateDisplay = day.date.toLocaleDateString(this.settings.dateFormat, {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});
		
		header.textContent = dateDisplay;
	}

	private addTaskSummary(panel: HTMLElement, day: TaskDayData): void {
		const summary = panel.createEl('div');
		summary.style.marginBottom = '10px';

		if (day.totalTasks === 0) {
			const message = day.hasNote 
				? '📝 Note exists but no tasks found'
				: '📄 No note for this date';
			summary.innerHTML = `<span style="color: var(--text-muted);">${message}</span>`;
		} else {
			const completionPercentage = Math.round((day.completedTasks / day.totalTasks) * 100);
			const statusIcon = this.getStatusIcon(completionPercentage);
			summary.innerHTML = `${statusIcon} <strong>${day.completedTasks}/${day.totalTasks}</strong> tasks completed (${completionPercentage}%)`;
		}
	}

	private getStatusIcon(completionPercentage: number): string {
		if (completionPercentage === 100) return '✅';
		if (completionPercentage > 0) return '🔄';
		return '⏳';
	}

	private addTaskDetails(panel: HTMLElement, day: TaskDayData): void {
		const tasksHeader = panel.createEl('div');
		this.applyStyles(tasksHeader, {
			fontWeight: 'bold',
			marginTop: '10px',
			marginBottom: '6px'
		});
		tasksHeader.textContent = 'Tasks:';

		const tasksList = this.createTasksList(panel);
		this.populateTasksList(tasksList, day.taskDetails);
	}

	private createTasksList(panel: HTMLElement): HTMLElement {
		const tasksList = panel.createEl('div');
		this.applyStyles(tasksList, {
			maxHeight: '200px',
			overflowY: 'auto',
			paddingRight: '5px'
		});
		return tasksList;
	}

	private populateTasksList(tasksList: HTMLElement, taskDetails: TaskDetail[]): void {
		taskDetails.forEach((task, index) => {
			const taskItem = this.createTaskItem(tasksList, task);
			
			if (index === taskDetails.length - 1) {
				taskItem.style.borderBottom = 'none';
			}
		});
	}

	private createTaskItem(tasksList: HTMLElement, task: TaskDetail): HTMLElement {
		const taskItem = tasksList.createEl('div');
		this.applyStyles(taskItem, {
			padding: '3px 0',
			borderBottom: '1px solid var(--background-modifier-border-hover)',
			display: 'flex',
			alignItems: 'flex-start',
			gap: '6px'
		});

		this.addTaskCheckbox(taskItem, task);
		this.addTaskText(taskItem, task);
		this.addTaskLineNumber(taskItem, task);

		return taskItem;
	}

	private addTaskCheckbox(taskItem: HTMLElement, task: TaskDetail): void {
		const checkbox = taskItem.createEl('span');
		this.applyStyles(checkbox, {
			fontSize: '12px',
			flexShrink: '0',
			marginTop: '1px'
		});
		checkbox.textContent = task.completed ? '✅' : '☐';
	}

	private addTaskText(taskItem: HTMLElement, task: TaskDetail): void {
		const taskText = taskItem.createEl('span');
		this.applyStyles(taskText, {
			flex: '1',
			wordBreak: 'break-word'
		});

		if (task.completed) {
			this.applyStyles(taskText, {
				textDecoration: 'line-through',
				color: 'var(--text-muted)'
			});
		}
		
		taskText.textContent = task.text;
	}

	private addTaskLineNumber(taskItem: HTMLElement, task: TaskDetail): void {
		const lineNumber = taskItem.createEl('span');
		this.applyStyles(lineNumber, {
			fontSize: '10px',
			color: 'var(--text-faint)',
			flexShrink: '0'
		});
		lineNumber.textContent = `L${task.line}`;
	}

	private addCloseButton(panel: HTMLElement): void {
		const closeBtn = panel.createEl('button');
		closeBtn.textContent = '×';
		
		this.applyStyles(closeBtn, {
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
		});

		this.setupCloseButtonEvents(closeBtn, panel);
	}

	private setupCloseButtonEvents(closeBtn: HTMLElement, panel: HTMLElement): void {
		closeBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			panel.remove();
		});

		closeBtn.addEventListener('mouseenter', () => {
			this.applyStyles(closeBtn, {
				backgroundColor: 'var(--background-modifier-hover)',
				borderRadius: '3px'
			});
		});

		closeBtn.addEventListener('mouseleave', () => {
			closeBtn.style.backgroundColor = 'transparent';
		});
	}

	private setupPanelInteractions(panel: HTMLElement): void {
		// Close panel when clicking outside
		setTimeout(() => {
			const closeOnClickOutside = (e: MouseEvent) => {
				if (!panel.contains(e.target as Node)) {
					panel.remove();
					document.removeEventListener('click', closeOnClickOutside);
				}
			};
			document.addEventListener('click', closeOnClickOutside);
		}, 100);
	}

	// ============================================================
	// LEGEND
	// ============================================================

	private renderLegend(container: HTMLElement, taskData: Map<string, TaskDayData>): void {
		if (!this.settings.showLegend && !this.settings.showTotal) return;

		const legendContainer = this.createLegendContainer(container);

		if (this.settings.showLegend) {
			this.renderLegendScale(legendContainer);
		}

		if (this.settings.showTotal) {
			this.renderTotalStats(legendContainer, taskData);
		}
	}

	private createLegendContainer(container: HTMLElement): HTMLElement {
		const legendContainer = container.createEl('div');
		this.applyStyles(legendContainer, {
			display: 'flex',
			alignItems: 'center',
			gap: '5px',
			fontSize: '11px',
			marginTop: '8px'
		});
		return legendContainer;
	}

	private renderLegendScale(container: HTMLElement): void {
		container.createEl('span', { text: 'Less' });

		const colors = this.getColorScheme();
		[this.settings.emptyColor, ...colors.slice(1)].forEach(color => {
			const box = container.createEl('div');
			this.applyStyles(box, {
				width: `${this.settings.cellSize}px`,
				height: `${this.settings.cellSize}px`,
				backgroundColor: color,
				borderRadius: '2px'
			});
		});

		container.createEl('span', { text: 'More' });
	}

	private renderTotalStats(container: HTMLElement, taskData: Map<string, TaskDayData>): void {
		const totalCompleted = Array.from(taskData.values())
			.reduce((sum, day) => sum + day.completedTasks, 0);
		const totalTasks = Array.from(taskData.values())
			.reduce((sum, day) => sum + day.totalTasks, 0);

		const totalSpan = container.createEl('span', {
			text: `Total: ${totalCompleted}/${totalTasks} tasks completed`
		});
		totalSpan.style.marginLeft = '10px';
	}

	// ============================================================
	// COLOR LOGIC
	// ============================================================

	private getColorForDay(day: TaskDayData): string {
		if (!day.hasNote) {
			return this.settings.emptyColor;
		}

		const colors = this.getColorScheme();

		if (day.totalTasks === 0) {
			return colors[1]; // Light color for documents without tasks
		}

		const completedTasks = day.completedTasks;

		if (completedTasks === 0) {
			return colors[1]; // Same light color as document-only
		} else if (completedTasks === 1) {
			return colors[2]; // 1 task completed
		} else if (completedTasks <= 3) {
			return colors[3]; // 2-3 tasks completed
		} else {
			return colors[4]; // 4+ tasks completed
		}
	}

	private getColorScheme(): string[] {
		return this.settings.colorScheme === 'custom'
			? this.settings.customColors
			: COLOR_SCHEMES[this.settings.colorScheme];
	}

	// ============================================================
	// UTILITY METHODS
	// ============================================================

	private applyStyles(element: HTMLElement, styles: Record<string, string>): void {
		Object.entries(styles).forEach(([property, value]) => {
			(element.style as any)[property] = value;
		});
	}
}