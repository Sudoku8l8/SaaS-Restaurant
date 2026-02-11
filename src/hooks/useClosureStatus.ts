import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

/**
 * Hook to check if today's cash box has been closed.
 * Returns true if there's a closure for today, blocking further operations.
 * 
 * Set VITE_DEMO_MODE=true in .env to bypass this check for demos/testing.
 */
export function useClosureStatus() {
    const { user } = useAuth();
    const [isClosed, setIsClosed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 🔧 DEMO MODE: Skip closure check if enabled
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

    useEffect(() => {
        // If demo mode is on, always return "not closed"
        if (isDemoMode) {
            console.log('🎭 Demo Mode: Closure check bypassed');
            setIsClosed(false);
            setIsLoading(false);
            return;
        }

        if (!user?.restaurantId) {
            setIsLoading(false);
            return;
        }

        const todayStr = format(new Date(), 'yyyy-MM-dd');

        const q = query(
            collection(db, 'closures'),
            where('restaurantId', '==', user.restaurantId),
            where('date', '==', todayStr),
            where('status', '==', 'closed')
        );

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setIsClosed(!snapshot.empty);
            setIsLoading(false);
        }, (error) => {
            console.error("Error watching closure status:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.restaurantId, isDemoMode]);

    return { isClosed, isLoading };
}
