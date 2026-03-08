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
    limit,
    increment
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

        // OPT: Only fetch active (non-paid, non-cancelled) orders from Firestore
        const q = query(
            collection(db, 'orders'),
            where('restaurantId', '==', restaurantId),
            where('status', 'in', ['pending', 'in_preparation', 'ready', 'delivered'])
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

            // Sort by creation date
            const active = orders
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

            // OPT: Find table doc BEFORE transaction (reads outside, writes inside)
            // Note: this pre-read was moved outside, but since we're already in a
            // transaction and Firebase allows reads before writes, we keep it here.

            // Find and update table status
            const tablesRef = collection(db, 'tables');
            const q = query(
                tablesRef,
                where('restaurantId', '==', restaurantId),
                where('number', '==', order.tableNumber),
                limit(1)
            );
            const tableSnap = await getDocs(q);

            const tableDocId = !tableSnap.empty ? tableSnap.docs[0].id : undefined;

            // Assign daily number + dateStr + tableId to order
            const orderWithExtras = {
                ...order,
                dailyNumber,
                dateStr,
                tableId: tableDocId || null,
            };
            const orderRef = doc(db, 'orders', order.id);
            transaction.set(orderRef, orderWithExtras);

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

    const payOrder = async (orderId: string, payments: OrderPayment[], discount?: { type: 'percentage' | 'fixed'; value: number; amount: number }) => {
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

        // Build discount-aware update
        const existingOrder = activeOrders.find(o => o.id === orderId);
        const orderUpdate: Record<string, any> = {
            status: 'paid',
            payments,
            paymentMethod: payments[0]?.method || 'cash', // Legacy support
            closedAt: getPeruNow(),
            updatedAt: getPeruNow()
        };

        if (discount && discount.amount > 0 && existingOrder) {
            const originalTotal = existingOrder.total;
            orderUpdate.subtotal = originalTotal;
            orderUpdate.discount = discount;
            orderUpdate.total = parseFloat((originalTotal - discount.amount).toFixed(2));
        }

        // 1. Update Order
        batch.update(orderRef, orderUpdate);

        // 2. Free Table
        // Need to get the order to know the table... we only have ID here.
        // We can pass tableNumber or query order first.
        // Let's query order first to be safe (or passed from UI).
        // For efficiency, assume we need to fetch order to get tableNumber.
        // Or we can just fetch it.
        // Find order from activeOrders to get tableNumber
        // (existingOrder is already defined above)

        // OPT: Use stored tableId to update table directly (avoids extra query)
        if (existingOrder?.tableId) {
            const tableRef = doc(db, 'tables', existingOrder.tableId);
            batch.update(tableRef, {
                status: 'free',
                currentOrderId: null
            });
        } else if (existingOrder) {
            // Fallback for old orders without tableId
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

        // 3. Discount Inventory + Log Movements
        if (existingOrder && existingOrder.items?.length > 0) {
            for (const item of existingOrder.items) {
                const productRef = doc(db, 'products', item.productId);
                const productSnap = await getDoc(productRef);

                if (productSnap.exists()) {
                    const productData = productSnap.data();
                    if (productData.controlaStock) {
                        const qtyToDeduct = item.quantity || 1;

                        if (productData.tipoInventario === 'recipe') {
                            // Recipe-based: deduct ingredients from inventory_items
                            const recipesRef = collection(db, 'recipes');
                            const recipeQuery = query(
                                recipesRef,
                                where('restaurantId', '==', restaurantId),
                                where('productId', '==', item.productId),
                                limit(1)
                            );
                            const recipeSnap = await getDocs(recipeQuery);

                            if (!recipeSnap.empty) {
                                const recipeData = recipeSnap.docs[0].data();
                                const ingredients = recipeData.ingredients || [];

                                for (const ing of ingredients) {
                                    const ingRef = doc(db, 'inventory_items', ing.inventoryItemId);
                                    const ingQty = (ing.quantity || 0) * qtyToDeduct;

                                    batch.update(ingRef, {
                                        stockActual: increment(-ingQty),
                                        updatedAt: getPeruNow(),
                                    });

                                    // Log movement for each ingredient
                                    const movRef = doc(collection(db, 'inventory_movements'));
                                    batch.set(movRef, {
                                        restaurantId,
                                        productId: ing.inventoryItemId,
                                        productName: ing.itemName || 'Insumo',
                                        type: 'sale',
                                        quantity: -ingQty,
                                        unit: ing.unit || 'unidad',
                                        referenceId: orderId,
                                        referenceType: 'order',
                                        reason: `Venta de ${productData.name} x${qtyToDeduct}`,
                                        userId: user?.id || 'system',
                                        userName: user?.name || 'Sistema',
                                        createdAt: getPeruNow(),
                                    });
                                }
                            }
                        } else {
                            // Simple product: deduct directly from product stock
                            const currentStock = productData.stockActual || 0;
                            let newStock = currentStock - qtyToDeduct;
                            if (newStock < 0) newStock = 0;

                            batch.update(productRef, {
                                stockActual: newStock,
                                fechaActualizacionStock: getPeruNow()
                            });

                            // Log movement for simple product
                            const movRef = doc(collection(db, 'inventory_movements'));
                            batch.set(movRef, {
                                restaurantId,
                                productId: item.productId,
                                productName: productData.name || item.productId,
                                type: 'sale',
                                quantity: -qtyToDeduct,
                                unit: productData.unidadMedida || 'unidad',
                                referenceId: orderId,
                                referenceType: 'order',
                                userId: user?.id || 'system',
                                userName: user?.name || 'Sistema',
                                createdAt: getPeruNow(),
                            });
                        }
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

        // OPT: Use stored tableId to update table directly (avoids extra query)
        if (existingOrder?.tableId) {
            const tableRef = doc(db, 'tables', existingOrder.tableId);
            batch.update(tableRef, {
                status: 'free',
                currentOrderId: null
            });
        } else if (existingOrder) {
            // Fallback for old orders without tableId
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
            updatedAt: getPeruNow()
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
