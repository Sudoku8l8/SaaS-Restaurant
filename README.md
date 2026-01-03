# 🍽️ SaaS Restaurant - Sistema de Pedidos (MVP)

Sistema web offline-first para la gestión de pedidos en restaurantes pequeños y medianos.

## 📋 Descripción

Este proyecto es un MVP (Producto Mínimo Viable) diseñado para resolver problemas operativos comunes en restaurantes:
- ❌ Pedidos mal anotados o perdidos
- ❌ Falta de visibilidad en cocina  
- ❌ Errores en cobros
- ❌ Control manual (papel / cuaderno / Excel)

### ✅ Solución

Un sistema centralizado donde el mozo registra pedidos por mesa, la cocina ve pedidos en tiempo real, y el sistema calcula ventas automáticamente.

## 🚀 Tecnologías

### Frontend
- **React 19.2** - Librería UI
- **TypeScript 5.9** - Type safety
- **Vite 7.3** - Build tool ultra-rápido
- **React Router 7.11** - Navegación SPA

### Base de Datos
- **IndexedDB** (vía Dexie.js 4.2) - Base de datos local (offline-first)
- **Firebase Firestore** - Backup en la nube (futuro)

### Utilidades
- **date-fns 4.1** - Manejo de fechas
- **ESLint** - Linter
- **Prettier** - Formateo de código

## 🏗️ Arquitectura

```
Offline-First Architecture
  ↓
IndexedDB (Fuente de verdad)
  ↓
Sincronización opcional con Firebase
```

**Principio:** El sistema funciona 100% sin internet. La sincronización es solo para backup.

## 📁 Estructura del Proyecto

```
restaurant-orders/
├── src/
│   ├── app/                # Configuración de la app
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers/
│   │       └── AuthProvider.tsx
│   ├── pages/              # Páginas principales
│   │   ├── Login/
│   │   ├── Mozo/
│   │   ├── Cocina/
│   │   └── CierreCaja/
│   ├── components/         # Componentes reutilizables
│   │   ├── shared/
│   │   └── features/
│   ├── local-db/           # IndexedDB (Dexie)
│   │   ├── db.ts
│   │   ├── orders.ts
│   │   ├── tables.ts
│   │   ├── closures.ts
│   │   └── products.ts
│   ├── sync/               # Sincronización con Firebase
│   │   └── syncService.ts
│   ├── services/           # Servicios externos
│   │   ├── firebase.ts
│   │   └── exportExcel.ts
│   ├── hooks/              # Custom hooks
│   │   └── useOffline.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   └── main.tsx            # Entry point
├── public/
├── .prettierrc             # Prettier config
├── eslint.config.js        # ESLint config
├── vite.config.ts          # Vite config
├── tsconfig.json           # TypeScript config
└── package.json
```

## 🛠️ Instalación

### Prerrequisitos
- Node.js >= 18
- npm >= 9

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd restaurant-orders
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

   La aplicación estará disponible en: `http://localhost:5173`

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run preview` | Preview de build de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea el código con Prettier |

## 🎯 Alcance del MVP

### ✅ Incluye
- [x] SaaS multi-restaurante (multi-tenant)
- [x] Registro de pedidos en local (offline)
- [x] Gestión de mesas
- [x] Estados del pedido (Pendiente → En Preparación → Listo → Entregado → Pagado)
- [x] Roles (Admin / Mozo)
- [x] Registro de pagos (Yape / Efectivo / Tarjeta - solo registro)
- [x] Reporte diario de ventas
- [x] Exportación a Excel/PDF
- [x] Cierre de caja obligatorio

### ❌ No Incluye (Post-MVP)
- [ ] Delivery
- [ ] Pedidos por QR
- [ ] Control de stock
- [ ] Pagos online reales
- [ ] Facturación electrónica
- [ ] Portal de clientes

## 🗺️ Roadmap de Implementación

### Sprint 0 - Preparación y Base Técnica ✅
- [x] Proyecto Vite + React + TypeScript
- [x] Configuración de ESLint y Prettier
- [x] Path aliases (@/)
- [x] Dependencias base instaladas
- [ ] Configuración PWA
- [ ] Estructura de carpetas completa
- [ ] IndexedDB con Dexie
- [ ] Sistema de tipos TypeScript
- [ ] Estilos base y componentes reutilizables

### Sprint 1 - Autenticación y Gestión de Pedidos
### Sprint 2 - Estados de Pedido y Control de Ventas
### Sprint 3 - Cierre de Caja Obligatorio
### Sprint 4 - Reportes y Exportación
### Sprint 5 - Escalabilidad y Multi-Tenant

## 🔑 Características Clave

### Offline-First
El sistema funciona completamente sin conexión a internet. IndexedDB es la fuente de verdad durante la operación del restaurante.

### Multi-Tenant
Arquitectura preparada para múltiples restaurantes desde el inicio.

### Cierre de Caja Obligatorio
Sistema formalizado de cierre diario con validaciones y bloqueos post-cierre.

### Exportación de Reportes
Generación automática de reportes en Excel y PDF al cierre de caja.

## 🧪 Testing

```bash
# Linting
npm run lint

# Formateo
npm run format
```

## 📦 Build para Producción

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`.

## 🚀 Deployment

### Opciones recomendadas:
- **Vercel** (recomendado para SPAs)
- **Netlify**
- **Firebase Hosting**

## 👥 Roles de Usuario

### Admin (Dueño / Cocina)
- Ver todos los pedidos
- Cambiar estado del pedido
- Ver ventas del día
- Cerrar caja
- Exportar reportes
- Gestionar mesas y mozos

### Mozo
- Login por PIN (4 dígitos)
- Registrar pedidos
- Asignar mesa
- Ver estado del pedido
- Registrar pago

## 🔐 Seguridad

- PIN encriptado con hash
- Roles y permisos
- Reglas de Firestore para multi-tenant
- Un solo dispositivo admin por turno

## 📊 Métricas del MVP

- Número de pedidos diarios
- Total vendido por día
- Ventas por mozo
- Tiempo promedio de preparación

## 📝 Notas de Desarrollo

### Path Aliases  
Se puede usar `@/` para importar desde `src/`:

```typescript
import { Button } from '@/components/shared/Button';
import { db } from '@/local-db/db';
```

### Hot Reload
Vite proporciona HMR (Hot Module Replacement) instantáneo durante desarrollo.

### TypeScript Strict Mode
El proyecto usa TypeScript en modo estricto para máxima seguridad de tipos.

## 🤝 Contribución

Este proyecto está en desarrollo activo. Sprint actual: **Sprint 0 - Preparación y Base Técnica**

## 📄 Licencia

Privado - No distribuir

## 📞 Contacto

Desarrollador: [Tu Nombre]

---

**Estado del Proyecto:** 🚧 En Desarrollo - Sprint 0 en progreso

**Última actualización:** 2026-01-03
