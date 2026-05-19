# **Guía Completa de Pruebas (Testing) para Backend**

¡Bienvenido a la guía de pruebas del proyecto\! Si eres nuevo o estás aprendiendo sobre testing automatizado, este documento te llevará paso a paso para entender cómo preparamos el entorno y cómo funcionan nuestras pruebas usando **Jest** y **Supertest**.

En este proyecto manejamos dos tipos de pruebas:

1. **Pruebas Unitarias:** Evalúan una función específica de forma aislada (sin tocar la base de datos real).  
2. **Pruebas de Integración:** Simulan una petición real de un usuario (como si viniera de Postman) pasando por todas las capas de la aplicación (Rutas \-\> Controladores \-\> Servicios \-\> Base de Datos de pruebas).

## **1\. Instalación y Comandos**

Para habilitar este entorno, se instalaron tres herramientas principales como dependencias de desarrollo. El comando que usamos fue:

Bash

```
npm install --save-dev jest supertest dotenv-cli
```

### **¿Para qué sirve cada herramienta?**

* **`jest`**: Es nuestro framework principal. Su trabajo es buscar los archivos que terminan en `.test.js`, ejecutarlos y decirnos si pasaron o fallaron.  
* **`supertest`**: Es una librería que simula ser un navegador web o Postman. Nos permite hacer peticiones (GET, POST) a nuestras rutas sin necesidad de encender el servidor (`app.listen`).  
* **`dotenv-cli`**: Es una utilidad mágica que nos permite inyectar variables de entorno específicas (nuestro `.env.test`) justo antes de correr un comando.

##  **2\. Configuración (El "Detrás de Escena")**

Para que todo funcione sin arruinar los datos de producción, configuramos varios archivos clave:

### **A. El archivo `package.json` (Nuestros Scripts)**

Agregamos comandos personalizados para ejecutar las pruebas fácilmente:

* `"test:unit": "jest tests/unit"`: Ejecuta **solo** las pruebas unitarias.  
* `"test:integration": "dotenv -e .env.test -- jest tests/integration"`: Aquí usamos `dotenv-cli`. Le decimos a Node: *"Carga el archivo .env.test y luego ejecuta las pruebas de integración"*.

### **B. El archivo `.env.test` (La regla de oro)**

Nunca hacemos pruebas contra la base de datos real. Por eso creamos este archivo que apunta a `postgresql://.../RCHQ-test`. Si una prueba borra todo, ¡no pasa nada, son datos falsos\!

### **C. `jest.config.js` y `jest.setup.js`**

* El **`config`** le dice a Jest que estamos en un entorno Node (`testEnvironment: 'node'`) y dónde buscar las pruebas (`testMatch`).  
* El **`setup`** se ejecuta **antes** de todas las pruebas. En nuestro caso, limpia el historial de mocks con `jest.clearAllMocks();`para que ninguna prueba herede "basura" de la anterior.

### **D. `tests/helpers/prismaTest.js`**

Este archivo contiene la función `cleanDatabase()`. Antes de cada prueba, borramos las tablas (`logs`, `employee`). Esto garantiza el principio de **Independencia de Pruebas**: un test nunca debe fallar por culpa de los datos que dejó un test anterior.

##  **3\. La Estructura de una Prueba (Patrón AAA)**

Si abres cualquier archivo de prueba, notarás que dentro del código seguimos un patrón llamado **AAA**:

1. **Arrange (Preparar):** Preparamos los datos falsos, creamos usuarios en la BD o configuramos Mocks.  
2. **Act (Actuar):** Ejecutamos la función a probar o disparamos la petición HTTP.  
3. **Assert (Afirmar/Comprobar):** Verificamos que el resultado sea el que esperábamos.

## **4\. Componentes de JEST (Pruebas Unitarias)**

Abre el archivo `tests/unit/auth.service.test.js`. Jest usa un lenguaje muy humano para estructurar las pruebas.

### **Organización: `describe` e `it`**

* **`describe("login", () => { ... })`**: Funciona como una "carpeta" lógica para agrupar todas las pruebas de la función login.  
* **`it("retorna 401 si el usuario no existe", () => { ... })`**: Es la prueba individual. Describe exactamente qué comportamiento esperamos.

