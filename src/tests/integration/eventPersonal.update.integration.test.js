const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");
const { prisma, disconnectDb } = require("../helpers/dbSetup");

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
const TEST_OTHER_HOUSE_ID = randomUUID();
const TEST_COORDINATOR_ID = randomUUID();
const TEST_EMPLOYEE_ID = randomUUID();
const TEST_OTHER_EMPLOYEE_ID = randomUUID();
const TEST_OTHER_HOUSE_EMPLOYEE_ID = randomUUID();
const TEST_RATE_EMPLOYEE_ID = randomUUID();
const TEST_LEGIT_EMPLOYEE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_EMPLOYEE_ROLE_ID = randomUUID();
const TEST_EVENT_TYPE_ID = randomUUID();
const TEST_OTHER_EVENT_TYPE_ID = randomUUID();
const TEST_PRIVILEGE_EDIT_ID = randomUUID();
const TEST_PERSONAL_EVENT_ID = randomUUID();
const TEST_UPDATE_ACTION_ID = "even-007";
const TEST_EMPLOYEE_UPDATE_ACTION_ID = "even-008";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const API_BASE = "/event/personal";

const ALL_TEST_EMPLOYEE_IDS = [
    TEST_COORDINATOR_ID,
    TEST_EMPLOYEE_ID,
    TEST_OTHER_EMPLOYEE_ID,
    TEST_OTHER_HOUSE_EMPLOYEE_ID,
    TEST_RATE_EMPLOYEE_ID,
    TEST_LEGIT_EMPLOYEE_ID,
];

// ─── Helpers ──────────────────────────────────────────────
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
        privileges: ["editEvent", "viewEvents"],
    };

    return jwt.sign(
        { ...defaultPayload, ...payloadOverrides },
        JWT_SECRET,
        signOptions,
    );
};

const buildCoordinatorBody = (overrides = {}) => ({
    name: "Cita actualizada",
    eventTypeId: TEST_EVENT_TYPE_ID,
    date: "2026-07-10",
    allDay: false,
    start: "09:00",
    end: "11:00",
    employeeIds: [TEST_EMPLOYEE_ID],
    ...overrides,
});

const buildEmployeeBody = (overrides = {}) => ({
    name: "Mi cita actualizada",
    eventTypeId: TEST_EVENT_TYPE_ID,
    date: "2026-07-10",
    allDay: false,
    start: "09:00",
    end: "11:00",
    ...overrides,
});

