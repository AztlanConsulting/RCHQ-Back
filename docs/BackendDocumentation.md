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
Verifica que el usuario tenga un rol específico antes de continuar. Se usa con `requireRole("Administrador")` directamente en el router.

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

#### Reporte PDF de logs
El backend permite generar un reporte PDF con los logs de la casa del coordinador.

**Flujo general:**
- La ruta `GET /logs/house/report/pdf` recibe la petición autenticada.
- El controller obtiene la `houseId` del usuario autenticado.
- El service consulta:
  - los logs de la casa
  - el nombre de la casa
  - los empleados afectados necesarios para mapear nombres legibles
- Después construye el PDF y lo devuelve como archivo descargable.

**Archivos involucrados:**
- `src/router/logs.route.js` → define la ruta del reporte.
- `src/controller/logs/get.controller.js` → prepara la respuesta HTTP con `Content-Type: application/pdf`.
- `src/service/logs/get.service.js` → orquesta la consulta de datos y la generación del PDF.
- `src/utils/logsPdf.js` → arma el documento PDF.

**Contenido del PDF:**
- Título del reporte.
- Nombre de la casa.
- Fecha de generación.
- Lista de logs con información legible para el usuario.

**Notas de implementación:**
- El PDF usa los logs ya mapeados, no los registros crudos de la base de datos.
- El nombre de la casa se obtiene desde el modelo de `house`.
- El archivo se devuelve como descarga, no como JSON.

#### Retención de logs
La limpieza automática de logs se divide en dos archivos:

- `src/utils/logRetention.js` → contiene la lógica de retención.
- `src/utils/logRetentionJob.js` → programa la ejecución periódica con `node-cron`.

**Regla actual de borrado:**
- Un log se elimina si su campo `moment` es anterior a la fecha actual menos 5 años.
- Un log **NO** se elimina si la acción relacionada tiene `important = true`.

En otras palabras:
- viejo + no importante → se borra
- viejo + importante → se conserva
- reciente + no importante → se conserva

**Ejecución programada:**
- El job corre todos los días a la `1:00 AM`.
- La expresión cron actual es:

```js
"0 1 * * *"
```

**Notas de implementación:**
- La retención se calcula restando 5 años a la fecha actual.
- El borrado se hace con Prisma sobre `logs`, filtrando también por la relación `action.important = false`.
- El job no borra al iniciar el servidor; solo cuando llega la siguiente ejecución programada.

**Prueba manual recomendada:**
1. Insertar un log con una fecha de hace más de 5 años y una acción no importante.
2. Ejecutar manualmente `deleteExpiredLogs()` o cambiar temporalmente el cron para probar más rápido.
3. Verificar en la BD que el log haya sido eliminado.

Ejemplo para ejecutar la limpieza manualmente:

```bash
node -e "const { deleteExpiredLogs } = require('./src/utils/logRetention'); deleteExpiredLogs().then(console.log).catch(console.error)"
```

Para pruebas rápidas, se puede cambiar temporalmente la expresión cron a cada 5 segundos:

```js
"*/5 * * * * *"
```

Después de probar, debe regresarse a:

```js
"0 1 * * *"
```

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

---

## Autenticación y Manejo de Sesión (Refresh Token)

El backend utiliza un sistema de doble token para mantener la seguridad y la persistencia de la sesión:
1. **Access Token (`SESSION`)**: De corta duración (1h). Se devuelve en el cuerpo JSON de la respuesta y debe ser enviado en el header `Authorization: Bearer <token>` para rutas protegidas.
2. **Refresh Token (`REFRESH`)**: De larga duración (1 día). **No es accesible vía JavaScript**. El servidor lo envía e invalida exclusivamente a través de la cabecera HTTP `Set-Cookie` (`HttpOnly`, `Secure`, `SameSite=Strict`).

### Endpoints que emiten Refresh Tokens
Los siguientes endpoints devolverán en sus cabeceras un `Set-Cookie: refreshToken=...`:
- `POST /auth/login` (Si no requiere 2FA ni cambio de contraseña)
- `POST /auth/first-login/change-password`
- `POST /auth/2fa/validate`

