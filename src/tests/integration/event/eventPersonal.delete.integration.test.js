const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../../app");
const prisma = require("../../../prisma");

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
const TEST_OTHER_HOUSE_ID = randomUUID();
const TEST_COORDINATOR_ID = randomUUID();
const TEST_EMPLOYEE_ID = randomUUID();
const TEST_OTHER_EMPLOYEE_ID = randomUUID();
const TEST_OTHER_HOUSE_COORD_ID = randomUUID();
const TEST_RATE_EMPLOYEE_ID = randomUUID();
const TEST_LEGIT_EMPLOYEE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_EMPLOYEE_ROLE_ID = randomUUID();
const TEST_EVENT_TYPE_ID = randomUUID();
const TEST_PRIVILEGE_DELETE_ID = randomUUID();
const TEST_ACTION_ID = "even-009";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const BASE_ROUTE = "/event/personal";

const ALL_TEST_EMPLOYEE_IDS = [
    TEST_COORDINATOR_ID,
    TEST_EMPLOYEE_ID,
    TEST_OTHER_EMPLOYEE_ID,
    TEST_OTHER_HOUSE_COORD_ID,
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
        privileges: ["deleteEvent", "viewEvents"],
    };

    return jwt.sign(
        { ...defaultPayload, ...payloadOverrides },
        JWT_SECRET,
        signOptions,
    );
};

