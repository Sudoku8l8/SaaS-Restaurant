import { useState } from 'react';
import { Lock } from 'lucide-react';
import { OrderModal } from '@/components/features/OrderModal';
import { TableDetailModal } from '@/components/features/TableDetailModal';
import { TableMap } from '@/components/features/TableMap';
import { Button } from '@/components/shared';
import { TableSkeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useTables } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import { useClosureStatus } from '@/hooks/useClosureStatus';
import type { RestaurantTable, Order } from '@/types';

export const TAKEOUT_NEW_ID = 'takeout-new-wildcard';

export function MozoPage() {
    const { user, logout } = useAuth();
    const { tables } = useTables(); // Real-time tables from Firestore
    const { activeOrders } = useOrders();
    const { isClosed, isLoading: checkingClosure } = useClosureStatus();
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<Order | undefined>(undefined);
    const [takeoutOrderType, setTakeoutOrderType] = useState<'dine-in' | 'takeout'>('dine-in');

    const takeoutOrders = activeOrders?.filter(o => o.orderType === 'takeout') || [];

    // Synthesize the "New Takeout" Card
    const newTakeoutCard: RestaurantTable = {
        id: TAKEOUT_NEW_ID,
        number: 0,
        status: 'free',
        restaurantId: user?.restaurantId || '',
    };

    // Synthesize cards for each ACTIVE takeout order
    const dynamicTakeoutCards: RestaurantTable[] = takeoutOrders.map(order => ({
        id: `takeout-order-${order.id}`,
        number: 0, // 0 indicates it's a takeout type
        status: 'occupied',
        restaurantId: order.restaurantId,
        currentOrderId: order.id, // Direct link to order
    }));

    const handleTableClick = (table: RestaurantTable) => {
        // Case: Create new Takeout
        if (table.id === TAKEOUT_NEW_ID) {
            handleOpenTakeoutModal();
            return;
        }

        // Case: Edit/View existing Takeout Order from virtual table
        if (table.id.startsWith('takeout-order-')) {
            setSelectedTable(table);
            setIsDetailModalOpen(true);
            return;
        }

        // Standard Table Logic
        // Block new orders if cash box is closed
        if (isClosed && table.status === 'free') {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.\nContacta al administrador si necesitas reabrir.');
            return;
        }

        if (table.status === 'free') {
            setSelectedTable(table);
            setOrderToEdit(undefined);
            setTakeoutOrderType('dine-in'); // Reset order type for table orders
            setIsOrderModalOpen(true);
        } else if (table.status === 'occupied') {
            setSelectedTable(table);
            setIsDetailModalOpen(true);
        }
    };

    const handleCloseOrderModal = () => {
        setIsOrderModalOpen(false);
        setSelectedTable(null);
        setOrderToEdit(undefined);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTable(null);
    };

    const handleEditOrder = (order: Order) => {
        setOrderToEdit(order);
        setIsDetailModalOpen(false); // Close detail to open edit
        setIsOrderModalOpen(true);
        setTakeoutOrderType(order.orderType || 'dine-in');
    };

    const handleOpenTakeoutModal = () => {
        if (isClosed) {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.');
            return;
        }
        setOrderToEdit(undefined);
        setTakeoutOrderType('takeout');
        setIsOrderModalOpen(true);
    };

    if (!tables || checkingClosure) {
        return (
            <div className="container mt-md">
                <div style={{ height: '60px', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--divider-color)' }} />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {[...Array(12)].map((_, i) => (
                        <TableSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // Concatenate physical tables first, then virtual tables (Active Takeouts + New)
    const allTables = [
        ...[...tables].sort((a, b) => a.number - b.number),
        ...dynamicTakeoutCards,
        newTakeoutCard
    ];

    return (
        <div className="container mt-md">
            {/* Closure Banner */}
            {isClosed && (
                <div style={{
                    background: 'var(--danger-color)',
                    color: 'white',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <Lock size={20} />
                        <div>
                            <strong style={{ display: 'block', fontSize: '1rem', letterSpacing: '0.05em' }}>SISTEMA CERRADO</strong>
                            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
                                Las operaciones han finalizado por hoy.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm) 0',
                borderBottom: '1px solid var(--divider-color)',
                flexWrap: 'nowrap'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', flex: 1, minWidth: 0 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-family)',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        Servicio de Mesas
                    </h1>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    background: 'var(--surface-color)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0
                }}>
                    <div style={{ textAlign: 'right', minWidth: 'fit-content' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em', lineHeight: 1 }}>{user?.name}</p>
                        <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.85rem' }}>Mozo</p>
                    </div>
                    <Button variant="outline" onClick={logout} size="sm" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}>
                        Salir
                    </Button>
                </div>
            </header>

            <TableMap
                tables={allTables}
                activeOrders={activeOrders}
                onTableClick={handleTableClick}
            />

            {(isOrderModalOpen && (selectedTable || takeoutOrderType === 'takeout') && !isClosed) && (
                <OrderModal
                    table={selectedTable || undefined}
                    initialOrder={orderToEdit}
                    onClose={handleCloseOrderModal}
                    onOrderCreated={() => { /* Order saved, let modal handle closure */ }}
                    orderType={takeoutOrderType}
                />
            )}

            {isDetailModalOpen && selectedTable && (
                <TableDetailModal
                    table={selectedTable}
                    onClose={handleCloseDetailModal}
                    onEdit={handleEditOrder}
                />
            )}
        </div>
    );
}
