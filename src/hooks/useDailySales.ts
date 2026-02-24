import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { Order } from '@/types';
import { ensurePeruDate, getPeruDateString } from '@/utils/dateUtils';

export interface SalesMetrics {
    totalSales: number;
    orderCount: number;
    salesByWaiter: Record<string, number>;
    salesByPaymentMethod: Record<string, number>;
}

export function useDailySales(targetDate?: Date) {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId || '';

    // Metrics State
    const [metrics, setMetrics] = useState<SalesMetrics>({
        totalSales: 0,
        orderCount: 0,
        salesByWaiter: {},
        salesByPaymentMethod: {}
    });

    // Raw Orders State (for export)
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Use a stable string to avoid infinite re-renders from Date object identity changes
    const targetDateStr = getPeruDateString(targetDate || new Date());

    useEffect(() => {
        if (!restaurantId) return;

        const q = query(
            collection(db, 'orders'),
            where('restaurantId', '==', restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {

            const paidOrdersToday = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return { ...data, createdAt: ensurePeruDate(data.createdAt) } as Order;
                })
                .filter(order => {
                    const isPaid = order.status === 'paid';
                    const orderDateStr = getPeruDateString(order.createdAt);
                    return isPaid && (orderDateStr === targetDateStr);
                });
            // ... rest of the logic remains the same ...

            // Update Orders State
            setOrders(paidOrdersToday);

            // Calculate Metrics
            const newMetrics = paidOrdersToday.reduce((acc, order) => {
                acc.totalSales += order.total;
                acc.orderCount += 1;

                const waiterName = order.userName || 'Desconocido';
                acc.salesByWaiter[waiterName] = (acc.salesByWaiter[waiterName] || 0) + order.total;

                if (order.payments && order.payments.length > 0) {
                    order.payments.forEach(p => {
                        const method = p.method || 'unknown';
                        acc.salesByPaymentMethod[method] = (acc.salesByPaymentMethod[method] || 0) + p.amount;
                    });
                } else {
                    const paymentMethod = order.paymentMethod || 'unknown';
                    acc.salesByPaymentMethod[paymentMethod] = (acc.salesByPaymentMethod[paymentMethod] || 0) + order.total;
                }

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
    }, [restaurantId, targetDateStr]);

    return { metrics, orders, isLoading };
}
