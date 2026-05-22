const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const app = require("../../app");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const TODAY = new Date();
const START_DATE = new Date(
    Date.UTC(
        TODAY.getUTCFullYear(),
        TODAY.getUTCMonth(),
        TODAY.getUTCDate() + 2,
    ),
);
const END_DATE = new Date(
    Date.UTC(
        TODAY.getUTCFullYear(),
        TODAY.getUTCMonth(),
        TODAY.getUTCDate() + 8,
    ),
);

const IDS = {
    house: randomUUID(),
    roleAdmin: randomUUID(),
    employeeAdmin: randomUUID(),
    roleCoordinator: randomUUID(),
    employeeCoordinator: randomUUID(),
    roleCook: randomUUID(),
    employeeCook: randomUUID(),
    doc: randomUUID(),
    workdayLunes: randomUUID(),
    workdayMartes: randomUUID(),
    workdayMiercoles: randomUUID(),
    workdayJueves: randomUUID(),
    workdayViernes: randomUUID(),
    globalFreeEventType: randomUUID(),
    houseFreeEventType: randomUUID(),
    remainingFreeEventType: randomUUID(),
};

const empAdminBase = {
    house_id: IDS.house,
    role_id: IDS.roleAdmin,
    password: "hashed",
    name: "Test",
    surname: "User",
    start_date: new Date(Date.UTC(2022, 0, 1)),
    is_active: true,
    has_first_login: true,
    type: "nomina",
    email: "adminVacation@test.com",
    curp: "VACM000000000001AB",
};

const empCoordBase = {
    house_id: IDS.house,
    role_id: IDS.roleCoordinator,
    password: "hashed",
    name: "Test",
    surname: "User",
    start_date: new Date(Date.UTC(2022, 0, 1)),
    is_active: true,
    has_first_login: true,
    type: "nomina",
    email: "coordVacation@test.com",
    curp: "VACM000000000002AB",
};

const empCookBase = {
    house_id: IDS.house,
    role_id: IDS.roleAdmin,
    password: "hashed",
    name: "Test",
    surname: "User",
    start_date: new Date(Date.UTC(2022, 0, 1)),
    is_active: true,
    has_first_login: true,
    type: "nomina",
    email: "cookVacation@test.com",
    curp: "VACM000000000003AB",
};

const sign = (employeeId, roleName) => {
    return jwt.sign(
        {
            id: employeeId,
            houseId: IDS.house,
            role: roleName,
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
};

const dateOnly = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);

    return nextDate;
};

const localDateRangeToUtcEventRange = (startDate, endDate) => {
    const endDateUtc = new Date(`${endDate}T00:00:00.000Z`);
    endDateUtc.setUTCDate(endDateUtc.getUTCDate() + 1);

    return {
        start: new Date(`${startDate}T06:00:00.000Z`),
        end: new Date(`${dateOnly(endDateUtc)}T05:59:00.000Z`),
    };
};

const createEventType = async (eventTypeId, name) => {
    await prisma.event_type.upsert({
        where: { name },
        update: {},
        create: {
            event_type_id: eventTypeId,
            name,
        },
    });
};

