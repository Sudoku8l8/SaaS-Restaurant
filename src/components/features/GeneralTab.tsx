import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useTenant } from '@/app/providers/TenantProvider';
import { Card } from '@/components/shared';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';

export function GeneralTab() {
    const { tenant } = useTenant();

    const [usarPantallaCocina, setUsarPantallaCocina] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (tenant?.config) {
            setUsarPantallaCocina(tenant.config.usarPantallaCocina ?? false);
        }
    }, [tenant]);

    const handleToggle = async () => {
        if (!tenant) return;
        const newValue = !usarPantallaCocina;

        // Optimistic UI update
        setUsarPantallaCocina(newValue);

        try {
            setIsSaving(true);
            const restaurantRef = doc(db, 'restaurants', tenant.id);
            await updateDoc(restaurantRef, {
                'config.usarPantallaCocina': newValue,
            });
            // We can optionally show a small toast, but optimistic update feels better
        } catch (error) {
            console.error('Error saving general config:', error);
            alert('Error al guardar la configuración general');
            // Revert on error
            setUsarPantallaCocina(!newValue);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} /> Opciones Generales
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Configuraciones principales del funcionamiento del restaurante.
                </p>

                <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.2rem' }}>
                                Pantalla de Cocina vs Comandas
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {usarPantallaCocina
                                    ? 'Modo Pantalla: El mozo pasa por 4 estados de pedido (Pendiente → Preparar → Marcar Listo → Entregar).'
                                    : 'Modo Comanda: El mozo usa comandas físicas. Pasa por 2 estados (Pendiente → Entregar).'}
                            </div>
                        </div>
                        <button
                            onClick={handleToggle}
                            disabled={isSaving}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: isSaving ? 'wait' : 'pointer',
                                color: usarPantallaCocina ? 'var(--primary-color)' : '#aaa',
                                transition: 'color 0.2s',
                                opacity: isSaving ? 0.7 : 1
                            }}
                            title={usarPantallaCocina ? 'Desactivar Pantalla de Cocina' : 'Activar Pantalla de Cocina'}
                        >
                            {usarPantallaCocina
                                ? <ToggleRight size={48} strokeWidth={1.5} />
                                : <ToggleLeft size={48} strokeWidth={1.5} />}
                        </button>
                    </div>
                </Card>
            </section>
        </div>
    );
}
