import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDailySales } from '@/hooks/useDailySales';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { Card, Button, Badge } from '@/components/shared';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

import { exportDailySalesToExcel } from '@/services/exportExcel';

export function CierreCajaPage() {
    const navigate = useNavigate();
    const { restaurantSlug } = useParams();
    const { user } = useAuth();
    const { metrics, orders, isLoading: loadingMetrics } = useDailySales();
    const { activeOrders } = useOrders(); // Reuse useOrders to check for pending orders
    const [isClosing, setIsClosing] = useState(false);
    const [existingClosure, setExistingClosure] = useState<boolean>(false);
    const [checkingClosure, setCheckingClosure] = useState(true);

    // Check if there is already a closure for today
    useEffect(() => {
        const checkClosure = async () => {
            if (!user?.restaurantId) return;

            // We store date as string YYYY-MM-DD to easily check "day equality" or timestamp.
            // Let's assume we store 'date' string in closure for query simplicity.
            const todayStr = new Date().toISOString().split('T')[0];

            const q = query(
                collection(db, 'closures'),
                where('restaurantId', '==', user.restaurantId),
                where('date', '==', todayStr),
                // limit(1) // Limits are always good
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
            const todayStr = new Date().toISOString().split('T')[0];

            const closureData = {
                restaurantId: user?.restaurantId,
                date: todayStr,
                totalSales: metrics.totalSales,
                orderCount: metrics.orderCount,
                salesByWaiter: metrics.salesByWaiter,
                salesByPaymentMethod: metrics.salesByPaymentMethod,
                createdAt: new Date(),
                createdBy: user?.id,
                createdByName: user?.name
            };

            await addDoc(collection(db, 'closures'), closureData);

            setExistingClosure(true);
            alert(`✅ Caja Cerrada Correctamente\n\nFecha: ${todayStr}\nTotal: S/ ${metrics.totalSales}`);

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
                    <p>Resumen del Día - {new Date().toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                        variant="secondary"
                        onClick={() => exportDailySalesToExcel(metrics, orders)}
                        disabled={metrics.orderCount === 0}
                    >
                        📥 Exportar Excel
                    </Button>
                    <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)}>
                        ← Volver
                    </Button>
                </div>
            </header>

            {/* Validation Alerts */}
            {existingClosure && (
                <div style={{ background: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #c3e6cb' }}>
                    ✅ <strong>Caja Cerrada:</strong> Ya se ha realizado el cierre de hoy. No se pueden realizar más operaciones.
                </div>
            )}

            {hasPendingOrders && (
                <div style={{ background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f5c6cb' }}>
                    ⚠️ <strong>Imposible Cerrar:</strong> Hay {activeOrders.length} pedidos activos (sin pagar). Debes cerrarlos o cancelarlos antes del cierre de caja.
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* Resumen General */}
                <Card style={{ padding: '1.5rem', borderLeft: '5px solid var(--color-primary)' }}>
                    <h3>Total Ventas</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        S/ {metrics.totalSales.toFixed(2)}
                    </div>
                    <p style={{ color: '#666' }}>{metrics.orderCount} pedidos atendidos</p>
                </Card>

                {/* Desglose por Medio de Pago */}
                <Card style={{ padding: '1.5rem' }}>
                    <h3>Medios de Pago</h3>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {Object.entries(metrics.salesByPaymentMethod).length === 0 && <p className="text-secondary">Sin movimientos</p>}

                        {Object.entries(metrics.salesByPaymentMethod).map(([method, amount]) => (
                            <div key={method} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                <Badge variant="neutral" style={{ textTransform: 'capitalize' }}>{method}</Badge>
                                <span style={{ fontWeight: 'bold' }}>S/ {amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Desglose por Mozo */}
                <Card style={{ padding: '1.5rem' }}>
                    <h3>Ventas por Mozo</h3>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {Object.entries(metrics.salesByWaiter).length === 0 && <p className="text-secondary">Sin movimientos</p>}

                        {Object.entries(metrics.salesByWaiter).map(([waiter, amount]) => (
                            <div key={waiter} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                <span>{waiter}</span>
                                <strong>S/ {amount.toFixed(2)}</strong>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Acciones de Cierre */}
            <div style={{ textAlign: 'center', marginTop: '3rem', padding: '2rem', background: '#fff', borderRadius: '8px', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
                <p style={{ marginBottom: '1rem', color: '#666' }}>
                    ⚠️ Al cerrar caja se bloquearán las operaciones de venta para este día.
                </p>
                <Button
                    variant="danger"
                    onClick={handleCloseBox}
                    disabled={isClosing || !canClose}
                    style={{ fontSize: '1.2rem', padding: '1rem 2rem', opacity: !canClose ? 0.5 : 1, cursor: !canClose ? 'not-allowed' : 'pointer' }}
                >
                    {existingClosure ? '✅ CAJA CERRADA' : (isClosing ? 'Cerrando...' : '🔒 OBLIGATORIO: CERRAR CAJA')}
                </Button>
            </div>
        </div>
    );
}
