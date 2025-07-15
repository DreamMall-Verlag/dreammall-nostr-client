// =================================================================
// Refactored Chat Component - Modularer Aufbau (Updated)
// Nutzt NIP-spezifische Module und UI-Komponenten
// =================================================================

import { NIP01_BasicProtocol } from '../nips/NIP01_BasicProtocol.js';
import { NIP04_EncryptedDMs } from '../nips/NIP04_EncryptedDMs.js';
import { NIP28_PublicChat } from '../nips/NIP28_PublicChat.js';
import { ModalComponent } from './ui/ModalComponent.js';
import { RoomManagerComponent } from './ui/RoomManagerComponent.js';

export class ChatComponentRefactored {
    constructor(nostrService, toastService) {
        this.nostrService = nostrService;
        this.toastService = toastService;
        
        // Initialize NIP modules
        this.nip01 = new NIP01_BasicProtocol(nostrService);
        this.nip04 = new NIP04_EncryptedDMs(nostrService, this.nip01);
        this.nip28 = new NIP28_PublicChat(nostrService, this.nip01);
        
        // Initialize UI components
        this.modal = new ModalComponent();
        this.roomManager = new RoomManagerComponent(this.nip28, toastService);
        
        // State
        this.currentRoom = 'dreammall-support';
        this.currentView = 'room'; // 'room' or 'dm'
        this.currentDMUser = null;
        this.messages = new Map();
        this.dmContacts = new Map();
        
        // Subscriptions
        this.subscriptions = new Map();
        
        this.element = null;
    }

    /**
     * Render the component
     */
    render() {
        this.element = document.createElement('div');
        this.element.className = 'main';
        
        this.element.innerHTML = `
            <div class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-tabs">
                        <button class="tab-btn active" id="roomsTab">🏠 Räume</button>
                        <button class="tab-btn" id="dmsTab">💬 DMs</button>
                    </div>
                </div>
                
                <!-- Rooms Tab -->
                <div class="tab-content active" id="roomsContent">
                    ${this.renderRoomsSection()}
                </div>
                
                <!-- DMs Tab -->
                <div class="tab-content" id="dmsContent">
                    ${this.renderDMSection()}
                </div>
            </div>
            
            <div class="chat">
                <div class="chat-header">
                    <h3 id="chatTitle">DreamMall Support</h3>
                    <div class="chat-controls">
                        <button class="btn btn-sm" id="userBtn" title="Dein Profil">👤</button>
                        <button class="btn btn-sm" id="settingsBtn" title="Einstellungen">⚙️</button>
                        <button class="btn btn-sm" id="relaysBtn" title="Relays">🔗</button>
                    </div>
                </div>
                
                <div class="messages" id="messages">
                    <div class="welcome">
                        <h3>Willkommen im DreamMall Support! 🎉</h3>
                        <p>Stelle deine Frage oder sende eine Test-Nachricht...</p>
                    </div>
                </div>
                
                <div class="input-area">
                    <div class="input-container">
                        <input type="text" id="messageInput" placeholder="Test-Nachricht schreiben..." />
                        <button class="btn btn-primary" id="sendBtn">📤</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.initializeChat();
        
        return this.element;
    }

    /**
     * Render DM section
     */
    renderDMSection() {
        return `
            <div class="dm-actions">
                <input type="text" id="dmUserInput" placeholder="npub... oder hex pubkey" />
                <button class="btn btn-sm" id="startDMBtn">💬 Start DM</button>
            </div>
            <div class="dm-contacts" id="dmContacts">
                ${this.renderDMContactsList()}
            </div>
        `;
    }

    /**
     * Render DM contacts list
     */
    renderDMContactsList() {
        if (this.dmContacts.size === 0) {
            return `
                <div class="no-contacts">
                    <p>Keine DM-Kontakte</p>
                    <small>Gib einen npub oder pubkey ein, um eine verschlüsselte Unterhaltung zu starten</small>
                </div>
            `;
        }

        const contacts = Array.from(this.dmContacts.entries()).map(([pubkey, contact]) => {
            const isActive = this.currentDMPubkey === pubkey;
            const unreadCount = contact.unreadCount || 0;
            const lastMessage = contact.lastMessage || '';
            const lastMessageTime = contact.lastMessageTime || 0;
            
            return `
                <div class="dm-contact ${isActive ? 'active' : ''}" data-pubkey="${pubkey}">
                    <div class="avatar">${contact.displayName ? contact.displayName.charAt(0).toUpperCase() : '?'}</div>
                    <div class="contact-info">
                        <div class="contact-name">${contact.displayName || this.formatPubkey(pubkey)}</div>
                        <div class="contact-last-message">${lastMessage.substring(0, 50)}${lastMessage.length > 50 ? '...' : ''}</div>
                    </div>
                    <div class="contact-meta">
                        <div class="contact-time">${this.formatTime(lastMessageTime)}</div>
                        ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        return contacts;
    }

