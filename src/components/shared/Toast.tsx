import { useState, createContext, useContext, useCallback, type ReactNode } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div style={{
                position: 'fixed',
                bottom: '2rem',
                right: '2rem',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                pointerEvents: 'none',
                maxWidth: '400px',
                width: 'calc(100% - 4rem)'
            }}>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: () => void }) {
    const colors = {
        success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', icon: <CheckCircle size={20} color="#22C55E" /> },
        error: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: <AlertCircle size={20} color="#EF4444" /> },
        warning: { bg: '#FFFBEB', border: '#FEF3C7', text: '#92400E', icon: <AlertTriangle size={20} color="#F59E0B" /> },
        info: { bg: '#EFF6FF', border: '#DBEAFE', text: '#1E40AF', icon: <Info size={20} color="#3B82F6" /> },
    };

    const config = colors[toast.type];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            backgroundColor: config.bg,
            border: `1px solid ${config.border}`,
            borderRadius: 'var(--radius-md)',
            color: config.text,
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s ease-forward',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ flexShrink: 0 }}>{config.icon}</div>
            <div style={{ flexGrow: 1, fontWeight: '600', fontSize: '0.9rem' }}>{toast.message}</div>
            <button
                onClick={onRemove}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'inherit',
                    opacity: 0.5,
                    transition: 'opacity 0.2s'
                }}
            >
                <X size={16} />
            </button>

            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: 'currentColor',
                opacity: 0.2,
                width: '100%',
                animation: 'progress 4s linear forwards'
            }} />

            <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
