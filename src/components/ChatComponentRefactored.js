// =================================================================
// Refactored Chat Component - Modularer Aufbau (CLEAN VERSION)
// Nutzt NIP-spezifische Module und UI-Komponenten
// =================================================================

import { NIP01_BasicProtocol } from '../nips/NIP01_BasicProtocol.js';
import { NIP02_ContactLists } from '../nips/NIP02_ContactLists.js';
import { NIP04_EncryptedDMs } from '../nips/NIP04_EncryptedDMs.js';
import { NIP28_PublicChat } from '../nips/NIP28_PublicChat.js';
import { NIP17_KindMessages } from '../nips/NIP17_KindMessages.js';
import { NIP104_PrivateGroups } from '../nips/NIP104_PrivateGroups.js';
import { ModalComponent } from './ui/ModalComponent.js';
import { RoomManagerComponent } from './ui/RoomManagerComponent.js';
import { showCreatePrivateGroupModal } from './ui/modals/CreatePrivateGroupModal.js';
import { APP_CONFIG, ROOM_CONFIG, DEFAULT_SETTINGS } from '../config/app-config.js';

export class ChatComponentRefactored {
    constructor(nostrService, toastService) {
        this.nostrService = nostrService;
        this.toastService = toastService;
        
        // Initialize NIP modules
        this.nip01 = new NIP01_BasicProtocol(nostrService);
        this.nip02 = new NIP02_ContactLists(nostrService, this.nip01);
        this.nip04 = new NIP04_EncryptedDMs(nostrService, this.nip01);
        this.nip28 = new NIP28_PublicChat(nostrService, this.nip01);
        this.nip17 = new NIP17_KindMessages(nostrService, this.nip01);
        this.nip104 = new NIP104_PrivateGroups(nostrService, this.nip01);
        
        // Initialize UI components
        this.modal = new ModalComponent();
        this.roomManager = new RoomManagerComponent(this.nip28, toastService);
        
        // State - Zentrale Konfiguration verwenden
        this.currentRoom = DEFAULT_SETTINGS.defaultRoom;
        this.currentView = 'room'; // 'room', 'dm', 'private_group'
        this.currentDMUser = null;
        this.messages = new Map();
        this.dmContacts = new Map();
        
        // Zentrale Raum-Konfiguration
        this.roomConfig = ROOM_CONFIG;
        
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
                    <h3 id="chatTitle">Offener Test Raum</h3>
                    <div class="chat-controls">
                         
                    </div>
                </div>
                
                <div class="messages" id="messages">
                    <div class="welcome">
                        <h3>Willkommen im Offenen Test Raum! 🎉</h3>
                        <p>Saubere Test-Umgebung ohne alte Daten...</p>
                        <small>🔑 Account: e3f3e3f6a562c3f4382f5c23eaf557c915bb15abdfb784c2f5ee03a96debb76e</small>
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
     * Render rooms section
     */
    renderRoomsSection() {
        return `
            <div class="room-section">
                <h4 class="section-title">🌍 Test Räume (V2)</h4>
                <div class="rooms public-rooms">
                    <div class="room active" data-room="dreamtest-public-v2">
                        <div class="room-name">Offener Test Raum</div>
                        <div class="room-status">Öffentlich - Für alle</div>
                    </div>
                    <div class="room" data-room="dreamtest-private-v2">
                        <div class="room-name">Geschlossener Test Raum</div>
                        <div class="room-status">Privat - Mit Einladung</div>
                    </div>
                </div>
                
                <div class="room-info">
                    <small>ℹ️ Neue saubere Test-Umgebung ohne alte Daten</small>
                </div>
            </div>
            
            <div class="private-groups-section">
                <h4 class="section-title">🔐 Private Gruppen</h4>
                <div class="private-groups-actions">
                    <button class="btn btn-sm btn-primary" id="createPrivateGroupBtn">
                        ➕ Neue verschlüsselte Gruppe
                    </button>
                </div>
                <div class="private-groups-list" id="privateGroupsList">
                    <div class="loading">
                        <p>Lade private Gruppen...</p>
                    </div>
                </div>
            </div>
        `;
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
            const isActive = this.currentDMUser === pubkey;
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

        // Room management
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

        // Private groups functionality
        const createPrivateGroupBtn = this.element.querySelector('#createPrivateGroupBtn');
        if (createPrivateGroupBtn) {
            createPrivateGroupBtn.addEventListener('click', () => {
                showCreatePrivateGroupModal(
                    this.nip104, 
                    this.toastService, 
                    () => this.updatePrivateGroupsList()
                );
            });
        }
    }

    /**
     * Initialize chat
     */
    async initializeChat() {
        console.log('🔄 Initialisiere Chat...');
        
        // Clear stored messages if configured for fresh start
        if (APP_CONFIG.clearStorageOnStart) {
            console.log('🗑️ Fresh Start aktiviert - lösche alte Nachrichten');
            this.clearAllStoredMessages();
        }
        
        // Load initial messages for current room
        await this.loadRoomMessages(this.currentRoom);
        
        // Load DM contacts
        await this.loadDMContacts();
        
        // Load private groups
        this.updatePrivateGroupsList();
        
        // Set up global functions for private group interactions
        window.enterPrivateGroup = (groupId) => this.enterPrivateGroup(groupId);
        window.leavePrivateGroup = (groupId) => this.leavePrivateGroup(groupId);
        window.inviteToPrivateGroup = (groupId) => this.inviteToPrivateGroup(groupId);
        
        // Subscribe to messages
        this.subscribeToRoomMessages();
        this.subscribeToDirectMessages();
        this.subscribeToPrivateGroupMessages();
    }

    // =================================================================
    // STORAGE MANAGEMENT
    // =================================================================

    /**
     * Clear all stored messages (for fresh start)
     */
    clearAllStoredMessages() {
        try {
            console.log('🗑️ Lösche alle gespeicherten Nachrichten...');
            
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                keys.push(localStorage.key(i));
            }
            
            let deletedCount = 0;
            keys.forEach(key => {
                if (key.startsWith('messages_')) {
                    localStorage.removeItem(key);
                    deletedCount++;
                    console.log(`🗑️ Gelöscht: ${key}`);
                }
            });
            
            console.log(`✅ ${deletedCount} Nachrichten-Einträge aus localStorage gelöscht`);
            
        } catch (error) {
            console.error('❌ Fehler beim Löschen der gespeicherten Nachrichten:', error);
        }
    }

