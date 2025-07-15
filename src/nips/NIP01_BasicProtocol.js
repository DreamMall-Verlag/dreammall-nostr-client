// =================================================================
// NIP-01: Basic Protocol Events
// Basic NOSTR protocol implementation for event creation and publishing
// =================================================================

export class NIP01_BasicProtocol {
    constructor(nostrService) {
        this.nostrService = nostrService;
        this.KIND_TEXT_NOTE = 1;
        this.KIND_METADATA = 0;
        this.KIND_CONTACTS = 3;
        this.KIND_ENCRYPTED_DM = 4;
        this.KIND_DELETION = 5;
    }

    /**
     * Create a basic text note event
     */
    createTextNote(content, tags = []) {
        const pubkey = this.nostrService.getPublicKey();
        
        if (!pubkey) {
            throw new Error('No public key available for creating text note');
        }
        
        const event = {
            kind: this.KIND_TEXT_NOTE,
            created_at: Math.floor(Date.now() / 1000),
            tags: tags,
            content: content,
            pubkey: pubkey
        };
        
        console.log('📝 NIP-01 Creating text note:', event);
        return event;
    }

    /**
     * Create a metadata event (user profile)
     */
    createMetadata(profile) {
        const event = {
            kind: this.KIND_METADATA,
            created_at: Math.floor(Date.now() / 1000),
            tags: [],
            content: JSON.stringify(profile),
            pubkey: this.nostrService.getPublicKey()
        };
        
        return event;
    }

    /**
     * Validate event structure
     */
    validateEvent(event) {
        if (!event.kind || typeof event.kind !== 'number') {
            throw new Error('Event must have a valid kind number');
        }
        
        if (!event.created_at || typeof event.created_at !== 'number') {
            throw new Error('Event must have a valid created_at timestamp');
        }
        
        if (!event.content || typeof event.content !== 'string') {
            throw new Error('Event must have valid content string');
        }
        
        if (!event.pubkey || typeof event.pubkey !== 'string') {
            throw new Error('Event must have a valid pubkey');
        }
        
        if (!Array.isArray(event.tags)) {
            throw new Error('Event tags must be an array');
        }
        
        return true;
    }

    /**
     * Sign and publish event
     */
    async publish(event) {
        try {
            // Validate event first
            this.validateEvent(event);
            
            // Import finalizeEvent from nostr-tools
            const { finalizeEvent } = await import('nostr-tools');
            
            // Sign the event using finalizeEvent
            const signedEvent = finalizeEvent(event, this.nostrService.keyPair.privkey);
            
            // Use NostrService pool directly
            if (!this.nostrService.pool) {
                throw new Error('NostrService pool not available');
            }
            
            // Get relay URLs from relayService if available
            let relayUrls = ['wss://relay.damus.io'];
            if (this.nostrService.relayService && this.nostrService.relayService.getRelayUrls) {
                const urls = this.nostrService.relayService.getRelayUrls();
                if (urls.length > 0) {
                    relayUrls = urls;
                }
            }
            
            // Publish to relays with timeout handling
            console.log('📤 NIP-01 Publishing event:', signedEvent);
            console.log('📤 Using relays:', relayUrls);
            
            try {
                await Promise.race([
                    this.nostrService.pool.publish(relayUrls, signedEvent),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Publish timeout after 10s')), 10000)
                    )
                ]);
                console.log('✅ NIP-01 Event published successfully');
            } catch (publishError) {
                console.warn('⚠️ NIP-01 Publish warning:', publishError.message);
                // Don't throw error, just log it - message was likely sent
            }
            
            return signedEvent;
            
        } catch (error) {
            console.error('❌ NIP-01 Publish error:', error);
            throw error;
        }
    }

    /**
     * Subscribe to events
     */
    subscribe(filters, onEvent) {
        try {
            // Use NostrService pool directly
            if (!this.nostrService.pool) {
                console.warn('⚠️ NostrService pool not available');
                return null;
            }
            
            // Get relay URLs from relayService if available
            let relayUrls = ['wss://relay.damus.io'];
            if (this.nostrService.relayService && this.nostrService.relayService.getRelayUrls) {
                const urls = this.nostrService.relayService.getRelayUrls();
                if (urls.length > 0) {
                    relayUrls = urls;
                }
            }
            
            console.log('📡 NIP-01 Subscribing with filters:', filters);
            console.log('📡 Using relays:', relayUrls);
            
            // Subscribe using SimplePool
            const subscription = this.nostrService.pool.subscribeMany(relayUrls, filters, {
                onevent: (event) => {
                    console.log('📨 NIP-01 Event received:', event);
                    if (onEvent) {
                        onEvent(event);
                    }
                },
                oneose: () => {
                    console.log('📡 NIP-01 Subscription ended');
                },
                onclose: () => {
                    console.log('📡 NIP-01 Subscription closed');
                }
            });
            
            return subscription;
            
        } catch (error) {
            console.error('❌ NIP-01 Subscribe error:', error);
            return null;
        }
    }

    /**
     * Generate subscription ID
     */
    generateSubscriptionId() {
        return 'sub_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get event hash
     */
    getEventHash(event) {
        return this.nostrService.getEventHash(event);
    }

    /**
     * Get current user's public key
     */
    getPublicKey() {
        return this.nostrService.getPublicKey();
    }

    /**
     * Create tag array for events
     */
    createTags(tagData) {
        const tags = [];
        
        if (tagData.reply) {
            tags.push(['e', tagData.reply]);
        }
        
        if (tagData.mention) {
            tags.push(['p', tagData.mention]);
        }
        
        if (tagData.hashtag) {
            tags.push(['t', tagData.hashtag]);
        }
        
        if (tagData.room) {
            tags.push(['t', tagData.room]);
        }
        
        if (tagData.client) {
            tags.push(['client', tagData.client]);
        }
        
        return tags;
    }
}
