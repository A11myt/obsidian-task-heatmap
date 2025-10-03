/**
 * Color calculation utilities
 */

import { HeatmapSettings, COLOR_SCHEMES } from '../settings/settings';
import { TaskDayData } from '../types';

// ============================================================
// COLOR SCHEME UTILITIES
// ============================================================

/**
 * Get color scheme based on settings
 */
export function getColorScheme(settings: HeatmapSettings): string[] {
	return settings.colorScheme === 'custom'
		? settings.customColors
		: COLOR_SCHEMES[settings.colorScheme];
}

/**
 * Get color for a specific day based on task completion
 */
export function getColorForDay(day: TaskDayData, settings: HeatmapSettings): string {
	if (!day.hasNote) {
		return settings.emptyColor;
	}

	const colors = getColorScheme(settings);
	const intensity = calculateColorIntensity(day);

	return colors[intensity];
}

/**
 * Calculate color intensity level (0-4)
 */
function calculateColorIntensity(day: TaskDayData): number {
	// No tasks - light color
	if (day.totalTasks === 0) {
		return 1;
	}

	const completed = day.completedTasks;

	// Map completed tasks to color intensity
	if (completed === 0) return 1;
	if (completed === 1) return 2;
	if (completed <= 3) return 3;
	return 4; // 4+ tasks
}

// ============================================================
// STATUS UTILITIES
// ============================================================

/**
 * Get status icon based on completion percentage
 */
export function getStatusIcon(completionPercentage: number): string {
	if (completionPercentage === 100) return '✅';
	if (completionPercentage > 0) return '🔄';
	return '⏳';
}

/**
 * Get status message for a day
 */
export function getStatusMessage(day: TaskDayData): string {
	if (day.totalTasks === 0) {
		return day.hasNote 
			? 'Note exists but no tasks found'
			: 'No note for this date';
	}

	const percentage = Math.round((day.completedTasks / day.totalTasks) * 100);
	return `${day.completedTasks}/${day.totalTasks} tasks completed (${percentage}%)`;
}
