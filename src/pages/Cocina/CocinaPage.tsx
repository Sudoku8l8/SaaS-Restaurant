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
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Cargando pedidos...</div>
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
                    backgroundColor: isActive ? 'var(--primary-color)' : 'var(--surface-color)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary-color)' : 'var(--border-color)',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    fontSize: '0.9rem'
                }}
            >
                {label}
                {count > 0 && (
                    <span style={{
                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--divider-color)',
                        color: isActive ? 'white' : 'var(--text-primary)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        minWidth: '22px',
                        textAlign: 'center',
                        fontWeight: '800'
                    }}>
                        {count}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', padding: '1.25rem 0', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                            width: '48px', height: '48px',
                            backgroundColor: 'var(--divider-color)',
                            borderRadius: '14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--primary-color)',
                            border: '1px solid var(--border-color)'
                        }}>
                            <ChefHat size={30} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.01em' }}>Cocina</h1>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                                Hola, <span style={{ color: 'var(--primary-color)' }}>{user?.name}</span> &bull; {filteredOrders.length} pedido(s) activos
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/${restaurantSlug}/admin`)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.6rem 1.2rem', fontWeight: '700'
                            }}
                        >
                            <ShieldCheck size={18} /> Admin
                        </Button>
                        <Button
                            variant="primary"
                            onClick={logout}
                            style={{ backgroundColor: 'var(--danger-color)', border: 'none', color: 'white', padding: '0.6rem 1.5rem', fontWeight: '700' }}
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
                        background: 'var(--surface-color)',
                        color: 'var(--danger-color)',
                        padding: '1.25rem 2rem',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '2.5rem',
                        border: '1px solid var(--border-color)',
                        borderLeft: '5px solid var(--danger-color)',
                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <Lock size={22} />
                        <div>
                            <strong style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Servicio Finalizado</strong>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Se ha realizado el cierre de caja. Solo lectura.</span>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visualización:</span>
                    <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
                        <FilterButton status="all" label="Todos" />
                        <FilterButton status="pending" label="Pendientes" />
                        <FilterButton status="in_preparation" label="En Cocina" />
                        <FilterButton status="ready" label="Listos" />
                    </div>
                </div>

                {/* Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
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
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', borderStyle: 'dashed' }}>
                            <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', opacity: 0.15 }}>⚡</div>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '800', fontSize: '1.25rem' }}>No hay pedidos en curso</h3>
                            <p style={{ fontWeight: '500' }}>Los pedidos que generen los mozos aparecerán aquí al instante.</p>
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
