// =================================================================
// Key Service - Secure Key Management
// =================================================================

import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { nip19 } from 'nostr-tools';

export class KeyService {
    constructor() {
        this.keyPair = null;
        this.isUnlocked = false;
    }

    async init() {
        // Check if keys exist in storage
        const hasKeys = await this.hasKeys();
        
        if (hasKeys) {
            console.log('🔑 Gespeicherte Schlüssel gefunden');
        } else {
            console.log('🔑 Keine gespeicherten Schlüssel gefunden');
        }
    }

    async hasKeys() {
        try {
            const storedKeys = localStorage.getItem('nostr_keys');
            return storedKeys !== null;
        } catch (error) {
            console.error('❌ Fehler beim Prüfen der Schlüssel:', error);
            return false;
        }
    }

    getKeyPair() {
        if (this.isUnlocked && this.keyPair) {
            return this.keyPair;
        }
        
        try {
            const storedKeys = localStorage.getItem('nostr_keys');
            if (!storedKeys) {
                return null;
            }
            
            const keyData = JSON.parse(storedKeys);
            return {
                pubkey: keyData.pubkey,
                npub: keyData.npub,
                privkey: null, // Will be null until unlocked
                nsec: null     // Will be null until unlocked
            };
        } catch (error) {
            console.error('❌ Fehler beim Laden der Schlüssel:', error);
            return null;
        }
    }

    async unlockKeys(password) {
        try {
            const storedKeys = localStorage.getItem('nostr_keys');
            if (!storedKeys) {
                throw new Error('Keine Schlüssel gespeichert');
            }
            
            const keyData = JSON.parse(storedKeys);
            const privkey = await this.decryptPrivateKey(keyData.encryptedPrivkey, password);
            
            // Generate nsec format
            const nsec = nip19.nsecEncode(privkey);
            
            this.keyPair = {
                privkey,
                pubkey: keyData.pubkey,
                npub: keyData.npub,
                nsec
            };
            
            this.isUnlocked = true;
            console.log('✅ Schlüssel erfolgreich entsperrt');
            return this.keyPair;
            
        } catch (error) {
            console.error('❌ Fehler beim Entsperren der Schlüssel:', error);
            throw error;
        }
    }

    async generateNewKeys() {
        try {
            // Generate new private key
            const privkey = generateSecretKey();
            const pubkey = getPublicKey(privkey);
            
            // Convert to bech32 format
            const nsec = nip19.nsecEncode(privkey);
            const npub = nip19.npubEncode(pubkey);

            const keyPair = {
                privkey,
                pubkey,
                nsec,
                npub
            };

            // Store keys (you'll be prompted for password)
            await this.storeKeys(keyPair);

            this.keyPair = keyPair;
            this.isUnlocked = true;

            console.log('✅ Neue Schlüssel generiert und gespeichert');
            return keyPair;

        } catch (error) {
            console.error('❌ Fehler beim Generieren der Schlüssel:', error);
            throw error;
        }
    }

    async importKeys(privateKeyInput, password) {
        try {
            let privkey;

            // Handle different input formats
            if (privateKeyInput.startsWith('nsec')) {
                // Bech32 format
                const { type, data } = nip19.decode(privateKeyInput);
                if (type !== 'nsec') {
                    throw new Error('Ungültiger nsec Schlüssel');
                }
                privkey = data;
            } else if (privateKeyInput.match(/^[a-f0-9]{64}$/i)) {
                // Hex format
                privkey = privateKeyInput.toLowerCase();
            } else {
                throw new Error('Ungültiges Schlüsselformat. Unterstützt: hex oder nsec');
            }

            // Generate public key and formats
            const pubkey = getPublicKey(privkey);
            const nsec = nip19.nsecEncode(privkey);
            const npub = nip19.npubEncode(pubkey);

            const keyPair = {
                privkey,
                pubkey,
                nsec,
                npub
            };

            // Store with provided password
            await this.storeKeysWithPassword(keyPair, password);

            this.keyPair = keyPair;
            this.isUnlocked = true;

            console.log('✅ Schlüssel importiert und gespeichert');
            return keyPair;

        } catch (error) {
            console.error('❌ Fehler beim Importieren der Schlüssel:', error);
            throw error;
        }
    }

    async storeKeys(keyPair) {
        const password = await this.requestPassword('Wählen Sie ein Passwort für Ihre Schlüssel:');
        if (!password) {
            throw new Error('Passwort erforderlich');
        }
        
        return this.storeKeysWithPassword(keyPair, password);
    }

