import { useState } from 'react';
import { Lock, ShieldCheck, ChefHat } from 'lucide-react';
import type { RestaurantTable, Order } from '@/types';
import { OrderModal } from '@/components/features/OrderModal';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useClosureStatus } from '@/hooks/useClosureStatus';
import { Button } from '@/components/shared';
import { OrderCard } from '@/components/features/OrderCard';
import { OrderStatus } from '@/types';

export function CocinaPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { activeOrders, deleteOrder } = useOrders();
    const { isClosed } = useClosureStatus();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [orderToEdit, setOrderToEdit] = useState<Order | undefined>(undefined);

    if (!activeOrders) return (
        <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.2rem', color: '#9ca3af' }}>Cargando pedidos...</div>
        </div>
    );

    const filteredOrders = activeOrders.filter(order =>
        filterStatus === 'all' ? true : order.status === filterStatus
    );

    const getCount = (status: OrderStatus) => activeOrders.filter(o => o.status === status).length;

    const handleDelete = async (orderId: string) => {
        if (confirm('¿Estás seguro de eliminar este pedido? Esta acción liberará la mesa.')) {
            await deleteOrder(orderId);
        }
    };

    // Helper to construct minimal table object for OrderModal
    const getMinimalTable = (order: Order): RestaurantTable => ({
        id: 'temp', // Not used for update
        restaurantId: user?.restaurantId || '',
        number: order.tableNumber,
        status: 'occupied',
        capacity: 4 // Dummy
    });

    const FilterButton = ({ status, label }: { status: OrderStatus | 'all', label: string }) => {
        const isActive = filterStatus === status;
        const count = status === 'all' ? activeOrders.length : getCount(status as OrderStatus);

        return (
            <button
                onClick={() => setFilterStatus(status)}
                style={{
                    backgroundColor: isActive ? '#2563eb' : '#1f2937',
                    color: isActive ? 'white' : '#9ca3af',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                }}
            >
                {label}
                {count > 0 && (
                    <span style={{
                        backgroundColor: isActive ? '#1d4ed8' : '#374151',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        minWidth: '20px',
                        textAlign: 'center'
                    }}>
                        {count}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#121212', paddingBottom: '2rem' }}>
            {/* Dark Header */}
            <div style={{ backgroundColor: '#1e1e1e', borderBottom: '1px solid #333', padding: '1.5rem 0', marginBottom: '2rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px', height: '48px',
                            backgroundColor: '#c2410c', // Orange Chef
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white'
                        }}>
                            <ChefHat size={28} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>Pantalla de Cocina</h1>
                            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem' }}>
                                Hola, {user?.name} &bull; {filteredOrders.length} pedido(s) visible(s)
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            variant="secondary"
                            onClick={() => navigate(`/${restaurantSlug}/admin`)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                backgroundColor: '#374151', border: '1px solid #4b5563', color: 'white'
                            }}
                        >
                            <ShieldCheck size={18} /> Admin
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={logout}
                            style={{ backgroundColor: '#ef4444', border: 'none', color: 'white' }}
                        >
                            Salir
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container">
                {/* Closure Banner */}
                {isClosed && (
                    <div style={{
                        background: 'linear-gradient(135deg, #7f1d1d, #450a0a)',
                        color: '#fca5a5',
                        padding: '1rem 1.5rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        border: '1px solid #991b1b',
                        display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <Lock size={20} />
                        <div>
                            <strong style={{ display: 'block', color: 'white' }}>CAJA CERRADA</strong>
                            <span style={{ fontSize: '0.9rem' }}>Las operaciones del día han sido cerradas.</span>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#9ca3af', fontWeight: 'bold' }}>Filtros:</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <FilterButton status="all" label="Todos" />
                        <FilterButton status="pending" label="Pendientes" />
                        <FilterButton status="in_preparation" label="En Preparación" />
                        <FilterButton status="ready" label="Listos" />
                    </div>
                </div>

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {filteredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onEdit={() => setOrderToEdit(order)}
                            onDelete={() => handleDelete(order.id)}
                        />
                    ))}

                    {activeOrders.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: '#4b5563' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.2 }}>🍽️</div>
                            <h3 style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>No hay pedidos pendientes</h3>
                            <p>Los nuevos pedidos aparecerán aquí automáticamente.</p>
                        </div>
                    )}
                </div>
            </div>

            {orderToEdit && user?.restaurantId && (
                <OrderModal
                    table={getMinimalTable(orderToEdit)}
                    initialOrder={orderToEdit}
                    onClose={() => setOrderToEdit(undefined)}
                    onOrderCreated={() => setOrderToEdit(undefined)}
                />
            )}
        </div>
    );
}
