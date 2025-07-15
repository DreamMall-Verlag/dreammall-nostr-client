// =================================================================
// Chat Component - NIP-28 Public Chat Implementation
// Implements NIP-01 (Basic protocol) and NIP-28 (Public Chat)
// =================================================================

export class ChatComponent {
    constructor(nostrService, toastService) {
        this.nostrService = nostrService;
        this.toastService = toastService;
        this.element = null;
        this.currentRoom = 'dreammall-support';
        this.messages = new Map();
        this.sentMessages = new Set(); // Track sent messages to prevent duplicates
        this.roomMessages = new Map(); // Store messages per room for sorting
        this.predefinedRooms = [
            { id: 'dreammall-support', name: 'DreamMall Support', description: 'Technischer Support und Hilfe' },
            { id: 'dreammall-hilfe', name: 'DreamMall Hilfe', description: 'Allgemeine Fragen und Diskussionen' }
        ];
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = 'main';
        this.element.innerHTML = `
            <div class="sidebar">
                <div class="sidebar-header">
                    <h3>Chat-Räume</h3>
                </div>
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
            <div class="chat">
                <div class="chat-header">
                    <h3 id="chatTitle">DreamMall Support</h3>
                    <div class="chat-controls">
                        <button class="btn btn-sm" id="settingsBtn">⚙️</button>
                        <button class="btn btn-sm" id="relaysBtn">🔗</button>
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
        this.subscribeToMessages();
        return this.element;
    }

    setupEventListeners() {
        const sendBtn = this.element.querySelector('#sendBtn');
        const messageInput = this.element.querySelector('#messageInput');
        const settingsBtn = this.element.querySelector('#settingsBtn');
        const relaysBtn = this.element.querySelector('#relaysBtn');
        const roomList = this.element.querySelector('#roomList');

        sendBtn.addEventListener('click', () => this.handleSendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSendMessage();
        });

        settingsBtn.addEventListener('click', () => this.dispatchEvent('showSettings'));
        relaysBtn.addEventListener('click', () => this.dispatchEvent('showRelays'));

        roomList.addEventListener('click', (e) => {
            const roomElement = e.target.closest('.room');
            if (roomElement) {
                this.switchRoom(roomElement.dataset.room);
            }
        });
    }

    async handleSendMessage() {
        const input = this.element.querySelector('#messageInput');
        const message = input.value.trim();
        
        if (!message) return;

        try {
            console.log(`📤 Sende Nachricht in Raum: ${this.currentRoom}`);
            
            // Send message as plain text (no encryption for public rooms)
            const result = await this.nostrService.sendMessage(message, this.currentRoom, false);
            input.value = '';
            
            // Track this message to prevent duplicate display
            if (result && result.id) {
                this.sentMessages.add(result.id);
            }
            
            // Create a temporary ID for optimistic update
            const tempId = `temp_${Date.now()}_${Math.random()}`;
            this.sentMessages.add(tempId);
            
            // Add message to UI immediately (optimistic update)
            this.addMessage({
                id: tempId,
                content: message,
                pubkey: this.nostrService.getUserProfile?.()?.pubkey || 'unknown',
                created_at: Math.floor(Date.now() / 1000),
                isOwn: true,
                room: this.currentRoom,
                isOptimistic: true
            });
            
            this.toastService.showSuccess(`Nachricht in ${this.currentRoom} gesendet!`);
            console.log('✅ Nachricht erfolgreich gesendet');
            
        } catch (error) {
            console.error('❌ Nachricht senden fehlgeschlagen:', error);
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
        
        // Load messages for this room
        this.loadRoomMessages(roomName);
        
        // Subscribe to new messages for this room
        this.subscribeToRoom(roomName);
        
        console.log(`🏠 Wechsle zu Raum: ${roomName}`);
    }

    subscribeToMessages() {
        // Subscribe to messages using NIP-01 REQ for current room
        console.log(`🔔 Abonniere Nachrichten für Raum: ${this.currentRoom}`);
        
        // Make sure NostrService is ready
        if (!this.nostrService || !this.nostrService.pool) {
            console.warn('⚠️ NostrService nicht bereit, verzögere Subscription...');
            setTimeout(() => this.subscribeToMessages(), 1000);
            return;
        }
        
        this.nostrService.subscribeToRoom(this.currentRoom, (event) => {
            console.log('📨 Nachricht erhalten in subscribeToMessages:', event);
            this.handleNewMessage(event);
        });
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
        
        // Load messages from nostr service
        this.nostrService.loadRoomMessages(roomName, (messages) => {
            // Clear welcome message
            messagesContainer.innerHTML = '';
            
            // Store messages in room-specific collection
            const roomMessageMap = this.roomMessages.get(roomName);
            messages.forEach(message => {
                const messageId = message.id || message.pubkey + message.created_at;
                roomMessageMap.set(messageId, message);
            });
            
            // Render messages sorted by timestamp
            this.renderMessagesInOrder(roomName);
        });
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
        messageElement.className = `message ${messageData.isOwn ? 'user' : 'other'}`;
        
        // Add message ID for duplicate detection
        if (messageData.id) {
            messageElement.setAttribute('data-message-id', messageData.id);
        }
        
        // Format timestamp
        const timestamp = new Date(messageData.created_at * 1000).toLocaleTimeString();
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

    updateRoomMessageCount(roomName) {
        const room = this.element.querySelector(`[data-room="${roomName}"]`);
        if (room) {
            const statusElement = room.querySelector('.room-status');
            const currentCount = parseInt(statusElement.textContent) || 0;
            statusElement.textContent = `${currentCount + 1} Nachrichten`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }

    clearMessages() {
        const messagesContainer = this.element.querySelector('#messages');
        messagesContainer.innerHTML = `
            <div class="welcome">
                <h3>Willkommen im ${this.currentRoom}! 🎉</h3>
                <p>Lade Nachrichten...</p>
            </div>
        `;
        
        // Clear sent messages tracking for new room
        this.sentMessages.clear();
        
        // Clear room message storage
        if (this.roomMessages.has(this.currentRoom)) {
            this.roomMessages.get(this.currentRoom).clear();
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}
