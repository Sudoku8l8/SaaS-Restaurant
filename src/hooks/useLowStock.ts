import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';

interface LowStockProduct {
    id: string;
    name: string;
    stockActual: number;
    stockMinimo: number;
    type: 'product' | 'item';
}

export function useLowStock() {
    const { user } = useAuth();
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user?.restaurantId) return;

        setIsLoading(true);
        let products: LowStockProduct[] = [];
        let items: LowStockProduct[] = [];
        let loadedCount = 0;

        const mergeLists = () => {
            loadedCount++;
            if (loadedCount >= 2) {
                setLowStockProducts([...products, ...items]);
                setIsLoading(false);
            }
        };

        // Listen to products with stock control
        const pQuery = query(
            collection(db, 'products'),
            where('restaurantId', '==', user.restaurantId),
            where('controlaStock', '==', true)
        );

        const unsub1 = onSnapshot(pQuery, (snap) => {
            products = snap.docs
                .map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        name: d.name as string,
                        stockActual: (d.stockActual || 0) as number,
                        stockMinimo: (d.stockMinimo || 0) as number,
                        type: 'product' as const,
                    };
                })
                .filter(p => p.stockActual <= p.stockMinimo);
            mergeLists();
        });

        // Listen to inventory items
        const iQuery = query(
            collection(db, 'inventory_items'),
            where('restaurantId', '==', user.restaurantId)
        );

        const unsub2 = onSnapshot(iQuery, (snap) => {
            items = snap.docs
                .map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        name: d.name as string,
                        stockActual: (d.stockActual || 0) as number,
                        stockMinimo: (d.stockMinimo || 0) as number,
                        type: 'item' as const,
                    };
                })
                .filter(i => i.stockActual <= i.stockMinimo);
            mergeLists();
        });

        return () => { unsub1(); unsub2(); };
    }, [user?.restaurantId]);

    return { lowStockProducts, isLoading };
}
