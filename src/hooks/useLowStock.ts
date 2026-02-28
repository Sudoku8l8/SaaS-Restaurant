import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import type { Product } from '@/types';

export function useLowStock() {
    const { user } = useAuth();
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.restaurantId) {
            setIsLoading(false);
            return;
        }

        // Solo productos con controlaStock activado
        const q = query(
            collection(db, 'products'),
            where('restaurantId', '==', user?.restaurantId),
            where('controlaStock', '==', true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allTracked = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

            // Filtramos en cliente para determinar los que están bajos/críticos
            const lowStock = allTracked.filter(p => {
                const actual = p.stockActual || 0;
                const minimo = p.stockMinimo || 0;
                return actual <= minimo;
            });

            setLowStockProducts(lowStock);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.restaurantId]);

    return {
        lowStockProducts,
        isLoading
    };
}
