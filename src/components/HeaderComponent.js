// =================================================================
// Header Component - Status and Controls
// =================================================================

// Import modals
import { showUserProfileModal } from './ui/modals/UserProfileModal.js';
import { showKeySettingsModal } from './ui/modals/KeySettingsModal.js';
import { showRelaySettingsModal } from './ui/modals/RelaySettingsModal.js';

export class HeaderComponent {
    constructor(title = 'DreamMall NOSTR Client') {
        this.title = title;
        this.element = null;
        this.isConnected = false;
        this.services = null; // Will be set by parent
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'header';
        this.element.innerHTML = `
            <h1>🌟 ${this.title}</h1>
            <div class="status">
                <span class="status-dot offline" id="statusDot"></span>
                <span id="statusText">Nicht verbunden</span>
            </div>
            <div class="chat-controls" id="controls" style="display: none;">
                                    <button class="btn btn-sm" id="userBtn" title="Dein Profil">👤</button>

                <button class="btn btn-sm" id="settingsBtn">⚙️</button>
                <button class="btn btn-sm" id="relaysBtn">🔗</button>
            </div>
        `;

        this.setupEventListeners();
        return this.element;
    }

    setupEventListeners() {
        const userBtn = this.element.querySelector('#userBtn');
        const settingsBtn = this.element.querySelector('#settingsBtn');
        const relaysBtn = this.element.querySelector('#relaysBtn');

        userBtn.addEventListener('click', () => {
            if (this.services) {
                showUserProfileModal(this.services.keyService, this.services.toastService);
            } else {
                console.error('Services not set for HeaderComponent');
            }
        });

        settingsBtn?.addEventListener('click', () => {
            if (this.services) {
                showKeySettingsModal(this.services.keyService, this.services.toastService);
            } else {
                console.error('Services not set for HeaderComponent');
            }
        });

        relaysBtn?.addEventListener('click', () => {
            if (this.services) {
                showRelaySettingsModal(this.services.relayService, this.services.toastService);
            } else {
                console.error('Services not set for HeaderComponent');
            }
        });
    }

    updateStatus(connected) {
        this.isConnected = connected;
        const statusDot = this.element.querySelector('#statusDot');
        const statusText = this.element.querySelector('#statusText');
        
        if (connected) {
            statusDot.classList.replace('offline', 'online');
            statusText.textContent = 'Verbunden';
        } else {
            statusDot.classList.replace('online', 'offline');
            statusText.textContent = 'Nicht verbunden';
        }
    }

    showControls() {
        const controls = this.element.querySelector('#controls');
        controls.style.display = 'flex';
    }

    hideControls() {
        const controls = this.element.querySelector('#controls');
        controls.style.display = 'none';
    }



    /**
     * Set services for the header component
     */
    setServices(services) {
        this.services = services;
        console.log('📦 Services an HeaderComponent übergeben');
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}
