# RCHQ-Back

Backend de Tochan/RCHQ. Esta aplicación implementa la API REST, la lógica de negocio, la conexión con base de datos, autenticación, gestión de personal, calendario, vacaciones, documentos, envío de correos y servicios necesarios para que el frontend pueda consumir la información del sistema.

## Tecnologías

| Tecnología | Versión usada en el proyecto | Uso |
| ---------- | ---------------------------- | --- |
| Node.js | 20.19 | Entorno de ejecución para correr el backend y herramientas del proyecto. |
| Express | 5.2.1 | Framework del backend para crear la API REST, manejar rutas, middlewares y respuestas HTTP. |
| PostgreSQL | 17 | Sistema de gestión de base de datos relacional utilizado para persistir la información del sistema. |
| Prisma | 6.19.3 | ORM usado para modelar la base de datos, generar el cliente y ejecutar la conexión con PostgreSQL. |
| Jest | 30.3.0 | Framework de pruebas utilizado para pruebas unitarias e integración del backend. |
| Supertest | 7.2.2 | Librería utilizada para probar endpoints HTTP simulando peticiones a la API. |
| Zod | 4.3.6 | Validación de esquemas y estructuras de datos en tiempo de ejecución. |
| GitHub | N/A | Plataforma de control de versiones y colaboración donde se aloja el repositorio. |
| VPS / Hostinger | N/A | Servidor privado virtual utilizado para alojar y desplegar la aplicación en un entorno remoto. |
| Mailgun | N/A | Servicio externo utilizado para el envío de correos desde el backend. |

## Requisitos previos

Antes de instalar el proyecto, asegúrate de contar con:

- Git.
- Node.js 20.19 o compatible.
- npm.
- PostgreSQL 17 o compatible.
- DBeaver o algún administrador de base de datos PostgreSQL.
- Editor recomendado: Visual Studio Code.
- Acceso a las credenciales necesarias para configurar Mailgun.
- Acceso al repositorio `RCHQ-Back`.

## Estructura del proyecto

```text
/RCHQ-Back
├── .github/
├── data/
│   ├── seed/
│   └── rchq_db.sql
├── diagrams/
├── docs/
├── node_modules/
├── prisma/
│   └── schema.prisma
├── scripts/
├── src/
│   ├── controller/
│   ├── middleware/
│   ├── model/
│   ├── policies/
│   ├── router/
│   ├── schemas/
│   ├── service/
│   ├── tests/
│   ├── uploads/
│   ├── utils/
│   ├── index.js
│   └── prisma.js
├── uploads/
│   └── documents/
├── .env
├── .env.example
├── .env.test
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

## Arquitectura del backend

El backend se encarga de manejar la lógica de negocio, la persistencia de datos y la exposición de servicios mediante una API REST.

La arquitectura sigue una organización basada en Modelo, Controlador y Servicio:

- `controller/`: recibe las peticiones HTTP, maneja respuestas y estatus HTTP.
- `service/`: contiene la lógica de negocio de la aplicación.
- `model/`: representa la estructura y acceso a los datos.
- `router/`: define las rutas disponibles de la API.
- `middleware/`: contiene funciones intermedias para validación, autenticación, seguridad u otras tareas previas al controlador.
- `schemas/`: define esquemas de validación, principalmente con Zod.
- `policies/`: contiene reglas o políticas de acceso y comportamiento.
- `utils/`: agrupa funciones auxiliares reutilizables.
- `tests/`: contiene pruebas unitarias e integración.
- `uploads/`: almacena archivos subidos o procesados por el backend.
- `prisma/`: contiene la configuración del esquema de Prisma.
- `data/`: contiene archivos relacionados con la base de datos, incluyendo el script SQL inicial.

## Módulos principales

| Módulo | Descripción |
| ------ | ----------- |
| Autenticación | Inicio de sesión, generación de JWT, control de acceso y seguridad. |
| Personal | Gestión de empleados y sus datos. |
| Calendario | Gestión de eventos, ausencias y vacaciones. |
| Documentos | Administración de archivos y documentos. |
| Base de datos | Persistencia de información mediante PostgreSQL y Prisma. |
| Correo | Envío de correos mediante Mailgun. |
| Pruebas | Validación del backend mediante Jest y Supertest. |

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/AztlanConsulting/RCHQ-Back.git
cd RCHQ-Back
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y renómbralo como `.env`:

```bash
cp .env.example .env
```

Configura las variables necesarias:

| Variable | Descripción | Ejemplo |
| -------- | ----------- | ------- |
| `RUNNING_PORT` | Puerto donde escucha el backend. | `3000` |
| `DATABASE_URL` | Cadena de conexión con la base de datos PostgreSQL. | `postgresql://user:pass@localhost:5432/databasename` |
| `ENCRYPTION_KEY` | Clave para encriptar datos sensibles. Se puede generar con `openssl rand -hex 32` o `openssl rand -base64 32`. | `[********]` |
| `JWT_SECRET` | Clave secreta para generar y validar JSON Web Tokens. | `SECRET` |
| `MAILGUN_KEY` | API Key de Mailgun para el envío de correos. | `API_KEY_MAILGUN_EJEMPLO` |
| `LOG_IP_HASH_SECRET` | Clave secreta utilizada para proteger o hashear información relacionada con IPs en logs. | `SECRET` |

