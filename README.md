# 🍽️ SaaS Restaurant - Plataforma de Gestión (Cloud Native)

Sistema web moderno y escalable para la gestión de restaurantes en tiempo real. SaaS Multi-tenant (en transición).

> **Estado Actual:** MVP Completado (Sprint 5) 🚀 | Próximo: Escalamiento SaaS (Sprint 6)

## 📋 Descripción

Solución integral basada en la nube para controlar pedidos, cocina y caja de restaurantes. Diseñado para ser escalable a miles de restaurantes bajo un modelo SaaS.

### ✅ Módulos Completados (MVP)
- **📱 Mozo:** Toma de pedidos por mesa en tiempo real.
- **👨‍🍳 Cocina:** KDS (Kitchen Display System) con estados de pedido.
- **👮 Admin:** Panel de control, métricas de ventas y cierre de caja.
- **⚙️ Config:** Gestión de productos, mesas y usuarios.
- **📊 Reportes:** Cierre diario obligatorio y exportación Excel.

## 🚀 Tecnologías

### Frontend
- **React 18+** & **Vite**
- **TypeScript** (Strict Mode)
- **CSS Modules** (Diseño Responsive)

### Backend & Data
- **Firebase Firestore** (Base de datos NoSQL en tiempo real)
- **Firebase Hosting** (Deployment)
- **Cloud Native Architecture** (Sin servidor propio)

## 🏗️ Arquitectura

El sistema utiliza una arquitectura **Cloud Native** donde Firestore actúa como la fuente de verdad sincronizada en tiempo real entre todos los dispositivos (Mozos, Cocina, Caja).

```mermaid
graph TD
    Client[Cliente React PWA] <-->|Real-time Sync| Firestore[(Firebase DB)]
    Firestore <-->|Trigger| Functions[Cloud Functions (Futuro)]
```

## 📁 Estructura del Proyecto

```
src/
├── app/            # Providers y Rutas
├── pages/          # Vistas (Admin, Mozo, Cocina, Reportes, Config)
├── components/     # UI Kit y Features
├── hooks/          # Lógica de negocio (useOrders, useAuth, useTables)
├── services/       # Firebase config, Seeders, Export
├── types/          # Definiciones TypeScript
└── utils/          # Helpers (formatters, uuid)
```

## 🛠️ Instalación y Configuración

### 1. Variables de Entorno
Es **crucial** configurar las credenciales de Firebase. Crea un archivo `.env` en la raíz basado en `.env.example`:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# Opcional para desarrollo:
VITE_DEMO_MODE=true 
```

### 2. Comandos

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Verificar TypeScript y Build (Producción)
npm run build
```

## 🗺️ Roadmap de Implementación

### Fase 1: MVP (Completado) ✅
- [x] **Sprint 0:** Arquitectura Base & Firebase Setup.
- [x] **Sprint 1:** Autenticación PIN & Gestión de Mesas.
- [x] **Sprint 2:** Flujo de Pedidos & Estados Cocina.
- [x] **Sprint 3:** Cierre de Caja & Validaciones.
- [x] **Sprint 4:** Reportes Históricos & Excel.
- [x] **Sprint 5:** Panel de Configuración & Estabilización.

### Fase 2: Escalamiento SaaS (En Progreso) 🚧
- [ ] **Sprint 6:** Arquitectura Multi-tenant (URLs dinámicas).
- [ ] Onboarding automático de nuevos restaurantes.
- [ ] SuperAdmin Dashboard.

### Fase 3: Growth (Futuro) 🔮
- [ ] Pagos SaaS (Stripe).
- [ ] Pedidos QR.
- [ ] Facturación Electrónica (SUNAT).
- [ ] Integración Delivery.

## 👥 Roles de Usuario
- **Admin:** Acceso total + Cierre de Caja + Configuración (Usuarios, Productos, Mesas).
- **Mozo:** Toma de pedidos, cambio de estados y cobro básico.

---
**Última actualización:** 04/01/2026
