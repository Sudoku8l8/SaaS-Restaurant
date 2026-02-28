import { useState } from 'react';
import { Utensils, Users, LayoutGrid, ArrowLeft, FolderKanban, Printer, Globe, Shield, Settings, Crown, Wallet } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/shared';
import { useTenant } from '@/app/providers/TenantProvider';

import { ProductsTab } from '@/components/features/ProductsTab';
import { UsersTab } from '@/components/features/UsersTab';
import { TablesTab } from '@/components/features/TablesTab';
import { CategoriesTab } from '@/components/features/CategoriesTab';
import { PrinterTab } from '@/components/features/PrinterTab';
import { DigitalMenuConfigPage } from '@/pages/Configuracion/DigitalMenuConfigPage';
import { SecurityTab } from '@/components/features/SecurityTab';
import { GeneralTab } from '@/components/features/GeneralTab';
import { PremiumUpgradeBanner } from '@/components/features/PremiumUpgradeBanner';
import { PettyCashConfigTab } from '@/components/features/PettyCashConfigTab';

import './ConfigPage.css';

type Tab = 'general' | 'products' | 'categories' | 'users' | 'tables' | 'printer' | 'menu' | 'security' | 'pettycash';

export function ConfigPage() {

    const navigate = useNavigate();
    const { restaurantSlug } = useParams();
    const { tenant } = useTenant();
    const hasDigitalMenu = tenant?.features?.digitalMenu ?? false;
    const [activeTab, setActiveTab] = useState<Tab>('general');


    return (
        <div className="container mt-md">
            <header className="config-header">
                <div>
                    <h1>Configuración</h1>
                    <p>Administración del Restaurante</p>
                </div>
                <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)} className="tab-btn">
                    <ArrowLeft size={18} /> Volver
                </Button>
            </header>

            {/* Tabs Navigation */}
            <div className="tabs-nav">
                <Button
                    variant={activeTab === 'general' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('general')}
                    className="tab-btn"
                >
                    <Settings size={18} /> General
                </Button>
                <Button
                    variant={activeTab === 'products' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('products')}
                    className="tab-btn"
                >
                    <Utensils size={18} /> Productos
                </Button>
                <Button
                    variant={activeTab === 'categories' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('categories')}
                    className="tab-btn"
                >
                    <FolderKanban size={18} /> Categorías
                </Button>
                <Button
                    variant={activeTab === 'users' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('users')}
                    className="tab-btn"
                >
                    <Users size={18} /> Usuarios
                </Button>
                <Button
                    variant={activeTab === 'tables' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('tables')}
                    className="tab-btn"
                >
                    <LayoutGrid size={18} /> Mesas
                </Button>
                <Button
                    variant={activeTab === 'printer' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('printer')}
                    className="tab-btn"
                >
                    <Printer size={18} /> Impresora
                </Button>
                <Button
                    variant={activeTab === 'menu' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('menu')}
                    className="tab-btn"
                >
                    <Globe size={18} /> Menú Digital
                    {!hasDigitalMenu && <Crown size={14} style={{ color: '#d4a017', marginLeft: '0.25rem' }} />}
                </Button>
                <Button
                    variant={activeTab === 'security' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('security')}
                    className="tab-btn"
                >
                    <Shield size={18} /> Seguridad
                </Button>
                <Button
                    variant={activeTab === 'pettycash' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('pettycash')}
                    className="tab-btn"
                >
                    <Wallet size={18} /> Caja Chica
                </Button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'general' && <GeneralTab />}
                {activeTab === 'products' && <ProductsTab />}
                {activeTab === 'categories' && <CategoriesTab />}
                {activeTab === 'users' && <UsersTab />}
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
    );
}
