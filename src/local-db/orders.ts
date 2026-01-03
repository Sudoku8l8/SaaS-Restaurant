import { db } from './db';
import type { Order, OrderStatus } from '@/types';

/**
 * Create a new order
 */
export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
    const id = await db.orders.add({
        ...order,
        id: crypto.randomUUID(),
    } as Order);
    return id;
}

/**
 * Get all orders by status
 */
export async function getOrdersByStatus(
    restaurantId: string,
    status: OrderStatus
): Promise<Order[]> {
    return await db.orders
        .where('[restaurantId+status]')
        .equals([restaurantId, status])
        .toArray();
}

/**
 * Get order by table number
 */
export async function getOrderByTable(
    restaurantId: string,
    tableNumber: number
): Promise<Order | undefined> {
    return await db.orders
        .where('[restaurantId+tableNumber]')
        .equals([restaurantId, tableNumber])
        .first();
}

/**
 * Get all active orders (not paid)
 */
export async function getActiveOrders(restaurantId: string): Promise<Order[]> {
    return await db.orders
        .where('restaurantId')
        .equals(restaurantId)
        .and(order => order.status !== 'paid')
        .toArray();
}

/**
 * Update order status
 */
export async function updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId: string
): Promise<void> {
    const order = await db.orders.get(orderId);
    if (!order) {
        throw new Error(`Order ${orderId} not found`);
    }

    const statusChange = {
        from: order.status,
        to: newStatus,
        timestamp: new Date(),
        userId,
    };

    await db.orders.update(orderId, {
        status: newStatus,
        updatedAt: new Date(),
        statusHistory: [...(order.statusHistory || []), statusChange],
    });
}

/**
 * Mark order as paid
 */
export async function markOrderAsPaid(
    orderId: string,
    paymentMethod: 'cash' | 'yape' | 'card'
): Promise<void> {
    await db.orders.update(orderId, {
        status: 'paid',
        paymentMethod,
        closedAt: new Date(),
        updatedAt: new Date(),
    });
}

/**
 * Delete an order (admin only)
 */
export async function deleteOrder(orderId: string): Promise<void> {
    await db.orders.delete(orderId);
}

/**
 * Get all orders for a specific date range
 */
export async function getOrdersByDateRange(
    restaurantId: string,
    startDate: Date,
    endDate: Date
): Promise<Order[]> {
    return await db.orders
        .where('restaurantId')
        .equals(restaurantId)
        .and(order => order.createdAt >= startDate && order.createdAt <= endDate)
        .toArray();
}
