import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useTenant } from '@/app/providers/TenantProvider';
import { Button, Input } from '@/components/shared';
import {
    Smartphone, Palette, Info, Globe, Save,
    ExternalLink, QrCode, Copy, Check,
    ToggleLeft, ToggleRight,
} from 'lucide-react';
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
    const [fontFamily, setFontFamily] = useState<FontId>((tenant?.config?.menuFontFamily as FontId) || 'inter');

    // Info
    const [description, setDescription] = useState(tenant?.config?.menuDescription || '');
    const [address, setAddress] = useState(tenant?.config?.menuAddress || '');
    const [phone, setPhone] = useState(tenant?.config?.menuPhone || '');

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
        setFontFamily((c.menuFontFamily as FontId) || 'inter');
        setDescription(c.menuDescription || '');
        setAddress(c.menuAddress || '');
        setPhone(c.menuPhone || '');
        setMenuEs(c.menuSpanishUrl || '');
        setMenuEn(c.menuEnglishUrl || '');
    }, [tenant]);

    const handleSave = async () => {
        if (!tenant) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'restaurants', tenant.id), {
                'config.menuNativeEnabled': nativeEnabled,
                'config.menuAccentColor': accentColor,
                'config.menuBgColor': bgColor,
                'config.menuFontFamily': fontFamily,
                'config.menuDescription': description.trim(),
                'config.menuAddress': address.trim(),
                'config.menuPhone': phone.trim(),
                'config.menuSpanishUrl': menuEs.trim(),
                'config.menuEnglishUrl': menuEn.trim(),
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

                        <SaveBar onSave={handleSave} isSaving={isSaving} />
                    </>
                )}

                {/* ════ APPEARANCE ════ */}
                {activeTab === 'appearance' && (
                    <>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}><Palette size={18} /> Apariencia</h3>
                            <p className={styles.sectionDesc}>
                                Personaliza los colores y la tipografía de la carta. Estos cambios solo afectan la carta pública.
                            </p>
                        </div>

                        <div className={styles.grid}>
                            {/* Accent color */}
                            <div className={styles.fieldCard}>
                                <div className={styles.fieldLabel}><Palette size={14} /> Color de Acento</div>
                                <div className={styles.colorRow}>
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={e => setAccentColor(e.target.value)}
                                        className={styles.colorSwatch}
                                    />
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
                                    <input
                                        type="color"
                                        value={bgColor}
                                        onChange={e => setBgColor(e.target.value)}
                                        className={styles.colorSwatch}
                                    />
                                    <div>
                                        <div className={styles.colorValue}>{bgColor.toUpperCase()}</div>
                                        <div className={styles.colorDesc}>Fondo general de la carta</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Font selector */}
                        <div className={styles.fieldCard} style={{ marginTop: '1.25rem' }}>
                            <div className={styles.fieldLabel}>🔤 Tipografía de la Carta</div>
                            <div className={styles.fontGrid}>
                                {FONT_OPTIONS.map(font => (
                                    <button
                                        key={font.id}
                                        className={`${styles.fontOption} ${fontFamily === font.id ? styles.fontOptionActive : ''}`}
                                        onClick={() => setFontFamily(font.id)}
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

                        {/* Live preview */}
                        <div className={styles.preview} style={{ marginTop: '1.5rem' }}>
                            <div className={styles.previewHeader} style={{ backgroundColor: bgColor }}>
                                <div className={styles.previewLogo} style={{ backgroundColor: accentColor }}>
                                    {tenant?.name?.charAt(0) ?? 'R'}
                                </div>
                                <div>
                                    <div className={styles.previewName} style={{ fontFamily: selectedFont.style }}>
                                        {tenant?.name ?? 'Mi Restaurante'}
                                    </div>
                                    <div className={styles.previewDesc} style={{ fontFamily: selectedFont.style }}>
                                        {description || 'Tu slogan aquí'}
                                    </div>
                                </div>
                            </div>
                            <div className={styles.previewBody} style={{ backgroundColor: bgColor }}>
                                {[
                                    { name: 'Ceviche Clásico', price: 'S/ 32' },
                                    { name: 'Lomo Saltado', price: 'S/ 38' },
                                    { name: 'Chicha Morada', price: 'S/ 12' },
                                ].map(item => (
                                    <div key={item.name} className={styles.previewItem}>
                                        <span className={styles.previewItemName} style={{ fontFamily: selectedFont.style }}>
                                            {item.name}
                                        </span>
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
