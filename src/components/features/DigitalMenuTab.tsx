import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useTenant } from '@/app/providers/TenantProvider';
import { Button, Input, Card } from '@/components/shared';
import { Globe, Save, ExternalLink, QrCode } from 'lucide-react';

export function DigitalMenuTab() {
    const { tenant } = useTenant();
    const [menuEs, setMenuEs] = useState(tenant?.config?.menuSpanishUrl || '');
    const [menuEn, setMenuEn] = useState(tenant?.config?.menuEnglishUrl || '');
    const [isSaving, setIsSaving] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        if (tenant?.config) {
            setMenuEs(tenant.config.menuSpanishUrl || '');
            setMenuEn(tenant.config.menuEnglishUrl || '');
        }

        // Construct base URL for QR codes
        const origin = window.location.origin;
        setBaseUrl(`${origin}/${tenant?.id}/menu/`);
    }, [tenant]);

    const handleSave = async () => {
        if (!tenant) return;

        try {
            setIsSaving(true);
            const restaurantRef = doc(db, 'restaurants', tenant.id);
            await updateDoc(restaurantRef, {
                'config.menuSpanishUrl': menuEs.trim(),
                'config.menuEnglishUrl': menuEn.trim()
            });
            alert('Configuración guardada correctamente');
        } catch (error) {
            console.error("Error saving menu config:", error);
            alert('Error al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Globe size={20} /> Configuración de la Carta Digital
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Sube tus cartas (PDF o Imagen) a un servicio de almacenamiento (como Google Drive o Dropbox) y pega los enlaces directos aquí.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <Card style={{ padding: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Carta en Español</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Input
                                placeholder="https://..."
                                value={menuEs}
                                onChange={e => setMenuEs(e.target.value)}
                                fullWidth
                            />
                            {menuEs && (
                                <Button variant="ghost" onClick={() => window.open(menuEs, '_blank')}>
                                    <ExternalLink size={18} />
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card style={{ padding: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Carta en Inglés (Opcional)</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Input
                                placeholder="https://..."
                                value={menuEn}
                                onChange={e => setMenuEn(e.target.value)}
                                fullWidth
                            />
                            {menuEn && (
                                <Button variant="ghost" onClick={() => window.open(menuEn, '_blank')}>
                                    <ExternalLink size={18} />
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
                    >
                        <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </section>

            <section style={{ borderTop: '1px solid var(--divider-color)', paddingTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <QrCode size={20} /> Generación de Código QR
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Utiliza el siguiente enlace para generar tu código QR. Este link llevará a tus clientes directamente a la carta digital.
                </p>

                <Card style={{ padding: '1.5rem', backgroundColor: 'var(--background-color)', border: '1px dashed var(--primary-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <code style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            {baseUrl.replace(/\/$/, '')}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => {
                            navigator.clipboard.writeText(baseUrl.replace(/\/$/, ''));
                            alert('Enlace copiado al portapapeles');
                        }}>
                            Copiar Link
                        </Button>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#666' }}>
                        <b>Nota:</b> Si deseas que el sistema sepa en qué mesa está el cliente (opcional), puedes agregar el número de mesa al final:
                        <span style={{ color: 'var(--primary-color)', marginLeft: '5px' }}>{baseUrl}5</span>
                    </p>
                </Card>
            </section>
        </div>
    );
}
