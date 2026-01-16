import { db } from './firebase/config';
import { doc, writeBatch, getDoc } from 'firebase/firestore';
import { generateUUID } from '@/utils/uuid';
import type { Restaurant } from '@/types';

interface CreateRestaurantParams {
    name: string;
    slug: string;
    adminName: string;
    adminPin: string;
}

const DEFAULT_PRODUCTS = [
    { name: 'Ceviche Clásico', price: 35.00, category: 'Entradas', available: true },
    { name: 'Lomo Saltado', price: 42.00, category: 'Fondos', available: true },
    { name: 'Inca Kola 1.5L', price: 12.00, category: 'Bebidas', available: true },
];

export async function createRestaurant({ name, slug, adminName, adminPin }: CreateRestaurantParams): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Check if slug exists
        const restaurantRef = doc(db, 'restaurants', slug);
        const docSnap = await getDoc(restaurantRef);

        if (docSnap.exists()) {
            return { success: false, error: 'Este ID de restaurante ya existe. Elige otro.' };
        }

        const batch = writeBatch(db);

        // 2. Create Restaurant Doc
        const newRestaurant: Restaurant = {
            id: slug,
            name: name,
            active: false,
            plan: 'basic',
            createdAt: new Date(),
            config: {
                tablesCount: 5,
                currency: 'PEN',
                timezone: 'America/Lima'
            }
        };
        batch.set(restaurantRef, newRestaurant);

        // 3. Create Admin User
        const adminId = generateUUID();
        const adminUser = {
            id: adminId,
            name: adminName,
            role: 'admin',
            restaurantId: slug,
            pinHash: adminPin, // MVP: Simple storage
            active: true,
            createdAt: new Date()
        };
        batch.set(doc(db, 'users', adminId), adminUser);

        // 4. Create Tables (Default 5)
        for (let i = 1; i <= 5; i++) {
            const tableId = generateUUID();
            batch.set(doc(db, 'tables', tableId), {
                id: tableId,
                restaurantId: slug,
                number: i,
                status: 'free',
                capacity: 4
            });
        }

        // 5. Create Default Menu
        for (const prod of DEFAULT_PRODUCTS) {
            const prodId = generateUUID();
            batch.set(doc(db, 'products', prodId), {
                id: prodId,
                restaurantId: slug,
                ...prod
            });
        }

        await batch.commit();
        return { success: true };

    } catch (error) {
        console.error("Error creating restaurant:", error);
        return { success: false, error: 'Error interno al crear el restaurante.' };
    }
}
