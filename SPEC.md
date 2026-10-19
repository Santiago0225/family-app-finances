# FAF — Family App Finances
### Especificación del MVP para construir con Claude Code

> **Para Claude Code:** este documento define qué se construye y con qué reglas. Léelo completo antes de escribir código. El usuario (Santiago) no es desarrollador: explica cada paso en lenguaje simple, en español, y pide confirmación antes de crear cuentas, servicios o cobros. Trabaja por fases (ver sección 10) y no avances a la siguiente sin que la anterior funcione.

---

## 1. Objetivo

App personal (no comercial) para que Santiago y su familia aprendan a controlar sus gastos: **en qué se gasta, cuánto, con qué frecuencia y si se está cumpliendo el presupuesto y la meta de ahorro** definidos a inicio de mes.

Caso de uso central: *"Es día 18, llevo $55.000 de $60.000 en Transporte. ¿Por qué?"* → la app muestra que $30.000 fueron Uber (9 viajes), con cada gasto y su boleta.

## 2. Alcance

- **Cuentas personales e independientes.** Cada usuario ve solo sus datos. No hay cuentas compartidas ni familiares en el MVP.
- **Web app instalable (PWA):** debe funcionar en cualquier celular (iPhone, Samsung, Huawei) desde el navegador, con "Agregar a pantalla de inicio". **No** se publica en App Store ni Play Store.
- **Mobile-first:** se usará casi siempre desde el celular.
- Idioma: español (Chile). Moneda: **CLP**, formato `$12.345` (sin decimales).
- Uso estimado: ~5–10 usuarios.

## 3. Stack técnico

| Pieza | Tecnología |
|---|---|
| Frontend + backend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Base de datos, login y fotos | Supabase (Postgres, Auth, Storage) |
| Publicación | Vercel |
| Lectura de boletas | API de Anthropic (Claude con visión), **solo desde el servidor** |
| Tipo de cambio USD→CLP | API pública del dólar observado (p. ej. mindicador.cl), con corrección manual |

**Reglas de seguridad obligatorias:**
- Las claves (Anthropic, Supabase service key) van en `.env.local` y en las variables de entorno de Vercel. **Nunca** en el código del navegador ni en GitHub. `.env*` debe estar en `.gitignore`.
- **Row Level Security (RLS) activado en todas las tablas:** cada usuario solo puede leer y escribir sus propias filas.
- Las fotos de boletas van en un bucket privado de Supabase Storage, accesible solo por su dueño.
- Para conectar GitHub, Vercel y Supabase usa los flujos de login por navegador (CLI). Nunca pidas contraseñas al usuario.
- El modelo de Claude debe ser configurable por variable de entorno. Partir con `claude-haiku-5-5` por costo; si la precisión en boletas no es suficiente, cambiar a `claude-sonnet-5-5`.

## 4. Login y usuarios

- Registro con **nombre, correo y contraseña**, o **entrar con Google**.
- Si el usuario usa el mismo correo en ambos métodos, es **la misma cuenta** (vincular identidades en Supabase).
- Al crear la cuenta, se cargan las categorías por defecto (sección 6) y la meta de ahorro del 25%.

## 5. Reglas financieras

### 5.1 Mes
- Mes **calendario** (del 1 al último día). Todo presupuesto, ingreso y ahorro se calcula por mes.

### 5.2 Ingresos
- Dos tipos: **fijos** (se repiten cada mes automáticamente hasta editarlos o darlos de baja) y **variables** (pegas, extras; se registran cuando llegan).
- **Nada es obligatorio y los tipos no son excluyentes.** Un usuario puede tener solo fijos, solo variables, ambos o ninguno.
- La app debe funcionar bien **sin ingresos registrados**: en ese caso se controla solo contra los presupuestos.

### 5.3 Ahorro (prioridad visual de la app)
- **Meta mensual = 25% de los ingresos del mes**, editable por cada usuario.
- El ahorro se aparta **primero** ("págate a ti primero"): disponible para gastar = ingresos − meta de ahorro − gastado.
- **Lo que sobra a fin de mes pasa automáticamente al ahorro.** Ahorro real del mes = meta cumplida + sobrante.
- Sin ingresos en el mes → meta = $0; solo cuenta como ahorro lo que sobre del presupuesto.
- Ahorro total acumulado, **sin metas con nombre** en el MVP.

### 5.4 Presupuesto
- Se define **por categoría** a inicio de mes (p. ej. Transporte $60.000). Las subcategorías son para análisis, no tienen presupuesto en el MVP.
- Copiar el presupuesto del mes anterior por defecto, editable.

### 5.5 Gastos fijos
- Se ingresan una vez y se cargan solos cada mes hasta editarlos o darlos de baja.
- **"Fijo" es una característica del gasto, no una categoría.** Cada gasto fijo tiene su categoría y subcategoría (Netflix → Ocio; Claude → Tecnología > IA).
- Debe poder verse el total de gastos fijos del mes y los gastos variables por separado.

