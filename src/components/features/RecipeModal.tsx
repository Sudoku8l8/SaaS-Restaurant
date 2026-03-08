import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import {
    collection, query, where, getDocs, onSnapshot,
    doc, setDoc, deleteDoc
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card } from '@/components/shared';
import { Plus, Trash2, ChefHat, Package } from 'lucide-react';
import type { Recipe, RecipeIngredient, InventoryItem, UnitOfMeasure } from '@/types';
import { UnitOfMeasure as UC } from '@/types';
import { generateUUID } from '@/utils/uuid';
import { getPeruNow } from '@/utils/dateUtils';

const UNIT_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
    { value: UC.UNIT, label: 'Unidad' },
    { value: UC.GRAM, label: 'Gramos (g)' },
    { value: UC.KILOGRAM, label: 'Kilogramos (kg)' },
    { value: UC.LITER, label: 'Litros (L)' },
    { value: UC.MILLILITER, label: 'Mililitros (mL)' },
    { value: UC.PIECE, label: 'Piezas' },
    { value: UC.BOTTLE, label: 'Botellas' },
];

interface Props {
    productId: string;
    productName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function RecipeModal({ productId, productName, isOpen, onClose }: Props) {
    const { user } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [existingRecipe, setExistingRecipe] = useState<Recipe | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load inventory items for dropdown
    useEffect(() => {
        if (!user?.restaurantId || !isOpen) return;

        const q = query(
            collection(db, 'inventory_items'),
            where('restaurantId', '==', user.restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() || new Date(),
                updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
            } as InventoryItem));
            data.sort((a, b) => a.name.localeCompare(b.name));
            setItems(data);
        });

        return () => unsubscribe();
    }, [user?.restaurantId, isOpen]);

    // Load existing recipe
    useEffect(() => {
        if (!user?.restaurantId || !productId || !isOpen) return;

        setIsLoading(true);
        const loadRecipe = async () => {
            const q = query(
                collection(db, 'recipes'),
                where('restaurantId', '==', user.restaurantId),
                where('productId', '==', productId)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const data = snap.docs[0].data();
                const recipe: Recipe = {
                    id: snap.docs[0].id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || new Date(),
                    updatedAt: data.updatedAt?.toDate?.() || new Date(),
                } as Recipe;
                setExistingRecipe(recipe);
                setIngredients(recipe.ingredients || []);
            } else {
                setExistingRecipe(null);
                setIngredients([]);
            }
            setIsLoading(false);
        };
        loadRecipe();
    }, [user?.restaurantId, productId, isOpen]);

    const addIngredient = () => {
        const first = items[0];
        if (!first) {
            alert('Primero debes crear insumos en la pestaña de Insumos.');
            return;
        }
        setIngredients([...ingredients, {
            inventoryItemId: first.id,
            itemName: first.name,
            quantity: 1,
            unit: first.unit,
        }]);
    };

    const updateIngredient = (index: number, field: string, value: string | number) => {
        const updated = [...ingredients];
        if (field === 'inventoryItemId') {
            const item = items.find(i => i.id === value);
            if (item) {
                updated[index] = { ...updated[index], inventoryItemId: item.id, itemName: item.name, unit: item.unit };
            }
        } else if (field === 'quantity') {
            updated[index] = { ...updated[index], quantity: parseFloat(String(value)) || 0 };
        } else if (field === 'unit') {
            updated[index] = { ...updated[index], unit: value as UnitOfMeasure };
        }
        setIngredients(updated);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!user?.restaurantId) return;
        if (ingredients.length === 0) {
            alert('Agrega al menos un ingrediente.');
            return;
        }

        setIsSaving(true);
        try {
            const recipeId = existingRecipe?.id || generateUUID();
            const recipeData: Recipe = {
                id: recipeId,
                productId,
                restaurantId: user.restaurantId,
                ingredients,
                createdAt: existingRecipe?.createdAt || getPeruNow(),
                updatedAt: getPeruNow(),
            };

            await setDoc(doc(db, 'recipes', recipeId), recipeData);
            onClose();
        } catch (err) {
            console.error('Error saving recipe:', err);
            alert('Error al guardar la receta.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingRecipe) return;
        if (confirm('¿Eliminar esta receta? El producto quedará sin receta asociada.')) {
            await deleteDoc(doc(db, 'recipes', existingRecipe.id));
            setIngredients([]);
            setExistingRecipe(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <Card style={{ padding: '2rem', width: '600px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ChefHat size={22} color="var(--primary-color)" />
                        Receta: {productName}
                    </h3>
                    {existingRecipe && (
                        <Button size="sm" variant="danger" onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Trash2 size={14} /> Eliminar
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Cargando receta...</div>
                ) : (
                    <>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
                            Define los insumos necesarios para preparar una unidad de <strong>{productName}</strong>.
                            Al vender este producto, el stock de cada ingrediente se descontará automáticamente.
                        </p>

                        {items.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--background-color)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                                <Package size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    No hay insumos registrados. Ve a Configuración → Insumos para crearlos.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Ingredients List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                    {ingredients.map((ing, i) => (
                                        <div key={i} style={{
                                            display: 'grid', gridTemplateColumns: '1fr 100px 120px 40px', gap: '0.75rem',
                                            alignItems: 'end', padding: '0.75rem', background: 'var(--background-color)',
                                            borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)',
                                        }}>
                                            <div>
                                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Insumo</label>
                                                <select
                                                    value={ing.inventoryItemId}
                                                    onChange={e => updateIngredient(i, 'inventoryItemId', e.target.value)}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--divider-color)', background: 'var(--surface-color)', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                                                >
                                                    {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Cantidad</label>
                                                <input
                                                    type="number" step="0.01" min="0.01" value={ing.quantity}
                                                    onChange={e => updateIngredient(i, 'quantity', e.target.value)}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--divider-color)', background: 'var(--surface-color)', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Unidad</label>
                                                <select
                                                    value={ing.unit}
                                                    onChange={e => updateIngredient(i, 'unit', e.target.value)}
                                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--divider-color)', background: 'var(--surface-color)', fontSize: '0.9rem', color: 'var(--text-primary)' }}
                                                >
                                                    {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                                </select>
                                            </div>
                                            <Button size="sm" variant="danger" onClick={() => removeIngredient(i)} style={{ padding: '0.5rem', height: '36px' }}>
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <Button variant="outline" onClick={addIngredient} fullWidth style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <Plus size={16} /> Agregar Ingrediente
                                </Button>

                                {ingredients.length > 0 && (
                                    <div style={{ background: 'rgba(37, 99, 235, 0.04)', border: '1px solid rgba(37, 99, 235, 0.15)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
                                            Resumen de receta
                                        </div>
                                        {ingredients.map((ing, i) => (
                                            <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{ing.itemName}</span>
                                                <span>{ing.quantity} {ing.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button type="button" variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
                            <Button variant="primary" onClick={handleSave} fullWidth disabled={isSaving || items.length === 0}>
                                {isSaving ? 'Guardando...' : 'Guardar Receta'}
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
