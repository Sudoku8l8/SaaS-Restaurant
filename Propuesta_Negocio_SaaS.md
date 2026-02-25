# OrdayGo - Propuesta de Valor y Modelo de Negocio SaaS

## 1. Visión General del Sistema
OrdayGo es un sistema integral multiplataforma (SaaS) diseñado para la gestión y optimización de restaurantes, cafeterías y negocios gastronómicos. Ofrece una arquitectura "multi-tenant" (multi-inquilino), lo que significa que a través de una sola plataforma, puedes gestionar múltiples restaurantes independientes, cada uno con su propio subdominio (`ordaygo.com/mi-restaurante`), base de datos y personalización.

## 2. Funcionalidades Principales (Módulos)

El sistema se divide en roles y módulos altamente especializados:

### 📱 Módulo de Operación (Para el Personal)
* **Punto de Venta Móvil (Mozo):**
  * Toma de pedidos directa desde tablets o smartphones.
  * Gestión visual de mesas (libres, ocupadas).
  * Envío directo de comandas a cocina (eliminando el papel).
  * Universal Order FAB: Creación de pedidos rápida ("Para llevar" o "Mesa").
* **Kitchen Display System - KDS (Cocina):**
  * Visualización en tiempo real de los pedidos entrantes.
  * Cambio de estados (Pendiente ➔ En Preparación ➔ Listo).
  * Organización eficiente para reducir tiempos de espera.

### 💻 Módulo de Gestión (Para el Propietario/Administrador)
* **Dashboard Administrativo (Admin):**
  * Vista general de ventas del día, pedidos activos y métricas clave.
  * Gestión completa del catálogo de productos y categorías.
* **Control de Finanzas y Reportes:**
  * **Cierre de Caja:** Registro de aperturas, cierres, ingresos, egresos y cuadre diario.
  * **Reportes y Analíticas:** Historial de ventas, productos más vendidos, y exportación de datos a Excel.
* **Configuración del Restaurante:**
  * Personalización del restaurante (Logo, nombre, colores).
  * Gestión de mesas, zonas del restaurante y roles de usuarios (Mozo, KDS, Admin).
  * Integración y configuración de impresión de tickets físicos.

### 🍽️ Módulo de Cliente (Menú Digital) *[Premium]*
* **Menú Digital Interactivo:** Menú accesible vía código QR.
* **Digital Checkout:** Capacidad de que el propio comensal haga su pedido desde la mesa, el cual se sincroniza automáticamente con el sistema del mozo y la cocina.

### 👑 Módulo SuperAdmin (Para ti, dueño del SaaS)
* Panel de control centralizado para visualizar, agregar o gestionar todos los restaurantes (tenants) suscritos a tu servicio.

---

## 3. Ventajas Competitivas del Sistema

1. **Arquitectura Cloud y Multi-tenant:** No requiere instalación local; todo funciona desde la nube, permitiendo escalamiento a miles de restaurantes.
2. **Interfaz Moderna y Rápida:** Especialmente diseñada para operaciones de ritmo rápido (mozos y cocina).
3. **Roles Seguros y Delimitados:** Evita que personal no autorizado modifique pedidos o acceda a reportes financieros.
4. **Autonomía Operativa:** El modo Offline-first (si se implementa PWA) y el diseño responsivo permiten usar el sistema desde cualquier tablet barata o celular del mozo.
5. **Cero Comisiones por Pedido:** Al cobrar una suscripción fija, el restaurante maximiza sus ganancias frente a apps de delivery que cobran porcentajes altísimos.

---

## 4. Estructura de Planes y Precios

De acuerdo con tus márgenes definidos, este es el empaquetamiento ideal para la venta (Tiering strategy):

### 🥉 PLAN BÁSICO (Gestión y Operación)
*Recomendado para restaurantes tradicionales, huariques y cafeterías que necesitan ordenar su flujo de toma de pedidos y caja, pero usan menú impreso.*
* **Funciones:** Sistema de Mozos (toma de pedidos), KDS (Pantalla Cocina), Dashboard Admin, Cierre de Caja, y Reportes.
* **Precio Mensual:** **S/ 30.00**
* **Precio Semestral:** **S/ 160.00** *(Ahorro de S/ 20)*
* **Precio Anual:** **S/ 300.00** *(Ahorro de S/ 60 - ¡2 meses gratis!)*

### 🥇 PLAN PREMIUM (Gestión + Digital)
*Recomendado para locales modernos, restobares y franquicias que buscan digitalizar por completo la experiencia del cliente y ahorrar costos de impresión.*
* **Funciones:** Todo lo del Plan Básico **+** Menú Digital Interactivo **+** Códigos QR por mesa **+** Auto-pedidos (Digital Checkout).
* **Precio Mensual:** **S/ 60.00** *(30 Básico + 30 Add-on Digital)*
* **Precio Semestral:** **S/ 190.00** *(160 Básico + 30 Add-on Digital)*
* **Precio Anual:** **S/ 330.00** *(300 Básico + 30 Add-on Digital)*

---

## 5. Implementación del Flujo de Negocio SaaS

Para escalar OrdayGo y convertirlo en una máquina de suscripciones, te sugiero el siguiente flujo operativo:

### A. Captación y Onboarding (Free Trial)
1. **Página de Aterrizaje (Landing Page):** Debes habilitar en la ruta `/` una página vendedora donde ofrezcas una **prueba gratuita de 14 días**.
2. **Registro Automático (Self-Service):** El restaurante se registra, crea su subdominio (`ordaygo.com/el-pollon`), sube su logo inicial y accede instantáneamente al sistema sin intervención tuya.

### B. Gestión de Suscripciones (Pagos)
1. **Pasarela de Pagos (MercadoPago / Niubiz / Stripe):** Integra una pasarela para cobrar de manera recurrente (débito automático). 
2. **Bloqueo Automático (Paywall):** Si el pago no se procesa al vencimiento, el sistema debe cambiar a un estado "Read-Only" (Solo lectura), inhabilitando la creación de pedidos en la ruta `/mozo`, pero permitiendo ver el historial hasta que regularice el pago.
3. **Upselling Digital:** Dentro del Dashboard del administrador (Plan Básico), coloca botones o banners estratégicos: *"Agrega Menú Digital Interactivo por S/ 30 extra al mes y aumenta tus ventas en un 15% - [Actualizar Plan]"*.

### C. Retención y Soporte
1. **Métricas de uso:** Desde tu SuperAdmin, monitorea qué restaurantes no generan pedidos en una semana (riesgo de cancelación) para ofrecerles soporte proactivo.
2. **Materiales de Capacitación:** Integra videos cortos de 1 minuto en el sistema sobre "Cómo abrir caja" o "Cómo crear un producto" para reducir la carga de soporte al cliente.

## Conclusión Estratégica
Tienes en tus manos un producto sumamente sólido y competitivo. El precio de S/ 30 es un "No-Brainer" (una decisión obvia) para cualquier restaurante en Perú, ya que les cuesta más caro el papel de las boletas. Tu enfoque principal ahora debe ser **Volumen**. A este precio, necesitas escalar rápidamente las ventas mediante referidos, ads en redes sociales y demostraciones presenciales con los administradores de los locales.
