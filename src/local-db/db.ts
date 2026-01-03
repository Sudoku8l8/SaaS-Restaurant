import Dexie, { type EntityTable } from 'dexie';
import type {
    Restaurant,
    RestaurantTable,
    Product,
    Order,
    Closure,
    User,
} from '@/types';

// Define the database schema
class RestaurantDatabase extends Dexie {
    restaurants!: EntityTable<Restaurant, 'id'>;
    restaurantTables!: EntityTable<RestaurantTable, 'id'>;
    products!: EntityTable<Product, 'id'>;
    orders!: EntityTable<Order, 'id'>;
    closures!: EntityTable<Closure, 'id'>;
    users!: EntityTable<User, 'id'>;

    constructor() {
        super('RestaurantOrdersDB');

        // Define schema version 2
        this.version(2).stores({
            restaurants: 'id, name, active',
            restaurantTables:
                'id, restaurantId, number, status, [restaurantId+number], currentOrderId',
            products: 'id, restaurantId, name, category, [restaurantId+category]',
            orders:
                'id, restaurantId, tableNumber, status, userId, createdAt, [restaurantId+status], [restaurantId+tableNumber]',
            closures: 'id, restaurantId, date, [restaurantId+date]',
            users: 'id, restaurantId, role, pinHash, [restaurantId+role]',
        });
    }
}

// Export a singleton instance
export const db = new RestaurantDatabase();

// Helper function to clear all data (useful for development/testing)
export async function clearDatabase() {
    await db.restaurants.clear();
    await db.restaurantTables.clear();
    await db.products.clear();
    await db.orders.clear();
    await db.closures.clear();
    await db.users.clear();
}

// Helper function to get database info
export async function getDatabaseInfo() {
    const [
        restaurantCount,
        tableCount,
        productCount,
        orderCount,
        closureCount,
        userCount,
    ] = await Promise.all([
        db.restaurants.count(),
        db.restaurantTables.count(),
        db.products.count(),
        db.orders.count(),
        db.closures.count(),
        db.users.count(),
    ]);

    return {
        restaurantCount,
        tableCount,
        productCount,
        orderCount,
        closureCount,
        userCount,
    };
}
