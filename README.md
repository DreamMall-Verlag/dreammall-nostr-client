# 🌐 DreamMall NOSTR Public Client

> **Standalone NOSTR-Client für jedermann - Keine DreamMall-Registrierung erforderlich**

## � Überblick

Ein vollständig eigenständiger NOSTR-Client, der nach reinen NOSTR-Protokoll-Standards funktioniert:

- **Unabhängig**: Läuft ohne DreamMall-Account
- **Standard-konform**: Kompatibel mit allen NOSTR-Relays
- **Benutzerfreundlich**: Moderne Web-App mit PWA-Support
- **Sicher**: Ende-zu-Ende-Verschlüsselung nach NIP-04

## 🚀 Schnellstart

### Lokaler Start
```bash
npm install
npm run dev      # Entwicklungsserver
npm run build    # Production Build
npm run preview  # Preview Build
```

### Live-Demo
```bash
npm run serve    # Server auf Port 8080
```

## 🎯 Zielgruppe

- **NOSTR-Community**: Entwickler und Privacy-Enthusiasten
- **Allgemeine Öffentlichkeit**: Jeder kann den Client nutzen
- **DreamMall-Unabhängig**: Kein DreamMall-Account erforderlich

## 📦 Installation

```bash
# In das Web-Client Verzeichnis wechseln
cd web-client

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build erstellen
npm run build

# Preview des Builds
npm run preview
```

## 🚀 Verwendung

### Development
```bash
npm run dev
```
Startet den Entwicklungsserver auf `http://localhost:8081`

### Production Build
```bash
npm run build
```
Erstellt einen optimierten Build im `dist/` Ordner

### Preview
```bash
npm run preview
```
Startet einen lokalen Server für den Production Build

## 📁 Projekt-Struktur

```
web-client/
├── public/                 # Statische Assets
│   ├── assets/            # Icons, Bilder
│   └── manifest.json      # PWA Manifest
├── src/                   # Source Code
│   ├── services/          # Business Logic Services
│   │   ├── NostrService.js      # NOSTR Protocol
│   │   ├── KeyService.js        # Schlüssel-Management
│   │   ├── RelayService.js      # Relay-Verbindungen
│   │   ├── StorageService.js    # Daten-Persistierung
│   │   ├── UIManager.js         # UI-Management
│   │   └── ToastService.js      # Benachrichtigungen
│   ├── styles/            # CSS Styles
│   │   └── main.css       # Haupt-Stylesheet
│   └── app.js            # Haupt-Anwendung
├── index.html            # HTML Entry Point
├── vite.config.js        # Vite Konfiguration
└── package.json          # NPM Dependencies
```

## 🔧 Konfiguration

### Environment Variables
```javascript
// In vite.config.js definiert
__APP_VERSION__    // App Version
__BUILD_TIME__     // Build Zeitstempel
```

### PWA Konfiguration
Die App ist als Progressive Web App konfiguriert:
- Offline-Funktionalität
- App-Installation möglich
- Service Worker für Caching
- Responsive Design

### Theme-System
```css
/* CSS Custom Properties für Theming */
:root {
  --primary-color: #667eea;
  --background-color: #ffffff;
  --text-color: #1a202c;
  /* ... weitere Variablen */
}

[data-theme="dark"] {
  --background-color: #1a202c;
  --text-color: #ffffff;
  /* ... Dark Theme Variablen */
}
```

## 🔐 Sicherheit

### Schlüssel-Management
- Sichere Schlüsselgenerierung mit Web Crypto API
- PBKDF2 für Passwort-basierte Verschlüsselung
- Sichere Speicherung in IndexedDB
- Kein Klartext-Speicherung von Private Keys

### Nachrichten-Verschlüsselung
- NIP-04 Verschlüsselung für Direktnachrichten
- AES-GCM Verschlüsselung
- Sichere Zufallszahlen-Generierung

### Content Security Policy
```html
<!-- CSP Headers in index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' wss: ws:;">
```

## 📱 PWA Features

### Installation
Die App kann als PWA installiert werden:
- Desktop: Chrome/Edge "App installieren"
- Mobile: "Zum Startbildschirm hinzufügen"

### Offline-Funktionalität
- Service Worker für Asset-Caching
- IndexedDB für Nachrichten-Speicherung
- Offline-Sync bei Wiederverbindung

## 🧪 Testing

```bash
# Tests ausführen
npm run test

# Test UI öffnen
npm run test:ui
```

## 🚢 Deployment

### Statischer Host
```bash
npm run build
# Inhalt von dist/ auf Webserver deployen
```

### Docker
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

### Vercel/Netlify
- Repository verknüpfen
- Build Command: `npm run build`
- Output Directory: `dist`

## 🔄 Development Workflow

1. **Setup**: `npm install`
2. **Development**: `npm run dev`
3. **Linting**: `npm run lint`
4. **Formatting**: `npm run format`
5. **Testing**: `npm run test`
6. **Build**: `npm run build`
7. **Preview**: `npm run preview`

## 📋 Roadmap

### Geplante Features
- [ ] Message Reactions
- [ ] File/Media Sharing
- [ ] Audio Messages
- [ ] Group Management
- [ ] Custom Relay Setup
- [ ] Advanced Encryption
- [ ] Message Search
- [ ] Export/Import Chat History

### Verbesserungen
- [ ] Performance Optimierung
- [ ] Accessibility Verbesserungen
- [ ] Mehr Theme-Optionen
- [ ] Mobile App (Capacitor)
- [ ] Desktop App (Tauri)

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen: `git checkout -b feature/new-feature`
3. Changes committen: `git commit -am 'Add new feature'`
4. Branch pushen: `git push origin feature/new-feature`
5. Pull Request erstellen

## 📄 License

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

- GitHub Issues: [Issues](https://github.com/dreammall/luna-1/issues)
- Dokumentation: [Docs](./docs/)
- NOSTR Protocol: [NIPs](https://github.com/nostr-protocol/nips)

## 🔗 Links

- [NOSTR Protocol](https://nostr.com/)
- [nostr-tools](https://github.com/nbd-wtf/nostr-tools)
- [Vite](https://vitejs.dev/)
- [PWA Guide](https://web.dev/progressive-web-apps/)
