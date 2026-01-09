import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { format, subDays } from 'date-fns';

export interface PendingClosure {
    date: string;
    orderCount: number;
    totalAmount: number;
}

export function usePendingClosures() {
    const { user } = useAuth();
    const [pendingClosures, setPendingClosures] = useState<PendingClosure[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.restaurantId) return;

        // Query closures of the last 30 days to check what's missing
        const checkPending = async () => {
            try {
                const todayStr = format(new Date(), 'yyyy-MM-dd');

                // 1. Get all paid orders from the last 30 days
                // To avoid overloading, we only check the last 30 days
                const thirtyDaysAgo = subDays(new Date(), 30);
                const ordersQuery = query(
                    collection(db, 'orders'),
                    where('restaurantId', '==', user.restaurantId),
                    where('status', '==', 'paid'),
                    where('createdAt', '>=', thirtyDaysAgo)
                );

                const ordersSnapshot = await getDocs(ordersQuery);
                const ordersByDate: Record<string, { count: number, total: number }> = {};

                ordersSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    const dateStr = format(createdAt, 'yyyy-MM-dd');

                    if (dateStr !== todayStr) { // Only check past days
                        if (!ordersByDate[dateStr]) {
                            ordersByDate[dateStr] = { count: 0, total: 0 };
                        }
                        ordersByDate[dateStr].count += 1;
                        ordersByDate[dateStr].total += data.total || 0;
                    }
                });

                // 2. Get all closures from the last 30 days
                const closuresQuery = query(
                    collection(db, 'closures'),
                    where('restaurantId', '==', user.restaurantId),
                    where('date', '>=', format(thirtyDaysAgo, 'yyyy-MM-dd'))
                );

                const closuresSnapshot = await getDocs(closuresQuery);
                const closedDates = new Set(closuresSnapshot.docs.map(d => d.data().date));

                // 3. Filter dates that have orders but NO closure
                const pending = Object.entries(ordersByDate)
                    .filter(([date]) => !closedDates.has(date))
                    .map(([date, data]) => ({
                        date,
                        orderCount: data.count,
                        totalAmount: data.total
                    }))
                    .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

                setPendingClosures(pending);
                setIsLoading(false);
            } catch (error) {
                console.error("Error checking pending closures:", error);
                setIsLoading(false);
            }
        };

        // We run it once on mount or when restaurantId changes
        checkPending();

        // Bonus: Real-time listener for closures to update the list if the user closes one
        const closuresQuery = query(
            collection(db, 'closures'),
            where('restaurantId', '==', user.restaurantId)
        );
        const unsubscribe = onSnapshot(closuresQuery, () => {
            checkPending();
        });

        return () => unsubscribe();
    }, [user?.restaurantId]);

    return { pendingClosures, isLoading };
}
