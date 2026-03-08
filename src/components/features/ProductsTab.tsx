import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card, Badge } from '@/components/shared';
import { Trash2, Edit2, ChefHat, Plus, X, Settings2 } from 'lucide-react';
import type { Product, Category, InventoryType, UnitOfMeasure, ProductModifier, ModifierOption } from '@/types';
import { UnitOfMeasure as UC } from '@/types';
import { RecipeModal } from './RecipeModal';
import { generateUUID } from '@/utils/uuid';

export function ProductsTab() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [recipeModalOpen, setRecipeModalOpen] = useState(false);
    const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
    const [modifiers, setModifiers] = useState<ProductModifier[]>([]);

    const UNIT_OPTIONS: { value: UnitOfMeasure; label: string }[] = [
        { value: UC.UNIT, label: 'Unidad' },
        { value: UC.GRAM, label: 'Gramos (g)' },
        { value: UC.KILOGRAM, label: 'Kilogramos (kg)' },
        { value: UC.LITER, label: 'Litros (L)' },
        { value: UC.MILLILITER, label: 'Mililitros (mL)' },
        { value: UC.PIECE, label: 'Piezas' },
        { value: UC.BOTTLE, label: 'Botellas' },
    ];

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        nameEn: '',
        price: '',
        category: '',
        description: '',
        descriptionEn: '',
        available: true,
        isPopular: false,
        controlaStock: false,
        stockActual: '',
        stockMinimo: '',
        stockMaximo: '',
        tipoInventario: 'product' as InventoryType,
        unidadMedida: UC.UNIT as UnitOfMeasure,
        dietaryTags: [] as string[],
    });

    const DIETARY_OPTIONS = [
        { tag: 'vegan', label: '🌿 Vegano' },
        { tag: 'vegetarian', label: '🥦 Vegetariano' },
        { tag: 'spicy', label: '🌶️ Picante' },
        { tag: 'gluten-free', label: '🌾 Sin Gluten' },
        { tag: 'dairy-free', label: '🥛 Sin Lácteos' },
        { tag: 'nut-free', label: '🥜 Sin Nueces' },
    ];

    useEffect(() => {
        if (!user?.restaurantId) return;

        const pQuery = query(
            collection(db, 'products'),
            where('restaurantId', '==', user.restaurantId)
        );

        const unsubscribeProducts = onSnapshot(pQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(data);
        });

        // Fetch Categories
        const cQuery = query(
            collection(db, 'categories'),
            where('restaurantId', '==', user.restaurantId)
        );

        const unsubscribeCategories = onSnapshot(cQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));

            // Set initial category if not set
            if (data.length > 0 && !formData.category) {
                setFormData(prev => ({ ...prev, category: data[0].name }));
            }
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
        };
    }, [user?.restaurantId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const productData = {
                restaurantId: user?.restaurantId,
                name: formData.name,
                nameEn: formData.nameEn.trim(),
                price: parseFloat(formData.price),
                category: formData.category,
                description: formData.description.trim(),
                descriptionEn: formData.descriptionEn.trim(),
                available: formData.available,
                isPopular: formData.isPopular,
                controlaStock: formData.controlaStock,
                tipoInventario: formData.controlaStock ? formData.tipoInventario : 'product',
                unidadMedida: formData.controlaStock && formData.tipoInventario === 'product' ? formData.unidadMedida : 'unidad',
                stockActual: formData.controlaStock && formData.tipoInventario === 'product' ? (formData.stockActual === '' ? 0 : parseFloat(formData.stockActual) || 0) : 0,
                stockMinimo: formData.controlaStock && formData.tipoInventario === 'product' ? (formData.stockMinimo === '' ? 0 : parseFloat(formData.stockMinimo) || 0) : 0,
                stockMaximo: formData.controlaStock && formData.tipoInventario === 'product' && formData.stockMaximo ? parseFloat(formData.stockMaximo) : 0,
                fechaActualizacionStock: new Date(),
                dietaryTags: formData.dietaryTags,
                modifiers: modifiers.filter(m => m.name.trim() && m.options.length > 0),
            };

            if (editingProduct) {
                await updateDoc(doc(db, 'products', editingProduct.id), productData);
            } else {
                await addDoc(collection(db, 'products'), productData);
            }

            closeModal();
        } catch (error) {
            console.error(error);
            alert("Error al guardar producto");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar producto?')) {
            await deleteDoc(doc(db, 'products', id));
        }
    };

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                nameEn: product.nameEn || '',
                price: product.price.toString(),
                category: product.category,
                description: product.description || '',
                descriptionEn: product.descriptionEn || '',
                available: product.available,
                isPopular: product.isPopular || false,
                controlaStock: product.controlaStock || false,
                stockActual: product.stockActual !== undefined ? product.stockActual.toString() : '',
                stockMinimo: product.stockMinimo !== undefined ? product.stockMinimo.toString() : '',
                stockMaximo: product.stockMaximo !== undefined ? product.stockMaximo.toString() : '',
                tipoInventario: product.tipoInventario || 'product',
                unidadMedida: product.unidadMedida || UC.UNIT,
                dietaryTags: product.dietaryTags || [],
            });
            setModifiers(product.modifiers || []);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                nameEn: '',
                price: '',
                category: categories.length > 0 ? categories[0].name : '',
                description: '',
                descriptionEn: '',
                available: true,
                isPopular: false,
                controlaStock: false,
                stockActual: '',
                stockMinimo: '',
                stockMaximo: '',
                tipoInventario: 'product',
                unidadMedida: UC.UNIT,
                dietaryTags: [],
            });
            setModifiers([]);
        }
        setIsModalOpen(true);
    };

    // ── Modifier helpers ──
    const addModifier = () => {
        setModifiers(prev => [...prev, {
            id: generateUUID(),
            name: '',
            options: [{ name: '', price: 0 }],
            required: false,
            multiple: true,
            minSelections: 0,
            maxSelections: 1,
        }]);
    };

    const updateModifier = (idx: number, patch: Partial<ProductModifier>) => {
        setModifiers(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));
    };

    const removeModifier = (idx: number) => {
        setModifiers(prev => prev.filter((_, i) => i !== idx));
    };

    const addOption = (modIdx: number) => {
        setModifiers(prev => prev.map((m, i) =>
            i === modIdx ? { ...m, options: [...m.options, { name: '', price: 0 }] } : m
        ));
    };

    const updateOption = (modIdx: number, optIdx: number, patch: Partial<ModifierOption>) => {
        setModifiers(prev => prev.map((m, i) =>
            i === modIdx ? { ...m, options: m.options.map((o, j) => j === optIdx ? { ...o, ...patch } : o) } : m
        ));
    };

    const removeOption = (modIdx: number, optIdx: number) => {
        setModifiers(prev => prev.map((m, i) =>
            i === modIdx ? { ...m, options: m.options.filter((_, j) => j !== optIdx) } : m
        ));
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3>Inventario ({products.length})</h3>
                <Button onClick={() => openModal()}>+ Nuevo Producto</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {products.map(product => (
                    <Card key={product.id} style={{ padding: '1rem', position: 'relative', opacity: product.available ? 1 : 0.6 }}>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {product.name}
                            {product.isPopular && <span title="Popular">⭐</span>}
                            {product.tipoInventario === 'recipe' && <span title="Tiene receta"><ChefHat size={14} color="var(--primary-color)" /></span>}
                            {(product.dietaryTags || []).map(tag => (
                                <span key={tag} title={tag} style={{ fontSize: '0.85rem' }}>
                                    {tag === 'vegan' ? '🌿' : tag === 'vegetarian' ? '🥦' : tag === 'spicy' ? '🌶️' : tag === 'gluten-free' ? '🌾' : tag === 'dairy-free' ? '🥛' : tag === 'nut-free' ? '🥜' : ''}
                                </span>
                            ))}
                        </div>
                        <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>S/ {product.price.toFixed(2)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{product.category}</div>
                        {product.description && (
                            <div style={{ fontSize: '0.78rem', color: '#999', fontStyle: 'italic', marginTop: '0.3rem', lineHeight: 1.4 }}>
                                {product.description}
                            </div>
                        )}
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <Button size="sm" variant="outline" onClick={() => openModal(product)}><Edit2 size={14} className="mr-1" /> Editar</Button>
                            {product.tipoInventario === 'recipe' && (
                                <Button size="sm" variant="outline" onClick={() => { setRecipeProduct(product); setRecipeModalOpen(true); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}>
                                    <ChefHat size={14} />
                                </Button>
                            )}
                            <Button size="sm" variant="danger" onClick={() => handleDelete(product.id)}><Trash2 size={14} /></Button>
                        </div>
                        {!product.available && <Badge variant="warning" style={{ position: 'absolute', top: 5, right: 5 }}>Agotado</Badge>}
                    </Card>
                ))}
            </div>

            {/* Modal Simple implementation inline for speed */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <Card style={{ padding: '1.5rem 2rem', width: '450px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1.25rem' }}>{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Nombre (ES)"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ceviche Clásico"
                                />
                                <Input
                                    label="Nombre (EN) - Opcional"
                                    value={formData.nameEn}
                                    onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                                    placeholder="Classic Ceviche"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Precio (S/)"
                                    type="number"
                                    step="0.1"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Categoría</label>
                                    <select
                                        style={{
                                            width: '100%',
                                            padding: '0.56rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--divider-color)',
                                            background: 'var(--background-color)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.9rem'
                                        }}
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        {categories.length === 0 && <option value="">Crear categoría primero...</option>}
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    Descripción (Español)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ej: Tiradito de corvina marinado en leche de tigre..."
                                    rows={2}
                                    maxLength={200}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--divider-color)',
                                        fontSize: '0.88rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        lineHeight: 1.5,
                                        color: 'var(--text-primary)',
                                        background: 'var(--background-color)',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    Descripción (Inglés) - Opcional
                                </label>
                                <textarea
                                    value={formData.descriptionEn}
                                    onChange={e => setFormData({ ...formData, descriptionEn: e.target.value })}
                                    placeholder="Example: Sea bass tiradito marinated in tiger's milk..."
                                    rows={2}
                                    maxLength={200}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--divider-color)',
                                        fontSize: '0.88rem',
                                        fontFamily: 'inherit',
                                        resize: 'vertical',
                                        lineHeight: 1.5,
                                        color: 'var(--text-primary)',
                                        background: 'var(--background-color)',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.available}
                                        onChange={e => setFormData({ ...formData, available: e.target.checked })}
                                    />
                                    Disponible
                                </label>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isPopular}
                                        onChange={e => setFormData({ ...formData, isPopular: e.target.checked })}
                                    />
                                    ⭐ Popular
                                </label>
                            </div>

                            <div style={{ padding: '1rem', border: '1px solid var(--divider-color)', borderRadius: '8px', background: 'var(--surface-color)', marginTop: '0.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.controlaStock}
                                        onChange={e => setFormData({ ...formData, controlaStock: e.target.checked })}
                                    />
                                    Controlar Stock (Inventario)
                                </label>

                                {formData.controlaStock && (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {/* Inventory Type Selector */}
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Tipo de Inventario</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                {([['product', '📦 Producto', 'Stock directo del producto'] as const, ['recipe', '🍳 Receta', 'Descuenta insumos al vender'] as const]).map(([val, lbl, desc]) => (
                                                    <label key={val} style={{
                                                        display: 'flex', flexDirection: 'column', gap: '0.2rem',
                                                        padding: '0.75rem', borderRadius: '8px', cursor: 'pointer',
                                                        border: `2px solid ${formData.tipoInventario === val ? 'var(--primary-color)' : 'var(--divider-color)'}`,
                                                        background: formData.tipoInventario === val ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <input type="radio" name="tipoInventario" checked={formData.tipoInventario === val}
                                                                onChange={() => setFormData({ ...formData, tipoInventario: val })} />
                                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lbl}</span>
                                                        </div>
                                                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginLeft: '1.5rem' }}>{desc}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Simple Product Stock Fields */}
                                        {formData.tipoInventario === 'product' && (
                                            <>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Unidad de Medida</label>
                                                    <select
                                                        value={formData.unidadMedida}
                                                        onChange={e => setFormData({ ...formData, unidadMedida: e.target.value as UnitOfMeasure })}
                                                        style={{ width: '100%', padding: '0.56rem', borderRadius: '8px', border: '1px solid var(--divider-color)', background: 'var(--background-color)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                                                    >
                                                        {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                                    </select>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                                    <Input label="Stock Actual" type="number" min="0" step="0.01" value={formData.stockActual}
                                                        onChange={e => setFormData({ ...formData, stockActual: e.target.value })} required placeholder="50" />
                                                    <Input label="Stock Mínimo" type="number" min="0" step="0.01" value={formData.stockMinimo}
                                                        onChange={e => setFormData({ ...formData, stockMinimo: e.target.value })} required placeholder="10" />
                                                    <Input label="Stock Máximo" type="number" min="0" step="0.01" value={formData.stockMaximo}
                                                        onChange={e => setFormData({ ...formData, stockMaximo: e.target.value })} placeholder="Opcional" />
                                                </div>
                                            </>
                                        )}

                                        {/* Recipe Type Info */}
                                        {formData.tipoInventario === 'recipe' && (
                                            <div style={{ padding: '0.75rem 1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '8px', border: '1px dashed var(--primary-color)' }}>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    <ChefHat size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                                    Guarda el producto y luego usa el botón <strong>"Receta"</strong> en la lista para configurar sus ingredientes.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Dietary Tags */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    Etiquetas Dietéticas / Alérgenos
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                                    {DIETARY_OPTIONS.map(opt => {
                                        const active = formData.dietaryTags.includes(opt.tag);
                                        return (
                                            <button
                                                key={opt.tag}
                                                type="button"
                                                onClick={() => {
                                                    const newTags = active
                                                        ? formData.dietaryTags.filter(t => t !== opt.tag)
                                                        : [...formData.dietaryTags, opt.tag];
                                                    setFormData({ ...formData, dietaryTags: newTags });
                                                }}
                                                style={{
                                                    padding: '0.4rem 0.5rem',
                                                    borderRadius: '8px',
                                                    border: active ? '2px solid var(--primary-color)' : '1.5px solid var(--divider-color)',
                                                    background: active ? 'color-mix(in srgb, var(--primary-color) 10%, white)' : 'transparent',
                                                    color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                    fontSize: '0.78rem',
                                                    fontWeight: active ? 700 : 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Modifier Editor ── */}
                            <div style={{ padding: '1rem', border: '1px solid var(--divider-color)', borderRadius: '8px', background: 'var(--surface-color)', marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: modifiers.length > 0 ? '0.75rem' : 0 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                        <Settings2 size={16} /> Modificadores
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addModifier}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                                            padding: '0.35rem 0.75rem', borderRadius: '6px',
                                            border: '1px dashed var(--primary-color)', background: 'transparent',
                                            color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Plus size={14} /> Añadir
                                    </button>
                                </div>

                                {modifiers.map((mod, modIdx) => (
                                    <div key={mod.id} style={{
                                        padding: '0.75rem', border: '1px solid var(--divider-color)',
                                        borderRadius: '8px', marginBottom: '0.75rem',
                                        background: 'var(--background-color)'
                                    }}>
                                        {/* Modifier header */}
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <input
                                                type="text"
                                                value={mod.name}
                                                onChange={e => updateModifier(modIdx, { name: e.target.value })}
                                                placeholder="Ej: Sabores, Toppings, Salsas..."
                                                style={{
                                                    flex: 1, padding: '0.4rem 0.6rem', borderRadius: '6px',
                                                    border: '1px solid var(--divider-color)',
                                                    background: 'var(--surface-color)', color: 'var(--text-primary)',
                                                    fontSize: '0.88rem', fontWeight: 600
                                                }}
                                            />
                                            <button type="button" onClick={() => removeModifier(modIdx)} style={{
                                                background: 'transparent', border: 'none', color: 'var(--danger-color)',
                                                cursor: 'pointer', padding: '0.25rem'
                                            }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Modifier config row */}
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={mod.required || false}
                                                    onChange={e => updateModifier(modIdx, { required: e.target.checked, minSelections: e.target.checked ? Math.max(mod.minSelections || 0, 1) : 0 })} />
                                                Obligatorio
                                            </label>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
                                                <span>Mín:</span>
                                                <input type="number" min={0} max={20} value={mod.minSelections || 0}
                                                    onChange={e => updateModifier(modIdx, { minSelections: parseInt(e.target.value) || 0, required: parseInt(e.target.value) > 0 })}
                                                    style={{ width: '42px', padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid var(--divider-color)', textAlign: 'center', fontSize: '0.82rem', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
                                                <span>Máx:</span>
                                                <input type="number" min={1} max={20} value={mod.maxSelections || 1}
                                                    onChange={e => updateModifier(modIdx, { maxSelections: parseInt(e.target.value) || 1, multiple: parseInt(e.target.value) > 1 })}
                                                    style={{ width: '42px', padding: '0.2rem 0.35rem', borderRadius: '4px', border: '1px solid var(--divider-color)', textAlign: 'center', fontSize: '0.82rem', background: 'var(--surface-color)', color: 'var(--text-primary)' }} />
                                            </div>
                                        </div>

                                        {/* Options list */}
                                        {mod.options.map((opt, optIdx) => (
                                            <div key={optIdx} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                                                <input
                                                    type="text"
                                                    value={opt.name}
                                                    onChange={e => updateOption(modIdx, optIdx, { name: e.target.value })}
                                                    placeholder="Nombre opción"
                                                    style={{
                                                        flex: 1, padding: '0.35rem 0.5rem', borderRadius: '5px',
                                                        border: '1px solid var(--divider-color)', fontSize: '0.82rem',
                                                        background: 'var(--surface-color)', color: 'var(--text-primary)'
                                                    }}
                                                />
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.1"
                                                    value={opt.price || 0}
                                                    onChange={e => updateOption(modIdx, optIdx, { price: parseFloat(e.target.value) || 0 })}
                                                    placeholder="+S/"
                                                    style={{
                                                        width: '60px', padding: '0.35rem 0.4rem', borderRadius: '5px',
                                                        border: '1px solid var(--divider-color)', textAlign: 'center',
                                                        fontSize: '0.82rem', background: 'var(--surface-color)', color: 'var(--text-primary)'
                                                    }}
                                                />
                                                <button type="button" onClick={() => removeOption(modIdx, optIdx)} style={{
                                                    background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                                    cursor: 'pointer', padding: '0.2rem'
                                                }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => addOption(modIdx)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                padding: '0.25rem 0.5rem', border: 'none',
                                                background: 'transparent', color: 'var(--primary-color)',
                                                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.2rem'
                                            }}
                                        >
                                            <Plus size={12} /> Opción
                                        </button>
                                    </div>
                                ))}

                                {modifiers.length === 0 && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontStyle: 'italic' }}>
                                        Sin modificadores. Usa esto para agregar sabores, toppings, extras, etc.
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="ghost" onClick={closeModal} fullWidth>Cancelar</Button>
                                <Button type="submit" fullWidth>Guardar Producto</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Recipe Modal */}
            {recipeProduct && (
                <RecipeModal
                    productId={recipeProduct.id}
                    productName={recipeProduct.name}
                    isOpen={recipeModalOpen}
                    onClose={() => { setRecipeModalOpen(false); setRecipeProduct(null); }}
                />
            )}
        </div>
    );
}