    /**
     * Format pubkey for display
     */
    formatPubkey(pubkey) {
        return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
    }

    /**
     * Format time for display
     */
    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diff = now - messageTime;
        
        if (diff < 60000) return 'jetzt';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return messageTime.toLocaleDateString();
    }

    /**
     * Render rooms section
     */
    renderRoomsSection() {
        return `
            <div class="room-section">
                <h4 class="section-title">🌍 Öffentliche Räume</h4>
                <div class="rooms public-rooms">
                    <div class="room active" data-room="dreammall-support">
                        <div class="room-name">DreamMall Support</div>
                        <div class="room-status">Technischer Support</div>
                    </div>
                    <div class="room" data-room="dreammall-hilfe">
                        <div class="room-name">DreamMall Hilfe</div>
                        <div class="room-status">Allgemeine Fragen</div>
                    </div>
                    <div class="room" data-room="dreammall-dev">
                        <div class="room-name">DreamMall Dev</div>
                        <div class="room-status">Entwickler Chat</div>
                    </div>
                </div>
            </div>
            
            <div class="room-section">
                <h4 class="section-title">🔐 Private Räume</h4>
                <div class="rooms private-rooms">
                    <div class="add-room" id="addPrivateRoom">
                        <div class="room-name">➕ Privaten Raum erstellen</div>
                        <div class="room-status">NIP-104 Private Groups</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Message sending
        const sendBtn = this.element.querySelector('#sendBtn');
        const messageInput = this.element.querySelector('#messageInput');
        
        sendBtn.addEventListener('click', () => this.handleSendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });

        // Tab switching
        const roomsTab = this.element.querySelector('#roomsTab');
        const dmsTab = this.element.querySelector('#dmsTab');
        
        roomsTab.addEventListener('click', () => this.switchTab('rooms'));
        dmsTab.addEventListener('click', () => this.switchTab('dms'));

        // Room management - simplified event handling
        const roomsContent = this.element.querySelector('#roomsContent');
        roomsContent.addEventListener('click', (e) => {
            const roomElement = e.target.closest('.room');
            if (roomElement && roomElement.dataset.room) {
                this.switchRoom(roomElement.dataset.room);
            }
        });

        // DM functionality
        const startDMBtn = this.element.querySelector('#startDMBtn');
        const dmUserInput = this.element.querySelector('#dmUserInput');
        
        startDMBtn.addEventListener('click', () => this.startDirectMessage());
        dmUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startDirectMessage();
        });

        // DM contacts click handling
        const dmContactsContainer = this.element.querySelector('#dmContacts');
        dmContactsContainer.addEventListener('click', (e) => {
            const dmContact = e.target.closest('.dm-contact');
            if (dmContact) {
                const pubkey = dmContact.dataset.pubkey;
                this.openDirectMessage(pubkey);
            }
        });

        // Control buttons
        const userBtn = this.element.querySelector('#userBtn');
        const settingsBtn = this.element.querySelector('#settingsBtn');
        const relaysBtn = this.element.querySelector('#relaysBtn');

        userBtn.addEventListener('click', () => this.showUserProfile());
        settingsBtn.addEventListener('click', () => this.dispatchEvent('showSettings'));
        relaysBtn.addEventListener('click', () => this.dispatchEvent('showRelays'));

        // Listen for new direct messages
        document.addEventListener('newDirectMessage', (e) => {
            const message = e.detail;
            
            // Update DM contact
            this.updateDMContact(message.authorPubkey, message.content);
            
            // Display message if this DM conversation is currently open
            if (this.isDirectMessage && this.currentDMPubkey === message.authorPubkey) {
                this.displayMessage(message);
            }
        });
    }

    /**
     * Initialize chat
     */
    async initializeChat() {
        try {
            // Wait for NOSTR service to be ready
            await this.waitForNostrService();
            
            // Load saved DM contacts
            await this.loadDMContacts();
            
            // Subscribe to room messages
            this.subscribeToCurrentRoom();
            
            // Subscribe to encrypted DMs
            this.subscribeToEncryptedDMs();
            
            console.log('✅ Chat Component initialisiert');
            
        } catch (error) {
            console.error('❌ Chat Initialisierung fehlgeschlagen:', error);
            this.toastService.showError('Chat konnte nicht initialisiert werden');
        }
    }

    /**
     * Load saved DM contacts from storage
     */
    async loadDMContacts() {
        try {
            if (!this.nostrService.services?.storage) {
                console.warn('⚠️ Storage Service nicht verfügbar');
                return;
            }

            const savedContacts = await this.nostrService.services.storage.getDMContacts();
            
            for (const contact of savedContacts) {
                this.dmContacts.set(contact.pubkey, {
                    pubkey: contact.pubkey,
                    displayName: contact.displayName,
                    lastMessage: contact.lastMessage,
                    lastMessageTime: contact.lastMessageTime,
                    unreadCount: contact.unreadCount || 0
                });
            }

            console.log('📖 DM-Kontakte geladen:', savedContacts.length);
            this.updateDMContactsList();
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der DM-Kontakte:', error);
        }
    }

    /**
     * Wait for NOSTR service to be ready
     */
    async waitForNostrService() {
        let retries = 0;
        while (retries < 10) {
            if (this.nostrService && this.nostrService.pool && this.nostrService.keyPair) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
        }
        throw new Error('NOSTR Service not ready after 5 seconds');
    }

    /**
     * Handle message sending
     */
    async handleSendMessage() {
        const input = this.element.querySelector('#messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        try {
            if (this.currentView === 'room') {
                await this.sendRoomMessage(message);
            } else if (this.currentView === 'dm' && this.currentDMUser) {
                await this.sendDirectMessage(message);
            }
            
            input.value = '';
            
        } catch (error) {
            console.error('❌ Fehler beim Senden der Nachricht:', error);
            this.toastService.showError('Fehler beim Senden der Nachricht');
        }
    }

    /**
     * Send room message using NIP-28
     */
    async sendRoomMessage(message) {
        console.log(`📤 Sende Nachricht in Raum: ${this.currentRoom}`);
        
        const event = await this.nip28.sendRoomMessage(this.currentRoom, message);
        
        // Show message immediately for better UX
        this.displayMessage({
            id: event.id,
            content: message,
            author: 'Du',
            timestamp: Date.now(),
            isOwn: true
        });
    }

    /**
     * Send direct message using NIP-04
     */
    async sendDirectMessage(message) {
        console.log(`📤 Sende verschlüsselte DM an: ${this.currentDMUser}`);
        
        const event = await this.nip04.sendEncryptedDM(this.currentDMUser, message);
        
        // Create message object
        const messageObj = {
            id: event.id,
            content: message,
            author: 'Du',
            authorPubkey: this.nostrService.getPublicKey(),
            timestamp: Date.now(),
            isOwn: true,
            encrypted: true,
            isDirect: true,
            senderPubkey: this.nostrService.getPublicKey(),
            recipientPubkey: this.currentDMUser
        };
        
        // Save to storage
        if (this.nostrService.services?.storage) {
            this.nostrService.services.storage.saveDMMessage(messageObj).catch(error => {
                console.error('❌ Fehler beim Speichern der gesendeten DM-Nachricht:', error);
            });
        }
        
        // Show message immediately
        this.displayMessage(messageObj);
        
        this.toastService.showSuccess('🔐 Verschlüsselte Nachricht gesendet');
    }

    /**
     * Switch between rooms
     */
    switchRoom(roomId) {
        console.log(`🏠 Wechsle zu Raum: ${roomId}`);
        
        // Unsubscribe from current room
        this.unsubscribeFromCurrentRoom();
        
        // Update state
        this.currentRoom = roomId;
        this.currentView = 'room';
        this.currentDMUser = null;
        
        // Update UI - simplified
        const roomName = this.getRoomName(roomId);
        this.element.querySelector('#chatTitle').textContent = roomName;
        
        // Update room selection
        this.element.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
        const selectedRoom = this.element.querySelector(`[data-room="${roomId}"]`);
        if (selectedRoom) selectedRoom.classList.add('active');
        
        // Update input placeholder
        const messageInput = this.element.querySelector('#messageInput');
        messageInput.placeholder = `Nachricht in "${roomName}" schreiben...`;
        
        // Clear messages and subscribe to new room
        this.clearMessages();
        this.subscribeToCurrentRoom();
    }

    /**
     * Subscribe to current room messages
     */
    subscribeToCurrentRoom() {
        if (this.subscriptions.has('room')) {
            const existingSubscription = this.subscriptions.get('room');
            try {
                // Check if it's a SimplePool subscription (has close method)
                if (existingSubscription && typeof existingSubscription.close === 'function') {
                    existingSubscription.close();
                } else if (existingSubscription && typeof existingSubscription.unsub === 'function') {
                    existingSubscription.unsub();
                } else if (existingSubscription && typeof existingSubscription.unsubscribe === 'function') {
                    existingSubscription.unsubscribe();
                }
            } catch (error) {
                console.error('❌ Error unsubscribing from existing room:', error);
            }
        }
        
        const subscription = this.nip28.subscribeToRoom(this.currentRoom, (event) => {
            this.handleRoomMessage(event);
        });
        
        this.subscriptions.set('room', subscription);
    }

    /**
     * Subscribe to encrypted DMs
     */
    subscribeToEncryptedDMs() {
        if (this.subscriptions.has('dms')) {
            this.subscriptions.get('dms').unsub();
        }
        
        const subscription = this.nip04.subscribeToEncryptedDMs((event) => {
            this.handleDirectMessage(event);
        });
        
        this.subscriptions.set('dms', subscription);
    }

    /**
     * Handle incoming room message
     */
    handleRoomMessage(event) {
        if (!event.isRoomMessage || event.roomName !== this.currentRoom) {
            return;
        }
        
        const message = {
            id: event.id,
            content: event.content,
            author: this.getAuthorName(event.pubkey),
            timestamp: event.created_at * 1000,
            isOwn: event.pubkey === this.nostrService.getPublicKey()
        };
        
        this.displayMessage(message);
    }

    /**
     * Handle incoming direct message
     */
    handleDirectMessage(event) {
        if (!event.isDecrypted) {
            console.warn('⚠️ Could not decrypt DM');
            return;
        }
        
        const message = {
            id: event.id,
            content: event.decryptedContent,
            author: this.getAuthorName(event.senderPubkey),
            authorPubkey: event.senderPubkey,
            timestamp: event.created_at * 1000,
            isOwn: event.pubkey === this.nostrService.getPublicKey(),
            encrypted: true,
            isDirect: true,
            senderPubkey: event.senderPubkey,
            recipientPubkey: event.recipientPubkey || this.nostrService.getPublicKey()
        };
        
        // Save DM message to storage
        if (this.nostrService.services?.storage) {
            this.nostrService.services.storage.saveDMMessage(message).catch(error => {
                console.error('❌ Fehler beim Speichern der DM-Nachricht:', error);
            });
        }
        
        // Add to DM contacts if not already there
        this.addDMContact(event.senderPubkey);
        
        // Display if currently viewing this DM
        if (this.currentView === 'dm' && this.currentDMUser === event.senderPubkey) {
            // Check if message is already displayed to avoid duplicates
            const messagesContainer = this.element.querySelector('#messages');
            if (messagesContainer) {
                const existingMessage = messagesContainer.querySelector(`[data-message-id="${message.id}"]`);
                if (!existingMessage) {
                    this.displayMessage(message);
                }
            }
        }
    }

    /**
     * Display message in chat
     */
    displayMessage(message) {
        const messagesContainer = this.element.querySelector('#messages');
        
        // Remove welcome message if present
        const welcome = messagesContainer.querySelector('.welcome');
        if (welcome) {
            welcome.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.isOwn ? 'user' : 'other'}`;
        messageElement.setAttribute('data-message-id', message.id);
        messageElement.innerHTML = `
            <div class="message-text">
                ${message.encrypted ? '🔐 ' : ''}${message.content}
            </div>
            <div class="message-time">
                ${message.author} • ${new Date(message.timestamp).toLocaleTimeString()}
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Clear messages
     */
    clearMessages() {
        const messagesContainer = this.element.querySelector('#messages');
        messagesContainer.innerHTML = '';
    }

    /**
     * Get author name with fallback
     */
    getAuthorName(pubkey) {
        if (pubkey === this.nostrService.getPublicKey()) {
            return 'Du';
        }
        
        // Try to get name from profile or use short pubkey
        return `User ${pubkey.slice(0, 8)}`;
    }

    /**
     * Switch tabs
     */
    switchTab(tab) {
        // Update tab buttons
        this.element.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        this.element.querySelector(`#${tab}Tab`).classList.add('active');
        
        // Update tab content
        this.element.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        this.element.querySelector(`#${tab}Content`).classList.add('active');
    }

    /**
     * Start direct message
     */
    startDirectMessage() {
        const dmUserInput = this.element.querySelector('#dmUserInput');
        const userInput = dmUserInput.value.trim();
        
        if (!userInput) {
            this.toastService.showError('Bitte gib einen Benutzernamen oder npub ein');
            return;
        }
        
        let pubkey;
        
        try {
            // Try to decode as npub first
            if (userInput.startsWith('npub')) {
                pubkey = this.nostrService.npubToPubkey(userInput);
            } else {
                // Treat as hex pubkey
                pubkey = userInput;
            }
            
            // Validate pubkey format
            if (!/^[a-f0-9]{64}$/i.test(pubkey)) {
                throw new Error('Invalid pubkey format');
            }
            
            this.openDirectMessage(pubkey);
            dmUserInput.value = '';
            
        } catch (error) {
            console.error('Error starting DM:', error);
            this.toastService.showError('Ungültiger Benutzer oder npub');
        }
    }

    /**
     * Open direct message conversation
     */
    async openDirectMessage(pubkey) {
        this.isDirectMessage = true;
        this.currentDMPubkey = pubkey;
        this.currentChannel = null;
        this.isPrivateGroup = false;
        this.currentPrivateGroup = null;
        
        // Mark this contact as read
        if (this.dmContacts.has(pubkey)) {
            const contact = this.dmContacts.get(pubkey);
            contact.unreadCount = 0;
            this.dmContacts.set(pubkey, contact);
        }
        
        // Update header to show DM contact
        this.updateHeaderForDM(pubkey);
        
        // Clear current messages
        this.clearMessages();
        
        // Load DM history
        await this.loadDMHistory(pubkey);
        
        // Update UI
        this.updateButtonStates();
        this.updateDMContactsList();
        this.updateChannelList();
        this.updatePrivateGroupList();
        
        // Focus input
        const messageInput = this.element.querySelector('#messageInput');
        if (messageInput) messageInput.focus();
    }

    async loadDMHistory(pubkey) {
        try {
            // First, load stored messages from database
            if (this.nostrService.services?.storage) {
                const storedMessages = await this.nostrService.services.storage.getDMMessages(pubkey);
                
                console.log('📖 Lade gespeicherte DM-Nachrichten:', storedMessages.length);
                
                for (const message of storedMessages) {
                    this.displayMessage(message);
                }
            }
            
            // Then load any new messages from relays
            console.log('📡 Lade aktuelle DM-Nachrichten von Relays...');
            const messages = await this.nostrService.getDirectMessages(pubkey);
            
            for (const message of messages) {
                // Check if message is already displayed to avoid duplicates
                const messagesContainer = this.element.querySelector('#messages');
                if (messagesContainer) {
                    const existingMessage = messagesContainer.querySelector(`[data-message-id="${message.id}"]`);
                    if (!existingMessage) {
                        this.displayMessage(message);
                        
                        // Save new message to storage
                        if (this.nostrService.services?.storage) {
                            this.nostrService.services.storage.saveDMMessage(message).catch(error => {
                                console.error('❌ Fehler beim Speichern der DM-Nachricht:', error);
                            });
                        }
                    }
                }
            }
            
            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading DM history:', error);
            this.toastService.showError('Fehler beim Laden der Nachrichten');
        }
    }

    updateHeaderForDM(pubkey) {
        const header = this.element.querySelector('#chatTitle');
        if (header) {
            const contact = this.dmContacts.get(pubkey);
            const displayName = contact?.displayName || this.formatPubkey(pubkey);
            header.textContent = `DM mit ${displayName}`;
        }
    }

    /**
     * Add DM contact
     */
    async addDMContact(pubkey) {
        if (!this.dmContacts.has(pubkey)) {
            const contact = {
                pubkey,
                displayName: this.formatPubkey(pubkey),
                lastMessage: '',
                lastMessageTime: Date.now(),
                unreadCount: 0
            };
            
            this.dmContacts.set(pubkey, contact);
            this.updateDMContactsList();
            
            // Save to storage
            if (this.nostrService.services?.storage) {
                try {
                    await this.nostrService.services.storage.saveDMContact(pubkey, contact);
                } catch (error) {
                    console.error('❌ Fehler beim Speichern des DM-Kontakts:', error);
                }
            }
        }
    }

    /**
     * Update DM contact with new message
     */
    updateDMContact(pubkey, lastMessage) {
        if (!this.dmContacts.has(pubkey)) {
            this.dmContacts.set(pubkey, {
                displayName: null,
                lastMessage: '',
                lastMessageTime: 0,
                unreadCount: 0
            });
        }
        
        const contact = this.dmContacts.get(pubkey);
        contact.lastMessage = lastMessage;
        contact.lastMessageTime = Date.now();
        
        // Increment unread count if this is not the currently open DM
        if (!this.isDirectMessage || this.currentDMPubkey !== pubkey) {
            contact.unreadCount = (contact.unreadCount || 0) + 1;
        }
        
        this.dmContacts.set(pubkey, contact);
        
        // Update UI
        this.updateDMContactsList();
    }

    /**
     * Update DM contacts list
     */
    updateDMContactsList() {
        const container = this.element.querySelector('#dmContacts');
        
        if (this.dmContacts.size === 0) {
            container.innerHTML = `
                <div class="no-contacts">
                    <p>Keine DM-Kontakte</p>
                    <small>Gib einen npub oder pubkey ein, um eine verschlüsselte Unterhaltung zu starten</small>
                </div>
            `;
        } else {
            // Sort contacts by last message time
            const sortedContacts = Array.from(this.dmContacts.entries())
                .sort((a, b) => {
                    const timeA = a[1].lastMessageTime || 0;
                    const timeB = b[1].lastMessageTime || 0;
                    return timeB - timeA;
                });
            
            container.innerHTML = sortedContacts.map(([pubkey, contact]) => {
                const isActive = this.isDirectMessage && this.currentDMPubkey === pubkey;
                const unreadBadge = contact.unreadCount > 0 ? 
                    `<span class="unread-badge">${contact.unreadCount}</span>` : '';
                
                return `
                    <div class="dm-contact ${isActive ? 'active' : ''}" data-pubkey="${pubkey}">
                        <div class="avatar">${contact.displayName ? contact.displayName.charAt(0).toUpperCase() : '?'}</div>
                        <div class="contact-info">
                            <div class="contact-name">${contact.displayName || this.formatPubkey(pubkey)}</div>
                            <div class="contact-last-message">${contact.lastMessage || 'Noch keine Nachrichten'}</div>
                        </div>
                        <div class="contact-meta">
                            <div class="contact-time">${contact.lastMessageTime ? this.formatTime(contact.lastMessageTime) : ''}</div>
                            ${unreadBadge}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    /**
     * Load DM history
     */
    async loadDMHistory(pubkey) {
        try {
            const messages = await this.nip04.getConversationHistory(pubkey, 50);
            messages.forEach(event => this.handleDirectMessage(event));
        } catch (error) {
            console.error('❌ Error loading DM history:', error);
        }
    }

    /**
     * Show user profile
     */
    showUserProfile() {
        try {
            const pubkey = this.nostrService.getPublicKey();
            const npub = this.nostrService.hexToNpub(pubkey);
            
            this.modal.alert({
                title: 'Dein Profil',
                message: `
                    <div class="profile-info">
                        <p><strong>Public Key (hex):</strong><br><code>${pubkey || 'Nicht verfügbar'}</code></p>
                        <p><strong>npub:</strong><br><code>${npub || 'Conversion failed'}</code></p>
                        <p><strong>Status:</strong> Verbunden</p>
                    </div>
                `,
                buttonText: 'Schließen'
            });
        } catch (error) {
            console.error('❌ Error showing user profile:', error);
            this.toastService.showError('Fehler beim Anzeigen des Profils');
        }
    }

    /**
     * Unsubscribe from current room
     */
    unsubscribeFromCurrentRoom() {
        if (this.subscriptions.has('room')) {
            const subscription = this.subscriptions.get('room');
            try {
                // Check if it's a SimplePool subscription (has close method)
                if (subscription && typeof subscription.close === 'function') {
                    subscription.close();
                } else if (subscription && typeof subscription.unsub === 'function') {
                    subscription.unsub();
                } else if (subscription && typeof subscription.unsubscribe === 'function') {
                    subscription.unsubscribe();
                }
            } catch (error) {
                console.error('❌ Error unsubscribing from room:', error);
            }
            this.subscriptions.delete('room');
        }
    }

    /**
     * Dispatch custom event
     */
    dispatchEvent(eventName, detail = {}) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * Cleanup
     */
    destroy() {
        // Unsubscribe from all subscriptions
        this.subscriptions.forEach(sub => sub.unsub());
        this.subscriptions.clear();
        
        // Close all modals
        this.modal.closeAll();
    }

    /**
     * Get room name by ID
     */
    getRoomName(roomId) {
        const roomNames = {
            'dreammall-support': 'DreamMall Support',
            'dreammall-hilfe': 'DreamMall Hilfe',
            'dreammall-dev': 'DreamMall Dev'
        };
        return roomNames[roomId] || roomId;
    }

    /**
     * Update button states based on current view
     */
    updateButtonStates() {
        // This method handles UI state updates for different views
        // For now, we'll keep it simple and just update the placeholder
        const messageInput = this.element.querySelector('#messageInput');
        if (messageInput) {
            if (this.isDirectMessage) {
                messageInput.placeholder = 'Verschlüsselte Nachricht schreiben...';
            } else if (this.isPrivateGroup) {
                messageInput.placeholder = 'Private Gruppennachricht schreiben...';
            } else {
                messageInput.placeholder = 'Nachricht schreiben...';
            }
        }

        // Update header title based on current view
        const title = this.element.querySelector('#chatTitle');
        if (title && this.isDirectMessage && this.currentDMPubkey) {
            const contact = this.dmContacts.get(this.currentDMPubkey);
            const displayName = contact?.displayName || this.formatPubkey(this.currentDMPubkey);
            title.textContent = `DM mit ${displayName}`;
        } else if (title && this.isPrivateGroup && this.currentPrivateGroup) {
            title.textContent = `Private Gruppe: ${this.currentPrivateGroup.name}`;
        } else if (title && this.currentChannel) {
            const channelNames = {
                'dreammall-support': 'DreamMall Support',
                'general': 'Allgemein',
                'random': 'Random'
            };
            title.textContent = channelNames[this.currentChannel] || this.currentChannel;
        }
    }

    /**
     * Update channel list display
     */
    updateChannelList() {
        // This method would update the channel list in the sidebar
        // For now, we'll keep it as a placeholder
        const roomsContent = this.element.querySelector('#roomsContent');
        if (roomsContent) {
            // Update active channel styling
            const roomElements = roomsContent.querySelectorAll('.room-item');
            roomElements.forEach(room => {
                room.classList.remove('active');
                if (room.dataset.room === this.currentChannel) {
                    room.classList.add('active');
                }
            });
        }
    }

    /**
     * Update private group list display
     */
    updatePrivateGroupList() {
        // This method would update the private group list in the sidebar
        // For now, we'll keep it as a placeholder
        const privateGroupsContent = this.element.querySelector('#privateGroupsContent');
        if (privateGroupsContent) {
            // Update active private group styling
            const groupElements = privateGroupsContent.querySelectorAll('.private-group-item');
            groupElements.forEach(group => {
                group.classList.remove('active');
                if (group.dataset.groupId === this.currentPrivateGroup?.id) {
                    group.classList.add('active');
                }
            });
        }
    }
}

// Updated: Added missing UI update methods (updateButtonStates, updateChannelList, updatePrivateGroupList)
