// =================================================================
// NOSTR Service - Core NOSTR Protocol Operations
// =================================================================

import { SimplePool, getEventHash, getPublicKey, finalizeEvent, nip04 } from 'nostr-tools';

export class NostrService {
    constructor() {
        this.pool = null;
        this.relayService = null;
        this.keyPair = null;
        this.subscriptions = new Map();
        this.userProfile = null;
    }

    setRelayService(relayService) {
        this.relayService = relayService;
    }

    setServices(services) {
        this.services = services;
        this.relayService = services.relay;
    }

    async init(currentUser = null) {
        console.log('🔧 Initialisiere NOSTR Service mit:', currentUser);
        
        if (currentUser) {
            // Convert KeyService format to nostr-tools format
            this.keyPair = {
                pubkey: currentUser.publicKey,
                privkey: currentUser.nsec ? 
                    new Uint8Array(currentUser.secretKey || []) : 
                    new Uint8Array(currentUser.privateKey || []),
                npub: currentUser.npub,
                nsec: currentUser.nsec
            };
            
            // If we have secretKey as array, convert it
            if (currentUser.secretKey && Array.isArray(currentUser.secretKey)) {
                this.keyPair.privkey = new Uint8Array(currentUser.secretKey);
            }
            
            console.log('🔑 KeyPair erstellt:', {
                pubkey: this.keyPair.pubkey,
                privkeyLength: this.keyPair.privkey?.length,
                npub: this.keyPair.npub
            });
        }
        
        // Initialize SimplePool
        this.pool = new SimplePool();
        
        // Load user profile if keyPair is available
        if (this.keyPair) {
            await this.loadUserProfile();
        }
        
        console.log('✅ NOSTR Service initialisiert', this.keyPair ? 'mit Schlüsseln' : 'ohne Schlüssel');
    }

    async loadUserProfile() {
        try {
            // Create default profile - this is sufficient for basic chat functionality
            this.userProfile = {
                pubkey: this.keyPair.pubkey,
                npub: this.keyPair.npub,
                name: 'DreamMall User',
                displayName: 'DreamMall User',
                picture: '',
                about: 'DreamMall NOSTR User'
            };
            
            console.log('📝 Default-Profil erstellt:', this.userProfile);
            
        } catch (error) {
            console.error('❌ Fehler beim Laden des Profils:', error);
            // Fallback to default profile
            this.userProfile = {
                pubkey: this.keyPair.pubkey,
                npub: this.keyPair.npub,
                name: 'DreamMall User',
                displayName: 'DreamMall User',
                picture: '',
                about: 'DreamMall NOSTR User'
            };
        }
    }

    getUserProfile() {
        return this.userProfile;
    }

