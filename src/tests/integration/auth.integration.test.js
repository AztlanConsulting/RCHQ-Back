const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const app = require("../../app");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { seedActions } = require("../helpers/seedActions");

const prisma = new PrismaClient();

const TEST_HOUSE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_EMPLOYEE_ID = randomUUID();
const TEST_EMAIL = "integration@test.com";
const TEST_PASSWORD = "TestPass123";
const TEST_CURP = "TEST123456INTXXX01";
const TEST_ROLE_NAME = "test-role-auth-it";

const seedDependencies = async () => {
    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: "Casa de Prueba Integration",
            location: "Test Location",
            phone_number: "4421234567",
            description: "Casa usada solo para tests de integración",
            image: "test-image.jpg",
        },
    });
    await prisma.role.upsert({
        where: { role_id: TEST_ROLE_ID },
        update: {},
        create: {
            role_id: TEST_ROLE_ID,
            name: TEST_ROLE_NAME,
        },
    });
    for (const [key, actionId] of Object.entries(LOG_ACTIONS)) {
        await prisma.action.upsert({
            where: { action_id: actionId },
            update: {},
            create: {
                action_id: actionId,
                description: `IT seed: ${key}`.slice(0, 120),
                important: false,
            },
        });
    }
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
            name: "Test",
            surname: "User",
            type: "internal",
            curp: TEST_CURP,
            start_date: new Date("2024-01-01"),
            has_first_login: false,
            is_active: true,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            salary: "long-encrypted-salary-value",
            ...overrides,
        },
    });
};

const generateSessionToken = () => {
    const jwt = require("jsonwebtoken");
    return jwt.sign(
        {
            id: TEST_EMPLOYEE_ID,
            email: TEST_EMAIL,
            name: "Test User",
            role: TEST_ROLE_NAME,
            privileges: [],
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
};

const generateTestRefreshToken = () => {
    const jwt = require("jsonwebtoken");
    return jwt.sign(
        { id: TEST_EMPLOYEE_ID, tokenType: "REFRESH" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
    );
};

const cleanDb = async () => {
    await prisma.logs.deleteMany({ where: { employee_id: TEST_EMPLOYEE_ID } });
    await prisma.employee.deleteMany({ where: { email: TEST_EMAIL } });
};

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

describe("POST /auth/login - integration", () => {
    it("retorna 200 y token con credenciales válidas", async () => {
        await createTestEmployee();

        const res = await request(app)
            .post("/auth/login")
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty("token");
        expect(res.body.data.user.email).toBe(TEST_EMAIL);
        expect(res.headers["set-cookie"]).toBeDefined();
        expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);
    });

    it("retorna 401 con contraseña incorrecta", async () => {
        await createTestEmployee();

        const res = await request(app)
            .post("/auth/login")
            .send({ email: TEST_EMAIL, password: "wrongpass" });

        expect(res.statusCode).toBe(401);
        expect(res.body.code).toBe("INVALID_CREDENTIALS");
    });

    it("retorna 401 si el usuario no existe", async () => {

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "noexiste@test.com", password: TEST_PASSWORD });

        expect(res.statusCode).toBe(401);
    });

    it("retorna 400 si el email tiene formato inválido", async () => {

        const res = await request(app)
            .post("/auth/login")
            .send({ email: "notanemail", password: TEST_PASSWORD });

        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("incrementa failed_login_attempts en BD al fallar", async () => {
        await createTestEmployee();

        await request(app)
            .post("/auth/login")
            .send({ email: TEST_EMAIL, password: "wrongpass" });
        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });

        expect(emp.failed_login_attempts).toBe(1);
    });

    it("bloquea la cuenta en BD después de 5 intentos fallidos", async () => {
        await createTestEmployee();

        for (let attempt = 0; attempt < 5; attempt += 1) {
            await request(app)
                .post("/auth/login")
                .send({ email: TEST_EMAIL, password: "wrong" });
        }
        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });

        expect(emp.blocked_until).not.toBeNull();
    });

    it("retorna preTwoFactorAuthToken cuando el usuario tiene factor de dos pasos activo", async () => {
        await createTestEmployee({
            is_active_two_factor_auth: true,
            totp_secret: "FAKESECRET",
        });

        const res = await request(app)
            .post("/auth/login")
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("preTwoFactorAuthToken");
        expect(res.body.isActiveTwoFactorAuth).toBe(true);
    });

    it("limpia el estado de seguridad en BD tras login exitoso", async () => {
        await createTestEmployee({ failed_login_attempts: 2 });

        await request(app)
            .post("/auth/login")
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });

        expect(emp.failed_login_attempts).toBe(0);
        expect(emp.blocked_until).toBeNull();
    });
});

describe("POST /auth/2fa/setup - integration", () => {
    it("guarda temp_totp_secret en BD y retorna QR", async () => {
        await createTestEmployee();
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/2fa/setup")
            .set("Authorization", `Bearer ${token}`)
            .send({ id: TEST_EMPLOYEE_ID });
        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty("qrImage");
        expect(res.body.nextStep).toBe("VERIFY_TWO_FACTOR_AUTH_SETUP");
        expect(emp.temp_totp_secret).not.toBeNull();
    });

    it("retorna 409 si el factor de dos pasos ya está configurado en BD", async () => {
        await createTestEmployee({
            totp_secret: "EXISTINGSECRET",
            is_active_two_factor_auth: true,
        });
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/2fa/setup")
            .set("Authorization", `Bearer ${token}`)
            .send({ id: TEST_EMPLOYEE_ID });

        expect(res.statusCode).toBe(409);
    });

    it("retorna 401 sin token de sesión", async () => {
        const res = await request(app)
            .post("/auth/2fa/setup")
            .send({ id: TEST_EMPLOYEE_ID });

        expect(res.statusCode).toBe(401);
    });
});

