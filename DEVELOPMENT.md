# 🏗️ DreamMall NOSTR Client - Entwicklungsdokumentation

## 📋 Projekt-Übersicht

### Aktueller Stand
Der DreamMall NOSTR Client ist ein moderner, sicherer NOSTR-Client mit folgenden **bereits implementierten** Features:

✅ **Fertig implementiert:**
- Öffentliche Räume (NIP-28)
- Private Gruppen (NIP-104) 
- Grundlegende Schlüsselverwaltung
- Relay-Management
- Zentrale Konfiguration (`app-config.js`)
- Chat-Interface mit Nachrichten-Historie
- Toast-Benachrichtigungen

### Geplante Erweiterungen

🚧 **In Entwicklung / Planung:**
- **Direktnachrichten** zwischen Benutzern (NIP-04/NIP-17)
- **Gruppen-Einladungen** per Direktnachricht
- **Profilübersicht** mit Benutzerinformationen
- **Erweiterte Relay-Verwaltung** 
- **Zentrales Store-Management**

## 🔐 Sicherheitsregeln (NICHT VERHANDELBAR)

### Grundprinzipien
1. **Private Schlüssel bleiben IMMER lokal** - niemals im Klartext übertragen
2. **Schlüssel verlassen NIEMALS den Computer** des Benutzers
3. **Höchste Sicherheitsstandards** für NOSTR-Protokoll
4. **Volle Transparenz** über lokale Datenspeicherung
5. **Keine Server-seitige Datenspeicherung**

### Implementierung
- Web Crypto API für alle kryptographischen Operationen
- LocalStorage nur für verschlüsselte Daten
- Benutzer kann alle lokalen Daten einsehen und löschen

## 🏗️ Architektur-Entscheidungen

### Technologie-Stack
- **Frontend:** Vanilla JavaScript (ES6+) - **behalten, funktioniert gut**
- **Alternative:** Vue.js Framework nur wenn **signifikante Effizienzsteigerung**
- **Build-Tool:** Vite 4.5.0
- **NOSTR Library:** nostr-tools v2.15.0

### Verzeichnisstruktur (Aktuell sauber)
```
src/
├── components/          # UI-Komponenten
├── config/              # Zentrale Konfiguration
├── services/            # Business-Logic
├── nips/               # NOSTR-Protokoll-Implementierungen
└── styles/             # Styling
```

## ✅ **Bereits implementierte UI-Komponenten (KOMPLETT VORHANDEN):**

### 🎨 **Haupt-UI-Komponenten:**
```javascript
// ChatComponentRefactored.js (35KB) - Vollständiges Chat-Interface
export class ChatComponentRefactored {
    // ✅ Sidebar mit Tabs (Räume/DMs/Private Gruppen)
    // ✅ Chat-Bereich mit Nachrichten-Historie
    // ✅ Eingabe-Bereich mit Emoji-Support
    // ✅ DM-Tab mit Kontaktliste
    // ✅ Private Gruppen-Verwaltung
    // ✅ Gruppen-Erstellung Modal
    // ✅ Benutzer-Einladungs-System
}

// HeaderComponent.js - App-Header mit Navigation
// SetupComponent.js - Schlüssel-Setup-Interface
```

### 🔧 **Modal-System (VOLLSTÄNDIG IMPLEMENTIERT):**
```javascript
// ui/ModalComponent.js - Wiederverwendbare Modal-Dialoge
export class ModalComponent {
    create({ title, body, buttons, closable, className }) {
        // ✅ Vollständiges Modal-System
        // ✅ Auto-Focus auf Input-Felder
        // ✅ Escape-Key-Handling
        // ✅ Overlay-Management
    }
    
    createForm({ title, fields, onSubmit }) {
        // ✅ Formular-Modals
        // ✅ Validierung
        // ✅ Submit-Handling
    }
}

// Bereits verwendete Modals:
// ✅ Gruppen-Erstellung Modal (ChatComponentRefactored.js)
// ✅ Raum-Verwaltung Modal (ui/RoomManagerComponent.js)
// ✅ Einstellungen Modal (SettingsModal.js)
```

### ⚙️ **Einstellungen & Konfiguration (KOMPLETT FERTIG):**
```javascript
// SettingsModal.js - Vollständige Einstellungs-Verwaltung
export class SettingsModal {
    // ✅ 🔑 Schlüssel-Verwaltung
    //     - Öffentlicher Schlüssel anzeigen
    //     - Privater Schlüssel (verschleiert)
    //     - Exportieren/Importieren
    //     - Schlüssel löschen
    // ✅ 🎨 Darstellung
    //     - Theme-Auswahl (Hell/Dunkel/Auto)
    //     - UI-Einstellungen
    // ✅ 📡 Relay-Einstellungen
    // ✅ 🔔 Benachrichtigungen
}

// SettingsComponent.js - Erweiterte Einstellungen
```

