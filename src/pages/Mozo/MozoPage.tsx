import { useState } from 'react';
import { Lock, ShoppingBag } from 'lucide-react';
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
                    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)'
                }}>
                    <div>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Lock size={16} /> CAJA CERRADA</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                            Las operaciones del día han sido cerradas. Solo consulta disponible.
                        </p>
                    </div>
                </div>
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>{viewMode === 'tables' ? 'Mesas' : 'Pedidos Para Llevar'}</h1>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setViewMode('tables')}
                            style={{
                                background: viewMode === 'tables' ? 'white' : 'transparent',
                                color: viewMode === 'tables' ? 'black' : '#aaa',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Mesas
                        </button>
                        <button
                            onClick={() => setViewMode('takeout')}
                            style={{
                                background: viewMode === 'takeout' ? '#2563eb' : 'transparent',
                                color: viewMode === 'takeout' ? 'white' : '#aaa',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <ShoppingBag size={18} /> Para Llevar
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <p style={{ margin: 0, color: '#aaa' }}>Hola, {user?.name}</p>
                    <Button variant="secondary" onClick={logout}>
                        Cerrar Sesión
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
