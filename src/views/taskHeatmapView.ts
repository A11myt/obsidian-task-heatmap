import { ItemView, WorkspaceLeaf } from 'obsidian';
import HeatmapCalendarPlugin from '../main';
import { TaskHeatmapRenderer } from '../renderer/taskHeatmapRenderer';

export const VIEW_TYPE_TASK_HEATMAP = 'task-heatmap-calendar-view';

export class TaskHeatmapView extends ItemView {
	plugin: HeatmapCalendarPlugin;
	private renderer: TaskHeatmapRenderer | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: HeatmapCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_TASK_HEATMAP;
	}

	getDisplayText(): string {
		return 'Task Heatmap';
	}

	getIcon(): string {
		return 'checkmark';
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		// Container wird im Renderer geleert und CSS-Klasse gesetzt
		await this.renderTaskHeatmap(container);
	}

	async onClose() {
		// Cleanup renderer
		if (this.renderer) {
			this.renderer.destroy();
			this.renderer = null;
		}
	}

	async refresh() {
		const container = this.containerEl.children[1] as HTMLElement;
		// Clear cache before refreshing to ensure fresh data
		if (this.renderer) {
			this.renderer.clearCache();
		}
		await this.renderTaskHeatmap(container);
	}

	async renderTaskHeatmap(container: HTMLElement) {
		// Reuse renderer instance but clear its cache for fresh data
		if (!this.renderer) {
			this.renderer = new TaskHeatmapRenderer(this.plugin, this.plugin.settings);
		} else {
			// Update settings in case they changed
			this.renderer.settings = this.plugin.settings;
			this.renderer.clearCache();
		}
		await this.renderer.render(container);
	}
}