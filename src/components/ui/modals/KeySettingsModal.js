// =================================================================
// Key Settings Modal - Zeigt Schlüssel-Einstellungen an
// =================================================================

export function showKeySettingsModal(keyService, toastService) {
    console.log('🔑 Öffne Schlüssel-Einstellungen...');
    
    try {
        // Get current user data
        const currentUser = keyService.getCurrentUser();
        if (!currentUser) {
            toastService.showError('Kein Benutzer gefunden');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>🔑 Schlüssel-Einstellungen</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Öffentlicher Schlüssel (Hex):</label>
                        <input type="text" id="publicKeyHex" value="${currentUser.publicKey}" readonly>
                        <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('publicKeyHex')">Kopieren</button>
                    </div>
                    <div class="form-group">
                        <label>NPUB:</label>
                        <input type="text" id="npubKey" value="${currentUser.npub || 'Nicht verfügbar'}" readonly>
                        <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('npubKey')">Kopieren</button>
                    </div>
                    <div class="form-group">
                        <label>Privater Schlüssel (Hex):</label>
                        <input type="password" id="privateKeyHex" value="${currentUser.privateKey || 'Nicht verfügbar'}" readonly>
                        <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('privateKeyHex')">Kopieren</button>
                    </div>
                    <div class="form-group">
                        <label>NSEC:</label>
                        <input type="password" id="nsecKey" value="${currentUser.nsec || 'Nicht verfügbar'}" readonly>
                        <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('nsecKey')">Kopieren</button>
                    </div>
                    <div class="warning-box">
                        <p>⚠️ <strong>Warnung:</strong> Teilen Sie niemals Ihren privaten Schlüssel mit anderen!</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-danger" onclick="generateNewKeys()">🔄 Neue Schlüssel generieren</button>
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Schließen</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Global functions für Modal-Aktionen
        window.copyToClipboard = (elementId) => {
            const element = document.getElementById(elementId);
            if (element) {
                navigator.clipboard.writeText(element.value);
                toastService.showSuccess('In Zwischenablage kopiert');
            }
        };
        
        window.generateNewKeys = () => {
            if (confirm('Sind Sie sicher, dass Sie neue Schlüssel generieren möchten? Dies wird alle bestehenden Verbindungen trennen.')) {
                keyService.generateNewKeys();
                modal.remove();
                toastService.showSuccess('Neue Schlüssel generiert');
                // Reload page to apply new keys
                setTimeout(() => location.reload(), 1000);
            }
        };
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Schlüssel-Einstellungen:', error);
        toastService.showError('Fehler beim Laden der Schlüssel-Einstellungen');
    }
}
