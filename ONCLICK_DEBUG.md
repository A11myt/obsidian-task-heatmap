# 🔍 onClick Debug Guide

## 📋 Was wurde geändert:

### 1. **Alle Zellen sind jetzt klickbar**
- Früher: Nur Zellen mit `hasNote: true`
- Jetzt: **ALLE** Zellen haben onClick Handler
- Cursor ist immer `pointer`

### 2. **Erweiterte Console Logs**
Öffne die **Developer Console** in Obsidian (`Ctrl+Shift+I`) und schau nach diesen Logs:
```
Task Heatmap: Cell clicked for date: 2025-10-03
Task Heatmap: Looking for note with dateStr: 2025-10-03
Task Heatmap: Notes folder: Notes
Task Heatmap: Total files found: 42
Task Heatmap: Found date file: 03-Oct-2025.md -> dateStr: 2025-10-03
Task Heatmap: Opening file: Notes/03-Oct-2025.md
```

### 3. **Robuste Notiz-Suche**
- Sucht in Notes folder UND Subfoldern
- Funktioniert auch wenn `notesFolder` leer ist
- **Fallback**: Erstellt neue Notiz wenn keine existiert

### 4. **Auto-Create Feature**
Wenn keine Notiz existiert:
- Erstellt automatisch `DD-MMM-YYYY.md`
- Mit Basis-Inhalt: `# 03-Oct-2025`
- Öffnet die neue Notiz direkt

## 🧪 Testing Steps:

### Schritt 1: Console öffnen
1. In Obsidian: `Ctrl+Shift+I` (Developer Tools)
2. Gehe zum **Console** Tab
3. Klicke auf eine Zelle in der Task Heatmap

### Schritt 2: Debug Logs prüfen
Du solltest sehen:
```
Task Heatmap: Cell clicked for date: YYYY-MM-DD
Task Heatmap: Looking for note with dateStr: YYYY-MM-DD
Task Heatmap: Notes folder: [YOUR_FOLDER]
```

### Schritt 3: Check Settings
1. Gehe zu Settings → Heatmap Calendar
2. Prüfe "Notes Folder" Setting
3. Typische Werte:
   - `Notes` (wenn deine Daily Notes in Notes/ folder sind)
   - `` (leer, wenn sie im root sind)
   - `Daily Notes` (wenn custom folder)

## 🚨 Häufige Probleme:

### Problem: "No matching file found"
**Lösung**: 
- Check ob Daily Notes format stimmt: `03-Oct-2025.md`
- Check Notes Folder Setting
- Plugin sollte automatisch neue Notiz erstellen

### Problem: Clicks werden nicht registriert
**Lösung**:
- Console Logs checken
- Plugin neu laden (Settings → disable/enable)
- Browser refresh (`Ctrl+R`)

### Problem: Falsche Datei wird geöffnet
**Lösung**:
- Check Date Format in Console Logs
- Stelle sicher dass Files `DD-MMM-YYYY.md` heißen

## ✅ Erfolgreicher Test:

1. **Klick auf Zelle** → Console Log erscheint
2. **Notiz öffnet sich** → Entweder existierende oder neue
3. **Kein Error** → Smooth operation

## 🛠️ Falls immer noch nicht funktioniert:

Poste die **Console Logs** von einem Click-Versuch, dann kann ich das spezifische Problem identifizieren!

Das onClick sollte jetzt definitiv funktionieren! 🎯