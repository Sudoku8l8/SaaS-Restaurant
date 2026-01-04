import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/shared';
import { OrderCard } from '@/components/features/OrderCard';

export function CocinaPage() {
    const { user, logout } = useAuth();
    const { activeOrders } = useOrders();

    if (!activeOrders) return <div className="p-4">Cargando pedidos...</div>;

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Pantalla de Cocina</h1>
                    <p>Hola, {user?.name} - {activeOrders.length} pedidos activos</p>
                </div>
                <Button variant="secondary" onClick={logout}>
                    Cerrar Sesión
                </Button>
            </header>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {activeOrders.map(order => (
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
