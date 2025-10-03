/**
 * Utility functions and constants for the Task Heatmap plugin
 */

// ============================================================
// CONSTANTS
// ============================================================

export const DATE_REGEX = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
export const TASK_REGEX = /^[\s]*[-*]\s+\[([_\sxX])\](.*)$/;

export const MONTH_MAP: Record<string, number> = {
	Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
	Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const CELLS_PER_ROW = 30;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface TaskDetail {
	text: string;
	completed: boolean;
	line: number;
}

export interface TaskDayData {
	date: Date;
	dateStr: string;
	completedTasks: number;
	totalTasks: number;
	dayOfWeek: number;
	hasNote: boolean;
	taskDetails: TaskDetail[];
}

export interface DateRange {
	startDate: Date;
	endDate: Date;
}

export interface TaskParseResult {
	completed: number;
	total: number;
	taskDetails: TaskDetail[];
}

export interface DateInfo {
	dateStr: string;
	date: Date;
}

// ============================================================
// DATE UTILITIES
// ============================================================

/**
 * Parse date information from a filename
 * @param filename The filename to parse (e.g., "03-Oct-2025.md")
 * @returns DateInfo object or null if parsing fails
 */
export function parseDateFromFilename(filename: string): DateInfo | null {
	const match = filename.match(DATE_REGEX);
	if (!match) return null;

	const [_, day, month, year] = match;
	const monthNum = MONTH_MAP[month];
	
	if (monthNum === undefined) return null;

	const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${day}`;
	const date = new Date(parseInt(year), monthNum, parseInt(day));

	return { dateStr, date };
}

/**
 * Format a date for display
 * @param date The date to format
 * @param format The format options
 * @returns Formatted date string
 */
export function formatDate(date: Date, format: Intl.DateTimeFormatOptions): string {
	return date.toLocaleDateString('en-US', format);
}

/**
 * Get day of week (Monday = 0, Sunday = 6)
 * @param date The date
 * @returns Day of week number
 */
export function getDayOfWeek(date: Date): number {
	return (date.getDay() + 6) % 7;
}

// ============================================================
// TASK PARSING UTILITIES
// ============================================================

/**
 * Parse tasks from markdown content
 * @param content The markdown content
 * @returns TaskParseResult with task statistics and details
 */
export function parseTasksWithDetails(content: string): TaskParseResult {
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

/**
 * Get status icon based on completion percentage
 * @param completionPercentage The completion percentage (0-100)
 * @returns Status icon emoji
 */
export function getStatusIcon(completionPercentage: number): string {
	if (completionPercentage === 100) return '✅';
	if (completionPercentage > 0) return '🔄';
	return '⏳';
}

// ============================================================
// DOM UTILITIES
// ============================================================

/**
 * Apply multiple CSS styles to an element
 * @param element The HTML element
 * @param styles Object with CSS property-value pairs
 */
export function applyStyles(element: HTMLElement, styles: Record<string, string>): void {
	Object.entries(styles).forEach(([property, value]) => {
		(element.style as any)[property] = value;
	});
}

/**
 * Create a DOM element with styles
 * @param parent Parent element
 * @param tagName Tag name for the new element
 * @param styles CSS styles to apply
 * @param textContent Optional text content
 * @returns The created element
 */
export function createElement(
	parent: HTMLElement,
	tagName: string,
	styles?: Record<string, string>,
	textContent?: string
): HTMLElement {
	const element = parent.createEl(tagName as keyof HTMLElementTagNameMap);
	
	if (styles) {
		applyStyles(element, styles);
	}
	
	if (textContent) {
		element.textContent = textContent;
	}
	
	return element;
}

/**
 * Remove all elements matching a selector
 * @param selector CSS selector
 */
export function removeAllElements(selector: string): void {
	const elements = document.querySelectorAll(selector);
	elements.forEach(element => element.remove());
}

// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Check if a file path is within the notes folder
 * @param filePath The file path to check
 * @param notesFolder The notes folder path
 * @returns True if file is in notes folder
 */
export function isInNotesFolder(filePath: string, notesFolder: string): boolean {
	if (!notesFolder) return true; // If no specific folder set, include all files
	return filePath.startsWith(notesFolder);
}

/**
 * Validate that a date is valid
 * @param date The date to validate
 * @returns True if date is valid
 */
export function isValidDate(date: Date): boolean {
	return date instanceof Date && !isNaN(date.getTime());
}

// ============================================================
// LOGGING UTILITIES
// ============================================================

/**
 * Create a logger with a specific prefix
 * @param prefix The prefix for log messages
 * @returns Logger object with different log levels
 */
export function createLogger(prefix: string) {
	return {
		info: (message: string, ...args: any[]) => {
			console.log(`ℹ️ ${prefix}: ${message}`, ...args);
		},
		success: (message: string, ...args: any[]) => {
			console.log(`✅ ${prefix}: ${message}`, ...args);
		},
		warning: (message: string, ...args: any[]) => {
			console.warn(`⚠️ ${prefix}: ${message}`, ...args);
		},
		error: (message: string, ...args: any[]) => {
			console.error(`❌ ${prefix}: ${message}`, ...args);
		},
		debug: (message: string, data?: any) => {
			if (data) {
				console.log(`🔍 ${prefix}: ${message}`, data);
			} else {
				console.log(`🔍 ${prefix}: ${message}`);
			}
		}
	};
}

// ============================================================
// COLOR UTILITIES
// ============================================================

/**
 * Calculate color intensity based on task completion
 * @param completedTasks Number of completed tasks
 * @param totalTasks Total number of tasks
 * @param hasNote Whether a note exists for this day
 * @returns Color intensity level (0-4)
 */
export function calculateColorIntensity(
	completedTasks: number,
	totalTasks: number,
	hasNote: boolean
): number {
	if (!hasNote) return 0; // Empty color
	if (totalTasks === 0) return 1; // Light color for notes without tasks
	if (completedTasks === 0) return 1; // Same as notes without tasks
	if (completedTasks === 1) return 2;
	if (completedTasks <= 3) return 3;
	return 4; // 4+ completed tasks
}

// ============================================================
// ANIMATION UTILITIES
// ============================================================

/**
 * Add fade-in animation styles to the document if not already present
 */
export function ensureFadeInAnimation(): void {
	if (document.head.querySelector('[data-heatmap-animations]')) return;

	const styleEl = document.createElement('style');
	styleEl.textContent = `
		@keyframes fadeIn {
			from { opacity: 0; transform: translateY(-5px); }
			to { opacity: 1; transform: translateY(0); }
		}
		
		@keyframes fadeOut {
			from { opacity: 1; transform: translateY(0); }
			to { opacity: 0; transform: translateY(-5px); }
		}
		
		.heatmap-fade-in {
			animation: fadeIn 0.2s ease-out;
		}
		
		.heatmap-fade-out {
			animation: fadeOut 0.15s ease-in;
		}
	`;
	styleEl.setAttribute('data-heatmap-animations', 'true');
	document.head.appendChild(styleEl);
}