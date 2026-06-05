const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");
const { prisma, disconnectDb } = require("../helpers/dbSetup");

const TEST_HOUSE_ID = randomUUID();
const TEST_OTHER_HOUSE_ID = randomUUID();
const TEST_COORDINATOR_ID = randomUUID();
const TEST_EMPLOYEE_ID = randomUUID();
const TEST_OTHER_HOUSE_EMPLOYEE_ID = randomUUID();
const TEST_RATE_EMPLOYEE_ID = randomUUID();
const TEST_LEGIT_EMPLOYEE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_EMPLOYEE_ROLE_ID = randomUUID();
const TEST_EVENT_TYPE_ID = randomUUID();
const TEST_PRIVILEGE_CREATE_ID = randomUUID();
const TRAINING_EVENT_TYPE_ID = "b1000000-0000-4000-8000-000000000004";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const API_ROUTE = "/event/personal/add";

const ALL_TEST_EMPLOYEE_IDS = [
    TEST_COORDINATOR_ID,
    TEST_EMPLOYEE_ID,
    TEST_OTHER_HOUSE_EMPLOYEE_ID,
    TEST_RATE_EMPLOYEE_ID,
    TEST_LEGIT_EMPLOYEE_ID,
];

const generateToken = (
    payloadOverrides = {},
    signOptions = { expiresIn: "1h" },
) => {
    const defaultPayload = {
        employeeId: TEST_COORDINATOR_ID,
        id: TEST_COORDINATOR_ID,
        role: "Coordinador",
        houseId: TEST_HOUSE_ID,
        tokenType: "SESSION",
        privileges: ["createEvent", "viewEvents"],
    };

    return jwt.sign(
        { ...defaultPayload, ...payloadOverrides },
        JWT_SECRET,
        signOptions,
    );
};

const buildValidEventBody = (overrides = {}) => ({
    name: "Revision medica",
    eventTypeId: TEST_EVENT_TYPE_ID,
    date: "2026-07-15",
    allDay: false,
    start: "09:00",
    end: "10:00",
    employeeIds: [TEST_EMPLOYEE_ID],
    ...overrides,
});

const buildTrainingEventBody = (overrides = {}) => ({
    name: "Capacitacion de primeros auxilios",
    eventTypeId: TRAINING_EVENT_TYPE_ID,
    date: "2026-07-20",
    allDay: false,
    start: "09:00",
    end: "11:00",
    employeeIds: [TEST_EMPLOYEE_ID],
    trainer: "Dr. Juan Perez Lopez",
    ...overrides,
});

const getOrCreateRoleId = async (name, fallbackRoleId) => {
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) return existing.role_id;

    const created = await prisma.role.create({
        data: { role_id: fallbackRoleId, name },
    });
    return created.role_id;
};

const getOrCreatePrivilegeId = async (name, fallbackPrivilegeId) => {
    const existing = await prisma.privileges.findUnique({ where: { name } });
    if (existing) return existing.privilege_id;

    const created = await prisma.privileges.create({
        data: { privilege_id: fallbackPrivilegeId, name },
    });
    return created.privilege_id;
};

