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
