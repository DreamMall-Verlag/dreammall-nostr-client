// =================================================================
// Relay Settings Modal - Zeigt Relay-Einstellungen an
// =================================================================

export function showRelaySettingsModal(relayService, toastService) {
    console.log('📡 Öffne Relay-Einstellungen...');
    
    try {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>📡 Relay-Einstellungen</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Neues Relay hinzufügen:</label>
                        <div class="input-group">
                            <input type="text" id="newRelayUrl" placeholder="wss://relay.example.com" />
                            <button class="btn btn-primary" onclick="addNewRelay()">Hinzufügen</button>
                        </div>
                    </div>
                    
                    <div class="relay-list" id="relayList">
                        <h4>Aktuelle Relays:</h4>
                        <div id="relayItems">
                            <!-- Wird dynamisch gefüllt -->
                        </div>
                    </div>
                    
                    <div class="relay-stats" id="relayStats">
                        <h4>Statistiken:</h4>
                        <div id="statsContent">
                            <!-- Wird dynamisch gefüllt -->
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="resetToDefaults()">🔄 Standard wiederherstellen</button>
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Schließen</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Relay-Liste laden
        updateRelayList();
        
        // Global functions für Modal-Aktionen
        window.addNewRelay = () => {
            const input = document.getElementById('newRelayUrl');
            const url = input.value.trim();
            
            if (!url) {
                toastService.showError('Bitte geben Sie eine Relay-URL ein');
                return;
            }
            
            if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
                toastService.showError('Relay-URL muss mit ws:// oder wss:// beginnen');
                return;
            }
            
            try {
                relayService.addRelay(url);
                input.value = '';
                updateRelayList();
                toastService.showSuccess('Relay hinzugefügt');
            } catch (error) {
                console.error('Fehler beim Hinzufügen des Relays:', error);
                toastService.showError('Fehler beim Hinzufügen des Relays');
            }
        };
        
        window.removeRelay = (url) => {
            if (confirm(`Relay "${url}" wirklich entfernen?`)) {
                try {
                    relayService.removeRelay(url);
                    updateRelayList();
                    toastService.showSuccess('Relay entfernt');
                } catch (error) {
                    console.error('Fehler beim Entfernen des Relays:', error);
                    toastService.showError('Fehler beim Entfernen des Relays');
                }
            }
        };
        
        window.resetToDefaults = () => {
            if (confirm('Alle Relays auf Standardwerte zurücksetzen?')) {
                try {
                    relayService.resetToDefaults();
                    updateRelayList();
                    toastService.showSuccess('Relays auf Standard zurückgesetzt');
                } catch (error) {
                    console.error('Fehler beim Zurücksetzen der Relays:', error);
                    toastService.showError('Fehler beim Zurücksetzen der Relays');
                }
            }
        };
        
        function updateRelayList() {
            const relayItems = document.getElementById('relayItems');
            const statsContent = document.getElementById('statsContent');
            
            if (!relayItems || !statsContent) return;
            
            // Get relay info
            const relays = relayService.getRelays();
            const relayStats = relayService.getRelayStats();
            
            // Calculate stats from relay data
            const stats = {
                total: relays.length,
                connected: relays.filter(r => r.connected).length,
                disconnected: relays.filter(r => !r.connected).length
            };
            
            // Update relay list
            relayItems.innerHTML = relays.map(relay => `
                <div class="relay-item">
                    <div class="relay-url">${relay.url}</div>
                    <div class="relay-status ${relay.connected ? 'connected' : 'disconnected'}">
                        ${relay.connected ? '🟢 Verbunden' : '🔴 Getrennt'}
                    </div>
                    <div class="relay-actions">
                        <button class="btn btn-sm btn-danger" onclick="removeRelay('${relay.url}')">
                            Entfernen
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Update stats
            statsContent.innerHTML = `
                <div class="stat-item">
                    <span>Gesamte Relays:</span>
                    <span>${stats.total}</span>
                </div>
                <div class="stat-item">
                    <span>Verbundene Relays:</span>
                    <span>${stats.connected}</span>
                </div>
                <div class="stat-item">
                    <span>Getrennte Relays:</span>
                    <span>${stats.disconnected}</span>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Relay-Einstellungen:', error);
        toastService.showError('Fehler beim Laden der Relay-Einstellungen');
    }
}
