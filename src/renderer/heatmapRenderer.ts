import { App } from 'obsidian';
import { HeatmapSettings, COLOR_SCHEMES } from '../settings/settings';
import HeatmapCalendarPlugin from '../main';

interface DayData {
	date: Date;
	dateStr: string;
	hasNote: boolean;
	dayOfWeek: number;
}

export class HeatmapRenderer {
	plugin: HeatmapCalendarPlugin;
	settings: HeatmapSettings;

	constructor(plugin: HeatmapCalendarPlugin, settings: HeatmapSettings) {
		this.plugin = plugin;
		this.settings = settings;
	}

	// ============================================================
	// PUBLIC API
	// ============================================================

	async render(container: HTMLElement) {
		container.addClass('heatmap-calendar-view');
		
		// Render title
		this.renderTitle(container);

		// Collect all daily notes
		const noteDates = await this.collectNoteDates();

		// Calculate date range
		const { startDate, endDate } = this.calculateDateRange();

		// Create heatmap container
		const heatmapContainer = container.createEl('div');
		heatmapContainer.addClass('heatmap-container');

		// Render year labels if enabled
		if (this.settings.showYears) {
			this.renderYearLabels(heatmapContainer, startDate, endDate);
		}

		// Create flex container for weekday labels and heatmap
		const mainContainer = heatmapContainer.createEl('div');
		mainContainer.style.display = 'flex';
		mainContainer.style.gap = '3px';

		// Render weekday labels
		if (this.settings.showWeekdays) {
			this.renderWeekdayLabels(mainContainer);
		}

		// Render heatmap grid
		const gridContainer = mainContainer.createEl('div');
		gridContainer.style.display = 'flex';
		gridContainer.style.gap = '3px';
		gridContainer.style.overflowX = 'auto';

		this.renderGrid(gridContainer, startDate, endDate, noteDates);

		// Render legend
		if (this.settings.showLegend || this.settings.showTotal) {
			this.renderLegend(heatmapContainer, noteDates.size);
		}
	}

	// ============================================================
	// DATA COLLECTION & CALCULATION
	// ============================================================

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

	calculateDateRange(): { startDate: Date; endDate: Date } {
		const today = new Date();
		const startDate = new Date(today);
		let endDate = new Date(today);
		
		if (this.settings.enableYearSelector && !this.settings.showAllYears) {
			// Show selected year from Jan 1 to Dec 31
			startDate.setFullYear(this.settings.selectedYear, 0, 1);
			const yearEnd = new Date(this.settings.selectedYear, 11, 31);
			const currentYear = today.getFullYear();
			
			// If selected year is current year, show full year (not just up to today)
			if (this.settings.selectedYear === currentYear) {
				endDate = yearEnd;
			} else if (yearEnd > today) {
				// Future year - show up to today
				endDate = today;
			} else {
				// Past year - show full year
				endDate = yearEnd;
			}
		} else {
			// Show last 365 days
			startDate.setDate(startDate.getDate() - 365);
		}

		return { startDate, endDate };
	}

