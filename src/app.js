// =================================================================
// DreamMall NOSTR Client - Main Application (Component-based)
// Following NOSTR NIPs: NIP-01, NIP-17, NIP-28, NIP-65
// =================================================================

import { KeyService } from './services/KeyService.js';
import { NostrService } from './services/NostrService.js';
import { RelayService } from './services/RelayService.js';
import { StorageService } from './services/StorageService.js';
import { ToastService } from './services/ToastService.js';

import { HeaderComponent } from './components/HeaderComponent.js';
import { SetupComponent } from './components/SetupComponent.js';
import { ChatComponentRefactored } from './components/ChatComponentRefactored.js';
import { SettingsModal } from './components/SettingsModal.js';
import { RelayManager } from './components/RelayManager.js';
import { APP_CONFIG } from './config/app-config.js';

// Modal imports
import { showUserProfileModal } from './components/ui/modals/UserProfileModal.js';
import { showKeySettingsModal } from './components/ui/modals/KeySettingsModal.js';
import { showRelaySettingsModal } from './components/ui/modals/RelaySettingsModal.js';

import { NIP01_BasicProtocol } from './nips/NIP01_BasicProtocol.js';
import { NIP02_ContactLists } from './nips/NIP02_ContactLists.js';
import { NIP04_EncryptedDMs } from './nips/NIP04_EncryptedDMs.js';
import { NIP17_KindMessages } from './nips/NIP17_KindMessages.js';
import { NIP28_PublicChat } from './nips/NIP28_PublicChat.js';
import { NIP104_PrivateGroups } from './nips/NIP104_PrivateGroups.js';

console.log('🚀 DreamMall NOSTR Client startet...');

// =================================================================
// Application Class
// =================================================================

