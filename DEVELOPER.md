# Developer Documentation - Task Heatmap Plugin

## Architecture Overview

The plugin follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│  (Obsidian View, Ribbon Icons, Command Palette)            │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                       Main Plugin                            │
│  - Plugin initialization                                     │
│  - View registration                                         │
│  - Command registration                                      │
│  - Settings management                                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼────────┐ ┌───▼────────┐ ┌───▼────────────┐
│  TaskHeatmap   │ │  Settings  │ │  Code Block    │
│    Renderer    │ │    Tab     │ │    Parser      │
│                │ │            │ │                │
│ - Data collect │ │ - UI       │ │ - Options      │
│ - Grid render  │ │ - Persist  │ │ - Embed views  │
│ - Click handle │ │            │ │                │
└────────────────┘ └────────────┘ └────────────────┘
```

## Core Components

### 1. Main Plugin (`src/main.ts`)

**Responsibilities:**
- Plugin lifecycle management (onload, onunload)
- View registration
- Command registration
- Settings initialization

**Key Methods:**
```typescript
async onload()                  // Initialize plugin
async activateView()            // Open heatmap view
async refreshView()             // Refresh heatmap data
async renderHeatmapBlock()      // Render code block embeds
```

### 2. Task Heatmap Renderer (`src/renderer/taskHeatmapRenderer.ts`)

**Responsibilities:**
- Data collection from daily notes
- GitHub-style grid rendering
- Click event handling
- Task details display

**Key Methods:**
```typescript
async render(container)                    // Main render entry point
async collectTaskData()                    // Parse all daily notes
renderGithubStyleGrid()                    // Create 7-row layout
renderDayCell()                            // Render individual cells
toggleStatisticsPanel()                    // Show/hide task details
```

**Data Flow:**
```
Daily Notes → Parse Files → Extract Tasks → Build TaskDayData Map
                                                    ↓
                                          Render 7 Weekday Rows
                                                    ↓
                                          User Clicks Cell
                                                    ↓
                                          Show Tasks Below Heatmap
```

### 3. Task Heatmap View (`src/views/taskHeatmapView.ts`)

**Responsibilities:**
- Obsidian view integration
- Container management
- Refresh coordination

**Key Methods:**
```typescript
getViewType()          // Return unique view identifier
getDisplayText()       // View title in Obsidian
getIcon()             // Ribbon icon name
async onOpen()        // Initialize view
async refresh()       // Update view content
```

### 4. Settings (`src/settings/settings.ts` & `settingsTab.ts`)

**Responsibilities:**
- Default configuration
- Color scheme definitions
- Settings persistence
- Settings UI

**Settings Structure:**
```typescript
interface HeatmapSettings {
    notesFolder: string;
    title: string;
    taskTitle: string;
    enableYearSelector: boolean;
    showAllYears: boolean;
    selectedYear: number;
    cellSize: number;
    cellRadius: number;
    cellGap: number;
    showLegend: boolean;
    showTotal: boolean;
    dateFormat: string;
    colorScheme: 'green' | 'blue' | 'purple' | 'red' | 'orange' | 'custom';
    customColors: [string, string, string, string, string];
    emptyColor: string;
}
```

## Data Structures

### TaskDayData
```typescript
interface TaskDayData {
    date: Date;              // Date object
    dateStr: string;         // ISO string (YYYY-MM-DD)
    completedTasks: number;  // Count of [x] tasks
    totalTasks: number;      // Count of all tasks
    dayOfWeek: number;       // 0=Mo, 1=Di, ..., 6=So
    hasNote: boolean;        // Does note file exist?
    taskDetails: TaskDetail[]; // Full task information
}
```

### TaskDetail
```typescript
interface TaskDetail {
    text: string;      // Task description
    completed: boolean; // Is task completed?
    line: number;      // Line number in file
}
```

## Rendering Algorithm

### GitHub-Style Layout Algorithm

```typescript
// Pseudocode for GitHub-style rendering

1. Create 7 empty rows (one per weekday)
   rows[0] = Monday row
   rows[1] = Tuesday row
   ...
   rows[6] = Sunday row

2. Iterate through date range:
   for each day from startDate to endDate:
       - Calculate dayOfWeek (0-6)
       - Get or create TaskDayData
       - Add cell to rows[dayOfWeek]

3. Result:
   Row 0 (Mo): [Mon1] [Mon2] [Mon3] [Mon4] ...
   Row 1 (Di): [Tue1] [Tue2] [Tue3] [Tue4] ...
   ...
   Row 6 (So): [Sun1] [Sun2] [Sun3] [Sun4] ...
```

### Color Calculation

```typescript
function getColorForDay(day: TaskDayData): string {
    if (!day.hasNote) return emptyColor;
    if (day.totalTasks === 0) return colors[1]; // Light
    
    const completed = day.completedTasks;
    
    if (completed === 0) return colors[1];      // Light
    if (completed === 1) return colors[2];      // Medium
    if (completed <= 3) return colors[3];       // Strong
    return colors[4];                           // Intense (4+)
}
```

## Event Handling

### Click Event Flow

```
User clicks cell
    ↓
toggleStatisticsPanel(cellWrapper, dayData)
    ↓
Find main container & taskDetailsContainer
    ↓
Clear previous active cell highlights
    ↓
Add 'active-cell' class to clicked cell
    ↓
renderTaskDetails(container, dayData)
    ↓