Ejemplo de `.env`:

```env
RUNNING_PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/rchq_db
ENCRYPTION_KEY=clave_generada_con_openssl
JWT_SECRET=SECRET
MAILGUN_KEY=API_KEY_MAILGUN_EJEMPLO
LOG_IP_HASH_SECRET=SECRET
```

## Configuración de base de datos

### 1. Crear la base de datos

Abre una terminal de PostgreSQL:

```bash
psql -U postgres
```

Crea la base de datos:

```sql
CREATE DATABASE DB_NAME;
```

Ejemplo:

```sql
CREATE DATABASE tochan;
```

### 2. Poblar información inicial desde terminal

El proyecto incluye un archivo SQL para poblar la base de datos:

```bash
psql -U [usuario] -d [nombre_de_la_base_de_datos] -f [ruta_al_archivo.sql]
```

Ejemplo:

```bash
psql -U postgres -d tochan -f data/rchq_db.sql
```

### 3. Conectar la base de datos con DBeaver

1. Abre DBeaver.
2. Haz clic en el icono de nueva conexión.
3. Selecciona el driver de PostgreSQL.
4. Configura los datos de conexión:

| Campo | Valor |
| ----- | ----- |
| Host | `localhost` |
| Puerto | `5432` |
| Database | Nombre de la base de datos configurada en el `.env` |
| Username | Usuario de PostgreSQL, comúnmente `postgres` |
| Password | Contraseña del usuario de PostgreSQL |

5. Haz clic en `Test Connection`.
6. Si la conexión es exitosa, presiona `Finish`.
7. Verifica las tablas en `Schemas > public > Tables`.

### 4. Poblar la base de datos desde DBeaver

Si no se pobló la base de datos desde terminal:

1. Abre un SQL Script en DBeaver.
2. Verifica que el datasource activo sea la base de datos correcta.
3. Abre el archivo ubicado en:

```text
data/rchq_db.sql
```

4. Copia o carga el contenido del script SQL.
5. Ejecuta el script.
6. Verifica que no existan errores al finalizar.

## Configuración de Prisma

Después de configurar la base de datos y las variables de entorno, genera el cliente de Prisma:

```bash
npx prisma generate
```

Este comando permite que el backend pueda utilizar el cliente de Prisma para interactuar con la base de datos definida en `schema.prisma`.

## Configuración de Mailgun

El backend utiliza Mailgun como servicio externo para el envío de correos.

### 1. Obtener la API Key

1. Accede a Mailgun.
2. Inicia sesión con las credenciales de la organización.
3. En el menú lateral, ve a `API Keys`, dentro de `Settings` o `Security`.
4. Busca la opción `Private API Key`.
5. Haz clic en el icono del ojo para visualizarla.
6. Copia la API Key.

### 2. Configurar la API Key en el proyecto

Pega la clave en el archivo `.env`:

```env
MAILGUN_KEY=API_KEY_MAILGUN_EJEMPLO
```

### 3. Configurar dominio Sandbox

Si se utiliza una cuenta de prueba o Sandbox:

1. En el panel de Mailgun, busca la sección `Authorized Recipients`.
2. Agrega el correo personal o institucional al que se enviarán mensajes.
3. Confirma la autorización del correo si Mailgun lo solicita.

> Nota: si el correo no está autorizado en una cuenta Sandbox, Mailgun puede bloquear el envío por seguridad.

## Ejecución del backend

Para ejecutar el backend en desarrollo:

```bash
npm run start
```

El backend escuchará en el puerto configurado en la variable:

```env
RUNNING_PORT=3000
```

Por defecto, si se usa el ejemplo anterior, la API estará disponible en:

```text
http://localhost:3000
```

## Ambiente de pruebas

