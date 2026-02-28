import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { Order } from '@/types';
import { ensurePeruDate, getPeruDateString } from '@/utils/dateUtils';

export interface ProductMovement {
    orderId: string;
    date: Date;
    quantity: number;
    waiterName: string;
    orderType: string;
}

export function useProductMovements(productId: string | null) {
    const { user } = useAuth();
    const [movements, setMovements] = useState<ProductMovement[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user?.restaurantId || !productId) {
            setMovements([]);
            return;
        }

        const fetchMovements = async () => {
            setIsLoading(true);
            try {
                // Buscamos órdenes del día actual que estén pagadas y contengan el producto.
                // Idealmente deberíamos buscar en un subcolección de movimientos, pero por simplicidad
                // y como V1, buscaremos en las órdenes recientes o el reporte diario.
                // Como las órdenes se pueden filtrar por restaurante de forma general, hacemos la búsqueda en cliente
                // para evitar requerir índices complejos en Firebase por ahora.

                const todayStr = getPeruDateString();

                // Traremos solo ventas pagadas del día para no sobrecargar
                const q = query(
                    collection(db, 'orders'),
                    where('restaurantId', '==', user.restaurantId),
                    where('status', '==', 'paid')
                );

                const snapshot = await getDocs(q);

                const foundMovements: ProductMovement[] = [];

                snapshot.docs.forEach(doc => {
                    const orderData = doc.data() as Order;
                    const orderDate = ensurePeruDate(orderData.createdAt);

                    // Solo consideramos las de hoy
                    if (getPeruDateString(orderDate) !== todayStr) return;

                    if (orderData.items) {
                        const itemMatch = orderData.items.find(i => i.productId === productId);
                        if (itemMatch) {
                            foundMovements.push({
                                orderId: doc.id,
                                date: ensurePeruDate(orderData.closedAt || orderData.updatedAt || orderData.createdAt),
                                quantity: itemMatch.quantity,
                                waiterName: orderData.userName || 'Sistema',
                                orderType: orderData.orderType || 'dine-in'
                            });
                        }
                    }
                });

                // Ordenar por fecha descendente (más recientes primero)
                foundMovements.sort((a, b) => b.date.getTime() - a.date.getTime());
                setMovements(foundMovements);

            } catch (error) {
                console.error("Error fetching product movements:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMovements();
    }, [user?.restaurantId, productId]);

    return { movements, isLoading };
}
