import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/shared';

import { ProductsTab } from '@/components/features/ProductsTab';
import { UsersTab } from '@/components/features/UsersTab';
import { TablesTab } from '@/components/features/TablesTab';

type Tab = 'products' | 'users' | 'tables';

export function ConfigPage() {

    const navigate = useNavigate();
    const { restaurantSlug } = useParams();
    const [activeTab, setActiveTab] = useState<Tab>('products');


    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Configuración</h1>
                    <p>Administración del Restaurante</p>
                </div>
                <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)}>
                    ← Volver
                </Button>
            </header>

            {/* Tabs Navigation */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <Button
                    variant={activeTab === 'products' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('products')}
                >
                    🍔 Productos
                </Button>
                <Button
                    variant={activeTab === 'users' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('users')}
                >
                    👥 Usuarios
                </Button>
                <Button
                    variant={activeTab === 'tables' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('tables')}
                >
                    🪑 Mesas
                </Button>
            </div>

            {/* Tab Content */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem', minHeight: '400px' }}>
                {activeTab === 'products' && <ProductsTab />}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'tables' && <TablesTab />}
            </div>
        </div>
    );
}
