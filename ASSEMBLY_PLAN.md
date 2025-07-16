# 🔧 DreamMall NOSTR Client - Zusammensetzungsplan

## 🎯 **Ziel: Saubere Zusammensetzung der vorhandenen Komponenten**

Alle Komponenten sind **bereits implementiert** - wir müssen sie nur **intelligent verknüpfen**.

## 📋 **Phase 1: UI-Komponenten aktivieren (Sofort umsetzbar)**

### 1. **Einstellungen-Modal verbinden**
```javascript
// File: src/app.js
// Bereits vorhanden: <button id="settingsBtn">⚙️ Einstellungen</button>
// TODO: Event-Listener hinzufügen

// In NostrApp.initializeApp() hinzufügen:
setupSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            this.settingsModal.show();
        });
    }
}
```

### 2. **Relay-Manager aktivieren**
```javascript
// File: src/app.js
// RelayManager.js ist fertig - muss nur eingebunden werden

// In NostrApp.initializeServices() hinzufügen:
this.relayManager = new RelayManager(this.services.relay, this.services.toast);

// Navigation erweitern:
const relayBtn = document.createElement('button');
relayBtn.innerHTML = '🌐 Relays';
relayBtn.onclick = () => this.relayManager.show();
```

### 3. **DM-Tab funktionsfähig machen**
```javascript
// File: src/components/ChatComponentRefactored.js
// DM-Tab ist bereits da - muss nur mit NIP04 verbunden werden

// In setupEventListeners() hinzufügen:
setupDMTab() {
    const dmsTab = document.getElementById('dmsTab');
    const startDMBtn = document.getElementById('startDMBtn');
    
    if (startDMBtn) {
        startDMBtn.addEventListener('click', () => {
            this.showStartDMModal();
        });
    }
}

showStartDMModal() {
    this.modal.createForm({
        title: '💬 Neue Direktnachricht',
        fields: [
            { type: 'text', name: 'pubkey', label: 'Empfänger (pubkey/npub):', required: true },
            { type: 'textarea', name: 'message', label: 'Nachricht:', required: true }
        ],
        onSubmit: async (data) => {
            await this.sendDirectMessage(data.pubkey, data.message);
        }
    });
}
```

### 4. **Profil-System aktivieren**
```javascript
// File: src/app.js
// Bereits vorhanden: <button id="profileBtn">👤 Profil</button>

// In NostrApp.initializeApp() hinzufügen:
setupProfileModal() {
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            this.showProfileModal();
        });
    }
}

showProfileModal() {
    const profile = this.services.key.getProfile();
    // Profil-Modal mit KeyService-Daten anzeigen
}
```

## 📋 **Phase 2: Services verknüpfen (Datenfluss)**

### 1. **NIPs mit Services verbinden**
```javascript
// File: src/app.js
// NIPs sind implementiert - müssen nur initialisiert werden

async initializeNIPs() {
    // Basis-NIPs
    this.nips = {
        nip01: new NIP01_BasicProtocol(this.services.nostr),
        nip02: new NIP02_ContactLists(this.services.nostr, null), // null wird später durch nip01 ersetzt
        nip04: new NIP04_EncryptedDMs(this.services.nostr, null),
        nip17: new NIP17_KindMessages(this.services.nostr, null),
        nip28: new NIP28_PublicChat(this.services.nostr, null),
        nip104: new NIP104_PrivateGroups(this.services.nostr, null)
    };
    
    // Referenzen setzen
    this.nips.nip02.nip01 = this.nips.nip01;
    this.nips.nip04.nip01 = this.nips.nip01;
    this.nips.nip17.nip01 = this.nips.nip01;
    this.nips.nip28.nip01 = this.nips.nip01;
    this.nips.nip104.nip01 = this.nips.nip01;
    
    // NIPs an Services weitergeben
    this.services.nostr.nips = this.nips;
}
```

