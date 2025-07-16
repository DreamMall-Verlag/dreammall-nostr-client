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
        this.element.className = 'modal-overlay';
        this.element.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>🔗 Relay-Verwaltung</h3>
                    <button class="modal-close" id="closeModal">×</button>
                </div>
                <div class="modal-body">
                    <div class="relay-section">
                        <h4>📡 Aktive Relays</h4>
                        <div class="relay-list" id="relayList">
                            <!-- Relays werden hier geladen -->
                        </div>
                    </div>
                    
                    <div class="relay-section">
                        <h4>➕ Neuen Relay hinzufügen</h4>
                        <div class="form-group">
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
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="testAllBtn">🔄 Alle testen</button>
                    <button class="btn btn-primary" id="closeBtn">Schließen</button>
                </div>
            </div>
        `;

        this.setupEventListeners();
        return this.element;
    }

    setupEventListeners() {
        const closeModal = this.element.querySelector('#closeModal');
        const closeBtn = this.element.querySelector('#closeBtn');
        const addRelayBtn = this.element.querySelector('#addRelayBtn');
        const testAllBtn = this.element.querySelector('#testAllBtn');
        const newRelayUrl = this.element.querySelector('#newRelayUrl');

        // Close modal handlers
        closeModal.addEventListener('click', () => this.hide());
        closeBtn.addEventListener('click', () => this.hide());
        
        // Click outside to close
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });

        addRelayBtn.addEventListener('click', () => this.addRelay());
        testAllBtn.addEventListener('click', () => this.testAllRelays());
        
        newRelayUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addRelay();
        });
    }

    show() {
        if (this.isVisible) return;
        
        this.isVisible = true;
        this.element.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Update relay list
        this.updateRelayList();
        this.updateStats();
        
        // Animation
        requestAnimationFrame(() => {
            this.element.querySelector('.modal').style.transform = 'translateY(0)';
            this.element.querySelector('.modal').style.opacity = '1';
        });
    }

    hide() {
        if (!this.isVisible) return;
        
        this.isVisible = false;
        this.element.classList.remove('active');
        document.body.style.overflow = '';
        
        // Animation
        this.element.querySelector('.modal').style.transform = 'translateY(-20px)';
        this.element.querySelector('.modal').style.opacity = '0';
        
        setTimeout(() => {
            if (this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
        }, 300);
    }

    updateRelayList() {
        const relayList = this.element.querySelector('#relayList');
        const relays = this.relayService.getRelays();
        
        if (relays.length === 0) {
            relayList.innerHTML = '<div class="empty-state">Keine Relays konfiguriert</div>';
            return;
        }
        
        relayList.innerHTML = relays.map(relay => `
            <div class="relay-item" data-url="${relay.url}">
                <div class="relay-info">
                    <div class="relay-url">${relay.url}</div>
                    <div class="relay-status ${relay.connected ? 'connected' : 'disconnected'}">
                        ${relay.connected ? '🟢 Verbunden' : '🔴 Getrennt'}
                    </div>
                </div>
                <div class="relay-actions">
                    <button class="btn btn-sm btn-secondary" onclick="this.closest('.relay-item').dispatchEvent(new CustomEvent('test-relay'))">
                        🔄 Testen
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="this.closest('.relay-item').dispatchEvent(new CustomEvent('remove-relay'))">
                        🗑️ Entfernen
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to relay items
        relayList.querySelectorAll('.relay-item').forEach(item => {
            item.addEventListener('test-relay', () => this.testRelay(item.dataset.url));
            item.addEventListener('remove-relay', () => this.removeRelay(item.dataset.url));
        });
    }

    updateStats() {
        const relays = this.relayService.getRelays();
        const connectedCount = relays.filter(r => r.connected).length;
        const totalCount = relays.length;
        const avgLatency = relays.reduce((sum, r) => sum + (r.latency || 0), 0) / totalCount || 0;
        
        this.element.querySelector('#connectedCount').textContent = connectedCount;
        this.element.querySelector('#totalCount').textContent = totalCount;
        this.element.querySelector('#avgLatency').textContent = `${Math.round(avgLatency)}ms`;
    }

    addRelay() {
        const urlInput = this.element.querySelector('#newRelayUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.toastService.showError('Bitte geben Sie eine Relay-URL ein');
            return;
        }
        
        if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
            this.toastService.showError('Relay-URL muss mit ws:// oder wss:// beginnen');
            return;
        }
        
        try {
            this.relayService.addRelay(url);
            urlInput.value = '';
            this.updateRelayList();
            this.updateStats();
            this.toastService.showSuccess('Relay hinzugefügt');
        } catch (error) {
            this.toastService.showError('Fehler beim Hinzufügen des Relays');
        }
    }

    removeRelay(url) {
        if (confirm(`Sind Sie sicher, dass Sie den Relay ${url} entfernen möchten?`)) {
            this.relayService.removeRelay(url);
            this.updateRelayList();
            this.updateStats();
            this.toastService.showSuccess('Relay entfernt');
        }
    }

    testRelay(url) {
        this.toastService.showInfo('Teste Relay...');
        this.relayService.testRelay(url).then(() => {
            this.updateRelayList();
            this.updateStats();
            this.toastService.showSuccess('Relay-Test abgeschlossen');
        }).catch(() => {
            this.toastService.showError('Relay-Test fehlgeschlagen');
        });
    }

    testAllRelays() {
        this.toastService.showInfo('Teste alle Relays...');
        this.relayService.testAllRelays().then(() => {
            this.updateRelayList();
            this.updateStats();
            this.toastService.showSuccess('Alle Relay-Tests abgeschlossen');
        }).catch(() => {
            this.toastService.showError('Einige Relay-Tests fehlgeschlagen');
        });
    }
}
