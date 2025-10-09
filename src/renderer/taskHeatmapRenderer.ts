import { HeatmapSettings, COLOR_SCHEMES, SpecialTag } from '../settings/settings';
import HeatmapCalendarPlugin from '../main';
import { CSS_CLASSES } from '../constants/index';
import { 
	formatDynamicPath, 
	processTemplate, 
	getDefaultTemplate, 
	sanitizePathPattern,
	getDirectoryPath 
} from '../utils/dynamicNamingUtils';
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
	allTags: string[];       // All hashtags from the entire file content
}

/**
 * Detailed information about a single task
 */
interface TaskDetail {
	text: string;      // Task description text
	completed: boolean; // Is the task completed ([x])?
	line: number;      // Line number in the source file
	tags: string[];    // Simple hashtags extracted from text
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
	private dataCache: Map<string, TaskDayData> | null = null;
	private lastCacheTime: number = 0;

	// Helper method for safe element creation
	private createEl(parent: HTMLElement, tag: string, options: any = {}): HTMLElement {
		if ('createEl' in parent && typeof (parent as any).createEl === 'function') {
			return (parent as any).createEl(tag, options);
		} else {
			const element = document.createElement(tag);
			if (options.text) {
				element.textContent = options.text;
			}
			if (options.cls) {
				element.className = options.cls;
			}
			parent.appendChild(element);
			return element;
		}
	}

	// Helper method for safe container emptying
	private emptyContainer(container: HTMLElement): void {
		if ('empty' in container && typeof (container as any).empty === 'function') {
			(container as any).empty();
		} else {
			container.innerHTML = '';
		}
	}

