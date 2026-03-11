import { useState, useEffect } from 'react';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Product, Category } from '@/types';

/**
 * Public hook — no authentication required.
 * Fetches available products and categories for a given restaurant.
 *
 * Uses `getDocs` (one-time read) instead of `onSnapshot` because
 * the public menu is read-only and doesn't need realtime updates.
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

        let cancelled = false;
        setIsLoading(true);

        const fetchMenu = async () => {
            try {
                const [prodSnap, catSnap] = await Promise.all([
                    getDocs(query(
                        collection(db, 'products'),
                        where('restaurantId', '==', restaurantId),
                        where('available', '==', true),
                    )),
                    getDocs(query(
                        collection(db, 'categories'),
                        where('restaurantId', '==', restaurantId),
                    )),
                ]);

                if (cancelled) return;

                const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
                setProducts(prods);

                const cats = catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
                // Sort by sortOrder first, then alphabetically as fallback
                cats.sort((a, b) => {
                    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
                        return a.sortOrder - b.sortOrder;
                    }
                    if (a.sortOrder !== undefined) return -1;
                    if (b.sortOrder !== undefined) return 1;
                    return a.name.localeCompare(b.name);
                });
                setCategories(cats);
            } catch (err) {
                console.error('Error fetching public menu:', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchMenu();

        return () => { cancelled = true; };
    }, [restaurantId]);

    return { products, categories, isLoading };
}
