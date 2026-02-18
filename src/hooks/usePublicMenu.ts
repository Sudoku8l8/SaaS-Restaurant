import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Product, Category } from '@/types';

/**
 * Public hook — no authentication required.
 * Fetches available products and categories for a given restaurant.
 */
export function usePublicMenu(restaurantId: string | undefined) {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!restaurantId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const pQuery = query(
            collection(db, 'products'),
            where('restaurantId', '==', restaurantId),
            where('available', '==', true)
        );

        const cQuery = query(
            collection(db, 'categories'),
            where('restaurantId', '==', restaurantId)
        );

        let productsLoaded = false;
        let categoriesLoaded = false;

        const checkDone = () => {
            if (productsLoaded && categoriesLoaded) {
                setIsLoading(false);
            }
        };

        const unsubProducts = onSnapshot(pQuery, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
            setProducts(data);
            productsLoaded = true;
            checkDone();
        });

        const unsubCategories = onSnapshot(cQuery, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
            // Sort by sortOrder first, then alphabetically as fallback
            const sorted = data.sort((a, b) => {
                if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
                    return a.sortOrder - b.sortOrder;
                }
                if (a.sortOrder !== undefined) return -1;
                if (b.sortOrder !== undefined) return 1;
                return a.name.localeCompare(b.name);
            });
            setCategories(sorted);
            categoriesLoaded = true;
            checkDone();
        });

        return () => {
            unsubProducts();
            unsubCategories();
        };
    }, [restaurantId]);

    return { products, categories, isLoading };
}
