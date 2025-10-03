import { App, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, TFile } from 'obsidian';

interface HeatmapSettings {
	notesFolder: string;
	enableYearSelector: boolean;
	selectedYear: number;
	showAllYears: boolean;
	showYears: boolean;
	showWeekdays: boolean;
	colorScheme: 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'custom';
	customColors: string[];
	emptyColor: string;
	cellSize: number;
	showLegend: boolean;
	showTotal: boolean;
	dateFormat: string;
}

const COLOR_SCHEMES = {
	green: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
	blue: ['#ebedf0', '#9ecbff', '#0969da', '#0550ae', '#033d8b'],
	purple: ['#ebedf0', '#dbb7ff', '#8250df', '#6639ba', '#4c2889'],
	red: ['#ebedf0', '#ffb3ba', '#ff6b6b', '#ee5a52', '#da3633'],
	orange: ['#ebedf0', '#ffd9a8', '#ff9a56', '#e8590c', '#bc4c00']
};

const DEFAULT_SETTINGS: HeatmapSettings = {
	notesFolder: 'Notes',
	enableYearSelector: false,
	selectedYear: new Date().getFullYear(),
	showAllYears: true,
	showYears: true,
	showWeekdays: true,
	colorScheme: 'green',
	customColors: COLOR_SCHEMES.green,
	emptyColor: '#ebedf0',
	cellSize: 11,
	showLegend: true,
	showTotal: true,
	dateFormat: 'de-DE'
};

const VIEW_TYPE_HEATMAP = 'heatmap-calendar-view';

export default class HeatmapCalendarPlugin extends Plugin {
	settings: HeatmapSettings;

	async onload() {
		await this.loadSettings();

		// Register the heatmap view
		this.registerView(
			VIEW_TYPE_HEATMAP,
			(leaf) => new HeatmapView(leaf, this)
		);

		// Add ribbon icon to open heatmap view
		this.addRibbonIcon('calendar-glyph', 'Open Heatmap Calendar', () => {
			this.activateView();
		});

		// Add command to open heatmap view
		this.addCommand({
			id: 'open-heatmap-calendar',
			name: 'Open Heatmap Calendar',
			callback: () => {
				this.activateView();
			}
		});

		// Add command to refresh heatmap
		this.addCommand({
			id: 'refresh-heatmap-calendar',
			name: 'Refresh Heatmap Calendar',
			callback: () => {
				this.refreshView();
			}
		});

		// Add settings tab
		this.addSettingTab(new HeatmapSettingTab(this.app, this));

		// Register markdown code block processor
		this.registerMarkdownCodeBlockProcessor('heatmap', async (source, el, ctx) => {
			await this.renderHeatmapBlock(el, source);
		});
	}

	async refreshView() {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_HEATMAP);
		for (const leaf of leaves) {
			if (leaf.view instanceof HeatmapView) {
				await leaf.view.refresh();
			}
		}
	}

	async renderHeatmapBlock(container: HTMLElement, source: string) {
		// Parse options from code block
		const options: Partial<HeatmapSettings> = { ...this.settings };
		
		if (source.trim()) {
			const lines = source.trim().split('\n');
			for (const line of lines) {
				const [key, value] = line.split(':').map(s => s.trim());
				if (key && value) {
					switch(key) {
						case 'folder':
							options.notesFolder = value;
							break;
						case 'year':
							options.selectedYear = parseInt(value);
							options.enableYearSelector = true;
							options.showAllYears = false;
							break;
						case 'showYears':
							options.showYears = value === 'true';
							break;
						case 'showWeekdays':
							options.showWeekdays = value === 'true';
							break;
						case 'colorScheme':
							options.colorScheme = value as any;
							break;
						case 'cellSize':
							options.cellSize = parseInt(value);
							break;
						case 'showLegend':
							options.showLegend = value === 'true';
							break;
						case 'showTotal':
							options.showTotal = value === 'true';
							break;
					}
				}
			}
		}

		// Create a temporary view helper
		const helper = new HeatmapRenderer(this, options as HeatmapSettings);
		await helper.render(container);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_HEATMAP);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_HEATMAP, active: true });
		}

		// Reveal the leaf in case it is in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
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

class HeatmapView extends ItemView {
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

