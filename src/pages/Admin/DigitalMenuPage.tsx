import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/app/providers/TenantProvider';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { Menu } from 'lucide-react';

import { DigitalMenuConfigPage } from '@/pages/Configuracion/DigitalMenuConfigPage';
import { PremiumUpgradeBanner } from '@/components/features/PremiumUpgradeBanner';

export function DigitalMenuPage() {
    const { restaurantSlug } = useParams();
    const { tenant } = useTenant();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Validate if the tenant has access to the digital menu
    const hasDigitalMenu = tenant?.features?.digitalMenu ?? false;

    return (
        <div className="bg-mesh config-content" style={{ minHeight: '100vh', padding: 'var(--spacing-md) 0', transition: 'margin-left 0.3s ease-in-out' }}>
            {restaurantSlug && (
                <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} restaurantSlug={restaurantSlug} />
            )}
            <div className="container">
                <header className="config-header" style={{ marginBottom: '2rem' }}>
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
                            <h1 style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)' }}>
                                Menú Digital
                            </h1>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                                Diseña e integra tu carta interactiva
                            </p>
                        </div>
                    </div>
                </header>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    {hasDigitalMenu ? (
                        <DigitalMenuConfigPage />
                    ) : (
                        <PremiumUpgradeBanner feature="Menú Digital" />
                    )}
                </div>
            </div>
        </div>
    );
}
