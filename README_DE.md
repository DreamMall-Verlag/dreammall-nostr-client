# 🌐 DreamMall NOSTR Client

> **Dezentraler Chat-Client für das NOSTR-Protokoll**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NOSTR](https://img.shields.io/badge/NOSTR-Protocol-purple)](https://nostr.com/)
[![Vite](https://img.shields.io/badge/Vite-4.5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🚀 Überblick

Ein moderner NOSTR-Client, entwickelt mit Vanilla JavaScript und Vite. Bietet Echtzeit-Chat, verschlüsselte Direktnachrichten und umfassendes Schlüssel-Management auf dem dezentralen NOSTR-Protokoll.

### ✨ Hauptfunktionen

- **🔐 Erweiterte Schlüssel-Verwaltung**: Generierung, Import und Verwaltung von NOSTR-Schlüsseln (nsec/npub)
- **💬 Echtzeit-Öffentlicher Chat**: Multi-Room-Chat mit NIP-28-Unterstützung
- **🔒 Verschlüsselte Direktnachrichten**: NIP-04 verschlüsselte DMs mit Kontakt-Verwaltung
- **🏠 Private Gruppen**: NIP-104 private Gruppenchats mit Einladungssystem
- **👥 Kontakt-Listen**: NIP-02 Kontakt-Management mit Profil-Synchronisation
- **❤️ Reaktionen**: NIP-25 Nachrichten-Reaktionen (Likes, Emojis)
- **💾 Nachrichtenspeicherung**: IndexedDB-Speicherung für Offline-Nachrichtenhistorie
- **🌍 Dezentralisiert**: Pure NOSTR-Protokoll-Implementierung
- **🎨 Modernes UI**: Saubere, responsive Benutzeroberfläche mit dunklem Theme
- **📡 Multi-Relay-Support**: Verbindung zu mehreren NOSTR-Relays (derzeit mit Damus)
- **📱 PWA-Ready**: Progressive Web App mit Offline-Funktionalität
- **🔧 GitHub Pages Ready**: Statisches Hosting-Deployment

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

# Für Produktion bauen
npm run build
```

Besuchen Sie `http://localhost:8081` um die Anwendung zu sehen.

### Entwicklung

```bash
# Entwicklungsserver starten
npm run dev

# Für Produktion bauen
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
- **NIP25_Reactions**: Nachrichten-Reaktionen (Likes, Dislikes, Emojis)
- **NIP28_PublicChat**: Öffentliche Chat-Räume
- **NIP104_PrivateGroups**: Private Gruppen-Messaging

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

- **NIP-25**: Reaktionen
  - Like/Dislike-Funktionalität
  - Emoji-Reaktionen
  - Reaktions-Zählung
  - Reaktions-Management

- **NIP-28**: Öffentliche Chat-Kanäle
  - Kanal-Erstellung und -Management
  - Kanal-Metadaten
  - Kanal-Nachrichten
  - Raum-basierte Nachrichten (Fallback)

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

## 📈 Versionsverlauf

### Version 1.0.1 (Juli 2025)

**🔧 Technische Verbesserungen:**
- **npub-Schlüssel-Konvertierung**: Kompatibilität mit nostr-tools v2.15.0 API
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
