import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Input } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { usePettyCash } from '@/hooks/usePettyCash';
import {
    ArrowLeft, Wallet, Plus, Clock, CheckCircle, XCircle, AlertTriangle,
    Eye, Camera, Send, X, ShieldCheck, FileText, TrendingDown,
    ChevronDown, ChevronUp, Image as ImageIcon
} from 'lucide-react';
import { PettyCashExpenseStatus as PCStatus, PettyCashCategory, UserRole } from '@/types';
import type { PettyCashExpense, PettyCashCategory as PCCategoryType } from '@/types';
import { formatPeruDisplay } from '@/utils/dateUtils';

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    [PCStatus.PENDING]: { label: 'Pendiente', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', icon: <Clock size={14} /> },
    [PCStatus.AUTO_APPROVED]: { label: 'Auto-Aprobado', color: '#10b981', bg: 'rgba(16,185,129,0.10)', icon: <ShieldCheck size={14} /> },
    [PCStatus.APPROVED]: { label: 'Aprobado', color: '#22c55e', bg: 'rgba(34,197,94,0.10)', icon: <CheckCircle size={14} /> },
    [PCStatus.REJECTED]: { label: 'Rechazado', color: '#ef4444', bg: 'rgba(239,68,68,0.10)', icon: <XCircle size={14} /> },
    [PCStatus.OBSERVED]: { label: 'Observado', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', icon: <Eye size={14} /> },
};

const CATEGORY_ICONS: Record<string, string> = {
    'Ingredientes': '🥬',
    'Gas': '🔥',
    'Limpieza': '🧹',
    'Transporte': '🚗',
    'Insumos': '📦',
    'Otro': '📋',
};

export function CajaChicaPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        expenses, isLoading, summary, config, pettyCashBalance, currentSession,
        requestExpense, approveExpense, rejectExpense, addObservation,
        canRegisterDirectExpense, canApproveExpenses, canViewAllExpenses,
        hasPendingExpenses, isSessionOpen,
    } = usePettyCash();

    // ── Modal states ─────────────────────────────────────────────────────────
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
    const [showObsModal, setShowObsModal] = useState<string | null>(null);
    const [showReceiptImage, setShowReceiptImage] = useState<string | null>(null);
    const [expandedExpense, setExpandedExpense] = useState<string | null>(null);

    // Expense form
    const [formData, setFormData] = useState({ amount: '', description: '', category: PettyCashCategory.INGREDIENTS as PCCategoryType });
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [obsNote, setObsNote] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Loading state ────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Cargando Caja Chica...</p>
            </div>
        );
    }

    if (!currentSession) {
        return (
            <div className="container mt-md bg-mesh" style={{ maxWidth: '480px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Button variant="ghost" onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Volver
                </Button>
                <Card className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
                        width: '80px', height: '80px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem', border: '2px solid rgba(245,158,11,0.15)'
                    }}>
                        <Wallet size={36} color="#f59e0b" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Caja Chica</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        No hay una sesión de caja abierta hoy.<br />
                        Primero debes <strong>abrir la caja</strong> desde el Cierre de Caja.
                    </p>
                    <Button fullWidth onClick={() => navigate(-1)} style={{ marginTop: '1.5rem' }}>
                        Ir a Cierre de Caja
                    </Button>
                </Card>
            </div>
        );
    }

    // ── File handling ────────────────────────────────────────────────────────
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            const reader = new FileReader();
            reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const clearReceipt = () => {
        setReceiptFile(null);
        setReceiptPreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Submit expense ───────────────────────────────────────────────────────
    const handleSubmitExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0 || !formData.description.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await requestExpense({
                amount,
                description: formData.description.trim(),
                category: formData.category,
                receiptFile: receiptFile || undefined,
            });

            setShowExpenseModal(false);
            setFormData({ amount: '', description: '', category: PettyCashCategory.INGREDIENTS });
            clearReceipt();

            if (result.autoApproved) {
                alert('✅ Gasto registrado y aprobado automáticamente.');
            } else {
                alert('📋 Solicitud de gasto registrada. Pendiente de aprobación del admin.');
            }
        } catch (error) {
            console.error('Error registrando gasto:', error);
            alert('❌ Error al registrar el gasto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Admin actions ────────────────────────────────────────────────────────
    const handleApprove = async (id: string) => {
        if (!confirm('¿Aprobar este gasto?')) return;
        try {
            await approveExpense(id);
        } catch (error) {
            alert('❌ Error al aprobar.');
        }
    };

    const handleReject = async () => {
        if (!showRejectModal || !rejectReason.trim()) return;
        try {
            await rejectExpense(showRejectModal, rejectReason.trim());
            setShowRejectModal(null);
            setRejectReason('');
        } catch (error) {
            alert('❌ Error al rechazar.');
        }
    };

    const handleObservation = async () => {
        if (!showObsModal || !obsNote.trim()) return;
        try {
            await addObservation(showObsModal, obsNote.trim());
            setShowObsModal(null);
            setObsNote('');
        } catch (error) {
            alert('❌ Error al agregar observación.');
        }
    };

    // Filter expenses for non-admin roles
    const visibleExpenses = canViewAllExpenses
        ? expenses
        : expenses.filter(e => e.requestedBy === user?.id);

    // Balance health indicator
    const openingBalance = currentSession?.openingBalance || 0;
    const balancePercent = openingBalance > 0 ? (pettyCashBalance / openingBalance) * 100 : 100;
    const balanceHealth = balancePercent > 50 ? 'healthy' : balancePercent > 20 ? 'warning' : 'critical';
    const balanceColors = {
        healthy: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
        warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    }[balanceHealth];

    const isClosed = currentSession?.status === 'closed';

    // ── MAIN RENDER ──────────────────────────────────────────────────────────
    return (
        <div className="container mt-md bg-mesh" style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            {/* ── HEADER ── */}
            <header style={{
                marginBottom: '1.5rem', paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--divider-color)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)} size="sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <ArrowLeft size={16} /> Volver
                    </Button>
                    {!isClosed && isSessionOpen && (
                        <button
                            onClick={() => setShowExpenseModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.55rem 1rem', borderRadius: 'var(--radius-md)',
                                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                color: 'white', border: 'none', cursor: 'pointer',
                                fontWeight: '700', fontSize: '0.85rem',
                                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Plus size={16} />
                            <span className="btn-label">
                                {canRegisterDirectExpense ? 'Registrar Gasto' : 'Solicitar Gasto'}
                            </span>
                        </button>
                    )}
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: '900', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
                        <Wallet size={28} style={{ color: 'var(--primary-color)' }} />
                        Caja Chica
                    </h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {formatPeruDisplay(new Date())} · <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</span>
                        <Badge variant="neutral" style={{ marginLeft: '0.5rem', fontSize: '0.7rem', textTransform: 'capitalize' }}>
                            {user?.role === UserRole.SHIFT_MANAGER ? 'Encargado' : user?.role}
                        </Badge>
                    </p>
                </div>
            </header>

            {/* ── SESSION CLOSED BANNER ── */}
            {isClosed && (
                <div className="glass-card" style={{
                    color: 'var(--success-color)',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.25rem',
                    borderLeft: '5px solid var(--success-color)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <CheckCircle size={20} style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        La caja del día fue cerrada. Los movimientos son de solo lectura.
                    </span>
                </div>
            )}

            {/* ── PENDING ALERT ── */}
            {canApproveExpenses && hasPendingExpenses && (
                <div className="glass-card" style={{
                    color: 'var(--accent-amber)',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.25rem',
                    borderLeft: '5px solid var(--accent-amber)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                    <AlertTriangle size={20} style={{ flexShrink: 0, color: 'var(--accent-amber)' }} />
                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        Tienes <strong>{summary.countPending}</strong> solicitud{summary.countPending !== 1 ? 'es' : ''} pendiente{summary.countPending !== 1 ? 's' : ''} de aprobación (S/ {summary.totalPending.toFixed(2)}).
                    </span>
                </div>
            )}

            {/* ── METRICS GRID ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                gap: '1rem', marginBottom: '2rem'
            }}>
                {/* Saldo Card */}
                <Card className="glass-card" style={{
                    padding: '1.5rem',
                    borderTop: `4px solid ${balanceColors.color}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                            background: `${balanceColors.color}20`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <Wallet size={20} style={{ color: balanceColors.color }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>
                            Saldo Disponible
                        </h3>
                    </div>
                    <div style={{
                        fontSize: 'clamp(2rem, 7vw, 2.8rem)', fontWeight: '900',
                        color: balanceColors.color, letterSpacing: '-0.03em', lineHeight: '1.1',
                        marginBottom: '0.75rem'
                    }}>
                        S/ {pettyCashBalance.toFixed(2)}
                    </div>
                    {/* Mini balance bar */}
                    <div style={{ background: 'rgba(0,0,0,0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                        <div style={{
                            width: `${Math.max(0, Math.min(100, balancePercent))}%`,
                            height: '100%', borderRadius: '3px',
                            background: balanceColors.color,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Fondo inicial: S/ {openingBalance.toFixed(2)}
                    </div>
                </Card>

                {/* Gastos del Día */}
                <Card className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(239,68,68,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <TrendingDown size={18} style={{ color: 'var(--danger-color)' }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Resumen del Día</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--success-color)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle size={14} /> Aprobados ({summary.countApproved})
                            </span>
                            <strong>S/ {summary.totalApproved.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#f59e0b' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Clock size={14} /> Pendientes ({summary.countPending})
                            </span>
                            <strong>S/ {summary.totalPending.toFixed(2)}</strong>
                        </div>
                        {summary.countRejected > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--danger-color)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <XCircle size={14} /> Rechazados ({summary.countRejected})
                                </span>
                                <strong>S/ {summary.totalRejected.toFixed(2)}</strong>
                            </div>
                        )}
                        <div style={{ borderTop: '1px dashed var(--divider-color)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Tu gasto hoy</span>
                            <strong style={{ color: 'var(--text-primary)' }}>S/ {summary.userDailyTotal.toFixed(2)} / {config.maxDailyPerUser.toFixed(2)}</strong>
                        </div>
                    </div>
                </Card>

                {/* Reglas Card */}
                <Card className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(139,92,246,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                            <ShieldCheck size={18} style={{ color: '#8b5cf6' }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Reglas Automáticas</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Máx. por gasto</span>
                            <Badge variant="neutral" style={{ fontWeight: '800' }}>S/ {config.maxPerExpense.toFixed(2)}</Badge>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Máx. diario/usuario</span>
                            <Badge variant="neutral" style={{ fontWeight: '800' }}>S/ {config.maxDailyPerUser.toFixed(2)}</Badge>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Auto-aprobación</span>
                            <Badge variant={config.enableAutoApproval ? 'success' : 'error'} style={{ fontWeight: '700' }}>
                                {config.enableAutoApproval ? '✓ Activa' : '✗ Inactiva'}
                            </Badge>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Comprobante</span>
                            <Badge variant="neutral" style={{ fontWeight: '700' }}>
                                {config.requireReceipt ? 'Obligatorio' : 'Opcional'}
                            </Badge>
                        </div>
                    </div>
                </Card>
            </div>

            {/* ── EXPENSE LIST ── */}
            <Card className="glass-card" style={{ padding: 'clamp(1rem, 4vw, 2rem)' }}>
                <h3 style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '1.25rem', fontSize: '1rem', fontWeight: '800',
                    borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.75rem'
                }}>
                    <FileText size={20} style={{ color: 'var(--primary-color)' }} />
                    Movimientos de Hoy
                    <Badge variant="neutral" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                        {visibleExpenses.length}
                    </Badge>
                </h3>

                {visibleExpenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: 'rgba(37,99,235,0.08)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem'
                        }}>
                            <FileText size={28} color="var(--primary-color)" style={{ opacity: 0.5 }} />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '600', margin: 0 }}>
                            No hay movimientos registrados hoy
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.3rem 0 0', opacity: 0.7 }}>
                            Los gastos de caja chica aparecerán aquí
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {visibleExpenses.map((expense) => (
                            <ExpenseItem
                                key={expense.id}
                                expense={expense}
                                isExpanded={expandedExpense === expense.id}
                                onToggle={() => setExpandedExpense(expandedExpense === expense.id ? null : expense.id)}
                                canApprove={canApproveExpenses}
                                onApprove={() => handleApprove(expense.id)}
                                onReject={() => setShowRejectModal(expense.id)}
                                onObserve={() => setShowObsModal(expense.id)}
                                onViewReceipt={(url) => setShowReceiptImage(url)}
                                isClosed={isClosed}
                            />
                        ))}
                    </div>
                )}
            </Card>

            {/* ── EXPENSE MODAL ── */}
            {showExpenseModal && (
                <ModalOverlay onClose={() => setShowExpenseModal(false)}>
                    <Card className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                            <Plus size={22} color="var(--primary-color)" />
                            {canRegisterDirectExpense ? 'Registrar Gasto' : 'Solicitar Gasto'}
                        </h3>
                        <form onSubmit={handleSubmitExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <Input
                                label="Monto (S/)"
                                type="number"
                                required
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                            {/* Auto-approval hint */}
                            {formData.amount && parseFloat(formData.amount) > 0 && (
                                <div style={{
                                    fontSize: '0.78rem', padding: '0.5rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: parseFloat(formData.amount) <= config.maxPerExpense
                                        ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                    color: parseFloat(formData.amount) <= config.maxPerExpense
                                        ? '#10b981' : '#f59e0b',
                                    fontWeight: '600',
                                }}>
                                    {parseFloat(formData.amount) <= config.maxPerExpense
                                        ? '✓ Dentro del límite — se aprobará automáticamente'
                                        : '⏳ Excede el límite — requerirá aprobación del admin'
                                    }
                                </div>
                            )}
                            <Input
                                label="Descripción"
                                placeholder="Ej: Compra de gas para cocina"
                                required
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                            <div>
                                <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                                    Categoría
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as PCCategoryType })}
                                    style={{
                                        width: '100%', padding: '0.65rem 0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        background: 'var(--surface-color)',
                                        color: 'var(--text-primary)',
                                        fontSize: '0.9rem', fontWeight: '600',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {Object.values(PettyCashCategory).map(cat => (
                                        <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Receipt upload */}
                            <div>
                                <label style={{ display: 'block', fontWeight: '700', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                                    Comprobante {config.requireReceipt ? '(Obligatorio)' : '(Opcional)'}
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                {receiptPreview ? (
                                    <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                        <img src={receiptPreview} alt="Comprobante" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={clearReceipt}
                                            style={{
                                                position: 'absolute', top: '0.5rem', right: '0.5rem',
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: 'rgba(0,0,0,0.6)', color: 'white',
                                                border: 'none', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '100%', padding: '1.25rem',
                                            border: '2px dashed var(--border-color)',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'var(--background-color)',
                                            cursor: 'pointer', display: 'flex',
                                            flexDirection: 'column', alignItems: 'center',
                                            gap: '0.4rem', color: 'var(--text-secondary)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <Camera size={24} style={{ opacity: 0.5 }} />
                                        <span style={{ fontSize: '0.82rem', fontWeight: '600' }}>
                                            Tomar foto o seleccionar imagen
                                        </span>
                                    </button>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <Button type="button" variant="ghost" onClick={() => setShowExpenseModal(false)} style={{ flex: 1 }}>
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSubmitting || (config.requireReceipt && !receiptFile)}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                >
                                    {isSubmitting ? 'Enviando...' : <><Send size={16} /> Enviar</>}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </ModalOverlay>
            )}

            {/* ── REJECT MODAL ── */}
            {showRejectModal && (
                <ModalOverlay onClose={() => { setShowRejectModal(null); setRejectReason(''); }}>
                    <Card className="glass-card" style={{ width: '100%', maxWidth: '380px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                            <XCircle size={22} color="var(--danger-color)" /> Rechazar Gasto
                        </h3>
                        <Input
                            label="Motivo del rechazo"
                            placeholder="Ej: Gasto no autorizado"
                            required
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <Button variant="ghost" onClick={() => { setShowRejectModal(null); setRejectReason(''); }} style={{ flex: 1 }}>Cancelar</Button>
                            <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim()} style={{ flex: 1 }}>Rechazar</Button>
                        </div>
                    </Card>
                </ModalOverlay>
            )}

            {/* ── OBSERVATION MODAL ── */}
            {showObsModal && (
                <ModalOverlay onClose={() => { setShowObsModal(null); setObsNote(''); }}>
                    <Card className="glass-card" style={{ width: '100%', maxWidth: '380px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem' }}>
                            <Eye size={22} color="#8b5cf6" /> Agregar Observación
                        </h3>
                        <Input
                            label="Nota / Observación"
                            placeholder="Ej: Verificar monto con factura"
                            required
                            value={obsNote}
                            onChange={e => setObsNote(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <Button variant="ghost" onClick={() => { setShowObsModal(null); setObsNote(''); }} style={{ flex: 1 }}>Cancelar</Button>
                            <Button variant="primary" onClick={handleObservation} disabled={!obsNote.trim()} style={{ flex: 1 }}>Guardar</Button>
                        </div>
                    </Card>
                </ModalOverlay>
            )}

            {/* ── RECEIPT IMAGE VIEWER ── */}
            {showReceiptImage && (
                <ModalOverlay onClose={() => setShowReceiptImage(null)}>
                    <div style={{ maxWidth: '90vw', maxHeight: '85vh', position: 'relative' }}>
                        <img
                            src={showReceiptImage}
                            alt="Comprobante"
                            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}
                        />
                        <button
                            onClick={() => setShowReceiptImage(null)}
                            style={{
                                position: 'absolute', top: '-12px', right: '-12px',
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: 'var(--danger-color)', color: 'white',
                                border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: 'var(--shadow-md)',
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </ModalOverlay>
            )}

            {/* ── Responsive CSS ── */}
            <style>{`
                @media (max-width: 480px) {
                    .btn-label { display: none; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

// ── Sub-Components ───────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem',
            }}
        >
            {children}
        </div>
    );
}

interface ExpenseItemProps {
    expense: PettyCashExpense;
    isExpanded: boolean;
    onToggle: () => void;
    canApprove: boolean;
    onApprove: () => void;
    onReject: () => void;
    onObserve: () => void;
    onViewReceipt: (url: string) => void;
    isClosed: boolean;
}

function ExpenseItem({ expense, isExpanded, onToggle, canApprove, onApprove, onReject, onObserve, onViewReceipt, isClosed }: ExpenseItemProps) {
    const statusConf = STATUS_CONFIG[expense.status] || STATUS_CONFIG[PCStatus.PENDING];
    const time = new Date(expense.requestedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const isPending = expense.status === PCStatus.PENDING;

    return (
        <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
            boxShadow: isExpanded ? 'var(--shadow-md)' : 'none',
        }}>
            {/* Main row */}
            <div
                onClick={onToggle}
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.85rem 1rem', cursor: 'pointer',
                    background: isExpanded ? 'var(--glass-bg)' : 'transparent',
                    transition: 'background 0.15s',
                }}
            >
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                    {CATEGORY_ICONS[expense.category] || '📋'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            S/ {expense.amount.toFixed(2)}
                        </span>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                            fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.45rem',
                            borderRadius: '4px', color: statusConf.color, background: statusConf.bg,
                        }}>
                            {statusConf.icon} {statusConf.label}
                        </span>
                    </div>
                    <p style={{
                        margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {expense.description}
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{time}</span>
                    {isExpanded ? <ChevronUp size={16} color="var(--text-secondary)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
                <div style={{
                    padding: '0.75rem 1rem 1rem',
                    borderTop: '1px solid var(--divider-color)',
                    background: 'var(--glass-bg)',
                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                    fontSize: '0.83rem',
                }}>
                    <DetailRow label="Solicitado por" value={`${expense.requestedByName} (${expense.requestedByRole === 'shift_manager' ? 'Encargado' : expense.requestedByRole})`} />
                    <DetailRow label="Categoría" value={`${CATEGORY_ICONS[expense.category] || ''} ${expense.category}`} />
                    <DetailRow label="Descripción" value={expense.description} />
                    {expense.autoApproved && expense.status === PCStatus.AUTO_APPROVED && (
                        <DetailRow label="Aprobación" value="⚡ Automática (dentro de límites)" />
                    )}
                    {expense.approvedByName && (
                        <DetailRow label={expense.status === PCStatus.REJECTED ? 'Rechazado por' : 'Procesado por'} value={expense.approvedByName} />
                    )}
                    {expense.rejectionReason && (
                        <div style={{ background: 'rgba(239,68,68,0.06)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.15)' }}>
                            <span style={{ fontWeight: '700', color: 'var(--danger-color)', fontSize: '0.78rem' }}>Motivo: </span>
                            <span style={{ color: 'var(--text-primary)' }}>{expense.rejectionReason}</span>
                        </div>
                    )}
                    {expense.observation && (
                        <div style={{ background: 'rgba(139,92,246,0.06)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,92,246,0.15)' }}>
                            <span style={{ fontWeight: '700', color: '#8b5cf6', fontSize: '0.78rem' }}>Observación: </span>
                            <span style={{ color: 'var(--text-primary)' }}>{expense.observation}</span>
                        </div>
                    )}
                    {expense.receiptUrl && (
                        <button
                            onClick={() => onViewReceipt(expense.receiptUrl!)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                                background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.15)',
                                color: 'var(--primary-color)', cursor: 'pointer',
                                fontWeight: '700', fontSize: '0.82rem',
                            }}
                        >
                            <ImageIcon size={16} /> Ver Comprobante
                        </button>
                    )}
                    {/* Admin actions */}
                    {canApprove && isPending && !isClosed && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--divider-color)' }}>
                            <button onClick={onApprove} style={actionBtnStyle('#10b981', 'rgba(16,185,129,0.08)')}>
                                <CheckCircle size={14} /> Aprobar
                            </button>
                            <button onClick={onObserve} style={actionBtnStyle('#8b5cf6', 'rgba(139,92,246,0.08)')}>
                                <Eye size={14} /> Observar
                            </button>
                            <button onClick={onReject} style={actionBtnStyle('#ef4444', 'rgba(239,68,68,0.08)')}>
                                <XCircle size={14} /> Rechazar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600', flexShrink: 0 }}>{label}</span>
            <span style={{ color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
        </div>
    );
}

function actionBtnStyle(color: string, bg: string): React.CSSProperties {
    return {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.3rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${color}22`, background: bg, color,
        fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer',
        transition: 'all 0.15s',
    };
}
