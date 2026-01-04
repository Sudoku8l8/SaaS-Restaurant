import { useRef } from 'react';
import { Card, Button } from '@/components/shared';
import { OrderCard } from '@/components/features/OrderCard';
import { useOrders } from '@/hooks/useOrders';
import type { RestaurantTable } from '@/types';

interface TableDetailModalProps {
    table: RestaurantTable;
    onClose: () => void;
}

export function TableDetailModal({ table, onClose }: TableDetailModalProps) {
    const { activeOrders } = useOrders();
    // Assuming table has currentOrderId or looking up by table number
    // For robustness, let's find the active order for this table
    const order = activeOrders?.find(o => o.tableNumber === table.number && o.id === table.currentOrderId);
    // Backup check if currentOrderId might be desynced but an active order exists for this table
    const fallbackOrder = activeOrders?.find(o => o.tableNumber === table.number);

    const activeOrder = order || fallbackOrder;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <Card title={`Mesa ${table.number} - Detalle`}>
                    {activeOrder ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <OrderCard order={activeOrder} />
                            </div>
                            <Button variant="secondary" fullWidth onClick={onClose}>
                                Cerrar
                            </Button>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p>No se encontró un pedido activo para esta mesa.</p>
                            <Button variant="secondary" onClick={onClose}>
                                Cerrar
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