class NostrApp {
    constructor() {
        this.services = {};
        this.components = {};
        this.currentScreen = 'setup';
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('🔧 Erstelle Services...');
            this.createServices();
            
            console.log('🔧 Initialisiere Services...');
            await this.initializeServices();
            
            console.log('🎨 Erstelle UI-Komponenten...');
            this.createComponents();
            
            console.log('⚡ Richte Event-Listeners ein...');
            this.setupEventListeners();
            
            console.log('📱 Bestimme initialen Zustand...');
            await this.determineInitialState();
            
            this.isInitialized = true;
            console.log('✅ App erfolgreich initialisiert!');
            
        } catch (error) {
            console.error('❌ App-Initialisierung fehlgeschlagen:', error);
            this.services.toastService?.showError('Fehler beim Starten der App');
        }
    }

    createServices() {
        console.log('🏗️ Erstelle Services...');
        
        // Create services
        this.services.toastService = new ToastService();
        this.services.storageService = new StorageService();
        this.services.keyService = new KeyService(this.services.storageService, this.services.toastService);
        this.services.nostrService = new NostrService();
        this.services.relayService = new RelayService(APP_CONFIG);
        
        console.log('✅ Services erstellt');
    }

    async initializeServices() {
        console.log('🔧 Initialisiere Services...');
        
        // Services untereinander verknüpfen
        this.services.nostrService.setServices(this.services);
        this.services.relayService.setServices(this.services);
        
        // Initialize services
        await this.services.keyService.init?.();
        await this.services.relayService.init?.();
        
        // NIPs initialisieren
        await this.initializeNIPs();
        
        console.log('✅ Services initialisiert');
    }

    async initializeNIPs() {
        console.log('🔧 Initialisiere NOSTR NIPs...');
        
        // Basis-NIPs
        this.nips = {
            nip01: new NIP01_BasicProtocol(this.services.nostrService),
            nip02: new NIP02_ContactLists(this.services.nostrService, null),
            nip04: new NIP04_EncryptedDMs(this.services.nostrService, null),
            nip17: new NIP17_KindMessages(this.services.nostrService, null),
            nip28: new NIP28_PublicChat(this.services.nostrService, null),
            nip104: new NIP104_PrivateGroups(this.services.nostrService, null)
        };
        
        // Referenzen setzen (NIPs benötigen nip01 für Basis-Funktionalität)
        this.nips.nip02.nip01 = this.nips.nip01;
        this.nips.nip04.nip01 = this.nips.nip01;
        this.nips.nip17.nip01 = this.nips.nip01;
        this.nips.nip28.nip01 = this.nips.nip01;
        this.nips.nip104.nip01 = this.nips.nip01;
        
        // NIPs an Services weitergeben
        this.services.nostrService.nips = this.nips;
        
        console.log('✅ NIPs initialisiert:', Object.keys(this.nips));
    }

    createComponents() {
        const app = document.getElementById('app');
        
        // Create main app container
        const appContainer = document.createElement('div');
        appContainer.className = 'app';
        app.appendChild(appContainer);
        
        // Create header
        this.components.header = new HeaderComponent();
        appContainer.appendChild(this.components.header.render());
        
        // Set services for header component
        this.components.header.setServices(this.services);
        
        // Create main content area
        const mainContent = document.createElement('div');
        mainContent.id = 'mainContent';
        appContainer.appendChild(mainContent);
        
        // Create setup component
        this.components.setup = new SetupComponent(
            this.services.keyService, 
            this.services.toastService
        );
        
        // Create chat component (use refactored version for better stability)
        this.components.chat = new ChatComponentRefactored(
            this.services.nostrService,
            this.services.toastService
        );
        
        // Provide services to chat component if it has setServices method
        if (this.components.chat.setServices) {
            this.components.chat.setServices(this.services);
        }
        
        // Keep original chat component for fallback
       /* this.components.chatLegacy = new ChatComponent(
            this.services.nostrService,
            this.services.toastService
        );
        */
        
        // Create modals
        this.components.settingsModal = new SettingsModal(
            this.services.keyService,
            this.services.toastService
        );
        
        this.components.relayManager = new RelayManager(
            this.services.relayService,
            this.services.toastService
        );
        
        // Append modals to body
        document.body.appendChild(this.components.settingsModal.render());
        document.body.appendChild(this.components.relayManager.render());
        
        // Set global reference for relay manager
        window.relayManager = this.components.relayManager;
        
        console.log('✅ Komponenten erstellt');
    }

    setupEventListeners() {
        // Listen for key events
        document.addEventListener('keysGenerated', (e) => {
            console.log('🔑 Schlüssel generiert');
            this.showScreen('chat');
        });
        
        document.addEventListener('keysImported', (e) => {
            console.log('📥 Schlüssel importiert');
            this.showScreen('chat');
        });
        
        document.addEventListener('keysDeleted', (e) => {
            console.log('🗑️ Schlüssel gelöscht');
            this.showScreen('setup');
        });
        
        // UI-Buttons aktivieren
        this.setupUIButtons();
        
        console.log('✅ Event-Listeners eingerichtet');
    }

    setupUIButtons() {
        // Settings-Button aktivieren
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.components.settingsModal.show();
            });
        }
        
        // Profile-Button aktivieren
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.showUserProfile();
            });
        }
    }
    
    
    /**
     * Add relay button to header
     */
    addRelayButton() {
        const header = document.querySelector('.app-controls');
        if (header && !document.getElementById('relayBtn')) {
            const relayBtn = document.createElement('button');
            relayBtn.id = 'relayBtn';
            relayBtn.className = 'btn btn-secondary';
            relayBtn.innerHTML = '🌐 Relays';
            relayBtn.addEventListener('click', () => {
                this.components.relayManager.show();
            });
            header.appendChild(relayBtn);
        }
    }

    async determineInitialState() {
        try {
            const hasKeys = await this.services.keyService.hasKeys();
            
            if (hasKeys) {
                console.log('🔑 Bestehende Schlüssel gefunden');
                this.showScreen('chat');
            } else {
                console.log('🆕 Keine Schlüssel gefunden, zeige Setup');
                this.showScreen('setup');
            }
        } catch (error) {
            console.error('❌ Fehler beim Bestimmen des initialen Zustands:', error);
            this.showScreen('setup');
        }
    }

    showScreen(screenName) {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;
        
        // Clear current content
        mainContent.innerHTML = '';
        
        // Hide/show header controls
        if (screenName === 'chat') {
            this.components.header.showControls();
            this.components.header.updateStatus(true);
        } else {
            this.components.header.hideControls();
            this.components.header.updateStatus(false);
        }
        
        // Show appropriate screen
        switch (screenName) {
            case 'setup':
                mainContent.appendChild(this.components.setup.render());
                break;
                
            case 'chat':
                mainContent.appendChild(this.components.chat.render());
                this.initializeChat();
                break;
                
            default:
                console.warn('⚠️ Unbekannter Screen:', screenName);
                this.showScreen('setup');
        }
        
        this.currentScreen = screenName;
        console.log(`📱 Screen gewechselt zu: ${screenName}`);
    }

    async initializeChat() {
        try {
            console.log('🚀 Beginne Chat-Initialisierung...');
            
            // Get current user
            const currentUser = await this.services.keyService.getCurrentUser();
            console.log('👤 Aktueller Benutzer:', currentUser);
            
            if (!currentUser) {
                throw new Error('Kein aktueller Benutzer gefunden');
            }
            
            // Initialize NOSTR service with keys
            console.log('🔧 Initialisiere NOSTR Service...');
            await this.services.nostrService.init(currentUser);
            
            // Connect to relays
            console.log('🌐 Verbinde zu Relays...');
            await this.services.relayService.connect();
            
            // Wait a bit for connections to establish
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check connection status
            const relayStatus = this.services.relayService.getStatus();
            console.log('📊 Relay-Status:', relayStatus);
            
            // Update status
            this.components.header.updateStatus(relayStatus.connectedRelays > 0);
            
            console.log('💬 Chat erfolgreich initialisiert!');
            this.services.toastService.showSuccess('Mit NOSTR-Netzwerk verbunden!');
            
        } catch (error) {
            console.error('❌ Chat-Initialisierung fehlgeschlagen:', error);
            this.services.toastService.showError('Fehler beim Verbinden mit NOSTR');
            
            // Continue anyway for testing
            console.log('⚠️ Fahre trotz Fehler fort...');
        }
    }

    destroy() {
        // Clean up components
        Object.values(this.components).forEach(component => {
            component.destroy?.();
        });
        
        // Clean up services
        Object.values(this.services).forEach(service => {
            service.destroy?.();
        });
        
        console.log('🧹 App bereinigt');
    }
}

// =================================================================
// Application Initialization
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM geladen, starte App...');
    
    try {
        const app = new NostrApp();
        await app.init();
        
        // Make app globally available for debugging
        window.nostrApp = app;
        
        console.log('🎉 DreamMall NOSTR Client bereit!');
        
    } catch (error) {
        console.error('💥 Kritischer Fehler beim Starten:', error);
        
        // Fallback error display
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = `
                <div class="app">
                    <div class="header">
                        <h1>❌ Fehler</h1>
                    </div>
                    <div class="setup">
                        <h2>Anwendung konnte nicht gestartet werden</h2>
                        <p>Bitte laden Sie die Seite neu oder überprüfen Sie die Konsole für Details.</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            🔄 Seite neu laden
                        </button>
                    </div>
                </div>
            `;
        }
    }
});

// =================================================================
// Global Error Handler
// =================================================================

window.addEventListener('error', (event) => {
    console.error('🚨 Globaler Fehler:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
});

console.log('📋 App-Skript geladen');
