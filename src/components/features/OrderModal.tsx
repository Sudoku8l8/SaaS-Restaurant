import { useState, useEffect, useRef, useMemo } from 'react';
import { ShoppingCart, Utensils, Search, Trash2, Printer, MessageSquare, Banknote, ArrowLeft } from 'lucide-react';
import { generateUUID } from '@/utils/uuid';
import { db } from '@/services/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useTenant } from '@/app/providers/TenantProvider';
import { useProductCache } from '@/hooks/useProductCache';
import type { Product, Order, OrderItem, OrderPayment, RestaurantTable } from '@/types';
import { Card, Button, Input } from '@/components/shared';
import { PaymentModal } from '@/components/features/PaymentModal';
import { printerService } from '@/services/printer/PrinterService';
import { ensurePeruDate, getPeruNow } from '@/utils/dateUtils';

interface OrderModalProps {
    table?: RestaurantTable; // Optional for takeout
    initialOrder?: Order;
    onClose: () => void;
    onOrderCreated: () => void;
    orderType?: 'dine-in' | 'takeout' | 'quick-sale';
}

export function OrderModal({ table, initialOrder, onClose, onOrderCreated, orderType = 'dine-in' }: OrderModalProps) {
    const { user } = useAuth();
    const { createOrder, updateOrder, payOrder } = useOrders();
    const { tenant } = useTenant();
    const orderViewMode = tenant?.config?.orderViewMode ?? 'classic';
    const [items, setItems] = useState<OrderItem[]>(initialOrder?.items || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('popular'); // Default to popular
    const [customerName, setCustomerName] = useState(initialOrder?.customerName || '');
    const { products, categories } = useProductCache(user?.restaurantId);
    // Vista Rápida navigation state
    const [quickViewState, setQuickViewState] = useState<'categories' | 'products'>('categories');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileView, setMobileView] = useState<'menu' | 'cart'>('menu');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [lastSavedOrder, setLastSavedOrder] = useState<Order | null>(null);
    const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
    const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Quick Sale flow state
    const isQuickSale = orderType === 'quick-sale';
    const [showQuickPayment, setShowQuickPayment] = useState(false);
    const [itemsChangedAfterSave, setItemsChangedAfterSave] = useState(false);
    const savedItemsSnapshot = useRef<string>('');

    // Quick Sale: detect items changes after save
    useEffect(() => {
        if (isQuickSale && isSaved && savedItemsSnapshot.current) {
            const currentSnapshot = JSON.stringify(items);
            if (currentSnapshot !== savedItemsSnapshot.current) {
                setItemsChangedAfterSave(true);
            }
        }
    }, [items, isQuickSale, isSaved]);

    // Quick Sale: handle payment
    const handleQuickPayment = async (payments: OrderPayment[], shouldPrintReceipt: boolean, discount?: { type: 'percentage' | 'fixed'; value: number; amount: number }) => {
        try {
            const orderToPay = lastSavedOrder;
            if (!orderToPay) return;
            await payOrder(orderToPay.id, payments, discount);
            if (shouldPrintReceipt && printerService.isConnected) {
                try {
                    const printOrder = { ...orderToPay, payments, status: 'paid' as const };
                    if (discount && discount.amount > 0) {
                        printOrder.subtotal = orderToPay.total;
                        printOrder.discount = discount;
                        printOrder.total = parseFloat((orderToPay.total - discount.amount).toFixed(2));
                    }
                    await printerService.printReceipt(printOrder, tenant?.name || 'Negocio');
                } catch (printError) {
                    console.error('Error printing receipt:', printError);
                }
            }
            setShowQuickPayment(false);
            onClose();
        } catch (error) {
            console.error('Quick payment failed', error);
            alert('Error al registrar pago');
        }
    };

    // Track confirmed items to prevent deletion exploit
    const [confirmedProductIds, setConfirmedProductIds] = useState<Set<string>>(() => {
        const ids = new Set<string>();
        if (initialOrder?.items) {
            initialOrder.items.forEach(i => ids.add(i.productId));
        }
        return ids;
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Filter products
    // Si hay texto en el buscador → buscar en TODOS los productos (ignorar categoría)
    // Búsqueda mejorada: busca por nombre de producto Y por nombre de categoría
    // Si NO hay texto → filtrar por categoría seleccionada
    const filteredProducts = products?.filter(p => {
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchesName = p.name.toLowerCase().includes(term);
            const matchesCategory = p.category.toLowerCase().includes(term);
            return matchesName || matchesCategory;
        }
        if (selectedCategory === 'popular') {
            return p.isPopular === true;
        }
        return p.category === selectedCategory;
    });

    // Get dynamic categories
    const categoryTabs = ['popular', ...categories.map(c => c.name)];

    // Category product counts for Vista Rápida grid
    const categoryProductCounts = useMemo(() => {
        if (!products) return {};
        const counts: Record<string, number> = {};
        products.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });
        return counts;
    }, [products]);

    // Default colors for categories without a color set
    const DEFAULT_COLORS = [
        '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2',
        '#EA580C', '#4F46E5', '#BE185D', '#15803D', '#64748B', '#A855F7',
        '#DB2777', '#0D9488', '#CA8A04', '#6366F1',
    ];

    // Auto-switch to products view when search term is entered (Vista Rápida)
    useEffect(() => {
        if (orderViewMode === 'quick') {
            if (searchTerm.trim()) {
                setQuickViewState('products');
            } else if (quickViewState === 'products' && !selectedCategory) {
                setQuickViewState('categories');
            }
        }
    }, [searchTerm, orderViewMode, quickViewState, selectedCategory]);

    const handleCategorySelect = (catName: string) => {
        setSelectedCategory(catName);
        setQuickViewState('products');
        setSearchTerm('');
    };

    const handleBackToCategories = () => {
        setQuickViewState('categories');
        setSelectedCategory('popular');
        setSearchTerm('');
    };

    // Permission Helpers
    const isWaiter = user?.role === 'waiter';

    // Helper to check if an item can be removed
    const canRemoveItem = (productId: string) => {
        // If user is Admin/Chef, they can always remove
        if (!isWaiter) return true;

        // Waiters cannot remove items that are in the confirmed set
        if (confirmedProductIds.has(productId)) {
            return false;
        }

        // Default to allowing removal for new items
        return true;
    };

    // Helper to check if quantity can be decreased
    const canDecreaseQuantity = (productId: string, currentQty: number) => {
        if (!initialOrder || !isWaiter) return true; // Admins/Chefs or new orders: can decrease

        const originalItem = initialOrder.items.find(i => i.productId === productId);
        if (!originalItem) return true; // It's a new item, can decrease freely

        // Can only decrease if current quantity is greater than original quantity
        return currentQty > originalItem.quantity;
    };

    const addToOrder = (product: Product, overrides?: { selectedOptions: any[], price: number }) => {
        // If product has modifiers and they aren't provided via overrides, open modifier picker
        if (product.modifiers && product.modifiers.length > 0 && !overrides) {
            setModifierProduct(product);
            setSelectedModifiers({});
            return;
        }

        const finalPrice = overrides ? overrides.price : product.price;
        const finalOptions = overrides ? overrides.selectedOptions : [];

        setItems(prev => {
            // Check if exact same product with exact same options exists
            const existing = prev.find(i =>
                i.productId === product.id &&
                JSON.stringify(i.selectedOptions || []) === JSON.stringify(finalOptions || [])
            );

            if (existing) {
                return prev.map(i =>
                    (i.productId === product.id && JSON.stringify(i.selectedOptions || []) === JSON.stringify(finalOptions || []))
                        ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
                        : i
                );
            }
            return [...prev, {
                itemId: generateUUID(),
                productId: product.id,
                productName: product.name,
                quantity: 1,
                price: finalPrice,
                subtotal: finalPrice,
                selectedOptions: finalOptions
            }];
        });

        setModifierProduct(null);
    };

    const handleConfirmModifiers = () => {
        if (!modifierProduct) return;

        const finalOptions: any[] = [];
        let extraPrice = 0;

        modifierProduct.modifiers?.forEach(mod => {
            const selectedNames = selectedModifiers[mod.id] || [];
            selectedNames.forEach(optName => {
                const option = mod.options.find(o => o.name === optName);
                if (option) {
                    finalOptions.push({
                        modifierId: mod.id,
                        modifierName: mod.name,
                        optionName: option.name,
                        price: option.price
                    });
                    extraPrice += (option.price || 0);
                }
            });
        });

        addToOrder(modifierProduct, {
            selectedOptions: finalOptions,
            price: modifierProduct.price + extraPrice
        });
    };

    const removeFromOrder = (itemId: string, productId: string) => {
        if (!canRemoveItem(productId)) return;
        setItems(prev => prev.filter(i => (i.itemId || i.productId) !== itemId));
    };

    const updateQuantity = (itemId: string, productId: string, delta: number) => {
        setItems(prev => prev.map(i => {
            if ((i.itemId || i.productId) === itemId) {
                // Check permission for decreasing
                if (delta < 0 && !canDecreaseQuantity(productId, i.quantity)) {
                    return i;
                }
                const newQty = Math.max(1, i.quantity + delta);
                return { ...i, quantity: newQty, subtotal: newQty * i.price };
            }
            return i;
        }));
    };

    const handleUpdateNote = (itemId: string, productName: string, currentNotes?: string) => {
        const newNote = prompt(`Observación para ${productName}:`, currentNotes || '');
        if (newNote !== null) {
            setItems(prev => prev.map(i =>
                (i.itemId || i.productId) === itemId ? { ...i, notes: newNote } : i
            ));
        }
    };

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    const handleSaveOrder = async () => {
        if (!user || items.length === 0 || isSaving) return;

        setIsSaving(true);
        try {
            let currentOrderId = initialOrder?.id || '';

            if (initialOrder) {
                // Update Order
                await updateOrder(initialOrder.id, {
                    items,
                    total,
                    updatedAt: getPeruNow(),
                    ...(customerName.trim() ? { customerName: customerName.trim() } : { customerName: '' }) // Clear if empty
                });
            } else {
                // Create Order
                const orderId = generateUUID();
                currentOrderId = orderId;
                await createOrder({
                    id: orderId,
                    restaurantId: user.restaurantId,
                    tableNumber: orderType === 'takeout' ? 0 : (table?.number || 0),
                    items,
                    status: 'pending',
                    total,
                    createdAt: getPeruNow(),
                    updatedAt: getPeruNow(),
                    userId: user.id,
                    userName: user.name,
                    orderType,
                    ...(customerName.trim() ? { customerName: customerName.trim() } : {})
                });
            }

            if (printerService.autoPrint) {
                try {
                    // Fetch the updated order with dailyNumber
                    const updatedOrderSnap = await getDoc(doc(db, 'orders', currentOrderId));
                    const orderToPrint = updatedOrderSnap.exists()
                        ? { ...updatedOrderSnap.data(), id: currentOrderId, createdAt: ensurePeruDate(updatedOrderSnap.data().createdAt) } as Order
                        : {
                            id: currentOrderId,
                            restaurantId: user.restaurantId,
                            tableNumber: orderType === 'takeout' ? 0 : (table?.number || 0),
                            items,
                            status: 'pending',
                            total,
                            createdAt: initialOrder ? initialOrder.createdAt : new Date(),
                            updatedAt: new Date(),
                            userId: user.id,
                            userName: user.name,
                            orderType,
                            customerName: customerName.trim() || undefined
                        } as Order;

                    await printerService.printOrder(orderToPrint);
                    setLastSavedOrder(orderToPrint);
                } catch (printErr) {
                    console.error('Auto-print failed:', printErr);
                }
            } else {
                // If not auto-printing, still fetch to have the full object for manual Print button
                const updatedOrderSnap = await getDoc(doc(db, 'orders', currentOrderId));
                if (updatedOrderSnap.exists()) {
                    setLastSavedOrder({ ...updatedOrderSnap.data(), id: currentOrderId, createdAt: ensurePeruDate(updatedOrderSnap.data().createdAt) } as Order);
                }
            }

            setIsSaved(true);

            // For Quick Sale: snapshot the items so we can detect later changes
            if (isQuickSale) {
                savedItemsSnapshot.current = JSON.stringify(items);
                setItemsChangedAfterSave(false);
            }

            // Immediately lock the confirmed items in the UI to prevent exploit
            setConfirmedProductIds(prev => {
                const next = new Set(prev);
                items.forEach(i => next.add(i.productId));
                return next;
            });

            onOrderCreated();
            setIsSaving(false); // Fix: Reset saving state on success
            // onClose(); // Modal no longer closes here
        } catch (err: any) {
            console.error('Failed to save order:', err);
            alert(`Error al guardar el pedido: ${err.message || 'Desconocido'}`);
            setIsSaving(false);
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
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: isMobile ? '0' : '2rem',
            backdropFilter: 'blur(12px)'
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
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, color: 'var(--primary-color)', }}>
                                    {orderType === 'takeout'
                                        ? 'Nuevo Pedido'
                                        : (table?.number ? `Mesa ${table.number}` : 'Nuevo Pedido')}
                                </h2>
                                {isMobile && <button onClick={onClose} style={{ background: 'var(--divider-color)', border: 'none', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>}
                            </div>

                            <div style={{ position: 'relative', width: isMobile ? '100%' : '350px' }}>
                                <Search
                                    size={20}
                                    style={{
                                        position: 'absolute',
                                        left: 14,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--text-secondary)',
                                        zIndex: 20,
                                        pointerEvents: 'none'
                                    }}
                                />

                                <input
                                    placeholder="Buscar en el menú..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '48px',
                                        paddingLeft: '48px',
                                        borderRadius: '999px',
                                        border: '1px solid #c9c5c5ff'
                                    }}
                                />
                            </div>
                        </div>

                        {/* ═══ VISTA RÁPIDA MODE ═══ */}
                        {orderViewMode === 'quick' ? (
                            <>
                                {/* Back button when viewing products */}
                                {quickViewState === 'products' && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1rem',
                                        paddingBottom: '0.75rem',
                                        borderBottom: '1px solid var(--border-color)',
                                    }}>
                                        <button
                                            onClick={handleBackToCategories}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'var(--divider-color)',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                padding: '0.5rem 1rem',
                                                borderRadius: 'var(--radius-md)',
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-color)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--divider-color)'; }}
                                        >
                                            <ArrowLeft size={18} /> Categorías
                                        </button>
                                        {!searchTerm.trim() && (
                                            <span style={{
                                                fontWeight: '700',
                                                fontSize: '1.05rem',
                                                color: 'var(--text-primary)',
                                            }}>
                                                {selectedCategory === 'popular' ? '🔥 Populares' : selectedCategory}
                                            </span>
                                        )}
                                        {searchTerm.trim() && (
                                            <span style={{
                                                fontWeight: '600',
                                                fontSize: '0.9rem',
                                                color: 'var(--text-secondary)',
                                            }}>
                                                Resultados para "{searchTerm}"
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Category Grid (only when in categories state and no search) */}
                                {quickViewState === 'categories' && !searchTerm.trim() ? (
                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(140px, 1fr))',
                                        gap: '0.75rem',
                                        alignContent: 'start',
                                        padding: '4px',
                                    }}>
                                        {/* Popular category card */}
                                        <button
                                            onClick={() => handleCategorySelect('popular')}
                                            style={{
                                                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                                                border: 'none',
                                                borderRadius: 'var(--radius-lg)',
                                                padding: '1.25rem 1rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                color: '#fff',
                                                minHeight: '110px',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(217, 119, 6, 0.4)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(217, 119, 6, 0.3)'; }}
                                        >
                                            <span style={{ fontSize: '1.5rem' }}>🔥</span>
                                            <span style={{ fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>POPULARES</span>
                                        </button>

                                        {/* Dynamic category cards */}
                                        {categories.map((cat, idx) => {
                                            const color = cat.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                                            const count = categoryProductCounts[cat.name] || 0;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => handleCategorySelect(cat.name)}
                                                    style={{
                                                        background: color,
                                                        border: 'none',
                                                        borderRadius: 'var(--radius-lg)',
                                                        padding: '1.25rem 0.75rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '0.4rem',
                                                        color: '#fff',
                                                        minHeight: '110px',
                                                        transition: 'all 0.2s',
                                                        boxShadow: `0 2px 8px ${color}40`,
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 6px 16px ${color}50`; }}
                                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 2px 8px ${color}40`; }}
                                                >
                                                    <span style={{ fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word' }}>
                                                        {cat.name}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: '600' }}>
                                                        {count} {count === 1 ? 'producto' : 'productos'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* Product Grid (Vista Rápida — when category selected or searching) */
                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                                        gap: '1rem',
                                        alignContent: 'start',
                                        padding: '4px'
                                    }}>
                                        {filteredProducts?.length === 0 && (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                                                <Search size={40} strokeWidth={1} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                                                <p style={{ fontWeight: '600', margin: 0 }}>No se encontraron productos</p>
                                            </div>
                                        )}
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
                                )}
                            </>
                        ) : (
                            /* ═══ VISTA CLÁSICA MODE (original) ═══ */
                            <>
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
                                            {cat === 'popular' ? '🔥 Populares' : cat}
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
                            </>
                        )}
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
                                    <div key={item.itemId || item.productId} style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.6rem',
                                        backgroundColor: 'var(--surface-color)',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        {/* Top Row: Name && Actions */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2, wordBreak: 'break-word' }}>
                                                    {item.productName}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                    S/ {item.price.toFixed(2)} c/u
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                                <button
                                                    onClick={() => handleUpdateNote(item.itemId || item.productId, item.productName, item.notes)}
                                                    style={{
                                                        background: 'var(--surface-color)',
                                                        border: '1px solid var(--border-color)',
                                                        color: item.notes ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                        cursor: 'pointer',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    title="Agregar observación"
                                                >
                                                    <MessageSquare size={14} />
                                                </button>
                                                <button
                                                    onClick={() => removeFromOrder(item.itemId || item.productId, item.productId)}
                                                    disabled={!canRemoveItem(item.productId)}
                                                    style={{
                                                        width: '32px', height: '32px', borderRadius: '6px', border: 'none',
                                                        background: 'rgba(192, 110, 82, 0.1)', color: 'var(--danger-color)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        opacity: canRemoveItem(item.productId) ? 1 : 0.3,
                                                        cursor: canRemoveItem(item.productId) ? 'pointer' : 'not-allowed',
                                                        visibility: (!canRemoveItem(item.productId) && isWaiter) ? 'hidden' : 'visible'
                                                    }}
                                                    title="Eliminar producto"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Middle Row: Options Toggle, Options List, Notes */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {item.selectedOptions && item.selectedOptions.length > 0 && (
                                                <div>
                                                    <button
                                                        onClick={() => {
                                                            const id = item.itemId || item.productId;
                                                            setExpandedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                                                        }}
                                                        style={{
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: 'var(--primary-color)',
                                                            cursor: 'pointer',
                                                            padding: '2px 0',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            textDecoration: 'underline'
                                                        }}
                                                    >
                                                        {expandedItems.includes(item.itemId || item.productId) ? 'Ocultar opciones ↑' : 'Ver opciones ↓'}
                                                    </button>

                                                    {expandedItems.includes(item.itemId || item.productId) && (
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            flexDirection: 'column', 
                                                            gap: '2px', 
                                                            marginTop: '6px', 
                                                            marginBottom: '2px',
                                                            paddingLeft: '10px',
                                                            borderLeft: '2px solid rgba(37, 99, 235, 0.2)',
                                                            animation: 'fade-in-down 0.2s ease-out'
                                                        }}>
                                                            {item.selectedOptions.map((opt, idx) => (
                                                                <div key={idx} style={{ 
                                                                    fontSize: '0.75rem', 
                                                                    color: 'var(--text-secondary)',
                                                                    display: 'flex',
                                                                    alignItems: 'flex-start',
                                                                    gap: '4px',
                                                                    flexWrap: 'wrap'
                                                                }}>
                                                                    <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{opt.modifierName}:</span>
                                                                    <span style={{ wordBreak: 'break-word', lineHeight: 1.2 }}>{opt.optionName}</span>
                                                                    {opt.price ? (
                                                                        <span style={{ color: 'var(--success-color)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                                                            (+S/ {opt.price.toFixed(2)})
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {item.notes && (
                                                <div style={{
                                                    fontSize: '0.85rem',
                                                    color: 'var(--primary-color)',
                                                    fontStyle: 'italic',
                                                    marginTop: '4px',
                                                    fontWeight: '600',
                                                    background: 'rgba(234, 179, 8, 0.1)',
                                                    padding: '6px 8px',
                                                    borderRadius: '4px',
                                                    borderLeft: '2px solid var(--primary-color)'
                                                }}>
                                                    "{item.notes}"
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Row: Quantity Controls */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'var(--background-color)',
                                                padding: '2px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)'
                                            }}>
                                                <button
                                                    onClick={() => updateQuantity(item.itemId || item.productId, item.productId, -1)}
                                                    disabled={!canDecreaseQuantity(item.productId, item.quantity)}
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: 'transparent',
                                                        color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.2rem',
                                                        opacity: canDecreaseQuantity(item.productId, item.quantity) ? 1 : 0.3,
                                                        cursor: canDecreaseQuantity(item.productId, item.quantity) ? 'pointer' : 'not-allowed',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >-</button>
                                                <span style={{ fontWeight: '800', minWidth: '1.2rem', textAlign: 'center', color: 'var(--primary-color)', fontSize: '0.9rem' }}>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.itemId || item.productId, item.productId, 1)}
                                                    style={{ 
                                                        width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: 'transparent', 
                                                        color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >+</button>
                                            </div>
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

                                {/* Quick Sale: "Pagar" button when confirmed & no changes */}
                                {isQuickSale && isSaved && !itemsChangedAfterSave ? (
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowQuickPayment(true)}
                                        style={{
                                            background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
                                            height: '54px',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '1.1rem',
                                            fontWeight: '700',
                                            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            animation: 'btn-glow 1.5s ease-in-out infinite alternate',
                                        }}
                                    >
                                        <Banknote size={22} /> Pagar
                                    </Button>
                                ) : (
                                    /* Normal flow OR Quick Sale with pending changes */
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            handleSaveOrder();
                                        }}
                                        disabled={items.length === 0 || isSaving || (isSaved && !itemsChangedAfterSave)}
                                        style={{
                                            background: (isSaved && !itemsChangedAfterSave) ? 'var(--success-color)' : 'var(--primary-color)',
                                            height: '54px',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '1.1rem',
                                            fontWeight: '700',
                                            boxShadow: (isSaved && !itemsChangedAfterSave) ? 'none' : '0 4px 12px rgba(142, 115, 91, 0.2)',
                                            opacity: isSaving ? 0.7 : 1
                                        }}
                                    >
                                        {isSaving
                                            ? 'Guardando...'
                                            : (isSaved && !itemsChangedAfterSave)
                                                ? '¡Pedido Guardado!'
                                                : (isSaved && itemsChangedAfterSave)
                                                    ? 'Confirmar Cambios'
                                                    : (initialOrder ? 'Confirmar Cambios' : 'Confirmar Pedido')}
                                    </Button>
                                )}

                                <Button
                                    variant="outline"
                                    disabled={!isSaved && !initialOrder}
                                    onClick={async () => {
                                        if (!printerService.isConnected) {
                                            alert('La impresora no está conectada. Confígúrala en el panel de Administración.');
                                            return;
                                        }
                                        try {
                                            const orderToPrint = lastSavedOrder || {
                                                id: initialOrder?.id || 'new',
                                                restaurantId: user?.restaurantId || '',
                                                tableNumber: orderType === 'takeout' || orderType === 'quick-sale' ? 0 : (table?.number || 0),
                                                items,
                                                total,
                                                createdAt: initialOrder?.createdAt || new Date(),
                                                updatedAt: new Date(),
                                                userId: user?.id || '',
                                                userName: user?.name || '',
                                                orderType,
                                                customerName: customerName.trim() || undefined
                                            } as Order;

                                            await printerService.printOrder(orderToPrint);
                                            // Close automatically after printing
                                            onClose();
                                        } catch (err: any) {
                                            alert(err.message || 'Error al imprimir');
                                        }
                                    }}
                                    style={{
                                        height: '54px',
                                        gridColumn: isMobile ? '1' : 'span 2',
                                        borderColor: (isSaved || initialOrder) ? 'var(--primary-color)' : 'var(--border-color)',
                                        color: (isSaved || initialOrder) ? 'var(--primary-color)' : 'var(--text-secondary)',
                                        opacity: (isSaved || initialOrder) ? 1 : 0.5,
                                        cursor: (isSaved || initialOrder) ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <Printer size={20} style={{ marginRight: '0.5rem' }} /> Imprimir Comanda
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

                            {/* Pagar glow animation */}
                            <style>{`
                                @keyframes btn-glow {
                                    from { box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3); }
                                    to { box-shadow: 0 4px 20px rgba(46, 125, 50, 0.5), 0 0 0 4px rgba(46, 125, 50, 0.1); }
                                }
                            `}</style>
                        </div>
                    </div>
                </div>

                {/* MODIFIER PICKER OVERLAY */}
                {modifierProduct && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <Card style={{ 
                            width: '100%', 
                            maxWidth: '500px', 
                            maxHeight: '90vh', // Prevent it from being taller than the screen
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '1.5rem', // Reduced padding for mobile
                            boxShadow: 'var(--shadow-xl)',
                            overflow: 'hidden'
                        }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--primary-color)' }}>
                                Opciones para {modifierProduct.name}
                            </h2>

                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '1.5rem', 
                                marginBottom: '1.5rem',
                                overflowY: 'auto', // Allow scrolling within the options area
                                paddingRight: '0.5rem', // Small padding for scrollbar
                                flexGrow: 1
                            }}>
                                {modifierProduct.modifiers?.map(mod => {
                                    const selected = selectedModifiers[mod.id] || [];
                                    const maxSel = mod.maxSelections || 1;
                                    const minSel = mod.minSelections || (mod.required ? 1 : 0);
                                    const atMax = selected.length >= maxSel;

                                    return (
                                        <div key={mod.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <label style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                    {mod.name} {mod.required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                                                </label>
                                                <span style={{
                                                    fontSize: '0.72rem', fontWeight: 700,
                                                    padding: '0.15rem 0.5rem', borderRadius: '10px',
                                                    background: selected.length >= minSel ? 'rgba(67,160,71,0.1)' : 'rgba(244,67,54,0.1)',
                                                    color: selected.length >= minSel ? 'var(--success-color)' : 'var(--danger-color)',
                                                }}>
                                                    {selected.length}/{maxSel}
                                                    {minSel > 0 && ` (mín ${minSel})`}
                                                </span>
                                            </div>
                                            <div style={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: maxSel > 1 ? '1fr' : 'repeat(auto-fill, minmax(120px, 1fr))', // Slightly smaller minmax for mobile
                                                gap: '0.5rem' // Reduced gap 
                                            }}>
                                                {mod.options.map(opt => {
                                                    const qty = selected.filter(n => n === opt.name).length;
                                                    const isSelected = qty > 0;
                                                    const canAddMore = !atMax;
                                                    
                                                    // Skip rendering empty options that might have been saved accidentally
                                                    if (!opt.name.trim()) return null;

                                                    if (maxSel === 1) {
                                                        return (
                                                            <button
                                                                key={opt.name}
                                                                onClick={() => setSelectedModifiers(prev => ({ ...prev, [mod.id]: [opt.name] }))}
                                                                style={{
                                                                    padding: '0.6rem 0.75rem', // Tighter padding
                                                                    borderRadius: 'var(--radius-md)',
                                                                    border: '2px solid',
                                                                    borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-color)',
                                                                    backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--surface-color)',
                                                                    color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)',
                                                                    fontWeight: '600',
                                                                    fontSize: '0.85rem',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    width: '100%'
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '0.85rem', textAlign: 'left', flex: 1, wordBreak: 'break-word' }}>{opt.name}</span>
                                                                <span style={{ fontSize: '0.8rem', color: isSelected ? 'var(--primary-color)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                                    {opt.price ? `+S/ ${opt.price.toFixed(2)}` : ''}
                                                                </span>
                                                            </button>
                                                        );
                                                    }

                                                    // UI for multiple selections (quantity controls)
                                                    return (
                                                        <div key={opt.name} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '0.5rem 0.75rem', // Tighter padding
                                                            borderRadius: 'var(--radius-md)',
                                                            border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                                            backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.02)' : 'var(--surface-color)',
                                                            transition: 'all 0.2s',
                                                            gap: '0.5rem',
                                                            width: '100%'
                                                        }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: isSelected ? 'var(--primary-color)' : 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.2 }}>
                                                                    {opt.name}
                                                                </div>
                                                                {opt.price ? (
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                                                                        +S/ {opt.price.toFixed(2)}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                            
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--background-color)', padding: '0.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                                                <button
                                                                    disabled={qty === 0}
                                                                    onClick={() => {
                                                                        setSelectedModifiers(prev => {
                                                                            const current = prev[mod.id] || [];
                                                                            const idx = current.lastIndexOf(opt.name);
                                                                            if (idx === -1) return prev;
                                                                            const newCurrent = [...current];
                                                                            newCurrent.splice(idx, 1);
                                                                            return { ...prev, [mod.id]: newCurrent };
                                                                        });
                                                                    }}
                                                                    style={{
                                                                        width: '24px', height: '24px', borderRadius: '6px', // Smaller buttons
                                                                        border: 'none', background: qty > 0 ? 'var(--surface-color)' : 'transparent',
                                                                        color: qty > 0 ? 'var(--danger-color)' : 'var(--text-secondary)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        cursor: qty > 0 ? 'pointer' : 'not-allowed',
                                                                        opacity: qty > 0 ? 1 : 0.5,
                                                                        boxShadow: qty > 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                                        fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1
                                                                    }}
                                                                >
                                                                    -
                                                                </button>
                                                                <span style={{ minWidth: '16px', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem', color: qty > 0 ? 'var(--primary-color)' : 'var(--text-secondary)' }}>
                                                                    {qty}
                                                                </span>
                                                                <button
                                                                    disabled={!canAddMore}
                                                                    onClick={() => {
                                                                        setSelectedModifiers(prev => {
                                                                            const current = prev[mod.id] || [];
                                                                            return { ...prev, [mod.id]: [...current, opt.name] };
                                                                        });
                                                                    }}
                                                                    style={{
                                                                        width: '24px', height: '24px', borderRadius: '6px', // Smaller buttons
                                                                        border: 'none', background: canAddMore ? 'var(--primary-color)' : 'var(--divider-color)',
                                                                        color: canAddMore ? 'white' : 'var(--text-secondary)',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        cursor: canAddMore ? 'pointer' : 'not-allowed',
                                                                        fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1,
                                                                        boxShadow: canAddMore ? '0 1px 3px rgba(37,99,235,0.3)' : 'none'
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--divider-color)' }}>
                                <Button variant="ghost" fullWidth onClick={() => setModifierProduct(null)}>Cancelar</Button>
                                <Button
                                    fullWidth
                                    onClick={handleConfirmModifiers}
                                    disabled={modifierProduct.modifiers?.some(m => {
                                        const sel = selectedModifiers[m.id] || [];
                                        const minSel = m.minSelections || (m.required ? 1 : 0);
                                        return sel.length < minSel;
                                    })}
                                >
                                    Agregar al Pedido
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Quick Sale Payment Modal */}
                {showQuickPayment && lastSavedOrder && (
                    <PaymentModal
                        order={lastSavedOrder}
                        onClose={() => setShowQuickPayment(false)}
                        onConfirmPayment={handleQuickPayment}
                    />
                )}
            </div>
        </div>
    );
}
