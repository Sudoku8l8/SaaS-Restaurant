import { useLiveQuery } from 'dexie-react-hooks';
import { orders as ordersdb } from '@/local-db/orders';
import { useAuth } from './useAuth';
import type { Order, OrderStatus } from '@/types';

export function useOrders() {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId || '';

    const activeOrders = useLiveQuery(
        () => ordersdb.getActiveByRestaurant(restaurantId),
        [restaurantId]
    );

    const createOrder = async (order: Order) => {
        return ordersdb.add(order);
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        return ordersdb.updateStatus(orderId, status);
    };

    return {
        activeOrders,
        createOrder,
        updateOrderStatus
    };
}