	constructor(plugin: HeatmapCalendarPlugin, settings: HeatmapSettings) {
		this.plugin = plugin;
		this.settings = settings;
		
		// Register this renderer for cache invalidation
		this.plugin.registerRenderer(this);
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	async render(container: HTMLElement) {
		// Clear container first - safe fallback for non-Obsidian environments
		if ('empty' in container && typeof (container as any).empty === 'function') {
			(container as any).empty();
		} else {
			container.innerHTML = '';
		}
		
		if ('addClass' in container && typeof (container as any).addClass === 'function') {
			(container as any).addClass('heatmap-calendar-view');
		} else {
			container.className += ' heatmap-calendar-view';
		}
		
		console.log('🎯 Starting Task Heatmap render...');
		
		// Render title
		this.renderTitle(container);

		// Collect task data from all notes
		const taskData = await this.collectTaskData(true); // Force refresh for render

		// Calculate date range
		const { startDate, endDate } = this.calculateDateRange();

		// Create heatmap container
		// @ts-ignore - Obsidian API
		const heatmapContainer = container.createEl('div');
		// @ts-ignore - Obsidian API
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

		// Tag overview is now shown specifically for selected days in renderTaskDetails
		// No general tag overview needed anymore

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

	async collectTaskData(forceRefresh: boolean = false): Promise<Map<string, TaskDayData>> {
		try {
			// Use cache if available and not forced to refresh
			const now = Date.now();
			if (!forceRefresh && this.dataCache && (now - this.lastCacheTime < 1000)) {
				console.log('📋 Using cached task data');
				return this.dataCache;
			}

			console.log('🔄 Collecting fresh task data...');
		const taskData = new Map<string, TaskDayData>();
		const dateRegex = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
		const monthMap: { [key: string]: number } = {
			Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
			Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
		};

		const files = (this.plugin as any).app.vault.getMarkdownFiles();

		for (const file of files) {
			if (file.path.startsWith(this.settings.notesFolder)) {
				const filename = file.basename;
				const match = filename.match(dateRegex);
				
				if (match) {
					const [_, day, month, year] = match;
					const monthNum = monthMap[month];
					const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${day}`;
					
					// Read file content to count tasks and get details
					const content = await (this.plugin as any).app.vault.read(file);
					const { completed, total, taskDetails, allTags } = this.parseTasksWithDetails(content);
					
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
						taskDetails: taskDetails,
						allTags: allTags
					});
				}
			}
		}

			// Update cache
			this.dataCache = taskData;
			this.lastCacheTime = now;
			console.log(`✅ Collected data for ${taskData.size} days`);

			return taskData;
		} catch (error) {
			console.error('❌ Error collecting task data:', error);
			// Return empty data on error to prevent crashes
			return new Map<string, TaskDayData>();
		}
	}

	/**
	 * Clear the data cache to force fresh data collection
	 */
	public clearCache() {
		this.dataCache = null;
		this.lastCacheTime = 0;
		console.log('🗑️ Task data cache cleared');
	}

	/**
	 * Cleanup method to unregister from plugin
	 */
	public destroy() {
		this.plugin.unregisterRenderer(this);
		this.clearCache();
	}

	private parseTasksWithDetails(content: string): { completed: number; total: number; taskDetails: TaskDetail[]; allTags: string[] } {
		const taskDetails: TaskDetail[] = [];
		const lines = content.split('\n');
		
		// Extract all hashtags from the entire content (not just tasks)
		const allContentTags = this.extractHashtags(content);
		
		lines.forEach((line, index) => {
			// Match tasks: - [x], - [X], - [ ], * [x], etc.
			const taskMatch = line.match(/^[\s]*[-*]\s+\[([\sxX])\](.*)$/);
			if (taskMatch) {
				const isCompleted = taskMatch[1].toLowerCase() === 'x';
				const taskText = taskMatch[2].trim();
				
				// Extract simple hashtags from task text
				const tags = this.extractHashtags(taskText);
				
				taskDetails.push({
					text: taskText || '(Empty task)',
					completed: isCompleted,
					line: index + 1,
					tags: tags
				});
			}
		});
		
		const completed = taskDetails.filter(task => task.completed).length;
		const total = taskDetails.length;
		
		return { completed, total, taskDetails, allTags: allContentTags };
	}

	/**
	 * Extract hashtags from text using regex
	 */
	private extractHashtags(text: string): string[] {
		const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
		const matches: string[] = [];
		let match: RegExpExecArray | null;
		
		while ((match = hashtagRegex.exec(text)) !== null) {
			matches.push(match[1]);
		}
		
		return matches;
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
					taskDetails: [],
					allTags: []
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
		
		// Track dates we've rendered to avoid duplicates
		const rendered = new Set<string>();
		while (currentDate <= endDate) {
			const dayOfWeek = (currentDate.getDay() + 6) % 7; // Mo=0, Di=1, ..., So=6
			const dateStr = currentDate.toISOString().split('T')[0];
			let dayData = taskData.get(dateStr);
			// Skip if we've already rendered this date (defensive guard)
			if (rendered.has(dateStr)) {
				currentDate.setDate(currentDate.getDate() + 1);
				continue;
			}
			
			if (!dayData) {
				dayData = {
					date: new Date(currentDate),
					dateStr: dateStr,
					completedTasks: 0,
					totalTasks: 0,
					dayOfWeek: dayOfWeek,
					hasNote: false,
					taskDetails: [],
					allTags: []
				};
			}

			// Add cell to the appropriate weekday row
			this.renderDayCell(rows[dayOfWeek], dayData);
			rendered.add(dateStr);
			
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
				taskDetails: [],
				allTags: []
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
				taskDetails: [],
				allTags: []
			};
		}

		currentWeek.push(dayData);			// Start new week on Monday (after Sunday)
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
					taskDetails: [],
					allTags: []
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

		// Add special tag indicator if this day contains special tags
		const specialTagInfo = this.getSpecialTagForDay(day);
		if (specialTagInfo) {
			console.log(`🏷️ Special tag found for ${day.dateStr}: ${specialTagInfo.name} (${specialTagInfo.color})`);
			const indicator = this.createEl(cellWrapper, 'div');
			indicator.style.position = 'absolute';
			indicator.style.top = '1px';
			indicator.style.right = '1px';
			// Larger and more visible indicator
			indicator.style.width = '10px';
			indicator.style.height = '10px';
			indicator.style.backgroundColor = specialTagInfo.color;
			indicator.style.borderRadius = '50%';
			indicator.style.border = '1px solid rgba(255,255,255,0.95)';
			indicator.style.zIndex = '15';
			indicator.style.pointerEvents = 'none'; // Don't interfere with click events
		}

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

		// Add special tag info to tooltip
		if (specialTagInfo) {
			tooltipText += ` | Special: #${specialTagInfo.name}`;
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

	private renderTagOverview(container: HTMLElement, taskData: Map<string, TaskDayData>) {
		// This method is no longer used for general overview
		// Tags are now shown specifically for selected days in renderTaskDetails
		// We keep it for potential future use but don't call it by default
		return;
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
		(container as any).empty();
		
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

		// Open Day button
		const openDayBtn = header.createEl('button');
		openDayBtn.textContent = 'Tag öffnen';
		openDayBtn.className = CSS_CLASSES.OPEN_DAY_BUTTON;
		openDayBtn.style.background = 'var(--interactive-accent)';
		openDayBtn.style.color = 'var(--text-on-accent)';
		openDayBtn.style.border = 'none';
		openDayBtn.style.padding = '6px 12px';
		openDayBtn.style.borderRadius = '6px';
		openDayBtn.style.cursor = 'pointer';
		openDayBtn.style.fontSize = '13px';
		openDayBtn.style.fontWeight = '500';
		openDayBtn.style.transition = 'all 0.2s ease';

		openDayBtn.addEventListener('click', async () => {
			await this.openDailyNote(day);
		});

		openDayBtn.addEventListener('mouseenter', () => {
			openDayBtn.style.transform = 'translateY(-1px)';
			openDayBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
		});

		openDayBtn.addEventListener('mouseleave', () => {
			openDayBtn.style.transform = 'translateY(0)';
			openDayBtn.style.boxShadow = 'none';
		});

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

				// Task text with highlighted tags
				const taskText = taskItem.createEl('span');
				taskText.style.flex = '1';
				taskText.style.wordBreak = 'break-word';
				taskText.style.fontSize = '13px';
				if (task.completed) {
					taskText.style.textDecoration = 'line-through';
					taskText.style.color = 'var(--text-muted)';
				}
				
				// Simple task text display
				taskText.textContent = task.text;

				// Show tags under task text if any exist (but only those allowed by settings or 'urlaub')
				if (task.tags.length > 0) {
					const tagsContainer = taskItem.createEl('div');
					tagsContainer.style.display = 'flex';
					tagsContainer.style.flexWrap = 'wrap';
					tagsContainer.style.gap = '4px';
					tagsContainer.style.marginTop = '6px';
					tagsContainer.style.marginLeft = '26px'; // Align with task text
					task.tags.forEach(tag => {
						// Only show tags that are allowed by settings or 'urlaub'
						const tagLower = tag.toLowerCase();
						const allowed = this.settings.specialTags.some(st => st.name.toLowerCase() === tagLower && st.enabled) || tagLower === 'urlaub';
						if (!allowed) return;
						const tagSpan = tagsContainer.createEl('span');
						tagSpan.textContent = `#${tag}`;
						// Check if this is a configured special tag with custom color
						const specialTag = this.settings.specialTags.find(st => st.name.toLowerCase() === tagLower && st.enabled);
						if (specialTag) {
							tagSpan.style.background = specialTag.color;
							tagSpan.style.color = this.getContrastColor(specialTag.color);
							tagSpan.style.border = `1px solid ${this.darkenColor(specialTag.color, 20)}`;
							tagSpan.style.fontWeight = '600'; // Make special tags bolder
						} else {
							tagSpan.style.background = 'var(--interactive-accent)';
							tagSpan.style.color = 'var(--text-on-accent)';
						}
						tagSpan.style.padding = '2px 6px';
						tagSpan.style.borderRadius = '8px';
						tagSpan.style.fontSize = '10px';
						tagSpan.style.cursor = 'pointer';
						tagSpan.style.transition = 'all 0.2s ease';

						// Hover effect
						tagSpan.addEventListener('mouseenter', () => {
							tagSpan.style.transform = 'scale(1.05)';
							tagSpan.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
						});

						tagSpan.addEventListener('mouseleave', () => {
							tagSpan.style.transform = 'scale(1)';
							tagSpan.style.boxShadow = 'none';
						});

						// Click to open in search
						tagSpan.addEventListener('click', () => {
							this.openTagInSearch(tag);
						});
					});
				}

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

		// Show all tags from this specific day
		const dayTags = new Set<string>();
		
		// Collect tags from tasks
		day.taskDetails.forEach(task => {
			task.tags.forEach(tag => dayTags.add(tag));
		});
		
		// Collect all tags from entire file content (including standalone hashtags)
		day.allTags.forEach(tag => dayTags.add(tag));

		// Only render tag section if there are tags for this day
		if (dayTags.size > 0) {
			const tagsHeader = container.createEl('div');
			tagsHeader.style.fontWeight = 'bold';
			tagsHeader.style.fontSize = '14px';
			tagsHeader.style.marginTop = '15px';
			tagsHeader.style.marginBottom = '10px';
			tagsHeader.textContent = 'Tags:';

			const tagsContainer = container.createEl('div');
			tagsContainer.style.display = 'flex';
			tagsContainer.style.flexWrap = 'wrap';
			tagsContainer.style.gap = '4px';

			// Sort tags alphabetically and display them small and not bold
			const sortedTags = Array.from(dayTags).sort();
			
			sortedTags.forEach(tag => {
				const tagLower = tag.toLowerCase();
				const allowed = this.settings.specialTags.some(st => st.name.toLowerCase() === tagLower && st.enabled) || tagLower === 'urlaub';
				if (!allowed) return; // Skip tags not configured (except 'urlaub')
				const tagElement = tagsContainer.createEl('span');
				tagElement.textContent = `#${tag}`;
				// Style if special tag
				const specialTag = this.settings.specialTags.find(st => st.name.toLowerCase() === tagLower && st.enabled);
				if (specialTag) {
					tagElement.style.background = specialTag.color;
					tagElement.style.color = this.getContrastColor(specialTag.color);
					tagElement.style.border = `1px solid ${this.darkenColor(specialTag.color, 20)}`;
					tagElement.style.fontWeight = '600';
				} else {
					tagElement.style.background = 'var(--interactive-accent)';
					tagElement.style.color = 'var(--text-on-accent)';
				}
				tagElement.style.padding = '2px 6px';
				tagElement.style.borderRadius = '8px';
				tagElement.style.fontSize = '10px';  // Same as task tags - small
				tagElement.style.fontWeight = '500'; // Same as task tags - not bold
				tagElement.style.cursor = 'pointer';
				tagElement.style.transition = 'all 0.2s ease';
				// Hover
				tagElement.addEventListener('mouseenter', () => {
					tagElement.style.transform = 'scale(1.05)';
					tagElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
				});
				// Leave
				tagElement.addEventListener('mouseleave', () => {
					tagElement.style.transform = 'scale(1)';
					tagElement.style.boxShadow = 'none';
				});
				// Click
				tagElement.addEventListener('click', () => {
					this.openTagInSearch(tag);
				});
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
		
		// Keep normal color scheme - special tags only show as corner indicator
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

	/**
	 * Opens a tag in the Obsidian search
	 */
	private openTagInSearch(tag: string) {
		try {
			// Search query for the tag
			const searchQuery = `tag:#${tag}`;
			
			// Try to find existing search leaf first
			const searchLeaf = (this.plugin as any).app.workspace.getLeavesOfType('search')[0];
			
			if (searchLeaf) {
				// If search pane exists, use it and set the query
				const searchView = searchLeaf.view as any;
				if (searchView && typeof searchView.setQuery === 'function') {
					searchView.setQuery(searchQuery);
					(this.plugin as any).app.workspace.revealLeaf(searchLeaf);
				}
			} else {
				// If no search pane exists, create a new one
				const leaf = (this.plugin as any).app.workspace.getLeaf('tab');
				leaf.setViewState({
					type: 'search',
					state: {
						query: searchQuery
					}
				});
			}
			
			// Show a notice to confirm the action
			((this.plugin as any).app as any).notice?.(`Searching for tag: #${tag}`) || 
			new ((this.plugin as any).app as any).Notice(`Searching for tag: #${tag}`);
			
		} catch (error) {
			console.error('Error opening tag in search:', error);
			// Fallback: show notice with search query
			new ((this.plugin as any).app as any).Notice(`Search manually for: tag:#${tag}`);
		}
	}

	/**
	 * Opens or creates a daily note for the specified day using dynamic naming
	 */
	private async openDailyNote(day: TaskDayData) {
		try {
			const vault = (this.plugin as any).app.vault;
			const workspace = (this.plugin as any).app.workspace;
			
			// Generate dynamic path using the configured pattern and date format
			const pattern = sanitizePathPattern(this.settings.dailyNoteFormat);
			const fullPath = formatDynamicPath(pattern, day.date, this.settings.dateFormat);
			
			console.log(`🔍 Looking for daily note at: ${fullPath}`);
			
			// Check if note exists
			let file = vault.getAbstractFileByPath(fullPath);
			
			if (!file) {
				console.log(`📝 Creating new daily note: ${fullPath}`);
				
				// Ensure directory exists
				const dirPath = getDirectoryPath(fullPath);
				if (dirPath) {
					await this.ensureDirectoryExists(dirPath);
				}
				
				// Get template content
				let content = '';
				if (this.settings.useTemplate && this.settings.templateFile) {
					content = await this.loadTemplate(this.settings.templateFile, day.date);
				} else {
					// Use default template with configured locale
					content = processTemplate(getDefaultTemplate(), day.date, this.settings.dateFormat);
				}
				
				// Create the file
				file = await vault.create(fullPath, content);
				console.log(`✅ Created daily note: ${fullPath}`);
			} else {
				console.log(`📖 Opening existing daily note: ${fullPath}`);
			}
			
			// Open the note
			// @ts-ignore - Obsidian TFile type checking
			if (file && 'stat' in file) {
				// @ts-ignore - Obsidian API
				await workspace.getLeaf().openFile(file);
				// @ts-ignore - Obsidian API
				new Notice(`Daily note opened: ${fullPath.split('/').pop()}`);
			}
			
		} catch (error) {
			console.error('❌ Error opening daily note:', error);
			// @ts-ignore - Obsidian API
			new Notice(`Fehler beim Öffnen der Tagesnotiz: ${error.message}`);
		}
	}

	/**
	 * Format date for note title
	 */
	private formatDateForTitle(date: Date): string {
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		return date.toLocaleDateString('de-DE', options);
	}

	/**
	 * Ensure directory exists, create if necessary
	 */
	private async ensureDirectoryExists(dirPath: string) {
		const vault = (this.plugin as any).app.vault;
		
		// Split path into parts
		const parts = dirPath.split('/').filter(part => part.length > 0);
		let currentPath = '';
		
		for (const part of parts) {
			currentPath = currentPath ? `${currentPath}/${part}` : part;
			
			// Check if folder exists
			const folder = vault.getAbstractFileByPath(currentPath);
			if (!folder) {
				try {
					await vault.createFolder(currentPath);
					console.log(`📁 Created folder: ${currentPath}`);
				} catch (error) {
					// Folder might already exist due to race condition
					if (!error.message.includes('already exists')) {
						throw error;
					}
				}
			}
		}
	}

	/**
	 * Load and process template file
	 */
	private async loadTemplate(templatePath: string, date: Date): Promise<string> {
		try {
			const vault = (this.plugin as any).app.vault;
			const templateFile = vault.getAbstractFileByPath(templatePath);
			
			if (!templateFile) {
				console.warn(`⚠️ Template file not found: ${templatePath}, using default template`);
				return processTemplate(getDefaultTemplate(), date, this.settings.dateFormat);
			}
			
			// @ts-ignore - Obsidian TFile type checking
			if ('stat' in templateFile) {
				// @ts-ignore - Obsidian API
				const content = await vault.read(templateFile);
				return processTemplate(content, date, this.settings.dateFormat);
			} else {
				console.warn(`⚠️ Template path is not a file: ${templatePath}`);
				return processTemplate(getDefaultTemplate(), date, this.settings.dateFormat);
			}
			
		} catch (error) {
			console.error(`❌ Error loading template: ${templatePath}`, error);
			return processTemplate(getDefaultTemplate(), date, this.settings.dateFormat);
		}
	}

	/**
	 * Check if a day contains special tags and return the most prominent one
	 */
	private getSpecialTagForDay(day: TaskDayData): SpecialTag | null {
		// Check all tags from tasks and standalone tags in the day
		const allDayTags = new Set<string>();
		
		// Collect tags from tasks
		day.taskDetails.forEach(task => {
			task.tags.forEach(tag => allDayTags.add(tag));
		});
		
		// Collect all tags from entire file content (including standalone hashtags)
		day.allTags.forEach(tag => allDayTags.add(tag));
		
		// Debug output
		if (allDayTags.size > 0) {
			console.log(`🔍 Day ${day.dateStr} has tags:`, Array.from(allDayTags));
			console.log(`🔧 Available special tags:`, this.settings.specialTags.map(st => `${st.name}(enabled:${st.enabled})`));
		}
		
		// Find the first special tag that matches (prioritize by order in settings)
		for (const specialTag of this.settings.specialTags) {
			if (specialTag.enabled && allDayTags.has(specialTag.name)) {
				console.log(`✅ Found matching special tag: ${specialTag.name}`);
				return specialTag;
			}
		}
		
		return null;
	}

	/**
	 * Lighten a hex color by a given percentage
	 */
	private lightenColor(hex: string, percent: number): string {
		// Remove # if present
		const color = hex.replace('#', '');
		
		// Convert to RGB
		const r = parseInt(color.substr(0, 2), 16);
		const g = parseInt(color.substr(2, 2), 16);
		const b = parseInt(color.substr(4, 2), 16);
		
		// Lighten each component towards white
		const lightenedR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
		const lightenedG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
		const lightenedB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
		
		// Convert back to hex
		const toHex = (n: number) => n.toString(16).padStart(2, '0');
		
		return `#${toHex(lightenedR)}${toHex(lightenedG)}${toHex(lightenedB)}`;
	}

	/**
	 * Calculate contrast color (black or white) for a given background color
	 */
	private getContrastColor(backgroundColor: string): string {
		// Remove # if present
		const hex = backgroundColor.replace('#', '');
		
		// Convert to RGB
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		
		// Calculate luminance using W3C formula
		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		
		// Return black for light backgrounds, white for dark backgrounds
		return luminance > 0.5 ? '#000000' : '#ffffff';
	}

	/**
	 * Darken a hex color by a given percentage
	 */
	private darkenColor(hex: string, percent: number): string {
		// Remove # if present
		const color = hex.replace('#', '');
		
		// Convert to RGB
		const r = parseInt(color.substr(0, 2), 16);
		const g = parseInt(color.substr(2, 2), 16);
		const b = parseInt(color.substr(4, 2), 16);
		
		// Darken each component
		const darkenedR = Math.max(0, Math.floor(r * (1 - percent / 100)));
		const darkenedG = Math.max(0, Math.floor(g * (1 - percent / 100)));
		const darkenedB = Math.max(0, Math.floor(b * (1 - percent / 100)));
		
		// Convert back to hex
		const toHex = (n: number) => n.toString(16).padStart(2, '0');
		
		return `#${toHex(darkenedR)}${toHex(darkenedG)}${toHex(darkenedB)}`;
	}
}