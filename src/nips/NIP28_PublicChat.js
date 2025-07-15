// =================================================================
// NIP-28: Public Chat Channels
// Handles public chat rooms and channel management
// =================================================================

export class NIP28_PublicChat {
    constructor(nostrService, nip01) {
        this.nostrService = nostrService;
        this.nip01 = nip01;
        this.KIND_CHANNEL_MESSAGE = 42;
        this.KIND_CHANNEL_CREATE = 40;
        this.KIND_CHANNEL_METADATA = 41;
    }

    /**
     * Send message to public chat room (simplified for DreamMall)
     */
    async sendRoomMessage(roomName, message) {
        try {
            console.log(`💬 NIP-28 Sende Nachricht in Raum: ${roomName}`);
            
            // Create tags for room identification
            const tags = [['t', roomName]];
            
            // Create event using NIP-01
            const event = await this.nip01.createTextNote(message, tags);
            
            // Publish event
            await this.nip01.publish(event);
            
            console.log('✅ NIP-28 Raum-Nachricht gesendet');
            return event;
            
        } catch (error) {
            console.error('❌ NIP-28 Raum-Nachricht Fehler:', error);
            throw error;
        }
    }

    /**
     * Alias for sendRoomMessage for backward compatibility
     */
    async sendChannelMessage(channelId, message, replyTo = null) {
        return this.sendRoomMessage(channelId, message);
    }

    /**
     * Create a new public chat channel
     */
    async createChannel(name, about, picture = '') {
        try {
            console.log(`🆕 NIP-28 Erstelle Kanal: ${name}`);
            
            const channelMetadata = {
                name,
                about,
                picture
            };
            
            // Create channel creation event
            const event = await this.nip01.createTextNote(JSON.stringify(channelMetadata), []);
            event.kind = this.KIND_CHANNEL_CREATE;
            
            // Re-calculate ID and signature
            event.id = this.nostrService.getEventHash(event);
            event.sig = await this.nostrService.signEvent(event);
            
            // Publish event
            await this.nip01.publish(event);
            
            console.log('✅ NIP-28 Kanal erstellt:', event.id);
            return {
                channelId: event.id,
                metadata: channelMetadata,
                event
            };
            
        } catch (error) {
            console.error('❌ NIP-28 Kanal-Erstellung Fehler:', error);
            throw error;
        }
    }

    /**
     * Subscribe to messages in a specific channel
     */
    subscribeToChannel(channelId, onMessage) {
        const filters = [
            {
                kinds: [this.KIND_CHANNEL_MESSAGE],
                '#e': [channelId],
                since: Math.floor(Date.now() / 1000) - 3600 // Last hour
            }
        ];

        console.log(`📡 NIP-28 Abonniere Kanal: ${channelId}`);
        
        return this.nip01.subscribe(filters, (event) => {
            // Process channel message
            const processedMessage = this.processChannelMessage(event, channelId);
            onMessage(processedMessage);
        });
    }

    /**
     * Process incoming channel message
     */
    processChannelMessage(event, expectedChannelId) {
        try {
            // Validate it's a channel message
            if (event.kind !== this.KIND_CHANNEL_MESSAGE) {
                console.warn('⚠️ Not a channel message event');
                return null;
            }

            // Find channel reference
            const eTags = event.tags.filter(tag => tag[0] === 'e');
            const rootTag = eTags.find(tag => tag[3] === 'root');
            const replyTag = eTags.find(tag => tag[3] === 'reply');
            
            const channelId = rootTag ? rootTag[1] : (eTags[0] ? eTags[0][1] : null);
            
            if (channelId !== expectedChannelId) {
                console.warn('⚠️ Message not for expected channel');
                return null;
            }

            return {
                ...event,
                channelId,
                replyTo: replyTag ? replyTag[1] : null,
                isChannelMessage: true
            };
            
        } catch (error) {
            console.error('❌ NIP-28 Message Processing Error:', error);
            return null;
        }
    }

    /**
     * Get channel message history
     */
    async getChannelHistory(channelId, limit = 50) {
        const filters = [
            {
                kinds: [this.KIND_CHANNEL_MESSAGE],
                '#e': [channelId],
                limit
            }
        ];

        return new Promise((resolve) => {
            const messages = [];
            let processed = 0;
            
            const sub = this.nip01.subscribe(filters, (event) => {
                const processedMessage = this.processChannelMessage(event, channelId);
                if (processedMessage) {
                    messages.push(processedMessage);
                }
                
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
            });

            const startTime = Date.now();
            
            // Resolve after timeout
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

    /**
     * Simple room-based messaging (fallback for basic chat)
     */
    async sendRoomMessage(roomName, message) {
        try {
            console.log(`🏠 NIP-28 Sende Raum-Nachricht: ${roomName}`);
            
            // Use room name as a simple tag
            const tags = [['t', roomName]];
            
            // Create basic text note with room tag
            const event = await this.nip01.createTextNote(message, tags);
            
            // Publish event
            await this.nip01.publish(event);
            
            console.log('✅ NIP-28 Raum-Nachricht gesendet');
            return event;
            
        } catch (error) {
            console.error('❌ NIP-28 Raum-Nachricht Fehler:', error);
            throw error;
        }
    }

    /**
     * Subscribe to room messages
     */
    subscribeToRoom(roomName, onMessage) {
        const filters = [
            {
                kinds: [1], // Regular text notes
                '#t': [roomName],
                since: Math.floor(Date.now() / 1000) - (24 * 60 * 60), // Last 24 hours
                limit: 100
            }
        ];

        console.log(`📡 NIP-28 Abonniere Raum: ${roomName}`);
        
        return this.nip01.subscribe(filters, (event) => {
            console.log(`📨 NIP-28 Nachricht erhalten in ${roomName}:`, event);
            onMessage({
                ...event,
                roomName,
                isRoomMessage: true
            });
        });
    }
}
