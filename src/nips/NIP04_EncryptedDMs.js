// =================================================================
// NIP-04: Encrypted Direct Messages
// Handles encrypted communication between users
// =================================================================

export class NIP04_EncryptedDMs {
    constructor(nostrService, nip01) {
        this.nostrService = nostrService;
        this.nip01 = nip01;
        this.KIND_ENCRYPTED_DM = 4;
    }

    /**
     * Send encrypted direct message
     */
    async sendEncryptedDM(recipientPubkey, message) {
        try {
            console.log('🔐 NIP-04 Verschlüssele DM für:', recipientPubkey);
            
            // Encrypt the message
            const encryptedContent = await this.nostrService.encrypt(recipientPubkey, message);
            
            // Create p-tag for recipient
            const tags = [['p', recipientPubkey]];
            
            // Create event using NIP-01
            const event = await this.nip01.createTextNote(encryptedContent, tags);
            event.kind = this.KIND_ENCRYPTED_DM;
            
            // Re-calculate ID and signature for new kind
            event.id = this.nostrService.getEventHash(event);
            event.sig = await this.nostrService.signEvent(event);
            
            // Publish event
            await this.nip01.publish(event);
            
            console.log('✅ NIP-04 Verschlüsselte DM gesendet');
            return event;
            
        } catch (error) {
            console.error('❌ NIP-04 DM Fehler:', error);
            throw error;
        }
    }

    /**
     * Decrypt received DM
     */
    async decryptDM(event) {
        try {
            // Validate it's an encrypted DM
            if (event.kind !== this.KIND_ENCRYPTED_DM) {
                throw new Error('Not an encrypted DM event');
            }

            // Find sender pubkey (could be author or p-tag)
            let senderPubkey = event.pubkey;
            const pTags = event.tags.filter(tag => tag[0] === 'p');
            
            // If we are the author, sender is the p-tag recipient
            if (event.pubkey === this.nostrService.getPublicKey() && pTags.length > 0) {
                senderPubkey = pTags[0][1];
            }

            console.log('🔓 NIP-04 Entschlüssele DM von:', senderPubkey);
            
            // Decrypt content
            const decryptedContent = await this.nostrService.decrypt(senderPubkey, event.content);
            
            return {
                ...event,
                decryptedContent,
                senderPubkey,
                isDecrypted: true
            };
            
        } catch (error) {
            console.error('❌ NIP-04 Entschlüsselung fehlgeschlagen:', error);
            return {
                ...event,
                decryptedContent: '[Entschlüsselung fehlgeschlagen]',
                senderPubkey: event.pubkey,
                isDecrypted: false
            };
        }
    }

    /**
     * Subscribe to encrypted DMs and regular DMs for current user
     */
    subscribeToEncryptedDMs(onDM) {
        const userPubkey = this.nostrService.getPublicKey();
        
        // Filter for encrypted DMs directed to or from current user
        const filters = [
            {
                kinds: [this.KIND_ENCRYPTED_DM],
                '#p': [userPubkey],
                since: Math.floor(Date.now() / 1000) - 3600 // Last hour
            },
            {
                kinds: [this.KIND_ENCRYPTED_DM],
                authors: [userPubkey],
                since: Math.floor(Date.now() / 1000) - 3600
            },
            // Also subscribe to regular kind:1 events that are DMs (have #p tag with our pubkey)
            {
                kinds: [1],
                '#p': [userPubkey],
                since: Math.floor(Date.now() / 1000) - (24 * 60 * 60) // Last 24 hours
            }
        ];

        console.log('📡 NIP-04 Abonniere verschlüsselte DMs und normale DMs');
        
        return this.nip01.subscribe(filters, async (event) => {
            try {
                if (event.kind === this.KIND_ENCRYPTED_DM) {
                    // Handle encrypted DM
                    const decryptedDM = await this.decryptDM(event);
                    onDM(decryptedDM);
                } else if (event.kind === 1) {
                    // Handle regular DM (kind: 1 with #p tag)
                    const isDirectMessage = event.tags && event.tags.some(tag => 
                        tag[0] === 'p' && tag[1] === userPubkey
                    );
                    
                    if (isDirectMessage) {
                        console.log('📨 NIP-04 Normale DM erhalten:', event);
                        onDM({
                            ...event,
                            isDecrypted: true,
                            decryptedContent: event.content,
                            senderPubkey: event.pubkey,
                            recipientPubkey: userPubkey,
                            isDirectMessage: true
                        });
                    }
                }
            } catch (error) {
                console.error('❌ NIP-04 DM Processing Error:', error);
            }
        });
    }

    /**
     * Get conversation history with a specific user
     */
    async getConversationHistory(otherUserPubkey, limit = 50) {
        const userPubkey = this.nostrService.getPublicKey();
        
        const filters = [
            {
                kinds: [this.KIND_ENCRYPTED_DM],
                authors: [userPubkey],
                '#p': [otherUserPubkey],
                limit: Math.floor(limit / 2)
            },
            {
                kinds: [this.KIND_ENCRYPTED_DM],
                authors: [otherUserPubkey],
                '#p': [userPubkey],
                limit: Math.floor(limit / 2)
            }
        ];

        return new Promise((resolve) => {
            const messages = [];
            let processed = 0;
            
            const sub = this.nip01.subscribe(filters, async (event) => {
                try {
                    const decryptedDM = await this.decryptDM(event);
                    messages.push(decryptedDM);
                    
                    processed++;
                    if (processed >= limit || Date.now() - startTime > 5000) { // 5s timeout
                        // Try different unsub methods
                        try {
                            if (typeof sub.unsub === 'function') {
                                sub.unsub();
                            } else if (typeof sub.close === 'function') {
                                sub.close();
                            } else if (typeof sub.unsubscribe === 'function') {
                                sub.unsubscribe();
                            }
                        } catch (unsubError) {
                            console.warn('⚠️ Fehler beim Beenden der Subscription:', unsubError);
                        }
                        resolve(messages.sort((a, b) => a.created_at - b.created_at));
                    }
                } catch (error) {
                    console.error('❌ Error processing conversation history:', error);
                }
            });

            const startTime = Date.now();
            
            // Resolve after timeout even if not all messages received
            setTimeout(() => {
                try {
                    if (typeof sub.unsub === 'function') {
                        sub.unsub();
                    } else if (typeof sub.close === 'function') {
                        sub.close();
                    } else if (typeof sub.unsubscribe === 'function') {
                        sub.unsubscribe();
                    }
                } catch (unsubError) {
                    console.warn('⚠️ Fehler beim Beenden der Subscription (timeout):', unsubError);
                }
                resolve(messages.sort((a, b) => a.created_at - b.created_at));
            }, 5000);
        });
    }
}
