import { useState, useEffect } from 'react';
import { BarChart3, ArrowLeft, Search, Download, DollarSign, ShoppingBag, CalendarCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
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
    const { user } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams();

    // Date Range State (default: last 7 days)
    const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Data State
    const [closures, setClosures] = useState<ClosureRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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

    const handleExportHistorical = async () => {
        if (!user?.restaurantId || closures.length === 0) return;

        setIsExporting(true);
        try {
            // 1. Fetch orders and filter in clinical to avoid Composite Index errors
            const q = query(
                collection(db, 'orders'),
                where('restaurantId', '==', user.restaurantId)
            );

            const snapshot = await getDocs(q);
            const startRange = new Date(fromDate);
            const endRange = new Date(toDate + 'T23:59:59');

            const orders = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    return { id: doc.id, ...data, createdAt } as any;
                })
                .filter(order => {
                    const isPaid = order.status === 'paid';
                    const isInRange = order.createdAt >= startRange && order.createdAt <= endRange;
                    return isPaid && isInRange;
                });

            // 2. Aggregate metrics from closures
            const summaryMetrics = {
                totalSales,
                orderCount: totalOrders,
                salesByWaiter: {} as Record<string, number>,
                salesByPaymentMethod: {} as Record<string, number>
            };

            closures.forEach(c => {
                Object.entries(c.salesByWaiter || {}).forEach(([waiter, amount]) => {
                    summaryMetrics.salesByWaiter[waiter] = (summaryMetrics.salesByWaiter[waiter] || 0) + amount;
                });
                Object.entries(c.salesByPaymentMethod || {}).forEach(([method, amount]) => {
                    summaryMetrics.salesByPaymentMethod[method] = (summaryMetrics.salesByPaymentMethod[method] || 0) + amount;
                });
            });

            // 3. Export
            const periodLabel = `${format(parseISO(fromDate), 'dd/MM/yyyy')} - ${format(parseISO(toDate), 'dd/MM/yyyy')}`;
            await exportDailySalesToExcel(summaryMetrics, orders, periodLabel);

        } catch (error) {
            console.error("Error exporting historical data:", error);
            alert("Error al exportar los datos. Intente nuevamente.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportSingleDay = async (closure: ClosureRecord) => {
        if (!user?.restaurantId) return;

        try {
            // 1. Fetch orders for this specific day
            const q = query(
                collection(db, 'orders'),
                where('restaurantId', '==', user.restaurantId)
            );

            const snapshot = await getDocs(q);
            const date = parseISO(closure.date);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const orders = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    return { id: doc.id, ...data, createdAt } as any;
                })
                .filter(order => {
                    const isPaid = order.status === 'paid';
                    const isInRange = order.createdAt >= startOfDay && order.createdAt <= endOfDay;
                    return isPaid && isInRange;
                });

            // 2. Metrics for the single day
            const metrics = {
                totalSales: closure.totalSales,
                orderCount: closure.orderCount,
                salesByWaiter: closure.salesByWaiter || {},
                salesByPaymentMethod: closure.salesByPaymentMethod || {}
            };

            // 3. Export
            const periodLabel = format(parseISO(closure.date), 'dd/MM/yyyy');
            await exportDailySalesToExcel(metrics, orders, periodLabel);

        } catch (error) {
            console.error("Error exporting daily data:", error);
            alert("Error al exportar el reporte del día.");
        }
    };

    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={32} className="text-primary" /> Reportes Históricos
                    </h1>
                    <p>Consulta de ventas por rango de fechas</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={18} /> Volver
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
                    <Button onClick={fetchClosures} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isLoading ? 'Cargando...' : <><Search size={18} /> Buscar</>}
                    </Button>
                </div>
            </Card>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <Card style={{ padding: '1.75rem', textAlign: 'center', borderTop: '4px solid var(--primary-color)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <DollarSign size={16} /> Total Ventas
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        S/ {totalSales.toFixed(2)}
                    </div>
                </Card>
                <Card style={{ padding: '1.75rem', textAlign: 'center', borderTop: '4px solid var(--success-color)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <ShoppingBag size={16} /> Total Pedidos
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--success-color)', letterSpacing: '-0.02em' }}>
                        {totalOrders}
                    </div>
                </Card>
                <Card style={{ padding: '1.75rem', textAlign: 'center', borderTop: '4px solid var(--secondary-hover)', boxShadow: 'var(--shadow-md)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <CalendarCheck size={16} /> Días con Cierre
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: '900', color: 'var(--primary-color)', letterSpacing: '-0.02em' }}>
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
                            onClick={handleExportHistorical}
                            disabled={isExporting}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Download size={16} /> {isExporting ? 'Generando Excel...' : 'Exportar Detalles (Excel)'}
                        </Button>
                    )}
                </div>

                {closures.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        No se encontraron cierres en el rango seleccionado.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--divider-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Fecha</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Pedidos</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Responsable</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {closures.map(closure => (
                                    <tr key={closure.id} style={{ borderBottom: '1px solid var(--divider-color)', transition: 'background-color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                                            {format(parseISO(closure.date), 'dd MMM yyyy', { locale: es })}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{closure.orderCount}</td>
                                        <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.1rem' }}>
                                            S/ {closure.totalSales.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                            {closure.createdByName || 'Admin'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleExportSingleDay(closure)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                                                title="Exportar día a Excel"
                                            >
                                                <Download size={16} /> Excel
                                            </Button>
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
