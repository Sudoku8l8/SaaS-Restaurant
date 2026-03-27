import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { UsersTab } from '@/components/features/UsersTab';
import { AppSidebar } from '@/components/shared/AppSidebar';

export function UsersPage() {
    const { restaurantSlug } = useParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="bg-mesh" style={{ minHeight: '100vh', padding: 'var(--spacing-md) 0', transition: 'margin-left 0.3s ease-in-out' }}>
            {restaurantSlug && (
                <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} restaurantSlug={restaurantSlug} />
            )}
            <div className="container">
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
                                Usuarios y Roles
                            </h1>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                                Gestión de accesos y personal del restaurante
                            </p>
                        </div>
                    </div>
                </header>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <UsersTab />
                </div>
            </div>
        </div>
    );
}
