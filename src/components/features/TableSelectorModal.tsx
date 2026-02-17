import { X, UtensilsCrossed } from 'lucide-react';
import { TableCard } from './TableCard';
import type { RestaurantTable, Order } from '@/types';

interface TableSelectorModalProps {
    tables: RestaurantTable[];
    activeOrders: Order[] | undefined;
    onTableClick: (table: RestaurantTable) => void;
    onClose: () => void;
}

/**
 * Modal overlay showing a responsive grid of tables for order creation.
 * Reusable by CocinaPage and AdminPage via useOrderCreation hook.
 */
export function TableSelectorModal({
    tables,
    activeOrders,
    onTableClick,
    onClose,
}: TableSelectorModalProps) {

    const physicalTables = tables.filter(t => t.number > 0);
    const takeoutCards = tables.filter(t => t.number === 0);

    const getTableOrder = (table: RestaurantTable) => {
        if (table.currentOrderId) {
            return activeOrders?.find(o => o.id === table.currentOrderId);
        }
        return activeOrders?.find(o => o.tableNumber === table.number && table.number > 0);
    };

    const freeTables = physicalTables.filter(t => t.status === 'free');
    const occupiedTables = physicalTables.filter(t => t.status !== 'free');

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 950,
                backdropFilter: 'blur(8px)',
                padding: '1rem',
                animation: 'fadeIn 0.2s ease-out',
            }}
        >
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div style={{
                width: '100%',
                maxWidth: '720px',
                maxHeight: '85vh',
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease-out',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                    color: 'white',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <UtensilsCrossed size={22} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800' }}>
                                Seleccionar Mesa
                            </h2>
                            <p style={{
                                margin: 0,
                                fontSize: '0.8rem',
                                opacity: 0.85,
                                fontWeight: '500',
                            }}>
                                {freeTables.length} libre{freeTables.length !== 1 ? 's' : ''} · {occupiedTables.length} ocupada{occupiedTables.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.25rem 1.5rem',
                    scrollbarWidth: 'thin',
                }}>
                    {/* Legend */}
                    <div style={{
                        display: 'flex',
                        gap: '1.25rem',
                        marginBottom: '1.25rem',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--success-color)' }} />
                            Libre
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--warning-color)' }} />
                            Ocupada
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                            Para Llevar
                        </div>
                    </div>

                    {/* Physical Tables Grid */}
                    {physicalTables.length > 0 && (
                        <>
                            <h4 style={{
                                margin: '0 0 0.75rem 0',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: 'var(--text-secondary)',
                            }}>
                                Mesas del local
                            </h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: '1rem',
                                marginBottom: '1.5rem',
                            }}>
                                {physicalTables.map(table => {
                                    const order = getTableOrder(table);
                                    return (
                                        <TableCard
                                            key={table.id}
                                            table={table}
                                            onClick={onTableClick}
                                            orderStatus={order?.status}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Takeout Section */}
                    {takeoutCards.length > 0 && (
                        <>
                            <h4 style={{
                                margin: '0 0 0.75rem 0',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: 'var(--text-secondary)',
                            }}>
                                Para Llevar
                            </h4>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                gap: '1rem',
                            }}>
                                {takeoutCards.map(table => {
                                    const order = getTableOrder(table);
                                    return (
                                        <TableCard
                                            key={table.id}
                                            table={table}
                                            onClick={onTableClick}
                                            orderStatus={order?.status}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {physicalTables.length === 0 && takeoutCards.length === 0 && (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem 1rem',
                            color: 'var(--text-secondary)',
                        }}>
                            <UtensilsCrossed size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p style={{ fontWeight: '600' }}>No hay mesas configuradas</p>
                            <p style={{ fontSize: '0.85rem' }}>Configura mesas desde el panel de administración.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
