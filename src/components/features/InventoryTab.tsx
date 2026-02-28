import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Input, Badge } from '@/components/shared';
import { Edit2, Search, AlertTriangle } from 'lucide-react';
import type { Product } from '@/types';

export function InventoryTab() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterState, setFilterState] = useState<'all' | 'low' | 'critical'>('all');

    // Edit Modal State
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [newStockStr, setNewStockStr] = useState('');

    useEffect(() => {
        if (!user?.restaurantId) return;

        // Sólo traemos productos que tienen "controlaStock" en true
        const q = query(
            collection(db, 'products'),
            where('restaurantId', '==', user.restaurantId),
            where('controlaStock', '==', true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            // Ordenamos alfabéticamente
            data.sort((a, b) => a.name.localeCompare(b.name));
            setProducts(data);
        });

        return () => unsubscribe();
    }, [user?.restaurantId]);

    const handleOpenAdjust = (product: Product) => {
        setAdjustingProduct(product);
        setNewStockStr(product.stockActual?.toString() || '0');
        setIsAdjustModalOpen(true);
    };

    const handleCloseAdjust = () => {
        setIsAdjustModalOpen(false);
        setAdjustingProduct(null);
        setNewStockStr('');
    };

    const handleSaveAdjust = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustingProduct) return;

        const parsedStock = parseInt(newStockStr);
        if (isNaN(parsedStock) || parsedStock < 0) {
            alert('El stock debe ser un número entero mayor o igual a cero.');
            return;
        }

        try {
            await updateDoc(doc(db, 'products', adjustingProduct.id), {
                stockActual: parsedStock,
                fechaActualizacionStock: new Date()
            });
            handleCloseAdjust();
        } catch (error) {
            console.error('Error al guardar ajuste de stock', error);
            alert('Ocurrió un error al actualizar el stock.');
        }
    };

    // Filter logic
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const stockActual = p.stockActual || 0;
        const stockMinimo = p.stockMinimo || 0;

        let matchesState = true;
        if (filterState === 'low') {
            matchesState = stockActual <= stockMinimo && stockActual > 0;
        } else if (filterState === 'critical') {
            matchesState = stockActual === 0;
        }

        return matchesSearch && matchesState;
    });

    const getStockStatus = (actual: number = 0, minimo: number = 0) => {
        if (actual === 0) return <Badge variant="error">Crítico</Badge>;
        if (actual <= minimo) return <Badge variant="warning">Bajo</Badge>;
        return <Badge variant="success">Normal</Badge>;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Inventario ({products.length} productos)
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Gestiona el stock de los productos con control activado.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--surface-color)',
                        border: '1px solid var(--divider-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.4rem 0.75rem',
                        gap: '0.5rem'
                    }}>
                        <Search size={16} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '150px' }}
                        />
                    </div>

                    <select
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--divider-color)',
                            background: 'var(--surface-color)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                        }}
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value as any)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="low">Stock Bajo</option>
                        <option value="critical">Stock Crítico</option>
                    </select>
                </div>
            </div>

            <Card style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--divider-color)' }}>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Producto</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Categoría</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>Stock Actual</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'center' }}>Stock Min.</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Estado</th>
                            <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => {
                            const actual = product.stockActual || 0;
                            const minimo = product.stockMinimo || 0;
                            const isCritico = actual === 0;

                            return (
                                <tr key={product.id} style={{ borderBottom: '1px solid var(--divider-color)', background: isCritico ? 'rgba(230, 57, 70, 0.05)' : 'transparent' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {isCritico && <AlertTriangle size={16} color="var(--danger-color)" />}
                                            {product.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{product.category}</td>
                                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: isCritico ? 'var(--danger-color)' : (actual <= minimo ? 'var(--warning-color)' : 'var(--text-primary)') }}>
                                        {actual}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{minimo}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {getStockStatus(actual, minimo)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <Button size="sm" variant="outline" onClick={() => handleOpenAdjust(product)}>
                                            <Edit2 size={14} className="mr-1" /> Ajustar
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No se encontraron productos con estos filtros.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Card>

            {/* Adjust Modal */}
            {isAdjustModalOpen && adjustingProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ padding: '2rem', width: '400px', maxWidth: '90%' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Ajustar Stock Manual</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Producto: <strong>{adjustingProduct.name}</strong>
                        </p>

                        <form onSubmit={handleSaveAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Input
                                label="Nuevo Stock Actual"
                                type="number"
                                min="0"
                                step="1"
                                value={newStockStr}
                                onChange={(e) => setNewStockStr(e.target.value)}
                                required
                                autoFocus
                            />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <Button type="button" variant="ghost" onClick={handleCloseAdjust} fullWidth>Cancelar</Button>
                                <Button type="submit" variant="primary" fullWidth>Guardar Ajuste</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
