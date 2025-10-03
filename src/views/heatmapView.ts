import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import HeatmapCalendarPlugin from '../main';
import { HeatmapSettings, COLOR_SCHEMES } from '../settings/settings';
import { HeatmapRenderer } from '../renderer/heatmapRenderer';

export const VIEW_TYPE_HEATMAP = 'heatmap-calendar-view';

export class HeatmapView extends ItemView {
	plugin: HeatmapCalendarPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: HeatmapCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_HEATMAP;
	}

	getDisplayText(): string {
		return 'Heatmap Calendar';
	}

	getIcon(): string {
		return 'calendar-glyph';
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('heatmap-calendar-view');

		await this.renderHeatmap(container);
	}

	async onClose() {
		// Cleanup
	}

	async refresh() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		await this.renderHeatmap(container);
	}

	async renderHeatmap(container: HTMLElement) {
		const renderer = new HeatmapRenderer(this.plugin, this.plugin.settings);
		await renderer.render(container);
	}
}
