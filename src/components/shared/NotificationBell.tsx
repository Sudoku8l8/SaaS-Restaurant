import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCircle2, MessageCircle, Utensils } from 'lucide-react';
import { useDigitalOrders } from '@/hooks/useDigitalOrders';
import type { DigitalOrder } from '@/types';
import { createPortal } from 'react-dom';

// ── Styles (inline for a self-contained shared component) ─────────────────
const css = `
@keyframes bellPulse {
  0%, 100% { transform: rotate(0deg); }
  15% { transform: rotate(-15deg); }
  30% { transform: rotate(15deg); }
  45% { transform: rotate(-10deg); }
  60% { transform: rotate(10deg); }
  75% { transform: rotate(-5deg); }
}
@keyframes badgePop {
  0% { transform: scale(0); }
  70% { transform: scale(1.25); }
  100% { transform: scale(1); }
}
@keyframes drawerSlideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes notifFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.nb-bell-btn {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  transition: background 0.15s;
}
.nb-bell-btn:hover { background: var(--divider-color); }
.nb-bell-icon.has-pending {
  animation: bellPulse 1.8s ease-in-out infinite;
  color: var(--primary-color, #e53935);
}
.nb-badge {
  position: absolute;
  top: 0px; right: 0px;
  min-width: 18px; height: 18px;
  background: var(--danger-color, #e53935);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
  animation: badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  pointer-events: none;
}
.nb-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 9998;
  backdrop-filter: blur(2px);
}
.nb-drawer {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: min(420px, 100vw);
  background: var(--background-color, #fff);
  box-shadow: -4px 0 32px rgba(0,0,0,0.15);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: drawerSlideIn 0.28s cubic-bezier(0.16,1,0.3,1);
}
.nb-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--divider-color, #eee);
  background: var(--surface-color, #fafafa);
}
.nb-drawer-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex; align-items: center; gap: 0.5rem;
  margin: 0;
}
.nb-close-btn {
  background: none; border: none; cursor: pointer;
  padding: 6px; border-radius: 50%;
  color: var(--text-secondary);
  display: flex; align-items: center;
  transition: background 0.15s;
}
.nb-close-btn:hover { background: var(--divider-color); }
.nb-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.nb-empty {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}
.nb-empty p { font-size: 0.9rem; margin-top: 0.5rem; }
.nb-card {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 14px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  animation: notifFadeIn 0.25s ease;
  position: relative;
  overflow: hidden;
}
.nb-card::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
}
.nb-card.type-table::before { background: var(--primary-color, #e53935); }
.nb-card.type-whatsapp::before { background: #25d366; }
.nb-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.nb-card-type {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.nb-card.type-table .nb-card-type { color: var(--primary-color, #e53935); }
.nb-card.type-whatsapp .nb-card-type { color: #25d366; }
.nb-card-time {
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
}
.nb-items {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.nb-item {
  font-size: 0.82rem;
  color: var(--text-primary);
  display: flex;
  gap: 0.35rem;
}
.nb-item-qty {
  font-weight: 700;
  color: var(--primary-color, #e53935);
  flex-shrink: 0;
}
.nb-total {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
  border-top: 1px solid var(--divider-color, #eee);
  padding-top: 0.5rem;
  display: flex;
  justify-content: space-between;
}
.nb-actions {
  display: flex;
  gap: 0.5rem;
}
.nb-btn-accept {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  border: none;
  background: var(--primary-color, #e53935);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.nb-btn-accept:hover { opacity: 0.88; }
.nb-btn-accept:active { transform: scale(0.97); }
.nb-btn-accept:disabled { opacity: 0.5; cursor: not-allowed; }
.nb-btn-dismiss {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--border-color, #ddd);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.nb-btn-dismiss:hover { background: var(--divider-color); }
`;

