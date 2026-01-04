import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { RestaurantTable } from '@/types';

export function useTables() {
    const { user } = useAuth();
    const restaurantId = user?.restaurantId || '';
    const [tables, setTables] = useState<RestaurantTable[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) return;

        const q = query(
            collection(db, 'tables'),
            where('restaurantId', '==', restaurantId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tableData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RestaurantTable));
            setTables(tableData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching tables:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [restaurantId]);

    return { tables, isLoading };
}
