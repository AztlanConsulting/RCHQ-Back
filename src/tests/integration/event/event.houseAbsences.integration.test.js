require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const jwt = require("jsonwebtoken");
const prisma = require("../../../prisma");
const { randomUUID } = require("crypto");
const app = require("../../../app");

const IDS = {
    houseA: randomUUID(),
    houseB: randomUUID(),
    coordinatorRole: randomUUID(),
    employeeRole: randomUUID(),
    viewEventsPrivilege: randomUUID(),
    requester: randomUUID(),
    unprivilegedEmployee: randomUUID(),
    absentEmployeeA: randomUUID(),
    absentEmployeeB: randomUUID(),
    workdayMonday: randomUUID(),
    workdayTuesday: randomUUID(),
    workdayFriday: randomUUID(),
    absenceType: randomUUID(),
    absenceA: randomUUID(),
    absenceB: randomUUID(),
    eventType: randomUUID(),
    globalFreeDay: randomUUID(),
};

const STATE = {
    createdCoordinatorRole: false,
    createdPrivilege: false,
    createdCoordinatorViewEventsRelation: false,
    createdWorkdays: {
        monday: false,
        tuesday: false,
        friday: false,
    },
};

const sign = (overrides = {}) =>
    jwt.sign(
        {
            id: IDS.requester,
            email: "coordinador@test.com",
            role: "Coordinador",
            houseId: IDS.houseA,
            privileges: ["viewEvents"],
            tokenType: "SESSION",
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );

const seed = async () => {
    await prisma.house.createMany({
        data: [
            {
                house_id: IDS.houseA,
                name: `Casa A ${IDS.houseA}`,
                location: "Queretaro",
                phone_number: "4420000001",
                description: "Casa A",
                image: "a.jpg",
            },
            {
                house_id: IDS.houseB,
                name: `Casa B ${IDS.houseB}`,
                location: "Queretaro",
                phone_number: "4420000002",
                description: "Casa B",
                image: "b.jpg",
            },
        ],
    });

    const existingPrivilege = await prisma.privileges.findUnique({
        where: { name: "viewEvents" },
    });
    if (existingPrivilege) {
        IDS.viewEventsPrivilege = existingPrivilege.privilege_id;
    } else {
        STATE.createdPrivilege = true;
        await prisma.privileges.create({
            data: {
                privilege_id: IDS.viewEventsPrivilege,
                name: "viewEvents",
            },
        });
    }

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

    await prisma.role.create({
        data: {
            role_id: IDS.employeeRole,
            name: `Empleado-${IDS.employeeRole.slice(0, 8)}`,
        },
    });

    const existingRolePrivilege = await prisma.role_privilege.findUnique({
        where: {
            role_id_privilege_id: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.viewEventsPrivilege,
            },
        },
    });

    if (!existingRolePrivilege) {
        STATE.createdCoordinatorViewEventsRelation = true;
        await prisma.role_privilege.create({
            data: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.viewEventsPrivilege,
            },
        });
    }

    await prisma.employee.createMany({
        data: [
            {
                employee_id: IDS.requester,
                house_id: IDS.houseA,
                role_id: IDS.coordinatorRole,
                name: "Carmen",
                surname: "Coordinadora",
                is_active: true,
                email: "coordinador@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "COOC900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.unprivilegedEmployee,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Pepe",
                surname: "Empleado",
                is_active: true,
                email: "empleado@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "EMPP900101HDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.absentEmployeeA,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Ana",
                surname: "CasaA",
                is_active: true,
                email: "ausencia.a@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "CASA900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.absentEmployeeB,
                house_id: IDS.houseB,
                role_id: IDS.employeeRole,
                name: "Beto",
                surname: "CasaB",
                is_active: true,
                email: "ausencia.b@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "CASB900101HDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
        ],
    });

    const monday = await prisma.workday.findUnique({
        where: { name: "Lunes" },
    });
    if (monday) {
        IDS.workdayMonday = monday.workday_id;
    } else {
        STATE.createdWorkdays.monday = true;
        await prisma.workday.create({
            data: { workday_id: IDS.workdayMonday, name: "Lunes" },
        });
    }

    const tuesday = await prisma.workday.findUnique({
        where: { name: "Martes" },
    });
    if (tuesday) {
        IDS.workdayTuesday = tuesday.workday_id;
    } else {
        STATE.createdWorkdays.tuesday = true;
        await prisma.workday.create({
            data: { workday_id: IDS.workdayTuesday, name: "Martes" },
        });
    }

    const friday = await prisma.workday.findUnique({
        where: { name: "Viernes" },
    });
    if (friday) {
        IDS.workdayFriday = friday.workday_id;
    } else {
        STATE.createdWorkdays.friday = true;
        await prisma.workday.create({
            data: { workday_id: IDS.workdayFriday, name: "Viernes" },
        });
    }

    await prisma.employee_workday.createMany({
        data: [
            {
                employee_id: IDS.absentEmployeeA,
                workday_id: IDS.workdayMonday,
                start: new Date("1970-01-01T08:00:00.000Z"),
                end: new Date("1970-01-01T16:00:00.000Z"),
            },
            {
                employee_id: IDS.absentEmployeeA,
                workday_id: IDS.workdayTuesday,
                start: new Date("1970-01-01T08:00:00.000Z"),
                end: new Date("1970-01-01T16:00:00.000Z"),
            },
            {
                employee_id: IDS.absentEmployeeA,
                workday_id: IDS.workdayFriday,
                start: new Date("1970-01-01T08:00:00.000Z"),
                end: new Date("1970-01-01T16:00:00.000Z"),
            },
        ],
    });

    await prisma.absence_type.create({
        data: {
            absence_type_id: IDS.absenceType,
            name: `Permiso-${IDS.absenceType.slice(0, 8)}`,
        },
    });

    await prisma.event_type.create({
        data: {
            event_type_id: IDS.eventType,
            name: `Evento-${IDS.eventType.slice(0, 8)}`,
        },
    });

    await prisma.global_event.create({
        data: {
            global_event_id: IDS.globalFreeDay,
            event_type_id: IDS.eventType,
            start: new Date("2026-05-15T00:00:00.000Z"),
            end: new Date("2026-05-15T23:59:00.000Z"),
            name: "Dia libre global",
            description: "No laborable",
            is_free_day: true,
            all_day: true,
        },
    });

    await prisma.absence.createMany({
        data: [
            {
                absence_id: IDS.absenceA,
                employee_id: IDS.absentEmployeeA,
                absence_type_id: IDS.absenceType,
                start: new Date("2026-05-11"),
                end: new Date("2026-05-15"),
                description: "Ausencia casa A",
                url: "https://example.com/a.pdf",
                is_deleted: false,
            },
            {
                absence_id: IDS.absenceB,
                employee_id: IDS.absentEmployeeB,
                absence_type_id: IDS.absenceType,
                start: new Date("2026-05-12"),
                end: new Date("2026-05-12"),
                description: "Ausencia casa B",
                url: "https://example.com/b.pdf",
                is_deleted: false,
            },
        ],
    });
};

