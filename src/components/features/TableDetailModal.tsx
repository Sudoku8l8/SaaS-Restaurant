import { Button } from '@/components/shared';
import { OrderCard } from '@/components/features/OrderCard';
import { useOrders } from '@/hooks/useOrders';
import { X, Pencil, Table2 } from 'lucide-react';
import type { RestaurantTable } from '@/types';

interface TableDetailModalProps {
    table: RestaurantTable;
    onClose: () => void;
    onEdit?: (order: any) => void;
}

export function TableDetailModal({ table, onClose, onEdit }: TableDetailModalProps) {
    const { activeOrders } = useOrders();
    const order = activeOrders?.find(o => o.tableNumber === table.number && o.id === table.currentOrderId);
    const fallbackOrder = activeOrders?.find(o => o.tableNumber === table.number);
    const activeOrder = order || fallbackOrder;

    const isFree = table.status === 'free';
    const statusColor = isFree ? 'var(--success-color)' : 'var(--warning-color)';
    const statusBg = isFree ? 'rgba(127, 176, 105, 0.1)' : 'rgba(220, 158, 130, 0.15)';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000,
            backdropFilter: 'blur(16px)',
            padding: '1rem'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '450px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: 'var(--surface-color)',
                border: `2px solid ${statusColor}`,
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                boxShadow: `0 20px 50px ${isFree ? 'rgba(127, 176, 105, 0.2)' : 'rgba(220, 158, 130, 0.25)'}`,
                scrollbarWidth: 'none'
            }}>
                <div style={{
                    padding: '1.5rem 1.75rem',
                    borderBottom: '1px solid var(--divider-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: statusBg,
                    borderTopLeftRadius: 'var(--radius-lg)',
                    borderTopRightRadius: 'var(--radius-lg)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '48px',
                            height: '44px',
                            borderRadius: '12px',
                            background: statusColor,
                            color: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '1rem',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                            lineHeight: 1
                        }}>
                            <Table2 size={16} />
                            <span>{table.number}</span>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Mesa {table.number}</h3>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: statusColor, letterSpacing: '0.05em' }}>
                                {isFree ? 'Disponible' : 'En Servicio'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'var(--divider-color)',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {activeOrder ? (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <OrderCard order={activeOrder} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Button variant="outline" onClick={onClose} style={{ borderRadius: 'var(--radius-md)' }}>
                                    Cerrar
                                </Button>
                                {activeOrder.status !== 'paid' && onEdit && (
                                    <Button
                                        variant="primary"
                                        onClick={() => onEdit(activeOrder)}
                                        style={{
                                            background: 'var(--primary-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            borderRadius: 'var(--radius-md)',
                                            fontWeight: '700'
                                        }}
                                    >
                                        <Pencil size={18} /> Editar
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'var(--divider-color)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem',
                                color: 'var(--success-color)'
                            }}>
                                <X size={32} /> {/* Using X as a placeholder for check or similar if needed, but let's just use text for now */}
                            </div>
                            <p style={{ marginBottom: '1.5rem', fontWeight: '500' }}>Esta mesa no tiene pedidos activos.</p>
                            <Button variant="primary" onClick={onClose} style={{ background: 'var(--primary-color)', width: '100%' }}>
                                Entendido
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