### 2. **Direktnachrichten aktivieren**
```javascript
// File: src/components/ChatComponentRefactored.js
// NIP04 ist implementiert - muss nur aufgerufen werden

async sendDirectMessage(recipientPubkey, message) {
    try {
        console.log('📤 Sende Direktnachricht an:', recipientPubkey);
        
        // NIP04 verwenden
        const nip04 = this.services.nostr.nips.nip04;
        const result = await nip04.sendEncryptedDM(recipientPubkey, message);
        
        this.services.toast.success('✅ Direktnachricht gesendet');
        return result;
    } catch (error) {
        console.error('❌ Fehler beim Senden der DM:', error);
        this.services.toast.error('❌ Fehler beim Senden der Direktnachricht');
    }
}

// DM-Abonnement aktivieren
subscribeToDMs() {
    const nip04 = this.services.nostr.nips.nip04;
    nip04.subscribeToEncryptedDMs((dmEvent) => {
        console.log('📨 Neue Direktnachricht empfangen:', dmEvent);
        this.handleIncomingDM(dmEvent);
    });
}
```

### 3. **Gruppen-Einladungen aktivieren**
```javascript
// File: src/components/ChatComponentRefactored.js
// NIP104 ist implementiert - muss nur aufgerufen werden

async inviteToGroup(groupId, recipientPubkey) {
    try {
        console.log('📨 Lade Benutzer zu Gruppe ein:', groupId, recipientPubkey);
        
        // NIP104 verwenden
        const nip104 = this.services.nostr.nips.nip104;
        const sharedKey = this.privateGroups.get(groupId)?.sharedKey;
        
        if (!sharedKey) {
            throw new Error('Gruppen-Schlüssel nicht gefunden');
        }
        
        const result = await nip104.inviteToGroup(groupId, recipientPubkey, sharedKey);
        
        this.services.toast.success('✅ Einladung gesendet');
        return result;
    } catch (error) {
        console.error('❌ Fehler beim Einladen:', error);
        this.services.toast.error('❌ Fehler beim Senden der Einladung');
    }
}
```

## 📋 **Phase 3: Relay-Konfiguration optimieren**

### 1. **Test-Relay-Modus aktivieren**
```javascript
// File: src/config/app-config.js
// Bereits vorhanden - nur Test-Modus aktivieren

export const APP_CONFIG = {
    name: 'DreamMall NOSTR Client',
    version: '1.0.1',
    
    // Test-Modus: Nur ein Relay verwenden
    testMode: true,
    
    defaultRelays: [
        'wss://relay.damus.io'  // Nur dieses für Tests
        // Andere auskommentiert für Tests
        // 'wss://relay.nostr.band',
        // 'wss://nos.lol',
        // 'wss://relay.snort.social'
    ],
    
    // ...rest der Konfiguration
};
```

### 2. **RelayService für Test-Modus anpassen**
```javascript
// File: src/services/RelayService.js
// Bereits zentrale Konfiguration - nur Test-Modus prüfen

async connect() {
    console.log('🌐 Verbinde zu NOSTR Relays...');
    
    // Test-Modus prüfen
    if (APP_CONFIG.testMode) {
        console.log('🧪 Test-Modus aktiv - verwende nur Haupt-Relay');
        const testRelay = APP_CONFIG.defaultRelays[0];
        await this.connectToRelay(testRelay);
        return;
    }
    
    // Normaler Modus - alle Relays
    const relaysToConnect = this.getSavedRelays() || APP_CONFIG.defaultRelays;
    // ...bestehender Code
}
```

## 📋 **Phase 4: Kontakte-System aktivieren**

