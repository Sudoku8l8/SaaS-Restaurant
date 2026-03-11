import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useProductCache } from '@/hooks/useProductCache';
import { Button, Card, Badge, Input } from '@/components/shared';
import { Search, Package, Box, AlertTriangle, AlertCircle, ClipboardList, ArrowUpDown, Plus, Edit2, Trash2 } from 'lucide-react';
import type { Product, InventoryItem, UnitOfMeasure } from '@/types';
import { UnitOfMeasure as UnitConst } from '@/types';
import { InventoryMovementsPanel } from './InventoryMovementsPanel';
import { getPeruNow } from '@/utils/dateUtils';

type SubTab = 'products' | 'items' | 'movements';

export function InventoryTab() {
    const { user } = useAuth();
    const { products: allProducts, refresh: refreshCache } = useProductCache(user?.restaurantId);
    const [subTab, setSubTab] = useState<SubTab>('products');

    // Products with stock control (derived from cache)
    const products = allProducts.filter(p => p.controlaStock);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterState, setFilterState] = useState<'all' | 'low' | 'critical'>('all');

    // Adjustment modal
    const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
    const [adjustQty, setAdjustQty] = useState('');
    const [inspectProduct, setInspectProduct] = useState<Product | null>(null);

    // ── Insumos CRUD modal state ──
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [itemForm, setItemForm] = useState({
        name: '',
        unit: UnitConst.UNIT as UnitOfMeasure,
        stockActual: '',
        stockMinimo: '',
        stockMaximo: '',
        costPerUnit: '',
        category: '',
    });

    const UNIT_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
        { value: UnitConst.UNIT, label: 'Unidad' },
        { value: UnitConst.GRAM, label: 'Gramos (g)' },
        { value: UnitConst.KILOGRAM, label: 'Kilogramos (kg)' },
        { value: UnitConst.LITER, label: 'Litros (L)' },
        { value: UnitConst.MILLILITER, label: 'Mililitros (mL)' },
        { value: UnitConst.PIECE, label: 'Piezas' },
        { value: UnitConst.BOTTLE, label: 'Botellas' },
    ];

    // Only listen to inventory_items in realtime (changes frequently during stock operations)
    useEffect(() => {
        if (!user?.restaurantId) return;

        const iQuery = query(
            collection(db, 'inventory_items'),
            where('restaurantId', '==', user.restaurantId)
        );
        const unsub = onSnapshot(iQuery, (snap) => {
            const data = snap.docs.map(d => ({
                id: d.id, ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
                updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
            } as InventoryItem));
            data.sort((a, b) => a.name.localeCompare(b.name));
            setInventoryItems(data);
        });

        return () => { unsub(); };
    }, [user?.restaurantId]);

    // Stats
    const productStats = {
        total: products.length,
        low: products.filter(p => (p.stockActual || 0) <= (p.stockMinimo || 0) && (p.stockActual || 0) > 0).length,
        critical: products.filter(p => (p.stockActual || 0) === 0).length,
    };
    const itemStats = {
        total: inventoryItems.length,
        low: inventoryItems.filter(i => i.stockActual <= i.stockMinimo && i.stockActual > 0).length,
        critical: inventoryItems.filter(i => i.stockActual === 0).length,
    };

    const filteredProducts = products.filter(p => {
        const match = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (filterState === 'low') return match && (p.stockActual || 0) <= (p.stockMinimo || 0) && (p.stockActual || 0) > 0;
        if (filterState === 'critical') return match && (p.stockActual || 0) === 0;
        return match;
    });

    const filteredItems = inventoryItems.filter(i => {
        const match = i.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (filterState === 'low') return match && i.stockActual <= i.stockMinimo && i.stockActual > 0;
        if (filterState === 'critical') return match && i.stockActual === 0;
        return match;
    });

    const handleAdjust = async () => {
        if (!adjustProduct) return;
        const qty = parseInt(adjustQty);
        if (isNaN(qty)) { alert('Cantidad inválida'); return; }
        await updateDoc(doc(db, 'products', adjustProduct.id), {
            stockActual: qty,
            fechaActualizacionStock: getPeruNow(),
        });
        await refreshCache();
        setAdjustProduct(null);
        setAdjustQty('');
    };

    // ── Insumos CRUD handlers ──
    const openItemModal = (item?: InventoryItem) => {
        if (item) {
            setEditingItem(item);
            setItemForm({
                name: item.name,
                unit: item.unit,
                stockActual: item.stockActual.toString(),
                stockMinimo: item.stockMinimo.toString(),
                stockMaximo: item.stockMaximo?.toString() || '',
                costPerUnit: item.costPerUnit?.toString() || '',
                category: item.category || '',
            });
        } else {
            setEditingItem(null);
            setItemForm({ name: '', unit: UnitConst.UNIT, stockActual: '', stockMinimo: '', stockMaximo: '', costPerUnit: '', category: '' });
        }
        setIsItemModalOpen(true);
    };

    const handleItemSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.restaurantId) return;

        const now = getPeruNow();
        const data = {
            restaurantId: user.restaurantId,
            name: itemForm.name.trim(),
            unit: itemForm.unit,
            stockActual: parseFloat(itemForm.stockActual) || 0,
            stockMinimo: parseFloat(itemForm.stockMinimo) || 0,
            stockMaximo: itemForm.stockMaximo ? parseFloat(itemForm.stockMaximo) : 0,
            costPerUnit: itemForm.costPerUnit ? parseFloat(itemForm.costPerUnit) : 0,
            category: itemForm.category.trim() || '',
            updatedAt: now,
        };

        try {
            if (editingItem) {
                await updateDoc(doc(db, 'inventory_items', editingItem.id), data);
            } else {
                await addDoc(collection(db, 'inventory_items'), { ...data, createdAt: now });
            }
            setIsItemModalOpen(false);
            setEditingItem(null);
        } catch (err) {
            console.error('Error saving inventory item:', err);
            alert('Error al guardar el insumo.');
        }
    };

    const handleItemDelete = async (id: string) => {
        if (confirm('¿Eliminar este insumo? Los productos con recetas que lo usen pueden verse afectados.')) {
            await deleteDoc(doc(db, 'inventory_items', id));
        }
    };

    const getStatusBadge = (actual: number, minimo: number) => {
        if (actual === 0) return <Badge variant="error">Sin Stock</Badge>;
        if (actual <= minimo) return <Badge variant="warning">Bajo Stock</Badge>;
        return <Badge variant="success">Normal</Badge>;
    };

    const tabs: { id: SubTab; label: string; icon: typeof Package }[] = [
        { id: 'products', label: 'Productos', icon: Package },
        { id: 'items', label: 'Insumos', icon: Box },
        { id: 'movements', label: 'Movimientos', icon: ArrowUpDown },
    ];

    return (
        <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1rem', border: '1px solid var(--divider-color)', textAlign: 'center' }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Package size={16} /> Productos con Stock
                    </p>
                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem' }}>{productStats.total}</h3>
                </Card>
                <Card style={{ padding: '1rem', border: '1px solid var(--divider-color)', textAlign: 'center' }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Box size={16} /> Insumos
                    </p>
                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem' }}>{itemStats.total}</h3>
                </Card>
                <Card style={{ padding: '1rem', border: '1px solid var(--divider-color)', textAlign: 'center' }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--warning-color)', fontSize: '0.85rem' }}>
                        <AlertTriangle size={16} /> Stock Bajo
                    </p>
                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', color: 'var(--warning-color)' }}>
                        {productStats.low + itemStats.low}
                    </h3>
                </Card>
                <Card style={{ padding: '1rem', border: '1px solid var(--divider-color)', textAlign: 'center' }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--danger-color)', fontSize: '0.85rem' }}>
                        <AlertCircle size={16} /> Sin Stock
                    </p>
                    <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.5rem', color: 'var(--danger-color)' }}>
                        {productStats.critical + itemStats.critical}
                    </h3>
                </Card>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--divider-color)', paddingBottom: '0' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const active = subTab === tab.id;
                    return (
                        <button key={tab.id} onClick={() => setSubTab(tab.id)} style={{
                            padding: '0.75rem 1.25rem', border: 'none', background: 'transparent',
                            cursor: 'pointer', fontSize: '0.95rem', fontWeight: active ? 700 : 500,
                            color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                            borderBottom: active ? '3px solid var(--primary-color)' : '3px solid transparent',
                            marginBottom: '-2px', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Products & Items shared controls */}
            {subTab !== 'movements' && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', border: '1px solid var(--divider-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                        <Search size={18} color="var(--text-secondary)" />
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }} />
                    </div>
                    <select value={filterState} onChange={e => setFilterState(e.target.value as 'all' | 'low' | 'critical')}
                        style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        <option value="all">Todos</option>
                        <option value="low">Stock Bajo</option>
                        <option value="critical">Sin Existencias</option>
                    </select>
                    {subTab === 'items' && (
                        <Button variant="primary" onClick={() => openItemModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> Nuevo Insumo
                        </Button>
                    )}
                </div>
            )}

            {/* Products Sub-tab */}
            {subTab === 'products' && (
                <div className="hidden-mobile">
                    <Card style={{ overflowX: 'auto', padding: 0, border: '1px solid var(--divider-color)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--divider-color)', background: '#f8fafc' }}>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Producto</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Tipo</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Stock</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Mínimo</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Estado</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid var(--divider-color)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                                            {p.name}
                                            {p.unidadMedida && <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>({p.unidadMedida})</span>}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <Badge variant={p.tipoInventario === 'recipe' ? 'info' : 'neutral'}>
                                                {p.tipoInventario === 'recipe' ? 'Receta' : 'Producto'}
                                            </Badge>
                                        </td>
                                        <td style={{
                                            padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem',
                                            color: (p.stockActual || 0) === 0 ? 'var(--danger-color)' : ((p.stockActual || 0) <= (p.stockMinimo || 0) ? 'var(--warning-color)' : 'var(--text-primary)')
                                        }}>{p.stockActual || 0}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.stockMinimo || 0}</td>
                                        <td style={{ padding: '1rem' }}>{getStatusBadge(p.stockActual || 0, p.stockMinimo || 0)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Button size="sm" variant="outline" onClick={() => { setAdjustProduct(p); setAdjustQty((p.stockActual || 0).toString()); }}>Ajustar</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setInspectProduct(p)}>
                                                    <ClipboardList size={14} /> Historial
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay productos con stock controlado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}

            {/* Products Mobile */}
            {subTab === 'products' && (
                <div className="hidden-desktop block">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredProducts.map(p => (
                            <Card key={p.id} style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{p.name}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.tipoInventario === 'recipe' ? 'Receta' : 'Producto'}</div>
                                    </div>
                                    {getStatusBadge(p.stockActual || 0, p.stockMinimo || 0)}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: (p.stockActual || 0) === 0 ? 'var(--danger-color)' : 'var(--text-primary)' }}>{p.stockActual || 0}</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/ {p.stockMinimo || 0} Min.</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Button size="sm" variant="outline" onClick={() => { setAdjustProduct(p); setAdjustQty((p.stockActual || 0).toString()); }}>Ajustar</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setInspectProduct(p)}><ClipboardList size={14} /></Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Insumos Sub-tab */}
            {subTab === 'items' && (
                <>
                    {/* Desktop Table */}
                    <div className="hidden-mobile">
                        <Card style={{ overflowX: 'auto', padding: 0, border: '1px solid var(--divider-color)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--divider-color)', background: '#f8fafc' }}>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Insumo</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Unidad</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Stock</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Mínimo</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Estado</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(i => (
                                        <tr key={i.id} style={{ borderBottom: '1px solid var(--divider-color)' }}>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{i.name}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{i.unit}</td>
                                            <td style={{
                                                padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem',
                                                color: i.stockActual === 0 ? 'var(--danger-color)' : (i.stockActual <= i.stockMinimo ? 'var(--warning-color)' : 'var(--text-primary)')
                                            }}>{i.stockActual}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{i.stockMinimo}</td>
                                            <td style={{ padding: '1rem' }}>{getStatusBadge(i.stockActual, i.stockMinimo)}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <Button size="sm" variant="outline" onClick={() => openItemModal(i)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Edit2 size={14} /> Editar
                                                    </Button>
                                                    <Button size="sm" variant="danger" onClick={() => handleItemDelete(i.id)}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay insumos. Usa el botón "Nuevo Insumo" para crear uno.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </Card>
                    </div>
                    {/* Mobile Cards */}
                    <div className="hidden-desktop block">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredItems.map(i => (
                                <Card key={i.id} style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{i.name}</div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{i.unit}</div>
                                        </div>
                                        {getStatusBadge(i.stockActual, i.stockMinimo)}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                            <span style={{
                                                fontSize: '1.5rem', fontWeight: 700,
                                                color: i.stockActual === 0 ? 'var(--danger-color)' : (i.stockActual <= i.stockMinimo ? 'var(--warning-color)' : 'var(--text-primary)')
                                            }}>{i.stockActual}</span>
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/ {i.stockMinimo} Min.</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Button size="sm" variant="outline" onClick={() => openItemModal(i)}><Edit2 size={14} /></Button>
                                            <Button size="sm" variant="danger" onClick={() => handleItemDelete(i.id)}><Trash2 size={14} /></Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {filteredItems.length === 0 && (
                                <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay insumos. Usa el botón "Nuevo Insumo" para crear uno.</Card>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Movements Sub-tab */}
            {subTab === 'movements' && (
                <InventoryMovementsPanel />
            )}

            {/* Adjust Stock Modal */}
            {adjustProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <Card style={{ padding: '2rem', width: '400px', maxWidth: '100%' }}>
                        <h3 style={{ marginTop: 0 }}>Ajustar Stock: {adjustProduct.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Stock actual: {adjustProduct.stockActual || 0}</p>
                        <Input label="Nuevo Stock" type="number" min="0" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <Button type="button" variant="ghost" onClick={() => setAdjustProduct(null)} fullWidth>Cancelar</Button>
                            <Button variant="primary" onClick={handleAdjust} fullWidth>Guardar</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Inspect Product Movements Modal */}
            {inspectProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <Card style={{ padding: '2rem', width: '700px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Movimientos: {inspectProduct.name}</h3>
                            <Button variant="ghost" onClick={() => setInspectProduct(null)}>✕</Button>
                        </div>
                        <InventoryMovementsPanel
                            productId={inspectProduct.id}
                            productName={inspectProduct.name}
                            collectionType="products"
                        />
                    </Card>
                </div>
            )}

            {/* Create/Edit Insumo Modal */}
            {isItemModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <Card style={{ padding: '2rem', width: '480px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editingItem ? 'Editar' : 'Nuevo'} Insumo</h3>
                        <form onSubmit={handleItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Input label="Nombre" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} required placeholder="Ej: Queso Mozzarella" />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Unidad de Medida</label>
                                    <select
                                        value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value as UnitOfMeasure })}
                                        style={{ width: '100%', padding: '0.56rem', borderRadius: '8px', border: '1px solid var(--divider-color)', background: 'var(--background-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                    >
                                        {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                    </select>
                                </div>
                                <Input label="Categoría (opcional)" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} placeholder="Ej: Lácteos" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <Input label="Stock Actual" type="number" step="0.01" min="0" value={itemForm.stockActual} onChange={e => setItemForm({ ...itemForm, stockActual: e.target.value })} required />
                                <Input label="Stock Mínimo" type="number" step="0.01" min="0" value={itemForm.stockMinimo} onChange={e => setItemForm({ ...itemForm, stockMinimo: e.target.value })} required />
                                <Input label="Stock Máximo" type="number" step="0.01" min="0" value={itemForm.stockMaximo} onChange={e => setItemForm({ ...itemForm, stockMaximo: e.target.value })} placeholder="Opcional" />
                            </div>

                            <Input label="Costo Unitario (opcional)" type="number" step="0.01" min="0" value={itemForm.costPerUnit} onChange={e => setItemForm({ ...itemForm, costPerUnit: e.target.value })} placeholder="S/ 0.00" />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsItemModalOpen(false)} fullWidth>Cancelar</Button>
                                <Button type="submit" variant="primary" fullWidth>Guardar Insumo</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
