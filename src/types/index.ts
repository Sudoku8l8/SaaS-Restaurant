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
    subscriptionEndsAt?: Date;
    config?: RestaurantConfig;
}

export interface RestaurantConfig {
    tablesCount: number;
    currency: string;
    timezone: string;
    menuSpanishUrl?: string;
    menuEnglishUrl?: string;
    // Native Digital Menu
    menuNativeEnabled?: boolean;
    menuAccentColor?: string;
    menuBgColor?: string;
    menuTextColor?: string;
    menuFontFamily?: string;
    menuDescription?: string;
    menuAddress?: string;
    menuPhone?: string;
    menuThemeId?: string;       // 'gourmet' | 'fastfood' | 'bar_cafe' | 'dark_kitchen' | 'custom'
    menuEnglishSubtitles?: boolean;
    menuSearchEnabled?: boolean;  // Search bar on public menu (default: off)
    // Digital Menu Ordering
    restaurantWhatsApp?: string; // Number to receive orders
    enableDigitalOrders?: boolean; // Enable shopping cart public
    deliveryEnabled?: boolean;
    pickupEnabled?: boolean;
    deliveryCost?: number;
    paymentMethodsConfig?: { yape?: string; plin?: string; bankAccount?: string };
    usarPantallaCocina?: boolean; // Toggle for Kitchen Screen vs Printed Tickets
}

export interface RestaurantTable {
    id: string;
    restaurantId: string;
    number: number;
    status: TableStatus;
    capacity?: number;
    floor?: string;       // Floor/plant name e.g. "Principal", "Terraza"
    currentOrderId?: string;
    // Visual Map properties
    positionX?: number; // 0-100 percentage
    positionY?: number; // 0-100 percentage
    label?: string;     // Custom name like "Terraza 1"
    width?: number;     // Relative width
    height?: number;    // Relative height
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
    // Dietary & Allergen Tags
    dietaryTags?: string[]; // e.g. ['vegan', 'spicy', 'gluten-free', 'nut-free', 'vegetarian', 'dairy-free']
    // Inventory & Options
    stockCount?: number;
    trackStock?: boolean;
    modifiers?: ProductModifier[];
    // English translations (for tourist menus)
    nameEn?: string;
    descriptionEn?: string;
}

export interface ProductModifier {
    id: string;
    name: string;
    options: ModifierOption[];
    required?: boolean;
    multiple?: boolean;
}

export interface ModifierOption {
    name: string;
    price?: number; // Extra cost
}

export interface Category {
    id: string;
    restaurantId: string;
    name: string;
    createdAt: Date;
    sortOrder?: number; // Custom display order in the digital menu
}

// ── Digital Order Notifications ──────────────────────────────────────────────

export type DigitalOrderType = 'table' | 'whatsapp';
export type DigitalOrderStatus = 'pending' | 'accepted' | 'dismissed';

export interface DigitalOrder {
    id: string;
    restaurantId: string;
    type: DigitalOrderType;
    status: DigitalOrderStatus;
    tableNumber?: number;      // set when type === 'table'
    orderType: 'dine-in' | 'pickup' | 'delivery';
    items: OrderItem[];
    customerName?: string;
    customerNote?: string;
    total: number;
    currency: string;
    createdAt: Date;
    acceptedAt?: Date;
    acceptedBy?: string;
}

export interface OrderItem {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
    notes?: string;
    selectedOptions?: SelectedModifier[];
}

export interface SelectedModifier {
    modifierId: string;
    modifierName: string;
    optionName: string;
    price?: number;
}

export interface OrderPayment {
    method: PaymentMethod;
    amount: number;
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
    payments?: OrderPayment[];
    userId: string; // Waiter who created the order
    userName: string;
    orderType: 'dine-in' | 'takeout';
    customerName?: string;
    dailyNumber?: number;
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
    // Arqueo fields
    openingBalance?: number;
    expectedCash?: number;
    actualCash?: number;
    difference?: number;
    expenses?: CashExpense[];
    status: 'open' | 'closed';
}

export interface CashExpense {
    id: string;
    amount: number;
    description: string;
    category: string;
    timestamp: Date;
    userId: string;
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
