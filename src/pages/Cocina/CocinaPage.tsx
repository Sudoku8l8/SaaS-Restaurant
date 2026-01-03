import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/shared';

export function CocinaPage() {
    const { user, logout } = useAuth();

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Pantalla de Cocina</h1>
                    <p>Hola, {user?.name}</p>
                </div>
                <Button variant="secondary" onClick={logout}>
                    Cerrar Sesión
                </Button>
            </header>
            <p>Pedidos en cola de preparación</p>
        </div>
    );
}
