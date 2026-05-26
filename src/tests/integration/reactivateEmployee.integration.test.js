require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const app = require("../../app");
const { PrismaClient } = require("@prisma/client");
const { seedActions } = require("../helpers/seedActions");
const { ROLES } = require("../../utils/roles");
const PRIVILEGES = require("../../utils/privileges");

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

const TEST_HOUSE_ID = randomUUID();
let TEST_ROLE_ADMIN_ID = randomUUID();
const TEST_ACTOR_ID = randomUUID();
const TEST_COORD_ID = randomUUID();
const TEST_ACTIVE_EMPLOYEE_ID = randomUUID();
const TEST_INACTIVE_EMPLOYEE_ID = randomUUID();
const TEST_BLACKLISTED_INACTIVE_ID = randomUUID();

const TEST_ACTOR_EMAIL = `actor.reactivate.${Date.now()}@test.com`;
const TEST_COORD_EMAIL = `coord.reactivate.${Date.now()}@test.com`;
const TEST_PASSWORD = "AdminPass99";

const ts = Date.now().toString().slice(-6);
const CURP_ACTOR = `XR01${ts}HDFRZN01`;
const CURP_COORD = `XR02${ts}HDFRZN02`;
const CURP_ACTIVE = `XR03${ts}HDFRZN03`;
const CURP_INACTIVE = `XR04${ts}HDFRZN04`;
const CURP_BL_INACTIVE = `XR05${ts}HDFRZN05`;

const CURPS = [CURP_ACTOR, CURP_COORD, CURP_ACTIVE, CURP_INACTIVE, CURP_BL_INACTIVE];

const seedDependencies = async (hashedPassword) => {
    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: `Casa Reactivate ${TEST_HOUSE_ID}`,
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa prueba reactivate",
            image: "test.jpg",
        },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: ROLES.ADMIN },
        update: {},
        create: { role_id: TEST_ROLE_ADMIN_ID, name: ROLES.ADMIN },
    });
    TEST_ROLE_ADMIN_ID = adminRole.role_id;

    const coordRole = await prisma.role.upsert({
        where: { name: ROLES.COORDINATOR },
        update: {},
        create: { role_id: randomUUID(), name: ROLES.COORDINATOR },
    });

    const privManage = await prisma.privileges.upsert({
        where: { name: PRIVILEGES.MANAGE_EMPLOYEES },
        update: {},
        create: { privilege_id: randomUUID(), name: PRIVILEGES.MANAGE_EMPLOYEES },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: TEST_ROLE_ADMIN_ID,
                privilege_id: privManage.privilege_id,
            },
        },
        update: {},
        create: { role_id: TEST_ROLE_ADMIN_ID, privilege_id: privManage.privilege_id },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_ACTOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ADMIN_ID,
            name: "Actor",
            surname: "Admin",
            is_active: true,
            email: TEST_ACTOR_EMAIL,
            password: hashedPassword,
            has_first_login: false,
            curp: CURP_ACTOR,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_COORD_ID,
            house_id: TEST_HOUSE_ID,
            role_id: coordRole.role_id,
            name: "Coord",
            surname: "SinManage",
            is_active: true,
            email: TEST_COORD_EMAIL,
            password: hashedPassword,
            has_first_login: false,
            curp: CURP_COORD,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_ACTIVE_EMPLOYEE_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ADMIN_ID,
            name: "Pablo",
            surname: "Activo",
            is_active: true,
            email: `active.${TEST_ACTIVE_EMPLOYEE_ID}@test.com`,
            password: hashedPassword,
            has_first_login: false,
            curp: CURP_ACTIVE,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_INACTIVE_EMPLOYEE_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ADMIN_ID,
            name: "Ines",
            surname: "Inactiva",
            is_active: false,
            email: `inactive.${TEST_INACTIVE_EMPLOYEE_ID}@test.com`,
            password: hashedPassword,
            has_first_login: false,
            curp: CURP_INACTIVE,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_BLACKLISTED_INACTIVE_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ADMIN_ID,
            name: "Blanca",
            surname: "ListaNegra",
            is_active: false,
            email: `bl.${TEST_BLACKLISTED_INACTIVE_ID}@test.com`,
            password: hashedPassword,
            has_first_login: false,
            curp: CURP_BL_INACTIVE,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.blacklist.create({
        data: { curp: CURP_BL_INACTIVE, reason: "Prueba integración reactivate" },
    });
};

const cleanDb = async () => {
    const ids = [
        TEST_ACTOR_ID,
        TEST_COORD_ID,
        TEST_ACTIVE_EMPLOYEE_ID,
        TEST_INACTIVE_EMPLOYEE_ID,
        TEST_BLACKLISTED_INACTIVE_ID,
    ];
    await prisma.logs.deleteMany({ where: { employee_id: { in: ids } } });
    await prisma.blacklist.deleteMany({ where: { curp: { in: CURPS } } });
    await prisma.employee.deleteMany({ where: { employee_id: { in: ids } } });
    await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
};

const loginAsAdmin = async () => {
    const res = await request(app)
        .post("/auth/login")
        .send({ email: TEST_ACTOR_EMAIL, password: TEST_PASSWORD });
    return res.body.data.token;
};

const loginAsCoord = async () => {
    const res = await request(app)
        .post("/auth/login")
        .send({ email: TEST_COORD_EMAIL, password: TEST_PASSWORD });
    return res.body.data.token;
};

describe("Integración: PATCH /employee/:employeeId/reactivate", () => {
    let adminToken;

    beforeAll(async () => {
        await cleanDb();
        await seedActions(prisma);
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
        await seedDependencies(hashedPassword);
        adminToken = await loginAsAdmin();
    });

    afterAll(async () => {
        await cleanDb();
        await prisma.$disconnect();
    });

    describe("Autenticación y privilegios", () => {
        it("401 — sin token", async () => {
            const res = await request(app).patch(
                `/employee/${TEST_INACTIVE_EMPLOYEE_ID}/reactivate`,
            );
            expect(res.status).toBe(401);
        });

        it("403 — coordinador sin privilegio manageEmployees", async () => {
            const coordToken = await loginAsCoord();
            const res = await request(app)
                .patch(`/employee/${TEST_INACTIVE_EMPLOYEE_ID}/reactivate`)
                .set("Authorization", `Bearer ${coordToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe("Reglas de negocio", () => {
        it("404 — empleado inexistente", async () => {
            const res = await request(app)
                .patch(`/employee/${randomUUID()}/reactivate`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });

        it("400 — no puede reactivarse a sí mismo", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_ACTOR_ID}/reactivate`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/ti mismo/i);
        });

        it("409 — empleado ya activo", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_ACTIVE_EMPLOYEE_ID}/reactivate`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/ya está activo/i);
        });

        it("409 — empleado inactivo en lista negra", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_BLACKLISTED_INACTIVE_ID}/reactivate`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(409);
            expect(res.body.message).toMatch(/lista negra/i);
        });
    });

    describe("Reactivación exitosa", () => {
        it("200 — reactiva empleado inactivo", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_INACTIVE_EMPLOYEE_ID}/reactivate`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('"Ines" ha sido reactivado');

            const row = await prisma.employee.findUnique({
                where: { employee_id: TEST_INACTIVE_EMPLOYEE_ID },
            });
            expect(row.is_active).toBe(true);
        });

        it("409 — segundo PATCH al mismo empleado tras reactivarlo", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_INACTIVE_EMPLOYEE_ID}/reactivate`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(409);
        });
    });
});
