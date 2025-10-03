import { ItemView, WorkspaceLeaf } from 'obsidian';
import HeatmapCalendarPlugin from '../main';
import { TaskHeatmapRenderer } from '../renderer/taskHeatmapRenderer';

export const VIEW_TYPE_TASK_HEATMAP = 'task-heatmap-calendar-view';

export class TaskHeatmapView extends ItemView {
	plugin: HeatmapCalendarPlugin;

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
		// Cleanup
	}

	async refresh() {
		const container = this.containerEl.children[1] as HTMLElement;
		// Container wird im Renderer geleert
		await this.renderTaskHeatmap(container);
	}

	async renderTaskHeatmap(container: HTMLElement) {
		const renderer = new TaskHeatmapRenderer(this.plugin, this.plugin.settings);
		await renderer.render(container);
	}
}