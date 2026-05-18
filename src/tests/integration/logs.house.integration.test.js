require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const prisma = require("../../prisma");
const app = require("../../app");
const { seedActions } = require("../helpers/seedActions");
const { encryptLogIp } = require("../../utils/logIp");

const IDS = {
    houseA: randomUUID(),
    houseB: randomUUID(),
    coordinatorRole: randomUUID(),
    adminRole: randomUUID(),
    employeeRole: randomUUID(),
    viewLogsPrivilege: randomUUID(),
    coordinator: randomUUID(),
    unprivilegedCoordinator: randomUUID(),
    admin: randomUUID(),
    employeeA: randomUUID(),
    employeeB: randomUUID(),
    logA1: randomUUID(),
    logA2: randomUUID(),
    logA3: randomUUID(),
    personalEventA: randomUUID(),
    eventType: randomUUID(),
    logA4: randomUUID(),
    logB1: randomUUID(),
};

const STATE = {
    createdCoordinatorRole: false,
    createdAdminRole: false,
    createdPrivilege: false,
    createdCoordinatorRolePrivilege: false,
};

const sign = (overrides = {}) =>
    jwt.sign(
        {
            id: IDS.coordinator,
            email: "coord.logs@test.com",
            role: "Coordinador",
            houseId: IDS.houseA,
            privileges: ["viewLogs"],
            tokenType: "SESSION",
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );

const seed = async () => {
    await seedActions(prisma);

    await prisma.event_type.createMany({
        data: [
            {
                event_type_id: IDS.eventType,
                name: `Tipo-${IDS.eventType.slice(0, 8)}`,
            },
        ],
        skipDuplicates: true,
    });

    await prisma.house.createMany({
        data: [
            {
                house_id: IDS.houseA,
                name: `Casa A ${IDS.houseA}`,
                location: "Querétaro",
                phone_number: "4420000101",
                description: "Casa A",
                image: "a.jpg",
            },
            {
                house_id: IDS.houseB,
                name: `Casa B ${IDS.houseB}`,
                location: "Querétaro",
                phone_number: "4420000102",
                description: "Casa B",
                image: "b.jpg",
            },
        ],
    });

    const existingCoordinatorRole = await prisma.role.findUnique({
        where: { name: "Coordinador" },
    });
    if (existingCoordinatorRole) {
        IDS.coordinatorRole = existingCoordinatorRole.role_id;
    } else {
        STATE.createdCoordinatorRole = true;
        await prisma.role.create({
            data: { role_id: IDS.coordinatorRole, name: "Coordinador" },
        });
    }

    const existingAdminRole = await prisma.role.findUnique({
        where: { name: "Admin" },
    });
    if (existingAdminRole) {
        IDS.adminRole = existingAdminRole.role_id;
    } else {
        STATE.createdAdminRole = true;
        await prisma.role.create({
            data: { role_id: IDS.adminRole, name: "Admin" },
        });
    }

    await prisma.role.create({
        data: {
            role_id: IDS.employeeRole,
            name: `Empleado-${IDS.employeeRole.slice(0, 8)}`,
        },
    });

    const existingViewLogsPrivilege = await prisma.privileges.findUnique({
        where: { name: "viewLogs" },
    });
    if (existingViewLogsPrivilege) {
        IDS.viewLogsPrivilege = existingViewLogsPrivilege.privilege_id;
    } else {
        STATE.createdPrivilege = true;
        await prisma.privileges.create({
            data: {
                privilege_id: IDS.viewLogsPrivilege,
                name: "viewLogs",
            },
        });
    }

    const existingCoordinatorRolePrivilege =
        await prisma.role_privilege.findUnique({
            where: {
                role_id_privilege_id: {
                    role_id: IDS.coordinatorRole,
                    privilege_id: IDS.viewLogsPrivilege,
                },
            },
        });

    if (!existingCoordinatorRolePrivilege) {
        STATE.createdCoordinatorRolePrivilege = true;
        await prisma.role_privilege.create({
            data: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.viewLogsPrivilege,
            },
        });
    }

    await prisma.employee.createMany({
        data: [
            {
                employee_id: IDS.coordinator,
                house_id: IDS.houseA,
                role_id: IDS.coordinatorRole,
                name: "Carla",
                surname: "Coord",
                is_active: true,
                email: "coord.logs@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "COOC900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.unprivilegedCoordinator,
                house_id: IDS.houseA,
                role_id: IDS.coordinatorRole,
                name: "Uriel",
                surname: "SinPriv",
                is_active: true,
                email: "coord.nopriv@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "SIPR900101HDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.admin,
                house_id: IDS.houseA,
                role_id: IDS.adminRole,
                name: "Ada",
                surname: "Admin",
                is_active: true,
                email: "admin.logs@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "ADAD900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.employeeA,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Luis",
                surname: "CasaA",
                is_active: true,
                email: "employee.a@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "LUCA900101HDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.employeeB,
                house_id: IDS.houseB,
                role_id: IDS.employeeRole,
                name: "María",
                surname: "CasaB",
                is_active: true,
                email: "employee.b@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "MACB900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
        ],
    });

    await prisma.personal_event.create({
        data: {
            personal_event_id: IDS.personalEventA,
            event_type_id: IDS.eventType,
            date: new Date("2026-05-08"),
            start: new Date("2026-05-08T10:00:00.000Z"),
            end: new Date("2026-05-08T11:00:00.000Z"),
            name: "Visita médica",
            description: "Consulta programada",
            all_day: false,
        },
    });

    await prisma.logs.createMany({
        data: [
            {
                log_id: IDS.logA1,
                employee_id: IDS.coordinator,
                moment: new Date("2026-05-10T10:00:00.000Z"),
                action_id: "empl-001",
                affected: IDS.employeeA,
                ip_address: encryptLogIp("10.10.10.10"),
            },
            {
                log_id: IDS.logA2,
                employee_id: IDS.coordinator,
                moment: new Date("2026-05-09T09:00:00.000Z"),
                action_id: "ausn-001",
                affected: "Afectación libre",
                ip_address: encryptLogIp("10.10.10.11"),
            },
            {
                log_id: IDS.logA3,
                employee_id: IDS.coordinator,
                moment: new Date("2026-05-08T10:00:00.000Z"),
                action_id: "empl-005",
                affected: IDS.houseB,
                ip_address: encryptLogIp("10.10.10.13"),
            },
            {
                log_id: IDS.logA4,
                employee_id: IDS.coordinator,
                moment: new Date("2026-05-08T09:00:00.000Z"),
                action_id: "empl-005",
                affected: IDS.personalEventA,
                ip_address: encryptLogIp("10.10.10.14"),
            },
            {
                log_id: IDS.logB1,
                employee_id: IDS.employeeB,
                moment: new Date("2026-05-08T08:00:00.000Z"),
                action_id: "empl-005",
                affected: IDS.employeeB,
                ip_address: encryptLogIp("10.10.10.12"),
            },
        ],
    });
};

const cleanup = async () => {
    await prisma.logs.deleteMany({
        where: {
            log_id: {
                in: [IDS.logA1, IDS.logA2, IDS.logA3, IDS.logA4, IDS.logB1],
            },
        },
    });

    await prisma.personal_event.deleteMany({
        where: {
            personal_event_id: IDS.personalEventA,
        },
    });

    await prisma.event_type.deleteMany({
        where: {
            event_type_id: IDS.eventType,
        },
    });

    await prisma.employee.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.coordinator,
                    IDS.unprivilegedCoordinator,
                    IDS.admin,
                    IDS.employeeA,
                    IDS.employeeB,
                ],
            },
        },
    });

    await prisma.role.deleteMany({
        where: {
            role_id: IDS.employeeRole,
        },
    });

    if (STATE.createdCoordinatorRolePrivilege) {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.viewLogsPrivilege,
            },
        });
    }

    if (STATE.createdPrivilege) {
        await prisma.privileges.deleteMany({
            where: { privilege_id: IDS.viewLogsPrivilege },
        });
    }

    if (STATE.createdCoordinatorRole) {
        await prisma.role.deleteMany({
            where: { role_id: IDS.coordinatorRole },
        });
    }

    if (STATE.createdAdminRole) {
        await prisma.role.deleteMany({
            where: { role_id: IDS.adminRole },
        });
    }

    await prisma.house.deleteMany({
        where: {
            house_id: { in: [IDS.houseA, IDS.houseB] },
        },
    });
};

