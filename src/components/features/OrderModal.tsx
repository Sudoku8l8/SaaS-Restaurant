import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/local-db';
import { Button, Card, Input, Badge } from '@/components/shared';
import type { Product, OrderItem, RestaurantTable } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface OrderModalProps {
    table: RestaurantTable;
    onClose: () => void;
    onOrderCreated: () => void;
}

export function OrderModal({ table, onClose, onOrderCreated }: OrderModalProps) {
    const { user } = useAuth();
    const [items, setItems] = useState<OrderItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Fetch products
    const products = useLiveQuery(
        () => db.products.where('restaurantId').equals(user?.restaurantId || '').toArray()
    );

    // Filter products
    const filteredProducts = products?.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Get unique categories
    const categories = ['all', ...new Set(products?.map(p => p.category) || [])];

    const addToOrder = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i =>
                    i.productId === product.id
                        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
                        : i
                );
            }
            return [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                price: product.price,
                subtotal: product.price
            }];
        });
    };

    const removeFromOrder = (productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setItems(prev => prev.map(i => {
            if (i.productId === productId) {
                const newQty = Math.max(1, i.quantity + delta);
                return { ...i, quantity: newQty, subtotal: newQty * i.price };
            }
            return i;
        }));
    };

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const handleCreateOrder = async () => {
        if (!user || items.length === 0) return;

        try {
            // Create Order
            const orderId = crypto.randomUUID();
            await db.orders.add({
                id: orderId,
                restaurantId: user.restaurantId,
                tableNumber: table.number,
                items,
                status: 'pending', // OrderStatus.PENDING
                total,
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: user.id,
                userName: user.name,
            });

            // Update Table Status
            await db.restaurantTables.update(table.id, {
                status: 'occupied', // TableStatus.OCCUPIED
                currentOrderId: orderId
            });

            onOrderCreated();
            onClose();
        } catch (err) {
            console.error('Failed to create order:', err);
            alert('Error al crear el pedido');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <Card title={`Mesa ${table.number} - Nuevo Pedido`} style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>

                    {/* Left: Product Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        <Input
                            placeholder="Buscar producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            fullWidth
                        />

                        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {categories.map(cat => (
                                <Badge
                                    key={cat}
                                    variant={selectedCategory === cat ? 'info' : 'neutral'}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {cat === 'all' ? 'Todos' : cat}
                                </Badge>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                            {filteredProducts?.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addToOrder(product)}
                                    style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        backgroundColor: 'var(--color-background-paper)'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{product.name}</div>
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>S/ {product.price.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--color-border)', paddingLeft: '1rem' }}>
                        <h3>Resumen</h3>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {items.length === 0 ? (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>No hay productos seleccionados</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {items.map(item => (
                                        <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <div>{item.productName}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>S/ {item.price.toFixed(2)} x {item.quantity}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.productId, -1)}>-</Button>
                                                <span>{item.quantity}</span>
                                                <Button size="sm" variant="secondary" onClick={() => updateQuantity(item.productId, 1)}>+</Button>
                                                <Button size="sm" variant="danger" onClick={() => removeFromOrder(item.productId)}>x</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                <span>Total:</span>
                                <span>S/ {total.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
                                <Button variant="primary" fullWidth onClick={handleCreateOrder} disabled={items.length === 0}>Crear Pedido</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
