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

const sign = (employeeId, roleId) => {
    return jwt.sign(
        {
            id: employeeId,
            houseId: IDS.house,
            role: roleId,
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
};

const seed = async () => {
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

    const existingAdminRole = await prisma.role.findFirst({
        where: { name: "Admin" },
    });
    if (existingAdminRole) {
        IDS.roleAdmin = existingAdminRole.role_id;
        empAdminBase.role_id = IDS.roleAdmin;
    } else {
        await prisma.role.create({
            data: { role_id: IDS.roleAdmin, name: "Admin" },
        });
    }

    const existingCoordRole = await prisma.role.findFirst({
        where: { name: "Colaborador" },
    });
    if (existingCoordRole) {
        IDS.roleCoordinator = existingCoordRole.role_id;
        empCoordBase.role_id = IDS.roleCoordinator;
    } else {
        await prisma.role.create({
            data: { role_id: IDS.roleCoordinator, name: "Colaborador" },
        });
    }

    const existingCookRole = await prisma.role.findFirst({
        where: { name: "Cocinero" },
    });
    if (existingCookRole) {
        IDS.roleCook = existingCookRole.role_id;
        empCookBase.role_id = IDS.roleCook;
    } else {
        await prisma.role.create({
            data: { role_id: IDS.roleCook, name: "Cocinero" },
        });
    }

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
            const token = sign(IDS.employeeCook, IDS.roleCook);
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
            const token = sign(IDS.employeeCoordinator, IDS.roleCoordinator);
            const res = await request(app)
                .get(`/vacation/remaining/${IDS.employeeCoordinator}`)
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
            const token = sign(IDS.employeeAdmin, IDS.roleAdmin);
            const res = await request(app)
                .get(`/vacation/remaining/${IDS.employeeAdmin}`)
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
            const token = sign(IDS.employeeCook, IDS.roleCook);
            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.status).toBe(500);
        });

        it("Empleado manda solicitud con otros parámetros", async () => {
            const token = sign(IDS.employeeCook, IDS.roleCook);
            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    variable: 123,
                    dummy: "data",
                });

            expect(res.status).toBe(500);
        });

        it("Manda error por falta de días de trabajo", async () => {
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = `${START_DATE.getUTCFullYear()}-${START_DATE.getUTCMonth() + 1}-${START_DATE.getUTCDate()}`;
            const endDate = `${END_DATE.getUTCFullYear()}-${END_DATE.getUTCMonth() + 1}-${END_DATE.getUTCDate()}`;

            const res = await request(app)
                .post("/vacation/request")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: startDate,
                    endDate: endDate,
                });

            expect(res.status).toBe(406);
            expect(res.body.message).toBe(
                "Se ocupan tener registrados los días de trabajo",
            );
        });

        it("Envío correcto", async () => {
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = `${START_DATE.getUTCFullYear()}-${START_DATE.getUTCMonth() + 1}-${START_DATE.getUTCDate()}`;
            const endDate = `${END_DATE.getUTCFullYear()}-${END_DATE.getUTCMonth() + 1}-${END_DATE.getUTCDate()}`;

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
            };

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = '2026-10-13';

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = `${START_DATE.getUTCFullYear()}-${START_DATE.getUTCMonth() + 1}-${START_DATE.getUTCDate() + 1}`;
            const endDate = `${END_DATE.getUTCFullYear()}-${END_DATE.getUTCMonth() + 1}-${END_DATE.getUTCDate() - 1}`;

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = `${START_DATE.getUTCFullYear()}-${START_DATE.getUTCMonth() + 1}-${START_DATE.getUTCDate() - 1}`;
            const endDate = `${END_DATE.getUTCFullYear()}-${END_DATE.getUTCMonth() + 1}-${END_DATE.getUTCDate() + 1}`;

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = `${TODAY.getUTCFullYear()}-${TODAY.getUTCMonth() + 1}-${TODAY.getUTCDate()}`;

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = `${TODAY.getUTCFullYear()}-${TODAY.getUTCMonth() + 1}-${TODAY.getUTCDate() - 5}`;

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = `${START_DATE.getUTCFullYear() + 1}-${START_DATE.getUTCMonth() + 1}-${START_DATE.getUTCDate() - 1}`;
            const endDate = `${END_DATE.getUTCFullYear() + 1}-${END_DATE.getUTCMonth() + 1}-${END_DATE.getUTCDate() + 1}`;

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const endDate = `${START_DATE.getUTCFullYear()}-${START_DATE.getUTCMonth() + 1}-${START_DATE.getUTCDate()}`;
            const startDate = `${END_DATE.getUTCFullYear()}-${END_DATE.getUTCMonth() + 1}-${END_DATE.getUTCDate()}`;

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

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

        it("Error al pedir más días de los que se tienen disponibles", async () => {
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = `${START_DATE.getUTCFullYear()}-${START_DATE.getUTCMonth() + 1}-${START_DATE.getUTCDate() + 8}`;
            const endDate = `${END_DATE.getUTCFullYear()}-${END_DATE.getUTCMonth() + 3}-${END_DATE.getUTCDate()}`;

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = '2026-11-09';
            const endDate = '2026-11-25';

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
            const token = sign(IDS.employeeCook, IDS.roleCook);

            const startDate = '2026-11-09';
            const endDate = '2026-11-25';

            const eventTypeId = randomUUID();

            await prisma.event_type.create({
                data: {
                    name: "Día de prueba en vacaciones",
                    event_type_id: eventTypeId
                }
            });

            await prisma.global_event.create({
                data: {
                    global_event_id: randomUUID(),
                    event_type_id: eventTypeId,
                    date: new Date(Date.UTC(2026, 10, 19)),
                    start: new Date("1970-01-01T00:00:00Z"),
                    end: new Date("1970-01-01T23:59:00Z"),
                    name: "Día de testeo",
                    description: "Día para testear el endpoint",
                    is_free_day: true
                }
            });

            await prisma.global_event.create({
                data: {
                    global_event_id: randomUUID(),
                    event_type_id: eventTypeId,
                    date: new Date(Date.UTC(2026, 10, 20)),
                    start: new Date("1970-01-01T00:00:00Z"),
                    end: new Date("1970-01-01T23:59:00Z"),
                    name: "Rev Mex",
                    description: "Día para testear el endpoint",
                    is_free_day: true
                }
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
            const token = sign(IDS.employeeCook, IDS.roleCook);
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
