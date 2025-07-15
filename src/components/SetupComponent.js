// =================================================================
// Setup Component - Key Generation & Import
// Implements NIP-06 (Key derivation) and NIP-49 (Key encryption)
// =================================================================

export class SetupComponent {
    constructor(keyService, toastService) {
        this.keyService = keyService;
        this.toastService = toastService;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'setup';
        this.element.innerHTML = `
            <h2>🔐 Willkommen zu NOSTR</h2>
            <p>Erstelle deine NOSTR-Identität oder importiere bestehende Schlüssel</p>
            <div class="setup-buttons">
                <button class="btn btn-primary" id="generateBtn">
                    🔑 Neue Schlüssel generieren
                </button>
                <button class="btn btn-secondary" id="importBtn">
                    📥 Schlüssel importieren
                </button>
            </div>
        `;

        this.setupEventListeners();
        return this.element;
    }

    setupEventListeners() {
        const generateBtn = this.element.querySelector('#generateBtn');
        const importBtn = this.element.querySelector('#importBtn');

        generateBtn.addEventListener('click', () => this.handleGenerate());
        importBtn.addEventListener('click', () => this.handleImport());
    }

    async handleGenerate() {
        try {
            // Für jetzt ignorieren wir das Passwort und generieren einfach die Schlüssel
            // Das Passwort-Feature kann später implementiert werden
            this.toastService.showInfo('Generiere Schlüssel...');
            const keys = await this.keyService.generateKeyPair();
            
            this.toastService.showSuccess('Schlüssel erfolgreich generiert!');
            this.dispatchEvent('keysGenerated', { keys });
        } catch (error) {
            console.error('❌ Schlüsselgenerierung fehlgeschlagen:', error);
            this.toastService.showError('Fehler beim Generieren der Schlüssel');
        }
    }

    async handleImport() {
        try {
            const privateKey = prompt('Privater Schlüssel (nsec... oder hex):');
            if (!privateKey) return;

            this.toastService.showInfo('Importiere Schlüssel...');
            await this.keyService.importKeys(privateKey);
            
            this.toastService.showSuccess('Schlüssel erfolgreich importiert!');
            this.dispatchEvent('keysImported');
        } catch (error) {
            console.error('❌ Schlüsselimport fehlgeschlagen:', error);
            this.toastService.showError('Fehler beim Importieren der Schlüssel');
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
