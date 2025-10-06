# Einfache Tag-Übersicht für Task Heatmap

## 🏷️ Übersicht

Das Task Heatmap Plugin unterstützt jetzt eine einfache Tag-Sammlung, die alle Hashtags aus den Tasks automatisch erfasst und unter der Heatmap anzeigt.

## 🚀 Funktionen

### 1. Automatische Tag-Erkennung
- **Hashtag-Extraktion**: Alle `#tags` aus Task-Text werden automatisch erkannt
- **Einfache Sammlung**: Tags werden alphabetisch sortiert angezeigt
- **Keine Verwaltung nötig**: Tags erscheinen automatisch, wenn sie in Tasks verwendet werden

### 2. Tag-Anzeige unter Tasks
- **Inline-Tags**: Tags werden direkt unter jedem Task angezeigt
- **Konsistente Formatierung**: Einheitliches Design für alle Tags
- **Kompakte Darstellung**: Kleine, lesbare Tag-Badges

### 3. Tag-Übersicht
- **Sammlung aller Tags**: Zeigt alle verwendeten Tags in einer Übersicht
- **Klickbare Tags**: Einfache Interaktion (Logging für zukünftige Features)
- **Automatische Updates**: Neue Tags erscheinen sofort

## 🔧 Verwendung

### Tags in Tasks verwenden
Fügen Sie einfach Hashtags in Ihre Tasks ein:

```markdown
## Tasks
- [x] Morning workout #health #fitness
- [ ] Review code #work #development  
- [x] Buy groceries #personal #shopping
- [ ] Call mom #family
- [x] Study German #learning #language
```

### Was passiert automatisch:
1. **Tag-Extraktion**: Alle `#word` Patterns werden als Tags erkannt
2. **Task-Anzeige**: Tags erscheinen als kleine Badges unter jedem Task
3. **Übersicht**: Alle Tags werden in der Tag-Sammlung angezeigt
4. **Sortierung**: Tags werden alphabetisch sortiert

## 📊 Tag-Format

### Unterstützte Zeichen:
- Buchstaben: `a-z`, `A-Z`
- Zahlen: `0-9`
- Sonderzeichen: `_`, `-`

### Beispiele:
- `#work` ✅
- `#health-fitness` ✅
- `#project_2024` ✅
- `#learning` ✅

## 🎨 Anpassungen

### Einstellungen verfügbar:
- `showTagOverview`: Tag-Übersicht anzeigen/verstecken
- `tagOverviewTitle`: Titel der Tag-Übersicht (Standard: "Tags")

### CSS-Styling:
- Tags unter Tasks: Kleine, blaue Badges
- Tag-Sammlung: Interaktive, größere Tag-Buttons
- Hover-Effekte: Scale-Animation bei Hover

## 🎯 Vorteile

### Einfachheit:
- **Keine Konfiguration**: Tags funktionieren sofort
- **Automatisch**: Keine manuelle Verwaltung nötig
- **Intuitiv**: Bekannte Hashtag-Syntax

### Performance:
- **Schnell**: Einfache Regex-basierte Extraktion
- **Effizient**: Minimaler Overhead
- **Responsive**: Sofortiges Update bei Änderungen

### Flexibilität:
- **Beliebige Tags**: Keine vordefinierte Tag-Liste
- **Dynamisch**: Tags kommen und gehen automatisch
- **Erweiterbar**: Basis für zukünftige Features

## 💡 Beispiel-Setup

### 1. Daily Note erstellen:
```markdown
# Daily Note - 06-Oct-2025

## Tasks
- [x] Morning workout #health #fitness
- [ ] Review code #work #development
- [x] Buy groceries #personal #shopping
- [ ] Call mom #family
```

### 2. Ergebnis:
- **Task-Anzeige**: Jeder Task zeigt seine Tags als kleine Badges
- **Tag-Sammlung**: Zeigt: `#development`, `#family`, `#fitness`, `#health`, `#personal`, `#shopping`, `#work`
- **Interaktiv**: Klick auf Tags für zukünftige Funktionen

## 🔄 Migration

Falls Sie bereits Hashtags in Ihren Tasks verwenden:
- **Sofort verfügbar**: Alle existierenden Tags werden automatisch erkannt
- **Keine Änderungen nötig**: Bestehende Notes funktionieren direkt
- **Rückwärtskompatibel**: Keine Breaking Changes

Das System ist bewusst einfach gehalten und fokussiert auf die Kernfunktionalität: Tags sammeln und anzeigen, ohne komplexe Verwaltung oder Konfiguration.