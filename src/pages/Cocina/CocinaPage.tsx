import { useState, useMemo } from 'react';
import { Lock, ChefHat, Menu, Zap } from 'lucide-react';
import type { RestaurantTable, Order } from '@/types';
import { OrderModal } from '@/components/features/OrderModal';
import { TableDetailModal } from '@/components/features/TableDetailModal';
import { TableSelectorModal } from '@/components/features/TableSelectorModal';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useClosureStatus } from '@/hooks/useClosureStatus';
import { useOrderCreation } from '@/hooks/useOrderCreation';
import { OrderFAB } from '@/components/shared/OrderFAB';
import { OrderCard } from '@/components/features/OrderCard';
import { OrderCardSkeleton } from '@/components/shared/Skeleton';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { useTenant } from '@/app/providers/TenantProvider';
import { OrderStatus } from '@/types';

interface FilterButtonProps {
    status: OrderStatus | 'all';
    label: string;
    isActive: boolean;
    count: number;
    onClick: () => void;
}

const FilterButton = ({ label, isActive, count, onClick }: FilterButtonProps) => {
    return (
        <button
            onClick={onClick}
            style={{
                background: isActive
                    ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-violet))'
                    : 'var(--glass-bg)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: isActive ? 'transparent' : 'var(--glass-border)',
                backdropFilter: isActive ? 'none' : 'blur(var(--glass-blur))',
                WebkitBackdropFilter: isActive ? 'none' : 'blur(var(--glass-blur))',
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.25s ease',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                fontSize: '0.9rem',
                flexShrink: 0
            }}
        >
            {label}
            {count > 0 && (
                <span style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : 'var(--divider-color)',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    minWidth: '22px',
                    textAlign: 'center',
                    fontWeight: '800'
                }}>
                    {count}
                </span>
            )}
        </button>
    );
};

