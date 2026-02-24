# 🍽️ OrdayGo — Plataforma SaaS de Gestión para Restaurantes

Sistema web **multi-tenant** y **PWA** para la gestión integral de restaurantes en tiempo real: pedidos, cocina, caja, reportes, menú digital y más.

> **Estado:** MVP Completo + Módulos Avanzados 🚀 | Multi-tenant activo con rutas dinámicas por slug.

---

## 📋 Descripción

Solución cloud-native diseñada para que múltiples restaurantes operen bajo una única plataforma. Cada restaurante accede a través de su propia URL (`/:restaurantSlug/`) con aislamiento de datos en Firestore.

---

## ✅ Módulos & Funcionalidades

### Operación Diaria
| Módulo | Ruta | Descripción |
|---|---|---|
| **📱 Mozo** | `/:slug/mozo` | Toma de pedidos por mesa, pedidos para llevar (takeout), búsqueda de productos, modificadores de producto y observaciones. |
| **👨‍🍳 Cocina (KDS)** | `/:slug/cocina` | Kitchen Display System con estados de pedido (`pending` → `in_preparation` → `ready` → `delivered`), filtros por estado, y creación directa de pedidos. |
| **💰 Cierre de Caja** | `/:slug/cierre-caja` | Cierre diario obligatorio con saldo de apertura, registro de gastos, arqueo de caja (efectivo esperado vs. real), y exportación Excel. |
| **💳 Cobro** | Modal | Cobro con métodos de pago: Efectivo, Yape y Tarjeta. |

### Administración
| Módulo | Ruta | Descripción |
|---|---|---|
| **👮 Admin** | `/:slug/admin` | Dashboard de ventas del día, alertas de cierres pendientes, accesos rápidos a cierre/reportes/configuración. |
| **📊 Reportes** | `/:slug/reportes` | Histórico de ventas por día, cierre retroactivo de días pasados, exportación Excel individual y por rango de fechas. |
| **⚙️ Configuración** | `/:slug/config` | Gestión de Productos, Categorías, Usuarios, Mesas (lista + mapa visual arrastrable), Menú Digital, Impresora y Seguridad. |

### Menú Digital Público
| Módulo | Ruta | Descripción |
|---|---|---|
| **🌐 Menú** | `/:slug/menu/:tableNumber?` | Menú digital responsive para clientes. Tematizable con 4 presets (Gourmet, Fast Food, Bar/Café, Dark Kitchen) o personalizado. Soporte multi-idioma (ES/EN). |
| **🛒 Checkout** | `/:slug/menu/checkout` | Carrito de compras público con opciones de delivery/recojo, integración WhatsApp. |

### Plataforma
| Módulo | Ruta | Descripción |
|---|---|---|
| **🏠 Landing** | `/` | Página de inicio de la plataforma. |
| **🔐 Login** | `/:slug/login` | Autenticación por PIN con hash seguro (sin contraseñas en texto plano). |
| **🛡️ SuperAdmin** | `/superadmin` | Gestión de todos los restaurantes: activar/desactivar, renovar suscripciones, resetear PINs, eliminar tenants. |
| **📄 Legal** | `/terminos`, `/privacidad` | Páginas legales públicas. |

---

## 🚀 Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| **React** | 19 | UI con hooks y componentes funcionales |
| **TypeScript** | 5.9 (Strict) | Tipado estático en todo el proyecto |
| **Vite** | 7 | Build tool + HMR |
| **React Router** | 7 | Enrutamiento multi-tenant con `TenantProvider` |
| **Lucide React** | 0.562 | Iconografía |
| **date-fns** | 4 | Manejo de fechas con locale `es` + timezone Perú |
| **ExcelJS** | 4 | Exportación de reportes multi-hoja |

### Backend & Infraestructura
| Tecnología | Uso |
|---|---|
| **Firebase Firestore** | Base de datos NoSQL con suscripciones en tiempo real (`onSnapshot`) |
| **Vercel** | Hosting, dominio personalizado y despliegue |
| **PWA** (vite-plugin-pwa + Workbox) | Instalable, offline-first, caché de fuentes e imágenes |

### Impresión
- **PrinterService** con soporte ESC/POS para impresoras térmicas
- Conexión vía **Bluetooth** (Web Bluetooth API), **USB** (WebUSB) o **RawBT** (Android)
- Impresión automática de comandas y boletas

---

## 🏗️ Arquitectura

```mermaid
graph TD
    Landing[Landing Page] --> Tenant[/:slug/ - TenantProvider]
    Tenant --> Login[Login PIN]
    Tenant --> PublicMenu[Menú Digital Público]
    Login --> Protected[Rutas Protegidas]
    Protected --> Mozo[Mozo]
    Protected --> Cocina[Cocina KDS]
    Protected --> Admin[Admin Dashboard]
    Protected --> Cierre[Cierre de Caja]
    Protected --> Reportes[Reportes]
    Protected --> Config[Configuración]
    SuperAdmin[/superadmin/] --> Firestore[(Firestore)]
    Mozo & Cocina & Admin --> |Real-time Sync| Firestore
    PublicMenu --> Firestore
    Config --> Printer[Impresora Térmica]
```

