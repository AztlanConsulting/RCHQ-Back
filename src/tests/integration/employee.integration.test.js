// tests/integration/employee.integration.test.js
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const app = require("../../index");

const prisma = new PrismaClient();

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
let TEST_ROLE_ID;
const TEST_EMAIL = "maria.lopez.integracion@test.com";
const TEST_CURP = "LOMM900512HDFRRN01";
const TEST_ADMIN_ID = randomUUID();
const TEST_ADMIN_EMAIL = "admin.master.test@test.com";
const TEST_ADMIN_CURP = "ADMN999999HDFRRN01";

const API_ROUTE = "/employee/add";

let baseEmployeePayload = {
    name: "María",
    surname: "López",
    email: TEST_EMAIL,
    curp: TEST_CURP,
    rfc: "LOMM900512A12",
    nss: "12345678901",
    bankAccount: "012345678901234567",
    houseId: TEST_HOUSE_ID,
    birthDate: "1990-05-12",
};

// ─── Helpers ──────────────────────────────────────────────
const seedDependencies = async () => {

    const REQUIRED_ACTIONS = [
        { action_id: "empl-001", description: "Empleado creado", important: true  },
        { action_id: "auth-001", description: "Login fallido",   important: false },
        { action_id: "auth-003", description: "Login exitoso",   important: false },
    ];

    for (const action of REQUIRED_ACTIONS) {
        await prisma.action.upsert({
        where:  { action_id: action.action_id },
        update: {},
        create: action,
        });
    }

    let adminRole = await prisma.role.findUnique({
        where: { name: "Administrador" },
    });

    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: {
                role_id: randomUUID(),
                name: "Administrador",
            },
        });
    }

    TEST_ROLE_ID = adminRole.role_id;
    baseEmployeePayload.roleId = TEST_ROLE_ID;

    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: "Casa de Prueba Integration Employee",
            location: "Test Location",
            phone_number: "4421234567",
            description: "Casa usada solo para tests de integración",
            image: "test-image.jpg",
        },
    });

    await prisma.employee.upsert({
        where: { curp: TEST_ADMIN_CURP },
        update: {},
        create: {
            employee_id: TEST_ADMIN_ID,
            name: "Admin",
            surname: "Master",
            email: TEST_ADMIN_EMAIL,
            curp: TEST_ADMIN_CURP,
            password: "dummy_password",
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ID,
            birth_date: new Date("1980-01-01"),
            start_date: new Date(),
            is_active: true,
            has_first_login: false,
            is_active_2fa: false,
            failed_login_attempts: 0,
        },
    });
};

const generateAdminToken = () => {
    return jwt.sign(
        {
            id: TEST_ADMIN_ID,
            email: TEST_ADMIN_EMAIL,
            role: "Administrador",
            houseId: TEST_HOUSE_ID,
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET || "test_secret",
        { expiresIn: "1h" },
    );
};

const cleanDb = async () => {
    const employeesToDelete = await prisma.employee.findMany({
        where: {
        OR: [
            { curp:  TEST_CURP   },
            { email: TEST_EMAIL  },
            { nss:   "12345678901" },
        ],
        },
        select: { employee_id: true },
    });

    const ids = employeesToDelete.map(e => e.employee_id);

    if (ids.length > 0) {
        await prisma.logs.deleteMany({ where: { employee_id: { in: ids } } });
    }

    await prisma.employee.deleteMany({ where: { curp:  TEST_CURP      } });
    await prisma.employee.deleteMany({ where: { email: TEST_EMAIL     } });
    await prisma.employee.deleteMany({ where: { nss:   "12345678901"  } });
};

// ─── Hooks ────────────────────────────────────────────────
beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await prisma.employee.deleteMany({
        where: { curp: TEST_ADMIN_CURP },
    });

    await prisma.house.deleteMany({
        where: { house_id: TEST_HOUSE_ID },
    });

    await prisma.$disconnect();
});

// ─── CREATE EMPLOYEE ──────────────────────────────────────
describe(`POST ${API_ROUTE} - integration`, () => {
    it("retorna 201 y guarda el empleado en BD con datos válidos", async () => {
        const token = generateAdminToken();

        const res = await request(app)
            .post(API_ROUTE)
            .set("Authorization", `Bearer ${token}`)
            .set("cf-connecting-ip", "127.0.0.1")
            .send(baseEmployeePayload);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("message");
        expect(res.body).toHaveProperty("redirect");

        const emp = await prisma.employee.findUnique({
            where: { curp: TEST_CURP },
        });

        expect(emp).not.toBeNull();
        expect(emp.email).toBe(TEST_EMAIL);
        expect(emp.house_id).toBe(TEST_HOUSE_ID);
    });

    it("retorna 400 si faltan campos obligatorios", async () => {
        const token = generateAdminToken();
        const { name, ...invalidPayload } = baseEmployeePayload;

        const res = await request(app)
            .post(API_ROUTE)
            .set("Authorization", `Bearer ${token}`)
            .send(invalidPayload);

        expect(res.statusCode).toBe(400);
    });

    it("retorna 409 si el empleado ya existe (CURP duplicado)", async () => {
        const token = generateAdminToken();

        await prisma.employee.create({
            data: {
                employee_id: randomUUID(),
                name: baseEmployeePayload.name,
                surname: baseEmployeePayload.surname,
                email: baseEmployeePayload.email,
                curp: baseEmployeePayload.curp,
                rfc: baseEmployeePayload.rfc,
                nss: baseEmployeePayload.nss,
                bank_account: baseEmployeePayload.bankAccount,
                house_id: baseEmployeePayload.houseId,
                role_id: baseEmployeePayload.roleId,
                birth_date: new Date(baseEmployeePayload.birthDate),
                start_date: new Date(),
                password: "dummy_password",
                is_active: true,
                has_first_login: false,
                is_active_2fa: false,
                failed_login_attempts: 0,
            },
        });

        const res = await request(app)
            .post(API_ROUTE)
            .set("Authorization", `Bearer ${token}`)
            .send(baseEmployeePayload);

        expect(res.statusCode).toBe(409);
    });

    it("retorna 401 si no se envía token de autorización", async () => {
        const res = await request(app)
            .post(API_ROUTE)
            .send(baseEmployeePayload);

        expect(res.statusCode).toBe(401);
    });
});