El backend cuenta con un archivo `.env.test` para ejecutar pruebas sin afectar la base de datos principal.

### 1. Crear base de datos de pruebas

Abre PostgreSQL:

```bash
psql -U postgres
```

Crea una base de datos exclusiva para pruebas:

```sql
CREATE DATABASE DB_NAME_TEST;
```

Ejemplo:

```sql
CREATE DATABASE rchq_db_test;
```

### 2. Crear archivo `.env.test`

Copia el archivo de ejemplo:

```bash
cp .env.example .env.test
```

Configura las variables necesarias para el ambiente de pruebas:

| Variable | Descripción | Ejemplo |
| -------- | ----------- | ------- |
| `RUNNING_PORT` | Puerto donde escucha el backend. | `3000` |
| `TEST_DATABASE_URL` | Cadena de conexión con la base de datos de pruebas. | `postgresql://user:pass@localhost:5432/databasename` |
| `NODE_ENV` | Entorno de ejecución configurado como prueba. | `test` |
| `ENCRYPTION_KEY` | Clave para encriptar datos sensibles. Se puede generar con `openssl rand -hex 32` o `openssl rand -base64 32`. | `[********]` |
| `JWT_SECRET` | Clave secreta para generar y validar JSON Web Tokens. | `SECRET` |
| `LOG_IP_HASH_SECRET` | Clave secreta utilizada para proteger o hashear información relacionada con IPs en logs. | `SECRET` |

Ejemplo de `.env.test`:

```env
RUNNING_PORT=3000
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/rchq_db_test
NODE_ENV=test
ENCRYPTION_KEY=clave_generada_con_openssl
JWT_SECRET=SECRET
LOG_IP_HASH_SECRET=SECRET
```

### 3. Conectar la base de datos de pruebas en DBeaver

1. Abre DBeaver.
2. Crea una nueva conexión.
3. Selecciona PostgreSQL.
4. Usa los siguientes valores:

| Campo | Valor |
| ----- | ----- |
| Host | `localhost` |
| Puerto | `5432` |
| Database | Nombre de la base de datos de pruebas configurada en `.env.test` |
| Username | Usuario de PostgreSQL |
| Password | Contraseña del usuario de PostgreSQL |

5. Haz clic en `Test Connection`.
6. Si la conexión es exitosa, presiona `Finish`.
7. Verifica que la base de datos esté disponible en `Schemas > public > Tables`.

## Scripts disponibles

| Comando | Descripción |
| ------- | ----------- |
| `npm run start` | Levanta el backend en modo desarrollo. |
| `npm test` | Ejecuta todas las pruebas unitarias e integración. |
| `npm run test:unit` | Ejecuta únicamente las pruebas unitarias. |
| `npm run test:integration` | Ejecuta únicamente las pruebas de integración. |

## Pruebas

El backend utiliza Jest y Supertest para ejecutar pruebas unitarias e integración.

```bash
# Ejecutar todas las pruebas de integración y unitarias
npm test

# Ejecutar únicamente las pruebas unitarias
npm run test:unit

# Ejecutar únicamente las pruebas de integración
npm run test:integration
```

## Flujo recomendado para levantar el backend localmente

```bash
# 1. Clonar el repositorio
git clone https://github.com/AztlanConsulting/RCHQ-Back.git
cd RCHQ-Back

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
cp .env.example .env

# 4. Crear base de datos en PostgreSQL
psql -U postgres

# Dentro de psql:
# CREATE DATABASE tochan;

# 5. Poblar base de datos
psql -U postgres -d tochan -f data/rchq_db.sql

# 6. Generar cliente de Prisma
npx prisma generate

# 7. Ejecutar backend
npm run start
```

## Documentación adicional

La carpeta `docs/` contiene documentación complementaria del backend.

También se incluyen carpetas como `diagrams/`, `scripts/`, `data/` y `prisma/`, que ayudan a comprender, configurar y mantener el proyecto.

## Notas importantes

- El backend debe tener una base de datos PostgreSQL configurada antes de ejecutarse.
- El archivo `.env` no debe subirse al repositorio porque contiene secretos y credenciales.
- La variable `DATABASE_URL` debe coincidir con la base de datos local creada en PostgreSQL.
- Para ejecutar pruebas de integración se debe usar una base de datos separada configurada en `.env.test`.
- Mailgun requiere una API Key válida para poder enviar correos.
- Si se usa Mailgun en modo Sandbox, los correos destinatarios deben estar autorizados.
- Después de modificar el esquema de Prisma, se recomienda ejecutar nuevamente:

```bash
npx prisma generate
```
