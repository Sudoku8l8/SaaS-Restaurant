import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { startOfDay, isSameDay } from 'date-fns';
import type { Order } from '@/types';

export interface SalesMetrics {
    totalSales: number;
    orderCount: number;
    salesByWaiter: Record<string, number>;
    salesByPaymentMethod: Record<string, number>;
}

export function useDailySales() {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId || '';
    const [metrics, setMetrics] = useState<SalesMetrics>({
        totalSales: 0,
        orderCount: 0,
        salesByWaiter: {},
        salesByPaymentMethod: {}
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        // Query ALL orders for the restaurant to avoid composite index issues for now.
        // In a production app with thousands of orders, we would need composite indexes:
        // index: restaurantId + status + createdAt
        const q = query(
            collection(db, 'orders'),
            where('restaurantId', '==', restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const today = startOfDay(new Date());

            const paidOrdersToday = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    // Helper to safely get date from Timestamp or String or Date
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    return { ...data, createdAt } as Order;
                })
                .filter(order => {
                    // Filter: Status is 'paid' AND Created At is Today
                    const isPaid = order.status === 'paid';
                    const isToday = isSameDay(order.createdAt, new Date());
                    return isPaid && isToday;
                });

            // Calculate Metrics
            const newMetrics = paidOrdersToday.reduce((acc, order) => {
                acc.totalSales += order.total;
                acc.orderCount += 1;

                // Group by Waiter (User Name or ID)
                const waiterName = order.userName || 'Desconocido';
                acc.salesByWaiter[waiterName] = (acc.salesByWaiter[waiterName] || 0) + order.total;

                // Group by Payment Method
                const paymentMethod = order.paymentMethod || 'unknown';
                acc.salesByPaymentMethod[paymentMethod] = (acc.salesByPaymentMethod[paymentMethod] || 0) + order.total;

                return acc;
            }, {
                totalSales: 0,
                orderCount: 0,
                salesByWaiter: {} as Record<string, number>,
                salesByPaymentMethod: {} as Record<string, number>
            });

            setMetrics(newMetrics);
            setIsLoading(false);
        }, (err) => {
            console.error("Error calculating sales:", err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    return { metrics, isLoading };
}