### 🌐 **Relay-Verwaltung (VOLLSTÄNDIG IMPLEMENTIERT):**
```javascript
// RelayManager.js - Professionelle Relay-Verwaltung
export class RelayManager {
    // ✅ 📡 Aktive Relays anzeigen
    //     - Verbindungsstatus
    //     - Latenz-Anzeige
    //     - Relay-Info (NIP-11)
    // ✅ ➕ Neuen Relay hinzufügen
    //     - URL-Validierung
    //     - Verbindungstest
    // ✅ 📊 Relay-Statistiken
    //     - Verbundene Relays
    //     - Durchschnittliche Latenz
    //     - Nachrichtenstatistiken
    // ✅ 🗑️ Relay entfernen
    // ✅ 🔧 Relay-Einstellungen
}
```

### 🏠 **Raum-Verwaltung (VOLLSTÄNDIG IMPLEMENTIERT):**
```javascript
// ui/RoomManagerComponent.js - Raum-Management
export class RoomManagerComponent {
    // ✅ 🏠 Öffentliche Räume
    //     - Raum-Liste anzeigen
    //     - Raum beitreten
    //     - Raum erstellen
    // ✅ 🔐 Private Gruppen
    //     - Gruppen-Liste
    //     - Gruppen erstellen
    //     - Einladungen verwalten
    // ✅ 📝 Raum-Erstellung Modal
    //     - Name, Beschreibung
    //     - Typ-Auswahl
    //     - Icon-Auswahl
    // ✅ 🔗 Raum beitreten Modal
    //     - Raum-Code/Tag eingeben
    //     - Einladungs-Links
}
```

### 💬 **Chat-Typen (ALLE IMPLEMENTIERT):**
```javascript
// In ChatComponentRefactored.js bereits implementiert:

// ✅ 🌍 Öffentliche Räume (NIP-28)
//     - Tag-basierte Nachrichten
//     - Öffentlich sichtbar
//     - Themen-Diskussionen

// ✅ 🔐 Private Gruppen (NIP-104)
//     - Verschlüsselte Gruppenchats
//     - Owner-basierte Verwaltung
//     - Mitglieder-Einladungen

// ✅ 💬 Direktnachrichten (NIP-04/NIP-17)
//     - Verschlüsselte 1:1 Kommunikation
//     - DM-Tab mit Kontaktliste
//     - Nachrichtenhistorie

// ✅ 🔔 Benachrichtigungen
//     - Toast-Benachrichtigungen
//     - Neue Nachrichten
//     - Einladungen
```

### 👥 **Kontakte-Verwaltung (IMPLEMENTIERT):**
```javascript
// In ChatComponentRefactored.js + NIP02_ContactLists.js:

// ✅ 📋 Kontaktliste
//     - DM-Kontakte anzeigen
//     - Kontakte hinzufügen/entfernen
//     - Profil-Informationen

// ✅ 👤 Benutzer-Profile
//     - Profil-Anzeige
//     - Avatar-Support
//     - Benutzer-Informationen

// ✅ 🔍 Kontakt-Suche
//     - Nach Pubkey suchen
//     - Nach Namen suchen
//     - Kontakt-Vorschläge
```

### 🎯 **Übersichten & Dashboards (VORHANDEN):**
```javascript
// ✅ 📊 Hauptübersicht (ChatComponentRefactored.js)
//     - Sidebar mit allen Bereichen
//     - Aktive Räume/DMs/Gruppen
//     - Benutzer-Status

// ✅ 🔑 Schlüssel-Übersicht (SettingsModal.js)
//     - Schlüssel-Status
//     - Sicherheitsinformationen
//     - Backup-Optionen

// ✅ 📡 Relay-Übersicht (RelayManager.js)
//     - Verbindungsstatus
//     - Performance-Metriken
//     - Netzwerk-Gesundheit

// ✅ 💬 Chat-Übersicht
//     - Nachrichtenhistorie
//     - Ungelesene Nachrichten
//     - Chat-Statistiken
```

### 🎨 **UI-Features (VOLLSTÄNDIG IMPLEMENTIERT):**
```javascript
// ✅ 🎭 Theme-System
//     - Hell/Dunkel-Modus
//     - Automatische Erkennung
//     - Benutzer-Präferenzen

// ✅ 📱 Responsive Design
//     - Mobile-optimiert
//     - Desktop-Layout
//     - Adaptive Sidebar

// ✅ 🔔 Toast-System (ToastService.js)
//     - Erfolgs-Meldungen
//     - Fehler-Meldungen
//     - Fortschritts-Anzeigen

// ✅ ⌨️ Keyboard-Navigation
//     - Hotkeys
//     - Tab-Navigation
//     - Accessibility
```