    async sendMessage(content, roomId, encrypted = false) {
        if (!this.keyPair) {
            throw new Error('NOSTR Service nicht initialisiert - keine Schlüssel');
        }

        try {
            // Get relay URLs from RelayService
            const relayUrls = this.relayService?.getConnectedRelays() || this.relayService?.defaultRelays || ['wss://relay.damus.io'];
            
            console.log('📡 Sende Nachricht an Relays:', relayUrls);
            
            if (relayUrls.length === 0) {
                throw new Error('Keine Relay-Verbindungen verfügbar');
            }

            // NIP-28: Public Chat - Room messages are public by design
            const event = {
                kind: 1, // Text note (NIP-01)
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['t', roomId], // NIP-28: Room tag for public chat
                    ['client', 'dreammall-nostr']
                ],
                content: content, // Public room messages are not encrypted
                pubkey: this.keyPair.pubkey
            };

            // Sign the event
            const signedEvent = finalizeEvent(event, this.keyPair.privkey);

            // Publish to relays
            console.log('📤 Publiziere NIP-28 Public Chat Event:', signedEvent);
            await this.pool.publish(relayUrls, signedEvent);

            // Return message object for UI
            return {
                id: signedEvent.id,
                content: content,
                author: this.userProfile?.name || 'DreamMall User',
                authorPubkey: this.keyPair.pubkey,
                timestamp: signedEvent.created_at * 1000,
                roomId: roomId,
                encrypted: false, // Public chat messages are not encrypted
                isOwn: true
            };

        } catch (error) {
            console.error('❌ Fehler beim Senden der Nachricht:', error);
            throw error;
        }
    }

    async sendDirectMessage(content, recipientPubkey, encrypted = true) {
        if (!this.keyPair) {
            throw new Error('NOSTR Service nicht initialisiert - keine Schlüssel');
        }

        try {
            // Get relay URLs from RelayService
            const relayUrls = this.relayService?.getConnectedRelays() || this.relayService?.defaultRelays || ['wss://relay.damus.io'];
            
            console.log('📡 Sende verschlüsselte DM an Relays:', relayUrls);
            
            if (relayUrls.length === 0) {
                throw new Error('Keine Relay-Verbindungen verfügbar');
            }

            let messageContent = content;
            
            // NIP-04: Encrypted Direct Messages
            if (encrypted) {
                try {
                    // Import NIP-04 encryption functions
                    const { encrypt } = await import('nostr-tools/nip04');
                    
                    // Encrypt the message content
                    messageContent = await encrypt(this.keyPair.privkey, recipientPubkey, content);
                    console.log('🔐 Nachricht verschlüsselt mit NIP-04');
                } catch (encryptError) {
                    console.error('❌ Verschlüsselung fehlgeschlagen:', encryptError);
                    throw new Error('Nachricht konnte nicht verschlüsselt werden');
                }
            }

            const event = {
                kind: 4, // NIP-04: Encrypted Direct Message
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['p', recipientPubkey], // NIP-04: Recipient tag
                    ['client', 'dreammall-nostr']
                ],
                content: messageContent,
                pubkey: this.keyPair.pubkey
            };

            // Sign the event
            const signedEvent = finalizeEvent(event, this.keyPair.privkey);

            // Publish to relays
            console.log('📤 Publiziere NIP-04 Encrypted DM Event:', signedEvent);
            await this.pool.publish(relayUrls, signedEvent);

            // Return message object for UI
            return {
                id: signedEvent.id,
                content: content, // Return decrypted content for UI
                author: this.userProfile?.name || 'DreamMall User',
                authorPubkey: this.keyPair.pubkey,
                recipientPubkey: recipientPubkey,
                timestamp: signedEvent.created_at * 1000,
                encrypted: encrypted,
                isOwn: true,
                isDM: true
            };

        } catch (error) {
            console.error('❌ Fehler beim Senden der verschlüsselten DM:', error);
            throw error;
        }
    }

    async sendDirectMessage(content, recipientPubkey, encrypted = true) {
        if (!this.keyPair) {
            throw new Error('NOSTR Service nicht initialisiert - keine Schlüssel');
        }

        try {
            // Get relay URLs from RelayService
            const relayUrls = this.relayService?.getConnectedRelays() || this.relayService?.defaultRelays || ['wss://relay.damus.io'];
            
            if (relayUrls.length === 0) {
                throw new Error('Keine Relay-Verbindungen verfügbar');
            }

            let messageContent = content;
            
            if (encrypted) {
                // Encrypt using NIP-04
                messageContent = await nip04.encrypt(this.keyPair.privkey, recipientPubkey, content);
            }

            const event = {
                kind: 4, // Encrypted Direct Message
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['p', recipientPubkey],
                    ['client', 'dreammall-nostr']
                ],
                content: messageContent,
                pubkey: this.keyPair.pubkey
            };

            // Sign the event
            const signedEvent = finalizeEvent(event, this.keyPair.privkey);

            // Publish to relays
            await this.pool.publish(relayUrls, signedEvent);

            return {
                id: signedEvent.id,
                content: content,
                author: this.userProfile?.name || 'DreamMall User',
                authorPubkey: this.keyPair.pubkey,
                timestamp: event.created_at * 1000,
                recipientPubkey: recipientPubkey,
                encrypted: encrypted,
                isOwn: true,
                isDirect: true
            };

        } catch (error) {
            console.error('❌ Fehler beim Senden der direkten Nachricht:', error);
            throw error;
        }
    }

    subscribeToRoom(roomId, callback = null) {
        if (!this.pool) {
            console.warn('NOSTR Service nicht bereit für Subscriptions');
            return;
        }

        // Get relay URLs from RelayService
        const relayUrls = this.relayService?.getConnectedRelays() || this.relayService?.defaultRelays || ['wss://relay.damus.io'];
        
        if (relayUrls.length === 0) {
            console.warn('Keine Relay-Verbindungen für Subscription');
            return;
        }

        console.log(`📡 Abonniere Raum: ${roomId} mit ${relayUrls.length} Relays:`, relayUrls);

        // Unsubscribe from previous room
        if (this.subscriptions.has('room')) {
            const existingSubscription = this.subscriptions.get('room');
            if (existingSubscription && typeof existingSubscription.unsub === 'function') {
                existingSubscription.unsub();
                console.log('📡 Vorherige Subscription beendet');
            }
            this.subscriptions.delete('room');
        }

        // NIP-28: Subscribe to public chat messages
        const subscription = this.pool.subscribeMany(relayUrls, [{
            kinds: [1], // NIP-01: Text notes for public chat
            '#t': [roomId], // NIP-28: Room hashtag tag
            since: Math.floor(Date.now() / 1000) - (24 * 60 * 60), // Last 24 hours
            limit: 100
        }], {
            onevent: (event) => {
                console.log(`📨 NIP-28 Event erhalten für Raum ${roomId}:`, event);
                if (callback) {
                    callback(event);
                } else {
                    this.handleRoomMessage(event, roomId);
                }
            },
            oneose: () => {
                console.log(`📡 NIP-28 Subscription für Raum ${roomId} beendet`);
            },
            onclose: () => {
                console.log(`📡 NIP-28 Subscription für Raum ${roomId} geschlossen`);
            }
        });

        this.subscriptions.set('room', subscription);
        console.log(`✅ Erfolgreich Raum abonniert: ${roomId}`);
        
        return subscription;
    }

    subscribeToDirectMessages() {
        if (!this.pool || !this.keyPair) {
            console.warn('NOSTR Service oder Schlüssel nicht bereit für DM Subscriptions');
            return;
        }

        // Get relay URLs from RelayService
        const relayUrls = this.relayService?.getConnectedRelays() || this.relayService?.defaultRelays || ['wss://relay.damus.io'];
        
        if (relayUrls.length === 0) {
            console.warn('Keine Relay-Verbindungen für DM Subscription');
            return;
        }

        console.log(`📡 Abonniere verschlüsselte DMs mit ${relayUrls.length} Relays:`, relayUrls);

        // Unsubscribe from previous DM subscription
        if (this.subscriptions.has('dm')) {
            const existingSubscription = this.subscriptions.get('dm');
            if (existingSubscription && typeof existingSubscription.unsub === 'function') {
                existingSubscription.unsub();
                console.log('📡 Vorherige DM Subscription beendet');
            }
            this.subscriptions.delete('dm');
        }

        // NIP-04: Subscribe to encrypted direct messages
        const subscription = this.pool.subscribeMany(relayUrls, [{
            kinds: [4], // NIP-04: Encrypted Direct Message
            '#p': [this.keyPair.pubkey], // Messages sent to us
            since: Math.floor(Date.now() / 1000) - (24 * 60 * 60), // Last 24 hours
            limit: 50
        }], {
            onevent: (event) => {
                console.log(`📨 Verschlüsselte DM erhalten:`, event);
                this.handleDirectMessage(event);
            },
            oneose: () => {
                console.log(`📡 DM Subscription beendet`);
            },
            onclose: () => {
                console.log(`📡 DM Subscription geschlossen`);
            }
        });

        this.subscriptions.set('dm', subscription);
        console.log(`✅ Erfolgreich verschlüsselte DMs abonniert`);
        
        return subscription;
    }

    async handleRoomMessage(event, roomId) {
        try {
            // Skip own messages
            if (event.pubkey === this.keyPair.pubkey) {
                return;
            }

            // NIP-28: Verify this is a public chat message
            if (event.kind !== 1) {
                console.log('Ignoriere Event - nicht NIP-28 Text Note (kind 1)');
                return;
            }

            // Verify room tag
            const roomTags = event.tags.filter(tag => tag[0] === 't' && tag[1] === roomId);
            if (roomTags.length === 0) {
                console.log('Ignoriere Event - kein matching room tag für:', roomId);
                return;
            }

            // Get author info
            const authorName = await this.getAuthorName(event.pubkey);

            const message = {
                id: event.id,
                content: event.content,
                author: authorName,
                authorPubkey: event.pubkey,
                timestamp: event.created_at * 1000,
                roomId: roomId,
                encrypted: false, // NIP-28 messages are public
                isOwn: false
            };

            console.log('📨 NIP-28 Public Chat Message verarbeitet:', message);

            // Dispatch custom event for UI
            document.dispatchEvent(new CustomEvent('newMessage', {
                detail: message
            }));

        } catch (error) {
            console.error('❌ Fehler beim Verarbeiten der NIP-28 Raum-Nachricht:', error);
        }
    }

    async handleDirectMessage(event) {
        try {
            // Skip own messages
            if (event.pubkey === this.keyPair.pubkey) {
                return;
            }

            let content = event.content;
            let encrypted = false;

            // NIP-04: Try to decrypt if it's encrypted
            try {
                const { decrypt } = await import('nostr-tools/nip04');
                content = await decrypt(this.keyPair.privkey, event.pubkey, event.content);
                encrypted = true;
                console.log('🔓 NIP-04 Nachricht entschlüsselt');
            } catch (decryptError) {
                // Content was not encrypted or decryption failed
                console.log('Nachricht war nicht verschlüsselt oder Entschlüsselung fehlgeschlagen:', decryptError);
            }

            // Get author info
            const authorName = await this.getAuthorName(event.pubkey);

            const message = {
                id: event.id,
                content: content,
                author: authorName,
                authorPubkey: event.pubkey,
                timestamp: event.created_at * 1000,
                encrypted: encrypted,
                isOwn: false,
                isDirect: true
            };

            // Dispatch custom event for UI
            document.dispatchEvent(new CustomEvent('newDirectMessage', {
                detail: message
            }));

        } catch (error) {
            console.error('❌ Fehler beim Verarbeiten der direkten Nachricht:', error);
        }
    }

    async getAuthorName(pubkey) {
        // For now, just return a shortened pubkey
        // In a real implementation, you'd query for the author's profile
        return `User ${pubkey.slice(0, 8)}...`;
    }

    handleRelayEvent(relay, event) {
        console.log(`📨 Event von Relay ${relay.url}:`, event);
        // Handle different event types
        // This is called by RelayService when events are received
    }

    destroy() {
        // Clean up subscriptions
        this.subscriptions.forEach(subscription => {
            if (subscription && typeof subscription.unsub === 'function') {
                subscription.unsub();
            }
        });
        this.subscriptions.clear();

        // Close pool
        if (this.pool) {
            this.pool.close();
        }

        console.log('🧹 NOSTR Service bereinigt');
    }
}
