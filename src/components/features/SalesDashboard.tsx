import { useDailySales } from '@/hooks/useDailySales';
import { Card, Badge } from '@/components/shared';
import { DashboardSkeleton } from '@/components/shared/Skeleton';
import { TrendingUp } from "lucide-react";

export function SalesDashboard() {
    const { metrics, isLoading } = useDailySales();

    if (isLoading) return <DashboardSkeleton />;

    return (
        <div style={{ marginBottom: '2rem' }}>
            <h2
                style={{
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                }}
            >
                <TrendingUp size={22} strokeWidth={2} />
                Ventas del Día

                <Badge variant={metrics.totalSales > 0 ? "success" : "neutral"}>
                    {new Date().toLocaleDateString()}
                </Badge>
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
            }}>
                {/* KPI Cards */}
                <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Venta Total</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        S/ {metrics.totalSales.toFixed(2)}
                    </div>
                </Card>

                <Card style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Pedidos Atendidos</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                        {metrics.orderCount}
                    </div>
                </Card>

                {/* Sales by Waiter */}
                <Card style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem', textAlign: 'center' }}>
                        Rendimiento por Mozo
                    </div>
                    {Object.keys(metrics.salesByWaiter).length === 0 ? (
                        <div style={{ textAlign: 'center', fontStyle: 'italic', color: '#ccc' }}>Sin ventas aún</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Object.entries(metrics.salesByWaiter).map(([waiter, amount]) => (
                                <div key={waiter} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '0.25rem' }}>
                                    <span>{waiter}</span>
                                    <strong>S/ {(amount as number).toFixed(2)}</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
