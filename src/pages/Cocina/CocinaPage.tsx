import { useRef, useEffect, useState } from 'react';
import { Lock, ShieldCheck, ChefHat, LogOut, Menu } from 'lucide-react';
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
import { OrderStatus } from '@/types';

export function CocinaPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { activeOrders, deleteOrder } = useOrders();
    const { isClosed } = useClosureStatus();
    const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const filteredOrders = activeOrders.filter(order =>
        filterStatus === 'all' ? true : order.status === filterStatus
    );

    const getCount = (status: OrderStatus) => activeOrders.filter(o => o.status === status).length;

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

    const FilterButton = ({ status, label }: { status: OrderStatus | 'all', label: string }) => {
        const isActive = filterStatus === status;
        const count = status === 'all' ? activeOrders.length : getCount(status as OrderStatus);

        return (
            <button
                onClick={() => setFilterStatus(status)}
                style={{
                    backgroundColor: isActive ? 'var(--primary-color)' : 'var(--surface-color)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary-color)' : 'var(--border-color)',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    fontSize: '0.9rem',
                    flexShrink: 0
                }}
            >
                {label}
                {count > 0 && (
                    <span style={{
                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--divider-color)',
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

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)', paddingBottom: '3rem' }}>
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
                    background: var(--surface-color);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
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
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-weight: 600;
                    transition: background 0.15s;
                }
                .cocina-dropdown-item:hover {
                    background: var(--background-color);
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
            <div style={{ backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', padding: '1.25rem 0', marginBottom: '2.5rem', boxShadow: 'var(--shadow-sm)', position: 'relative', zIndex: 100 }}>
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
                                <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cocina</h1>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    Hola, <span style={{ color: 'var(--primary-color)' }}>{user?.name}</span> &bull; {filteredOrders.length} pedidos
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
                                    <button
                                        className="cocina-dropdown-item"
                                        onClick={() => navigate(`/${restaurantSlug}/admin`)}
                                    >
                                        <ShieldCheck size={18} style={{ color: 'var(--primary-color)' }} />
                                        <span>Administración</span>
                                    </button>
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
                    <div style={{
                        background: 'var(--surface-color)',
                        color: 'var(--danger-color)',
                        padding: '1.25rem 2rem',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '2.5rem',
                        border: '1px solid var(--border-color)',
                        borderLeft: '5px solid var(--danger-color)',
                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                        boxShadow: 'var(--shadow-md)'
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
                        <FilterButton status="all" label="Todos" />
                        <FilterButton status="pending" label="Pendientes" />
                        <FilterButton status="in_preparation" label="En Cocina" />
                        <FilterButton status="ready" label="Listos" />
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
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', borderStyle: 'dashed' }}>
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
            <OrderFAB onClick={orderCreation.handleFABClick} />

            {orderCreation.showTableSelector && (
                <TableSelectorModal
                    tables={orderCreation.allTables}
                    activeOrders={orderCreation.activeOrders}
                    onTableClick={orderCreation.handleTableClick}
                    onClose={orderCreation.handleCloseTableSelector}
                />
            )}

            {orderCreation.isOrderModalOpen && (orderCreation.selectedTable || orderCreation.takeoutOrderType === 'takeout') && !orderCreation.isClosed && (
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
