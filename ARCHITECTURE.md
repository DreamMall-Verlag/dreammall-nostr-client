# NOSTR Chat - Modulare Architektur

## Übersicht

Diese refaktorierte Version des NOSTR Chats folgt dem Prinzip der modularen Architektur. Jede Komponente hat einen klaren Zweck und ist eigenständig testbar und wartbar.

## Architektur

### 📁 src/nips/ - NIP-spezifische Module

Jedes NOSTR Improvement Proposal (NIP) wird als eigenständiges Modul implementiert:

#### NIP01_BasicProtocol.js
- **Zweck**: Grundlegende NOSTR-Protokoll-Operationen
- **Funktionen**:
  - Event-Erstellung und -Validierung
  - Event-Signierung
  - REQ-Subscriptions
  - EVENT-Publishing
- **Verwendung**: Basis für alle anderen NIPs

#### NIP04_EncryptedDMs.js
- **Zweck**: Verschlüsselte Direktnachrichten
- **Funktionen**:
  - Nachrichtenverschlüsselung/-entschlüsselung
  - DM-Subscriptions
  - Konversationshistorie
- **Abhängigkeiten**: NIP01_BasicProtocol

#### NIP28_PublicChat.js
- **Zweck**: Öffentliche Chat-Kanäle
- **Funktionen**:
  - Kanal-Erstellung
  - Kanal-Nachrichten
  - Raum-basierte Nachrichten (Fallback)
- **Abhängigkeiten**: NIP01_BasicProtocol

### 📁 src/components/ui/ - UI-Komponenten

Wiederverwendbare UI-Elemente ohne NOSTR-spezifische Logik:

#### ModalComponent.js
- **Zweck**: Modulare Dialog-Erstellung
- **Funktionen**:
  - Basis-Modals
  - Formular-Modals
  - Bestätigungs-Dialoge
  - Alert-Dialoge

#### RoomManagerComponent.js
- **Zweck**: Raum-Verwaltung
- **Funktionen**:
  - Raum-Listen rendern
  - Raum-Erstellung/-Beitritt
  - Zugriffskontrolle
- **Abhängigkeiten**: ModalComponent

### 📁 src/components/ - Hauptkomponenten

#### ChatComponentRefactored.js
- **Zweck**: Haupt-Chat-Interface
- **Funktionen**:
  - Orchestriert alle Module
  - Event-Handling
  - State-Management
- **Abhängigkeiten**: Alle NIP-Module und UI-Komponenten

## Vorteile der modularen Architektur

### ✅ Wartbarkeit
- Kleine, überschaubare Module
- Klare Verantwortlichkeiten
- Einfache Fehlerbehebung

### ✅ Testbarkeit
- Module können isoliert getestet werden
- Mocking von Abhängigkeiten möglich
- Unit-Tests für jede Komponente

### ✅ Wiederverwendbarkeit
- NIP-Module in anderen Projekten nutzbar
- UI-Komponenten projekt-übergreifend
- Klare APIs zwischen Modulen

### ✅ Erweiterbarkeit
- Neue NIPs als Module hinzufügbar
- Bestehende Module erweiterbar
- Feature-Flags pro Modul möglich

## Verwendung

### Basis-Setup
```javascript
import { ChatComponentRefactored } from './components/ChatComponentRefactored.js';

const chat = new ChatComponentRefactored(nostrService, toastService);
const element = chat.render();
document.getElementById('app').appendChild(element);
```

### Neue NIP hinzufügen
1. Erstelle `src/nips/NIPxx_Description.js`
2. Implementiere NIP-spezifische Logik
3. Integriere in `ChatComponentRefactored.js`
4. Erweitere UI falls nötig

### Neue UI-Komponente hinzufügen
1. Erstelle `src/components/ui/ComponentName.js`
2. Implementiere wiederverwendbare Logik
3. Verwende in Hauptkomponenten

## Testing-Strategie

### Unit Tests
- Jedes NIP-Modul einzeln testen
- UI-Komponenten isoliert testen
- Mock-Dependencies verwenden

### Integration Tests
- Module-Zusammenspiel testen
- NOSTR-Event-Flow testen
- UI-Interaktionen testen

### E2E Tests
- Komplette User-Journeys
- Cross-Browser-Kompatibilität
- Performance-Tests

## Performance-Optimierungen

### Code-Splitting
- Lazy-Loading von NIP-Modulen
- Dynamic Imports für Features
- Bundle-Größe minimieren

### Event-Handling
- Subscription-Management
- Memory-Leak-Prevention
- Efficient Re-rendering

## Deployment

### Build-Prozess
1. Module-Bundling mit Vite
2. Tree-Shaking für kleinere Bundles
3. CSS-Optimierung
4. Asset-Minimierung

### CI/CD
1. Automatische Tests
2. Code-Quality-Checks
3. Performance-Monitoring
4. Automated Deployment

## Roadmap

### Phase 1 ✅
- Grundlegende Architektur
- NIP-01, NIP-04, NIP-28 Module
- Basis UI-Komponenten

### Phase 2 🚧
- Zusätzliche NIPs (NIP-02, NIP-25, etc.)
- Advanced UI-Komponenten
- Performance-Optimierungen

### Phase 3 📋
- Plugin-System
- Theme-Support
- Mobile-Optimierung

## Coding Standards

### Naming Conventions
- **NIP-Module**: `NIPxx_Description.js`
- **UI-Komponenten**: `ComponentNameComponent.js`
- **Klassen**: PascalCase
- **Funktionen**: camelCase
- **Konstanten**: UPPER_SNAKE_CASE

### Code-Kommentare
- JSDoc für öffentliche APIs
- Inline-Kommentare für komplexe Logik
- TODO/FIXME für bekannte Issues

### Error Handling
- Try-catch für async Operationen
- Logging mit Kontext
- Graceful Degradation

## Support & Contribution

### Issues
- Nutze GitHub Issues für Bugs
- Feature-Requests mit Use-Cases
- Performance-Probleme mit Profiling-Daten

### Pull Requests
- Ein Feature/Fix pro PR
- Tests für neue Funktionalität
- Dokumentation aktualisieren

### Code Review
- Mindestens ein Reviewer
- Automated Checks müssen bestehen
- Performance-Impact bewerten
