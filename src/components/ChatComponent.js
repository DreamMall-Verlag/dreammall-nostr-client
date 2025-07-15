// =================================================================
// Chat Component - Modularer Aufbau mit NIP-Modulen
// Verwendet NIP-01, NIP-02, NIP-04, NIP-25, NIP-28, NIP-104
// =================================================================

import { NIP01_BasicProtocol } from '../nips/NIP01_BasicProtocol.js';
import { NIP02_ContactLists } from '../nips/NIP02_ContactLists.js';
import { NIP04_EncryptedDMs } from '../nips/NIP04_EncryptedDMs.js';
import { NIP25_Reactions } from '../nips/NIP25_Reactions.js';
import { NIP28_PublicChat } from '../nips/NIP28_PublicChat.js';
import { NIP104_PrivateGroups } from '../nips/NIP104_PrivateGroups.js';
import { ModalComponent } from './ui/ModalComponent.js';
import { RoomManagerComponent } from './ui/RoomManagerComponent.js';

export class ChatComponent {
    constructor(nostrService, toastService) {
        this.nostrService = nostrService;
        this.toastService = toastService;
        
        // Initialize NIP modules
        this.nip01 = new NIP01_BasicProtocol(nostrService);
        this.nip02 = new NIP02_ContactLists(nostrService, this.nip01);
        this.nip04 = new NIP04_EncryptedDMs(nostrService, this.nip01);
        this.nip25 = new NIP25_Reactions(nostrService, this.nip01);
        this.nip28 = new NIP28_PublicChat(nostrService, this.nip01);
        this.nip104 = new NIP104_PrivateGroups(nostrService, this.nip01);
        
        // Initialize UI components
        this.modal = new ModalComponent();
        this.roomManager = new RoomManagerComponent(this.nip28, toastService);
        
        // State management
        this.element = null;
        this.currentRoom = 'dreammall-support';
        this.currentView = 'room'; // 'room', 'dm', or 'private-group'
        this.currentDMUser = null;
        this.currentPrivateGroup = null;
        this.messages = new Map();
        this.subscriptions = new Map();
        
        console.log('✅ ChatComponent mit modularer NIP-Architektur initialisiert');
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'main';
        this.element.innerHTML = `
            <div class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-tabs">
                        <button class="tab-btn active" id="roomsTab">🏠 Räume</button>
                        <button class="tab-btn" id="dmsTab">💬 DMs</button>
                        <button class="tab-btn" id="privateGroupsTab">🔐 Private</button>
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
                
                <!-- Private Groups Tab -->
                <div class="tab-content" id="privateGroupsContent">
                    ${this.renderPrivateGroupsSection()}
                </div>
            </div>
            
            <div class="chat">
                <div class="chat-header">
                    <h3 id="chatTitle">DreamMall Support</h3>
                    <div class="chat-controls">
                        <button class="btn btn-sm" id="userBtn" title="Dein Profil">👤</button>
                        <button class="btn btn-sm" id="reactionsBtn" title="Reaktionen">👍</button>
                        <button class="btn btn-sm" id="contactsBtn" title="Kontakte">👥</button>
                        <button class="btn btn-sm" id="settingsBtn" title="Einstellungen">⚙️</button>
                    </div>
                </div>
                
                <div class="messages" id="messages">
                    <div class="welcome">
                        <h3>Willkommen! 🎉</h3>
                        <p>Modularer Chat mit NIP-01, NIP-02, NIP-04, NIP-25, NIP-28, NIP-104</p>
                    </div>
                </div>
                
                <div class="input-area">
                    <div class="input-container">
                        <input type="text" id="messageInput" placeholder="Nachricht schreiben..." />
                        <button class="btn btn-primary" id="sendBtn">📤</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.initializeChat();
        
        return this.element;
    }

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

    renderDMSection() {
        return `
            <div class="dm-actions">
                <input type="text" id="dmUserInput" placeholder="npub... oder hex pubkey" />
                <button class="btn btn-sm" id="startDMBtn">💬 Start DM</button>
            </div>
            <div class="dm-contacts" id="dmContacts">
                <div class="no-contacts">
                    <p>Keine DM-Kontakte</p>
                    <small>Gib einen npub oder pubkey ein für verschlüsselte Unterhaltung</small>
                </div>
            </div>
        `;
    }

    renderPrivateGroupsSection() {
        return `
            <div class="private-group-actions">
                <button class="btn btn-sm" id="createPrivateGroupBtn">🔐 Gruppe erstellen</button>
                <button class="btn btn-sm" id="joinPrivateGroupBtn">🚪 Gruppe beitreten</button>
            </div>
            <div class="private-groups" id="privateGroupsList">
                <div class="no-groups">
                    <p>Keine privaten Gruppen</p>
                    <small>Erstelle oder trete einer privaten Gruppe bei</small>
                </div>
            </div>
        `;
    }

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
        const privateGroupsTab = this.element.querySelector('#privateGroupsTab');
        
        roomsTab.addEventListener('click', () => this.switchTab('rooms'));
        dmsTab.addEventListener('click', () => this.switchTab('dms'));
        privateGroupsTab.addEventListener('click', () => this.switchTab('privateGroups'));

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

        // Private groups
        const createPrivateGroupBtn = this.element.querySelector('#createPrivateGroupBtn');
        const joinPrivateGroupBtn = this.element.querySelector('#joinPrivateGroupBtn');
        
        createPrivateGroupBtn.addEventListener('click', () => this.showCreatePrivateGroupModal());
        joinPrivateGroupBtn.addEventListener('click', () => this.showJoinPrivateGroupModal());

        // Control buttons
        const userBtn = this.element.querySelector('#userBtn');
        const reactionsBtn = this.element.querySelector('#reactionsBtn');
        const contactsBtn = this.element.querySelector('#contactsBtn');
        const settingsBtn = this.element.querySelector('#settingsBtn');

        userBtn.addEventListener('click', () => this.showUserProfile());
        reactionsBtn.addEventListener('click', () => this.showReactionsModal());
        contactsBtn.addEventListener('click', () => this.showContactsModal());
        settingsBtn.addEventListener('click', () => this.dispatchEvent('showSettings'));
    }

    async initializeChat() {
        try {
            console.log('🚀 Beginne Chat-Initialisierung...');
            
            // Wait for NOSTR service
            await this.waitForNostrService();
            
            // Load contacts (don't fail if this fails)
            try {
                await this.nip02.loadContactList();
                console.log('✅ Kontakte geladen');
            } catch (contactError) {
                console.warn('⚠️ Kontakte konnten nicht geladen werden:', contactError);
            }
            
            // Subscribe to different message types
            try {
                this.subscribeToRoomMessages();
                console.log('✅ Raum-Nachrichten abonniert');
            } catch (roomError) {
                console.error('❌ Raum-Nachrichten Subscription fehlgeschlagen:', roomError);
            }
            
            try {
                this.subscribeToEncryptedDMs();
                console.log('✅ Verschlüsselte DMs abonniert');
            } catch (dmError) {
                console.error('❌ DM Subscription fehlgeschlagen:', dmError);
            }
            
            try {
                this.subscribeToPrivateGroups();
                console.log('✅ Private Gruppen abonniert');
            } catch (groupError) {
                console.error('❌ Private Gruppen Subscription fehlgeschlagen:', groupError);
            }
            
            this.subscribeToReactions();
            
            console.log('✅ Chat vollständig initialisiert');
            this.toastService.showSuccess('Chat erfolgreich initialisiert');
            
        } catch (error) {
            console.error('❌ Chat Initialisierung fehlgeschlagen:', error);
            this.toastService.showError('Chat konnte nicht initialisiert werden: ' + error.message);
            throw error;
        }
    }

    async waitForNostrService() {
        let retries = 0;
        while (retries < 20) {
            if (this.nostrService && 
                this.nostrService.pool && 
                this.nostrService.keyPair &&
                this.nostrService.relayService) {
                
                // Also wait for at least one relay connection
                const connectedRelays = this.nostrService.relayService.getConnectedRelays();
                if (connectedRelays.length > 0) {
                    console.log(`✅ NOSTR Service bereit mit ${connectedRelays.length} Relays`);
                    return;
                }
            }
            
            console.log(`⏳ Warte auf NOSTR Service... (${retries + 1}/20)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries++;
        }
        throw new Error('NOSTR Service not ready after 20 seconds');
    }

    async handleSendMessage() {
        const input = this.element.querySelector('#messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        try {
            if (this.currentView === 'room') {
                await this.sendRoomMessage(message);
            } else if (this.currentView === 'dm') {
                await this.sendDirectMessage(message);
            } else if (this.currentView === 'private-group') {
                await this.sendPrivateGroupMessage(message);
            }
            
            input.value = '';
            
        } catch (error) {
            console.error('❌ Nachricht senden fehlgeschlagen:', error);
            this.toastService.showError('Nachricht konnte nicht gesendet werden');
        }
    }

    async sendRoomMessage(message) {
        console.log(`📤 Sende öffentliche Nachricht: ${this.currentRoom}`);
        const event = await this.nip28.sendRoomMessage(this.currentRoom, message);
        this.displayMessage({
            id: event.id,
            content: message,
            author: 'Du',
            timestamp: Date.now(),
            isOwn: true
        });
    }

    async sendDirectMessage(message) {
        console.log(`📤 Sende verschlüsselte DM: ${this.currentDMUser}`);
        const event = await this.nip04.sendEncryptedDM(this.currentDMUser, message);
        this.displayMessage({
            id: event.id,
            content: message,
            author: 'Du',
            timestamp: Date.now(),
            isOwn: true,
            encrypted: true
        });
        this.toastService.showSuccess('🔐 Verschlüsselte Nachricht gesendet');
    }

    async sendPrivateGroupMessage(message) {
        console.log(`📤 Sende private Gruppennachricht: ${this.currentPrivateGroup}`);
        const event = await this.nip104.sendPrivateGroupMessage(this.currentPrivateGroup, message);
        this.displayMessage({
            id: event.id,
            content: message,
            author: 'Du',
            timestamp: Date.now(),
            isOwn: true,
            privateGroup: true
        });
        this.toastService.showSuccess('🔐 Private Gruppennachricht gesendet');
    }

    switchRoom(roomId) {
        this.currentRoom = roomId;
        this.currentView = 'room';
        this.currentDMUser = null;
        this.currentPrivateGroup = null;
        
        // Update UI - simplified
        const roomName = this.getRoomName(roomId);
        this.element.querySelector('#chatTitle').textContent = roomName;
        
        // Update room selection
        this.element.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
        const selectedRoom = this.element.querySelector(`[data-room="${roomId}"]`);
        if (selectedRoom) selectedRoom.classList.add('active');
        
        this.clearMessages();
        this.subscribeToRoomMessages();
    }

    getRoomName(roomId) {
        const roomNames = {
            'dreammall-support': 'DreamMall Support',
            'dreammall-hilfe': 'DreamMall Hilfe',
            'dreammall-dev': 'DreamMall Dev'
        };
        return roomNames[roomId] || roomId;
    }

    switchTab(tab) {
        // Update tab buttons
        this.element.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        this.element.querySelector(`#${tab}Tab`).classList.add('active');
        
        // Update tab content
        this.element.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        this.element.querySelector(`#${tab}Content`).classList.add('active');
    }

    displayMessage(message, showReactions = true) {
        const messagesContainer = this.element.querySelector('#messages');
        
        // Remove welcome if present
        const welcome = messagesContainer.querySelector('.welcome');
        if (welcome) welcome.remove();
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.isOwn ? 'user' : 'other'}`;
        messageElement.innerHTML = `
            <div class="message-text">
                ${message.encrypted ? '🔐 ' : ''}
                ${message.privateGroup ? '🔐👥 ' : ''}
                ${message.content}
            </div>
            <div class="message-info">
                <span class="message-author">${message.author}</span>
                <span class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                ${showReactions && message.id ? `
                    <button class="reaction-btn" onclick="this.closest('.main').chatComponent.reactToMessage('${message.id}', '+')">👍</button>
                    <button class="reaction-btn" onclick="this.closest('.main').chatComponent.reactToMessage('${message.id}', '❤️')">❤️</button>
                ` : ''}
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    clearMessages() {
        const messagesContainer = this.element.querySelector('#messages');
        messagesContainer.innerHTML = '';
    }

    subscribeToRoomMessages() {
        if (this.subscriptions.has('room')) {
            this.subscriptions.get('room').unsub();
        }
        
        console.log(`📡 ChatComponent: Abonniere Raum-Nachrichten für ${this.currentRoom}`);
        
        const subscription = this.nip28.subscribeToRoom(this.currentRoom, (event) => {
            console.log(`📨 ChatComponent: Nachricht erhalten:`, event);
            
            if (event.isRoomMessage && event.roomName === this.currentRoom) {
                this.displayMessage({
                    id: event.id,
                    content: event.content,
                    author: this.getAuthorName(event.pubkey),
                    timestamp: event.created_at * 1000,
                    isOwn: event.pubkey === this.nostrService.getPublicKey()
                });
            }
        });
        
        this.subscriptions.set('room', subscription);
    }

    subscribeToEncryptedDMs() {
        if (this.subscriptions.has('dms')) {
            this.subscriptions.get('dms').unsub();
        }
        
        console.log(`📡 ChatComponent: Abonniere verschlüsselte DMs`);
        
        const subscription = this.nip04.subscribeToEncryptedDMs((event) => {
            console.log(`📨 ChatComponent: Verschlüsselte DM erhalten:`, event);
            
            if (event.isDecrypted && this.currentView === 'dm' && 
                (event.senderPubkey === this.currentDMUser || event.pubkey === this.currentDMUser)) {
                this.displayMessage({
                    id: event.id,
                    content: event.decryptedContent,
                    author: this.getAuthorName(event.senderPubkey),
                    timestamp: event.created_at * 1000,
                    isOwn: event.pubkey === this.nostrService.getPublicKey(),
                    encrypted: true
                });
            }
        });
        
        this.subscriptions.set('dms', subscription);
    }

    subscribeToPrivateGroups() {
        // Subscribe to group invites
        this.nip104.subscribeToGroupInvites((invite) => {
            this.toastService.showSuccess(`📧 Einladung zu privater Gruppe erhalten`);
        });
    }

    subscribeToReactions() {
        // Will be implemented when we have message IDs to track
    }

    getAuthorName(pubkey) {
        if (pubkey === this.nostrService.getPublicKey()) {
            return 'Du';
        }
        return this.nip02.getDisplayName(pubkey);
    }

    startDirectMessage() {
        const input = this.element.querySelector('#dmUserInput');
        let userInput = input.value.trim();
        
        if (!userInput) return;
        
        // Convert npub to hex if needed
        let pubkey = userInput;
        if (userInput.startsWith('npub')) {
            pubkey = this.nostrService.npubToHex(userInput);
        }
        
        if (pubkey) {
            this.openDirectMessage(pubkey);
            input.value = '';
        }
    }

    openDirectMessage(pubkey) {
        this.currentView = 'dm';
        this.currentDMUser = pubkey;
        this.currentPrivateGroup = null;
        
        this.element.querySelector('#chatTitle').textContent = `DM mit ${this.getAuthorName(pubkey)}`;
        this.element.querySelector('#messageInput').placeholder = 'Verschlüsselte Nachricht...';
        
        this.clearMessages();
        this.subscribeToEncryptedDMs();
        this.switchTab('dms');
    }

    showCreatePrivateGroupModal() {
        this.modal.createForm({
            title: 'Private Gruppe erstellen',
            fields: [
                {
                    name: 'groupName',
                    label: 'Gruppenname',
                    type: 'text',
                    placeholder: 'Meine private Gruppe',
                    required: true
                },
                {
                    name: 'groupDescription',
                    label: 'Beschreibung',
                    type: 'text',
                    placeholder: 'Beschreibung der Gruppe'
                },
                {
                    name: 'members',
                    label: 'Mitglieder (npub, durch Komma getrennt)',
                    type: 'textarea',
                    placeholder: 'npub1..., npub2...'
                }
            ],
            onSubmit: (data) => this.createPrivateGroup(data),
            submitText: 'Erstellen'
        });
    }

    showJoinPrivateGroupModal() {
        this.modal.createForm({
            title: 'Private Gruppe beitreten',
            fields: [
                {
                    name: 'groupId',
                    label: 'Gruppen-ID',
                    type: 'text',
                    placeholder: 'group-id-hash...',
                    required: true
                },
                {
                    name: 'sharedKey',
                    label: 'Geteilter Schlüssel',
                    type: 'password',
                    placeholder: 'Shared Key...',
                    required: true
                }
            ],
            onSubmit: (data) => this.joinPrivateGroup(data),
            submitText: 'Beitreten'
        });
    }

    async createPrivateGroup(data) {
        try {
            const members = data.members ? data.members.split(',').map(m => m.trim()) : [];
            const result = await this.nip104.createPrivateGroup(data.groupName, data.groupDescription, members);
            
            this.toastService.showSuccess(`🔐 Private Gruppe "${data.groupName}" erstellt`);
            this.updatePrivateGroupsList();
            
        } catch (error) {
            console.error('❌ Private Gruppe erstellen fehlgeschlagen:', error);
            this.toastService.showError('Private Gruppe konnte nicht erstellt werden');
            return false;
        }
    }

    async joinPrivateGroup(data) {
        try {
            const result = await this.nip104.joinPrivateGroup(data.groupId, data.sharedKey);
            
            this.toastService.showSuccess(`🔐 Private Gruppe beigetreten`);
            this.updatePrivateGroupsList();
            
        } catch (error) {
            console.error('❌ Private Gruppe beitreten fehlgeschlagen:', error);
            this.toastService.showError('Private Gruppe konnte nicht beigetreten werden');
            return false;
        }
    }

    updatePrivateGroupsList() {
        const container = this.element.querySelector('#privateGroupsList');
        const groups = this.nip104.getAllPrivateGroups();
        
        if (groups.length === 0) {
            container.innerHTML = `
                <div class="no-groups">
                    <p>Keine privaten Gruppen</p>
                    <small>Erstelle oder trete einer privaten Gruppe bei</small>
                </div>
            `;
        } else {
            container.innerHTML = groups.map(group => `
                <div class="private-group" data-group-id="${group.groupId}">
                    <div class="group-name">🔐 ${group.name}</div>
                    <div class="group-description">${group.description}</div>
                </div>
            `).join('');
        }
    }

    showUserProfile() {
        const pubkey = this.nostrService.getPublicKey();
        const npub = this.nostrService.hexToNpub(pubkey);
        
        this.modal.alert({
            title: 'Dein Profil',
            message: `
                <div class="profile-info">
                    <p><strong>Public Key:</strong><br><code>${pubkey}</code></p>
                    <p><strong>npub:</strong><br><code>${npub || 'Conversion failed'}</code></p>
                    <p><strong>Kontakte:</strong> ${this.nip02.getAllContacts().length}</p>
                </div>
            `
        });
    }

    showReactionsModal() {
        const stats = this.nip25.getReactionStats();
        this.modal.alert({
            title: '👍 Reaktionen',
            message: `
                <div class="reactions-info">
                    <p><strong>Meine Reaktionen:</strong> ${stats.myReactions}</p>
                    <p><strong>Gesamt Reaktionen:</strong> ${stats.totalReactions}</p>
                    <p><strong>Events mit Reaktionen:</strong> ${stats.totalEvents}</p>
                </div>
            `
        });
    }

    showContactsModal() {
        const contacts = this.nip02.getAllContacts();
        this.modal.alert({
            title: '👥 Kontakte',
            message: `
                <div class="contacts-info">
                    <p><strong>Kontakte:</strong> ${contacts.length}</p>
                    ${contacts.slice(0, 5).map(c => `
                        <p>• ${c.petname || c.pubkey.slice(0, 8)}...</p>
                    `).join('')}
                    ${contacts.length > 5 ? `<p>... und ${contacts.length - 5} weitere</p>` : ''}
                </div>
            `
        });
    }

    async reactToMessage(messageId, reaction) {
        try {
            await this.nip25.reactToEvent(messageId, reaction);
            this.toastService.showSuccess(`${reaction} Reaktion gesendet`);
        } catch (error) {
            console.error('❌ Reaktion fehlgeschlagen:', error);
            this.toastService.showError('Reaktion konnte nicht gesendet werden');
        }
    }

    dispatchEvent(eventName, detail = {}) {
        document.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    destroy() {
        this.subscriptions.forEach(sub => sub.unsub());
        this.subscriptions.clear();
        this.modal.closeAll();
    }
}