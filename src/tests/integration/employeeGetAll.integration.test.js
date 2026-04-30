// tests/integration/employeeGetAll.integration.test.js
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const app = require("../../app");

const prisma = new PrismaClient();

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
const TEST_ADMIN_ID = randomUUID();
let TEST_ROLE_ID;
const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const API_ROUTE = "/employee/getAll";

// ─── Helpers ──────────────────────────────────────────────
const generateToken = (
    payloadOverrides = {},
    signOptions = { expiresIn: "1h" },
) => {
    const defaultPayload = {
        id: TEST_ADMIN_ID,
        role: "Administrador",
        houseId: TEST_HOUSE_ID,
        tokenType: "SESSION",
    };
    return jwt.sign(
        { ...defaultPayload, ...payloadOverrides },
        JWT_SECRET,
        signOptions,
    );
};

const seedDependencies = async () => {
    let role = await prisma.role.findUnique({
        where: { name: "Administrador" },
    });

    if (!role) {
        role = await prisma.role.create({
            data: {
                role_id: randomUUID(),
                name: "Administrador",
            },
        });
    }

    TEST_ROLE_ID = role.role_id;

    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Test",
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa usada solo para tests de integración",
            image: "test.jpg",
        },
    });

    for (let i = 1; i <= 15; i++) {
        await prisma.employee.create({
            data: {
                employee_id: randomUUID(),
                house_id: TEST_HOUSE_ID,
                role_id: TEST_ROLE_ID,
                name: `Juan${i}`,
                surname: "Perez",
                email: `juan${i}@test.com`,
                password: "123456",
                curp: `TEST900101HDFRR${String(i).padStart(2, "0")}`,
                birth_date: new Date("1990-01-01"),
                start_date: new Date(),
                is_active: i <= 10,
                has_first_login: false,
                is_active_2fa: false,
                failed_login_attempts: 0,
            },
        });
    }
};

const cleanDb = async () => {
    await prisma.employee.deleteMany({
        where: { house_id: TEST_HOUSE_ID },
    });

    await prisma.house.deleteMany({
        where: { house_id: TEST_HOUSE_ID },
    });
};

// ─── Hooks ────────────────────────────────────────────────
beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

// ─── SUITE DE PRUEBAS ─────────────────────────────────────
describe(`GET ${API_ROUTE} - Integration & Security`, () => {
    describe("Comportamiento esperado", () => {
        it("retorna empleados activos por default", async () => {
            const token = generateToken();
            const res = await request(app)
                .get(API_ROUTE)
                .set("Authorization", `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(6);
        });

        it("retorna empleados inactivos si active=false", async () => {
            const token = generateToken();
            const res = await request(app)
                .get(`${API_ROUTE}?active=false`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(5);
        });

        it("busca empleados por coincidencia parcial (search)", async () => {
            const token = generateToken();
            const res = await request(app)
                .get(`${API_ROUTE}?search=Juan1`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    describe("2. Fuzzing y Manipulación de Parámetros (Inputs destructivos)", () => {
        it("retorna 200 y aplica defaults si envían letras en paginación", async () => {
            const token = generateToken();
            const res = await request(app)
                .get(`${API_ROUTE}?page=DROP_TABLE&limit=HACK`)
                .set("Authorization", `Bearer ${token}`);

            // Debería sobrevivir al intento y usar página 1, límite 6
            expect(res.statusCode).toBe(200);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(6);
        });

        it("capea o maneja inteligentemente límites absurdamente altos para evitar Memory Exhaustion (DoS)", async () => {
            const token = generateToken();
            const res = await request(app)
                .get(`${API_ROUTE}?limit=9999999`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            // Asegúrate de que tu backend tenga un max-limit (ej: 100). Si retorna 9999999, tienes un hueco de seguridad.
            expect(res.body.pagination.limit).toBeLessThanOrEqual(100);
        });

        it("retorna una lista vacía y no un error 500 al buscar una página fuera de rango", async () => {
            const token = generateToken();
            const res = await request(app)
                .get(`${API_ROUTE}?page=9000`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(0);
        });

        it("no rompe la consulta Prisma al enviar caracteres especiales de bases de datos", async () => {
            const token = generateToken();
            const res = await request(app)
                .get(`${API_ROUTE}?search=%;--'`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
        });
    });

    describe("3. Seguridad: Autenticación y Autorización", () => {
        it("retorna 401 si no se envía token", async () => {
            const res = await request(app).get(API_ROUTE);
            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está manipulado o mal formado", async () => {
            const res = await request(app)
                .get(API_ROUTE)
                .set(
                    "Authorization",
                    "Bearer token_inventado_para_hackear.123",
                );
            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está expirado", async () => {
            // Creamos un token que venció hace 1 segundo (-1s)
            const expiredToken = generateToken({}, { expiresIn: "-1s" });
            const res = await request(app)
                .get(API_ROUTE)
                .set("Authorization", `Bearer ${expiredToken}`);
            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 (o error de seguridad) si el token NO tiene un houseId válido", async () => {
            // Generamos token sin houseId para ver si el middleware lo ataja
            const maliciousToken = generateToken({ houseId: undefined });
            const res = await request(app)
                .get(API_ROUTE)
                .set("Authorization", `Bearer ${maliciousToken}`);

            // Debería ser atrapado por la validación, arrojando 400, 401 o 403.
            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    describe("4. Resiliencia: Rate Limiting", () => {
        it("debería retornar 429 Too Many Requests al lanzar un pico masivo de peticiones", async () => {
            const token = generateToken();
            let responses = [];

            // Lanzamos 150 peticiones simultáneas
            // NOTA: Si tu límite es mayor (ej. 1000/min), sube este número.
            for (let i = 0; i < 150; i++) {
                responses.push(
                    request(app)
                        .get(API_ROUTE)
                        .set("Authorization", `Bearer ${token}`),
                );
            }

            const results = await Promise.all(responses);

            // Evaluamos si AL MENOS una petición fue bloqueada con 429
            const hasRateLimitTriggered = results.some(
                (res) => res.statusCode === 429,
            );

            expect(hasRateLimitTriggered).toBe(true);
        });
    });
});