    /**
     * Clear all localStorage (complete reset)
     */
    clearAllLocalStorage() {
        try {
            console.log('🗑️ Lösche kompletten localStorage...');
            localStorage.clear();
            console.log('✅ LocalStorage komplett gelöscht');
            
        } catch (error) {
            console.error('❌ Fehler beim Löschen des localStorage:', error);
        }
    }

    // =================================================================
    // MESSAGE HANDLING
    // =================================================================

    /**
     * Handle send message
     */
    async handleSendMessage() {
        const messageInput = this.element.querySelector('#messageInput');
        if (!messageInput) return;
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        try {
            console.log('📤 Sende Nachricht:', message);
            
            // Create message object
            const messageObj = {
                content: message,
                author: 'You',
                timestamp: Date.now(),
                type: this.currentView
            };
            
            // Display message immediately
            this.displayMessage(messageObj);
            
            // Store message
            const storageKey = this.currentView === 'dm' ? `dm_${this.currentDMUser}` : this.currentRoom;
            this.storeMessage(messageObj, storageKey);
            
            // Send to NOSTR network based on current view
            if (this.currentView === 'dm' && this.currentDMUser) {
                await this.sendDirectMessage(this.currentDMUser, message);
            } else if (this.currentView === 'private_group') {
                await this.sendPrivateGroupMessage(this.currentRoom, message);
            } else if (this.currentView === 'room') {
                await this.sendRoomMessage(this.currentRoom, message);
            }
            
            // Clear input
            messageInput.value = '';
            
        } catch (error) {
            console.error('❌ Fehler beim Senden der Nachricht:', error);
            this.toastService.showError('Fehler beim Senden der Nachricht');
        }
    }

    /**
     * Send direct message via NIP-04
     */
    async sendDirectMessage(recipientPubkey, message) {
        try {
            if (!this.nip04) {
                throw new Error('NIP-04 nicht verfügbar');
            }
            
            await this.nip04.sendDirectMessage(recipientPubkey, message);
            console.log('✅ DM gesendet an:', recipientPubkey);
            
        } catch (error) {
            console.error('❌ Fehler beim Senden der DM:', error);
            throw error;
        }
    }

