# Documentación Backend

## Arquitectura: MVC + Service Layer

El backend sigue un patrón MVC con una capa de servicios adicional. Cada capa tiene una responsabilidad única y no debe asumir responsabilidades de otra.

```
src/
├── controller/        → Maneja HTTP: recibe request, delega al service, devuelve response
├── router/            → Define rutas y aplica middlewares
├── service/           → Lógica de negocio compleja
├── model/             → Acceso a datos con Prisma
├── middleware/        → Interceptores (auth, validación, errores)
├── policies/          → ABAC (control de acceso basado en atributos)
├── schemas/           → Validación de entrada con Zod
├── utils/             → Funciones auxiliares reutilizables
├── db.js              → Pool PostgreSQL
├── prisma.js          → Cliente Prisma
└── index.js           → Servidor Express
```

---

## Flujo de una Request

```
1. Request llega al router
2. Middleware de validación (schemas/)
3. Middleware de autenticación (middleware/auth.js)
4. Middleware de autorización (middleware/abac.js + policies/)
5. Controller — recibe request, llama al service, devuelve response
6. Service — orquesta lógica de negocio
7. Model — accede a Prisma
8. Prisma → PostgreSQL
9. Response regresa al cliente
```

---

## Capas

### router/
Define rutas y mapea URLs a métodos del controller. Aplica middlewares en el orden correcto: primero validación de esquema, luego autenticación, luego autorización, luego el controller.

---

### controller/
**Responsabilidad única: recibir la request, llamar al service y devolver la response HTTP.**

- No contiene lógica de negocio.
- Recibe el resultado del service como `{ code, data? }`.
- Compara el `code` contra las constantes de `utils/responses.js` para determinar el status HTTP y el cuerpo de la respuesta.
- El bloque `catch` siempre retorna un `500`.

**Reglas:**
- SIEMPRE usar las constantes de `utils/responses.js` para comparar el `code`. Nunca comparar contra strings literales.
- SIEMPRE incluir un bloque `try/catch`.
- NUNCA tomar decisiones de negocio dentro del controller.

---

### service/
**Responsabilidad única: orquestar la lógica de negocio.**

- Usa el model para acceder a datos y utils para operaciones auxiliares.
- SIEMPRE retorna un objeto con la forma `{ code, data? }`.
  - `code` es una constante de `utils/responses.js`.
  - `data` es opcional y solo se incluye cuando hay información que pasar al controller.
- No construye ni retorna objetos HTTP (sin `status`, sin `body` directo).
- No lanza errores controlados; los maneja internamente y retorna el `code` correspondiente.

**Reglas:**
- SIEMPRE retornar `{ code }` o `{ code, data }`.
- SIEMPRE usar las constantes de `utils/responses.js` para el valor de `code`.
- NUNCA retornar status HTTP ni construir respuestas JSON.

---

### model/
**Responsabilidad única: acceso a datos.**

- Toda comunicación con Prisma y la base de datos ocurre aquí.
- Mapea los campos de la BD (snake_case) a la aplicación (camelCase).
- Retorna los datos en crudo o `null` si no hay resultado; no toma decisiones de negocio.

---

### middleware/

#### Autenticación (`middleware/auth.js`)
Verifica el JWT en el header `Authorization`. Si es válido, adjunta el payload decodificado a `req.user` y llama a `next()`. Si no, lanza un error.

#### Validación (`middleware/validate.js`)
Valida el cuerpo de la request contra un schema de Zod. Si la validación falla, responde con `400` antes de llegar al controller.

#### Error Handler (`middleware/ErrorHandler.js`)
Intercepta errores no controlados que lleguen como excepciones. Responde con `500` y el mensaje del error. Se registra al final de la cadena de middlewares en `index.js`.

#### RBAC
Verifica que el usuario tenga un rol específico antes de continuar. Se usa con `requireRole("admin")` directamente en el router.

#### ABAC (`middleware/abac.js`)
Evalúa políticas de autorización personalizadas definidas en `policies/`. Se usa con `authorize(policy)` en el router. Permite control de acceso basado en atributos del usuario y del recurso.

---

### policies/
Define funciones de autorización para ABAC. Cada política recibe `(user, resource)` y retorna `true` o `false`. Se aplican desde el middleware `authorize()` en el router.

---

### schemas/
Define los schemas de validación con Zod para cada endpoint. Se aplican en el router mediante el middleware `validate(schema)`. Garantizan que los datos de entrada sean válidos antes de llegar al controller.

---

### utils/

#### `utils/responses.js`
Centraliza todos los códigos de respuesta usados entre el service y el controller. Está organizado por dominio.

**Reglas:**
- SIEMPRE agregar nuevos códigos aquí, nunca como strings literales en el código.
- SIEMPRE agrupar los códigos bajo el dominio correspondiente (ej. `profile`, `auth`).
- El service usa estas constantes para el valor de `code` al retornar.
- El controller usa estas constantes para comparar el `code` recibido.

Estructura base:
```js
const responses = {
  profile: {
    found: 'PROFILE_FOUND',
    notFound: 'PROFILE_NOT_FOUND',
  },
  auth: {
    loginSuccess: 'LOGIN_SUCCESS',
    invalidCredentials: 'INVALID_CREDENTIALS',
    accountBlocked: 'ACCOUNT_BLOCKED',
  },
};
```

#### `utils/password.js`
Funciones para hashear y verificar contraseñas con bcrypt.

#### `utils/jwt.js`
Genera tokens JWT con el payload del usuario (id, email, role, tokenType).

#### `utils/ip.js`
Extrae la IP real del cliente desde los headers de la request.

#### `utils/logs.js`
Registra acciones de empleados en la base de datos (empleado, acción, IP).

---

## Manejo de fechas en eventos

Los eventos tienen dos modos según `all_day`:

- **`all_day: false`** → `start` y `end` deben ser strings ISO 8601 con zona horaria (`2026-06-15T09:00:00-06:00`).
- **`all_day: true`** → `start` y `end` deben ser strings en formato `YYYY-MM-DD` (`2026-06-15`).

**Convención de almacenamiento: rango `[start, end)`** (inicio inclusivo, fin exclusivo). El `end` representa el momento en que el evento deja de estar activo, no el último instante activo. Es la convención estándar de iCal/Google Calendar y permite que la detección de empalmes sea limpia.

Calendarios y eventos. (s. f.). Google For Developers. https://developers.google.com/workspace/calendar/api/concepts/events-calendars?hl=es-419

**Transformación al guardar (en el schema Zod):**

- Eventos con hora: se guardan tal cual, Prisma los convierte a UTC.
- Eventos `all_day`: el schema **suma un día al `end`** antes de guardar para respetar la convención exclusiva.

| Input del cliente | Guardado en BD |
|---|---|
| `start=15, end=15, all_day=true` | `start=15T00:00Z`, `end=16T00:00Z` (1 día) |
| `start=15, end=16, all_day=true` | `start=15T00:00Z`, `end=17T00:00Z` (2 días) |
| `start=15T09:00-06:00, end=15T11:00-06:00, all_day=false` | `start=15T15:00Z`, `end=15T17:00Z` |

**Al consultar (GET):** el backend devuelve los valores crudos de la BD junto con la bandera `all_day`. El cliente es responsable de restar un día al `end` cuando `all_day: true` para mostrar el rango inclusivo al usuario (FullCalendar lo hace automático).

**Reglas:**
- NUNCA revertir la transformación de `+1 día` en el backend al devolver eventos.
- SIEMPRE incluir `all_day` en las respuestas para que el cliente sepa cómo interpretar el `end`.