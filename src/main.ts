import { Plugin, WorkspaceLeaf } from 'obsidian';
import { HeatmapSettings, DEFAULT_SETTINGS } from './settings/settings';
import { HeatmapSettingTab } from './settings/settingsTab';
import { TaskHeatmapView, VIEW_TYPE_TASK_HEATMAP } from './views/taskHeatmapView';
import { TaskHeatmapRenderer } from './renderer/taskHeatmapRenderer';
import { parseCodeBlockOptions } from './utils/codeBlockParser';

export default class HeatmapCalendarPlugin extends Plugin {
	settings: HeatmapSettings;

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
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TASK_HEATMAP);
		for (const leaf of leaves) {
			if (leaf.view instanceof TaskHeatmapView) {
				await leaf.view.refresh();
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
		// Cleanup
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
