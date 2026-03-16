import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/shared';
import { InventoryTab } from '@/components/features/InventoryTab';

export function InventoryPage() {
    const navigate = useNavigate();
    const { restaurantSlug } = useParams();

    return (
        <div className="container mt-md bg-mesh" style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Control de Stock</h1>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>Módulo de inventariado de productos</p>
                </div>
                <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)}>
                    <ArrowLeft size={18} className="mr-2" /> Volver
                </Button>
            </header>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <InventoryTab />
            </div>
        </div>
    );
}
