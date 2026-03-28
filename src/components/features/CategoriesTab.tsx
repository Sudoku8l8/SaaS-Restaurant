import { useState, useRef } from 'react';
import { db } from '@/services/firebase/config';
import {
    collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useProductCache } from '@/hooks/useProductCache';
import { Button, Input } from '@/components/shared';
import { Trash2, FolderPlus, GripVertical, Save, Info, Palette } from 'lucide-react';
import type { Category } from '@/types';

const DEFAULT_CATEGORY_COLORS = [
    '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2',
    '#EA580C', '#4F46E5', '#BE185D', '#15803D', '#64748B', '#A855F7',
    '#DB2777', '#0D9488', '#CA8A04', '#6366F1',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 0' }}>
            {DEFAULT_CATEGORY_COLORS.map(c => (
                <button
                    key={c}
                    type="button"
                    onClick={() => onChange(c)}
                    style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: c, border: value === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                        outline: value === c ? '2px solid var(--background-color)' : 'none',
                        transform: value === c ? 'scale(1.15)' : 'scale(1)',
                    }}
                    title={c}
                />
            ))}
        </div>
    );
}

export function CategoriesTab() {
    const { user } = useAuth();
    const { categories, refresh: refreshCache } = useProductCache(user?.restaurantId);
    const [localOrder, setLocalOrder] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryNameEn, setNewCategoryNameEn] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(DEFAULT_CATEGORY_COLORS[0]);
    const [loading, setLoading] = useState(false);
    const [orderDirty, setOrderDirty] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    // Drag state
    const dragIndex = useRef<number | null>(null);
    const dragOverIndex = useRef<number | null>(null);

    // Sync localOrder from cache whenever categories change
    const categoriesKey = categories.map(c => c.id + c.sortOrder).join(',');
    const prevCategoriesKeyRef = useRef(categoriesKey);
    if (categoriesKey !== prevCategoriesKeyRef.current) {
        prevCategoriesKeyRef.current = categoriesKey;
        setLocalOrder(categories);
        setOrderDirty(false);
    }
    // Initialize on first render
    if (localOrder.length === 0 && categories.length > 0) {
        setLocalOrder(categories);
    }

    // ── Add category ──────────────────────────────────────────────────────────
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim() || !user?.restaurantId) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'categories'), {
                restaurantId: user.restaurantId,
                name: newCategoryName.trim(),
                nameEn: newCategoryNameEn.trim() || null,
                color: newCategoryColor,
                sortOrder: localOrder.length, // append at end
                createdAt: serverTimestamp()
            });
            await refreshCache();
            setNewCategoryName('');
            setNewCategoryNameEn('');
            setNewCategoryColor(DEFAULT_CATEGORY_COLORS[(localOrder.length + 1) % DEFAULT_CATEGORY_COLORS.length]);
        } catch (error) {
            console.error(error);
            alert('Error al guardar categoría');
        } finally {
            setLoading(false);
        }
    };

    // ── Delete category ───────────────────────────────────────────────────────
    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Eliminar la categoría "${name}"? Los productos asociados quedarán huérfanos.`)) {
            try {
                await deleteDoc(doc(db, 'categories', id));
                await refreshCache();
            } catch (error) {
                console.error(error);
                alert('Error al eliminar categoría');
            }
        }
    };

    // ── Rename category ───────────────────────────────────────────────────────
    const handleRename = async (id: string, newName: string, newNameEn: string, newColor?: string) => {
        if (!newName.trim()) return;
        try {
            const updates: Record<string, unknown> = {
                name: newName.trim(),
                nameEn: newNameEn.trim() || null
            };
            if (newColor) updates.color = newColor;
            await updateDoc(doc(db, 'categories', id), updates);
            await refreshCache();
        } catch (error) {
            console.error(error);
        }
    };

    // ── Drag & Drop handlers ──────────────────────────────────────────────────
    const handleDragStart = (index: number) => {
        dragIndex.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOverIndex.current = index;
        if (dragIndex.current === null || dragIndex.current === index) return;

        const updated = [...localOrder];
        const dragged = updated.splice(dragIndex.current, 1)[0];
        updated.splice(index, 0, dragged);
        dragIndex.current = index;
        setLocalOrder(updated);
        setOrderDirty(true);
    };

    const handleDragEnd = () => {
        dragIndex.current = null;
        dragOverIndex.current = null;
    };


    // ── Save order to Firestore ───────────────────────────────────────────────
    const handleSaveOrder = async () => {
        if (!orderDirty) return;
        setSavingOrder(true);
        try {
            const batch = writeBatch(db);
            localOrder.forEach((cat, index) => {
                batch.update(doc(db, 'categories', cat.id), { sortOrder: index });
            });
            await batch.commit();
            await refreshCache();
            setOrderDirty(false);
        } catch (error) {
            console.error(error);
            alert('Error al guardar el orden');
        } finally {
            setSavingOrder(false);
        }
    };

    // ── Discard local changes ─────────────────────────────────────────────────
    const handleDiscard = () => {
        setLocalOrder(categories);
        setOrderDirty(false);
    };

    return (
        <div style={{ maxWidth: '700px', width: '100%', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '0.25rem' }}>Gestionar Categorías</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Define las secciones de tu carta. Arrastra las filas para cambiar el orden en el menú digital.
                </p>
            </div>

            {/* Add form */}
            <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '2rem', border: '1px solid var(--divider-color)' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Agregar Nueva Categoría</h4>
                <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'stretch' }}>
                        <div style={{ flex: '1 1 250px' }}>
                            <Input
                                placeholder="Nombre en Español *"
                                value={newCategoryName}
                                onChange={e => setNewCategoryName(e.target.value)}
                                required
                                fullWidth
                            />
                        </div>
                        <div style={{ flex: '1 1 250px' }}>
                            <Input
                                placeholder="Nombre en Inglés (Opcional)"
                                value={newCategoryNameEn}
                                onChange={e => setNewCategoryNameEn(e.target.value)}
                                fullWidth
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            <Palette size={14} /> Color de Categoría
                        </label>
                        <ColorPicker value={newCategoryColor} onChange={setNewCategoryColor} />
                    </div>
                    <Button
                        type="submit"
                        disabled={loading || !newCategoryName.trim()}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', alignSelf: 'flex-start' }}
                    >
                        <FolderPlus size={18} /> Agregar
                    </Button>
                </form>
            </div>

            {/* Order dirty banner */}
            {orderDirty && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(var(--primary-rgb, 37,99,235), 0.08)',
                    border: '1px solid var(--primary-color)',
                    borderRadius: '10px',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Info size={15} /> Orden modificado — guarda para aplicar en la carta digital
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="ghost" size="sm" onClick={handleDiscard}>Descartar</Button>
                        <Button variant="primary" size="sm" onClick={handleSaveOrder} disabled={savingOrder}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Save size={14} /> {savingOrder ? 'Guardando...' : 'Guardar Orden'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Category list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {localOrder.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '2.5rem',
                        border: '2px dashed #eee', borderRadius: '12px', color: '#999'
                    }}>
                        No hay categorías creadas aún.
                    </div>
                ) : (
                    localOrder.map((category, index) => (
                        <CategoryRow
                            key={category.id}
                            category={category}
                            index={index}
                            onDragStart={handleDragStart}
                            onDragEnter={handleDragEnter}
                            onDragEnd={handleDragEnd}
                            onDelete={() => handleDelete(category.id, category.name)}
                            onRename={(name, nameEn, color) => handleRename(category.id, name, nameEn, color)}
                            defaultColors={DEFAULT_CATEGORY_COLORS}
                        />
                    ))
                )}
            </div>

            {localOrder.length > 0 && (
                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <GripVertical size={13} /> Arrastra las filas para reordenar
                </p>
            )}
        </div>
    );
}

// ── CategoryRow sub-component ─────────────────────────────────────────────────
interface CategoryRowProps {
    category: Category;
    index: number;
    onDragStart: (i: number) => void;
    onDragEnter: (i: number) => void;
    onDragEnd: () => void;
    onDelete: () => void;
    onRename: (name: string, nameEn: string, color?: string) => void;
    defaultColors: string[];
}

function CategoryRow({
    category, index,
    onDragStart, onDragEnter, onDragEnd,
    onDelete, onRename, defaultColors
}: CategoryRowProps) {
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(category.name);
    const [editNameEn, setEditNameEn] = useState(category.nameEn || '');
    const [editColor, setEditColor] = useState(category.color || defaultColors[index % defaultColors.length]);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const nameChanged = editName.trim() !== category.name;
        const nameEnChanged = editNameEn.trim() !== (category.nameEn || '');
        const colorChanged = editColor !== (category.color || defaultColors[index % defaultColors.length]);
        if (editName.trim() && (nameChanged || nameEnChanged || colorChanged)) {
            onRename(editName.trim(), editNameEn.trim(), editColor);
        }
        setEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setEditName(category.name);
            setEditNameEn(category.nameEn || '');
            setEditing(false);
        }
    };

    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => { setIsDragOver(true); onDragEnter(index); }}
            onDragLeave={() => setIsDragOver(false)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => setIsDragOver(false)}
            onDragEnd={() => { setIsDragOver(false); onDragEnd(); }}
            style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '12px',
                border: isDragOver
                    ? '2px solid var(--primary-color)'
                    : '1px solid var(--divider-color)',
                backgroundColor: isDragOver
                    ? 'rgba(37,99,235, 0.04)'
                    : 'var(--surface-color)',
                boxShadow: isDragOver ? '0 4px 16px rgba(0,0,0,0.1)' : '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
            }}
        >
            {/* ── Left Controls (Drag, Color Badge & Order) ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                <span style={{ color: '#ccc', cursor: 'grab', display: 'flex' }}
                    onMouseDown={(e) => { e.currentTarget.style.cursor = 'grabbing'; }}
                    onMouseUp={(e) => { e.currentTarget.style.cursor = 'grab'; }}
                >
                    <GripVertical size={20} />
                </span>
                <span style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: category.color || defaultColors[index % defaultColors.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: '800', color: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }}>
                    {index + 1}
                </span>
            </div>

            {/* ── Center Content (Name / inline edit) ── */}
            <div style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {editing ? (
                    <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Español</label>
                                <input
                                    ref={inputRef}
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    autoFocus
                                    style={{
                                        width: '100%', padding: '0.5rem 0.6rem', fontSize: '0.95rem',
                                        border: '1.5px solid var(--primary-color)', borderRadius: '8px',
                                        outline: 'none', fontWeight: '600',
                                        background: 'var(--background-color)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>
                            <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Inglés (Opcional)</label>
                                <input
                                    value={editNameEn}
                                    onChange={e => setEditNameEn(e.target.value)}
                                    onKeyDown={handleEditKeyDown}
                                    style={{
                                        width: '100%', padding: '0.5rem 0.6rem', fontSize: '0.95rem',
                                        border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                        outline: 'none', fontWeight: '400',
                                        background: 'var(--background-color)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                                <Palette size={12} /> Color
                            </label>
                            <ColorPicker value={editColor} onChange={setEditColor} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditName(category.name); setEditNameEn(category.nameEn || ''); setEditColor(category.color || defaultColors[index % defaultColors.length]); setEditing(false); }}>
                                Cancelar
                            </Button>
                            <Button type="submit" variant="primary" size="sm" style={{ fontWeight: 600 }}>
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div
                        style={{ display: 'flex', flexDirection: 'column', cursor: 'text', padding: '0.2rem 0' }}
                        onClick={() => { setEditing(true); setEditName(category.name); setEditNameEn(category.nameEn || ''); }}
                        title="Haz clic para editar"
                    >
                        <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {category.name}
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', color: 'var(--text-secondary)' }}>ES</span>
                        </span>
                        {category.nameEn && (
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                                {category.nameEn}
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 6px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', color: 'rgb(59, 130, 246)' }}>EN</span>
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Right Controls (Delete) ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
                <button
                    onClick={onDelete}
                    title="Eliminar categoría"
                    style={{
                        width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        color: '#ef4444',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
