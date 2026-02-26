import { Plus } from 'lucide-react';

interface OrderFABProps {
    onClick: () => void;
}

/**
 * Floating Action Button for creating orders.
 * Rendered in the bottom-right corner with a prominent + icon.
 * Reusable across CocinaPage and AdminPage.
 */
export function OrderFAB({ onClick }: OrderFABProps) {
    return (
        <button
            onClick={onClick}
            aria-label="Nuevo Pedido"
            title="Crear nuevo pedido"
            style={{
                position: 'fixed',
                bottom: 'clamp(1rem, 5vw, 2rem)',
                right: 'clamp(1rem, 5vw, 2rem)',
                width: 'clamp(48px, 12vw, 60px)',
                height: 'clamp(48px, 12vw, 60px)',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 900,
            }}
            onMouseEnter={(e) => {
                const btn = e.currentTarget;
                btn.style.transform = 'scale(1.1)';
                btn.style.boxShadow = '0 8px 28px rgba(37, 99, 235, 0.5), 0 4px 12px rgba(0, 0, 0, 0.2)';
                btn.style.backgroundColor = 'var(--primary-hover)';
            }}
            onMouseLeave={(e) => {
                const btn = e.currentTarget;
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15)';
                btn.style.backgroundColor = 'var(--primary-color)';
            }}
        >
            <Plus size="50%" strokeWidth={2.5} />
        </button>
    );
}
