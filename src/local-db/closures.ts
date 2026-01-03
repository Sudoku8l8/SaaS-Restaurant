import { db } from './db';
import type { Closure } from '@/types';

/**
 * Create a new closure
 */
export async function createClosure(
    closure: Omit<Closure, 'id'>
): Promise<string> {
    const id = await db.closures.add({
        ...closure,
        id: crypto.randomUUID(),
    } as Closure);
    return id;
}

/**
 * Get closure by date
 */
export async function getClosureByDate(
    restaurantId: string,
    date: Date
): Promise<Closure | undefined> {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    return await db.closures
        .where('restaurantId')
        .equals(restaurantId)
        .and(
            closure => closure.date >= startOfDay && closure.date <= endOfDay
        )
        .first();
}

/**
 * Get all closures for a restaurant
 */
export async function getAllClosures(
    restaurantId: string
): Promise<Closure[]> {
    return await db.closures
        .where('restaurantId')
        .equals(restaurantId)
        .reverse()
        .sortBy('date');
}

/**
 * Get unsynced closures
 */
export async function getUnsyncedClosures(
    restaurantId: string
): Promise<Closure[]> {
    return await db.closures
        .where('restaurantId')
        .equals(restaurantId)
        .and(closure => !closure.syncedAt)
        .toArray();
}

/**
 * Mark closure as synced
 */
export async function markClosureAsSynced(
    closureId: string
): Promise<void> {
    await db.closures.update(closureId, {
        syncedAt: new Date(),
    });
}