    /**
     * Send private group message via NIP-104
     */
    async sendPrivateGroupMessage(groupId, message) {
        try {
            if (!this.nip104) {
                throw new Error('NIP-104 nicht verfügbar');
            }
            
            await this.nip104.sendPrivateGroupMessage(groupId, message);
            console.log('✅ Gruppennachricht gesendet an:', groupId);
            
        } catch (error) {
            console.error('❌ Fehler beim Senden der Gruppennachricht:', error);
            throw error;
        }
    }

    /**
     * Send room message via NIP-28
     */
    async sendRoomMessage(roomId, message) {
        try {
            if (!this.nip28) {
                throw new Error('NIP-28 nicht verfügbar');
            }
            
            await this.nip28.sendRoomMessage(roomId, message);
            console.log('✅ Raum-Nachricht gesendet an:', roomId);
            
        } catch (error) {
            console.error('❌ Fehler beim Senden der Raum-Nachricht:', error);
            throw error;
        }
    }

    // =================================================================
    // DIRECT MESSAGES
    // =================================================================

    /**
     * Start direct message
     */
    async startDirectMessage() {
        const dmUserInput = this.element.querySelector('#dmUserInput');
        if (!dmUserInput) return;
        
        const userInput = dmUserInput.value.trim();
        if (!userInput) return;
        
        try {
            console.log('💬 Starte DM mit:', userInput);
            
            // Validate and convert npub to hex if needed
            let pubkey;
            try {
                if (userInput.startsWith('npub1')) {
                    pubkey = this.nostrService.npubToHex(userInput);
                } else if (userInput.length === 64) {
                    pubkey = userInput;
                } else {
                    throw new Error('Invalid format');
                }
            } catch (error) {
                this.toastService.showError('Ungültiges Format. Verwende npub1... oder hex pubkey');
                return;
            }
            
            // Add to contacts with NIP-02 service
            if (this.nip02) {
                await this.nip02.addContact(pubkey);
            }
            
            // Add to local contacts
            this.dmContacts.set(pubkey, {
                name: `User ${pubkey.slice(0, 8)}`,
                pubkey: pubkey,
                lastMessage: '',
                unreadCount: 0
            });
            
            // Save contacts
            const contactsObj = Object.fromEntries(this.dmContacts);
            localStorage.setItem('dmContacts', JSON.stringify(contactsObj));
            
            // Subscribe to DMs from this user
            if (this.nip04) {
                this.nip04.subscribeToDirectMessages(pubkey, (message) => {
                    this.handleDirectMessage(message);
                });
            }
            
            // Open DM
            this.openDirectMessage(pubkey);
            
            // Clear input
            dmUserInput.value = '';
            
            // Update contacts list
            await this.loadDMContacts();
            
        } catch (error) {
            console.error('❌ Fehler beim Starten der DM:', error);
            this.toastService.showError('Fehler beim Starten der DM');
        }
    }

    /**
     * Open direct message
     */
    openDirectMessage(pubkey) {
        try {
            console.log('📩 Öffne DM mit:', pubkey);
            
            // Update current DM user
            this.currentDMUser = pubkey;
            this.currentView = 'dm';
            
            // Update chat header
            const contact = this.dmContacts.get(pubkey);
            const name = contact ? contact.name : `User ${pubkey.slice(0, 8)}`;
            this.updateChatHeader(`💬 ${name}`);
            
            // Load DM messages
            this.loadDMMessages(pubkey);
            
            // Update active contact
            const dmContacts = this.element.querySelectorAll('.dm-contact');
            dmContacts.forEach(contact => contact.classList.remove('active'));
            
            const activeContact = this.element.querySelector(`[data-pubkey="${pubkey}"]`);
            if (activeContact) activeContact.classList.add('active');
            
        } catch (error) {
            console.error('❌ Fehler beim Öffnen der DM:', error);
        }
    }

