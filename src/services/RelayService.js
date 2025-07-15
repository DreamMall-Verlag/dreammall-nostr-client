// =================================================================
// Relay Service - Manages NOSTR Relay Connections
// =================================================================

export class RelayService {
    constructor() {
        this.relays = new Map();
        this.eventHandlers = new Map();
        this.nostrService = null;
        this.connectionState = 'disconnected';
        this.defaultRelays = [
            'wss://relay.damus.io'               // Primary: Damus (sehr stabil, Cloudflare)
            // Weitere Relays werden später hinzugefügt, wenn sie getestet sind
        ];
    }

    // Event Emitter functionality
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }

    emit(event, data) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    off(event, handler) {
        const handlers = this.eventHandlers.get(event) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    async init() {
        console.log('🌐 Initialisiere Relay Service...');
        this.connectionState = 'initialized';
        return true;
    }

    setNostrService(nostrService) {
        this.nostrService = nostrService;
    }

    setServices(services) {
        this.services = services;
    }

    async connect() {
        console.log('🌐 Verbinde zu NOSTR Relays...');
        this.connectionState = 'connecting';
        this.emit('connecting');

        const savedRelays = this.getSavedRelays();
        const relaysToConnect = savedRelays.length > 0 ? savedRelays : this.defaultRelays;

        let connectedCount = 0;
        const connectionPromises = relaysToConnect.map(url => this.connectToRelay(url));
        
        try {
            const results = await Promise.allSettled(connectionPromises);
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    connectedCount++;
                }
            });

            if (connectedCount > 0) {
                this.connectionState = 'connected';
                this.emit('connected', { relayCount: connectedCount });
                console.log(`✅ Verbunden mit ${connectedCount}/${relaysToConnect.length} Relays`);
            } else {
                this.connectionState = 'offline';
                this.emit('disconnected');
                console.warn('⚠️ Keine Relay-Verbindungen verfügbar - App läuft im Offline-Modus');
            }

        } catch (error) {
            console.error('❌ Fehler beim Verbinden zu Relays:', error);
            this.connectionState = 'failed';
            this.emit('disconnected');
        }
    }

    getConnectedRelays() {
        const connectedRelays = [];
        for (const [url, relay] of this.relays) {
            if (relay.connected) {
                connectedRelays.push(url);
            }
        }
        return connectedRelays;
    }

    getSavedRelays() {
        try {
            const saved = localStorage.getItem('nostr_relays');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved relays:', error);
            return [];
        }
    }

    async connectToRelay(url) {
        return new Promise((resolve) => {
            try {
                console.log(`🔌 Verbinde zu Relay: ${url}`);
                
                const ws = new WebSocket(url);
                const relay = {
                    url: url,
                    ws: ws,
                    connected: false,
                    lastPing: Date.now(),
                    messageQueue: []
                };

                ws.onopen = () => {
                    relay.connected = true;
                    this.relays.set(url, relay);
                    console.log(`✅ Verbunden mit Relay: ${url}`);
                    
                    // Start heartbeat
                    this.startHeartbeat(relay);
                    
                    resolve(true);
                };

                ws.onclose = (event) => {
                    relay.connected = false;
                    console.log(`🔌 Relay getrennt: ${url} (Code: ${event.code})`);
                    
                    // Try to reconnect after delay
                    setTimeout(() => {
                        if (this.connectionState === 'connected') {
                            this.connectToRelay(url);
                        }
                    }, 5000);
                };

                ws.onerror = (error) => {
                    console.warn(`⚠️ Relay-Fehler (${url}):`, error);
                    relay.connected = false;
                    resolve(false);
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleRelayMessage(relay, data);
                    } catch (error) {
                        console.error('❌ Fehler beim Parsen der Relay-Nachricht:', error);
                    }
                };

                // Connection timeout
                setTimeout(() => {
                    if (!relay.connected) {
                        console.warn(`⚠️ Verbindung zu ${url} timeout`);
                        ws.close();
                        resolve(false);
                    }
                }, 10000);

            } catch (error) {
                console.error(`❌ Fehler beim Verbinden zu ${url}:`, error);
                resolve(false);
            }
        });
    }

    startHeartbeat(relay) {
        const heartbeatInterval = setInterval(() => {
            if (!relay.connected) {
                clearInterval(heartbeatInterval);
                return;
            }

            // Send ping
            try {
                relay.ws.send(JSON.stringify(['PING']));
                relay.lastPing = Date.now();
            } catch (error) {
                console.error('❌ Heartbeat-Fehler:', error);
                clearInterval(heartbeatInterval);
            }
        }, 30000);
    }

    handleRelayMessage(relay, data) {
        // Handle different message types
        if (Array.isArray(data)) {
            const [type, ...args] = data;
            
            switch (type) {
                case 'EVENT':
                    this.handleEvent(relay, args[1]);
                    break;
                case 'NOTICE':
                    console.log(`📢 Relay-Nachricht von ${relay.url}: ${args[0]}`);
                    break;
                case 'EOSE':
                    console.log(`✅ End of stored events für ${relay.url}`);
                    break;
                case 'OK':
                    console.log(`✅ Event published to ${relay.url}`);
                    break;
                default:
                    console.log(`📩 Unbekannter Nachrichtentyp von ${relay.url}:`, type);
            }
        }
    }

    handleEvent(relay, event) {
        // Forward event to NOSTR service
        if (this.nostrService) {
            this.nostrService.handleRelayEvent(relay, event);
        }
    }

    publish(event) {
        const connectedRelays = this.getConnectedRelays();
        const publishPromises = [];

        connectedRelays.forEach(url => {
            const relay = this.relays.get(url);
            if (relay && relay.connected) {
                const message = ['EVENT', event];
                
                try {
                    relay.ws.send(JSON.stringify(message));
                    publishPromises.push(Promise.resolve(`Published to ${url}`));
                } catch (error) {
                    console.error(`❌ Fehler beim Publizieren zu ${url}:`, error);
                    publishPromises.push(Promise.reject(error));
                }
            }
        });

        return Promise.allSettled(publishPromises);
    }

    subscribe(filters, onEvent) {
        const subscriptionId = this.generateSubscriptionId();
        const connectedRelays = this.getConnectedRelays();

        connectedRelays.forEach(url => {
            const relay = this.relays.get(url);
            if (relay && relay.connected) {
                const message = ['REQ', subscriptionId, ...filters];
                
                try {
                    relay.ws.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`❌ Fehler beim Abonnieren zu ${url}:`, error);
                }
            }
        });

        return subscriptionId;
    }

    unsubscribe(subscriptionId) {
        const connectedRelays = this.getConnectedRelays();

        connectedRelays.forEach(url => {
            const relay = this.relays.get(url);
            if (relay && relay.connected) {
                const message = ['CLOSE', subscriptionId];
                
                try {
                    relay.ws.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`❌ Fehler beim Abbestellen zu ${url}:`, error);
                }
            }
        });
    }

    generateSubscriptionId() {
        return 'sub_' + Math.random().toString(36).substr(2, 9);
    }

    getStatus() {
        return {
            state: this.connectionState,
            connectedRelays: this.getConnectedRelays().length,
            totalRelays: this.relays.size
        };
    }

    // Professional relay management methods
    async addRelay(url) {
        try {
            if (this.relays.has(url)) {
                throw new Error('Relay bereits vorhanden');
            }
            
            const relay = await this.connectToRelay(url);
            toastService.success(`Relay ${url} erfolgreich hinzugefügt`);
            return relay;
        } catch (error) {
            console.error(`❌ Relay hinzufügen fehlgeschlagen: ${url}`, error);
            throw error;
        }
    }

    async removeRelay(url) {
        try {
            if (!this.relays.has(url)) {
                throw new Error('Relay nicht gefunden');
            }
            
            const relay = this.relays.get(url);
            if (relay && relay.connected) {
                await relay.close();
            }
            
            this.relays.delete(url);
            const savedRelays = this.getRelayUrls().filter(r => r !== url);
            this.storage.setItem('relays', JSON.stringify(savedRelays));
            
            console.log(`✅ Relay entfernt: ${url}`);
            return true;
        } catch (error) {
            console.error(`❌ Relay entfernen fehlgeschlagen: ${url}`, error);
            throw error;
        }
    }

    async testRelay(url) {
        try {
            const relay = this.pool.ensureRelay(url);
            await relay.connect();
            
            const isConnected = relay.connected;
            console.log(`🔗 Relay Test: ${url} - ${isConnected ? 'Connected' : 'Failed'}`);
            return isConnected;
        } catch (error) {
            console.error(`❌ Relay Test fehlgeschlagen: ${url}`, error);
            return false;
        }
    }

    getRelayStats() {
        const stats = {};
        for (const [url, relay] of this.relays) {
            stats[url] = {
                connected: relay.connected,
                url: relay.url,
                status: relay.connected ? 'connected' : 'disconnected'
            };
        }
        return stats;
    }

    getRelayUrls() {
        try {
            const saved = this.storage.getItem('relays');
            return saved ? JSON.parse(saved) : this.defaultRelays;
        } catch (error) {
            console.error('❌ Fehler beim Laden der Relays:', error);
            return this.defaultRelays;
        }
    }

    async disconnect() {
        try {
            for (const [url, relay] of this.relays) {
                if (relay.connected) {
                    await relay.close();
                }
            }
            this.relays.clear();
            console.log('🔌 Alle Relays getrennt');
        } catch (error) {
            console.error('❌ Fehler beim Trennen der Relays:', error);
        }
    }
}

export default RelayService;