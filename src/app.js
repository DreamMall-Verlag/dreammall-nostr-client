console.log('🚀 DreamMall NOSTR wird geladen...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM geladen');
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="app">
            <div class="header">
                <h1>💬 DreamMall NOSTR</h1>
                <div class="status">
                    <div class="status-dot offline" id="status-dot"></div>
                    <span id="status-text">Getrennt</span>
                </div>
            </div>
            
            <div class="setup" id="setup">
                <h2>🔐 Willkommen zu DreamMall NOSTR</h2>
                <p>Richten Sie Ihren sicheren Chat ein</p>
                <div class="setup-buttons">
                    <button class="btn btn-primary" id="create-btn">✨ Neue Schlüssel erstellen</button>
                    <button class="btn btn-secondary" id="import-btn">📥 Schlüssel importieren</button>
                </div>
            </div>
            
            <div class="main hidden" id="main">
                <div class="sidebar">
                    <div class="sidebar-header">
                        <h3>Chat-Räume</h3>
                        <button class="btn btn-sm">+</button>
                    </div>
                    <div class="rooms">
                        <div class="room active">
                            <div class="room-name">Allgemein</div>
                            <div class="room-status">Online</div>
                        </div>
                    </div>
                </div>
                
                <div class="chat">
                    <div class="chat-header">
                        <h3>Allgemein</h3>
                        <button class="btn btn-sm">🔒</button>
                    </div>
                    
                    <div class="messages" id="messages">
                        <div class="welcome">
                            <h3>Willkommen im Chat! 🎉</h3>
                            <p>Ihre Nachrichten werden Ende-zu-Ende verschlüsselt.</p>
                        </div>
                    </div>
                    
                    <div class="input-area">
                        <div class="input-container">
                            <input type="text" id="input" placeholder="Nachricht eingeben...">
                            <button class="btn btn-primary" id="send">📤</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('create-btn').addEventListener('click', () => {
        console.log('🔑 Schlüssel erstellen');
        document.getElementById('setup').classList.add('hidden');
        document.getElementById('main').classList.remove('hidden');
        document.getElementById('status-dot').classList.replace('offline', 'online');
        document.getElementById('status-text').textContent = 'Verbunden';
    });
    
    document.getElementById('import-btn').addEventListener('click', () => {
        alert('Import wird implementiert...');
    });
    
    const sendMessage = () => {
        const input = document.getElementById('input');
        const message = input.value.trim();
        if (message) {
            const messages = document.getElementById('messages');
            const welcome = messages.querySelector('.welcome');
            if (welcome) welcome.remove();
            
            const msg = document.createElement('div');
            msg.className = 'message user';
            msg.innerHTML = `
                <div class="message-text">${message}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            `;
            messages.appendChild(msg);
            messages.scrollTop = messages.scrollHeight;
            input.value = '';
        }
    };
    
    document.getElementById('send').addEventListener('click', sendMessage);
    document.getElementById('input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    console.log('✅ App geladen');
});
