import { useState, useEffect, useRef } from 'react';
import { db } from '@/services/firebase/config';
import {
    collection, query, where, onSnapshot,
    addDoc, updateDoc, doc, getDocs, limit,
    runTransaction, increment, serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { DigitalOrder } from '@/types';
import { getPeruNow, getPeruDateString } from '@/utils/dateUtils';

// ── Notification sound (short chime encoded as base64 data URI) ────────────
// This is a short 0.4s sine-wave beep generated inline, no external deps.
function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.4);
    } catch {
        // Silently fail if AudioContext is not available
    }
}

export function useDigitalOrders() {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId || '';
    const [pendingOrders, setPendingOrders] = useState<DigitalOrder[]>([]);
    const prevCountRef = useRef(0);

    useEffect(() => {
        if (!restaurantId) return;

        const q = query(
            collection(db, 'digitalOrders'),
            where('restaurantId', '==', restaurantId),
            where('status', '==', 'pending'),
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
            })) as DigitalOrder[];

            // Sort newest first
            orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            // Play sound when new orders arrive (not on first load)
            if (orders.length > prevCountRef.current && prevCountRef.current !== -1) {
                playNotificationSound();
            }
            prevCountRef.current = orders.length;

            setPendingOrders(orders);
        }, (err) => {
            console.error('useDigitalOrders error:', err);
        });

        // Mark first load done without playing sound
        setTimeout(() => {
            prevCountRef.current = pendingOrders.length;
        }, 1500);

        return () => unsubscribe();
    }, [restaurantId]);

    /** Accept a table order: create real Order, occupy table, mark digitalOrder accepted */
    const acceptTableOrder = async (digitalOrder: DigitalOrder) => {
        if (!user || !restaurantId) return;

        await runTransaction(db, async (transaction) => {
            // 1. Get daily counter
            const dateStr = getPeruDateString();
            const counterRef = doc(db, `restaurants/${restaurantId}/dailyCounters/${dateStr}`);
            const counterSnap = await transaction.get(counterRef);

            let dailyNumber = 1;
            if (counterSnap.exists()) {
                dailyNumber = counterSnap.data().count + 1;
                transaction.update(counterRef, { count: increment(1) });
            } else {
                transaction.set(counterRef, { count: 1 });
            }

            // 2. Create Order
            const orderId = doc(collection(db, 'orders')).id;
            const now = getPeruNow();
            const orderRef = doc(db, 'orders', orderId);
            transaction.set(orderRef, {
                id: orderId,
                restaurantId,
                tableNumber: digitalOrder.tableNumber ?? 0,
                items: digitalOrder.items,
                status: 'pending',
                total: digitalOrder.total,
                createdAt: now,
                updatedAt: now,
                userId: user.id,
                userName: user.name,
                orderType: 'dine-in',
                customerName: digitalOrder.customerName || '',
                dailyNumber,
                fromDigitalMenu: true,
            });

            // 3. Occupy table
            if (digitalOrder.tableNumber) {
                const tablesSnap = await getDocs(
                    query(
                        collection(db, 'tables'),
                        where('restaurantId', '==', restaurantId),
                        where('number', '==', digitalOrder.tableNumber),
                        limit(1)
                    )
                );
                if (!tablesSnap.empty) {
                    transaction.update(tablesSnap.docs[0].ref, {
                        status: 'occupied',
                        currentOrderId: orderId,
                    });
                }
            }

            // 4. Mark digitalOrder as accepted
            transaction.update(doc(db, 'digitalOrders', digitalOrder.id), {
                status: 'accepted',
                acceptedAt: serverTimestamp(),
                acceptedBy: user.id,
                createdOrderId: orderId,
            });
        });
    };

    /** Dismiss a WhatsApp notification (mark seen) */
    const dismissOrder = async (digitalOrderId: string) => {
        await updateDoc(doc(db, 'digitalOrders', digitalOrderId), {
            status: 'dismissed',
            acceptedAt: serverTimestamp(),
            acceptedBy: user?.id,
        });
    };

    return { pendingOrders, acceptTableOrder, dismissOrder };
}

/** Helper: create a digitalOrder document from the public checkout */
export async function createDigitalOrder(data: Omit<DigitalOrder, 'id' | 'createdAt' | 'status'>) {
    const ref = await addDoc(collection(db, 'digitalOrders'), {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
    });
    return ref.id;
}
