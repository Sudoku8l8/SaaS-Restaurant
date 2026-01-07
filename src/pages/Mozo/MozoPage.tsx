import { useState } from 'react';
import { Lock, ShoppingBag, Utensils } from 'lucide-react';
import { TableCard } from '@/components/features/TableCard';
import { OrderModal } from '@/components/features/OrderModal';
import { TableDetailModal } from '@/components/features/TableDetailModal';
import { OrderCard } from '@/components/features/OrderCard';
import { Button } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { useTables } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import { useClosureStatus } from '@/hooks/useClosureStatus';
import { seedFirestore } from '@/services/firebase/seeders';
import type { RestaurantTable, Order } from '@/types';

export function MozoPage() {
    const { user, logout } = useAuth();
    const { tables } = useTables(); // Real-time tables from Firestore
    const { activeOrders } = useOrders();
    const { isClosed, isLoading: checkingClosure } = useClosureStatus();
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<Order | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'tables' | 'takeout'>('tables');
    const [takeoutOrderType, setTakeoutOrderType] = useState<'dine-in' | 'takeout'>('dine-in');

    const takeoutOrders = activeOrders?.filter(o => o.orderType === 'takeout') || [];

    const handleTableClick = (table: RestaurantTable) => {
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
        setIsDetailModalOpen(false);
        setSelectedTable(null);
    };

    const handleEditOrder = (order: Order) => {
        setOrderToEdit(order);
        setIsDetailModalOpen(false); // Close detail to open edit
        setIsOrderModalOpen(true);
        // Determine type based on order content, though usually table-based from this flow
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

    const handleEditTakeoutOrder = (order: Order) => {
        setOrderToEdit(order);
        setTakeoutOrderType('takeout');
        setIsOrderModalOpen(true);
    };

    if (!tables || checkingClosure) return <div className="p-4">Cargando mesas...</div>;

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
                flexWrap: 'nowrap' // Prevent wrapping to keep items on same line
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', flex: 1, minWidth: 0 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.4rem', // Slightly smaller for better fit
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-family)',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {viewMode === 'tables' ? 'Servicio de Mesas' : 'Para Llevar'}
                    </h1>

                    <div style={{
                        display: 'flex',
                        gap: '2px',
                        background: 'var(--divider-color)',
                        padding: '3px',
                        borderRadius: 'var(--radius-full)',
                        width: 'fit-content',
                        transform: 'scale(0.9)', // Compact view
                        transformOrigin: 'left'
                    }}>
                        <button
                            onClick={() => setViewMode('tables')}
                            style={{
                                background: viewMode === 'tables' ? 'var(--surface-color)' : 'transparent',
                                color: viewMode === 'tables' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '0.4rem 1rem',
                                borderRadius: 'var(--radius-full)',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s',
                                boxShadow: viewMode === 'tables' ? 'var(--shadow-sm)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Utensils size={14} /> Mesas
                        </button>
                        <button
                            onClick={() => setViewMode('takeout')}
                            style={{
                                background: viewMode === 'takeout' ? 'var(--surface-color)' : 'transparent',
                                color: viewMode === 'takeout' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '0.4rem 1rem',
                                borderRadius: 'var(--radius-full)',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s',
                                boxShadow: viewMode === 'takeout' ? 'var(--shadow-sm)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <ShoppingBag size={14} /> Llevar
                        </button>
                    </div>
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
                    flexShrink: 0 // Don't let the user box shrink too much
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

            {viewMode === 'tables' ? (
                /* TABLES GRID */
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {tables.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                            <p>No se encontraron mesas.</p>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    localStorage.removeItem('db_seeded'); // Reset cache
                                    seedFirestore().then(() => window.location.reload());
                                }}
                            >
                                Inicializar Base de Datos (Seeder)
                            </Button>
                        </div>
                    )}

                    {tables.sort((a, b) => a.number - b.number).map(table => (
                        <TableCard
                            key={table.id}
                            table={table}
                            onClick={() => handleTableClick(table)}
                        />
                    ))}
                </div>
            ) : (
                /* TAKEOUT VIEW */
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ color: '#888' }}>{takeoutOrders.length} pedidos activos</span>
                    </div>

                    {takeoutOrders.length === 0 ? (
                        <div style={{
                            backgroundColor: 'var(--surface-color)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '4rem',
                            textAlign: 'center',
                            border: '1px solid var(--border-color)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                backgroundColor: 'var(--divider-color)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                                color: 'var(--primary-color)'
                            }}>
                                <ShoppingBag size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: '800' }}>No hay pedidos para llevar</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: '500' }}>Crea un nuevo pedido para comenzar</p>
                            <Button
                                variant="primary"
                                onClick={handleOpenTakeoutModal}
                                style={{ background: 'var(--primary-color)', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem', borderRadius: 'var(--radius-md)', fontWeight: '700' }}
                            >
                                <ShoppingBag size={18} /> Crear Pedido
                            </Button>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {/* Create New Card */}
                            <div
                                onClick={handleOpenTakeoutModal}
                                style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    minHeight: '220px',
                                    transition: 'all 0.2s',
                                    backgroundColor: 'var(--surface-color)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                                    e.currentTarget.style.backgroundColor = 'var(--divider-color)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                                }}
                            >
                                <div style={{ background: 'var(--divider-color)', borderRadius: '50%', padding: '1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                                    <ShoppingBag size={24} />
                                </div>
                                <span style={{ color: 'var(--text-primary)', fontWeight: '700' }}>Nuevo Pedido</span>
                            </div>

                            {/* Order Cards */}
                            {takeoutOrders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    onEdit={() => handleEditTakeoutOrder(order)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {(isOrderModalOpen && (selectedTable || takeoutOrderType === 'takeout') && !isClosed) && (
                <OrderModal
                    table={selectedTable || undefined} // Can be undefined for takeout
                    initialOrder={orderToEdit}
                    onClose={handleCloseOrderModal}
                    onOrderCreated={handleCloseOrderModal}
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
