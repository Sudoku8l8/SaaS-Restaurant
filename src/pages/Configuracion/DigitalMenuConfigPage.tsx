import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useTenant } from '@/app/providers/TenantProvider';
import { Button, Input } from '@/components/shared';
import {
    Smartphone, Palette, Info, Globe, Save,
    ExternalLink, QrCode, Copy, Check,
    ToggleLeft, ToggleRight, ImagePlus, X, Languages, Type,
} from 'lucide-react';
import { MENU_THEMES, getMenuTheme } from '@/config/menuThemes';
import styles from './DigitalMenuConfigPage.module.css';

// ── Font options ──────────────────────────────────────────────────────────────
const FONT_OPTIONS = [
    { id: 'inter', label: 'Inter', preview: 'Menú', style: "'Inter', sans-serif", hint: 'Moderna · limpia' },
    { id: 'playfair', label: 'Playfair Display', preview: 'Menú', style: "'Playfair Display', serif", hint: 'Elegante · clásica' },
    { id: 'cormorant', label: 'Cormorant Garamond', preview: 'Menú', style: "'Cormorant Garamond', serif", hint: 'Alta cocina · lujo' },
    { id: 'dm-serif', label: 'DM Serif Display', preview: 'Menú', style: "'DM Serif Display', serif", hint: 'Editorial · gourmet' },
    { id: 'josefin', label: 'Josefin Sans', preview: 'Menú', style: "'Josefin Sans', sans-serif", hint: 'Bistró · minimalista' },
    { id: 'lato', label: 'Lato', preview: 'Menú', style: "'Lato', sans-serif", hint: 'Amigable · casual' },
    { id: 'merriweather', label: 'Merriweather', preview: 'Menú', style: "'Merriweather', serif", hint: 'Tradicional · cálida' },
    { id: 'poppins', label: 'Poppins', preview: 'Menú', style: "'Poppins', sans-serif", hint: 'Redondeada · moderna' },
] as const;

type FontId = typeof FONT_OPTIONS[number]['id'];

// ── Sub-tab definition ────────────────────────────────────────────────────────
type SubTab = 'general' | 'appearance' | 'info' | 'external';

