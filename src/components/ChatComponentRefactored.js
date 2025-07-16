// =================================================================
// Refactored Chat Component - Modularer Aufbau (Updated)
// Nutzt NIP-spezifische Module und UI-Komponenten
// =================================================================

import { NIP01_BasicProtocol } from '../nips/NIP01_BasicProtocol.js';
import { NIP04_EncryptedDMs } from '../nips/NIP04_EncryptedDMs.js';
import { NIP28_PublicChat } from '../nips/NIP28_PublicChat.js';
import { NIP17_KindMessages } from '../nips/NIP17_KindMessages.js';
import { NIP104_PrivateGroups } from '../nips/NIP104_PrivateGroups.js';
import { ModalComponent } from './ui/ModalComponent.js';
import { RoomManagerComponent } from './ui/RoomManagerComponent.js';
import { ROOM_CONFIG, DEFAULT_SETTINGS } from '../config/app-config.js';

export class ChatComponentRefactored {
    constructor(nostrService, toastService) {
        this.nostrService = nostrService;
        this.toastService = toastService;
        
        // Initialize NIP modules
        this.nip01 = new NIP01_BasicProtocol(nostrService);
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
     * Render rooms section - NEUE SAUBERE RAUM-STRUKTUR
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
            createPrivateGroupBtn.addEventListener('click', () => this.showCreatePrivateGroupModal());
        }

    }

    /**
     * Initialize chat - SAUBERER START
     */
    async initializeChat() {
        console.log('🔄 Initialisiere Chat...');
        
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
        
        // Add a test function to create a demo private group
        window.createTestPrivateGroup = async () => {
            try {
                await this.nip104.createRealPrivateGroup(
                    "Test Verschlüsselte Gruppe",
                    "Dies ist eine Test-Gruppe für das NIP-104 System",
                    [] // No initial members
                );
                this.updatePrivateGroupsList();
                this.toastService.showSuccess("Test-Gruppe erstellt!");
            } catch (error) {
                console.error('❌ Test-Gruppe Fehler:', error);
                this.toastService.showError("Fehler beim Erstellen der Test-Gruppe");
            }
        };
        
        // Subscribe to new messages
        this.subscribeToRoomMessages();
        this.subscribeToDirectMessages();
        this.subscribeToPrivateGroupMessages();
    }

    /**
     * Enter a private group
     */
    async enterPrivateGroup(groupId) {
        try {
            console.log(`🚪 Betrete private Gruppe: ${groupId}`);
            
            if (!this.nip104.hasGroupAccess(groupId)) {
                this.toastService.showError('Kein Zugriff auf diese Gruppe');
                return;
            }
            
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
            await this.nip104.leaveGroup(groupId);
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

    /**
     * Subscribe to private group messages
     */
    subscribeToPrivateGroupMessages() {
        // Subscribe to group invitations
        this.nip104.subscribeToGroupInvites((invite) => {
            console.log('📧 Neue Gruppeneinladung:', invite);
            this.handleGroupInvitation(invite);
        });
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
     * Update chat header
     */
    updateChatHeader(title) {
        const chatTitle = this.element.querySelector('#chatTitle');
        if (chatTitle) {
            chatTitle.textContent = title;
        }
    }

    /**
     * Show create private group modal
     */
    showCreatePrivateGroupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>🔐 Neue verschlüsselte Gruppe erstellen</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Gruppenname:</label>
                        <input type="text" id="groupName" placeholder="Mein sicherer Raum" required>
                    </div>
                    <div class="form-group">
                        <label>Beschreibung:</label>
                        <textarea id="groupDescription" placeholder="Beschreibung der Gruppe (optional)"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Mitglieder einladen (optional):</label>
                        <input type="text" id="inviteMembers" placeholder="npub1... oder hex pubkey (kommagetrennt)">
                        <small>Leer lassen, um später Mitglieder einzuladen</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Abbrechen
                    </button>
                    <button class="btn btn-primary" onclick="createPrivateGroup()">
                        Gruppe erstellen
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set up global function for creating group
        window.createPrivateGroup = async () => {
            const groupName = document.getElementById('groupName').value.trim();
            const groupDescription = document.getElementById('groupDescription').value.trim();
            const inviteMembersInput = document.getElementById('inviteMembers').value.trim();
            
            if (!groupName) {
                this.toastService.showError('Gruppenname ist erforderlich');
                return;
            }
            
            const invitedMembers = inviteMembersInput 
                ? inviteMembersInput.split(',').map(m => m.trim()).filter(m => m.length > 0)
                : [];
            
            try {
                await this.handleCreatePrivateGroup(groupName, groupDescription, invitedMembers);
                modal.remove();
            } catch (error) {
                console.error('❌ Fehler beim Erstellen der Gruppe:', error);
            }
        };
    }

    /**
     * Handle create private group
     */
    async handleCreatePrivateGroup(groupName, description, invitedMembers) {
        try {
            console.log('🔐 Erstelle private Gruppe:', { groupName, description, invitedMembers });
            
            const result = await this.nip104.createRealPrivateGroup(groupName, description, invitedMembers);
            
            this.toastService.showSuccess(`Verschlüsselte Gruppe "${groupName}" erstellt!`);
            
            // Update the private groups list
            this.updatePrivateGroupsList();
            
        } catch (error) {
            console.error('❌ Fehler beim Erstellen der privaten Gruppe:', error);
            this.toastService.showError('Fehler beim Erstellen der Gruppe');
        }
    }

    /**
     * Update private groups list in UI
     */
    updatePrivateGroupsList() {
        try {
            const privateGroupsContainer = document.getElementById('privateGroupsList');
            if (!privateGroupsContainer) return;
            
            const userGroups = this.nip104.getUserPrivateGroups();
            
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
     * Load room messages
     */
    async loadRoomMessages(roomId) {
        try {
            console.log(`📜 Lade Nachrichten für Raum: ${roomId}`);
            
            // Get stored messages or initialize empty array
            const messages = this.getStoredMessages(roomId) || [];
            this.displayMessages(messages);
            
            // TODO: Subscribe to room messages
            // this.subscribeToRoomMessages(roomId);
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Raum-Nachrichten:', error);
        }
    }

    /**
     * Load DM contacts
     */
    async loadDMContacts() {
        try {
            console.log('👥 Lade DM-Kontakte...');
            
            // Get stored contacts or initialize empty map
            const storedContacts = localStorage.getItem('dmContacts');
            if (storedContacts) {
                const contacts = JSON.parse(storedContacts);
                this.dmContacts = new Map(Object.entries(contacts));
            }
            
            // Update UI
            this.updateDMContactsList();
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der DM-Kontakte:', error);
        }
    }

    /**
     * Subscribe to room messages
     */
    subscribeToRoomMessages() {
        try {
            console.log('📡 Abonniere Raum-Nachrichten...');
            
            // TODO: Implement room message subscription
            // This would use NIP-28 for public rooms
            
        } catch (error) {
            console.error('❌ Fehler beim Abonnieren von Raum-Nachrichten:', error);
        }
    }

    /**
     * Subscribe to direct messages
     */
    subscribeToDirectMessages() {
        try {
            console.log('📡 Abonniere Direktnachrichten...');
            
            // TODO: Implement DM subscription using NIP-04
            
        } catch (error) {
            console.error('❌ Fehler beim Abonnieren von Direktnachrichten:', error);
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
            messages.push(message);
            
            // Keep only last 100 messages
            if (messages.length > 100) {
                messages.splice(0, messages.length - 100);
            }
            
            localStorage.setItem(`messages_${roomId}`, JSON.stringify(messages));
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Nachricht:', error);
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
     * Update DM contacts list
     */
    updateDMContactsList() {
        const dmContactsContainer = this.element.querySelector('#dmContacts');
        if (!dmContactsContainer) return;
        
        if (this.dmContacts.size === 0) {
            dmContactsContainer.innerHTML = `
                <div class="no-contacts">
                    <p>📝 Keine DM-Kontakte</p>
                    <small>Starte eine neue Unterhaltung</small>
                </div>
            `;
            return;
        }
        
        const contactsHtml = Array.from(this.dmContacts.entries()).map(([pubkey, contact]) => `
            <div class="dm-contact" data-pubkey="${pubkey}">
                <div class="contact-avatar">👤</div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name || 'Unknown'}</div>
                    <div class="contact-pubkey">${pubkey.slice(0, 16)}...</div>
                </div>
            </div>
        `).join('');
        
        dmContactsContainer.innerHTML = contactsHtml;
    }

    /**
     * Show user profile
     */
    showUserProfile() {
        try {
            const userInfo = this.nostrService.getUserInfo();
            alert(`👤 Dein Profil:\n\nNpub: ${userInfo.npub}\nPublic Key: ${userInfo.publicKey}`);
        } catch (error) {
            console.error('❌ Fehler beim Anzeigen des Profils:', error);
            alert('Fehler beim Laden des Profils');
        }
    }

    /**
     * Dispatch event (placeholder for event system)
     */
    dispatchEvent(eventName, data = null) {
        try {
            console.log(`📡 Event dispatched: ${eventName}`, data);
            
            // Simple event handling - in a real app, you'd use a proper event system
            switch (eventName) {
                case 'showSettings':
                    alert('⚙️ Einstellungen (noch nicht implementiert)');
                    break;
                case 'showRelays':
                    alert('🔗 Relays (noch nicht implementiert)');
                    break;
                default:
                    console.warn(`❓ Unbekanntes Event: ${eventName}`);
            }
        } catch (error) {
            console.error('❌ Fehler beim Dispatchen des Events:', error);
        }
    }

    /**
     * Handle send message
     */
    handleSendMessage() {
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
            
            // Clear input
            messageInput.value = '';
            
            // TODO: Send to NOSTR network
            
        } catch (error) {
            console.error('❌ Fehler beim Senden der Nachricht:', error);
        }
    }

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
     * Start direct message
     */
    startDirectMessage() {
        const dmUserInput = this.element.querySelector('#dmUserInput');
        if (!dmUserInput) return;
        
        const userInput = dmUserInput.value.trim();
        if (!userInput) return;
        
        try {
            console.log('💬 Starte DM mit:', userInput);
            
            // TODO: Validate and convert npub to hex if needed
            const pubkey = userInput;
            
            // Add to contacts
            this.dmContacts.set(pubkey, {
                name: `User ${pubkey.slice(0, 8)}`,
                pubkey: pubkey,
                lastMessage: '',
                unreadCount: 0
            });
            
            // Save contacts
            const contactsObj = Object.fromEntries(this.dmContacts);
            localStorage.setItem('dmContacts', JSON.stringify(contactsObj));
            
            // Open DM
            this.openDirectMessage(pubkey);
            
            // Clear input
            dmUserInput.value = '';
            
        } catch (error) {
            console.error('❌ Fehler beim Starten der DM:', error);
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
            
            const messages = this.getStoredMessages(`dm_${pubkey}`) || [];
            this.displayMessages(messages);
            
            // TODO: Load from NOSTR network
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der DM-Nachrichten:', error);
        }
    }
}
