// =================================================================
// UI Manager - Professional Chat Interface
// =================================================================

export class UIManager {
    constructor() {
        this.components = new Map();
        this.modals = new Map();
        this.toast = null;
        this.eventListeners = new Map();
        this.messages = [];
        this.services = null;
    }

    async init() {
        console.log('🎨 Initialisiere Professional Chat UI...');
        
        // Create the professional chat interface
        await this.createChatInterface();
        
        // Initialize event listeners
        this.setupEventListeners();
        
        // Create toast container
        this.createToastContainer();
        
        console.log('✅ Professional Chat UI initialisiert');
    }

    setServices(services) {
        this.services = services;
    }

    async createChatInterface() {
        const appContainer = document.getElementById('app');
        if (!appContainer) {
            console.error('❌ App container nicht gefunden');
            return;
        }

        appContainer.innerHTML = `
            <div class="chat-app">
                <!-- Header -->
                <div class="app-header">
                    <div class="app-title">
                        <h1>🌟 NOSTR Chat</h1>
                        <div class="connection-status" id="connectionStatus">
                            <span class="status-dot offline"></span>
                            <span class="status-text">Offline</span>
                        </div>
                    </div>
                    <div class="app-controls">
                        <button id="settingsBtn" class="btn btn-secondary">⚙️ Einstellungen</button>
                        <button id="profileBtn" class="btn btn-secondary">👤 Profil</button>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="app-content">
                    <!-- Key Setup Screen -->
                    <div id="keySetupScreen" class="screen">
                        <div class="setup-container">
                            <h2>🔑 Schlüssel einrichten</h2>
                            <p>Um NOSTR zu nutzen, benötigen Sie ein Schlüsselpaar.</p>
                            
                            <div class="setup-options">
                                <div class="option-card">
                                    <h3>Neue Schlüssel generieren</h3>
                                    <p>Erstellen Sie ein neues Schlüsselpaar</p>
                                    <button id="generateKeysBtn" class="btn btn-primary">
                                        🔑 Schlüssel generieren
                                    </button>
                                </div>
                                
                                <div class="option-card">
                                    <h3>Schlüssel importieren</h3>
                                    <p>Importieren Sie einen vorhandenen privaten Schlüssel</p>
                                    <input type="password" id="importNsecInput" placeholder="nsec1..." class="form-input">
                                    <button id="importKeysBtn" class="btn btn-secondary">
                                        📥 Schlüssel importieren
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Chat Interface -->
                    <div id="chatInterface" class="screen hidden">
                        <div class="chat-layout">
                            <!-- Sidebar -->
                            <div class="chat-sidebar">
                                <div class="sidebar-header">
                                    <h3>💬 Kontakte</h3>
                                    <button id="addContactBtn" class="btn btn-small">➕</button>
                                </div>
                                <div class="contacts-list" id="contactsList">
                                    <div class="contact-item active">
                                        <div class="contact-avatar">🌐</div>
                                        <div class="contact-info">
                                            <div class="contact-name">Öffentlicher Chat</div>
                                            <div class="contact-status">Online</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Chat Area -->
                            <div class="chat-area">
                                <div class="chat-header">
                                    <div class="chat-info">
                                        <h3 id="chatTitle">Öffentlicher Chat</h3>
                                        <span id="chatStatus" class="chat-status">Online</span>
                                    </div>
                                </div>

                                <div class="messages-container" id="messagesContainer">
                                    <div class="welcome-message">
                                        <div class="welcome-icon">🎉</div>
                                        <h3>Willkommen im NOSTR Chat!</h3>
                                        <p>Beginnen Sie eine Unterhaltung oder verbinden Sie sich mit Relays.</p>
                                    </div>
                                </div>

                                <div class="message-input-container">
                                    <input type="text" id="messageInput" placeholder="Nachricht schreiben..." class="message-input">
                                    <button id="sendMessageBtn" class="btn btn-primary">Senden</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Loading Overlay -->
                <div id="loadingOverlay" class="loading-overlay hidden">
                    <div class="loading-spinner"></div>
                    <p id="loadingText">Wird geladen...</p>
                </div>
            </div>
        `;

        console.log('✅ Chat Interface HTML erstellt');
    }

    getComponent(name) {
        return this.components.get(name);
    }

    // =================================================================
    // Screen Management
    // =================================================================

    showLoading() {
        this.hideAllScreens();
        this.showComponent('loadingScreen');
    }

    showSetup() {
        this.hideAllScreens();
        this.showComponent('setupScreen');
    }

