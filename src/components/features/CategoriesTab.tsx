import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Card } from '@/components/shared';
import { Trash2, FolderPlus } from 'lucide-react';
import type { Category } from '@/types';

export function CategoriesTab() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user?.restaurantId) return;

        const q = query(
            collection(db, 'categories'),
            where('restaurantId', '==', user.restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            } as Category));

            // Sort by name or date, name is usually better for menus
            setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
        });

        return () => unsubscribe();
    }, [user?.restaurantId]);

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim() || !user?.restaurantId) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'categories'), {
                restaurantId: user.restaurantId,
                name: newCategoryName.trim(),
                createdAt: serverTimestamp()
            });
            setNewCategoryName('');
        } catch (error) {
            console.error(error);
            alert("Error al guardar categoría");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Eliminar la categoría "${name}"? Los productos asociados quedarán huérfanos.`)) {
            try {
                await deleteDoc(doc(db, 'categories', id));
            } catch (error) {
                console.error(error);
                alert("Error al eliminar categoría");
            }
        }
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h3>Gestionar Categorías</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Define las secciones de tu carta (ej: Entradas, Sopas, Postres)</p>
            </div>

            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                <Input
                    placeholder="Nueva categoría (ej: Bebidas)"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    required
                />
                <Button type="submit" disabled={loading || !newCategoryName.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderPlus size={18} /> Agregar
                </Button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {categories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', border: '2px dashed #eee', borderRadius: '12px', color: '#999' }}>
                        No hay categorías creadas aún.
                    </div>
                ) : (
                    categories.map(category => (
                        <Card key={category.id} style={{
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px solid #eee'
                        }}>
                            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{category.name}</span>
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(category.id, category.name)}
                                style={{ padding: '0.5rem' }}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
