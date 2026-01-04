import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from './useAuth';

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

        const checkClosure = async () => {
            if (!user?.restaurantId) {
                setIsLoading(false);
                return;
            }

            const todayStr = new Date().toISOString().split('T')[0];

            try {
                const q = query(
                    collection(db, 'closures'),
                    where('restaurantId', '==', user.restaurantId),
                    where('date', '==', todayStr)
                );

                const snapshot = await getDocs(q);
                setIsClosed(!snapshot.empty);
            } catch (error) {
                console.error("Error checking closure status:", error);
                setIsClosed(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkClosure();
    }, [user?.restaurantId, isDemoMode]);

    return { isClosed, isLoading };
}
