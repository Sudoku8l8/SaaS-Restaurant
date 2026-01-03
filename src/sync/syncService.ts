/**
 * Sync Service - Handles synchronization between IndexedDB and Firebase
 * 
 * This service is responsible for:
 * - Detecting internet connectivity
 * - Syncing closures to Firebase Firestore
 * - Handling sync errors and retries
 */

import { getUnsyncedClosures } from '@/local-db';

/**
 * Check if online
 */
export function isOnline(): boolean {
    return navigator.onLine;
}

/**
 * Sync all unsynced closures to Firebase
 * This will be implemented in Sprint 5
 */
export async function syncClosures(restaurantId: string): Promise<void> {
    if (!isOnline()) {
        console.warn('Cannot sync: offline');
        return;
    }

    try {
        const unsyncedClosures = await getUnsyncedClosures(restaurantId);

        if (unsyncedClosures.length === 0) {
            console.log('No closures to sync');
            return;
        }

        console.log(`Syncing ${unsyncedClosures.length} closures...`);

        // TODO: Implement Firebase sync in Sprint 5
        // for (const closure of unsyncedClosures) {
        //   await uploadClosureToFirebase(closure);
        //   await markClosureAsSynced(closure.id);
        // }

        console.log('Sync completed');
    } catch (error) {
        console.error('Sync error:', error);
        throw error;
    }
}

/**
 * Setup auto-sync (every hour)
 */
export function setupAutoSync(restaurantId: string): () => void {
    const intervalId = setInterval(
        () => {
            if (isOnline()) {
                syncClosures(restaurantId).catch(console.error);
            }
        },
        60 * 60 * 1000
    ); // 1 hour

    // Return cleanup function
    return () => clearInterval(intervalId);
}

/**
 * Listen for online/offline events
 */
export function setupConnectivityListener(
    onOnline: () => void,
    onOffline: () => void
): () => void {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Return cleanup function
    return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
    };
}
