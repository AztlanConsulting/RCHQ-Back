# **Guía Profunda: Pruebas Unitarias en Node.js (Jest)**

¡Bienvenido a las Pruebas Unitarias\! A diferencia de las pruebas de integración (donde usamos Supertest para simular peticiones HTTP y guardar datos reales en una base de datos), aquí vamos a hacer algo muy distinto: **Aislar el código.**

En este archivo (auth.service.test.js) estamos probando **únicamente** la lógica de tu negocio (los if, los else, los cálculos). Para lograrlo, le vamos a "mentir" a nuestro código haciéndole creer que la base de datos y las librerías externas están ahí, cuando en realidad las vamos a reemplazar por dobles de acción llamados **Mocks**.

## **1\. Importaciones y Mocks (Preparando el Engaño)**

Vamos a leer las primeras líneas del archivo:

**JavaScript**

```
const {
  login,
  setupTwoFactorAuth,
  // ...
} = require("../../service/auth.service");
```

**Qué hace:** Importa las funciones **reales** que tú escribiste. Estas son las únicas piezas de código de toda tu aplicación que realmente se van a ejecutar aquí.

**JavaScript**

```
jest.mock("../../model/user.model");
jest.mock("../../utils/password");
jest.mock("speakeasy");
```

*   
  **Qué hace:** Aquí empieza la magia. jest.mock() toma la ruta de un archivo o librería y **lo vacía en memoria**.  
* **El caso del User Model:** Cuando tu código real de login intente usar User.findEmployeeByEmail, en lugar de ir a la base de datos PostgreSQL, Jest intercepta la llamada. Jest creó un clon falso (Mock) de tu modelo. Este clon tiene todas las funciones, pero están vacías. Esto nos permite a nosotros (los programadores) dictar exactamente qué va a responder la base de datos en cada prueba, sin tener que insertar datos reales.

## **2\. Funciones Auxiliares y Fixtures (Preparando a los Actores)**

En lugar de escribir la misma información cien veces, creamos plantillas (Fixtures) y funciones de ayuda (Helpers).

JavaScript

```
const mockEmployee = {
  employeeId: "abc-123",
  email: "test@gmail.com",
  isActive: true,
  isActive2FA: false,
  // ...
};
```

**Qué hace:** Define al "Empleado Perfecto". En casi todas las pruebas, vamos a decirle al Mock de la base de datos: *"Cuando te busquen, responde con este objeto"*.

JavaScript

```
const makeReq = (body = {}, user = null) => ({
  body,
  ip: "127.0.0.1",
  headers: {},
  user,
});
```

**Qué hace:** Tus funciones reales esperan recibir un objeto req gigante que normalmente viene de Express. Esta pequeña función fabrica un req falso con lo mínimo necesario para que tu código no colapse cuando intente leer req.body o req.user.

## **3\. El beforeEach (Limpiando el Escenario)**

El bloque beforeEach se ejecuta **antes de que empiece CADA una de las pruebas**. Su trabajo es dejar el escenario impecable para que una prueba no contamine a la siguiente.

JavaScript

```
beforeEach(() => {
  jest.clearAllMocks();
  getClientIp.mockReturnValue("127.0.0.1");
  clearExpiredLoginBlock.mockResolvedValue();
});
```

*   
  **jest.clearAllMocks()**: Borra el historial de llamadas de los clones. Si en la prueba 1 fingimos que la base de datos dio un error, esta línea borra ese error para la prueba 2\.  
* **clearExpiredLoginBlock.mockResolvedValue()**: Tu código real usa esta función para revisar si ya pasó el tiempo de castigo de un usuario bloqueado. Si no la falseamos, el código intentaría comparar fechas reales. Al ponerle .mockResolvedValue(), le decimos al clon: *"Oye, cuando te llamen, finge que hiciste tu trabajo, que todo salió bien (Resolved) y no devuelvas nada"*. Así, tu código pasa de largo sin preocuparse por los tiempos de bloqueo.

  ## **4\. Diseccionando un Test Fácil (Línea por Línea)**

Vamos a analizar un test básico para entender el patrón **AAA (Arrange, Act, Assert)** y los componentes de Jest.

JavaScript

```
describe("login", () => {
  it("retorna 401 si el usuario no existe", async () => {
    
    // --- ARRANGE (PREPARAR) ---
    User.findEmployeeByEmail.mockResolvedValue(null);

    // --- ACT (ACTUAR) ---
    const result = await login(makeReq({ email: "no@existe.com", password: "pass" }));

    // --- ASSERT (AFIRMAR) ---
    expect(result.status).toBe(401);
    expect(result.body.code).toBe("INVALID_CREDENTIALS");
  });
});
```