    /**
     * Load DM messages
     */
    async loadDMMessages(pubkey) {
        try {
            console.log(`📜 Lade DM-Nachrichten für: ${pubkey}`);
            
            // Get stored messages first
            const messages = this.getStoredMessages(`dm_${pubkey}`) || [];
            this.displayMessages(messages);
            
            // Load from NOSTR network using NIP-04
            if (this.nip04) {
                console.log('🔄 Lade DM-Nachrichten aus dem NOSTR-Netzwerk...');
                
                // Subscribe to direct messages from this user
                this.nip04.subscribeToDirectMessages(pubkey, (message) => {
                    this.handleDirectMessage(message);
                });
                
                // Load existing messages
                const networkMessages = await this.nip04.getDirectMessages(pubkey);
                if (networkMessages && networkMessages.length > 0) {
                    console.log(`📥 ${networkMessages.length} DM-Nachrichten aus dem Netzwerk geladen`);
                    
                    // Merge with stored messages (avoid duplicates)
                    const allMessages = [...messages];
                    for (const msg of networkMessages) {
                        if (!allMessages.find(m => m.id === msg.id)) {
                            allMessages.push(msg);
                            this.storeMessage(msg, `dm_${pubkey}`);
                        }
                    }
                    
                    // Sort by timestamp and display
                    allMessages.sort((a, b) => a.created_at - b.created_at);
                    this.displayMessages(allMessages);
                }
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der DM-Nachrichten:', error);
        }
    }

    /**
     * Handle direct message
     */
    handleDirectMessage(message) {
        console.log('📩 Neue Direktnachricht:', message);
        
        // Store message - only continue if successfully stored (not a duplicate)
        const wasStored = this.storeMessage(message, `dm_${message.from || message.pubkey}`);
        if (!wasStored) {
            console.log('⚠️ DM nicht angezeigt (Duplikat oder Fehler)');
            return;
        }
        
        // Update contact info
        const pubkey = message.from || message.pubkey;
        if (this.dmContacts.has(pubkey)) {
            const contact = this.dmContacts.get(pubkey);
            contact.lastMessage = message.content;
            contact.lastMessageTime = message.created_at * 1000;
            contact.unreadCount = (contact.unreadCount || 0) + 1;
            
            // Save updated contacts
            const contactsObj = Object.fromEntries(this.dmContacts);
            localStorage.setItem('dmContacts', JSON.stringify(contactsObj));
        }
        
        // If this is the current DM conversation, display message
        if (this.currentView === 'dm' && this.currentDMUser === pubkey) {
            this.displayMessage(message);
            
            // Mark as read
            const contact = this.dmContacts.get(pubkey);
            if (contact) {
                contact.unreadCount = 0;
                const contactsObj = Object.fromEntries(this.dmContacts);
                localStorage.setItem('dmContacts', JSON.stringify(contactsObj));
            }
        }
        
        // Update contacts list
        this.updateDMContactsList();
        
        // Show toast notification if not current conversation
        if (this.currentView !== 'dm' || this.currentDMUser !== pubkey) {
            const contact = this.dmContacts.get(pubkey);
            const name = contact ? contact.name : `User ${pubkey.slice(0, 8)}`;
            this.toastService.showInfo(`💬 Neue Nachricht von ${name}`);
        }
    }

    /**
     * Load DM contacts
     */
    async loadDMContacts() {
        try {
            console.log('👥 Lade DM-Kontakte...');
            
            // Load from localStorage first
            const storedContacts = localStorage.getItem('dmContacts');
            if (storedContacts) {
                const contactsObj = JSON.parse(storedContacts);
                this.dmContacts = new Map(Object.entries(contactsObj));
            }
            
            // Load from NIP-02 contact list if available
            if (this.nip02) {
                try {
                    const contactList = this.nip02.getAllContacts();
                    if (contactList && Array.isArray(contactList) && contactList.length > 0) {
                        console.log(`📇 ${contactList.length} Kontakte aus dem Netzwerk geladen`);
                        
                        for (const contact of contactList) {
                            if (contact.pubkey && !this.dmContacts.has(contact.pubkey)) {
                                this.dmContacts.set(contact.pubkey, {
                                    name: contact.name || contact.petname || `User ${contact.pubkey.slice(0, 8)}`,
                                    pubkey: contact.pubkey,
                                    lastMessage: '',
                                    unreadCount: 0
                                });
                            }
                        }
                        
                        // Save updated contacts
                        const contactsObj = Object.fromEntries(this.dmContacts);
                        localStorage.setItem('dmContacts', JSON.stringify(contactsObj));
                    } else {
                        console.log('📇 Keine Kontakte im Netzwerk gefunden');
                    }
                } catch (error) {
                    console.error('❌ Fehler beim Laden der NIP-02 Kontakte:', error);
                }
            }
            
            // Update UI
            this.updateDMContactsList();
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der DM-Kontakte:', error);
        }
    }

    /**
     * Update DM contacts list
     */
    updateDMContactsList() {
        const dmContactsContainer = this.element.querySelector('#dmContacts');
        if (!dmContactsContainer) return;
        
        dmContactsContainer.innerHTML = this.renderDMContactsList();
    }

    /**
     * Subscribe to direct messages
     */
    subscribeToDirectMessages() {
        try {
            console.log('📡 Abonniere Direktnachrichten...');
            
            if (this.nip04) {
                // Subscribe to all direct messages
                this.nip04.subscribeToEncryptedDMs((message) => {
                    this.handleDirectMessage(message);
                });
                
                console.log('✅ DM-Abonnement aktiviert');
            } else {
                console.warn('⚠️ NIP-04 nicht verfügbar für DM-Abonnement');
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Abonnieren von Direktnachrichten:', error);
        }
    }

    // =================================================================
    // UTILITY METHODS
    // =================================================================

    /**
     * Switch tab
     */
    switchTab(tabName) {
        try {
            console.log(`🔄 Wechsle zu Tab: ${tabName}`);
            
            // Update tab buttons
            const tabButtons = this.element.querySelectorAll('.tab-btn');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            const activeTab = this.element.querySelector(`#${tabName}Tab`);
            if (activeTab) activeTab.classList.add('active');
            
            // Update tab content
            const tabContents = this.element.querySelectorAll('.tab-content');
            tabContents.forEach(content => content.classList.remove('active'));
            
            const activeContent = this.element.querySelector(`#${tabName}Content`);
            if (activeContent) activeContent.classList.add('active');
            
            // Update current view
            this.currentView = tabName === 'rooms' ? 'room' : 'dm';
            
        } catch (error) {
            console.error('❌ Fehler beim Wechseln des Tabs:', error);
        }
    }

    /**
     * Switch room
     */
    switchRoom(roomId) {
        try {
            console.log(`🏠 Wechsle zu Raum: ${roomId}`);
            
            // Update active room
            const roomElements = this.element.querySelectorAll('.room');
            roomElements.forEach(room => room.classList.remove('active'));
            
            const activeRoom = this.element.querySelector(`[data-room="${roomId}"]`);
            if (activeRoom) activeRoom.classList.add('active');
            
            // Update current room
            this.currentRoom = roomId;
            this.currentView = 'room';
            
            // Update chat header
            const roomConfig = this.roomConfig[roomId];
            if (roomConfig) {
                this.updateChatHeader(roomConfig.name);
            }
            
            // Load room messages
            this.loadRoomMessages(roomId);
            
        } catch (error) {
            console.error('❌ Fehler beim Wechseln des Raums:', error);
        }
    }

    /**
     * Update chat header
     */
    updateChatHeader(title) {
        const chatTitle = this.element.querySelector('#chatTitle');
        if (chatTitle) {
            chatTitle.textContent = title;
        }
    }

    /**
     * Get stored messages
     */
    getStoredMessages(roomId) {
        try {
            const stored = localStorage.getItem(`messages_${roomId}`);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('❌ Fehler beim Laden gespeicherter Nachrichten:', error);
            return [];
        }
    }

    /**
     * Store message
     */
    storeMessage(message, roomId) {
        try {
            const messages = this.getStoredMessages(roomId);
            
            // Check for duplicates using message ID or timestamp+content
            const messageId = message.id || `${message.timestamp}_${message.content}`;
            const isDuplicate = messages.some(msg => 
                (msg.id && msg.id === messageId) || 
                (msg.timestamp === message.timestamp && msg.content === message.content)
            );
            
            if (isDuplicate) {
                console.log('⚠️ Duplikat-Nachricht ignoriert:', messageId);
                return false; // Indicate duplicate
            }
            
            messages.push(message);
            
            // Keep only last 100 messages
            if (messages.length > 100) {
                messages.splice(0, messages.length - 100);
            }
            
            localStorage.setItem(`messages_${roomId}`, JSON.stringify(messages));
            console.log('💾 Nachricht gespeichert:', messageId);
            return true; // Indicate success
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Nachricht:', error);
            return false; // Indicate failure
        }
    }

    /**
     * Display messages
     */
    displayMessages(messages) {
        const messagesContainer = this.element.querySelector('#messages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="welcome">
                    <h3>Willkommen! 🎉</h3>
                    <p>Noch keine Nachrichten...</p>
                </div>
            `;
            return;
        }
        
        messages.forEach(message => {
            this.displayMessage(message);
        });
    }

    /**
     * Display single message
     */
    displayMessage(message) {
        const messagesContainer = this.element.querySelector('#messages');
        if (!messagesContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-author">${message.author || 'Unknown'}</span>
                <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${message.content}</div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Set services for the component
     */
    setServices(services) {
        this.services = services;
        
        // Update service references if needed
        if (services.nostrService) {
            this.nostrService = services.nostrService;
        }
        if (services.toastService) {
            this.toastService = services.toastService;
        }
        
        console.log('📦 Services an ChatComponentRefactored übergeben');
    }

    // =================================================================
    // PLACEHOLDER METHODS (TO BE IMPLEMENTED)
    // =================================================================

    /**
     * Load room messages
     */
    async loadRoomMessages(roomId) {
        try {
            console.log(`📜 Lade Nachrichten für Raum: ${roomId}`);
            
            // Get stored messages or initialize empty array
            const messages = this.getStoredMessages(roomId) || [];
            this.displayMessages(messages);
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Raum-Nachrichten:', error);
        }
    }

    /**
     * Subscribe to room messages
     */
    subscribeToRoomMessages() {
        try {
            console.log('📡 Abonniere Raum-Nachrichten...');
            
            // Unsubscribe from previous room
            this.unsubscribeFromCurrentRoom();
            
            if (this.nip28) {
                // Subscribe to current room messages
                const subscriptionId = this.nip28.subscribeToRoom(this.currentRoom, (message) => {
                    this.handleRoomMessage(message);
                });
                
                // Store subscription for cleanup
                this.subscriptions.set('room_' + this.currentRoom, subscriptionId);
                
                console.log('✅ Raum-Abonnement aktiviert für:', this.currentRoom);
            } else {
                console.warn('⚠️ NIP-28 nicht verfügbar für Raum-Abonnement');
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Abonnieren von Raum-Nachrichten:', error);
        }
    }

    /**
     * Unsubscribe from current room
     */
    unsubscribeFromCurrentRoom() {
        try {
            const roomSubKey = 'room_' + this.currentRoom;
            const subscriptionId = this.subscriptions.get(roomSubKey);
            
            if (subscriptionId) {
                // Unsubscribe from relay service
                this.nostrService.relayService.unsubscribe(subscriptionId);
                this.subscriptions.delete(roomSubKey);
                console.log('🔌 Raum-Abonnement beendet für:', this.currentRoom);
            }
        } catch (error) {
            console.error('❌ Fehler beim Beenden des Raum-Abonnements:', error);
        }
    }

    /**
     * Handle room message
     */
    handleRoomMessage(message) {
        console.log('📩 Neue Raum-Nachricht:', message);
        
        // Store message - only continue if successfully stored (not a duplicate)
        const wasStored = this.storeMessage(message, message.roomId || this.currentRoom);
        if (!wasStored) {
            console.log('⚠️ Nachricht nicht angezeigt (Duplikat oder Fehler)');
            return;
        }
        
        // If this is the current room, display message
        if (this.currentView === 'room' && this.currentRoom === (message.roomId || this.currentRoom)) {
            this.displayMessage(message);
        }
        
        // Show toast notification if not current conversation
        if (this.currentView !== 'room' || this.currentRoom !== (message.roomId || this.currentRoom)) {
            const roomName = this.roomConfig[message.roomId || this.currentRoom]?.name || 'Unbekannter Raum';
            this.toastService.showInfo(`🏠 Neue Nachricht in ${roomName}`);
        }
    }

    /**
     * Subscribe to private group messages
     */
    subscribeToPrivateGroupMessages() {
        try {
            console.log('📡 Abonniere Private Group Messages...');
            
            // Subscribe to group invitations
            if (this.nip104) {
                this.nip104.subscribeToGroupInvites((invite) => {
                    console.log('📧 Neue Gruppeneinladung:', invite);
                    this.handleGroupInvitation(invite);
                });
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Abonnieren von Private Group Messages:', error);
        }
    }

    /**
     * Handle group invitation
     */
    handleGroupInvitation(invite) {
        // Show invitation notification
        this.toastService.showSuccess(`Einladung zu Gruppe "${invite.groupName}" erhalten`);
        
        // Update private groups list
        this.updatePrivateGroupsList();
    }

    /**
     * Update private groups list
     */
    updatePrivateGroupsList() {
        try {
            const privateGroupsContainer = document.getElementById('privateGroupsList');
            if (!privateGroupsContainer) return;
            
            const userGroups = this.nip104.getAllPrivateGroups();
            
            if (userGroups.length === 0) {
                privateGroupsContainer.innerHTML = `
                    <div class="no-groups">
                        <p>🔒 Keine privaten Gruppen</p>
                        <small>Erstelle eine verschlüsselte Gruppe oder warte auf Einladungen</small>
                    </div>
                `;
                return;
            }
            
            const groupsHtml = userGroups.map(group => `
                <div class="private-group" data-group-id="${group.groupId}">
                    <div class="group-icon">🔐</div>
                    <div class="group-info">
                        <div class="group-name">${group.name}</div>
                        <div class="group-description">${group.description || 'Keine Beschreibung'}</div>
                        <div class="group-meta">
                            <span class="member-count">${group.memberCount} Mitglieder</span>
                            ${group.isCreator ? '<span class="creator-badge">Creator</span>' : ''}
                        </div>
                    </div>
                    <div class="group-actions">
                        <button class="btn btn-sm btn-primary" onclick="enterPrivateGroup('${group.groupId}')">
                            Betreten
                        </button>
                        ${group.isCreator ? `
                            <button class="btn btn-sm btn-secondary" onclick="inviteToPrivateGroup('${group.groupId}')">
                                Einladen
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-danger" onclick="leavePrivateGroup('${group.groupId}')">
                            Verlassen
                        </button>
                    </div>
                </div>
            `).join('');
            
            privateGroupsContainer.innerHTML = groupsHtml;
            
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der Gruppen-Liste:', error);
        }
    }

    /**
     * Enter a private group
     */
    async enterPrivateGroup(groupId) {
        try {
            console.log(`🚪 Betrete private Gruppe: ${groupId}`);
            
            // Check if group exists (simplified access check)
            const groupInfo = this.nip104.getGroupInfo(groupId);
            if (!groupInfo) {
                this.toastService.showError('Gruppe nicht gefunden');
                return;
            }
            
            // Switch to private group view
            this.currentView = 'private_group';
            this.currentRoom = groupId;
            
            // Update UI
            this.updateChatHeader(groupInfo.name);
            await this.loadPrivateGroupMessages(groupId);
            
            this.toastService.showSuccess(`Gruppe "${groupInfo.name}" betreten`);
            
        } catch (error) {
            console.error('❌ Fehler beim Betreten der Gruppe:', error);
            this.toastService.showError('Fehler beim Betreten der Gruppe');
        }
    }

    /**
     * Leave a private group
     */
    async leavePrivateGroup(groupId) {
        try {
            // Simple implementation: remove from local storage
            const groups = this.nip104.getAllPrivateGroups();
            const filteredGroups = groups.filter(group => group.id !== groupId);
            
            // Save filtered groups (simplified)
            localStorage.setItem('privateGroups', JSON.stringify(filteredGroups));
            
            this.updatePrivateGroupsList();
            this.toastService.showSuccess('Gruppe verlassen');
        } catch (error) {
            console.error('❌ Fehler beim Verlassen der Gruppe:', error);
            this.toastService.showError('Fehler beim Verlassen der Gruppe');
        }
    }

    /**
     * Invite user to private group
     */
    async inviteToPrivateGroup(groupId) {
        const userPubkey = prompt('Geben Sie die npub oder hex pubkey des Benutzers ein:');
        if (!userPubkey) return;
        
        try {
            // TODO: Implement invitation logic
            this.toastService.showSuccess('Einladung gesendet');
        } catch (error) {
            console.error('❌ Fehler beim Senden der Einladung:', error);
            this.toastService.showError('Fehler beim Senden der Einladung');
        }
    }

    /**
     * Load private group messages
     */
    async loadPrivateGroupMessages(groupId) {
        try {
            console.log(`📜 Lade Nachrichten für private Gruppe: ${groupId}`);
            
            const messages = this.getStoredMessages(`private_group_${groupId}`) || [];
            this.displayMessages(messages);
            
            // Subscribe to new messages for this group
            this.nip104.subscribeToPrivateGroup(groupId, (message) => {
                this.handlePrivateGroupMessage(message);
            });
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Gruppennachrichten:', error);
        }
    }

    /**
     * Handle private group message
     */
    handlePrivateGroupMessage(message) {
        console.log('📩 Neue private Gruppennachricht:', message);
        
        if (this.currentView === 'private_group' && this.currentRoom === message.groupId) {
            this.displayMessage(message);
        }
        
        // Store message
        this.storeMessage(message, `private_group_${message.groupId}`);
    }
}
