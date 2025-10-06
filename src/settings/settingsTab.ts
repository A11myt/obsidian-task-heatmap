import { App, PluginSettingTab, Setting } from 'obsidian';
import HeatmapCalendarPlugin from '../main';
import { COLOR_SCHEMES } from './settings';
import { previewPattern, sanitizePathPattern } from '../utils/dynamicNamingUtils';

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

		// Show Tag Overview
		new Setting(containerEl)
			.setName('Show Tag Overview')
			.setDesc('Display a tag overview below the heatmap showing all hashtags from tasks')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTagOverview)
				.onChange(async (value) => {
					this.plugin.settings.showTagOverview = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

		// Tag Overview Title
		new Setting(containerEl)
			.setName('Tag Overview Title')
			.setDesc('Title displayed above the tag overview')
			.addText(text => text
				.setPlaceholder('Tag Übersicht')
				.setValue(this.plugin.settings.tagOverviewTitle)
				.onChange(async (value) => {
					this.plugin.settings.tagOverviewTitle = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

		// Date Format
		new Setting(containerEl)
			.setName('Date Format')
			.setDesc('Locale for date display and dynamic naming (e.g., "en-US", "de-DE", "fr-FR")')
			.addText(text => text
				.setPlaceholder('de-DE')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
					this.updatePreview(); // Update preview when locale changes
				}));


		
		// Dynamic Note Naming Section
		containerEl.createEl('h3', { text: 'Daily Note Configuration' });

		// Daily Note Format
		new Setting(containerEl)
			.setName('Daily Note Format')
			.setDesc('Dynamic path and filename pattern. Use YYYY (year), MM (month), DD (day), dddd (weekday). Example: Notes/YYYY/MM/YYYY-MM-DD-dddd')
			.addText(text => text
				.setPlaceholder('Notes/YYYY/MM/YYYY-MM-DD-dddd')
				.setValue(this.plugin.settings.dailyNoteFormat)
				.onChange(async (value) => {
					this.plugin.settings.dailyNoteFormat = value;
					await this.plugin.saveSettings();
					this.updatePreview();
				}));

		// Preview of current format
		const previewDiv = containerEl.createDiv();
		previewDiv.id = 'daily-note-preview';
		setTimeout(() => this.updatePreview(previewDiv), 0);

		// Use Template Toggle
		new Setting(containerEl)
			.setName('Use Template')
			.setDesc('Create new daily notes from a template file')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useTemplate)
				.onChange(async (value) => {
					this.plugin.settings.useTemplate = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide template file setting
				}));

		// Template File (only show if useTemplate is enabled)
		if (this.plugin.settings.useTemplate) {
			new Setting(containerEl)
				.setName('Template File')
				.setDesc('Path to template file for new daily notes (e.g., Templates/Daily.md)')
				.addText(text => text
					.setPlaceholder('Templates/Daily.md')
					.setValue(this.plugin.settings.templateFile)
					.onChange(async (value) => {
						this.plugin.settings.templateFile = value;
						await this.plugin.saveSettings();
					}));
		
			// Template Preview
			const templateInfoDiv = containerEl.createDiv();
			templateInfoDiv.style.padding = '10px';
			templateInfoDiv.style.backgroundColor = 'var(--background-secondary)';
			templateInfoDiv.style.borderRadius = '5px';
			templateInfoDiv.style.marginBottom = '15px';
			templateInfoDiv.style.fontSize = '12px';
			const locale = this.plugin.settings.dateFormat || 'de-DE';
			const exampleDate = new Date().toLocaleDateString(locale, {
				weekday: 'long',
				year: 'numeric', 
				month: 'long',
				day: 'numeric'
			});
			
			templateInfoDiv.innerHTML = `
				<strong>📝 Template Variables:</strong><br>
				<code>{{date}}</code> - Full formatted date (e.g., "${exampleDate}")<br>
				<code>{{title}}</code> - Same as date (for compatibility)<br>
				<code>{{time}}</code> - Current time (e.g., "14:30")<br>
				<code>{{YYYY}}</code>, <code>{{MM}}</code>, <code>{{DD}}</code>, <code>{{dddd}}</code> - All date tokens available<br>
				<strong>Current locale:</strong> ${locale}<br>
				Example template content:<br>
				<code># {{date}}<br><br>## Tasks<br>- [ ] <br><br>## Notes<br></code>
			`;
		}

		// Auto-Refresh Section
		containerEl.createEl('h3', { text: 'Auto-Refresh Settings' });

		// Auto-refresh toggle
		new Setting(containerEl)
			.setName('Auto-Refresh Heatmap')
			.setDesc('Automatically update the heatmap when daily notes are modified')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoRefresh)
				.onChange(async (value) => {
					this.plugin.settings.autoRefresh = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh to show/hide related settings
				}));

		// Smart refresh toggle (only show if auto-refresh is enabled)
		if (this.plugin.settings.autoRefresh) {
			new Setting(containerEl)
				.setName('Smart Refresh')
				.setDesc('Only refresh when actual task changes are detected (prevents flickering)')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.smartRefresh)
					.onChange(async (value) => {
						this.plugin.settings.smartRefresh = value;
						await this.plugin.saveSettings();
					}));
		}

		// Refresh interval (only show if auto-refresh is enabled)
		if (this.plugin.settings.autoRefresh) {
			new Setting(containerEl)
				.setName('Refresh Interval')
				.setDesc('How often to check for changes (in seconds). Lower values = more responsive but higher CPU usage')
				.addSlider(slider => slider
					.setLimits(1, 30, 1)
					.setValue(this.plugin.settings.refreshInterval)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.refreshInterval = value;
						await this.plugin.saveSettings();
						// Restart monitoring with new interval
						if (this.plugin.refreshView) {
							await this.plugin.refreshView();
						}
					}));

			// Show notifications toggle
			new Setting(containerEl)
				.setName('Show Update Notifications')
				.setDesc('Display a notification when the heatmap is automatically updated')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.showRefreshNotification)
					.onChange(async (value) => {
						this.plugin.settings.showRefreshNotification = value;
						await this.plugin.saveSettings();
					}));
		}

		// Special Tags Section
		containerEl.createEl('h3', { text: 'Spezielle Tags' });
		
		const specialTagsInfo = containerEl.createDiv();
		specialTagsInfo.style.marginBottom = '15px';
		specialTagsInfo.style.padding = '10px';
		specialTagsInfo.style.backgroundColor = 'var(--background-secondary)';
		specialTagsInfo.style.borderRadius = '5px';
		specialTagsInfo.innerHTML = `
			<strong>🏷️ Spezielle Tags mit benutzerdefinierten Farben</strong><br>
			<small>Definieren Sie Tags wie #urlaub mit eigenen Farben für bessere Sichtbarkeit in den Tasks</small>
		`;

		// Render special tags list
		this.renderSpecialTagsList(containerEl);

		// Add new special tag section
		const addTagDiv = containerEl.createDiv();
		addTagDiv.style.marginBottom = '20px';
		addTagDiv.style.padding = '15px';
		addTagDiv.style.border = '1px solid var(--background-modifier-border)';
		addTagDiv.style.borderRadius = '5px';
		
		addTagDiv.createEl('h4', { text: 'Neuen speziellen Tag hinzufügen' });
		
		let newTagName = '';
		let newTagColor = '#ff6b6b';
		
		const tagInputContainer = addTagDiv.createDiv();
		tagInputContainer.style.display = 'flex';
		tagInputContainer.style.gap = '10px';
		tagInputContainer.style.alignItems = 'center';
		tagInputContainer.style.marginBottom = '10px';
		
		// Tag name input
		const nameInput = tagInputContainer.createEl('input');
		nameInput.type = 'text';
		nameInput.placeholder = 'Tag Name (ohne #)';
		nameInput.style.flex = '1';
		nameInput.addEventListener('input', (e) => {
			newTagName = (e.target as HTMLInputElement).value;
		});
		
		// Color input
		const colorInput = tagInputContainer.createEl('input');
		colorInput.type = 'color';
		colorInput.value = newTagColor;
		colorInput.style.width = '50px';
		colorInput.style.height = '30px';
		colorInput.addEventListener('change', (e) => {
			newTagColor = (e.target as HTMLInputElement).value;
		});
		
		// Add button
		const addButton = tagInputContainer.createEl('button');
		addButton.textContent = 'Hinzufügen';
		addButton.addEventListener('click', async () => {
			if (newTagName.trim()) {
				// Check if tag already exists
				const exists = this.plugin.settings.specialTags.some(tag => tag.name === newTagName.trim());
				if (!exists) {
					this.plugin.settings.specialTags.push({
						name: newTagName.trim(),
						color: newTagColor,
						enabled: true
					});
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
					this.display(); // Refresh the settings display
				} else {
					// Show error (simple alert for now)
					alert('Ein Tag mit diesem Namen existiert bereits.');
				}
			}
		});

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

	/**
	 * Render the list of special tags with edit/delete options
	 */
	private renderSpecialTagsList(containerEl: HTMLElement) {
		const specialTagsContainer = containerEl.createDiv();
		specialTagsContainer.style.marginBottom = '15px';
		
		if (this.plugin.settings.specialTags.length === 0) {
			const emptyMsg = specialTagsContainer.createDiv();
			emptyMsg.style.color = 'var(--text-muted)';
			emptyMsg.style.fontStyle = 'italic';
			emptyMsg.textContent = 'Keine speziellen Tags definiert';
			return;
		}
		
		this.plugin.settings.specialTags.forEach((tag, index) => {
			const tagItem = specialTagsContainer.createDiv();
			tagItem.style.display = 'flex';
			tagItem.style.alignItems = 'center';
			tagItem.style.gap = '10px';
			tagItem.style.padding = '8px';
			tagItem.style.marginBottom = '5px';
			tagItem.style.border = '1px solid var(--background-modifier-border)';
			tagItem.style.borderRadius = '4px';
			
			// Color preview
			const colorPreview = tagItem.createDiv();
			colorPreview.style.width = '20px';
			colorPreview.style.height = '20px';
			colorPreview.style.backgroundColor = tag.color;
			colorPreview.style.borderRadius = '3px';
			colorPreview.style.border = '1px solid var(--background-modifier-border)';
			
			// Tag name
			const tagName = tagItem.createEl('span');
			tagName.textContent = `#${tag.name}`;
			tagName.style.flex = '1';
			tagName.style.fontFamily = 'monospace';
			tagName.style.fontSize = '14px';
			if (!tag.enabled) {
				tagName.style.opacity = '0.5';
				tagName.style.textDecoration = 'line-through';
			}
			
			// Enable/Disable toggle
			const enableToggle = tagItem.createEl('input');
			enableToggle.type = 'checkbox';
			enableToggle.checked = tag.enabled;
			enableToggle.addEventListener('change', async (e) => {
				this.plugin.settings.specialTags[index].enabled = (e.target as HTMLInputElement).checked;
				await this.plugin.saveSettings();
				await this.plugin.refreshView();
				this.display(); // Refresh the display
			});
			
			// Color input for editing
			const colorInput = tagItem.createEl('input');
			colorInput.type = 'color';
			colorInput.value = tag.color;
			colorInput.style.width = '30px';
			colorInput.style.height = '25px';
			colorInput.addEventListener('change', async (e) => {
				this.plugin.settings.specialTags[index].color = (e.target as HTMLInputElement).value;
				await this.plugin.saveSettings();
				await this.plugin.refreshView();
				this.display(); // Refresh the display
			});
			
			// Delete button
			const deleteButton = tagItem.createEl('button');
			deleteButton.textContent = '🗑️';
			deleteButton.style.background = 'none';
			deleteButton.style.border = 'none';
			deleteButton.style.cursor = 'pointer';
			deleteButton.style.fontSize = '14px';
			deleteButton.addEventListener('click', async () => {
				if (confirm(`Möchten Sie den Tag "#${tag.name}" wirklich löschen?`)) {
					this.plugin.settings.specialTags.splice(index, 1);
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
					this.display(); // Refresh the display
				}
			});
		});
	}

	/**
	 * Update preview of daily note format
	 */
	private updatePreview(container?: HTMLElement) {
		const previewContainer = container || document.getElementById('daily-note-preview');
		if (!previewContainer) return;

		const pattern = this.plugin.settings.dailyNoteFormat || 'Notes/YYYY/MM/YYYY-MM-DD-dddd';
		const sanitized = sanitizePathPattern(pattern);
		const locale = this.plugin.settings.dateFormat || 'de-DE';
		const preview = previewPattern(sanitized, undefined, locale);
		
		previewContainer.innerHTML = `
			<div style="
				padding: 8px 12px; 
				background: var(--background-modifier-border); 
				border-radius: 4px; 
				font-family: monospace; 
				font-size: 12px; 
				color: var(--text-muted);
				margin-top: 8px;
				margin-bottom: 15px;
			">
				<strong>Preview:</strong> ${preview}
			</div>
		`;
	}
}
