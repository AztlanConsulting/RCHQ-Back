// tests/integration/eventHouseUpdate.integration.test.js
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
const TEST_OTHER_EVENT_TYPE_ID = randomUUID();
const TEST_PRIVILEGE_EDIT_ID = randomUUID();
const TEST_PRIVILEGE_VIEW_ID = randomUUID();
const TEST_HOUSE_EVENT_ID = randomUUID();
const TEST_CREATE_ACTION_ID = "even-001";
const TEST_UPDATE_ACTION_ID = "even-005";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const API_BASE = "/event/house";

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

const buildValidUpdateBody = (overrides = {}) => ({
    eventTypeId: TEST_EVENT_TYPE_ID,
    name: "Reunión actualizada",
    start: "2026-06-15T09:00:00-06:00",
    end: "2026-06-15T11:00:00-06:00",
    allDay: false,
    isFreeDay: false,
    description: "Descripción actualizada",
    ...overrides,
});

const seedHouseEvent = async (overrides = {}) => {
    return await prisma.house_event.create({
        data: {
            house_event_id: TEST_HOUSE_EVENT_ID,
            event_type_id: TEST_EVENT_TYPE_ID,
            house_id: TEST_HOUSE_ID,
            name: "Evento original",
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

    // ─── Event Types ────────────────────────────
    await prisma.event_type.create({
        data: {
            event_type_id: TEST_EVENT_TYPE_ID,
            name: `Reunion Update Test ${TEST_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    await prisma.event_type.create({
        data: {
            event_type_id: TEST_OTHER_EVENT_TYPE_ID,
            name: `Festivo Update Test ${TEST_OTHER_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    // ─── Privilegios ────────────────────────────
    const editPrivilegeId = await getOrCreatePrivilegeId(
        "editEvent",
        TEST_PRIVILEGE_EDIT_ID,
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

    // ─── Actions (para logs) ────────────────────
    await prisma.action.upsert({
        where: { action_id: TEST_CREATE_ACTION_ID },
        update: {
            description: "Evento de casa creado con éxito",
            important: false,
        },
        create: {
            action_id: TEST_CREATE_ACTION_ID,
            description: "Evento de casa creado con éxito",
            important: false,
        },
    });

    await prisma.action.upsert({
        where: { action_id: TEST_UPDATE_ACTION_ID },
        update: {
            description: "Evento de casa actualizado con éxito",
            important: false,
        },
        create: {
            action_id: TEST_UPDATE_ACTION_ID,
            description: "Evento de casa actualizado con éxito",
            important: false,
        },
    });

    // ─── Casas ──────────────────────────────────
    await prisma.house.create({
        data: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Update Test 1",
            location: "Querétaro",
            phone_number: "4421234568",
            description: "Casa principal para tests de update",
            image: "test_update1.jpg",
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_OTHER_HOUSE_ID,
            name: "Casa Update Test 2",
            location: "Querétaro",
            phone_number: "4429876544",
            description: "Casa secundaria para tests de update",
            image: "test_update2.jpg",
        },
    });

    // ─── Coordinador ────────────────────────────
    await prisma.employee.create({
        data: {
            employee_id: TEST_COORDINATOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: coordinatorRoleId,
            name: "Coordinador",
            surname: "Update Test",
            email: `coord_upd_${TEST_COORDINATOR_ID.slice(0, 8)}@test.com`,
            password: "123456",
            curp: "UPDC900101HDFRRS01",
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
                surname: "Update Limit",
                email: `rate_upd_${TEST_RATE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "UPDR900101HDFRRS02",
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
                surname: "Update Rate",
                email: `legit_upd_${TEST_LEGIT_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "UPDL900101HDFRRS03",
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
        where: {
            OR: [
                { event_type_id: TEST_EVENT_TYPE_ID },
                { event_type_id: TEST_OTHER_EVENT_TYPE_ID },
            ],
        },
    });

    await prisma.logs.deleteMany({
        where: {
            action_id: {
                in: [TEST_CREATE_ACTION_ID, TEST_UPDATE_ACTION_ID],
            },
        },
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
describe(`PUT ${API_BASE}/:eventId - Integration & Security`, () => {
    // ──────────────────────────────────────────────────────
    //  1. COMPORTAMIENTO ESPERADO
    // ──────────────────────────────────────────────────────
    describe("1. Comportamiento esperado", () => {
        it("actualiza un evento con hora exitosamente (200)", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({ name: "Nombre actualizado" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.houseEvent).toBeDefined();
            expect(res.body.data.houseEvent.name).toBe("Nombre actualizado");

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: TEST_HOUSE_EVENT_ID },
            });
            expect(inDb).not.toBeNull();
            expect(inDb.name).toBe("Nombre actualizado");
        });

        it("actualiza un evento allDay de un solo día y suma un día al end en BD", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                start: "2026-06-15",
                end: "2026-06-15",
                allDay: true,
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: TEST_HOUSE_EVENT_ID },
            });
            expect(inDb.start.toISOString()).toBe("2026-06-15T06:00:00.000Z");
            expect(inDb.end.toISOString()).toBe("2026-06-16T06:00:00.000Z");
        });

        it("actualiza un evento allDay de varios días y suma un día al end en BD", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                start: "2026-06-15",
                end: "2026-06-17",
                allDay: true,
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: TEST_HOUSE_EVENT_ID },
            });
            expect(inDb.start.toISOString()).toBe("2026-06-15T06:00:00.000Z");
            expect(inDb.end.toISOString()).toBe("2026-06-18T06:00:00.000Z");
        });

        it("actualiza sin description y lo guarda como null en BD", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody();
            delete body.description;

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.houseEvent.description).toBeNull();
        });

        it("aplica allDay=false por defecto si no se envía", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody();
            delete body.allDay;

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.houseEvent.allDay).toBe(false);
        });

        it("registra un log en BD al actualizar el evento", async () => {
            await seedHouseEvent();
            const token = generateToken();

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(200);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });
            expect(logsAfter).toBeGreaterThan(logsBefore);
        });
    });

    // ──────────────────────────────────────────────────────
    //  2. FUZZING Y MANIPULACIÓN DE PARÁMETROS
    // ──────────────────────────────────────────────────────
    describe("2. Fuzzing y Manipulación de Parámetros (Inputs destructivos)", () => {
        it("retorna 422 si el body está vacío", async () => {
            await seedHouseEvent();
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si el name excede 70 caracteres", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({ name: "a".repeat(71) });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("rechaza un name con caracteres maliciosos (XSS attempt)", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                name: "<script>alert('xss')</script>",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("rechaza un description con caracteres de SQL injection", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                description: "'; DROP TABLE house_event;--",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si eventTypeId no es un UUID válido", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({ eventTypeId: "no-es-uuid" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
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
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(404);
        });

        it("retorna 422 si start no tiene timezone con evento por hora", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                start: "2026-06-15T09:00:00",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si end es anterior a start", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                start: "2026-06-15T11:00:00-06:00",
                end: "2026-06-15T09:00:00-06:00",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si la fecha es imposible (mes 13)", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                start: "2026-13-15T09:00:00-06:00",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si description excede 250 caracteres", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                description: "a".repeat(251),
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("ignora campos extra en el body (no los persiste)", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                hackerField: "owned",
                house_event_id: "FAKE_ID_INJECTION",
                created_at: "1970-01-01",
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.houseEvent.houseEventId).toBe(
                TEST_HOUSE_EVENT_ID,
            );
        });

        it("rechaza payload con tipos incorrectos", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                name: { malicious: "object" },
                start: ["array", "instead", "of", "string"],
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });
    });

    // ──────────────────────────────────────────────────────
    //  3. LÓGICA DE NEGOCIO: EMPALMES
    // ──────────────────────────────────────────────────────
    describe("3. Lógica de negocio: Empalmes", () => {
        it("retorna 409 si hay empalme con otro evento de la misma casa", async () => {
            await seedHouseEvent();
            const token = generateToken();

            await prisma.house_event.create({
                data: {
                    house_event_id: randomUUID(),
                    event_type_id: TEST_EVENT_TYPE_ID,
                    house_id: TEST_HOUSE_ID,
                    name: "Evento bloqueante",
                    start: new Date("2026-06-20T15:00:00.000Z"),
                    end: new Date("2026-06-20T17:00:00.000Z"),
                    all_day: false,
                    is_free_day: false,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidUpdateBody({
                        start: "2026-06-20T09:00:00-06:00",
                        end: "2026-06-20T11:00:00-06:00",
                    }),
                );

            expect(res.statusCode).toBe(409);
            expect(res.body.data.collisions).toBeDefined();
            expect(res.body.data.collisions.length).toBeGreaterThan(0);
        });

        it("el evento actualizado no colisiona con su propio rango de tiempo anterior", async () => {
            await seedHouseEvent();
            const token = generateToken();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidUpdateBody({
                        name: "Mismo horario actualizado",
                        start: "2026-06-15T09:00:00-06:00",
                        end: "2026-06-15T11:00:00-06:00",
                    }),
                );

            expect(res.statusCode).toBe(200);
            expect(res.body.data.houseEvent.name).toBe(
                "Mismo horario actualizado",
            );
        });

        it("permite actualizar con forceOverlap=true aunque haya empalme", async () => {
            await seedHouseEvent();
            const token = generateToken();

            await prisma.house_event.create({
                data: {
                    house_event_id: randomUUID(),
                    event_type_id: TEST_EVENT_TYPE_ID,
                    house_id: TEST_HOUSE_ID,
                    name: "Evento bloqueante",
                    start: new Date("2026-06-20T15:00:00.000Z"),
                    end: new Date("2026-06-20T17:00:00.000Z"),
                    all_day: false,
                    is_free_day: false,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidUpdateBody({
                        start: "2026-06-20T09:00:00-06:00",
                        end: "2026-06-20T11:00:00-06:00",
                        forceOverlap: true,
                    }),
                );

            expect(res.statusCode).toBe(200);
        });

        it("NO detecta empalme si los eventos son de casas distintas", async () => {
            await seedHouseEvent();
            const token = generateToken();

            await prisma.house_event.create({
                data: {
                    house_event_id: randomUUID(),
                    event_type_id: TEST_EVENT_TYPE_ID,
                    house_id: TEST_OTHER_HOUSE_ID,
                    name: "Evento otra casa",
                    start: new Date("2026-06-20T15:00:00.000Z"),
                    end: new Date("2026-06-20T17:00:00.000Z"),
                    all_day: false,
                    is_free_day: false,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidUpdateBody({
                        start: "2026-06-20T09:00:00-06:00",
                        end: "2026-06-20T11:00:00-06:00",
                    }),
                );

            expect(res.statusCode).toBe(200);
        });

        it("detecta empalme parcial (evento que solapa solo parte del horario)", async () => {
            await seedHouseEvent();
            const token = generateToken();

            await prisma.house_event.create({
                data: {
                    house_event_id: randomUUID(),
                    event_type_id: TEST_EVENT_TYPE_ID,
                    house_id: TEST_HOUSE_ID,
                    name: "Evento parcialmente solapado",
                    start: new Date("2026-06-20T16:30:00.000Z"),
                    end: new Date("2026-06-20T18:30:00.000Z"),
                    all_day: false,
                    is_free_day: false,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidUpdateBody({
                        name: "Evento solapado",
                        start: "2026-06-20T09:00:00-06:00",
                        end: "2026-06-20T11:00:00-06:00",
                    }),
                );

            expect(res.statusCode).toBe(409);
        });

        it("NO detecta empalme si los eventos solo se tocan en el extremo", async () => {
            await seedHouseEvent();
            const token = generateToken();

            await prisma.house_event.create({
                data: {
                    house_event_id: randomUUID(),
                    event_type_id: TEST_EVENT_TYPE_ID,
                    house_id: TEST_HOUSE_ID,
                    name: "Evento contiguo",
                    start: new Date("2026-06-20T17:00:00.000Z"),
                    end: new Date("2026-06-20T19:00:00.000Z"),
                    all_day: false,
                    is_free_day: false,
                },
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidUpdateBody({
                        name: "Evento actualizado contiguo",
                        start: "2026-06-20T09:00:00-06:00",
                        end: "2026-06-20T11:00:00-06:00",
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
            await seedHouseEvent();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está manipulado o mal formado", async () => {
            await seedHouseEvent();

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", "Bearer token_falso_para_hackear.123")
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está expirado", async () => {
            await seedHouseEvent();
            const expiredToken = generateToken({}, { expiresIn: "-1s" });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${expiredToken}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está firmado con secret incorrecto", async () => {
            await seedHouseEvent();
            const fakeToken = jwt.sign(
                {
                    employeeId: TEST_COORDINATOR_ID,
                    role: "Coordinador",
                    houseId: TEST_HOUSE_ID,
                    privileges: ["editEvent"],
                },
                "secret_incorrecto",
                { expiresIn: "1h" },
            );

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${fakeToken}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 si el rol del usuario no es Coordinador", async () => {
            await seedHouseEvent();
            const token = generateToken({
                role: "Mantenimiento",
                privileges: ["editEvent"],
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene el privilegio editEvent", async () => {
            await seedHouseEvent();
            const token = generateToken({ privileges: ["viewEvents"] });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene privilegios definidos", async () => {
            await seedHouseEvent();
            const token = generateToken({ privileges: [] });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(403);
        });

        it("Administrador NO puede actualizar eventos de casa (ruta restringida a Coordinador)", async () => {
            await seedHouseEvent();
            const adminToken = generateToken({
                role: "Administrador",
                privileges: ["editEvent"],
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).toBe(403);
        });
    });

    // ──────────────────────────────────────────────────────
    //  5. INTEGRIDAD DE DATOS
    // ──────────────────────────────────────────────────────
    describe("5. Integridad de datos", () => {
        it("no modifica el evento en BD si la validación falla", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({ name: "" });

            await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: TEST_HOUSE_EVENT_ID },
            });
            expect(inDb.name).toBe("Evento original");
        });

        it("no modifica el evento si hay empalme y forceOverlap=false", async () => {
            await seedHouseEvent();
            const token = generateToken();

            await prisma.house_event.create({
                data: {
                    house_event_id: randomUUID(),
                    event_type_id: TEST_EVENT_TYPE_ID,
                    house_id: TEST_HOUSE_ID,
                    name: "Evento bloqueante integridad",
                    start: new Date("2026-06-20T15:00:00.000Z"),
                    end: new Date("2026-06-20T17:00:00.000Z"),
                    all_day: false,
                    is_free_day: false,
                },
            });

            await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidUpdateBody({
                        name: "Nombre que no debe guardarse",
                        start: "2026-06-20T09:00:00-06:00",
                        end: "2026-06-20T11:00:00-06:00",
                    }),
                );

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: TEST_HOUSE_EVENT_ID },
            });
            expect(inDb.name).toBe("Evento original");
        });

        it("persiste correctamente todos los campos actualizados en BD", async () => {
            await seedHouseEvent();
            const token = generateToken();
            const body = buildValidUpdateBody({
                name: "Evento persistencia verificada",
                description: "Descripción persistencia",
                eventTypeId: TEST_OTHER_EVENT_TYPE_ID,
                isFreeDay: true,
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(200);

            const inDb = await prisma.house_event.findUnique({
                where: { house_event_id: TEST_HOUSE_EVENT_ID },
            });

            expect(inDb.name).toBe("Evento persistencia verificada");
            expect(inDb.description).toBe("Descripción persistencia");
            expect(inDb.event_type_id).toBe(TEST_OTHER_EVENT_TYPE_ID);
            expect(inDb.house_id).toBe(TEST_HOUSE_ID);
            expect(inDb.is_free_day).toBe(true);
            expect(inDb.all_day).toBe(false);
        });
    });

    // ──────────────────────────────────────────────────────
    //  6. RATE LIMITING
    // ──────────────────────────────────────────────────────
    describe("6. Resiliencia: Rate Limiting", () => {
        it("bloquea con 429 si un usuario autenticado lanza muchas peticiones", async () => {
            await seedHouseEvent();
            const token = generateToken({
                employeeId: TEST_RATE_EMPLOYEE_ID,
                id: TEST_RATE_EMPLOYEE_ID,
            });

            const responses = [];
            for (let i = 0; i < 150; i++) {
                responses.push(
                    request(app)
                        .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                        .set("Authorization", `Bearer ${token}`)
                        .send(buildValidUpdateBody()),
                );
            }

            const results = await Promise.all(responses);
            const hasRateLimit = results.some((res) => res.statusCode === 429);
            expect(hasRateLimit).toBe(true);
        });

        it("bloquea con 429 por IP cuando hay peticiones anónimas masivas", async () => {
            await seedHouseEvent();

            const responses = [];
            for (let i = 0; i < 150; i++) {
                responses.push(
                    request(app)
                        .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                        .send(buildValidUpdateBody()),
                );
            }

            const results = await Promise.all(responses);
            const hasRateLimit = results.some((res) => res.statusCode === 429);
            expect(hasRateLimit).toBe(true);
        });

        it("independencia: un usuario legítimo no se ve afectado por rate-limit ajeno", async () => {
            await seedHouseEvent();
            const tokenLegitimo = generateToken({
                employeeId: TEST_LEGIT_EMPLOYEE_ID,
                id: TEST_LEGIT_EMPLOYEE_ID,
            });

            const res = await request(app)
                .put(`${API_BASE}/${TEST_HOUSE_EVENT_ID}`)
                .set("Authorization", `Bearer ${tokenLegitimo}`)
                .send(buildValidUpdateBody());

            expect(res.statusCode).not.toBe(429);
        });
    });
});