	getColorForDay(hasNote: boolean, settings: HeatmapSettings): string {
		if (!hasNote) {
			return settings.emptyColor;
		}
		
		const colors = settings.colorScheme === 'custom' 
			? settings.customColors 
			: COLOR_SCHEMES[settings.colorScheme];
		
		// For now, use the middle color for any note
		// Later we could add intensity based on note length or number of entries
		return colors[2]; // Middle color
	}

	async renderHeatmap(container: HTMLElement) {
		const { settings } = this.plugin;
		
		// Title
		const title = container.createEl('h4', { text: '📝 Writing - Don\'t break the chain!' });
		title.style.marginBottom = '20px';

		// Collect all daily notes
		const noteDates = await this.collectNoteDates();

		// Calculate date range
		const today = new Date();
		const startDate = new Date(today);
		
		if (settings.enableYearSelector && !settings.showAllYears) {
			// Show only selected year
			startDate.setFullYear(settings.selectedYear, 0, 1);
			const endDate = new Date(settings.selectedYear, 11, 31);
			if (endDate > today) {
				// If selected year is current year, only show up to today
			} else {
				// Use end of selected year
				today.setTime(endDate.getTime());
			}
		} else {
			// Show last 365 days (1 year)
			startDate.setDate(startDate.getDate() - 365);
		}

		// Create heatmap container
		const heatmapContainer = container.createEl('div');
		heatmapContainer.addClass('heatmap-container');

		// Render year labels if enabled
		if (settings.showYears) {
			this.renderYearLabels(heatmapContainer, startDate, today);
		}

		// Create flex container for weekday labels and heatmap
		const mainContainer = heatmapContainer.createEl('div');
		mainContainer.style.display = 'flex';
		mainContainer.style.gap = '3px';

		// Render weekday labels
		this.renderWeekdayLabels(mainContainer, settings);

		// Render heatmap grid
		const gridContainer = mainContainer.createEl('div');
		gridContainer.style.display = 'flex';
		gridContainer.style.gap = '3px';
		gridContainer.style.overflowX = 'auto';

		this.renderGrid(gridContainer, startDate, today, noteDates);

		// Render legend
		if (settings.showLegend || settings.showTotal) {
			this.renderLegend(heatmapContainer, noteDates.size);
		}
	}

