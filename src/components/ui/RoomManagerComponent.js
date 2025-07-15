// =================================================================
// Room Management Component - Modulare Raum-Verwaltung
// =================================================================

import { ModalComponent } from './ModalComponent.js';

export class RoomManagerComponent {
    constructor(nip28, toastService) {
        this.nip28 = nip28;
        this.toastService = toastService;
        this.modal = new ModalComponent();
        
        this.publicRooms = [
            { id: 'dreammall-support', name: 'DreamMall Support', description: 'Technischer Support und Hilfe', type: 'public' },
            { id: 'dreammall-hilfe', name: 'DreamMall Hilfe', description: 'Allgemeine Fragen und Diskussionen', type: 'public' }
        ];
        
        this.privateRooms = [
            { id: 'private:dm-orga', name: 'DM Orga', description: 'Interne Organisation', type: 'private', members: [] }
        ];
    }

    /**
     * Render room sections
     */
    renderRoomSections() {
        return `
            <div class="room-section">
                <h4 class="section-title">
                    🌍 Öffentliche Räume
                    <div class="room-actions">
                        <button class="btn btn-sm" id="joinPublicRoomBtn">🚪 Beitreten</button>
                    </div>
                </h4>
                <div class="rooms public-rooms" id="publicRoomList">
                    ${this.renderRoomList(this.publicRooms)}
                </div>
            </div>
            
            <div class="room-section">
                <h4 class="section-title">
                    🔐 Geschlossene Räume
                    <div class="room-actions">
                        <button class="btn btn-sm" id="createPrivateRoomBtn">➕ Erstellen</button>
                        <button class="btn btn-sm" id="joinPrivateRoomBtn">🚪 Beitreten</button>
                    </div>
                </h4>
                <div class="rooms private-rooms" id="privateRoomList">
                    ${this.renderRoomList(this.privateRooms)}
                </div>
            </div>
        `;
    }

