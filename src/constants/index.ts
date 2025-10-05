/**
 * Constants used throughout the heatmap plugin
 */

// ============================================================
// LAYOUT CONSTANTS
// ============================================================

export const CELLS_PER_ROW = 30;
export const CELL_GAP = 2;
export const DEFAULT_CELL_SIZE = 12;

// ============================================================
// LABEL CONSTANTS
// ============================================================

export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export const MONTH_NAMES = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// ============================================================
// CSS CLASS NAMES
// ============================================================

export const CSS_CLASSES = {
	HEATMAP_VIEW: 'heatmap-calendar-view',
	HEATMAP_CONTAINER: 'heatmap-container',
	CELL_CLICKABLE: 'heatmap-cell-clickable',
	STATISTICS_PANEL: 'task-statistics-panel',
	FADE_IN: 'heatmap-fade-in',
	FADE_OUT: 'heatmap-fade-out',
	OPEN_DAY_BUTTON: 'open-day-button'
} as const;

// ============================================================
// PANEL DIMENSIONS
// ============================================================

export const PANEL_CONFIG = {
	MIN_WIDTH: '250px',
	MAX_WIDTH: '400px',
	MAX_HEIGHT: '200px',
	PADDING: '12px',
	BORDER_RADIUS: '8px'
} as const;

// ============================================================
// TIMING CONSTANTS
// ============================================================

export const TIMING = {
	ANIMATION_DURATION: 200,
	CLICK_OUTSIDE_DELAY: 100,
	FADE_OUT_DURATION: 150
} as const;
