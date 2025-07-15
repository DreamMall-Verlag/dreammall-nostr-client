// =================================================================
// NIP-104: Private Groups / Closed Rooms
// Handles private/closed room creation and management
// =================================================================

export class NIP104_PrivateGroups {
    constructor(nostrService, nip01) {
        this.nostrService = nostrService;
        this.nip01 = nip01;
        this.KIND_PRIVATE_GROUP_MESSAGE = 104;
        this.KIND_PRIVATE_GROUP_METADATA = 105;
        this.KIND_PRIVATE_GROUP_INVITE = 106;
        this.privateGroups = new Map(); // groupId -> group info
        this.memberKeys = new Map(); // groupId -> shared key
    }

    /**
     * Create a private group
     */
    async createPrivateGroup(name, description, members = []) {
        try {
            console.log(`🔐 NIP-104 Erstelle private Gruppe: ${name}`);
            
            // Generate shared key for the group
            const sharedKey = this.generateSharedKey();
            const groupId = this.generateGroupId(name);
            
            // Create group metadata
            const groupMetadata = {
                name,
                description,
                creator: this.nostrService.getPublicKey(),
                created_at: Math.floor(Date.now() / 1000),
                members: [this.nostrService.getPublicKey(), ...members]
            };
            
            // Encrypt metadata with shared key
            const encryptedMetadata = await this.encryptGroupData(JSON.stringify(groupMetadata), sharedKey);
            
            // Create metadata event
            const metadataEvent = await this.nip01.createTextNote(encryptedMetadata, [
                ['d', groupId], // group identifier
                ['t', 'private-group'] // type tag
            ]);
            metadataEvent.kind = this.KIND_PRIVATE_GROUP_METADATA;
            
            // Re-calculate ID and signature
            metadataEvent.id = this.nostrService.getEventHash(metadataEvent);
            metadataEvent.sig = await this.nostrService.signEvent(metadataEvent);
            
            // Publish metadata
            await this.nip01.publish(metadataEvent);
            
            // Store locally
            this.privateGroups.set(groupId, groupMetadata);
            this.memberKeys.set(groupId, sharedKey);
            
            // Send invites to members
            for (const memberPubkey of members) {
                await this.inviteToGroup(groupId, memberPubkey, sharedKey);
            }
            
            console.log('✅ NIP-104 Private Gruppe erstellt');
            return {
                groupId,
                metadata: groupMetadata,
                event: metadataEvent
            };
            
        } catch (error) {
            console.error('❌ NIP-104 Gruppe erstellen Fehler:', error);
            throw error;
        }
    }

    /**
     * Send message to private group
     */
    async sendPrivateGroupMessage(groupId, message) {
        try {
            console.log(`💬 NIP-104 Sende Nachricht in private Gruppe: ${groupId}`);
            
            const sharedKey = this.memberKeys.get(groupId);
            if (!sharedKey) {
                throw new Error('Keine Berechtigung für diese Gruppe');
            }
            
            // Encrypt message
            const encryptedMessage = await this.encryptGroupData(message, sharedKey);
            
            // Create message event
            const messageEvent = await this.nip01.createTextNote(encryptedMessage, [
                ['d', groupId], // group identifier
                ['t', 'private-group-message']
            ]);
            messageEvent.kind = this.KIND_PRIVATE_GROUP_MESSAGE;
            
            // Re-calculate ID and signature
            messageEvent.id = this.nostrService.getEventHash(messageEvent);
            messageEvent.sig = await this.nostrService.signEvent(messageEvent);
            
            // Publish message
            await this.nip01.publish(messageEvent);
            
            console.log('✅ NIP-104 Private Gruppennachricht gesendet');
            return messageEvent;
            
        } catch (error) {
            console.error('❌ NIP-104 Gruppennachricht Fehler:', error);
            throw error;
        }
    }

    /**
     * Invite user to private group
     */
    async inviteToGroup(groupId, inviteePubkey, sharedKey) {
        try {
            console.log(`📧 NIP-104 Lade User in Gruppe ein: ${inviteePubkey.slice(0, 8)}...`);
            
            // Encrypt shared key for the invitee
            const encryptedKey = await this.nostrService.encrypt(inviteePubkey, sharedKey);
            
            // Create invite event
            const inviteEvent = await this.nip01.createTextNote(encryptedKey, [
                ['d', groupId],
                ['p', inviteePubkey],
                ['t', 'private-group-invite']
            ]);
            inviteEvent.kind = this.KIND_PRIVATE_GROUP_INVITE;
            
            // Re-calculate ID and signature
            inviteEvent.id = this.nostrService.getEventHash(inviteEvent);
            inviteEvent.sig = await this.nostrService.signEvent(inviteEvent);
            
            // Publish invite
            await this.nip01.publish(inviteEvent);
            
            console.log('✅ NIP-104 Einladung gesendet');
            return inviteEvent;
            
        } catch (error) {
            console.error('❌ NIP-104 Einladung Fehler:', error);
            throw error;
        }
    }