    showMainApp() {
        this.hideAllScreens();
        this.showComponent('mainApp');
    }

    hideAllScreens() {
        ['loadingScreen', 'setupScreen', 'mainApp'].forEach(screen => {
            this.hideComponent(screen);
        });
    }

    showComponent(name) {
        const component = this.getComponent(name);
        if (component) {
            component.style.display = 'block';
            component.classList.remove('hidden');
        }
    }

    hideComponent(name) {
        const component = this.getComponent(name);
        if (component) {
            component.style.display = 'none';
            component.classList.add('hidden');
        }
    }

    // =================================================================
    // Event Listeners
    // =================================================================

    setupEventListeners() {
        console.log('🔗 Setze Event Listeners...');
        
        // Key setup handlers
        this.addEventListenerSafe('generateKeysBtn', 'click', () => {
            this.handleGenerateKeys();
        });

        this.addEventListenerSafe('importKeysBtn', 'click', () => {
            this.handleImportKeys();
        });

        // Chat handlers
        this.addEventListenerSafe('sendMessageBtn', 'click', () => {
            this.handleSendMessage();
        });

        this.addEventListenerSafe('messageInput', 'keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });

        // Settings handlers
        this.addEventListenerSafe('settingsBtn', 'click', () => {
            this.showSettings();
        });

        this.addEventListenerSafe('profileBtn', 'click', () => {
            this.showProfile();
        });

        console.log('✅ Event Listeners konfiguriert');
    }

    addEventListenerSafe(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`✅ Event Listener für ${elementId} hinzugefügt`);
        } else {
            console.warn(`⚠️ Element ${elementId} nicht gefunden`);
        }
    }

    // Screen Management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }

    showKeySetup() {
        this.showScreen('keySetupScreen');
        console.log('🔑 Zeige Schlüssel-Setup Screen');
    }

    showChatInterface() {
        this.showScreen('chatInterface');
        console.log('💬 Zeige Chat Interface');
    }

    showLoading(text = 'Wird geladen...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingText) loadingText.textContent = text;
        if (overlay) overlay.classList.remove('hidden');
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('hidden');
    }

    // Event Handlers
    async handleGenerateKeys() {
        if (!this.services || !this.services.key) {
            console.error('❌ KeyService nicht verfügbar');
            return;
        }

        try {
            this.showLoading('Generiere Schlüssel...');
            const keyPair = await this.services.key.generateKeyPair();
            this.hideLoading();
            
            if (keyPair) {
                this.services.toast?.success('✅ Schlüssel erfolgreich generiert!');
                this.showChatInterface();
                
                // Connect to relays
                if (this.services.relay) {
                    await this.services.relay.connect();
                }
            }
        } catch (error) {
            this.hideLoading();
            console.error('❌ Fehler beim Generieren der Schlüssel:', error);
            this.services.toast?.error('Fehler beim Generieren der Schlüssel: ' + error.message);
        }
    }

    async handleImportKeys() {
        const nsecInput = document.getElementById('importNsecInput');
        if (!nsecInput) return;

        const nsec = nsecInput.value.trim();
        if (!nsec) {
            this.services.toast?.error('Bitte geben Sie einen privaten Schlüssel ein');
            return;
        }

        if (!this.services || !this.services.key) {
            console.error('❌ KeyService nicht verfügbar');
            return;
        }

        try {
            this.showLoading('Importiere Schlüssel...');
            const keyPair = await this.services.key.importKeys(nsec);
            this.hideLoading();
            
            if (keyPair) {
                this.services.toast?.success('✅ Schlüssel erfolgreich importiert!');
                this.showChatInterface();
                
                // Connect to relays
                if (this.services.relay) {
                    await this.services.relay.connect();
                }
            }
        } catch (error) {
            this.hideLoading();
            console.error('❌ Fehler beim Importieren der Schlüssel:', error);
            this.services.toast?.error('Fehler beim Importieren der Schlüssel: ' + error.message);
        }
    }

    async handleSendMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        const message = messageInput.value.trim();
        if (!message) return;

        try {
            // Send message through NOSTR service
            if (this.services && this.services.nostr) {
                await this.services.nostr.sendMessage(message);
            }
            
            // Clear input
            messageInput.value = '';
            
            // Add to local messages
            this.addMessage({
                content: message,
                timestamp: Date.now(),
                sender: 'self',
                type: 'text'
            });
            
        } catch (error) {
            console.error('❌ Fehler beim Senden der Nachricht:', error);
            this.services.toast?.error('Fehler beim Senden der Nachricht: ' + error.message);
        }
    }

    addMessage(message) {
        this.messages.push(message);
        this.renderMessages();
    }

    renderMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        // Clear welcome message if it exists
        const welcomeMessage = container.querySelector('.welcome-message');
        if (welcomeMessage && this.messages.length > 0) {
            welcomeMessage.remove();
        }

        if (this.messages.length === 0) return;

        container.innerHTML = this.messages.map(msg => {
            const isOwnMessage = msg.sender === 'self';
            const time = new Date(msg.timestamp).toLocaleTimeString();
            
            return `
                <div class="message ${isOwnMessage ? 'own' : 'other'}">
                    <div class="message-content">
                        <div class="message-text">${this.escapeHtml(msg.content)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        const dot = statusElement.querySelector('.status-dot');
        const text = statusElement.querySelector('.status-text');

        if (status.connected > 0) {
            if (dot) dot.className = 'status-dot online';
            if (text) text.textContent = `Online (${status.connected} Relays)`;
        } else {
            if (dot) dot.className = 'status-dot offline';
            if (text) text.textContent = 'Offline';
        }
    }

    showSettings() {
        this.services.toast?.info('Einstellungen werden geladen...');
        // TODO: Implement settings modal
    }

    showProfile() {
        this.services.toast?.info('Profil wird geladen...');
        // TODO: Implement profile modal
    }

    // =================================================================
    // Modal Management
    // =================================================================

    createModal(id, title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = `modal-${id}`;
        
        modal.innerHTML = `
            <div class="modal-overlay" data-close-modal="${id}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" data-close-modal="${id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modals.set(id, modal);

        // Add event listeners
        modal.addEventListener('click', (e) => {
            if (e.target.dataset.closeModal === id || e.target.closest(`[data-close-modal="${id}"]`)) {
                this.closeModal(id);
            }
        });

        return modal;
    }

    showModal(titleOrId, content = null, buttons = null) {
        // If called with just ID (legacy usage)
        if (content === null && buttons === null) {
            const modal = this.modals.get(titleOrId);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                
                // Focus trap
                setTimeout(() => {
                    const firstFocusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
                    if (firstFocusable) {
                        firstFocusable.focus();
                    }
                }, 100);
            }
            return;
        }

        // New usage: showModal(title, content, buttons)
        const modalId = 'dynamic-modal';
        
        // Remove existing modal if present
        this.removeModal(modalId);
        
        // Create new modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = `modal-${modalId}`;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${titleOrId}</h3>
                    <button class="modal-close" data-close-modal="${modalId}">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer" id="modal-footer-${modalId}">
                    <!-- Dynamic buttons -->
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(modal);
        this.modals.set(modalId, modal);
        
        // Add buttons if provided
        if (buttons && Array.isArray(buttons)) {
            const footer = modal.querySelector(`#modal-footer-${modalId}`);
            buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = `btn ${button.class || 'btn-secondary'}`;
                btn.textContent = button.text || 'OK';
                btn.addEventListener('click', () => {
                    if (button.click) {
                        button.click();
                    }
                });
                footer.appendChild(btn);
            });
        }
        
        // Setup close handlers
        const closeButton = modal.querySelector('.modal-close');
        closeButton.addEventListener('click', () => {
            this.hideModal();
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
        
        // ESC key to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus trap
        setTimeout(() => {
            const firstFocusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }, 100);
    }

    hideModal() {
        const modal = this.modals.get('dynamic-modal');
        if (modal) {
            modal.remove();
            this.modals.delete('dynamic-modal');
            document.body.style.overflow = '';
        }
    }

    closeModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    removeModal(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.remove();
            this.modals.delete(id);
        }
    }

    // =================================================================
    // Toast Notifications
    // =================================================================

    createToastContainer() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
            this.toast = container;
        }
    }

    showToast(message, type = 'info', duration = 5000) {
        if (!this.toast) this.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="toast-content">
                <i class="${icon}"></i>
                <span>${message}</span>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add to container
        this.toast.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });

        return toast;
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // =================================================================
    // Message Handling
    // =================================================================

    handleMessageInput(e) {
        const input = e.target;
        const sendButton = this.getComponent('sendButton');
        
        if (sendButton) {
            sendButton.disabled = !input.value.trim();
        }

        // Auto-resize textarea
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    sendMessage() {
        const messageInput = this.getComponent('messageInput');
        const message = messageInput?.value?.trim();
        
        if (!message) return;

        // Emit event for app to handle
        this.emit('sendMessage', { message });
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Disable send button
        const sendButton = this.getComponent('sendButton');
        if (sendButton) {
            sendButton.disabled = true;
        }
    }

    // =================================================================
    // Room Management UI
    // =================================================================

    renderRoomList(rooms, currentRoomId = null) {
        const roomList = this.getComponent('roomList');
        if (!roomList) return;

        roomList.innerHTML = '';

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = `room-item ${room.id === currentRoomId ? 'active' : ''}`;
            roomElement.dataset.roomId = room.id;
            
            roomElement.innerHTML = `
                <div class="room-avatar">
                    <i class="fas ${room.type === 'direct' ? 'fa-user' : 'fa-hashtag'}"></i>
                </div>
                <div class="room-info">
                    <div class="room-name">${this.escapeHtml(room.name)}</div>
                    <div class="room-last-message">${room.lastMessage || 'Noch keine Nachrichten'}</div>
                </div>
                <div class="room-meta">
                    ${room.unreadCount ? `<span class="unread-count">${room.unreadCount}</span>` : ''}
                    <span class="room-time">${this.formatTime(room.lastActivity)}</span>
                </div>
            `;

            roomElement.addEventListener('click', () => {
                this.emit('roomSelected', { roomId: room.id });
            });

            roomList.appendChild(roomElement);
        });
    }

    // =================================================================
    // Message Display
    // =================================================================

    renderMessages(messages, currentUserPubkey) {
        const messageContainer = this.getComponent('messageContainer');
        if (!messageContainer) return;

        // Clear welcome message
        messageContainer.innerHTML = '';

        if (messages.length === 0) {
            messageContainer.innerHTML = `
                <div class="welcome-message">
                    <h3>Willkommen im Chat! 🎉</h3>
                    <p>Schreibe eine Nachricht, um die Unterhaltung zu beginnen.</p>
                </div>
            `;
            return;
        }

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message, currentUserPubkey);
            messageContainer.appendChild(messageElement);
        });

        // Scroll to bottom
        this.scrollToBottom();
    }

    createMessageElement(message, currentUserPubkey) {
        const isOwnMessage = message.authorPubkey === currentUserPubkey;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwnMessage ? 'own' : ''}`;
        messageElement.dataset.messageId = message.id;
        
        const avatar = isOwnMessage ? '👤' : '👥';
        const authorName = message.author || 'Unbekannt';
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${this.escapeHtml(authorName)}</span>
                    <span class="message-time">${timestamp}</span>
                </div>
                <div class="message-text">${this.escapeHtml(message.content)}</div>
                ${message.encrypted ? '<div class="message-encryption">🔒 Verschlüsselt</div>' : ''}
            </div>
        `;

        return messageElement;
    }

    addMessage(message, currentUserPubkey) {
        const messageContainer = this.getComponent('messageContainer');
        if (!messageContainer) return;

        const messageElement = this.createMessageElement(message, currentUserPubkey);
        messageContainer.appendChild(messageElement);
        
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messageContainer = this.getComponent('messageContainer');
        if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    }

    // =================================================================
    // Status Updates
    // =================================================================

    updateConnectionStatus(status, relayCount = 0) {
        const statusIndicator = this.getComponent('connectionStatus');
        const statusText = this.getComponent('connectionText');
        
        if (!statusIndicator || !statusText) return;

        const statusConfig = {
            connected: { class: 'online', text: `Verbunden (${relayCount} Relays)` },
            connecting: { class: 'connecting', text: 'Verbinde...' },
            disconnected: { class: 'offline', text: 'Getrennt' }
        };

        const config = statusConfig[status] || statusConfig.disconnected;
        
        statusIndicator.className = `status-indicator ${config.class}`;
        statusText.textContent = config.text;
    }

    updateUserProfile(profile) {
        const userName = this.getComponent('userName');
        const userNpub = this.getComponent('userNpub');
        
        if (userName) {
            userName.textContent = profile.name || 'DreamMall User';
        }
        
        if (userNpub) {
            userNpub.textContent = profile.npub ? profile.npub.slice(0, 16) + '...' : 'npub...';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =================================================================
    // User Interface Updates
    // =================================================================

    updateUserInfo(profile) {
        const userNameElement = this.getComponent('user-name');
        const userNpubElement = this.getComponent('user-npub');
        
        if (userNameElement) {
            userNameElement.textContent = profile.displayName || profile.name || 'Benutzer';
        }
        
        if (userNpubElement) {
            const npub = profile.npub || 'npub...';
            userNpubElement.textContent = npub.substring(0, 16) + '...';
            userNpubElement.title = npub; // Full npub on hover
        }
        
        console.log('✅ Benutzer-Info aktualisiert:', profile);
    }

    updateRoomsList(rooms) {
        const roomsListElement = this.getComponent('rooms-list');
        if (!roomsListElement) return;
        
        roomsListElement.innerHTML = '';
        
        if (rooms.size === 0) {
            roomsListElement.innerHTML = `
                <div class="empty-state">
                    <p>Keine Räume vorhanden</p>
                    <button id="create-first-room" class="btn btn-sm btn-primary">
                        Ersten Raum erstellen
                    </button>
                </div>
            `;
            return;
        }
        
        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            roomElement.dataset.roomId = room.id;
            
            roomElement.innerHTML = `
                <div class="room-avatar">
                    ${room.name.charAt(0).toUpperCase()}
                </div>
                <div class="room-info">
                    <div class="room-name">${room.name}</div>
                    <div class="room-last-message">
                        ${room.lastMessage || 'Noch keine Nachrichten'}
                    </div>
                </div>
                <div class="room-meta">
                    <span class="room-time">
                        ${room.lastActivity ? this.formatTime(room.lastActivity) : ''}
                    </span>
                    ${room.unreadCount > 0 ? `<span class="unread-badge">${room.unreadCount}</span>` : ''}
                </div>
            `;
            
            roomElement.addEventListener('click', () => {
                this.selectRoom(room.id);
            });
            
            roomsListElement.appendChild(roomElement);
        });
        
        console.log('✅ Räume-Liste aktualisiert:', rooms.size, 'Räume');
    }

    selectRoom(roomId) {
        // Remove active class from all rooms
        document.querySelectorAll('.room-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected room
        const selectedRoom = document.querySelector(`[data-room-id="${roomId}"]`);
        if (selectedRoom) {
            selectedRoom.classList.add('active');
        }
        
        // Update chat header
        const room = this.findRoomById(roomId);
        if (room) {
            const roomNameElement = document.getElementById('current-room-name');
            const roomUsersElement = document.getElementById('current-room-users');
            
            if (roomNameElement) {
                roomNameElement.textContent = room.name;
            }
            
            if (roomUsersElement) {
                roomUsersElement.textContent = `${room.members?.length || 0} Benutzer`;
            }
        }
        
        // Emit room change event
        this.emit('roomChanged', { roomId });
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'gerade eben';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        return date.toLocaleDateString();
    }

    findRoomById(roomId) {
        // This would need to be connected to the actual rooms data
        // For now, return a placeholder
        return { id: roomId, name: 'Raum', members: [] };
    }

    // =================================================================
    // Event System
    // =================================================================

    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
        console.log('📡 Event emitted:', eventName, data);
    }

    // =================================================================
    // Loading States
    // =================================================================

    showLoadingInComponent(componentName, message = 'Lädt...') {
        const component = this.getComponent(componentName);
        if (!component) return;

        const loader = document.createElement('div');
        loader.className = 'component-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <i class="fas fa-spinner fa-spin"></i>
                <span>${message}</span>
            </div>
        `;

        component.appendChild(loader);
        return loader;
    }

    hideLoadingInComponent(componentName) {
        const component = this.getComponent(componentName);
        if (!component) return;

        const loader = component.querySelector('.component-loader');
        if (loader) {
            loader.remove();
        }
    }

    // =================================================================
    // Focus Management
    // =================================================================

    focusMessageInput() {
        const messageInput = this.getComponent('messageInput');
        if (messageInput) {
            messageInput.focus();
        }
    }

    clearMessageInput() {
        const messageInput = this.getComponent('messageInput');
        if (messageInput) {
            messageInput.value = '';
            messageInput.style.height = 'auto';
        }
    }

    // =================================================================
    // Loading State Management
    // =================================================================

    showLoadingState(message = 'Laden...') {
        const loadingScreen = this.getComponent('loadingScreen');
        if (loadingScreen) {
            const loadingMessage = loadingScreen.querySelector('.loading-message');
            if (loadingMessage) {
                loadingMessage.textContent = message;
            }
            loadingScreen.classList.add('active');
        }
    }

    hideLoadingState() {
        const loadingScreen = this.getComponent('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
        }
    }
}
