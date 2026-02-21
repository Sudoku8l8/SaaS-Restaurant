import { useState } from 'react';
import { parseISO } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDailySales } from '@/hooks/useDailySales';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useCashSession } from '@/hooks/useCashSession';
import { Card, Button, Badge, Input } from '@/components/shared';
import { Download, ArrowLeft, CheckCircle, AlertTriangle, Check, Lock, DollarSign, CreditCard, User, Wallet, MinusCircle, List } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/services/firebase/config';

import { exportDailySalesToExcel } from '@/services/exportExcel';
import { getPeruDateString, getPeruNow, formatPeruDisplay } from '@/utils/dateUtils';

export function CierreCajaPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const targetDate = dateParam ? parseISO(dateParam) : new Date();
    const targetDateStr = getPeruDateString(targetDate);

    useAuth();
    const { metrics, orders, isLoading: loadingMetrics } = useDailySales(targetDate);
    const { activeOrders } = useOrders();
    const { currentSession, isLoading: loadingSession, openSession, addExpense } = useCashSession();

    const [isClosing, setIsClosing] = useState(false);
    const [openingBalanceInput, setOpeningBalanceInput] = useState('');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseData, setExpenseData] = useState({ amount: '', description: '', category: 'General' });
    const [actualCashInput, setActualCashInput] = useState('');

    const isToday = targetDateStr === getPeruDateString();
    const sessionExists = !!currentSession;
    const isClosed = currentSession?.status === 'closed';

    if (loadingMetrics || loadingSession) return <div className="p-4">Cargando estado financiero...</div>;

    // Validation State
    const hasPendingOrders = activeOrders.length > 0;
    const canClose = !hasPendingOrders && sessionExists && !isClosed;

    const handleCloseBox = async () => {
        if (!canClose || !currentSession?.id) return;

        const actualCash = parseFloat(actualCashInput);
        if (isNaN(actualCash)) {
            alert('Por favor, ingrese el efectivo físico en caja.');
            return;
        }

        if (!confirm('¿Estás seguro de CERRAR CAJA?\nEsta acción es irreversible y bloqueará las ventas del día.')) {
            return;
        }

        setIsClosing(true);
        try {
            const totalCashSales = metrics.salesByPaymentMethod['cash'] || 0;
            const totalExpenses = currentSession.expenses?.reduce((acc, e) => acc + e.amount, 0) || 0;
            const expectedCash = (currentSession.openingBalance || 0) + totalCashSales - totalExpenses;
            const difference = actualCash - expectedCash;

            const sessionRef = doc(db, 'closures', currentSession.id);
            await updateDoc(sessionRef, {
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
            console.error("Error closing box:", error);
            alert("❌ Error al cerrar caja.");
        } finally {
            setIsClosing(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(expenseData.amount);
        if (isNaN(amount) || !expenseData.description) return;

        await addExpense({
            amount,
            description: expenseData.description,
            category: expenseData.category
        });

        setIsExpenseModalOpen(false);
        setExpenseData({ amount: '', description: '', category: 'General' });
    };

    // 1. If today and no session -> Screen to OPEN
    if (isToday && !sessionExists) {
        return (
            <div className="container mt-md" style={{ maxWidth: '500px' }}>
                <Card style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(37, 99, 235, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Wallet size={40} color="var(--primary-color)" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Apertura de Caja</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Para comenzar a registrar ventas hoy ({formatPeruDisplay(targetDate)}), primero debes abrir la caja con un monto inicial.
                    </p>

                    <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                        <Input
                            label="Monto Inicial (S/)"
                            type="number"
                            placeholder="0.00"
                            value={openingBalanceInput}
                            onChange={e => setOpeningBalanceInput(e.target.value)}
                        />
                    </div>

                    <Button
                        fullWidth
                        onClick={() => openSession(parseFloat(openingBalanceInput) || 0)}
                        className="animate-pulse"
                    >
                        Abrir Caja Ahora
                    </Button>

                    <Button variant="ghost" fullWidth onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
                        Volver
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Cierre de Caja</h1>
                    <p>Resumen del día: <strong>{formatPeruDisplay(targetDate)}</strong></p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {!isClosed && sessionExists && isToday && (
                        <Button
                            variant="danger"
                            onClick={() => setIsExpenseModalOpen(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <MinusCircle size={18} /> Registrar Gasto
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        onClick={() => exportDailySalesToExcel(metrics, orders)}
                        disabled={metrics.orderCount === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Download size={18} /> Exportar Excel
                    </Button>
                    <Button variant="ghost" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={18} /> Volver
                    </Button>
                </div>
            </header>

            {/* Validation Alerts */}
            {isClosed && (
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
                        Arqueo finalizado para el {formatPeruDisplay(targetDate)}. Todas las operaciones están bloqueadas.
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
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>Monto Inicial:</span>
                            <strong>S/ {currentSession?.openingBalance?.toFixed(2) || '0.00'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-color)' }}>
                            <span>Gastos:</span>
                            <strong>- S/ {(currentSession?.expenses?.reduce((acc, e) => acc + e.amount, 0) || 0).toFixed(2)}</strong>
                        </div>
                    </div>
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
            <div style={{ marginTop: '4rem', padding: '3rem 2rem', background: 'var(--surface-color)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                {!isClosed ? (
                    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ marginBottom: '2.5rem', textAlign: 'left', background: '#f8fafc', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--divider-color)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                                <List size={18} /> Arqueo de Efectivo
                            </h4>
                            <Input
                                label="Efectivo Físico en Caja (S/)"
                                type="number"
                                placeholder="Cuenta el dinero físico..."
                                value={actualCashInput}
                                onChange={e => setActualCashInput(e.target.value)}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                Ingresa el total de dinero en efectivo que tienes físicamente para calcular diferencias.
                            </p>
                        </div>

                        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', fontWeight: '700' }}>
                            <AlertTriangle size={20} style={{ color: 'var(--danger-color)' }} /> Al cerrar caja se bloquearán las ventas de este día.
                        </p>
                        <Button
                            variant="primary"
                            onClick={handleCloseBox}
                            disabled={isClosing || !canClose}
                            style={{
                                fontSize: '1.25rem',
                                padding: '1.25rem 3rem',
                                opacity: !canClose ? 0.4 : 1,
                                cursor: !canClose ? 'not-allowed' : 'pointer',
                                backgroundColor: 'var(--danger-color)',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '800',
                                boxShadow: '0 8px 20px rgba(230, 57, 70, 0.2)',
                                width: '100%'
                            }}
                        >
                            {isClosing ? 'PROCESANDO...' : <><Lock size={22} style={{ marginRight: '0.5rem' }} /> CERRAR CAJA Y TERMINAR DÍA</>}
                        </Button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                            <div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sistema</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '900' }}>S/ {currentSession?.expectedCash?.toFixed(2)}</p>
                            </div>
                            <div style={{ borderLeft: '1px solid var(--divider-color)', paddingLeft: '2rem' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Físico</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '900' }}>S/ {currentSession?.actualCash?.toFixed(2)}</p>
                            </div>
                            <div style={{ borderLeft: '1px solid var(--divider-color)', paddingLeft: '2rem' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Diferencia</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: '900', color: (currentSession?.difference || 0) < 0 ? 'var(--danger-color)' : 'var(--success-color)' }}>
                                    S/ {currentSession?.difference?.toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <Badge variant="success" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                            <Check size={22} style={{ marginRight: '0.5rem' }} /> CAJA CERRADA EXITOSAMENTE
                        </Badge>
                    </div>
                )}
            </div>

            {/* Expenses Modal */}
            {isExpenseModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <Card style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MinusCircle size={24} color="var(--danger-color)" /> Registrar Gasto
                        </h3>
                        <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <Input
                                label="Monto (S/)"
                                type="number"
                                required
                                value={expenseData.amount}
                                onChange={e => setExpenseData({ ...expenseData, amount: e.target.value })}
                            />
                            <Input
                                label="Descripción"
                                placeholder="Ej: Pago a proveedor de gas"
                                required
                                value={expenseData.description}
                                onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsExpenseModalOpen(false)} style={{ flex: 1 }}>Cancelar</Button>
                                <Button type="submit" variant="danger" style={{ flex: 1 }}>Guardar Gasto</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
