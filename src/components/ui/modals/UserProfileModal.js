// =================================================================
// User Profile Modal - Zeigt Benutzer-Profil an
// =================================================================

export function showUserProfileModal(keyService, toastService) {
    console.log('👤 Öffne Benutzer-Profil...');
    
    try {
        // Get current user synchronously
        const user = keyService.getCurrentUser();
        
        if (!user) {
            toastService.showError('Kein Benutzer gefunden');
            return;
        }
        
        const profileModal = document.createElement('div');
        profileModal.className = 'modal-overlay';
        profileModal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>👤 Benutzer-Profil</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="profile-info">
                        <p><strong>Öffentlicher Schlüssel:</strong></p>
                        <p class="key-display">${user.publicKey}</p>
                        <p><strong>NPUB:</strong></p>
                        <p class="key-display">${user.npub || 'Nicht verfügbar'}</p>
                        <p><strong>Erstellt:</strong></p>
                        <p>${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Schließen</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(profileModal);
        setTimeout(() => profileModal.classList.add('show'), 10);
        
        // Copy-to-clipboard für Schlüssel
        profileModal.querySelectorAll('.key-display').forEach(el => {
            el.style.cursor = 'pointer';
            el.title = 'Klicken zum Kopieren';
            el.addEventListener('click', () => {
                navigator.clipboard.writeText(el.textContent);
                toastService.showSuccess('In Zwischenablage kopiert');
            });
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Laden des Profils:', error);
        toastService.showError('Fehler beim Laden des Profils');
    }
}