    async storeKeysWithPassword(keyPair, password) {
        try {
            // Encrypt private key with password
            const encryptedPrivkey = await this.encryptPrivateKey(keyPair.privkey, password);
            
            // Store in localStorage
            const keyData = {
                encryptedPrivkey,
                pubkey: keyPair.pubkey,
                npub: keyPair.npub,
                timestamp: Date.now()
            };
            
            localStorage.setItem('nostr_keys', JSON.stringify(keyData));
            console.log('✅ Schlüssel erfolgreich gespeichert');
            return true;
            
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Schlüssel:', error);
            throw error;
        }
    }

    async encryptKeys(keyPair, password) {
        try {
            // Convert password to key
            const enc = new TextEncoder();
            const passwordBuffer = enc.encode(password);
            
            const key = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            // Derive encryption key
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const derivedKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                key,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );

            // Encrypt the private key
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const data = enc.encode(JSON.stringify(keyPair));
            
            const encryptedData = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                derivedKey,
                data
            );

            // Combine salt, iv, and encrypted data
            const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
            result.set(salt, 0);
            result.set(iv, salt.length);
            result.set(new Uint8Array(encryptedData), salt.length + iv.length);

            // Convert to base64
            return btoa(String.fromCharCode(...result));

        } catch (error) {
            console.error('❌ Verschlüsselungsfehler:', error);
            throw new Error('Fehler beim Verschlüsseln der Schlüssel');
        }
    }

    async decryptKeys(encryptedKeysBase64, password) {
        try {
            // Convert from base64
            const encryptedBuffer = Uint8Array.from(atob(encryptedKeysBase64), c => c.charCodeAt(0));
            
            // Extract salt, iv, and encrypted data
            const salt = encryptedBuffer.slice(0, 16);
            const iv = encryptedBuffer.slice(16, 28);
            const encryptedData = encryptedBuffer.slice(28);

            // Convert password to key
            const enc = new TextEncoder();
            const passwordBuffer = enc.encode(password);
            
            const key = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );

            // Derive decryption key
            const derivedKey = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                key,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );

            // Decrypt the data
            const decryptedData = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                derivedKey,
                encryptedData
            );

            // Parse the JSON
            const dec = new TextDecoder();
            const keyPairJSON = dec.decode(decryptedData);
            
            return JSON.parse(keyPairJSON);

        } catch (error) {
            console.error('❌ Entschlüsselungsfehler:', error);
            throw new Error('Falsches Passwort oder beschädigte Schlüssel');
        }
    }

    async encryptPrivateKey(privkey, password) {
        // Simple encryption using Web Crypto API
        const encoder = new TextEncoder();
        const data = encoder.encode(privkey);
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );
        
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        
        // Combine salt, iv, and encrypted data
        const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        return Array.from(result);
    }

    async decryptPrivateKey(encryptedData, password) {
        try {
            const data = new Uint8Array(encryptedData);
            const salt = data.slice(0, 16);
            const iv = data.slice(16, 28);
            const encrypted = data.slice(28);
            
            const encoder = new TextEncoder();
            const passwordKey = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                { name: 'PBKDF2' },
                false,
                ['deriveBits', 'deriveKey']
            );
            
            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                passwordKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                encrypted
            );
            
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
            
        } catch (error) {
            console.error('❌ Fehler beim Entschlüsseln:', error);
            throw new Error('Falsches Passwort oder beschädigte Daten');
        }
    }

    async promptForPassword(message) {
        return new Promise((resolve, reject) => {
            // Create modal for password input
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔐 Passwort für Schlüssel-Speicherung</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                        <div class="form-group">
                            <label for="password-input">Passwort (mindestens 8 Zeichen):</label>
                            <input 
                                type="password" 
                                id="password-input" 
                                class="form-control"
                                placeholder="Sicheres Passwort eingeben..."
                                minlength="8"
                                autocomplete="new-password"
                            >
                            <small class="form-text">Dieses Passwort wird verwendet, um Ihre Schlüssel sicher zu verschlüsseln.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="password-cancel" class="btn btn-secondary">Abbrechen</button>
                        <button id="password-ok" class="btn btn-primary">OK</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const passwordInput = modal.querySelector('#password-input');
            const okButton = modal.querySelector('#password-ok');
            const cancelButton = modal.querySelector('#password-cancel');
            
            // Focus on input
            passwordInput.focus();
            
            // Handle OK button
            const handleOk = () => {
                const password = passwordInput.value.trim();
                if (password.length < 8) {
                    passwordInput.classList.add('error');
                    passwordInput.focus();
                    return;
                }
                
                modal.remove();
                resolve(password);
            };
            
            // Handle Cancel button
            const handleCancel = () => {
                modal.remove();
                reject(new Error('Passwort-Eingabe abgebrochen'));
            };
            
            // Event listeners
            okButton.addEventListener('click', handleOk);
            cancelButton.addEventListener('click', handleCancel);
            
            // Enter key support
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleOk();
                }
            });
            
            // ESC key support
            passwordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            });
            
            // Remove error class on input
            passwordInput.addEventListener('input', () => {
                passwordInput.classList.remove('error');
            });
            
            // Don't close on click outside - user must explicitly cancel or provide password
        });
    }

    async requestPassword(message = 'Passwort eingeben:') {
        return new Promise((resolve, reject) => {
            // Create unique ID for this password request
            const modalId = `password-modal-${Date.now()}`;
            const inputId = `password-input-${Date.now()}`;
            
            const modalHtml = `
                <div id="${modalId}" class="password-modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>🔐 Passwort für Schlüssel-Speicherung</h3>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                            <p><small>Passwort (mindestens 8 Zeichen):</small></p>
                            <input type="password" id="${inputId}" class="form-control" 
                                   placeholder="Sicheres Passwort eingeben..." 
                                   minlength="8" 
                                   autocomplete="new-password">
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary cancel-btn">Abbrechen</button>
                            <button type="button" class="btn btn-primary ok-btn">OK</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add modal to body
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modal = document.getElementById(modalId);
            const input = document.getElementById(inputId);
            const okBtn = modal.querySelector('.ok-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            
            // Focus input
            setTimeout(() => input.focus(), 100);
            
            // Handle OK button
            const handleOk = () => {
                const password = input.value.trim();
                if (password.length < 8) {
                    alert('Passwort muss mindestens 8 Zeichen haben');
                    input.focus();
                    return;
                }
                
                modal.remove();
                resolve(password);
            };
            
            // Handle Cancel button
            const handleCancel = () => {
                modal.remove();
                resolve(null);
            };
            
            // Event listeners
            okBtn.addEventListener('click', handleOk);
            cancelBtn.addEventListener('click', handleCancel);
            
            // Enter key in input
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleOk();
                }
            });
            
            // Escape key
            document.addEventListener('keydown', function escapeHandler(e) {
                if (e.key === 'Escape') {
                    document.removeEventListener('keydown', escapeHandler);
                    handleCancel();
                }
            });
        });
    }

    exportKeys() {
        if (!this.isUnlocked || !this.keyPair) {
            throw new Error('Schlüssel sind nicht entsperrt');
        }

        return {
            privateKey: this.keyPair.privkey,
            publicKey: this.keyPair.pubkey,
            nsec: this.keyPair.nsec,
            npub: this.keyPair.npub
        };
    }

    getPublicInfo() {
        const pubkey = localStorage.getItem('nostr_pubkey');
        const npub = localStorage.getItem('nostr_npub');
        
        return pubkey ? { pubkey, npub } : null;
    }

    lock() {
        this.keyPair = null;
        this.isUnlocked = false;
        console.log('🔒 Schlüssel gesperrt');
    }

    async deleteKeys() {
        try {
            localStorage.removeItem('nostr_encrypted_keys');
            localStorage.removeItem('nostr_pubkey');
            localStorage.removeItem('nostr_npub');
            
            this.keyPair = null;
            this.isUnlocked = false;
            
            console.log('🗑️ Schlüssel gelöscht');
            
        } catch (error) {
            console.error('❌ Fehler beim Löschen der Schlüssel:', error);
            throw error;
        }
    }

    validatePrivateKey(privateKey) {
        try {
            // Check if it's hex format
            if (privateKey.match(/^[a-f0-9]{64}$/i)) {
                return true;
            }
            
            // Check if it's nsec format
            if (privateKey.startsWith('nsec')) {
                const { type } = nip19.decode(privateKey);
                return type === 'nsec';
            }
            
            return false;
            
        } catch (error) {
            return false;
        }
    }

    async importFromNsec(nsec, password) {
        try {
            const { type, data } = nip19.decode(nsec);
            if (type !== 'nsec') {
                throw new Error('Ungültiger nsec Schlüssel');
            }
            
            const privkey = data;
            const pubkey = getPublicKey(privkey);
            const npub = nip19.npubEncode(pubkey);
            
            const keyPair = {
                privkey,
                pubkey,
                nsec,
                npub
            };
            
            await this.storeKeysWithPassword(keyPair, password);
            
            this.keyPair = keyPair;
            this.isUnlocked = true;
            
            console.log('✅ Schlüssel erfolgreich importiert');
            return keyPair;
            
        } catch (error) {
            console.error('❌ Fehler beim Importieren der Schlüssel:', error);
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            // First unlock with current password
            const keyPair = await this.unlockKeys(currentPassword);
            
            // Re-encrypt with new password
            await this.storeKeysWithPassword(keyPair, newPassword);
            
            console.log('✅ Passwort erfolgreich geändert');
            return true;
            
        } catch (error) {
            console.error('❌ Fehler beim Ändern des Passworts:', error);
            throw error;
        }
    }
}
