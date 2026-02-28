import { useState, useEffect, useMemo } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Input, Badge } from '@/components/shared';
import { Edit2, Search, AlertTriangle, Eye, Clock, ShoppingBag, Box, AlertCircle } from 'lucide-react';
import type { Product } from '@/types';
import { useProductMovements } from '@/hooks/useProductMovements';

export function InventoryTab() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterState, setFilterState] = useState<'all' | 'low' | 'critical'>('all');

    // Edit Modal State
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
    const [newStockStr, setNewStockStr] = useState('');

    // Inspect Modal State
    const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
    const { movements: productMovements, isLoading: loadingMovements } = useProductMovements(inspectingProduct?.id || null);

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

    const handleInspect = (product: Product) => {
        setInspectingProduct(product);
    };

    const handleCloseInspect = () => {
        setInspectingProduct(null);
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
        if (actual === 0) return <Badge variant="error">Sin Stock</Badge>;
        if (actual <= minimo) return <Badge variant="warning">Bajo Stock</Badge>;
        return <Badge variant="success">Normal</Badge>;
    };

    // Calculate Summary Stats
    const stats = useMemo(() => {
        let low = 0;
        let critical = 0;

        products.forEach(p => {
            const actual = p.stockActual || 0;
            const minimo = p.stockMinimo || 0;
            if (actual === 0) {
                critical++;
            } else if (actual <= minimo) {
                low++;
            }
        });

        return {
            total: products.length,
            low,
            critical
        };
    }, [products]);

    return (
        <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1.5rem', border: '1px solid var(--divider-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Total Productos</p>
                            <h3 style={{ margin: '0.5rem 0 0', fontSize: '2rem', color: 'var(--text-primary)' }}>{stats.total}</h3>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(37, 99, 235, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--primary-color)' }}>
                            <Box size={24} />
                        </div>
                    </div>
                </Card>

                <Card style={{ padding: '1.5rem', border: '1px solid var(--divider-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Stock Bajo</p>
                            <h3 style={{ margin: '0.5rem 0 0', fontSize: '2rem', color: 'var(--text-primary)' }}>{stats.low}</h3>
                        </div>
                        <div style={{ padding: '1rem', background: '#fdf5f2', borderRadius: 'var(--radius-md)', color: 'var(--warning-color)' }}>
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                </Card>

                <Card style={{ padding: '1.5rem', border: '1px solid var(--divider-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Sin Existencias</p>
                            <h3 style={{ margin: '0.5rem 0 0', fontSize: '2rem', color: 'var(--text-primary)' }}>{stats.critical}</h3>
                        </div>
                        <div style={{ padding: '1rem', background: '#fff1f2', borderRadius: 'var(--radius-md)', color: 'var(--danger-color)' }}>
                            <AlertCircle size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--surface-color)',
                        border: '1px solid var(--divider-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.5rem 1rem',
                        gap: '0.5rem',
                        flex: 1,
                        minWidth: '250px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }}
                        />
                    </div>

                    <select
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--divider-color)',
                            background: 'var(--surface-color)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontSize: '0.95rem',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value as any)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="low">Stock Bajo</option>
                        <option value="critical">Sin Existencias</option>
                    </select>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden-mobile">
                <Card style={{ overflowX: 'auto', padding: '0', border: '1px solid var(--divider-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--divider-color)', background: '#f8fafc' }}>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Stock Actual</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Stock Min.</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(product => {
                                const actual = product.stockActual || 0;
                                const minimo = product.stockMinimo || 0;
                                const isCritico = actual === 0;

                                return (
                                    <tr key={product.id} style={{ borderBottom: '1px solid var(--divider-color)', background: 'transparent', transition: 'background 0.2s ease' }} className="hover-row">
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--background-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                                    <Box size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{product.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{product.category}</td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: isCritico ? 'var(--danger-color)' : (actual <= minimo ? 'var(--warning-color)' : 'var(--text-primary)') }}>
                                            {actual}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{minimo}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {getStockStatus(actual, minimo)}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Button size="sm" variant="ghost" onClick={() => handleInspect(product)}>
                                                    <Eye size={16} />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleOpenAdjust(product)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Edit2 size={14} /> Ajustar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        <Box size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                        <p style={{ margin: 0 }}>No se encontraron productos con estos filtros.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>

            {/* Mobile View */}
            <div className="hidden-desktop block">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        INVENTARIO ({filteredProducts.length} PRODUCTOS)
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredProducts.map(product => {
                        const actual = product.stockActual || 0;
                        const minimo = product.stockMinimo || 0;
                        const isCritico = actual === 0;

                        return (
                            <Card key={product.id} style={{ padding: '1.25rem', border: `1px solid ${isCritico ? '#ffccd5' : (actual <= minimo ? '#ffedd5' : 'var(--divider-color)')}`, position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--background-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                        <Box size={24} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '0.5rem' }}>
                                                {product.name}
                                            </h4>
                                            <div style={{ flexShrink: 0 }}>
                                                {getStockStatus(actual, minimo)}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                            {product.category}
                                        </p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: isCritico ? 'var(--danger-color)' : (actual <= minimo ? 'var(--warning-color)' : 'var(--text-primary)'), lineHeight: 1 }}>
                                                    {actual}
                                                </span>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    / {minimo} Min.
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button size="sm" variant="ghost" onClick={() => handleInspect(product)} style={{ padding: '0.5rem' }}>
                                                    <Eye size={18} />
                                                </Button>
                                                <Button size="sm" variant="primary" onClick={() => handleOpenAdjust(product)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Edit2 size={14} /> Ajustar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {filteredProducts.length === 0 && (
                        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)' }}>
                            <Box size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p style={{ margin: 0 }}>No se encontraron productos.</p>
                        </div>
                    )}
                </div>
            </div>

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

            {/* Inspect Modal */}
            {inspectingProduct && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    padding: '1rem'
                }}>
                    <Card style={{ padding: '2rem', width: '600px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ShoppingBag size={20} className="text-primary" />
                                    Detalle de Stock: {inspectingProduct.name}
                                </h3>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <span>Stock Actual: <strong>{inspectingProduct.stockActual || 0}</strong></span>
                                    <span>Mínimo: <strong>{inspectingProduct.stockMinimo || 0}</strong></span>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={handleCloseInspect}>Cerrar</Button>
                        </div>

                        <div style={{ background: 'var(--background-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Movimientos de Hoy</h4>

                            {loadingMovements ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Cargando información...</p>
                            ) : productMovements.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>
                                    No se registraron ventas hoy para este producto.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {productMovements.map(mov => (
                                        <div key={mov.orderId} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem',
                                            background: 'var(--surface-color)',
                                            border: '1px solid var(--divider-color)',
                                            borderRadius: 'var(--radius-sm)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '32px', height: '32px',
                                                    borderRadius: '50%', background: 'rgba(230, 57, 70, 0.1)',
                                                    color: 'var(--danger-color)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    -{mov.quantity}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Venta #{mov.orderId.slice(-4).toUpperCase()}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={12} /> {mov.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Mzo. {mov.waiterName}
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge variant="neutral">Salida</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
