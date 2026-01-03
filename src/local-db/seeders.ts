import { db } from './db';
import { UserRole } from '@/types';

export async function seedUsers() {
    const userCount = await db.users.count();

    if (userCount > 0) {
        console.log('Users already seeded');
        return;
    }

    console.log('Seeding initial users...');

    // Helper to hash PINs (same logic as AuthProvider)
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

    const restaurantId = 'rest_001'; // Default restaurant for MVP

    // Create Restaurant
    await db.restaurants.add({
        id: restaurantId,
        name: 'Mi Restaurante MVP',
        plan: 'basic',
        active: true,
        createdAt: new Date(),
        config: {
            tablesCount: 10,
            currency: 'PEN',
            timezone: 'America/Lima'
        }
    });

    // Create Users
    await db.users.bulkAdd([
        {
            id: crypto.randomUUID(),
            restaurantId,
            name: 'Administrador',
            role: UserRole.ADMIN,
            pinHash: adminPinHash,
            active: true,
            createdAt: new Date(),
        },
        {
            id: crypto.randomUUID(),
            restaurantId,
            name: 'Juan (Mozo)',
            role: UserRole.WAITER,
            pinHash: waiter1PinHash,
            active: true,
            createdAt: new Date(),
        },
        {
            id: crypto.randomUUID(),
            restaurantId,
            name: 'Maria (Mozo)',
            role: UserRole.WAITER,
            pinHash: waiter2PinHash,
            active: true,
            createdAt: new Date(),
        },
    ]);

    console.log('Seeding completed!');
}
