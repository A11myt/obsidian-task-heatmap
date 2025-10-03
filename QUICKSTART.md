# Quick Start Guide - Task Heatmap Plugin

## 5-Minute Setup

### 1. Install Plugin ⚡
```
1. Copy main.js, manifest.json, styles.css
2. To: <vault>/.obsidian/plugins/daily-notes-heatmap/
3. Reload Obsidian
4. Enable in Settings → Community Plugins
```

### 2. Configure Daily Notes 📝

Your daily notes must follow this format:

**Filename**: `DD-MMM-YYYY.md` (e.g., `03-Oct-2025.md`)

**Content**:
```markdown
# 03-Oct-2025

## Tasks
- [x] Morning workout
- [x] Team meeting
- [ ] Write documentation
- [x] Code review
```

### 3. Open Heatmap 🎨

Click the **✓ checkmark** icon in the sidebar

OR

Press `Ctrl+P` → Type "Open Task Heatmap"

### 4. View Tasks 👆

**Click any cell** → Tasks appear below the heatmap

## What You'll See

```
Mo: □ ■ ■ ■ □ ■ ■ ...
Di: ■ ■ □ ■ ■ ■ □ ...
Mi: ■ □ ■ ■ ■ □ ■ ...
Do: □ ■ ■ □ ■ ■ ■ ...
Fr: ■ ■ ■ ■ ■ ■ ■ ...
Sa: ■ ■ □ ■ □ ■ ■ ...
So: □ □ ■ ■ ■ ■ □ ...
```

### Color Meaning

| Color | Meaning |
|-------|---------|
| ⬜ White | No note or no tasks |
| 🟩 Light Green | Note exists, 0 tasks completed |
| 🟩 Medium Green | 1 task completed |
| 🟩 Strong Green | 2-3 tasks completed |
| 🟩 Dark Green | 4+ tasks completed |

## Essential Settings

**Access**: Settings → Community Plugins → Task Heatmap → Options

| Setting | What to Change |
|---------|----------------|
| **Notes Folder** | Set to your daily notes folder (e.g., `Daily` or `Notes`) |
| **Cell Size** | Increase for larger cells (default: 10px) |
| **Color Scheme** | Choose: green, blue, purple, red, orange |

## Common Tasks

### View Specific Tasks
1. Click on a colored cell
2. See all tasks for that day
3. Click × to close

### Refresh Data
- Press `Ctrl+P` → "Refresh Task Heatmap"
- Or close and reopen the view

### Change Colors
- Settings → Color Scheme → Select your preference
- Or choose "Custom" for your own colors

## Troubleshooting

### ❌ No heatmap showing
- Check: Settings → Notes Folder is correct
- Verify: Daily notes use `DD-MMM-YYYY.md` format

### ❌ Tasks not appearing
- Check: Tasks use `- [ ]` or `- [x]` format
- Verify: Tasks are in the correct notes folder

### ❌ Wrong colors
- Reload plugin: Disable + Enable in settings
- Or: Settings → Color Scheme → Re-select

## Tips 💡

**Keep Streaks**: Darker colors = more progress!

**Quick Access**: Pin the heatmap view to the sidebar

**Daily Review**: Click on today's cell to see your tasks

**Weekly Planning**: Look at patterns to optimize your week

## Need Help?

- 📖 Full docs: See README.md
- 🐛 Found a bug: GitHub Issues
- 💬 Questions: GitHub Discussions
- 🛠️ Advanced: See DEVELOPER.md

---

**That's it! Start tracking your tasks! 🚀**
