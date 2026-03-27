import { useState } from 'react';
import { Lock, Wallet, Zap, Menu } from 'lucide-react';
import { OrderModal } from '@/components/features/OrderModal';
import { TableDetailModal } from '@/components/features/TableDetailModal';
import { TableMap } from '@/components/features/TableMap';
import { Button } from '@/components/shared';
import { TableSkeleton } from '@/components/shared/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { useTables } from '@/hooks/useTables';
import { useOrders } from '@/hooks/useOrders';
import { useClosureStatus } from '@/hooks/useClosureStatus';
import { NotificationBell } from '@/components/shared/NotificationBell';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { useTenant } from '@/app/providers/TenantProvider';
import type { RestaurantTable, Order } from '@/types';

export const TAKEOUT_NEW_ID = 'takeout-new-wildcard';

export function MozoPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
    const { tables } = useTables(); // Real-time tables from Firestore
    const { activeOrders } = useOrders();
    const { isClosed, isLoading: checkingClosure } = useClosureStatus();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { tenant } = useTenant();
    const enableTables = tenant?.config?.enableTables ?? true;
    const enableQuickSale = tenant?.config?.enableQuickSale ?? false;
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<Order | undefined>(undefined);
    const [takeoutOrderType, setTakeoutOrderType] = useState<'dine-in' | 'takeout' | 'quick-sale'>('dine-in');



    const takeoutOrders = activeOrders?.filter(o => o.orderType === 'takeout' || o.orderType === 'quick-sale') || [];

    // Synthesize the "New Takeout" Card
    const newTakeoutCard: RestaurantTable = {
        id: TAKEOUT_NEW_ID,
        number: 0,
        status: 'free',
        restaurantId: user?.restaurantId || '',
    };

    // Synthesize cards for each ACTIVE takeout order
    const dynamicTakeoutCards: RestaurantTable[] = takeoutOrders.map(order => ({
        id: `takeout-order-${order.id}`,
        number: 0, // 0 indicates it's a takeout type
        status: 'occupied',
        restaurantId: order.restaurantId,
        currentOrderId: order.id, // Direct link to order
    }));

    const handleTableClick = (table: RestaurantTable) => {
        // Case: Create new Takeout
        if (table.id === TAKEOUT_NEW_ID) {
            handleOpenTakeoutModal();
            return;
        }

        // Case: Edit/View existing Takeout Order from virtual table
        if (table.id.startsWith('takeout-order-')) {
            setSelectedTable(table);
            setIsDetailModalOpen(true);
            return;
        }

        // Standard Table Logic
        // Block new orders if cash box is closed
        if (isClosed && table.status === 'free') {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.\nContacta al administrador si necesitas reabrir.');
            return;
        }

        if (table.status === 'free') {
            setSelectedTable(table);
            setOrderToEdit(undefined);
            setTakeoutOrderType('dine-in'); // Reset order type for table orders
            setIsOrderModalOpen(true);
        } else if (table.status === 'occupied') {
            setSelectedTable(table);
            setIsDetailModalOpen(true);
        }
    };

    const handleCloseOrderModal = () => {
        setIsOrderModalOpen(false);
        setSelectedTable(null);
        setOrderToEdit(undefined);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTable(null);
    };

    const handleEditOrder = (order: Order) => {
        setOrderToEdit(order);
        setIsDetailModalOpen(false); // Close detail to open edit
        setIsOrderModalOpen(true);
        setTakeoutOrderType(order.orderType || 'dine-in');
    };

    const handleOpenTakeoutModal = () => {
        if (isClosed) {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.');
            return;
        }
        setOrderToEdit(undefined);
        setTakeoutOrderType('takeout');
        setIsOrderModalOpen(true);
    };

    const handleOpenQuickSaleModal = () => {
        if (isClosed) {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.');
            return;
        }
        setOrderToEdit(undefined);
        setTakeoutOrderType('quick-sale');
        setIsOrderModalOpen(true);
    };

    if (!tables || checkingClosure) {
        return (
            <div className="container mt-md">
                <div style={{ height: '60px', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--divider-color)' }} />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {[...Array(12)].map((_, i) => (
                        <TableSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // Build visible table list based on config
    const physicalTables = enableTables
        ? [...tables].sort((a, b) => a.number - b.number)
        : [];

    const allTables = [
        ...physicalTables,
        ...dynamicTakeoutCards,
        newTakeoutCard
    ];

    return (
        <div className="container bg-mesh mozo-content" style={{ minHeight: '100vh', paddingBottom: '2rem', paddingTop: '1.5rem', transition: 'margin-left 0.3s ease-in-out' }}>
            
            {restaurantSlug && (
                <AppSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    restaurantSlug={restaurantSlug}
                />
            )}

            {/* Closure Banner */}
            {isClosed && (
                <div className="glass-card" style={{
                    color: 'var(--danger-color)',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    marginBottom: 'var(--spacing-lg)',
                    borderLeft: '5px solid var(--danger-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <Lock size={20} />
                        <div>
                            <strong style={{ display: 'block', fontSize: '1rem', letterSpacing: '0.05em' }}>SISTEMA CERRADO</strong>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Las operaciones han finalizado por hoy.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm) 0',
                borderBottom: '1px solid var(--divider-color)',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', flex: 1, minWidth: 0 }}>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Menú principal"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '42px', height: '42px', borderRadius: '50%',
                            border: '1.5px solid var(--glass-border)', background: 'transparent',
                            color: 'var(--text-primary)', cursor: 'pointer', flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                    >
                        <Menu size={20} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)', minWidth: 0 }}>
                        <h1 style={{
                        margin: 0,
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-heading)',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {enableTables ? 'Mesas' : 'Pedidos'}
                    </h1>
                </div>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    background: 'var(--glass-bg)',
                    backdropFilter: 'blur(var(--glass-blur))',
                    WebkitBackdropFilter: 'blur(var(--glass-blur))',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    flexShrink: 0
                }}>
                    <NotificationBell />
                    
                    {/* Caja Chica Button */}
                    <button
                        onClick={() => navigate(`/${restaurantSlug}/caja-chica`)}
                        title="Caja Chica"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px', height: '36px', borderRadius: '50%',
                            border: '1px solid var(--divider-color)', background: 'var(--background-color)',
                            color: '#f59e0b', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                    >
                        <Wallet size={18} />
                    </button>

                    <div style={{ textAlign: 'right', minWidth: 'fit-content' }}>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em', lineHeight: 1 }}>{window.innerWidth < 640 ? user?.name?.split(' ')[0] : user?.name}</p>
                        <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.85rem' }}>
                            {user?.role === 'caja' ? 'Cajero/a' : 
                             user?.role === 'admin' ? 'Admin' : 
                             user?.role === 'chef' ? 'Cocina' : 
                             user?.role === 'shift_manager' ? 'Encargado' : 'Mozo'}
                        </p>
                    </div>
                    <Button variant="outline" onClick={logout} size="sm" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', height: 'auto' }}>
                        Salir
                    </Button>
                </div>
            </header>

            <TableMap
                tables={allTables}
                activeOrders={activeOrders}
                onTableClick={handleTableClick}
            />

            {(isOrderModalOpen && (selectedTable || takeoutOrderType !== 'dine-in') && !isClosed) && (
                <OrderModal
                    table={selectedTable || undefined}
                    initialOrder={orderToEdit}
                    onClose={handleCloseOrderModal}
                    onOrderCreated={() => { /* Order saved, let modal handle closure */ }}
                    orderType={takeoutOrderType}
                />
            )}

            {isDetailModalOpen && selectedTable && (
                <TableDetailModal
                    table={selectedTable}
                    onClose={handleCloseDetailModal}
                    onEdit={handleEditOrder}
                />
            )}

            {/* Quick Sale FAB */}
            {enableQuickSale && (
                <button
                    onClick={handleOpenQuickSaleModal}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
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
                        zIndex: 900,
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

            {/* FAB pulse animation */}
            <style>{`
                @keyframes fab-pulse {
                    0%, 100% { box-shadow: 0 6px 20px rgba(142, 115, 91, 0.4), 0 2px 6px rgba(0,0,0,0.15); }
                    50% { box-shadow: 0 6px 20px rgba(142, 115, 91, 0.6), 0 2px 6px rgba(0,0,0,0.2), 0 0 0 8px rgba(142, 115, 91, 0.1); }
                }
            `}</style>
        </div>
    );
}
