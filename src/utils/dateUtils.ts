/**
 * Date parsing and formatting utilities
 */

import { DateInfo, TaskParseResult, TaskDetail } from '../types';

// ============================================================
// CONSTANTS
// ============================================================

const DATE_REGEX = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
const TASK_REGEX = /^[\s]*[-*]\s+\[([_\sxX])\](.*)$/;

const MONTH_MAP: Record<string, number> = {
	Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
	Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

// ============================================================
// DATE PARSING
// ============================================================

/**
 * Parse date from filename (e.g., "03-Oct-2025.md")
 */
export function parseDateFromFilename(filename: string): DateInfo | null {
	const match = filename.match(DATE_REGEX);
	if (!match) return null;

	const [_, day, month, year] = match;
	const monthNum = MONTH_MAP[month];
	
	if (monthNum === undefined) return null;

	const dateStr = formatDateString(year, monthNum, day);
	const date = new Date(parseInt(year), monthNum, parseInt(day));

	return { dateStr, date };
}

/**
 * Format date string in YYYY-MM-DD format
 */
function formatDateString(year: string, monthNum: number, day: string): string {
	return `${year}-${String(monthNum + 1).padStart(2, '0')}-${day}`;
}

/**
 * Get day of week (Monday = 0, Sunday = 6)
 */
export function getDayOfWeek(date: Date): number {
	return (date.getDay() + 6) % 7;
}

/**
 * Format date for display
 */
export function formatDateForDisplay(
	date: Date,
	options: Intl.DateTimeFormatOptions
): string {
	return date.toLocaleDateString('en-US', options);
}

// ============================================================
// TASK PARSING
// ============================================================

/**
 * Parse tasks from markdown content
 */
export function parseTasksWithDetails(content: string): TaskParseResult {
	const lines = content.split('\n');
	const taskDetails = extractTaskDetails(lines);
	const completed = countCompletedTasks(taskDetails);

	return {
		completed,
		total: taskDetails.length,
		taskDetails
	};
}

/**
 * Extract task details from lines
 */
function extractTaskDetails(lines: string[]): TaskDetail[] {
	const tasks: TaskDetail[] = [];

	lines.forEach((line, index) => {
		const task = parseTaskLine(line, index + 1);
		if (task) {
			tasks.push(task);
		}
	});

	return tasks;
}

/**
 * Parse a single task line
 */
function parseTaskLine(line: string, lineNumber: number): TaskDetail | null {
	const match = line.match(TASK_REGEX);
	if (!match) return null;

	const isCompleted = match[1].toLowerCase() === 'x';
	const text = match[2].trim() || '(Empty task)';

	return {
		text,
		completed: isCompleted,
		line: lineNumber,
		tags: [] // This utility doesn't extract tags, that's done in the renderer
	};
}

/**
 * Count completed tasks
 */
function countCompletedTasks(tasks: TaskDetail[]): number {
	return tasks.filter(task => task.completed).length;
}

// ============================================================
// DATE VALIDATION
// ============================================================

/**
 * Check if date is valid
 */
export function isValidDate(date: Date): boolean {
	return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Check if date is in range
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
	return date >= startDate && date <= endDate;
}
