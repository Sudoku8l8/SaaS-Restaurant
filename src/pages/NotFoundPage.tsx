import { Button } from '@/components/shared';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
            <h1>404</h1>
            <p>Página no encontrada</p>
            <div style={{ marginTop: '1rem' }}>
                <Button onClick={() => navigate('/')}>Volver al inicio</Button>
            </div>
        </div>
    );
}
