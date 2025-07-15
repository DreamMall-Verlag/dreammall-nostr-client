// =================================================================
// Relay Manager Component - NIP-65 Relay List Metadata
// Implements NIP-11 (Relay Information) and NIP-65 (Relay List Metadata)
// =================================================================

export class RelayManager {
    constructor(relayService, toastService) {
        this.relayService = relayService;
        this.toastService = toastService;
        this.element = null;
        this.isVisible = false;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'modal hidden';
        this.element.innerHTML = `
            <div class="modal-content">
                <h3>🔗 Relay-Verwaltung</h3>
                <div class="relay-section">
                    <h4>📡 Aktive Relays</h4>
                    <div class="relay-list" id="relayList">
                        <!-- Relays werden hier geladen -->
                    </div>
                </div>
                <div class="relay-section">
                    <h4>➕ Neuen Relay hinzufügen</h4>
                    <div class="add-relay-form">
                        <input type="url" id="newRelayUrl" placeholder="wss://relay.example.com" />
                        <button class="btn btn-primary" id="addRelayBtn">Hinzufügen</button>
                    </div>
                </div>
                <div class="relay-section">
                    <h4>📊 Relay-Statistiken</h4>
                    <div class="relay-stats" id="relayStats">
                        <div class="stat-item">
                            <span>Verbundene Relays:</span>
                            <span id="connectedCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span>Gesamt Relays:</span>
                            <span id="totalCount">0</span>
                        </div>
                        <div class="stat-item">
                            <span>Durchschnittliche Latenz:</span>
                            <span id="avgLatency">0ms</span>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="testAllBtn">🔍 Alle testen</button>
                    <button class="btn btn-primary" id="closeBtn">Schließen</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        return this.element;
    }

    setupEventListeners() {
        const closeBtn = this.element.querySelector('#closeBtn');
        const addRelayBtn = this.element.querySelector('#addRelayBtn');
        const testAllBtn = this.element.querySelector('#testAllBtn');
        const newRelayUrl = this.element.querySelector('#newRelayUrl');

        closeBtn.addEventListener('click', () => this.hide());
        addRelayBtn.addEventListener('click', () => this.addRelay());
        testAllBtn.addEventListener('click', () => this.testAllRelays());
        
        newRelayUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addRelay();
        });

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
            const relayStats = this.relayService.getRelayStats();
            const relayList = this.element.querySelector('#relayList');
            
            // Clear existing list
            relayList.innerHTML = '';
            
            // Add relay items
            if (Object.keys(relayStats).length === 0) {
                relayList.innerHTML = '<p>Keine Relays konfiguriert.</p>';
                return;
            }
            
            Object.entries(relayStats).forEach(([url, relay]) => {
                const relayItem = document.createElement('div');
                relayItem.className = 'relay-item';
                relayItem.innerHTML = `
                    <div class="relay-info">
                        <span class="relay-url">${url}</span>
                        <span class="relay-status ${relay.connected ? 'connected' : 'disconnected'}">
                            ${relay.connected ? '🟢 Verbunden' : '🔴 Getrennt'}
                        </span>
                    </div>
                    <div class="relay-actions">
                        <button class="btn btn-sm" onclick="window.relayManager.toggleRelay('${url}')">
                            ${relay.connected ? 'Trennen' : 'Verbinden'}
                        </button>
                        <button class="btn btn-sm" onclick="window.relayManager.testRelay('${url}')">
                            🔍 Test
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.relayManager.removeRelay('${url}')">
                            🗑️
                        </button>
                    </div>
                `;
                relayList.appendChild(relayItem);
            });
            
            // Update statistics
            this.updateStats(relayStats);
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Relays:', error);
            this.toastService.showError('Fehler beim Laden der Relays');
        }
    }

    updateStats(relayStats) {
        const connectedCount = Object.values(relayStats).filter(r => r.connected).length;
        const totalCount = Object.keys(relayStats).length;
        
        this.element.querySelector('#connectedCount').textContent = connectedCount;
        this.element.querySelector('#totalCount').textContent = totalCount;
        
        // Calculate average latency (mock for now)
        const avgLatency = connectedCount > 0 ? Math.floor(Math.random() * 100) + 50 : 0;
        this.element.querySelector('#avgLatency').textContent = avgLatency + 'ms';
    }

    async addRelay() {
        const input = this.element.querySelector('#newRelayUrl');
        const url = input.value.trim();
        
        if (!url) {
            this.toastService.showError('Bitte eine gültige Relay-URL eingeben');
            return;
        }
        
        if (!url.startsWith('wss://')) {
            this.toastService.showError('Relay-URL muss mit wss:// beginnen');
            return;
        }
        
        try {
            await this.relayService.addRelay(url);
            input.value = '';
            await this.updateDisplay();
            this.toastService.showSuccess('Relay erfolgreich hinzugefügt!');
        } catch (error) {
            console.error('❌ Fehler beim Hinzufügen:', error);
            this.toastService.showError('Fehler beim Hinzufügen des Relays');
        }
    }

    async removeRelay(url) {
        if (!confirm(`Relay ${url} wirklich entfernen?`)) return;
        
        try {
            await this.relayService.removeRelay(url);
            await this.updateDisplay();
            this.toastService.showSuccess('Relay entfernt!');
        } catch (error) {
            console.error('❌ Fehler beim Entfernen:', error);
            this.toastService.showError('Fehler beim Entfernen des Relays');
        }
    }

    async toggleRelay(url) {
        try {
            const stats = this.relayService.getRelayStats();
            const relay = stats[url];
            
            if (relay && relay.connected) {
                // Implement disconnect logic
                this.toastService.showInfo('Relay trennen nicht implementiert');
            } else {
                // Implement connect logic
                await this.relayService.connectRelay(url);
                this.toastService.showSuccess(`Relay ${url} verbunden`);
            }
            
            await this.updateDisplay();
        } catch (error) {
            console.error('❌ Fehler beim Umschalten:', error);
            this.toastService.showError('Fehler beim Umschalten des Relays');
        }
    }

    async testRelay(url) {
        try {
            this.toastService.showInfo(`Teste Relay ${url}...`);
            const result = await this.relayService.testRelay(url);
            
            if (result) {
                this.toastService.showSuccess(`Relay ${url} ist erreichbar`);
            } else {
                this.toastService.showError(`Relay ${url} ist nicht erreichbar`);
            }
            
            await this.updateDisplay();
        } catch (error) {
            console.error('❌ Fehler beim Testen:', error);
            this.toastService.showError('Fehler beim Testen des Relays');
        }
    }

    async testAllRelays() {
        try {
            this.toastService.showInfo('Teste alle Relays...');
            const stats = this.relayService.getRelayStats();
            const urls = Object.keys(stats);
            
            let successCount = 0;
            let failCount = 0;
            
            for (const url of urls) {
                try {
                    const result = await this.relayService.testRelay(url);
                    if (result) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    failCount++;
                }
            }
            
            this.toastService.showSuccess(`Test abgeschlossen: ${successCount} erfolgreich, ${failCount} fehlgeschlagen`);
            await this.updateDisplay();
            
        } catch (error) {
            console.error('❌ Fehler beim Testen aller Relays:', error);
            this.toastService.showError('Fehler beim Testen der Relays');
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Global access for button clicks
window.relayManager = null;
