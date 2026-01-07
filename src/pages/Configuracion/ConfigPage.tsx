import { useState } from 'react';
import { Utensils, Users, LayoutGrid, ArrowLeft, FolderKanban } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/shared';

import { ProductsTab } from '@/components/features/ProductsTab';
import { UsersTab } from '@/components/features/UsersTab';
import { TablesTab } from '@/components/features/TablesTab';
import { CategoriesTab } from '@/components/features/CategoriesTab';

import './ConfigPage.css';

type Tab = 'products' | 'categories' | 'users' | 'tables';

export function ConfigPage() {

    const navigate = useNavigate();
    const { restaurantSlug } = useParams();
    const [activeTab, setActiveTab] = useState<Tab>('products');


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
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'products' && <ProductsTab />}
                {activeTab === 'categories' && <CategoriesTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'tables' && <TablesTab />}
            </div>
        </div>
    );
}