const clean = async () => {
    await prisma.absence.deleteMany({
        where: {
            absence_id: { in: [IDS.absenceA, IDS.absenceB] },
        },
    });
    await prisma.global_event.deleteMany({
        where: { global_event_id: IDS.globalFreeDay },
    });
    await prisma.event_type.deleteMany({
        where: { event_type_id: IDS.eventType },
    });
    await prisma.employee_workday.deleteMany({
        where: {
            employee_id: { in: [IDS.absentEmployeeA, IDS.absentEmployeeB] },
        },
    });
    const workdayIdsToDelete = [
        ...(STATE.createdWorkdays.monday ? [IDS.workdayMonday] : []),
        ...(STATE.createdWorkdays.tuesday ? [IDS.workdayTuesday] : []),
        ...(STATE.createdWorkdays.friday ? [IDS.workdayFriday] : []),
    ];
    if (workdayIdsToDelete.length > 0) {
        await prisma.workday.deleteMany({
            where: {
                workday_id: {
                    in: workdayIdsToDelete,
                },
            },
        });
    }
    await prisma.employee.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.requester,
                    IDS.unprivilegedEmployee,
                    IDS.absentEmployeeA,
                    IDS.absentEmployeeB,
                ],
            },
        },
    });
    if (STATE.createdCoordinatorViewEventsRelation) {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: IDS.coordinatorRole,
                privilege_id: IDS.viewEventsPrivilege,
            },
        });
    }
    await prisma.absence_type.deleteMany({
        where: { absence_type_id: IDS.absenceType },
    });
    await prisma.role.deleteMany({
        where: {
            role_id: {
                in: [
                    IDS.employeeRole,
                    ...(STATE.createdCoordinatorRole
                        ? [IDS.coordinatorRole]
                        : []),
                ],
            },
        },
    });
    if (STATE.createdPrivilege) {
        await prisma.privileges.deleteMany({
            where: { privilege_id: IDS.viewEventsPrivilege },
        });
    }
    await prisma.house.deleteMany({
        where: {
            house_id: { in: [IDS.houseA, IDS.houseB] },
        },
    });
};