**Explicación Línea por Línea:**

1. it(...): Define el inicio de la prueba y explica en español qué debe suceder.  
2. User.findEmployeeByEmail.mockResolvedValue(null);: Manipulamos nuestro Mock de la base de datos. Le damos la orden: *"En esta prueba específica, si alguien te busca, responde con null (como si la tabla estuviera vacía)"*.  
3. const result \= await login(...): Ejecutamos tu función real de login. Le inyectamos nuestra petición falsa creada con makeReq. Tu código entrará, llamará a la BD (que responderá null), y tu if (\!employee) se activará, devolviendo un error 401\. El resultado se guarda en result.  
4. expect(result.status): **expect** es el componente de Jest que dice "Yo espero que este valor...". En este caso, el status HTTP del resultado.  
5. .toBe(401);: **toBe** es un *Matcher*. Compara de forma exacta. La frase completa se lee: *"Espero que el status del resultado sea exactamente 401"*. Si tu código devolvió 200, la prueba estalla en rojo.

   ## **5\. Diseccionando un Test Difícil (Línea por Línea)**

Ahora vamos con el "Jefe Final". Este test prueba si un código de Google Authenticator es válido. Involucra simular transacciones de Prisma y librerías de terceros (Speakeasy).

JavaScript

```
it("activa 2FA correctamente cuando el token es válido", async () => {
  
  // --- ARRANGE (PREPARAR) ---
  const createdAt = new Date();
  
  const prisma = require("../../prisma");
  const mockUpdate = jest.fn().mockResolvedValue({});
  const mockFindUnique = jest.fn().mockResolvedValue({ temp_totp_secret: "SECRETBASE32" });
  
  prisma.$transaction.mockImplementation((cb) =>
    cb({ employee: { update: mockUpdate, findUnique: mockFindUnique } })
  );
```

**Líneas de Prisma:** Dado que no tenemos base de datos, tu prisma.$transaction explotaría. Aquí estamos "enseñándole" a nuestro clon cómo comportarse. Le decimos: *"Cuando ejecutes la transacción, inyéctale este objeto que contiene funciones falsas de update y findUnique"*.

JavaScript

```
  User.getEmployeeById.mockResolvedValue({
    ...mockEmployee,
    tempTotpSecret: "SECRETBASE32",
    tempTotpSecretCreatedAt: createdAt,
  });
```

**Líneas del Empleado:** Le ordenamos a la base de datos clonada que nos devuelva al "Empleado Perfecto" (...mockEmployee), pero le **agregamos** un secreto de 2FA temporal y una fecha de creación recién horneada para que tu código no lo rechace por expirado.

JavaScript

```
  speakeasy.totp = { verify: jest.fn().mockReturnValue(true) };
```

**Línea de Speakeasy:** Esta es brillante. Tu código real usa speakeasy.totp.verify() para validar el código de 6 dígitos. Si le pasamos un código inventado ("123456"), Speakeasy diría que es inválido. ¡Así que también clonamos a Speakeasy\! Le ordenamos: *"No importa qué código te manden, tú siempre responde true (válido)"*.

JavaScript

```
  // --- ACT (ACTUAR) ---
  const result = await verifyTwoFactorSetup(makeReq({ token: "123456" }, { id: "abc-123" }));
```

**Ejecución:** Llamamos a tu función real pasándole un token de mentira. Tu función buscará al usuario (y obtendrá al usuario perfecto), validará el código (y Speakeasy dirá que sí), ejecutará la transacción en Prisma (que fingirá guardarlo todo sin error).

JavaScript

```
  // --- ASSERT (AFIRMAR) ---
  expect(result.status).toBe(200);
  expect(result.body.nextStep).toBe("2FA_SETUP_COMPLETE");
});
```

**Validación Final:** Ya que falseamos todos los "obstáculos" (BD correcta, tiempo correcto, Speakeasy correcto), comprobamos que tu función haya llegado felizmente al final de su código y haya retornado un Status 200 y el mensaje de éxito correcto.

### **Resumen Visual de Conceptos**

* **expect(x)**: "Prepara este valor para compararlo".  
* **.toBe(y)**: "...compara si es estrictamente igual a Y".  
* **.toHaveProperty(z)**: "...comprueba si este objeto tiene la propiedad Z".  
* **Mocks**: Dobles de riesgo. Reemplazos vacíos de piezas pesadas (BD, librerías) que nosotros controlamos para forzar caminos en nuestro código.

## **6\. Mocks de Librerías Externas (speakeasy, crypto, bcrypt)**