### **Los Matchers: `expect()` y `.toBe()`**

Aquí es donde validamos la prueba (El paso *Assert*).

* **`expect(result.status).toBe(401);`**  
  * ¿Qué hace? Evalúa el código. Le decimos a Jest: *"Espero (expect) que el status del resultado sea exactamente igual (toBe) a 401"*. Si es 200, la prueba falla y se pone en rojo.  
* **`expect(result.body).toHaveProperty("pre2FAToken");`**  
  * ¿Qué hace? Verifica que dentro del objeto `body`, exista una llave llamada `pre2FAToken`.

### **Magia Negra para Unitarias: Los "Mocks"**

En las pruebas unitarias, **no queremos ir a la base de datos ni llamar a funciones externas complejas**. Queremos probar solo el código de nuestra función. Para eso usamos Mocks ("dobles de riesgo").

Mira esta línea en el archivo unitario:

JavaScript

```
clearExpiredLoginBlock.mockResolvedValue();
```

**¿Qué significa esto detalladamente?**

1. En la parte superior hicimos `jest.mock("../../utils/auth/authGuards");`. Esto secuestra las funciones reales de ese archivo.  
2. Al poner `.mockResolvedValue()`, le estamos diciendo a Jest: *"Cuando el código de login intente llamar a `clearExpiredLoginBlock()`, **no ejecutes la lógica real**. Simplemente finge que la función se ejecutó perfectamente y devolvió una Promesa resuelta exitosamente sin ningún valor"*.  
3. Esto nos permite simular escenarios a voluntad. Por ejemplo, con `User.findEmployeeByEmail.mockResolvedValue(null);`, forzamos a que la base de datos responda "Vacío" para probar el error 401\.

## **5\. Componentes de SUPERTEST (Pruebas de Integración)**

Abre el archivo `tests/integration/auth.integration.test.js`. Aquí la cosa cambia: sí guardamos cosas en una BD de verdad (la de pruebas) y sí simulamos red real.

Para lograrlo, importamos la librería: `const request = require("supertest");` y le pasamos nuestra `app` de Express.

### **¿Cómo leer una petición de Supertest?**

Analicemos este bloque de código:

JavaScript

```
const res = await request(app)
  .post("/users/login")
  .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
```

*   
  **`request(app)`**: Levanta un servidor virtual e invisible con todas nuestras rutas.  
* **`.post("/users/login")`**: Define el método HTTP (POST) y la ruta a la que vamos a atacar.  
* **`.send({ ... })`**: Es el equivalente a ir a la pestaña "Body" en Postman y escribir un JSON. Envía las credenciales.

### **¿Cómo probar rutas protegidas con Tokens?**

Mira la prueba de `/users/2fa/setup`. Esta ruta requiere que el usuario esté logueado. En Postman, pondrías el token en el header "Authorization". En Supertest lo hacemos con `.set()`:

JavaScript

```
const res = await request(app)
  .post("/users/2fa/setup")
  .set("Authorization", `Bearer ${token}`) // ¡Inyectamos el header!
  .send({ id: TEST_EMPLOYEE_ID });
```

*   
  **`.set("Header-Name", "Valor")`**: Agrega cabeceras HTTP a la petición. Sin esto, nuestro middleware rebotaría la petición con un error 401\.

### **Comprobación Final (Assert)**

Finalmente, en integración, combinamos Supertest con Prisma. Observa esto:

JavaScript

```
// Validamos la respuesta HTTP
expect(res.statusCode).toBe(200); 

// Consultamos la BD real para ver si el cambio sucedió de verdad
const emp = await prisma.employee.findUnique({ where: { employee_id: TEST_EMPLOYEE_ID } });
expect(emp.temp_totp_secret).not.toBeNull();
```

Aquí le pedimos a Prisma que vaya a la base de datos y verifique si el "secreto temporal" del 2FA efectivamente se guardó. Al usar `.not.toBeNull()`, la prueba pasará siempre y cuando la base de datos no tenga un valor "null" en ese campo.