beforeAll(async () => {
    await clean();
    await seed();
});

afterAll(async () => {
    await clean();
    await prisma.$disconnect();
});

describe("GET /event/house/range/:startDate/:endDate", () => {
    it("401 sin token", async () => {
        const res = await request(app).get(
            "/event/house/range/2026-05-01/2026-05-31",
        );
        expect(res.statusCode).toBe(401);
    });

    it("401 con firma inválida", async () => {
        const res = await request(app)
            .get("/event/house/range/2026-05-01/2026-05-31")
            .set("Authorization", `Bearer ${sign()}broken`);

        expect(res.statusCode).toBe(401);
    });

    it("401 con token expirado", async () => {
        const token = jwt.sign(
            { id: IDS.requester, tokenType: "SESSION" },
            process.env.JWT_SECRET,
            { expiresIn: "-1s" },
        );

        const res = await request(app)
            .get("/event/house/range/2026-05-01/2026-05-31")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(401);
    });

    it("403 con tokenType incorrecto", async () => {
        const token = jwt.sign(
            { id: IDS.requester, tokenType: "REFRESH" },
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
        );

        const res = await request(app)
            .get("/event/house/range/2026-05-01/2026-05-31")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
    });

    it("404 si el id del JWT no existe en la base", async () => {
        const token = sign({ id: randomUUID() });

        const res = await request(app)
            .get("/event/house/range/2026-05-01/2026-05-31")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
    });

    it("403 si un empleado intenta escalar privilegios manipulando role y privileges en el JWT", async () => {
        const token = sign({
            id: IDS.unprivilegedEmployee,
            role: "Administrador",
            privileges: ["viewEvents"],
        });

        const res = await request(app)
            .get("/event/house/range/2026-05-01/2026-05-31")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
    });

    it("ignora houseId y role manipulados en el JWT y solo devuelve ausencias de la casa real del solicitante", async () => {
        const token = sign({
            role: "Administrador",
            houseId: IDS.houseB,
            privileges: ["viewEvents", "manageEmployees"],
        });

        const res = await request(app)
            .get("/event/house/range/2026-05-01/2026-05-31")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.events).toHaveLength(1);
        expect(res.body.data.events[0]).toMatchObject({
            absenceId: IDS.absenceA,
            employeeId: IDS.absentEmployeeA,
            name: "Ana CasaA",
            description: "Ausencia casa A",
            link: "https://example.com/a.pdf",
            isDeleted: false,
            focus: "ausencias",
            scope: "house",
            allDay: true,
            usedDays: 2,
        });
    });

    it("400 si la fecha es inválida", async () => {
        const res = await request(app)
            .get("/event/house/range/not-a-date/2026-05-31")
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(400);
    });

    it("406 si endDate es menor a startDate", async () => {
        const res = await request(app)
            .get("/event/house/range/2026-05-31/2026-05-01")
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(406);
    });
});
