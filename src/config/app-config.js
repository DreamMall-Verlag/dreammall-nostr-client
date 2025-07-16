// =================================================================
// Zentrale Konfiguration für DreamMall NOSTR Client
// =================================================================

export const APP_CONFIG = {
    // Anwendungsinfo
    name: 'DreamMall NOSTR Client',
    version: '1.0.1',
    
    // Standard-Relays
    defaultRelays: [
        'wss://relay.damus.io',
        'wss://relay.nostr.band',
        'wss://nos.lol',
        'wss://relay.snort.social'
    ],
    
    // Raum-Konfiguration
    rooms: {
        'dreamtest-public-v2': {
            name: 'Offener Test Raum',
            description: 'Öffentlicher Raum für alle - V2',
            type: 'public',
            tag: 'dreamtest-public-v2',
            icon: '🌍'
        },
        'dreamtest-private-v2': {
            name: 'Geschlossener Test Raum', 
            description: 'Privater Raum mit Einladung - V2',
            type: 'private',
            tag: 'dreamtest-private-v2',
            icon: '🔐'
        }
    },
    
    // Standard-Einstellungen
    settings: {
        defaultRoom: 'dreamtest-public-v2',
        messageHistoryLimit: 100,
        maxPrivateGroups: 50,
        autoConnect: true,
        darkMode: true
    },
    
    // Test-Account (optional, für Entwicklung)
    testAccount: {
        publicKey: 'e3f3e3f6a562c3f4382f5c23eaf557c915bb15abdfb784c2f5ee03a96debb76e',
        npub: 'npub1u0e78a49vtplgwp0ts374a2hey2mk9dtm7mcfsh4acp6jm0tkahqsw397q',
        // nsec sollte nicht in der Konfiguration stehen!
    }
};

// Export für bessere Verwendung
export const { rooms: ROOM_CONFIG, settings: DEFAULT_SETTINGS } = APP_CONFIG;
