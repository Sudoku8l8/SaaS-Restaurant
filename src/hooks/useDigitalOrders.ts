import { useState, useEffect, useRef } from 'react';
import { db } from '@/services/firebase/config';
import {
    collection, query, where, onSnapshot,
    addDoc, updateDoc, doc, getDocs, limit,
    runTransaction, increment, serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { DigitalOrder, OrderItem } from '@/types';
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

// ── Helper: merge incoming digital order items into existing order items ────
function mergeOrderItems(existing: OrderItem[], incoming: OrderItem[]): OrderItem[] {
    const merged = existing.map(item => ({ ...item })); // shallow clone
    for (const item of incoming) {
        const match = merged.find(
            m => m.productId === item.productId
                && JSON.stringify(m.selectedOptions || []) === JSON.stringify(item.selectedOptions || [])
        );
        if (match) {
            match.quantity += item.quantity;
            match.subtotal = match.quantity * match.price;
        } else {
            merged.push({ ...item });
        }
    }
    return merged;
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

    /** Accept a table order: create real Order (or merge into existing), occupy table, mark digitalOrder accepted */
    const acceptTableOrder = async (digitalOrder: DigitalOrder) => {
        if (!user || !restaurantId) return;

        // Pre-read: check if this table already has an active (non-paid) order
        const tableNum = digitalOrder.tableNumber ?? 0;

        let existingOrderDoc: { id: string; ref: any; data: any } | null = null;
        if (tableNum > 0) {
            const existingSnap = await getDocs(
                query(
                    collection(db, 'orders'),
                    where('restaurantId', '==', restaurantId),
                    where('tableNumber', '==', tableNum),
                )
            );
            // Find a non-paid order for this table
            const activeDoc = existingSnap.docs.find(d => {
                const s = d.data().status;
                return s !== 'paid' && s !== 'cancelled';
            });
            if (activeDoc) {
                existingOrderDoc = { id: activeDoc.id, ref: activeDoc.ref, data: activeDoc.data() };
            }
        }

        // Pre-read: find the table document
        let tableDocRef: any = null;
        if (tableNum > 0) {
            const tablesSnap = await getDocs(
                query(
                    collection(db, 'tables'),
                    where('restaurantId', '==', restaurantId),
                    where('number', '==', tableNum),
                    limit(1)
                )
            );
            if (!tablesSnap.empty) {
                tableDocRef = tablesSnap.docs[0].ref;
            }
        }

        await runTransaction(db, async (transaction) => {
            if (existingOrderDoc) {
                // ─── MERGE: append items into the existing order ─────────────
                const freshSnap = await transaction.get(existingOrderDoc.ref);
                if (freshSnap.exists()) {
                    const freshData = freshSnap.data() as any;
                    const mergedItems = mergeOrderItems(freshData.items || [], digitalOrder.items);
                    const newTotal = mergedItems.reduce((s: number, i: any) => s + i.subtotal, 0);

                    transaction.update(existingOrderDoc.ref, {
                        items: mergedItems,
                        total: newTotal,
                        updatedAt: getPeruNow(),
                    });

                    // Mark digitalOrder as accepted (merged)
                    transaction.update(doc(db, 'digitalOrders', digitalOrder.id), {
                        status: 'accepted',
                        acceptedAt: serverTimestamp(),
                        acceptedBy: user.id,
                        createdOrderId: existingOrderDoc.id,
                        mergedIntoExisting: true,
                    });
                    return; // Done — no new order needed
                }
            }

            // ─── CREATE: no existing order, create a new one ─────────────
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

            // 2. Create Order (with dateStr + tableId for optimized queries)
            const orderId = doc(collection(db, 'orders')).id;
            const now = getPeruNow();
            const orderRef = doc(db, 'orders', orderId);
            transaction.set(orderRef, {
                id: orderId,
                restaurantId,
                tableNumber: tableNum,
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
                dateStr: getPeruDateString(),
                tableId: tableDocRef?.id || null,
                fromDigitalMenu: true,
            });

            // 3. Occupy table
            if (tableDocRef) {
                transaction.update(tableDocRef, {
                    status: 'occupied',
                    currentOrderId: orderId,
                });
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
