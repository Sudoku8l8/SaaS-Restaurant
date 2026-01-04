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
        await db.orders.update(orderId, {
            status,
            updatedAt: new Date()
        });
    },

    async delete(orderId: string) {
        await db.orders.delete(orderId);
    }
};
