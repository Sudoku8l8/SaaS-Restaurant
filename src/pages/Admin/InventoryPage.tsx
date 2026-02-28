import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/shared';
import { InventoryTab } from '@/components/features/InventoryTab';

export function InventoryPage() {
    const navigate = useNavigate();
    const { restaurantSlug } = useParams();

    return (
        <div className="container mt-md">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem' }}>Control de Stock</h1>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>Módulo de inventariado de productos</p>
                </div>
                <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)}>
                    <ArrowLeft size={18} className="mr-2" /> Volver
                </Button>
            </header>

            <div style={{ background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <InventoryTab />
            </div>
        </div>
    );
}
