import { useDailySales } from '@/hooks/useDailySales';
import { Badge } from '@/components/shared';
import { DashboardSkeleton } from '@/components/shared/Skeleton';
import { TrendingUp, Users } from "lucide-react";

export function SalesDashboard() {
    const { metrics, isLoading } = useDailySales();

    if (isLoading) return <DashboardSkeleton />;

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
                <span style={{
                    fontSize: '0.75rem', color: 'var(--text-muted, var(--text-secondary))',
                    fontWeight: 500
                }}>
                    Actualizado hace un momento
                </span>
            </div>

            {/* KPI Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem'
            }}>
                {/* Venta Total */}
                <div className="glass-card" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                    <span style={{
                        color: 'var(--accent-blue)', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        display: 'block', marginBottom: '1rem'
                    }}>
                        Venta Total Bruta
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: 500 }}>S/</span>
                        <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
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
                <div className="glass-card" style={{ padding: '2.5rem' }}>
                    <span style={{
                        color: 'var(--accent-violet)', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        display: 'block', marginBottom: '1rem'
                    }}>
                        Pedidos Atendidos
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>
                            {metrics.orderCount}
                        </span>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted, var(--text-secondary))', fontWeight: 500 }}>
                        Promedio de tiempo: {metrics.orderCount > 0 ? Math.round(metrics.totalSales / metrics.orderCount) : 0} min
                    </p>
                </div>

                {/* Líder del Turno */}
                <div className="glass-card" style={{
                    padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center',
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
                                Esperando datos...
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
