const { cleanIntegrationDb } = require("../../helpers/integrationIsolation");
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const app = require("../../../index");
const { LOG_ACTIONS } = require("../../../utils/logActions");
const { ROLES } = require("../../../utils/roles");
const PRIVILEGES = require("../../../utils/privileges");

const prisma = new PrismaClient();

const TEST_HOUSE_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b3c";
const TEST_COORDINADOR_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b3d";
const TEST_TARGET_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b3e";
const TEST_COORDINADOR_ROLE_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b3f";
const TEST_TARGET_ROLE_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b40";
const TEST_PRIVILEGE_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b41";
const TEST_PASSWORD = "TestPass123";
const TEST_COORDINADOR_EMAIL = "coordinador.blacklist@test.com";
const TEST_TARGET_EMAIL = "target.blacklist@test.com";
const TEST_COORDINADOR_CURP = "COOR900101HDFXXX01";
const TEST_TARGET_CURP = "TARG900101HDFXXX02";

let testCoordinadorRoleId;
let testTargetRoleId;
let testPrivilegeId;

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

    const coordRole = await prisma.role.upsert({
        where: { name: ROLES.COORDINATOR },
        update: {},
        create: {
            role_id: TEST_COORDINADOR_ROLE_ID,
            name: ROLES.COORDINATOR,
        },
    });
    testCoordinadorRoleId = coordRole.role_id;

    const targetRole = await prisma.role.upsert({
        where: { name: "test-role-blacklist-target" },
        update: {},
        create: {
            role_id: TEST_TARGET_ROLE_ID,
            name: "test-role-blacklist-target",
        },
    });
    testTargetRoleId = targetRole.role_id;

    const priv = await prisma.privileges.upsert({
        where: { name: PRIVILEGES.ADD_TO_BLACKLIST },
        update: {},
        create: {
            privilege_id: TEST_PRIVILEGE_ID,
            name: PRIVILEGES.ADD_TO_BLACKLIST,
        },
    });
    testPrivilegeId = priv.privilege_id;

    await prisma.role_privilege.upsert({
        where: { role_id_privilege_id: { role_id: testCoordinadorRoleId, privilege_id: testPrivilegeId } },
        update: {},
        create: { role_id: testCoordinadorRoleId, privilege_id: testPrivilegeId },
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
            role_id: testCoordinadorRoleId,
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
            role_id: testTargetRoleId,
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
            role: ROLES.COORDINATOR,
            houseId: TEST_HOUSE_ID,
            privileges: [PRIVILEGES.ADD_TO_BLACKLIST],
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
    await prisma.blacklist.deleteMany({ where: { curp: TEST_TARGET_CURP } });
    await prisma.logs.deleteMany({ where: { employee_id: TEST_COORDINADOR_ID } });
    await prisma.employee.deleteMany({
        where: { employee_id: { in: [TEST_COORDINADOR_ID, TEST_TARGET_ID] } },
    });
};

beforeEach(async () => {
    await cleanIntegrationDb();
    await cleanDb();
    await seedDependencies();
});

beforeEach(async () => {
    await cleanDb();
    await createCoordinador();
});

afterEach(async () => {
    await cleanIntegrationDb();
    await cleanDb();
    await prisma.role.deleteMany({
        where: {
            role_id: testTargetRoleId,
        },
    });
    await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
    await prisma.$disconnect();
});

describe("POST /blacklist - integración", () => {
    it("retorna 201 y agrega al empleado a la lista negra", async () => {
        await createTargetEmployee();
        const token = await loginAndGetToken();

        const res = await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Infracción a políticas" });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("curp", TEST_TARGET_CURP);
    });

    it("desactiva la cuenta del empleado en BD al agregarlo a la lista negra", async () => {
        await createTargetEmployee();
        const token = await loginAndGetToken();

        await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Infracción a políticas" });

        const employee = await prisma.employee.findUnique({
            where: { employee_id: TEST_TARGET_ID },
        });
        expect(employee.is_active).toBe(false);
    });

    it("inserta el registro con la curp correcta en la tabla blacklist en BD", async () => {
        await createTargetEmployee();
        const token = await loginAndGetToken();

        await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Falta grave" });

        const entry = await prisma.blacklist.findFirst({
            where: { curp: TEST_TARGET_CURP },
        });
        expect(entry).not.toBeNull();
        expect(entry.curp).toBe(TEST_TARGET_CURP);
        expect(entry.reason).toBe("Falta grave");
    });

    it("genera el log de la acción en BD", async () => {
        await createTargetEmployee();
        const token = await loginAndGetToken();

        await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Infracción a políticas" });

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
        await createTargetEmployee();

        const res = await request(app)
            .post(`/blacklist`)
            .send({ curp: TEST_TARGET_CURP, reason: "Infracción a políticas" });

        expect(res.statusCode).toBe(401);
    });

    it("retorna 403 si el rol no es Coordinador", async () => {
        await createTargetEmployee();
        const token = generateSessionToken({ role: ROLES.MAINTENANCE });

        const res = await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Infracción a políticas" });

        expect(res.statusCode).toBe(403);
    });

    it("retorna 403 si el empleado objetivo pertenece a otra casa", async () => {
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

        const res = await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Infracción a políticas" });

        expect(res.statusCode).toBe(403);

        await prisma.employee.delete({ where: { employee_id: TEST_TARGET_ID } });
        await prisma.house.delete({ where: { house_id: otraHouseId } });
    });

    it("retorna 404 si el empleado objetivo no existe", async () => {
        const token = generateSessionToken();
        const curpInexistente = "TARG900101HDFXXX99";

        const res = await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: curpInexistente, reason: "Infracción a políticas" });

        expect(res.statusCode).toBe(404);
    });

    it("retorna 409 si se intenta agregar dos veces al mismo empleado (curp duplicada)", async () => {
        await createTargetEmployee();
        const token = await loginAndGetToken();

        await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Primera infracción" });

        await prisma.employee.update({
            where: { employee_id: TEST_TARGET_ID },
            data: { is_active: true },
        });

        const res = await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Reincidencia" });

        expect(res.statusCode).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("Este empleado ya se encuentra en la lista negra");
    });

    it("retorna 403 si el coordinador intenta agregarse a sí mismo a la lista negra", async () => {
        const token = await loginAndGetToken();

        const res = await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_COORDINADOR_CURP, reason: "Infracción a políticas" });

        expect(res.statusCode).toBe(403); 
        expect(res.body.message).toContain("No puedes agregarte a ti mismo");
    });

    it("retorna 400 si el parámetro curp no tiene un formato válido", async () => {
        const token = await loginAndGetToken();

        const res = await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: "no-soy-una-curp", reason: "Falta" });

        expect(res.statusCode).toBe(400);
    });

    it("retorna 400 si el parámetro reason está ausente o vacío (Zod Schema)", async () => {
        const token = await loginAndGetToken();

        const res = await request(app)
            .post(`/blacklist`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP });

        expect(res.statusCode).toBe(400);
    });
});