describe("POST /auth/refresh - integration", () => {
    it("retorna 200, nuevos tokens y actualiza la cookie", async () => {
        await createTestEmployee();
        const refreshToken = generateTestRefreshToken();
        
        await prisma.employee.update({
            where: { employee_id: TEST_EMPLOYEE_ID },
            data: { refresh_token: refreshToken }
        });

        const res = await request(app)
            .post("/auth/refresh")
            .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty("token");
        expect(res.headers["set-cookie"]).toBeDefined();
        expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=/);
    });

    it("retorna 401 si no se envía la cookie", async () => {
        const res = await request(app).post("/auth/refresh");
        
        expect(res.statusCode).toBe(401);
        expect(res.body.code).toBe("INVALID_REFRESH_TOKEN");
    });

    it("permite refresh concurrentes con la misma cookie sin invalidar la sesion", async () => {
        await createTestEmployee();
        const refreshToken = generateTestRefreshToken();

        await prisma.employee.update({
            where: { employee_id: TEST_EMPLOYEE_ID },
            data: { refresh_token: refreshToken }
        });

        const [firstRes, secondRes] = await Promise.all([
            request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`]),
            request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`]),
        ]);

        expect(firstRes.statusCode).toBe(200);
        expect(secondRes.statusCode).toBe(200);
        expect(firstRes.body.data).toHaveProperty("token");
        expect(secondRes.body.data).toHaveProperty("token");

        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });
        expect(emp.refresh_token).toBe(refreshToken);
    });
});

describe("POST /auth/logout - integration", () => {
    it("retorna 200, limpia la cookie y remueve el token de la BD", async () => {
        await createTestEmployee();
        const refreshToken = generateTestRefreshToken();
        
        await prisma.employee.update({
            where: { employee_id: TEST_EMPLOYEE_ID },
            data: { refresh_token: refreshToken }
        });

        const res = await request(app)
            .post("/auth/logout")
            .set("Cookie", [`refreshToken=${refreshToken}`]);

        expect(res.statusCode).toBe(200);
        expect(res.headers["set-cookie"][0]).toMatch(/refreshToken=;/);

        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });
        expect(emp.refresh_token).toBeNull();
    });
});

describe("POST /auth/2fa/verify - integration", () => {
    it("retorna 409 si no hay configuración pendiente en BD", async () => {
        await createTestEmployee({ temp_totp_secret: null });
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/2fa/verify")
            .set("Authorization", `Bearer ${token}`)
            .send({ token: "123456" });

        expect(res.statusCode).toBe(409);
    });

    it("retorna 409 y limpia el secret en BD si la configuración expiró", async () => {
        await createTestEmployee({
            temp_totp_secret: "SECRETBASE32",
            temp_totp_secret_created_at: new Date(Date.now() - 20 * 60 * 1000),
        });
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/2fa/verify")
            .set("Authorization", `Bearer ${token}`)
            .send({ token: "123456" });
        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });

        expect(res.statusCode).toBe(409);
        expect(emp.temp_totp_secret).toBeNull();
    });
});

describe("POST /auth/2fa/disable - integration", () => {
    it("desactiva el factor de dos pasos y limpia secrets en BD con contraseña correcta", async () => {
        await createTestEmployee({
            is_active_two_factor_auth: true,
            totp_secret: "FAKESECRET",
        });
        const token = generateSessionToken();

        const res = await request(app)
            .post("/auth/2fa/disable")
            .set("Authorization", `Bearer ${token}`)
            .send({ password: TEST_PASSWORD });
        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.nextStep).toBe("TWO_FACTOR_AUTH_DISABLED");
        expect(emp.totp_secret).toBeNull();
        expect(emp.is_active_two_factor_auth).toBe(false);
    });

    it("retorna 401 con contraseña incorrecta y NO modifica la BD", async () => {
        await createTestEmployee({
            is_active_two_factor_auth: true,
            totp_secret: "FAKESECRET",
        });
        const token = generateSessionToken();
        const res = await request(app)
            .post("/auth/2fa/disable")
            .set("Authorization", `Bearer ${token}`)
            .send({ password: "wrongpass" });
        const emp = await prisma.employee.findUnique({
            where: { employee_id: TEST_EMPLOYEE_ID },
        });

        expect(res.statusCode).toBe(401);
        expect(emp.totp_secret).toBe("FAKESECRET");
        expect(emp.is_active_two_factor_auth).toBe(true);
    });

    it("retorna 409 si el factor de dos pasos no está activo en BD", async () => {
        await createTestEmployee({
            is_active_two_factor_auth: false,
            totp_secret: null,
        });
        const token = generateSessionToken();
        const res = await request(app)
            .post("/auth/2fa/disable")
            .set("Authorization", `Bearer ${token}`)
            .send({ password: TEST_PASSWORD });

        expect(res.statusCode).toBe(409);
    });
});

describe("GET /auth/2fa/status - integration", () => {
    it("retorna false si el factor de dos pasos no está activo en BD", async () => {
        await createTestEmployee({ is_active_two_factor_auth: false });
        const token = generateSessionToken();

        const res = await request(app)
            .get("/auth/2fa/status")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.StatusTwoFactorAuth).toBe(false);
    });

    it("retorna true si el factor de dos pasos está activo en BD", async () => {
        await createTestEmployee({
            is_active_two_factor_auth: true,
            totp_secret: "FAKESECRET",
        });
        const token = generateSessionToken();

        const res = await request(app)
            .get("/auth/2fa/status")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.StatusTwoFactorAuth).toBe(true);
    });

    it("retorna 401 sin token de sesión", async () => {
        const res = await request(app).get("/auth/2fa/status");

        expect(res.statusCode).toBe(401);
    });
});
