import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { InventoryTab } from '@/components/features/InventoryTab';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { AppSidebar } from '@/components/shared/AppSidebar';

export function InventoryPage() {
    const { restaurantSlug } = useParams();
    const { user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Cashier can view but not edit
    const isReadOnly = user?.role === UserRole.CASHIER;

    return (
        <div className="container mt-md bg-mesh" style={{ minHeight: '100vh', paddingBottom: '2rem', transition: 'margin-left 0.3s ease-in-out' }}>
            {restaurantSlug && (
                <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} restaurantSlug={restaurantSlug} />
            )}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Menú principal"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '42px', height: '42px', borderRadius: '50%',
                            border: '1.5px solid var(--glass-border)', background: 'transparent',
                            color: 'var(--text-primary)', cursor: 'pointer', flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                    >
                        <Menu size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                            Control de Stock
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                            {isReadOnly
                                ? 'Vista de consulta — solo lectura'
                                : 'Módulo de inventariado de productos'}
                        </p>
                    </div>
                </div>
            </header>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <InventoryTab readOnly={isReadOnly} />
            </div>
        </div>
    );
}
