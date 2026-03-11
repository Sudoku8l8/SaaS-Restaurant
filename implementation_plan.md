# Plan de Optimización de Lecturas Firestore — POS SaaS Restaurant

## Resumen Ejecutivo

Después de auditar todo el código fuente, se identificaron **22+ listeners `onSnapshot`** y **25+ llamadas `getDocs`** en **16+ archivos**. Se encontraron oportunidades significativas de reducción de lecturas estimadas en un **60-85%**.

> [!IMPORTANT]
> Este plan NO incluye tests unitarios ya que el proyecto no tiene infraestructura de testing configurada. La verificación se realizará con **build de producción** + **testing manual** en el navegador.

---

## Hallazgos de la Auditoría

### 🔴 Problemas Críticos

| Problema | Archivos Afectados | Lecturas Estimadas/Sesión |
|---|---|---|
| Products/Categories usan `onSnapshot` (datos casi estáticos) | [OrderModal.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/OrderModal.tsx), [ProductsTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/ProductsTab.tsx), [usePublicMenu.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/usePublicMenu.ts), [InventoryTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/InventoryTab.tsx), [CategoriesTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/CategoriesTab.tsx) | **300-600** por pantalla |
| Tables escucha TODAS las mesas sin filtro de estado | [useTables.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useTables.ts) | **50-100** por cambio |
| [useDailySales.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDailySales.ts) usa `onSnapshot` para ventas del día (data histórica) | [useDailySales.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDailySales.ts) | **100-500** por actualización |
| [OwnerDashboardPage](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Admin/OwnerDashboardPage.tsx#19-266) carga 3 colecciones por sucursal en loop | [OwnerDashboardPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Admin/OwnerDashboardPage.tsx) | **300+** por carga |
| Sin separación entre pedidos activos e históricos | [useOrders.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useOrders.ts), [ReportesPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Reportes/ReportesPage.tsx) | **100-2000** según acumulación |

### 🟢 Ya Optimizado (No tocar)

| Componente | Estado |
|---|---|
| [useOrders.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useOrders.ts) — `onSnapshot` filtra por `status in ['pending','in_preparation','ready','delivered']` | ✅ Correcto |
| [usePettyCash.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/usePettyCash.ts) — Filtra por `date == today` | ✅ Correcto |
| [useCashSession.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useCashSession.ts) — Filtra por fecha | ✅ Correcto |
| [useClosureStatus.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useClosureStatus.ts) — Filtra por fecha | ✅ Correcto |
| [useFloors.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useFloors.ts) — Datos necesarios en realtime | ✅ Correcto |
| [useDigitalOrders.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDigitalOrders.ts) — Filtra por `restaurantId` + `status` | ✅ Correcto |
| [TenantProvider.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/app/providers/TenantProvider.tsx) — Escucha 1 doc | ✅ Correcto |
| [BranchProvider.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/app/providers/BranchProvider.tsx) — Escucha pocos docs | ✅ Correcto |

---

## Clasificación de Datos (Realtime vs Estático)

| Dato | ¿Necesita Realtime? | Método Recomendado |
|---|---|---|
| Pedidos activos (`orders` active) | ✅ SÍ | `onSnapshot` con filtro status |
| Mesas activas | ✅ SÍ | `onSnapshot` con filtro status |
| Estado de cocina | ✅ SÍ | `onSnapshot` (ya correcto) |
| Caja chica del día | ✅ SÍ | `onSnapshot` (ya correcto) |
| **Productos** | ❌ NO | `getDocs` + cache en memoria |
| **Categorías** | ❌ NO | `getDocs` + cache en memoria |
| **Reportes** | ❌ NO | `getDocs` con filtros |
| **Ventas del día (cerradas)** | ❌ NO | `getDocs` o doc resumen |
| **Usuarios** | ❌ NO | `getDocs` |
| **Dashboard multi-sucursal** | ❌ NO | Docs resumen `stats/` |

---

## Sprints de Implementación

---

### Sprint 1: Cache de Productos y Categorías (Impacto: ~40% reducción)

**Objetivo:** Eliminar listeners `onSnapshot` redundantes de productos y categorías. Crear un servicio de cache centralizado que cargue con `getDocs` una sola vez y exponga los datos a todos los componentes.

**Estimación:** 2-3 horas

---

#### Tarea 1.1: Crear servicio de cache `ProductCacheService`

#### [NEW] [productCacheService.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/services/productCacheService.ts)

Crear un servicio singleton que:
- Cargue productos y categorías una sola vez con `getDocs`
- Almacene en memoria con `Map` o `useState` global
- Exponga método `invalidate()` para recargar manualmente (ej: tras editar un producto)
- Exponga método `getProducts(restaurantId)` y `getCategories(restaurantId)`
- Use un TTL de 5 minutos como fallback de invalidación automática

```typescript
// Patrón:
class ProductCacheService {
  private products: Map<string, Product[]> = new Map();
  private categories: Map<string, Category[]> = new Map();
  private lastFetch: Map<string, number> = new Map();
  private TTL = 5 * 60 * 1000; // 5 min
  private listeners: Set<() => void> = new Set();

  async load(restaurantId: string): Promise<void> { ... }
  getProducts(restaurantId: string): Product[] { ... }
  getCategories(restaurantId: string): Category[] { ... }
  invalidate(restaurantId: string): void { ... }
  subscribe(listener: () => void): () => void { ... }
}
```

#### Tarea 1.2: Crear hook `useProductCache`

#### [NEW] [useProductCache.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useProductCache.ts)

Hook React que consume el `ProductCacheService`:
- Suscribe al cache y re-renderiza cuando cambia
- Retorna `{ products, categories, isLoading, refresh }`

#### Tarea 1.3: Migrar [OrderModal.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/OrderModal.tsx)

#### [MODIFY] [OrderModal.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/OrderModal.tsx)

- **Líneas 100-118**: Reemplazar `onSnapshot` de products y categories por `useProductCache()`
- Eliminar imports de `onSnapshot`, `collection`, `query`, `where` de Firestore
- Eliminar el `useEffect` que escucha products/categories

#### Tarea 1.4: Migrar [ProductsTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/ProductsTab.tsx)

#### [MODIFY] [ProductsTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/ProductsTab.tsx)

- **Líneas 85-118**: Reemplazar `onSnapshot` de products y categories por `useProductCache()`
- Llamar `cache.invalidate()` después de crear/editar/eliminar producto (líneas 120-161)

#### Tarea 1.5: Migrar [usePublicMenu.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/usePublicMenu.ts)

#### [MODIFY] [usePublicMenu.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/usePublicMenu.ts)

- Reemplazar `onSnapshot` (líneas 43-64) por `getDocs` directo
- El menú público no necesita realtime ni cache persistente, solo `getDocs` con filtro `available == true`

#### Tarea 1.6: Migrar [InventoryTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/InventoryTab.tsx)

#### [MODIFY] [InventoryTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/InventoryTab.tsx)

- **Líneas 56-70**: Reemplazar `onSnapshot` de products por datos del cache
- El `onSnapshot` de `inventory_items` se mantiene (datos que sí cambian)

#### Tarea 1.7: Migrar [CategoriesTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/CategoriesTab.tsx)

#### [MODIFY] [CategoriesTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/CategoriesTab.tsx)

- Reemplazar listener por `useProductCache()` para categorías
- Invalidar cache al crear/editar/eliminar categoría

#### Tarea 1.8: Migrar [RecipeModal.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/RecipeModal.tsx)

#### [MODIFY] [RecipeModal.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/RecipeModal.tsx)

- **Línea 49**: Reemplazar `onSnapshot` de `inventory_items` por `getDocs` (solo lectura, datos se modifican raramente)

#### Tarea 1.9: Migrar [UsersTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/UsersTab.tsx)

#### [MODIFY] [UsersTab.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/UsersTab.tsx)

- **Línea 55**: Reemplazar `onSnapshot` de users por `getDocs` (usuarios cambian raramente)
- Recargar manualmente después de crear/editar/eliminar usuario

---

### Sprint 2: Optimización de Tables y DailySales (Impacto: ~15% reducción)

**Objetivo:** Filtrar listener de mesas y convertir ventas diarias a carga única.

**Estimación:** 1-2 horas

---

#### Tarea 2.1: Filtrar listener de mesas

#### [MODIFY] [useTables.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useTables.ts)

> [!WARNING]
> Las mesas se usan en el módulo de Mozo para mostrar estado `free`/`occupied`. Se necesita confirmar si el Mozo necesita ver TODAS las mesas o solo las ocupadas. **Recomendación:** mantener el listener de todas las mesas PERO evaluar si se puede convertir a `getDocs` con refresh manual, dado que la UI del mozo ya recibe actualizaciones via los pedidos.

- **Opción A** (conservadora): Mantener `onSnapshot` pero ya está filtrado por `restaurantId` — **aceptable**
- **Opción B** (agresiva): Cambiar a `getDocs` + refresh cada 30 segundos o al cambiar estado de un pedido

#### Tarea 2.2: Migrar [useDailySales.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDailySales.ts) a `getDocs`

#### [MODIFY] [useDailySales.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDailySales.ts)

- **Líneas 34-90**: Cambiar `onSnapshot` a `getDocs` ya que las ventas del día ya cerradas no cambian
- Agregar un intervalo de refresh opcional (cada 60 segundos) o un mecanismo de refresh manual
- Alternativa: mantener `onSnapshot` pero solo para el día actual (ya lo hace)

> [!NOTE]
> [useDailySales](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDailySales.ts#15-94) ya filtra por `dateStr == today` y `status == 'paid'`, lo cual es relativamente eficiente. Sin embargo, cada vez que se paga una orden nueva, **todos los docs se re-leen**. Cambiar a `getDocs` con refresh periódico reduce este costo.

#### Tarea 2.3: Migrar [useLowStock.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useLowStock.ts) a `getDocs`

#### [MODIFY] [useLowStock.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useLowStock.ts)

- **Líneas 42-68**: Reemplazar `onSnapshot` por `getDocs` (stock bajo es informativo, no necesita realtime)
- Agregar refresh al volver a la pantalla o cada 5 minutos

#### Tarea 2.4: Migrar [useInventoryMovements.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useInventoryMovements.ts)

#### [MODIFY] [useInventoryMovements.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useInventoryMovements.ts)

- **Línea 48**: Cambiar `onSnapshot` a `getDocs` (movimientos de inventario son datos de consulta, no necesitan realtime)
- Ya tiene `limit` y `orderBy`, mantener esos filtros

---

### Sprint 3: Optimización de Dashboard y Reportes (Impacto: ~10% reducción)

**Objetivo:** Reducir lecturas en el dashboard del dueño y la página de reportes.

**Estimación:** 2-3 horas

---

#### Tarea 3.1: Crear documentos de resumen diario

Implementar un mecanismo para que al cerrar caja (cierre de caja), se genere/actualice un documento de resumen:

```
restaurants/{restaurantId}/dailyStats/{dateStr}
```

Campos:
```typescript
{
  date: string,
  totalSales: number,
  orderCount: number,
  salesByWaiter: Record<string, number>,
  salesByPaymentMethod: Record<string, number>,
  lowStockCount: number,
  pettyCashTotal: number
}
```

> [!IMPORTANT]
> Esto es un cambio de arquitectura. Requiere actualizar la función [payOrder](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useOrders.ts#123-304) o el cierre de caja para que actualice este documento de estadísticas con `increment()`. Evaluar si el beneficio justifica la complejidad vs. simplemente usar `getDocs` optimizado.

#### Tarea 3.2: Optimizar [OwnerDashboardPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Admin/OwnerDashboardPage.tsx)

#### [MODIFY] [OwnerDashboardPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Admin/OwnerDashboardPage.tsx)

- **Líneas 38-92**: Si se implementan docs de resumen (Tarea 3.1), reemplazar las 3 queries por sucursal con una sola lectura de `dailyStats/{today}`
- Si NO se implementan docs de resumen: agregar `limit()` y optimizar queries existentes

#### Tarea 3.3: Migrar [usePendingClosures.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/usePendingClosures.ts)

#### [MODIFY] [usePendingClosures.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/usePendingClosures.ts)

- **Línea 89**: Evaluar si el `onSnapshot` de closures es necesario (se usa para detectar nuevos cierres pendientes)
- Si se usa solo al abrir la página: migrar a `getDocs` con refresh manual

---

### Sprint 4: Separación Orders Live / Orders History (Impacto: ~20-30% reducción a largo plazo)

**Objetivo:** Implementar la separación de pedidos activos e históricos para que la colección activa nunca crezca indefinidamente.

**Estimación:** 4-6 horas

> [!CAUTION]
> Este es el cambio más grande y de mayor riesgo. Afecta la estructura de datos en Firestore y requiere una migración de datos existentes. **Se recomienda implementar en un entorno de staging primero.**

---

#### Tarea 4.1: Diseñar esquema `orders_live` y `orders_history`

- `orders_live`: Solo pedidos con `status in ['pending','in_preparation','ready','delivered']`
- `orders_history`: Pedidos con `status in ['paid','cancelled']`
- Al pagar o cancelar un pedido → mover de `orders_live` a `orders_history`

#### Tarea 4.2: Actualizar [useOrders.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useOrders.ts)

#### [MODIFY] [useOrders.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useOrders.ts)

- **Línea 32**: Cambiar `collection(db, 'orders')` → `collection(db, 'orders_live')`
- **[createOrder](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useOrders.ts#62-114)**: Crear en `orders_live`
- **[payOrder](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useOrders.ts#123-304)**: Después del `batch.commit()`, mover el documento a `orders_history` y eliminar de `orders_live`
- **[deleteOrder](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useOrders.ts#305-344)**: Mover a `orders_history` con status `cancelled` en lugar de eliminar

#### Tarea 4.3: Actualizar [useDailySales.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDailySales.ts)

#### [MODIFY] [useDailySales.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDailySales.ts)

- Cambiar a leer de `orders_history` (solo pedidos pagados)

#### Tarea 4.4: Actualizar [ReportesPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Reportes/ReportesPage.tsx)

#### [MODIFY] [ReportesPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Reportes/ReportesPage.tsx)

- Todas las consultas de órdenes pagadas/históricas → leer de `orders_history`

#### Tarea 4.5: Actualizar [OwnerDashboardPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Admin/OwnerDashboardPage.tsx)

#### [MODIFY] [OwnerDashboardPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/Admin/OwnerDashboardPage.tsx)

- Consultas de ventas → leer de `orders_history`

#### Tarea 4.6: Actualizar [CierreCajaPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/CierreCaja/CierreCajaPage.tsx)

#### [MODIFY] [CierreCajaPage.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/pages/CierreCaja/CierreCajaPage.tsx)

- Consultas de pedidos cerrados → leer de `orders_history`

#### Tarea 4.7: Actualizar hooks que consultan pedidos

- [usePendingClosures.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/usePendingClosures.ts) → `orders_history` para pedidos pagados
- [useDigitalOrders.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useDigitalOrders.ts) → verificar si lee `orders` (sí, línea 106)
- [useProductMovements.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useProductMovements.ts) → `orders_history` para referencia
- [DailyReportPreviewModal.tsx](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/components/features/DailyReportPreviewModal.tsx) → `orders_history`
- [exportExcel.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/services/exportExcel.ts) → verificar si lee orders

#### Tarea 4.8: Script de migración de datos existentes

Crear un script one-time que:
1. Lea todos los documentos de `orders` con `status in ['paid','cancelled']`
2. Los copie a `orders_history`
3. Los elimine de `orders` (ahora `orders_live`)

> [!WARNING]
> Este script debe ejecutarse en producción con cuidado. Considerar hacerlo en lotes de 500 documentos para no saturar Firestore.

---

### Sprint 5: Verificación Final y Limpieza (QA)

**Estimación:** 1-2 horas

---

#### Tarea 5.1: Build de producción
```bash
npm run build
```
Verificar que no haya errores de compilación TypeScript.

#### Tarea 5.2: Testing manual en navegador

Flujos a probar:

1. **Flujo de Mozo:** Abrir app → crear pedido → verificar que productos cargan bien → agregar items → guardar pedido
2. **Flujo de Cocina:** Abrir cocina → verificar pedidos pendientes aparecen → cambiar estado de pedido
3. **Flujo de Caja:** Cobrar pedido → verificar mesa se libera → verificar en ventas del día
4. **Flujo de Admin/Productos:** Crear producto → editar producto → verificar que se actualiza en OrderModal
5. **Flujo de Reportes:** Generar reporte diario → exportar Excel → verificar datos
6. **Flujo de Caja Chica:** Registrar gasto → aprobar gasto
7. **Flujo de Dashboard Dueño:** Ver dashboard consolidado → verificar métricas

#### Tarea 5.3: Limpieza de imports no usados

Revisar todos los archivos modificados y eliminar imports de Firestore que ya no se usen (`onSnapshot`, etc.).

---

## Resumen de Impacto Estimado

| Sprint | Reducción Estimada | Riesgo | Prioridad |
|---|---|---|---|
| Sprint 1: Cache Productos/Categorías | **~40%** | 🟢 Bajo | Alta |
| Sprint 2: Tables + DailySales | **~15%** | 🟢 Bajo | Media |
| Sprint 3: Dashboard Stats | **~10%** | 🟡 Medio | Media |
| Sprint 4: Orders Live/History | **~20-30%** | 🔴 Alto | Alta (largo plazo) |
| **Total acumulado** | **~60-85%** | | |

---

## Decisiones que Requieren tu Feedback

1. **Sprint 4 (Orders Live/History):** ¿Deseas implementarlo ahora o posponerlo para una fase futura? Es el cambio más invasivo pero el de mayor impacto a largo plazo.

2. **Sprint 3 (Docs de Resumen):** ¿Prefieres implementar documentos de resumen incrementales o simplemente optimizar las queries existentes con `getDocs`?

3. **[useTables.ts](file:///c:/Users/sudoku/Documents/Proyectos/SaasRestaurant/restaurant-orders/src/hooks/useTables.ts):** ¿El mozo necesita ver TODAS las mesas en realtime, o podemos cambiar a `getDocs` con refresh?

## Verification Plan

### Automated Build Check
```bash
cd c:\Users\sudoku\Documents\Proyectos\SaasRestaurant\restaurant-orders
npm run build
```
Un build sin errores TypeScript confirma que todos los tipos y imports son correctos.

### Manual Verification
Se cubrirán los 7 flujos listados en la Tarea 5.2 usando el servidor de desarrollo (`npm run dev`).
