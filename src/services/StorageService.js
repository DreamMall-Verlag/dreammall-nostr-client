// =================================================================
// Storage Service - Local Data Persistence
// =================================================================

export class StorageService {
    constructor() {
        this.dbName = 'DreamMallNostrDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('❌ Fehler beim Öffnen der IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialisiert');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Messages store
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
                    messageStore.createIndex('roomId', 'roomId', { unique: false });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                    messageStore.createIndex('authorPubkey', 'authorPubkey', { unique: false });
                }

                // Rooms store
                if (!db.objectStoreNames.contains('rooms')) {
                    const roomStore = db.createObjectStore('rooms', { keyPath: 'id' });
                    roomStore.createIndex('name', 'name', { unique: false });
                    roomStore.createIndex('type', 'type', { unique: false });
                }

                // Contacts store
                if (!db.objectStoreNames.contains('contacts')) {
                    const contactStore = db.createObjectStore('contacts', { keyPath: 'pubkey' });
                    contactStore.createIndex('name', 'name', { unique: false });
                    contactStore.createIndex('lastContact', 'lastContact', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Keys store
                if (!db.objectStoreNames.contains('keys')) {
                    db.createObjectStore('keys', { keyPath: 'id' });
                }

                console.log('✅ IndexedDB Schema erstellt');
            };
        });
    }

    // =================================================================
    // Message Storage
    // =================================================================

    async saveMessage(message) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            
            const request = store.put(message);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getMessages(roomId, limit = 100) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('roomId');
            
            const request = index.getAll(roomId);
            
            request.onsuccess = () => {
                const messages = request.result
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit);
                resolve(messages);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async deleteMessage(messageId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            
            const request = store.delete(messageId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // =================================================================
    // Room Storage
    // =================================================================

    async saveRoom(room) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readwrite');
            const store = transaction.objectStore('rooms');
            
            const request = store.put(room);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRooms() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readonly');
            const store = transaction.objectStore('rooms');
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteRoom(roomId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readwrite');
            const store = transaction.objectStore('rooms');
            
            const request = store.delete(roomId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // =================================================================
    // Contact Storage
    // =================================================================

    async saveContact(contact) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            
            const request = store.put(contact);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getContacts() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readonly');
            const store = transaction.objectStore('contacts');
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteContact(pubkey) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            
            const request = store.delete(pubkey);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // =================================================================
    // Settings Storage
    // =================================================================

    async saveSetting(key, value) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const request = store.put({ key, value });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSetting(key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // =================================================================
    // Key Storage
    // =================================================================

    async saveKey(keyData) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['keys'], 'readwrite');
            const store = transaction.objectStore('keys');
            
            const request = store.put(keyData);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getKey(keyId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['keys'], 'readonly');
            const store = transaction.objectStore('keys');
            
            const request = store.get(keyId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllKeys() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['keys'], 'readonly');
            const store = transaction.objectStore('keys');
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteKey(keyId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['keys'], 'readwrite');
            const store = transaction.objectStore('keys');
            
            const request = store.delete(keyId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // =================================================================
    // DM Contacts Management
    // =================================================================

    async saveDMContact(pubkey, contactData) {
        try {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            
            const contact = {
                pubkey,
                displayName: contactData.displayName,
                lastMessage: contactData.lastMessage || '',
                lastMessageTime: contactData.lastMessageTime || Date.now(),
                unreadCount: contactData.unreadCount || 0,
                type: 'dm',
                createdAt: Date.now()
            };

            await store.put(contact);
            console.log('💾 DM-Kontakt gespeichert:', contact);
            return contact;
        } catch (error) {
            console.error('❌ Fehler beim Speichern des DM-Kontakts:', error);
            throw error;
        }
    }

    async getDMContacts() {
        try {
            const transaction = this.db.transaction(['contacts'], 'readonly');
            const store = transaction.objectStore('contacts');
            const request = store.getAll();

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const contacts = request.result.filter(contact => contact.type === 'dm');
                    console.log('📖 DM-Kontakte geladen:', contacts.length);
                    resolve(contacts);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der DM-Kontakte:', error);
            return [];
        }
    }

    async removeDMContact(pubkey) {
        try {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            
            await store.delete(pubkey);
            console.log('🗑️ DM-Kontakt entfernt:', pubkey);
        } catch (error) {
            console.error('❌ Fehler beim Entfernen des DM-Kontakts:', error);
            throw error;
        }
    }

    // =================================================================
    // DM Messages Storage
    // =================================================================

    async saveDMMessage(message) {
        try {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            
            const messageData = {
                id: message.id,
                content: message.content,
                author: message.author,
                authorPubkey: message.authorPubkey,
                timestamp: message.timestamp,
                roomId: `dm_${message.senderPubkey || message.recipientPubkey}`,
                encrypted: message.encrypted,
                isDirect: true,
                isOwn: message.isOwn,
                recipientPubkey: message.recipientPubkey,
                senderPubkey: message.senderPubkey
            };

            await store.put(messageData);
            console.log('💾 DM-Nachricht gespeichert:', messageData);
            return messageData;
        } catch (error) {
            console.error('❌ Fehler beim Speichern der DM-Nachricht:', error);
            throw error;
        }
    }

    async getDMMessages(pubkey) {
        try {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const roomId = `dm_${pubkey}`;
            
            const index = store.index('roomId');
            const request = index.getAll(roomId);

            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    const messages = request.result.sort((a, b) => a.timestamp - b.timestamp);
                    console.log('📖 DM-Nachrichten geladen:', messages.length, 'für', pubkey);
                    resolve(messages);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('❌ Fehler beim Laden der DM-Nachrichten:', error);
            return [];
        }
    }

    // =================================================================
    // Utility Methods
    // =================================================================

    async clearAll() {
        if (!this.db) await this.init();
        
        const stores = ['messages', 'rooms', 'contacts', 'settings', 'keys'];
        
        return Promise.all(stores.map(storeName => {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                const request = store.clear();
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }));
    }

    async getStorageStats() {
        if (!this.db) await this.init();
        
        const stores = ['messages', 'rooms', 'contacts', 'settings', 'keys'];
        const stats = {};
        
        for (const storeName of stores) {
            stats[storeName] = await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                const request = store.count();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
        
        return stats;
    }

    // =================================================================
    // LocalStorage Fallback (for simple data)
    // =================================================================

    setLocalStorage(key, value) {
        try {
            localStorage.setItem(`dm-nostr-${key}`, JSON.stringify(value));
        } catch (error) {
            console.error('❌ LocalStorage Fehler:', error);
        }
    }

    getLocalStorage(key) {
        try {
            const item = localStorage.getItem(`dm-nostr-${key}`);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('❌ LocalStorage Fehler:', error);
            return null;
        }
    }

    removeLocalStorage(key) {
        try {
            localStorage.removeItem(`dm-nostr-${key}`);
        } catch (error) {
            console.error('❌ LocalStorage Fehler:', error);
        }
    }

    // =================================================================
    // Cleanup
    // =================================================================

    async destroy() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
