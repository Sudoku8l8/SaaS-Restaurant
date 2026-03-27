import { useState } from 'react';
import { Utensils, FolderKanban, Menu } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { ProductsTab } from '@/components/features/ProductsTab';
import { CategoriesTab } from '@/components/features/CategoriesTab';

import { AppSidebar } from '@/components/shared/AppSidebar';

type ProductTabKey = 'products' | 'categories';

export function ProductsPage() {
    const { restaurantSlug } = useParams();
    const [activeTab, setActiveTab] = useState<ProductTabKey>('products');
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
                                Gestión de Catálogo
                            </h1>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                                Administración de productos y categorías
                            </p>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('products')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid',
                            borderColor: activeTab === 'products' ? 'transparent' : 'var(--glass-border)',
                            background: activeTab === 'products' ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))' : 'var(--glass-bg)',
                            color: activeTab === 'products' ? 'white' : 'var(--text-secondary)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'products' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
                        }}
                    >
                        <Utensils size={18} /> Productos
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid',
                            borderColor: activeTab === 'categories' ? 'transparent' : 'var(--glass-border)',
                            background: activeTab === 'categories' ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))' : 'var(--glass-bg)',
                            color: activeTab === 'categories' ? 'white' : 'var(--text-secondary)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === 'categories' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
                        }}
                    >
                        <FolderKanban size={18} /> Categorías
                    </button>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    {activeTab === 'products' && <ProductsTab />}
                    {activeTab === 'categories' && <CategoriesTab />}
                </div>
            </div>
        </div>
    );
}