const seedDependencies = async () => {
    const coordinatorRoleId = await getOrCreateRoleId(
        "Coordinador",
        TEST_ROLE_ID,
    );
    const employeeRoleId = await getOrCreateRoleId(
        "Mantenimiento",
        TEST_EMPLOYEE_ROLE_ID,
    );

    await prisma.event_type.create({
        data: {
            event_type_id: TEST_EVENT_TYPE_ID,
            name: `Cita Test ${TEST_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    await prisma.event_type.upsert({
        where: { event_type_id: TRAINING_EVENT_TYPE_ID },
        update: {},
        create: {
            event_type_id: TRAINING_EVENT_TYPE_ID,
            name: "Capacitaciones",
        },
    });

    const createPrivilegeId = await getOrCreatePrivilegeId(
        "createEvent",
        TEST_PRIVILEGE_CREATE_ID,
    );

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: coordinatorRoleId,
                privilege_id: createPrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: coordinatorRoleId,
            privilege_id: createPrivilegeId,
        },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: employeeRoleId,
                privilege_id: createPrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: employeeRoleId,
            privilege_id: createPrivilegeId,
        },
    });

    await prisma.action.upsert({
        where: { action_id: "even-002" },
        update: {
            description: "Evento personal creado con éxito",
            important: false,
        },
        create: {
            action_id: "even-002",
            description: "Evento personal creado con éxito",
            important: false,
        },
    });

    await prisma.action.upsert({
        where: { action_id: "even-003" },
        update: {
            description: "Evento personal asignado a empleado",
            important: false,
        },
        create: {
            action_id: "even-003",
            description: "Evento personal asignado a empleado",
            important: false,
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Test Personal 1",
            location: "Querétaro",
            phone_number: "4421111111",
            description: "Casa principal para tests de evento personal",
            image: "test_p1.jpg",
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_OTHER_HOUSE_ID,
            name: "Casa Test Personal 2",
            location: "Querétaro",
            phone_number: "4422222222",
            description: "Casa secundaria para tests de evento personal",
            image: "test_p2.jpg",
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_COORDINATOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: coordinatorRoleId,
            name: "Coordinador",
            surname: "Personal",
            email: `coord_p_${TEST_COORDINATOR_ID.slice(0, 8)}@test.com`,
            password: "123456",
            curp: "PECP900101HDFRRS01",
            birth_date: new Date("1990-01-01"),
            start_date: new Date(),
            is_active: true,
            has_first_login: false,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
        },
    });

    await prisma.employee.createMany({
        data: [
            {
                employee_id: TEST_EMPLOYEE_ID,
                house_id: TEST_HOUSE_ID,
                role_id: employeeRoleId,
                name: "Empleado",
                surname: "Personal",
                email: `empl_p_${TEST_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PEEP900101HDFRRS02",
                birth_date: new Date("1990-01-01"),
                start_date: new Date(),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: TEST_OTHER_HOUSE_EMPLOYEE_ID,
                house_id: TEST_OTHER_HOUSE_ID,
                role_id: employeeRoleId,
                name: "OtraCasa",
                surname: "Personal",
                email: `other_p_${TEST_OTHER_HOUSE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PEOP900101HDFRRS03",
                birth_date: new Date("1990-01-01"),
                start_date: new Date(),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: TEST_RATE_EMPLOYEE_ID,
                house_id: TEST_HOUSE_ID,
                role_id: coordinatorRoleId,
                name: "Rate",
                surname: "PersonalLimit",
                email: `rate_p_${TEST_RATE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PERP900101HDFRRS04",
                birth_date: new Date("1990-01-01"),
                start_date: new Date(),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: TEST_LEGIT_EMPLOYEE_ID,
                house_id: TEST_HOUSE_ID,
                role_id: coordinatorRoleId,
                name: "Legitimo",
                surname: "PersonalRate",
                email: `legit_p_${TEST_LEGIT_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PELP900101HDFRRS05",
                birth_date: new Date("1990-01-01"),
                start_date: new Date(),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
        ],
    });
};

const cleanEvents = async () => {
    const junctionRecords = await prisma.employee_personal_event.findMany({
        where: { employee_id: { in: ALL_TEST_EMPLOYEE_IDS } },
        select: { personal_event_id: true },
    });
    const personalEventIds = junctionRecords.map((r) => r.personal_event_id);

    await prisma.logs.deleteMany({
        where: { employee_id: { in: ALL_TEST_EMPLOYEE_IDS } },
    });

    await prisma.employee_personal_event.deleteMany({
        where: { employee_id: { in: ALL_TEST_EMPLOYEE_IDS } },
    });

    if (personalEventIds.length > 0) {
        await prisma.personal_event.deleteMany({
            where: { personal_event_id: { in: personalEventIds } },
        });
    }
};

const cleanDb = async () => {
    await cleanEvents();

    await prisma.employee.deleteMany({
        where: { employee_id: { in: ALL_TEST_EMPLOYEE_IDS } },
    });

    await prisma.house.deleteMany({
        where: {
            OR: [
                { house_id: TEST_HOUSE_ID },
                { house_id: TEST_OTHER_HOUSE_ID },
            ],
        },
    });

    await prisma.event_type.deleteMany({
        where: { event_type_id: TEST_EVENT_TYPE_ID },
    });
};

beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

afterAll(async () => {
    await cleanDb();
    await disconnectDb();
});

beforeEach(async () => {
    await cleanEvents();
});

describe(`POST ${API_ROUTE} - Integration & Security`, () => {
    describe("1. Comportamiento esperado", () => {
        it("coordinador crea evento para un empleado y persiste todos los campos en BD (201)", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                name: "Cita persistencia",
                description: "Descripción de prueba",
                start: "08:00",
                end: "09:30",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.personalEventId).toBeDefined();

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: res.body.data.personalEventId },
            });
            expect(inDb).not.toBeNull();
            expect(inDb.name).toBe("Cita persistencia");
            expect(inDb.description).toBe("Descripción de prueba");
            expect(inDb.event_type_id).toBe(TEST_EVENT_TYPE_ID);
            expect(inDb.all_day).toBe(false);
        });

        it("coordinador crea evento para múltiples empleados y persiste la relación en BD (201)", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                employeeIds: [TEST_EMPLOYEE_ID, TEST_COORDINATOR_ID],
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const junctionRows = await prisma.employee_personal_event.findMany({
                where: { personal_event_id: res.body.data.personalEventId },
            });
            const assignedIds = junctionRows.map((r) => r.employee_id);
            expect(junctionRows).toHaveLength(2);
            expect(assignedIds).toContain(TEST_EMPLOYEE_ID);
            expect(assignedIds).toContain(TEST_COORDINATOR_ID);
        });

        it("empleado crea evento para sí mismo sin enviar employeeIds (201)", async () => {
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
            });
            const body = buildValidEventBody({ employeeIds: undefined });
            delete body.employeeIds;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const junctionRow = await prisma.employee_personal_event.findFirst({
                where: {
                    personal_event_id: res.body.data.personalEventId,
                    employee_id: TEST_EMPLOYEE_ID,
                },
            });
            expect(junctionRow).not.toBeNull();
        });

        it("evento allDay normaliza horario a rango exclusivo 00:00:00 y 00:00:00 del dia siguiente en BD", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                allDay: true,
                start: undefined,
                end: undefined,
            });
            delete body.start;
            delete body.end;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: res.body.data.personalEventId },
            });
            expect(inDb.all_day).toBe(true);

            const startUtc = inDb.start.toISOString().slice(11, 19);
            const endUtc = inDb.end.toISOString().slice(11, 19);
            expect(startUtc).toBe("06:00:00");
            expect(endUtc).toBe("06:00:00");
            expect(inDb.end.toISOString().slice(0, 10)).toBe("2026-07-16");
        });

        it("crea evento con hora específica y persiste en BD", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                start: "14:30",
                end: "16:00",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.start).toBe("14:30:00");
            expect(res.body.data.end).toBe("16:00:00");
        });

        it("crea evento sin description (campo opcional)", async () => {
            const token = generateToken();
            const body = buildValidEventBody();
            delete body.description;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.description).toBeNull();
        });

        it("registra logs en BD al crear el evento (evento + asignación)", async () => {
            const token = generateToken();
            const body = buildValidEventBody();

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });
            expect(logsAfter).toBeGreaterThanOrEqual(logsBefore + 2);
        });

        it("deduplica employeeIds y crea una sola entrada por empleado en BD", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                employeeIds: [TEST_EMPLOYEE_ID, TEST_EMPLOYEE_ID],
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const junctionRows = await prisma.employee_personal_event.findMany({
                where: {
                    personal_event_id: res.body.data.personalEventId,
                    employee_id: TEST_EMPLOYEE_ID,
                },
            });
            expect(junctionRows).toHaveLength(1);
        });

        it("retorna forcedOverlap=false cuando no hubo empalme", async () => {
            const token = generateToken();
            const body = buildValidEventBody();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.forcedOverlap).toBe(false);
        });
    });

    describe("2. Fuzzing y Manipulación de Parámetros (Inputs destructivos)", () => {
        it("retorna 422 si el body está vacío", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si el name excede 70 caracteres", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ name: "a".repeat(71) });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("rechaza name con caracteres maliciosos (XSS attempt)", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                name: "<script>alert('xss')</script>",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("rechaza description con caracteres de SQL injection", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                description: "'; DROP TABLE personal_event;--",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si eventTypeId no es un UUID válido", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ eventTypeId: "no-es-uuid" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna error si eventTypeId es UUID válido pero no existe en BD", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ eventTypeId: randomUUID() });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBeGreaterThanOrEqual(400);

            const count = await prisma.employee_personal_event.count({
                where: { employee_id: TEST_EMPLOYEE_ID },
            });
            expect(count).toBe(0);
        });

        it("retorna 422 si date no tiene formato YYYY-MM-DD", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ date: "15/07/2026" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si allDay=false y falta start", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ allDay: false });
            delete body.start;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si allDay=false y falta end", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ allDay: false });
            delete body.end;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si end es igual a start", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ start: "09:00", end: "09:00" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si end es anterior a start", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ start: "10:00", end: "09:00" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si el formato de hora es inválido", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ start: "9am", end: "10am" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si description excede 250 caracteres", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                description: "a".repeat(251),
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si employeeIds contiene un UUID inválido", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                employeeIds: ["no-es-uuid"],
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("rechaza payload con tipos incorrectos", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                name: { malicious: "object" },
                allDay: "texto_en_lugar_de_boolean",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("ignora campos extra en el body (no los persiste)", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                hackerField: "owned",
                personal_event_id: "FAKE_ID_INJECTION",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.personalEventId).not.toBe("FAKE_ID_INJECTION");
        });
    });

    describe("3. Lógica de negocio: Empalmes y Roles", () => {
        it("retorna 409 si el empleado ya tiene un evento en ese horario", async () => {
            const token = generateToken();
            const body = buildValidEventBody();

            const res1 = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);
            expect(res1.statusCode).toBe(201);

            const res2 = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res2.statusCode).toBe(409);
            expect(res2.body.data.overlappedEmployees).toBeDefined();
            expect(res2.body.data.overlappedEmployees.length).toBeGreaterThan(
                0,
            );
        });

        it("coordinador con forceOverlap=true crea el evento, retorna forcedOverlap=true y persiste en BD", async () => {
            const token = generateToken();
            const body = buildValidEventBody();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const res2 = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send({ ...body, forceOverlap: true });

            expect(res2.statusCode).toBe(201);
            expect(res2.body.data.forcedOverlap).toBe(true);

            const count = await prisma.employee_personal_event.count({
                where: { employee_id: TEST_EMPLOYEE_ID },
            });
            expect(count).toBe(2);
        });

        it("NO detecta empalme si el mismo empleado tiene evento en fecha distinta", async () => {
            const token = generateToken();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody({ date: "2026-07-15" }));

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody({ date: "2026-07-16" }));

            expect(res.statusCode).toBe(201);
        });

        it("NO detecta empalme si los eventos son de empleados distintos en el mismo horario", async () => {
            const token = generateToken();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody({ employeeIds: [TEST_EMPLOYEE_ID] }));

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidEventBody({ employeeIds: [TEST_COORDINATOR_ID] }),
                );

            expect(res.statusCode).toBe(201);
        });

        it("detecta empalme parcial (horario que solapa solo parte)", async () => {
            const token = generateToken();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody({ start: "09:00", end: "11:00" }));

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidEventBody({
                        name: "Evento solapado",
                        start: "10:30",
                        end: "12:00",
                    }),
                );

            expect(res.statusCode).toBe(409);
        });

        it("NO detecta empalme si los eventos se tocan en el extremo", async () => {
            const token = generateToken();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody({ start: "09:00", end: "10:00" }));

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidEventBody({
                        name: "Evento contiguo",
                        start: "10:00",
                        end: "11:00",
                    }),
                );

            expect(res.statusCode).toBe(201);
        });
    });

    describe("4. Seguridad: Autenticación y Autorización", () => {
        it("retorna 401 si no se envía token", async () => {
            const res = await request(app)
                .post(API_ROUTE)
                .send(buildValidEventBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está manipulado o mal formado", async () => {
            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", "Bearer token_falso_para_hackear.123")
                .send(buildValidEventBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está expirado", async () => {
            const expiredToken = generateToken({}, { expiresIn: "-1s" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${expiredToken}`)
                .send(buildValidEventBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está firmado con secret incorrecto", async () => {
            const fakeToken = jwt.sign(
                {
                    employeeId: TEST_COORDINATOR_ID,
                    role: "Coordinador",
                    houseId: TEST_HOUSE_ID,
                    privileges: ["createEvent"],
                },
                "secret_incorrecto",
                { expiresIn: "1h" },
            );

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${fakeToken}`)
                .send(buildValidEventBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 si el usuario no tiene el privilegio createEvent", async () => {
            const token = generateToken({ privileges: ["viewEvents"] });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene privilegios definidos", async () => {
            const token = generateToken({ privileges: [] });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 400 si el coordinador no envía employeeIds", async () => {
            const token = generateToken();
            const body = buildValidEventBody();
            delete body.employeeIds;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el coordinador envía employeeIds vacío", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody({ employeeIds: [] }));

            expect(res.statusCode).toBe(400);
        });

        it("retorna 403 si un empleado no coordinador intenta usar forceOverlap", async () => {
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody({ forceOverlap: true }));

            expect(res.statusCode).toBe(403);
        });

        it("retorna 404 si el coordinador intenta asignar un empleado de otra casa", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                employeeIds: [TEST_OTHER_HOUSE_EMPLOYEE_ID],
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(404);
        });
    });

    describe("5. Integridad de datos", () => {
        it("no crea el evento si falla la validación", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ name: "" });

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const count = await prisma.employee_personal_event.count({
                where: { employee_id: TEST_EMPLOYEE_ID },
            });
            expect(count).toBe(0);
        });

        it("no crea el evento si hay empalme y forceOverlap=false", async () => {
            const token = generateToken();
            const body = buildValidEventBody();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const countBefore = await prisma.employee_personal_event.count({
                where: { employee_id: TEST_EMPLOYEE_ID },
            });

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const countAfter = await prisma.employee_personal_event.count({
                where: { employee_id: TEST_EMPLOYEE_ID },
            });

            expect(countAfter).toBe(countBefore);
        });
    });

    describe("6. Capacitaciones", () => {
        it("coordinador crea capacitación con trainer y persiste trainer en BD (201)", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildTrainingEventBody());

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: res.body.data.personalEventId },
            });
            expect(inDb).not.toBeNull();
            expect(inDb.trainer).toBe("Dr. Juan Perez Lopez");
            expect(inDb.event_type_id).toBe(TRAINING_EVENT_TYPE_ID);
        });

        it("la respuesta incluye el campo trainer con el valor enviado", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildTrainingEventBody({ trainer: "Lic. Ana García" }));

            expect(res.statusCode).toBe(201);
            expect(res.body.data.trainer).toBe("Lic. Ana García");
        });

        it("retorna 422 si el evento es capacitación y no se envía trainer", async () => {
            const token = generateToken();
            const body = buildTrainingEventBody();
            delete body.trainer;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);

            const count = await prisma.employee_personal_event.count({
                where: { employee_id: TEST_EMPLOYEE_ID },
            });
            expect(count).toBe(0);
        });

        it("retorna 422 si trainer es una cadena de espacios", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildTrainingEventBody({ trainer: "   " }));

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si trainer excede 150 caracteres", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildTrainingEventBody({ trainer: "a".repeat(151) }));

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si trainer tiene caracteres maliciosos (XSS)", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildTrainingEventBody({
                        trainer: "<script>alert('xss')</script>",
                    }),
                );

            expect(res.statusCode).toBe(422);
        });

        it("evento no-capacitación persiste trainer=null aunque se envíe trainer", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidEventBody({
                        trainer: "valor que debe ignorarse",
                    }),
                );

            expect(res.statusCode).toBe(201);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: res.body.data.personalEventId },
            });
            expect(inDb.trainer).toBeNull();
        });
    });

    describe.skip("7. Resiliencia: Rate Limiting", () => {
        it("bloquea con 429 si un usuario autenticado lanza muchas peticiones", async () => {
            const token = generateToken({
                employeeId: TEST_RATE_EMPLOYEE_ID,
                id: TEST_RATE_EMPLOYEE_ID,
            });

            const responses = await Promise.all(
                Array.from({ length: 150 }, () =>
                    request(app)
                        .post(API_ROUTE)
                        .set("Authorization", `Bearer ${token}`)
                        .send(buildValidEventBody()),
                ),
            );

            const hasRateLimit = responses.some(
                (res) => res.statusCode === 429,
            );
            expect(hasRateLimit).toBe(true);
        });

        it("bloquea con 429 por IP cuando hay peticiones anónimas masivas", async () => {
            const responses = await Promise.all(
                Array.from({ length: 150 }, () =>
                    request(app).post(API_ROUTE).send(buildValidEventBody()),
                ),
            );

            const hasRateLimit = responses.some(
                (res) => res.statusCode === 429,
            );
            expect(hasRateLimit).toBe(true);
        });

        it("independencia: un usuario legítimo no se ve afectado por rate-limit ajeno", async () => {
            const tokenLegitimo = generateToken({
                employeeId: TEST_LEGIT_EMPLOYEE_ID,
                id: TEST_LEGIT_EMPLOYEE_ID,
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${tokenLegitimo}`)
                .send(buildValidEventBody());

            expect(res.statusCode).not.toBe(429);
        });
    });
});
