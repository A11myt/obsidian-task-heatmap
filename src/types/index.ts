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
