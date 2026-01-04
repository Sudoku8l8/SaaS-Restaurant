import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useClosureStatus } from '@/hooks/useClosureStatus';
import { Button, Badge } from '@/components/shared';
import { OrderCard } from '@/components/features/OrderCard';
import { OrderStatus } from '@/types';

export function CocinaPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { activeOrders } = useOrders();
    const { isClosed } = useClosureStatus();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

    if (!activeOrders) return <div className="p-4">Cargando pedidos...</div>;

    const filteredOrders = activeOrders.filter(order =>
        filterStatus === 'all' ? true : order.status === filterStatus
    );

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
                    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)'
                }}>
                    <strong>🔒 CAJA CERRADA</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                        Las operaciones del día han sido cerradas.
                    </p>
                </div>
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Pantalla de Cocina</h1>
                    <p>Hola, {user?.name} - {filteredOrders.length} pedidos</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="primary" onClick={() => navigate(`/${restaurantSlug}/admin`)}>
                        👮 Admin
                    </Button>
                    <Button variant="secondary" onClick={logout}>
                        Salir
                    </Button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', alignSelf: 'center', marginRight: '0.5rem' }}>Filtros:</span>
                <Badge
                    variant={filterStatus === 'all' ? 'info' : 'neutral'}
                    onClick={() => setFilterStatus('all')}
                    style={{ cursor: 'pointer' }}
                >
                    Todos
                </Badge>
                <Badge
                    variant={filterStatus === 'pending' ? 'warning' : 'neutral'}
                    onClick={() => setFilterStatus('pending')}
                    style={{ cursor: 'pointer' }}
                >
                    Pendientes
                </Badge>
                <Badge
                    variant={filterStatus === 'in_preparation' ? 'info' : 'neutral'}
                    onClick={() => setFilterStatus('in_preparation')}
                    style={{ cursor: 'pointer' }}
                >
                    En Preparación
                </Badge>
                <Badge
                    variant={filterStatus === 'ready' ? 'success' : 'neutral'}
                    onClick={() => setFilterStatus('ready')}
                    style={{ cursor: 'pointer' }}
                >
                    Listos
                </Badge>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {filteredOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                ))}

                {activeOrders.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                        <h3>No hay pedidos pendientes</h3>
                        <p>Los nuevos pedidos aparecerán aquí automáticamente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