### 5.6 Suscripciones en USD
- Se guarda el monto en USD; la app lo convierte a CLP con el dólar observado del día del cargo.
- El usuario puede corregir el monto en CLP si el cobro real fue distinto.

### 5.7 Tarjeta de crédito y cuotas
- Una compra en cuotas se registra **una vez**, con su detalle: descripción, monto total, número de cuotas, valor de la cuota y categoría/subcategoría (p. ej. "Ropa, $100.000 en 4 cuotas").
- La app genera automáticamente **una cuota por mes** en esa categoría. Cada cuota cuenta en el presupuesto del mes en que se cobra.
- El valor de la cuota se registra tal como aparece en el estado de cuenta (ya incluye interés).
- Debe poder ingresarse una compra **ya en curso** ("cuota 2 de 6") para cuotas anteriores al uso de la app.
- En cada categoría, mostrar qué compras en cuotas explican el monto comprometido del mes.
- **El pago del estado de cuenta de la tarjeta NO es un gasto** (los gastos ya se registraron al comprar). Se registra como movimiento neutro o no se registra.

## 6. Categorías y subcategorías por defecto

Editables por cada usuario (agregar, renombrar, ocultar).

| Categoría | Subcategorías |
|---|---|
| **Casa** | Arriendo · Luz · Agua · Gas · Internet/WiFi · Jardinero · Nana · Aseo y limpieza |
| **Comida** | Abarrotes · Proteínas · Frutas y verduras · Comida fuera · Delivery · Gasto hormiga (café, sándwich, snack) |
| **Alcohol** | (categoría propia, con su presupuesto; todo el alcohol va aquí sin importar dónde se compró: supermercado, botillería, disco) |
| **Transporte** | Bencina · Uber · TAG · Bip! · Turno (aporte en dinero a quien pone el auto en un viaje compartido, típicamente compañeros de trabajo) |
| **Salud** | Remedios · Higiene personal · Accidentes |
| **Vestuario** | — |
| **Ocio** | Disco · Cigarros y encendedor · Salidas · Paseos · Streaming y suscripciones |
| **Tecnología** | IA · Implementos tecnológicos |
| **Regalos** | — |
| **Otros** | — |

Cada gasto guarda además el **comercio** (Uber, Líder, Copec…), para agrupar dentro de cada subcategoría por comercio y frecuencia.

## 7. Registro de gastos

### 7.1 Formas de registrar
1. **Foto de boleta** → la IA extrae fecha, comercio, total y **cada ítem**, y asigna cada ítem a su subcategoría.
2. **Pantallazo de movimientos** (tarjeta/cuenta) → la IA extrae la lista de movimientos; el usuario marca cuáles guardar. Cada movimiento va a una sola subcategoría (no hay detalle de ítems).
3. **Comprobante de transferencia** → la IA extrae monto, destinatario y fecha; la app pregunta si es **gasto, pago a otra persona o traspaso entre cuentas propias** (este último no es gasto).
4. **Manual** → para efectivo sin boleta, feria, propinas, etc.

### 7.2 Separación por ítem (requisito clave)
- **No se permiten boletas "mixtas" asignadas a una sola categoría.** Ejemplo: boleta de supermercado de $150.000 donde $50.000 es alcohol → $50.000 a Alcohol y el resto a sus subcategorías correspondientes.
- Las boletas chilenas abrevian productos ("CERV ESC 6PK"). El prompt a la IA debe pedir interpretar abreviaturas y responder en **JSON estructurado** (ítem, monto, subcategoría sugerida, nivel de confianza).
- **Descuentos y promociones** al final de la boleta se prorratean entre los ítems a los que aplican (o proporcionalmente si no se puede determinar).
- **Cuadratura:** la suma de los ítems debe ser igual al total de la boleta. Si no cuadra, avisar antes de guardar y permitir corregir.

### 7.3 Pantalla de confirmación (obligatoria)
- Antes de guardar, mostrar lo que entendió la IA, **agrupado por subcategoría** con subtotales ("Abarrotes $62.000 · Alcohol $50.000 · Proteínas $28.000 · Aseo $10.000").
- Cada grupo se expande para ver los ítems; cada ítem se puede mover a otra subcategoría o editar en un toque.
- Ítems con baja confianza se destacan visualmente.

### 7.4 Duplicados
- Si un movimiento de un pantallazo coincide con una boleta ya registrada (mismo monto, fecha cercana ±3 días), se marca como **"ya registrado"** y no se suma de nuevo. **La boleta manda** (tiene el detalle).

### 7.5 Fotos y botón "Revisar"
- Las fotos se guardan comprimidas como respaldo.
- Todo gasto guardado tiene un botón **"Revisar"** que muestra la foto original junto a los ítems registrados, para corregir si algo no cuadra o dejarlo tal cual.

