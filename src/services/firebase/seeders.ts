import { db } from './config';
import { collection, doc, setDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { generateUUID } from '@/utils/uuid';
import type { User, RestaurantTable, Product, UserRole } from '@/types';

// Initial Data Constants
const RESTAURANT_ID = 'default-restaurant';

const INITIAL_USERS: User[] = [
    {
        id: 'admin-1',
        name: 'Administrador',
        role: 'admin',
        restaurantId: RESTAURANT_ID,
        pinHash: '1234' // In production this should be hashed
    },
    {
        id: 'mozo-1',
        name: 'Juan Pérez',
        role: 'waiter',
        restaurantId: RESTAURANT_ID,
        pinHash: '1111'
    },
    {
        id: 'mozo-2',
        name: 'María García',
        role: 'waiter',
        restaurantId: RESTAURANT_ID,
        pinHash: '2222'
    }
];

const INITIAL_PRODUCTS = [
    { name: 'Ceviche Clásico', price: 35.00, category: 'Entradas' },
    { name: 'Lomo Saltado', price: 42.00, category: 'Fondos' },
    { name: 'Ají de Gallina', price: 30.00, category: 'Fondos' },
    { name: 'Arroz con Mariscos', price: 38.00, category: 'Fondos' },
    { name: 'Causa Rellena', price: 20.00, category: 'Entradas' },
    { name: 'Papa a la Huancaína', price: 18.00, category: 'Entradas' },
    { name: 'Chicha Morada (Jarra)', price: 15.00, category: 'Bebidas' },
    { name: 'Limonada', price: 10.00, category: 'Bebidas' },
    { name: 'Inca Kola 1.5L', price: 12.00, category: 'Bebidas' },
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
            const tableData: RestaurantTable = {
                id: tableId,
                restaurantId: RESTAURANT_ID,
                number: i,
                status: 'free',
                seats: 4
            };
            batch.set(tableRef, tableData);
        }

        // 4. Seed Products
        for (const prod of INITIAL_PRODUCTS) {
            const prodId = generateUUID();
            const prodRef = doc(db, 'products', prodId);
            const productData: Product = {
                id: prodId,
                restaurantId: RESTAURANT_ID,
                ...prod
            };
            batch.set(prodRef, productData);
        }

        await batch.commit();
        console.log('Seeding completed successfully!');
        localStorage.setItem('db_seeded', 'true');
        alert('Base de datos inicializada correctamente en la nube ☁️');

    } catch (error) {
        console.error('Error seeding database:', error);
    }
}
