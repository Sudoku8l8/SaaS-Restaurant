import { db } from './config';
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { generateUUID } from '@/utils/uuid';

// Initial Data Constants
const RESTAURANT_ID = 'default-restaurant';

const INITIAL_USERS = [
    {
        id: 'admin-1',
        name: 'Administrador',
        role: 'admin' as const,
        restaurantId: RESTAURANT_ID,
        pinHash: '1234',
        active: true,
        createdAt: new Date()
    },
    {
        id: 'mozo-1',
        name: 'Juan Pérez',
        role: 'waiter' as const,
        restaurantId: RESTAURANT_ID,
        pinHash: '1111',
        active: true,
        createdAt: new Date()
    },
    {
        id: 'mozo-2',
        name: 'María García',
        role: 'waiter' as const,
        restaurantId: RESTAURANT_ID,
        pinHash: '2222',
        active: true,
        createdAt: new Date()
    }
];

const INITIAL_PRODUCTS = [
    { name: 'Ceviche Clásico', price: 35.00, category: 'Entradas', available: true },
    { name: 'Lomo Saltado', price: 42.00, category: 'Fondos', available: true },
    { name: 'Ají de Gallina', price: 30.00, category: 'Fondos', available: true },
    { name: 'Arroz con Mariscos', price: 38.00, category: 'Fondos', available: true },
    { name: 'Causa Rellena', price: 20.00, category: 'Entradas', available: true },
    { name: 'Papa a la Huancaína', price: 18.00, category: 'Entradas', available: true },
    { name: 'Chicha Morada (Jarra)', price: 15.00, category: 'Bebidas', available: true },
    { name: 'Limonada', price: 10.00, category: 'Bebidas', available: true },
    { name: 'Inca Kola 1.5L', price: 12.00, category: 'Bebidas', available: true },
];

export async function seedFirestore() {
    try {
        if (localStorage.getItem('db_seeded')) {
            console.log('App already seeded (cache).');
            return;
        }

        console.log('Checking if seeding is needed...');

        // Check if users exist to avoid re-seeding
        const usersRef = collection(db, 'users');
        const userSnapshot = await getDocs(query(usersRef, where('restaurantId', '==', RESTAURANT_ID)));

        if (!userSnapshot.empty) {
            console.log('Database already seeded.');
            localStorage.setItem('db_seeded', 'true');
            return;
        }

        console.log('Starting seed...');
        const batch = writeBatch(db);

        // 1. Seed Restaurant (implicitly by ID usage, but good to have doc)
        const restRef = doc(db, 'restaurants', RESTAURANT_ID);
        batch.set(restRef, {
            id: RESTAURANT_ID,
            name: 'Mi Restaurante SaaS',
            active: true
        });

        // 2. Seed Users
        for (const user of INITIAL_USERS) {
            const userRef = doc(db, 'users', user.id);
            batch.set(userRef, user);
        }

        // 3. Seed Tables (10 tables)
        for (let i = 1; i <= 10; i++) {
            const tableId = `table-${i}`;
            const tableRef = doc(db, 'tables', tableId);
            batch.set(tableRef, {
                id: tableId,
                restaurantId: RESTAURANT_ID,
                number: i,
                status: 'free',
                capacity: 4
            });
        }

        // 4. Seed Products
        for (const prod of INITIAL_PRODUCTS) {
            const prodId = generateUUID();
            const prodRef = doc(db, 'products', prodId);
            batch.set(prodRef, {
                id: prodId,
                restaurantId: RESTAURANT_ID,
                ...prod
            });
        }

        await batch.commit();
        console.log('Seeding completed successfully!');
        localStorage.setItem('db_seeded', 'true');
        alert('Base de datos inicializada correctamente en la nube ☁️');

    } catch (error) {
        console.error('Error seeding database:', error);
    }
}