Al principio del archivo de pruebas viste líneas como esta:

JavaScript

```
jest.mock("speakeasy");
jest.mock("qrcode");
jest.mock("../../utils/password"); // Que por dentro usa bcrypt o crypto
```

### **¿Qué es un Mock de una Librería?**

Imagina que estás escribiendo el guion de una película (tu código). En una escena, el protagonista tiene que llamar por teléfono a un experto en explosivos (la librería externa) para saber si cortar el cable rojo o el azul.

En el set de grabación (las pruebas unitarias), **no llamas a un experto en explosivos de verdad**. Simplemente pones a un actor de doblaje (el Mock) al otro lado del teléfono y le dices: *"En esta toma, quiero que le digas que corte el rojo. En la siguiente toma, dile que corte el azul"*.

Eso es exactamente lo que hacemos con jest.mock(). Le decimos a Node.js: *"No traigas el código real descargado de NPM, dame un cascarón vacío que yo pueda controlar"*.

### **Caso de Estudio 1: Speakeasy (Google Authenticator / 2FA)**

Speakeasy es la librería que valida los códigos de 6 dígitos. Funciona con **TOTP** (Time-Based One-Time Password), lo que significa que el código cambia cada 30 segundos dependiendo de la hora exacta del servidor.

**¿Por qué NUNCA debemos usar el Speakeasy real en pruebas unitarias?**

1. **La trampa del tiempo:** Si tu prueba tarda un milisegundo de más en ejecutarse y el reloj cambia de minuto, el código que generaste al principio de la prueba ya no será válido. Tu prueba fallará de forma aleatoria (a esto se le llama un *Flaky Test*).  
2. **Es imposible adivinar:** No podemos saber qué código de 6 dígitos será válido en el futuro para escribirlo en nuestro expect.

**La Solución (El Mock):**

Al poner jest.mock("speakeasy"), desactivamos el reloj y las matemáticas complejas. Ahora nosotros somos los dioses del tiempo.

En la prueba de "token inválido", escribimos esto:

JavaScript

```
speakeasy.totp = { verify: jest.fn().mockReturnValue(false) };
```

Le estamos diciendo a nuestro actor de doblaje: *"Cuando el servicio te pregunte si el código '000000' es válido, no hagas ningún cálculo matemático. Solo míralo a los ojos y dile **FALSO**"*.

En la prueba de "token válido", escribimos esto:

JavaScript

```
speakeasy.totp = { verify: jest.fn().mockReturnValue(true) };
```

Aquí le decimos: *"Cuando te pase el código, dile **VERDADERO**, sin importar qué números haya escrito"*.

De esta forma, evaluamos **cómo reacciona NUESTRO código** (auth.service.js) ante una respuesta positiva o negativa, sin preocuparnos por los cálculos de Google Authenticator.

### **Caso de Estudio 2: crypto y bcrypt (Contraseñas y UUIDs)**

Tu aplicación usa encriptación para guardar contraseñas y generar IDs únicos.

**¿Por qué hacerles Mock?**

1. **Velocidad (El problema de bcrypt):** Encriptar una contraseña de forma segura toma tiempo de CPU a propósito (unos 100 o 200 milisegundos). Si tienes 500 pruebas que validan contraseñas reales, tus pruebas tardarán minutos en correr. Los Mocks responden en **0 milisegundos**.  
2. **Aleatoriedad (El problema de crypto/UUID):** Si una función tuya genera un UUID (ej. 123e4567-e89b...), no puedes hacer un expect(resultado.id).toBe("???") porque el ID será distinto cada vez que corras la prueba.

**La Solución (El Mock):**

En tu archivo, interceptaste la validación de contraseñas con:

JavaScript

```
jest.mock("../../utils/password");
```

Y luego, en las pruebas, tomaste el control absoluto:

JavaScript

```
// Prueba: Usuario se equivoca de contraseña
verifyPassword.mockResolvedValue(false);

// Prueba: Usuario pone la contraseña correcta
verifyPassword.mockResolvedValue(true);
```

### **Resumen: ¿Cuándo debo hacer mock de una librería?**

Como regla de oro para cualquier Junior, debes hacer Mock de una librería de NPM si:

1. Hace peticiones a **Internet** (ej. axios, fetch, librerías para enviar correos como mailgun.js).  
2. Toca la **Base de datos o el Disco Duro** (ej. Prisma, fs).  
3. Genera cosas **aleatorias o dependientes del tiempo** (ej. crypto, uuid, speakeasy, Date.now()).  
4. Es un algoritmo **pesado** que hace lenta la prueba (ej. bcrypt, manipulación de imágenes).

