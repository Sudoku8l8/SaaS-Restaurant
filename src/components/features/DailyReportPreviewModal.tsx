import { useState, useEffect } from 'react';
import { X, DollarSign, ShoppingBag, Clock, CreditCard, Smartphone, Banknote, User, AlertCircle, FileText } from 'lucide-react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, Badge, Skeleton } from '@/components/shared';
import type { Order } from '@/types';

interface DayRecord {
    date: string;
    totalSales: number;
    orderCount: number;
    salesByWaiter: Record<string, number>;
    salesByPaymentMethod: Record<string, number>;
    createdByName?: string;
    closureId?: string;
    closureStatus?: 'open' | 'closed';
}

interface DailyReportPreviewModalProps {
    restaurantId: string;
    record: DayRecord;
    onClose: () => void;
}

export function DailyReportPreviewModal({ restaurantId, record, onClose }: DailyReportPreviewModalProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // OPT B1: Server-side filter by dateStr + status to avoid downloading all orders
                const q = query(
                    collection(db, 'orders'),
                    where('restaurantId', '==', restaurantId),
                    where('status', '==', 'paid'),
                    where('dateStr', '==', record.date)
                );
                const snapshot = await getDocs(q);

                const paidOrders = snapshot.docs
                    .map(d => {
                        const data = d.data();
                        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                        return { id: d.id, ...data, createdAt } as Order;
                    })
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newer first

                setOrders(paidOrders);
            } catch (err) {
                console.error('Error fetching orders for preview:', err);
                setError('No se pudieron cargar los detalles del día. Por favor, reintente.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [restaurantId, record.date]);

    // Formatters & UI Helpers
    const formattedDate = format(parseISO(record.date), "EEEE, dd 'de' MMMM yyyy", { locale: es });
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    const tkPromedio = record.orderCount > 0 ? record.totalSales / record.orderCount : 0;

    const getPaymentIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'cash': case 'efectivo': return <Banknote size={16} />;
            case 'yape': case 'plin': return <Smartphone size={16} />;
            case 'card': case 'tarjeta': return <CreditCard size={16} />;
            default: return <DollarSign size={16} />;
        }
    };

    const getPaymentLabel = (method: string) => {
        const lower = method.toLowerCase();
        if (lower === 'cash') return 'Efectivo';
        if (lower === 'card') return 'Tarjeta';
        return method.charAt(0).toUpperCase() + method.slice(1);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1200, padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div style={{
                width: '100%', maxWidth: '900px',
                backgroundColor: 'var(--surface-color)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                display: 'flex', flexDirection: 'column',
                maxHeight: '90vh', overflow: 'hidden',
                animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem', borderBottom: '1px solid var(--divider-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(to right, #f8fafc, #ffffff)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                            <FileText size={24} className="text-primary" />
                            Vista Previa del Día
                        </h2>
                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: '500' }}>
                            {capitalizedDate}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'var(--background-color)', border: '1px solid var(--divider-color)',
                        borderRadius: '50%', width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--background-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* General Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '3px solid var(--primary-color)' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <DollarSign size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Ingresos Totales</p>
                                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>S/ {record.totalSales.toFixed(2)}</p>
                            </div>
                        </Card>
                        <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '3px solid var(--success-color)' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Pedidos Pagados</p>
                                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--success-color)' }}>{record.orderCount}</p>
                            </div>
                        </Card>
                        <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '3px solid #f59e0b' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <FileText size={24} />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Ticket Promedio</p>
                                <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>S/ {tkPromedio.toFixed(2)}</p>
                            </div>
                        </Card>
                    </div>

                    {/* Secondary Breakdowns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* By Payment Method */}
                        <Card style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CreditCard size={18} className="text-secondary" /> Ventas por Método
                            </h3>
                            {Object.keys(record.salesByPaymentMethod || {}).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {Object.entries(record.salesByPaymentMethod).map(([method, amount], idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                <div style={{ color: 'var(--text-secondary)' }}>{getPaymentIcon(method)}</div>
                                                {getPaymentLabel(method)}
                                            </div>
                                            <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>
                                                S/ {amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No hay desglose disponible.</p>
                            )}
                        </Card>

                        {/* By Waiter */}
                        <Card style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={18} className="text-secondary" /> Ventas por Mozo
                            </h3>
                            {Object.keys(record.salesByWaiter || {}).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {Object.entries(record.salesByWaiter).sort(([, a], [, b]) => b - a).map(([waiter, amount], idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {waiter}
                                            </div>
                                            <div style={{ fontWeight: '800', color: 'var(--primary-color)' }}>
                                                S/ {amount.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No hay desglose disponible.</p>
                            )}
                        </Card>
                    </div>

                    {/* Detailed Orders List */}
                    <div>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock size={20} className="text-primary" /> Lista de Pedidos
                            {orders.length > 0 && <Badge variant="neutral">{orders.length}</Badge>}
                        </h3>

                        {isLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <Skeleton height="60px" borderRadius="var(--radius-md)" />
                                <Skeleton height="60px" borderRadius="var(--radius-md)" />
                                <Skeleton height="60px" borderRadius="var(--radius-md)" />
                            </div>
                        ) : error ? (
                            <div style={{ padding: '2rem', textAlign: 'center', background: '#fee2e2', borderRadius: 'var(--radius-md)', color: '#991b1b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={32} />
                                <p style={{ margin: 0, fontWeight: '600' }}>{error}</p>
                            </div>
                        ) : orders.length === 0 ? (
                            <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'var(--background-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
                                No se encontraron pedidos individuales para este día.
                            </div>
                        ) : (
                            <div style={{
                                border: '1px solid var(--divider-color)', borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden', background: 'var(--surface-color)'
                            }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--background-color)', borderBottom: '1px solid var(--divider-color)', textAlign: 'left' }}>
                                                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Hora</th>
                                                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Detalle</th>
                                                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Atendido por</th>
                                                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Método(s)</th>
                                                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: '700', textAlign: 'right' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((o) => (
                                                <tr key={o.id} style={{ borderBottom: '1px solid var(--divider-color)', transition: 'background 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                                                        {format(o.createdAt, 'hh:mm a')}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                                            {o.orderType === 'takeout' ? (
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShoppingBag size={14} /> Para Llevar</span>
                                                            ) : `Mesa ${o.tableNumber}`}
                                                        </div>
                                                        {(o.customerName || (o as any).clientName) && (
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                                Cliente: {o.customerName || (o as any).clientName}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                                        {o.userName || 'Desconocido'}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                            {o.payments && o.payments.length > 0 ? (
                                                                o.payments.map((p, idx) => (
                                                                    <Badge key={idx} variant="neutral" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                                                                        {getPaymentLabel(p.method)}
                                                                    </Badge>
                                                                ))
                                                            ) : o.paymentMethod ? (
                                                                <Badge variant="neutral" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                                                                    {getPaymentLabel(o.paymentMethod)}
                                                                </Badge>
                                                            ) : (
                                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>-</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '800', color: 'var(--text-primary)' }}>
                                                        S/ {o.total.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
