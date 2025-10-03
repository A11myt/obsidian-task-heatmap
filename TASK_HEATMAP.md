# Task Heatmap Feature - Verbessert! ✅

## 🎯 Was ist die Task Heatmap?

Die Task Heatmap visualisiert deine **Produktivität und Dokumentation** in einer GitHub-Style Heatmap. Sie analysiert alle deine Daily Notes und zeigt dir:

- 📝 **Hellgrün**: Dokument erstellt (auch ohne Tasks)
- ✅ **Dunkelgrün**: Tasks erledigt (je mehr, desto dunkler)
- 📊 Deine Task-Completion-Rate als Farbintensität
- 🔥 Deine produktivsten Tage auf einen Blick

## 🚀 Wie verwende ich die Task Heatmap?

### 1. Task Heatmap öffnen
- **Ribbon Icon**: Klick auf das ✓ Symbol in der linken Sidebar
- **Command Palette**: `Ctrl+P` → "Open Task Heatmap Calendar"

### 2. In Markdown Code-Blocks verwenden
```markdown
\`\`\`heatmap
type: tasks
folder: Daily Notes
year: 2024
showLegend: true
\`\`\`
```

## 📝 Task-Format in deinen Notizen

Die Task Heatmap erkennt automatisch Checkboxen in diesem Format:

```markdown
- [ ] Unerledigte Aufgabe
- [x] Erledigte Aufgabe  
- [X] Auch erledigte Aufgabe (großes X)
```

**Beispiel Daily Note (01-Jan-2025.md):**
```markdown
# Daily Tasks

## Today's Goals
- [x] Morgenroutine erledigen
- [x] Projekt X weiterarbeiten  
- [ ] E-Mails beantworten
- [x] Sport machen
- [ ] Einkaufen gehen

## Meeting Notes
- [x] Team Meeting um 10:00
- [x] Notizen zusammenfassen
```

→ **Ergebnis**: 4/6 Tasks erledigt = intensive Farbe in der Heatmap!

## 🎨 Farbkodierung

Die Task Heatmap verwendet verschiedene Farbintensitäten für **maximale Motivation**:

- **Grau**: Kein Dokument erstellt
- **Hellgrün**: Dokument erstellt (mit oder ohne Tasks)
- **Mittelgrün**: 1-25% der Tasks erledigt
- **Dunkelgrün**: 26-50% der Tasks erledigt  
- **Sehr dunkelgrün**: 51-100% der Tasks erledigt

**Wichtig**: Selbst wenn du nur ein Dokument ohne Tasks erstellst, wird der Tag hellgrün - das motiviert zur täglichen Dokumentation!

## ⚙️ Code-Block Optionen

Du kannst die Task Heatmap in Markdown mit diesen Optionen anpassen:

```markdown
\`\`\`heatmap
type: tasks                          # Wichtig: Aktiviert Task-Modus
folder: Daily Notes                  # Ordner mit deinen Daily Notes
taskTitle: My Custom Task Title      # Eigener Titel für Task Heatmap
year: 2024                          # Bestimmtes Jahr anzeigen
showYears: true                     # Jahr-Labels anzeigen
showWeekdays: true                  # Wochentag-Labels anzeigen
colorScheme: blue                   # Farbschema (green, blue, purple, red, orange)
cellSize: 12                        # Zellgröße in Pixeln
showLegend: true                    # Farblegende anzeigen
showTotal: true                     # Gesamt-Statistik anzeigen
\`\`\`

## 🔄 Notes vs Tasks Heatmap

**Notes Heatmap** (Standard):
- Zeigt an, an welchen Tagen du Notizen geschrieben hast
- Ein/Aus: Notiz vorhanden oder nicht

**Task Heatmap** (Neu):
- Zeigt an, wie produktiv du warst
- Graduelle Intensität: Basierend auf erledigten Tasks

## 📊 Statistiken

Die Task Heatmap zeigt dir:
- **Tooltip (mit Tasks)**: "15. Jan 2025 - 4/6 tasks completed"
- **Tooltip (ohne Tasks)**: "15. Jan 2025 - Note created (no tasks)"
- **Legende**: Farb-Intensitätsskala
- **Total**: "Total: 245/320 tasks completed"
- **Settings**: Separate Titel für Notes und Task Heatmaps konfigurierbar

## 🛠️ Technische Details

- **Erkennt**: `- [x]`, `- [X]`, `* [x]`, `* [X]`
- **Funktioniert mit**: Beliebiger Einrückung/Verschachtelung
- **Performance**: Liest nur Dateien im konfigurierten Ordner
- **Caching**: Effiziente Berechnung für große Vault-Sammlungen

## 🎉 Nutzen

Die Task Heatmap hilft dir:
- **Produktivitätsmuster** zu erkennen
- **Streak-Building** - halte deine Produktivität aufrecht
- **Motivation** durch visuelle Fortschritte
- **Reflexion** über produktive vs. weniger produktive Phasen

---

**Die Task Heatmap ist jetzt wieder da! 🎊**

Nutze beide Heatmaps parallel:
- 📝 **Notes Heatmap**: Zeigt deine Schreibkonsistenz
- ✅ **Task Heatmap**: Zeigt deine Produktivität