import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useDailySales } from '@/hooks/useDailySales';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useCashSession } from '@/hooks/useCashSession';
import { Card, Button, Badge, Input } from '@/components/shared';
import { Download, ArrowLeft, CheckCircle, AlertTriangle, Check, Lock, DollarSign, CreditCard, User, Wallet, List, ExternalLink } from 'lucide-react';
import { updateDoc, doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase/config';
import { exportDailySalesToExcel } from '@/services/exportExcel';
import type { PettyCashExportItem } from '@/services/exportExcel';
import { getPeruDateString, getPeruNow, formatPeruDisplay } from '@/utils/dateUtils';

export function CierreCajaPage() {
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? parseISO(dateParam) : new Date();
    const targetDateStr = getPeruDateString(targetDate);

    const { user } = useAuth();
    const { metrics, orders, isLoading: loadingMetrics } = useDailySales(targetDate);
    const { activeOrders } = useOrders();
    const { currentSession, isLoading: loadingSession, openSession } = useCashSession();
    const restaurantId = user?.restaurantId || '';

    // Petty Cash integration
    const [pettyCashPendingCount, setPettyCashPendingCount] = useState(0);
    const [pettyCashApprovedTotal, setPettyCashApprovedTotal] = useState(0);
    const [pettyCashExpenseItems, setPettyCashExpenseItems] = useState<PettyCashExportItem[]>([]);

    const [isClosing, setIsClosing] = useState(false);
    const [openingBalanceInput, setOpeningBalanceInput] = useState('');

    const [actualCashInput, setActualCashInput] = useState('');

    const isToday = targetDateStr === getPeruDateString();
    const sessionExists = !!currentSession;
    const isClosed = currentSession?.status === 'closed';

    // Listen to petty cash expenses for this date
    useEffect(() => {
        if (!restaurantId || !targetDateStr) return;

        const q = query(
            collection(db, 'pettyCashExpenses'),
            where('restaurantId', '==', restaurantId),
            where('date', '==', targetDateStr)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let pending = 0;
            let approved = 0;
            const expenseItems: PettyCashExportItem[] = [];
            snapshot.docs.forEach(d => {
                const data = d.data();
                if (data.status === 'pending') pending++;
                if (data.status === 'auto_approved' || data.status === 'approved') {
                    approved += data.amount || 0;
                }
                // Capture all expenses (approved/auto-approved) for Excel export
                if (data.status === 'auto_approved' || data.status === 'approved') {
                    expenseItems.push({
                        category: data.category || 'Otro',
                        description: data.description || '',
                        amount: data.amount || 0,
                        requestedByName: data.requestedByName || 'Desconocido',
                        status: data.status,
                    });
                }
            });
            setPettyCashPendingCount(pending);
            setPettyCashApprovedTotal(approved);
            setPettyCashExpenseItems(expenseItems);
        });

        return () => unsubscribe();
    }, [restaurantId, targetDateStr]);

    if (loadingMetrics || loadingSession) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Cargando estado financiero...</p>
            </div>
        );
    }

    const hasPendingOrders = activeOrders.length > 0;
    const canClose = !hasPendingOrders && sessionExists && !isClosed;

    const handleCloseBox = async () => {
        if (!canClose || !currentSession?.id) return;

        const actualCash = parseFloat(actualCashInput);
        if (isNaN(actualCash)) {
            alert('Por favor, ingrese el efectivo físico en caja.');
            return;
        }
        if (!confirm('¿Estás seguro de CERRAR CAJA?\nEsta acción es irreversible y bloqueará las ventas del día.')) return;

        setIsClosing(true);
        try {
            const totalCashSales = Object.entries(metrics.salesByPaymentMethod)
                .filter(([method]) => ['cash', 'efectivo'].includes(method.toLowerCase()))
                .reduce((sum, [_, amount]) => sum + amount, 0);
            const expectedCash = (currentSession.openingBalance || 0) + totalCashSales - pettyCashApprovedTotal;
            const difference = actualCash - expectedCash;

            await updateDoc(doc(db, 'closures', currentSession.id), {
                totalSales: metrics.totalSales,
                orderCount: metrics.orderCount,
                salesByWaiter: metrics.salesByWaiter,
                salesByPaymentMethod: metrics.salesByPaymentMethod,
                expectedCash,
                actualCash,
                difference,
                status: 'closed',
                closedAt: getPeruNow()
            });
            alert(`✅ Caja Cerrada Correctamente\n\nDiferencia: S/ ${difference.toFixed(2)}`);
        } catch (error) {
            console.error('Error closing box:', error);
            alert('❌ Error al cerrar caja.');
        } finally {
            setIsClosing(false);
        }
    };



    // ── APERTURA DE CAJA ─────────────────────────────────────────────────────
    if (isToday && !sessionExists) {
        return (
            <div className="container mt-md" style={{ maxWidth: '480px' }}>
                <Button variant="ghost" onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Volver
                </Button>
                <Card style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.06))',
                        width: '80px', height: '80px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem', border: '2px solid rgba(37,99,235,0.15)'
                    }}>
                        <Wallet size={36} color="var(--primary-color)" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Apertura de Caja</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                        Para registrar ventas hoy <strong>({formatPeruDisplay(targetDate)})</strong>, abre la caja con el monto inicial en efectivo.
                    </p>
                    <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <Input
                            label="Monto Inicial (S/)"
                            type="number"
                            placeholder="0.00"
                            value={openingBalanceInput}
                            onChange={e => setOpeningBalanceInput(e.target.value)}
                        />
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                            Puedes ingresar 0 si no tienes efectivo en caja.
                        </p>
                    </div>
                    <Button fullWidth onClick={() => openSession(parseFloat(openingBalanceInput) || 0)} style={{ fontWeight: '700', fontSize: '1rem' }}>
                        Abrir Caja Ahora
                    </Button>
                    <Button variant="ghost" fullWidth onClick={() => navigate(-1)} style={{ marginTop: '0.75rem' }}>
                        Cancelar
                    </Button>
                </Card>
            </div>
        );
    }

    // ── MAIN LAYOUT ──────────────────────────────────────────────────────────
    return (
        <div className="container mt-md">

            {/* ── RESPONSIVE HEADER ── */}
            <header style={{
                marginBottom: '1.5rem',
                paddingBottom: '1.25rem',
                borderBottom: '1px solid var(--divider-color)'
            }}>
                {/* Top row: back button + action buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <Button variant="ghost" onClick={() => navigate(-1)} size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <ArrowLeft size={16} /> Volver
                    </Button>

                    {/* Action buttons — icon-only on mobile, labeled on desktop */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>

                        <button
                            onClick={() => exportDailySalesToExcel(metrics, orders, undefined, pettyCashExpenseItems.length > 0 ? pettyCashExpenseItems : undefined)}
                            disabled={metrics.orderCount === 0}
                            title="Exportar Excel"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)',
                                background: 'var(--surface-color)', color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)', cursor: metrics.orderCount === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: '700', fontSize: '0.82rem', opacity: metrics.orderCount === 0 ? 0.5 : 1,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Download size={15} />
                            <span className="btn-label">Excel</span>
                        </button>
                    </div>
                </div>

                {/* Title block */}
                <div>
                    <h1 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: '900', lineHeight: 1.2 }}>
                        Cierre de Caja
                    </h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Resumen del día: <strong style={{ color: 'var(--text-primary)' }}>{formatPeruDisplay(targetDate)}</strong>
                    </p>
                </div>
            </header>

            {/* ── ALERTS ── */}
            {isClosed && (
                <div style={{
                    background: 'var(--surface-color)', color: 'var(--success-color)',
                    padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.25rem', border: '1px solid var(--border-color)',
                    borderLeft: '5px solid var(--success-color)',
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        <strong style={{ textTransform: 'uppercase', marginRight: '0.4rem' }}>Caja Cerrada:</strong>
                        Arqueo finalizado para el {formatPeruDisplay(targetDate)}. Operaciones bloqueadas.
                    </span>
                </div>
            )}

            {hasPendingOrders && (
                <div style={{
                    background: 'var(--surface-color)', color: 'var(--danger-color)',
                    padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.25rem', border: '1px solid var(--border-color)',
                    borderLeft: '5px solid var(--danger-color)',
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        <strong style={{ textTransform: 'uppercase', marginRight: '0.4rem' }}>Imposible Cerrar:</strong>
                        Hay {activeOrders.length} pedido{activeOrders.length !== 1 ? 's' : ''} activo{activeOrders.length !== 1 ? 's' : ''}.
                        Debes cerrarlos antes del cierre.
                    </span>
                </div>
            )}

            {/* Petty Cash Pending Warning */}
            {pettyCashPendingCount > 0 && !isClosed && (
                <div style={{
                    background: 'rgba(245,158,11,0.08)', color: '#b45309',
                    padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.25rem', border: '1px solid rgba(245,158,11,0.2)',
                    borderLeft: '5px solid #f59e0b',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '0.75rem', flexWrap: 'wrap',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Wallet size={20} color="#f59e0b" />
                        <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                            <strong>{pettyCashPendingCount}</strong> gasto{pettyCashPendingCount !== 1 ? 's' : ''} de caja chica pendiente{pettyCashPendingCount !== 1 ? 's' : ''} de aprobación.
                        </span>
                    </div>
                    <button
                        onClick={() => navigate(`/${restaurantSlug}/caja-chica`)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)',
                            background: '#f59e0b', color: 'white', border: 'none',
                            cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem',
                        }}
                    >
                        Revisar <ExternalLink size={14} />
                    </button>
                </div>
            )}

            {/* Caja Chica Quick Access */}
            {isToday && sessionExists && !isClosed && (
                <div style={{
                    background: 'rgba(37,99,235,0.05)',
                    padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.25rem', border: '1px solid rgba(37,99,235,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '0.75rem', flexWrap: 'wrap',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Wallet size={18} color="var(--primary-color)" />
                        <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            Caja Chica: <strong style={{ color: 'var(--danger-color)' }}>S/ {pettyCashApprovedTotal.toFixed(2)}</strong> en gastos aprobados hoy
                        </span>
                    </div>
                    <button
                        onClick={() => navigate(`/${restaurantSlug}/caja-chica`)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)',
                            background: 'var(--primary-color)', color: 'white', border: 'none',
                            cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem',
                        }}
                    >
                        Ir a Caja Chica <ExternalLink size={14} />
                    </button>
                </div>
            )}

            {/* ── METRICS GRID ── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {/* Total Recaudado */}
                <Card style={{ padding: '1.5rem', borderTop: '4px solid var(--primary-color)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <DollarSign size={20} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8rem' }}>Total Recaudado</h3>
                    </div>
                    <div style={{ fontSize: 'clamp(2.2rem, 8vw, 3.2rem)', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '1rem' }}>
                        S/ {metrics.totalSales.toFixed(2)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--divider-color)', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            <span>Monto Inicial</span>
                            <strong style={{ color: 'var(--text-primary)' }}>S/ {currentSession?.openingBalance?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-color)', fontSize: '0.88rem' }}>
                            <span>Ventas (Solo Efectivo)</span>
                            <strong>+ S/ {Object.entries(metrics.salesByPaymentMethod).filter(([m]) => ['cash', 'efectivo'].includes(m.toLowerCase())).reduce((s, [_, a]) => s + a, 0).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-color)', fontSize: '0.88rem' }}>
                            <span>Gastos Caja Chica</span>
                            <strong>- S/ {pettyCashApprovedTotal.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginTop: '0.25rem', paddingTop: '0.4rem', borderTop: '1px dashed var(--divider-color)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Pedidos</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{metrics.orderCount}</strong>
                        </div>
                    </div>
                </Card>

                {/* Medios de Pago */}
                <Card style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CreditCard size={18} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Medios de Pago</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {Object.entries(metrics.salesByPaymentMethod).length === 0
                            ? <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.88rem', margin: 0 }}>Sin movimientos</p>
                            : Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => (
                                <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.5rem' }}>
                                    <Badge variant="neutral" style={{ textTransform: 'capitalize', fontWeight: '700', fontSize: '0.75rem' }}>{method}</Badge>
                                    <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '0.95rem' }}>S/ {amount.toFixed(2)}</span>
                                </div>
                            ))
                        }
                    </div>
                </Card>

                {/* Rendimiento Mozos */}
                <Card style={{ padding: '1.5rem', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={18} style={{ color: 'var(--primary-color)' }} />
                        </div>
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Rendimiento Mozos</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {Object.entries(metrics.salesByWaiter).length === 0
                            ? <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.88rem', margin: 0 }}>Sin movimientos</p>
                            : Object.entries(metrics.salesByWaiter).map(([waiter, amount]) => (
                                <div key={waiter} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{waiter}</span>
                                    <strong style={{ color: 'var(--primary-color)', fontWeight: '800', fontSize: '0.95rem' }}>S/ {amount.toFixed(2)}</strong>
                                </div>
                            ))
                        }
                    </div>
                </Card>
            </div>

            {/* ── CIERRE SECTION ── */}
            <Card style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>
                {!isClosed ? (
                    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1rem', fontWeight: '800' }}>
                            <List size={20} style={{ color: 'var(--primary-color)' }} /> Arqueo de Efectivo
                        </h3>

                        <div style={{ background: 'var(--background-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)', marginBottom: '1.5rem' }}>
                            <Input
                                label="Efectivo Físico en Caja (S/)"
                                type="number"
                                placeholder="Cuenta el dinero físico..."
                                value={actualCashInput}
                                onChange={e => setActualCashInput(e.target.value)}
                            />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                                Ingresa el total en efectivo para calcular diferencias.
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                            <AlertTriangle size={16} style={{ color: 'var(--danger-color)', flexShrink: 0 }} />
                            Al cerrar caja se bloquearán las ventas del día.
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleCloseBox}
                            disabled={isClosing || !canClose}
                            fullWidth
                            style={{
                                fontSize: 'clamp(0.95rem, 3vw, 1.1rem)',
                                padding: '1rem',
                                opacity: !canClose ? 0.4 : 1,
                                cursor: !canClose ? 'not-allowed' : 'pointer',
                                backgroundColor: 'var(--danger-color)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '800',
                                boxShadow: canClose ? '0 6px 16px rgba(230, 57, 70, 0.25)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}
                        >
                            {isClosing ? 'PROCESANDO...' : <><Lock size={18} /> CERRAR CAJA Y TERMINAR DÍA</>}
                        </Button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <Badge variant="success" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={18} /> CAJA CERRADA EXITOSAMENTE
                            </Badge>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: '1rem',
                            maxWidth: '480px', margin: '0 auto'
                        }}>
                            {[
                                { label: 'Efectivo (Sistema)', value: `S/ ${currentSession?.expectedCash?.toFixed(2) ?? '—'}` },
                                { label: 'Efectivo Físico', value: `S/ ${currentSession?.actualCash?.toFixed(2) ?? '—'}` },
                                {
                                    label: 'Diferencia',
                                    value: `S/ ${currentSession?.difference?.toFixed(2) ?? '—'}`,
                                    color: (currentSession?.difference || 0) < 0 ? 'var(--danger-color)' : 'var(--success-color)'
                                }
                            ].map(({ label, value, color }) => (
                                <div key={label} style={{ background: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700', margin: '0 0 0.4rem', letterSpacing: '0.04em' }}>{label}</p>
                                    <p style={{ fontSize: '1.3rem', fontWeight: '900', margin: 0, color: color || 'var(--text-primary)' }}>{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>



            {/* Inline CSS for responsive label hiding */}
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