const NAV_ITEMS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Smartphone size={16} /> },
    { id: 'appearance', label: 'Apariencia', icon: <Palette size={16} /> },
    { id: 'info', label: 'Información', icon: <Info size={16} /> },
    { id: 'external', label: 'Enlace Externo', icon: <Globe size={16} /> },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function DigitalMenuConfigPage() {
    const { tenant } = useTenant();

    // General
    const [nativeEnabled, setNativeEnabled] = useState(tenant?.config?.menuNativeEnabled ?? false);

    // Appearance
    const [accentColor, setAccentColor] = useState(tenant?.config?.menuAccentColor || '#c8a96e');
    const [bgColor, setBgColor] = useState(tenant?.config?.menuBgColor || '#ffffff');
    const [textColor, setTextColor] = useState(tenant?.config?.menuTextColor || '#1a1a1a');
    const [fontFamily, setFontFamily] = useState<FontId>((tenant?.config?.menuFontFamily as FontId) || 'inter');
    const [themeId, setThemeId] = useState(tenant?.config?.menuThemeId || 'custom');
    const [englishSubtitles, setEnglishSubtitles] = useState(tenant?.config?.menuEnglishSubtitles ?? false);
    const [searchEnabled, setSearchEnabled] = useState(tenant?.config?.menuSearchEnabled ?? false);

    // Logo (external URL)
    const [logoUrl, setLogoUrl] = useState<string>(tenant?.logo || '');

    // Info
    const [description, setDescription] = useState(tenant?.config?.menuDescription || '');
    const [address, setAddress] = useState(tenant?.config?.menuAddress || '');
    const [phone, setPhone] = useState(tenant?.config?.menuPhone || '');

    // Digital Orders
    const [restaurantWhatsApp, setRestaurantWhatsApp] = useState(tenant?.config?.restaurantWhatsApp || '');
    const [enableDigitalOrders, setEnableDigitalOrders] = useState(tenant?.config?.enableDigitalOrders ?? false);
    const [deliveryEnabled, setDeliveryEnabled] = useState(tenant?.config?.deliveryEnabled ?? false);
    const [pickupEnabled, setPickupEnabled] = useState(tenant?.config?.pickupEnabled ?? false);
    const [deliveryCost, setDeliveryCost] = useState(tenant?.config?.deliveryCost?.toString() || '0');
    // Payment Methods
    const [pmYape, setPmYape] = useState(tenant?.config?.paymentMethodsConfig?.yape || '');
    const [pmPlin, setPmPlin] = useState(tenant?.config?.paymentMethodsConfig?.plin || '');
    const [pmBank, setPmBank] = useState(tenant?.config?.paymentMethodsConfig?.bankAccount || '');

    // External URLs
    const [menuEs, setMenuEs] = useState(tenant?.config?.menuSpanishUrl || '');
    const [menuEn, setMenuEn] = useState(tenant?.config?.menuEnglishUrl || '');

    const [activeTab, setActiveTab] = useState<SubTab>('general');
    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const menuLink = `${window.location.origin}/${tenant?.id}/menu`;

    // Sync when tenant loads
    useEffect(() => {
        if (!tenant?.config) return;
        const c = tenant.config;
        setNativeEnabled(c.menuNativeEnabled ?? false);
        setAccentColor(c.menuAccentColor || '#c8a96e');
        setBgColor(c.menuBgColor || '#ffffff');
        setTextColor(c.menuTextColor || '#1a1a1a');
        setFontFamily((c.menuFontFamily as FontId) || 'inter');
        setThemeId(c.menuThemeId || 'custom');
        setEnglishSubtitles(c.menuEnglishSubtitles ?? false);
        setSearchEnabled(c.menuSearchEnabled ?? false);
        setDescription(c.menuDescription || '');
        setAddress(c.menuAddress || '');
        setPhone(c.menuPhone || '');

        setRestaurantWhatsApp(c.restaurantWhatsApp || '');
        setEnableDigitalOrders(c.enableDigitalOrders ?? false);
        setDeliveryEnabled(c.deliveryEnabled ?? false);
        setPickupEnabled(c.pickupEnabled ?? false);
        setDeliveryCost(c.deliveryCost?.toString() || '0');
        setPmYape(c.paymentMethodsConfig?.yape || '');
        setPmPlin(c.paymentMethodsConfig?.plin || '');
        setPmBank(c.paymentMethodsConfig?.bankAccount || '');

        setMenuEs(c.menuSpanishUrl || '');
        setMenuEn(c.menuEnglishUrl || '');
        if (tenant.logo) {
            setLogoUrl(tenant.logo);
        }
    }, [tenant]);

    const handleSave = async () => {
        if (!tenant) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'restaurants', tenant.id), {
                'config.menuNativeEnabled': nativeEnabled,
                'config.menuAccentColor': accentColor,
                'config.menuBgColor': bgColor,
                'config.menuTextColor': textColor,
                'config.menuFontFamily': fontFamily,
                'config.menuThemeId': themeId,
                'config.menuEnglishSubtitles': englishSubtitles,
                'config.menuSearchEnabled': searchEnabled,
                'config.menuDescription': description.trim(),
                'config.menuAddress': address.trim(),
                'config.menuPhone': phone.trim(),
                'config.restaurantWhatsApp': restaurantWhatsApp.trim(),
                'config.enableDigitalOrders': enableDigitalOrders,
                'config.deliveryEnabled': deliveryEnabled,
                'config.pickupEnabled': pickupEnabled,
                'config.deliveryCost': parseFloat(deliveryCost) || 0,
                'config.paymentMethodsConfig': {
                    yape: pmYape.trim(),
                    plin: pmPlin.trim(),
                    bankAccount: pmBank.trim(),
                },
                'config.menuSpanishUrl': menuEs.trim(),
                'config.menuEnglishUrl': menuEn.trim(),
                'logo': logoUrl.trim(),
            });
            alert('Configuración guardada correctamente');
        } catch (err) {
            console.error(err);
            alert('Error al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(menuLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const selectedFont = FONT_OPTIONS.find(f => f.id === fontFamily) ?? FONT_OPTIONS[0];

    /** Apply a predefined theme — sets all 3 colors + font */
    const applyTheme = (id: string) => {
        const theme = getMenuTheme(id);
        if (!theme) return;
        setThemeId(id);
        setBgColor(theme.bgColor);
        setAccentColor(theme.accentColor);
        setTextColor(theme.textColor);
        setFontFamily(theme.fontFamily as FontId);
    };

    return (
        <div className={styles.module}>
            {/* ── Sidebar ── */}
            <nav className={styles.sidebar}>
                <p className={styles.sidebarTitle}>Carta Digital</p>
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.id}
                        className={`${styles.navItem} ${activeTab === item.id ? styles.navItemActive : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        {item.icon}
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* ── Content ── */}
            <div className={styles.content}>

                {/* ════ GENERAL ════ */}
                {activeTab === 'general' && (
                    <>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}><Smartphone size={18} /> General</h3>
                            <p className={styles.sectionDesc}>
                                Activa la carta digital integrada. Tus clientes verán los productos directamente desde el sistema.
                            </p>
                        </div>

                        {/* Toggle */}
                        <div className={styles.toggleCard}>
                            <div className={styles.toggleInfo}>
                                <strong>{nativeEnabled ? '✅ Carta Nativa Activada' : '⭕ Carta Nativa Desactivada'}</strong>
                                <span>
                                    {nativeEnabled
                                        ? 'Los clientes verán la carta digital integrada al escanear el QR.'
                                        : 'Los clientes verán los botones de enlace externo (PDF/imagen).'}
                                </span>
                            </div>
                            <button
                                className={styles.toggleBtn}
                                onClick={() => setNativeEnabled(v => !v)}
                                style={{ color: nativeEnabled ? 'var(--primary-color)' : '#aaa' }}
                                title={nativeEnabled ? 'Desactivar' : 'Activar'}
                            >
                                {nativeEnabled
                                    ? <ToggleRight size={48} strokeWidth={1.5} />
                                    : <ToggleLeft size={48} strokeWidth={1.5} />}
                            </button>
                        </div>

                        {/* Search Bar toggle */}
                        <div className={styles.toggleCard}>
                            <div className={styles.toggleInfo}>
                                <strong>{searchEnabled ? '🔍 Barra de Búsqueda Activada' : '🔍 Barra de Búsqueda Desactivada'}</strong>
                                <span>
                                    {searchEnabled
                                        ? 'Los clientes podrán buscar platos por nombre o descripción en la carta.'
                                        : 'La carta se mostrará sin buscador (modo vistazo rápido).'}
                                </span>
                            </div>
                            <button
                                className={styles.toggleBtn}
                                onClick={() => setSearchEnabled(v => !v)}
                                style={{ color: searchEnabled ? 'var(--primary-color)' : '#aaa' }}
                                title={searchEnabled ? 'Desactivar' : 'Activar'}
                            >
                                {searchEnabled
                                    ? <ToggleRight size={48} strokeWidth={1.5} />
                                    : <ToggleLeft size={48} strokeWidth={1.5} />}
                            </button>
                        </div>

                        {/* Link & QR */}
                        <div className={styles.linkCard}>
                            <div className={styles.linkCardTitle}>
                                <QrCode size={18} style={{ color: 'var(--primary-color)' }} />
                                Enlace de tu Carta Digital
                            </div>
                            <div className={styles.linkRow}>
                                <code className={styles.linkCode}>{menuLink}</code>
                                <div className={styles.linkActions}>
                                    <Button variant="outline" size="sm" onClick={handleCopy}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </Button>
                                    <Button variant="ghost" size="sm"
                                        onClick={() => window.open(menuLink, '_blank')}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <ExternalLink size={14} /> Ver Carta
                                    </Button>
                                </div>
                            </div>
                            <p className={styles.linkHint}>
                                💡 Puedes agregar el número de mesa al final: <strong>{menuLink}/5</strong>
                            </p>
                        </div>

                        {/* ── Digital Orders Settings ── */}
                        <div className={styles.sectionHeader} style={{ marginTop: '2rem' }}>
                            <h3 className={styles.sectionTitle}><Smartphone size={18} /> Pedidos por WhatsApp</h3>
                            <p className={styles.sectionDesc}>
                                Permite a tus clientes realizar pedidos directamente desde la carta digital hacia tu WhatsApp.
                            </p>
                        </div>

                        <div className={styles.toggleCard}>
                            <div className={styles.toggleInfo}>
                                <strong>{enableDigitalOrders ? '🛒 Pedidos Digitales Activados' : '⭕ Pedidos Digitales Desactivados'}</strong>
                                <span>
                                    {enableDigitalOrders
                                        ? 'Los clientes podrán agregar productos a un carrito y enviarte el pedido por WhatsApp.'
                                        : 'La carta solo será visual (modo catálogo).'}
                                </span>
                            </div>
                            <button
                                className={styles.toggleBtn}
                                onClick={() => setEnableDigitalOrders(v => !v)}
                                style={{ color: enableDigitalOrders ? 'var(--primary-color)' : '#aaa' }}
                                title={enableDigitalOrders ? 'Desactivar' : 'Activar'}
                            >
                                {enableDigitalOrders
                                    ? <ToggleRight size={48} strokeWidth={1.5} />
                                    : <ToggleLeft size={48} strokeWidth={1.5} />}
                            </button>
                        </div>

                        {enableDigitalOrders && (
                            <div className={styles.grid} style={{ marginTop: '1rem' }}>
                                <div className={styles.fieldCard} style={{ gridColumn: '1 / -1' }}>
                                    <div className={styles.fieldLabel}>📱 Número de WhatsApp (Recibe Pedidos)</div>
                                    <Input
                                        placeholder="Ej: +51 987654321"
                                        value={restaurantWhatsApp}
                                        onChange={e => setRestaurantWhatsApp(e.target.value)}
                                        fullWidth
                                    />
                                    <p className={styles.fieldHint}>Es necesario incluir el código de país (ej. +51 para Perú) sin espacios vacíos. Aquí llegará el resumen del pedido.</p>
                                </div>

                                <div className={styles.fieldCard}>
                                    <div className={styles.fieldLabel}>🛍️ Permitir Para Recoger</div>
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                                        <button
                                            className={styles.toggleBtn}
                                            onClick={() => setPickupEnabled(v => !v)}
                                            style={{ color: pickupEnabled ? 'var(--primary-color)' : '#aaa', padding: 0 }}
                                        >
                                            {pickupEnabled
                                                ? <ToggleRight size={36} strokeWidth={1.5} />
                                                : <ToggleLeft size={36} strokeWidth={1.5} />}
                                        </button>
                                        <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                                            {pickupEnabled ? 'Habilitado' : 'Deshabilitado'}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.fieldCard}>
                                    <div className={styles.fieldLabel}>🛵 Permitir Delivery</div>
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                                        <button
                                            className={styles.toggleBtn}
                                            onClick={() => setDeliveryEnabled(v => !v)}
                                            style={{ color: deliveryEnabled ? 'var(--primary-color)' : '#aaa', padding: 0 }}
                                        >
                                            {deliveryEnabled
                                                ? <ToggleRight size={36} strokeWidth={1.5} />
                                                : <ToggleLeft size={36} strokeWidth={1.5} />}
                                        </button>
                                        <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                                            {deliveryEnabled ? 'Habilitado' : 'Deshabilitado'}
                                        </span>
                                    </div>
                                </div>

                                {deliveryEnabled && (
                                    <>
                                        <div className={styles.fieldCard} style={{ gridColumn: '1 / -1' }}>
                                            <div className={styles.fieldLabel}>💵 Costo de Delivery Fijo (opcional)</div>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                placeholder="Ej: 5.00"
                                                value={deliveryCost}
                                                onChange={e => setDeliveryCost(e.target.value)}
                                            />
                                        </div>

                                        <div className={styles.fieldCard} style={{ gridColumn: '1 / -1' }}>
                                            <div className={styles.fieldLabel} style={{ marginBottom: '0.5rem' }}>💳 Métodos de Pago Digitales (Mostrados al cliente)</div>
                                            <p className={styles.fieldHint} style={{ marginTop: 0, marginBottom: '1rem' }}>Llena los que apliquen para que el usuario sepa a dónde transferir. Déjalos vacíos si no los usas.</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Número Yape</span>
                                                    <Input placeholder="Ej: 987 654 321 - Juan Pérez" value={pmYape} onChange={e => setPmYape(e.target.value)} fullWidth />
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Número Plin</span>
                                                    <Input placeholder="Ej: 987 654 321 - Maria Luna" value={pmPlin} onChange={e => setPmPlin(e.target.value)} fullWidth />
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Cuenta Bancaria</span>
                                                    <Input placeholder="Ej: BCP: 191-xxxx - CCI: 002191xxxx" value={pmBank} onChange={e => setPmBank(e.target.value)} fullWidth />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <SaveBar onSave={handleSave} isSaving={isSaving} />
                    </>
                )}

                {/* ════ APPEARANCE ════ */}
                {activeTab === 'appearance' && (
                    <>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}><Palette size={18} /> Apariencia</h3>
                            <p className={styles.sectionDesc}>
                                Personaliza el logo, colores y tipografía de la carta. Estos cambios solo afectan la carta pública.
                            </p>
                        </div>

                        {/* ── Theme Presets ── */}
                        <div className={styles.fieldCard} style={{ marginBottom: '1.25rem' }}>
                            <div className={styles.fieldLabel}><Palette size={14} /> Temas Predeterminados</div>
                            <p className={styles.fieldHint} style={{ marginTop: 0, marginBottom: '0.75rem' }}>
                                Selecciona un tema para aplicar automáticamente colores y tipografía.
                            </p>
                            <div className={styles.themesGrid}>
                                {MENU_THEMES.map(theme => (
                                    <button
                                        key={theme.id}
                                        className={`${styles.themeCard} ${themeId === theme.id ? styles.themeCardActive : ''}`}
                                        onClick={() => applyTheme(theme.id)}
                                    >
                                        <div className={styles.themePreviewBar}>
                                            <span className={styles.themePreviewSwatch} style={{ background: theme.bgColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                                            <span className={styles.themePreviewSwatch} style={{ background: theme.accentColor }} />
                                            <span className={styles.themePreviewSwatch} style={{ background: theme.textColor, border: '1px solid rgba(0,0,0,0.1)' }} />
                                        </div>
                                        <div className={styles.themeCardBody}>
                                            <span className={styles.themeIcon}>{theme.icon}</span>
                                            <div className={styles.themeInfo}>
                                                <div className={styles.themeName}>{theme.name}</div>
                                                <div className={styles.themeDesc}>{theme.description}</div>
                                            </div>
                                        </div>
                                        {themeId === theme.id && (
                                            <div className={styles.themeActiveBadge}>
                                                <Check size={12} /> Activo
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Logo URL ── */}
                        <div className={styles.fieldCard} style={{ marginBottom: '1rem' }}>
                            <div className={styles.fieldLabel}><ImagePlus size={14} /> Logo del Restaurante</div>
                            <div className={styles.logoUploadRow}>
                                <div className={styles.logoPreviewBox}>
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className={styles.logoPreviewImg} />
                                    ) : (
                                        <span className={styles.logoPreviewPlaceholder}>
                                            {tenant?.name?.charAt(0) ?? 'R'}
                                        </span>
                                    )}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <Input
                                        placeholder="https://i.imgur.com/tu-logo.png"
                                        value={logoUrl}
                                        onChange={e => {
                                            const val = e.target.value.trim();
                                            let finalUrl = val;

                                            // Extract Google Drive ID using various URL patterns
                                            const driveMatch1 = val.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                                            const driveMatch2 = val.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
                                            const driveMatch3 = val.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
                                            const driveId = (driveMatch1 && driveMatch1[1]) || (driveMatch2 && driveMatch2[1]) || (driveMatch3 && driveMatch3[1]);

                                            if (driveId) {
                                                // The thumbnail endpoint is generally more reliable for public images now
                                                finalUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
                                            } else {
                                                // Convert Imgur standard links (e.g., https://imgur.com/XYZ) to direct image links
                                                const imgurMatch = val.match(/^https?:\/\/imgur\.com\/([a-zA-Z0-9]+)$/);
                                                if (imgurMatch && imgurMatch[1]) {
                                                    finalUrl = `https://i.imgur.com/${imgurMatch[1]}.png`;
                                                }
                                            }

                                            setLogoUrl(finalUrl);
                                        }}
                                        fullWidth
                                    />
                                    {logoUrl && (
                                        <button
                                            onClick={() => setLogoUrl('')}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'var(--danger-color)', fontSize: '0.78rem',
                                                fontWeight: 600, padding: 0, width: 'fit-content',
                                            }}
                                        >
                                            <X size={13} /> Quitar logo
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className={styles.fieldHint}>
                                Pega la URL directa de tu imagen (Imgur, Drive, Cloudinary, etc.).
                                Se mostrará en la cabecera de la carta digital.
                            </p>
                        </div>

                        {/* ── Color Palette (3 pickers) ── */}
                        <div className={styles.colorGrid}>
                            {/* Accent color */}
                            <div className={styles.fieldCard}>
                                <div className={styles.fieldLabel}><Palette size={14} /> Color de Acento</div>
                                <div className={styles.colorRow}>
                                    <input type="color" value={accentColor} onChange={e => { setAccentColor(e.target.value); setThemeId('custom'); }} className={styles.colorSwatch} />
                                    <div>
                                        <div className={styles.colorValue}>{accentColor.toUpperCase()}</div>
                                        <div className={styles.colorDesc}>Botones, precios, categoría activa</div>
                                    </div>
                                </div>
                            </div>

                            {/* Background color */}
                            <div className={styles.fieldCard}>
                                <div className={styles.fieldLabel}>🎨 Color de Fondo</div>
                                <div className={styles.colorRow}>
                                    <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); setThemeId('custom'); }} className={styles.colorSwatch} />
                                    <div>
                                        <div className={styles.colorValue}>{bgColor.toUpperCase()}</div>
                                        <div className={styles.colorDesc}>Fondo general de la carta</div>
                                    </div>
                                </div>
                            </div>

                            {/* Text color */}
                            <div className={styles.fieldCard}>
                                <div className={styles.fieldLabel}><Type size={14} /> Color de Texto</div>
                                <div className={styles.colorRow}>
                                    <input type="color" value={textColor} onChange={e => { setTextColor(e.target.value); setThemeId('custom'); }} className={styles.colorSwatch} />
                                    <div>
                                        <div className={styles.colorValue}>{textColor.toUpperCase()}</div>
                                        <div className={styles.colorDesc}>Nombres de platos, títulos, textos</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── English subtitles toggle ── */}
                        <div className={styles.toggleCard} style={{ marginTop: '1.25rem' }}>
                            <div className={styles.toggleInfo}>
                                <strong>
                                    <Languages size={16} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                                    {englishSubtitles ? '🌐 Subtítulos en Inglés Activados' : '🌐 Subtítulos en Inglés Desactivados'}
                                </strong>
                                <span>
                                    {englishSubtitles
                                        ? 'Los productos mostrarán su traducción en inglés debajo del nombre y descripción.'
                                        : 'Activa esta opción si tu negocio recibe clientes turistas o extranjeros.'}
                                </span>
                            </div>
                            <button
                                className={styles.toggleBtn}
                                onClick={() => setEnglishSubtitles(v => !v)}
                                style={{ color: englishSubtitles ? 'var(--primary-color)' : '#aaa' }}
                                title={englishSubtitles ? 'Desactivar' : 'Activar'}
                            >
                                {englishSubtitles
                                    ? <ToggleRight size={48} strokeWidth={1.5} />
                                    : <ToggleLeft size={48} strokeWidth={1.5} />}
                            </button>
                        </div>

                        {/* ── Font selector ── */}
                        <div className={styles.fieldCard} style={{ marginTop: '1.25rem' }}>
                            <div className={styles.fieldLabel}>🔤 Tipografía de la Carta</div>
                            <div className={styles.fontGrid}>
                                {FONT_OPTIONS.map(font => (
                                    <button
                                        key={font.id}
                                        className={`${styles.fontOption} ${fontFamily === font.id ? styles.fontOptionActive : ''}`}
                                        onClick={() => { setFontFamily(font.id); setThemeId('custom'); }}
                                    >
                                        <div className={styles.fontPreview} style={{ fontFamily: font.style }}>
                                            {font.preview}
                                        </div>
                                        <div className={styles.fontName}>{font.label}</div>
                                        <div className={styles.fontHint}>{font.hint}</div>
                                    </button>
                                ))}
                            </div>
                            <p className={styles.fieldHint}>
                                La fuente seleccionada solo se aplica en la carta pública, no en el panel de administración.
                            </p>
                        </div>

                        {/* ── Live preview ── */}
                        <div className={styles.preview} style={{ marginTop: '1.5rem' }}>
                            <div className={styles.previewHeader} style={{ backgroundColor: bgColor }}>
                                <div className={styles.previewLogo} style={{ backgroundColor: logoUrl ? 'transparent' : accentColor }}>
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt="Logo preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                                        />
                                    ) : (
                                        tenant?.name?.charAt(0) ?? 'R'
                                    )}
                                </div>
                                <div>
                                    <div className={styles.previewName} style={{ fontFamily: selectedFont.style, color: textColor }}>
                                        {tenant?.name ?? 'Mi Restaurante'}
                                    </div>
                                    <div className={styles.previewDesc} style={{ fontFamily: selectedFont.style, color: accentColor }}>
                                        {description || 'Tu slogan aquí'}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.previewBody} style={{ backgroundColor: bgColor }}>
                                {[
                                    { name: 'Ceviche Clásico', nameEn: 'Classic Ceviche', price: 'S/ 32' },
                                    { name: 'Lomo Saltado', nameEn: 'Stir-Fried Beef', price: 'S/ 38' },
                                    { name: 'Chicha Morada', nameEn: 'Purple Corn Drink', price: 'S/ 12' },
                                ].map(item => (
                                    <div key={item.name} className={styles.previewItem}>
                                        <div>
                                            <span className={styles.previewItemName} style={{ fontFamily: selectedFont.style, color: textColor }}>
                                                {item.name}
                                            </span>
                                            {englishSubtitles && (
                                                <div className={styles.previewSubtitleEn}>
                                                    {item.nameEn}
                                                </div>
                                            )}
                                        </div>
                                        <span className={styles.previewItemPrice} style={{ color: accentColor, fontFamily: selectedFont.style }}>
                                            {item.price}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <SaveBar onSave={handleSave} isSaving={isSaving} />
                    </>
                )}

                {/* ════ INFO ════ */}
                {activeTab === 'info' && (
                    <>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}><Info size={18} /> Información del Restaurante</h3>
                            <p className={styles.sectionDesc}>
                                Datos que aparecen en la cabecera y el pie de página de la carta digital.
                            </p>
                        </div>

                        <div className={styles.grid}>
                            <div className={styles.fieldCard} style={{ gridColumn: '1 / -1' }}>
                                <div className={styles.fieldLabel}>Descripción / Slogan</div>
                                <Input
                                    placeholder="Ej: Cocina mediterránea de autor..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    fullWidth
                                />
                                <p className={styles.fieldHint}>Aparece debajo del nombre del restaurante en la carta.</p>
                            </div>

                            <div className={styles.fieldCard}>
                                <div className={styles.fieldLabel}>📍 Dirección (footer)</div>
                                <Input
                                    placeholder="Ej: Av. La Marina 123, Miraflores"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    fullWidth
                                />
                            </div>

                            <div className={styles.fieldCard}>
                                <div className={styles.fieldLabel}>📞 Teléfono (footer)</div>
                                <Input
                                    placeholder="Ej: +51 999 123 456"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    fullWidth
                                />
                            </div>
                        </div>

                        <SaveBar onSave={handleSave} isSaving={isSaving} />
                    </>
                )}

                {/* ════ EXTERNAL ════ */}
                {activeTab === 'external' && (
                    <>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}><Globe size={18} /> Enlace Externo (PDF / Imagen)</h3>
                            <p className={styles.sectionDesc}>
                                Opción alternativa: sube tu carta a Google Drive o Dropbox y pega el enlace aquí.
                                Se usará solo si la carta nativa está desactivada.
                            </p>
                        </div>

                        <div className={styles.grid}>
                            <div className={styles.fieldCard}>
                                <div className={styles.fieldLabel}>🇵🇪 Carta en Español</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Input
                                        placeholder="https://..."
                                        value={menuEs}
                                        onChange={e => setMenuEs(e.target.value)}
                                        fullWidth
                                    />
                                    {menuEs && (
                                        <Button variant="ghost" onClick={() => window.open(menuEs, '_blank')}
                                            style={{ flexShrink: 0 }}>
                                            <ExternalLink size={16} />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className={styles.fieldCard}>
                                <div className={styles.fieldLabel}>🇺🇸 Carta en Inglés (Opcional)</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Input
                                        placeholder="https://..."
                                        value={menuEn}
                                        onChange={e => setMenuEn(e.target.value)}
                                        fullWidth
                                    />
                                    {menuEn && (
                                        <Button variant="ghost" onClick={() => window.open(menuEn, '_blank')}
                                            style={{ flexShrink: 0 }}>
                                            <ExternalLink size={16} />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <SaveBar onSave={handleSave} isSaving={isSaving} />
                    </>
                )}
            </div>
        </div>
    );
}

// ── Shared save bar ───────────────────────────────────────────────────────────
function SaveBar({ onSave, isSaving }: { onSave: () => void; isSaving: boolean }) {
    return (
        <div className={styles.saveBar}>
            <Button
                variant="primary"
                onClick={onSave}
                disabled={isSaving}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
            >
                <Save size={17} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </div>
    );
}
