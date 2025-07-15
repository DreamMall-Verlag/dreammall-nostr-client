// =================================================================
// NIP-02: Contact Lists
// Manages contact lists and follow relationships
// =================================================================

export class NIP02_ContactLists {
    constructor(nostrService, nip01) {
        this.nostrService = nostrService;
        this.nip01 = nip01;
        this.KIND_CONTACTS = 3;
        this.contacts = new Map();
        this.profiles = new Map();
    }

    /**
     * Add contact to list
     */
    addContact(pubkey, relay = '', petname = '') {
        this.contacts.set(pubkey, {
            pubkey: pubkey,
            relay: relay,
            petname: petname,
            added_at: Date.now()
        });
        
        console.log(`📝 NIP-02 Contact added: ${pubkey}`);
        return this.publishContactList();
    }

    /**
     * Remove contact from list
     */
    removeContact(pubkey) {
        const removed = this.contacts.delete(pubkey);
        
        if (removed) {
            console.log(`🗑️ NIP-02 Contact removed: ${pubkey}`);
            return this.publishContactList();
        }
        
        return Promise.resolve();
    }

    /**
     * Get contact by pubkey
     */
    getContact(pubkey) {
        return this.contacts.get(pubkey);
    }

    /**
     * Get all contacts
     */
    getAllContacts() {
        return Array.from(this.contacts.values());
    }

    /**
     * Check if pubkey is in contacts
     */
    isContact(pubkey) {
        return this.contacts.has(pubkey);
    }

    /**
     * Get display name for pubkey
     */
    getDisplayName(pubkey) {
        // First check contact petname
        const contact = this.contacts.get(pubkey);
        if (contact && contact.petname) {
            return contact.petname;
        }
        
        // Check profile cache
        const profile = this.profiles.get(pubkey);
        if (profile) {
            return profile.display_name || profile.name || this.formatPubkey(pubkey);
        }
        
        // Return formatted pubkey as fallback
        return this.formatPubkey(pubkey);
    }

    /**
     * Format pubkey for display
     */
    formatPubkey(pubkey) {
        if (!pubkey) return 'Unknown';
        return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    }

    /**
     * Set profile for pubkey
     */
    setProfile(pubkey, profile) {
        this.profiles.set(pubkey, profile);
        console.log(`👤 NIP-02 Profile cached for: ${pubkey}`);
    }

    /**
     * Get profile for pubkey
     */
    getProfile(pubkey) {
        return this.profiles.get(pubkey);
    }

    /**
     * Publish contact list
     */
    async publishContactList() {
        try {
            // Create tags array from contacts
            const tags = [];
            
            for (const contact of this.contacts.values()) {
                const tag = ['p', contact.pubkey];
                
                if (contact.relay) {
                    tag.push(contact.relay);
                }
                
                if (contact.petname) {
                    tag.push(contact.petname);
                }
                
                tags.push(tag);
            }
            
            // Create contact list event
            const event = {
                kind: this.KIND_CONTACTS,
                created_at: Math.floor(Date.now() / 1000),
                tags: tags,
                content: '',
                pubkey: this.nostrService.getPublicKey()
            };
            
            // Publish event
            const publishedEvent = await this.nip01.publish(event);
            
            console.log('📤 NIP-02 Contact list published:', publishedEvent);
            return publishedEvent;
            
        } catch (error) {
            console.error('❌ NIP-02 Failed to publish contact list:', error);
            throw error;
        }
    }

    /**
     * Subscribe to contact lists
     */
    subscribeToContactLists(onContactList) {
        const filters = [
            {
                kinds: [this.KIND_CONTACTS],
                authors: [this.nostrService.getPublicKey()],
                limit: 1
            }
        ];
        
        console.log('📡 NIP-02 Subscribing to contact lists');
        
        return this.nip01.subscribe(filters, (event) => {
            this.processContactListEvent(event);
            
            if (onContactList) {
                onContactList(event);
            }
        });
    }

    /**
     * Process contact list event
     */
    processContactListEvent(event) {
        try {
            // Clear existing contacts
            this.contacts.clear();
            
            // Process p tags
            event.tags.forEach(tag => {
                if (tag[0] === 'p' && tag[1]) {
                    const pubkey = tag[1];
                    const relay = tag[2] || '';
                    const petname = tag[3] || '';
                    
                    this.contacts.set(pubkey, {
                        pubkey: pubkey,
                        relay: relay,
                        petname: petname,
                        added_at: event.created_at * 1000
                    });
                }
            });
            
            console.log(`📝 NIP-02 Processed contact list: ${this.contacts.size} contacts`);
            
        } catch (error) {
            console.error('❌ NIP-02 Error processing contact list:', error);
        }
    }

    /**
     * Load contact profiles
     */
    async loadContactProfiles() {
        const pubkeys = Array.from(this.contacts.keys());
        
        if (pubkeys.length === 0) {
            return;
        }
        
        const filters = [
            {
                kinds: [0], // Metadata events
                authors: pubkeys,
                limit: pubkeys.length
            }
        ];
        
        console.log('📡 NIP-02 Loading contact profiles');
        
        return this.nip01.subscribe(filters, (event) => {
            try {
                const profile = JSON.parse(event.content);
                this.setProfile(event.pubkey, profile);
                
                console.log(`👤 NIP-02 Profile loaded for: ${event.pubkey}`);
                
            } catch (error) {
                console.error('❌ NIP-02 Error parsing profile:', error);
            }
        });
    }

    /**
     * Get contacts count
     */
    getContactsCount() {
        return this.contacts.size;
    }

    /**
     * Search contacts
     */
    searchContacts(query) {
        if (!query) {
            return this.getAllContacts();
        }
        
        const lowerQuery = query.toLowerCase();
        
        return this.getAllContacts().filter(contact => {
            const displayName = this.getDisplayName(contact.pubkey).toLowerCase();
            const pubkey = contact.pubkey.toLowerCase();
            
            return displayName.includes(lowerQuery) || 
                   pubkey.includes(lowerQuery) ||
                   (contact.petname && contact.petname.toLowerCase().includes(lowerQuery));
        });
    }

    /**
     * Clear all contacts
     */
    clearContacts() {
        this.contacts.clear();
        this.profiles.clear();
        console.log('🗑️ NIP-02 All contacts cleared');
    }
}
