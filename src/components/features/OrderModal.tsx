import { useState, useEffect } from 'react';
import { ShoppingCart, Utensils, Search, Trash2 } from 'lucide-react';
import { db } from '@/services/firebase/config';
import { collection, query, where } from 'firebase/firestore';
import { Button, Input } from '@/components/shared';
import type { Product, OrderItem, RestaurantTable, Order, Category } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { generateUUID } from '@/utils/uuid';
import { onSnapshot } from 'firebase/firestore';

interface OrderModalProps {
    table?: RestaurantTable; // Optional for takeout
    initialOrder?: Order;
    onClose: () => void;
    onOrderCreated: () => void;
    orderType?: 'dine-in' | 'takeout';
}

export function OrderModal({ table, initialOrder, onClose, onOrderCreated, orderType = 'dine-in' }: OrderModalProps) {
    const { user } = useAuth();
    const { createOrder, updateOrder } = useOrders();
    const [items, setItems] = useState<OrderItem[]>(initialOrder?.items || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [customerName, setCustomerName] = useState(initialOrder?.customerName || '');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileView, setMobileView] = useState<'menu' | 'cart'>('menu');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch products and categories
    useEffect(() => {
        if (!user?.restaurantId) return;

        const pQuery = query(collection(db, 'products'), where('restaurantId', '==', user.restaurantId));
        const unsubscribeProducts = onSnapshot(pQuery, (snapshot) => {
            setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        });

        const cQuery = query(collection(db, 'categories'), where('restaurantId', '==', user.restaurantId));
        const unsubscribeCategories = onSnapshot(cQuery, (snapshot) => {
            setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
        });

        return () => {
            unsubscribeProducts();
            unsubscribeCategories();
        };
    }, [user?.restaurantId]);

    // Filter products
    const filteredProducts = products?.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Get dynamic categories
    const categoryTabs = ['all', ...categories.map(c => c.name)];

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

    const handleSaveOrder = async () => {
        if (!user || items.length === 0) return;

        try {
            if (initialOrder) {
                // Update Order
                await updateOrder(initialOrder.id, {
                    items,
                    total,
                    updatedAt: new Date(),
                    ...(customerName.trim() ? { customerName: customerName.trim() } : { customerName: '' }) // Clear if empty
                });
            } else {
                // Create Order
                const orderId = generateUUID();
                await createOrder({
                    id: orderId,
                    restaurantId: user.restaurantId,
                    tableNumber: orderType === 'takeout' ? 0 : (table?.number || 0),
                    items,
                    status: 'pending',
                    total,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userId: user.id,
                    userName: user.name,
                    orderType,
                    ...(customerName.trim() ? { customerName: customerName.trim() } : {})
                });
            }

            onOrderCreated();
            onClose();
        } catch (err: any) {
            console.error('Failed to save order:', err);
            alert(`Error al guardar el pedido: ${err.message || 'Desconocido'}`);
        }
    };

    // Styles for Dark Theme Modal
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(44, 62, 80, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: isMobile ? '0' : '2rem',
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1200px',
                height: isMobile ? '100dvh' : '90vh',
                backgroundColor: 'var(--background-color)',
                borderRadius: isMobile ? '0' : 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                color: 'var(--text-primary)',
                border: isMobile ? 'none' : '1px solid var(--border-color)'
            }}>
                {/* MOBILE TABS */}
                {isMobile && (
                    <div style={{
                        display: 'flex',
                        background: 'var(--surface-color)',
                        borderBottom: '1px solid var(--border-color)',
                        padding: '4px'
                    }}>
                        <button
                            onClick={() => setMobileView('menu')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: mobileView === 'menu' ? 'var(--divider-color)' : 'transparent',
                                color: mobileView === 'menu' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Utensils size={18} /> Menú
                        </button>
                        <button
                            onClick={() => setMobileView('cart')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: mobileView === 'cart' ? 'var(--divider-color)' : 'transparent',
                                color: mobileView === 'cart' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                border: 'none',
                                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <ShoppingCart size={18} />
                            Pedido ({items.reduce((acc, item) => acc + item.quantity, 0)})
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>

                    {/* LEFT PANEL: Menu & Selection */}
                    <div style={{
                        flex: isMobile ? 1 : 7,
                        display: (!isMobile || mobileView === 'menu') ? 'flex' : 'none',
                        flexDirection: 'column',
                        padding: isMobile ? '1rem' : '2rem',
                        borderRight: isMobile ? 'none' : '1px solid var(--border-color)',
                        overflow: 'hidden',
                        background: 'var(--surface-color)'
                    }}>

                        {/* Header: Title & Search */}
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            alignItems: isMobile ? 'stretch' : 'center',
                            marginBottom: '1.5rem',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--primary-color)' }}>
                                    {orderType === 'takeout'
                                        ? 'Nuevo Pedido'
                                        : (table?.number ? `Mesa ${table.number}` : 'Nuevo Pedido')}
                                </h2>
                                {isMobile && <button onClick={onClose} style={{ background: 'var(--divider-color)', border: 'none', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
                            </div>

                            <div style={{ width: isMobile ? '100%' : '350px', position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', opacity: 0.6 }} />
                                <Input
                                    placeholder="Buscar en el menú..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        background: 'var(--background-color)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-full)',
                                        paddingLeft: '3rem',
                                        height: '48px',
                                        fontSize: '0.95rem'
                                    }}
                                    fullWidth
                                />
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            paddingBottom: '1rem',
                            overflowX: 'auto',
                            marginBottom: '1rem',
                            scrollbarWidth: 'none'
                        }}>
                            {categoryTabs.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '0.6rem 1.25rem',
                                        borderRadius: 'var(--radius-full)',
                                        border: '1px solid',
                                        borderColor: selectedCategory === cat ? 'var(--primary-color)' : 'var(--border-color)',
                                        background: selectedCategory === cat ? 'var(--primary-color)' : 'transparent',
                                        color: selectedCategory === cat ? 'white' : 'var(--text-secondary)',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {cat === 'all' ? '🍽️ Todos' : cat}
                                </button>
                            ))}
                        </div>

                        {/* Product Grid */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '1rem',
                            alignContent: 'start',
                            padding: '4px'
                        }}>
                            {filteredProducts?.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addToOrder(product)}
                                    style={{
                                        backgroundColor: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        boxShadow: 'var(--shadow-sm)',
                                        height: '140px',
                                        justifyContent: 'space-between'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                    }}
                                >
                                    <div style={{
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        color: 'var(--text-primary)',
                                        lineHeight: '1.3',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {product.name}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.1rem' }}>
                                            S/ {product.price.toFixed(2)}
                                        </span>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'var(--divider-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--primary-color)',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold'
                                        }}>
                                            +
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Summary Sidebar */}
                    <div style={{
                        flex: isMobile ? 1 : 3,
                        display: (!isMobile || mobileView === 'cart') ? 'flex' : 'none',
                        backgroundColor: 'var(--background-color)',
                        flexDirection: 'column',
                        borderLeft: isMobile ? 'none' : '1px solid var(--border-color)',
                        overflow: 'hidden'
                    }}>

                        {/* Summary Header */}
                        {!isMobile && (
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
                                <h3 style={{ margin: 0, fontWeight: '700', fontSize: '1.2rem', color: 'var(--text-primary)' }}>Resumen del Pedido</h3>
                                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                            </div>
                        )}

                        {/* Order Items List */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            {items.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', gap: '1rem', opacity: 0.5 }}>
                                    <ShoppingCart size={48} strokeWidth={1} />
                                    <p style={{ fontWeight: '500' }}>Tu carrito está vacío</p>
                                </div>
                            ) : (
                                items.map(item => (
                                    <div key={item.productId} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        backgroundColor: 'var(--surface-color)',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>{item.productName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>S/ {item.price.toFixed(2)} c/u</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'var(--background-color)',
                                                padding: '4px',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, -1)}
                                                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                                                >-</button>
                                                <span style={{ fontWeight: '800', minWidth: '1.2rem', textAlign: 'center', color: 'var(--primary-color)' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, 1)}
                                                    style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}
                                                >+</button>
                                            </div>
                                            <button
                                                onClick={() => removeFromOrder(item.productId)}
                                                style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(192, 110, 82, 0.1)', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: isMobile ? '1.25rem' : '1.5rem',
                            borderTop: '1px solid var(--border-color)',
                            backgroundColor: 'var(--surface-color)',
                            marginTop: 'auto',
                            boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.05)'
                        }}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identificación</label>
                                <Input
                                    placeholder="Nombre del cliente..."
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    style={{
                                        background: 'var(--background-color)',
                                        border: '1px solid var(--border-color)',
                                        color: 'var(--text-primary)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.75rem 1rem',
                                        fontSize: '0.95rem'
                                    }}
                                    fullWidth
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL</span>
                                <span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>S/ {total.toFixed(2)}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '1rem' }}>
                                {!isMobile && (
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        style={{ height: '54px', borderRadius: 'var(--radius-md)', fontWeight: '600' }}
                                    >
                                        Cancelar
                                    </Button>
                                )}
                                <Button
                                    variant="primary"
                                    onClick={handleSaveOrder}
                                    disabled={items.length === 0}
                                    style={{
                                        background: 'var(--primary-color)',
                                        height: '54px',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '1.1rem',
                                        fontWeight: '700',
                                        boxShadow: '0 4px 12px rgba(142, 115, 91, 0.2)'
                                    }}
                                >
                                    {initialOrder ? 'Confirmar Cambios' : 'Confirmar Pedido'}
                                </Button>
                                {isMobile && (
                                    <button
                                        onClick={onClose}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', padding: '0.5rem' }}
                                    >
                                        Volver sin guardar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
