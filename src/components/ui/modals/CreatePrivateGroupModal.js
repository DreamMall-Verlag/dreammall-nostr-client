// =================================================================
// Create Private Group Modal - Erstelle verschlüsselte Gruppe
// =================================================================

export function showCreatePrivateGroupModal(nip104, toastService, updatePrivateGroupsList) {
    console.log('🔐 Öffne Erstelle Private Gruppe Modal...');
    
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
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Set up global function for creating group
    window.createPrivateGroup = async () => {
        const groupName = document.getElementById('groupName').value.trim();
        const groupDescription = document.getElementById('groupDescription').value.trim();
        const inviteMembersInput = document.getElementById('inviteMembers').value.trim();
        
        if (!groupName) {
            toastService.showError('Gruppenname ist erforderlich');
            return;
        }
        
        const invitedMembers = inviteMembersInput 
            ? inviteMembersInput.split(',').map(m => m.trim()).filter(m => m.length > 0)
            : [];
        
        try {
            await handleCreatePrivateGroup(groupName, groupDescription, invitedMembers);
            modal.remove();
        } catch (error) {
            console.error('❌ Fehler beim Erstellen der Gruppe:', error);
            toastService.showError('Fehler beim Erstellen der Gruppe');
        }
    };
    
    // Handle create private group
    async function handleCreatePrivateGroup(groupName, description, invitedMembers) {
        try {
            console.log('🔐 Erstelle private Gruppe:', { groupName, description, invitedMembers });
            
            const result = await nip104.createRealPrivateGroup(groupName, description, invitedMembers);
            
            toastService.showSuccess(`Verschlüsselte Gruppe "${groupName}" erstellt!`);
            
            // Update the private groups list
            if (updatePrivateGroupsList) {
                updatePrivateGroupsList();
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Erstellen der privaten Gruppe:', error);
            toastService.showError('Fehler beim Erstellen der Gruppe');
            throw error;
        }
    }
}
