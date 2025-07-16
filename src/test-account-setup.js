// =================================================================
// Test Account Setup für saubere Umgebung
// Account: e3f3e3f6a562c3f4382f5c23eaf557c915bb15abdfb784c2f5ee03a96debb76e
// =================================================================

/**
 * Test Account Credentials
 */
export const TEST_ACCOUNT = {
    publicKey: 'e3f3e3f6a562c3f4382f5c23eaf557c915bb15abdfb784c2f5ee03a96debb76e',
    npub: 'npub1u0e78a49vtplgwp0ts374a2hey2mk9dtm7mcfsh4acp6jm0tkahqsw397q',
    nsec: 'nsec1jkt3l8fjf4tsr0pqv5fn6etglzggaxasckp40wla085eem3895ys9xr5hs'
};

/**
 * Neue saubere Raum-Konfiguration
 */
export const CLEAN_ROOM_CONFIG = {
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
};

/**
 * Testdaten für die neue Umgebung
 */
export const TEST_MESSAGES = [
    {
        room: 'dreamtest-public-v2',
        message: 'Willkommen im sauberen Test-Raum! 🎉',
        type: 'room'
    },
    {
        room: 'dreamtest-private-v2',
        message: 'Privater Test-Raum funktioniert! 🔐',
        type: 'room'
    }
];

/**
 * Validierung der Tag-Struktur
 */
export const TAG_VALIDATION = {
    // Öffentliche Raum-Nachrichten
    publicRoomMessage: {
        kind: 1,
        tags: [['t', 'dreamtest-public-v2']],
        description: 'Öffentliche Nachricht mit #t Tag'
    },
    
    // Private Raum-Nachrichten
    privateRoomMessage: {
        kind: 1,
        tags: [['t', 'dreamtest-private-v2']],
        description: 'Private Nachricht mit #t Tag'
    },
    
    // Direct Messages
    directMessage: {
        kind: 1,
        tags: [['p', 'recipient_pubkey']],
        description: 'Direct Message mit #p Tag, OHNE #t Tag'
    },
    
    // Verschlüsselte DMs
    encryptedDM: {
        kind: 4,
        tags: [['p', 'recipient_pubkey']],
        description: 'Verschlüsselte DM mit #p Tag'
    }
};

/**
 * Debug-Funktionen
 */
export const DEBUG_TOOLS = {
    /**
     * Prüft ob ein Event korrekt gefiltert wird
     */
    validateEvent: (event, expectedType) => {
        const hasRoomTag = event.tags?.some(tag => tag[0] === 't');
        const hasPersonTag = event.tags?.some(tag => tag[0] === 'p');
        
        switch (expectedType) {
            case 'room':
                return hasRoomTag && !hasPersonTag;
            case 'dm':
                return hasPersonTag && !hasRoomTag;
            case 'encrypted':
                return event.kind === 4 && hasPersonTag;
            default:
                return false;
        }
    },
    
    /**
     * Zeigt Event-Struktur für Debugging
     */
    debugEvent: (event) => {
        console.log('🔍 Event Debug:', {
            id: event.id,
            kind: event.kind,
            pubkey: event.pubkey.slice(0, 16) + '...',
            tags: event.tags,
            content: event.content.slice(0, 50) + '...',
            created_at: new Date(event.created_at * 1000).toLocaleString()
        });
    }
};

console.log('🧪 Test Account Setup geladen');
