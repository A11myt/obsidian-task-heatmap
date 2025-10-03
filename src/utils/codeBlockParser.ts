export function parseCodeBlockOptions(source: string): { [key: string]: any } {
	const options: { [key: string]: any } = {};
	
	if (!source.trim()) {
		return options;
	}

	const lines = source.trim().split('\n');
	for (const line of lines) {
		const [key, value] = line.split(':').map(s => s.trim());
		if (key && value) {
			switch(key) {
				case 'type':
					options.type = value; // 'notes' or 'tasks'
					break;
				case 'folder':
					options.notesFolder = value;
					break;
				case 'title':
					options.title = value;
					break;
				case 'taskTitle':
					options.taskTitle = value;
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
					options.colorScheme = value;
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

	return options;
}
