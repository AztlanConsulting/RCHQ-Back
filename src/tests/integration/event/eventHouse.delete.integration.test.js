const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../../app");
const prisma = require("../../../prisma");

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
const TEST_OTHER_HOUSE_ID = randomUUID();
const TEST_COORDINATOR_ID = randomUUID();
const TEST_RATE_EMPLOYEE_ID = randomUUID();
const TEST_LEGIT_EMPLOYEE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_ADMIN_ROLE_ID = randomUUID();
const TEST_EMPLOYEE_ROLE_ID = randomUUID();
const TEST_EVENT_TYPE_ID = randomUUID();
const TEST_PRIVILEGE_DELETE_ID = randomUUID();
const TEST_PRIVILEGE_VIEW_ID = randomUUID();
const TEST_ACTION_ID = "even-005";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const BASE_ROUTE = "/event/house";

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

const createTestEvent = async (overrides = {}) => {
    return await prisma.house_event.create({
        data: {
            house_event_id: randomUUID(),
            event_type_id: TEST_EVENT_TYPE_ID,
            house_id: TEST_HOUSE_ID,
            name: "Evento de prueba",
            start: new Date("2026-06-15T15:00:00.000Z"),
            end: new Date("2026-06-15T17:00:00.000Z"),
            all_day: false,
            is_free_day: false,
            ...overrides,
        },
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
    await getOrCreateRoleId("Administrador", TEST_ADMIN_ROLE_ID);
    await getOrCreateRoleId("Mantenimiento", TEST_EMPLOYEE_ROLE_ID);

    // ─── Event Type ─────────────────────────────
    await prisma.event_type.create({
        data: {
            event_type_id: TEST_EVENT_TYPE_ID,
            name: `Reunion Delete Test ${TEST_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    // ─── Privilegios ────────────────────────────
    const deletePrivilegeId = await getOrCreatePrivilegeId(
        "deleteEvent",
        TEST_PRIVILEGE_DELETE_ID,
    );
    const viewPrivilegeId = await getOrCreatePrivilegeId(
        "viewEvents",
        TEST_PRIVILEGE_VIEW_ID,
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
                role_id: coordinatorRoleId,
                privilege_id: viewPrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: coordinatorRoleId,
            privilege_id: viewPrivilegeId,
        },
    });

    // ─── Action (para logs) ─────────────────────
    await prisma.action.upsert({
        where: { action_id: TEST_ACTION_ID },
        update: {
            description: "Evento de casa eliminado con éxito",
            important: true,
        },
        create: {
            action_id: TEST_ACTION_ID,
            description: "Evento de casa eliminado con éxito",
            important: true,
        },
    });

    // ─── Casas ──────────────────────────────────
    await prisma.house.create({
        data: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Delete Test 1",
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa principal para tests de delete",
            image: "test_del_1.jpg",
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_OTHER_HOUSE_ID,
            name: "Casa Delete Test 2",
            location: "Querétaro",
            phone_number: "4429876543",
            description: "Casa secundaria para tests de delete",
            image: "test_del_2.jpg",
        },
    });

    // ─── Empleados ──────────────────────────────
    await prisma.employee.create({
        data: {
            employee_id: TEST_COORDINATOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: coordinatorRoleId,
            name: "Coordinador",
            surname: "DeleteTest",
            email: `coord_del_${TEST_COORDINATOR_ID.slice(0, 8)}@test.com`,
            password: "123456",
            curp: "DLTC900101HDFRRS01",
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
                employee_id: TEST_RATE_EMPLOYEE_ID,
                house_id: TEST_HOUSE_ID,
                role_id: coordinatorRoleId,
                name: "Rate",
                surname: "DeleteLimit",
                email: `rate_del_${TEST_RATE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "DLTR900101HDFRRS02",
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
                surname: "DeleteRate",
                email: `legit_del_${TEST_LEGIT_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "DLTL900101HDFRRS03",
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

const cleanDb = async () => {
    await prisma.logs.deleteMany({
        where: {
            employee_id: {
                in: [
                    TEST_COORDINATOR_ID,
                    TEST_RATE_EMPLOYEE_ID,
                    TEST_LEGIT_EMPLOYEE_ID,
                ],
            },
        },
    });

    await prisma.house_event.deleteMany({
        where: {
            OR: [
                { house_id: TEST_HOUSE_ID },
                { house_id: TEST_OTHER_HOUSE_ID },
            ],
        },
    });

    await prisma.employee.deleteMany({
        where: {
            employee_id: {
                in: [
                    TEST_COORDINATOR_ID,
                    TEST_RATE_EMPLOYEE_ID,
                    TEST_LEGIT_EMPLOYEE_ID,
                ],
            },
        },
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

const cleanEvents = async () => {
    await prisma.logs.deleteMany({
        where: {
            employee_id: {
                in: [
                    TEST_COORDINATOR_ID,
                    TEST_RATE_EMPLOYEE_ID,
                    TEST_LEGIT_EMPLOYEE_ID,
                ],
            },
        },
    });

    await prisma.house_event.deleteMany({
        where: {
            OR: [
                { house_id: TEST_HOUSE_ID },
                { house_id: TEST_OTHER_HOUSE_ID },
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
        it("elimina el evento exitosamente y retorna 200", async () => {
            const token = generateToken();
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe(
                "Evento de casa eliminado correctamente.",
            );
        });

        it("el evento queda con is_deleted=true en BD (soft delete)", async () => {
            const token = generateToken();
            const event = await createTestEvent();

            await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: event.house_event_id },
            });

            expect(inDb).not.toBeNull();
            expect(inDb.is_deleted).toBe(true);
        });

        it("el registro no se borra físicamente de la BD", async () => {
            const token = generateToken();
            const event = await createTestEvent();

            await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const count = await prisma.house_event.count({
                where: { house_event_id: event.house_event_id },
            });

            expect(count).toBe(1);
        });

        it("registra un log en BD al eliminar el evento", async () => {
            const token = generateToken();
            const event = await createTestEvent();

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            expect(logsAfter).toBeGreaterThan(logsBefore);
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
            const event = await createTestEvent({ is_deleted: true });

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });

        it("ignora campos extra en el body (DELETE no necesita body)", async () => {
            const token = generateToken();
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ hackerField: "owned", is_deleted: false });

            expect(res.statusCode).toBe(200);
        });
    });

    // ──────────────────────────────────────────────────────
    //  3. LÓGICA DE NEGOCIO
    // ──────────────────────────────────────────────────────
    describe("3. Lógica de negocio", () => {
        it("retorna 404 si el coordinador intenta eliminar un evento de otra casa", async () => {
            const token = generateToken();
            const eventOtherHouse = await createTestEvent({
                house_id: TEST_OTHER_HOUSE_ID,
            });

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${eventOtherHouse.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });

        it("el evento de la otra casa no se modifica tras el intento fallido", async () => {
            const token = generateToken();
            const eventOtherHouse = await createTestEvent({
                house_id: TEST_OTHER_HOUSE_ID,
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${eventOtherHouse.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: eventOtherHouse.house_event_id },
            });

            expect(inDb.is_deleted).toBe(false);
        });

        it("retorna 404 en el segundo intento de eliminar el mismo evento", async () => {
            const token = generateToken();
            const event = await createTestEvent();

            const res1 = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res1.statusCode).toBe(200);

            const res2 = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res2.statusCode).toBe(404);
        });

        it("no crea un segundo log si el evento ya estaba eliminado", async () => {
            const token = generateToken();
            const event = await createTestEvent({ is_deleted: true });

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            expect(logsAfter).toBe(logsBefore);
        });
    });

    // ──────────────────────────────────────────────────────
    //  4. SEGURIDAD: AUTENTICACIÓN Y AUTORIZACIÓN
    // ──────────────────────────────────────────────────────
    describe("4. Seguridad: Autenticación y Autorización", () => {
        it("retorna 401 si no se envía token", async () => {
            const event = await createTestEvent();

            const res = await request(app).delete(
                `${BASE_ROUTE}/${event.house_event_id}`,
            );

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está manipulado o mal formado", async () => {
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", "Bearer token_falso_para_hackear.123");

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está expirado", async () => {
            const expiredToken = generateToken({}, { expiresIn: "-1s" });
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
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
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${fakeToken}`);

            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 si el rol del usuario no está autorizado", async () => {
            const token = generateToken({ role: "Mantenimiento" });
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: event.house_event_id },
            });
            expect(inDb.is_deleted).toBe(false);
        });

        it("retorna 403 si el usuario no tiene el privilegio deleteEvent", async () => {
            const token = generateToken({ privileges: ["viewEvents"] });
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene privilegios definidos", async () => {
            const token = generateToken({ privileges: [] });
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
        });

        it("un token con houseId distinto recibe 404 y no puede eliminar el evento", async () => {
            const token = generateToken({ houseId: TEST_OTHER_HOUSE_ID });
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: event.house_event_id },
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
            const event = await createTestEvent({
                name: "Evento con datos",
                house_id: TEST_HOUSE_ID,
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: event.house_event_id },
            });

            expect(inDb.name).toBe("Evento con datos");
            expect(inDb.house_id).toBe(TEST_HOUSE_ID);
            expect(inDb.event_type_id).toBe(TEST_EVENT_TYPE_ID);
            expect(inDb.is_deleted).toBe(true);
        });

        it("el evento eliminado no afecta a otros eventos de la casa", async () => {
            const token = generateToken();
            const event1 = await createTestEvent({ name: "Evento 1" });
            const event2 = await createTestEvent({ name: "Evento 2" });

            await request(app)
                .delete(`${BASE_ROUTE}/${event1.house_event_id}`)
                .set("Authorization", `Bearer ${token}`);

            const event2InDb = await prisma.house_event.findUnique({
                where: { house_event_id: event2.house_event_id },
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
            const event = await createTestEvent();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.house_event_id}`)
                .set("Authorization", `Bearer ${tokenLegitimo}`);

            expect(res.statusCode).not.toBe(429);
        });
    });
});
