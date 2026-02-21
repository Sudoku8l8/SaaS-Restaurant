import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '@/app/providers/TenantProvider';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { Utensils, MapPin, Phone, Plus, Minus, ShoppingBag } from 'lucide-react';
import type { OrderItem, Product } from '@/types';
import styles from './DigitalMenuPage.module.css';

// ─── Skeleton loader for products ───────────────────────────────────────────
function ProductSkeleton() {
    return (
        <div className={styles.skeletonCard}>
            <div className={styles.skeletonCircle} />
            <div className={styles.skeletonLines}>
                <div className={`${styles.skeletonLine} ${styles.medium}`} />
                <div className={`${styles.skeletonLine} ${styles.long}`} />
                <div className={`${styles.skeletonLine} ${styles.short}`} />
            </div>
        </div>
    );
}

// ─── Legacy view (external URL buttons) ─────────────────────────────────────
function LegacyMenuView({ config, name }: { config: NonNullable<ReturnType<typeof useTenant>['tenant']>['config']; name: string }) {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--background-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
        }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '2rem' }}>{name}</h1>
            <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Nuestra Carta Digital</h2>
                {config?.menuSpanishUrl ? (
                    <button
                        onClick={() => window.open(config.menuSpanishUrl, '_blank')}
                        style={{ padding: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', border: 'none', background: 'var(--primary-color)', color: '#fff', cursor: 'pointer' }}
                    >
                        🇪🇸 Ver Carta en Español
                    </button>
                ) : (
                    <div style={{ padding: '1rem', background: 'rgba(230,57,70,0.05)', borderRadius: '12px', color: 'var(--danger-color)', fontSize: '0.9rem', fontWeight: '600' }}>
                        Carta en español no configurada
                    </div>
                )}
                {config?.menuEnglishUrl && (
                    <button
                        onClick={() => window.open(config.menuEnglishUrl, '_blank')}
                        style={{ padding: '1.25rem', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', border: '2px solid var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', cursor: 'pointer' }}
                    >
                        🇺🇸 View Menu in English
                    </button>
                )}
                {!config?.menuSpanishUrl && !config?.menuEnglishUrl && (
                    <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No hay cartas configuradas actualmente. Por favor consulte con el mozo.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function DigitalMenuPage() {
    const { tableNumber, restaurantSlug } = useParams<{ tableNumber: string; restaurantSlug: string }>();
    const navigate = useNavigate();
    const { tenant, isLoading: tenantLoading, error } = useTenant();
    const { products, categories, isLoading: menuLoading } = usePublicMenu(tenant?.id);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const navRef = useRef<HTMLDivElement>(null);

    const accentColor = tenant?.config?.menuAccentColor || '#c8a96e';
    const bgColor = tenant?.config?.menuBgColor || '#ffffff';
    const textColor = tenant?.config?.menuTextColor || '#1a1a1a';
    const fontFamily = tenant?.config?.menuFontFamily || 'inter';
    const englishSubtitles = tenant?.config?.menuEnglishSubtitles ?? false;

    const FONT_MAP: Record<string, string> = {
        inter: "'Inter', sans-serif",
        playfair: "'Playfair Display', serif",
        cormorant: "'Cormorant Garamond', serif",
        'dm-serif': "'DM Serif Display', serif",
        josefin: "'Josefin Sans', sans-serif",
        lato: "'Lato', sans-serif",
        merriweather: "'Merriweather', serif",
        poppins: "'Poppins', sans-serif",
    };

    // Apply theme CSS variables scoped to this page only
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--menu-accent', accentColor);
        root.style.setProperty('--menu-bg', bgColor);
        root.style.setProperty('--menu-text', textColor);
        root.style.setProperty('--menu-font', FONT_MAP[fontFamily] ?? FONT_MAP.inter);
        return () => {
            root.style.removeProperty('--menu-accent');
            root.style.removeProperty('--menu-bg');
            root.style.removeProperty('--menu-text');
            root.style.removeProperty('--menu-font');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accentColor, bgColor, textColor, fontFamily]);

    // IntersectionObserver to highlight active category
    useEffect(() => {
        if (categories.length === 0) return;

        const observers: IntersectionObserver[] = [];

        categories.forEach(cat => {
            const el = sectionRefs.current[cat.id];
            if (!el) return;

            const obs = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setActiveCategory(cat.id);
                    }
                },
                { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
            );
            obs.observe(el);
            observers.push(obs);
        });

        return () => observers.forEach(o => o.disconnect());
    }, [categories]);

    // Scroll active nav button into view
    useEffect(() => {
        if (!activeCategory || !navRef.current) return;
        const btn = navRef.current.querySelector(`[data-cat="${activeCategory}"]`) as HTMLElement;
        if (btn) {
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [activeCategory]);

    const scrollToCategory = (catId: string) => {
        const el = sectionRefs.current[catId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // ── Cart Handlers ──
    const handleAddToCart = (product: Product) => {
        setCart((prev: OrderItem[]) => {
            const existing = prev.find((item: OrderItem) => item.productId === product.id);
            if (existing) {
                return prev.map((item: OrderItem) =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                price: product.price,
                subtotal: product.price,
            }];
        });
    };

    const handleUpdateQuantity = (productId: string, delta: number) => {
        setCart((prev: OrderItem[]) => prev.map((item: OrderItem) => {
            if (item.productId === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty, subtotal: newQty * item.price };
            }
            return item;
        }).filter((item: OrderItem) => item.quantity > 0));
    };

    const cartTotal = cart.reduce((sum: number, item: OrderItem) => sum + item.subtotal, 0);
    const cartCount = cart.reduce((sum: number, item: OrderItem) => sum + item.quantity, 0);

    const handleOpenCheckout = () => {
        // Save cart to local storage to persist across navigation
        if (tenant?.id) {
            localStorage.setItem(`cart_${tenant.id}`, JSON.stringify(cart));
        }
        navigate(`/${restaurantSlug}/menu/checkout${tableNumber ? `?table=${tableNumber}` : ''}`);
    };

    // ── Loading state ──
    if (tenantLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8' }}>
                <p style={{ color: accentColor, fontWeight: 'bold', fontFamily: 'Inter, sans-serif' }}>Cargando Menú...</p>
            </div>
        );
    }

    // ── Error state ──
    if (error || !tenant) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafaf8', padding: '2rem', textAlign: 'center' }}>
                <div>
                    <h2 style={{ color: '#c0392b', fontFamily: 'Playfair Display, serif' }}>Restaurante no encontrado</h2>
                    <p style={{ color: '#888', marginTop: '1rem', fontFamily: 'Inter, sans-serif' }}>El enlace que has escaneado parece no ser válido.</p>
                </div>
            </div>
        );
    }

    const { name, logo, config } = tenant;

    // ── Fallback to legacy view if native menu is not enabled ──
    if (!config?.menuNativeEnabled) {
        return <LegacyMenuView config={config} name={name} />;
    }

    // ── Group products by category ──
    const categoriesWithProducts = categories
        .map(cat => ({
            ...cat,
            products: products.filter(p => p.category === cat.name),
        }))
        .filter(cat => cat.products.length > 0);

    const currency = config?.currency || 'S/';

    return (
        <div className={styles.page}>
            {/* ─── HEADER ─── */}
            <header className={styles.header}>
                <div className={styles.logoWrapper}>
                    {logo ? (
                        <img src={logo} alt={name} className={styles.logoImg} />
                    ) : (
                        <div className={styles.logoPlaceholder}>
                            <Utensils size={36} />
                        </div>
                    )}
                </div>
                <h1 className={styles.restaurantName}>{name}</h1>
                {config?.menuDescription && (
                    <p className={styles.restaurantDescription}>{config.menuDescription}</p>
                )}
                {tableNumber && (
                    <div className={styles.tableBadge}>
                        Mesa {tableNumber}
                    </div>
                )}
            </header>

            {/* ─── STICKY CATEGORY NAV ─── */}
            {!menuLoading && categoriesWithProducts.length > 1 && (
                <nav className={styles.categoryNav} ref={navRef}>
                    <div className={styles.categoryNavInner}>
                        {categoriesWithProducts.map(cat => (
                            <button
                                key={cat.id}
                                data-cat={cat.id}
                                className={`${styles.categoryNavBtn} ${activeCategory === cat.id ? styles.active : ''}`}
                                onClick={() => scrollToCategory(cat.id)}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </nav>
            )}

            {/* ─── MAIN CONTENT ─── */}
            <main className={styles.content}>
                {menuLoading ? (
                    // Skeleton
                    <>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ marginBottom: '2.5rem' }}>
                                <div style={{ width: '30%', height: 14, background: '#ebebeb', borderRadius: 6, marginBottom: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                <div style={{ width: '55%', height: 28, background: '#ebebeb', borderRadius: 6, marginBottom: '1.5rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
                                {[1, 2, 3].map(j => <ProductSkeleton key={j} />)}
                            </div>
                        ))}
                    </>
                ) : categoriesWithProducts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Utensils size={48} style={{ color: '#ddd', marginBottom: '1rem' }} />
                        <h2>Carta no disponible</h2>
                        <p>Estamos preparando nuestra carta digital. Por favor consulte con el mozo.</p>
                    </div>
                ) : (
                    categoriesWithProducts.map(cat => (
                        <section
                            key={cat.id}
                            id={`cat-${cat.id}`}
                            className={styles.categorySection}
                            ref={el => { sectionRefs.current[cat.id] = el; }}
                        >
                            <div className={styles.categoryHeader}>
                                <h2 className={styles.categoryTitle}>{cat.name}</h2>
                                <div className={styles.premiumDivider}>
                                    <span className={styles.premiumDiamond}></span>
                                </div>
                            </div>

                            <div className={styles.productList}>
                                {cat.products.map(product => (
                                    <div
                                        key={product.id}
                                        className={`${styles.productCard} ${!product.available ? styles.unavailable : ''}`}
                                    >
                                        <div className={styles.productInfo}>
                                            <div className={styles.productNameRow}>
                                                <h3 className={styles.productName}>{product.name}</h3>
                                                {product.isPopular && (
                                                    <span className={styles.popularBadge}>⭐ Popular</span>
                                                )}
                                                {!product.available && (
                                                    <span className={styles.unavailableBadge}>Agotado</span>
                                                )}
                                                <span className={styles.productPrice}>
                                                    {currency} {product.price.toFixed(2)}
                                                </span>
                                            </div>
                                            {englishSubtitles && product.nameEn && (
                                                <p className={styles.subtitleEn}>{product.nameEn}</p>
                                            )}
                                            {product.description && (
                                                <p className={styles.productDescription}>{product.description}</p>
                                            )}
                                            {englishSubtitles && product.descriptionEn && (
                                                <p className={styles.subtitleEn}>{product.descriptionEn}</p>
                                            )}

                                            {/* Add to Cart / Quantity Controls */}
                                            {config.enableDigitalOrders && product.available && (
                                                <div className={styles.productAction}>
                                                    {(() => {
                                                        const cartItem = cart.find(item => item.productId === product.id);
                                                        if (cartItem) {
                                                            return (
                                                                <div className={styles.quantityControls}>
                                                                    <button className={styles.qtyBtn} onClick={() => handleUpdateQuantity(product.id, -1)} aria-label="Decrease quantity"><Minus size={14} /></button>
                                                                    <span className={styles.qtyValue}>{cartItem.quantity}</span>
                                                                    <button className={styles.qtyBtn} onClick={() => handleUpdateQuantity(product.id, 1)} aria-label="Increase quantity"><Plus size={14} /></button>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <button
                                                                className={styles.addToCartBtn}
                                                                onClick={() => handleAddToCart(product)}
                                                                title="Agregar al Carrito"
                                                            >
                                                                <div className={styles.cartIconMiniWrapper}>
                                                                    <ShoppingBag size={18} strokeWidth={2} />
                                                                    <div className={styles.cartIconMiniPlus}>
                                                                        <Plus size={10} strokeWidth={4} />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </main>

            {/* ─── FOOTER ─── */}
            <footer className={styles.footer}>
                <p className={styles.footerName}>{name}</p>
                {(config?.menuAddress || config?.menuPhone) && (
                    <div className={styles.footerContact}>
                        {config.menuAddress && (
                            <span className={styles.footerContactItem}>
                                <MapPin size={13} /> {config.menuAddress}
                            </span>
                        )}
                        {config.menuPhone && (
                            <span className={styles.footerContactItem}>
                                <Phone size={13} /> {config.menuPhone}
                            </span>
                        )}
                    </div>
                )}
                <div className={styles.footerIcons}>
                    {config?.menuPhone && (
                        <a href={`tel:${config.menuPhone}`} className={styles.footerIconBtn} aria-label="Llamar">
                            <Phone size={15} />
                        </a>
                    )}
                    {config?.menuAddress && (
                        <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(config.menuAddress)}`}
                            target="_blank" rel="noreferrer"
                            className={styles.footerIconBtn}
                            aria-label="Ver en mapa"
                        >
                            <MapPin size={15} />
                        </a>
                    )}
                </div>
                <p className={styles.footerCopyright}>
                    &copy; {new Date().getFullYear()} {name} &mdash; Carta Digital
                </p>
            </footer>

            {/* ─── FLOATING CART BAR ─── */}
            {cartCount > 0 && config?.enableDigitalOrders && (
                <div className={styles.floatingCart} onClick={handleOpenCheckout}>
                    <div className={styles.cartInfo}>
                        <div className={styles.cartIconWrapper}>
                            <ShoppingBag size={20} className={styles.floatingCartIcon} />
                            <span className={styles.cartBadge} style={{ color: bgColor, background: accentColor }}>{cartCount}</span>
                        </div>
                        <span className={styles.cartTotal} style={{ fontFamily: FONT_MAP[fontFamily] || FONT_MAP.inter }}>
                            {currency} {cartTotal.toFixed(2)}
                        </span>
                    </div>
                    <span className={styles.cartViewText}>Ver Pedido</span>
                </div>
            )}
        </div>
    );
}
