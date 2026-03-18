import { useRef, useEffect, useState, useMemo } from 'react';
import { Lock, ShieldCheck, ChefHat, LogOut, Menu, Wallet, Zap, DollarSign } from 'lucide-react';
import type { RestaurantTable, Order } from '@/types';
import { OrderModal } from '@/components/features/OrderModal';
import { TableDetailModal } from '@/components/features/TableDetailModal';
import { TableSelectorModal } from '@/components/features/TableSelectorModal';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { useClosureStatus } from '@/hooks/useClosureStatus';
import { useOrderCreation } from '@/hooks/useOrderCreation';
import { OrderFAB } from '@/components/shared/OrderFAB';
import { OrderCard } from '@/components/features/OrderCard';
import { OrderCardSkeleton } from '@/components/shared/Skeleton';
import { NotificationBell } from '@/components/shared/NotificationBell';
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
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { activeOrders, deleteOrder } = useOrders();
    const { isClosed } = useClosureStatus();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { tenant } = useTenant();
    const enableQuickSale = tenant?.config?.enableQuickSale ?? false;

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
        id: 'temp', // Not used for update
        restaurantId: user?.restaurantId || '',
        number: order.tableNumber,
        status: 'occupied',
        capacity: 4 // Dummy
    });



    return (
        <div className="bg-mesh" style={{ minHeight: '100vh', paddingBottom: '3rem' }}>
            {/* Header */}
            <style>{`
                .cocina-layout-header {
                    display: flex;
                    flex-direction: column;
                }
                .cocina-layout-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .cocina-layout-actions {
                    display: flex;
                    gap: 0.75rem;
                }
                .cocina-action-btn {
                    flex: 1;
                    justify-content: center;
                    border: none !important;
                    border-radius: 14px !important;
                    transition: transform 0.15s, opacity 0.15s;
                }
                .cocina-action-btn:active {
                    transform: scale(0.97);
                }
                .cocina-dropdown-menu {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 0.5rem;
                    background: var(--glass-bg);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.12);
                    min-width: 200px;
                    z-index: 50;
                    opacity: 0;
                    transform: translateY(-10px);
                    pointer-events: none;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    display: flex;
                    flex-direction: column;
                    padding: 0.5rem;
                    gap: 0.25rem;
                }
                .cocina-dropdown-menu.open {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }
                .cocina-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border: none;
                    background: transparent;
                    width: 100%;
                    text-align: left;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    transition: all 0.15s;
                }
                .cocina-dropdown-item:hover {
                    background: var(--glass-bg);
                }
                .cocina-dropdown-item.danger {
                    color: var(--danger-color);
                }
                .cocina-dropdown-item.danger:hover {
                    background: rgba(230, 57, 70, 0.08);
                }
                @media (min-width: 768px) {
                    .cocina-layout-header {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .cocina-layout-top {
                        margin-bottom: 0;
                        flex: 1;
                    }
                }
            `}</style>
            <div style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)', padding: '1.25rem 0', marginBottom: '2.5rem', position: 'relative', zIndex: 100 }}>
                <div className="container cocina-layout-header">
                    <div className="cocina-layout-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                            <div style={{
                                width: '46px', height: '46px',
                                backgroundColor: 'rgba(237, 219, 203, 0.4)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-primary)',
                                flexShrink: 0
                            }}>
                                <ChefHat size={24} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-heading)' }}>
                                    {user?.role === 'caja' ? 'Caja' : 'Cocina'}
                                </h1>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {window.innerWidth < 640 ? `${user?.name?.split(' ')[0]}` : <>{'Hola, '}<span style={{ color: 'var(--primary-color)' }}>{user?.name}</span></>} &bull; {filteredOrders.length} ped.
                                </p>
                            </div>
                        </div>

                        <div style={{ flexShrink: 0, paddingLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <NotificationBell />
                            <div ref={menuRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: '42px', height: '42px',
                                        borderRadius: '50%',
                                        border: '1px solid var(--border-color)',
                                        background: isMenuOpen ? 'var(--background-color)' : 'transparent',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <Menu size={20} />
                                </button>

                                <div className={`cocina-dropdown-menu ${isMenuOpen ? 'open' : ''}`}>
                                    {user?.role === 'admin' && (
                                        <button
                                            className="cocina-dropdown-item"
                                            onClick={() => navigate(`/${restaurantSlug}/admin`)}
                                        >
                                            <ShieldCheck size={18} style={{ color: 'var(--primary-color)' }} />
                                            <span>Administración</span>
                                        </button>
                                    )}
                                    <button
                                        className="cocina-dropdown-item"
                                        onClick={() => { navigate(`/${restaurantSlug}/caja-chica`); setIsMenuOpen(false); }}
                                    >
                                        <Wallet size={18} style={{ color: '#f59e0b' }} />
                                        <span>Caja Chica</span>
                                    </button>
                                    {(user?.role === 'admin' || user?.role === 'caja') && (
                                        <button
                                            className="cocina-dropdown-item"
                                            onClick={() => { navigate(`/${restaurantSlug}/cierre-caja`); setIsMenuOpen(false); }}
                                        >
                                            <DollarSign size={18} style={{ color: 'var(--success-color)' }} />
                                            <span>Cerrar Caja</span>
                                        </button>
                                    )}
                                    <button
                                        className="cocina-dropdown-item danger"
                                        onClick={logout}
                                    >
                                        <LogOut size={18} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
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
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        <style>{`
                            div::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
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

                {/* Grid */}
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
            {orderToEdit && user?.restaurantId && (
                <OrderModal
                    table={getMinimalTable(orderToEdit)}
                    initialOrder={orderToEdit}
                    onClose={() => setOrderToEdit(undefined)}
                    onOrderCreated={() => { /* Order saved, let modal handle closure */ }}
                />
            )}

            {/* --- Order Creation Flow (FAB + Modals) --- */}
            {user?.role === 'caja' ? (
                // Left side layout for the Plus FAB when there's a quick sale button, or regular if admin
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
                    onOrderCreated={() => { /* handled */ }}
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
        </div>
    );
}
