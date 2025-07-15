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
        
        this.pool = new SimplePool();
        
        // Load user profile if keyPair is available
        if (this.keyPair) {
            await this.loadUserProfile();
        }
        
        console.log('✅ NOSTR Service initialisiert', this.keyPair ? 'mit Schlüsseln' : 'ohne Schlüssel');
    }

    async loadUserProfile() {
        try {
            // Try to load existing profile
            const relayUrls = this.relayService?.getConnectedRelays() || [];
            
            if (relayUrls.length === 0) {
                // Create default profile
                this.userProfile = {
                    pubkey: this.keyPair.pubkey,
                    npub: this.keyPair.npub,
                    name: 'DreamMall User',
                    displayName: 'DreamMall User',
                    picture: '',
                    about: 'DreamMall NOSTR User'
                };
                return;
            }

            const profileEvents = await this.pool.list(relayUrls, [{
                kinds: [0],
                authors: [this.keyPair.pubkey],
                limit: 1
            }]);

            if (profileEvents.length > 0) {
                const profileData = JSON.parse(profileEvents[0].content);
                this.userProfile = {
                    pubkey: this.keyPair.pubkey,
                    npub: this.keyPair.npub,
                    name: profileData.name || 'DreamMall User',
                    displayName: profileData.display_name || profileData.name || 'DreamMall User',
                    picture: profileData.picture || '',
                    about: profileData.about || 'DreamMall NOSTR User'
                };
            } else {
                // Create default profile
                this.userProfile = {
                    pubkey: this.keyPair.pubkey,
                    npub: this.keyPair.npub,
                    name: 'DreamMall User',
                    displayName: 'DreamMall User',
                    picture: '',
                    about: 'DreamMall NOSTR User'
                };
            }

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

    async sendMessage(content, roomId, encrypted = true) {
        if (!this.keyPair || !this.relayService) {
            throw new Error('NOSTR Service nicht initialisiert');
        }

        try {
            const relayUrls = this.relayService.getConnectedRelays();
            if (relayUrls.length === 0) {
                throw new Error('Keine Relay-Verbindungen verfügbar');
            }

            let messageContent = content;
            
            // For room messages, we'll use a different approach than direct encryption
            // since this is a public room message
            if (encrypted && roomId) {
                // For now, just mark as encrypted but don't actually encrypt room messages
                // Real encryption would need recipient public keys
                messageContent = content;
            }

            const event = {
                kind: 1, // Text note
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['t', roomId], // Room tag
                    ['client', 'dreammall-nostr']
                ],
                content: messageContent,
                pubkey: this.keyPair.pubkey
            };

            // Sign the event
            const signedEvent = finalizeEvent(event, this.keyPair.privkey);

            // Publish to relays
            await this.pool.publish(relayUrls, signedEvent);

            // Return message object for UI
            return {
                id: signedEvent.id,
                content: content,
                author: this.userProfile.name,
                authorPubkey: this.keyPair.pubkey,
                timestamp: signedEvent.created_at * 1000,
                roomId: roomId,
                encrypted: encrypted,
                isOwn: true
            };

        } catch (error) {
            console.error('❌ Fehler beim Senden der Nachricht:', error);
            throw error;
        }
    }

    async sendDirectMessage(content, recipientPubkey, encrypted = true) {
        if (!this.keyPair || !this.relayService) {
            throw new Error('NOSTR Service nicht initialisiert');
        }

        try {
            const relayUrls = this.relayService.getConnectedRelays();
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
                author: this.userProfile.name,
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
        if (!this.pool || !this.relayService) {
            console.warn('NOSTR Service nicht bereit für Subscriptions');
            return;
        }

        const relayUrls = this.relayService.getConnectedRelays();
        if (relayUrls.length === 0) {
            console.warn('Keine Relay-Verbindungen für Subscription');
            return;
        }

        console.log(`📡 Abonniere Raum: ${roomId} mit ${relayUrls.length} Relays`);

        // Unsubscribe from previous room
        if (this.subscriptions.has('room')) {
            const existingSubscription = this.subscriptions.get('room');
            if (existingSubscription && typeof existingSubscription.unsub === 'function') {
                existingSubscription.unsub();
                console.log('📡 Vorherige Subscription beendet');
            }
            this.subscriptions.delete('room');
        }

        // Subscribe to room messages
        const subscription = this.pool.subscribeMany(relayUrls, [{
            kinds: [1], // Text notes
            '#t': [roomId], // Room tag
            since: Math.floor(Date.now() / 1000) - (24 * 60 * 60), // Last 24 hours
            limit: 100
        }], {
            onevent: (event) => {
                console.log(`📨 Event erhalten für Raum ${roomId}:`, event);
                if (callback) {
                    callback(event);
                } else {
                    this.handleRoomMessage(event, roomId);
                }
            },
            oneose: () => {
                console.log(`📡 Subscription für Raum ${roomId} beendet`);
            },
            onclose: () => {
                console.log(`📡 Subscription für Raum ${roomId} geschlossen`);
            }
        });

        this.subscriptions.set('room', subscription);
        console.log(`✅ Erfolgreich Raum abonniert: ${roomId}`);
        
        return subscription;
    }

    subscribeToDirectMessages() {
        if (!this.pool || !this.relayService || !this.keyPair) {
            console.warn('NOSTR Service nicht bereit für DM Subscriptions');
            return;
        }

        const relayUrls = this.relayService.getConnectedRelays();
        if (relayUrls.length === 0) {
            console.warn('Keine Relay-Verbindungen für DM Subscription');
            return;
        }

        // Subscribe to direct messages
        const subscription = this.pool.subscribeMany(relayUrls, [{
            kinds: [4],
            '#p': [this.keyPair.pubkey],
            since: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // Last 7 days
            limit: 100
        }], {
            onevent: (event) => {
                this.handleDirectMessage(event);
            },
            oneose: () => {
                console.log('📧 Direct Messages Subscription beendet');
            }
        });

        this.subscriptions.set('dm', subscription);
        console.log('📧 Abonniert direkte Nachrichten');
    }

    loadRoomMessages(roomId, callback) {
        if (!this.pool || !this.relayService) {
            console.warn('NOSTR Service nicht bereit für loadRoomMessages');
            return;
        }

        const relayUrls = this.relayService.getConnectedRelays();
        if (relayUrls.length === 0) {
            console.warn('Keine Relay-Verbindungen für loadRoomMessages');
            return;
        }

        console.log(`📚 Lade Nachrichten für Raum: ${roomId}`);

        const messages = [];
        
        // Temporary subscription to load historical messages
        const tempSub = this.pool.subscribeMany(relayUrls, [{
            kinds: [1], // Text notes
            '#t': [roomId], // Room tag
            since: Math.floor(Date.now() / 1000) - (24 * 60 * 60), // Last 24 hours
            limit: 100
        }], {
            onevent: (event) => {
                console.log(`📨 Historische Nachricht erhalten für Raum ${roomId}:`, event);
                
                // Check if this is our own message
                const isOwnMessage = this.keyPair && event.pubkey === this.keyPair.pubkey;
                
                messages.push({
                    id: event.id,
                    content: event.content,
                    pubkey: event.pubkey,
                    created_at: event.created_at,
                    isOwn: isOwnMessage
                });
            },
            oneose: () => {
                console.log(`📚 Historische Nachrichten für Raum ${roomId} geladen: ${messages.length} Nachrichten`);
                
                // Sort messages by timestamp (oldest first - ascending order)
                messages.sort((a, b) => a.created_at - b.created_at);
                
                console.log('📅 Nachrichten-Zeitstempel sortiert:', messages.map(m => ({
                    content: m.content.slice(0, 20),
                    created_at: m.created_at,
                    date: new Date(m.created_at * 1000).toLocaleString()
                })));
                
                // Close temporary subscription
                tempSub.unsub();
                
                // Call callback with sorted messages
                if (callback) {
                    callback(messages);
                }
            },
            onclose: () => {
                console.log(`📚 Historische Nachrichten-Subscription für Raum ${roomId} geschlossen`);
            }
        });
    }

    async handleRoomMessage(event, roomId) {
        try {
            // Skip own messages
            if (event.pubkey === this.keyPair.pubkey) {
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
                encrypted: false,
                isOwn: false
            };

            // Emit message event
            if (this.relayService) {
                this.relayService.emit('message', message);
            }

        } catch (error) {
            console.error('❌ Fehler beim Verarbeiten der Raum-Nachricht:', error);
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

            // Try to decrypt if it's encrypted
            try {
                content = await nip04.decrypt(this.keyPair.privkey, event.pubkey, event.content);
                encrypted = true;
            } catch (decryptError) {
                // Content was not encrypted or decryption failed
                console.log('Nachricht war nicht verschlüsselt oder Entschlüsselung fehlgeschlagen');
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

            // Emit message event
            if (this.relayService) {
                this.relayService.emit('directMessage', message);
            }

        } catch (error) {
            console.error('❌ Fehler beim Verarbeiten der direkten Nachricht:', error);
        }
    }

    async getAuthorName(pubkey) {
        try {
            const relayUrls = this.relayService?.getConnectedRelays() || [];
            
            if (relayUrls.length === 0) {
                return pubkey.slice(0, 8) + '...';
            }

            const profileEvents = await this.pool.list(relayUrls, [{
                kinds: [0],
                authors: [pubkey],
                limit: 1
            }]);

            if (profileEvents.length > 0) {
                const profileData = JSON.parse(profileEvents[0].content);
                return profileData.name || profileData.display_name || pubkey.slice(0, 8) + '...';
            }

            return pubkey.slice(0, 8) + '...';

        } catch (error) {
            console.error('❌ Fehler beim Laden des Autoren-Namens:', error);
            return pubkey.slice(0, 8) + '...';
        }
    }

    async updateProfile(profileData) {
        if (!this.keyPair || !this.relayService) {
            throw new Error('NOSTR Service nicht initialisiert');
        }

        try {
            const profileEvent = {
                kind: 0,
                pubkey: this.keyPair.pubkey,
                created_at: Math.floor(Date.now() / 1000),
                content: JSON.stringify({
                    name: profileData.name || '',
                    display_name: profileData.name || '',
                    about: profileData.about || '',
                    picture: profileData.picture || ''
                }),
                tags: []
            };

            const signedEvent = await finalizeEvent(profileEvent, this.keyPair.privkey);
            
            // Publish to all connected relays
            const relays = this.relayService.getConnectedRelays();
            const publishPromises = relays.map(relay => relay.publish(signedEvent));
            
            await Promise.allSettled(publishPromises);
            
            // Update local profile
            this.userProfile = {
                ...this.userProfile,
                name: profileData.name || this.userProfile.name,
                displayName: profileData.name || this.userProfile.displayName,
                about: profileData.about || this.userProfile.about,
                picture: profileData.picture || this.userProfile.picture
            };
            
            console.log('✅ Profil aktualisiert und veröffentlicht');
            return true;
            
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren des Profils:', error);
            throw error;
        }
    }

    disconnect() {
        // Close all subscriptions
        for (const [key, subscription] of this.subscriptions) {
            try {
                if (subscription && typeof subscription.unsub === 'function') {
                    subscription.unsub();
                    console.log(`📡 Subscription ${key} beendet`);
                }
            } catch (error) {
                console.error(`❌ Fehler beim Beenden der Subscription ${key}:`, error);
            }
        }
        this.subscriptions.clear();

        // Close pool
        if (this.pool) {
            try {
                this.pool.close();
                this.pool = null;
                console.log('🔌 NOSTR Pool geschlossen');
            } catch (error) {
                console.error('❌ Fehler beim Schließen des Pools:', error);
            }
        }

        console.log('🔌 NOSTR Service getrennt');
    }
}
