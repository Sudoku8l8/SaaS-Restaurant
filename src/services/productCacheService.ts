/**
 * ProductCacheService — Singleton cache for Products and Categories.
 *
 * Instead of opening `onSnapshot` listeners in every component,
 * data is loaded once with `getDocs` and cached in memory.
 *
 * Consumers call `invalidate()` after mutations to refresh the cache.
 * A TTL of 5 minutes ensures stale data doesn't persist forever.
 */
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Product, Category } from '@/types';

const TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
    data: T[];
    fetchedAt: number;
}

type Listener = () => void;

const EMPTY_ARRAY: any[] = [];

class ProductCacheService {
    private products = new Map<string, CacheEntry<Product>>();
    private categories = new Map<string, CacheEntry<Category>>();
    private loading = new Map<string, Promise<void>>();
    private listeners = new Set<Listener>();

    // ── Public API ──────────────────────────────────────────────────────────

    /**
     * Ensure data for a restaurant is loaded. Safe to call multiple times;
     * concurrent calls deduplicate automatically.
     */
    async load(restaurantId: string): Promise<void> {
        if (!restaurantId) return;

        const existing = this.products.get(restaurantId);
        if (existing && Date.now() - existing.fetchedAt < TTL) return;

        // Deduplicate concurrent loads
        const inflight = this.loading.get(restaurantId);
        if (inflight) return inflight;

        const promise = this._fetch(restaurantId);
        this.loading.set(restaurantId, promise);
        try {
            await promise;
        } finally {
            this.loading.delete(restaurantId);
        }
    }

    getProducts(restaurantId: string): Product[] {
        return this.products.get(restaurantId)?.data ?? EMPTY_ARRAY;
    }

    getCategories(restaurantId: string): Category[] {
        return this.categories.get(restaurantId)?.data ?? EMPTY_ARRAY;
    }

    isLoaded(restaurantId: string): boolean {
        return this.products.has(restaurantId);
    }

    /**
     * Force-refresh. Call after creating/editing/deleting a product or category.
     */
    async invalidate(restaurantId: string): Promise<void> {
        this.products.delete(restaurantId);
        this.categories.delete(restaurantId);
        await this._fetch(restaurantId);
    }

    /** Subscribe to cache changes (for React hook integration). */
    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // ── Internal ────────────────────────────────────────────────────────────

    private async _fetch(restaurantId: string): Promise<void> {
        const [prodSnap, catSnap] = await Promise.all([
            getDocs(query(
                collection(db, 'products'),
                where('restaurantId', '==', restaurantId),
            )),
            getDocs(query(
                collection(db, 'categories'),
                where('restaurantId', '==', restaurantId),
            )),
        ]);

        const products: Product[] = prodSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
        } as Product));

        const categories: Category[] = catSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
        } as Category));

        // Sort categories by sortOrder, then alphabetically
        categories.sort((a, b) => {
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) return a.sortOrder - b.sortOrder;
            if (a.sortOrder !== undefined) return -1;
            if (b.sortOrder !== undefined) return 1;
            return a.name.localeCompare(b.name);
        });

        const now = Date.now();
        this.products.set(restaurantId, { data: products, fetchedAt: now });
        this.categories.set(restaurantId, { data: categories, fetchedAt: now });

        this._notify();
    }

    private _notify() {
        this.listeners.forEach(fn => fn());
    }
}

/** Singleton instance — shared across all components. */
export const productCacheService = new ProductCacheService();
