import { App, PluginSettingTab, Setting } from 'obsidian';
import HeatmapCalendarPlugin from '../main';
import { COLOR_SCHEMES } from './settings';

export class HeatmapSettingTab extends PluginSettingTab {
	plugin: HeatmapCalendarPlugin;

	constructor(app: App, plugin: HeatmapCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Task Heatmap Settings' });
		
		// Info section
		const infoDiv = containerEl.createDiv();
		infoDiv.style.marginBottom = '20px';
		infoDiv.style.padding = '10px';
		infoDiv.style.backgroundColor = 'var(--background-secondary)';
		infoDiv.style.borderRadius = '5px';
		infoDiv.innerHTML = `
			<strong>📊 GitHub-Style Task Heatmap</strong><br>
			<small>Tracks completed tasks from your daily notes (format: DD-MMM-YYYY.md)</small>
		`;

		// Notes Folder
		new Setting(containerEl)
			.setName('Notes Folder')
			.setDesc('Folder containing your daily notes (e.g., "Notes" or "Daily")')
			.addText(text => text
				.setPlaceholder('Notes')
				.setValue(this.plugin.settings.notesFolder)
				.onChange(async (value) => {
					this.plugin.settings.notesFolder = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

		// Title
		new Setting(containerEl)
			.setName('Heatmap Title')
			.setDesc('Title displayed above the heatmap')
			.addText(text => text
				.setPlaceholder('Task Heatmap')
				.setValue(this.plugin.settings.taskTitle)
				.onChange(async (value) => {
					this.plugin.settings.taskTitle = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

		// Color Scheme
		new Setting(containerEl)
			.setName('Color Scheme')
			.setDesc('Choose a color scheme for the heatmap')
			.addDropdown(dropdown => dropdown
				.addOption('green', '🟢 Green (GitHub style)')
				.addOption('blue', '🔵 Blue')
				.addOption('purple', '🟣 Purple')
				.addOption('red', '🔴 Red')
				.addOption('orange', '🟠 Orange')
				.setValue(this.plugin.settings.colorScheme)
				.onChange(async (value: any) => {
					this.plugin.settings.colorScheme = value;
					this.plugin.settings.customColors = COLOR_SCHEMES[value as keyof typeof COLOR_SCHEMES];
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

		// Empty Color
		new Setting(containerEl)
			.setName('Empty Color')
			.setDesc('Color for days without notes (hex code, e.g., #ebedf0)')
			.addText(text => text
				.setPlaceholder('#ebedf0')
				.setValue(this.plugin.settings.emptyColor)
				.onChange(async (value) => {
					if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
						this.plugin.settings.emptyColor = value;
						await this.plugin.saveSettings();
						await this.plugin.refreshView();
					}
				}));

		// Cell Size
		new Setting(containerEl)
			.setName('Cell Size')
			.setDesc('Size of each heatmap cell in pixels (default: 11)')
			.addText(text => text
				.setPlaceholder('11')
				.setValue(String(this.plugin.settings.cellSize))
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
						this.plugin.settings.cellSize = numValue;
						await this.plugin.saveSettings();
						await this.plugin.refreshView();
					}
				}));

		// Show Legend
		new Setting(containerEl)
			.setName('Show Legend')
			.setDesc('Display the color intensity legend below the heatmap')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLegend)
				.onChange(async (value) => {
					this.plugin.settings.showLegend = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

		// Date Format
		new Setting(containerEl)
			.setName('Date Format')
			.setDesc('Locale for date display in task details (e.g., "en-US", "de-DE")')
			.addText(text => text
				.setPlaceholder('de-DE')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));
		
		// Info about year display
		containerEl.createEl('h3', { text: 'Display Information' });
		
		const yearInfoDiv = containerEl.createDiv();
		yearInfoDiv.style.padding = '10px';
		yearInfoDiv.style.backgroundColor = 'var(--background-secondary)';
		yearInfoDiv.style.borderRadius = '5px';
		yearInfoDiv.style.marginBottom = '10px';
		yearInfoDiv.innerHTML = `
			<strong>📅 Date Range:</strong> Always shows current year (Jan 1 - Dec 31)<br>
			<strong>🎨 Color Intensity:</strong> Darker = more completed tasks<br>
			<strong>🖱️ Interaction:</strong> Click any cell to view tasks below the heatmap
		`;
	}
}
