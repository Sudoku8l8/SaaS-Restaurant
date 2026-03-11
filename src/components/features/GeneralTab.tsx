import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useTenant } from '@/app/providers/TenantProvider';
import { Card, Button, Input } from '@/components/shared';
import { Settings, ToggleLeft, ToggleRight, Building2, Plus, Package, MapPin, AlertTriangle, Store } from 'lucide-react';
import type { Restaurant, RestaurantConfig, BusinessType } from '@/types';
import { BusinessType as BT } from '@/types';

export function GeneralTab() {
    const { tenant } = useTenant();

    const [usarPantallaCocina, setUsarPantallaCocina] = useState(false);
    const [multiSucursal, setMultiSucursal] = useState(false);
    const [outOfStockBehavior, setOutOfStockBehavior] = useState<'allow' | 'alert'>('alert');
    const [isSaving, setIsSaving] = useState(false);

    // Sector / Business Type state
    const [businessType, setBusinessType] = useState<BusinessType>(BT.RESTAURANT);
    const [enableTables, setEnableTables] = useState(true);
    const [enableKitchenOrders, setEnableKitchenOrders] = useState(true);
    const [enableQuickSale, setEnableQuickSale] = useState(false);
    const [enablePartialPayment, setEnablePartialPayment] = useState(true);

    // Branch creation state
    const [showBranchForm, setShowBranchForm] = useState(false);
    const [branchName, setBranchName] = useState('');
    const [branchAddress, setBranchAddress] = useState('');
    const [branchPhone, setBranchPhone] = useState('');
    const [isCreatingBranch, setIsCreatingBranch] = useState(false);

    useEffect(() => {
        if (tenant?.config) {
            setUsarPantallaCocina(tenant.config.usarPantallaCocina ?? false);
            setMultiSucursal(tenant.config.multiSucursal ?? false);
            setOutOfStockBehavior(tenant.config.outOfStockBehavior ?? 'alert');
            setBusinessType((tenant.config.businessType as BusinessType) ?? BT.RESTAURANT);
            setEnableTables(tenant.config.enableTables ?? true);
            setEnableKitchenOrders(tenant.config.enableKitchenOrders ?? true);
            setEnableQuickSale(tenant.config.enableQuickSale ?? false);
            setEnablePartialPayment(tenant.config.enablePartialPayment ?? true);
        }
    }, [tenant]);

    // Sector presets — auto-config when changing business type
    const SECTOR_PRESETS: Record<BusinessType, { enableTables: boolean; enableKitchenOrders: boolean; enableQuickSale: boolean }> = {
        [BT.RESTAURANT]: { enableTables: true, enableKitchenOrders: true, enableQuickSale: false },
        [BT.ICE_CREAM]:  { enableTables: false, enableKitchenOrders: false, enableQuickSale: true },
        [BT.COFFEE]:     { enableTables: true, enableKitchenOrders: false, enableQuickSale: true },
        [BT.BAR]:        { enableTables: true, enableKitchenOrders: false, enableQuickSale: true },
    };

    const SECTOR_OPTIONS: { value: BusinessType; label: string; emoji: string; desc: string }[] = [
        { value: BT.RESTAURANT, label: 'Restaurante', emoji: '🍽️', desc: 'Mesas, cocina, comandas' },
        { value: BT.ICE_CREAM, label: 'Heladería', emoji: '🍦', desc: 'Ventas rápidas, pocas mesas' },
        { value: BT.COFFEE, label: 'Coffee Shop', emoji: '☕', desc: 'Pedidos rápidos + mesas' },
        { value: BT.BAR, label: 'Bar', emoji: '🍸', desc: 'Bebidas, control de barra' },
    ];

    const handleBusinessTypeChange = async (newType: BusinessType) => {
        if (!tenant || isSaving) return;
        const preset = SECTOR_PRESETS[newType];
        setBusinessType(newType);
        setEnableTables(preset.enableTables);
        setEnableKitchenOrders(preset.enableKitchenOrders);
        setEnableQuickSale(preset.enableQuickSale);

        try {
            setIsSaving(true);
            await updateDoc(doc(db, 'restaurants', tenant.id), {
                'config.businessType': newType,
                'config.enableTables': preset.enableTables,
                'config.enableKitchenOrders': preset.enableKitchenOrders,
                'config.enableQuickSale': preset.enableQuickSale,
            });
        } catch (error) {
            console.error('Error saving business type:', error);
            alert('Error al guardar el tipo de negocio');
            // Revert
            if (tenant.config) {
                setBusinessType((tenant.config.businessType as BusinessType) ?? BT.RESTAURANT);
                setEnableTables(tenant.config.enableTables ?? true);
                setEnableKitchenOrders(tenant.config.enableKitchenOrders ?? true);
                setEnableQuickSale(tenant.config.enableQuickSale ?? false);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSectorToggle = async (field: 'enableTables' | 'enableKitchenOrders' | 'enableQuickSale', newValue: boolean, setter: (v: boolean) => void) => {
        if (!tenant || isSaving) return;
        setter(newValue);
        try {
            setIsSaving(true);
            await updateDoc(doc(db, 'restaurants', tenant.id), {
                [`config.${field}`]: newValue,
            });
        } catch (error) {
            console.error('Error saving sector toggle:', error);
            alert('Error al guardar la configuración');
            setter(!newValue);
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggle = async (field: keyof RestaurantConfig, newValue: boolean, setter: (v: boolean) => void) => {
        if (!tenant) return;
        setter(newValue);

        try {
            setIsSaving(true);
            const restaurantRef = doc(db, 'restaurants', tenant.id);
            const updates: Record<string, unknown> = {
                [`config.${field}`]: newValue,
            };
            // When enabling multi-sucursal, also mark this restaurant as parent
            if (field === 'multiSucursal' && newValue) {
                updates['isParent'] = true;
            }
            await updateDoc(restaurantRef, updates);
        } catch (error) {
            console.error('Error saving general config:', error);
            alert('Error al guardar la configuración general');
            setter(!newValue);
        } finally {
            setIsSaving(false);
        }
    };

    const handleOutOfStockChange = async (value: 'allow' | 'alert') => {
        if (!tenant) return;
        setOutOfStockBehavior(value);
        try {
            setIsSaving(true);
            await updateDoc(doc(db, 'restaurants', tenant.id), {
                'config.outOfStockBehavior': value,
            });
        } catch (error) {
            console.error('Error saving out-of-stock config:', error);
            alert('Error al guardar la configuración');
            setOutOfStockBehavior(outOfStockBehavior);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !branchName.trim()) return;

        setIsCreatingBranch(true);
        try {
            // Generate a slug from the branch name
            const branchSlug = `${tenant.id}-${branchName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

            const branchData: Partial<Restaurant> = {
                id: branchSlug,
                name: branchName.trim(),
                address: branchAddress.trim() || '',
                phone: branchPhone.trim() || '',
                plan: tenant.plan,
                active: true,
                createdAt: new Date(),
                parentId: tenant.id,
                config: {
                    tablesCount: 5,
                    currency: tenant.config?.currency || 'PEN',
                    timezone: tenant.config?.timezone || 'America/Lima',
                },
            };

            // Create branch doc with slug as ID
            const { doc: docRef, setDoc } = await import('firebase/firestore');
            await setDoc(docRef(db, 'restaurants', branchSlug), branchData);

            // Update parent's branches array
            await updateDoc(doc(db, 'restaurants', tenant.id), {
                branches: arrayUnion(branchSlug),
            });

            // Reset form
            setBranchName('');
            setBranchAddress('');
            setBranchPhone('');
            setShowBranchForm(false);
        } catch (error) {
            console.error('Error creating branch:', error);
            alert('Error al crear la sucursal');
        } finally {
            setIsCreatingBranch(false);
        }
    };

    const ToggleSwitch = ({ value, label, description, onToggle, disabled }: {
        value: boolean; label: string; description: string;
        onToggle: () => void; disabled?: boolean;
    }) => (
        <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{label}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>{description}</div>
                </div>
                <button
                    onClick={onToggle}
                    disabled={disabled || isSaving}
                    style={{
                        background: 'none', border: 'none',
                        cursor: (disabled || isSaving) ? 'wait' : 'pointer',
                        color: value ? 'var(--primary-color)' : '#aaa',
                        transition: 'color 0.2s',
                        opacity: isSaving ? 0.7 : 1,
                    }}
                    title={value ? 'Desactivar' : 'Activar'}
                >
                    {value
                        ? <ToggleRight size={48} strokeWidth={1.5} />
                        : <ToggleLeft size={48} strokeWidth={1.5} />}
                </button>
            </div>
        </Card>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Business Type Selector */}
            <section>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Store size={20} /> Tipo de Negocio
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Selecciona el tipo de establecimiento. El sistema se adapta automáticamente.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    {SECTOR_OPTIONS.map(opt => {
                        const isActive = businessType === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleBusinessTypeChange(opt.value)}
                                disabled={isSaving}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                                    padding: '1.25rem 1rem', borderRadius: 'var(--radius-lg)', cursor: isSaving ? 'wait' : 'pointer',
                                    border: `2px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    background: isActive ? 'rgba(142, 115, 91, 0.08)' : 'var(--surface-color)',
                                    transition: 'all 0.2s', textAlign: 'center',
                                    boxShadow: isActive ? '0 2px 8px rgba(142, 115, 91, 0.15)' : 'none',
                                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                <span style={{ fontSize: '2rem' }}>{opt.emoji}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isActive ? 'var(--primary-color)' : 'var(--text-primary)' }}>{opt.label}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{opt.desc}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Sector-specific toggles */}
                <ToggleSwitch
                    value={enableTables}
                    label="Módulo de Mesas"
                    description={enableTables
                        ? 'Activado: Los pedidos se gestionan por mesas asignadas.'
                        : 'Desactivado: El sistema opera sin mesas. Ideal para ventas rápidas.'}
                    onToggle={() => handleSectorToggle('enableTables', !enableTables, setEnableTables)}
                />
                <ToggleSwitch
                    value={enableKitchenOrders}
                    label="Comandas de Cocina"
                    description={enableKitchenOrders
                        ? 'Activado: Los pedidos se envían a la cocina para preparación.'
                        : 'Desactivado: Los productos se entregan directamente sin pasar por cocina.'}
                    onToggle={() => handleSectorToggle('enableKitchenOrders', !enableKitchenOrders, setEnableKitchenOrders)}
                />
                <ToggleSwitch
                    value={enableQuickSale}
                    label="Ventas Rápidas (POS)"
                    description={enableQuickSale
                        ? 'Activado: Botón de venta rápida disponible. Permite vender sin mesa ni comanda.'
                        : 'Desactivado: Las ventas solo se realizan a través del flujo de mesas.'}
                    onToggle={() => handleSectorToggle('enableQuickSale', !enableQuickSale, setEnableQuickSale)}
                />
            </section>

            {/* Kitchen Screen Toggle */}
            <section>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={20} /> Opciones Generales
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Configuraciones principales del funcionamiento del sistema.
                </p>

                <ToggleSwitch
                    value={usarPantallaCocina}
                    label="Pantalla en Cocina"
                    description={usarPantallaCocina
                        ? 'Modo Pantalla: El mozo pasa por 4 estados de pedido (Pendiente → Preparar → Marcar Listo → Entregar).'
                        : 'Modo Comanda: El mozo usa comandas físicas. Pasa por 2 estados (Pendiente → Entregar).'}
                    onToggle={() => handleToggle('usarPantallaCocina', !usarPantallaCocina, setUsarPantallaCocina)}
                />
                <ToggleSwitch
                    value={enablePartialPayment}
                    label="Pagos Parciales"
                    description={enablePartialPayment
                        ? 'Activado: Permite ingresar un monto específico al cobrar, dividiendo la cuenta en varios métodos de pago.'
                        : 'Desactivado: Seleccionar un método de pago procesa instantáneamente el monto total restante (Cobro Rápido).'}
                    onToggle={() => handleToggle('enablePartialPayment', !enablePartialPayment, setEnablePartialPayment)}
                />
            </section>

            {/* Multi-Sucursal Toggle */}
            <section>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={20} /> Multi-Sucursal
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Gestiona múltiples locales desde una sola cuenta.
                </p>

                <ToggleSwitch
                    value={multiSucursal}
                    label="Modo Multi-Sucursal"
                    description={multiSucursal
                        ? 'Activado: Puedes crear y gestionar múltiples locales. Cada local tiene su caja, mesas, inventario, productos y usuarios.'
                        : 'Desactivado: El sistema opera como un solo local.'}
                    onToggle={() => handleToggle('multiSucursal', !multiSucursal, setMultiSucursal)}
                />

                {/* Branch Management (only if multi-sucursal enabled) */}
                {multiSucursal && (
                    <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Sucursales</h4>
                            <Button size="sm" variant="primary" onClick={() => setShowBranchForm(!showBranchForm)}>
                                <Plus size={16} /> Nueva Sucursal
                            </Button>
                        </div>

                        {/* Existing Branches */}
                        {(tenant?.branches ?? []).length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                                {(tenant?.branches ?? []).map((branchId) => (
                                    <Card key={branchId} style={{
                                        padding: '1rem 1.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                    }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                                            background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <MapPin size={18} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{branchId}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                /{branchId}/login
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card style={{ padding: '2rem', textAlign: 'center', marginBottom: '1rem' }}>
                                <Building2 size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                                    No tienes sucursales aún. Crea tu primera sucursal.
                                </p>
                            </Card>
                        )}

                        {/* Create Branch Form */}
                        {showBranchForm && (
                            <Card style={{ padding: '1.5rem', border: '2px solid var(--primary-color)', borderRadius: 'var(--radius-lg)' }}>
                                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Nueva Sucursal</h4>
                                <form onSubmit={handleCreateBranch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <Input
                                        label="Nombre de la Sucursal"
                                        value={branchName}
                                        onChange={(e) => setBranchName(e.target.value)}
                                        placeholder="Ej: Restaurante Centro"
                                        required
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <Input
                                            label="Dirección (opcional)"
                                            value={branchAddress}
                                            onChange={(e) => setBranchAddress(e.target.value)}
                                            placeholder="Ej: Av. Primavera 123"
                                        />
                                        <Input
                                            label="Teléfono (opcional)"
                                            value={branchPhone}
                                            onChange={(e) => setBranchPhone(e.target.value)}
                                            placeholder="Ej: 01-1234567"
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <Button type="button" variant="ghost" onClick={() => setShowBranchForm(false)} fullWidth>Cancelar</Button>
                                        <Button type="submit" variant="primary" fullWidth disabled={isCreatingBranch}>
                                            {isCreatingBranch ? 'Creando...' : 'Crear Sucursal'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        )}
                    </div>
                )}
            </section>

            {/* Inventory Settings */}
            <section>
                <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={20} /> Inventario
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Configura el comportamiento del inventario al vender productos.
                </p>

                <Card style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} /> Comportamiento sin Stock
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Qué hace el sistema cuando un producto no tiene stock suficiente.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {([
                            { value: 'allow' as const, label: 'Permitir venta sin stock', desc: 'La venta se procesa normalmente aunque no haya stock. El stock puede quedar en negativo.' },
                            { value: 'alert' as const, label: 'Mostrar alerta', desc: 'La venta se procesa pero se muestra una alerta al usuario indicando stock bajo o agotado.' },
                        ]).map(opt => (
                            <label
                                key={opt.value}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                                    border: `1.5px solid ${outOfStockBehavior === opt.value ? 'var(--primary-color)' : 'var(--divider-color)'}`,
                                    background: outOfStockBehavior === opt.value ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                <input
                                    type="radio"
                                    name="outOfStock"
                                    checked={outOfStockBehavior === opt.value}
                                    onChange={() => handleOutOfStockChange(opt.value)}
                                    style={{ marginTop: '2px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{opt.label}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </Card>
            </section>
        </div>
    );
}
