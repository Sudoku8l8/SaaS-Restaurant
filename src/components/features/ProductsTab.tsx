import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card, Badge } from '@/components/shared';
import { Trash2, Edit2 } from 'lucide-react';
import type { Product, Category } from '@/types';

export function ProductsTab() {
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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
                dietaryTags: formData.dietaryTags,
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
                dietaryTags: product.dietaryTags || [],
            });
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
                dietaryTags: [],
            });
        }
        setIsModalOpen(true);
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

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="ghost" onClick={closeModal} fullWidth>Cancelar</Button>
                                <Button type="submit" fullWidth>Guardar Producto</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
