# Guía para Auditar y Optimizar Lecturas en Firestore para un POS


Debes analizar el código y aplicar las siguientes recomendaciones. Existen muchas lecturas innecesarias en Firestore o falta optimización. o esta bien optimizado?

---

# 1. Detectar listeners en colecciones completas

Buscar en el código patrones como:

onSnapshot(collection(db, "orders"))

Problema:
Si existen muchos documentos en la colección, Firestore leerá todos los documentos al abrir la pantalla.

Ejemplo:

200 pedidos

Cada cliente conectado genera:

200 lecturas

Si existen 5 dispositivos conectados:

200 × 5 = 1000 lecturas

Optimización requerida:

Reemplazar por consultas filtradas.

Ejemplo:

query(
 collection(db, "orders"),
 where("status", "==", "open")
)

Solo deben escucharse pedidos activos.

---

# 2. Detectar listeners en productos

Buscar patrones como:

onSnapshot(collection(db, "products"))

Problema:

Los productos casi nunca cambian pero se escuchan en tiempo real.

Ejemplo:

300 productos

Cada carga de pantalla:

300 lecturas

Optimización requerida:

Cambiar a carga única.

getDocs(collection(db, "products"))

Los productos deben almacenarse en memoria o cache local.

---

# 3. Detectar listeners en mesas

Buscar código similar a:

onSnapshot(collection(db, "tables"))

Problema:

Cada actualización puede provocar lecturas innecesarias.

Optimización requerida:

Escuchar solo mesas ocupadas.

query(
 collection(db, "tables"),
 where("status", "==", "occupied")
)

---

# 4. Detectar dashboards que cargan demasiadas colecciones

La IA debe revisar vistas de administración que cargan múltiples colecciones simultáneamente.

Ejemplo:

ventas
pedidos
productos
mesas
clientes

Si todas se cargan al iniciar la vista se pueden generar más de 1000 lecturas.

Optimización requerida:

1. Implementar paginación
2. Crear documentos de resumen

Ejemplo:

stats/today_sales
stats/orders_count
stats/revenue_today

El dashboard debe consumir principalmente documentos de estadísticas.

---

# 5. Detectar subcolecciones innecesarias de items

Buscar estructuras como:

orders
 orderId
   items
   items

Problema:

Cada item requiere una lectura adicional.

Ejemplo:

Pedido con 5 productos

1 lectura pedido
5 lecturas items

Total = 6 lecturas

Optimización requerida:

Guardar los items dentro del documento del pedido.

Ejemplo:

items: [
 {name:"Ceviche", qty:1},
 {name:"Chicha", qty:2}
]

---

# 6. Separar pedidos activos e históricos

La IA debe verificar si existe una sola colección de pedidos.

Si existe:

orders

Debe recomendar separar en:

orders_live
orders_history

Flujo esperado:

Crear pedido
→ orders_live

Modificar pedido
→ orders_live

Cerrar pedido
→ mover a orders_history

Eliminar de orders_live

Beneficio:

Si existen 2000 pedidos históricos y 20 activos:

Escuchar "orders" = 2020 lecturas

Escuchar "orders_live" = 20 lecturas

Reducción potencial superior al 90%.

---

# 7. Identificar datos que no necesitan tiempo real

La IA debe clasificar las colecciones.

Datos que SÍ deben ser realtime:

mesas activas
pedidos activos
estado de cocina

Datos que NO deben ser realtime:

productos
reportes
ventas históricas
clientes

---

# 8. Arquitectura recomendada para POS

restaurants
  restaurantId

    orders_live
    orders_history

    tables
    products

    customers

    stats

---

# 9. Objetivo de optimización

Después de aplicar las recomendaciones el sistema debe:

Reducir lecturas en Firestore entre 60% y 90%.

---

# 10. Instrucción final para la IA

1. Analizar el código completo.
2. Detectar consultas onSnapshot innecesarias.
3. Identificar colecciones que deberían usar getDocs.
4. Detectar estructuras que generen demasiadas lecturas.
5. Proponer refactorización automática.
6. Aplicar separación entre datos activos e históricos.
7. Generar versión optimizada del código.

