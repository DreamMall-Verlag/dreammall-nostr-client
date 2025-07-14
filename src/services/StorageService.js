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

                console.log('📦 IndexedDB Schema erstellt');
            };
        });
    }

    // =================================================================
    // Messages
    // =================================================================

    async saveMessage(message) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            
            const request = store.add(message);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                // Message might already exist, try to update
                store.put(message).onsuccess = () => resolve(true);
                store.put(message).onerror = () => reject(request.error);
            };
        });
    }

    async getMessages(roomId, limit = 100) {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('roomId');
            
            const request = index.getAll(roomId);
            
            request.onsuccess = () => {
                const messages = request.result
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .slice(-limit);
                resolve(messages);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async getMessagesByAuthor(authorPubkey, limit = 100) {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('authorPubkey');
            
            const request = index.getAll(authorPubkey);
            
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
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            
            const request = store.delete(messageId);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async clearMessages(roomId = null) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            
            if (roomId) {
                const index = store.index('roomId');
                const request = index.openCursor(roomId);
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    } else {
                        resolve(true);
                    }
                };
                
                request.onerror = () => reject(request.error);
            } else {
                const request = store.clear();
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            }
        });
    }

    // =================================================================
    // Rooms
    // =================================================================

    async saveRoom(room) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readwrite');
            const store = transaction.objectStore('rooms');
            
            const request = store.put(room);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getRooms() {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readonly');
            const store = transaction.objectStore('rooms');
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRoom(roomId) {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms'], 'readonly');
            const store = transaction.objectStore('rooms');
            
            const request = store.get(roomId);
            
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteRoom(roomId) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['rooms', 'messages'], 'readwrite');
            
            // Delete room
            const roomStore = transaction.objectStore('rooms');
            roomStore.delete(roomId);
            
            // Delete all messages in room
            const messageStore = transaction.objectStore('messages');
            const index = messageStore.index('roomId');
            const request = index.openCursor(roomId);
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve(true);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // =================================================================
    // Contacts
    // =================================================================

    async saveContact(contact) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            
            const contactData = {
                ...contact,
                lastContact: Date.now()
            };
            
            const request = store.put(contactData);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getContacts() {
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readonly');
            const store = transaction.objectStore('contacts');
            
            const request = store.getAll();
            
            request.onsuccess = () => {
                const contacts = request.result.sort((a, b) => b.lastContact - a.lastContact);
                resolve(contacts);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async getContact(pubkey) {
        if (!this.db) return null;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readonly');
            const store = transaction.objectStore('contacts');
            
            const request = store.get(pubkey);
            
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteContact(pubkey) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            
            const request = store.delete(pubkey);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // =================================================================
    // Settings
    // =================================================================

    async setSetting(key, value) {
        if (!this.db) {
            // Fallback to localStorage
            localStorage.setItem(`nostr_setting_${key}`, JSON.stringify(value));
            return true;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const request = store.put({ key, value });
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key, defaultValue = null) {
        if (!this.db) {
            // Fallback to localStorage
            try {
                const value = localStorage.getItem(`nostr_setting_${key}`);
                return value ? JSON.parse(value) : defaultValue;
            } catch (error) {
                return defaultValue;
            }
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            
            const request = store.get(key);
            
            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : defaultValue);
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSetting(key) {
        if (!this.db) {
            localStorage.removeItem(`nostr_setting_${key}`);
            return true;
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            
            const request = store.delete(key);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // =================================================================
    // Convenience Methods
    // =================================================================

    async getTheme() {
        return await this.getSetting('theme', 'light');
    }

    async setTheme(theme) {
        return await this.setSetting('theme', theme);
    }

    async getEncryptionEnabled() {
        return await this.getSetting('encryptionEnabled', true);
    }

    async setEncryptionEnabled(enabled) {
        return await this.setSetting('encryptionEnabled', enabled);
    }

    async getNotificationsEnabled() {
        return await this.getSetting('notificationsEnabled', true);
    }

    async setNotificationsEnabled(enabled) {
        return await this.setSetting('notificationsEnabled', enabled);
    }

    // =================================================================
    // Data Management
    // =================================================================

    async exportData() {
        if (!this.db) return null;

        try {
            const [messages, rooms, contacts, settings] = await Promise.all([
                this.getAllData('messages'),
                this.getAllData('rooms'),
                this.getAllData('contacts'),
                this.getAllData('settings')
            ]);

            return {
                version: this.dbVersion,
                timestamp: Date.now(),
                data: {
                    messages,
                    rooms,
                    contacts,
                    settings
                }
            };

        } catch (error) {
            console.error('❌ Fehler beim Exportieren der Daten:', error);
            throw error;
        }
    }

    async importData(exportData) {
        if (!this.db || !exportData || !exportData.data) {
            throw new Error('Ungültige Exportdaten');
        }

        try {
            const transaction = this.db.transaction(['messages', 'rooms', 'contacts', 'settings'], 'readwrite');
            
            // Import each data type
            for (const [storeName, items] of Object.entries(exportData.data)) {
                if (Array.isArray(items) && items.length > 0) {
                    const store = transaction.objectStore(storeName);
                    for (const item of items) {
                        store.put(item);
                    }
                }
            }

            return new Promise((resolve, reject) => {
                transaction.oncomplete = () => {
                    console.log('✅ Daten erfolgreich importiert');
                    resolve(true);
                };
                transaction.onerror = () => reject(transaction.error);
            });

        } catch (error) {
            console.error('❌ Fehler beim Importieren der Daten:', error);
            throw error;
        }
    }

    async getAllData(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllData() {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages', 'rooms', 'contacts', 'settings'], 'readwrite');
            
            let completed = 0;
            const storeNames = ['messages', 'rooms', 'contacts', 'settings'];
            
            storeNames.forEach(storeName => {
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onsuccess = () => {
                    completed++;
                    if (completed === storeNames.length) {
                        console.log('🗑️ Alle Daten gelöscht');
                        resolve(true);
                    }
                };
                
                request.onerror = () => reject(request.error);
            });
        });
    }

    getStorageInfo() {
        return navigator.storage?.estimate?.() || Promise.resolve({ quota: 0, usage: 0 });
    }

    async getUserProfile(pubkey) {
        if (!this.db) {
            console.error('❌ Datenbank nicht initialisiert');
            return null;
        }

        try {
            const transaction = this.db.transaction(['contacts'], 'readonly');
            const store = transaction.objectStore('contacts');
            const request = store.get(pubkey);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    if (request.result) {
                        resolve(request.result);
                    } else {
                        // Create basic profile if not found
                        const basicProfile = {
                            pubkey: pubkey,
                            name: `User ${pubkey.substring(0, 8)}...`,
                            about: '',
                            picture: '',
                            nip05: '',
                            lastContact: Date.now()
                        };
                        resolve(basicProfile);
                    }
                };
                
                request.onerror = () => {
                    console.error('❌ Fehler beim Abrufen des Benutzerprofils');
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('❌ Fehler beim Abrufen des Benutzerprofils:', error);
            return null;
        }
    }

    async saveUserProfile(profile) {
        if (!this.db) {
            console.error('❌ Datenbank nicht initialisiert');
            return false;
        }

        if (!profile.pubkey) {
            console.error('❌ Profil benötigt pubkey');
            return false;
        }

        try {
            const transaction = this.db.transaction(['contacts'], 'readwrite');
            const store = transaction.objectStore('contacts');
            
            const profileData = {
                pubkey: profile.pubkey,
                name: profile.name || '',
                about: profile.about || '',
                picture: profile.picture || '',
                nip05: profile.nip05 || '',
                lastContact: Date.now()
            };
            
            const request = store.put(profileData);
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    console.log('✅ Benutzerprofil gespeichert');
                    resolve(true);
                };
                
                request.onerror = () => {
                    console.error('❌ Fehler beim Speichern des Benutzerprofils');
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('❌ Fehler beim Speichern des Benutzerprofils:', error);
            return false;
        }
    }
}