### `POST /auth/refresh`
**Descripción:** Renueva el `accessToken` y rota el `refreshToken` cuando la sesión está por expirar.
**Requisitos:** La petición HTTP debe incluir credenciales para que el navegador adjunte automáticamente la cookie `refreshToken`.

**Respuestas:**
- **200 OK**: Sesión renovada con éxito.
  - **Headers:** Emite un nuevo `Set-Cookie: refreshToken=...`
  - **Body:**
    ```json
    {
      "success": true,
      "code": "REFRESH_SUCCESS",
      "message": "Sesión actualizada",
      "data": {
        "token": "eyJhbGciOiJIUzI1NiIs..."
      }
    }
    ```
- **401 Unauthorized / 403 Forbidden**: Token expirado, inválido, no proporcionado o detectado como reutilizado (robo de sesión).
  - **Headers:** Emite un `Set-Cookie: refreshToken=; Max-Age=0` (Destruye la cookie).
  - **Body:** `{ "success": false, "code": "INVALID_REFRESH_TOKEN", ... }`

### `POST /auth/logout`
**Descripción:** Cierra la sesión activa, invalidando el token en la base de datos y limpiando la cookie del navegador.
**Requisitos:** Debe enviar las credenciales (cookies).

**Respuestas:**
- **200 OK**: Sesión cerrada.
  - **Headers:** Emite un `Set-Cookie: refreshToken=; Max-Age=0` (Destruye la cookie).
  - **Body:**
    ```json
    {
      "success": true,
      "code": "LOGOUT_SUCCESS",
      "message": "Sesión cerrada"
    }
    ```
*(Nota: Este endpoint siempre retorna 200, incluso si no se envió cookie, para asegurar la limpieza del estado en el cliente).*

---

## Rate Limiting (Control de Peticiones)

Para proteger el sistema contra ataques de denegación de servicio (DoS) y fuerza bruta, la API implementa limitadores de peticiones.

Existen dos tipos de limitadores configurados:

### 1. `apiLimiter` (Rutas Generales)
- **Límite:** 100 peticiones por minuto.
- **Identificador (Tracking):** Rastrea por el ID del usuario (`decoded.id` o `decoded.employeeId` del JWT). Si la petición es anónima (sin token), rastrea por la dirección IP.
- **Uso:** En la gran mayoría de las rutas protegidas y endpoints generales de datos.

### 2. `authLimiter` (Rutas Críticas de Autenticación)
- **Límite:** 5 peticiones cada 10 minutos.
- **Identificador (Tracking):** Rastrea primero por el email (`req.body.email`), si no lo hay por el ID del token, y en último caso por IP.
- **Uso:** En endpoints donde se envían credenciales sensibles (ej. `/auth/login`, `/auth/change-password`, `/auth/2fa/validate`).

### Respuesta HTTP (Manejo en el Cliente)
Cuando un usuario o IP excede cualquiera de los dos límites, la API bloquea automáticamente la petición y devuelve la siguiente estructura:

- **Status HTTP:** `429 Too Many Requests`
- **Body (JSON):**
  ```json
  {
    "success": false,
    "message": "Estás haciendo demasiadas consultas muy rápido. Inténtalo más tarde."
  }
  ```
- **Headers de Respuesta:** El servidor devuelve cabeceras estándar de Rate Limit útiles para el frontend:
  - `RateLimit-Limit`: El límite total de peticiones permitidas en la ventana actual.
  - `RateLimit-Remaining`: Peticiones restantes antes de ser bloqueado.
  - `RateLimit-Reset`: Tiempo (en segundos) que falta para que el límite se reinicie.

**Nota para Frontends:**
Cualquier cliente o sistema que consuma la API debe estar preparado para interceptar el código HTTP `429`. Se recomienda leer el campo `message` y mostrar un Toast o Alerta para notificar al usuario que debe esperar.