const seed = async () => {
    await prisma.workday.upsert({
        where: { name: "Lunes" },
        update: {},
        create: {
            name: "Lunes",
            workday_id: IDS.workdayLunes,
        }
    });

    await prisma.workday.upsert({
        where: { name: "Martes" },
        update: {},
        create: {
            name: "Martes",
            workday_id: IDS.workdayMartes,
        }
    });

    await prisma.workday.upsert({
        where: { name: "Miércoles" },
        update: {},
        create: {
            name: "Miércoles",
            workday_id: IDS.workdayMiercoles,
        }
    });

    await prisma.workday.upsert({
        where: { name: "Jueves" },
        update: {},
        create: {
            name: "Jueves",
            workday_id: IDS.workdayJueves,
        }
    });

    await prisma.workday.upsert({
        where: { name: "Viernes" },
        update: {},
        create: {
            name: "Viernes",
            workday_id: IDS.workdayViernes,
        }
    });
    
    await prisma.house.upsert({
        where: { house_id: IDS.house },
        update: {},
        create: {
            house_id: IDS.house,
            name: `Vacation Test House ${IDS.house}`,
            location: "Loc",
            phone_number: "4420001122",
            description: "test",
            image: "img.jpg",
        },
    });

    const roleAdmin = await prisma.role.upsert({
        where: { name: "Administrador" },
        update: {},
        create: {
            role_id: IDS.roleAdmin,
            name: "Administrador",
        },
    });
    IDS.roleAdmin = roleAdmin.role_id;
    empAdminBase.role_id = roleAdmin.role_id;

    const roleCoord = await prisma.role.upsert({
        where: { name: "Coordinador" },
        update: {},
        create: {
            role_id: IDS.roleCoordinator,
            name: "Coordinador",
        },
    });
    IDS.roleCoordinator = roleCoord.role_id;
    empCoordBase.role_id = roleCoord.role_id;

    const roleCook = await prisma.role.upsert({
        where: { name: "Cocinero" },
        update: {},
        create: {
            role_id: IDS.roleCook,
            name: "Cocinero",
        },
    });
    IDS.roleCook = roleCook.role_id;
    empCookBase.role_id = roleCook.role_id;

    await prisma.employee.upsert({
        where: { employee_id: IDS.employeeAdmin },
        update: {},
        create: {
            employee_id: IDS.employeeAdmin,
            ...empAdminBase,
        },
    });

    await prisma.employee.upsert({
        where: { employee_id: IDS.employeeCoordinator },
        update: {},
        create: {
            employee_id: IDS.employeeCoordinator,
            ...empCoordBase,
        },
    });

    await prisma.employee.upsert({
        where: { employee_id: IDS.employeeCook },
        update: {},
        create: {
            employee_id: IDS.employeeCook,
            ...empCookBase,
        },
    });
};

const clean = async () => {
    await prisma.global_event.deleteMany({
        where: {
            event_type_id: {
                in: [
                    IDS.globalFreeEventType,
                    IDS.houseFreeEventType,
                    IDS.remainingFreeEventType,
                ],
            },
        },
    });

    await prisma.house_event.deleteMany({
        where: {
            event_type_id: {
                in: [
                    IDS.globalFreeEventType,
                    IDS.houseFreeEventType,
                    IDS.remainingFreeEventType,
                ],
            },
        },
    });

    await prisma.event_type.deleteMany({
        where: {
            event_type_id: {
                in: [
                    IDS.globalFreeEventType,
                    IDS.houseFreeEventType,
                    IDS.remainingFreeEventType,
                ],
            },
        },
    });

    await prisma.logs.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.employeeAdmin,
                    IDS.employeeCoordinator,
                    IDS.employeeCook,
                ],
            },
        },
    });
    await prisma.vacations_request.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.employeeAdmin,
                    IDS.employeeCoordinator,
                    IDS.employeeCook,
                ],
            },
        },
    });
    await prisma.employee_workday.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.employeeAdmin,
                    IDS.employeeCoordinator,
                    IDS.employeeCook,
                ],
            },
        },
    });
    await prisma.workday.deleteMany({
        where: {
            workday_id: {
                in: [
                    IDS.workdayLunes,
                    IDS.workdayMartes,
                    IDS.workdayMiercoles,
                    IDS.workdayJueves,
                    IDS.workdayViernes,
                ]
            }
        }
    });
    await prisma.employee.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.employeeAdmin,
                    IDS.employeeCoordinator,
                    IDS.employeeCook,
                ],
            },
        },
    });
    await prisma.house.deleteMany({ where: { house_id: IDS.house } });
};

