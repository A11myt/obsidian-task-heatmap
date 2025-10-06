/**
 * Type definitions for Task Heatmap Plugin
 */

// ============================================================
// TASK TYPES
// ============================================================

export interface TaskDetail {
	text: string;
	completed: boolean;
	line: number;
	tags: string[];    // Simple hashtags extracted from text
}

export interface TaskParseResult {
	completed: number;
	total: number;
	taskDetails: TaskDetail[];
}

// ============================================================
// DATE TYPES
// ============================================================

export interface DateInfo {
	dateStr: string;
	date: Date;
}

export interface DateRange {
	startDate: Date;
	endDate: Date;
}

export interface TaskDayData {
	date: Date;
	dateStr: string;
	completedTasks: number;
	totalTasks: number;
	dayOfWeek: number;
	hasNote: boolean;
	taskDetails: TaskDetail[];
	allTags: string[];       // All hashtags from the entire file content
}

export interface SpecialTag {
	name: string;        // Tag name without # (e.g., "urlaub")
	color: string;       // Hex color code (e.g., "#ff6b6b")
	enabled: boolean;    // Whether this tag is active
}

// ============================================================
// RENDERING TYPES
// ============================================================

export interface CellPosition {
	row: number;
	column: number;
}

export interface PanelOptions {
	minWidth?: string;
	maxWidth?: string;
	maxHeight?: string;
}

// ============================================================
// STYLE TYPES
// ============================================================

export type StyleMap = Record<string, string>;

export interface ColorIntensity {
	level: number;
	color: string;
}
