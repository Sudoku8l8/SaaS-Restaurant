import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useTenant } from '@/app/providers/TenantProvider';
import { Button, Input, Card } from '@/components/shared';
import {
    Globe, Save, ExternalLink, QrCode, Smartphone,
    Copy, Check, ToggleLeft, ToggleRight, Palette, Info
} from 'lucide-react';

export function DigitalMenuTab() {
    const { tenant } = useTenant();

    // ── Native menu config ──
    const [nativeEnabled, setNativeEnabled] = useState(tenant?.config?.menuNativeEnabled ?? false);
    const [accentColor, setAccentColor] = useState(tenant?.config?.menuAccentColor || '#c8a96e');
    const [description, setDescription] = useState(tenant?.config?.menuDescription || '');
    const [address, setAddress] = useState(tenant?.config?.menuAddress || '');
    const [phone, setPhone] = useState(tenant?.config?.menuPhone || '');

    // ── External URL config ──
    const [menuEs, setMenuEs] = useState(tenant?.config?.menuSpanishUrl || '');
    const [menuEn, setMenuEn] = useState(tenant?.config?.menuEnglishUrl || '');

    const [isSaving, setIsSaving] = useState(false);
    const [copied, setCopied] = useState(false);
    const [externalOpen, setExternalOpen] = useState(false);

    const menuLink = `${window.location.origin}/${tenant?.id}/menu`;

    useEffect(() => {
        if (tenant?.config) {
            setNativeEnabled(tenant.config.menuNativeEnabled ?? false);
            setAccentColor(tenant.config.menuAccentColor || '#c8a96e');
            setDescription(tenant.config.menuDescription || '');
            setAddress(tenant.config.menuAddress || '');
            setPhone(tenant.config.menuPhone || '');
            setMenuEs(tenant.config.menuSpanishUrl || '');
            setMenuEn(tenant.config.menuEnglishUrl || '');
        }
    }, [tenant]);

    const handleSave = async () => {
        if (!tenant) return;
        try {
            setIsSaving(true);
            const restaurantRef = doc(db, 'restaurants', tenant.id);
            await updateDoc(restaurantRef, {
                'config.menuNativeEnabled': nativeEnabled,
                'config.menuAccentColor': accentColor,
                'config.menuDescription': description.trim(),
                'config.menuAddress': address.trim(),
                'config.menuPhone': phone.trim(),
                'config.menuSpanishUrl': menuEs.trim(),
                'config.menuEnglishUrl': menuEn.trim(),
            });
            alert('Configuración guardada correctamente');
        } catch (error) {
            console.error('Error saving menu config:', error);
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── SECTION 1: Native Digital Menu ── */}
            <section>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Smartphone size={20} /> Carta Digital Nativa
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Activa la carta digital integrada. Tus clientes verán los productos directamente desde el sistema, sin necesidad de archivos externos.
                </p>

                {/* Toggle */}
                <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.2rem' }}>
                                {nativeEnabled ? '✅ Carta Nativa Activada' : '⭕ Carta Nativa Desactivada'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {nativeEnabled
                                    ? 'Los clientes verán la carta digital integrada al escanear el QR.'
                                    : 'Los clientes verán los botones de enlace externo (PDF/imagen).'}
                            </div>
                        </div>
                        <button
                            onClick={() => setNativeEnabled(!nativeEnabled)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: nativeEnabled ? 'var(--primary-color)' : '#aaa', transition: 'color 0.2s' }}
                            title={nativeEnabled ? 'Desactivar' : 'Activar'}
                        >
                            {nativeEnabled
                                ? <ToggleRight size={48} strokeWidth={1.5} />
                                : <ToggleLeft size={48} strokeWidth={1.5} />}
                        </button>
                    </div>
                </Card>

                {/* Link & QR */}
                <Card style={{ padding: '1.5rem', border: '1.5px dashed var(--primary-color)', backgroundColor: 'var(--background-color)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <QrCode size={18} style={{ color: 'var(--primary-color)' }} />
                        <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Enlace de tu Carta Digital</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <code style={{
                            flex: 1,
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                            background: 'var(--surface-color)',
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            wordBreak: 'break-all',
                            minWidth: 0,
                        }}>
                            {menuLink}
                        </code>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <Button variant="outline" size="sm" onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {copied ? <Check size={15} /> : <Copy size={15} />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => window.open(menuLink, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <ExternalLink size={15} /> Ver Carta
                            </Button>
                        </div>
                    </div>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        Puedes agregar el número de mesa al final: <strong>{menuLink}/5</strong>
                    </p>
                </Card>

                {/* Customization — only shown when native is enabled */}
                {nativeEnabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {/* Color */}
                        <Card style={{ padding: '1.25rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                <Palette size={16} /> Color de Acento
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={e => setAccentColor(e.target.value)}
                                    style={{ width: '48px', height: '48px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: '2px', background: 'none' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{accentColor.toUpperCase()}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Color principal de la carta</div>
                                </div>
                            </div>
                        </Card>

                        {/* Description */}
                        <Card style={{ padding: '1.25rem' }}>
                            <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                Descripción / Slogan
                            </label>
                            <Input
                                placeholder="Ej: Cocina mediterránea de autor..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                fullWidth
                            />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                                Aparece debajo del nombre en la carta
                            </p>
                        </Card>

                        {/* Address */}
                        <Card style={{ padding: '1.25rem' }}>
                            <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                Dirección (footer)
                            </label>
                            <Input
                                placeholder="Ej: Calle de la Gastronomía 42"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                fullWidth
                            />
                        </Card>

                        {/* Phone */}
                        <Card style={{ padding: '1.25rem' }}>
                            <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                Teléfono (footer)
                            </label>
                            <Input
                                placeholder="Ej: +51 999 123 456"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                fullWidth
                            />
                        </Card>
                    </div>
                )}
            </section>

            {/* ── SECTION 2: External URLs (collapsible) ── */}
            <section style={{ borderTop: '1px solid var(--divider-color)', paddingTop: '1.5rem' }}>
                <button
                    onClick={() => setExternalOpen(o => !o)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)',
                        marginBottom: externalOpen ? '1rem' : 0,
                        padding: 0,
                    }}
                >
                    <Globe size={18} />
                    Enlace Externo (PDF / Imagen)
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                        {externalOpen ? '▲ Ocultar' : '▼ Mostrar'}
                    </span>
                </button>

                {externalOpen && (
                    <>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                            Opción alternativa: sube tu carta a Google Drive o Dropbox y pega el enlace directo aquí.
                            Se usará solo si la carta nativa está desactivada.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            <Card style={{ padding: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Carta en Español</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Input placeholder="https://..." value={menuEs} onChange={e => setMenuEs(e.target.value)} fullWidth />
                                    {menuEs && (
                                        <Button variant="ghost" onClick={() => window.open(menuEs, '_blank')}>
                                            <ExternalLink size={16} />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                            <Card style={{ padding: '1.25rem' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Carta en Inglés (Opcional)</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Input placeholder="https://..." value={menuEn} onChange={e => setMenuEn(e.target.value)} fullWidth />
                                    {menuEn && (
                                        <Button variant="ghost" onClick={() => window.open(menuEn, '_blank')}>
                                            <ExternalLink size={16} />
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </section>

            {/* ── SAVE BUTTON ── */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
                >
                    <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    );
}
