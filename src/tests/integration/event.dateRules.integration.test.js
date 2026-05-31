const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");
const prisma = require("../../prisma");
const {
    futureDate,
    allDayEndUtc,
} = require("../helpers/dateHelpers");

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const API_ROUTE = "/event/employee";

const IDS = {
    house: randomUUID(),
    role: randomUUID(),
    employee: randomUUID(),
    eventType: randomUUID(),
    houseFreeDay: randomUUID(),
    globalFreeDay: randomUUID(),
};

const sign = (overrides = {}) =>
    jwt.sign(
        {
            id: randomUUID(),
            employeeId: randomUUID(),
            houseId: IDS.house,
            role: "Administrador",
            tokenType: "SESSION",
            privileges: [],
            ...overrides,
        },
        JWT_SECRET,
        { expiresIn: "1h" },
    );

const route = (employeeId = IDS.employee, mode = "absence") =>
    `${API_ROUTE}/${employeeId}/date-rules?mode=${mode}`;

const getOrCreateWorkdayId = async (name) => {
    const existing = await prisma.workday.findUnique({ where: { name } });
    if (existing) return existing.workday_id;

    const created = await prisma.workday.create({
        data: {
            workday_id: randomUUID(),
            name,
        },
    });
    return created.workday_id;
};

const clean = async () => {
    await prisma.house_event.deleteMany({
        where: { house_event_id: IDS.houseFreeDay },
    });
    await prisma.global_event.deleteMany({
        where: { global_event_id: IDS.globalFreeDay },
    });
    await prisma.employee_workday.deleteMany({
        where: { employee_id: IDS.employee },
    });
    await prisma.employee.deleteMany({
        where: { employee_id: IDS.employee },
    });
    await prisma.event_type.deleteMany({
        where: { event_type_id: IDS.eventType },
    });
    await prisma.role.deleteMany({
        where: { role_id: IDS.role },
    });
    await prisma.house.deleteMany({
        where: { house_id: IDS.house },
    });
};

const seed = async () => {
    await prisma.house.create({
        data: {
            house_id: IDS.house,
            name: `Date Rules House ${IDS.house.slice(0, 8)}`,
            location: "Queretaro",
            phone_number: "4421000001",
            description: "Casa para pruebas de reglas de fechas",
            image: "date-rules.jpg",
        },
    });
    await prisma.role.create({
        data: {
            role_id: IDS.role,
            name: `DateRulesRole${IDS.role.slice(0, 8)}`,
        },
    });
    await prisma.employee.create({
        data: {
            employee_id: IDS.employee,
            house_id: IDS.house,
            role_id: IDS.role,
            name: "Ana",
            surname: "Reglas",
            email: `date.rules.${IDS.employee.slice(0, 8)}@test.com`,
            password: "hashed",
            curp: "RULA900101MDFXXX01",
            birth_date: new Date(Date.UTC(1990, 0, 1)),
            start_date: new Date(Date.UTC(2024, 0, 1)),
            is_active: true,
            has_first_login: false,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            type: "nomina",
        },
    });

    const mondayId = await getOrCreateWorkdayId("Lunes");
    await prisma.employee_workday.create({
        data: {
            employee_id: IDS.employee,
            workday_id: mondayId,
            start: new Date(Date.UTC(1970, 0, 1, 9)),
            end: new Date(Date.UTC(1970, 0, 1, 18)),
        },
    });
    await prisma.event_type.create({
        data: {
            event_type_id: IDS.eventType,
            name: `DateRulesEvent${IDS.eventType.slice(0, 8)}`,
        },
    });

    const freeDay = futureDate(14);
    const freeDayEnd = allDayEndUtc(14);
    await prisma.global_event.create({
        data: {
            global_event_id: IDS.globalFreeDay,
            event_type_id: IDS.eventType,
            start: new Date(`${freeDay}T06:00:00.000Z`),
            end: new Date(freeDayEnd),
            name: "Feriado global allDay",
            description: "Debe bloquear solo un dia",
            all_day: true,
            is_free_day: true,
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

describe(`GET ${API_ROUTE}/:employeeId/date-rules`, () => {
    it("regresa workdays, días no laborales y feriados allDay sin marcar el día siguiente", async () => {
        const freeDay = futureDate(14);
        const nextDay = futureDate(15);

        const res = await request(app)
            .get(route())
            .set("Authorization", `Bearer ${sign()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
            employeeId: IDS.employee,
            mode: "absence",
            nonWorkingWeekdays: [0, 2, 3, 4, 5, 6],
        });
        expect(res.body.data.workDays).toEqual([
            expect.objectContaining({
                name: "Lunes",
                weekday: 1,
            }),
        ]);
        expect(res.body.data.freeDays).toContain(freeDay);
        expect(res.body.data.freeDays).not.toContain(nextDay);
    });

    it("rechaza consultar reglas de otro empleado cuando no es admin ni de la misma casa", async () => {
        const res = await request(app)
            .get(route())
            .set(
                "Authorization",
                `Bearer ${sign({
                    id: randomUUID(),
                    employeeId: randomUUID(),
                    role: "Trabajador",
                    houseId: randomUUID(),
                })}`,
            );

        expect(res.statusCode).toBe(403);
    });
});
