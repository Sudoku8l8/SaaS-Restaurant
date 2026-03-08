import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useInventoryMovements } from '@/hooks/useInventoryMovements';
import { Button, Card, Badge, Input } from '@/components/shared';
import { Plus, ArrowDown, ArrowUp, RotateCcw, Trash2, Clock, Filter } from 'lucide-react';
import type { MovementType, UnitOfMeasure } from '@/types';
import { MovementType as MT, UnitOfMeasure as UC } from '@/types';
import { db } from '@/services/firebase/config';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { getPeruNow } from '@/utils/dateUtils';

const MOVEMENT_LABELS: Record<MovementType, { label: string; color: string; icon: typeof ArrowDown }> = {
    purchase: { label: 'Compra', color: '#10b981', icon: ArrowDown },
    sale: { label: 'Venta', color: '#ef4444', icon: ArrowUp },
    adjustment: { label: 'Ajuste', color: '#3b82f6', icon: RotateCcw },
    waste: { label: 'Merma', color: '#f59e0b', icon: Trash2 },
    transfer: { label: 'Transferencia', color: '#8b5cf6', icon: ArrowDown },
};

const UNIT_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
    { value: UC.UNIT, label: 'Unidad' },
    { value: UC.GRAM, label: 'Gramos' },
    { value: UC.KILOGRAM, label: 'Kilogramos' },
    { value: UC.LITER, label: 'Litros' },
    { value: UC.MILLILITER, label: 'Mililitros' },
    { value: UC.PIECE, label: 'Piezas' },
    { value: UC.BOTTLE, label: 'Botellas' },
];

interface Props {
    productId?: string | null;
    productName?: string;
    /** If 'items', operates on inventory_items collection instead of products */
    collectionType?: 'products' | 'items';
}

export function InventoryMovementsPanel({ productId, productName, collectionType = 'products' }: Props) {
    const { user } = useAuth();
    const { movements, isLoading, createMovement } = useInventoryMovements(productId);

    // Manual movement form
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<MovementType>(MT.PURCHASE);
    const [formQty, setFormQty] = useState('');
    const [formUnit, setFormUnit] = useState<UnitOfMeasure>(UC.UNIT);
    const [formReason, setFormReason] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Filter
    const [filterType, setFilterType] = useState<MovementType | 'all'>('all');

    const filtered = filterType === 'all' ? movements : movements.filter(m => m.type === filterType);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || !productName || !user) return;

        const qty = parseFloat(formQty);
        if (isNaN(qty) || qty <= 0) {
            alert('La cantidad debe ser mayor a 0');
            return;
        }

        setIsSaving(true);
        try {
            // Determine sign: purchases are positive, others negative
            const signedQty = formType === MT.PURCHASE ? qty : -qty;

            await createMovement({
                productId,
                productName,
                type: formType,
                quantity: signedQty,
                unit: formUnit,
                reason: formReason.trim() || '',
                referenceType: 'manual',
            });

            // Also update actual stock in the source collection
            const col = collectionType === 'items' ? 'inventory_items' : 'products';
            const ref = doc(db, col, productId);
            await updateDoc(ref, {
                stockActual: increment(signedQty),
                fechaActualizacionStock: getPeruNow(),
            });

            // Reset form
            setFormQty('');
            setFormReason('');
            setShowForm(false);
        } catch (err) {
            console.error('Error creating movement:', err);
            alert('Error al registrar movimiento.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={16} color="var(--text-secondary)" />
                    <select
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as MovementType | 'all')}
                        style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)', background: 'var(--surface-color)', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                    >
                        <option value="all">Todos los movimientos</option>
                        <option value="purchase">Compras (Entradas)</option>
                        <option value="sale">Ventas (Salidas)</option>
                        <option value="adjustment">Ajustes</option>
                        <option value="waste">Mermas</option>
                        <option value="transfer">Transferencias</option>
                    </select>
                </div>
                {productId && (
                    <Button size="sm" variant="primary" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={16} /> Registrar Movimiento
                    </Button>
                )}
            </div>

            {/* Manual Movement Form */}
            {showForm && productId && (
                <Card style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '2px solid var(--primary-color)' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Registrar Movimiento: {productName}</h4>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Tipo</label>
                                <select
                                    value={formType} onChange={e => setFormType(e.target.value as MovementType)}
                                    style={{ width: '100%', padding: '0.56rem', borderRadius: '8px', border: '1px solid var(--divider-color)', background: 'var(--background-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                >
                                    <option value="purchase">📦 Compra (Entrada)</option>
                                    <option value="adjustment">🔧 Ajuste Manual</option>
                                    <option value="waste">🗑️ Merma / Pérdida</option>
                                </select>
                            </div>
                            <Input label="Cantidad" type="number" step="0.01" min="0.01" value={formQty} onChange={e => setFormQty(e.target.value)} required />
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Unidad</label>
                                <select
                                    value={formUnit} onChange={e => setFormUnit(e.target.value as UnitOfMeasure)}
                                    style={{ width: '100%', padding: '0.56rem', borderRadius: '8px', border: '1px solid var(--divider-color)', background: 'var(--background-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                >
                                    {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <Input label="Motivo / Referencia (opcional)" value={formReason} onChange={e => setFormReason(e.target.value)} placeholder="Ej: Compra proveedor ABC / Producto vencido" />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)} fullWidth>Cancelar</Button>
                            <Button type="submit" variant="primary" fullWidth disabled={isSaving}>{isSaving ? 'Guardando...' : 'Registrar'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Movements List */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Cargando movimientos...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)' }}>
                    <Clock size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <p style={{ margin: 0 }}>No hay movimientos registrados.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filtered.map(mov => {
                        const meta = MOVEMENT_LABELS[mov.type] || MOVEMENT_LABELS.adjustment;
                        const Icon = meta.icon;
                        const isPositive = mov.quantity > 0;

                        return (
                            <div key={mov.id} style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                padding: '0.75rem 1rem', background: 'var(--surface-color)',
                                border: '1px solid var(--divider-color)', borderRadius: 'var(--radius-sm)',
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: `${meta.color}15`, color: meta.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <Icon size={18} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {mov.productName}
                                        <Badge variant="neutral" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>{meta.label}</Badge>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={12} />
                                        {mov.createdAt.toLocaleDateString()} {mov.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {mov.userName && <> • {mov.userName}</>}
                                        {mov.reason && <> — {mov.reason}</>}
                                    </div>
                                </div>
                                <div style={{
                                    fontWeight: 700, fontSize: '1rem',
                                    color: isPositive ? '#10b981' : '#ef4444',
                                }}>
                                    {isPositive ? '+' : ''}{mov.quantity} {mov.unit}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
