import { db } from './db';
import { UserRole } from '@/types';

export async function seedUsers() {
    const restaurantId = 'rest_001';

    try {
        // 1. Seed Restaurant & Users (if not exists)
        const userCount = await db.users.count();
        if (userCount === 0) {
            console.log('Seeding Users...');

            const hashPin = async (pin: string): Promise<string> => {
                const encoder = new TextEncoder();
                const data = encoder.encode(pin);
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            };

            const adminPinHash = await hashPin('1234');
            const waiter1PinHash = await hashPin('1111');
            const waiter2PinHash = await hashPin('2222');

            // Check if restaurant exists to avoid duplicates (though ID is static)
            const restaurantExists = await db.restaurants.get(restaurantId);
            if (!restaurantExists) {
                await db.restaurants.add({
                    id: restaurantId,
                    name: 'Mi Restaurante MVP',
                    plan: 'basic',
                    active: true,
                    createdAt: new Date(),
                    config: { tablesCount: 10, currency: 'PEN', timezone: 'America/Lima' }
                });
            }

            await db.users.bulkAdd([
                { id: crypto.randomUUID(), restaurantId, name: 'Administrador', role: UserRole.ADMIN, pinHash: adminPinHash, active: true, createdAt: new Date() },
                { id: crypto.randomUUID(), restaurantId, name: 'Juan (Mozo)', role: UserRole.WAITER, pinHash: waiter1PinHash, active: true, createdAt: new Date() },
                { id: crypto.randomUUID(), restaurantId, name: 'Maria (Mozo)', role: UserRole.WAITER, pinHash: waiter2PinHash, active: true, createdAt: new Date() },
            ]);
        }

        // 2. Seed Tables (if not exists)
        const tableCount = await db.restaurantTables.count();
        if (tableCount === 0) {
            console.log('Seeding Tables...');
            const tables = Array.from({ length: 10 }, (_, i) => ({
                id: crypto.randomUUID(),
                restaurantId,
                number: i + 1,
                status: 'free' as const,
                capacity: 4,
            }));
            await db.restaurantTables.bulkAdd(tables);
        }

        // 3. Seed Products (if not exists)
        const productCount = await db.products.count();
        if (productCount === 0) {
            console.log('Seeding Products...');
            const products = [
                { name: 'Inca Kola 500ml', price: 5.00, category: 'Bebidas' },
                { name: 'Coca Cola 500ml', price: 5.00, category: 'Bebidas' },
                { name: 'Chicha Morada Jarra', price: 15.00, category: 'Bebidas' },
                { name: 'Limonada Frozen', price: 8.00, category: 'Bebidas' },
                { name: 'Papa a la Huancaína', price: 12.00, category: 'Entradas' },
                { name: 'Causa Rellena', price: 10.00, category: 'Entradas' },
                { name: 'Tequeños de Queso', price: 14.00, category: 'Entradas' },
                { name: 'Lomo Saltado', price: 35.00, category: 'Platos de Fondo' },
                { name: 'Ají de Gallina', price: 28.00, category: 'Platos de Fondo' },
                { name: 'Arroz con Pollo', price: 25.00, category: 'Platos de Fondo' },
                { name: 'Ceviche Clásico', price: 30.00, category: 'Platos de Fondo' },
            ].map(p => ({
                id: crypto.randomUUID(),
                restaurantId,
                ...p,
                available: true,
            }));
            await db.products.bulkAdd(products);
        }

        console.log('Seeding check completed.');

    } catch (error) {
        console.error('Error seeding database:', error);
    }
}
