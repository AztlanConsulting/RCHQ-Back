require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const app = require("../../app");
const { PrismaClient } = require("@prisma/client");
const { seedActions } = require("../helpers/seedActions");

const prisma = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

const TEST_HOUSE_ID = randomUUID();
let TEST_ROLE_ADMIN_ID = randomUUID();
const TEST_ACTOR_ID = randomUUID();
const TEST_TARGET_ID = randomUUID();
const TEST_TARGET_INACT_ID = randomUUID();

const TEST_ACTOR_EMAIL = `actor.deactivate.${Date.now()}@test.com`;
const TEST_PASSWORD = "AdminPass99";

const TEST_ACTOR_CURP = `ADMC${Date.now().toString().slice(-6)}HDFRZN01`;
const TEST_TARGET_CURP = `TGTC${Date.now().toString().slice(-6)}HDFRZN02`;
const TEST_INACT_CURP = `INAC${Date.now().toString().slice(-6)}HDFRZN04`;
const TEST_NEW_INACT_CURP = `INNE${Date.now().toString().slice(-6)}HDFRZN05`;
const TEST_NO_PRIV_CURP = `NOPR${Date.now().toString().slice(-6)}HDFRZN03`;

const TEST_NEW_TARGET_ID = randomUUID();
const TEST_NO_PRIV_ACTOR_ID = randomUUID();
const TEST_NO_PRIV_EMAIL = `nopriv.${Date.now()}@test.com`;

const seedDependencies = async (hashedPassword) => {
    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: `Casa Test Deactivate ${TEST_HOUSE_ID}`,
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa de prueba deactivate",
            image: "test.jpg",
        },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: "Administrador" },
        update: {},
        create: { role_id: TEST_ROLE_ADMIN_ID, name: "Administrador" },
    });
    TEST_ROLE_ADMIN_ID = adminRole.role_id;

    const coordRole = await prisma.role.upsert({
        where: { name: "Coordinador" },
        update: {},
        create: { role_id: randomUUID(), name: "Coordinador" },
    });

    const priv = await prisma.privileges.upsert({
        where: { name: "addToBlacklist" },
        update: {},
        create: { privilege_id: randomUUID(), name: "addToBlacklist" },
    });

    await prisma.role_privilege.create({
        data: { role_id: TEST_ROLE_ADMIN_ID, privilege_id: priv.privilege_id },
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
            curp: TEST_ACTOR_CURP,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_NO_PRIV_ACTOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: coordRole.role_id,
            name: "Actor No Priv",
            surname: "Coord",
            is_active: true,
            email: TEST_NO_PRIV_EMAIL,
            password: hashedPassword,
            has_first_login: false,
            curp: TEST_NO_PRIV_CURP,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_TARGET_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ADMIN_ID,
            name: "Juan",
            surname: "Objetivo",
            is_active: true,
            email: `target.${TEST_TARGET_ID}@test.com`,
            password: hashedPassword,
            has_first_login: false,
            curp: TEST_TARGET_CURP,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_NEW_TARGET_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ADMIN_ID,
            name: "Pedro",
            surname: "Nuevo",
            is_active: true,
            email: `newtgt.${TEST_NEW_TARGET_ID}@test.com`,
            password: hashedPassword,
            has_first_login: false,
            curp: TEST_NEW_INACT_CURP,
            start_date: new Date("2022-01-01"),
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_TARGET_INACT_ID,
            house_id: TEST_HOUSE_ID,
            role_id: TEST_ROLE_ADMIN_ID,
            name: "Ana",
            surname: "Inactiva",
            is_active: false,
            email: `inact.${TEST_TARGET_INACT_ID}@test.com`,
            password: hashedPassword,
            has_first_login: false,
            curp: TEST_INACT_CURP,
            start_date: new Date("2022-01-01"),
        },
    });
};

const cleanDb = async () => {
    const allEmployeeIds = [
        TEST_ACTOR_ID,
        TEST_NO_PRIV_ACTOR_ID,
        TEST_TARGET_ID,
        TEST_NEW_TARGET_ID,
        TEST_TARGET_INACT_ID,
    ];
    await prisma.logs.deleteMany({
        where: { employee_id: { in: allEmployeeIds } },
    });
    await prisma.blacklist.deleteMany({
        where: {
            curp: {
                in: [
                    TEST_ACTOR_CURP,
                    TEST_TARGET_CURP,
                    TEST_INACT_CURP,
                    TEST_NEW_INACT_CURP,
                    TEST_NO_PRIV_CURP,
                ],
            },
        },
    });
    await prisma.employee.deleteMany({
        where: { employee_id: { in: allEmployeeIds } },
    });
    await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
};

