### **1\. Las Importaciones (Preparando las herramientas)**

Antes de hacer cualquier prueba, necesitamos traer las herramientas que nos ayudarán a simular la base de datos y las peticiones HTTP.

JavaScript

```
const request = require("supertest"); // 1
const { PrismaClient } = require("@prisma/client"); // 2
const bcrypt = require("bcryptjs"); // 3
const { randomUUID } = require("crypto"); // 4
const app = require("../../app"); // 5

const prisma = new PrismaClient(); // 6
```

1. **supertest**: Es nuestra herramienta principal. Nos permite hacer peticiones web (como GET o POST) a nuestro código sin tener que arrancar el servidor real.  
2. **PrismaClient**: Nos permite conectarnos a nuestra base de datos de pruebas para insertar datos falsos y comprobar si los cambios se guardaron.  
3. **bcryptjs**: Lo usamos para encriptar la contraseña de prueba antes de guardarla en la base de datos (igual que lo hace la app real).  
4. **randomUUID**: Una función nativa de Node para generar IDs únicos (como 123e4567-e89b-12d3...).  
5. **app**: ¡Importante\! Importamos toda nuestra aplicación de Express. Supertest usará esto para saber qué rutas existen.  
6. **prisma**: Instanciamos la conexión a la base de datos.

### **2\. Constantes de Prueba (Datos predecibles)**

JavaScript

```
const TEST_HOUSE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
// ... otros constantes ...
const TEST_PASSWORD = "TestPass123";
```

**¿Por qué hacemos esto?** En lugar de inventar un correo o una contraseña diferente en cada test, definimos estos valores arriba. Si alguna vez necesitamos cambiar la contraseña de prueba, solo lo hacemos aquí y todos los tests se actualizan. Usamos randomUUID() para asegurar que los IDs no choquen con registros viejos.

### **3\. Los Helpers (Ayudantes para no repetir código)**

El bloque de "Arrange" (Preparar) suele llevar mucho código. Estos helpers nos ahorran escribir lo mismo 50 veces.

#### **A. seedDependencies**

JavaScript

```
const seedDependencies = async () => {
  await prisma.house.upsert({ ... });
  await prisma.role.upsert({ ... });
};
```

Tu tabla de Empleados seguramente tiene *Llaves Foráneas* (Foreign Keys) que obligan a que el empleado pertenezca a una Casa (house\_id) y a un Rol (role\_id). Este helper crea una Casa y un Rol genéricos en la base de datos para que Prisma nos deje crear empleados después sin lanzar errores.

#### **B. createTestEmployee**

JavaScript

```
const createTestEmployee = async (overrides = {}) => {
  const hashedPwd = await bcrypt.hash(TEST_PASSWORD, 10); // 1
  return prisma.employee.create({ // 2
    data: {
      employee_id: TEST_EMPLOYEE_ID,
      // ... datos genéricos ...
      ...overrides, // 3
    },
  });
};
```

1.   
   Encriptamos la contraseña "TestPass123" usando bcrypt.  
2. Usamos Prisma para guardar a este usuario en la base de datos.  
3. **...overrides**: Esta es una técnica avanzada muy útil. Nos permite crear un usuario normal, pero si en un test específico queremos que el usuario esté bloqueado, podemos llamarlo así: createTestEmployee({ is\_active: false }) y sobreescribirá ese dato específico.

#### **C. generateSessionToken**

JavaScript

```
const generateSessionToken = () => {
  const jwt = require("jsonwebtoken");
  return jwt.sign({ id: TEST_EMPLOYEE_ID, /*...*/ }, process.env.JWT_SECRET);
};
```

Para probar rutas protegidas (como activar el 2FA), necesitamos un Token. En lugar de hacer una petición de login antes de cada prueba para conseguir el token, lo "falsificamos" aquí usando la misma llave secreta (JWT\_SECRET) que usa la aplicación.

#### **D. cleanDb**

JavaScript

```
const cleanDb = async () => {
  await prisma.logs.deleteMany();
  await prisma.employee.deleteMany({ where: { email: TEST_EMAIL } });
};
```

Borra todo el rastro de nuestro usuario de prueba.

