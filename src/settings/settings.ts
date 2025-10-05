// Settings Interface and Defaults

export interface HeatmapSettings {
	notesFolder: string;
	title: string;
	taskTitle: string;
	enableYearSelector: boolean;
	selectedYear: number;
	showAllYears: boolean;
	showYears: boolean;
	showWeekdays: boolean;
	colorScheme: 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'custom';
	customColors: string[];
	emptyColor: string;
	cellSize: number;
	showLegend: boolean;
	showTotal: boolean;
	dateFormat: string;
	// Dynamic naming and templating
	dailyNoteFormat: string;
	templateFile: string;
	useTemplate: boolean;
	// Auto-refresh settings
	autoRefresh: boolean;
	refreshInterval: number; // in seconds
	showRefreshNotification: boolean;
	smartRefresh: boolean; // Only refresh on actual task changes
}

export const COLOR_SCHEMES = {
	green: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
	blue: ['#ebedf0', '#9ecbff', '#0969da', '#0550ae', '#033d8b'],
	purple: ['#ebedf0', '#dbb7ff', '#8250df', '#6639ba', '#4c2889'],
	red: ['#ebedf0', '#ffb3ba', '#ff6b6b', '#ee5a52', '#da3633'],
	orange: ['#ebedf0', '#ffd9a8', '#ff9a56', '#e8590c', '#bc4c00']
};

export const DEFAULT_SETTINGS: HeatmapSettings = {
	notesFolder: 'Notes',
	title: 'Daily Notes Heatmap',
	taskTitle: 'Tasks - Don\'t break the chain!',
	enableYearSelector: false,
	selectedYear: new Date().getFullYear(),
	showAllYears: true,
	showYears: true,
	showWeekdays: true,
	colorScheme: 'green',
	customColors: COLOR_SCHEMES.green,
	emptyColor: '#ebedf0',
	cellSize: 11,
	showLegend: true,
	showTotal: true,
	dateFormat: 'de-DE',
	// Dynamic naming and templating defaults
	dailyNoteFormat: 'Notes/YYYY/MM/YYYY-MM-DD-dddd',
	templateFile: 'Templates/Daily.md',
	useTemplate: true,
	// Auto-refresh defaults
	autoRefresh: true,
	refreshInterval: 3, // seconds
	showRefreshNotification: false,
	smartRefresh: true // Only refresh on actual task changes
};
