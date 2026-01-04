import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card } from '@/components/shared';
import { SalesDashboard } from '@/components/features/SalesDashboard';

export function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Panel de Administración</h1>
                    <p>Hola, {user?.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/cocina')}>
                        🍳 Volver a Cocina
                    </Button>
                    <Button variant="secondary" onClick={logout}>
                        Salir
                    </Button>
                </div>
            </header>

            {/* Daily Sales Dashboard */}
            <SalesDashboard />

            {/* Admin Actions */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '2rem'
            }}>
                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/cierre-caja')}>
                    <div style={{ fontSize: '3rem' }}>💰</div>
                    <h3>Cierre de Caja</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Cerrar operaciones del día</p>
                </Card>

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/reportes')}>
                    <div style={{ fontSize: '3rem' }}>📊</div>
                    <h3>Reportes</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Histórico de ventas</p>
                </Card>

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/config')}>
                    <div style={{ fontSize: '3rem' }}>⚙️</div>
                    <h3>Configuración</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Productos, Usuarios, Mesas</p>
                </Card>
            </div>
        </div>
    );
}
