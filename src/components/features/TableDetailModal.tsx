import { Button } from '@/components/shared';
import { OrderCard } from '@/components/features/OrderCard';
import { useOrders } from '@/hooks/useOrders';
import { X, Pencil } from 'lucide-react';
import type { RestaurantTable } from '@/types';

interface TableDetailModalProps {
    table: RestaurantTable;
    onClose: () => void;
    onEdit?: (order: any) => void;
}

export function TableDetailModal({ table, onClose, onEdit }: TableDetailModalProps) {
    const { activeOrders } = useOrders();
    // Assuming table has currentOrderId or looking up by table number
    // For robustness, let's find the active order for this table
    const order = activeOrders?.find(o => o.tableNumber === table.number && o.id === table.currentOrderId);
    // Backup check if currentOrderId might be desynced but an active order exists for this table
    const fallbackOrder = activeOrders?.find(o => o.tableNumber === table.number);

    const activeOrder = order || fallbackOrder;

    // Dark Theme Styles
    const darkTheme = {
        bg: '#121212',
        surface: '#1e1e1e',
        border: '#333333',
        textPrimary: '#ffffff',
        textSecondary: '#a0a0a0',
        primary: '#2563eb'
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: darkTheme.bg,
                border: `1px solid ${darkTheme.border}`,
                borderRadius: '16px',
                color: darkTheme.textPrimary,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: `1px solid ${darkTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Mesa {table.number} - Detalle</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: darkTheme.textSecondary, cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {activeOrder ? (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <OrderCard order={activeOrder} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Button variant="secondary" onClick={onClose} style={{ borderColor: darkTheme.border, color: darkTheme.textPrimary }}>
                                    Cerrar
                                </Button>
                                {activeOrder.status !== 'paid' && onEdit && (
                                    <Button variant="primary" onClick={() => onEdit(activeOrder)} style={{ background: darkTheme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <Pencil size={16} /> Editar
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: darkTheme.textSecondary }}>
                            <p style={{ marginBottom: '1.5rem' }}>No se encontró un pedido activo para esta mesa.</p>
                            <Button variant="secondary" onClick={onClose}>
                                Cerrar
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
