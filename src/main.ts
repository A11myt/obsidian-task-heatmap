import { Plugin, WorkspaceLeaf, Notice } from 'obsidian';
import { HeatmapSettings, DEFAULT_SETTINGS } from './settings/settings';
import { HeatmapSettingTab } from './settings/settingsTab';
import { TaskHeatmapView, VIEW_TYPE_TASK_HEATMAP } from './views/taskHeatmapView';
import { TaskHeatmapRenderer } from './renderer/taskHeatmapRenderer';
import { parseCodeBlockOptions } from './utils/codeBlockParser';

export default class HeatmapCalendarPlugin extends Plugin {
	settings: HeatmapSettings;
	private fileWatcher: number | null = null;
	private lastModified: Map<string, number> = new Map();
	private activeRenderers: Set<TaskHeatmapRenderer> = new Set();
	private lastTaskContent: Map<string, string> = new Map();
	private refreshTimeout: number | null = null;

	async onload() {
		await this.loadSettings();

		// Register only the task heatmap view
		this.registerView(
			VIEW_TYPE_TASK_HEATMAP,
			(leaf) => new TaskHeatmapView(leaf, this)
		);

		// Add ribbon icon to open task heatmap
		this.addRibbonIcon('checkmark', 'Open Task Heatmap', () => {
			this.activateView();
		});

		// Add command to open task heatmap
		this.addCommand({
			id: 'open-task-heatmap',
			name: 'Open Task Heatmap',
			callback: () => {
				this.activateView();
			}
		});

		// Add command to refresh task heatmap
		this.addCommand({
			id: 'refresh-task-heatmap',
			name: 'Refresh Task Heatmap',
			callback: () => {
				this.refreshView();
			}
		});

		// Add settings tab
		this.addSettingTab(new HeatmapSettingTab(this.app, this));

		// Register markdown code block processor for task heatmap
		this.registerMarkdownCodeBlockProcessor('heatmap', async (source, el, ctx) => {
			await this.renderHeatmapBlock(el, source);
		});

		// Start file monitoring if auto-refresh is enabled
		if (this.settings.autoRefresh) {
			this.startFileMonitoring();
		}

		// Listen for file modifications with intelligent task detection
		this.registerEvent(
			this.app.vault.on('modify', async (file) => {
				if (this.settings.autoRefresh && this.shouldMonitorFile(file.path)) {
					await this.handleFileChange(file);
				}
			})
		);

		// Listen for editor changes to detect Enter key presses
		this.registerEvent(
			this.app.workspace.on('editor-change', (editor, info) => {
				if (this.settings.autoRefresh) {
					this.handleEditorChange(editor, info);
				}
			})
		);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_TASK_HEATMAP);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_TASK_HEATMAP, active: true });
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async refreshView() {
		this.clearAllCaches();
		
		// Refresh the active heatmap view
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_HEATMAP);
		for (const leaf of leaves) {
			const view = leaf.view as TaskHeatmapView;
			if (view && view.refresh) {
				await view.refresh();
			}
		}
	}

	async renderHeatmapBlock(container: HTMLElement, source: string) {
		// Parse options from code block
		const parsedOptions = parseCodeBlockOptions(source);
		const options: HeatmapSettings = { ...this.settings, ...parsedOptions };

		// Always render task heatmap
		const renderer = new TaskHeatmapRenderer(this, options);
		await renderer.render(container);
	}

	onunload() {
		// Stop file monitoring
		this.stopFileMonitoring();
		// Clear any pending refresh
		if (this.refreshTimeout) {
			window.clearTimeout(this.refreshTimeout);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		
		// Restart file monitoring if settings changed
		this.stopFileMonitoring();
		if (this.settings.autoRefresh) {
			this.startFileMonitoring();
		}
	}

	/**
	 * Start monitoring file changes for auto-refresh
	 */
	private startFileMonitoring() {
		if (this.fileWatcher) {
			return; // Already running
		}

		console.log(`🔍 Starting file monitoring (interval: ${this.settings.refreshInterval}s)`);
		
		this.fileWatcher = window.setInterval(async () => {
			await this.checkForFileChanges();
		}, this.settings.refreshInterval * 1000);
	}

	/**
	 * Stop file monitoring
	 */
	private stopFileMonitoring() {
		if (this.fileWatcher) {
			console.log('⏹️ Stopping file monitoring');
			window.clearInterval(this.fileWatcher);
			this.fileWatcher = null;
		}
	}

	/**
	 * Check for changes in daily note files (periodic fallback check)
	 */
	private async checkForFileChanges() {
		try {
			const files = this.app.vault.getMarkdownFiles();
			let hasTaskChanges = false;

			// Check files that match our daily note pattern or are in notes folder
			for (const file of files) {
				// Simple check: any file in the notes folder or matching date pattern
				const shouldMonitor = this.shouldMonitorFile(file.path);
				
				if (shouldMonitor) {
					const lastMod = file.stat.mtime;
					const previousMod = this.lastModified.get(file.path);
					
					if (previousMod === undefined) {
						// First time seeing this file - check for tasks
						this.lastModified.set(file.path, lastMod);
						try {
							const content = await this.app.vault.read(file);
							const taskContent = this.extractTaskContent(content);
							if (taskContent) {
								this.lastTaskContent.set(file.path, content);
								hasTaskChanges = true;
							}
						} catch (error) {
							// Ignore read errors for periodic check
						}
					} else if (lastMod > previousMod) {
						// File was modified - check if tasks changed
						this.lastModified.set(file.path, lastMod);
						try {
							const content = await this.app.vault.read(file);
							const previousContent = this.lastTaskContent.get(file.path);
							const currentTasks = this.extractTaskContent(content);
							const previousTasks = previousContent ? this.extractTaskContent(previousContent) : '';
							
							if (currentTasks !== previousTasks) {
								console.log(`📝 Periodic check detected task changes in: ${file.path}`);
								this.lastTaskContent.set(file.path, content);
								hasTaskChanges = true;
							}
						} catch (error) {
							// Ignore read errors for periodic check
						}
					}
				}
			}

			if (hasTaskChanges) {
				console.log('🔄 Periodic refresh due to task changes');
				await this.refreshView();
				// Optional: Show notification (can be disabled in settings)
				if (this.settings.autoRefresh && this.settings.showRefreshNotification) {
					new Notice('🔄 Heatmap updated', 1500);
				}
			}

		} catch (error) {
			console.error('❌ Error checking file changes:', error);
		}
	}

	/**
	 * Determine if a file should be monitored for changes
	 */
	private shouldMonitorFile(filePath: string): boolean {
		// Check if file is in the configured notes folder
		const notesFolder = this.settings.notesFolder.toLowerCase();
		if (notesFolder && filePath.toLowerCase().startsWith(notesFolder.toLowerCase())) {
			return true;
		}

		// Check if file matches common daily note patterns
		const datePatterns = [
			/\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
			/\d{2}-\d{2}-\d{4}/, // DD-MM-YYYY
			/\d{4}_\d{2}_\d{2}/, // YYYY_MM_DD
		];

		return datePatterns.some(pattern => pattern.test(filePath));
	}

	/**
	 * Handle file changes with intelligent task detection
	 */
	private async handleFileChange(file: any) {
		try {
			// Read current content
			const content = await this.app.vault.read(file);
			const previousContent = this.lastTaskContent.get(file.path);
			
			if (this.settings.smartRefresh) {
				// Extract only task-related content for comparison
				const currentTasks = this.extractTaskContent(content);
				const previousTasks = previousContent ? this.extractTaskContent(previousContent) : '';
				
				// Only refresh if task content actually changed
				if (currentTasks !== previousTasks) {
					console.log(`📝 Smart refresh: Task changes detected in: ${file.path}`);
					this.lastTaskContent.set(file.path, content);
					this.scheduleRefresh();
				} else {
					// Update stored content but don't refresh
					this.lastTaskContent.set(file.path, content);
				}
			} else {
				// Legacy behavior: refresh on any file change
				console.log(`📝 File changed: ${file.path}`);
				this.lastTaskContent.set(file.path, content);
				this.scheduleRefresh(100); // Immediate refresh for legacy mode
			}
			
		} catch (error) {
			console.error('❌ Error handling file change:', error);
		}
	}

	/**
	 * Handle editor changes to detect Enter key and task completion
	 */
	private handleEditorChange(editor: any, info: any) {
		// Only use smart refresh if enabled
		if (!this.settings.smartRefresh) {
			return;
		}

		// Check if this is a file we should monitor
		const file = info.file;
		if (!file || !this.shouldMonitorFile(file.path)) {
			return;
		}

		// Get current cursor position and line
		const cursor = editor.getCursor();
		const currentLine = editor.getLine(cursor.line);
		const previousLine = cursor.line > 0 ? editor.getLine(cursor.line - 1) : '';
		
		// Check if current or previous line contains a task marker
		const isCurrentTaskLine = /^\s*[-*+]\s*\[[x ]\]/.test(currentLine);
		const isPreviousTaskLine = /^\s*[-*+]\s*\[[x ]\]/.test(previousLine);
		
		// Detect if user just completed a task (checkbox change)
		const hasTaskChange = isCurrentTaskLine || isPreviousTaskLine;
		
		// Detect if user pressed Enter after a task line (new line creation)
		const likelyEnterAfterTask = currentLine.trim() === '' && isPreviousTaskLine;
		
		if (hasTaskChange || likelyEnterAfterTask) {
			console.log('🔍 Smart refresh: Task interaction detected, scheduling refresh');
			this.scheduleRefresh(300); // Moderate delay for editor changes
		}
	}

	/**
	 * Extract task-related content from file content
	 */
	private extractTaskContent(content: string): string {
		const lines = content.split('\n');
		const taskLines = lines.filter(line => /^\s*[-*+]\s*\[[x ]\]/.test(line));
		return taskLines.join('\n');
	}

	/**
	 * Schedule a refresh with debouncing to prevent flickering
	 */
	private scheduleRefresh(delay: number = 300) {
		// Clear existing timeout
		if (this.refreshTimeout) {
			window.clearTimeout(this.refreshTimeout);
		}

		// Schedule new refresh
		this.refreshTimeout = window.setTimeout(async () => {
			console.log('🔄 Executing scheduled refresh');
			await this.refreshView();
			this.refreshTimeout = null;
		}, delay);
	}

	/**
	 * Register a renderer for cache invalidation
	 */
	public registerRenderer(renderer: TaskHeatmapRenderer) {
		this.activeRenderers.add(renderer);
	}

	/**
	 * Unregister a renderer
	 */
	public unregisterRenderer(renderer: TaskHeatmapRenderer) {
		this.activeRenderers.delete(renderer);
	}

	/**
	 * Clear all renderer caches
	 */
	private clearAllCaches() {
		console.log(`🗑️ Clearing ${this.activeRenderers.size} renderer caches`);
		this.activeRenderers.forEach(renderer => renderer.clearCache());
	}


}
