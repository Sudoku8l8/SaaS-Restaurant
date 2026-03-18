# Auditoría Profesional de UX, UI y Lógica del Sistema

Este documento recopila las observaciones y planes de mejora derivados de la auditoría automatizada del sistema SaaS Restaurant interactuando con diferentes perfiles (Admin, Mozo, Caja).

## 1. Perfil Administrador (Desktop & Responsive)
### UX/UI
- **Aspectos Positivos:** Excelente consistencia visual con la paleta de marca y jerarquía de la información. El dashboard resume eficientemente las métricas clave. La adaptación a dispositivos móviles transforma correctamente las tablas densas en tarjetas.
- **Áreas de Mejora:** 
  - El botón "Ingresar" del login carece de rol semántico adecuado (no se detecta estrictamente como un `<button>`), lo que impacta la accesibilidad y el soporte para screen readers.
  - La navegación requiere clics innecesarios ("pogo-sticking"). Moverse entre Inventario, Caja Chica y Configuración obliga a frecuentar el inicio central.

### Lógica y Flujo
- Al hacer login con el PIN `0000` (Admin), el sistema redirige por defecto a la ruta `/cocina`. Para un perfil gerencial, el punto de aterrizaje ideal debería ser el **Dashboard Principal** para visualizar ventas y métricas al instante.
- El módulo de "Configuración" segmenta bien las opciones por pestañas, y detalles como el selector visual de color para categorías demuestran madurez en el frontend.
## 2. Perfil Mozo / Mesero (Responsive / Mobile)
### UI y Visualización (Grid & UI Elements)
- **Cabecera (Header):** El nuevo icono de "Caja Chica" reemplazó a la hamburguesa exitosamente, simplificando la vista. Sin embargo, en dispositivos móviles, la barra superior puede verse saturada. Se sugiere abreviar el nombre del usuario o mostrar solo su rol para evitar desbordes visuales.
- **Mapa de Mesas (Grid):** Actualmente, el diseño muestra 3 columnas fijas en la cuadrícula de mesas. En resoluciones de smartphone (~390px), las tarjetas quedan muy estrechas (~110px), dificultando la legibilidad de los estados ("Libre", "Ocupado") y reduciendo el área táctil. Se recomienda encarecidamente cambiar a un `grid-cols-2` en móviles.

### UX y Lógica Operativa (OrderModal)
- **Trampas de Navegación (Navigation Traps):** En el modal de pedidos, la pestaña "Menú" tiene un botón para cerrar (`X`), pero la pestaña "Pedido" carece de este botón. Si el mozo necesita abortar la visualización del pedido, debe retroceder primero a la pestaña del menú.
- **Botones de Acción Ocultos (Scroll Issue):** Es un problema crítico que los botones principales ("Confirmar Pedido", "Pagar", "Volver") queden relegados al final del contenedor con scroll. Si el ticket es largo, el mozo debe desplazarse hasta el fondo para guardar. **Solución sugerida:** Implementar un Sticky Footer (`sticky bottom-0`) para las acciones principales.
- **Lógica de Retroalimentación:** Tras de presionar "Confirmar Pedido" y ver el mensaje de éxito, el botón de cierre sigue diciendo "Volver sin guardar", lo cual genera incertidumbre. Debería cambiar a "Finalizar" o "Cerrar".
- **Venta Rápida:** Los pedidos rápidos se envían correctamente al final (sección "Para Llevar"), pero carecen de una notificación (Toast o Badge visual) que le confirme al mozo de inmediato en qué sección se guardó la orden pendiente para poder cobrarla, obligándolo a hacer scroll hasta el fondo para encontrarla.

*Evaluación del perfil Caja a continuación...*

## 3. Perfil Caja / Cashier (Desktop / Tablet)
### UI y Visualización (Contraste y Layouts)
- **Contraste de Inputs:** Excelente legibilidad en los modales de cobro. El tamaño de las fuentes para los montos totales y el diseño de los métodos de pago (Efectivo, Yape, Tarjeta) es claro y evita errores de tecleo en entornos rápidos.
- **Acceso a Funciones:** Al haber removido el menú de hamburguesa de la vista "Mesas" recientemente, el Cajero ha perdido el acceso directo al **"Cierre de Caja"** desde esa pantalla, lo cual es un paso atrás en usabilidad para este rol específico.

### UX y Lógica Operativa (Gestión de Pagos)
- **Redirección de Login (Lógica Errónea):** Al ingresar con el PIN de Caja (`9999`), el sistema redirige al usuario a la vista de `/cocina`. Un cajero jamás debería aterrizar en cocina. Debería ir por defecto al mapa de mesas (`/mozo`) o a un dashboard exclusivo.
- **Flujo de Cobro Bloqueado:** El botón "Cobrar Cuenta" solo aparece cuando el pedido cambia a estado "ENTREGADO". En la vida real, muchos clientes de "Venta Rápida" o "Para Llevar" pagan por adelantado mientras la comida está "PENDIENTE". Bloquear el cobro genera fricción operativa.
- **Pagos Parciales/Divididos:** Función excelentemente lograda. Es intuitiva, actualiza el saldo restante en tiempo real y permite deshacer pagos fácilmente.
- **Ausencia de un Dashboard Central:** El cajero debe navegar por el mapa de mesas buscando íconos de colores para saber quién debe pagar. Falta un *"Listado Visual Único de Cuentas por Cobrar"* para uso exclusivo de la caja.

---

## 4. Conclusiones y Plan de Acción Profesional Sugerido

Para elevar el software SaaS a un estándar "Premium" de clase mundial, sugerimos accionar las siguientes mejoras estructuradas por prioridad:

### Alta Prioridad (Lógica Crítica y UX Bloqueante)
1. **Corregir Redirecciones:** Enlazar cada rol a su entorno lógico natural post-login. Admin al `Dashboard`, Caja a las `Mesas` (o sección Caja si existiera), Cocina a `Cocina`.
2. **Sticky Footer en OrderModal:** Modificar el contenedor de cierre de pedidos en móviles para que los botones de Pagar, Confirmar e Imprimir siempre floten encima del contenido visual (evitar scroll mortal).
3. **Acceso a Cierre de Caja:** Crear un botón exclusivo de "Cierre de Caja" en la cabecera, visible únicamente si `user.role === 'admin' || user.role === 'caja'`, solucionando la pérdida de este botón tras remover la hamburguesa.
4. **Desbloquear Cobro Anticipado:** Permitir que los cajeros abran el modal de pago incluso si el pedido está "Pendiente" o en "Preparación".

### Media Prioridad (Mejora Evolutiva UI)
5. **Ajuste de Grid Móvil:** Implementar `grid-cols-2` en el [TableMap.tsx](file:///c:/Users/Sudoku/Documents/ProyectosWeb/SaaS-Restaurant/src/components/features/TableMap.tsx) cuando la pantalla sea menor a 640px para asegurar tamaños táctiles de al menos 44x44px (estándares de Apple/Google).
6. **Notificación de Venta Rápida:** Mostrar un Toast ("✓ Registrado en Para Llevar") cuando se crea un pedido rápido sin finalizar, guiando al cajero o mozo.
7. **Accesibilidad Semántica:** Revisar el teclado numérico de PIN y el formulario de login para que soporten eventos nativos de `Submit` y etiquetas `<button>` estándar.