describe("GET /logs/house", () => {
    beforeAll(async () => {
        await seed();
    });

    afterAll(async () => {
        await cleanup();
        await prisma.$disconnect();
    });

    it("retorna 401 sin token", async () => {
        const res = await request(app).get("/logs/house");

        expect(res.statusCode).toBe(401);
    });

    it("retorna 403 si el rol no es coordinador", async () => {
        const res = await request(app)
            .get("/logs/house")
            .set("Authorization", `Bearer ${sign({ role: "Admin", id: IDS.admin })}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Role not allowed");
    });

    it("retorna 403 si el coordinador no tiene privilegio viewLogs", async () => {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.viewLogsPrivilege,
            },
        });

        const res = await request(app)
            .get("/logs/house")
            .set(
                "Authorization",
                `Bearer ${sign({
                    id: IDS.unprivilegedCoordinator,
                    email: "coord.nopriv@test.com",
                })}`,
            );

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toBe("Insufficient privileges");

        await prisma.role_privilege.create({
            data: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.viewLogsPrivilege,
            },
        });
    });

    it("retorna 422 con paginación inválida", async () => {
        const res = await request(app)
            .get("/logs/house?page=0&limit=abc")
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(422);
        expect(res.body.message).toBe("Parámetros inválidos");
    });

    it("retorna solo logs de la casa real del coordinador aunque manipule houseId en JWT", async () => {
        const res = await request(app)
            .get("/logs/house?page=1&limit=10")
            .set(
                "Authorization",
                `Bearer ${sign({
                    houseId: IDS.houseB,
                })}`,
            );

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.totalRecords).toBe(4);
        expect(res.body.totalPages).toBe(1);
        expect(res.body.currentPage).toBe(1);
        expect(res.body.data).toHaveLength(4);
        expect(res.body.data[0]).toMatchObject({
            responsibleName: "Carla Coord",
            responsibleCurp: "COOC900101MDFABC01",
            affectedName: "Luis CasaA",
            ipAddress: "10.10.10.10",
            action: "Empleado creado con éxito",
        });
        expect(res.body.data[1]).toMatchObject({
            affectedName: "Afectación libre",
            ipAddress: "10.10.10.11",
        });
        expect(res.body.data[2]).toMatchObject({
            affectedName: `Casa B ${IDS.houseB}`,
            ipAddress: "10.10.10.13",
        });
        expect(res.body.data[3]).toMatchObject({
            affectedName: "Visita médica",
            ipAddress: "10.10.10.14",
        });
        expect(typeof res.body.data[3].action).toBe("string");
        expect(res.body.data[3].action.length).toBeGreaterThan(0);
    });

    it("pagina los resultados", async () => {
        const res = await request(app)
            .get("/logs/house?page=2&limit=1")
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.totalRecords).toBe(4);
        expect(res.body.totalPages).toBe(4);
        expect(res.body.currentPage).toBe(2);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].affectedName).toBe("Afectación libre");
    });

});
