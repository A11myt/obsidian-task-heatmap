# Tag-Management für Task Heatmap

## 🏷️ Übersicht

Das Task Heatmap Plugin unterstützt jetzt erweiterte Tag-Funktionen mit speziellen Tags und benutzerdefinierten Farben, die alle Hashtags aus den Tasks automatisch erfasst und mit Priorität anzeigt.

## 🚀 Funktionen

### 1. Automatische Tag-Erkennung
- **Hashtag-Extraktion**: Alle `#tags` aus Task-Text werden automatisch erkannt
- **Intelligente Sammlung**: Tags werden automatisch kategorisiert
- **Keine Verwaltung nötig**: Tags erscheinen automatisch, wenn sie in Tasks verwendet werden

### 2. Spezielle Tags mit benutzerdefinierten Farben
- **🎨 Farbige Hervorhebung**: Wichtige Tags wie `#urlaub`, `#wichtig` mit eigenen Farben
- **👁️ Bessere Sichtbarkeit**: Spezielle Tags sind auf den ersten Blick erkennbar
- **⚙️ Vollständig konfigurierbar**: Farben und Tags in den Einstellungen anpassbar
- **🔄 Ein-/Ausschaltbar**: Spezielle Tags können aktiviert/deaktiviert werden

### 3. Tag-Anzeige in Tasks
- **🏷️ Inline-Tags**: Tags werden direkt unter jedem Task angezeigt
- **✨ Dynamische Farben**: Spezielle Tags in benutzerdefinierten Farben
- **📊 Prioritätssystem**: Wichtige Tags fallen sofort auf
- **🎯 Kompakte Darstellung**: Kleine, lesbare Tag-Badges

### 4. Einfache Verwaltung
- **🔧 Settings-Integration**: Spezielle Tags direkt in den Plugin-Einstellungen verwalten
- **➕ Schnell hinzufügen**: Neue spezielle Tags mit einem Klick erstellen
- **🎨 Live-Vorschau**: Farben sofort sehen und anpassen
- **🗑️ Einfach löschen**: Nicht mehr benötigte Tags entfernen

## 🔧 Verwendung

### 1. Spezielle Tags konfigurieren
1. **Plugin-Einstellungen öffnen** (Settings → Community Plugins → Task Heatmap)
2. **Abschnitt "Spezielle Tags"** finden
3. **Neue Tags hinzufügen**:
   - Tag-Name eingeben (ohne #, z.B. "urlaub")
   - Farbe auswählen (z.B. rot für wichtige Tags)
   - "Hinzufügen" klicken
4. **Bestehende Tags bearbeiten**:
   - Farbe durch Klick auf das Farbfeld ändern
   - Tags mit Checkbox aktivieren/deaktivieren
   - Tags mit 🗑️ Button löschen

### 2. Tags in Tasks verwenden
Fügen Sie einfach Hashtags in Ihre Tasks ein:

```markdown
## Tasks
- [x] Morning workout #health #fitness
- [ ] Review code #work #development  
- [x] Buy groceries #personal #shopping
- [ ] Call mom #family #wichtig
- [x] Study German #learning #language
- [ ] Vacation planning #urlaub #wichtig
- [x] Finish project #arbeit #deadline
```

### Was passiert automatisch:
1. **Tag-Extraktion**: Alle `#word` Patterns werden als Tags erkannt
2. **Farb-Zuordnung**: Spezielle Tags erhalten automatisch ihre definierten Farben
3. **Task-Anzeige**: Tags erscheinen als farbige Badges unter jedem Task
4. **Prioritäts-Hervorhebung**: Wichtige Tags (wie #urlaub, #wichtig) stechen hervor
5. **Kontrast-Optimierung**: Textfarbe wird automatisch für beste Lesbarkeit gewählt

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

### Verfügbare Einstellungen:
- **`specialTags`**: Array von speziellen Tags mit Farben
  - `name`: Tag-Name (ohne #)
  - `color`: Hex-Farbcode (z.B. #ff6b6b)
  - `enabled`: Tag aktiviert/deaktiviert
- **`showTagOverview`**: Tag-Übersicht anzeigen/verstecken
- **`tagOverviewTitle`**: Titel der Tag-Übersicht (Standard: "Tags")

### Standard spezielle Tags:
- **`#urlaub`**: 🔴 Rot (#ff6b6b) - für Urlaubsplanung
- **`#wichtig`**: 🟡 Gelb (#ffd93d) - für wichtige Tasks
- **`#arbeit`**: 🟢 Grün (#6bcf7f) - für Arbeits-Tasks

### Automatisches Styling:
- **Spezielle Tags**: Benutzerdefinierte Farben mit optimiertem Kontrast
- **Normale Tags**: Standard-Akzentfarbe des Themes
- **Hover-Effekte**: Scale-Animation bei Hover
- **Border-Effekte**: Dunklere Ränder für bessere Abgrenzung

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

### 1. Spezielle Tags konfigurieren:
```typescript
// In den Plugin-Einstellungen
specialTags: [
  { name: 'urlaub', color: '#ff6b6b', enabled: true },     // Rot für Urlaub
  { name: 'wichtig', color: '#ffd93d', enabled: true },    // Gelb für wichtige Tasks
  { name: 'arbeit', color: '#6bcf7f', enabled: true },     // Grün für Arbeit
  { name: 'deadline', color: '#ff9f43', enabled: true },   // Orange für Deadlines
  { name: 'gesundheit', color: '#a55eea', enabled: true }  // Lila für Gesundheit
]
```

### 2. Daily Note erstellen:
```markdown
# Daily Note - 06-Oct-2025

## Tasks
- [x] Morning workout #gesundheit #fitness
- [ ] Review code #arbeit #development
- [x] Buy groceries #personal #shopping
- [ ] Call mom #family #wichtig
- [x] Project deadline #arbeit #deadline #wichtig
- [ ] Book vacation #urlaub #planning
- [x] Doctor appointment #gesundheit #wichtig
```

### 3. Ergebnis im Heatmap:
- **🟣 #gesundheit**: Lila Badges für Gesundheits-Tasks
- **🟢 #arbeit**: Grüne Badges für Arbeits-Tasks  
- **🟡 #wichtig**: Gelbe Badges für wichtige Tasks
- **🔴 #urlaub**: Rote Badges für Urlaubs-Tasks
- **🟠 #deadline**: Orange Badges für Deadline-Tasks
- **Normale Tags**: Standard-Theme-Farbe (z.B. #fitness, #personal)

### 4. Interaktive Features:
- **Hover-Effekte**: Tags vergrößern sich bei Berührung
- **Live-Updates**: Änderungen in Settings sofort sichtbar
- **Ein-Klick-Bearbeitung**: Farben direkt in den Einstellungen ändern
- **Interaktiv**: Klick auf Tags für zukünftige Funktionen

## 🔄 Migration

Falls Sie bereits Hashtags in Ihren Tasks verwenden:
- **Sofort verfügbar**: Alle existierenden Tags werden automatisch erkannt
- **Keine Änderungen nötig**: Bestehende Notes funktionieren direkt
- **Rückwärtskompatibel**: Keine Breaking Changes

Das System ist bewusst einfach gehalten und fokussiert auf die Kernfunktionalität: Tags sammeln und anzeigen, ohne komplexe Verwaltung oder Konfiguration.