// tests/integration/employeeGetAll.integration.test.js
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const app = require("../../index");

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

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
        employeeId: TEST_ADMIN_ID,
        role: "Admin",
        houseId: TEST_HOUSE_ID,
        tokenType: "SESSION",
        privileges: ["viewEmployees", "createEmployees", "manageEmployees", "viewDocuments", "manageDocuments"],
    };

    return jwt.sign(
        { ...defaultPayload, ...payloadOverrides },
        JWT_SECRET,
        signOptions,
    );
};

const seedDependencies = async () => {
    let role = await prisma.role.findUnique({
        where: { name: "Admin" },
    });

    if (!role) {
        role = await prisma.role.create({
            data: {
                role_id: randomUUID(),
                name: "Admin",
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
                is_active_two_factor_auth: false,
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
    describe("1. Comportamiento esperado", () => {
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

            expect(res.statusCode).toBe(200);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(7);
        });

        it("capea o maneja inteligentemente límites absurdamente altos para evitar Memory Exhaustion (DoS)", async () => {
            const token = generateToken();
            const res = await request(app)
                .get(`${API_ROUTE}?limit=9999999`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
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
            const expiredToken = generateToken({}, { expiresIn: "-1s" });
            const res = await request(app)
                .get(API_ROUTE)
                .set("Authorization", `Bearer ${expiredToken}`);
            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 (o error de seguridad) si el token NO tiene un houseId válido", async () => {
            const maliciousToken = generateToken({ houseId: undefined });
            const res = await request(app)
                .get(API_ROUTE)
                .set("Authorization", `Bearer ${maliciousToken}`);

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it("retorna 403 si el usuario tiene un rol no autorizado", async () => {
            const tokenSinPermiso = generateToken({
                role: "Empleado",
            });

            const res = await request(app)
                .get(API_ROUTE)
                .set("Authorization", `Bearer ${tokenSinPermiso}`);

            expect(res.statusCode).toBe(403);
        });
    });

    describe("4. Resiliencia: Rate Limiting Avanzado", () => {
        it("debería bloquear por employeeId si un usuario con sesión lanza ataque de peticiones", async () => {
            const tokenAtacante = generateToken({
                employeeId: "atacante-logueado-123",
            });

            let responses = [];

            for (let i = 0; i < 150; i++) {
                responses.push(
                    request(app)
                        .get(API_ROUTE)
                        .set("Authorization", `Bearer ${tokenAtacante}`),
                );
            }

            const results = await Promise.all(responses);

            const hasRateLimitTriggered = results.some(
                (res) => res.statusCode === 429,
            );

            expect(hasRateLimitTriggered).toBe(true);
        });

        it("debería bloquear por IP (sin token) si hay intentos anónimos masivos", async () => {
            let responses = [];

            for (let i = 0; i < 150; i++) {
                responses.push(request(app).get(API_ROUTE));
            }

            const results = await Promise.all(responses);

            const hasRateLimitTriggered = results.some(
                (res) => res.statusCode === 429,
            );

            expect(hasRateLimitTriggered).toBe(true);
        });

        it("independencia: un usuario legítimo NO se ve afectado aunque la IP y el Atacante estén bloqueados", async () => {
            const tokenLegitimo = generateToken({
                employeeId: "usuario-feliz-456",
            });

            const res = await request(app)
                .get(API_ROUTE)
                .set("Authorization", `Bearer ${tokenLegitimo}`);

            expect(res.statusCode).toBe(200);
        });
    });
});
