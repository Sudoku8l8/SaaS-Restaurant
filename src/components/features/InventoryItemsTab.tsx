import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card, Badge } from '@/components/shared';
import { Plus, Edit2, Trash2, Search, Box, AlertTriangle, AlertCircle } from 'lucide-react';
import type { InventoryItem, UnitOfMeasure } from '@/types';
import { UnitOfMeasure as UnitConst } from '@/types';
import { getPeruNow } from '@/utils/dateUtils';

export function InventoryItemsTab() {
    const { user } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterState, setFilterState] = useState<'all' | 'low' | 'critical'>('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [form, setForm] = useState({
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

    useEffect(() => {
        if (!user?.restaurantId) return;

        const q = query(
            collection(db, 'inventory_items'),
            where('restaurantId', '==', user.restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
                updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
            } as InventoryItem));
            data.sort((a, b) => a.name.localeCompare(b.name));
            setItems(data);
        });

        return () => unsubscribe();
    }, [user?.restaurantId]);

    const filteredItems = items.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (filterState === 'low') return matchSearch && item.stockActual <= item.stockMinimo && item.stockActual > 0;
        if (filterState === 'critical') return matchSearch && item.stockActual === 0;
        return matchSearch;
    });

    const stats = {
        total: items.length,
        low: items.filter(i => i.stockActual <= i.stockMinimo && i.stockActual > 0).length,
        critical: items.filter(i => i.stockActual === 0).length,
    };

    const openModal = (item?: InventoryItem) => {
        if (item) {
            setEditingItem(item);
            setForm({
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
            setForm({ name: '', unit: UnitConst.UNIT, stockActual: '', stockMinimo: '', stockMaximo: '', costPerUnit: '', category: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.restaurantId) return;

        const now = getPeruNow();
        const data = {
            restaurantId: user.restaurantId,
            name: form.name.trim(),
            unit: form.unit,
            stockActual: parseFloat(form.stockActual) || 0,
            stockMinimo: parseFloat(form.stockMinimo) || 0,
            stockMaximo: form.stockMaximo ? parseFloat(form.stockMaximo) : 0,
            costPerUnit: form.costPerUnit ? parseFloat(form.costPerUnit) : 0,
            category: form.category.trim() || '',
            updatedAt: now,
        };

        try {
            if (editingItem) {
                await updateDoc(doc(db, 'inventory_items', editingItem.id), data);
            } else {
                await addDoc(collection(db, 'inventory_items'), { ...data, createdAt: now });
            }
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (err) {
            console.error('Error saving inventory item:', err);
            alert('Error al guardar el insumo.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar este insumo? Los productos con recetas que lo usen pueden verse afectados.')) {
            await deleteDoc(doc(db, 'inventory_items', id));
        }
    };

    const getStatus = (actual: number, minimo: number) => {
        if (actual === 0) return <Badge variant="error">Sin Stock</Badge>;
        if (actual <= minimo) return <Badge variant="warning">Bajo Stock</Badge>;
        return <Badge variant="success">Normal</Badge>;
    };

    return (
        <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1.25rem', border: '1px solid var(--divider-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Insumos</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.75rem' }}>{stats.total}</h3>
                        </div>
                        <Box size={24} color="var(--primary-color)" />
                    </div>
                </Card>
                <Card style={{ padding: '1.25rem', border: '1px solid var(--divider-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Stock Bajo</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.75rem' }}>{stats.low}</h3>
                        </div>
                        <AlertTriangle size={24} color="var(--warning-color)" />
                    </div>
                </Card>
                <Card style={{ padding: '1.25rem', border: '1px solid var(--divider-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sin Existencias</p>
                            <h3 style={{ margin: '0.25rem 0 0', fontSize: '1.75rem' }}>{stats.critical}</h3>
                        </div>
                        <AlertCircle size={24} color="var(--danger-color)" />
                    </div>
                </Card>
            </div>

            {/* Search + Filter + Add */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', border: '1px solid var(--divider-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                    <Search size={18} color="var(--text-secondary)" />
                    <input
                        type="text" placeholder="Buscar insumo..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }}
                    />
                </div>
                <select
                    value={filterState} onChange={e => setFilterState(e.target.value as 'all' | 'low' | 'critical')}
                    style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)', background: 'var(--surface-color)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
                >
                    <option value="all">Todos</option>
                    <option value="low">Stock Bajo</option>
                    <option value="critical">Sin Existencias</option>
                </select>
                <Button variant="primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Nuevo Insumo
                </Button>
            </div>

            {/* Items Table (Desktop) */}
            <div className="hidden-mobile">
                <Card style={{ overflowX: 'auto', padding: 0, border: '1px solid var(--divider-color)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--divider-color)', background: '#f8fafc' }}>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Insumo</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Unidad</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Stock Actual</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Mínimo</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Estado</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--divider-color)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{item.name}</td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{item.unit}</td>
                                    <td style={{
                                        padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem',
                                        color: item.stockActual === 0 ? 'var(--danger-color)' : (item.stockActual <= item.stockMinimo ? 'var(--warning-color)' : 'var(--text-primary)')
                                    }}>{item.stockActual}</td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{item.stockMinimo}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>{getStatus(item.stockActual, item.stockMinimo)}</td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <Button size="sm" variant="outline" onClick={() => openModal(item)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Edit2 size={14} /> Editar
                                            </Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredItems.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron insumos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </Card>
            </div>

            {/* Mobile Cards */}
            <div className="hidden-desktop block">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredItems.map(item => (
                        <Card key={item.id} style={{ padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.unit}</div>
                                </div>
                                {getStatus(item.stockActual, item.stockMinimo)}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                                    <span style={{
                                        fontSize: '1.5rem', fontWeight: 700,
                                        color: item.stockActual === 0 ? 'var(--danger-color)' : (item.stockActual <= item.stockMinimo ? 'var(--warning-color)' : 'var(--text-primary)')
                                    }}>{item.stockActual}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>/ {item.stockMinimo} Min.</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button size="sm" variant="outline" onClick={() => openModal(item)}><Edit2 size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {filteredItems.length === 0 && (
                        <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron insumos.</Card>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <Card style={{ padding: '2rem', width: '480px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editingItem ? 'Editar' : 'Nuevo'} Insumo</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Input label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Queso Mozzarella" />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Unidad de Medida</label>
                                    <select
                                        value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value as UnitOfMeasure })}
                                        style={{ width: '100%', padding: '0.56rem', borderRadius: '8px', border: '1px solid var(--divider-color)', background: 'var(--background-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                    >
                                        {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                    </select>
                                </div>
                                <Input label="Categoría (opcional)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ej: Lácteos" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <Input label="Stock Actual" type="number" step="0.01" min="0" value={form.stockActual} onChange={e => setForm({ ...form, stockActual: e.target.value })} required />
                                <Input label="Stock Mínimo" type="number" step="0.01" min="0" value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: e.target.value })} required />
                                <Input label="Stock Máximo" type="number" step="0.01" min="0" value={form.stockMaximo} onChange={e => setForm({ ...form, stockMaximo: e.target.value })} placeholder="Opcional" />
                            </div>

                            <Input label="Costo Unitario (opcional)" type="number" step="0.01" min="0" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} placeholder="S/ 0.00" />

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} fullWidth>Cancelar</Button>
                                <Button type="submit" variant="primary" fullWidth>Guardar Insumo</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
