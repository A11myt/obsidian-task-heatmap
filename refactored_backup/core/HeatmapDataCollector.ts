import { TFile } from 'obsidian';
import HeatmapCalendarPlugin from '../../main';
import { TaskDayData, TaskParseResult, DateInfo } from '../types';
import { parseDateFromFilename, parseTasksWithDetails } from '../utils/dateUtils';
import { createLogger } from '../utils/loggerUtils';

const logger = createLogger('DataCollector');

/**
 * Collects and processes task data from vault files
 */
export class HeatmapDataCollector {
	private plugin: HeatmapCalendarPlugin;
	private notesFolder: string;

	constructor(plugin: HeatmapCalendarPlugin, notesFolder: string) {
		this.plugin = plugin;
		this.notesFolder = notesFolder;
	}

	/**
	 * Collect all task data from notes
	 */
	async collectTaskData(): Promise<Map<string, TaskDayData>> {
		logger.info('Starting task data collection');
		
		const taskData = new Map<string, TaskDayData>();
		const files = this.getRelevantFiles();

		logger.debug(`Found ${files.length} files to process`);

		for (const file of files) {
			await this.processFile(file, taskData);
		}

		logger.success(`Collected data for ${taskData.size} days`);
		return taskData;
	}

	/**
	 * Get files from the notes folder
	 */
	private getRelevantFiles(): TFile[] {
		const allFiles = this.plugin.app.vault.getMarkdownFiles();
		
		if (!this.notesFolder) {
			return allFiles;
		}

		return allFiles.filter(file => 
			file.path.startsWith(this.notesFolder)
		);
	}

	/**
	 * Process a single file and add its data to the map
	 */
	private async processFile(file: TFile, taskData: Map<string, TaskDayData>): Promise<void> {
		const dateInfo = parseDateFromFilename(file.basename);
		
		if (!dateInfo) {
			return; // Not a date-formatted file
		}

		try {
			const content = await this.plugin.app.vault.read(file);
			const taskResult = parseTasksWithDetails(content);
			const dayData = this.createTaskDayData(dateInfo, taskResult);
			
			taskData.set(dateInfo.dateStr, dayData);
		} catch (error) {
			logger.error(`Failed to process file ${file.path}`, error);
		}
	}

	/**
	 * Create TaskDayData from date info and task results
	 */
	private createTaskDayData(dateInfo: DateInfo, taskResult: TaskParseResult): TaskDayData {
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
}
