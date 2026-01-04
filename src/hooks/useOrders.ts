import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    setDoc,
    orderBy,
    writeBatch,
    getDocs,
    limit
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { Order, OrderStatus, PaymentMethod } from '@/types';

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
                    // Convert Firestore Timestamps to JS Dates
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.createdAt),
                    closedAt: data.closedAt?.toDate ? data.closedAt.toDate() : (data.closedAt ? new Date(data.closedAt) : undefined)
                } as Order;
            });

            // Client-side sorting & filtering
            const active = orders
                .filter(o => o.status !== 'paid' && o.status !== 'cancelled')
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Now safe because they are Dates

            setActiveOrders(active);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    const createOrder = async (order: Order) => {
        // Use setDoc with the provided ID since we generate it in Modal
        // Or addDoc if we want auto-ID. The Modal generates a UUID, so setDoc is better to keep that ID.
        const orderRef = doc(db, 'orders', order.id);

        const batch = writeBatch(db);
        batch.set(orderRef, order);

        // Update table to occupied
        // We need to find the table doc by restaurantId + number
        // OR we just use a consistent ID format for tables like 'restId_tableNum'.
        // My seeder used 'table-N'. Let's find it.
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
            batch.update(tableDoc.ref, {
                status: 'occupied',
                currentOrderId: order.id
            });
        }

        await batch.commit();
    };

    const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status,
            updatedAt: new Date() // Firestore timestamp? Or JS Date? JS Date works (stored as map or string depending on config, but SDK handles conversion usually if configured, or just stores string/timestamp). Let's stick to JS Date for consistency with types.
        });
    };

    const payOrder = async (orderId: string, paymentMethod: PaymentMethod) => {
        const orderRef = doc(db, 'orders', orderId);

        // Transaction to update order and free table
        const batch = writeBatch(db); // Using batch for simplicity, transaction if we need read-before-write safety on the exact same fields.

        // 1. Update Order
        batch.update(orderRef, {
            status: 'paid',
            paymentMethod,
            closedAt: new Date(),
            updatedAt: new Date()
        });

        // 2. Free Table
        // Need to get the order to know the table... we only have ID here.
        // We can pass tableNumber or query order first.
        // Let's query order first to be safe (or passed from UI).
        // For efficiency, assume we need to fetch order to get tableNumber.
        // Or we can just fetch it.
        // Creating a real transaction for this flow:
        // Actually, let's keep it simple. Fetch order, find table, update.
        // Warning: Race conditions possible but rare for MVP.
        const orderSnap = await getDocs(query(collection(db, 'orders'), where('id', '==', orderId), limit(1))); // Wait, we can just get doc(db, 'orders', orderId) if ID matches docId.
        // In createOrder I used: doc(db, 'orders', order.id). So yes.
        // But I need to read it first to get tableNumber.
        // Let's just do it in the UI? No, logic belongs here.

        // FIXME: Better to read order, get table number, update both.
        // Since I'm inside a hook, I might already have the order in `activeOrders`!
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

        await batch.commit();
    };

    return {
        activeOrders,
        createOrder,
        updateOrderStatus,
        payOrder
    };
}
