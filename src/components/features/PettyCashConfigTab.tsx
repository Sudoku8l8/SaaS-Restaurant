import { useState, useEffect } from 'react';
import { Card, Button, Input } from '@/components/shared';
import { Wallet, Save, RotateCcw, ShieldCheck, Camera, DollarSign, UserCheck } from 'lucide-react';
import { useTenant } from '@/app/providers/TenantProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

const DEFAULTS = {
    maxPerExpense: 20,
    maxDailyPerUser: 50,
    enableAutoApproval: true,
    requireReceipt: false,
};

export function PettyCashConfigTab() {
    const { tenant } = useTenant();
    const currentConfig = tenant?.config?.pettyCash;

    const [config, setConfig] = useState({
        maxPerExpense: currentConfig?.maxPerExpense ?? DEFAULTS.maxPerExpense,
        maxDailyPerUser: currentConfig?.maxDailyPerUser ?? DEFAULTS.maxDailyPerUser,
        enableAutoApproval: currentConfig?.enableAutoApproval ?? DEFAULTS.enableAutoApproval,
        requireReceipt: currentConfig?.requireReceipt ?? DEFAULTS.requireReceipt,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Sync when tenant config changes
    useEffect(() => {
        if (currentConfig) {
            setConfig({
                maxPerExpense: currentConfig.maxPerExpense ?? DEFAULTS.maxPerExpense,
                maxDailyPerUser: currentConfig.maxDailyPerUser ?? DEFAULTS.maxDailyPerUser,
                enableAutoApproval: currentConfig.enableAutoApproval ?? DEFAULTS.enableAutoApproval,
                requireReceipt: currentConfig.requireReceipt ?? DEFAULTS.requireReceipt,
            });
        }
    }, [currentConfig]);

    const handleSave = async () => {
        if (!tenant?.id) return;
        setIsSaving(true);
        setSaved(false);
        try {
            await updateDoc(doc(db, 'restaurants', tenant.id), {
                'config.pettyCash': {
                    maxPerExpense: config.maxPerExpense,
                    maxDailyPerUser: config.maxDailyPerUser,
                    enableAutoApproval: config.enableAutoApproval,
                    requireReceipt: config.requireReceipt,
                }
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving petty cash config:', error);
            alert('❌ Error al guardar configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setConfig({ ...DEFAULTS });
    };

    const hasChanges = JSON.stringify(config) !== JSON.stringify({
        maxPerExpense: currentConfig?.maxPerExpense ?? DEFAULTS.maxPerExpense,
        maxDailyPerUser: currentConfig?.maxDailyPerUser ?? DEFAULTS.maxDailyPerUser,
        enableAutoApproval: currentConfig?.enableAutoApproval ?? DEFAULTS.enableAutoApproval,
        requireReceipt: currentConfig?.requireReceipt ?? DEFAULTS.requireReceipt,
    });

    return (
        <div>
            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.25rem' }}>
                    <Wallet size={22} color="#f59e0b" /> Configuración de Caja Chica
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Define las reglas de aprobación automática y límites de gasto para tu equipo.
                </p>
            </div>

            {/* Success Banner */}
            {saved && (
                <div style={{
                    background: 'rgba(16,185,129,0.08)', color: '#10b981',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem', border: '1px solid rgba(16,185,129,0.2)',
                    fontWeight: '600', fontSize: '0.88rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    ✅ Configuración guardada exitosamente
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                gap: '1.25rem',
            }}>
                {/* Límites de Gasto */}
                <Card style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: '800' }}>
                        <DollarSign size={18} color="var(--primary-color)" /> Límites de Gasto
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <Input
                                label="Máximo por gasto individual (S/)"
                                type="number"
                                min={0}
                                step={1}
                                value={config.maxPerExpense.toString()}
                                onChange={e => setConfig({ ...config, maxPerExpense: parseFloat(e.target.value) || 0 })}
                            />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>
                                Gastos hasta este monto se aprobarán automáticamente (si está habilitado).
                            </p>
                        </div>

                        <div>
                            <Input
                                label="Máximo diario por usuario (S/)"
                                type="number"
                                min={0}
                                step={1}
                                value={config.maxDailyPerUser.toString()}
                                onChange={e => setConfig({ ...config, maxDailyPerUser: parseFloat(e.target.value) || 0 })}
                            />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>
                                Límite total de gastos aprobados por turno para cada usuario.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Reglas de Aprobación */}
                <Card style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: '800' }}>
                        <ShieldCheck size={18} color="#8b5cf6" /> Reglas de Aprobación
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Auto-Approval Toggle */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: config.enableAutoApproval ? 'rgba(16,185,129,0.04)' : 'transparent',
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <UserCheck size={16} color={config.enableAutoApproval ? '#10b981' : 'var(--text-secondary)'} />
                                    Aprobación Automática
                                </div>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                    Si un gasto está dentro de los límites, se aprueba sin intervención del admin.
                                </p>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0, marginLeft: '1rem' }}>
                                <input
                                    type="checkbox"
                                    checked={config.enableAutoApproval}
                                    onChange={e => setConfig({ ...config, enableAutoApproval: e.target.checked })}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', inset: 0,
                                    backgroundColor: config.enableAutoApproval ? '#10b981' : '#ccc',
                                    borderRadius: '28px', transition: 'all 0.3s',
                                }}>
                                    <span style={{
                                        position: 'absolute', content: '""',
                                        height: '22px', width: '22px',
                                        left: config.enableAutoApproval ? '25px' : '3px', bottom: '3px',
                                        backgroundColor: 'white', borderRadius: '50%',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }} />
                                </span>
                            </label>
                        </div>

                        {/* Require Receipt Toggle */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: config.requireReceipt ? 'rgba(37,99,235,0.04)' : 'transparent',
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Camera size={16} color={config.requireReceipt ? 'var(--primary-color)' : 'var(--text-secondary)'} />
                                    Comprobante Obligatorio
                                </div>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                    Requiere adjuntar foto del comprobante al registrar un gasto.
                                </p>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0, marginLeft: '1rem' }}>
                                <input
                                    type="checkbox"
                                    checked={config.requireReceipt}
                                    onChange={e => setConfig({ ...config, requireReceipt: e.target.checked })}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', inset: 0,
                                    backgroundColor: config.requireReceipt ? 'var(--primary-color)' : '#ccc',
                                    borderRadius: '28px', transition: 'all 0.3s',
                                }}>
                                    <span style={{
                                        position: 'absolute', content: '""',
                                        height: '22px', width: '22px',
                                        left: config.requireReceipt ? '25px' : '3px', bottom: '3px',
                                        backgroundColor: 'white', borderRadius: '50%',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }} />
                                </span>
                            </label>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Description info */}
            <Card style={{
                padding: '1.25rem', marginTop: '1.25rem',
                borderRadius: 'var(--radius-xl)',
                background: 'rgba(37,99,235,0.03)',
                border: '1px solid rgba(37,99,235,0.1)',
            }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    📋 ¿Cómo funciona?
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>👑 Admin:</strong> Registra gastos directos, aprueba/rechaza solicitudes pendientes, y cierra la caja chica.
                    </p>
                    <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>👔 Encargado de Turno:</strong> Puede registrar gastos (respetando los límites) y ver todos los movimientos del día.
                    </p>
                    <p style={{ margin: 0 }}>
                        <strong style={{ color: 'var(--text-primary)' }}>🍽️ Mozo / 👨‍🍳 Cocina:</strong> Solo pueden solicitar gastos. Si el monto está dentro de los límites, se aprueba automáticamente.
                    </p>
                </div>
            </Card>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button
                    variant="ghost"
                    onClick={handleReset}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    <RotateCcw size={16} /> Restaurar Valores
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        opacity: (!hasChanges && !isSaving) ? 0.5 : 1,
                    }}
                >
                    <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </div>
    );
}