const seedPersonalEvent = async (
    employeeIds = [TEST_EMPLOYEE_ID],
    overrides = {},
) => {
    await prisma.personal_event.create({
        data: {
            personal_event_id: TEST_PERSONAL_EVENT_ID,
            event_type_id: TEST_EVENT_TYPE_ID,
            name: "Evento original",
            date: new Date("2026-07-10"),
            start: new Date("2026-07-10T15:00:00.000Z"),
            end: new Date("2026-07-10T17:00:00.000Z"),
            all_day: false,
            description: null,
            ...overrides,
        },
    });

    await prisma.employee_personal_event.createMany({
        data: employeeIds.map((employeeId) => ({
            personal_event_id: TEST_PERSONAL_EVENT_ID,
            employee_id: employeeId,
        })),
    });
};

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
    // ─── Roles ──────────────────────────────────
    const coordinatorRoleId = await getOrCreateRoleId(
        "Coordinador",
        TEST_ROLE_ID,
    );
    const employeeRoleId = await getOrCreateRoleId(
        "Mantenimiento",
        TEST_EMPLOYEE_ROLE_ID,
    );

    // ─── Event Types ────────────────────────────
    await prisma.event_type.create({
        data: {
            event_type_id: TEST_EVENT_TYPE_ID,
            name: `Cita UpdPersonal ${TEST_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    await prisma.event_type.create({
        data: {
            event_type_id: TEST_OTHER_EVENT_TYPE_ID,
            name: `Festivo UpdPersonal ${TEST_OTHER_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    // ─── Privilegios ────────────────────────────
    const editPrivilegeId = await getOrCreatePrivilegeId(
        "editEvent",
        TEST_PRIVILEGE_EDIT_ID,
    );

    // ─── Relación Role - Privilege ──────────────
    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: coordinatorRoleId,
                privilege_id: editPrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: coordinatorRoleId,
            privilege_id: editPrivilegeId,
        },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: employeeRoleId,
                privilege_id: editPrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: employeeRoleId,
            privilege_id: editPrivilegeId,
        },
    });

    // ─── Actions (para logs) ────────────────────
    await prisma.action.upsert({
        where: { action_id: TEST_UPDATE_ACTION_ID },
        update: {
            description: "Evento personal actualizado con éxito",
            important: false,
        },
        create: {
            action_id: TEST_UPDATE_ACTION_ID,
            description: "Evento personal actualizado con éxito",
            important: false,
        },
    });

    await prisma.action.upsert({
        where: { action_id: TEST_EMPLOYEE_UPDATE_ACTION_ID },
        update: {
            description:
                "Asignación de empleado en evento personal actualizada",
            important: false,
        },
        create: {
            action_id: TEST_EMPLOYEE_UPDATE_ACTION_ID,
            description:
                "Asignación de empleado en evento personal actualizada",
            important: false,
        },
    });

    // ─── Casas ──────────────────────────────────
    await prisma.house.create({
        data: {
            house_id: TEST_HOUSE_ID,
            name: "Casa UpdPersonal 1",
            location: "Querétaro",
            phone_number: "4423111111",
            description: "Casa principal para tests de update personal",
            image: "test_up1.jpg",
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_OTHER_HOUSE_ID,
            name: "Casa UpdPersonal 2",
            location: "Querétaro",
            phone_number: "4423222222",
            description: "Casa secundaria para tests de update personal",
            image: "test_up2.jpg",
        },
    });

    // ─── Coordinador ────────────────────────────
    await prisma.employee.create({
        data: {
            employee_id: TEST_COORDINATOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: coordinatorRoleId,
            name: "Coordinador",
            surname: "UpdPersonal",
            email: `coord_up_${TEST_COORDINATOR_ID.slice(0, 8)}@test.com`,
            password: "123456",
            curp: "PUPC900101HDFRRS01",
            birth_date: new Date("1990-01-01"),
            start_date: new Date(),
            is_active: true,
            has_first_login: false,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
        },
    });

    // ─── Empleados ──────────────────────────────
    await prisma.employee.createMany({
        data: [
            {
                employee_id: TEST_EMPLOYEE_ID,
                house_id: TEST_HOUSE_ID,
                role_id: employeeRoleId,
                name: "Empleado",
                surname: "UpdPersonal",
                email: `empl_up_${TEST_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PUPE900101HDFRRS02",
                birth_date: new Date("1990-01-01"),
                start_date: new Date(),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: TEST_OTHER_EMPLOYEE_ID,
                house_id: TEST_HOUSE_ID,
                role_id: employeeRoleId,
                name: "OtroEmpleado",
                surname: "UpdPersonal",
                email: `other_up_${TEST_OTHER_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PUPO900101HDFRRS03",
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
                surname: "UpdPersonal",
                email: `ohouse_up_${TEST_OTHER_HOUSE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PUPH900101HDFRRS04",
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
                surname: "UpdPersonalLimit",
                email: `rate_up_${TEST_RATE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PUPR900101HDFRRS05",
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
                surname: "UpdPersonalRate",
                email: `legit_up_${TEST_LEGIT_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PUPL900101HDFRRS06",
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
    const personalEventIds = [
        ...new Set(junctionRecords.map((r) => r.personal_event_id)),
    ];

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
        where: {
            OR: [
                { event_type_id: TEST_EVENT_TYPE_ID },
                { event_type_id: TEST_OTHER_EVENT_TYPE_ID },
            ],
        },
    });
};

// ─── Hooks ────────────────────────────────────────────────
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

// ─── SUITE DE PRUEBAS ─────────────────────────────────────
describe(`PUT ${API_BASE}/:eventId - Integration & Security`, () => {
    // ──────────────────────────────────────────────────────
    //  1. COMPORTAMIENTO ESPERADO
    // ──────────────────────────────────────────────────────
    describe("1. Comportamiento esperado", () => {
        it("coordinador actualiza evento personal y persiste en BD (200)", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({
                name: "Cita médica actualizada",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.personalEventId).toBe(TEST_PERSONAL_EVENT_ID);
            expect(res.body.data.name).toBe("Cita médica actualizada");

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });
            expect(inDb).not.toBeNull();
            expect(inDb.name).toBe("Cita médica actualizada");
        });

        it("normaliza hora y persiste correctamente en BD con zona horaria CDT (UTC-6)", async () => {
            await seedPersonalEvent();
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildCoordinatorBody({ start: "09:00", end: "11:00" }));

            expect(res.statusCode).toBe(200);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });
            expect(inDb.start.toISOString()).toBe("2026-07-10T15:00:00.000Z");
            expect(inDb.end.toISOString()).toBe("2026-07-10T17:00:00.000Z");
        });

        it("actualiza evento allDay y normaliza start/end a medianoche CDT y endDate+1", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ allDay: true });
            delete body.start;
            delete body.end;

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.allDay).toBe(true);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });
            expect(inDb.all_day).toBe(true);
            expect(inDb.start.toISOString()).toBe("2026-07-10T06:00:00.000Z");
            expect(inDb.end.toISOString()).toBe("2026-07-11T06:00:00.000Z");
        });

        it("retorna 403 si un empleado no coordinador intenta actualizar su propio evento", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
                privileges: ["editEvent"],
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildEmployeeBody({ name: "Mi cita actualizada" }));

            expect(res.statusCode).toBe(403);
        });

        it("coordinador reasigna empleados y junction table se actualiza en BD", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        employeeIds: [TEST_OTHER_EMPLOYEE_ID],
                    }),
                );

            expect(res.statusCode).toBe(200);

            const junctionRows = await prisma.employee_personal_event.findMany({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });
            const assignedIds = junctionRows.map((r) => r.employee_id);
            expect(junctionRows).toHaveLength(1);
            expect(assignedIds).toContain(TEST_OTHER_EMPLOYEE_ID);
            expect(assignedIds).not.toContain(TEST_EMPLOYEE_ID);
        });

        it("registra log even-006 en BD al actualizar el evento", async () => {
            await seedPersonalEvent();
            const token = generateToken();

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(200);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });
            expect(logsAfter).toBeGreaterThan(logsBefore);
        });

        it("registra log even-007 cuando el empleado asignado cambia", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        employeeIds: [TEST_OTHER_EMPLOYEE_ID],
                    }),
                );

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });
            expect(logsAfter).toBeGreaterThanOrEqual(logsBefore + 2);
        });

        it("retorna forcedOverlap=false cuando no hubo empalme", async () => {
            await seedPersonalEvent();
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(200);
            expect(res.body.data.forcedOverlap).toBe(false);
        });

        it("actualiza sin description y lo guarda como null en BD", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody();
            delete body.description;

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.description).toBeNull();
        });
    });

    // ──────────────────────────────────────────────────────
    //  2. FUZZING Y MANIPULACIÓN DE PARÁMETROS
    // ──────────────────────────────────────────────────────
    describe("2. Fuzzing y Manipulación de Parámetros (Inputs destructivos)", () => {
        it("retorna 422 si el body está vacío", async () => {
            await seedPersonalEvent();
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si el name excede 70 caracteres", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ name: "a".repeat(71) });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("rechaza name con caracteres maliciosos (XSS attempt)", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({
                name: "<script>alert('xss')</script>",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("rechaza description con caracteres de SQL injection", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({
                description: "'; DROP TABLE personal_event;--",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si eventTypeId no es un UUID válido", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ eventTypeId: "no-es-uuid" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 404 si el eventId no existe en BD", async () => {
            const token = generateToken();
            const nonExistentId = randomUUID();

            const res = await request(app)
                .put(`${API_BASE}/${nonExistentId}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(404);
        });

        it("retorna 422 si date no tiene formato YYYY-MM-DD", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ date: "10/07/2026" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si allDay=false y falta start", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ allDay: false });
            delete body.start;

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si allDay=false y falta end", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ allDay: false });
            delete body.end;

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si end es igual a start", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ start: "09:00", end: "09:00" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si end es anterior a start", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ start: "11:00", end: "09:00" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si el formato de hora es inválido", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ start: "9am", end: "11am" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si description excede 250 caracteres", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({
                description: "a".repeat(251),
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si employeeIds contiene un UUID inválido", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({
                employeeIds: ["no-es-uuid"],
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("rechaza payload con tipos incorrectos", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({
                name: { malicious: "object" },
                allDay: "texto_en_lugar_de_boolean",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("ignora campos extra en el body (no los persiste)", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({
                hackerField: "owned",
                personal_event_id: "FAKE_ID_INJECTION",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.personalEventId).toBe(TEST_PERSONAL_EVENT_ID);
        });
    });

    // ──────────────────────────────────────────────────────
    //  3. LÓGICA DE NEGOCIO: EMPALMES
    // ──────────────────────────────────────────────────────
    describe("3. Lógica de negocio: Empalmes", () => {
        it("retorna 409 si el empleado ya tiene otro evento en ese horario", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const conflictingEventId = randomUUID();
            await prisma.personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    event_type_id: TEST_EVENT_TYPE_ID,
                    name: "Evento bloqueante",
                    date: new Date("2026-07-20"),
                    start: new Date("2026-07-20T15:00:00.000Z"),
                    end: new Date("2026-07-20T17:00:00.000Z"),
                    all_day: false,
                },
            });
            await prisma.employee_personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    employee_id: TEST_EMPLOYEE_ID,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        date: "2026-07-20",
                        start: "09:00",
                        end: "11:00",
                    }),
                );

            expect(res.statusCode).toBe(409);
            expect(res.body.data.overlappedEmployees).toBeDefined();
            expect(res.body.data.overlappedEmployees.length).toBeGreaterThan(0);
        });

        it("el evento actualizado no colisiona con su propio rango de tiempo anterior", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        name: "Mismo horario actualizado",
                        date: "2026-07-10",
                        start: "09:00",
                        end: "11:00",
                    }),
                );

            expect(res.statusCode).toBe(200);
            expect(res.body.data.name).toBe("Mismo horario actualizado");
        });

        it("permite actualizar con forceOverlap=true aunque haya empalme (coordinador)", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const conflictingEventId = randomUUID();
            await prisma.personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    event_type_id: TEST_EVENT_TYPE_ID,
                    name: "Evento bloqueante force",
                    date: new Date("2026-07-20"),
                    start: new Date("2026-07-20T15:00:00.000Z"),
                    end: new Date("2026-07-20T17:00:00.000Z"),
                    all_day: false,
                },
            });
            await prisma.employee_personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    employee_id: TEST_EMPLOYEE_ID,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        date: "2026-07-20",
                        start: "09:00",
                        end: "11:00",
                        forceOverlap: true,
                    }),
                );

            expect(res.statusCode).toBe(200);
            expect(res.body.data.forcedOverlap).toBe(true);
        });

        it("NO detecta empalme si el empleado tiene evento en fecha distinta", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const otherEventId = randomUUID();
            await prisma.personal_event.create({
                data: {
                    personal_event_id: otherEventId,
                    event_type_id: TEST_EVENT_TYPE_ID,
                    name: "Evento otra fecha",
                    date: new Date("2026-07-20"),
                    start: new Date("2026-07-20T15:00:00.000Z"),
                    end: new Date("2026-07-20T17:00:00.000Z"),
                    all_day: false,
                },
            });
            await prisma.employee_personal_event.create({
                data: {
                    personal_event_id: otherEventId,
                    employee_id: TEST_EMPLOYEE_ID,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        date: "2026-07-10",
                        start: "09:00",
                        end: "11:00",
                    }),
                );

            expect(res.statusCode).toBe(200);
        });

        it("NO detecta empalme si los empleados son distintos en el mismo horario", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const conflictingEventId = randomUUID();
            await prisma.personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    event_type_id: TEST_EVENT_TYPE_ID,
                    name: "Evento otro empleado",
                    date: new Date("2026-07-20"),
                    start: new Date("2026-07-20T15:00:00.000Z"),
                    end: new Date("2026-07-20T17:00:00.000Z"),
                    all_day: false,
                },
            });
            await prisma.employee_personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    employee_id: TEST_OTHER_EMPLOYEE_ID,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        date: "2026-07-20",
                        start: "09:00",
                        end: "11:00",
                        employeeIds: [TEST_EMPLOYEE_ID],
                    }),
                );

            expect(res.statusCode).toBe(200);
        });

        it("detecta empalme parcial (horario que solapa solo parte)", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const conflictingEventId = randomUUID();
            await prisma.personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    event_type_id: TEST_EVENT_TYPE_ID,
                    name: "Evento parcialmente solapado",
                    date: new Date("2026-07-20"),
                    start: new Date("2026-07-20T16:30:00.000Z"),
                    end: new Date("2026-07-20T18:30:00.000Z"),
                    all_day: false,
                },
            });
            await prisma.employee_personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    employee_id: TEST_EMPLOYEE_ID,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        date: "2026-07-20",
                        start: "09:00",
                        end: "11:00",
                    }),
                );

            expect(res.statusCode).toBe(409);
        });

        it("NO detecta empalme si los eventos solo se tocan en el extremo", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const adjacentEventId = randomUUID();
            await prisma.personal_event.create({
                data: {
                    personal_event_id: adjacentEventId,
                    event_type_id: TEST_EVENT_TYPE_ID,
                    name: "Evento contiguo",
                    date: new Date("2026-07-20"),
                    start: new Date("2026-07-20T17:00:00.000Z"),
                    end: new Date("2026-07-20T19:00:00.000Z"),
                    all_day: false,
                },
            });
            await prisma.employee_personal_event.create({
                data: {
                    personal_event_id: adjacentEventId,
                    employee_id: TEST_EMPLOYEE_ID,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        date: "2026-07-20",
                        start: "09:00",
                        end: "11:00",
                    }),
                );

            expect(res.statusCode).toBe(200);
        });
    });

    // ──────────────────────────────────────────────────────
    //  4. SEGURIDAD: AUTENTICACIÓN Y AUTORIZACIÓN
    // ──────────────────────────────────────────────────────
    describe("4. Seguridad: Autenticación y Autorización", () => {
        it("retorna 401 si no se envía token", async () => {
            await seedPersonalEvent();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está manipulado o mal formado", async () => {
            await seedPersonalEvent();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", "Bearer token_falso_para_hackear.123")
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está expirado", async () => {
            await seedPersonalEvent();
            const expiredToken = generateToken({}, { expiresIn: "-1s" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${expiredToken}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está firmado con secret incorrecto", async () => {
            await seedPersonalEvent();
            const fakeToken = jwt.sign(
                {
                    employeeId: TEST_COORDINATOR_ID,
                    id: TEST_COORDINATOR_ID,
                    role: "Coordinador",
                    houseId: TEST_HOUSE_ID,
                    privileges: ["editEvent"],
                },
                "secret_incorrecto",
                { expiresIn: "1h" },
            );

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${fakeToken}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 si el usuario no tiene el privilegio editEvent", async () => {
            await seedPersonalEvent();
            const token = generateToken({ privileges: ["viewEvents"] });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene privilegios definidos", async () => {
            await seedPersonalEvent();
            const token = generateToken({ privileges: [] });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 400 si el coordinador no envía employeeIds", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody();
            delete body.employeeIds;

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el coordinador envía employeeIds vacío", async () => {
            await seedPersonalEvent();
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildCoordinatorBody({ employeeIds: [] }));

            expect(res.statusCode).toBe(400);
        });

        it("retorna 403 si un empleado no coordinador intenta usar forceOverlap", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
                privileges: ["editEvent"],
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildEmployeeBody({ forceOverlap: true }));

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si un empleado intenta actualizar un evento al que no está asignado", async () => {
            await seedPersonalEvent([TEST_OTHER_EMPLOYEE_ID]);
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
                privileges: ["editEvent"],
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildEmployeeBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 404 si el evento pertenece a un empleado de otra casa", async () => {
            const otherHouseEventId = randomUUID();
            await prisma.personal_event.create({
                data: {
                    personal_event_id: otherHouseEventId,
                    event_type_id: TEST_EVENT_TYPE_ID,
                    name: "Evento otra casa",
                    date: new Date("2026-07-10"),
                    start: new Date("2026-07-10T15:00:00.000Z"),
                    end: new Date("2026-07-10T17:00:00.000Z"),
                    all_day: false,
                },
            });
            await prisma.employee_personal_event.create({
                data: {
                    personal_event_id: otherHouseEventId,
                    employee_id: TEST_OTHER_HOUSE_EMPLOYEE_ID,
                },
            });

            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${otherHouseEventId}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).toBe(404);
        });

        it("retorna 404 si el coordinador intenta asignar un empleado de otra casa", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        employeeIds: [TEST_OTHER_HOUSE_EMPLOYEE_ID],
                    }),
                );

            expect(res.statusCode).toBe(404);
        });
    });

    // ──────────────────────────────────────────────────────
    //  5. INTEGRIDAD DE DATOS
    // ──────────────────────────────────────────────────────
    describe("5. Integridad de datos", () => {
        it("no modifica el evento en BD si la validación falla", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({ name: "" });

            await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });
            expect(inDb.name).toBe("Evento original");
        });

        it("no modifica el evento si hay empalme y forceOverlap=false", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID]);
            const token = generateToken();

            const conflictingEventId = randomUUID();
            await prisma.personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    event_type_id: TEST_EVENT_TYPE_ID,
                    name: "Evento bloqueante integridad",
                    date: new Date("2026-07-20"),
                    start: new Date("2026-07-20T15:00:00.000Z"),
                    end: new Date("2026-07-20T17:00:00.000Z"),
                    all_day: false,
                },
            });
            await prisma.employee_personal_event.create({
                data: {
                    personal_event_id: conflictingEventId,
                    employee_id: TEST_EMPLOYEE_ID,
                },
            });

            await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        name: "Nombre que no debe guardarse",
                        date: "2026-07-20",
                        start: "09:00",
                        end: "11:00",
                    }),
                );

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });
            expect(inDb.name).toBe("Evento original");
        });

        it("la junction table se reemplaza correctamente al reasignar empleados", async () => {
            await seedPersonalEvent([TEST_EMPLOYEE_ID, TEST_OTHER_EMPLOYEE_ID]);
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildCoordinatorBody({
                        employeeIds: [TEST_COORDINATOR_ID],
                    }),
                );

            expect(res.statusCode).toBe(200);

            const junctionRows = await prisma.employee_personal_event.findMany({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });
            const assignedIds = junctionRows.map((r) => r.employee_id);
            expect(junctionRows).toHaveLength(1);
            expect(assignedIds).toContain(TEST_COORDINATOR_ID);
            expect(assignedIds).not.toContain(TEST_EMPLOYEE_ID);
            expect(assignedIds).not.toContain(TEST_OTHER_EMPLOYEE_ID);
        });

        it("persiste correctamente todos los campos actualizados en BD", async () => {
            await seedPersonalEvent();
            const token = generateToken();
            const body = buildCoordinatorBody({
                name: "Evento persistencia verificada",
                description: "Descripción persistencia",
                eventTypeId: TEST_OTHER_EVENT_TYPE_ID,
                date: "2026-08-05",
                start: "14:00",
                end: "16:00",
                allDay: false,
                employeeIds: [TEST_EMPLOYEE_ID, TEST_OTHER_EMPLOYEE_ID],
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });

            expect(inDb.name).toBe("Evento persistencia verificada");
            expect(inDb.description).toBe("Descripción persistencia");
            expect(inDb.event_type_id).toBe(TEST_OTHER_EVENT_TYPE_ID);
            expect(inDb.all_day).toBe(false);
            expect(inDb.start.toISOString()).toBe("2026-08-05T20:00:00.000Z");
            expect(inDb.end.toISOString()).toBe("2026-08-05T22:00:00.000Z");

            const junctionRows = await prisma.employee_personal_event.findMany({
                where: { personal_event_id: TEST_PERSONAL_EVENT_ID },
            });
            expect(junctionRows).toHaveLength(2);
        });
    });

    // ──────────────────────────────────────────────────────
    //  6. RATE LIMITING
    // ──────────────────────────────────────────────────────
    describe.skip("6. Resiliencia: Rate Limiting", () => {
        it("bloquea con 429 si un usuario autenticado lanza muchas peticiones", async () => {
            await seedPersonalEvent();
            const token = generateToken({
                employeeId: TEST_RATE_EMPLOYEE_ID,
                id: TEST_RATE_EMPLOYEE_ID,
            });

            const responses = await Promise.all(
                Array.from({ length: 150 }, () =>
                    request(app)
                        .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                        .set("Authorization", `Bearer ${token}`)
                        .send(buildCoordinatorBody()),
                ),
            );

            const hasRateLimit = responses.some(
                (res) => res.statusCode === 429,
            );
            expect(hasRateLimit).toBe(true);
        });

        it("bloquea con 429 por IP cuando hay peticiones anónimas masivas", async () => {
            await seedPersonalEvent();

            const responses = await Promise.all(
                Array.from({ length: 150 }, () =>
                    request(app)
                        .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                        .send(buildCoordinatorBody()),
                ),
            );

            const hasRateLimit = responses.some(
                (res) => res.statusCode === 429,
            );
            expect(hasRateLimit).toBe(true);
        });

        it("independencia: un usuario legítimo no se ve afectado por rate-limit ajeno", async () => {
            await seedPersonalEvent();
            const tokenLegitimo = generateToken({
                employeeId: TEST_LEGIT_EMPLOYEE_ID,
                id: TEST_LEGIT_EMPLOYEE_ID,
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_PERSONAL_EVENT_ID}`)
                .set("Authorization", `Bearer ${tokenLegitimo}`)
                .send(buildCoordinatorBody());

            expect(res.statusCode).not.toBe(429);
        });
    });
});
