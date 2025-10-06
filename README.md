# 📊 Task Heatmap Plugin for Obsidian

A GitHub-style contribution graph with **special tags** and custom colors for tracking daily tasks in your Obsidian vault. Visualize your task completion over time with an intuitive heatmap display and priority-based tag highlighting.

![Task Heatmap Preview](https://img.shields.io/badge/Obsidian-Plugin-purple)

## ✨ Features

### 🎨 Special Tags with Custom Colors
- **Priority Tags**: Define important tags like `#urlaub`, `#wichtig` with custom colors
- **Visual Hierarchy**: Special tags stand out with bold colors and better contrast
- **Easy Configuration**: Manage special tags directly in plugin settings
- **Live Updates**: Changes appear instantly in the heatmap

### 📊 GitHub-Style Heatmap
- **Visual Task Tracking**: See your daily task completion at a glance
- **Interactive Details**: Click on any day to view tasks below the heatmap
- **7-Row Layout**: One row per weekday (Monday-Sunday), days flow horizontally
- **Color-Coded Progress**: Darker colors indicate more completed tasks
- **Task Statistics**: See completion percentage and task counts per day
- **Line Numbers**: Each task shows its line number in the source file
- **Customizable Settings**: Configure colors, date ranges, and display options

## 📸 How It Looks

```
Mo: □ □ ■ ■ ■ ■ □ □ ■ ■ ...
Di: □ ■ ■ ■ □ ■ ■ ■ ■ □ ...
Mi: ■ ■ ■ □ ■ ■ ■ ■ □ ■ ...
Do: ■ ■ □ ■ ■ ■ □ ■ ■ ■ ...
Fr: □ ■ ■ ■ ■ □ ■ ■ ■ ■ ...
Sa: ■ ■ ■ ■ ■ ■ ■ ■ ■ ■ ...
So: □ □ ■ ■ □ □ ■ ■ ■ ■ ...

Legend: Less □ □ ■ ■ ■ More    Total: 45/120 tasks completed
```

When you click on a cell, task details appear below:

```
📅 Donnerstag, 07. August 2025

⏳ 3/5 tasks completed (60%)

Tasks:
✅ Complete project documentation
✅ Review pull requests
☐ Update README
✅ Fix bug #123
☐ Write tests
```

## 🚀 Installation

### From Release (Recommended)
1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create folder `<vault>/.obsidian/plugins/daily-notes-heatmap/`
3. Copy the files into the folder
4. Reload Obsidian
5. Enable the plugin in Settings → Community Plugins

### Manual Installation
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile
4. Copy `main.js`, `manifest.json`, and `styles.css` to your vault's plugin folder
5. Reload Obsidian and enable the plugin

## 📋 Usage

### Opening the Heatmap
- **Ribbon Icon**: Click the checkmark (✓) icon in the left sidebar
- **Command Palette**: Press `Ctrl/Cmd + P` and search for "Open Task Heatmap"

### Viewing Task Details
1. **Click on any colored cell** in the heatmap
2. Task details appear **below the heatmap** showing:
   - Date and weekday
   - Completion statistics (e.g., "3/5 tasks completed (60%)")
   - List of all tasks with checkboxes (✅ completed, ☐ uncompleted)
   - Line numbers for each task (e.g., L4)
3. Click the **× button** to close the task details

### Daily Note Format
The plugin works with daily notes in the format: **`DD-MMM-YYYY.md`**

Examples:
- `03-Oct-2025.md`
- `15-Jan-2024.md`
- `28-Dec-2023.md`

Example daily note content:
```markdown
# 03-Oct-2025

## Tasks
- [x] Complete project documentation
- [x] Review pull requests
- [ ] Update README
- [x] Fix bug #123
- [ ] Write tests

## Notes
Today was productive...
```

## ⚙️ Settings

Access settings via: `Settings → Community Plugins → Task Heatmap → Options`

### Available Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Notes Folder** | Folder containing your daily notes | `Notes` |
| **Task Heatmap Title** | Title displayed above the heatmap | `Tasks - Don't break the chain!` |
| **Enable Year Selection** | Toggle year selector to view specific years | `false` |
| **Show All Years** | Show last 365 days or only selected year | `true` |
| **Cell Size** | Size of each heatmap cell in pixels | `10` |
| **Cell Radius** | Border radius of cells (0 = square, higher = rounded) | `2` |
| **Cell Gap** | Space between cells in pixels | `2` |
| **Show Legend** | Display color scale legend | `true` |
| **Show Total** | Display total task count | `true` |
| **Date Format** | Locale for date display | `en-US` |
| **Color Scheme** | Choose from predefined schemes or custom | `green` |

### Color Schemes
- **Green** (GitHub-style) 🟩
- **Blue** 🟦
- **Purple** 🟪
- **Red** 🟥
- **Orange** 🟧
- **Custom** (define your own 5-color gradient)

### Color Coding Logic
The heatmap uses 5 levels of intensity:

| Level | Color | Meaning |
|-------|-------|---------|
| **0** | Empty/White | No note exists or no tasks |
| **1** | Light | Note exists but no tasks completed |
| **2** | Medium | 1 task completed |
| **3** | Strong | 2-3 tasks completed |
| **4** | Intense | 4+ tasks completed |

## 🎨 Customization

### Custom CSS
You can further customize the appearance by adding CSS snippets to your vault:

```css
/* Increase cell size */
.heatmap-cell-clickable {
  width: 15px !important;
  height: 15px !important;
}

/* Custom hover effect */
.heatmap-cell-clickable:hover {
  transform: scale(1.2) !important;
  box-shadow: 0 0 10px rgba(100, 200, 100, 0.5) !important;
}

/* Task details container styling */
.task-details-container {
  background: var(--background-primary) !important;
  border: 2px solid var(--text-accent) !important;
  border-radius: 12px !important;
}

/* Highlight active cell */
.day-cell.active-cell {
  border: 3px solid gold !important;
}
```

### Code Block Syntax
Embed heatmaps in your notes using code blocks:

````markdown
```heatmap
colorScheme: purple
cellSize: 12
showLegend: true
```
````

## 🔧 Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Building
```bash
# Install dependencies
npm install

# Development build (watch mode)
npm run dev

# Production build
npm run build
```

### Project Structure
```
obsidian-heatmap-plugin/
├── src/
│   ├── main.ts                    # Plugin entry point
│   ├── renderer/
│   │   └── taskHeatmapRenderer.ts # GitHub-style heatmap renderer
│   ├── views/
│   │   └── taskHeatmapView.ts     # Obsidian view integration
│   ├── settings/
│   │   ├── settings.ts            # Settings definitions
│   │   └── settingsTab.ts         # Settings UI
│   └── utils/
│       └── codeBlockParser.ts     # Parse heatmap code blocks
├── styles.css                      # Plugin styles
├── manifest.json                   # Plugin metadata
└── package.json                    # Dependencies
```

## 🐛 Troubleshooting

### Heatmap not showing tasks
- ✅ Verify your daily notes are in the format `DD-MMM-YYYY.md`
- ✅ Check the **Notes Folder** setting matches your vault structure
- ✅ Ensure tasks use Markdown checkbox syntax: `- [ ]` or `- [x]`

### Tasks not updating
- 🔄 Use the "Refresh Task Heatmap" command from the Command Palette
- 🔄 Or close and reopen the heatmap view

### Console errors
- 🛠️ Open Developer Tools (Ctrl+Shift+I / Cmd+Option+I)
- 🛠️ Check the Console tab for error messages
- 🛠️ Enable debug logging by looking for `🎯` emoji logs

### Heatmap layout issues
- The plugin uses a **GitHub-style horizontal layout**
- Each row represents a weekday (Mo, Di, Mi, Do, Fr, Sa, So)
- Days flow from left to right
- If layout seems broken, try reloading the plugin

## 📝 Task Format Support

The plugin recognizes these task formats:

```markdown
- [ ] Uncompleted task
- [x] Completed task
- [X] Completed task (uppercase X)
```

**Note**: The plugin currently treats these as uncompleted:
- `[-]` Cancelled task
- `[>]` Forwarded task
- `[?]` Question mark

## 💡 Tips & Tricks

### Keep Your Streak Going
The color intensity increases with more completed tasks, making it easy to spot productive days at a glance.

### Daily Planning
Use the heatmap to identify patterns:
- Which days are you most productive?
- Are there days you consistently miss?
- Use this insight to plan better!

### Task Management
- Click on past days to review what you accomplished
- Use line numbers to quickly jump to tasks in your notes
- Track your progress without opening multiple files

## 🎯 Roadmap

Future features under consideration:

- [ ] Monthly/Yearly view toggle
- [ ] Task filtering by tags
- [ ] Export heatmap as image
- [ ] Task streaks and statistics
- [ ] Multiple folder support
- [ ] Custom task status icons
- [ ] Integration with Dataview plugin
- [ ] Week numbers display
- [ ] Tooltip on hover

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by GitHub's contribution graph
- Built with the Obsidian Plugin API
- Thanks to the Obsidian community for feedback and support

## 📧 Support

If you find this plugin useful, consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs via GitHub Issues
- 💡 Suggesting features via GitHub Discussions
- ☕ [Buy me a coffee](https://www.buymeacoffee.com/yourname) (optional)

## 📊 Version History

### v1.0.0 (2025-10-03)
- ✨ Initial release
- 📊 GitHub-style horizontal heatmap layout
- 🖱️ Interactive task details panel below heatmap
- 📋 Click to view tasks (no file opening)
- 🎨 Customizable color schemes
- 📅 7-row weekday layout (Mo-So)
- 📊 Task statistics and completion percentages
- 🔢 Line numbers for each task
- ⚙️ Comprehensive settings

---

**Made with ❤️ for the Obsidian community**

*Don't break the chain! 🔥*
