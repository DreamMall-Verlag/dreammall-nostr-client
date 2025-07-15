// =================================================================
// Chat Component - NIP-28 Public Chat + NIP-04 Encrypted DMs
// Implements NIP-01 (Basic protocol), NIP-28 (Public Chat), NIP-04 (Encrypted DMs)
// =================================================================

export class ChatComponent {
    constructor(nostrService, toastService) {
        this.nostrService = nostrService;
        this.toastService = toastService;
        this.element = null;
        this.currentRoom = 'dreammall-support';
        this.currentView = 'room'; // 'room' or 'dm'
        this.currentDMUser = null;
        this.messages = new Map();
        this.dmMessages = new Map(); // Store DM messages separately
        this.sentMessages = new Set(); // Track sent messages to prevent duplicates
        this.roomMessages = new Map(); // Store messages per room for sorting
        this.predefinedRooms = [
            { id: 'dreammall-support', name: 'DreamMall Support', description: 'Technischer Support und Hilfe' },
            { id: 'dreammall-hilfe', name: 'DreamMall Hilfe', description: 'Allgemeine Fragen und Diskussionen' }
        ];
        this.dmContacts = new Map(); // Store DM contacts
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
                    </div>
                </div>
                
                <!-- Public Rooms Section -->
                <div class="tab-content active" id="roomsContent">
                    <div class="rooms" id="roomList">
                        <div class="room active" data-room="dreammall-support">
                            <div class="room-name">DreamMall Support</div>
                            <div class="room-status">Technischer Support</div>
                        </div>
                        <div class="room" data-room="dreammall-hilfe">
                            <div class="room-name">DreamMall Hilfe</div>
                            <div class="room-status">Allgemeine Fragen</div>
                        </div>
                    </div>
                </div>
                
                <!-- Direct Messages Section -->
                <div class="tab-content" id="dmsContent">
                    <div class="dm-actions">
                        <input type="text" id="dmUserInput" placeholder="npub... oder hex pubkey" />
                        <button class="btn btn-sm" id="startDMBtn">💬 Start DM</button>
                    </div>
                    <div class="dm-contacts" id="dmContacts">
                        <div class="no-contacts">
                            <p>Keine DM-Kontakte</p>
                            <small>Gib einen npub oder pubkey ein, um eine verschlüsselte Unterhaltung zu starten</small>
                        </div>
                    </div>
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
        
        // Delay subscription to allow NostrService to initialize
        setTimeout(() => {
            this.subscribeToMessages();
        }, 1500);
        
        // Initialize room counts on first load
        setTimeout(() => this.updateAllRoomCounts(), 2000);
        
        // Update user button with pubkey
        this.updateUserButton();
        return this.element;
    }

    setupEventListeners() {
        const sendBtn = this.element.querySelector('#sendBtn');
        const messageInput = this.element.querySelector('#messageInput');
        const userBtn = this.element.querySelector('#userBtn');
        const settingsBtn = this.element.querySelector('#settingsBtn');
        const relaysBtn = this.element.querySelector('#relaysBtn');
        const roomList = this.element.querySelector('#roomList');
        
        // Tab switching
        const roomsTab = this.element.querySelector('#roomsTab');
        const dmsTab = this.element.querySelector('#dmsTab');
        const startDMBtn = this.element.querySelector('#startDMBtn');
        const dmUserInput = this.element.querySelector('#dmUserInput');

        sendBtn.addEventListener('click', () => this.handleSendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });

        userBtn.addEventListener('click', () => this.showUserProfile());
        settingsBtn.addEventListener('click', () => this.dispatchEvent('showSettings'));
        relaysBtn.addEventListener('click', () => this.dispatchEvent('showRelays'));

        // Room switching
        roomList.addEventListener('click', (e) => {
            const roomElement = e.target.closest('.room');
            if (roomElement) {
                this.switchRoom(roomElement.dataset.room);
            }
        });

        // Tab switching
        roomsTab.addEventListener('click', () => this.switchTab('rooms'));
        dmsTab.addEventListener('click', () => this.switchTab('dms'));

