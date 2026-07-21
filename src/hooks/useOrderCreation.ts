import { useState } from 'react';
import { useTables } from './useTables';
import { useOrders } from './useOrders';
import { useClosureStatus } from './useClosureStatus';
import { useAuth } from './useAuth';
import type { RestaurantTable, Order } from '@/types';

export const TAKEOUT_NEW_ID = 'takeout-new-wildcard';

/**
 * Custom hook that encapsulates the full order creation flow.
 * Reused by CocinaPage and AdminPage to avoid code duplication.
 * Mirrors the logic from MozoPage but decoupled for composition.
 */
export function useOrderCreation() {
    const { user } = useAuth();
    const { tables, isLoading: tablesLoading } = useTables();
    const { activeOrders } = useOrders();
    const { isClosed } = useClosureStatus();

    const [showTableSelector, setShowTableSelector] = useState(false);
    const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState<Order | undefined>(undefined);
    const [takeoutOrderType, setTakeoutOrderType] = useState<'dine-in' | 'takeout' | 'quick-sale'>('dine-in');

    const takeoutOrders = activeOrders?.filter(o => o.orderType === 'takeout' || o.orderType === 'quick-sale') || [];

    // Virtual takeout cards (same pattern as MozoPage)
    const newTakeoutCard: RestaurantTable = {
        id: TAKEOUT_NEW_ID,
        number: 0,
        status: 'free',
        restaurantId: user?.restaurantId || '',
    };

    const dynamicTakeoutCards: RestaurantTable[] = takeoutOrders.map(order => ({
        id: `takeout-order-${order.id}`,
        number: 0,
        status: 'occupied',
        restaurantId: order.restaurantId,
        currentOrderId: order.id,
    }));

    // Build combined table list
    const allTables = tables
        ? [
            ...[...tables].sort((a, b) => a.number - b.number),
            ...dynamicTakeoutCards,
            newTakeoutCard
        ]
        : [];

    const handleFABClick = () => {
        if (isClosed) {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.\nContacta al administrador si necesitas reabrir.');
            return;
        }
        setShowTableSelector(true);
    };

    const handleTableClick = (table: RestaurantTable) => {
        // Create new Takeout
        if (table.id === TAKEOUT_NEW_ID) {
            handleOpenTakeoutModal();
            return;
        }

        // View/Edit existing Takeout Order
        if (table.id.startsWith('takeout-order-')) {
            setSelectedTable(table);
            setShowTableSelector(false);
            setIsDetailModalOpen(true);
            return;
        }

        // Block new orders if cash box is closed
        if (isClosed && table.status === 'free') {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.');
            return;
        }

        if (table.status === 'free') {
            setSelectedTable(table);
            setOrderToEdit(undefined);
            setTakeoutOrderType('dine-in');
            setShowTableSelector(false);
            setIsOrderModalOpen(true);
        } else if (table.status === 'occupied') {
            setSelectedTable(table);
            setShowTableSelector(false);
            setIsDetailModalOpen(true);
        }
    };

    const handleOpenTakeoutModal = () => {
        if (isClosed) {
            alert('⚠️ Caja Cerrada\n\nNo se pueden crear nuevos pedidos hoy.');
            return;
        }
        setOrderToEdit(undefined);
        setTakeoutOrderType('takeout');
        setShowTableSelector(false);
        setIsOrderModalOpen(true);
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

    const handleCloseTableSelector = () => {
        setShowTableSelector(false);
    };

    const handleEditOrder = (order: Order) => {
        setOrderToEdit(order);
        setIsDetailModalOpen(false);
        setIsOrderModalOpen(true);
        setTakeoutOrderType(order.orderType || 'dine-in');
    };

    return {
        // Data
        allTables,
        activeOrders,
        tablesLoading,
        isClosed,
        selectedTable,
        orderToEdit,
        takeoutOrderType,

        // Modal states
        showTableSelector,
        isOrderModalOpen,
        setIsOrderModalOpen,
        isDetailModalOpen,

        // Setters
        setTakeoutOrderType,

        // Handlers
        handleFABClick,
        handleTableClick,
        handleCloseOrderModal,
        handleCloseDetailModal,
        handleCloseTableSelector,
        handleEditOrder,
    };
}
