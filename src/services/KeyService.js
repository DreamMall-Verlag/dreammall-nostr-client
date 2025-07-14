// =================================================================
// Key Service - Professional Key Management for NOSTR Chat
// =================================================================

import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { nip19 } from 'nostr-tools';

export class KeyService {
    constructor() {
        this.keyPair = null;
        this.profile = null;
        this.eventHandlers = new Map();
        this.storageKey = 'nostr_keys_v2';
        this.profileKey = 'nostr_profile_v2';
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
                console.error(`Error in KeyService event handler for ${event}:`, error);
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
        console.log('🔑 Initialisiere erweiterten KeyService...');
        
        // Load existing keys and profile
        await this.loadKeys();
        await this.loadProfile();
        
        this.emit('initialized', { hasKeys: !!this.keyPair });
        return true;
    }

    async loadKeys() {
        try {
            const storedKeys = localStorage.getItem(this.storageKey);
            if (storedKeys) {
                const keyData = JSON.parse(storedKeys);
                this.keyPair = keyData;
                console.log('🔑 Schlüssel aus Storage geladen');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Fehler beim Laden der Schlüssel:', error);
            return false;
        }
    }

    async loadProfile() {
        try {
            const storedProfile = localStorage.getItem(this.profileKey);
            if (storedProfile) {
                this.profile = JSON.parse(storedProfile);
                console.log('👤 Profil aus Storage geladen');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Fehler beim Laden des Profils:', error);
            return false;
        }
    }

    async hasKeys() {
        try {
            const storedKeys = localStorage.getItem(this.storageKey);
            return storedKeys !== null;
        } catch (error) {
            console.error('❌ Fehler beim Prüfen der Schlüssel:', error);
            return false;
        }
    }

    async getKeyPair() {
        if (this.keyPair) {
            return this.keyPair;
        }
        
        await this.loadKeys();
        return this.keyPair;
    }

    async getProfile() {
        if (this.profile) {
            return this.profile;
        }
        
        await this.loadProfile();
        return this.profile;
    }

    async updateProfile(profileData) {
        try {
            this.profile = {
                ...this.profile,
                ...profileData,
                updated: Date.now()
            };
            
            localStorage.setItem(this.profileKey, JSON.stringify(this.profile));
            this.emit('profileUpdated', this.profile);
            
            console.log('👤 Profil aktualisiert:', this.profile);
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Profils:', error);
            return false;
        }
    }

    async generateKeyPair() {
        try {
            console.log('🔑 Generiere neue Schlüssel...');
            
            // Generate new key pair
            const secretKey = generateSecretKey();
            const publicKey = getPublicKey(secretKey);
            
            // Create npub/nsec format
            const npub = nip19.npubEncode(publicKey);
            const nsec = nip19.nsecEncode(secretKey);
            
            // Store key pair
            this.keyPair = {
                secretKey: Array.from(secretKey),
                publicKey: publicKey,
                npub: npub,
                nsec: nsec,
                created: Date.now()
            };
            
            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(this.keyPair));
            
            // Create default profile
            await this.updateProfile({
                name: 'NOSTR User',
                about: 'New NOSTR user',
                created: Date.now()
            });
            
            this.emit('keysGenerated', this.keyPair);
            console.log('✅ Neue Schlüssel generiert und gespeichert');
            
            return this.keyPair;
        } catch (error) {
            console.error('❌ Fehler beim Generieren der Schlüssel:', error);
            throw error;
        }
    }

    async importKeys(nsec) {
        try {
            console.log('🔑 Importiere Schlüssel...');
            
            // Decode nsec
            const { type, data } = nip19.decode(nsec);
            if (type !== 'nsec') {
                throw new Error('Invalid nsec format');
            }
            
            const secretKey = data;
            const publicKey = getPublicKey(secretKey);
            const npub = nip19.npubEncode(publicKey);
            
            // Store key pair
            this.keyPair = {
                secretKey: Array.from(secretKey),
                publicKey: publicKey,
                npub: npub,
                nsec: nsec,
                imported: Date.now()
            };
            
            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(this.keyPair));
            
            this.emit('keysImported', this.keyPair);
            console.log('✅ Schlüssel importiert und gespeichert');
            
            return this.keyPair;
        } catch (error) {
            console.error('❌ Fehler beim Importieren der Schlüssel:', error);
            throw error;
        }
    }

    async exportKeys() {
        try {
            const keyPair = await this.getKeyPair();
            if (!keyPair) {
                throw new Error('No keys available to export');
            }
            
            return {
                nsec: keyPair.nsec,
                npub: keyPair.npub,
                created: keyPair.created || keyPair.imported
            };
        } catch (error) {
            console.error('❌ Fehler beim Exportieren der Schlüssel:', error);
            throw error;
        }
    }

    async deleteKeys() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.profileKey);
            
            this.keyPair = null;
            this.profile = null;
            
            this.emit('keysDeleted');
            console.log('🗑️ Schlüssel und Profil gelöscht');
            
            return true;
        } catch (error) {
            console.error('❌ Fehler beim Löschen der Schlüssel:', error);
            return false;
        }
    }

    // Get formatted public key for display
    getFormattedPublicKey() {
        if (!this.keyPair) return null;
        
        const npub = this.keyPair.npub;
        return npub.slice(0, 12) + '...' + npub.slice(-8);
    }

    // Validate key format
    validateNsec(nsec) {
        try {
            const { type } = nip19.decode(nsec);
            return type === 'nsec';
        } catch {
            return false;
        }
    }

    // Get key status
    getKeyStatus() {
        return {
            hasKeys: !!this.keyPair,
            hasProfile: !!this.profile,
            publicKey: this.keyPair?.npub,
            profileName: this.profile?.name
        };
    }

    // Legacy methods for compatibility
    async getPublicKey() {
        const keyPair = await this.getKeyPair();
        return keyPair?.publicKey;
    }

    async getNpub() {
        const keyPair = await this.getKeyPair();
        return keyPair?.npub;
    }

    async getNsec() {
        const keyPair = await this.getKeyPair();
        return keyPair?.nsec;
    }

    async getSecretKey() {
        const keyPair = await this.getKeyPair();
        return keyPair?.secretKey ? new Uint8Array(keyPair.secretKey) : null;
    }
}
