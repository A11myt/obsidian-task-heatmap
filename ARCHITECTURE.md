# Projektstruktur - Heatmap Calendar Plugin

## 📁 Ordnerstruktur

```
obsidian-heatmap-plugin/
├── src/                          # Haupt-Quellcode
│   ├── main.ts                   # Plugin Entry Point
│   ├── settings/                 # Settings-bezogener Code
│   │   ├── settings.ts           # Settings Interface & Defaults
│   │   └── settingsTab.ts        # Settings UI Tab
│   ├── views/                    # View-Komponenten
│   │   └── heatmapView.ts        # Sidebar Heatmap View
│   ├── renderer/                 # Rendering-Logik
│   │   └── heatmapRenderer.ts    # Heatmap Render Engine
│   └── utils/                    # Hilfsfunktionen
│       └── codeBlockParser.ts    # Code-Block Options Parser
├── styles.css                    # Plugin Styles
├── manifest.json                 # Plugin Manifest
├── package.json                  # NPM Dependencies
├── tsconfig.json                 # TypeScript Config
└── esbuild.config.mjs            # Build Config

```

## 🎯 Datei-Verantwortlichkeiten

### `src/main.ts`
- Plugin Entry Point
- Registriert Views, Commands, Settings
- Koordiniert die Hauptfunktionalität
- Code-Block Processor Registration

### `src/settings/`
**settings.ts**
- Interface-Definitionen für alle Settings
- Default-Werte
- Farbschema-Definitionen (COLOR_SCHEMES)

**settingsTab.ts**
- UI für Settings-Panel
- Alle Setting-Controls (Toggles, Dropdowns, Inputs)
- Reaktive Settings-Updates

### `src/views/`
**heatmapView.ts**
- ItemView-Implementation für Sidebar
- View Lifecycle (onOpen, onClose, refresh)
- Delegiert Rendering an HeatmapRenderer

### `src/renderer/`
**heatmapRenderer.ts**
- Komplette Rendering-Logik
- Datensammlung (collectNoteDates)
- Datumsberechnung (calculateDateRange)
- UI-Komponenten:
  - Year Labels
  - Weekday Labels
  - Grid (Heatmap Zellen)
  - Legend

### `src/utils/`
**codeBlockParser.ts**
- Parst Code-Block Optionen
- Konvertiert String-Werte in richtige Typen
- Validierung von Eingaben

## 🔄 Datenfluss

```
1. User Action (Settings ändern / Code-Block einfügen)
   ↓
2. main.ts (koordiniert)
   ↓
3. HeatmapRenderer (sammelt Daten + rendert)
   ↓
4. DOM (Heatmap wird angezeigt)
```

## 🛠️ Wartung

### Neue Einstellung hinzufügen:
1. **settings.ts**: Interface + Default erweitern
2. **settingsTab.ts**: UI-Control hinzufügen
3. **heatmapRenderer.ts**: Logik implementieren
4. **codeBlockParser.ts**: Parsing hinzufügen (falls Code-Block Support)

### Neues Feature hinzufügen:
1. Überlege, wo es hingehört (view/renderer/utils)
2. Erstelle ggf. neue Datei im passenden Ordner
3. Importiere in main.ts
4. Registriere in onload()

### Bug fixen:
1. Identifiziere betroffene Komponente
2. Nur relevante Datei(en) ändern
3. Isolierte Tests möglich

## ✅ Vorteile der neuen Struktur

- ✨ **Separation of Concerns**: Jede Datei hat eine klare Verantwortung
- 🔍 **Leichter zu finden**: Logische Gruppierung nach Funktion
- 🧪 **Testbar**: Einzelne Module können isoliert getestet werden
- 📦 **Skalierbar**: Neue Features einfach hinzuzufügen
- 🤝 **Team-freundlich**: Mehrere Entwickler können parallel arbeiten
- 🐛 **Wartbar**: Bugs sind leichter zu lokalisieren und zu fixen

## 🚀 Build & Development

Keine Änderungen nötig! Die Build-Commands bleiben gleich:

```bash
npm run dev      # Watch-Modus
npm run build    # Production Build
```

Die neue Struktur wird automatisch vom Build-System erkannt.
