const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const { LOG_ACTIONS } = require("../../utils/logActions");
const { ROLES } = require("../../utils/roles");
const PRIVILEGES = require("../../utils/privileges");

const prisma = new PrismaClient();

const TEST_HOUSE_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2d1a";
const TEST_COORDINADOR_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2d1b";
const TEST_TARGET_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2d1c";
const TEST_COORDINADOR_ROLE_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2d1d";
const TEST_TARGET_ROLE_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2d1e";
const TEST_PRIVILEGE_ID = "f0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2d1f";
const TEST_PASSWORD = "TestPass123";
const TEST_COORDINADOR_EMAIL = "coord.delete.blacklist@test.com";
const TEST_TARGET_EMAIL = "target.delete.blacklist@test.com";
const TEST_COORDINADOR_CURP = "COOR900101HDFXXD01";
const TEST_TARGET_CURP = "TARG900101HDFXXD02";

let testCoordinadorRoleId;
let testTargetRoleId;
let testPrivilegeId;

const seedDependencies = async () => {
    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Prueba Delete Blacklist IT",
            location: "Test Location",
            phone_number: "4421234568",
            description: "Casa usada solo para tests de integración de delete blacklist",
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
        where: { name: "test-role-delete-blacklist" },
        update: {},
        create: {
            role_id: TEST_TARGET_ROLE_ID,
            name: "test-role-delete-blacklist",
        },
    });
    testTargetRoleId = targetRole.role_id;

    const priv = await prisma.privileges.upsert({
        where: { name: PRIVILEGES.REMOVE_FROM_BLACKLIST },
        update: {},
        create: {
            privilege_id: TEST_PRIVILEGE_ID,
            name: PRIVILEGES.REMOVE_FROM_BLACKLIST,
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
            surname: "Prueba Delete",
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

const createTargetEmployeeWithBlacklist = async (overrides = {}) => {
    await prisma.employee.create({
        data: {
            employee_id: TEST_TARGET_ID,
            house_id: TEST_HOUSE_ID,
            role_id: testTargetRoleId,
            name: "Luis",
            surname: "Pérez Delete",
            email: TEST_TARGET_EMAIL,
            password: "hashed",
            curp: TEST_TARGET_CURP,
            start_date: new Date("2024-01-01"),
            has_first_login: false,
            is_active: false,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            type: "nomina",
            ...overrides,
        },
    });

    await prisma.blacklist.create({
        data: {
            curp: TEST_TARGET_CURP,
            reason: "Falta previa",
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
            privileges: [PRIVILEGES.REMOVE_FROM_BLACKLIST],
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
        where: { role_id: { in: [testCoordinadorRoleId, testTargetRoleId].filter(Boolean) } },
    });
    await prisma.privileges.deleteMany({
        where: { name: PRIVILEGES.REMOVE_FROM_BLACKLIST },
    });
    await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
    await prisma.$disconnect();
});

describe("PATCH /blacklist/delete - integración", () => {
    it("retorna 200, elimina físicamente al empleado de la lista negra y guarda la razón en out_of_blacklist_reason", async () => {
        await createTargetEmployeeWithBlacklist();
        const token = await loginAndGetToken();

        const res = await request(app)
            .patch(`/blacklist/delete`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Se aclaró el malentendido" });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("curp", TEST_TARGET_CURP);

        const entry = await prisma.blacklist.findFirst({
            where: { curp: TEST_TARGET_CURP },
        });
        expect(entry).toBeNull();

        const employee = await prisma.employee.findUnique({
            where: { employee_id: TEST_TARGET_ID },
        });
        expect(employee.out_of_blacklist_reason).toBe("Se aclaró el malentendido");
    });

    it("genera el log de la acción en BD", async () => {
        await createTargetEmployeeWithBlacklist();
        const token = await loginAndGetToken();

        await request(app)
            .patch(`/blacklist/delete`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Se aclaró el malentendido" });

        const log = await prisma.logs.findFirst({
            where: {
                employee_id: TEST_COORDINADOR_ID,
                action_id: LOG_ACTIONS.BLACKLIST_REMOVED,
            },
        });
        expect(log).not.toBeNull();
        expect(log.affected).toContain(TEST_TARGET_CURP);
    });

    it("retorna 401 sin token de sesión", async () => {
        await createTargetEmployeeWithBlacklist();

        const res = await request(app)
            .patch(`/blacklist/delete`)
            .send({ curp: TEST_TARGET_CURP, reason: "Justificación" });

        expect(res.statusCode).toBe(401);
    });

    it("retorna 403 si el rol no es Administrador o Coordinador", async () => {
        await createTargetEmployeeWithBlacklist();
        const token = generateSessionToken({ role: ROLES.MAINTENANCE });

        const res = await request(app)
            .patch(`/blacklist/delete`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Justificación" });

        expect(res.statusCode).toBe(403);
    });

    it("retorna 403 si el empleado objetivo pertenece a otra casa", async () => {
        const otraHouseId = randomUUID();
        await prisma.house.create({
            data: {
                house_id: otraHouseId,
                name: "Otra Casa Delete IT",
                location: "Otro lugar",
                phone_number: "4428888888",
                description: "Casa diferente delete",
                image: "other.jpg",
            },
        });
        await createTargetEmployeeWithBlacklist({ house_id: otraHouseId });
        const token = generateSessionToken();

        const res = await request(app)
            .patch(`/blacklist/delete`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Justificación" });

        expect(res.statusCode).toBe(403);

        await prisma.blacklist.deleteMany({ where: { curp: TEST_TARGET_CURP } });
        await prisma.employee.delete({ where: { employee_id: TEST_TARGET_ID } });
        await prisma.house.delete({ where: { house_id: otraHouseId } });
    });

    it("retorna 404 si el empleado objetivo no existe", async () => {
        const token = generateSessionToken();
        const curpInexistente = "TARG900101HDFXXX99";

        const res = await request(app)
            .patch(`/blacklist/delete`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: curpInexistente, reason: "Justificación" });

        expect(res.statusCode).toBe(404);
    });

    it("retorna 409 si se intenta eliminar a un empleado que no está en la lista negra", async () => {
        await prisma.employee.create({
            data: {
                employee_id: TEST_TARGET_ID,
                house_id: TEST_HOUSE_ID,
                role_id: testTargetRoleId,
                name: "Luis",
                surname: "Limpio",
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
            },
        });
        const token = await loginAndGetToken();

        const res = await request(app)
            .patch(`/blacklist/delete`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP, reason: "Intentando sacar sin estar" });

        expect(res.statusCode).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe("El empleado no se encuentra en la lista negra");
    });

    it("retorna 400 si el parámetro curp no tiene un formato válido", async () => {
        const token = await loginAndGetToken();

        const res = await request(app)
            .patch(`/blacklist/delete`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: "esto-no-es-curp", reason: "Falta" });

        expect(res.statusCode).toBe(400);
    });

    it("retorna 400 si la razón está ausente o vacía", async () => {
        const token = await loginAndGetToken();

        const res = await request(app)
            .patch(`/blacklist/delete`)
            .set("Authorization", `Bearer ${token}`)
            .send({ curp: TEST_TARGET_CURP });

        expect(res.statusCode).toBe(400);
    });
});