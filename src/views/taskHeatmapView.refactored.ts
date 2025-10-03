import { ItemView, WorkspaceLeaf } from 'obsidian';
import HeatmapCalendarPlugin from '../main';
import { TaskHeatmapRenderer } from '../renderer/taskHeatmapRenderer.refactored';

export const VIEW_TYPE_TASK_HEATMAP = 'task-heatmap-calendar-view';

/**
 * Task Heatmap View - Displays a GitHub-style heatmap for task completion tracking
 * 
 * Features:
 * - Interactive heatmap cells showing task completion data
 * - Statistics panels with detailed task information
 * - Color-coded visualization based on completed tasks
 * - Click to view task details without opening files
 */
export class TaskHeatmapView extends ItemView {
	plugin: HeatmapCalendarPlugin;
	private renderer: TaskHeatmapRenderer | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: HeatmapCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	// ============================================================
	// VIEW LIFECYCLE
	// ============================================================

	getViewType(): string {
		return VIEW_TYPE_TASK_HEATMAP;
	}

	getDisplayText(): string {
		return 'Task Heatmap Calendar';
	}

	getIcon(): string {
		return 'checkmark';
	}

	async onOpen(): Promise<void> {
		console.log('🚀 Opening Task Heatmap View');
		
		try {
			const container = this.getViewContainer();
			await this.renderTaskHeatmap(container);
		} catch (error) {
			console.error('❌ Error opening Task Heatmap View:', error);
			this.showErrorMessage();
		}
	}

	async onClose(): Promise<void> {
		console.log('🔚 Closing Task Heatmap View');
		this.cleanup();
	}

	// ============================================================
	// RENDERING
	// ============================================================

	async refresh(): Promise<void> {
		console.log('🔄 Refreshing Task Heatmap View');
		
		try {
			const container = this.getViewContainer();
			await this.renderTaskHeatmap(container);
		} catch (error) {
			console.error('❌ Error refreshing Task Heatmap View:', error);
			this.showErrorMessage();
		}
	}

	private async renderTaskHeatmap(container: HTMLElement): Promise<void> {
		// Clean up previous renderer
		this.cleanup();
		
		// Create new renderer with current settings
		this.renderer = new TaskHeatmapRenderer(this.plugin, this.plugin.settings);
		
		// Render the heatmap
		await this.renderer.render(container);
		
		console.log('✅ Task Heatmap rendered successfully');
	}

	// ============================================================
	// UTILITY METHODS
	// ============================================================

	private getViewContainer(): HTMLElement {
		const container = this.containerEl.children[1] as HTMLElement;
		
		if (!container) {
			throw new Error('View container not found');
		}
		
		return container;
	}

	private cleanup(): void {
		// Remove any existing statistics panels
		const existingPanels = document.querySelectorAll('.task-statistics-panel');
		existingPanels.forEach(panel => panel.remove());
		
		// Clear renderer reference
		this.renderer = null;
	}

	private showErrorMessage(): void {
		const container = this.getViewContainer();
		container.empty();
		
		const errorDiv = container.createEl('div');
		errorDiv.style.padding = '20px';
		errorDiv.style.textAlign = 'center';
		errorDiv.style.color = 'var(--text-error)';
		
		errorDiv.createEl('h3', { text: 'Error Loading Task Heatmap' });
		errorDiv.createEl('p', { 
			text: 'There was an error loading the task heatmap. Please check the console for more details.' 
		});
		
		const retryButton = errorDiv.createEl('button', { text: 'Retry' });
		retryButton.style.marginTop = '10px';
		retryButton.addEventListener('click', () => this.refresh());
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	/**
	 * Get the current renderer instance
	 */
	getRenderer(): TaskHeatmapRenderer | null {
		return this.renderer;
	}

	/**
	 * Check if the view is currently rendered
	 */
	isRendered(): boolean {
		return this.renderer !== null;
	}
}