// =================================================================
// Modal Component - Wiederverwendbare Modal-Dialoge
// =================================================================

export class ModalComponent {
    constructor() {
        this.activeModals = new Set();
    }

    /**
     * Create a basic modal
     */
    create({ title, body, buttons = [], closable = true, className = '' }) {
        const modal = document.createElement('div');
        modal.className = `modal ${className}`;
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    ${closable ? '<button class="modal-close" onclick="this.closest(\'.modal\').remove()">×</button>' : ''}
                </div>
                <div class="modal-body">
                    ${body}
                </div>
                ${buttons.length > 0 ? `
                <div class="modal-footer">
                    ${buttons.map(btn => `
                        <button class="btn ${btn.class || 'btn-secondary'}" 
                                onclick="${btn.onclick || ''}"
                                ${btn.disabled ? 'disabled' : ''}>
                            ${btn.text}
                        </button>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;

        // Add to page
        document.body.appendChild(modal);
        this.activeModals.add(modal);

        // Auto-focus first input
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }

        // Handle escape key
        if (closable) {
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.close(modal);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        }

        return modal;
    }

    /**
     * Create form modal
     */
    createForm({ title, fields, onSubmit, submitText = 'OK', cancelText = 'Abbrechen' }) {
        const formHTML = `
            <form id="modalForm">
                ${fields.map(field => `
                    <div class="form-group">
                        <label>${field.label}</label>
                        ${this.renderFormField(field)}
                    </div>
                `).join('')}
            </form>
        `;

        const modal = this.create({
            title,
            body: formHTML,
            buttons: [
                {
                    text: cancelText,
                    class: 'btn-secondary',
                    onclick: 'this.closest(\'.modal\').remove()'
                },
                {
                    text: submitText,
                    class: 'btn-primary',
                    onclick: 'this.closest(\'.modal\').modalComponent.submitForm()'
                }
            ]
        });

        // Store reference for form submission
        modal.modalComponent = {
            submitForm: () => {
                const formData = this.getFormData(modal);
                if (onSubmit) {
                    const result = onSubmit(formData);
                    if (result !== false) {
                        this.close(modal);
                    }
                }
            }
        };

        return modal;
    }

    /**
     * Render form field based on type
     */
    renderFormField(field) {
        const baseAttrs = `
            id="${field.id || field.name}"
            name="${field.name}"
            ${field.required ? 'required' : ''}
            ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
            ${field.value ? `value="${field.value}"` : ''}
        `;

        switch (field.type) {
            case 'select':
                return `
                    <select ${baseAttrs}>
                        ${field.options.map(opt => `
                            <option value="${opt.value}" ${opt.selected ? 'selected' : ''}>
                                ${opt.text}
                            </option>
                        `).join('')}
                    </select>
                `;
            case 'textarea':
                return `<textarea ${baseAttrs} rows="${field.rows || 3}">${field.value || ''}</textarea>`;
            default:
                return `<input type="${field.type || 'text'}" ${baseAttrs} />`;
        }
    }

    /**
     * Get form data from modal
     */
    getFormData(modal) {
        const form = modal.querySelector('#modalForm');
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    /**
     * Close modal
     */
    close(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
            this.activeModals.delete(modal);
        }
    }

    /**
     * Close all modals
     */
    closeAll() {
        this.activeModals.forEach(modal => this.close(modal));
    }

    /**
     * Confirmation dialog
     */
    confirm({ title, message, onConfirm, confirmText = 'Bestätigen', cancelText = 'Abbrechen' }) {
        return this.create({
            title,
            body: `<p>${message}</p>`,
            buttons: [
                {
                    text: cancelText,
                    class: 'btn-secondary',
                    onclick: 'this.closest(\'.modal\').remove()'
                },
                {
                    text: confirmText,
                    class: 'btn-primary',
                    onclick: `
                        ${onConfirm ? 'this.closest(\'.modal\').modalComponent.confirm()' : ''};
                        this.closest('.modal').remove()
                    `
                }
            ]
        });
    }

    /**
     * Alert dialog
     */
    alert({ title, message, buttonText = 'OK' }) {
        return this.create({
            title,
            body: `<p>${message}</p>`,
            buttons: [
                {
                    text: buttonText,
                    class: 'btn-primary',
                    onclick: 'this.closest(\'.modal\').remove()'
                }
            ]
        });
    }
}
