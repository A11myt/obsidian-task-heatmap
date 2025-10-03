import { HeatmapSettings, COLOR_SCHEMES } from '../settings/settings';
import HeatmapCalendarPlugin from '../main';

/**
 * Data structure representing a single day's task information
 */
interface TaskDayData {
	date: Date;              // JavaScript Date object
	dateStr: string;         // ISO format: YYYY-MM-DD
	completedTasks: number;  // Number of [x] tasks
	totalTasks: number;      // Total number of tasks
	dayOfWeek: number;       // 0=Monday, 1=Tuesday, ..., 6=Sunday
	hasNote: boolean;        // Does a daily note exist?
	taskDetails: TaskDetail[]; // Full task information
}

/**
 * Detailed information about a single task
 */
interface TaskDetail {
	text: string;      // Task description text
	completed: boolean; // Is the task completed ([x])?
	line: number;      // Line number in the source file
}

/**
 * GitHub-style heatmap renderer for daily task tracking
 * 
 * Layout: 7 horizontal rows (one per weekday), days flow left to right
 * Color intensity indicates number of completed tasks
 * Click on any cell to view task details below the heatmap
 */
export class TaskHeatmapRenderer {
	plugin: HeatmapCalendarPlugin;
	settings: HeatmapSettings;

	constructor(plugin: HeatmapCalendarPlugin, settings: HeatmapSettings) {
		this.plugin = plugin;
		this.settings = settings;
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	async render(container: HTMLElement) {
		// Clear container first
		container.empty();
		container.addClass('heatmap-calendar-view');
		
		console.log('🎯 Starting Task Heatmap render...');
		
		// Render title
		this.renderTitle(container);

		// Collect task data from all notes
		const taskData = await this.collectTaskData();

		// Calculate date range
		const { startDate, endDate } = this.calculateDateRange();

		// Create heatmap container
		const heatmapContainer = container.createEl('div');
		heatmapContainer.addClass('heatmap-container');
		heatmapContainer.style.padding = '10px 0';

		// GitHub-style heatmap layout
		const mainContainer = heatmapContainer.createEl('div');
		mainContainer.style.display = 'flex';
		mainContainer.style.gap = '8px';
		mainContainer.style.alignItems = 'flex-start';
		mainContainer.style.overflowX = 'auto';
		mainContainer.style.overflowY = 'hidden';

		// Render weekday labels (vertical)
		this.renderWeekdayLabels(mainContainer);

		// Grid container - days flow horizontally, organized by weekday rows
		const gridContainer = mainContainer.createEl('div');
		gridContainer.style.display = 'flex';
		gridContainer.style.flexDirection = 'column';
		gridContainer.style.gap = '2px';

		this.renderGithubStyleGrid(gridContainer, startDate, endDate, taskData);

		// Render legend
		if (this.settings.showLegend || this.settings.showTotal) {
			this.renderLegend(heatmapContainer, taskData);
		}

		// Create task details container below heatmap
		const taskDetailsContainer = container.createEl('div');
		taskDetailsContainer.addClass('task-details-container');
		taskDetailsContainer.style.marginTop = '20px';
		taskDetailsContainer.style.padding = '15px';
		taskDetailsContainer.style.backgroundColor = 'var(--background-secondary)';
		taskDetailsContainer.style.borderRadius = '8px';
		taskDetailsContainer.style.display = 'none'; // Hidden by default
		
		// Store reference for later use
		(container as any).taskDetailsContainer = taskDetailsContainer;
	}

	// ============================================================
	// DATA COLLECTION & CALCULATION
	// ============================================================

	async collectTaskData(): Promise<Map<string, TaskDayData>> {
		const taskData = new Map<string, TaskDayData>();
		const dateRegex = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
		const monthMap: { [key: string]: number } = {
			Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
			Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
		};

		const files = this.plugin.app.vault.getMarkdownFiles();

		for (const file of files) {
			if (file.path.startsWith(this.settings.notesFolder)) {
				const filename = file.basename;
				const match = filename.match(dateRegex);
				
				if (match) {
					const [_, day, month, year] = match;
					const monthNum = monthMap[month];
					const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${day}`;
					
					// Read file content to count tasks and get details
					const content = await this.plugin.app.vault.read(file);
					const { completed, total, taskDetails } = this.parseTasksWithDetails(content);
					
					// Include ALL notes with dates, even if they have no tasks
					const date = new Date(parseInt(year), monthNum, parseInt(day));
					const dayOfWeek = (date.getDay() + 6) % 7; // Mo=0, Su=6
					
					taskData.set(dateStr, {
						date: date,
						dateStr: dateStr,
						completedTasks: completed,
						totalTasks: total,
						dayOfWeek: dayOfWeek,
						hasNote: true,
						taskDetails: taskDetails
					});
				}
			}
		}

		return taskData;
	}

	private parseTasksWithDetails(content: string): { completed: number; total: number; taskDetails: TaskDetail[] } {
		const taskDetails: TaskDetail[] = [];
		const lines = content.split('\n');
		
		lines.forEach((line, index) => {
			// Match tasks: - [x], - [X], - [ ], * [x], etc.
			const taskMatch = line.match(/^[\s]*[-*]\s+\[([\sxX])\](.*)$/);
			if (taskMatch) {
				const isCompleted = taskMatch[1].toLowerCase() === 'x';
				const taskText = taskMatch[2].trim();
				
				taskDetails.push({
					text: taskText || '(Empty task)',
					completed: isCompleted,
					line: index + 1
				});
			}
		});
		
		const completed = taskDetails.filter(task => task.completed).length;
		const total = taskDetails.length;
		
		return { completed, total, taskDetails };
	}

	calculateDateRange(): { startDate: Date; endDate: Date } {
		const today = new Date();
		const currentYear = today.getFullYear();
		
		// Always show full year: Jan 1 to Dec 31
		const startDate = new Date(currentYear, 0, 1); // Jan 1
		const endDate = new Date(currentYear, 11, 31); // Dec 31
		
		return { startDate, endDate };
	}	private buildWeekData(startDate: Date, endDate: Date, taskData: Map<string, TaskDayData>): TaskDayData[][] {
		const currentDate = new Date(startDate);
		const weeks: TaskDayData[][] = [];
		let currentWeek: TaskDayData[] = [];

		while (currentDate <= endDate) {
			const dayOfWeek = (currentDate.getDay() + 6) % 7; // Mo=0, Su=6

			// Start new week on Monday
			if (dayOfWeek === 0 && currentWeek.length > 0) {
				weeks.push(currentWeek);
				currentWeek = [];
			}

			const dateStr = currentDate.toISOString().split('T')[0];
			let dayData = taskData.get(dateStr);
			
			// If no data exists for this day, create empty day data
			if (!dayData) {
				dayData = {
					date: new Date(currentDate),
					dateStr: dateStr,
					completedTasks: 0,
					totalTasks: 0,
					dayOfWeek: dayOfWeek,
					hasNote: false,
					taskDetails: []
				};
			} else {
				// Ensure dayOfWeek is set correctly
				dayData.dayOfWeek = dayOfWeek;
			}

			currentWeek.push(dayData);
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Add last week if not empty
		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}

		return weeks;
	}

	// ============================================================
	// RENDERING COMPONENTS
	// ============================================================

	private renderTitle(container: HTMLElement) {
		const titleContainer = container.createEl('div');
		titleContainer.style.width = '100%';
		titleContainer.style.textAlign = 'center';
		titleContainer.style.marginBottom = '20px';
		titleContainer.style.padding = '10px 0';
		
		const title = titleContainer.createEl('h3', { text: this.settings.taskTitle || 'Task Heatmap' });
		title.style.margin = '0';
		title.style.fontSize = '20px';
		title.style.fontWeight = 'bold';
		title.style.color = 'var(--text-normal)';
		title.style.display = 'block';
		title.style.visibility = 'visible';
		
		console.log('✅ Title rendered:', this.settings.taskTitle);
	}

	// Removed - no year labels needed for simple heatmap

	private renderWeekdayLabels(container: HTMLElement) {
		const weekdayContainer = container.createEl('div');
		weekdayContainer.style.display = 'flex';
		weekdayContainer.style.flexDirection = 'column';
		weekdayContainer.style.gap = '2px';
		weekdayContainer.style.fontSize = '10px';
		weekdayContainer.style.color = 'var(--text-muted)';
		weekdayContainer.style.marginTop = '0px';

		const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
		labels.forEach(label => {
			const labelDiv = weekdayContainer.createEl('div');
			labelDiv.style.height = `${this.settings.cellSize}px`;
			labelDiv.style.lineHeight = `${this.settings.cellSize}px`;
			labelDiv.style.textAlign = 'right';
			labelDiv.style.paddingRight = '5px';
			labelDiv.style.minWidth = '20px';
			labelDiv.style.display = 'flex';
			labelDiv.style.alignItems = 'center';
			labelDiv.style.justifyContent = 'flex-end';
			labelDiv.textContent = label;
		});
	}

	private renderGithubStyleGrid(container: HTMLElement, startDate: Date, endDate: Date, taskData: Map<string, TaskDayData>) {
		// Create 7 rows (one for each weekday: Mo, Di, Mi, Do, Fr, Sa, So)
		const rows: HTMLElement[] = [];
		for (let i = 0; i < 7; i++) {
			const row = container.createEl('div');
			row.style.display = 'flex';
			row.style.gap = '2px';
			rows.push(row);
		}

		// Find which weekday January 1st falls on (0=Mo, 1=Di, ..., 6=So)
		const firstDayOfWeek = (startDate.getDay() + 6) % 7;
		
		// Add empty cells at the beginning of rows that come BEFORE the first day
		// Example: If Jan 1 is Wednesday (Mi=2), then Mo and Di rows need 1 empty cell each
		for (let weekday = 0; weekday < firstDayOfWeek; weekday++) {
			this.renderPlaceholderCell(rows[weekday]);
		}

		// Iterate through all days and place them in the correct row
		const currentDate = new Date(startDate);
		
		while (currentDate <= endDate) {
			const dayOfWeek = (currentDate.getDay() + 6) % 7; // Mo=0, Di=1, ..., So=6
			const dateStr = currentDate.toISOString().split('T')[0];
			let dayData = taskData.get(dateStr);
			
			if (!dayData) {
				dayData = {
					date: new Date(currentDate),
					dateStr: dateStr,
					completedTasks: 0,
					totalTasks: 0,
					dayOfWeek: dayOfWeek,
					hasNote: false,
					taskDetails: []
				};
			}

			// Add cell to the appropriate weekday row
			this.renderDayCell(rows[dayOfWeek], dayData);
			
			currentDate.setDate(currentDate.getDate() + 1);
		}
	}

	private renderGrid(container: HTMLElement, startDate: Date, endDate: Date, taskData: Map<string, TaskDayData>) {
		// Organize days by week (7 columns, one per weekday)
		const currentDate = new Date(startDate);
		
		// Find the first Monday (or start of week)
		const firstDayOfWeek = (currentDate.getDay() + 6) % 7; // Mo=0, Su=6
		
		// Create a 2D array: weeks x days
		const weeks: TaskDayData[][] = [];
		let currentWeek: TaskDayData[] = [];
		
		// Add empty cells for days before the first date
		for (let i = 0; i < firstDayOfWeek; i++) {
			currentWeek.push({
				date: new Date(0),
				dateStr: '',
				completedTasks: 0,
				totalTasks: 0,
				dayOfWeek: i,
				hasNote: false,
				taskDetails: []
			});
		}

		while (currentDate <= endDate) {
			const dayOfWeek = (currentDate.getDay() + 6) % 7; // Mo=0, Su=6
			
			const dateStr = currentDate.toISOString().split('T')[0];
			let dayData = taskData.get(dateStr);
			
			if (!dayData) {
				dayData = {
					date: new Date(currentDate),
					dateStr: dateStr,
					completedTasks: 0,
					totalTasks: 0,
					dayOfWeek: dayOfWeek,
					hasNote: false,
					taskDetails: []
				};
			}

			currentWeek.push(dayData);
			
			// Start new week on Monday (after Sunday)
			if (currentWeek.length === 7) {
				weeks.push(currentWeek);
				currentWeek = [];
			}
			
			currentDate.setDate(currentDate.getDate() + 1);
		}
		
		// Add last incomplete week if exists
		if (currentWeek.length > 0) {
			// Fill remaining days with empty cells
			while (currentWeek.length < 7) {
				currentWeek.push({
					date: new Date(0),
					dateStr: '',
					completedTasks: 0,
					totalTasks: 0,
					dayOfWeek: currentWeek.length,
					hasNote: false,
					taskDetails: []
				});
			}
			weeks.push(currentWeek);
		}

		// Render weeks as rows
		weeks.forEach(week => {
			const weekRow = container.createEl('div');
			weekRow.style.display = 'flex';
			weekRow.style.gap = '2px';
			weekRow.style.height = `${this.settings.cellSize}px`;
			
			week.forEach(day => {
				if (day.dateStr === '') {
					// Empty placeholder
					this.renderPlaceholderCell(weekRow);
				} else {
					this.renderDayCell(weekRow, day);
				}
			});
		});
	}

	private renderPlaceholderCell(container: HTMLElement) {
		const placeholder = container.createEl('div');
		placeholder.style.width = `${this.settings.cellSize}px`;
		placeholder.style.height = `${this.settings.cellSize}px`;
		placeholder.style.visibility = 'hidden';
	}

	private renderDayCell(container: HTMLElement, day: TaskDayData) {
		const cellWrapper = container.createEl('div');
		cellWrapper.style.position = 'relative';
		cellWrapper.style.width = `${this.settings.cellSize}px`;
		
		const cell = cellWrapper.createEl('div');
		cell.style.width = `${this.settings.cellSize}px`;
		cell.style.height = `${this.settings.cellSize}px`;
		
		const color = this.getColorForDay(day);
		cell.style.backgroundColor = color;
		cell.style.borderRadius = '2px';
		cell.style.cursor = 'pointer';
		cell.style.position = 'relative';
		cell.style.zIndex = '10';
		cell.style.userSelect = 'none';
		cell.style.border = '1px solid transparent';

		const dateDisplay = day.date.toLocaleDateString(this.settings.dateFormat, {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
		
		let tooltipText = dateDisplay;
		
		if (day.totalTasks > 0) {
			tooltipText += ` - ${day.completedTasks}/${day.totalTasks}`;
		} else if (day.hasNote) {
			tooltipText += ` - Note exists (no tasks)`;
		} else {
			tooltipText += ` - No note for this date`;
		}
		
		cell.setAttribute('aria-label', tooltipText);
		cell.title = tooltipText;
		cell.className = 'heatmap-cell-clickable';

		// Store day data for statistics panel
		(cell as any).dayData = day;

		// Click handler for showing statistics panel only
		const clickHandler = (event: Event) => {
			event.preventDefault();
			event.stopPropagation();
			console.log('🔥 TASK HEATMAP CLICK:', {
				date: day.dateStr,
				hasNote: day.hasNote,
				totalTasks: day.totalTasks,
				completedTasks: day.completedTasks,
				eventType: event.type,
				target: event.target
			});
			
			// Only toggle statistics panel - do NOT open the file
			try {
				this.toggleStatisticsPanel(cellWrapper, day);
				console.log('✅ Statistics panel toggled successfully');
			} catch (error) {
				console.error('❌ Error toggling statistics panel:', error);
			}
		};

		// Bind click events
		cell.addEventListener('click', clickHandler, true);
		cell.addEventListener('mouseup', clickHandler, true);
		
		// Visual feedback
		cell.addEventListener('mouseenter', () => {
			cell.style.opacity = '0.8';
			cell.style.transform = 'scale(1.1)';
			cell.style.transition = 'all 0.1s ease';
			cell.style.border = '1px solid #666';
		});
		
		cell.addEventListener('mouseleave', () => {
			cell.style.opacity = '1';
			cell.style.transform = 'scale(1)';
			cell.style.border = '1px solid transparent';
		});
		
		cell.addEventListener('mousedown', () => {
			cell.style.transform = 'scale(0.95)';
		});
	}

	// Removed - no file operations needed

	// No file opening functionality - just show statistics

	private renderLegend(container: HTMLElement, taskData: Map<string, TaskDayData>) {
		const legendContainer = container.createEl('div');
		legendContainer.style.display = 'flex';
		legendContainer.style.alignItems = 'center';
		legendContainer.style.gap = '5px';
		legendContainer.style.fontSize = '11px';
		legendContainer.style.marginTop = '8px';

		if (this.settings.showLegend) {
			this.renderLegendScale(legendContainer);
		}
	}

	private renderLegendScale(container: HTMLElement) {
		container.createEl('span', { text: 'Less' });
		
		const colors = this.settings.colorScheme === 'custom' 
			? this.settings.customColors 
			: COLOR_SCHEMES[this.settings.colorScheme];

		[this.settings.emptyColor, colors[1], colors[2], colors[3], colors[4]].forEach(color => {
			const box = container.createEl('div');
			box.style.width = `${this.settings.cellSize}px`;
			box.style.height = `${this.settings.cellSize}px`;
			box.style.backgroundColor = color;
			box.style.borderRadius = '2px';
		});

		container.createEl('span', { text: 'More' });
	}

	// ============================================================
	// INTERACTIVE FEATURES
	// ============================================================

	private toggleStatisticsPanel(cellWrapper: HTMLElement, day: TaskDayData) {
		console.log('📊 Showing tasks below heatmap for:', day.dateStr);
		
		// Find the main container
		const mainContainer = cellWrapper.closest('.heatmap-calendar-view') as HTMLElement;
		if (!mainContainer) {
			console.error('❌ Could not find main container');
			return;
		}
		
		const taskDetailsContainer = (mainContainer as any).taskDetailsContainer as HTMLElement;
		if (!taskDetailsContainer) {
			console.error('❌ Could not find task details container');
			return;
		}

		// Clear all active cell highlights
		const allCells = mainContainer.querySelectorAll('.day-cell');
		allCells.forEach(c => c.classList.remove('active-cell'));
		
		// Add highlight to clicked cell
		const cell = cellWrapper.querySelector('.day-cell');
		if (cell) {
			cell.classList.add('active-cell');
		}

		// Show and populate the task details container
		taskDetailsContainer.style.display = 'block';
		this.renderTaskDetails(taskDetailsContainer, day);
		
		// Smooth scroll to task details
		taskDetailsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	private renderTaskDetails(container: HTMLElement, day: TaskDayData) {
		container.empty();
		
		const dateDisplay = day.date.toLocaleDateString(this.settings.dateFormat, {
			weekday: 'long',
			day: '2-digit',
			month: 'long',
			year: 'numeric'
		});

		// Header
		const header = container.createEl('div');
		header.style.fontWeight = 'bold';
		header.style.fontSize = '16px';
		header.style.marginBottom = '12px';
		header.style.color = 'var(--text-accent)';
		header.style.display = 'flex';
		header.style.justifyContent = 'space-between';
		header.style.alignItems = 'center';

		const dateTitle = header.createEl('span');
		dateTitle.textContent = `📅 ${dateDisplay}`;

		// Close button
		const closeBtn = header.createEl('button');
		closeBtn.textContent = '×';
		closeBtn.style.background = 'none';
		closeBtn.style.border = 'none';
		closeBtn.style.fontSize = '24px';
		closeBtn.style.cursor = 'pointer';
		closeBtn.style.color = 'var(--text-muted)';
		closeBtn.style.width = '30px';
		closeBtn.style.height = '30px';
		closeBtn.style.display = 'flex';
		closeBtn.style.alignItems = 'center';
		closeBtn.style.justifyContent = 'center';
		closeBtn.style.borderRadius = '4px';

		closeBtn.addEventListener('click', () => {
			container.style.display = 'none';
			// Remove active cell highlight
			const allCells = container.closest('.heatmap-calendar-view')?.querySelectorAll('.day-cell');
			allCells?.forEach(c => c.classList.remove('active-cell'));
		});

		closeBtn.addEventListener('mouseenter', () => {
			closeBtn.style.backgroundColor = 'var(--background-modifier-hover)';
		});

		closeBtn.addEventListener('mouseleave', () => {
			closeBtn.style.backgroundColor = 'transparent';
		});

		// Task summary
		const summary = container.createEl('div');
		summary.style.marginBottom = '15px';
		summary.style.padding = '10px';
		summary.style.backgroundColor = 'var(--background-primary)';
		summary.style.borderRadius = '6px';
		summary.style.fontSize = '14px';
		
		if (day.totalTasks === 0) {
			if (day.hasNote) {
				summary.innerHTML = `<span style="color: var(--text-muted);">📝 Note exists but no tasks found</span>`;
			} else {
				summary.innerHTML = `<span style="color: var(--text-muted);">📄 No note for this date</span>`;
			}
		} else {
			const completionPercentage = Math.round((day.completedTasks / day.totalTasks) * 100);
			const statusIcon = completionPercentage === 100 ? '✅' : completionPercentage > 0 ? '🔄' : '⏳';
			summary.innerHTML = `${statusIcon} <strong style="font-size: 16px;">${day.completedTasks}/${day.totalTasks}</strong> (${completionPercentage}%)`;
		}

		// Task details list
		if (day.taskDetails.length > 0) {
			const tasksHeader = container.createEl('div');
			tasksHeader.style.fontWeight = 'bold';
			tasksHeader.style.fontSize = '14px';
			tasksHeader.style.marginTop = '15px';
			tasksHeader.style.marginBottom = '10px';
			tasksHeader.textContent = 'Tasks:';

			const tasksList = container.createEl('div');
			tasksList.style.display = 'flex';
			tasksList.style.flexDirection = 'column';
			tasksList.style.gap = '8px';

			day.taskDetails.forEach((task) => {
				const taskItem = tasksList.createEl('div');
				taskItem.style.padding = '10px';
				taskItem.style.backgroundColor = 'var(--background-primary)';
				taskItem.style.borderRadius = '6px';
				taskItem.style.display = 'flex';
				taskItem.style.alignItems = 'flex-start';
				taskItem.style.gap = '10px';
				taskItem.style.border = '1px solid var(--background-modifier-border)';
				taskItem.style.transition = 'all 0.2s ease';

				taskItem.addEventListener('mouseenter', () => {
					taskItem.style.backgroundColor = 'var(--background-modifier-hover)';
					taskItem.style.transform = 'translateX(4px)';
				});

				taskItem.addEventListener('mouseleave', () => {
					taskItem.style.backgroundColor = 'var(--background-primary)';
					taskItem.style.transform = 'translateX(0)';
				});

				// Checkbox icon
				const checkbox = taskItem.createEl('span');
				checkbox.style.fontSize = '16px';
				checkbox.style.flexShrink = '0';
				checkbox.style.marginTop = '2px';
				checkbox.textContent = task.completed ? '✅' : '☐';

				// Task text
				const taskText = taskItem.createEl('span');
				taskText.style.flex = '1';
				taskText.style.wordBreak = 'break-word';
				taskText.style.fontSize = '13px';
				if (task.completed) {
					taskText.style.textDecoration = 'line-through';
					taskText.style.color = 'var(--text-muted)';
				}
				taskText.textContent = task.text;

				// Line number badge
				const lineNumber = taskItem.createEl('span');
				lineNumber.style.fontSize = '10px';
				lineNumber.style.color = 'var(--text-faint)';
				lineNumber.style.flexShrink = '0';
				lineNumber.style.backgroundColor = 'var(--background-modifier-border)';
				lineNumber.style.padding = '2px 6px';
				lineNumber.style.borderRadius = '3px';
				lineNumber.textContent = `L${task.line}`;
			});
		}
	}

	private createStatisticsPanel(cellWrapper: HTMLElement, day: TaskDayData) {
		// This method is no longer used - replaced by renderTaskDetails
		// Keeping it for backwards compatibility if needed
	}

	// ============================================================
	// UTILITY METHODS
	// ============================================================

	private getColorForDay(day: TaskDayData): string {
		// If no note exists, show empty color
		if (!day.hasNote) {
			return this.settings.emptyColor;
		}
		
		const colors = this.settings.colorScheme === 'custom' 
			? this.settings.customColors 
			: COLOR_SCHEMES[this.settings.colorScheme];
		
		// If no tasks but note exists, show light color (document created)
		if (day.totalTasks === 0) {
			return colors[1]; // Light color for documents without tasks
		}
		
		// Calculate completion-based intensity
		// Focus mainly on completed tasks count, not just ratio
		const completedTasks = day.completedTasks;
		const totalTasks = day.totalTasks;
		
		// Color based on absolute completed tasks with ratio consideration
		if (completedTasks === 0) {
			// Tasks exist but none completed
			return colors[1]; // Same light color as document-only
		} else if (completedTasks === 1) {
			// 1 task completed
			return colors[2];
		} else if (completedTasks <= 3) {
			// 2-3 tasks completed
			return colors[3];
		} else {
			// 4+ tasks completed
			return colors[4];
		}
		
		// Alternative: Could also combine with completion ratio
		// const completionRatio = completedTasks / totalTasks;
		// But for now, let's focus on absolute completed count
	}
}