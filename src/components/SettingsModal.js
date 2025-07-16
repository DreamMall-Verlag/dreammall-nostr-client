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
        this.element.className = 'modal-overlay';
        this.element.style.display = 'none';
        this.element.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>⚙️ Einstellungen</h3>
                    <button class="modal-close" id="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="settings-section">
                        <h4>🔑 Schlüssel-Verwaltung</h4>
                        <div class="key-info-display">
                            <div class="form-group">
                                <label>Öffentlicher Schlüssel:</label>
                                <div class="key-display" id="publicKeyDisplay">Lädt...</div>
                                <button class="btn btn-sm btn-secondary" id="copyPublicBtn">📋 Kopieren</button>
                            </div>
                            <div class="form-group">
                                <label>Privater Schlüssel:</label>
                                <div class="key-display" id="privateKeyDisplay">••••••••••••••••••••••••••••••••</div>
                                <button class="btn btn-sm btn-secondary" id="showPrivateBtn">👁️ Anzeigen</button>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-secondary" id="exportBtn">💾 Exportieren</button>
                            <button class="btn btn-secondary" id="importBtn">📥 Importieren</button>
                            <button class="btn btn-danger" id="deleteBtn">🗑️ Schlüssel löschen</button>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h4>🎨 Darstellung</h4>
                        <div class="form-group">
                            <label>Theme:</label>
                            <select id="themeSelect">
                                <option value="light">Hell</option>
                                <option value="dark">Dunkel</option>
                                <option value="auto">Automatisch</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelBtn">Abbrechen</button>
                    <button class="btn btn-primary" id="saveBtn">Speichern</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        return this.element;
    }

    setupEventListeners() {
        const closeModal = this.element.querySelector('#closeModal');
        const cancelBtn = this.element.querySelector('#cancelBtn');
        const saveBtn = this.element.querySelector('#saveBtn');
        const copyPublicBtn = this.element.querySelector('#copyPublicBtn');
        const showPrivateBtn = this.element.querySelector('#showPrivateBtn');
        const exportBtn = this.element.querySelector('#exportBtn');
        const importBtn = this.element.querySelector('#importBtn');
        const deleteBtn = this.element.querySelector('#deleteBtn');

        // Close modal handlers
        closeModal.addEventListener('click', () => this.hide());
        cancelBtn.addEventListener('click', () => this.hide());
        
        // Click outside to close
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });

        // Save button (for theme changes)
        saveBtn.addEventListener('click', () => {
            const theme = this.element.querySelector('#themeSelect').value;
            localStorage.setItem('theme', theme);
            this.applyTheme(theme);
            this.toastService.showSuccess('Einstellungen gespeichert');
            this.hide();
        });

        // Copy public key
        copyPublicBtn.addEventListener('click', () => {
            const publicKey = this.element.querySelector('#publicKeyDisplay').textContent;
            navigator.clipboard.writeText(publicKey).then(() => {
                this.toastService.showSuccess('Öffentlicher Schlüssel kopiert');
            }).catch(() => {
                this.toastService.showError('Fehler beim Kopieren');
            });
        });

        // Show/hide private key
        showPrivateBtn.addEventListener('click', () => {
            this.togglePrivateKey();
        });

        // Export keys
        exportBtn.addEventListener('click', () => {
            this.exportKeys();
        });

        // Import keys
        importBtn.addEventListener('click', () => {
            this.importKeys();
        });

        // Delete keys
        deleteBtn.addEventListener('click', () => {
            this.deleteKeys();
        });
    }

    async show() {
        this.element.style.display = 'flex';
        // Trigger animation
        setTimeout(() => {
            this.element.classList.add('show');
        }, 10);
        this.isVisible = true;
        await this.updateDisplay();
    }

    hide() {
        this.element.classList.remove('show');
        // Wait for animation to complete
        setTimeout(() => {
            this.element.style.display = 'none';
        }, 300);
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

    togglePrivateKey() {
        const privateKeyDisplay = this.element.querySelector('#privateKeyDisplay');
        const showPrivateBtn = this.element.querySelector('#showPrivateBtn');
        
        if (privateKeyDisplay.textContent.includes('••••')) {
            // Show private key
            this.keyService.getCurrentUser().then(user => {
                if (user) {
                    privateKeyDisplay.textContent = user.privateKey;
                    showPrivateBtn.textContent = '🙈 Verstecken';
                }
            });
        } else {
            // Hide private key
            privateKeyDisplay.textContent = '••••••••••••••••••••••••••••••••';
            showPrivateBtn.textContent = '👁️ Anzeigen';
        }
    }

    exportKeys() {
        try {
            this.keyService.exportKeys().then(exportData => {
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'nostr-keys.json';
                a.click();
                URL.revokeObjectURL(url);
                this.toastService.showSuccess('Schlüssel exportiert');
            });
        } catch (error) {
            this.toastService.showError('Fehler beim Exportieren');
        }
    }

    importKeys() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        this.keyService.importKeys(importData).then(() => {
                            this.toastService.showSuccess('Schlüssel importiert');
                            this.updateDisplay();
                        });
                    } catch (error) {
                        this.toastService.showError('Fehler beim Importieren');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    deleteKeys() {
        if (confirm('Sind Sie sicher, dass Sie alle Schlüssel löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            this.keyService.deleteKeys().then(() => {
                this.toastService.showSuccess('Schlüssel gelöscht');
                this.hide();
                // Reload page to show setup
                location.reload();
            });
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
}
