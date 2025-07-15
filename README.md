# 🌐 DreamMall NOSTR Client

> **NOSTR Web Client - Decentralized Chat Application**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NOSTR](https://img.shields.io/badge/NOSTR-Protocol-purple)](https://nostr.com/)
[![Vite](https://img.shields.io/badge/Vite-4.5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 🚀 Overview

A modern NOSTR client built with vanilla JavaScript and Vite. Features real-time chat, encrypted direct messages, and comprehensive key management on the decentralized NOSTR protocol.

### ✨ Key Features

- **🔐 Advanced Key Management**: Generate, import, and manage NOSTR keys (nsec/npub)
- **💬 Real-time Public Chat**: Multi-room chat with NIP-28 support
- **🔒 Encrypted Direct Messages**: NIP-04 encrypted DMs with contact management
- **💾 Message Persistence**: IndexedDB storage for offline message history
- **🌍 Decentralized**: Pure NOSTR protocol implementation
- **🎨 Modern UI**: Clean, responsive interface with dark theme
- **📡 Multi-Relay Support**: Connect to multiple NOSTR relays (currently using Damus)
- **🔧 GitHub Pages Ready**: Static hosting deployment

## 🎯 Live Demo

Live deployment: **https://dreammall-verlag.github.io/dreammall-nostr-client/**

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/DreamMall-Verlag/dreammall-nostr-client.git
cd dreammall-nostr-client

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:8081` to see the application running.

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🛠️ Recent Updates & Fixes

### Version 1.0.2 (July 2025)

**🔧 Technical Improvements:**
- **DM Persistence**: Implemented IndexedDB storage for encrypted direct messages
- **Contact Management**: DM contacts now persist across browser sessions
- **Relay Optimization**: Configured to use only wss://relay.damus.io for testing
- **Duplicate Prevention**: Added message ID tracking to prevent duplicate displays
- **Enhanced Storage**: Extended StorageService with DM message and contact storage

**🎨 UI/UX Improvements:**
- **Header Updates**: Dynamic header titles for DM conversations ("DM mit [user]")
- **Message Display**: Proper message formatting with encryption indicators
- **Contact Sidebar**: Persistent DM contact list with last message previews
- **Better Navigation**: Improved switching between public chat and DMs

**🐛 Current Issues (In Progress):**
- **Double Message Display**: Messages appear twice when sending (fixed after reload)
- **DM Relay Publishing**: Direct messages may not be properly sent to relays
- **Storage Synchronization**: Minor timing issues with message persistence

**⚡ NOSTR Protocol Support:**
- **NIP-01**: Basic text notes and event publishing
- **NIP-04**: Encrypted direct messaging with proper key management
- **NIP-25**: Reaction support (planned)
- **NIP-28**: Public chat room implementation
- **10 NIPs Available**: Using wss://relay.damus.io with comprehensive protocol support

### Version 1.0.1 (July 2025)

**🔧 Technical Improvements:**
- **npub Key Conversion**: Fixed compatibility with nostr-tools v2.15.0 API
- **User Profile System**: Enhanced user profile modal with hex and npub key display
- **Service Initialization**: Improved timing for NostrService initialization
- **Multi-method Fallback**: Robust npub encoding with multiple fallback strategies

**🎨 UI/UX Improvements:**
- **Dezenter User-Icon**: First 4 hex characters displayed subtly next to user icon
- **Enhanced Profile Modal**: Working npub conversion with copy functionality
- **Better Error Handling**: Graceful degradation when npub conversion fails
- **Improved Chat Layout**: Proper scrolling behavior with fixed input area

**🐛 Bug Fixes:**
- Fixed "encode is not a function" error in npub conversion
- Resolved NostrService initialization timing issues
- Fixed user profile modal showing conversion errors
- Improved service dependency injection and initialization order

### Version 1.0.0 (July 2025)

**🔧 Technical Improvements:**
- Vite 4.5.0 with environment-aware base URL configuration
- NIP-28 (Public Chat) and NIP-04 (Encrypted DMs) implementation
- Enhanced error handling and retry logic
- Stable relay connection (wss://relay.damus.io)

**🐛 Bug Fixes:**
- Fixed room message counting and display issues
- Resolved ChatComponent room switching errors
- Corrected KeyService method integration
- Fixed GitHub Pages deployment and asset loading

**⚡ Performance & Deployment:**
- GitHub Pages deployment working
- Optimized build configuration for static hosting
- Fixed base URL conflicts between local and production environments
- Improved NOSTR protocol compliance

## 🔮 Roadmap & Next Steps

### 🚧 Current Development (In Progress)

**High Priority Fixes:**
- **Fix Double Message Display**: Resolve duplicate message rendering during send
- **DM Relay Publishing**: Ensure direct messages are properly sent to relays
- **Storage Synchronization**: Optimize message persistence timing
- **Message Ordering**: Improve chronological message display

**Planned Features:**
- **NIP-25 Reactions**: Add emoji reactions to messages
- **Message Search**: Full-text search across stored messages
- **User Profiles**: Enhanced user profile management with avatars
- **Multi-Relay Support**: Expand beyond single relay (Damus)
- **Message Threading**: Reply and thread support
- **Push Notifications**: Browser notification support

### 🎯 Long-term Vision

- **Mobile PWA**: Progressive Web App capabilities
- **Voice Messages**: Audio message support
- **File Sharing**: Secure file sharing through NOSTR
- **Group Chats**: Multi-user encrypted group conversations
- **Bridge Integration**: Connect to other decentralized protocols

---

**🔧 Development Notes:**
- Current session focused on DM persistence and relay optimization
- Using wss://relay.damus.io with 10 NOSTR NIPs available
- IndexedDB implementation for offline message storage
- Component-based architecture for maintainability

**📅 Next Session Goals:**
- [ ] Fix double message display issue
- [ ] Ensure DM relay publishing works correctly
- [ ] Optimize storage synchronization timing
- [ ] Test message persistence across browser sessions

---

## 🏗️ Architecture

### Component-Based Design

```
src/
├── components/           # UI Components
│   ├── SetupComponent.js     # Key setup
│   ├── ChatComponent.js      # Chat interface
│   ├── SettingsModal.js      # Settings
│   └── RelayManager.js       # Relay management
├── services/            # Business Logic
│   ├── NostrService.js       # NOSTR operations
│   ├── KeyService.js         # Key management
│   ├── RelayService.js       # Relay connections
│   └── ToastService.js       # Notifications
└── styles/              # CSS
    └── chat.css
```

### NOSTR Protocol

Implements NOSTR protocol with:
- **NIP-01**: Basic protocol (key generation, messaging)
- **NIP-28**: Public chat rooms with hashtag support
- **NIP-04**: Encrypted direct messages
- Multi-relay support (primary: wss://relay.damus.io)
- Real-time message synchronization

## 🔧 Development

### Build Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
```

### Deployment

Built for GitHub Pages with automatic deployment via GitHub Actions.

## 📄 License

MIT License - see LICENSE file for details.