### **4\. El Ciclo de Vida (Hooks)**

Aquí es donde controlamos el entorno para asegurar que cada prueba sea un terreno limpio.

JavaScript

```
beforeAll(async () => {
  await cleanDb(); // Limpiamos basurita de sesiones anteriores
  await seedDependencies(); // Creamos la Casa y el Rol (solo se hace una vez)
});

afterEach(async () => {
  await cleanDb(); // DESPUÉS de cada test, borramos al usuario. Así el siguiente test empieza desde cero.
});

afterAll(async () => {
  // Cuando terminan todos los tests, borramos la Casa, el Rol y cerramos la conexión a la base de datos.
  await prisma.role.deleteMany({ where: { role_id: TEST_ROLE_ID } });
  // ...
  await prisma.$disconnect();
});
```

### **5\. Las Pruebas (Anatomía de un it)**

Vamos a analizar una de las pruebas de integración más complejas para que veas cómo se unen los Helpers y Supertest.

#### **Ejemplo: Bloqueo de cuenta tras 3 intentos fallidos**

JavaScript

```
it("bloquea la cuenta en BD después de 3 intentos fallidos", async () => {
  
  // 1. ARRANGE (Preparar)
  // Usamos nuestro helper para meter un empleado fresco en la base de datos
  await createTestEmployee(); 

  // 2. ACT (Actuar)
  // Usamos Supertest (request(app)) para simular que alguien desde el frontend 
  // intenta iniciar sesión 3 veces con una contraseña equivocada ("wrong").
  await request(app).post("/users/login").send({ email: TEST_EMAIL, password: "wrong" });
  await request(app).post("/users/login").send({ email: TEST_EMAIL, password: "wrong" });
  await request(app).post("/users/login").send({ email: TEST_EMAIL, password: "wrong" });
  
  // 3. ASSERT (Comprobar)
  // Le decimos a Prisma: "Ve a la base de datos y tráeme a este empleado"
  const emp = await prisma.employee.findUnique({
    where: { employee_id: TEST_EMPLOYEE_ID },
  });

  // Usamos Jest para evaluar el resultado.
  // Esperamos (expect) que el campo 'blocked_until' del empleado NO SEA NULO (not.toBeNull).
  // Si no es nulo, significa que la app hizo su trabajo y guardó una fecha de bloqueo en la BD.
  expect(emp.blocked_until).not.toBeNull();
});
```

#### **Ejemplo 2: Probar una ruta protegida (Setup 2FA)**

Mira cómo esta prueba usa el Token y los Headers.

JavaScript

```
it("guarda temp_totp_secret en BD y retorna QR", async () => {
  // ARRANGE
  await createTestEmployee();
  const token = generateSessionToken(); // Generamos un token válido para este usuario

  // ACT
  const res = await request(app) // Hacemos la petición...
    .post("/users/2fa/setup") // ... a la ruta de setup...
    .set("Authorization", `Bearer ${token}`) // ... INYECTANDO EL TOKEN EN LOS HEADERS...
    .send({ id: TEST_EMPLOYEE_ID }); // ... mandando el body.

  // ASSERT
  // Verificamos que la respuesta HTTP haya sido exitosa (200 OK)
  expect(res.statusCode).toBe(200);
  // Verificamos que la respuesta (res.body) tenga un atributo llamado "qrImage"
  expect(res.body.data).toHaveProperty("qrImage");
  
  // Verificación en BD: Vamos a la base de datos y nos aseguramos de que
  // el servidor realmente guardó el secreto temporal.
  const emp = await prisma.employee.findUnique({ where: { employee_id: TEST_EMPLOYEE_ID } });
  expect(emp.temp_totp_secret).not.toBeNull();
});
```

### **Resumen de tu código**

Tu archivo está magistralmente estructurado. Utiliza buenas prácticas de testing de integración:

1. Aisla la base de datos de pruebas.  
2. Limpia los datos entre cada test (afterEach).  
3. No solo prueba lo que responde el servidor (Status 200 o 400), sino que hace una **doble verificación**, yendo a buscar a la base de datos con Prisma para confirmar que los cambios persistieron de forma correcta.