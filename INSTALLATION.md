# 📦 Installation - Task Heatmap mit Speziellen Tags

## 🎯 Übersicht
Diese Version des Task Heatmap Plugins enthält die neue **Spezielle Tags** Funktionalität mit benutzerdefinierten Farben.

## 🚀 Installations-Optionen

### Option 1: Manuelle Installation (Empfohlen)

1. **ZIP-Datei verwenden**: `obsidian-task-heatmap-special-tags.zip`

2. **Obsidian Plugin-Ordner finden**:
   - Windows: `%APPDATA%\Obsidian\plugins\`
   - macOS: `~/Library/Application Support/obsidian/plugins/`
   - Linux: `~/.config/obsidian/plugins/`

3. **Installation durchführen**:
   ```bash
   # Neuen Ordner erstellen
   mkdir "obsidian-task-heatmap"
   
   # ZIP entpacken in den Ordner
   # Dateien sollten direkt im Plugin-Ordner liegen:
   # - main.js
   # - manifest.json
   - styles.css
   ```

4. **Obsidian neustarten**

5. **Plugin aktivieren**:
   - Settings → Community Plugins
   - "Task Heatmap" finden und aktivieren

### Option 2: Entwicklungs-Installation

Wenn Sie das Plugin aus dem Quellcode installieren möchten:

```bash
# In Ihr Obsidian Plugins Verzeichnis navigieren
cd "C:\Users\[IhrName]\AppData\Roaming\Obsidian\plugins"

# Repository klonen
git clone https://github.com/A11myt/obsidian-task-heatmap.git

# In das Plugin-Verzeichnis wechseln
cd obsidian-task-heatmap

# Dependencies installieren
npm install

# Plugin bauen
npm run build
```

## ⚙️ Nach der Installation

### 1. Plugin aktivieren
- Obsidian → Settings → Community Plugins
- "Task Heatmap" aktivieren

### 2. Spezielle Tags konfigurieren
- Settings → Task Heatmap → "Spezielle Tags"
- Standard-Tags sind bereits vorkonfiguriert:
  - `#urlaub` (🔴 Rot)
  - `#wichtig` (🟡 Gelb) 
  - `#arbeit` (🟢 Grün)

### 3. Heatmap-View öffnen
- Command Palette (Ctrl+P) → "Open Task Heatmap"
- Oder über das Ribbon-Icon

### 4. Daily Notes mit Tags erstellen
```markdown
# Daily Note - 06-Oct-2025

## Tasks
- [x] Morning workout #gesundheit
- [ ] Vacation planning #urlaub #wichtig
- [x] Finish project #arbeit #deadline
- [ ] Call mom #family #wichtig
```

## ✨ Neue Features nutzen

### Spezielle Tags verwalten:
1. **Settings → Task Heatmap → Spezielle Tags**
2. **Neuen Tag hinzufügen**:
   - Name eingeben (ohne #)
   - Farbe auswählen
   - "Hinzufügen" klicken
3. **Bestehende Tags bearbeiten**:
   - Farbe ändern durch Klick auf Farbfeld
   - Tags aktivieren/deaktivieren
   - Tags löschen mit 🗑️ Button

### Ergebnis:
- Spezielle Tags werden in ihren definierten Farben angezeigt
- Automatische Kontrast-Optimierung für beste Lesbarkeit
- Normale Tags behalten die Standard-Theme-Farbe

## 🔧 Troubleshooting

### Plugin erscheint nicht in der Liste:
- Sicherstellen, dass alle 3 Dateien im Plugin-Ordner sind
- Obsidian vollständig neustarten
- Community Plugins aktiviert haben

### Tags werden nicht farbig angezeigt:
- Plugin aktiviert und Heatmap-View geöffnet
- Spezielle Tags in den Einstellungen konfiguriert
- Tags mit # in Daily Notes verwenden

### Build-Fehler:
```bash
# Dependencies neu installieren
npm ci
npm run build
```

## 📁 Datei-Struktur nach Installation

```
obsidian-task-heatmap/
├── main.js          # Haupt-Plugin-Code
├── manifest.json    # Plugin-Metadaten
└── styles.css       # Plugin-Styling
```

## 🎉 Fertig!

Nach der Installation haben Sie:
- ✅ GitHub-Style Task Heatmap
- ✅ Spezielle Tags mit benutzerdefinierten Farben
- ✅ Automatische Tag-Erkennung
- ✅ Intuitive Settings-UI
- ✅ Vollständige Daily Notes Integration

Viel Spaß mit Ihrem erweiterten Task Heatmap Plugin! 🚀