import { db } from './db';
import type { RestaurantTable, TableStatus } from '@/types';

/**
 * Create a new table
 */
export async function createTable(
    table: Omit<RestaurantTable, 'id'>
): Promise<string> {
    const id = await db.restaurantTables.add({
        ...table,
        id: crypto.randomUUID(),
    } as RestaurantTable);
    return id;
}

/**
 * Get all tables for a restaurant
 */
export async function getTables(restaurantId: string): Promise<RestaurantTable[]> {
    return await db.restaurantTables.where('restaurantId').equals(restaurantId).toArray();
}

/**
 * Get table by number
 */
export async function getTableByNumber(
    restaurantId: string,
    tableNumber: number
): Promise<RestaurantTable | undefined> {
    return await db.restaurantTables
        .where('[restaurantId+number]')
        .equals([restaurantId, tableNumber])
        .first();
}

/**
 * Update table status
 */
export async function updateTableStatus(
    tableId: string,
    status: TableStatus,
    currentOrderId?: string
): Promise<void> {
    await db.restaurantTables.update(tableId, {
        status,
        currentOrderId,
    });
}

/**
 * Get available (free) tables
 */
export async function getAvailableTables(
    restaurantId: string
): Promise<RestaurantTable[]> {
    return await db.restaurantTables
        .where('restaurantId')
        .equals(restaurantId)
        .and(table => table.status === 'free')
        .toArray();
}

/**
 * Delete a table
 */
export async function deleteTable(tableId: string): Promise<void> {
    await db.restaurantTables.delete(tableId);
}
