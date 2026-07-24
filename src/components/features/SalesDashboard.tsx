import { useDailySales } from '@/hooks/useDailySales';
import { useLowStock } from '@/hooks/useLowStock';
import { Badge } from '@/components/shared';
import { DashboardSkeleton } from '@/components/shared/Skeleton';
import { TrendingUp, Users, AlertTriangle, Package } from "lucide-react";
import { useNavigate, useParams } from 'react-router-dom';

export function SalesDashboard() {
    const { metrics, isLoading } = useDailySales();
    const { lowStockProducts } = useLowStock();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

    if (isLoading) return <DashboardSkeleton />;

    const lowStockCount = lowStockProducts.length;

    return (
        <div style={{ marginBottom: '0.5rem' }}>
            {/* Section Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        padding: '0.75rem', borderRadius: 'var(--radius-lg)',
                        background: 'rgba(37, 99, 235, 0.1)'
                    }}>
                        <TrendingUp size={22} color="var(--accent-blue)" strokeWidth={2} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Ventas del Día
                    </h2>
                    <Badge variant={metrics.totalSales > 0 ? "success" : "neutral"}>
                        {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase()}
                    </Badge>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="sales-kpi-grid">
                {/* Venta Total */}
                <div className="glass-card kpi-card">
                    <span style={{
                        color: 'var(--accent-blue)', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        display: 'block', marginBottom: '1rem'
                    }}>
                        Venta Total Bruta
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: 500 }}>S/</span>
                        <span className="kpi-value">
                            {metrics.totalSales.toFixed(2)}
                        </span>
                    </div>
                    <div style={{
                        marginTop: '1.5rem', height: '4px', width: '100%',
                        background: 'var(--divider-color)', borderRadius: '9999px', overflow: 'hidden'
                    }}>
                        <div style={{
                            height: '100%', background: 'var(--accent-blue)',
                            borderRadius: '9999px', width: `${Math.min(metrics.totalSales / 10, 100)}%`,
                            transition: 'width 1s ease'
                        }} />
                    </div>
                </div>

                {/* Pedidos Atendidos */}
                <div className="glass-card kpi-card">
                    <span style={{
                        color: 'var(--accent-violet)', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        display: 'block', marginBottom: '1rem'
                    }}>
                        Pedidos Atendidos
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="kpi-value">
                            {metrics.orderCount}
                        </span>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted, var(--text-secondary))', fontWeight: 500 }}>
                        Promedio de tiempo: {metrics.orderCount > 0 ? Math.round(metrics.totalSales / metrics.orderCount) : 0} min
                    </p>
                </div>
                {/* Stock Bajo */}
                <div
                    className="glass-card kpi-card"
                    onClick={() => navigate(`/${restaurantSlug}/inventario?filter=low`)}
                    style={{
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        borderColor: lowStockCount > 0 ? 'rgba(245, 158, 11, 0.25)' : undefined,
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.15)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                    }}
                >
                    <span style={{
                        color: 'var(--warning-color, #f59e0b)', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        display: 'block', marginBottom: '1rem'
                    }}>
                        Stock Bajo
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="kpi-value" style={{
                            color: lowStockCount > 0 ? 'var(--warning-color, #f59e0b)' : undefined
                        }}>
                            {lowStockCount}
                        </span>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: lowStockCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.3s ease'
                        }}>
                            {lowStockCount > 0 ? (
                                <AlertTriangle size={20} color="var(--warning-color, #f59e0b)" />
                            ) : (
                                <Package size={20} color="var(--accent-emerald, #10b981)" />
                            )}
                        </div>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted, var(--text-secondary))', fontWeight: 500 }}>
                        {lowStockCount > 0
                            ? `${lowStockCount} producto${lowStockCount > 1 ? 's' : ''} por reabastecer`
                            : 'Todo el stock está en orden'}
                    </p>
                </div>

                {/* Líder del Turno */}
                <div className="glass-card kpi-card" style={{
                    justifyContent: 'center',
                    borderStyle: Object.keys(metrics.salesByWaiter).length === 0 ? 'dashed' : 'solid'
                }}>
                    <span style={{
                        color: 'var(--accent-emerald)', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        display: 'block', marginBottom: '1rem'
                    }}>
                        Líder del Turno
                    </span>
                    {Object.keys(metrics.salesByWaiter).length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'var(--divider-color)', border: '1px solid var(--border-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Users size={24} color="var(--text-muted, var(--text-secondary))" />
                            </div>
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', fontWeight: 500 }}>
                                Sin ventas registradas
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Object.entries(metrics.salesByWaiter).map(([waiter, amount]) => (
                                <div key={waiter} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem'
                                }}>
                                    <span>{waiter}</span>
                                    <strong>S/ {(amount as number).toFixed(2)}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}