	async collectNoteDates(): Promise<Set<string>> {
		const { settings } = this.plugin;
		const noteDates = new Set<string>();
		const dateRegex = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
		const monthMap: { [key: string]: number } = {
			Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
			Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
		};

		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			// Check if file is in the notes folder
			if (file.path.startsWith(settings.notesFolder)) {
				const filename = file.basename;
				const match = filename.match(dateRegex);
				
				if (match) {
					const [_, day, month, year] = match;
					const monthNum = monthMap[month];
					const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${day}`;
					noteDates.add(dateStr);
				}
			}
		}

		return noteDates;
	}

	renderYearLabels(container: HTMLElement, startDate: Date, endDate: Date) {
		const { settings } = this.plugin;
		const yearLabelsContainer = container.createEl('div');
		yearLabelsContainer.style.display = 'flex';
		yearLabelsContainer.style.gap = '3px';
		yearLabelsContainer.style.marginBottom = '5px';
		yearLabelsContainer.style.paddingLeft = '20px';

		let currentYear: number | null = null;
		const currentDate = new Date(startDate);

		while (currentDate <= endDate) {
			const year = currentDate.getFullYear();
			const yearDiv = yearLabelsContainer.createEl('div');
			yearDiv.style.fontSize = '10px';
			yearDiv.style.color = '#666';
			yearDiv.style.minWidth = `${settings.cellSize}px`;
			yearDiv.style.textAlign = 'left';

			if (year !== currentYear) {
				yearDiv.textContent = year.toString();
				currentYear = year;
			}

			currentDate.setDate(currentDate.getDate() + 7);
		}
	}

	renderWeekdayLabels(container: HTMLElement, settings: HeatmapSettings) {
		if (!settings.showWeekdays) {
			return;
		}
		
		const weekdayContainer = container.createEl('div');
		weekdayContainer.style.display = 'flex';
		weekdayContainer.style.flexDirection = 'column';
		weekdayContainer.style.gap = '3px';
		weekdayContainer.style.marginRight = '5px';
		weekdayContainer.style.fontSize = '9px';
		weekdayContainer.style.color = '#666';

		const labels = ['Mo', '', 'We', '', 'Fr', '', ''];
		labels.forEach(label => {
			const labelDiv = weekdayContainer.createEl('div');
			labelDiv.style.height = `${settings.cellSize}px`;
			labelDiv.style.lineHeight = `${settings.cellSize}px`;
			labelDiv.textContent = label;
		});
	}

	renderGrid(container: HTMLElement, startDate: Date, endDate: Date, noteDates: Set<string>) {
		const { settings } = this.plugin;
		const currentDate = new Date(startDate);
		let weeks: Array<Array<{ date: Date; dateStr: string; hasNote: boolean; dayOfWeek: number }>> = [];
		let currentWeek: Array<{ date: Date; dateStr: string; hasNote: boolean; dayOfWeek: number }> = [];

		while (currentDate <= endDate) {
			const dayOfWeek = (currentDate.getDay() + 6) % 7; // Mo=0, Su=6

			if (dayOfWeek === 0 && currentWeek.length > 0) {
				weeks.push(currentWeek);
				currentWeek = [];
			}

			const dateStr = currentDate.toISOString().split('T')[0];
			const hasNote = noteDates.has(dateStr);

			currentWeek.push({
				date: new Date(currentDate),
				dateStr: dateStr,
				hasNote: hasNote,
				dayOfWeek: dayOfWeek
			});

			currentDate.setDate(currentDate.getDate() + 1);
		}

		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}

		// Render weeks
		weeks.forEach((week, weekIndex) => {
			const weekContainer = container.createEl('div');
			weekContainer.style.display = 'flex';
			weekContainer.style.flexDirection = 'column';
			weekContainer.style.gap = '3px';

			// Add placeholder for first incomplete week
			if (weekIndex === 0 && week[0].dayOfWeek !== 0) {
				for (let i = 0; i < week[0].dayOfWeek; i++) {
					const placeholder = weekContainer.createEl('div');
					placeholder.style.width = `${settings.cellSize}px`;
					placeholder.style.height = `${settings.cellSize}px`;
				}
			}

			// Render cells
			week.forEach(day => {
				const cell = weekContainer.createEl('div');
				cell.style.width = `${settings.cellSize}px`;
				cell.style.height = `${settings.cellSize}px`;
				
				// Get color based on activity level
				const color = this.getColorForDay(day.hasNote, settings);
				cell.style.backgroundColor = color;
				cell.style.borderRadius = '2px';
				cell.style.cursor = 'pointer';

				const dateDisplay = day.date.toLocaleDateString(settings.dateFormat, {
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				});
				cell.setAttribute('aria-label', `${dateDisplay}${day.hasNote ? ' ✓' : ''}`);
				cell.title = `${dateDisplay}${day.hasNote ? ' ✓' : ''}`;

				// Add click handler to open note
				cell.addEventListener('click', async () => {
					if (day.hasNote) {
						// Find and open the note
						const files = this.app.vault.getMarkdownFiles();
						for (const file of files) {
							if (file.path.startsWith(settings.notesFolder)) {
								const dateRegex = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
								const match = file.basename.match(dateRegex);
								if (match) {
									const monthMap: { [key: string]: number } = {
										Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
										Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
									};
									const [_, fileDay, fileMonth, fileYear] = match;
									const fileMonthNum = monthMap[fileMonth];
									const fileDateStr = `${fileYear}-${String(fileMonthNum + 1).padStart(2, '0')}-${fileDay}`;
									
									if (fileDateStr === day.dateStr) {
										const leaf = this.app.workspace.getLeaf(false);
										await leaf.openFile(file);
										break;
									}
								}
							}
						}
					}
				});
			});
		});
	}

	renderLegend(container: HTMLElement, totalNotes: number) {
		const { settings } = this.plugin;
		const legendContainer = container.createEl('div');
		legendContainer.style.display = 'flex';
		legendContainer.style.alignItems = 'center';
		legendContainer.style.gap = '5px';
		legendContainer.style.fontSize = '11px';
		legendContainer.style.marginTop = '8px';

		if (settings.showLegend) {
			legendContainer.createEl('span', { text: 'Less' });
			
			const colors = settings.colorScheme === 'custom' 
				? settings.customColors 
				: COLOR_SCHEMES[settings.colorScheme];

			// Show gradient from empty to most active
			[settings.emptyColor, colors[1], colors[2], colors[3], colors[4]].forEach(color => {
				const box = legendContainer.createEl('div');
				box.style.width = `${settings.cellSize}px`;
				box.style.height = `${settings.cellSize}px`;
				box.style.backgroundColor = color;
				box.style.borderRadius = '2px';
			});

			legendContainer.createEl('span', { text: 'More' });
		}

		if (settings.showTotal) {
			const totalSpan = legendContainer.createEl('span', { text: `Total: ${totalNotes} notes` });
			totalSpan.style.marginLeft = '10px';
		}
	}
}

class HeatmapRenderer {
	plugin: HeatmapCalendarPlugin;
	settings: HeatmapSettings;

	constructor(plugin: HeatmapCalendarPlugin, settings: HeatmapSettings) {
		this.plugin = plugin;
		this.settings = settings;
	}

	async render(container: HTMLElement) {
		container.addClass('heatmap-calendar-view');
		
		// Title
		const title = container.createEl('h4', { text: '📝 Writing - Don\'t break the chain!' });
		title.style.marginBottom = '20px';

		// Collect all daily notes
		const noteDates = await this.collectNoteDates();

		// Calculate date range
		const today = new Date();
		const startDate = new Date(today);
		
		if (this.settings.enableYearSelector && !this.settings.showAllYears) {
			startDate.setFullYear(this.settings.selectedYear, 0, 1);
			const endDate = new Date(this.settings.selectedYear, 11, 31);
			if (endDate > today) {
				// Use today as end date
			} else {
				today.setTime(endDate.getTime());
			}
		} else {
			startDate.setDate(startDate.getDate() - 365);
		}

		// Create heatmap container
		const heatmapContainer = container.createEl('div');
		heatmapContainer.addClass('heatmap-container');

		// Render year labels if enabled
		if (this.settings.showYears) {
			this.renderYearLabels(heatmapContainer, startDate, today);
		}

		// Create flex container for weekday labels and heatmap
		const mainContainer = heatmapContainer.createEl('div');
		mainContainer.style.display = 'flex';
		mainContainer.style.gap = '3px';

		// Render weekday labels
		this.renderWeekdayLabels(mainContainer);

		// Render heatmap grid
		const gridContainer = mainContainer.createEl('div');
		gridContainer.style.display = 'flex';
		gridContainer.style.gap = '3px';
		gridContainer.style.overflowX = 'auto';

		this.renderGrid(gridContainer, startDate, today, noteDates);

		// Render legend
		if (this.settings.showLegend || this.settings.showTotal) {
			this.renderLegend(heatmapContainer, noteDates.size);
		}
	}

	async collectNoteDates(): Promise<Set<string>> {
		const noteDates = new Set<string>();
		const dateRegex = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
		const monthMap: { [key: string]: number } = {
			Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
			Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
		};

		const files = this.plugin.app.vault.getMarkdownFiles();

		for (const file of files) {
			if (file.path.startsWith(this.settings.notesFolder)) {
				const filename = file.basename;
				const match = filename.match(dateRegex);
				
				if (match) {
					const [_, day, month, year] = match;
					const monthNum = monthMap[month];
					const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${day}`;
					noteDates.add(dateStr);
				}
			}
		}

