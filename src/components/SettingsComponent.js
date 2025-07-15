// =================================================================
// Settings Component - User Settings Management
// =================================================================

export class SettingsComponent {
    constructor(services) {
        this.services = services;
        this.keyService = services.keyService;
        this.relayService = services.relayService;
        this.toastService = services.toastService;
        this.isVisible = false;
    }

    // =================================================================
    // Main Settings Interface
    // =================================================================

    show() {
        this.isVisible = true;
        this.render();
    }

    hide() {
        this.isVisible = false;
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.remove();
        }
    }

    async render() {
        const keyPair = await this.keyService.getKeyPair();
        const keyStatus = this.keyService.getKeyStatus();
        const relayStats = this.relayService.getRelayStats();

        const settingsHTML = `
            <div class="settings-modal" id="settings-modal">
                <div class="settings-content">
                    <div class="settings-header">
                        <h2>⚙️ Einstellungen</h2>
                        <button class="btn btn-sm close-btn" id="close-settings">✕</button>
                    </div>
                    
                    <div class="settings-sections">
                        <!-- Identity Section -->
                        <div class="settings-section">
                            <h3>🔑 Ihre NOSTR-Identität</h3>
                            <div class="identity-info">
                                <div class="identity-item">
                                    <label>Öffentlicher Schlüssel:</label>
                                    <div class="key-display">
                                        <code class="public-key">${keyPair?.npub || 'Nicht verfügbar'}</code>
                                        <button class="btn btn-sm copy-btn" data-copy="${keyPair?.npub || ''}">📋</button>
                                    </div>
                                </div>
                                <div class="identity-item">
                                    <label>Kurzer Schlüssel:</label>
                                    <code class="short-key">${this.keyService.getFormattedPublicKey()}</code>
                                </div>
                            </div>
                            <div class="identity-actions">
                                <button class="btn btn-secondary" id="show-private-key">🔍 Private Schlüssel anzeigen</button>
                                <button class="btn btn-secondary" id="export-keys">📤 Backup erstellen</button>
                                <button class="btn btn-danger" id="delete-keys">🗑️ Schlüssel löschen</button>
                            </div>
                        </div>

                        <!-- Relay Section -->
                        <div class="settings-section">
                            <h3>🌐 Relay-Verbindungen</h3>
                            <div class="relay-stats">
                                <p>Aktive Relays: <span class="relay-count">${relayStats.connected}/${relayStats.total}</span></p>
                            </div>
                            <button class="btn btn-primary" id="manage-relays">🔧 Relays verwalten</button>
                        </div>

                        <!-- Profile Section -->
                        <div class="settings-section">
                            <h3>👤 Profil</h3>
                            <div class="profile-form">
                                <div class="form-group">
                                    <label>Name:</label>
                                    <input type="text" id="profile-name" placeholder="Ihr Name">
                                </div>
                                <div class="form-group">
                                    <label>Beschreibung:</label>
                                    <textarea id="profile-about" placeholder="Über Sie..."></textarea>
                                </div>
                                <div class="form-group">
                                    <label>Profilbild URL:</label>
                                    <input type="url" id="profile-picture" placeholder="https://...">
                                </div>
                                <button class="btn btn-primary" id="save-profile">💾 Profil speichern</button>
                            </div>
                        </div>

                        <!-- App Settings -->
                        <div class="settings-section">
                            <h3>🎨 App-Einstellungen</h3>
                            <div class="app-settings">
                                <div class="setting-item">
                                    <label>
                                        <input type="checkbox" id="dark-mode"> 
                                        Dunkles Theme
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <label>
                                        <input type="checkbox" id="notifications" checked> 
                                        Benachrichtigungen
                                    </label>
                                </div>
                                <div class="setting-item">
                                    <label>
                                        <input type="checkbox" id="sound-enabled" checked> 
                                        Sound-Benachrichtigungen
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', settingsHTML);
        this.setupEventListeners();
        await this.loadProfileData();
    }

    // =================================================================
    // Event Listeners
    // =================================================================

    setupEventListeners() {
        // Close button
        document.getElementById('close-settings').addEventListener('click', () => this.hide());

        // Identity actions
        document.getElementById('show-private-key').addEventListener('click', () => this.showPrivateKey());
        document.getElementById('export-keys').addEventListener('click', () => this.exportKeys());
        document.getElementById('delete-keys').addEventListener('click', () => this.deleteKeys());

        // Relay management
        document.getElementById('manage-relays').addEventListener('click', () => this.showRelayManager());

        // Profile management
        document.getElementById('save-profile').addEventListener('click', () => this.saveProfile());

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.dataset.copy;
                navigator.clipboard.writeText(text);
                this.toastService.success('In Zwischenablage kopiert!');
            });
        });

        // App settings
        document.getElementById('dark-mode').addEventListener('change', (e) => {
            this.toggleDarkMode(e.target.checked);
        });

        // Close on outside click
        document.getElementById('settings-modal').addEventListener('click', (e) => {
            if (e.target.id === 'settings-modal') {
                this.hide();
            }
        });
    }

    // =================================================================
    // Identity Management
    // =================================================================

    async showPrivateKey() {
        try {
            const keyPair = await this.keyService.getKeyPair();
            if (keyPair) {
                const modal = `
                    <div class="key-modal">
                        <div class="key-modal-content">
                            <h3>🔑 Private Schlüssel</h3>
                            <div class="key-warning">
                                <p>⚠️ <strong>WARNUNG:</strong> Teilen Sie diese Schlüssel niemals mit anderen!</p>
                            </div>
                            <div class="key-display-item">
                                <label>Privater Schlüssel (nsec):</label>
                                <div class="key-display">
                                    <input type="password" value="${keyPair.nsec}" readonly onclick="this.select(); this.type='text'">
                                    <button class="btn btn-sm copy-btn" data-copy="${keyPair.nsec}">📋</button>
                                </div>
                                <small>Klicken um anzuzeigen</small>
                            </div>
                            <div class="key-display-item">
                                <label>Hex Private Key:</label>
                                <div class="key-display">
                                    <input type="password" value="${keyPair.secretKey}" readonly onclick="this.select(); this.type='text'">
                                    <button class="btn btn-sm copy-btn" data-copy="${keyPair.secretKey}">📋</button>
                                </div>
                            </div>
                            <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">Schließen</button>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', modal);
                
                // Setup copy buttons for the modal
                document.querySelectorAll('.copy-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const text = e.target.dataset.copy;
                        navigator.clipboard.writeText(text);
                        this.toastService.success('In Zwischenablage kopiert!');
                    });
                });
            }
        } catch (error) {
            this.toastService.error('Fehler beim Anzeigen der Schlüssel: ' + error.message);
        }
    }

    async exportKeys() {
        try {
            const exported = await this.keyService.exportKeys();
            if (exported) {
                const blob = new Blob([exported], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `nostr-keys-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                this.toastService.success('Backup erfolgreich erstellt!');
            }
        } catch (error) {
            this.toastService.error('Backup-Erstellung fehlgeschlagen: ' + error.message);
        }
    }

    async deleteKeys() {
        if (confirm('Sind Sie sicher, dass Sie Ihre Schlüssel löschen möchten? Dies kann nicht rückgängig gemacht werden!')) {
            try {
                await this.keyService.deleteKeys();
                this.toastService.success('Schlüssel erfolgreich gelöscht');
                this.hide();
                // Reload page to show setup again
                window.location.reload();
            } catch (error) {
                this.toastService.error('Löschen fehlgeschlagen: ' + error.message);
            }
        }
    }

    // =================================================================
    // Relay Management
    // =================================================================

    showRelayManager() {
        this.hide();
        // Create and show relay manager
        const relayManager = new RelayManagerComponent(this.services);
        relayManager.show();
    }

    // =================================================================
    // Profile Management
    // =================================================================

    async loadProfileData() {
        try {
            const profile = await this.keyService.getProfile();
            if (profile) {
                document.getElementById('profile-name').value = profile.name || '';
                document.getElementById('profile-about').value = profile.about || '';
                document.getElementById('profile-picture').value = profile.picture || '';
            }
        } catch (error) {
            console.error('Fehler beim Laden des Profils:', error);
        }
    }

    async saveProfile() {
        try {
            const profileData = {
                name: document.getElementById('profile-name').value,
                about: document.getElementById('profile-about').value,
                picture: document.getElementById('profile-picture').value
            };

            await this.keyService.updateProfile(profileData);
            this.toastService.success('Profil erfolgreich gespeichert!');
        } catch (error) {
            this.toastService.error('Profil speichern fehlgeschlagen: ' + error.message);
        }
    }

    // =================================================================
    // App Settings
    // =================================================================

    toggleDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('darkMode', 'true');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('darkMode', 'false');
        }
    }
}
