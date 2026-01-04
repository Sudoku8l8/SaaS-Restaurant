import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Input } from '@/components/shared';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportDailySalesToExcel } from '@/services/exportExcel';

interface ClosureRecord {
    id: string;
    date: string;
    totalSales: number;
    orderCount: number;
    salesByWaiter: Record<string, number>;
    salesByPaymentMethod: Record<string, number>;
    createdByName: string;
}

export function ReportesPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Date Range State (default: last 7 days)
    const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Data State
    const [closures, setClosures] = useState<ClosureRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchClosures = async () => {
        if (!user?.restaurantId) return;

        setIsLoading(true);
        try {
            const q = query(
                collection(db, 'closures'),
                where('restaurantId', '==', user.restaurantId),
                where('date', '>=', fromDate),
                where('date', '<=', toDate)
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ClosureRecord));

            // Sort by date descending
            data.sort((a, b) => b.date.localeCompare(a.date));
            setClosures(data);
        } catch (error) {
            console.error("Error fetching closures:", error);
            alert("Error al cargar reportes. Verifique los índices de Firestore.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClosures();
    }, [user?.restaurantId]);

    // Calculate totals
    const totalSales = closures.reduce((sum, c) => sum + c.totalSales, 0);
    const totalOrders = closures.reduce((sum, c) => sum + c.orderCount, 0);

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>📊 Reportes Históricos</h1>
                    <p>Consulta de ventas por rango de fechas</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate('/admin')}>
                        ← Volver
                    </Button>
                    <Button variant="secondary" onClick={logout}>
                        Salir
                    </Button>
                </div>
            </header>

            {/* Filter Section */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Desde</label>
                        <Input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Hasta</label>
                        <Input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                        />
                    </div>
                    <Button onClick={fetchClosures} disabled={isLoading}>
                        {isLoading ? 'Cargando...' : '🔍 Buscar'}
                    </Button>
                </div>
            </Card>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid var(--color-primary)' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Ventas</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        S/ {totalSales.toFixed(2)}
                    </div>
                </Card>
                <Card style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #27ae60' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Pedidos</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
                        {totalOrders}
                    </div>
                </Card>
                <Card style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #8e44ad' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Días con Cierre</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8e44ad' }}>
                        {closures.length}
                    </div>
                </Card>
            </div>

            {/* Closures Table */}
            <Card style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>Historial de Cierres</h3>
                    {closures.length > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                // Export summary of all closures
                                const summaryMetrics: {
                                    totalSales: number;
                                    orderCount: number;
                                    salesByWaiter: Record<string, number>;
                                    salesByPaymentMethod: Record<string, number>;
                                } = {
                                    totalSales,
                                    orderCount: totalOrders,
                                    salesByWaiter: {},
                                    salesByPaymentMethod: {}
                                };
                                // Aggregate waiter and payment data
                                closures.forEach(c => {
                                    Object.entries(c.salesByWaiter || {}).forEach(([waiter, amount]) => {
                                        summaryMetrics.salesByWaiter[waiter] = (summaryMetrics.salesByWaiter[waiter] || 0) + amount;
                                    });
                                    Object.entries(c.salesByPaymentMethod || {}).forEach(([method, amount]) => {
                                        summaryMetrics.salesByPaymentMethod[method] = (summaryMetrics.salesByPaymentMethod[method] || 0) + amount;
                                    });
                                });
                                exportDailySalesToExcel(summaryMetrics, []);
                            }}
                        >
                            📥 Exportar Resumen
                        </Button>
                    )}
                </div>

                {closures.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        No se encontraron cierres en el rango seleccionado.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Fecha</th>
                                    <th style={{ padding: '0.75rem' }}>Pedidos</th>
                                    <th style={{ padding: '0.75rem' }}>Total</th>
                                    <th style={{ padding: '0.75rem' }}>Cerrado por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {closures.map(closure => (
                                    <tr key={closure.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            {format(parseISO(closure.date), 'dd MMM yyyy', { locale: es })}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{closure.orderCount}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                                            S/ {closure.totalSales.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '0.75rem', color: '#666' }}>
                                            {closure.createdByName || 'Admin'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
