import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    limit,
    Timestamp
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { getPeruDateString, getPeruNow } from '@/utils/dateUtils';
import type { Closure } from '@/types';

export function useCashSession() {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId || '';
    const [currentSession, setCurrentSession] = useState<Closure | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const today = getPeruDateString();
        const q = query(
            collection(db, 'closures'),
            where('restaurantId', '==', restaurantId),
            where('date', '==', today),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data();
                setCurrentSession({
                    id: snapshot.docs[0].id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
                } as Closure);
            } else {
                setCurrentSession(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    const openSession = async (openingBalance: number) => {
        if (!restaurantId || !user) return;

        const today = getPeruDateString();
        const newSession: Omit<Closure, 'id'> = {
            restaurantId,
            date: today,
            openingBalance,
            totalSales: 0,
            orderCount: 0,
            salesByWaiter: {},
            salesByPaymentMethod: {},
            expenses: [],
            status: 'open',
            createdAt: getPeruNow(),
            createdBy: user.id,
            createdByName: user.name
        };

        await addDoc(collection(db, 'closures'), newSession);
    };



    return {
        currentSession,
        isLoading,
        openSession,
    };
}
