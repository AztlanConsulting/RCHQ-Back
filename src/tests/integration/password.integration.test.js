// tests/integration/password.integration.test.js
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");
const { seedActions } = require("../helpers/seedActions");

const prisma = new PrismaClient();

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();

const TEST_EMPLOYEE_ID = randomUUID();
const TEST_EMAIL = "password.integration@test.com";
const TEST_CURP = "PASS900101HDFABC01";
const TEST_PASSWORD = "Actual123A";
const TEST_NEW_PASSWORD = "Nueva123A";

const TEST_FIRST_LOGIN_EMPLOYEE_ID = randomUUID();
const TEST_FIRST_LOGIN_EMAIL = "firstlogin.integration@test.com";
const TEST_FIRST_LOGIN_CURP = "FLOG900101HDFABC02";
const TEST_TEMP_PASSWORD = "Temporal123A";
const TEST_FIRST_LOGIN_NEW_PASSWORD = "Definitiva123A";

/** Placeholder ciphertext (VarChar 72); must be String, never numeric 0 */
//const TEST_SALARY_ENC_STUB = "enc-stub-password-it-salary-placeholder";

// ─── Helpers ──────────────────────────────────────────────
const seedDependencies = async () => {
    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: "Casa de Prueba Password Integration",
            location: "Test Location",
            phone_number: "4421234567",
            description:
                "Casa usada solo para tests de integración de password",
            image: "test-image.jpg",
        },
    });

    await prisma.role.upsert({
        where: { role_id: TEST_ROLE_ID },
        update: {},
        create: {
            role_id: TEST_ROLE_ID,
            name: "test-role-password-integration",
        },
    });
};

const createTestEmployee = async (overrides = {}) => {
    const hashedPwd = await bcrypt.hash(TEST_PASSWORD, 10);

    return prisma.employee.create({
        data: {
            employee_id: TEST_EMPLOYEE_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ID,
            email: TEST_EMAIL,
            password: hashedPwd,
            name: "Password",
            surname: "User",
            curp: TEST_CURP,
            start_date: new Date("2024-01-01"),
            type: "permanente",
            has_first_login: false,
            is_active: true,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            ...overrides,
        },
    });
};

const createFirstLoginEmployee = async (overrides = {}) => {
    const hashedPwd = await bcrypt.hash(TEST_TEMP_PASSWORD, 10);

    return prisma.employee.create({
        data: {
            employee_id: TEST_FIRST_LOGIN_EMPLOYEE_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ID,
            email: TEST_FIRST_LOGIN_EMAIL,
            password: hashedPwd,
            name: "First",
            surname: "Login",
            curp: TEST_FIRST_LOGIN_CURP,
            start_date: new Date("2024-01-01"),
            type: "permanente",
            has_first_login: true,
            is_active: true,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            ...overrides,
        },
    });
};

const generateSessionToken = () => {
    return jwt.sign(
        {
            id: TEST_EMPLOYEE_ID,
            email: TEST_EMAIL,
            name: "Password User",
            role: "test-role-password-integration",
            privileges: [],
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
};

const generateFirstLoginToken = () => {
    return jwt.sign(
        {
            id: TEST_FIRST_LOGIN_EMPLOYEE_ID,
            email: TEST_FIRST_LOGIN_EMAIL,
            purpose: "FIRST_LOGIN_CHANGE_PASSWORD",
            tokenType: "FIRST_LOGIN",
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
    );
};

const cleanDb = async () => {
    await prisma.logs.deleteMany({
        where: {
            employee_id: {
                in: [TEST_EMPLOYEE_ID, TEST_FIRST_LOGIN_EMPLOYEE_ID],
            },
        },
    });

    await prisma.employee.deleteMany({
        where: {
            email: {
                in: [TEST_EMAIL, TEST_FIRST_LOGIN_EMAIL],
            },
        },
    });
};

// ─── Hooks ────────────────────────────────────────────────
beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
    await seedActions();
});

afterEach(async () => {
    await cleanDb();
});

afterAll(async () => {
    await prisma.role.deleteMany({ where: { role_id: TEST_ROLE_ID } });
    await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
    await prisma.$disconnect();
});

// ─── CHANGE PASSWORD ──────────────────────────────────────
describe("POST /auth/change-password - integration", () => {
    it("retorna 200 y actualiza la contraseña en BD", async () => {
        await createTestEmployee();
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                currentPassword: TEST_PASSWORD,
                newPassword: TEST_NEW_PASSWORD,
                confirmPassword: TEST_NEW_PASSWORD,
            });

        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });

        const matchesNewPassword = await bcrypt.compare(
            TEST_NEW_PASSWORD,
            emp.password,
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(matchesNewPassword).toBe(true);
    });

    it("retorna 401 si no se envía token", async () => {
        await createTestEmployee();

        const res = await request(app).post("/auth/change-password").send({
            currentPassword: TEST_PASSWORD,
            newPassword: TEST_NEW_PASSWORD,
            confirmPassword: TEST_NEW_PASSWORD,
        });

        expect(res.statusCode).toBe(401);
    });

    it("retorna 400 si confirmPassword no coincide", async () => {
        await createTestEmployee();
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                currentPassword: TEST_PASSWORD,
                newPassword: TEST_NEW_PASSWORD,
                confirmPassword: "Otra123A",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("retorna 401 si la contraseña actual es incorrecta", async () => {
        await createTestEmployee();
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                currentPassword: "Incorrecta123A",
                newPassword: TEST_NEW_PASSWORD,
                confirmPassword: TEST_NEW_PASSWORD,
            });

        expect(res.statusCode).toBe(401);
    });

    it("retorna 400 si la nueva contraseña es igual a la actual", async () => {
        await createTestEmployee();
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                currentPassword: TEST_PASSWORD,
                newPassword: TEST_PASSWORD,
                confirmPassword: TEST_PASSWORD,
            });

        expect(res.statusCode).toBe(400);
    });
});

