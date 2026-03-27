import { LayoutGrid, Printer, Globe, Shield, Settings, Crown, Wallet, Menu, X, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/shared';
import { useTenant } from '@/app/providers/TenantProvider';

import { TablesTab } from '@/components/features/TablesTab';
import { PrinterTab } from '@/components/features/PrinterTab';
import { DigitalMenuConfigPage } from '@/pages/Configuracion/DigitalMenuConfigPage';
import { SecurityTab } from '@/components/features/SecurityTab';
import { GeneralTab } from '@/components/features/GeneralTab';
import { PremiumUpgradeBanner } from '@/components/features/PremiumUpgradeBanner';
import { PettyCashConfigTab } from '@/components/features/PettyCashConfigTab';


import './ConfigPage.css';

type Tab = 'general' | 'tables' | 'printer' | 'menu' | 'security' | 'pettycash';

interface TabItem {
    id: Tab;
    label: string;
    icon: typeof Settings;
    premium?: boolean;
}

export function ConfigPage() {
    const navigate = useNavigate();
    const { restaurantSlug } = useParams();
    const { tenant } = useTenant();
    const hasDigitalMenu = tenant?.features?.digitalMenu ?? false;
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [menuOpen, setMenuOpen] = useState(false);

    const tabs: TabItem[] = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'tables', label: 'Mesas', icon: LayoutGrid },
        { id: 'printer', label: 'Impresora', icon: Printer },
        { id: 'menu', label: 'Menú Digital', icon: Globe, premium: !hasDigitalMenu },
        { id: 'security', label: 'Seguridad', icon: Shield },
        { id: 'pettycash', label: 'Caja Chica', icon: Wallet },
    ];

    const activeTabItem = tabs.find(t => t.id === activeTab);
    const ActiveIcon = activeTabItem?.icon || Settings;

    const handleTabClick = (tabId: Tab) => {
        setActiveTab(tabId);
        setMenuOpen(false);
    };

    return (
        <div className="bg-mesh config-content" style={{ minHeight: '100vh', padding: 'var(--spacing-md) 0', transition: 'margin-left 0.3s ease-in-out' }}>
            {restaurantSlug && (
                <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} restaurantSlug={restaurantSlug} />
            )}
            <div className="container">
                <header className="config-header">
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
                            <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 800, color: 'var(--text-primary)'}}>
                                Configuración
                            </h1>
                            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Administración del Restaurante</p>
                        </div>
                    </div>
                </header>

            {/* Desktop: horizontal pill tabs */}
            <div className="config-tabs-desktop">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`config-tab-pill ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                            {tab.premium && <Crown size={12} className="config-premium-icon" />}
                        </button>
                    );
                })}
            </div>

            {/* Mobile: hamburger trigger + active tab display */}
            <div className="config-tabs-mobile">
                <button
                    className="config-mobile-trigger"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <div className="config-mobile-trigger-left">
                        <ActiveIcon size={18} />
                        <span>{activeTabItem?.label || 'General'}</span>
                    </div>
                    <div className="config-mobile-trigger-right">
                        <ChevronRight size={18} className={`config-chevron ${menuOpen ? 'open' : ''}`} />
                        <Menu size={20} />
                    </div>
                </button>
            </div>

            {/* Mobile slide-out menu overlay */}
            {menuOpen && (
                <div className="config-mobile-overlay" onClick={() => setMenuOpen(false)}>
                    <div className="config-mobile-drawer" onClick={e => e.stopPropagation()}>
                        <div className="config-drawer-header">
                            <h3>Configuración</h3>
                            <button className="config-drawer-close" onClick={() => setMenuOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <nav className="config-drawer-nav">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabClick(tab.id)}
                                        className={`config-drawer-item ${isActive ? 'active' : ''}`}
                                    >
                                        <div className="config-drawer-item-left">
                                            <div className={`config-drawer-icon ${isActive ? 'active' : ''}`}>
                                                <Icon size={18} />
                                            </div>
                                            <span>{tab.label}</span>
                                        </div>
                                        {tab.premium && <Crown size={14} className="config-premium-icon" />}
                                        {isActive && <div className="config-drawer-active-dot" />}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="config-tab-content">
                {activeTab === 'general' && <GeneralTab />}
                {activeTab === 'tables' && <TablesTab />}
                {activeTab === 'printer' && <PrinterTab />}
                {activeTab === 'menu' && (
                    hasDigitalMenu
                        ? <DigitalMenuConfigPage />
                        : <PremiumUpgradeBanner feature="Menú Digital" />
                )}
                {activeTab === 'security' && <SecurityTab />}
                {activeTab === 'pettycash' && <PettyCashConfigTab />}
            </div>
        </div>
        </div>
    );
}
