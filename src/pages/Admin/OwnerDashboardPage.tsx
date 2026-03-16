import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, DollarSign, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button, Card, Badge } from '@/components/shared';
import { useTenant } from '@/app/providers/TenantProvider';
import { getPeruDateString } from '@/utils/dateUtils';
import type { Restaurant } from '@/types';

interface BranchMetrics {
    branch: Restaurant;
    totalSales: number;
    orderCount: number;
    lowStockCount: number;
    userCount: number;
}

export function OwnerDashboardPage() {
    const navigate = useNavigate();
    const { restaurantSlug } = useParams();
    const { tenant } = useTenant();
    const [branchMetrics, setBranchMetrics] = useState<BranchMetrics[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tenant?.branches || tenant.branches.length === 0) {
            setIsLoading(false);
            return;
        }

        const fetchMetrics = async () => {
            setIsLoading(true);
            const todayStr = getPeruDateString();
            const allBranchIds = [tenant.id, ...(tenant.branches || [])];
            const metrics: BranchMetrics[] = [];

            for (const branchId of allBranchIds) {
                try {
                    // Fetch branch restaurant doc
                    const { doc: docRef, getDoc } = await import('firebase/firestore');
                    const branchDoc = await getDoc(docRef(db, 'restaurants', branchId));
                    const branchData = branchDoc.exists()
                        ? { id: branchDoc.id, ...branchDoc.data() } as Restaurant
                        : { id: branchId, name: branchId } as Restaurant;

                    // Fetch today's orders
                    const ordersQuery = query(
                        collection(db, 'orders'),
                        where('restaurantId', '==', branchId),
                        where('status', '==', 'paid'),
                        where('dateStr', '==', todayStr)
                    );
                    const ordersSnap = await getDocs(ordersQuery);
                    let totalSales = 0;
                    ordersSnap.docs.forEach(doc => {
                        totalSales += doc.data().total || 0;
                    });

                    // Fetch low stock count
                    const stockQuery = query(
                        collection(db, 'products'),
                        where('restaurantId', '==', branchId),
                        where('controlaStock', '==', true)
                    );
                    const stockSnap = await getDocs(stockQuery);
                    let lowStockCount = 0;
                    stockSnap.docs.forEach(doc => {
                        const data = doc.data();
                        if ((data.stockActual || 0) <= (data.stockMinimo || 0)) {
                            lowStockCount++;
                        }
                    });

                    // Fetch user count
                    const usersQuery = query(
                        collection(db, 'users'),
                        where('restaurantId', '==', branchId)
                    );
                    const usersSnap = await getDocs(usersQuery);

                    metrics.push({
                        branch: branchData,
                        totalSales,
                        orderCount: ordersSnap.size,
                        lowStockCount,
                        userCount: usersSnap.size,
                    });
                } catch (err) {
                    console.error(`Error fetching metrics for ${branchId}:`, err);
                }
            }

            setBranchMetrics(metrics);
            setIsLoading(false);
        };

        fetchMetrics();
    }, [tenant]);

    const totalSalesAll = branchMetrics.reduce((sum, m) => sum + m.totalSales, 0);
    const totalOrdersAll = branchMetrics.reduce((sum, m) => sum + m.orderCount, 0);
    const totalAlerts = branchMetrics.reduce((sum, m) => sum + m.lowStockCount, 0);

    return (
        <div className="container mt-md bg-mesh" style={{ minHeight: '100vh', paddingBottom: '2rem' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                        <Building2 size={28} color="var(--primary-color)" />
                        Dashboard Consolidado
                    </h1>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)' }}>
                        Vista general de todos tus locales
                    </p>
                </div>
                <Button variant="ghost" onClick={() => navigate(`/${restaurantSlug}/admin`)}>
                    <ArrowLeft size={18} /> Volver
                </Button>
            </header>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
                    Cargando datos de todas las sucursales...
                </div>
            ) : (
                <>
                    {/* Summary KPIs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                        <Card className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '3px solid var(--primary-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <DollarSign size={18} /> Ventas Totales del Día
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                                S/ {totalSalesAll.toFixed(2)}
                            </div>
                        </Card>

                        <Card className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '3px solid var(--success-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <TrendingUp size={18} /> Pedidos del Día
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success-color)' }}>
                                {totalOrdersAll}
                            </div>
                        </Card>

                        <Card className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '3px solid var(--accent-amber)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <AlertTriangle size={18} /> Alertas Inventario
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                                {totalAlerts}
                            </div>
                        </Card>

                        <Card className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '3px solid var(--accent-violet)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                <Building2 size={18} /> Total Sucursales
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-violet)' }}>
                                {branchMetrics.length}
                            </div>
                        </Card>
                    </div>

                    {/* Per-Branch Table */}
                    <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Detalle por Local
                    </h2>

                    {/* Desktop Table */}
                    <div className="hidden-mobile">
                        <Card className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--divider-color)', background: 'var(--glass-bg)' }}>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Local</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Ventas del Día</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Pedidos</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Inventario</th>
                                        <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Usuarios</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branchMetrics.map((m) => (
                                        <tr key={m.branch.id} style={{ borderBottom: '1px solid var(--divider-color)' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{m.branch.name}</div>
                                                        {m.branch.address && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.branch.address}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-color)' }}>
                                                S/ {m.totalSales.toFixed(2)}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontWeight: 600 }}>{m.orderCount}</td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                {m.lowStockCount > 0
                                                    ? <Badge variant="warning">{m.lowStockCount} alertas</Badge>
                                                    : <Badge variant="success">OK</Badge>
                                                }
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <Users size={16} color="var(--text-secondary)" />
                                                    {m.userCount}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    {/* Mobile Cards */}
                    <div className="hidden-desktop block">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {branchMetrics.map((m) => (
                                <Card key={m.branch.id} className="glass-card" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{m.branch.name}</div>
                                            {m.branch.address && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.branch.address}</div>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Ventas</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary-color)' }}>S/ {m.totalSales.toFixed(2)}</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Pedidos</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{m.orderCount}</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Inventario</div>
                                            {m.lowStockCount > 0
                                                ? <Badge variant="warning">{m.lowStockCount} alertas</Badge>
                                                : <Badge variant="success">OK</Badge>
                                            }
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--glass-bg)', borderRadius: 'var(--radius-md)' }}>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Usuarios</div>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{m.userCount}</div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
