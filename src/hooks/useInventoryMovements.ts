import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot, addDoc, orderBy, limit as fbLimit, Timestamp } from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { InventoryMovement, UnitOfMeasure, MovementType } from '@/types';
import { getPeruNow } from '@/utils/dateUtils';

interface CreateMovementParams {
    productId: string;
    productName: string;
    type: MovementType;
    quantity: number;
    unit: UnitOfMeasure;
    referenceId?: string;
    referenceType?: string;
    reason?: string;
}

export function useInventoryMovements(
    productId?: string | null,
    movementLimit: number = 50
) {
    const { user } = useAuth();
    const [movements, setMovements] = useState<InventoryMovement[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user?.restaurantId) return;

        setIsLoading(true);

        // Build query constraints — if productId is provided, filter by it
        const constraints = [
            where('restaurantId', '==', user.restaurantId),
        ];

        if (productId) {
            constraints.push(where('productId', '==', productId));
        }

        const q = query(
            collection(db, 'inventory_movements'),
            ...constraints,
            orderBy('createdAt', 'desc'),
            fbLimit(movementLimit)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const d = doc.data();
                return {
                    id: doc.id,
                    ...d,
                    createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt),
                } as InventoryMovement;
            });
            setMovements(data);
            setIsLoading(false);
        }, (err) => {
            console.error('Error loading inventory movements:', err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.restaurantId, productId, movementLimit]);

    const createMovement = useCallback(async (params: CreateMovementParams) => {
        if (!user?.restaurantId) return;

        const movement = {
            restaurantId: user.restaurantId,
            productId: params.productId,
            productName: params.productName,
            type: params.type,
            quantity: params.quantity,
            unit: params.unit,
            referenceId: params.referenceId || null,
            referenceType: params.referenceType || null,
            reason: params.reason || null,
            userId: user.id,
            userName: user.name,
            createdAt: Timestamp.fromDate(getPeruNow()),
        };

        await addDoc(collection(db, 'inventory_movements'), movement);
    }, [user?.restaurantId, user?.id, user?.name]);

    return { movements, isLoading, createMovement };
}