const createTestPersonalEvent = async (employeeIds, overrides = {}) => {
    const event = await prisma.personal_event.create({
        data: {
            personal_event_id: randomUUID(),
            event_type_id: TEST_EVENT_TYPE_ID,
            date: new Date("2026-07-15"),
            start: new Date("2026-07-15T15:00:00.000Z"),
            end: new Date("2026-07-15T16:00:00.000Z"),
            name: "Cita de prueba",
            all_day: false,
            is_deleted: false,
            ...overrides,
        },
    });

    if (employeeIds.length > 0) {
        await prisma.employee_personal_event.createMany({
            data: employeeIds.map((employeeId) => ({
                personal_event_id: event.personal_event_id,
                employee_id: employeeId,
            })),
        });
    }

    return event;
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

    // ─── Event Type ─────────────────────────────
    await prisma.event_type.create({
        data: {
            event_type_id: TEST_EVENT_TYPE_ID,
            name: `Cita Delete Test ${TEST_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    // ─── Privilegios ────────────────────────────
    const deletePrivilegeId = await getOrCreatePrivilegeId(
        "deleteEvent",
        TEST_PRIVILEGE_DELETE_ID,
    );

    // ─── Relación Role - Privilege ──────────────
    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: coordinatorRoleId,
                privilege_id: deletePrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: coordinatorRoleId,
            privilege_id: deletePrivilegeId,
        },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: employeeRoleId,
                privilege_id: deletePrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: employeeRoleId,
            privilege_id: deletePrivilegeId,
        },
    });

    // ─── Action (para logs) ─────────────────────
    await prisma.action.upsert({
        where: { action_id: TEST_ACTION_ID },
        update: {
            description: "Evento de personal eliminado con éxito",
            important: false,
        },
        create: {
            action_id: TEST_ACTION_ID,
            description: "Evento de personal eliminado con éxito",
            important: false,
        },
    });

    // ─── Casas ──────────────────────────────────
    await prisma.house.create({
        data: {
            house_id: TEST_HOUSE_ID,
            name: "Casa PersonalDel Test 1",
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa principal para tests de delete personal",
            image: "test_pd1.jpg",
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_OTHER_HOUSE_ID,
            name: "Casa PersonalDel Test 2",
            location: "Querétaro",
            phone_number: "4429876543",
            description: "Casa secundaria para tests de delete personal",
            image: "test_pd2.jpg",
        },
    });

    // ─── Empleados ──────────────────────────────
    await prisma.employee.create({
        data: {
            employee_id: TEST_COORDINATOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: coordinatorRoleId,
            name: "Coordinador",
            surname: "PersonalDel",
            email: `coord_pd_${TEST_COORDINATOR_ID.slice(0, 8)}@test.com`,
            password: "123456",
            curp: "PDLC900101HDFRRS01",
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
                surname: "PersonalDel",
                email: `empl_pd_${TEST_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PDLE900101HDFRRS02",
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
                surname: "PersonalDel",
                email: `other_pd_${TEST_OTHER_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PDLO900101HDFRRS03",
                birth_date: new Date("1990-01-01"),
                start_date: new Date(),
                is_active: true,
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
            },
            {
                employee_id: TEST_OTHER_HOUSE_COORD_ID,
                house_id: TEST_OTHER_HOUSE_ID,
                role_id: coordinatorRoleId,
                name: "OtraCasa",
                surname: "PersonalDel",
                email: `other_house_pd_${TEST_OTHER_HOUSE_COORD_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PDLH900101HDFRRS04",
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
                surname: "PersonalDelLimit",
                email: `rate_pd_${TEST_RATE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PDLR900101HDFRRS05",
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
                surname: "PersonalDelRate",
                email: `legit_pd_${TEST_LEGIT_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "PDLL900101HDFRRS06",
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

// ─── Hooks ────────────────────────────────────────────────
beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

beforeEach(async () => {
    await cleanEvents();
});

// ─── SUITE DE PRUEBAS ─────────────────────────────────────
describe(`DELETE ${BASE_ROUTE}/:eventId - Integration & Security`, () => {
    // ──────────────────────────────────────────────────────
    //  1. COMPORTAMIENTO ESPERADO
    // ──────────────────────────────────────────────────────
    describe("1. Comportamiento esperado", () => {
        it("coordinador elimina evento de personal y retorna 200", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe(
                "Evento de personal eliminado correctamente.",
            );
        });

        it("el evento queda con is_deleted=true en BD (soft delete)", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: event.personal_event_id },
            });

            expect(inDb).not.toBeNull();
            expect(inDb.is_deleted).toBe(true);
        });

        it("el registro no se borra físicamente de la BD", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const count = await prisma.personal_event.count({
                where: { personal_event_id: event.personal_event_id },
            });

            expect(count).toBe(1);
        });

        it("registra un log en BD al eliminar el evento", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            expect(logsAfter).toBeGreaterThan(logsBefore);
        });

        it("el log registra el id del empleado que eliminó, no el del asignado", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const log = await prisma.logs.findFirst({
                where: {
                    employee_id: TEST_COORDINATOR_ID,
                    action_id: TEST_ACTION_ID,
                },
                orderBy: { moment: "desc" },
            });

            expect(log).not.toBeNull();
            expect(log.employee_id).toBe(TEST_COORDINATOR_ID);
        });
    });

    // ──────────────────────────────────────────────────────
    //  2. FUZZING Y MANIPULACIÓN DE PARÁMETROS
    // ──────────────────────────────────────────────────────
    describe("2. Fuzzing y Manipulación de Parámetros", () => {
        it("retorna 404 si el eventId es un UUID válido que no existe", async () => {
            const token = generateToken();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${randomUUID()}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });

        it("retorna 500 si el eventId no es un UUID válido", async () => {
            const token = generateToken();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/no-es-un-uuid-valido`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(500);
        });

        it("retorna 404 al intentar eliminar un evento que ya fue eliminado", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID], {
                is_deleted: true,
            });

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });

        it("ignora campos extra en el body (DELETE no necesita body)", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ hackerField: "owned", is_deleted: false });

            expect(res.statusCode).toBe(200);
        });
    });

    // ──────────────────────────────────────────────────────
    //  3. LÓGICA DE NEGOCIO
    // ──────────────────────────────────────────────────────
    describe("3. Lógica de negocio", () => {
        it("retorna 403 si un empleado con rol Mantenimiento intenta eliminar", async () => {
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
                privileges: ["deleteEvent"],
            });
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
        });

        it("el evento no se modifica tras el intento de un empleado con rol Mantenimiento", async () => {
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
                privileges: ["deleteEvent"],
            });
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: event.personal_event_id },
            });

            expect(inDb.is_deleted).toBe(false);
        });

        it("coordinador puede eliminar evento aunque no esté asignado a él", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
        });

        it("retorna 404 en el segundo intento de eliminar el mismo evento", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res1 = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res1.statusCode).toBe(200);

            const res2 = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res2.statusCode).toBe(404);
        });

        it("no crea un segundo log si el evento ya estaba eliminado", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID], {
                is_deleted: true,
            });

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            expect(logsAfter).toBe(logsBefore);
        });

        it("eliminar un evento con múltiples empleados asignados retorna 200", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([
                TEST_EMPLOYEE_ID,
                TEST_OTHER_EMPLOYEE_ID,
            ]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: event.personal_event_id },
            });
            expect(inDb.is_deleted).toBe(true);
        });
    });

    // ──────────────────────────────────────────────────────
    //  4. SEGURIDAD: AUTENTICACIÓN Y AUTORIZACIÓN
    // ──────────────────────────────────────────────────────
    describe("4. Seguridad: Autenticación y Autorización", () => {
        it("retorna 401 si no se envía token", async () => {
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app).delete(
                `${BASE_ROUTE}/${event.personal_event_id}`,
            );

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está manipulado o mal formado", async () => {
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", "Bearer token_falso_para_hackear.123");

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está expirado", async () => {
            const expiredToken = generateToken({}, { expiresIn: "-1s" });
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${expiredToken}`);

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está firmado con secret incorrecto", async () => {
            const fakeToken = jwt.sign(
                {
                    employeeId: TEST_COORDINATOR_ID,
                    role: "Coordinador",
                    houseId: TEST_HOUSE_ID,
                    privileges: ["deleteEvent"],
                },
                "secret_incorrecto",
                { expiresIn: "1h" },
            );
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${fakeToken}`);

            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 si el usuario no tiene el privilegio deleteEvent", async () => {
            const token = generateToken({ privileges: ["viewEvents"] });
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene privilegios definidos", async () => {
            const token = generateToken({ privileges: [] });
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
        });

        it("coordinador de otra casa retorna 404 al intentar eliminar el evento", async () => {
            const token = generateToken({
                employeeId: TEST_OTHER_HOUSE_COORD_ID,
                id: TEST_OTHER_HOUSE_COORD_ID,
                role: "Coordinador",
                houseId: TEST_OTHER_HOUSE_ID,
            });
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });

        it("el evento no se modifica tras el intento de coordinador de otra casa", async () => {
            const token = generateToken({
                employeeId: TEST_OTHER_HOUSE_COORD_ID,
                id: TEST_OTHER_HOUSE_COORD_ID,
                role: "Coordinador",
                houseId: TEST_OTHER_HOUSE_ID,
            });
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: event.personal_event_id },
            });

            expect(inDb.is_deleted).toBe(false);
        });
    });

    // ──────────────────────────────────────────────────────
    //  5. INTEGRIDAD DE DATOS
    // ──────────────────────────────────────────────────────
    describe("5. Integridad de datos", () => {
        it("los datos del evento no cambian tras el soft delete (solo is_deleted)", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID], {
                name: "Evento con datos",
                all_day: false,
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const inDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: event.personal_event_id },
            });

            expect(inDb.name).toBe("Evento con datos");
            expect(inDb.event_type_id).toBe(TEST_EVENT_TYPE_ID);
            expect(inDb.all_day).toBe(false);
            expect(inDb.is_deleted).toBe(true);
        });

        it("las relaciones employee_personal_event se conservan tras el soft delete", async () => {
            const token = generateToken();
            const event = await createTestPersonalEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const junctionRows = await prisma.employee_personal_event.findMany({
                where: { personal_event_id: event.personal_event_id },
            });

            expect(junctionRows).toHaveLength(1);
            expect(junctionRows[0].employee_id).toBe(TEST_EMPLOYEE_ID);
        });

        it("el evento eliminado no afecta a otros eventos del mismo empleado", async () => {
            const token = generateToken();
            const event1 = await createTestPersonalEvent([TEST_EMPLOYEE_ID], {
                name: "Evento 1",
            });
            const event2 = await createTestPersonalEvent([TEST_EMPLOYEE_ID], {
                name: "Evento 2",
                start: new Date("2026-07-15T17:00:00.000Z"),
                end: new Date("2026-07-15T18:00:00.000Z"),
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event1.personal_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const event2InDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: event2.personal_event_id },
            });

            expect(event2InDb.is_deleted).toBe(false);
        });
    });

    // ──────────────────────────────────────────────────────
    //  6. RESILIENCIA: RATE LIMITING
    // ──────────────────────────────────────────────────────
    describe("6. Resiliencia: Rate Limiting", () => {
        it("bloquea con 429 si un usuario autenticado lanza muchas peticiones", async () => {
            const token = generateToken({
                employeeId: TEST_RATE_EMPLOYEE_ID,
                id: TEST_RATE_EMPLOYEE_ID,
            });

            const nonExistentId = randomUUID();
            const responses = [];
            for (let i = 0; i < 150; i++) {
                responses.push(
                    request(app)
                        .delete(`${BASE_ROUTE}/${nonExistentId}`)
                        .set("Authorization", `Bearer ${token}`),
                );
            }

            const results = await Promise.all(responses);
            const hasRateLimit = results.some((res) => res.statusCode === 429);
            expect(hasRateLimit).toBe(true);
        });

        it("bloquea con 429 por IP cuando hay peticiones anónimas masivas", async () => {
            const nonExistentId = randomUUID();
            const responses = [];
            for (let i = 0; i < 150; i++) {
                responses.push(
                    request(app).delete(`${BASE_ROUTE}/${nonExistentId}`),
                );
            }

            const results = await Promise.all(responses);
            const hasRateLimit = results.some((res) => res.statusCode === 429);
            expect(hasRateLimit).toBe(true);
        });

        it("independencia: un usuario legítimo no se ve afectado por rate-limit ajeno", async () => {
            const tokenLegitimo = generateToken({
                employeeId: TEST_LEGIT_EMPLOYEE_ID,
                id: TEST_LEGIT_EMPLOYEE_ID,
            });
            const event = await createTestPersonalEvent([TEST_LEGIT_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}`)
                .set("Authorization", `Bearer ${tokenLegitimo}`);

            expect(res.statusCode).not.toBe(429);
        });
    });
});