### Multi-Tenancy
- Cada restaurante se identifica por un **slug** único en la URL.
- `TenantProvider` resuelve el slug contra Firestore y provee el contexto del restaurante a toda la aplicación.
- Todos los documentos en Firestore están filtrados por `restaurantId`.

### Roles y Permisos
| Rol | Acceso |
|---|---|
| **Admin** | Todo: Mozo, Cocina, Admin, Cierre, Reportes, Config |
| **Waiter (Mozo)** | Solo Mozo — no puede eliminar ítems confirmados |
| **Chef** | Solo Cocina — puede crear pedidos directos |

---

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App root, rutas y providers
│   ├── routes.tsx          # Definición de rutas (react-router v7)
│   └── providers/          # AuthProvider, TenantProvider
├── pages/                  # Vistas por módulo
│   ├── Admin/              # Dashboard administrativo
│   ├── Mozo/               # Interfaz del mozo
│   ├── Cocina/             # Kitchen Display System
│   ├── CierreCaja/         # Cierre de caja con arqueo
│   ├── Reportes/           # Histórico de ventas
│   ├── Configuracion/      # Config + Menú Digital Config
│   ├── Landing/            # Landing page pública
│   ├── Login/              # Auth por PIN
│   ├── Public/             # Menú digital, checkout, legal
│   └── SuperAdmin/         # Gestión de restaurantes
├── components/
│   ├── features/           # Componentes de negocio
│   │   ├── OrderModal       # Modal de creación/edición de pedidos
│   │   ├── OrderCard        # Card de pedido (KDS)
│   │   ├── PaymentModal     # Modal de cobro
│   │   ├── TableMap         # Mapa visual de mesas (drag & drop)
│   │   ├── TablesTab        # Config de mesas (lista + mapa)
│   │   ├── ProductsTab      # CRUD de productos con modificadores
│   │   ├── CategoriesTab    # Gestión de categorías
│   │   ├── UsersTab         # Gestión de usuarios
│   │   ├── PrinterTab       # Config de impresora
│   │   ├── SecurityTab      # Cambio de PIN
│   │   └── DigitalMenuTab   # Config del menú digital
│   └── shared/             # UI Kit reutilizable
│       ├── Button, Card, Input, Badge, Skeleton, Toast
│       ├── StatusBadge, OrderFAB, ProtectedRoute
│       └── GlobalErrorBoundary
├── hooks/                  # Lógica de negocio
│   ├── useOrders            # CRUD de pedidos + real-time
│   ├── useOrderCreation     # Flujo de creación (reutilizable)
│   ├── useTables            # Mesas en tiempo real
│   ├── useFloors            # Pisos/plantas del restaurante
│   ├── useDailySales        # Métricas de ventas del día
│   ├── useCashSession       # Sesión de caja (apertura/gastos)
│   ├── useClosureStatus     # Estado de cierre del día
│   ├── usePendingClosures   # Alertas de cierres pendientes
│   ├── usePublicMenu        # Menú público (productos + categorías)
│   └── useAuth              # Contexto de autenticación
├── services/
│   ├── firebase/            # Config de Firebase
│   ├── printer/             # PrinterService (Bluetooth/USB/RawBT)
│   ├── exportExcel.ts       # Generación de Excel multi-hoja
│   └── onboardingService.ts # Creación de nuevos restaurantes
├── config/
│   └── menuThemes.ts        # Temas del menú digital (4 presets)
├── types/
│   └── index.ts             # Todas las interfaces TypeScript
└── utils/
    ├── dateUtils.ts          # Timezone Perú + helpers de fecha
    ├── crypto.ts             # Hash SHA-256 para PINs
    ├── uuid.ts               # Generación de UUIDs
    └── cn.ts                 # Merge de clases CSS
```

---

## 🛠️ Instalación y Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 2. Comandos

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción (TypeScript + Vite)
npm run build

# Lint
npm run lint

# Formatear código
npm run format
```

---

## � Roles de Usuario

| Rol | PIN | Permisos |
|---|---|---|
| **Admin** | Hash SHA-256 | Acceso total + Cierre de Caja + Configuración |
| **Mozo** | Hash SHA-256 | Toma de pedidos, no puede eliminar ítems confirmados |
| **Chef** | Hash SHA-256 | Cocina KDS, puede crear pedidos directos |

---

## 🗺️ Roadmap

### ✅ Completado
- Arquitectura base + Firebase + Multi-tenant con slugs
- Autenticación PIN con hash seguro
- Flujo de pedidos completo (mesa + takeout) con modificadores
- Kitchen Display System con estados
- Cierre de caja con arqueo, gastos y exportación
- Reportes históricos con cierre retroactivo y Excel
- Configuración completa (productos, categorías, mesas, usuarios, seguridad)
- Mapa visual de mesas con drag & drop
- Menú digital público tematizable con checkout
- Impresión térmica (Bluetooth/USB/RawBT)
- PWA instalable con soporte offline
- Landing page + SuperAdmin
- Onboarding automático de restaurantes

### 🚧 Próximo
- [ ] Pagos SaaS (Stripe)
- [ ] Pedidos QR desde el menú digital
- [ ] Facturación Electrónica (SUNAT)
- [ ] Integración con delivery
- [ ] Notificaciones push

---

**Última actualización:** 24/02/2026