	private buildWeekData(startDate: Date, endDate: Date, noteDates: Set<string>): DayData[][] {
		const currentDate = new Date(startDate);
		const weeks: DayData[][] = [];
		let currentWeek: DayData[] = [];

		while (currentDate <= endDate) {
			const dayOfWeek = (currentDate.getDay() + 6) % 7; // Mo=0, Su=6

			// Start new week on Monday
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

		// Add last week if not empty
		if (currentWeek.length > 0) {
			weeks.push(currentWeek);
		}

		return weeks;
	}

	// ============================================================
	// RENDERING COMPONENTS
	// ============================================================

	private renderTitle(container: HTMLElement) {
		const { startDate, endDate } = this.calculateDateRange();
		
		let titleText = this.settings.title;
		
		// Add dynamic subtitle based on view mode
		if (this.settings.enableYearSelector && !this.settings.showAllYears) {
			const year = this.settings.selectedYear;
			titleText += ` (${year})`;
		} else {
			const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
			titleText += ` (Last ${days} days)`;
		}
		
		const title = container.createEl('h4', { text: titleText });
		title.style.marginBottom = '20px';
	}

	private renderYearLabels(container: HTMLElement, startDate: Date, endDate: Date) {
		const yearLabelsContainer = container.createEl('div');
		yearLabelsContainer.style.display = 'flex';
		yearLabelsContainer.style.gap = '3px';
		yearLabelsContainer.style.marginBottom = '5px';
		yearLabelsContainer.style.paddingLeft = this.settings.showWeekdays ? '20px' : '0';

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

	private renderWeekdayLabels(container: HTMLElement) {
		const weekdayContainer = container.createEl('div');
		weekdayContainer.style.display = 'flex';
		weekdayContainer.style.flexDirection = 'column';
		weekdayContainer.style.gap = '3px';
		weekdayContainer.style.marginRight = '5px';
		weekdayContainer.style.fontSize = '9px';
		weekdayContainer.style.color = '#666';

		const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		labels.forEach(label => {
			const labelDiv = weekdayContainer.createEl('div');
			labelDiv.style.height = `${this.settings.cellSize}px`;
			labelDiv.style.lineHeight = `${this.settings.cellSize}px`;
			labelDiv.textContent = label;
		});
	}

	private renderGrid(container: HTMLElement, startDate: Date, endDate: Date, noteDates: Set<string>) {
		// Build week data structure
		const weeks = this.buildWeekData(startDate, endDate, noteDates);

		// Render each week
		weeks.forEach((week, weekIndex) => {
			const weekContainer = container.createEl('div');
			weekContainer.style.display = 'flex';
			weekContainer.style.flexDirection = 'column';
			weekContainer.style.gap = '3px';

			// Add placeholder cells for first week if it doesn't start on Monday
			if (weekIndex === 0 && week[0].dayOfWeek !== 0) {
				this.renderPlaceholderCells(weekContainer, week[0].dayOfWeek);
			}

			// Render each day in the week
			week.forEach(day => {
				this.renderDayCell(weekContainer, day);
			});
		});
	}

	private renderPlaceholderCells(container: HTMLElement, count: number) {
		for (let i = 0; i < count; i++) {
			const placeholder = container.createEl('div');
			placeholder.style.width = `${this.settings.cellSize}px`;
			placeholder.style.height = `${this.settings.cellSize}px`;
		}
	}

	private renderDayCell(container: HTMLElement, day: DayData) {
		const cell = container.createEl('div');
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
	}

	private renderLegend(container: HTMLElement, totalNotes: number) {
		const legendContainer = container.createEl('div');
		legendContainer.style.display = 'flex';
		legendContainer.style.alignItems = 'center';
		legendContainer.style.gap = '5px';
		legendContainer.style.fontSize = '11px';
		legendContainer.style.marginTop = '8px';

		if (this.settings.showLegend) {
			this.renderLegendScale(legendContainer);
		}

		if (this.settings.showTotal) {
			const totalSpan = legendContainer.createEl('span', { text: `Total: ${totalNotes} notes` });
			totalSpan.style.marginLeft = '10px';
		}
	}

	private renderLegendScale(container: HTMLElement) {
		container.createEl('span', { text: 'Less' });
		
		const colors = this.settings.colorScheme === 'custom' 
			? this.settings.customColors 
			: COLOR_SCHEMES[this.settings.colorScheme];

		[this.settings.emptyColor, colors[1], colors[2], colors[3], colors[4]].forEach(color => {
			const box = container.createEl('div');
			box.style.width = `${this.settings.cellSize}px`;
			box.style.height = `${this.settings.cellSize}px`;
			box.style.backgroundColor = color;
			box.style.borderRadius = '2px';
		});

		container.createEl('span', { text: 'More' });
	}

	// ============================================================
	// UTILITY METHODS
	// ============================================================

	private getColorForDay(hasNote: boolean): string {
		if (!hasNote) {
			return this.settings.emptyColor;
		}
		
		const colors = this.settings.colorScheme === 'custom' 
			? this.settings.customColors 
			: COLOR_SCHEMES[this.settings.colorScheme];
		
		return colors[2]; // Medium activity level
	}
}