### 1. **Kontaktliste in DM-Tab integrieren**
```javascript
// File: src/components/ChatComponentRefactored.js
// NIP02 ist implementiert - muss nur aufgerufen werden

async loadDMContacts() {
    try {
        console.log('👥 Lade DM-Kontakte...');
        
        // NIP02 verwenden
        const nip02 = this.services.nostr.nips.nip02;
        const contacts = nip02.getAllContacts();
        
        this.renderDMContacts(contacts);
    } catch (error) {
        console.error('❌ Fehler beim Laden der Kontakte:', error);
    }
}

renderDMContacts(contacts) {
    const dmContacts = document.getElementById('dmContacts');
    if (!dmContacts) return;
    
    if (contacts.length === 0) {
        dmContacts.innerHTML = '<div class="no-contacts">Keine Kontakte vorhanden</div>';
        return;
    }
    
    dmContacts.innerHTML = contacts.map(contact => `
        <div class="dm-contact" data-pubkey="${contact.pubkey}">
            <div class="contact-info">
                <span class="contact-name">${contact.petname || 'Unbekannt'}</span>
                <span class="contact-pubkey">${contact.pubkey.substring(0, 8)}...</span>
            </div>
            <button class="btn btn-sm" onclick="this.parentElement.parentElement.click()">💬</button>
        </div>
    `).join('');
    
    // Event-Listener für Kontakte
    dmContacts.querySelectorAll('.dm-contact').forEach(contact => {
        contact.addEventListener('click', () => {
            const pubkey = contact.dataset.pubkey;
            this.startDMWithContact(pubkey);
        });
    });
}
```

## 📋 **Phase 5: Benachrichtigungen aktivieren**

### 1. **Toast-System für alle Events**
```javascript
// File: src/components/ChatComponentRefactored.js
// ToastService ist implementiert - muss nur verwendet werden

handleIncomingDM(dmEvent) {
    console.log('📨 Neue Direktnachricht:', dmEvent);
    
    // Toast-Benachrichtigung
    this.services.toast.info(
        `💬 Neue Direktnachricht von ${dmEvent.senderPubkey.substring(0, 8)}...`,
        { duration: 5000 }
    );
    
    // DM zur Liste hinzufügen
    this.addDMToList(dmEvent);
}

handleGroupInvitation(inviteEvent) {
    console.log('📨 Gruppen-Einladung:', inviteEvent);
    
    // Toast-Benachrichtigung mit Aktionen
    this.services.toast.show(
        `📨 Einladung zu Gruppe: ${inviteEvent.groupName}`,
        'info',
        {
            duration: 10000,
            actions: [
                { text: 'Annehmen', onclick: () => this.acceptGroupInvitation(inviteEvent) },
                { text: 'Ablehnen', onclick: () => this.declineGroupInvitation(inviteEvent) }
            ]
        }
    );
}
```

## 🚀 **Sofort-Umsetzung (Konkrete Schritte)**

### **Schritt 1: Services verknüpfen**
```bash
# Datei: src/app.js erweitern
1. initializeNIPs() Methode hinzufügen
2. NIPs mit Services verbinden
3. Event-Listener für Buttons hinzufügen
```

### **Schritt 2: UI aktivieren**
```bash
# Datei: src/components/ChatComponentRefactored.js erweitern
1. setupDMTab() Methode hinzufügen
2. sendDirectMessage() implementieren
3. subscribeToDMs() aktivieren
4. loadDMContacts() implementieren
```

### **Schritt 3: Modals verbinden**
```bash
# Event-Listener für vorhandene Buttons hinzufügen
1. Settings-Button → SettingsModal
2. Profile-Button → Profil-Modal
3. DM-Start-Button → DM-Modal
4. Relay-Button → RelayManager
```

### **Schritt 4: Test-Modus aktivieren**
```bash
# Datei: src/config/app-config.js
1. testMode: true setzen
2. Nur ein Relay für Tests verwenden
3. RelayService entsprechend anpassen
```

## 🎯 **Ziel erreicht: Vollständig funktionsfähiger NOSTR-Client**

Nach diesen Schritten haben wir:
- ✅ Alle UI-Komponenten aktiviert
- ✅ Alle Services verbunden
- ✅ Alle NIPs funktionsfähig
- ✅ Direktnachrichten
- ✅ Gruppen-Einladungen
- ✅ Kontakte-System
- ✅ Relay-Verwaltung
- ✅ Profil-System
- ✅ Toast-Benachrichtigungen

**Alles ist bereits da - wir stecken es nur zusammen!** 🎉
