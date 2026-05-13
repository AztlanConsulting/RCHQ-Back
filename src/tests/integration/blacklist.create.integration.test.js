const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const { LOG_ACTIONS } = require("../../utils/logActions");

const prisma = new PrismaClient();

// ─── Constantes de prueba ─────────────────────────────────

const TEST_HOUSE_ID = randomUUID();
const TEST_COORDINADOR_ID = randomUUID();
const TEST_TARGET_ID = randomUUID();
const TEST_COORDINADOR_ROLE_ID = randomUUID();
const TEST_TARGET_ROLE_ID = randomUUID();
const TEST_PASSWORD = "TestPass123";
const TEST_COORDINADOR_EMAIL = "coordinador.blacklist@test.com";
const TEST_TARGET_EMAIL = "target.blacklist@test.com";
const TEST_COORDINADOR_CURP = "COOR900101HDFXXX01";
const TEST_TARGET_CURP = "TARG900101HDFXXX02";

// ─── Helpers ──────────────────────────────────────────────

const seedDependencies = async () => {
    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Prueba Blacklist IT",
            location: "Test Location",
            phone_number: "4421234567",
            description: "Casa usada solo para tests de integración de blacklist",
            image: "test-image.jpg",
        },
    });

    await prisma.role.upsert({
        where: { role_id: TEST_COORDINADOR_ROLE_ID },
        update: {},
        create: {
            role_id: TEST_COORDINADOR_ROLE_ID,
            name: "Coordinador",
        },
    });

    await prisma.role.upsert({
        where: { role_id: TEST_TARGET_ROLE_ID },
        update: {},
        create: {
            role_id: TEST_TARGET_ROLE_ID,
            name: "test-role-blacklist-target",
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

const createCoordinador = async () => {
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    return prisma.employee.create({
        data: {
            employee_id: TEST_COORDINADOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_COORDINADOR_ROLE_ID,
            name: "Coordinador",
            surname: "Prueba",
            email: TEST_COORDINADOR_EMAIL,
            password: hashedPassword,
            curp: TEST_COORDINADOR_CURP,
            start_date: new Date("2024-01-01"),
            has_first_login: false,
            is_active: true,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            type: "nomina",
        },
    });
};

const createTargetEmployee = async (overrides = {}) => {
    return prisma.employee.create({
        data: {
            employee_id: TEST_TARGET_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_TARGET_ROLE_ID,
            name: "Luis",
            surname: "Pérez",
            email: TEST_TARGET_EMAIL,
            password: "hashed",
            curp: TEST_TARGET_CURP,
            start_date: new Date("2024-01-01"),
            has_first_login: false,
            is_active: true,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            type: "nomina",
            ...overrides,
        },
    });
};

const generateSessionToken = (overrides = {}) => {
    return jwt.sign(
        {
            id: TEST_COORDINADOR_ID,
            email: TEST_COORDINADOR_EMAIL,
            name: "Coordinador Prueba",
            role: "Coordinador",
            houseId: TEST_HOUSE_ID,
            privileges: [],
            tokenType: "SESSION",
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
};

const loginAndGetToken = async () => {
    const res = await request(app)
        .post("/auth/login")
        .send({ email: TEST_COORDINADOR_EMAIL, password: TEST_PASSWORD });
    return res.body.data.token;
};

const cleanDb = async () => {
    await prisma.blacklist.deleteMany({ where: { employee_id: TEST_TARGET_ID } });
    await prisma.logs.deleteMany({ where: { employee_id: TEST_COORDINADOR_ID } });
    await prisma.employee.deleteMany({
        where: { employee_id: { in: [TEST_COORDINADOR_ID, TEST_TARGET_ID] } },
    });
};

// ─── Hooks ────────────────────────────────────────────────

beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

beforeEach(async () => {
    await cleanDb();
    await createCoordinador();
});

afterAll(async () => {
    await cleanDb();
    await prisma.role.deleteMany({
        where: { role_id: { in: [TEST_COORDINADOR_ROLE_ID, TEST_TARGET_ROLE_ID] } },
    });
    await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
    await prisma.$disconnect();
});

// ─── Tests ────────────────────────────────────────────────

describe("POST /api/blacklist/:employeeId - integración", () => {
    it("retorna 200 y agrega al empleado a la lista negra", async () => {
        // Arrange
        await createTargetEmployee();
        const token = await loginAndGetToken();

        // Act
        const res = await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("curp", TEST_TARGET_CURP);
        expect(res.body.data).toHaveProperty("employeeId", TEST_TARGET_ID);
    });

    it("desactiva la cuenta del empleado en BD al agregarlo a la lista negra", async () => {
        // Arrange
        await createTargetEmployee();
        const token = await loginAndGetToken();

        // Act
        await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        const employee = await prisma.employee.findUnique({
            where: { employee_id: TEST_TARGET_ID },
        });
        expect(employee.is_active).toBe(false);
    });

    it("inserta el registro con la curp correcta en la tabla blacklist en BD", async () => {
        // Arrange
        await createTargetEmployee();
        const token = await loginAndGetToken();

        // Act
        await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        const entry = await prisma.blacklist.findFirst({
            where: { employee_id: TEST_TARGET_ID },
        });
        expect(entry).not.toBeNull();
        expect(entry.curp).toBe(TEST_TARGET_CURP);
    });

    it("genera el log de la acción en BD", async () => {
        // Arrange
        await createTargetEmployee();
        const token = await loginAndGetToken();

        // Act
        await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        const log = await prisma.logs.findFirst({
            where: {
                employee_id: TEST_COORDINADOR_ID,
                action_id: LOG_ACTIONS.BLACKLIST_ADDED,
            },
        });
        expect(log).not.toBeNull();
        expect(log.affected).toContain(TEST_TARGET_CURP);
    });

    it("retorna 401 sin token de sesión", async () => {
        // Arrange
        await createTargetEmployee();

        // Act
        const res = await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`);

        // Assert
        expect(res.statusCode).toBe(401);
    });

    it("retorna 403 si el rol no es Coordinador", async () => {
        // Arrange
        await createTargetEmployee();
        const token = generateSessionToken({ role: "Mantenimiento" });

        // Act
        const res = await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(403);
    });

    it("retorna 403 si el empleado objetivo pertenece a otra casa", async () => {
        // Arrange
        const otraHouseId = randomUUID();
        await prisma.house.create({
            data: {
                house_id: otraHouseId,
                name: "Otra Casa Blacklist IT",
                location: "Otro lugar",
                phone_number: "4429999999",
                description: "Casa diferente",
                image: "other.jpg",
            },
        });
        await createTargetEmployee({ house_id: otraHouseId });
        const token = generateSessionToken();

        // Act
        const res = await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(403);

        await prisma.house.delete({ where: { house_id: otraHouseId } });
    });

    it("retorna 400 si el empleado objetivo no existe", async () => {
        // Arrange
        const token = generateSessionToken();
        const idInexistente = randomUUID();

        // Act
        const res = await request(app)
            .post(`/api/blacklist/${idInexistente}`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(400);
    });

    it("retorna 400 si se intenta agregar dos veces al mismo empleado (curp duplicada)", async () => {
        // Arrange
        await createTargetEmployee();
        const token = await loginAndGetToken();

        await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`)
            .set("Authorization", `Bearer ${token}`);

        // Reactivar para poder intentar de nuevo
        await prisma.employee.update({
            where: { employee_id: TEST_TARGET_ID },
            data: { is_active: true },
        });

        // Act
        const res = await request(app)
            .post(`/api/blacklist/${TEST_TARGET_ID}`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});