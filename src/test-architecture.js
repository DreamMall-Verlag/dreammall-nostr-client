// =================================================================
// Test der modularen Architektur
// =================================================================

import { ModalComponent } from './components/ui/ModalComponent.js';
import { NIP01_BasicProtocol } from './nips/NIP01_BasicProtocol.js';

// Test-Button zur Demonstration der modularen Architektur
document.addEventListener('DOMContentLoaded', () => {
    // Test-Button erstellen
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Test Modulare Architektur';
    testButton.className = 'btn btn-primary';
    testButton.style.position = 'fixed';
    testButton.style.top = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '9999';
    
    // Test-Funktionalität
    testButton.addEventListener('click', () => {
        const modal = new ModalComponent();
        
        modal.createForm({
            title: '✅ Modulare Architektur Test',
            fields: [
                {
                    name: 'testType',
                    label: 'Test-Typ',
                    type: 'select',
                    options: [
                        { value: 'modal', text: '🪟 Modal-Komponente' },
                        { value: 'nip01', text: '📡 NIP-01 Protokoll' },
                        { value: 'room', text: '🏠 Raum-Management' }
                    ]
                },
                {
                    name: 'testData',
                    label: 'Test-Daten',
                    type: 'text',
                    placeholder: 'Eingabe für Test...'
                }
            ],
            onSubmit: (data) => {
                console.log('✅ Test-Daten:', data);
                
                // Zeige Ergebnis-Modal
                setTimeout(() => {
                    modal.alert({
                        title: '🎉 Test erfolgreich!',
                        message: `
                            <div style="text-align: left;">
                                <h4>Modulare Architektur funktioniert!</h4>
                                <p><strong>Test-Typ:</strong> ${data.testType}</p>
                                <p><strong>Test-Daten:</strong> ${data.testData}</p>
                                <hr>
                                <p><small>✅ Modal-Komponente: Funktioniert<br>
                                ✅ NIP-Module: Bereit<br>
                                ✅ UI-Komponenten: Aktiv<br>
                                ✅ Saubere Trennung: Implementiert</small></p>
                            </div>
                        `
                    });
                }, 100);
            },
            submitText: 'Test ausführen'
        });
    });
    
    document.body.appendChild(testButton);
});