    /**
     * Render room list
     */
    renderRoomList(rooms) {
        return rooms.map(room => `
            <div class="room" data-room="${room.id}" data-type="${room.type}">
                <div class="room-name">${room.type === 'private' ? '🔐 ' : ''}${room.name}</div>
                <div class="room-status">${room.description}</div>
            </div>
        `).join('');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners(container, onRoomSwitch) {
        // Room switching
        container.addEventListener('click', (e) => {
            const roomElement = e.target.closest('.room');
            if (roomElement) {
                const roomId = roomElement.dataset.room;
                const roomType = roomElement.dataset.type;
                
                if (this.canAccessRoom(roomId, roomType)) {
                    onRoomSwitch(roomId);
                    this.setActiveRoom(container, roomId);
                } else {
                    this.toastService.showError('Zugriff auf diesen Raum nicht erlaubt');
                }
            }
        });

        // Room management buttons
        const createBtn = container.querySelector('#createPrivateRoomBtn');
        const joinPublicBtn = container.querySelector('#joinPublicRoomBtn');
        const joinPrivateBtn = container.querySelector('#joinPrivateRoomBtn');

        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateRoomModal());
        }
        if (joinPublicBtn) {
            joinPublicBtn.addEventListener('click', () => this.showJoinRoomModal('public'));
        }
        if (joinPrivateBtn) {
            joinPrivateBtn.addEventListener('click', () => this.showJoinRoomModal('private'));
        }
    }

    /**
     * Check room access
     */
    canAccessRoom(roomId, roomType) {
        if (roomType === 'public') {
            return true;
        }
        
        // For private rooms, check membership
        const room = this.privateRooms.find(r => r.id === roomId);
        if (!room) return false;
        
        // Simple check - in real implementation, verify with NOSTR
        return true; // For now, allow access
    }

    /**
     * Set active room
     */
    setActiveRoom(container, roomId) {
        // Remove active class from all rooms
        container.querySelectorAll('.room').forEach(room => {
            room.classList.remove('active');
        });
        
        // Add active class to selected room
        const activeRoom = container.querySelector(`[data-room="${roomId}"]`);
        if (activeRoom) {
            activeRoom.classList.add('active');
        }
    }

    /**
     * Show create room modal
     */
    showCreateRoomModal() {
        this.modal.createForm({
            title: 'Neuen Raum erstellen',
            fields: [
                {
                    name: 'roomName',
                    label: 'Raum-Name',
                    type: 'text',
                    placeholder: 'Mein neuer Raum',
                    required: true
                },
                {
                    name: 'roomDescription',
                    label: 'Beschreibung',
                    type: 'text',
                    placeholder: 'Kurze Beschreibung'
                },
                {
                    name: 'roomType',
                    label: 'Raum-Typ',
                    type: 'select',
                    options: [
                        { value: 'public', text: '🌍 Öffentlich' },
                        { value: 'private', text: '🔐 Geschlossen' }
                    ]
                }
            ],
            onSubmit: (data) => this.createRoom(data),
            submitText: 'Erstellen'
        });
    }

    /**
     * Show join room modal
     */
    showJoinRoomModal(defaultType = 'public') {
        this.modal.createForm({
            title: 'Raum beitreten',
            fields: [
                {
                    name: 'roomId',
                    label: 'Raum-ID oder Name',
                    type: 'text',
                    placeholder: 'Raum-ID eingeben',
                    required: true
                },
                {
                    name: 'inviteCode',
                    label: 'Einladungscode (optional)',
                    type: 'text',
                    placeholder: 'Für geschlossene Räume'
                }
            ],
            onSubmit: (data) => this.joinRoom(data),
            submitText: 'Beitreten'
        });
    }

    /**
     * Create a new room
     */
    async createRoom(data) {
        try {
            const { roomName, roomDescription, roomType } = data;
            
            if (roomType === 'public') {
                // Use NIP-28 to create public channel
                const result = await this.nip28.createChannel(roomName, roomDescription);
                
                const room = {
                    id: result.channelId,
                    name: roomName,
                    description: roomDescription,
                    type: 'public'
                };
                
                this.publicRooms.push(room);
                this.updateRoomList('public');
                
            } else {
                // Create private room (simplified)
                const roomId = `private:${roomName.toLowerCase().replace(/\s+/g, '-')}`;
                
                const room = {
                    id: roomId,
                    name: roomName,
                    description: roomDescription,
                    type: 'private',
                    members: [] // In real implementation, add current user
                };
                
                this.privateRooms.push(room);
                this.updateRoomList('private');
            }
            
            this.toastService.showSuccess(`Raum "${roomName}" wurde erstellt`);
            
        } catch (error) {
            console.error('❌ Fehler beim Erstellen des Raums:', error);
            this.toastService.showError('Fehler beim Erstellen des Raums');
            return false; // Prevent modal close
        }
    }

    /**
     * Join an existing room
     */
    async joinRoom(data) {
        try {
            const { roomId, inviteCode } = data;
            
            // Simple room joining (in real implementation, use NOSTR events)
            const room = {
                id: roomId,
                name: roomId,
                description: 'Beigetretener Raum',
                type: roomId.startsWith('private:') ? 'private' : 'public'
            };
            
            if (room.type === 'private') {
                room.members = []; // Add current user
                this.privateRooms.push(room);
                this.updateRoomList('private');
            } else {
                this.publicRooms.push(room);
                this.updateRoomList('public');
            }
            
            this.toastService.showSuccess(`Raum "${roomId}" beigetreten`);
            
        } catch (error) {
            console.error('❌ Fehler beim Beitreten des Raums:', error);
            this.toastService.showError('Fehler beim Beitreten des Raums');
            return false;
        }
    }

    /**
     * Update room list in UI
     */
    updateRoomList(type) {
        const listId = type === 'public' ? 'publicRoomList' : 'privateRoomList';
        const listElement = document.getElementById(listId);
        
        if (listElement) {
            const rooms = type === 'public' ? this.publicRooms : this.privateRooms;
            listElement.innerHTML = this.renderRoomList(rooms);
        }
    }

    /**
     * Get room by ID
     */
    getRoom(roomId) {
        return [...this.publicRooms, ...this.privateRooms].find(r => r.id === roomId);
    }

    /**
     * Get all rooms
     */
    getAllRooms() {
        return {
            public: this.publicRooms,
            private: this.privateRooms
        };
    }
}
