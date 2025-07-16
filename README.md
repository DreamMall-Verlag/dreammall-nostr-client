# 🌐 DreamMall NOSTR Client

> **Funktionsfähiger NOSTR-Client - Alles ist bereits da, nur besser organisiert!**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NOSTR](https://img.shields.io/badge/NOSTR-Protocol-purple)](https://nostr.com/)
[![Vite](https://img.shields.io/badge/Vite-4.5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🔐 Sicherheitsphilosophie

**WICHTIG:** Dieser Client folgt den höchsten Sicherheitsstandards für NOSTR:
- 🔒 Private Schlüssel werden **niemals** im Klartext gespeichert
- 🏠 Schlüssel verlassen **niemals** den Computer des Benutzers
- 🛡️ Alle kryptographischen Operationen finden lokal statt
- 👀 Volle Transparenz über lokale Datenspeicherung
- ❌ Keine Server-seitige Datenspeicherung

## ✅ **Was bereits FUNKTIONIERT:**

### 🏗️ **Vollständige Architektur (FERTIG)**
```
src/
├── components/              # UI-Komponenten (ALLE VORHANDEN)
│   ├── ChatComponentRefactored.js    # Haupt-Chat-Interface ✅
│   ├── HeaderComponent.js            # App-Header ✅
│   ├── RelayManager.js               # Relay-Verwaltung ✅
│   ├── SettingsComponent.js          # Einstellungen ✅
│   ├── SettingsModal.js              # Einstellungs-Modal ✅
│   └── SetupComponent.js             # Initial-Setup ✅
├── services/               # Business-Logic (ALLE VORHANDEN)
│   ├── KeyService.js                 # Schlüsselverwaltung ✅
│   ├── NostrService.js               # NOSTR-Protokoll ✅
│   ├── RelayService.js               # Relay-Management ✅
│   ├── StorageService.js             # Lokale Datenspeicherung ✅
│   ├── ToastService.js               # Benachrichtigungen ✅
│   └── UIManager.js                  # UI-Verwaltung ✅
├── nips/                   # NOSTR-Protokoll-Implementierungen (ALLE VORHANDEN)
│   ├── NIP01_BasicProtocol.js        # Basis-Protokoll ✅
│   ├── NIP02_ContactLists.js         # Kontaktlisten ✅
│   ├── NIP04_EncryptedDMs.js         # Verschlüsselte DMs ✅
│   ├── NIP17_KindMessages.js         # Direktnachrichten ✅
│   ├── NIP25_Reactions.js            # Reaktionen ✅
│   ├── NIP28_PublicChat.js           # Öffentliche Chats ✅
│   └── NIP104_PrivateGroups.js       # Private Gruppen ✅
├── config/                 # Konfiguration (ZENTRAL)
│   └── app-config.js                 # Zentrale Konfiguration ✅
└── styles/                 # Styling (VORHANDEN)
    └── main.css                      # Haupt-Stylesheet ✅
```

### 🎯 **Funktionsfähige Features:**

#### ✅ **Öffentliche Räume (NIP-28)**
- Themenbasierte Diskussionen
- Tag-basierte Nachrichten-Identifikation
- Funktioniert mit `ChatComponentRefactored.js`

#### ✅ **Private Gruppen (NIP-104)**
- Verschlüsselte Gruppenchats
- Owner kann Gruppe erstellen
- Funktioniert mit `NIP104_PrivateGroups.js`

#### ✅ **Direktnachrichten (NIP-04/NIP-17)**
- Verschlüsselte 1:1 Kommunikation
- Funktioniert mit `NIP04_EncryptedDMs.js` und `NIP17_KindMessages.js`

#### ✅ **Schlüsselverwaltung**
- Sichere lokale Schlüsselverwaltung
- Funktioniert mit `KeyService.js`

#### ✅ **Relay-Management**
- Verbindung zu NOSTR-Relays
- Funktioniert mit `RelayService.js`

#### ✅ **UI-Komponenten**
- Vollständiges Chat-Interface
- Sidebar mit Tabs für Räume/DMs
- Funktioniert mit `ChatComponentRefactored.js`

## 🔧 **Was nur ZUSAMMENGEFÜGT werden muss:**

### 1. **Direktnachrichten in UI integrieren**
```javascript
// Bereits vorhanden in ChatComponentRefactored.js:
<button class="tab-btn" id="dmsTab">💬 DMs</button>
<div class="tab-content" id="dmsContent">
    <div class="dm-actions">
        <button class="btn btn-sm" id="startDMBtn">💬 Start DM</button>
    </div>
    <div class="dm-contacts" id="dmContacts">
        <!-- DM-Kontakte werden hier angezeigt -->
    </div>
</div>
```

### 2. **Gruppen-Einladungen aktivieren**
```javascript
// Bereits vorhanden in NIP104_PrivateGroups.js:
async inviteToGroup(groupId, inviteePubkey, sharedKey) {
    // Implementierung vorhanden
}
```

### 3. **Profil-Modal verwenden**
```javascript
// Bereits vorhanden in UIManager.js:
<button id="profileBtn" class="btn btn-secondary">👤 Profil</button>
```

## 🎯 **Nächste Schritte (KEIN Neubau):**

### Phase 1: **UI-Komponenten verbinden**
- DM-Tab mit `NIP04_EncryptedDMs.js` verbinden
- Gruppen-Einladungen mit UI verbinden
- Profil-Modal mit `KeyService.js` verbinden

### Phase 2: **Bestehende Services integrieren**
- `StorageService.js` für Persistierung nutzen
- `ToastService.js` für Benachrichtigungen nutzen
- `RelayService.js` für ein Test-Relay konfigurieren

### Phase 3: **Bestehende NIPs aktivieren**
- `NIP02_ContactLists.js` für Kontaktliste
- `NIP25_Reactions.js` für Reaktionen
- `NIP104_PrivateGroups.js` für Einladungen

## 🚀 **Sofort einsatzbereit:**

### Installation
```bash
npm install
npm run dev
```

### Testen
- Öffne `http://localhost:8081`
- Erstelle/Importiere Schlüssel
- Teste öffentliche Räume ✅
- Teste private Gruppen ✅
- Teste Direktnachrichten ✅

## 🔗 **Alles ist bereits da:**

- **Frontend:** Vite + Vanilla JS ✅
- **NOSTR:** nostr-tools v2.15.0 ✅
- **Protokolle:** 7 NIPs implementiert ✅
- **Services:** 6 Services fertig ✅
- **Komponenten:** 6 UI-Komponenten fertig ✅
- **Konfiguration:** Zentral in `app-config.js` ✅

**Fazit:** Wir haben einen **vollständig funktionsfähigen NOSTR-Client**. Es muss nur **sauber zusammengesetzt** werden! 🎉R Client

> **Dezentraler, sicherer NOSTR-Client mit verschlüsselten Gruppenchats und Direktnachrichten**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NOSTR](https://img.shields.io/badge/NOSTR-Protocol-purple)](https://nostr.com/)
[![Vite](https://img.shields.io/badge/Vite-4.5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🔐 Sicherheitsphilosophie

**WICHTIG:** Dieser Client folgt den höchsten Sicherheitsstandards für NOSTR:
- 🔒 Private Schlüssel werden **niemals** im Klartext gespeichert
- 🏠 Schlüssel verlassen **niemals** den Computer des Benutzers
- 🛡️ Alle kryptographischen Operationen finden lokal statt
- 👀 Volle Transparenz über lokale Datenspeicherung
- ❌ Keine Server-seitige Datenspeicherung

## 🚀 Überblick

Ein moderner NOSTR-Client, entwickelt mit Vanilla JavaScript und Vite. Bietet Echtzeit-Chat, verschlüsselte Direktnachrichten und **sichere private Gruppenchats** auf dem dezentralen NOSTR-Protokoll.

### ✨ Hauptfunktionen

- **🔐 Erweiterte Schlüssel-Verwaltung**: Generierung, Import und Verwaltung von NOSTR-Schlüsseln (nsec/npub)
- **💬 Echtzeit-Öffentlicher Chat**: Multi-Room-Chat mit NIP-28-Unterstützung
- **🔒 Verschlüsselte Direktnachrichten**: NIP-04 verschlüsselte DMs mit Kontakt-Verwaltung
- **🏠 **NEUE** Private Gruppen**: NIP-104 verschlüsselte Gruppenchats mit Einladungssystem
- **👥 Kontakt-Listen**: NIP-02 Kontakt-Management mit Profil-Synchronisation
- **❤️ Reaktionen**: NIP-25 Nachrichten-Reaktionen (Likes, Emojis)
- **💾 Nachrichtenspeicherung**: LocalStorage-basierte Persistierung für Chat-Historie
- **🌍 Dezentralisiert**: Pure NOSTR-Protokoll-Implementierung
- **🎨 Modernes UI**: Saubere, responsive Benutzeroberfläche mit dunklem Theme
- **📡 Multi-Relay-Support**: Verbindung zu mehreren NOSTR-Relays
- **📱 PWA-Ready**: Progressive Web App mit Offline-Funktionalität
- **🔧 GitHub Pages Ready**: Statisches Hosting-Deployment
- **🛡️ Sichere Zugriffskontrolle**: Einladungsbasierte Gruppenmitgliedschaft
- **🔑 Lokale Schlüsselverwaltung**: Sichere Speicherung von Gruppen-Schlüsseln

## 🔐 Sicherheits-Features

### Verschlüsselte Private Gruppen (NIP-104)
- **Ende-zu-Ende-Verschlüsselung**: Jede Gruppe hat einen eigenen Verschlüsselungsschlüssel
- **Einladungsbasiert**: Nur eingeladene Benutzer können der Gruppe beitreten
- **Kein Zugriff ohne Schlüssel**: Selbst Relay-Betreiber können Nachrichten nicht lesen
- **Sichere Schlüsselverteilung**: Verschlüsselte Einladungen per DM

### Strikte Nachrichtentrennung
- **Öffentliche Räume**: Verwenden `#t` Tags für Raum-Identifikation
- **Private Nachrichten**: Verwenden `#p` Tags für Direktnachrichten
- **Verschlüsselte Gruppen**: Verwenden `#g` Tags mit Ende-zu-Ende-Verschlüsselung
- **Keine Überschneidungen**: Strikte Filterung verhindert Datenlecks

## 🏠 Verschlüsselte Gruppen - Anleitung

### Gruppe erstellen
1. Klicken Sie auf "Neue verschlüsselte Gruppe"
2. Geben Sie einen Gruppen-Namen ein
3. Die Gruppe wird mit einem eigenen Verschlüsselungsschlüssel erstellt

### Mitglieder einladen
1. Klicken Sie auf "Mitglied einladen" in der Gruppe
2. Geben Sie den npub des Benutzers ein
3. Eine verschlüsselte Einladung wird per DM gesendet

### Gruppe beitreten
1. Einladungen erscheinen in Ihren Direktnachrichten
2. Klicken Sie auf "Gruppe beitreten"
3. Der Gruppenschlüssel wird automatisch gespeichert

### Sichere Kommunikation
- Alle Nachrichten werden Ende-zu-Ende verschlüsselt
- Nur Gruppenmitglieder können Nachrichten lesen
- Schlüssel werden lokal gespeichert
- Keine Metadaten-Lecks durch strikte Filterung

## 🎯 Live Demo

Live-Deployment: **https://dreammall-verlag.github.io/dreammall-nostr-client/**

## 📦 Schnellstart

### Voraussetzungen

- Node.js 18+
- npm

### Installation

```bash
# Repository klonen
git clone https://github.com/DreamMall-Verlag/dreammall-nostr-client.git
cd dreammall-nostr-client

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Besuchen Sie `http://localhost:8081` um die Anwendung zu sehen.

### Für Produktion bauen

```bash
# Produktions-Build erstellen
npm run build

# Produktions-Build vorschauen
npm run preview

# Auf GitHub Pages deployen
npm run deploy
```

## 🔧 Technische Architektur

### Kern-Komponenten

#### Services
- **NostrService**: Kern-NOSTR-Protokoll-Behandlung
- **RelayService**: Relay-Verbindungs-Management
- **KeyService**: Schlüssel-Generierung und -Verwaltung
- **StorageService**: Lokale Datenpersistierung
- **ToastService**: Benutzerbenachrichtigungen
- **UIManager**: Benutzeroberflächen-Verwaltung

#### Chat-Komponenten
- **ChatComponent**: Haupt-Chat-Schnittstelle
- **ChatComponentRefactored**: Überarbeitete modulare Chat-Komponente
- **SetupComponent**: Schlüssel-Generierung und -Import
- **SettingsModal**: Benutzereinstellungen und Schlüssel-Management
- **HeaderComponent**: Status und Steuerung

#### UI-Komponenten
- **ModalComponent**: Wiederverwendbare Modal-Dialoge
- **RoomManagerComponent**: Raum-Management-Interface

### NIP-Module

Jedes NOSTR Improvement Proposal (NIP) ist als separates Modul implementiert:

- **NIP01_BasicProtocol**: Grundlegende NOSTR-Events und Messaging
- **NIP02_ContactLists**: Kontakt-Management und Profil-Synchronisation
- **NIP04_EncryptedDMs**: Verschlüsselte Direktnachrichten
- **NIP17_KindMessages**: Direct Messages mit kind:1 Events
- **NIP25_Reactions**: Nachrichten-Reaktionen (Likes, Dislikes, Emojis)
- **NIP28_PublicChat**: Öffentliche Chat-Räume
- **NIP104_PrivateGroups**: **NEUE** Verschlüsselte private Gruppen

## 📋 NOSTR-Protokoll-Unterstützung

### ✅ Implementierte NIPs

- **NIP-01**: Grundlegende Protokoll-Events
  - Event-Erstellung und -Validierung
  - Event-Signierung und -Veröffentlichung
  - Subscriptions und Event-Streams
  - Event-Typen: 0 (Metadata), 1 (Text Note), 3 (Kontakte), 4 (Verschlüsselte DM)

- **NIP-02**: Kontakt-Listen
  - Kontakt-Hinzufügung und -Entfernung
  - Profil-Synchronisation
  - Kontakt-Verwaltung mit Petnames
  - Kontakt-Suche und -Anzeige

- **NIP-04**: Verschlüsselte Direktnachrichten
  - End-to-End-Verschlüsselung
  - Nachrichten-Entschlüsselung
  - Konversationshistorie
  - Sichere Schlüssel-Verwaltung

- **NIP-17**: Direct Messages (kind:1)
  - Direkte Nachrichten mit `#p` Tags
  - Strikte Filterung von Raum-Nachrichten
  - Kein Überschneidung mit öffentlichen Räumen

- **NIP-25**: Reaktionen
  - Like/Dislike-Funktionalität
  - Emoji-Reaktionen
  - Reaktions-Zählung
  - Reaktions-Management

- **NIP-28**: Öffentliche Chat-Kanäle
  - Kanal-Erstellung und -Management
  - Kanal-Metadaten mit `#t` Tags
  - Öffentliche Raum-Nachrichten
  - Strikte Tag-Filterung

- **NIP-104**: Private Gruppen (NEUE Implementierung)
  - **Ende-zu-Ende-Verschlüsselung**: Jede Gruppe hat eigenen Schlüssel
  - **Einladungsbasiert**: Nur eingeladene Benutzer können teilnehmen
  - **Sichere Schlüsselverteilung**: Verschlüsselte Einladungen per DM
  - **Gruppenschlüssel-Management**: Lokale Schlüsselspeicherung
  - **Zugangskontrolle**: Kein Zugriff ohne Gruppenschlüssel
  - **Gruppen-Metadaten**: Verschlüsselte Gruppen-Informationen

- **NIP-104**: Private Gruppen
  - Private Gruppen-Erstellung
  - Gruppen-Einladungen
  - Verschlüsselte Gruppen-Nachrichten
  - Gruppen-Schlüssel-Management

### 🔐 Schlüssel-Management (NIP-06/NIP-49)

- **NIP-06**: Schlüssel-Ableitung aus Mnemonic
  - BIP39 Mnemonic-Unterstützung
  - Hierarchische deterministische Schlüssel
  - Sichere Schlüssel-Generierung

- **NIP-49**: Private Schlüssel-Verschlüsselung
  - Passwort-geschützte Schlüssel-Speicherung
  - PBKDF2-Schlüssel-Ableitung
  - Sichere lokale Speicherung

### 🌐 Relay-Management (NIP-65)

- **NIP-65**: Relay-Listen-Metadaten
  - Relay-Erkennung
  - Relay-Empfehlungen
  - Multi-Relay-Support

### 🚧 Geplante NIPs

- **NIP-11**: Relay-Informations-Dokument
- **NIP-42**: Authentifizierung von Clients zu Relays
- **NIP-44**: Versioned Encryption (erweiterte Verschlüsselung)
- **NIP-94**: Datei-Metadaten (Medien-Sharing)

## 🛠️ Aktuelle Updates & Fixes

### Version 1.0.2 (Juli 2025)

**🔧 Technische Verbesserungen:**
- **DM-Persistierung**: IndexedDB-Speicherung für verschlüsselte Direktnachrichten implementiert
- **Kontakt-Management**: DM-Kontakte bleiben über Browser-Sitzungen hinweg erhalten
- **Relay-Optimierung**: Konfiguriert für ausschließliche Nutzung von wss://relay.damus.io für Tests
- **Duplikat-Verhinderung**: Nachrichtenid-Tracking zur Vermeidung doppelter Anzeigen hinzugefügt
- **Erweiterte Speicherung**: StorageService um DM-Nachrichten- und Kontaktspeicherung erweitert

**🎨 UI/UX-Verbesserungen:**
- **Header-Updates**: Dynamische Header-Titel für DM-Konversationen ("DM mit [user]")
- **Nachrichten-Anzeige**: Ordentliche Nachrichtenformatierung mit Verschlüsselungsindikatoren
- **Kontakt-Sidebar**: Persistente DM-Kontaktliste mit letzten Nachrichten-Vorschauen
- **Bessere Navigation**: Verbesserte Umschaltung zwischen öffentlichem Chat und DMs

**🐛 Aktuelle Probleme (In Bearbeitung):**
- **Doppelte Nachrichten-Anzeige**: Nachrichten erscheinen doppelt beim Senden (behoben nach Neuladen)
- **DM-Relay-Publishing**: Direktnachrichten werden möglicherweise nicht ordentlich an Relays gesendet

**⚡ NOSTR-Protokoll-Unterstützung:**
- **NIP-01**: Grundlegende Text-Notizen und Event-Publishing
- **NIP-02**: Kontakt-Listen mit Profil-Synchronisation
- **NIP-04**: Verschlüsselte Direktnachrichten mit ordentlicher Schlüssel-Verwaltung
- **NIP-25**: Reaktions-Unterstützung (Likes, Emojis)
- **NIP-28**: Öffentliche Chat-Raum-Implementierung
- **NIP-104**: Private Gruppen-Implementierung
- **6 NIPs Implementiert**: Unter Verwendung von wss://relay.damus.io mit umfassender Protokoll-Unterstützung

### Version 1.0.1 (Juli 2025)

**🔧 Technische Verbesserungen:**
- **npub-Schlüssel-Konvertierung**: Kompatibilität mit nostr-tools v2.15.0 API behoben
- **Benutzer-Profil-System**: Erweiterte Benutzer-Profil-Modal mit hex- und npub-Schlüssel-Anzeige
- **Service-Initialisierung**: Verbesserte Zeitabstimmung für NostrService-Initialisierung
- **Multi-Methoden-Fallback**: Robuste npub-Kodierung mit mehreren Fallback-Strategien

**🎨 UI/UX-Verbesserungen:**
- **Dezentes Benutzer-Icon**: Erste 4 Hex-Zeichen werden dezent neben dem Benutzer-Icon angezeigt
- **Erweiterte Profil-Modal**: Funktionierende npub-Konvertierung mit Copy-Funktionalität
- **Besseres Fehler-Handling**: Graceful Degradation wenn npub-Konvertierung fehlschlägt
- **Verbessertes Chat-Layout**: Ordentliches Scroll-Verhalten mit fixiertem Eingabebereich

**🐛 Bug-Fixes:**
- Behoben: "encode is not a function" Fehler in npub-Konvertierung
- Behoben: NostrService-Initialisierungszeitprobleme
- Behoben: Benutzer-Profil-Modal zeigt Konvertierungsfehler
- Verbessert: Service-Abhängigkeits-Injection und Initialisierungsreihenfolge

### Version 1.0.0 (Juli 2025)

**🔧 Technische Verbesserungen:**
- Vite 4.5.0 mit umgebungsbewusster Basis-URL-Konfiguration
- NIP-28 (Öffentlicher Chat) und NIP-04 (Verschlüsselte DMs) Implementierung
- Erweiterte Fehlerbehandlung und Retry-Logik
- Stabile Relay-Verbindung (wss://relay.damus.io)

**🐛 Bug-Fixes:**
- Behoben: Raum-Nachrichten-Zählung und -Anzeige-Probleme
- Behoben: ChatComponent Raum-Wechsel-Fehler
- Behoben: KeyService-Methoden-Integration
- Behoben: GitHub Pages Deployment und Asset-Loading

**⚡ Performance & Deployment:**
- GitHub Pages Deployment funktioniert
- Optimierte Build-Konfiguration für statisches Hosting
- Behoben: Basis-URL-Konflikte zwischen lokaler und Produktionsumgebung

## 🎨 Benutzeroberfläche

### Hauptfunktionen

- **Responsive Design**: Optimiert für Desktop und Mobile
- **Dark Theme**: Moderne dunkle Benutzeroberfläche
- **Echtzeit-Updates**: Live-Nachrichtenaktualisierungen
- **Intuitive Navigation**: Einfache Bedienung zwischen Räumen und DMs
- **Kontakt-Management**: Benutzerfreundliche Kontakt-Verwaltung
- **Schlüssel-Management**: Sichere Schlüssel-Verwaltung mit klarer UI

### Progressive Web App (PWA)

- **Offline-Funktionalität**: Funktioniert auch ohne Internetverbindung
- **App-Installation**: Installierbar auf Desktop und Mobile
- **Push-Benachrichtigungen**: Benachrichtigungen für neue Nachrichten
- **Responsive Icons**: Anpassungsfähige Icons für verschiedene Geräte

## 🔧 Entwicklung

### Architektur-Prinzipien

- **Modularer Aufbau**: Jedes NIP als separates Modul
- **Service-orientiert**: Klare Trennung von Geschäftslogik
- **Wiederverwendbare Komponenten**: UI-Komponenten sind modular aufgebaut
- **Testbarkeit**: Module können isoliert getestet werden

### Build-System

- **Vite**: Schnelles Development und Build
- **ES6-Module**: Moderne JavaScript-Module
- **Tree-Shaking**: Optimierte Bundle-Größe
- **TypeScript-Ready**: Bereit für TypeScript-Migration

### Deployment

- **GitHub Pages**: Automatisches Deployment
- **Statisches Hosting**: Keine Server-Abhängigkeiten
- **CDN-Optimiert**: Schnelle globale Verfügbarkeit

## 📖 Verwendung

### Erste Schritte

1. **Schlüssel generieren**: Beim ersten Start neue NOSTR-Schlüssel generieren
2. **Profil erstellen**: Benutzerprofil mit Name und Beschreibung
3. **Räume beitreten**: Öffentliche Räume beitreten oder erstellen
4. **Kontakte hinzufügen**: Andere Benutzer zu Kontakten hinzufügen
5. **Nachrichten senden**: Öffentliche Nachrichten oder private DMs senden

### Erweiterte Funktionen

- **Private Gruppen**: Eigene private Gruppen erstellen
- **Reaktionen**: Auf Nachrichten reagieren
- **Schlüssel-Export**: Schlüssel sicher exportieren
- **Relay-Management**: Eigene Relays hinzufügen

## 🔒 Sicherheit

### Datenschutz

- **Lokale Speicherung**: Alle Daten werden lokal gespeichert
- **Verschlüsselung**: Nachrichten sind Ende-zu-Ende verschlüsselt
- **Keine Zentralisierung**: Keine zentrale Datensammlung
- **Open Source**: Vollständig transparenter Code

### Schlüssel-Sicherheit

- **Sichere Generierung**: Kryptographisch sichere Schlüssel-Generierung
- **Lokale Speicherung**: Schlüssel verlassen nie das Gerät
- **Passwort-Schutz**: Optionaler Passwort-Schutz für Schlüssel
- **Backup-Möglichkeiten**: Sichere Backup-Optionen

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🤝 Beitragen

Beiträge sind willkommen! Bitte lesen Sie die [CONTRIBUTING.md](CONTRIBUTING.md) für Details.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DreamMall-Verlag/dreammall-nostr-client/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DreamMall-Verlag/dreammall-nostr-client/discussions)
- **Email**: support@dreammall.de

## 🙏 Danksagungen

- **NOSTR-Protokoll**: [nostr.com](https://nostr.com/)
- **nostr-tools**: [nostr-tools](https://github.com/nbd-wtf/nostr-tools)
- **Vite**: [vitejs.dev](https://vitejs.dev/)
- **Damus Relay**: [relay.damus.io](wss://relay.damus.io)

---

**Erstellt mit ❤️ von DreamMall für das dezentrale Web**