function formatTime(date: Date) {
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

interface NotifCardProps {
    order: DigitalOrder;
    onAccept: () => Promise<void>;
    onDismiss: () => Promise<void>;
}

function NotifCard({ order, onAccept, onDismiss }: NotifCardProps) {
    const [loading, setLoading] = useState(false);
    const isTable = order.type === 'table';

    const handleAccept = async () => {
        setLoading(true);
        try { await onAccept(); } finally { setLoading(false); }
    };
    const handleDismiss = async () => {
        setLoading(true);
        try { await onDismiss(); } finally { setLoading(false); }
    };

    return (
        <div className={`nb-card type-${order.type}`}>
            <div className="nb-card-header">
                <span className="nb-card-type">
                    {isTable
                        ? <><Utensils size={13} /> Mesa {order.tableNumber}</>
                        : <><MessageCircle size={13} /> WhatsApp</>
                    }
                </span>
                <span className="nb-card-time">{formatTime(order.createdAt)}</span>
            </div>

            <ul className="nb-items">
                {order.items.slice(0, 5).map((item, i) => (
                    <li key={i} className="nb-item">
                        <span className="nb-item-qty">{item.quantity}x</span>
                        <span>{item.productName}</span>
                    </li>
                ))}
                {order.items.length > 5 && (
                    <li className="nb-item" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        +{order.items.length - 5} más...
                    </li>
                )}
            </ul>

            <div className="nb-total">
                <span>Total</span>
                <span>{order.currency} {order.total.toFixed(2)}</span>
            </div>

            {order.customerName && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    👤 {order.customerName}
                </div>
            )}

            <div className="nb-actions">
                {isTable ? (
                    <>
                        <button
                            className="nb-btn-accept"
                            onClick={handleAccept}
                            disabled={loading}
                        >
                            <CheckCircle2 size={15} />
                            {loading ? 'Procesando...' : 'Aceptar Pedido'}
                        </button>
                        <button className="nb-btn-dismiss" onClick={handleDismiss} disabled={loading} title="Rechazar">
                            <X size={14} />
                        </button>
                    </>
                ) : (
                    <button className="nb-btn-accept" onClick={handleDismiss} disabled={loading} style={{ background: '#25d366' }}>
                        <CheckCircle2 size={15} />
                        {loading ? '...' : 'Visto — WhatsApp enviado'}
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { pendingOrders, acceptTableOrder, dismissOrder } = useDigitalOrders();
    const prevLen = useRef(pendingOrders.length);
    const drawerRef = useRef<HTMLDivElement>(null);

    // Inject styles once
    useEffect(() => {
        const id = 'nb-styles';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = css;
            document.head.appendChild(style);
        }
    }, []);

    // Auto-open drawer on new notification (only if drawer is closed)
    useEffect(() => {
        if (pendingOrders.length > prevLen.current && !open) {
            // Small delay to let animation play first
            setTimeout(() => setOpen(true), 600);
        }
        prevLen.current = pendingOrders.length;
    }, [pendingOrders.length]);

    const count = pendingOrders.length;

    return (
        <>
            <button
                className="nb-bell-btn"
                onClick={() => setOpen(o => !o)}
                aria-label={`Notificaciones (${count})`}
                title={count > 0 ? `${count} pedido(s) pendiente(s)` : 'Sin notificaciones'}
            >
                <Bell
                    size={22}
                    className={`nb-bell-icon ${count > 0 ? 'has-pending' : ''}`}
                />
                {count > 0 && (
                    <span className="nb-badge" key={count}>{count > 9 ? '9+' : count}</span>
                )}
            </button>

            {open && createPortal(
                <>
                    <div className="nb-overlay" onClick={() => setOpen(false)} />
                    <div className="nb-drawer" ref={drawerRef}>
                        <div className="nb-drawer-header">
                            <h2 className="nb-drawer-title">
                                <Bell size={18} />
                                Pedidos Digitales
                                {count > 0 && (
                                    <span style={{
                                        background: 'var(--danger-color, #e53935)',
                                        color: '#fff',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        padding: '2px 7px',
                                        borderRadius: '999px',
                                    }}>{count}</span>
                                )}
                            </h2>
                            <button className="nb-close-btn" onClick={() => setOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="nb-list">
                            {count === 0 ? (
                                <div className="nb-empty">
                                    <Bell size={40} strokeWidth={1} style={{ opacity: 0.2 }} />
                                    <p>No hay pedidos digitales pendientes</p>
                                </div>
                            ) : (
                                pendingOrders.map(order => (
                                    <NotifCard
                                        key={order.id}
                                        order={order}
                                        onAccept={() => acceptTableOrder(order)}
                                        onDismiss={() => dismissOrder(order.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </>
                , document.body)}
        </>
    );
}
