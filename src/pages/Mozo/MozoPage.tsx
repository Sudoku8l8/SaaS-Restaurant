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
                marginBottom: 'var(--spacing-xl)',
                flexWrap: 'wrap',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
                borderBottom: '1px solid var(--divider-color)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-family)'
                    }}>
                        {viewMode === 'tables' ? 'Servicio de Mesas' : 'Pedidos Para Llevar'}
                    </h1>

                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        background: 'var(--divider-color)',
                        padding: '4px',
                        borderRadius: 'var(--radius-full)',
                        width: 'fit-content'
                    }}>
                        <button
                            onClick={() => setViewMode('tables')}
                            style={{
                                background: viewMode === 'tables' ? 'var(--surface-color)' : 'transparent',
                                color: viewMode === 'tables' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '0.5rem 1.25rem',
                                borderRadius: 'var(--radius-full)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                transition: 'all var(--transition-speed)',
                                boxShadow: viewMode === 'tables' ? 'var(--shadow-sm)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                            }}
                        >
                            <Utensils size={16} /> Mesas
                        </button>
                        <button
                            onClick={() => setViewMode('takeout')}
                            style={{
                                background: viewMode === 'takeout' ? 'var(--surface-color)' : 'transparent',
                                color: viewMode === 'takeout' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '0.5rem 1.25rem',
                                borderRadius: 'var(--radius-full)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                                transition: 'all var(--transition-speed)',
                                boxShadow: viewMode === 'takeout' ? 'var(--shadow-sm)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)'
                            }}
                        >
                            <ShoppingBag size={16} /> Para Llevar
                        </button>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-lg)',
                    background: 'var(--surface-color)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mozo</p>
                        <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '600' }}>{user?.name}</p>
                    </div>
                    <Button variant="outline" onClick={logout} size="sm" style={{ padding: '0.5rem 1rem' }}>
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
                            backgroundColor: '#1e1e1e',
                            borderRadius: '16px',
                            padding: '4rem',
                            textAlign: 'center',
                            border: '1px solid #333'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                backgroundColor: '#333',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto',
                                color: '#666'
                            }}>
                                <ShoppingBag size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white' }}>No hay pedidos para llevar</h2>
                            <p style={{ color: '#888', marginBottom: '2rem' }}>Crea un nuevo pedido para comenzar</p>
                            <Button
                                variant="primary"
                                onClick={handleOpenTakeoutModal}
                                style={{ backgroundColor: '#f97316', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
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
                                    border: '2px dashed #444',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    minHeight: '200px',
                                    transition: 'border-color 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#666'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}
                            >
                                <div style={{ background: '#333', borderRadius: '50%', padding: '1rem', marginBottom: '1rem' }}>
                                    <ShoppingBag size={24} color="#aaa" />
                                </div>
                                <span style={{ color: '#aaa', fontWeight: '500' }}>Nuevo Pedido</span>
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