Display date, statistics, task list
    ↓
Smooth scroll to task details
```

### Task Details Rendering

```typescript
renderTaskDetails(container, day) {
    // 1. Clear container
    container.empty();
    
    // 2. Render header with date and close button
    - Create date title
    - Add × close button with click handler
    
    // 3. Render task summary
    - Show completion percentage
    - Display status icon (✅/🔄/⏳)
    
    // 4. Render task list
    for each task in day.taskDetails:
        - Create task item div
        - Add checkbox icon (✅ or ☐)
        - Add task text (strikethrough if completed)
        - Add line number badge
        - Add hover effects
}
```

## File Parsing

### Daily Note Parsing

```typescript
// Date regex: DD-MMM-YYYY
const dateRegex = /^(\d{2})-([A-Za-z]{3})-(\d{4})$/;

// Month mapping
const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
};

// Task parsing
const taskRegex = /^(\s*)[-*+]\s*\[(.)\]\s*(.+)$/gm;
```

### parseTasksWithDetails Algorithm

```typescript
1. Read file content
2. Split into lines
3. For each line:
   - Match against task regex
   - Extract checkbox state ([x] or [ ])
   - Extract task text
   - Store line number
4. Return TaskDetail array
```

## Styling

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.heatmap-calendar-view` | Main container |
| `.heatmap-container` | Heatmap wrapper |
| `.heatmap-cell-clickable` | Individual cells |
| `.day-cell` | Cell content |
| `.day-cell.active-cell` | Highlighted cell |
| `.task-details-container` | Task display area |
| `.task-statistics-panel` | (Deprecated) Old popup panel |

### CSS Variables Used

```css
var(--background-primary)           /* Main background */
var(--background-secondary)         /* Secondary background */
var(--background-modifier-border)   /* Border color */
var(--background-modifier-hover)    /* Hover state */
var(--text-normal)                  /* Normal text */
var(--text-muted)                   /* Muted text */
var(--text-faint)                   /* Faint text */
var(--text-accent)                  /* Accent color */
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Only render visible cells
2. **Caching**: Store parsed task data in Map
3. **Debouncing**: Prevent rapid re-renders
4. **Event Delegation**: Single event listener for all cells (future)

### Current Performance

- Parsing 365 daily notes: ~100-200ms
- Rendering heatmap: ~50-100ms
- Total initial load: ~200-300ms

### Memory Usage

- TaskDayData Map: ~50-100 KB for 365 days
- DOM elements: ~7 rows × ~52 weeks = ~364 cells
- Task details: Rendered on-demand only

## Testing

### Manual Testing Checklist

- [ ] Plugin loads without errors
- [ ] Heatmap renders with correct layout (7 rows)
- [ ] Cells show correct colors based on tasks
- [ ] Click shows task details below heatmap
- [ ] Close button hides task details
- [ ] Active cell is highlighted
- [ ] Settings persist correctly
- [ ] Color schemes apply correctly
- [ ] Code block embeds work
- [ ] Refresh command works

### Edge Cases to Test

- Empty notes folder
- Notes without tasks
- Notes with only completed tasks
- Notes with only uncompleted tasks
- Very long task descriptions
- Special characters in task text
- Notes with invalid date formats
- Large number of tasks (50+)

## Debugging

### Console Logging

The plugin includes emoji-prefixed debug logs:

```typescript
🎯 Starting Task Heatmap render...
📊 Toggling statistics panel for: 2025-10-03
🔥 CLICK DETECTED on cell
✅ Statistics panel toggled
📋 Task details rendered
```

### Debugging Tips

1. **Check Console**: Open DevTools (Ctrl+Shift+I)
2. **Verify File Format**: Ensure DD-MMM-YYYY.md format
3. **Check Folder Path**: Verify Notes Folder setting
4. **Inspect DOM**: Use Elements tab to check CSS
5. **Network Tab**: Check if files are loading

## Extension Points

### Adding New Features

**1. Add New Color Scheme:**
```typescript
// In settings.ts
export const COLOR_SCHEMES = {
    // ... existing schemes
    'custom-name': ['#color1', '#color2', '#color3', '#color4', '#color5']
};
```

**2. Add New Task Status:**
```typescript
// In taskHeatmapRenderer.ts
const taskRegex = /^(\s*)[-*+]\s*\[(.)\]\s*(.+)$/gm;
// Modify to recognize new status markers
```

**3. Add New Statistics:**
```typescript
// In renderTaskDetails
// Add new stat calculations and display
```

## Common Issues & Solutions

### Issue: Tasks not showing
**Solution**: Check date format, folder path, and task syntax

### Issue: Heatmap layout broken
**Solution**: Verify renderGithubStyleGrid creates exactly 7 rows

### Issue: Click events not working
**Solution**: Check z-index, pointer-events, and event handlers

### Issue: Colors not updating
**Solution**: Force refresh or check getColorForDay logic

## Contributing Guidelines

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add comments for complex logic
- Use emoji in console logs for debugging

### Pull Request Process

1. Create feature branch
2. Write/update tests
3. Update documentation
4. Test in Obsidian
5. Submit PR with description

### Versioning

Follow Semantic Versioning (SemVer):
- MAJOR: Breaking changes
- MINOR: New features (backward-compatible)
- PATCH: Bug fixes

---

**Last Updated**: 2025-10-03
**Plugin Version**: 1.0.0
