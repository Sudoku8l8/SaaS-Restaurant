// TypeScript type definitions for the Restaurant Orders system

// ========== CONSTANTS & TYPES ==========

export const OrderStatus = {
    PENDING: 'pending',
    IN_PREPARATION: 'in_preparation',
    READY: 'ready',
    DELIVERED: 'delivered',
    PAID: 'paid',
    CANCELLED: 'cancelled',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
    CASH: 'cash',
    YAPE: 'yape',
    CARD: 'card',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const UserRole = {
    ADMIN: 'admin',
    WAITER: 'waiter',
    CHEF: 'chef',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TableStatus = {
    FREE: 'free',
    OCCUPIED: 'occupied',
    CLOSED: 'closed',
} as const;
export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];

// ========== INTERFACES ==========

export interface Restaurant {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    logo?: string;
    plan: 'basic' | 'premium';
    active: boolean;
    createdAt: Date;
    config?: RestaurantConfig;
}

export interface RestaurantConfig {
    tablesCount: number;
    currency: string;
    timezone: string;
    menuSpanishUrl?: string;
    menuEnglishUrl?: string;
}

export interface RestaurantTable {
    id: string;
    restaurantId: string;
    number: number;
    status: TableStatus;
    capacity?: number;
    currentOrderId?: string;
}

export interface Product {
    id: string;
    restaurantId: string;
    name: string;
    price: number;
    category: string;
    description?: string;
    available: boolean;
    imageUrl?: string;
    isPopular?: boolean;
}

export interface Category {
    id: string;
    restaurantId: string;
    name: string;
    createdAt: Date;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
    notes?: string;
}

export interface Order {
    id: string;
    restaurantId: string;
    tableNumber: number;
    items: OrderItem[];
    status: OrderStatus;
    total: number;
    createdAt: Date;
    updatedAt: Date;
    closedAt?: Date;
    paymentMethod?: PaymentMethod;
    userId: string; // Waiter who created the order
    userName: string;
    orderType: 'dine-in' | 'takeout';
    customerName?: string;
    statusHistory?: StatusChange[];
}

export interface StatusChange {
    from: OrderStatus;
    to: OrderStatus;
    timestamp: Date;
    userId: string;
}

export interface Closure {
    id?: string;
    restaurantId: string;
    date: string; // YYYY-MM-DD
    totalSales: number;
    orderCount: number;
    salesByWaiter: Record<string, number>;
    salesByPaymentMethod: Record<string, number>;
    createdAt: Date;
    createdBy: string;
    createdByName: string;
}


export interface User {
    id: string;
    restaurantId: string;
    name: string;
    role: UserRole;
    pinHash: string;
    active: boolean;
    createdAt: Date;
}

// ========== UTILITY TYPES ==========

export interface DailySales {
    totalSales: number;
    orderCount: number;
    salesByWaiter: Record<string, number>;
    salesByPaymentMethod: Record<PaymentMethod, number>;
}

export interface AuthUser {
    id: string;
    name: string;
    role: UserRole;
    restaurantId: string;
}

export interface LoginCredentials {
    pin: string;
}
