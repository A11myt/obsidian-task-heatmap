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

		// Add new special tag section with improved UI
		const addTagDiv = containerEl.createDiv();
		addTagDiv.style.marginBottom = '20px';
		addTagDiv.style.padding = '15px';
		addTagDiv.style.border = '2px solid var(--interactive-accent)';
		addTagDiv.style.borderRadius = '8px';
		addTagDiv.style.backgroundColor = 'var(--background-secondary)';
		
		const addHeader = addTagDiv.createEl('h4', { text: '➕ Neuen speziellen Tag hinzufügen' });
		addHeader.style.margin = '0 0 15px 0';
		addHeader.style.color = 'var(--interactive-accent)';
		
		// Create form container
		const formContainer = addTagDiv.createDiv();
		formContainer.style.display = 'grid';
		formContainer.style.gridTemplateColumns = '1fr auto auto';
		formContainer.style.gap = '10px';
		formContainer.style.alignItems = 'center';
		
		// Tag name input with better styling
		const nameInput = formContainer.createEl('input') as HTMLInputElement;
		nameInput.type = 'text';
		nameInput.placeholder = 'Tag Name (ohne #)';
		nameInput.style.padding = '8px 12px';
		nameInput.style.border = '2px solid var(--background-modifier-border)';
		nameInput.style.borderRadius = '6px';
		nameInput.style.fontSize = '14px';
		nameInput.style.backgroundColor = 'var(--background-primary)';
		nameInput.style.color = 'var(--text-normal)';
		
		// Color input with better styling
		const colorInput = formContainer.createEl('input') as HTMLInputElement;
		colorInput.type = 'color';
		colorInput.value = '#ff6b6b';
		colorInput.style.width = '60px';
		colorInput.style.height = '40px';
		colorInput.style.border = '2px solid var(--background-modifier-border)';
		colorInput.style.borderRadius = '6px';
		colorInput.style.cursor = 'pointer';
		
		// Add button with better styling
		const addButton = formContainer.createEl('button') as HTMLButtonElement;
		addButton.textContent = 'Hinzufügen';
		addButton.style.padding = '8px 16px';
		addButton.style.backgroundColor = 'var(--interactive-accent)';
		addButton.style.color = 'var(--text-on-accent)';
		addButton.style.border = 'none';
		addButton.style.borderRadius = '6px';
		addButton.style.cursor = 'pointer';
		addButton.style.fontSize = '14px';
		addButton.style.fontWeight = '500';
		addButton.style.transition = 'all 0.2s ease';
		
		// Button hover effects
		addButton.addEventListener('mouseenter', () => {
			addButton.style.transform = 'translateY(-1px)';
			addButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
		});
		
		addButton.addEventListener('mouseleave', () => {
			addButton.style.transform = 'translateY(0)';
			addButton.style.boxShadow = 'none';
		});
		
		// Input focus effects
		nameInput.addEventListener('focus', () => {
			nameInput.style.borderColor = 'var(--interactive-accent)';
			nameInput.style.boxShadow = '0 0 0 2px rgba(var(--interactive-accent-rgb), 0.2)';
		});
		
		nameInput.addEventListener('blur', () => {
			nameInput.style.borderColor = 'var(--background-modifier-border)';
			nameInput.style.boxShadow = 'none';
		});
		
		// Add functionality
		const addNewTag = async () => {
			const tagName = nameInput.value.trim();
			const tagColor = colorInput.value;
			
			if (!tagName) {
				nameInput.style.borderColor = '#ff4444';
				nameInput.focus();
				return;
			}
			
			// Check if tag already exists
			const exists = this.plugin.settings.specialTags.some(tag => 
				tag.name.toLowerCase() === tagName.toLowerCase()
			);
			
			if (exists) {
				nameInput.style.borderColor = '#ff4444';
				nameInput.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
				
				// Show error message
				const errorMsg = formContainer.createEl('div');
				errorMsg.textContent = `⚠️ Tag "${tagName}" existiert bereits!`;
				errorMsg.style.gridColumn = '1 / -1';
				errorMsg.style.color = '#ff4444';
				errorMsg.style.fontSize = '12px';
				errorMsg.style.marginTop = '5px';
				
				// Remove error after 3 seconds
				setTimeout(() => {
					errorMsg.remove();
					nameInput.style.borderColor = 'var(--background-modifier-border)';
					nameInput.style.backgroundColor = 'var(--background-primary)';
				}, 3000);
				
				return;
			}
			
			// Add the new tag
			this.plugin.settings.specialTags.push({
				name: tagName,
				color: tagColor,
				enabled: true
			});
			
			// Save and refresh
			await this.plugin.saveSettings();
			await this.plugin.refreshView();
			
			// Clear inputs
			nameInput.value = '';
			colorInput.value = '#ff6b6b';
			
			// Show success message
			const successMsg = formContainer.createEl('div');
			successMsg.textContent = `✅ Tag "${tagName}" erfolgreich hinzugefügt!`;
			successMsg.style.gridColumn = '1 / -1';
			successMsg.style.color = 'var(--text-success)';
			successMsg.style.fontSize = '12px';
			successMsg.style.marginTop = '5px';
			
			// Remove success message and refresh display
			setTimeout(() => {
				successMsg.remove();
				this.display(); // Refresh the entire settings display
			}, 2000);
		};
		
		// Event listeners
		addButton.addEventListener('click', addNewTag);
		
		// Enter key support
		nameInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') {
				addNewTag();
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
		// Create header for existing tags
		const tagsHeader = containerEl.createEl('h4');
		tagsHeader.textContent = '🏷️ Vorhandene spezielle Tags';
		tagsHeader.style.margin = '0 0 15px 0';
		tagsHeader.style.color = 'var(--text-normal)';
		
		const specialTagsContainer = containerEl.createDiv();
		specialTagsContainer.style.marginBottom = '20px';
		specialTagsContainer.style.padding = '10px';
		specialTagsContainer.style.backgroundColor = 'var(--background-primary)';
		specialTagsContainer.style.border = '1px solid var(--background-modifier-border)';
		specialTagsContainer.style.borderRadius = '6px';
		
		if (this.plugin.settings.specialTags.length === 0) {
			const emptyMsg = specialTagsContainer.createDiv();
			emptyMsg.style.color = 'var(--text-muted)';
			emptyMsg.style.fontStyle = 'italic';
			emptyMsg.style.textAlign = 'center';
			emptyMsg.style.padding = '20px';
			emptyMsg.innerHTML = `
				<div style="font-size: 48px; margin-bottom: 10px;">📝</div>
				<div>Keine speziellen Tags definiert</div>
				<div style="font-size: 12px; margin-top: 5px;">Fügen Sie unten Ihren ersten Tag hinzu!</div>
			`;
			return;
		}
		
		this.plugin.settings.specialTags.forEach((tag, index) => {
			const tagItem = specialTagsContainer.createDiv();
			tagItem.style.display = 'grid';
			tagItem.style.gridTemplateColumns = 'auto 1fr auto auto auto';
			tagItem.style.alignItems = 'center';
			tagItem.style.gap = '12px';
			tagItem.style.padding = '12px';
			tagItem.style.marginBottom = '8px';
			tagItem.style.border = '2px solid var(--background-modifier-border)';
			tagItem.style.borderRadius = '8px';
			tagItem.style.backgroundColor = 'var(--background-secondary)';
			tagItem.style.transition = 'all 0.2s ease';
			
			// Hover effect
			tagItem.addEventListener('mouseenter', () => {
				tagItem.style.borderColor = 'var(--interactive-accent)';
				tagItem.style.transform = 'translateY(-1px)';
				tagItem.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
			});
			
			tagItem.addEventListener('mouseleave', () => {
				tagItem.style.borderColor = 'var(--background-modifier-border)';
				tagItem.style.transform = 'translateY(0)';
				tagItem.style.boxShadow = 'none';
			});
			
			// Color preview (larger and more prominent)
			const colorPreview = tagItem.createDiv();
			colorPreview.style.width = '32px';
			colorPreview.style.height = '32px';
			colorPreview.style.backgroundColor = tag.color;
			colorPreview.style.borderRadius = '50%';
			colorPreview.style.border = '3px solid #ffffff';
			colorPreview.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
			
			// Tag name (larger and bolder)
			const tagName = tagItem.createEl('span');
			tagName.textContent = `#${tag.name}`;
			tagName.style.fontFamily = 'var(--font-monospace)';
			tagName.style.fontSize = '16px';
			tagName.style.fontWeight = '600';
			tagName.style.color = tag.color;
			
			if (!tag.enabled) {
				tagName.style.opacity = '0.4';
				tagName.style.textDecoration = 'line-through';
			}
			
			// Enable/Disable toggle (styled)
			const toggleContainer = tagItem.createDiv();
			toggleContainer.style.display = 'flex';
			toggleContainer.style.alignItems = 'center';
			toggleContainer.style.gap = '5px';
			
			const toggleLabel = toggleContainer.createEl('span');
			toggleLabel.textContent = tag.enabled ? 'Ein' : 'Aus';
			toggleLabel.style.fontSize = '12px';
			toggleLabel.style.color = tag.enabled ? 'var(--text-success)' : 'var(--text-muted)';
			toggleLabel.style.fontWeight = '500';
			
			const enableToggle = toggleContainer.createEl('input') as HTMLInputElement;
			enableToggle.type = 'checkbox';
			enableToggle.checked = tag.enabled;
			enableToggle.style.transform = 'scale(1.2)';
			enableToggle.style.accentColor = 'var(--interactive-accent)';
			
			enableToggle.addEventListener('change', async (e: Event) => {
				const target = e.target as HTMLInputElement;
				this.plugin.settings.specialTags[index].enabled = target.checked;
				toggleLabel.textContent = target.checked ? 'Ein' : 'Aus';
				toggleLabel.style.color = target.checked ? 'var(--text-success)' : 'var(--text-muted)';
				tagName.style.opacity = target.checked ? '1' : '0.4';
				tagName.style.textDecoration = target.checked ? 'none' : 'line-through';
				
				await this.plugin.saveSettings();
				await this.plugin.refreshView();
			});
			
			// Color input for editing (better styled)
			const colorInput = tagItem.createEl('input') as HTMLInputElement;
			colorInput.type = 'color';
			colorInput.value = tag.color;
			colorInput.style.width = '40px';
			colorInput.style.height = '40px';
			colorInput.style.border = '2px solid var(--background-modifier-border)';
			colorInput.style.borderRadius = '6px';
			colorInput.style.cursor = 'pointer';
			
			colorInput.addEventListener('change', async (e: Event) => {
				const target = e.target as HTMLInputElement;
				const newColor = target.value;
				this.plugin.settings.specialTags[index].color = newColor;
				
				// Update preview immediately
				colorPreview.style.backgroundColor = newColor;
				tagName.style.color = newColor;
				
				await this.plugin.saveSettings();
				await this.plugin.refreshView();
			});
			
			// Delete button (better styled)
			const deleteButton = tagItem.createEl('button') as HTMLButtonElement;
			deleteButton.textContent = '🗑️';
			deleteButton.style.width = '36px';
			deleteButton.style.height = '36px';
			deleteButton.style.backgroundColor = 'transparent';
			deleteButton.style.border = '2px solid #ff4444';
			deleteButton.style.borderRadius = '6px';
			deleteButton.style.cursor = 'pointer';
			deleteButton.style.fontSize = '16px';
			deleteButton.style.transition = 'all 0.2s ease';
			deleteButton.title = `Tag "#${tag.name}" löschen`;
			
			// Delete button hover effects
			deleteButton.addEventListener('mouseenter', () => {
				deleteButton.style.backgroundColor = '#ff4444';
				deleteButton.style.transform = 'scale(1.1)';
			});
			
			deleteButton.addEventListener('mouseleave', () => {
				deleteButton.style.backgroundColor = 'transparent';
				deleteButton.style.transform = 'scale(1)';
			});
			
			deleteButton.addEventListener('click', async () => {
				// Better confirmation dialog
				const tagDisplayName = `#${tag.name}`;
				const shouldDelete = confirm(
					`🗑️ Tag löschen\n\n` +
					`Möchten Sie den speziellen Tag "${tagDisplayName}" wirklich löschen?\n\n` +
					`Diese Aktion kann nicht rückgängig gemacht werden.`
				);
				
				if (shouldDelete) {
					// Show loading state
					deleteButton.textContent = '⏳';
					deleteButton.disabled = true;
					
					try {
						this.plugin.settings.specialTags.splice(index, 1);
						await this.plugin.saveSettings();
						await this.plugin.refreshView();
						
						// Show success and refresh
						setTimeout(() => {
							this.display(); // Refresh the entire settings display
						}, 100);
						
					} catch (error) {
						console.error('Error deleting tag:', error);
						deleteButton.textContent = '❌';
						
						setTimeout(() => {
							deleteButton.textContent = '🗑️';
							deleteButton.disabled = false;
						}, 2000);
					}
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
