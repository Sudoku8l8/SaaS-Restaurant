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
    const darkTheme = {
        bg: '#121212',
        surface: '#1e1e1e',
        border: '#333333',
        textPrimary: '#ffffff',
        textSecondary: '#a0a0a0',
        primary: '#2563eb', // Blue
        danger: '#dc2626'
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: isMobile ? '0.25rem' : '2rem',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1200px',
                height: isMobile ? '95vh' : '90vh',
                backgroundColor: darkTheme.bg,
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                color: darkTheme.textPrimary,
                border: `1px solid ${darkTheme.border}`
            }}>
                {/* MOBILE TABS (Only visible on mobile) */}
                {isMobile && (
                    <div style={{ display: 'flex', borderBottom: `1px solid ${darkTheme.border}` }}>
                        <button
                            onClick={() => setMobileView('menu')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: mobileView === 'menu' ? darkTheme.surface : darkTheme.bg,
                                color: mobileView === 'menu' ? darkTheme.primary : darkTheme.textSecondary,
                                border: 'none',
                                borderBottom: mobileView === 'menu' ? `2px solid ${darkTheme.primary}` : 'none',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Utensils size={18} /> Menú
                        </button>
                        <button
                            onClick={() => setMobileView('cart')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: mobileView === 'cart' ? darkTheme.surface : darkTheme.bg,
                                color: mobileView === 'cart' ? darkTheme.primary : darkTheme.textSecondary,
                                border: 'none',
                                borderBottom: mobileView === 'cart' ? `2px solid ${darkTheme.primary}` : 'none',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
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
                        padding: '1.5rem',
                        borderRight: isMobile ? 'none' : `1px solid ${darkTheme.border}`,
                        overflow: 'hidden'
                    }}>

                        {/* Header: Title & Search */}
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '1.5rem', gap: isMobile ? '1rem' : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>
                                    {orderType === 'takeout'
                                        ? 'Nuevo Pedido (Para Llevar)'
                                        : (table?.number ? `Mesa ${table.number}` : 'Nuevo Pedido')}
                                </h2>
                                {isMobile && <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '1.5rem' }}>×</button>}
                            </div>

                            <div style={{ width: isMobile ? '100%' : '300px', position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                                <Input
                                    placeholder="Buscar producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        background: darkTheme.surface,
                                        border: `1px solid ${darkTheme.border}`,
                                        color: 'white',
                                        borderRadius: '8px',
                                        paddingLeft: '2.5rem'
                                    }}
                                    fullWidth
                                />
                            </div>
                        </div>

                        {/* Category Tabs */}
                        <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '1rem', overflowX: 'auto', marginBottom: '1rem' }}>
                            {categoryTabs.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: selectedCategory === cat ? darkTheme.primary : darkTheme.surface,
                                        color: 'white',
                                        fontWeight: selectedCategory === cat ? '600' : '400',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {cat === 'all' ? 'Todos' : cat}
                                </button>
                            ))}
                        </div>

                        {/* Product Grid */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))',
                            gap: isMobile ? '0.5rem' : '1rem',
                            alignContent: 'start',
                            paddingRight: '0.25rem'
                        }}>
                            {filteredProducts?.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => addToOrder(product)}
                                    style={{
                                        backgroundColor: darkTheme.surface,
                                        border: `1px solid ${darkTheme.border}`,
                                        borderRadius: '12px',
                                        padding: isMobile ? '0.75rem' : '1.25rem',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.4rem',
                                        transition: 'transform 0.1s, border-color 0.1s',
                                        height: isMobile ? '110px' : '140px'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = darkTheme.primary; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = darkTheme.border; e.currentTarget.style.transform = 'translateY(0)'; }}
                                >
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: isMobile ? '0.85rem' : '1rem',
                                        color: '#fff',
                                        lineHeight: '1.2',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {product.name}
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>
                                            S/ {product.price.toFixed(2)}
                                        </span>
                                        <div style={{
                                            width: isMobile ? '24px' : '32px',
                                            height: isMobile ? '24px' : '32px',
                                            borderRadius: '50%', background: '#2563eb33',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa',
                                            fontSize: isMobile ? '0.8rem' : '1rem'
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
                        backgroundColor: '#0f0f0f',
                        flexDirection: 'column',
                        borderLeft: isMobile ? 'none' : `1px solid ${darkTheme.border}`,
                        overflow: 'hidden' // Ensure it doesn't push the modal height
                    }}>

                        {/* Summary Header - Only desktop closes from here, mobile has tabs/close in menu */}
                        {!isMobile && (
                            <div style={{ padding: '1.5rem', borderBottom: `1px solid ${darkTheme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: '600', fontSize: '1.2rem' }}>Resumen</h3>
                                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                            </div>
                        )}

                        {/* Order Items List */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: isMobile ? '0.75rem' : '1rem',
                            minHeight: isMobile ? '280px' : 0, // Approx 4 items
                            maxHeight: isMobile ? 'calc(100% - 200px)' : 'none' // Safeguard to keep footer visible
                        }}>
                            {items.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666', gap: '1rem' }}>
                                    <div style={{ fontSize: '3rem', opacity: 0.2 }}>🛒</div>
                                    <p>Selecciona productos del menú</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {items.map(item => (
                                        <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e1e1e', padding: '0.75rem', borderRadius: '8px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{item.productName}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#888' }}>S/ {item.price.toFixed(2)} c/u</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '1rem' }}>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, -1)}
                                                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #444', background: 'transparent', color: 'white', cursor: 'pointer' }}
                                                >-</button>
                                                <span style={{ fontWeight: 'bold', minWidth: '1.5rem', textAlign: 'center' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, 1)}
                                                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #444', background: 'transparent', color: 'white', cursor: 'pointer' }}
                                                >+</button>
                                                <button
                                                    onClick={() => removeFromOrder(item.productId)}
                                                    style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '0.5rem' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div style={{ fontWeight: 'bold', width: '80px', textAlign: 'right' }}>
                                                S/ {(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div style={{
                            padding: isMobile ? '1rem' : '1.5rem',
                            borderTop: `1px solid ${darkTheme.border}`,
                            backgroundColor: '#121212',
                            marginTop: 'auto' // Pull footer to bottom
                        }}>
                            <div style={{ marginBottom: isMobile ? '0.75rem' : '1rem' }}>
                                <label style={{ display: 'block', color: '#888', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Nombre del Cliente (Opcional)</label>
                                <Input
                                    placeholder="Ej. Juan Pérez"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    style={{
                                        background: darkTheme.surface,
                                        border: `1px solid ${darkTheme.border}`,
                                        color: 'white',
                                        borderRadius: '8px',
                                        padding: isMobile ? '0.6rem' : '0.75rem'
                                    }}
                                    fullWidth
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isMobile ? '1rem' : '1.5rem' }}>
                                <span style={{ color: '#888' }}>Total:</span>
                                <span style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 'bold', lineHeight: 1 }}>S/ {total.toFixed(2)}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: isMobile ? '0.75rem' : '1rem' }}>
                                <Button
                                    variant="outline"
                                    onClick={onClose}
                                    style={{
                                        borderColor: darkTheme.danger,
                                        color: darkTheme.danger,
                                        height: isMobile ? '44px' : '50px'
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveOrder}
                                    disabled={items.length === 0}
                                    style={{
                                        background: darkTheme.primary,
                                        height: isMobile ? '44px' : '50px',
                                        fontSize: isMobile ? '1rem' : '1.1rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {initialOrder ? 'Actualizar' : 'Crear'} Pedido
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