// ─── FIRST LOGIN CHANGE PASSWORD ──────────────────────────
describe("POST /auth/first-login/change-password - integration", () => {
    it("retorna 200, actualiza password y pone has_first_login en false", async () => {
        await createFirstLoginEmployee();
        const token = generateFirstLoginToken();

        const res = await request(app)
            .post("/auth/first-login/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                newPassword: TEST_FIRST_LOGIN_NEW_PASSWORD,
                confirmPassword: TEST_FIRST_LOGIN_NEW_PASSWORD,
            });

        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_FIRST_LOGIN_EMPLOYEE_ID },
        });

        const matchesNewPassword = await bcrypt.compare(
            TEST_FIRST_LOGIN_NEW_PASSWORD,
            emp.password,
        );

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("token");
        expect(emp.has_first_login).toBe(false);
        expect(matchesNewPassword).toBe(true);
    });

    it("retorna 401 si no se envía token", async () => {
        await createFirstLoginEmployee();

        const res = await request(app)
            .post("/auth/first-login/change-password")
            .send({
                newPassword: TEST_FIRST_LOGIN_NEW_PASSWORD,
                confirmPassword: TEST_FIRST_LOGIN_NEW_PASSWORD,
            });

        expect(res.statusCode).toBe(401);
    });

    it("retorna 403 si se envía token de sesión en lugar de first-login token", async () => {
        await createFirstLoginEmployee();

        const wrongToken = jwt.sign(
            {
                id: TEST_FIRST_LOGIN_EMPLOYEE_ID,
                email: TEST_FIRST_LOGIN_EMAIL,
                tokenType: "SESSION",
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
        );

        const res = await request(app)
            .post("/auth/first-login/change-password")
            .set("Authorization", `Bearer ${wrongToken}`)
            .send({
                newPassword: TEST_FIRST_LOGIN_NEW_PASSWORD,
                confirmPassword: TEST_FIRST_LOGIN_NEW_PASSWORD,
            });

        expect(res.statusCode).toBe(403);
    });

    it("retorna 409 si el usuario ya no requiere cambio de primer login", async () => {
        await createFirstLoginEmployee({ has_first_login: false });
        const token = generateFirstLoginToken();

        const res = await request(app)
            .post("/auth/first-login/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                newPassword: TEST_FIRST_LOGIN_NEW_PASSWORD,
                confirmPassword: TEST_FIRST_LOGIN_NEW_PASSWORD,
            });

        expect(res.statusCode).toBe(409);
    });

    it("retorna 400 si la nueva contraseña es igual a la temporal", async () => {
        await createFirstLoginEmployee();
        const token = generateFirstLoginToken();

        const res = await request(app)
            .post("/auth/first-login/change-password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                newPassword: TEST_TEMP_PASSWORD,
                confirmPassword: TEST_TEMP_PASSWORD,
            });

        expect(res.statusCode).toBe(400);
    });
});
