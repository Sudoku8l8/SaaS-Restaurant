import { useState, useEffect, useRef } from 'react';
import { db } from '@/services/firebase/config';
import {
    collection, query, where, onSnapshot,
    addDoc, doc, deleteDoc, updateDoc, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card } from '@/components/shared';
import { Trash2, FolderPlus, GripVertical, Save, Info } from 'lucide-react';
import type { Category } from '@/types';

export function CategoriesTab() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [localOrder, setLocalOrder] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderDirty, setOrderDirty] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    // Drag state
    const dragIndex = useRef<number | null>(null);
    const dragOverIndex = useRef<number | null>(null);

    useEffect(() => {
        if (!user?.restaurantId) return;

        const q = query(
            collection(db, 'categories'),
            where('restaurantId', '==', user.restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate()
            } as Category));

            // Sort by sortOrder first, then alphabetically as fallback
            const sorted = data.sort((a, b) => {
                if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
                    return a.sortOrder - b.sortOrder;
                }
                if (a.sortOrder !== undefined) return -1;
                if (b.sortOrder !== undefined) return 1;
                return a.name.localeCompare(b.name);
            });

            setCategories(sorted);
            setLocalOrder(sorted);
            setOrderDirty(false);
        });

        return () => unsubscribe();
    }, [user?.restaurantId]);

    // ── Add category ──────────────────────────────────────────────────────────
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim() || !user?.restaurantId) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'categories'), {
                restaurantId: user.restaurantId,
                name: newCategoryName.trim(),
                sortOrder: localOrder.length, // append at end
                createdAt: serverTimestamp()
            });
            setNewCategoryName('');
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
            } catch (error) {
                console.error(error);
                alert('Error al eliminar categoría');
            }
        }
    };

    // ── Rename category ───────────────────────────────────────────────────────
    const handleRename = async (id: string, newName: string) => {
        if (!newName.trim()) return;
        try {
            await updateDoc(doc(db, 'categories', id), { name: newName.trim() });
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

    // ── Move up/down (keyboard-friendly alternative) ──────────────────────────
    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= localOrder.length) return;
        const updated = [...localOrder];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setLocalOrder(updated);
        setOrderDirty(true);
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
        <div style={{ maxWidth: '620px' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '0.25rem' }}>Gestionar Categorías</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Define las secciones de tu carta. Arrastra las filas para cambiar el orden en el menú digital.
                </p>
            </div>

            {/* Add form */}
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                <Input
                    placeholder="Nueva categoría (ej: Bebidas)"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    required
                    fullWidth
                />
                <Button
                    type="submit"
                    disabled={loading || !newCategoryName.trim()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
                >
                    <FolderPlus size={18} /> Agregar
                </Button>
            </form>

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                            total={localOrder.length}
                            onDragStart={handleDragStart}
                            onDragEnter={handleDragEnter}
                            onDragEnd={handleDragEnd}
                            onMoveUp={() => moveItem(index, 'up')}
                            onMoveDown={() => moveItem(index, 'down')}
                            onDelete={() => handleDelete(category.id, category.name)}
                            onRename={(name) => handleRename(category.id, name)}
                        />
                    ))
                )}
            </div>

            {localOrder.length > 0 && (
                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <GripVertical size={13} /> Arrastra las filas para reordenar · También puedes usar las flechas ↑↓
                </p>
            )}
        </div>
    );
}

// ── CategoryRow sub-component ─────────────────────────────────────────────────
interface CategoryRowProps {
    category: Category;
    index: number;
    total: number;
    onDragStart: (i: number) => void;
    onDragEnter: (i: number) => void;
    onDragEnd: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    onRename: (name: string) => void;
}

function CategoryRow({
    category, index, total,
    onDragStart, onDragEnter, onDragEnd,
    onMoveUp, onMoveDown, onDelete, onRename
}: CategoryRowProps) {
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(category.name);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editName.trim() && editName.trim() !== category.name) {
            onRename(editName.trim());
        }
        setEditing(false);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setEditName(category.name);
            setEditing(false);
        }
    };

    return (
        <Card
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => { setIsDragOver(true); onDragEnter(index); }}
            onDragLeave={() => setIsDragOver(false)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => setIsDragOver(false)}
            onDragEnd={() => { setIsDragOver(false); onDragEnd(); }}
            style={{
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                border: isDragOver ? '2px solid var(--primary-color)' : '1px solid var(--divider-color)',
                backgroundColor: isDragOver ? 'rgba(var(--primary-rgb, 37,99,235), 0.04)' : undefined,
                cursor: 'grab',
                transition: 'border-color 0.15s, background-color 0.15s, box-shadow 0.15s',
                boxShadow: isDragOver ? '0 4px 16px rgba(0,0,0,0.1)' : undefined,
                userSelect: 'none',
            }}
        >
            {/* Drag handle */}
            <div style={{ color: '#ccc', cursor: 'grab', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                <GripVertical size={20} />
            </div>

            {/* Order number */}
            <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'var(--surface-color)', border: '1px solid var(--divider-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)',
                flexShrink: 0,
            }}>
                {index + 1}
            </div>

            {/* Name / edit input */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {editing ? (
                    <form onSubmit={handleEditSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
                        <input
                            ref={inputRef}
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            autoFocus
                            style={{
                                flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.95rem',
                                border: '1.5px solid var(--primary-color)', borderRadius: '6px',
                                outline: 'none', fontWeight: '600',
                            }}
                        />
                        <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: '700', fontSize: '0.85rem' }}>
                            OK
                        </button>
                    </form>
                ) : (
                    <span
                        style={{ fontWeight: '600', fontSize: '1rem', cursor: 'text' }}
                        onDoubleClick={() => { setEditing(true); setEditName(category.name); }}
                        title="Doble clic para renombrar"
                    >
                        {category.name}
                    </span>
                )}
            </div>

            {/* Up/Down arrows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                <button
                    onClick={onMoveUp}
                    disabled={index === 0}
                    title="Subir"
                    style={{
                        background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer',
                        color: index === 0 ? '#ddd' : 'var(--text-secondary)',
                        padding: '2px 4px', lineHeight: 1, fontSize: '0.7rem',
                    }}
                >▲</button>
                <button
                    onClick={onMoveDown}
                    disabled={index === total - 1}
                    title="Bajar"
                    style={{
                        background: 'none', border: 'none', cursor: index === total - 1 ? 'not-allowed' : 'pointer',
                        color: index === total - 1 ? '#ddd' : 'var(--text-secondary)',
                        padding: '2px 4px', lineHeight: 1, fontSize: '0.7rem',
                    }}
                >▼</button>
            </div>

            {/* Delete */}
            <Button
                size="sm"
                variant="danger"
                onClick={onDelete}
                style={{ padding: '0.4rem', flexShrink: 0 }}
                title="Eliminar categoría"
            >
                <Trash2 size={15} />
            </Button>
        </Card>
    );
}