        // DM functionality
        startDMBtn.addEventListener('click', () => this.startDirectMessage());
        dmUserInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startDirectMessage();
        });

        // DM contact clicking
        const dmContacts = this.element.querySelector('#dmContacts');
        dmContacts.addEventListener('click', (e) => {
            const contactElement = e.target.closest('.dm-contact');
            if (contactElement) {
                this.openDirectMessage(contactElement.dataset.pubkey);
            }
        });

        // Listen for new DM events
        document.addEventListener('newDirectMessage', (e) => {
            this.handleNewDirectMessage(e.detail);
        });
    }

    async handleSendMessage() {
        const input = this.element.querySelector('#messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        try {
            if (this.currentView === 'room') {
                // NIP-28: Send to public room
                console.log(`📤 Sende NIP-28 Nachricht in Raum: ${this.currentRoom}`);
                
                const result = await this.nostrService.sendMessage(message, this.currentRoom, false);
                input.value = '';
                
                // Track this message to prevent duplicate display
                if (result && result.id) {
                    this.sentMessages.add(result.id);
                }
                
                // Create a temporary ID for optimistic update
                const tempId = `temp_${Date.now()}_${Math.random()}`;
                this.sentMessages.add(tempId);
                
                // Show message immediately for better UX
                this.renderMessage({
                    id: tempId,
                    content: message,
                    author: 'Du',
                    timestamp: Date.now(),
                    isOwn: true
                });
            } else if (this.currentView === 'dm' && this.currentDMUser) {
                // NIP-04: Send encrypted DM
                console.log(`📤 Sende NIP-04 verschlüsselte DM an: ${this.currentDMUser}`);
                
                const result = await this.nostrService.sendDirectMessage(message, this.currentDMUser, true);
                input.value = '';
                
                // Track this message to prevent duplicate display
                if (result && result.id) {
                    this.sentMessages.add(result.id);
                }
                
                // Show message immediately for better UX
                this.renderMessage({
                    id: result.id || `temp_${Date.now()}`,
                    content: message,
                    author: 'Du',
                    timestamp: Date.now(),
                    isOwn: true,
                    encrypted: true
                });
                
                this.toastService.showSuccess('🔐 Verschlüsselte Nachricht gesendet');
            }
        } catch (error) {
            console.error('❌ Fehler beim Senden der Nachricht:', error);
            this.toastService.showError('Fehler beim Senden der Nachricht');
        }
    }

    switchRoom(roomName) {
        this.currentRoom = roomName;
        
        // Update active room in sidebar
        const rooms = this.element.querySelectorAll('.room');
        rooms.forEach(room => {
            room.classList.toggle('active', room.dataset.room === roomName);
        });
        
        // Update chat title
        const chatTitle = this.element.querySelector('#chatTitle');
        const roomInfo = this.predefinedRooms.find(r => r.id === roomName);
        chatTitle.textContent = roomInfo ? roomInfo.name : roomName;
        
        // Clear messages for new room
        this.clearMessages();
        
        // Update all room message counts
        this.updateAllRoomCounts();
        
        // Load messages for this room
        this.loadRoomMessages(roomName);
        
        // Subscribe to new messages for this room
        this.subscribeToRoom(roomName);
        
        console.log(`🏠 Wechsle zu Raum: ${roomName}`);
    }

    updateAllRoomCounts() {
        // Update message counts for all rooms
        this.predefinedRooms.forEach(room => {
            this.updateRoomMessageCount(room.id);
        });
    }

    subscribeToMessages() {
        // Subscribe to messages using NIP-01 REQ for current room
        console.log(`🔔 Abonniere Nachrichten für Raum: ${this.currentRoom}`);
        
        // Make sure NostrService is ready with better checking
        if (!this.nostrService || !this.nostrService.pool || !this.nostrService.keyPair) {
            console.warn('⚠️ NostrService nicht bereit, verzögere Subscription...');
            // Try again in 2 seconds, but don't loop infinitely
            if (!this.subscriptionRetries) this.subscriptionRetries = 0;
            if (this.subscriptionRetries < 5) {
                this.subscriptionRetries++;
                setTimeout(() => this.subscribeToMessages(), 2000);
            } else {
                console.error('❌ NostrService konnte nicht initialisiert werden nach 5 Versuchen');
            }
            return;
        }
        
        // Reset retry counter on successful connection
        this.subscriptionRetries = 0;
        
        // Subscribe to room messages (NIP-28)
        this.nostrService.subscribeToRoom(this.currentRoom, (event) => {
            console.log('📨 Nachricht erhalten in subscribeToMessages:', event);
            this.handleNewMessage(event);
        });
        
        // Subscribe to encrypted direct messages (NIP-04)
        this.nostrService.subscribeToDirectMessages();
        
        console.log('✅ Subscriptions initialisiert für Räume und DMs');
    }

    subscribeToRoom(roomName) {
        console.log(`🔔 Abonniere Nachrichten für Raum: ${roomName}`);
        
        // Make sure NostrService is ready
        if (!this.nostrService || !this.nostrService.pool) {
            console.warn('⚠️ NostrService nicht bereit für Raum-Subscription');
            // Try to initialize if not ready
            setTimeout(() => {
                if (this.nostrService && this.nostrService.pool) {
                    this.subscribeToRoom(roomName);
                }
            }, 1000);
            return;
        }
        
        try {
            this.nostrService.subscribeToRoom(roomName, (event) => {
                console.log('📨 Nachricht erhalten in subscribeToRoom:', event);
                this.handleNewMessage(event);
            });
        } catch (error) {
            console.error('❌ Fehler beim Abonnieren des Raums:', error);
        }
    }

    handleNewMessage(event) {
        console.log('📨 Neue Nachricht erhalten:', event);
        
        // Check for duplicates - skip if we already sent this message
        if (event.id && this.sentMessages.has(event.id)) {
            console.log('🔄 Duplikat erkannt, überspringe:', event.id);
            return;
        }
        
        // Check if this is our own message by comparing public keys
        const currentUserPubkey = this.nostrService.getUserProfile?.()?.pubkey;
        const isOwnMessage = currentUserPubkey && event.pubkey === currentUserPubkey;
        
        const messageData = {
            id: event.id,
            content: event.content,
            pubkey: event.pubkey,
            created_at: event.created_at,
            isOwn: isOwnMessage
        };
        
        if (event.kind === 1 || event.kind === 42) { // NIP-01 Text Note or NIP-28 Channel Message
            // Store in room-specific collection
            if (!this.roomMessages.has(this.currentRoom)) {
                this.roomMessages.set(this.currentRoom, new Map());
            }
            
            const messageId = event.id || event.pubkey + event.created_at;
            this.roomMessages.get(this.currentRoom).set(messageId, messageData);
            
            // Render the new message
            this.renderMessage(messageData);
        }
    }

    addMessage(messageData) {
        // Legacy method - redirect to renderMessage
        this.renderMessage(messageData);
    }

    loadRoomMessages(roomName) {
        const messagesContainer = this.element.querySelector('#messages');
        messagesContainer.innerHTML = `
            <div class="welcome">
                <h3>Raum: ${roomName}</h3>
                <p>Lade Nachrichten...</p>
            </div>
        `;
        
        // Initialize room messages storage
        if (!this.roomMessages.has(roomName)) {
            this.roomMessages.set(roomName, new Map());
        }
        
        // Load existing messages for the room (if any)
        // Since we don't have loadRoomMessages(), we'll just clear and re-subscribe
        messagesContainer.innerHTML = '';
        
        // Subscribe to room messages (this will load recent messages)
        this.subscribeToRoom(roomName);
    }

    renderMessagesInOrder(roomName) {
        const roomMessageMap = this.roomMessages.get(roomName);
        if (!roomMessageMap) return;
        
        // Convert to array and sort by created_at (oldest first for proper chat flow)
        const sortedMessages = Array.from(roomMessageMap.values())
            .sort((a, b) => a.created_at - b.created_at);
        
        console.log('🔄 Sortiere Nachrichten für Raum:', roomName);
        console.log('📅 Nachrichten-Zeitstempel:', sortedMessages.map(m => ({
            content: m.content.slice(0, 20),
            created_at: m.created_at,
            date: new Date(m.created_at * 1000).toLocaleString()
        })));
        
        const messagesContainer = this.element.querySelector('#messages');
        messagesContainer.innerHTML = '';
        
        // Render messages in chronological order (oldest first, newest last)
        sortedMessages.forEach(message => {
            this.renderMessage(message);
        });
    }

    renderMessage(messageData) {
        const messagesContainer = this.element.querySelector('#messages');
        
        // Check for existing message with same ID to prevent duplicates
        if (messageData.id) {
            const existingMessage = messagesContainer.querySelector(`[data-message-id="${messageData.id}"]`);
            if (existingMessage) {
                console.log('🔄 Nachricht bereits vorhanden, überspringe:', messageData.id);
                return;
            }
        }
        
        // Remove welcome message if exists
        const welcome = messagesContainer.querySelector('.welcome');
        if (welcome) {
            welcome.remove();
        }
        
        // Create message element with better visibility
        const messageElement = document.createElement('div');
        const messageClasses = ['message'];
        
        if (messageData.isOwn) {
            messageClasses.push('user');
        } else {
            messageClasses.push('other');
        }
        
        // Add encryption class for encrypted messages
        if (messageData.encrypted) {
            messageClasses.push('encrypted');
        }
        
        messageElement.className = messageClasses.join(' ');
        
        // Add message ID for duplicate detection
        if (messageData.id) {
            messageElement.setAttribute('data-message-id', messageData.id);
        }
        
        // Format timestamp
        const timestamp = new Date(messageData.created_at * 1000 || messageData.timestamp).toLocaleTimeString();
        const pubkeyShort = messageData.pubkey ? messageData.pubkey.slice(0, 8) + '...' : 'unknown';
        
        // Show "Du" for own messages, otherwise show short pubkey
        const authorName = messageData.isOwn ? 'Du' : pubkeyShort;
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-author">${authorName}</span>
                <span class="message-time">${timestamp}</span>
                ${messageData.isOptimistic ? '<span class="message-status">📤</span>' : ''}
            </div>
            <div class="message-text">${this.escapeHtml(messageData.content)}</div>
        `;
        
        // Check if this is a new message (newer than last message)
        const existingMessages = messagesContainer.querySelectorAll('.message');
        let inserted = false;
        
        if (existingMessages.length > 0) {
            // Find correct position to insert message in chronological order
            for (let i = 0; i < existingMessages.length; i++) {
                const existingElement = existingMessages[i];
                const existingId = existingElement.getAttribute('data-message-id');
                
                if (existingId) {
                    // Find the existing message in roomMessages
                    const roomMessageMap = this.roomMessages.get(this.currentRoom);
                    if (roomMessageMap && roomMessageMap.has(existingId)) {
                        const existingMessage = roomMessageMap.get(existingId);
                        
                        // If new message is older, insert before this element
                        if (messageData.created_at < existingMessage.created_at) {
                            messagesContainer.insertBefore(messageElement, existingElement);
                            inserted = true;
                            break;
                        }
                    }
                }
            }
        }
        
        // If not inserted yet, append at the end (newest messages)
        if (!inserted) {
            messagesContainer.appendChild(messageElement);
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        console.log(`💬 Nachricht ${inserted ? 'eingefügt' : 'angehängt'} (${messageData.isOwn ? 'eigene' : 'fremde'}): ${messageData.content.slice(0, 50)}...`);
        
        // Update room message count
        this.updateRoomMessageCount(this.currentRoom);
    }

    switchTab(tabName) {
        // Update tab buttons
        const roomsTab = this.element.querySelector('#roomsTab');
        const dmsTab = this.element.querySelector('#dmsTab');
        const roomsContent = this.element.querySelector('#roomsContent');
        const dmsContent = this.element.querySelector('#dmsContent');

        if (tabName === 'rooms') {
            roomsTab.classList.add('active');
            dmsTab.classList.remove('active');
            roomsContent.classList.add('active');
            dmsContent.classList.remove('active');
            this.currentView = 'room';
            
            // Update input placeholder
            const input = this.element.querySelector('#messageInput');
            input.placeholder = 'Nachricht in öffentlichen Raum schreiben...';
        } else if (tabName === 'dms') {
            dmsTab.classList.add('active');
            roomsTab.classList.remove('active');
            dmsContent.classList.add('active');
            roomsContent.classList.remove('active');
            this.currentView = 'dm';
            
            // Update input placeholder
            const input = this.element.querySelector('#messageInput');
            input.placeholder = 'Verschlüsselte Nachricht schreiben...';
            
            // Subscribe to DMs if not already subscribed
            if (this.nostrService) {
                this.nostrService.subscribeToDirectMessages();
            }
        }
    }

    async startDirectMessage() {
        const input = this.element.querySelector('#dmUserInput');
        const userInput = input.value.trim();
        
        if (!userInput) {
            this.toastService.showError('Bitte gib einen npub oder pubkey ein');
            return;
        }

        try {
            let pubkey = userInput;
            
            // Convert npub to hex if needed
            if (userInput.startsWith('npub')) {
                const { decode } = await import('nostr-tools/nip19');
                const decoded = decode(userInput);
                pubkey = decoded.data;
            }
            
            // Add to contacts
            this.addDMContact(pubkey);
            
            // Open DM
            this.openDirectMessage(pubkey);
            
            // Clear input
            input.value = '';
            
        } catch (error) {
            console.error('❌ Fehler beim Starten der DM:', error);
            this.toastService.showError('Ungültiger npub oder pubkey');
        }
    }

    addDMContact(pubkey) {
        if (!this.dmContacts.has(pubkey)) {
            this.dmContacts.set(pubkey, {
                pubkey: pubkey,
                name: `User ${pubkey.substring(0, 8)}...`,
                lastMessage: null,
                unreadCount: 0
            });
            this.updateDMContactsList();
        }
    }

    updateDMContactsList() {
        const dmContacts = this.element.querySelector('#dmContacts');
        
        if (this.dmContacts.size === 0) {
            dmContacts.innerHTML = `
                <div class="no-contacts">
                    <p>Keine DM-Kontakte</p>
                    <small>Gib einen npub oder pubkey ein, um eine verschlüsselte Unterhaltung zu starten</small>
                </div>
            `;
            return;
        }

        let html = '';
        this.dmContacts.forEach((contact, pubkey) => {
            const isActive = this.currentDMUser === pubkey ? 'active' : '';
            html += `
                <div class="dm-contact ${isActive}" data-pubkey="${pubkey}">
                    <div class="contact-info">
                        <div class="contact-name">${contact.name}</div>
                        <div class="contact-pubkey">${pubkey.substring(0, 16)}...</div>
                    </div>
                    <div class="contact-status">
                        ${contact.unreadCount > 0 ? `<span class="unread-badge">${contact.unreadCount}</span>` : ''}
                        <span class="contact-last-message">${contact.lastMessage || ''}</span>
                        <span class="encrypted-badge">🔐</span>
                    </div>
                </div>
            `;
        });

        dmContacts.innerHTML = html;
    }

    openDirectMessage(pubkey) {
        this.currentDMUser = pubkey;
        this.currentView = 'dm';
        
        // Update active contact
        this.updateDMContactsList();
        
        // Update chat title
        const chatTitle = this.element.querySelector('#chatTitle');
        const contact = this.dmContacts.get(pubkey);
        chatTitle.textContent = `🔐 ${contact ? contact.name : 'Encrypted DM'}`;
        
        // Clear messages area and show DM messages
        this.clearMessages();
        this.loadDMMessages(pubkey);
        
        // Update input placeholder
        const input = this.element.querySelector('#messageInput');
        input.placeholder = 'Verschlüsselte Nachricht schreiben...';
        
        // Mark as read
        if (contact) {
            contact.unreadCount = 0;
            this.updateDMContactsList();
        }
    }

    loadDMMessages(pubkey) {
        const messagesContainer = this.element.querySelector('#messages');
        messagesContainer.innerHTML = `
            <div class="welcome">
                <h3>🔐 Verschlüsselte Unterhaltung</h3>
                <p>Alle Nachrichten sind End-to-End verschlüsselt (NIP-04)</p>
                <small>Pubkey: ${pubkey}</small>
            </div>
        `;

        // Load existing DM messages for this contact
        const userMessages = this.dmMessages.get(pubkey) || [];
        userMessages.forEach(message => {
            this.renderMessage(message);
        });
    }

    handleNewDirectMessage(message) {
        // Add to DM messages
        const pubkey = message.authorPubkey;
        if (!this.dmMessages.has(pubkey)) {
            this.dmMessages.set(pubkey, []);
        }
        this.dmMessages.get(pubkey).push(message);
        
        // Add to contacts if not exists
        this.addDMContact(pubkey);
        
        // Update unread count if not current conversation
        if (this.currentView !== 'dm' || this.currentDMUser !== pubkey) {
            const contact = this.dmContacts.get(pubkey);
            if (contact) {
                contact.unreadCount = (contact.unreadCount || 0) + 1;
                contact.lastMessage = message.content;
                this.updateDMContactsList();
            }
        }
        
        // Show message if current conversation
        if (this.currentView === 'dm' && this.currentDMUser === pubkey) {
            this.renderMessage(message);
        }
        
        // Show notification
        this.toastService.showInfo(`🔐 Neue verschlüsselte Nachricht von ${message.author}`);
    }

    clearMessages() {
        const messagesContainer = this.element.querySelector('#messages');
        messagesContainer.innerHTML = '';
    }

    updateRoomMessageCount(roomId) {
        // Get the room element
        const roomElement = this.element.querySelector(`[data-room="${roomId}"]`);
        if (!roomElement) return;

        // Count messages for this room
        const roomMessages = this.roomMessages.get(roomId);
        const messageCount = roomMessages ? roomMessages.size : 0;

        // Update the room status to show message count
        const roomStatus = roomElement.querySelector('.room-status');
        if (roomStatus) {
            const roomInfo = this.predefinedRooms.find(r => r.id === roomId);
            const baseStatus = roomInfo ? roomInfo.description : 'Raum';
            roomStatus.textContent = messageCount > 0 ? `${baseStatus} (${messageCount})` : baseStatus;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    dispatchEvent(eventName, data = null) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    updateUserButton() {
        const userBtn = this.element.querySelector('#userBtn');
        const userProfile = this.nostrService.getUserProfile?.();
        
        if (userProfile && userProfile.pubkey) {
            // Show first 4 characters of pubkey in button - dezent
            const pubkeyShort = userProfile.pubkey.substring(0, 4);
            userBtn.innerHTML = `👤 <span style="font-size: 0.8em; color: #666; margin-left: 2px;">${pubkeyShort}</span>`;
            userBtn.title = `Dein Profil (${pubkeyShort}...)`;
        } else {
            userBtn.innerHTML = '👤';
            userBtn.title = 'Dein Profil';
        }
    }

    showUserProfile() {
        const userProfile = this.nostrService.getUserProfile?.();
        if (!userProfile) {
            this.toastService.showError('Benutzer-Profil nicht verfügbar');
            return;
        }

        // Get user's public key in different formats
        const hexPubkey = userProfile.pubkey;
        
        // Show user profile modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        `;

        modalContent.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #333;">👤 Dein NOSTR Profil</h3>
                <button id="closeProfileModal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong>🔑 Öffentlicher Schlüssel (hex):</strong>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-top: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
                    ${hexPubkey || 'Nicht verfügbar'}
                </div>
                <button id="copyHexKey" style="margin-top: 5px; padding: 5px 10px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">📋 Kopieren</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong>🔑 Öffentlicher Schlüssel (npub):</strong>
                <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-top: 5px; word-break: break-all; font-family: monospace; font-size: 12px;">
                    <span id="npubDisplay">Konvertiere...</span>
                </div>
                <button id="copyNpubKey" style="margin-top: 5px; padding: 5px 10px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">📋 Kopieren</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <strong>✅ Status:</strong> ${userProfile.pubkey ? 'Angemeldet' : 'Nicht angemeldet'}
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
                💡 Teile deinen npub mit anderen, um verschlüsselte Nachrichten zu empfangen!
            </p>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Convert npub after modal is created
        this.convertToNpub(hexPubkey);

        // Event listeners for the modal
        const closeBtn = modalContent.querySelector('#closeProfileModal');
        const copyHexBtn = modalContent.querySelector('#copyHexKey');
        const copyNpubBtn = modalContent.querySelector('#copyNpubKey');

        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        copyHexBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(hexPubkey).then(() => {
                this.toastService.showSuccess('Hex-Schlüssel kopiert!');
            }).catch(() => {
                this.toastService.showError('Kopieren fehlgeschlagen');
            });
        });

        copyNpubBtn.addEventListener('click', () => {
            const currentNpub = document.querySelector('#npubDisplay').textContent;
            if (currentNpub && currentNpub !== 'Konvertiere...' && currentNpub !== 'Konvertierung fehlgeschlagen') {
                navigator.clipboard.writeText(currentNpub).then(() => {
                    this.toastService.showSuccess('npub-Schlüssel kopiert!');
                }).catch(() => {
                    this.toastService.showError('Kopieren fehlgeschlagen');
                });
            } else {
                this.toastService.showError('npub noch nicht verfügbar');
            }
        });

        // Close modal with Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    async convertToNpub(hexPubkey) {
        const npubDisplay = document.querySelector('#npubDisplay');
        if (!npubDisplay || !hexPubkey) return;

        try {
            console.log('🔄 Konvertiere hex zu npub:', hexPubkey);
            
            // Method 1: Try with correct nostr-tools v2.15.0 import structure
            try {
                const nip19Module = await import('nostr-tools/nip19');
                console.log('📦 nip19 module loaded:', nip19Module);
                
                // In nostr-tools v2.15.0, the correct structure is:
                let npub;
                if (nip19Module.npubEncode) {
                    // Try new API first
                    npub = nip19Module.npubEncode(hexPubkey);
                } else if (nip19Module.encode) {
                    // Try old API
                    npub = nip19Module.encode('npub', hexPubkey);
                } else {
                    // Try default export
                    const { npubEncode } = nip19Module.default || nip19Module;
                    if (npubEncode) {
                        npub = npubEncode(hexPubkey);
                    } else {
                        throw new Error('No encoding function found in nip19 module');
                    }
                }
                
                console.log('✅ npub konvertiert:', npub);
                npubDisplay.textContent = npub;
                return;
                
            } catch (importError) {
                console.warn('⚠️ nip19 module import failed:', importError);
                throw importError;
            }
            
        } catch (error) {
            console.error('❌ Fehler bei npub-Konvertierung:', error);
            
            // Method 2: Try with main nostr-tools import
            try {
                console.log('🔄 Versuche mit main nostr-tools import...');
                const nostrTools = await import('nostr-tools');
                console.log('📦 nostr-tools loaded:', nostrTools);
                
                let npub;
                if (nostrTools.nip19 && nostrTools.nip19.npubEncode) {
                    npub = nostrTools.nip19.npubEncode(hexPubkey);
                } else if (nostrTools.nip19 && nostrTools.nip19.encode) {
                    npub = nostrTools.nip19.encode('npub', hexPubkey);
                } else if (nostrTools.npubEncode) {
                    npub = nostrTools.npubEncode(hexPubkey);
                } else {
                    throw new Error('No encoding function found in nostr-tools');
                }
                
                console.log('✅ npub mit nostr-tools konvertiert:', npub);
                npubDisplay.textContent = npub;
                return;
                
            } catch (toolsError) {
                console.warn('⚠️ nostr-tools import failed:', toolsError);
                
                // Method 3: Try with window object fallback
                try {
                    console.log('🔄 Versuche window.NostrTools...');
                    if (window.NostrTools && window.NostrTools.nip19) {
                        let npub;
                        if (window.NostrTools.nip19.npubEncode) {
                            npub = window.NostrTools.nip19.npubEncode(hexPubkey);
                        } else if (window.NostrTools.nip19.encode) {
                            npub = window.NostrTools.nip19.encode('npub', hexPubkey);
                        } else {
                            throw new Error('No encoding function in window.NostrTools.nip19');
                        }
                        console.log('✅ npub mit window.NostrTools konvertiert:', npub);
                        npubDisplay.textContent = npub;
                        return;
                    } else {
                        throw new Error('window.NostrTools.nip19 not available');
                    }
                } catch (windowError) {
                    console.warn('⚠️ window.NostrTools failed:', windowError);
                    
                    // Method 4: Try nostrService fallback
                    try {
                        console.log('🔄 Versuche über nostrService...');
                        if (this.nostrService && typeof this.nostrService.encodeNpub === 'function') {
                            const npub = await this.nostrService.encodeNpub(hexPubkey);
                            if (npub) {
                                console.log('✅ npub mit nostrService konvertiert:', npub);
                                npubDisplay.textContent = npub;
                                return;
                            } else {
                                throw new Error('nostrService.encodeNpub returned null');
                            }
                        } else {
                            throw new Error('nostrService.encodeNpub not available');
                        }
                    } catch (serviceError) {
                        console.warn('⚠️ nostrService failed:', serviceError);
                        
                        // Final fallback - show helpful error message
                        console.log('🔄 Alle Methoden fehlgeschlagen, zeige Fehlermeldung');
                        npubDisplay.innerHTML = `
                            <div style="color: #e74c3c; font-size: 12px;">
                                npub-Konvertierung nicht verfügbar
                            </div>
                            <div style="font-size: 11px; color: #666; margin-top: 5px;">
                                Verwende den hex-Schlüssel oben für den Import
                            </div>
                        `;
                    }
                }
            }
        }
    }

    hexToNpub(hexPubkey) {
        try {
            console.log('🔄 hexToNpub fallback für:', hexPubkey);
            
            // Method 1: Try window.NostrTools with new API
            if (window.NostrTools && window.NostrTools.nip19) {
                let npub;
                if (window.NostrTools.nip19.npubEncode) {
                    npub = window.NostrTools.nip19.npubEncode(hexPubkey);
                } else if (window.NostrTools.nip19.encode) {
                    npub = window.NostrTools.nip19.encode('npub', hexPubkey);
                } else {
                    throw new Error('No encoding function in window.NostrTools.nip19');
                }
                console.log('✅ hexToNpub mit window.NostrTools:', npub);
                return npub;
            }
            
            // Method 2: Try accessing through global nostr object
            if (typeof window !== 'undefined' && window.nostr && window.nostr.nip19) {
                let npub;
                if (window.nostr.nip19.npubEncode) {
                    npub = window.nostr.nip19.npubEncode(hexPubkey);
                } else if (window.nostr.nip19.encode) {
                    npub = window.nostr.nip19.encode('npub', hexPubkey);
                } else {
                    throw new Error('No encoding function in window.nostr.nip19');
                }
                console.log('✅ hexToNpub mit window.nostr:', npub);
                return npub;
            }
            
            // Method 3: Try accessing through module cache or global
            if (typeof window !== 'undefined' && window.npubEncode) {
                const npub = window.npubEncode(hexPubkey);
                console.log('✅ hexToNpub mit window.npubEncode:', npub);
                return npub;
            }
            
            console.warn('⚠️ Keine verfügbare Methode für npub-Konvertierung gefunden');
            return null;
            
        } catch (error) {
            console.error('❌ hexToNpub fehlgeschlagen:', error);
            return null;
        }
    }
}