## 🔧 **Verbindungspunkte (Was zusammengefügt werden muss):**

### 1. **Modal-System aktivieren**
```javascript
// Bereits importiert in ChatComponentRefactored.js:
import { ModalComponent } from './ui/ModalComponent.js';
// TODO: Weitere Modals für DM-Start, Profil-Bearbeitung
```

### 2. **Einstellungen-Modal verbinden**
```javascript
// In UIManager.js bereits vorhanden:
<button id="settingsBtn" class="btn btn-secondary">⚙️ Einstellungen</button>
// TODO: Event-Listener für SettingsModal hinzufügen
```

### 3. **Relay-Manager aktivieren**
```javascript
// RelayManager.js ist fertig implementiert
// TODO: In Hauptnavigation integrieren
```

### 4. **Kontakte-System aktivieren**
```javascript
// NIP02_ContactLists.js ist implementiert
// TODO: Mit DM-Tab in ChatComponentRefactored.js verbinden
```

## 🗂️ Zentrales Store-Management

### Geplante Struktur
```javascript
// Zentraler State Store
class AppStore {
  constructor() {
    this.state = {
      user: null,
      messages: new Map(),
      groups: new Map(),
      relays: new Map(),
      settings: {}
    };
  }
  
  // Reactive Updates
  subscribe(component, callback) {
    // Component-Updates bei State-Änderungen
  }
  
  // Actions
  dispatch(action, payload) {
    // Zentralisierte State-Änderungen
  }
}
```

## 📊 Datenfluss-Architektur

### Nachrichtenverwaltung
```
User Input → Component → Service → NOSTR Protocol → Relays
                ↓
Local Storage ← Store ← Event Processing ← Relay Response
```

### Schlüsselverwaltung
```
User → KeyService → Web Crypto API → Local Encrypted Storage
                      ↓
                 Never leaves client
```

## 🧪 Test-Strategie

### Relay-Konfiguration für Tests
```javascript
// In app-config.js
export const TEST_CONFIG = {
  primaryRelay: 'wss://relay.damus.io', // Haupt-Test-Relay
  backupRelays: [
    'wss://relay.nostr.band',
    'wss://nos.lol'
  ]
};
```

### Test-Szenarien
1. **Öffentliche Räume** - Funktionieren bereits
2. **Private Gruppen** - Funktionieren bereits  
3. **Direktnachrichten** - Implementierung erforderlich
4. **Gruppen-Einladungen** - Implementierung erforderlich

## 🔄 Entwicklungsworkflow

### Phase 1: Direktnachrichten (Nächster Schritt)
1. NIP-04 Service implementieren
2. DM-UI-Komponente erstellen
3. Verschlüsselung/Entschlüsselung lokal
4. Integration in ChatComponent

### Phase 2: Gruppen-Einladungen
1. Einladungs-Service implementieren
2. Einladungs-UI erstellen
3. DM-Integration für Einladungen
4. Gruppen-Mitgliederverwaltung

### Phase 3: Store-Management
1. Zentralen Store implementieren
2. Components auf Store umstellen
3. State-Persistierung
4. Performance-Optimierung

## 📚 Referenzen & Inspiration

### NOSTR-Clients zum Studium
- [Damus](https://github.com/damus-io/damus) - iOS/macOS Client
- [Amethyst](https://github.com/vitorpamplona/amethyst) - Android Client
- [Coracle](https://github.com/coracle-social/coracle) - Web Client
- [Snort](https://github.com/v0l/snort) - React Web Client

### Technische Ressourcen
- [NOSTR NIPs](https://github.com/nostr-protocol/nips)
- [Awesome NOSTR](https://github.com/aljazceru/awesome-nostr)
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools)

## 🎯 Erfolgskriterien

### Technische Ziele
- [ ] Alle NIPs korrekt implementiert
- [ ] Sichere Schlüsselverwaltung
- [ ] Performante Relay-Kommunikation
- [ ] Intuitive Benutzeroberfläche

### Benutzer-Erfahrung
- [ ] Einfache Einrichtung
- [ ] Klare Datenschutz-Informationen
- [ ] Zuverlässige Nachrichtenübertragung
- [ ] Responsive Design

## 🚧 Aktuelle Baustellen

### Technische Schulden
- ✅ Dubletten entfernt
- ✅ Zentrale Konfiguration
- 🔄 Store-Management fehlt noch
- 🔄 Direktnachrichten-Implementation

### Nächste Schritte
1. **Direktnachrichten implementieren** (NIP-04)
2. **Gruppen-Einladungen** via DM
3. **Store-Management** einführen
4. **Profilübersicht** erstellen

---

**Wichtig:** Dieses Dokument dient als Leitfaden für die strukturierte Weiterentwicklung. Der bestehende, funktionierende Code soll **nicht umgebaut** werden - nur erweitert und optimiert.
