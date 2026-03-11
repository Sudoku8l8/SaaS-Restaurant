// TypeScript type definitions for the Restaurant Orders system

// ========== CONSTANTS & TYPES ==========

export const BusinessType = {
    RESTAURANT: 'restaurant',
    ICE_CREAM: 'ice_cream',
    COFFEE: 'coffee',
    BAR: 'bar',
} as const;
export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];

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
    CASHIER: 'caja',
    WAITER: 'waiter',
    CHEF: 'chef',
    SHIFT_MANAGER: 'shift_manager',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TableStatus = {
    FREE: 'free',
    OCCUPIED: 'occupied',
    CLOSED: 'closed',
} as const;
export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];

// ========== INTERFACES ==========

/** Feature flags controlled exclusively by SuperAdmin */
export interface RestaurantFeatures {
    digitalMenu?: boolean;   // Menú digital nativo habilitado
    multiLocation?: boolean; // Habilitar modo multi-sucursal
    // Future features:
    // advancedReports?: boolean;
}

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
    features?: RestaurantFeatures;
    config?: RestaurantConfig;
    // Multi-Sucursal
    parentId?: string;         // Si es sucursal, ID del restaurante padre
    isParent?: boolean;        // true si es cuenta principal (dueño)
    branches?: string[];       // Slugs/IDs de sucursales hijas
}

export interface RestaurantConfig {
    tablesCount: number;
    currency: string;
    timezone: string;
    // Business Type & Sector Configuration
    businessType?: BusinessType;       // Tipo de negocio (default: 'restaurant')
    enableTables?: boolean;            // Activar módulo de mesas (default: true)
    enableKitchenOrders?: boolean;     // Activar comandas de cocina (default: true)
    enableQuickSale?: boolean;         // Activar ventas rápidas POS (default: false)
    enablePartialPayment?: boolean;    // Activar pagos parciales / divididos (default: true)
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
    // Multi-Sucursal
    multiSucursal?: boolean;     // Toggle activar gestión multi-sucursal
    // Inventory behavior
    outOfStockBehavior?: 'allow' | 'alert'; // Qué hacer cuando no hay stock (default: 'alert')
    // Petty Cash (Caja Chica) Configuration
    pettyCash?: {
        maxPerExpense: number;       // Límite por gasto sin aprobación (default: 20)
        maxDailyPerUser: number;     // Máximo diario por usuario (default: 50)
        enableAutoApproval: boolean; // Auto-aprobar si cumple reglas (default: true)
        requireReceipt: boolean;     // Requiere foto de comprobante (default: false)
    };
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
    controlaStock?: boolean;
    stockActual?: number;
    stockMinimo?: number;
    stockMaximo?: number;
    fechaActualizacionStock?: Date;
    tipoInventario?: InventoryType;    // 'product' | 'recipe'
    unidadMedida?: UnitOfMeasure;      // Unidad para inventario simple
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
    minSelections?: number; // Minimum number of selections required (e.g. 2 for "choose exactly 2 flavors")
    maxSelections?: number; // Maximum number of selections allowed (e.g. 3 for "up to 3 toppings")
}

export interface ModifierOption {
    name: string;
    price?: number; // Extra cost
}