		return noteDates;
	}

	renderYearLabels(container: HTMLElement, startDate: Date, endDate: Date) {
		const yearLabelsContainer = container.createEl('div');
		yearLabelsContainer.style.display = 'flex';
		yearLabelsContainer.style.gap = '3px';
		yearLabelsContainer.style.marginBottom = '5px';
		yearLabelsContainer.style.paddingLeft = '20px';

		let currentYear: number | null = null;
		const currentDate = new Date(startDate);

		while (currentDate <= endDate) {
			const year = currentDate.getFullYear();
			const yearDiv = yearLabelsContainer.createEl('div');
			yearDiv.style.fontSize = '10px';
			yearDiv.style.color = '#666';
			yearDiv.style.minWidth = `${this.settings.cellSize}px`;
			yearDiv.style.textAlign = 'left';

			if (year !== currentYear) {
				yearDiv.textContent = year.toString();
				currentYear = year;
			}

			currentDate.setDate(currentDate.getDate() + 7);
		}
	}

	renderWeekdayLabels(container: HTMLElement) {
		if (!this.settings.showWeekdays) {
			return;
		}
		
		const weekdayContainer = container.createEl('div');
		weekdayContainer.style.display = 'flex';
		weekdayContainer.style.flexDirection = 'column';
		weekdayContainer.style.gap = '3px';
		weekdayContainer.style.marginRight = '5px';
		weekdayContainer.style.fontSize = '9px';
		weekdayContainer.style.color = '#666';

		const labels = ['Mo', '', 'We', '', 'Fr', '', ''];
		labels.forEach(label => {
			const labelDiv = weekdayContainer.createEl('div');
			labelDiv.style.height = `${this.settings.cellSize}px`;
			labelDiv.style.lineHeight = `${this.settings.cellSize}px`;
			labelDiv.textContent = label;
		});
	}

	renderGrid(container: HTMLElement, startDate: Date, endDate: Date, noteDates: Set<string>) {
		const currentDate = new Date(startDate);
		let weeks: Array<Array<{ date: Date; dateStr: string; hasNote: boolean; dayOfWeek: number }>> = [];
		let currentWeek: Array<{ date: Date; dateStr: string; hasNote: boolean; dayOfWeek: number }> = [];

		while (currentDate <= endDate) {
			const dayOfWeek = (currentDate.getDay() + 6) % 7;

			if (dayOfWeek === 0 && currentWeek.length > 0) {
				weeks.push(currentWeek);
				currentWeek = [];
			}

			const dateStr = currentDate.toISOString().split('T')[0];
			const hasNote = noteDates.has(dateStr);

			currentWeek.push({
				date: new Date(currentDate),
				dateStr: dateStr,
				hasNote: hasNote,
				dayOfWeek: dayOfWeek
			});

			currentDate.setDate(currentDate.getDate() + 1);
		}

		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}

		// Render weeks
		weeks.forEach((week, weekIndex) => {
			const weekContainer = container.createEl('div');
			weekContainer.style.display = 'flex';
			weekContainer.style.flexDirection = 'column';
			weekContainer.style.gap = '3px';

			if (weekIndex === 0 && week[0].dayOfWeek !== 0) {
				for (let i = 0; i < week[0].dayOfWeek; i++) {
					const placeholder = weekContainer.createEl('div');
					placeholder.style.width = `${this.settings.cellSize}px`;
					placeholder.style.height = `${this.settings.cellSize}px`;
				}
			}

			week.forEach(day => {
				const cell = weekContainer.createEl('div');
				cell.style.width = `${this.settings.cellSize}px`;
				cell.style.height = `${this.settings.cellSize}px`;
				
				const color = this.getColorForDay(day.hasNote);
				cell.style.backgroundColor = color;
				cell.style.borderRadius = '2px';
				cell.style.cursor = 'pointer';

				const dateDisplay = day.date.toLocaleDateString(this.settings.dateFormat, {
					day: '2-digit',
					month: 'short',
					year: 'numeric'
				});
				cell.setAttribute('aria-label', `${dateDisplay}${day.hasNote ? ' ✓' : ''}`);
				cell.title = `${dateDisplay}${day.hasNote ? ' ✓' : ''}`;
			});
		});
	}

	getColorForDay(hasNote: boolean): string {
		if (!hasNote) {
			return this.settings.emptyColor;
		}
		
		const colors = this.settings.colorScheme === 'custom' 
			? this.settings.customColors 
			: COLOR_SCHEMES[this.settings.colorScheme];
		
		return colors[2];
	}

	renderLegend(container: HTMLElement, totalNotes: number) {
		const legendContainer = container.createEl('div');
		legendContainer.style.display = 'flex';
		legendContainer.style.alignItems = 'center';
		legendContainer.style.gap = '5px';
		legendContainer.style.fontSize = '11px';
		legendContainer.style.marginTop = '8px';

		if (this.settings.showLegend) {
			legendContainer.createEl('span', { text: 'Less' });
			
			const colors = this.settings.colorScheme === 'custom' 
				? this.settings.customColors 
				: COLOR_SCHEMES[this.settings.colorScheme];

			[this.settings.emptyColor, colors[1], colors[2], colors[3], colors[4]].forEach(color => {
				const box = legendContainer.createEl('div');
				box.style.width = `${this.settings.cellSize}px`;
				box.style.height = `${this.settings.cellSize}px`;
				box.style.backgroundColor = color;
				box.style.borderRadius = '2px';
			});

			legendContainer.createEl('span', { text: 'More' });
		}

		if (this.settings.showTotal) {
			const totalSpan = legendContainer.createEl('span', { text: `Total: ${totalNotes} notes` });
			totalSpan.style.marginLeft = '10px';
		}
	}
}

