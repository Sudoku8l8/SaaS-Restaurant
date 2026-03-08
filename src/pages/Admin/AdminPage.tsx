import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChefHat, DollarSign, BarChart3, Settings, AlertTriangle, ArrowRight, Package, Wallet, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card } from '@/components/shared';
import { SalesDashboard } from '@/components/features/SalesDashboard';
import { usePendingClosures } from '@/hooks/usePendingClosures';
import { useLowStock } from '@/hooks/useLowStock';
import { BranchSelector } from '@/components/features/BranchSelector';
import { useTenant } from '@/app/providers/TenantProvider';

export function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { tenant } = useTenant();
    const { pendingClosures, isLoading: loadingPending } = usePendingClosures();
    const { lowStockProducts, isLoading: loadingStock } = useLowStock();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const isMultiBranch = tenant?.config?.multiSucursal === true;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="container mt-md">
            <header style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                marginBottom: '2.5rem',
                paddingTop: isMobile ? '3rem' : '0'
            }}>
                <div style={{ paddingRight: isMobile ? '0' : '220px' }}>
                    <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', margin: 0 }}>Panel de Administración</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Hola, {user?.name}</p>
                </div>

                <div style={{
                    position: isMobile ? 'absolute' : 'absolute',
                    top: isMobile ? '0' : '0',
                    right: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '0.5rem' : '1rem'
                }}>
                    {/* Branch Selector (only visible in multi-branch mode) */}
                    {!isMobile && <BranchSelector />}

                    <Button
                        variant="ghost"
                        size={isMobile ? "sm" : "md"}
                        onClick={() => navigate(`/${restaurantSlug}/cocina`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <ChefHat size={isMobile ? 16 : 18} />
                        {isMobile ? 'Cocina' : 'Volver a Cocina'}
                    </Button>
                    <Button
                        variant="secondary"
                        size={isMobile ? "sm" : "md"}
                        onClick={logout}
                    >
                        Salir
                    </Button>
                </div>
            </header>

            {/* Mobile Branch Selector */}
            {isMobile && isMultiBranch && (
                <div style={{ marginBottom: '1.5rem' }}>
                    <BranchSelector />
                </div>
            )}

            {/* Pending Closures Alert */}
            {!loadingPending && pendingClosures.length > 0 && (
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {pendingClosures.map(closure => (
                        <div key={closure.date} style={{
                            background: 'rgba(230, 57, 70, 0.08)',
                            border: '1px solid rgba(230, 57, 70, 0.2)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1rem 1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    backgroundColor: 'var(--danger-color)',
                                    color: 'white',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Cierre Pendiente: {closure.date}</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                        {closure.orderCount} pedidos por S/ {closure.totalAmount.toFixed(2)} sin cerrar.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate(`/${restaurantSlug}/cierre-caja?date=${closure.date}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--danger-color)' }}
                            >
                                Cerrar Caja <ArrowRight size={16} />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Low Stock Alerts */}
            {!loadingStock && lowStockProducts.length > 0 && (
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{
                        background: 'rgba(255, 152, 0, 0.08)',
                        border: '1px solid rgba(255, 152, 0, 0.2)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                            <div style={{
                                backgroundColor: 'var(--warning-color)',
                                color: 'white',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <AlertTriangle size={20} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Alertas de Inventario</h4>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} con stock bajo o crítico.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/${restaurantSlug}/inventario`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--warning-color)', color: '#000', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                            Ver Inventario <ArrowRight size={16} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Daily Sales Dashboard */}
            <SalesDashboard />

            {/* Admin Actions */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '2rem'
            }}>
                {/* Owner Dashboard Card (only visible in multi-branch mode) */}
                {isMultiBranch && (
                    <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer', borderTop: '3px solid var(--primary-color)' }} onClick={() => navigate(`/${restaurantSlug}/owner-dashboard`)}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Building2 size={48} color="var(--primary-color)" /></div>
                        <h3>Dashboard Consolidado</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>Ventas totales de todos los locales</p>
                    </Card>
                )}

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer', borderTop: '3px solid #f59e0b' }} onClick={() => navigate(`/${restaurantSlug}/caja-chica`)}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Wallet size={48} color="#f59e0b" /></div>
                    <h3>Caja Chica</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Gastos y fondo de caja chica</p>
                </Card>

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(`/${restaurantSlug}/cierre-caja`)}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><DollarSign size={48} className="text-primary" /></div>
                    <h3>Cierre de Caja</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Cerrar operaciones del día</p>
                </Card>

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(`/${restaurantSlug}/reportes`)}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><BarChart3 size={48} className="text-primary" /></div>
                    <h3>Reportes</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Histórico de ventas</p>
                </Card>

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(`/${restaurantSlug}/inventario`)}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Package size={48} className="text-primary" /></div>
                    <h3>Inventario</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Control de stock de productos</p>
                </Card>

                <Card style={{ padding: '2rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate(`/${restaurantSlug}/config`)}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}><Settings size={48} className="text-primary" /></div>
                    <h3>Configuración</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Productos, Usuarios, Mesas</p>
                </Card>
            </div>
        </div>
    );
}
