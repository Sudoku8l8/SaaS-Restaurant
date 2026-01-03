import { db } from './db';
import type { Product } from '@/types';

/**
 * Create a new product
 */
export async function createProduct(
    product: Omit<Product, 'id'>
): Promise<string> {
    const id = await db.products.add({
        ...product,
        id: crypto.randomUUID(),
    } as Product);
    return id;
}

/**
 * Get all products for a restaurant
 */
export async function getProducts(restaurantId: string): Promise<Product[]> {
    return await db.products
        .where('restaurantId')
        .equals(restaurantId)
        .toArray();
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
    restaurantId: string,
    category: string
): Promise<Product[]> {
    return await db.products
        .where('[restaurantId+category]')
        .equals([restaurantId, category])
        .toArray();
}

/**
 * Get available products only
 */
export async function getAvailableProducts(
    restaurantId: string
): Promise<Product[]> {
    return await db.products
        .where('restaurantId')
        .equals(restaurantId)
        .and(product => product.available)
        .toArray();
}

/**
 * Update a product
 */
export async function updateProduct(
    productId: string,
    updates: Partial<Product>
): Promise<void> {
    await db.products.update(productId, updates);
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<void> {
    await db.products.delete(productId);
}
