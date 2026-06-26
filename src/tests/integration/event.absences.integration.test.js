const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const app = require("../../app");

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const API_PREFIX = "/event/range";

const IDS = {
    houseA: randomUUID(),
    houseB: randomUUID(),
    admin: randomUUID(),
    coordinatorA: randomUUID(),
    coordinatorB: randomUUID(),
    employee: randomUUID(),
    noWorkdaysEmployee: randomUUID(),
    otherEmployee: randomUUID(),
    absenceType: randomUUID(),
    eventType: randomUUID(),
    freeGlobalA: randomUUID(),
    freeGlobalDuplicate: randomUUID(),
    nonFreeGlobal: randomUUID(),
    ordinaryHouseEvent: randomUUID(),
    absenceMain: randomUUID(),
    absenceWeekend: randomUUID(),
    absenceNonFreeGlobal: randomUUID(),
    absenceDeleted: randomUUID(),
    absenceNoWorkdays: randomUUID(),
};

const makeUTCDate = (year, month, day) => {
    return new Date(Date.UTC(year, month - 1, day));
};

const makeUTCTime = (hour, minute = 0) => {
    return new Date(Date.UTC(2026, 0, 1, hour, minute));
};

const makeUTCDateTime = (year, month, day, hour, minute = 0) => {
    return new Date(Date.UTC(year, month - 1, day, hour, minute));
};

const sign = (overrides = {}) => {
    const id = overrides.id || IDS.admin;

    return jwt.sign(
        {
            id,
            employeeId: id,
            houseId: IDS.houseA,
            role: "Administrador",
            tokenType: "SESSION",
            privileges: ["viewEvents"],
            ...overrides,
        },
        JWT_SECRET,
        { expiresIn: "1h" },
    );
};

const route = (
    employeeId = IDS.employee,
    startDate = "2026-05-01",
    endDate = "2026-05-08",
) => {
    return `${API_PREFIX}/${employeeId}/${startDate}/${endDate}`;
};

const findEvent = (events, predicate) => {
    return events.find(predicate);
};

const findAbsence = (events, absenceId) => {
    return findEvent(events, (event) => event.absenceId === absenceId);
};

const getRoleId = async (name) => {
    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) return existingRole.role_id;

    const role = await prisma.role.create({
        data: {
            role_id: randomUUID(),
            name,
        },
    });

    return role.role_id;
};

const getWorkdayId = async (name) => {
    const existingWorkday = await prisma.workday.findUnique({
        where: { name },
    });
    if (existingWorkday) return existingWorkday.workday_id;

    const workday = await prisma.workday.create({
        data: {
            workday_id: randomUUID(),
            name,
        },
    });

    return workday.workday_id;
};

const employeeData = ({
    employeeId,
    houseId,
    roleId,
    email,
    curp,
    name = "Evento",
    surname = "Ausencias",
}) => {
    return {
        employee_id: employeeId,
        house_id: houseId,
        role_id: roleId,
        name,
        surname,
        is_active: true,
        email,
        password: "hashed",
        has_first_login: false,
        is_active_two_factor_auth: false,
        failed_login_attempts: 0,
        failed_two_factor_auth_attempts: 0,
        curp,
        birth_date: makeUTCDate(1990, 1, 1),
        start_date: makeUTCDate(2024, 1, 1),
        type: "nomina",
    };
};

const clean = async () => {
    const employeeIds = [
        IDS.admin,
        IDS.coordinatorA,
        IDS.coordinatorB,
        IDS.employee,
        IDS.noWorkdaysEmployee,
        IDS.otherEmployee,
    ];

    await prisma.logs.deleteMany({
        where: { employee_id: { in: employeeIds } },
    });
    await prisma.absence.deleteMany({
        where: {
            absence_id: {
                in: [
                    IDS.absenceMain,
                    IDS.absenceWeekend,
                    IDS.absenceNonFreeGlobal,
                    IDS.absenceDeleted,
                    IDS.absenceNoWorkdays,
                ],
            },
        },
    });
    await prisma.vacations_request.deleteMany({
        where: { employee_id: { in: employeeIds } },
    });
    await prisma.employee_shift.deleteMany({
        where: { employee_id: { in: employeeIds } },
    });
    await prisma.employee_personal_event.deleteMany({
        where: { employee_id: { in: employeeIds } },
    });
    await prisma.house_event.deleteMany({
        where: { house_event_id: IDS.ordinaryHouseEvent },
    });
    await prisma.global_event.deleteMany({
        where: {
            global_event_id: {
                in: [
                    IDS.freeGlobalA,
                    IDS.freeGlobalDuplicate,
                    IDS.nonFreeGlobal,
                ],
            },
        },
    });
    await prisma.employee.deleteMany({
        where: { employee_id: { in: employeeIds } },
    });
    await prisma.event_type.deleteMany({
        where: { event_type_id: IDS.eventType },
    });
    await prisma.absence_type.deleteMany({
        where: { absence_type_id: IDS.absenceType },
    });
    await prisma.house.deleteMany({
        where: { house_id: { in: [IDS.houseA, IDS.houseB] } },
    });
};