    /**
     * Subscribe to private group messages
     */
    subscribeToPrivateGroup(groupId, onMessage) {
        const filters = [
            {
                kinds: [this.KIND_PRIVATE_GROUP_MESSAGE],
                '#d': [groupId],
                since: Math.floor(Date.now() / 1000) - 3600 // Last hour
            }
        ];

        console.log(`📡 NIP-104 Abonniere private Gruppe: ${groupId}`);
        
        return this.nip01.subscribe(filters, async (event) => {
            try {
                const decryptedMessage = await this.decryptGroupMessage(event, groupId);
                if (decryptedMessage) {
                    onMessage(decryptedMessage);
                }
            } catch (error) {
                console.error('❌ NIP-104 Message Processing Error:', error);
            }
        });
    }

    /**
     * Subscribe to group invites
     */
    subscribeToGroupInvites(onInvite) {
        const userPubkey = this.nostrService.getPublicKey();
        
        const filters = [
            {
                kinds: [this.KIND_PRIVATE_GROUP_INVITE],
                '#p': [userPubkey],
                since: Math.floor(Date.now() / 1000) - 3600
            }
        ];

        console.log('📡 NIP-104 Abonniere Gruppeneinladungen');
        
        return this.nip01.subscribe(filters, async (event) => {
            try {
                const invite = await this.processGroupInvite(event);
                if (invite) {
                    onInvite(invite);
                }
            } catch (error) {
                console.error('❌ NIP-104 Invite Processing Error:', error);
            }
        });
    }

    /**
     * Process group invite
     */
    async processGroupInvite(event) {
        try {
            const groupId = event.tags.find(tag => tag[0] === 'd')?.[1];
            if (!groupId) {
                return null;
            }

            // Decrypt the shared key
            const sharedKey = await this.nostrService.decrypt(event.pubkey, event.content);
            
            // Store the key
            this.memberKeys.set(groupId, sharedKey);
            
            return {
                groupId,
                inviter: event.pubkey,
                sharedKey,
                timestamp: event.created_at
            };
            
        } catch (error) {
            console.error('❌ NIP-104 Invite processing failed:', error);
            return null;
        }
    }

    /**
     * Decrypt group message
     */
    async decryptGroupMessage(event, groupId) {
        try {
            const sharedKey = this.memberKeys.get(groupId);
            if (!sharedKey) {
                console.warn(`⚠️ NIP-104 Keine Berechtigung für Gruppe: ${groupId}`);
                return null;
            }

            const decryptedContent = await this.decryptGroupData(event.content, sharedKey);
            
            return {
                ...event,
                decryptedContent,
                groupId,
                isDecrypted: true,
                isPrivateGroupMessage: true
            };
            
        } catch (error) {
            console.error('❌ NIP-104 Nachricht entschlüsseln fehlgeschlagen:', error);
            return {
                ...event,
                decryptedContent: '[Entschlüsselung fehlgeschlagen]',
                groupId,
                isDecrypted: false,
                isPrivateGroupMessage: true
            };
        }
    }

    /**
     * Generate shared key for group
     */
    generateSharedKey() {
        // Simple key generation (in production, use proper crypto)
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Generate group ID
     */
    generateGroupId(name) {
        return `group_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    }

    /**
     * Encrypt data with shared key
     */
    async encryptGroupData(data, sharedKey) {
        // Simplified encryption (in production, use proper crypto)
        return btoa(data + ':' + sharedKey);
    }

    /**
     * Decrypt data with shared key
     */
    async decryptGroupData(encryptedData, sharedKey) {
        // Simplified decryption (in production, use proper crypto)
        try {
            const decoded = atob(encryptedData);
            const [data, key] = decoded.split(':');
            if (key === sharedKey) {
                return data;
            }
            throw new Error('Invalid key');
        } catch (error) {
            throw new Error('Decryption failed');
        }
    }

    /**
     * Get group info
     */
    getGroupInfo(groupId) {
        return this.privateGroups.get(groupId);
    }

    /**
     * Get all private groups
     */
    getAllPrivateGroups() {
        return Array.from(this.privateGroups.entries()).map(([groupId, info]) => ({
            groupId,
            ...info
        }));
    }

    /**
     * Check if user has access to group
     */
    hasGroupAccess(groupId) {
        return this.memberKeys.has(groupId);
    }

    /**
     * Leave private group
     */
    async leaveGroup(groupId) {
        try {
            console.log(`🚪 NIP-104 Verlasse Gruppe: ${groupId}`);
            
            // Remove local access
            this.memberKeys.delete(groupId);
            this.privateGroups.delete(groupId);
            
            // In a full implementation, you'd also notify other members
            
            console.log('✅ NIP-104 Gruppe verlassen');
            
        } catch (error) {
            console.error('❌ NIP-104 Gruppe verlassen Fehler:', error);
            throw error;
        }
    }
}
