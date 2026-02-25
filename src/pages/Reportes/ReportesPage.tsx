import { useState, useEffect, useCallback } from 'react';
import { BarChart3, ArrowLeft, Search, Download, DollarSign, ShoppingBag, CalendarCheck, AlertTriangle, Lock, Clock, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, Badge, Input } from '@/components/shared';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportDailySalesToExcel } from '@/services/exportExcel';
import { getPeruDateString, getPeruNow } from '@/utils/dateUtils';
import { DailyReportPreviewModal } from '@/components/features/DailyReportPreviewModal';

// A "day record" may come from a closure, from raw orders, or both.
interface DayRecord {
    date: string;
    totalSales: number;
    orderCount: number;
    salesByWaiter: Record<string, number>;
    salesByPaymentMethod: Record<string, number>;
    createdByName?: string;
    closureId?: string;              // If undefined → no closure for this day
    closureStatus?: 'open' | 'closed'; // 'open' = session exists but not closed
}

export function ReportesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams();

    // Date Range State (default: last 7 days)
    const [fromDate, setFromDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Data State
    const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [closingDate, setClosingDate] = useState<string | null>(null);
    const [previewRecord, setPreviewRecord] = useState<DayRecord | null>(null);

    // ─── MAIN FETCH ────────────────────────────────────────────────────────────
    // FIX B3: Reads BOTH closures AND raw orders, then merges them.
    // Days with ventas but no closure are shown with a "Sin Cierre" badge.
    const fetchData = useCallback(async () => {
        if (!user?.restaurantId) return;

        setIsLoading(true);
        try {
            // 1. Fetch all closures in range
            const closuresQ = query(
                collection(db, 'closures'),
                where('restaurantId', '==', user.restaurantId),
                where('date', '>=', fromDate),
                where('date', '<=', toDate)
            );
            const closuresSnap = await getDocs(closuresQ);
            const closuresByDate: Record<string, DayRecord> = {};

            closuresSnap.docs.forEach(d => {
                const c = d.data();
                closuresByDate[c.date] = {
                    date: c.date,
                    totalSales: c.totalSales || 0,
                    orderCount: c.orderCount || 0,
                    salesByWaiter: c.salesByWaiter || {},
                    salesByPaymentMethod: c.salesByPaymentMethod || {},
                    createdByName: c.createdByName,
                    closureId: d.id,
                    closureStatus: c.status,
                };
            });

            // 2. Fetch all PAID orders in range to detect days without closure
            const ordersQ = query(
                collection(db, 'orders'),
                where('restaurantId', '==', user.restaurantId),
                where('status', '==', 'paid')
            );
            const ordersSnap = await getDocs(ordersQ);

            // Group orders by Peru date
            const ordersByDate: Record<string, { totalSales: number; orderCount: number; salesByWaiter: Record<string, number>; salesByPaymentMethod: Record<string, number>; }> = {};

            ordersSnap.docs.forEach(d => {
                const data = d.data();
                const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                const dateStr = getPeruDateString(createdAt);

                // Only process dates within the selected range
                if (dateStr < fromDate || dateStr > toDate) return;

                if (!ordersByDate[dateStr]) {
                    ordersByDate[dateStr] = { totalSales: 0, orderCount: 0, salesByWaiter: {}, salesByPaymentMethod: {} };
                }
                const entry = ordersByDate[dateStr];
                entry.totalSales += data.total || 0;
                entry.orderCount += 1;

                const waiter = data.userName || 'Desconocido';
                entry.salesByWaiter[waiter] = (entry.salesByWaiter[waiter] || 0) + (data.total || 0);

                if (data.payments && data.payments.length > 0) {
                    data.payments.forEach((p: any) => {
                        const pm = p.method || 'unknown';
                        entry.salesByPaymentMethod[pm] = (entry.salesByPaymentMethod[pm] || 0) + (p.amount || 0);
                    });
                } else {
                    const pm = data.paymentMethod || 'unknown';
                    entry.salesByPaymentMethod[pm] = (entry.salesByPaymentMethod[pm] || 0) + (data.total || 0);
                }
            });

            // 3. Merge: for dates that have orders but NO closure, create a synthetic record
            Object.entries(ordersByDate).forEach(([date, data]) => {
                if (!closuresByDate[date]) {
                    // Day has sales but no closure document — this is the main bug scenario
                    closuresByDate[date] = {
                        date,
                        totalSales: data.totalSales,
                        orderCount: data.orderCount,
                        salesByWaiter: data.salesByWaiter,
                        salesByPaymentMethod: data.salesByPaymentMethod,
                        closureId: undefined,     // No closure
                        closureStatus: undefined, // No session at all
                    };
                } else if (closuresByDate[date].closureStatus === 'open') {
                    // Session exists (open) → update with live order data for accuracy
                    closuresByDate[date].totalSales = data.totalSales;
                    closuresByDate[date].orderCount = data.orderCount;
                    closuresByDate[date].salesByWaiter = data.salesByWaiter;
                    closuresByDate[date].salesByPaymentMethod = data.salesByPaymentMethod;
                }
            });

            // 4. Sort by date descending
            const sorted = Object.values(closuresByDate).sort((a, b) => b.date.localeCompare(a.date));
            setDayRecords(sorted);
        } catch (error) {
            console.error('Error fetching reports:', error);
            alert('Error al cargar reportes. Verifique los índices de Firestore.');
        } finally {
            setIsLoading(false);
        }
    }, [user?.restaurantId, fromDate, toDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── RETROACTIVE CLOSURE ───────────────────────────────────────────────────
    // Pilar 3: Admin can close a past day that has sales but no closed closure.
    const handleRetroactiveClose = async (record: DayRecord) => {
        if (!user?.restaurantId) return;
        if (!confirm(`¿Cerrar caja retroactivamente para el ${format(parseISO(record.date), 'dd/MM/yyyy', { locale: es })}?\n\nEsto registrará las ventas de ese día en el historial de cierres.`)) return;

        setClosingDate(record.date);
        try {
            if (record.closureId) {
                // Session exists (open) → just mark it closed
                const { updateDoc, doc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'closures', record.closureId), {
                    totalSales: record.totalSales,
                    orderCount: record.orderCount,
                    salesByWaiter: record.salesByWaiter,
                    salesByPaymentMethod: record.salesByPaymentMethod,
                    status: 'closed',
                    closedAt: getPeruNow(),
                    retroactiveClosure: true,
                });
            } else {
                // No session at all → create and close right away
                await addDoc(collection(db, 'closures'), {
                    restaurantId: user.restaurantId,
                    date: record.date,
                    openingBalance: 0,
                    totalSales: record.totalSales,
                    orderCount: record.orderCount,
                    salesByWaiter: record.salesByWaiter,
                    salesByPaymentMethod: record.salesByPaymentMethod,
                    expenses: [],
                    status: 'closed',
                    createdAt: getPeruNow(),
                    createdBy: user.id,
                    createdByName: user.name,
                    closedAt: getPeruNow(),
                    retroactiveClosure: true,
                    autoCreated: true,
                });
            }
            await fetchData();
        } catch (err) {
            console.error('Error closing retroactively:', err);
            alert('Error al realizar el cierre retroactivo.');
        } finally {
            setClosingDate(null);
        }
    };

    // ─── EXPORTS ───────────────────────────────────────────────────────────────
    const totalSales = dayRecords.reduce((sum, r) => sum + r.totalSales, 0);
    const totalOrders = dayRecords.reduce((sum, r) => sum + r.orderCount, 0);
    const closedDays = dayRecords.filter(r => r.closureStatus === 'closed').length;

    const handleExportHistorical = async () => {
        if (!user?.restaurantId || dayRecords.length === 0) return;
        setIsExporting(true);
        try {
            const q = query(collection(db, 'orders'), where('restaurantId', '==', user.restaurantId));
            const snapshot = await getDocs(q);
            const startRange = new Date(fromDate);
            const endRange = new Date(toDate + 'T23:59:59');

            const orders = snapshot.docs
                .map(d => {
                    const data = d.data();
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    return { id: d.id, ...data, createdAt } as any;
                })
                .filter(o => o.status === 'paid' && o.createdAt >= startRange && o.createdAt <= endRange);

            const summaryMetrics = {
                totalSales,
                orderCount: totalOrders,
                salesByWaiter: {} as Record<string, number>,
                salesByPaymentMethod: {} as Record<string, number>
            };
            dayRecords.forEach(r => {
                Object.entries(r.salesByWaiter || {}).forEach(([w, a]) => {
                    summaryMetrics.salesByWaiter[w] = (summaryMetrics.salesByWaiter[w] || 0) + a;
                });
                Object.entries(r.salesByPaymentMethod || {}).forEach(([m, a]) => {
                    summaryMetrics.salesByPaymentMethod[m] = (summaryMetrics.salesByPaymentMethod[m] || 0) + a;
                });
            });

            const periodLabel = `${format(parseISO(fromDate), 'dd/MM/yyyy')} - ${format(parseISO(toDate), 'dd/MM/yyyy')}`;
            await exportDailySalesToExcel(summaryMetrics, orders, periodLabel);
        } catch (err) {
            console.error('Error exporting:', err);
            alert('Error al exportar los datos.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportSingleDay = async (record: DayRecord) => {
        if (!user?.restaurantId) return;
        try {
            const q = query(collection(db, 'orders'), where('restaurantId', '==', user.restaurantId));
            const snapshot = await getDocs(q);
            const date = parseISO(record.date);
            const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

            const orders = snapshot.docs
                .map(d => {
                    const data = d.data();
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    return { id: d.id, ...data, createdAt } as any;
                })
                .filter(o => o.status === 'paid' && o.createdAt >= startOfDay && o.createdAt <= endOfDay);

            const metrics = {
                totalSales: record.totalSales,
                orderCount: record.orderCount,
                salesByWaiter: record.salesByWaiter || {},
                salesByPaymentMethod: record.salesByPaymentMethod || {}
            };
            await exportDailySalesToExcel(metrics, orders, format(date, 'dd/MM/yyyy'));
        } catch (err) {
            console.error('Error exporting day:', err);
            alert('Error al exportar el reporte del día.');
        }
    };

    // ─── STATUS BADGE HELPER ───────────────────────────────────────────────────
    const StatusBadge = ({ record }: { record: DayRecord }) => {
        if (record.closureStatus === 'closed') {
            return <Badge variant="success" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><Lock size={11} /> Cerrada</Badge>;
        }
        if (record.closureStatus === 'open') {
            return <Badge variant="warning" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#fef3c7', color: '#92400e' }}><Clock size={11} /> Abierta</Badge>;
        }
        // No closure at all
        return <Badge variant="error" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#fee2e2', color: '#991b1b' }}><AlertTriangle size={11} /> Sin Cierre</Badge>;
    };

    // ─── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div className="container mt-md">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={32} className="text-primary" /> Reportes Históricos
                    </h1>
                    <p>Ventas por rango de fechas — incluyendo días sin cierre de caja</p>
                </div>
                <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={18} /> Volver
                </Button>
            </header>

            {/* Filter Section */}
            <Card style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Desde</label>
                        <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Hasta</label>
                        <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                    </div>
                    <Button onClick={fetchData} disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                        {closedDays}
                    </div>
                </Card>
            </div>

            {/* Info Banner for unclosed days */}
            {dayRecords.some(r => r.closureStatus !== 'closed') && (
                <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    borderLeft: '5px solid #f59e0b',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#92400e',
                    fontSize: '0.9rem'
                }}>
                    <AlertTriangle size={20} style={{ flexShrink: 0 }} />
                    <span>
                        <strong>Días sin cierre detectados.</strong> Las ventas están guardadas correctamente en el sistema.
                        Usa el botón <strong>"Cerrar Retroactivo"</strong> para regularizar los cierres pendientes.
                    </span>
                </div>
            )}

            {/* Records Table */}
            <Card style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ margin: 0 }}>Historial de Ventas</h3>
                    {dayRecords.length > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleExportHistorical}
                            disabled={isExporting}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Download size={16} /> {isExporting ? 'Generando Excel...' : 'Exportar Todo (Excel)'}
                        </Button>
                    )}
                </div>

                {dayRecords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        No se encontraron ventas en el rango seleccionado.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--divider-color)', textAlign: 'left' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Fecha</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Estado</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Pedidos</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '800', fontSize: '0.9rem', textTransform: 'uppercase' }}>Responsable</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayRecords.map(record => (
                                    <tr
                                        key={record.date}
                                        style={{ borderBottom: '1px solid var(--divider-color)', transition: 'background-color 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                                            {format(parseISO(record.date), 'dd MMM yyyy', { locale: es })}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <StatusBadge record={record} />
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{record.orderCount}</td>
                                        <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.1rem' }}>
                                            S/ {record.totalSales.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                            {record.createdByName || (record.closureId ? 'Admin' : '—')}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPreviewRecord(record)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', color: 'var(--primary-color)' }}
                                                title="Ver Detalle"
                                            >
                                                <Eye size={16} /> Ver
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleExportSingleDay(record)}
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                                                title="Exportar día a Excel"
                                            >
                                                <Download size={16} /> Excel
                                            </Button>
                                            {/* Pilar 3: Retroactive close button for unclosed days (HIDDEN FOR TODAY) */}
                                            {record.closureStatus !== 'closed' && record.orderCount > 0 && record.date !== getPeruDateString() && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleRetroactiveClose(record)}
                                                    disabled={closingDate === record.date}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                                                    title="Registrar cierre retroactivo para regularizar este día"
                                                >
                                                    <Lock size={14} /> {closingDate === record.date ? 'Cerrando...' : 'Cerrar Retroactivo'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Preview Modal */}
            {previewRecord && user?.restaurantId && (
                <DailyReportPreviewModal
                    restaurantId={user.restaurantId}
                    record={previewRecord}
                    onClose={() => setPreviewRecord(null)}
                />
            )}
        </div>
    );
}
