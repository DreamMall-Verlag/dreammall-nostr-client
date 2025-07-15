// =================================================================
// Settings Modal Component - Key Management
// Implements NIP-49 (Private Key Encryption) and NIP-06 (Key derivation)
// =================================================================

export class SettingsModal {
    constructor(keyService, toastService) {
        this.keyService = keyService;
        this.toastService = toastService;
        this.element = null;
        this.isVisible = false;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal hidden';
        this.element.innerHTML = `
            <div class="modal-content">
                <div class="settings-section">
                    <h4>🔑 Schlüssel-Verwaltung</h4>
                    <div class="key-info-display">
                        <div class="key-display-item">
                            <span>Öffentlicher Schlüssel:</span>
                            <code id="publicKeyDisplay">Lädt...</code>
                            <button class="btn btn-sm" id="copyPublicBtn">📋</button>
                        </div>
                        <div class="key-display-item">
                            <span>Privater Schlüssel:</span>
                            <code>••••••••••••••••••••••••••••••••</code>
                            <button class="btn btn-sm" id="showPrivateBtn">👁️</button>
                        </div>
                    </div>
                    <div class="settings-actions">
                        <button class="btn btn-secondary" id="exportBtn">💾 Exportieren</button>
                        <button class="btn btn-secondary" id="importBtn">📥 Importieren</button>
                        <button class="btn btn-danger" id="deleteBtn">🗑️ Schlüssel löschen</button>
                    </div>
                </div>
                <div class="settings-section">
                    <h4>🎨 Darstellung</h4>
                    <div class="setting-item">
                        <label>Theme:</label>
                        <select id="themeSelect">
                            <option value="light">Hell</option>
                            <option value="dark">Dunkel</option>
                            <option value="auto">Automatisch</option>
                        </select>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="closeBtn">Schließen</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        return this.element;
    }

    setupEventListeners() {
        const closeBtn = this.element.querySelector('#closeBtn');
        const copyPublicBtn = this.element.querySelector('#copyPublicBtn');
        const showPrivateBtn = this.element.querySelector('#showPrivateBtn');
        const exportBtn = this.element.querySelector('#exportBtn');
        const importBtn = this.element.querySelector('#importBtn');
        const deleteBtn = this.element.querySelector('#deleteBtn');

        closeBtn.addEventListener('click', () => this.hide());
        copyPublicBtn.addEventListener('click', () => this.copyPublicKey());
        showPrivateBtn.addEventListener('click', () => this.showPrivateKey());
        exportBtn.addEventListener('click', () => this.exportKeys());
        importBtn.addEventListener('click', () => this.importKeys());
        deleteBtn.addEventListener('click', () => this.deleteKeys());

        // Close on outside click
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    async show() {
        this.element.classList.remove('hidden');
        this.isVisible = true;
        await this.updateDisplay();
    }

    hide() {
        this.element.classList.add('hidden');
        this.isVisible = false;
    }

    async updateDisplay() {
        try {
            const user = await this.keyService.getCurrentUser();
            if (user) {
                const publicKeyDisplay = this.element.querySelector('#publicKeyDisplay');
                publicKeyDisplay.textContent = user.publicKey;
            }
        } catch (error) {
            console.error('❌ Fehler beim Laden der Benutzerdaten:', error);
        }
    }

    async copyPublicKey() {
        try {
            const user = await this.keyService.getCurrentUser();
            if (user) {
                await navigator.clipboard.writeText(user.publicKey);
                this.toastService.showSuccess('Öffentlicher Schlüssel kopiert!');
            }
        } catch (error) {
            console.error('❌ Fehler beim Kopieren:', error);
            this.toastService.showError('Fehler beim Kopieren');
        }
    }

    async showPrivateKey() {
        try {
            // Check if we have keys
            const user = await this.keyService.getCurrentUser();
            if (!user) {
                this.toastService.showError('Keine Schlüssel vorhanden');
                return;
            }

            // Check if keys are encrypted (imported with password)
            const keyPair = this.keyService.keyPair;
            let keys;

            if (keyPair && keyPair.encrypted) {
                // Keys are encrypted, need password
                const password = prompt('Passwort eingeben:');
                if (!password) return;
                
                keys = await this.keyService.getDecryptedKeys(password);
            } else {
                // Keys are not encrypted (generated), no password needed
                keys = await this.keyService.getDecryptedKeys();
            }

            if (keys) {
                // Show private key in a secure way
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>🔑 Privater Schlüssel</h3>
                        <div class="key-display">
                            <label>Privater Schlüssel (nsec):</label>
                            <input type="text" value="${keys.privateKey}" readonly onclick="this.select()" />
                            <small>⚠️ Niemals teilen! Klicken um zu kopieren.</small>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                                Schließen
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
        } catch (error) {
            console.error('❌ Fehler beim Entschlüsseln:', error);
            this.toastService.showError('Falsches Passwort');
        }
    }

    async exportKeys() {
        try {
            // Check if we have keys
            const user = await this.keyService.getCurrentUser();
            if (!user) {
                this.toastService.showError('Keine Schlüssel vorhanden');
                return;
            }

            // Check if keys are encrypted (imported with password)
            const keyPair = this.keyService.keyPair;
            let keys;

            if (keyPair && keyPair.encrypted) {
                // Keys are encrypted, need password
                const password = prompt('Passwort eingeben:');
                if (!password) return;
                
                // TODO: Implement password-based decryption for export
                this.toastService.showError('Passwort-basierte Entschlüsselung noch nicht implementiert');
                return;
            } else {
                // Keys are not encrypted (generated), no password needed
                keys = await this.keyService.exportKeys();
            }

            if (keys) {
                const dataStr = JSON.stringify(keys, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                
                const exportFileDefaultName = 'nostr-keys-backup.json';
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
                
                this.toastService.showSuccess('Schlüssel erfolgreich exportiert!');
            }
        } catch (error) {
            console.error('❌ Fehler beim Exportieren:', error);
            this.toastService.showError('Fehler beim Exportieren');
        }
    }

    async importKeys() {
        try {
            const privateKey = prompt('Privater Schlüssel (nsec... oder hex):');
            if (!privateKey) return;

            // For now, we don't support password-based encryption during import
            // The password functionality can be added later
            await this.keyService.importKeys(privateKey);
            await this.updateDisplay();
            
            this.toastService.showSuccess('Schlüssel erfolgreich importiert!');
            this.dispatchEvent('keysImported');
        } catch (error) {
            console.error('❌ Fehler beim Importieren:', error);
            this.toastService.showError('Fehler beim Importieren der Schlüssel');
        }
    }

    async deleteKeys() {
        if (!confirm('Alle Schlüssel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
            return;
        }

        try {
            await this.keyService.deleteKeys();
            this.toastService.showSuccess('Schlüssel erfolgreich gelöscht');
            this.hide();
            this.dispatchEvent('keysDeleted');
        } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            this.toastService.showError('Fehler beim Löschen der Schlüssel');
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}
