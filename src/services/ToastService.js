// =================================================================
// Toast Service - Standalone Toast Notification System
// =================================================================

export class ToastService {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.defaultDuration = 5000;
        this.maxToasts = 5;
        this.init();
    }

    init() {
        this.createContainer();
        console.log('✅ Toast Service initialisiert');
    }

    createContainer() {
        // Remove existing container if present
        const existingContainer = document.getElementById('toast-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        
        // Add CSS styles if not already present
        if (!document.getElementById('toast-styles')) {
            this.addStyles();
        }
        
        document.body.appendChild(this.container);
    }

    addStyles() {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
            }

            .toast {
                background: var(--background-color, white);
                border: 1px solid var(--border-color, #e1e5e9);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                overflow: hidden;
                transform: translateX(100%);
                transition: all 0.3s ease;
                pointer-events: auto;
                max-width: 100%;
                word-wrap: break-word;
            }

            .toast.show {
                transform: translateX(0);
            }

            .toast-content {
                display: flex;
                align-items: flex-start;
                padding: 16px;
                gap: 12px;
            }

            .toast-icon {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            .toast-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
                color: var(--text-color, #333);
            }

            .toast-close {
                flex-shrink: 0;
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                color: var(--text-color-secondary, #666);
                transition: background-color 0.2s;
            }

            .toast-close:hover {
                background-color: var(--hover-color, rgba(0, 0, 0, 0.1));
            }

            /* Toast Types */
            .toast-success {
                border-left: 4px solid #10b981;
            }
            .toast-success .toast-icon {
                color: #10b981;
            }

            .toast-error {
                border-left: 4px solid #ef4444;
            }
            .toast-error .toast-icon {
                color: #ef4444;
            }

            .toast-warning {
                border-left: 4px solid #f59e0b;
            }
            .toast-warning .toast-icon {
                color: #f59e0b;
            }

            .toast-info {
                border-left: 4px solid #3b82f6;
            }
            .toast-info .toast-icon {
                color: #3b82f6;
            }

            /* Progress bar */
            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background-color: currentColor;
                opacity: 0.3;
                transition: width linear;
            }

            .toast-success .toast-progress { background-color: #10b981; }
            .toast-error .toast-progress { background-color: #ef4444; }
            .toast-warning .toast-progress { background-color: #f59e0b; }
            .toast-info .toast-progress { background-color: #3b82f6; }

            /* Dark theme support */
            [data-theme="dark"] .toast {
                background: var(--background-dark, #1f2937);
                border-color: var(--border-dark, #374151);
                color: var(--text-dark, #f9fafb);
            }

            [data-theme="dark"] .toast-message {
                color: var(--text-dark, #f9fafb);
            }

            [data-theme="dark"] .toast-close {
                color: var(--text-secondary-dark, #9ca3af);
            }

            [data-theme="dark"] .toast-close:hover {
                background-color: var(--hover-dark, rgba(255, 255, 255, 0.1));
            }

            /* Mobile responsiveness */
            @media (max-width: 480px) {
                .toast-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .toast {
                    margin-bottom: 8px;
                }

                .toast-content {
                    padding: 12px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // =================================================================
    // Public Methods
    // =================================================================

    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: options.duration || 8000 });
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    show(message, type = 'info', options = {}) {
        const config = {
            duration: options.duration ?? this.defaultDuration,
            closable: options.closable ?? true,
            progress: options.progress ?? true,
            id: options.id || this.generateId(),
            ...options
        };

        // Remove existing toast with same ID
        if (this.toasts.has(config.id)) {
            this.remove(config.id);
        }

        // Limit number of toasts
        if (this.toasts.size >= this.maxToasts) {
            const oldestToast = this.toasts.keys().next().value;
            this.remove(oldestToast);
        }

        const toast = this.createToast(message, type, config);
        this.toasts.set(config.id, toast);
        
        this.container.appendChild(toast.element);
        
        // Show toast
        requestAnimationFrame(() => {
            toast.element.classList.add('show');
        });

        // Auto remove
        if (config.duration > 0) {
            toast.timer = setTimeout(() => {
                this.remove(config.id);
            }, config.duration);

            // Progress bar animation
            if (config.progress) {
                const progressBar = toast.element.querySelector('.toast-progress');
                if (progressBar) {
                    progressBar.style.width = '0%';
                    progressBar.style.transitionDuration = `${config.duration}ms`;
                    requestAnimationFrame(() => {
                        progressBar.style.width = '100%';
                    });
                }
            }
        }

        return config.id;
    }

    remove(id) {
        const toast = this.toasts.get(id);
        if (!toast) return false;

        clearTimeout(toast.timer);
        toast.element.classList.remove('show');
        
        setTimeout(() => {
            if (toast.element.parentNode) {
                toast.element.parentNode.removeChild(toast.element);
            }
            this.toasts.delete(id);
        }, 300);

        return true;
    }

    removeAll() {
        for (const id of this.toasts.keys()) {
            this.remove(id);
        }
    }

    update(id, message, type = null) {
        const toast = this.toasts.get(id);
        if (!toast) return false;

        const messageElement = toast.element.querySelector('.toast-message');
        if (messageElement) {
            messageElement.textContent = message;
        }

        if (type && type !== toast.type) {
            toast.element.className = `toast toast-${type}`;
            toast.type = type;
        }

        return true;
    }

    // =================================================================
    // Internal Methods
    // =================================================================

    createToast(message, type, config) {
        const element = document.createElement('div');
        element.className = `toast toast-${type}`;
        element.dataset.toastId = config.id;
        
        const icon = this.getIcon(type);
        
        element.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
                ${config.closable ? `
                    <button class="toast-close" type="button" aria-label="Schließen">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
            ${config.progress && config.duration > 0 ? '<div class="toast-progress"></div>' : ''}
        `;

        // Event listeners
        if (config.closable) {
            const closeButton = element.querySelector('.toast-close');
            closeButton.addEventListener('click', () => {
                this.remove(config.id);
            });
        }

        // Click to dismiss
        if (config.clickToDismiss !== false) {
            element.addEventListener('click', (e) => {
                if (!e.target.closest('.toast-close')) {
                    this.remove(config.id);
                }
            });
        }

        return {
            element,
            type,
            timer: null
        };
    }

    getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    generateId() {
        return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // =================================================================
    // Configuration
    // =================================================================

    setDefaultDuration(duration) {
        this.defaultDuration = duration;
    }

    setMaxToasts(max) {
        this.maxToasts = max;
        
        // Remove excess toasts
        while (this.toasts.size > max) {
            const oldestToast = this.toasts.keys().next().value;
            this.remove(oldestToast);
        }
    }

    // =================================================================
    // Convenience Methods
    // =================================================================

    promise(promise, messages = {}) {
        const loadingMessages = {
            loading: 'Lädt...',
            success: 'Erfolgreich!',
            error: 'Fehler aufgetreten',
            ...messages
        };

        const loadingId = this.info(loadingMessages.loading, { 
            duration: 0, 
            progress: false 
        });

        return promise
            .then((result) => {
                this.remove(loadingId);
                this.success(loadingMessages.success);
                return result;
            })
            .catch((error) => {
                this.remove(loadingId);
                this.error(loadingMessages.error);
                throw error;
            });
    }

    async(asyncFn, messages = {}) {
        return this.promise(asyncFn(), messages);
    }

    // =================================================================
    // Notification Shortcuts
    // =================================================================

    notifyConnection(status, relayName = '') {
        const messages = {
            connected: `✅ Verbunden${relayName ? ` mit ${relayName}` : ''}`,
            disconnected: `❌ Verbindung getrennt${relayName ? ` von ${relayName}` : ''}`,
            reconnecting: `🔄 Verbinde neu${relayName ? ` mit ${relayName}` : ''}...`,
            error: `⚠️ Verbindungsfehler${relayName ? ` bei ${relayName}` : ''}`
        };

        const types = {
            connected: 'success',
            disconnected: 'warning',
            reconnecting: 'info',
            error: 'error'
        };

        this.show(messages[status] || messages.error, types[status] || 'info');
    }

    notifyMessage(type, author = '') {
        const messages = {
            sent: '📤 Nachricht gesendet',
            received: `📥 Neue Nachricht${author ? ` von ${author}` : ''}`,
            encrypted: '🔒 Verschlüsselte Nachricht erhalten',
            failed: '❌ Nachricht konnte nicht gesendet werden'
        };

        const types = {
            sent: 'success',
            received: 'info',
            encrypted: 'info',
            failed: 'error'
        };

        this.show(messages[type] || messages.failed, types[type] || 'info');
    }

    notifyKey(action) {
        const messages = {
            generated: '🔑 Neuer Schlüssel generiert',
            imported: '📥 Schlüssel importiert',
            exported: '📤 Schlüssel exportiert',
            saved: '💾 Schlüssel gespeichert',
            error: '❌ Schlüssel-Fehler'
        };

        const types = {
            generated: 'success',
            imported: 'success',
            exported: 'success',
            saved: 'success',
            error: 'error'
        };

        this.show(messages[action] || messages.error, types[action] || 'info');
    }

    // =================================================================
    // Cleanup
    // =================================================================

    destroy() {
        this.removeAll();
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.toasts.clear();
        this.container = null;
    }

    // Alias methods for backward compatibility
    showSuccess(message, options = {}) {
        return this.success(message, options);
    }

    showError(message, options = {}) {
        return this.error(message, options);
    }

    showWarning(message, options = {}) {
        return this.warning(message, options);
    }

    showInfo(message, options = {}) {
        return this.info(message, options);
    }
}
