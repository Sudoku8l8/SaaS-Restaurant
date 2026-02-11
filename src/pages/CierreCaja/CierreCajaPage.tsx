import { useState, useEffect } from 'react';
import { parseISO } from 'date-fns';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDailySales } from '@/hooks/useDailySales';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { Card, Button, Badge } from '@/components/shared';
import { Download, ArrowLeft, CheckCircle, AlertTriangle, Check, Lock, DollarSign, CreditCard, User } from 'lucide-react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

import { exportDailySalesToExcel } from '@/services/exportExcel';
import { getPeruDateString, getPeruNow, formatPeruDisplay } from '@/utils/dateUtils';

export function CierreCajaPage() {
    const navigate = useNavigate();
    const { restaurantSlug } = useParams();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? parseISO(dateParam) : new Date();
    const targetDateStr = getPeruDateString(targetDate);

    const { user } = useAuth();
    const { metrics, orders, isLoading: loadingMetrics } = useDailySales(targetDate);
    const { activeOrders } = useOrders(); // Reuse useOrders to check for pending orders
    const [isClosing, setIsClosing] = useState(false);
    const [existingClosure, setExistingClosure] = useState<boolean>(false);
    const [checkingClosure, setCheckingClosure] = useState(true);

    // Check if there is already a closure for the target date
    useEffect(() => {
        const checkClosure = async () => {
            if (!user?.restaurantId) return;

            const q = query(
                collection(db, 'closures'),
                where('restaurantId', '==', user.restaurantId),
                where('date', '==', targetDateStr),
            );

            try {
                const snapshot = await getDocs(q);
                setExistingClosure(!snapshot.empty);
            } catch (error) {
                console.error("Error checking closure:", error);
            } finally {
                setCheckingClosure(false);
            }
        };
        checkClosure();
    }, [user?.restaurantId]);

    if (loadingMetrics || checkingClosure) return <div className="p-4">Verificando estado de caja...</div>;

    // Validation State
    const hasPendingOrders = activeOrders.length > 0;
    const canClose = !hasPendingOrders && !existingClosure && metrics.orderCount > 0;

    const handleCloseBox = async () => {
        if (!canClose) return;

        if (!confirm('¿Estás seguro de CERRAR CAJA?\nEsta acción es irreversible y bloqueará las ventas del día.')) {
            return;
        }

        // Double confirmation
        if (!confirm('CONFIRMACIÓN FINAL:\n\nTotal a Declarar: S/ ' + metrics.totalSales.toFixed(2) + '\n\n¿Proceder?')) {
            return;
        }

        setIsClosing(true);
        try {
            const closureData = {
                restaurantId: user?.restaurantId,
                date: targetDateStr,
                totalSales: metrics.totalSales,
                orderCount: metrics.orderCount,
                salesByWaiter: metrics.salesByWaiter,
                salesByPaymentMethod: metrics.salesByPaymentMethod,
                createdAt: getPeruNow(),
                createdBy: user?.id,
                createdByName: user?.name
            };

            await addDoc(collection(db, 'closures'), closureData);

            setExistingClosure(true);
            alert(`✅ Caja Cerrada Correctamente\n\nFecha: ${targetDateStr}\nTotal: S/ ${metrics.totalSales}`);

        } catch (error) {
            console.error("Error creating closure:", error);
            alert("❌ Error al cerrar caja. Intente nuevamente.");
        } finally {
            setIsClosing(false);
        }
    };

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Cierre de Caja</h1>
                    <p>Resumen del día: <strong>{formatPeruDisplay(targetDate)}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => exportDailySalesToExcel(metrics, orders)}
                        disabled={metrics.orderCount === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Download size={18} /> Exportar Excel
                    </Button>
                    <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={18} /> Volver
                    </Button>
                </div>
            </header>

            {/* Validation Alerts */}
            {existingClosure && (
                <div style={{
                    background: 'var(--surface-color)',
                    color: 'var(--success-color)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border-color)',
                    borderLeft: '5px solid var(--success-color)',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <CheckCircle size={22} />
                    <span style={{ fontWeight: '600' }}>
                        <strong style={{ textTransform: 'uppercase', marginRight: '0.5rem' }}>Caja Cerrada:</strong>
                        Ya se ha realizado el cierre de esta fecha ({formatPeruDisplay(targetDate)}). Todas las operaciones están bloqueadas.
                    </span>
                </div>
            )}

            {hasPendingOrders && (
                <div style={{
                    background: 'var(--surface-color)',
                    color: 'var(--danger-color)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--border-color)',
                    borderLeft: '5px solid var(--danger-color)',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <AlertTriangle size={22} />
                    <span style={{ fontWeight: '600' }}>
                        <strong style={{ textTransform: 'uppercase', marginRight: '0.5rem' }}>Imposible Cerrar:</strong>
                        Hay {activeOrders.length} pedidos activos. Debes cerrarlos o cancelarlos antes del cierre.
                    </span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>

                {/* Resumen General */}
                <Card style={{ padding: '2rem', borderTop: '5px solid var(--primary-color)', boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <DollarSign size={28} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ margin: 0, fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '1rem' }}>Total Recaudado</h3>
                    </div>
                    <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
                        S/ {metrics.totalSales.toFixed(2)}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: '700', marginTop: '0.5rem', fontSize: '1.1rem' }}>{metrics.orderCount} pedidos atendidos</p>
                </Card>

                {/* Desglose por Medio de Pago */}
                <Card style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.75rem' }}>
                        <CreditCard size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Medios de Pago</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(metrics.salesByPaymentMethod).length === 0 && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin movimientos</p>}

                        {Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => (
                            <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.5rem' }}>
                                <Badge variant="neutral" style={{ textTransform: 'capitalize', fontWeight: '700', fontSize: '0.75rem' }}>{method}</Badge>
                                <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>S/ {amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Desglose por Mozo */}
                <Card style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.75rem' }}>
                        <User size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ margin: 0, fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Rendimiento Mozos</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(metrics.salesByWaiter).length === 0 && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin movimientos</p>}

                        {Object.entries(metrics.salesByWaiter).map(([waiter, amount]) => (
                            <div key={waiter} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--divider-color)', paddingBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{waiter}</span>
                                <strong style={{ color: 'var(--primary-color)', fontWeight: '800' }}>S/ {amount.toFixed(2)}</strong>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Acciones de Cierre */}
            <div style={{ textAlign: 'center', marginTop: '4rem', padding: '3rem 2rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', fontWeight: '700' }}>
                    <AlertTriangle size={20} style={{ color: 'var(--danger-color)' }} /> Al cerrar caja se bloquearán permanentemente las ventas de este día.
                </p>
                <Button
                    variant="primary"
                    onClick={handleCloseBox}
                    disabled={isClosing || !canClose}
                    style={{
                        fontSize: '1.25rem',
                        padding: '1.25rem 3rem',
                        opacity: !canClose && !existingClosure ? 0.4 : 1,
                        cursor: !canClose ? 'not-allowed' : 'pointer',
                        backgroundColor: existingClosure ? 'var(--success-color)' : 'var(--danger-color)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: '800',
                        boxShadow: '0 8px 20px rgba(230, 57, 70, 0.2)'
                    }}
                >
                    {existingClosure ? (
                        <><Check size={22} style={{ marginRight: '0.5rem' }} /> CAJA CERRADA EXITOSAMENTE</>
                    ) : (
                        isClosing ? 'PROCESANDO...' : <><Lock size={22} style={{ marginRight: '0.5rem' }} /> CERRAR CAJA AHORA</>
                    )}
                </Button>
            </div>
        </div>
    );
}
