import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { productCacheService } from '@/services/productCacheService';
import type { Product, Category } from '@/types';

/**
 * React hook that consumes the ProductCacheService singleton.
 *
 * Triggers a one-time `getDocs` load and re-renders when the cache
 * is invalidated (e.g. after a product/category mutation).
 *
 * @returns products, categories, loading flag, and a manual refresh fn.
 */
export function useProductCache(restaurantId: string | undefined) {
    const [isLoading, setIsLoading] = useState(!productCacheService.isLoaded(restaurantId ?? ''));

    // Subscribe to cache changes via useSyncExternalStore for tear-free reads
    const subscribe = useCallback(
        (onStoreChange: () => void) => productCacheService.subscribe(onStoreChange),
        [],
    );

    const getProductsSnapshot = useCallback(
        () => productCacheService.getProducts(restaurantId ?? ''),
        [restaurantId],
    );

    const getCategoriesSnapshot = useCallback(
        () => productCacheService.getCategories(restaurantId ?? ''),
        [restaurantId],
    );

    const products: Product[] = useSyncExternalStore(subscribe, getProductsSnapshot, getProductsSnapshot);
    const categories: Category[] = useSyncExternalStore(subscribe, getCategoriesSnapshot, getCategoriesSnapshot);

    // Initial load
    useEffect(() => {
        if (!restaurantId) return;
        let cancelled = false;

        setIsLoading(!productCacheService.isLoaded(restaurantId));

        productCacheService.load(restaurantId).then(() => {
            if (!cancelled) setIsLoading(false);
        });

        return () => { cancelled = true; };
    }, [restaurantId]);

    /** Force-refresh after mutations (create / edit / delete). */
    const refresh = useCallback(async () => {
        if (!restaurantId) return;
        setIsLoading(true);
        await productCacheService.invalidate(restaurantId);
        setIsLoading(false);
    }, [restaurantId]);

    return { products, categories, isLoading, refresh };
}