export interface Category {
    id: string;
    restaurantId: string;
    name: string;
    nameEn?: string; // Optional English translation
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
    itemId?: string;           // Unique per-item ID (for items with same product but different modifiers)
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

export interface OrderDiscount {
    type: 'percentage' | 'fixed';
    value: number;    // The input value (e.g. 10 for 10%, or 5.00 for S/5)
    amount: number;   // The calculated discount amount in soles
}

export interface Order {
    id: string;
    restaurantId: string;
    tableNumber: number;
    items: OrderItem[];
    status: OrderStatus;
    total: number;
    subtotal?: number;  // Sum of items before discount
    discount?: OrderDiscount;
    createdAt: Date;
    updatedAt: Date;
    closedAt?: Date;
    paymentMethod?: PaymentMethod;
    payments?: OrderPayment[];
    userId: string; // Waiter who created the order
    userName: string;
    orderType: 'dine-in' | 'takeout' | 'quick-sale';
    customerName?: string;
    dailyNumber?: number;
    dateStr?: string;        // 'YYYY-MM-DD' — optimized server-side date queries
    tableId?: string;        // Direct Firestore table doc ID — avoids lookup queries
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
    userName?: string;
    pettyCashExpenseId?: string; // Link to PettyCashExpense if created from there
}

// ── Petty Cash (Caja Chica) ──────────────────────────────────────────────────

export const PettyCashExpenseStatus = {
    PENDING: 'pending',
    AUTO_APPROVED: 'auto_approved',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    OBSERVED: 'observed',
} as const;
export type PettyCashExpenseStatus = (typeof PettyCashExpenseStatus)[keyof typeof PettyCashExpenseStatus];

export const PettyCashCategory = {
    INGREDIENTS: 'Ingredientes',
    GAS: 'Gas',
    CLEANING: 'Limpieza',
    TRANSPORT: 'Transporte',
    SUPPLIES: 'Insumos',
    OTHER: 'Otro',
} as const;
export type PettyCashCategory = (typeof PettyCashCategory)[keyof typeof PettyCashCategory];

export interface PettyCashExpense {
    id: string;
    restaurantId: string;
    amount: number;
    description: string;
    category: PettyCashCategory;
    receiptUrl?: string;           // Foto del comprobante (Firebase Storage)
    requestedBy: string;           // userId
    requestedByName: string;
    requestedByRole: UserRole;
    requestedAt: Date;
    status: PettyCashExpenseStatus;
    autoApproved: boolean;
    approvedBy?: string;           // userId del admin
    approvedByName?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    observation?: string;          // Notas del admin
    closureId?: string;            // Link al cierre del día
    date: string;                  // YYYY-MM-DD para queries
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

// ========== INVENTORY PROFESSIONAL ==========

// ── Unidades de Medida ──
export const UnitOfMeasure = {
    UNIT: 'unidad',
    GRAM: 'gramos',
    KILOGRAM: 'kilogramos',
    LITER: 'litros',
    MILLILITER: 'mililitros',
    PIECE: 'piezas',
    BOTTLE: 'botellas',
} as const;
export type UnitOfMeasure = (typeof UnitOfMeasure)[keyof typeof UnitOfMeasure];

// ── Tipo de Inventario ──
export type InventoryType = 'product' | 'recipe';

// ── Movimientos de Inventario ──
export const MovementType = {
    PURCHASE: 'purchase',       // Entrada por compra
    SALE: 'sale',               // Salida automática por venta
    ADJUSTMENT: 'adjustment',   // Ajuste manual
    WASTE: 'waste',             // Pérdida/desperdicio
    TRANSFER: 'transfer',       // Transferencia entre sucursales
} as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

export interface InventoryMovement {
    id: string;
    restaurantId: string;       // Sucursal específica
    productId: string;          // Producto o insumo afectado
    productName: string;
    type: MovementType;
    quantity: number;           // Positivo = entrada, Negativo = salida
    unit: UnitOfMeasure;
    referenceId?: string;       // ID de orden, compra o ajuste
    referenceType?: string;     // 'order' | 'purchase' | 'manual'
    reason?: string;            // Motivo (para ajustes y mermas)
    userId: string;
    userName: string;
    createdAt: Date;
}

// ── Insumos (Ingredientes) ──
export interface InventoryItem {
    id: string;
    restaurantId: string;
    name: string;
    unit: UnitOfMeasure;
    stockActual: number;
    stockMinimo: number;
    stockMaximo?: number;
    costPerUnit?: number;       // Costo unitario
    category?: string;
    createdAt: Date;
    updatedAt: Date;
}

// ── Recetas ──
export interface Recipe {
    id: string;
    productId: string;          // Producto que genera esta receta
    restaurantId: string;
    ingredients: RecipeIngredient[];
    createdAt: Date;
    updatedAt: Date;
}

export interface RecipeIngredient {
    inventoryItemId: string;    // Referencia al insumo
    itemName: string;           // Nombre desnormalizado para display
    quantity: number;           // Cantidad por unidad de producto vendido
    unit: UnitOfMeasure;
}