export function CocinaPage() {
    const { user } = useAuth();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { activeOrders, deleteOrder } = useOrders();
    const { isClosed } = useClosureStatus();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { tenant } = useTenant();
    const enableQuickSale = tenant?.config?.enableQuickSale ?? false;

    // Order creation flow (reusable hook)
    const orderCreation = useOrderCreation();
    const [orderToEdit, setOrderToEdit] = useState<Order | undefined>(undefined);

    if (!activeOrders) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
                <div style={{ height: '90px', backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', marginBottom: '2.5rem' }} />
                <div className="container" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <OrderCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // Memoize filtered orders and counts for performance
    const { filteredOrders, orderCounts } = useMemo(() => {
        const countsObj: Record<string, number> = {
            all: activeOrders.length,
            pending: 0,
            in_preparation: 0,
            ready: 0,
            delivered: 0,
            paid: 0,
            cancelled: 0
        };

        activeOrders.forEach(order => {
            countsObj[order.status] = (countsObj[order.status] || 0) + 1;
        });

        const filtered = activeOrders.filter(order =>
            filterStatus === 'all' ? true : order.status === filterStatus
        );

        return { filteredOrders: filtered, orderCounts: countsObj };
    }, [activeOrders, filterStatus]);

    const handleDelete = async (orderId: string) => {
        if (confirm('¿Estás seguro de eliminar este pedido? Esta acción liberará la mesa.')) {
            await deleteOrder(orderId);
        }
    };

    // Helper to construct minimal table object for OrderModal
    const getMinimalTable = (order: Order): RestaurantTable => ({
        id: 'temp',
        restaurantId: user?.restaurantId || '',
        number: order.tableNumber,
        status: 'occupied',
        capacity: 4
    });

    return (
        <div className="bg-mesh" style={{ minHeight: '100vh', paddingBottom: '3rem' }}>

            {/* ── AppSidebar (solo admin, caja y chef) ── */}
            {restaurantSlug && (
                <AppSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    restaurantSlug={restaurantSlug}
                />
            )}

            {/* ── Inline styles ── */}
            <style>{`
                .cocina-header-bar {
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-bottom: 1px solid var(--glass-border);
                }
                .cocina-header-inner {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1.1rem 1.5rem;
                    max-width: 1280px;
                    margin: 0 auto;
                }
                .cocina-hamburger {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    border: 1.5px solid var(--glass-border);
                    background: transparent;
                    color: var(--text-primary);
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.2s ease;
                }
                .cocina-hamburger:hover {
                    background: var(--background-color);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                    transform: scale(1.05);
                }
                .cocina-hamburger:active {
                    transform: scale(0.96);
                }
                .cocina-brand {
                    display: flex;
                    align-items: center;
                    gap: 0.7rem;
                    flex: 1;
                    min-width: 0;
                }
                .cocina-brand-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: rgba(237, 219, 203, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-primary);
                    flex-shrink: 0;
                }
                .cocina-brand-text {
                    min-width: 0;
                }
                .cocina-brand-title {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 1.2rem;
                    font-weight: 800;
                    letter-spacing: -0.01em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-family: var(--font-heading);
                    line-height: 1.2;
                }
                .cocina-brand-sub {
                    margin: 0;
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .cocina-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-shrink: 0;
                }
                /* Stagger animation for main content when sidebar-used */
                .cocina-content {
                    transition: margin-left 0.3s ease-in-out;
                }
            `}</style>

            {/* ── Header ── */}
            <header className="cocina-header-bar" style={{ marginBottom: '2.5rem' }}>
                <div className="cocina-header-inner">
                    {/* Hamburguesa — IZQUIERDA */}
                    <button
                        className="cocina-hamburger"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Abrir menú de navegación"
                        id="btn-open-sidebar"
                        title="Menú"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Brand */}
                    <div className="cocina-brand">
                        <div className="cocina-brand-icon">
                            <ChefHat size={22} />
                        </div>
                        <div className="cocina-brand-text">
                            <h1 className="cocina-brand-title">
                                {user?.role === 'caja' ? 'Caja' : 'Cocina'}
                            </h1>
                            <p className="cocina-brand-sub">
                                Hola,{' '}
                                <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                                    {user?.name?.split(' ')[0]}
                                </span>
                                {' '}· {filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Right actions */}
                    <div className="cocina-header-actions">
                        <NotificationBell />
                    </div>
                </div>
            </header>

            {/* ── Main Content ── */}
            <div className="container cocina-content">
                {/* Closure Banner */}
                {isClosed && (
                    <div className="glass-card" style={{
                        color: 'var(--danger-color)',
                        padding: '1.25rem 2rem',
                        marginBottom: '2.5rem',
                        borderLeft: '5px solid var(--danger-color)',
                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                    }}>
                        <Lock size={22} />
                        <div>
                            <strong style={{ display: 'block', fontSize: '1.1rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Servicio Finalizado</strong>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Se ha realizado el cierre de caja. Solo lectura.</span>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    marginBottom: '2rem',
                    flexWrap: 'nowrap',
                    overflowX: 'hidden'
                }}>
                    <div style={{
                        display: 'flex',
                        gap: '0.85rem',
                        flexWrap: 'nowrap',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                        msOverflowStyle: 'none' as const,
                        scrollbarWidth: 'none' as const,
                        WebkitOverflowScrolling: 'touch' as const
                    }}>
                        <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                        <FilterButton
                            status="all"
                            label="Todos"
                            isActive={filterStatus === 'all'}
                            count={orderCounts.all}
                            onClick={() => setFilterStatus('all')}
                        />
                        <FilterButton
                            status="pending"
                            label="Pendientes"
                            isActive={filterStatus === 'pending'}
                            count={orderCounts.pending}
                            onClick={() => setFilterStatus('pending')}
                        />
                        <FilterButton
                            status="in_preparation"
                            label="En Cocina"
                            isActive={filterStatus === 'in_preparation'}
                            count={orderCounts.in_preparation}
                            onClick={() => setFilterStatus('in_preparation')}
                        />
                        <FilterButton
                            status="ready"
                            label="Listos"
                            isActive={filterStatus === 'ready'}
                            count={orderCounts.ready}
                            onClick={() => setFilterStatus('ready')}
                        />
                    </div>
                </div>

                {/* Grid de pedidos */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {filteredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onEdit={() => setOrderToEdit(order)}
                            onDelete={() => handleDelete(order.id)}
                        />
                    ))}

                    {activeOrders.length === 0 && (
                        <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-secondary)', borderStyle: 'dashed', border: '2px dashed var(--glass-border)' }}>
                            <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', opacity: 0.15 }}>⚡</div>
                            <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '800', fontSize: '1.25rem' }}>No hay pedidos en curso</h3>
                            <p style={{ fontWeight: '500' }}>Los pedidos que generen los mozos aparecerán aquí al instante.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Edit Order Modal ── */}
            {orderToEdit && user?.restaurantId && (
                <OrderModal
                    table={getMinimalTable(orderToEdit)}
                    initialOrder={orderToEdit}
                    onClose={() => setOrderToEdit(undefined)}
                    onOrderCreated={() => { }}
                />
            )}

            {/* ── Order Creation Flow (FAB + Modals) ── */}
            {user?.role === 'caja' ? (
                <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', gap: '1rem', zIndex: 900 }}>
                    <div style={{ position: 'relative' }}>
                        <OrderFAB onClick={orderCreation.handleFABClick} style={{ position: 'relative', bottom: 0, right: 0, width: '64px', height: '64px' }} />
                    </div>
                    {enableQuickSale && (
                        <button
                            onClick={() => {
                                if (orderCreation.isClosed) {
                                    alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.');
                                    return;
                                }
                                orderCreation.setTakeoutOrderType('quick-sale');
                                orderCreation.setIsOrderModalOpen(true);
                            }}
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                border: 'none',
                                background: 'linear-gradient(135deg, var(--primary-color) 0%, #6d4c41 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 6px 20px rgba(142, 115, 91, 0.4), 0 2px 6px rgba(0,0,0,0.15)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                animation: 'fab-pulse 2s ease-in-out infinite',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 8px 28px rgba(142, 115, 91, 0.5), 0 4px 10px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(142, 115, 91, 0.4), 0 2px 6px rgba(0,0,0,0.15)';
                            }}
                            title="Venta Rápida"
                        >
                            <Zap size={28} fill="white" />
                        </button>
                    )}
                </div>
            ) : (
                <OrderFAB onClick={orderCreation.handleFABClick} style={{ width: '64px', height: '64px' }} />
            )}

            {orderCreation.showTableSelector && (
                <TableSelectorModal
                    tables={orderCreation.allTables}
                    activeOrders={orderCreation.activeOrders}
                    onTableClick={orderCreation.handleTableClick}
                    onClose={orderCreation.handleCloseTableSelector}
                />
            )}

            {orderCreation.isOrderModalOpen && (orderCreation.selectedTable || orderCreation.takeoutOrderType === 'takeout' || orderCreation.takeoutOrderType === 'quick-sale') && !orderCreation.isClosed && (
                <OrderModal
                    table={orderCreation.selectedTable || undefined}
                    initialOrder={orderCreation.orderToEdit}
                    onClose={orderCreation.handleCloseOrderModal}
                    onOrderCreated={() => { }}
                    orderType={orderCreation.takeoutOrderType}
                />
            )}

            {orderCreation.isDetailModalOpen && orderCreation.selectedTable && (
                <TableDetailModal
                    table={orderCreation.selectedTable}
                    onClose={orderCreation.handleCloseDetailModal}
                    onEdit={orderCreation.handleEditOrder}
                />
            )}

            <style>{`
                @keyframes fab-pulse {
                    0%, 100% { box-shadow: 0 6px 20px rgba(142, 115, 91, 0.4), 0 2px 6px rgba(0,0,0,0.15); }
                    50% { box-shadow: 0 6px 20px rgba(142, 115, 91, 0.6), 0 2px 6px rgba(0,0,0,0.2), 0 0 0 8px rgba(142, 115, 91, 0.1); }
                }
            `}</style>
        </div>
    );
}