describe("Flujo integración /vacation/request", () => {
    beforeAll(async () => {
        await clean();
        await seed();
    });

    afterAll(async () => {
        await clean();
        await prisma.$disconnect();
    });

    describe("PASO 1 - GET /vacation/remaining/", () => {
        it("Empleado obtiene sus propias vacaciones", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");
            const res = await request(app)
                .get(`/vacation/remaining/${IDS.employeeCook}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.remainingVacations).toBe(18);
            expect(res.body.data.startDate).toBe(
                new Date(Date.UTC(2026, 0, 1)).toISOString(),
            );
            expect(res.body.data.endDate).toBe(
                new Date(Date.UTC(2026, 11, 31)).toISOString(),
            );
        });

        it("Coordinador obtiene las vacaciones de un empleado en su casa", async () => {
            const token = sign(IDS.employeeCoordinator, "Coordinador");
            const res = await request(app)
                .get(`/vacation/remaining/${IDS.employeeCook}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.remainingVacations).toBe(18);
            expect(res.body.data.startDate).toBe(
                new Date(Date.UTC(2026, 0, 1)).toISOString(),
            );
            expect(res.body.data.endDate).toBe(
                new Date(Date.UTC(2026, 11, 31)).toISOString(),
            );
        });

        it("Administrador obtiene las vacaciones de un empleado", async () => {
            const token = sign(IDS.employeeAdmin, "Administrador");
            const res = await request(app)
                .get(`/vacation/remaining/${IDS.employeeCook}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.remainingVacations).toBe(18);
            expect(res.body.data.startDate).toBe(
                new Date(Date.UTC(2026, 0, 1)).toISOString(),
            );
            expect(res.body.data.endDate).toBe(
                new Date(Date.UTC(2026, 11, 31)).toISOString(),
            );
        });
    });

    describe("PASO 2 - GET /vacation/request", () => {
        it("Empleado manda solicitud sin parámetros", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");
            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(400);
            expect(res.body.message).toBe(
                "Las fechas son requeridas y tienen que estar en formato YYYY-MM-DD",
            );
        });

        it("Empleado manda solicitud con otros parámetros", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");
            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    variable: 123,
                    dummy: "data",
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe(
                "Las fechas son requeridas y tienen que estar en formato YYYY-MM-DD",
            );
        });

        it("Empleado manda solicitud con fechas en otro formato", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");
            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: "2020/10/10",
                    endDate: "2020/10/10",
                });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe(
                "Las fechas son requeridas y tienen que estar en formato YYYY-MM-DD",
            );
        });

        it("Manda error por falta de días de trabajo", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = dateOnly(START_DATE);
            const endDate = dateOnly(END_DATE);

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "Se necesitan tener registrados los días de trabajo",
            );
        });

        it("Envío correcto", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = dateOnly(START_DATE);
            const endDate = dateOnly(END_DATE);

            const workDays = [
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
            ];
            for (const workDay of workDays) {
                await prisma.employee_workday.create({
                    data: {
                        employee: {
                            connect: { employee_id: IDS.employeeCook },
                        },
                        workday: {
                            connect: { name: workDay },
                        },
                        start: new Date("1970-01-01T09:00:00Z"),
                        end: new Date("1970-01-01T18:00:00Z"),
                    },
                });
            }

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe(
                "Se solicitaron las vacaciones de forma correcta",
            );
        });

        it("Pedir solo un día de vacaciones", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = "2026-10-13";

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: startDate,
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe(
                "Se solicitaron las vacaciones de forma correcta",
            );
        });

        it("Error al pedir vacaciones dentro de unas ya existentes", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = dateOnly(addDays(START_DATE, 1));
            const endDate = dateOnly(addDays(END_DATE, -1));

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "Ya hay una solicitud de vacaciones cubriendo los días solicitados",
            );
        });

        it("Error al pedir vacaciones con otras vacaciones dentro del rango", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = dateOnly(addDays(START_DATE, -1));
            const endDate = dateOnly(addDays(END_DATE, 1));

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "Ya hay una solicitud de vacaciones cubriendo los días solicitados",
            );
        });

        it("Error al pedir vacaciones para el mismo día", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = dateOnly(TODAY);

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: startDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "No se pueden pedir vacaciones en el pasado ni para el mismo día",
            );
        });

        it("Error al pedir vacaciones en el pasado", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = dateOnly(addDays(TODAY, -5));

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: startDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "No se pueden pedir vacaciones en el pasado ni para el mismo día",
            );
        });

        it("Error al pedir vacaciones fuera del periodo actual", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = dateOnly(new Date(Date.UTC(
                START_DATE.getUTCFullYear() + 1,
                START_DATE.getUTCMonth(),
                START_DATE.getUTCDate() - 1,
            )));
            const endDate = dateOnly(new Date(Date.UTC(
                END_DATE.getUTCFullYear() + 1,
                END_DATE.getUTCMonth(),
                END_DATE.getUTCDate() + 1,
            )));

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "No se pueden solicitar vacaciones fuera del periodo actual de trabajo",
            );
        });

        it("Error al tener la fecha de inicio posterior a la de final", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const endDate = dateOnly(START_DATE);
            const startDate = dateOnly(END_DATE);

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "No se puede tener una fecha de inicio posterior a la de finalización",
            );
        });

        it("Error al no pedir días hábiles", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = "2026-08-08";

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: startDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
            );
        });

        it("Manda error si no hay días hábiles debido a días feriados causados por eventos globales", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");
            const startDate = "2026-09-14";
            const endDate = "2026-09-18";
            const eventRange = localDateRangeToUtcEventRange(startDate, endDate);

            await createEventType(
                IDS.globalFreeEventType,
                `Vac glob ${IDS.globalFreeEventType.slice(0, 8)}`,
            );

            await prisma.global_event.create({
                data: {
                    global_event_id: randomUUID(),
                    event_type_id: IDS.globalFreeEventType,
                    start: eventRange.start,
                    end: eventRange.end,
                    name: "Vacación global libre",
                    description: "Días inhábiles como eventos globales",
                    all_day: true,
                    is_free_day: true,
                },
            });

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate,
                    endDate,
                });

            const vacationInDb = await prisma.vacations_request.findFirst({
                where: {
                    employee_id: IDS.employeeCook,
                    start: new Date(`${startDate}T00:00:00.000Z`),
                    end: new Date(`${endDate}T00:00:00.000Z`),
                },
            });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
            );
            expect(vacationInDb).toBeNull();
        });

        it("Manda error si no hay días hábiles debido a días feriados causados por eventos de casa", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");
            const startDate = "2026-09-21";
            const endDate = "2026-09-25";
            const eventRange = localDateRangeToUtcEventRange(startDate, endDate);

            await createEventType(
                IDS.houseFreeEventType,
                `Vac casa ${IDS.houseFreeEventType.slice(0, 8)}`,
            );

            await prisma.house_event.create({
                data: {
                    house_event_id: randomUUID(),
                    house_id: IDS.house,
                    event_type_id: IDS.houseFreeEventType,
                    start: eventRange.start,
                    end: eventRange.end,
                    name: "Vacación casa libre",
                    description: "Días inhábiles como evento de casa",
                    all_day: true,
                    is_free_day: true,
                },
            });

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate,
                    endDate,
                });

            const vacationInDb = await prisma.vacations_request.findFirst({
                where: {
                    employee_id: IDS.employeeCook,
                    start: new Date(`${startDate}T00:00:00.000Z`),
                    end: new Date(`${endDate}T00:00:00.000Z`),
                },
            });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
            );
            expect(vacationInDb).toBeNull();
        });

        it("Error al pedir más días de los que se tienen disponibles", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = dateOnly(addDays(START_DATE, 8));
            const endDate = dateOnly(new Date(Date.UTC(
                END_DATE.getUTCFullYear(),
                END_DATE.getUTCMonth() + 2,
                END_DATE.getUTCDate(),
            )));

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "No se tienen suficientes días disponibles para solicitar las vacaciones",
            );
        });

        it("Error al pedir más días de los que se tienen disponibles", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = "2026-11-09";
            const endDate = "2026-11-25";

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "No se tienen suficientes días disponibles para solicitar las vacaciones",
            );
        });

        it("Pedir vacaciones tomando en cuenta eventos", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");

            const startDate = "2026-11-09";
            const endDate = "2026-11-25";

            const eventTypeId = IDS.remainingFreeEventType;

            await createEventType(
                eventTypeId,
                `Vac rem ${eventTypeId.slice(0, 8)}`,
            );

            await prisma.global_event.create({
                data: {
                    global_event_id: randomUUID(),
                    event_type_id: eventTypeId,
                    start: new Date("2026-11-19T06:00:00Z"),
                    end: new Date("2026-11-20T05:59:00Z"),
                    name: "Día de testeo",
                    description: "Día para testear el endpoint",
                    all_day: false,
                    is_free_day: true,
                },
            });

            await prisma.global_event.create({
                data: {
                    global_event_id: randomUUID(),
                    event_type_id: eventTypeId,
                    start: new Date("2026-11-20T06:00:00Z"),
                    end: new Date("2026-11-21T05:59:00Z"),
                    name: "Rev Mex",
                    description: "Día para testear el endpoint",
                    all_day: false,
                    is_free_day: true,
                },
            });

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(201);
            expect(res.body.message).toBe(
                "Se solicitaron las vacaciones de forma correcta",
            );
        });
    });

    describe("PASO 3 - GET /vacation/remaining/", () => {
        it("Empleado obtiene sus propias vacaciones después de solicitar varias", async () => {
            const token = sign(IDS.employeeCook, "Cocinero");
            const res = await request(app)
                .get(`/vacation/remaining/${IDS.employeeCook}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.remainingVacations).toBe(1);
            expect(res.body.data.startDate).toBe(
                new Date(Date.UTC(2026, 0, 1)).toISOString(),
            );
            expect(res.body.data.endDate).toBe(
                new Date(Date.UTC(2026, 11, 31)).toISOString(),
            );
        });
    });
});
