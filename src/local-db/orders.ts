import { db } from './db';
import type { Order, OrderStatus } from '@/types';

export const orders = {
    // Create new order
    async create(order: Order) {
        return db.transaction('rw', db.orders, db.restaurantTables, async () => {
            await db.orders.add(order);
        });
    },

    async add(order: Order) {
        await db.orders.add(order);
    },

    async getByStatus(restaurantId: string, status: OrderStatus) {
        return db.orders
            .where('[restaurantId+status]')
            .equals([restaurantId, status])
            .sortBy('createdAt');
    },

    async getActiveByRestaurant(restaurantId: string) {
        return db.orders
            .where('restaurantId')
            .equals(restaurantId)
            .filter(order => order.status !== 'paid' && (order.status as string) !== 'cancelled')
            .sortBy('createdAt');
    },

    async getByTable(restaurantId: string, tableNumber: number) {
        return db.orders
            .where('[restaurantId+tableNumber]')
            .equals([restaurantId, tableNumber])
            .last();
    },

    async updateStatus(orderId: string, status: OrderStatus) {
        return db.transaction('rw', db.orders, async () => {
            const order = await db.orders.get(orderId);
            if (!order) throw new Error('Order not found');

            // Simple State Machine Validation
            const current = order.status;
            let isValid = false;

            if (current === 'pending' && status === 'in_preparation') isValid = true;
            if (current === 'in_preparation' && status === 'ready') isValid = true;
            if (current === 'ready' && status === 'delivered') isValid = true;
            if (current === 'delivered' && status === 'paid') isValid = true;
            if (status === 'cancelled' && current !== 'paid') isValid = true; // Allow cancelling any non-paid order

            if (!isValid) {
                console.warn(`Invalid transition from ${current} to ${status}`);
                // For now allow it to avoid UI blocks if state desyncs, but log it.
                // throw new Error(`Invalid transition from ${current} to ${status}`);
            }

            await db.orders.update(orderId, {
                status,
                updatedAt: new Date()
            });
        });
    },

    async delete(orderId: string) {
        await db.orders.delete(orderId);
    }
};
