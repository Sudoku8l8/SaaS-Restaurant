import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc,
    writeBatch,
    getDocs,
    getDoc,
    addDoc,
    limit
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { Order, OrderStatus, OrderPayment } from '@/types';
import { ensurePeruDate, getPeruNow, getPeruDateString } from '@/utils/dateUtils';

export function useOrders() {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId || '';
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);

    // Subscribe to active orders
    useEffect(() => {
        if (!restaurantId) return;

        const q = query(
            collection(db, 'orders'),
            where('restaurantId', '==', restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamps to Peru Dates
                    createdAt: ensurePeruDate(data.createdAt),
                    updatedAt: ensurePeruDate(data.updatedAt || data.createdAt),
                    closedAt: data.closedAt ? ensurePeruDate(data.closedAt) : undefined
                } as Order;
            });

            // Client-side sorting & double-check filtering to ensure reactivity even with index issues
            const active = orders
                .filter(o => o.status !== 'paid')
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            setActiveOrders(active);
        }, (error) => {
            console.error("Error en useOrders (onSnapshot):", error);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    const createOrder = async (order: Order) => {
        const { runTransaction, doc, collection, query, where, limit, getDocs, increment } = await import('firebase/firestore');
        const { getPeruDateString } = await import('@/utils/dateUtils');

        await runTransaction(db, async (transaction) => {
            const dateStr = getPeruDateString(order.createdAt);
            const counterRef = doc(db, `restaurants/${restaurantId}/dailyCounters/${dateStr}`);
            const counterSnap = await transaction.get(counterRef);

            let dailyNumber = 1;
            if (counterSnap.exists()) {
                dailyNumber = counterSnap.data().count + 1;
                transaction.update(counterRef, { count: increment(1) });
            } else {
                transaction.set(counterRef, { count: 1 });
            }

            // Assign daily number to order
            const orderWithNumber = { ...order, dailyNumber };
            const orderRef = doc(db, 'orders', order.id);
            transaction.set(orderRef, orderWithNumber);

            // Find and update table status
            const tablesRef = collection(db, 'tables');
            const q = query(
                tablesRef,
                where('restaurantId', '==', restaurantId),
                where('number', '==', order.tableNumber),
                limit(1)
            );
            const tableSnap = await getDocs(q);

            if (!tableSnap.empty) {
                const tableDoc = tableSnap.docs[0];
                transaction.update(tableDoc.ref, {
                    status: 'occupied',
                    currentOrderId: order.id
                });
            }
        });
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status,
            updatedAt: getPeruNow()
        });
    };

    const payOrder = async (orderId: string, payments: OrderPayment[]) => {
        // ── B5: Auto-create today's cash session if it doesn't exist ──────────
        const todayStr = getPeruDateString();

        const closuresRef = collection(db, 'closures');
        const existingSessionQuery = query(
            closuresRef,
            where('restaurantId', '==', restaurantId),
            where('date', '==', todayStr),
            limit(1)
        );
        const existingSessionSnap = await getDocs(existingSessionQuery);

        if (existingSessionSnap.empty) {
            // No session for today — create one automatically
            const currentUser = user; // captured from hook scope
            await addDoc(closuresRef, {
                restaurantId,
                date: todayStr,
                openingBalance: 0,
                totalSales: 0,
                orderCount: 0,
                salesByWaiter: {},
                salesByPaymentMethod: {},
                expenses: [],
                status: 'open',
                createdAt: getPeruNow(),
                createdBy: currentUser?.id || 'system',
                createdByName: currentUser?.name || 'Auto-apertura',
                autoCreated: true, // flag for audit purposes
            });
            console.info(`📦 Auto-apertura de caja para ${todayStr} creada automáticamente.`);
        }
        // ─────────────────────────────────────────────────────────────────────

        const orderRef = doc(db, 'orders', orderId);

        // Transaction to update order and free table
        const batch = writeBatch(db); // Using batch for simplicity, transaction if we need read-before-write safety on the exact same fields.

        // 1. Update Order
        batch.update(orderRef, {
            status: 'paid',
            payments,
            paymentMethod: payments[0]?.method || 'cash', // Legacy support
            closedAt: getPeruNow(),
            updatedAt: getPeruNow()
        });

        // 2. Free Table
        // Need to get the order to know the table... we only have ID here.
        // We can pass tableNumber or query order first.
        // Let's query order first to be safe (or passed from UI).
        // For efficiency, assume we need to fetch order to get tableNumber.
        // Or we can just fetch it.
        // Find order from activeOrders to get tableNumber
        const existingOrder = activeOrders.find(o => o.id === orderId);

        if (existingOrder) {
            const tablesRef = collection(db, 'tables');
            const q = query(
                tablesRef,
                where('restaurantId', '==', restaurantId),
                where('number', '==', existingOrder.tableNumber),
                limit(1)
            );
            const tableSnap = await getDocs(q);
            if (!tableSnap.empty) {
                batch.update(tableSnap.docs[0].ref, {
                    status: 'free',
                    currentOrderId: null // Firestore doesn't like undefined, use null or delete field
                });
            }
        }

        // 3. Discount Inventory
        if (existingOrder && existingOrder.items?.length > 0) {
            for (const item of existingOrder.items) {
                const productRef = doc(db, 'products', item.productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    const productData = productSnap.data();
                    if (productData.controlaStock) {
                        const currentStock = productData.stockActual || 0;
                        const qtyToDeduct = item.quantity || 1;
                        let newStock = currentStock - qtyToDeduct;

                        // El stock no puede ser negativo
                        if (newStock < 0) newStock = 0;

                        batch.update(productRef, {
                            stockActual: newStock,
                            fechaActualizacionStock: getPeruNow()
                        });
                    }
                }
            }
        }

        await batch.commit();
    };

    const deleteOrder = async (orderId: string) => {
        const orderRef = doc(db, 'orders', orderId);

        // Transaction to delete order and free table
        const batch = writeBatch(db);

        // Find order from activeOrders to get tableNumber
        const existingOrder = activeOrders.find(o => o.id === orderId);

        if (existingOrder) {
            const tablesRef = collection(db, 'tables');
            const q = query(
                tablesRef,
                where('restaurantId', '==', restaurantId),
                where('number', '==', existingOrder.tableNumber),
                limit(1)
            );
            const tableSnap = await getDocs(q);
            if (!tableSnap.empty) {
                batch.update(tableSnap.docs[0].ref, {
                    status: 'free',
                    currentOrderId: null
                });
            }
        }

        // Delete Order
        batch.delete(orderRef);

        await batch.commit();
    };

    const updateOrder = async (orderId: string, updates: Partial<Order>) => {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            ...updates,
            updatedAt: new Date()
        });
    };

    return {
        activeOrders,
        createOrder,
        updateOrderStatus,
        payOrder,
        deleteOrder,
        updateOrder
    };
}