const seed = async () => {
    const adminRoleId = await getRoleId("Administrador");
    const coordinatorRoleId = await getRoleId("Coordinador");
    const employeeRoleId = await getRoleId("Mantenimiento");

    await prisma.house.createMany({
        data: [
            {
                house_id: IDS.houseA,
                name: `Ausencias Casa A ${IDS.houseA.slice(0, 8)}`,
                location: "Queretaro",
                phone_number: "4421000001",
                description: "Casa A para pruebas de ausencias",
                image: "test-a.jpg",
            },
            {
                house_id: IDS.houseB,
                name: `Ausencias Casa B ${IDS.houseB.slice(0, 8)}`,
                location: "Queretaro",
                phone_number: "4421000002",
                description: "Casa B para pruebas de ausencias",
                image: "test-b.jpg",
            },
        ],
    });

    await prisma.employee.createMany({
        data: [
            employeeData({
                employeeId: IDS.admin,
                houseId: IDS.houseA,
                roleId: adminRoleId,
                email: "event.abs.admin@test.com",
                curp: "MOXC801103MBSCYE80",
                name: "Administrador",
            }),
            employeeData({
                employeeId: IDS.coordinatorA,
                houseId: IDS.houseA,
                roleId: coordinatorRoleId,
                email: "event.abs.coord.a@test.com",
                curp: "MOXC801103MBSCYE81",
                name: "CoordA",
            }),
            employeeData({
                employeeId: IDS.coordinatorB,
                houseId: IDS.houseB,
                roleId: coordinatorRoleId,
                email: "event.abs.coord.b@test.com",
                curp: "MOXC801103MBSCYE82",
                name: "CoordB",
            }),
            employeeData({
                employeeId: IDS.employee,
                houseId: IDS.houseA,
                roleId: employeeRoleId,
                email: "event.abs.employee@test.com",
                curp: "MOXC801103MBSCYE83",
                name: "Ana",
                surname: "Calendario",
            }),
            employeeData({
                employeeId: IDS.noWorkdaysEmployee,
                houseId: IDS.houseA,
                roleId: employeeRoleId,
                email: "event.abs.nowork@test.com",
                curp: "MOXC801103MBSCYE84",
                name: "Sin",
                surname: "Horario",
            }),
            employeeData({
                employeeId: IDS.otherEmployee,
                houseId: IDS.houseB,
                roleId: employeeRoleId,
                email: "event.abs.other@test.com",
                curp: "MOXC801103MBSCYE85",
                name: "Otra",
                surname: "Casa",
            }),
        ],
    });

    const monday = await getWorkdayId("Lunes");
    const tuesday = await getWorkdayId("Martes");
    const friday = await getWorkdayId("Viernes");

    await prisma.employee_shift.createMany({
        data: [monday, tuesday, friday].map((workdayId) => ({
            shift_id: randomUUID(),
                start_workday_id: workdayId,
                end_workday_id: workdayId,
                employee_id: IDS.employee,
                start: makeUTCTime(9),
                end: makeUTCTime(18),
                is_all_day: false,
            })),
    });

    await prisma.event_type.create({
        data: {
            event_type_id: IDS.eventType,
            name: `EVABS${IDS.eventType.slice(0, 8)}`,
        },
    });

    await prisma.absence_type.create({
        data: {
            absence_type_id: IDS.absenceType,
            name: `ABS${IDS.absenceType.slice(0, 8)}`,
        },
    });

    await prisma.global_event.createMany({
        data: [
            {
                global_event_id: IDS.freeGlobalA,
                event_type_id: IDS.eventType,
                start: makeUTCDateTime(2026, 5, 4, 9),
                end: makeUTCDateTime(2026, 5, 4, 18),
                name: "Descanso global libre",
                description: "Debe descontar un dia habil",
                all_day: false,
                is_free_day: true,
            },
            {
                global_event_id: IDS.freeGlobalDuplicate,
                event_type_id: IDS.eventType,
                start: makeUTCDateTime(2026, 5, 4, 10),
                end: makeUTCDateTime(2026, 5, 4, 12),
                name: "Descanso global duplicado",
                description: "No debe descontar dos veces el mismo dia",
                all_day: false,
                is_free_day: true,
            },
            {
                global_event_id: IDS.nonFreeGlobal,
                event_type_id: IDS.eventType,
                start: makeUTCDateTime(2026, 5, 5, 10),
                end: makeUTCDateTime(2026, 5, 5, 12),
                name: "Global no libre",
                description: "No debe descontar dias",
                all_day: false,
                is_free_day: false,
            },
        ],
    });

    await prisma.house_event.create({
        data: {
            house_event_id: IDS.ordinaryHouseEvent,
            event_type_id: IDS.eventType,
            house_id: IDS.houseA,
            start: makeUTCDateTime(2026, 5, 5, 8),
            end: makeUTCDateTime(2026, 5, 5, 10),
            name: "Evento ordinario casa",
            description: "No descuenta mientras no tenga is_free_day",
            all_day: false,
            is_free_day: false,
        },
    });

    await prisma.absence.createMany({
        data: [
            {
                absence_id: IDS.absenceMain,
                employee_id: IDS.employee,
                absence_type_id: IDS.absenceType,
                start: makeUTCDate(2026, 5, 1),
                end: makeUTCDate(2026, 5, 5),
                description: "Ausencia de viernes a martes",
                url: "https://example.com/absence-main.pdf",
                is_deleted: false,
            },
            {
                absence_id: IDS.absenceWeekend,
                employee_id: IDS.employee,
                absence_type_id: IDS.absenceType,
                start: makeUTCDate(2026, 5, 2),
                end: makeUTCDate(2026, 5, 3),
                description: "Ausencia solo en fin de semana",
                url: "",
                is_deleted: false,
            },
            {
                absence_id: IDS.absenceNonFreeGlobal,
                employee_id: IDS.employee,
                absence_type_id: IDS.absenceType,
                start: makeUTCDate(2026, 5, 5),
                end: makeUTCDate(2026, 5, 5),
                description: "Ausencia con global no libre",
                url: "",
                is_deleted: false,
            },
            {
                absence_id: IDS.absenceDeleted,
                employee_id: IDS.employee,
                absence_type_id: IDS.absenceType,
                start: makeUTCDate(2026, 5, 5),
                end: makeUTCDate(2026, 5, 5),
                description: "Ausencia borrada",
                url: "",
                is_deleted: true,
            },
            {
                absence_id: IDS.absenceNoWorkdays,
                employee_id: IDS.noWorkdaysEmployee,
                absence_type_id: IDS.absenceType,
                start: makeUTCDate(2026, 5, 1),
                end: makeUTCDate(2026, 5, 5),
                description: "Empleado sin dias laborales",
                url: "",
                is_deleted: false,
            },
        ],
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

describe(`GET ${API_PREFIX}/:id/:startDate/:endDate - absences calendar`, () => {
    describe("Comportamiento esperado y dias habiles", () => {
        it("retorna ausencias y calcula usedDays descontando globales libres una sola vez", async () => {
            const res = await request(app)
                .get(route())
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.events)).toBe(true);

            const mainAbsence = findAbsence(
                res.body.data.events,
                IDS.absenceMain,
            );
            expect(mainAbsence).toMatchObject({
                absenceId: IDS.absenceMain,
                employeeId: IDS.employee,
                name: "Ana Calendario",
                curp: "MOXC801103MBSCYE83",
                subtitle: "MOXC801103MBSCYE83",
                focus: "ausencias",
                scope: "personal",
                type: expect.stringMatching(/^ABS/),
                description: "Ausencia de viernes a martes",
                link: "https://example.com/absence-main.pdf",
                usedDays: 2,
                allDay: true,
            });

            expect(new Date(mainAbsence.startDate).toISOString()).toContain(
                "2026-05-01",
            );
            expect(new Date(mainAbsence.endDate).toISOString()).toContain(
                "2026-05-05",
            );
            expect(new Date(mainAbsence.end).toISOString()).toContain(
                "2026-05-06",
            );
        });

        it("calcula cero usedDays cuando la ausencia cae solo en dias no laborales", async () => {
            const res = await request(app)
                .get(route(IDS.employee, "2026-05-02", "2026-05-03"))
                .set(
                    "Authorization",
                    `Bearer ${sign({
                        id: IDS.employee,
                        employeeId: IDS.employee,
                        role: "Mantenimiento",
                    })}`,
                );

            expect(res.statusCode).toBe(200);
            expect(
                findAbsence(res.body.data.events, IDS.absenceWeekend),
            ).toMatchObject({
                usedDays: 0,
                description: "Ausencia solo en fin de semana",
            });
        });

        it("no descuenta global_event si is_free_day es false", async () => {
            const res = await request(app)
                .get(route(IDS.employee, "2026-05-05", "2026-05-05"))
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(200);
            expect(
                findAbsence(res.body.data.events, IDS.absenceNonFreeGlobal),
            ).toMatchObject({
                usedDays: 1,
                description: "Ausencia con global no libre",
            });
        });

        it("regresa ausencias que traslapan parcialmente el rango consultado", async () => {
            const res = await request(app)
                .get(route(IDS.employee, "2026-05-03", "2026-05-03"))
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(200);
            expect(
                findAbsence(res.body.data.events, IDS.absenceMain),
            ).toBeDefined();
            expect(
                findAbsence(res.body.data.events, IDS.absenceWeekend),
            ).toBeDefined();
        });

        it("Retorna 0 si el empleado tiene ausencias pero no tiene días de trabajo", async () => {
            const res = await request(app)
                .get(route(IDS.noWorkdaysEmployee))
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(200);
            expect(
                findAbsence(res.body.data.events, IDS.absenceNoWorkdays),
            ).toMatchObject({
                usedDays: 0,
            });
        });

        it("normaliza house_event sin is_free_day como false y no lo descuenta", async () => {
            const res = await request(app)
                .get(route())
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(200);

            const houseEvent = findEvent(
                res.body.data.events,
                (event) => event.scope === "house",
            );
            const mainAbsence = findAbsence(
                res.body.data.events,
                IDS.absenceMain,
            );

            expect(houseEvent).toMatchObject({
                name: "Evento ordinario casa",
                scope: "house",
                isFreeDay: false,
            });
            expect(mainAbsence.usedDays).toBe(2);
        });
    });

    describe("Validacion de fechas y parametros destructivos", () => {
        it("400 si startDate tiene formato invalido", async () => {
            const res = await request(app)
                .get(route(IDS.employee, "fecha-invalida", "2026-05-08"))
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it("400 si la fecha no existe en calendario", async () => {
            const res = await request(app)
                .get(route(IDS.employee, "2026-02-30", "2026-03-01"))
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(400);
        });

        it("406 si endDate es anterior a startDate", async () => {
            const res = await request(app)
                .get(route(IDS.employee, "2026-05-08", "2026-05-01"))
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(406);
        });

        it("404 si el empleado no existe", async () => {
            const res = await request(app)
                .get(route(randomUUID()))
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(404);
        });

        it("no ejecuta busquedas peligrosas si mandan texto raro como fecha", async () => {
            const res = await request(app)
                .get(route(IDS.employee, "%27%3Bdrop", "2026-05-08"))
                .set("Authorization", `Bearer ${sign()}`);

            expect(res.statusCode).toBe(400);
        });
    });

    describe("Autenticacion y autorizacion", () => {
        it("401 si no se envia token", async () => {
            const res = await request(app).get(route());

            expect(res.statusCode).toBe(401);
        });

        it("403 si falta privilegio viewEvents", async () => {
            const res = await request(app)
                .get(route())
                .set(
                    "Authorization",
                    `Bearer ${sign({ privileges: ["viewEmployees"] })}`,
                );

            expect(res.statusCode).toBe(403);
        });

        it("200 si el empleado consulta su propio calendario", async () => {
            const res = await request(app)
                .get(route())
                .set(
                    "Authorization",
                    `Bearer ${sign({
                        id: IDS.employee,
                        employeeId: IDS.employee,
                        role: "Mantenimiento",
                        houseId: IDS.houseA,
                    })}`,
                );

            expect(res.statusCode).toBe(200);
        });

        it("200 si coordinador consulta empleado de su misma casa", async () => {
            const res = await request(app)
                .get(route())
                .set(
                    "Authorization",
                    `Bearer ${sign({
                        id: IDS.coordinatorA,
                        employeeId: IDS.coordinatorA,
                        role: "Coordinador",
                        houseId: IDS.houseA,
                    })}`,
                );

            expect(res.statusCode).toBe(200);
        });

        it("403 si coordinador consulta empleado de otra casa", async () => {
            const res = await request(app)
                .get(route())
                .set(
                    "Authorization",
                    `Bearer ${sign({
                        id: IDS.coordinatorB,
                        employeeId: IDS.coordinatorB,
                        role: "Coordinador",
                        houseId: IDS.houseB,
                    })}`,
                );

            expect(res.statusCode).toBe(403);
        });

        it("403 si rol permitido por RBAC intenta consultar a otro empleado sin ser coordinador", async () => {
            const res = await request(app)
                .get(route())
                .set(
                    "Authorization",
                    `Bearer ${sign({
                        id: IDS.otherEmployee,
                        employeeId: IDS.otherEmployee,
                        role: "Mantenimiento",
                        houseId: IDS.houseB,
                    })}`,
                );

            expect(res.statusCode).toBe(403);
        });
    });
});
