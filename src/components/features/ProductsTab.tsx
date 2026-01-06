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
        price: '',
        category: '',
        available: true
    });

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
                price: parseFloat(formData.price),
                category: formData.category,
                available: formData.available
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
                price: product.price.toString(),
                category: product.category,
                available: product.available
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: '',
                category: categories.length > 0 ? categories[0].name : '',
                available: true
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
                        <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                        <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>S/ {product.price.toFixed(2)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{product.category}</div>
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
                    <Card style={{ padding: '2rem', width: '400px', maxWidth: '90%' }}>
                        <h2>{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Nombre"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
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
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
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

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.available}
                                    onChange={e => setFormData({ ...formData, available: e.target.checked })}
                                />
                                Disponible para venta
                            </label>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="ghost" onClick={closeModal} fullWidth>Cancelar</Button>
                                <Button type="submit" fullWidth>Guardar</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