const loginAndGetToken = async () => {
    const res = await request(app)
        .post("/auth/login")
        .send({ email: TEST_ACTOR_EMAIL, password: TEST_PASSWORD });
    return res.body.data.token;
};

describe("Flujo integración: Login → PATCH /:employeeId/deactivate", () => {
    let token;

    beforeAll(async () => {
        await cleanDb();
        await seedActions(prisma);
        const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
        await seedDependencies(hashedPassword);
        token = await loginAndGetToken();
    });

    afterAll(async () => {
        await cleanDb();
        await prisma.$disconnect();
    });

    describe("Autenticación requerida", () => {
        it("401 — sin token no puede dar de baja", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
                .send({ reason: "Renuncia" });
            expect(res.status).toBe(401);
        });
    });

    describe("Validación del schema", () => {
        it("400 — razón vacía", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "" });
            expect(res.status).toBe(400);
        });

        it("400 — razón ausente", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({});
            expect(res.status).toBe(400);
        });

        it("400 — razón supera 250 caracteres", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "a".repeat(251) });
            expect(res.status).toBe(400);
        });
    });

    describe("Validación de auto-baja", () => {
        it("400 — un usuario no puede darse de baja a sí mismo", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_ACTOR_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "Me voy" });
            expect(res.status).toBe(400);
        });
    });

    describe("Validación de privilegios (Lista Negra)", () => {
        it("403 — falla si intenta enviar addToBlacklist sin privilegios", async () => {
            const resNoPriv = await request(app)
                .post("/auth/login")
                .send({ email: TEST_NO_PRIV_EMAIL, password: TEST_PASSWORD });
            const noPrivToken = resNoPriv.body.data.token;

            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
                .set("Authorization", `Bearer ${noPrivToken}`)
                .send({ reason: "Falta grave", addToBlacklist: true });
            expect(res.status).toBe(403);
        });
    });

    describe("Empleado no encontrado", () => {
        it("404 — employeeId que no existe en la DB", async () => {
            const res = await request(app)
                .patch(`/employee/${randomUUID()}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "Renuncia" });
            expect(res.status).toBe(404);
        });
    });

    describe("Empleado ya inactivo", () => {
        it("409 — intento de dar de baja a un empleado ya inactivo", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_INACT_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "Renuncia" });
            expect(res.status).toBe(409);
        });

        it("200 — permite a un empleado ya inactivo entrar a la lista negra", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_INACT_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "Fraude", addToBlacklist: true });
            expect(res.status).toBe(200);

            const blacklistEntry = await prisma.blacklist.findUnique({
                where: { curp: TEST_INACT_CURP },
            });
            expect(blacklistEntry).not.toBeNull();
        });
    });

    describe("Baja exitosa", () => {
        it("200 — da de baja al empleado correctamente", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "Renuncia voluntaria" });
            expect(res.status).toBe(200);
            expect(res.body.message).toBe('"Juan" ha sido dado de baja');
        });

        it("el empleado queda inactivo en la DB después de la baja", async () => {
            const employee = await prisma.employee.findUnique({
                where: { employee_id: TEST_TARGET_ID },
            });
            expect(employee.is_active).toBe(false);
            expect(employee.end_date).not.toBeNull();
        });

        it("200 — da de baja al empleado y lo añade a lista negra simultáneamente", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_NEW_TARGET_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "Fraude comprobado", addToBlacklist: true });
            expect(res.status).toBe(200);

            const employee = await prisma.employee.findUnique({
                where: { employee_id: TEST_NEW_TARGET_ID },
            });
            expect(employee.is_active).toBe(false);

            const blacklistEntry = await prisma.blacklist.findUnique({
                where: { curp: TEST_NEW_INACT_CURP },
            });
            expect(blacklistEntry).not.toBeNull();
        });

        it("409 — retorna error si se intenta bloquear a alguien ya en lista negra", async () => {
            const res = await request(app)
                .patch(`/employee/${TEST_NEW_TARGET_ID}/deactivate`)
                .set("Authorization", `Bearer ${token}`)
                .send({ reason: "Otro fraude", addToBlacklist: true });
            expect(res.status).toBe(409);
            expect(res.body.message).toBe(
                "El empleado ya se encuentra en la lista negra",
            );
        });
    });

    describe("Flujo encadenado end-to-end", () => {
        it("Login → dar de baja → verificar estado en DB (debería dar 409 porque ya se dio de baja)", async () => {
            const freshToken = await loginAndGetToken();
            const res = await request(app)
                .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
                .set("Authorization", `Bearer ${freshToken}`)
                .send({ reason: "Verificación e2e" });
            expect(res.status).toBe(409);
        });
    });
});