## 8. Pantalla principal (dashboard)

Dashboard simple y navegable por toques. Orden de arriba hacia abajo:

1. **Ahorro del mes (protagonista):** "Meta de ahorro: $X de $Y (65%)" con barra de progreso. Verde si va en camino de cumplirse. Debe ser motivante de ver.
2. **Disponible este mes:** número grande con lo que queda para gastar después de apartar el ahorro (o lo que queda del presupuesto si no hay ingresos).
3. **Ritmo del mes:** "Día 18 de 31 · llevas 72% del presupuesto", comparando lo gastado con lo esperado a la fecha.
4. **Categorías**, las más críticas primero, con barra de color (verde / amarillo / rojo). Navegación: categoría → subcategorías → comercios ("Uber · 9 viajes · $30.000") → gastos individuales con botón "Revisar".
5. **Próximos cargos del mes:** gastos fijos y cuotas que aún no se cobran.
6. **Últimos 3 gastos.**
7. **Botón flotante "+ Registrar"**, siempre visible.

## 9. Alertas

- Aviso al llegar al **80%** de una categoría y al superar el **100%**.
- En el MVP las alertas son **dentro de la app** (colores y avisos visibles). Las notificaciones push quedan fuera del MVP.

## 10. Plan de construcción por fases

Meta: ~2 horas diarias durante ~2 semanas. Cada fase debe terminar con algo que funcione y se pueda probar en el celular.

**Fase 0 — Preparación**
- Crear el proyecto Next.js, repositorio en GitHub, proyecto en Supabase y conexión a Vercel (con login por navegador).
- Configurar `.env.local`, `.gitignore` y variables en Vercel.
- Publicar una página "Hola FAF" en Vercel y verla desde el celular.

**Fase 1 — Base**
- Login (correo/contraseña + Google, vinculados).
- Tablas en Supabase con RLS y categorías por defecto.
- Registro manual de gastos y lista de gastos del mes.

**Fase 2 — Presupuesto y dashboard**
- Presupuesto por categoría, ingresos (fijos y variables), meta de ahorro.
- Dashboard de la sección 8 con navegación categoría → subcategoría → comercio → gasto.

**Fase 3 — Lectura de boletas con IA**
- Subir foto → servidor llama a la API de Anthropic → JSON con ítems → pantalla de confirmación → guardar.
- Cuadratura, prorrateo de descuentos, foto guardada y botón "Revisar".

**Fase 4 — Pantallazos y transferencias**
- Extracción de varios movimientos por imagen, selección, detección de duplicados.
- Clasificación de transferencias.

**Fase 5 — Recurrentes**
- Gastos fijos recurrentes, suscripciones en USD, compras en cuotas (incluidas las ya en curso).
- Próximos cargos del mes, cierre de mes con traspaso automático del sobrante al ahorro.

**Fase 6 — Pulido**
- Alertas 80% / 100%, PWA instalable (ícono, nombre FAF), pruebas en iPhone, Samsung y Huawei.

## 11. Modelo de datos (propuesta inicial)

Ajustable al construir. Todas las tablas con `user_id` y RLS.

- `profiles` — nombre, % de ahorro (default 25)
- `categories` / `subcategories` — por usuario, editables
- `budgets` — usuario, mes, categoría, monto
- `incomes` — tipo (fijo/variable), monto, fecha, recurrente sí/no, activo
- `recurring_expenses` — descripción, monto, moneda (CLP/USD), subcategoría, día de cargo, activo
- `installment_purchases` — descripción, total, n° cuotas, valor cuota, cuota inicial, mes de inicio, subcategoría
- `transactions` — fecha, comercio, total, origen (boleta / pantallazo / transferencia / manual / recurrente / cuota), tipo (gasto / traspaso / pago tarjeta), ref. a foto
- `transaction_items` — transacción, descripción, monto, subcategoría
- `receipts` — ruta de la foto en Storage, JSON crudo de la IA, estado
- `monthly_savings` — usuario, mes, meta, sobrante, total

## 12. Fuera del MVP (para después)

- Cuentas o presupuestos familiares compartidos
- Metas de ahorro con nombre (viaje, fondo de emergencia)
- Presupuesto por subcategoría (p. ej. "Uber máx. $20.000")
- Notificaciones push
- Lectura automática de correos de notificación de los bancos
- Exportar a Excel
- Publicación en App Store / Play Store

## 13. Cómo trabajar con Santiago

- Explica en simple qué vas a hacer antes de hacerlo y qué cambió después.
- Él usa **Windows** y la terminal; da comandos exactos para su sistema.
- Al terminar cada fase, indica cómo probarla (en el computador y en el celular).
- Ante una decisión de producto no cubierta aquí, pregunta antes de asumir.
- Haz commits pequeños y frecuentes en GitHub con mensajes claros en español.