class HeatmapSettingTab extends PluginSettingTab {
	plugin: HeatmapCalendarPlugin;

	constructor(app: App, plugin: HeatmapCalendarPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Heatmap Calendar Settings' });

		new Setting(containerEl)
			.setName('Notes Folder')
			.setDesc('Folder containing your daily notes')
			.addText(text => text
				.setPlaceholder('Notes')
				.setValue(this.plugin.settings.notesFolder)
				.onChange(async (value) => {
					this.plugin.settings.notesFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Enable Year Selection')
			.setDesc('Toggle year selector to view specific years')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableYearSelector)
				.onChange(async (value) => {
					this.plugin.settings.enableYearSelector = value;
					await this.plugin.saveSettings();
					this.display(); // Refresh settings to show/hide year selector
				}));

		if (this.plugin.settings.enableYearSelector) {
			new Setting(containerEl)
				.setName('Show All Years')
				.setDesc('Show last 365 days or only selected year')
				.addToggle(toggle => toggle
					.setValue(this.plugin.settings.showAllYears)
					.onChange(async (value) => {
						this.plugin.settings.showAllYears = value;
						await this.plugin.saveSettings();
						this.display(); // Refresh to show/hide year dropdown
					}));

			if (!this.plugin.settings.showAllYears) {
				// Get available years from notes
				const files = this.app.vault.getMarkdownFiles();
				const years = new Set<number>();
				const dateRegex = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;
				
				for (const file of files) {
					if (file.path.startsWith(this.plugin.settings.notesFolder)) {
						const match = file.basename.match(dateRegex);
						if (match) {
							years.add(parseInt(match[3]));
						}
					}
				}

				const sortedYears = Array.from(years).sort((a, b) => b - a);
				
				new Setting(containerEl)
					.setName('Select Year')
					.setDesc('Choose which year to display')
					.addDropdown(dropdown => {
						// Add available years
						sortedYears.forEach(year => {
							dropdown.addOption(String(year), String(year));
						});
						
						// If no years found, add current year
						if (sortedYears.length === 0) {
							const currentYear = new Date().getFullYear();
							dropdown.addOption(String(currentYear), String(currentYear));
						}
						
						dropdown
							.setValue(String(this.plugin.settings.selectedYear))
							.onChange(async (value) => {
								this.plugin.settings.selectedYear = parseInt(value);
								await this.plugin.saveSettings();
								await this.plugin.refreshView();
							});
					});
			}
		}

		new Setting(containerEl)
			.setName('Show Years')
			.setDesc('Display year labels above the heatmap')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showYears)
				.onChange(async (value) => {
					this.plugin.settings.showYears = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

		new Setting(containerEl)
			.setName('Show Weekdays')
			.setDesc('Display weekday labels (Mon, Wed, Fri)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showWeekdays)
				.onChange(async (value) => {
					this.plugin.settings.showWeekdays = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

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

		new Setting(containerEl)
			.setName('Empty Color')
			.setDesc('Color for days without notes (hex code)')
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

		new Setting(containerEl)
			.setName('Cell Size')
			.setDesc('Size of each cell in pixels')
			.addText(text => text
				.setPlaceholder('11')
				.setValue(String(this.plugin.settings.cellSize))
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.cellSize = numValue;
						await this.plugin.saveSettings();
						await this.plugin.refreshView();
					}
				}));

		new Setting(containerEl)
			.setName('Show Legend')
			.setDesc('Display the color legend')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showLegend)
				.onChange(async (value) => {
					this.plugin.settings.showLegend = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));

		new Setting(containerEl)
			.setName('Show Total Count')
			.setDesc('Display total number of notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showTotal)
				.onChange(async (value) => {
					this.plugin.settings.showTotal = value;
					await this.plugin.saveSettings();
					await this.plugin.refreshView();
				}));
	}
}
