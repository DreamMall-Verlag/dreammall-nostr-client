// =================================================================
// NIP-17 Kind Messages - Normale Text-Nachrichten
// Unterscheidet zwischen Room-Messages und Direct Messages
// =================================================================

export class NIP17_KindMessages {
    constructor(nostrService, nip01) {
        this.nostrService = nostrService;
        this.nip01 = nip01;
        this.KIND_TEXT_NOTE = 1;
    }

    /**
     * Subscribe to direct messages - STRENGE FILTERUNG
     */
    subscribeToDirectMessages(onDirectMessage) {
        const userPubkey = this.nostrService.getPublicKey();
        
        // Filter for kind:1 messages directed to current user
        const filters = [
            {
                kinds: [this.KIND_TEXT_NOTE],
                '#p': [userPubkey], // Direct messages to us
                since: Math.floor(Date.now() / 1000) - (24 * 60 * 60) // Last 24 hours
            }
        ];

        console.log('📡 NIP-17 Abonniere Direct Messages (kind:1) mit strenger Filterung');
        
        return this.nip01.subscribe(filters, (event) => {
            // STRIKTE Validierung für Direct Messages
            
            // 1. Muss kind:1 sein
            if (event.kind !== this.KIND_TEXT_NOTE) {
                console.log(`⚠️ NIP-17 Event ignoriert - falscher kind: ${event.kind}`);
                return;
            }
            
            // 2. Muss Tags haben
            if (!event.tags || !Array.isArray(event.tags)) {
                console.log(`⚠️ NIP-17 Event ignoriert - keine Tags:`, event);
                return;
            }
            
            // 3. Muss #p Tag mit unserem Pubkey haben
            const hasRecipientTag = event.tags.some(tag => 
                Array.isArray(tag) && 
                tag.length >= 2 && 
                tag[0] === 'p' && 
                tag[1] === userPubkey
            );
            
            if (!hasRecipientTag) {
                console.log(`⚠️ NIP-17 Event ignoriert - kein #p Tag für uns:`, event.tags);
                return;
            }
            
            // 4. Darf KEINE #t Tags haben (das wären Room-Messages)
            const hasRoomTag = event.tags.some(tag => 
                Array.isArray(tag) && 
                tag.length >= 2 && 
                tag[0] === 't'
            );
            
            if (hasRoomTag) {
                console.log(`⚠️ NIP-17 Event ignoriert - hat #t Tag (Room-Message):`, event.tags);
                return;
            }
            
            // 5. Validierung bestanden - Direct Message verarbeiten
            console.log('✅ NIP-17 Gültige Direct Message:', event);
            onDirectMessage({
                ...event,
                isDirectMessage: true,
                senderPubkey: event.pubkey,
                recipientPubkey: userPubkey,
                content: event.content
            });
        });
    }

    /**
     * Send a direct message to a user - SICHERE IMPLEMENTIERUNG
     */
    async sendDirectMessage(recipientPubkey, message) {
        try {
            console.log(`📤 NIP-17 Sende Direct Message an: ${recipientPubkey}`);
            
            // Create tags for direct message - NUR #p Tag, NIEMALS #t Tag!
            const tags = [['p', recipientPubkey]];
            
            // Create event using NIP-01
            const event = await this.nip01.createTextNote(message, tags);
            
            // Publish event
            await this.nip01.publish(event);
            
            console.log('✅ NIP-17 Direct Message gesendet mit Tags:', tags);
            return event;
            
        } catch (error) {
            console.error('❌ NIP-17 Direct Message Fehler:', error);
            throw error;
        }
    }
}
