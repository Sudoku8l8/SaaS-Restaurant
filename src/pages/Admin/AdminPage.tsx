import { useNavigate, useParams } from 'react-router-dom';
import { ChefHat, DollarSign, BarChart3, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card } from '@/components/shared';
import { SalesDashboard } from '@/components/features/SalesDashboard';

export function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Panel de Administración</h1>
                    <p>Hola, {user?.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/cocina`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ChefHat size={18} /> Volver a Cocina
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
                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(`/${restaurantSlug}/cierre-caja`)}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><DollarSign size={48} className="text-primary" /></div>
                    <h3>Cierre de Caja</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Cerrar operaciones del día</p>
                </Card>

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(`/${restaurantSlug}/reportes`)}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><BarChart3 size={48} className="text-primary" /></div>
                    <h3>Reportes</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Histórico de ventas</p>
                </Card>

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(`/${restaurantSlug}/config`)}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Settings size={48} className="text-primary" /></div>
                    <h3>Configuración</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Productos, Usuarios, Mesas</p>
                </Card>
            </div>
        </div>
    );
}
