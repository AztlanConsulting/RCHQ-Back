const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");
const prisma = require("../../prisma");

const TEST_HOUSE_ID = randomUUID();
const TEST_ADMIN_ID = randomUUID();
const TEST_RATE_EMPLOYEE_ID = randomUUID();
const TEST_LEGIT_EMPLOYEE_ID = randomUUID();
const TEST_ADMIN_ROLE_ID = randomUUID();
const TEST_COORDINATOR_ROLE_ID = randomUUID();
const TEST_EVENT_TYPE_ID = randomUUID();
const TEST_OTHER_EVENT_TYPE_ID = randomUUID();
const TEST_PRIVILEGE_CREATE_ID = randomUUID();
const TEST_PRIVILEGE_VIEW_ID = randomUUID();
const TEST_ACTION_ID = "even-010";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const API_ROUTE = "/event/global/add";

const generateToken = (
    payloadOverrides = {},
    signOptions = { expiresIn: "1h" },
) => {
    const defaultPayload = {
        employeeId: TEST_ADMIN_ID,
        id: TEST_ADMIN_ID,
        role: "Administrador",
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
    eventTypeId: TEST_EVENT_TYPE_ID,
    name: "Día festivo nacional",
    start: "2026-07-15T09:00:00-06:00",
    end: "2026-07-15T11:00:00-06:00",
    allDay: false,
    isFreeDay: true,
    isRecurring: false,
    description: "Festivo oficial para todas las casas",
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
    const adminRoleId = await getOrCreateRoleId(
        "Administrador",
        TEST_ADMIN_ROLE_ID,
    );
    const coordinatorRoleId = await getOrCreateRoleId(
        "Coordinador",
        TEST_COORDINATOR_ROLE_ID,
    );

    await prisma.event_type.create({
        data: {
            event_type_id: TEST_EVENT_TYPE_ID,
            name: `Festivo Test ${TEST_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    await prisma.event_type.create({
        data: {
            event_type_id: TEST_OTHER_EVENT_TYPE_ID,
            name: `Otro Test ${TEST_OTHER_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    const createPrivilegeId = await getOrCreatePrivilegeId(
        "createEvent",
        TEST_PRIVILEGE_CREATE_ID,
    );
    const viewPrivilegeId = await getOrCreatePrivilegeId(
        "viewEvents",
        TEST_PRIVILEGE_VIEW_ID,
    );

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: adminRoleId,
                privilege_id: createPrivilegeId,
            },
        },
        update: {},
        create: { role_id: adminRoleId, privilege_id: createPrivilegeId },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: adminRoleId,
                privilege_id: viewPrivilegeId,
            },
        },
        update: {},
        create: { role_id: adminRoleId, privilege_id: viewPrivilegeId },
    });

    await prisma.action.upsert({
        where: { action_id: TEST_ACTION_ID },
        update: {
            description: "Evento global creado con éxito",
            important: false,
        },
        create: {
            action_id: TEST_ACTION_ID,
            description: "Evento global creado con éxito",
            important: false,
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Admin Test Global",
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa para tests de eventos globales",
            image: "admin_test.jpg",
        },
    });

    await prisma.employee.createMany({
        data: [
            {
                employee_id: TEST_ADMIN_ID,
                house_id: TEST_HOUSE_ID,
                role_id: adminRoleId,
                name: "Administrador",
                surname: "Test",
                email: `admin_${TEST_ADMIN_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "EHTG900101HDFRRS01",
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
                role_id: adminRoleId,
                name: "Rate",
                surname: "Limit",
                email: `rate_${TEST_RATE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "EHTR900101HDFRRS02",
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
                role_id: adminRoleId,
                name: "Legitimo",
                surname: "Rate",
                email: `legit_${TEST_LEGIT_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "EHTL900101HDFRRS03",
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
                in: [TEST_ADMIN_ID, TEST_RATE_EMPLOYEE_ID, TEST_LEGIT_EMPLOYEE_ID],
            },
        },
    });

    await prisma.global_event.deleteMany({
        where: { event_type_id: { in: [TEST_EVENT_TYPE_ID, TEST_OTHER_EVENT_TYPE_ID] } },
    });

    await prisma.employee.deleteMany({
        where: {
            employee_id: {
                in: [TEST_ADMIN_ID, TEST_RATE_EMPLOYEE_ID, TEST_LEGIT_EMPLOYEE_ID],
            },
        },
    });

    await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });

    await prisma.event_type.deleteMany({
        where: {
            event_type_id: { in: [TEST_EVENT_TYPE_ID, TEST_OTHER_EVENT_TYPE_ID] },
        },
    });
};

const cleanEvents = async () => {
    await prisma.logs.deleteMany({
        where: {
            employee_id: {
                in: [TEST_ADMIN_ID, TEST_RATE_EMPLOYEE_ID, TEST_LEGIT_EMPLOYEE_ID],
            },
        },
    });

    await prisma.global_event.deleteMany({
        where: { event_type_id: { in: [TEST_EVENT_TYPE_ID, TEST_OTHER_EVENT_TYPE_ID] } },
    });
};

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

describe(`POST ${API_ROUTE} - Integration & Security`, () => {
    describe("1. Comportamiento esperado", () => {
        it("crea un evento global con hora exitosamente (201)", async () => {
            const token = generateToken();
            const body = buildValidEventBody();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.globalEvent).toBeDefined();
            expect(res.body.data.globalEvent.name).toBe(body.name);

            const inDb = await prisma.global_event.findUnique({
                where: { global_event_id: res.body.data.globalEvent.globalEventId },
            });
            expect(inDb).not.toBeNull();
            expect(inDb.event_type_id).toBe(TEST_EVENT_TYPE_ID);
        });

        it("crea un evento allDay de un solo día y suma un día al end en BD", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                start: "2026-07-15",
                end: "2026-07-15",
                allDay: true,
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const inDb = await prisma.global_event.findUnique({
                where: { global_event_id: res.body.data.globalEvent.globalEventId },
            });
            expect(inDb.start.toISOString()).toBe("2026-07-15T06:00:00.000Z");
            expect(inDb.end.toISOString()).toBe("2026-07-16T06:00:00.000Z");
        });

        it("crea un evento allDay de varios días", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                start: "2026-07-15",
                end: "2026-07-17",
                allDay: true,
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const inDb = await prisma.global_event.findUnique({
                where: { global_event_id: res.body.data.globalEvent.globalEventId },
            });
            expect(inDb.start.toISOString()).toBe("2026-07-15T06:00:00.000Z");
            expect(inDb.end.toISOString()).toBe("2026-07-18T06:00:00.000Z");
        });

        it("crea un evento sin description (campo opcional)", async () => {
            const token = generateToken();
            const body = buildValidEventBody();
            delete body.description;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.globalEvent.description).toBeNull();
        });

        it("aplica allDay=false por defecto si no se envía", async () => {
            const token = generateToken();
            const body = buildValidEventBody();
            delete body.allDay;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.globalEvent.allDay).toBe(false);
        });

        it("aplica isRecurring=false por defecto si no se envía", async () => {
            const token = generateToken();
            const body = buildValidEventBody();
            delete body.isRecurring;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const inDb = await prisma.global_event.findUnique({
                where: { global_event_id: res.body.data.globalEvent.globalEventId },
            });
            expect(inDb.is_recurring).toBe(false);
            expect(inDb.recurrence_type).toBeNull();
        });

        it("crea un evento recurrente con recurrenceType válido", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                isRecurring: true,
                recurrenceType: "yearly",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const inDb = await prisma.global_event.findUnique({
                where: { global_event_id: res.body.data.globalEvent.globalEventId },
            });
            expect(inDb.is_recurring).toBe(true);
            expect(inDb.recurrence_type).toBe("yearly");
        });

        it("registra un log en BD al crear el evento", async () => {
            const token = generateToken();
            const body = buildValidEventBody();

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_ADMIN_ID },
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_ADMIN_ID },
            });
            expect(logsAfter).toBeGreaterThan(logsBefore);
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

        it("rechaza un name con caracteres maliciosos (XSS attempt)", async () => {
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

        it("rechaza un description con caracteres de SQL injection", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                description: "'; DROP TABLE global_event;--",
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

            const count = await prisma.global_event.count({
                where: { event_type_id: { in: [TEST_EVENT_TYPE_ID, TEST_OTHER_EVENT_TYPE_ID] } },
            });
            expect(count).toBe(0);
        });

        it("retorna 422 si start no tiene timezone (evento con hora)", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ start: "2026-07-15T09:00:00" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si start es YYYY-MM-DD pero allDay es false", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                start: "2026-07-15",
                end: "2026-07-15",
                allDay: false,
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si end es anterior a start", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                start: "2026-07-15T11:00:00-06:00",
                end: "2026-07-15T09:00:00-06:00",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si la fecha es imposible (mes 13)", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                start: "2026-13-15T09:00:00-06:00",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it("retorna 422 si description excede 250 caracteres", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ description: "a".repeat(251) });

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
                global_event_id: "FAKE_ID_INJECTION",
                created_at: "1970-01-01",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.data.globalEvent.globalEventId).not.toBe(
                "FAKE_ID_INJECTION",
            );
        });

        it("rechaza payload con tipos incorrectos", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                name: { malicious: "object" },
                start: ["array", "instead", "of", "string"],
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });
    });

    describe("3. Validación de recurrencia", () => {
        it("retorna 422 si isRecurring=true y falta recurrenceType", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                isRecurring: true,
                recurrenceType: null,
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
            expect(
                res.body.data.errors.some((e) => e.field === "recurrenceType"),
            ).toBe(true);
        });

        it("retorna 422 si recurrenceType tiene un valor no permitido", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                isRecurring: true,
                recurrenceType: "hourly",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(422);
        });

        it.each(["daily", "weekly", "monthly", "yearly"])(
            "crea el evento con recurrenceType='%s' cuando isRecurring es true",
            async (type) => {
                const token = generateToken();
                const body = buildValidEventBody({
                    isRecurring: true,
                    recurrenceType: type,
                });

                const res = await request(app)
                    .post(API_ROUTE)
                    .set("Authorization", `Bearer ${token}`)
                    .send(body);

                expect(res.statusCode).toBe(201);

                const inDb = await prisma.global_event.findUnique({
                    where: {
                        global_event_id: res.body.data.globalEvent.globalEventId,
                    },
                });
                expect(inDb.recurrence_type).toBe(type);

                await cleanEvents();
            },
        );

        it("persiste recurrenceType=null si isRecurring=false aunque se envíe un valor", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                isRecurring: false,
                recurrenceType: "weekly",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const inDb = await prisma.global_event.findUnique({
                where: { global_event_id: res.body.data.globalEvent.globalEventId },
            });
            expect(inDb.recurrence_type).toBeNull();
        });
    });

    describe("4. Lógica de negocio: Empalmes", () => {
        it("retorna 409 si hay empalme con otro evento global existente", async () => {
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
            expect(res2.body.data.collisions).toBeDefined();
            expect(res2.body.data.collisions.length).toBeGreaterThan(0);
        });

        it("permite crear el evento con forceOverlap=true aunque haya empalme", async () => {
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

            const count = await prisma.global_event.count({
                where: { event_type_id: { in: [TEST_EVENT_TYPE_ID, TEST_OTHER_EVENT_TYPE_ID] } },
            });
            expect(count).toBe(2);
        });

        it("detecta empalme parcial (evento que solapa solo parte del horario)", async () => {
            const token = generateToken();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidEventBody({
                        start: "2026-07-15T09:00:00-06:00",
                        end: "2026-07-15T11:00:00-06:00",
                    }),
                );

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidEventBody({
                        name: "Evento solapado",
                        start: "2026-07-15T10:30:00-06:00",
                        end: "2026-07-15T12:30:00-06:00",
                    }),
                );

            expect(res.statusCode).toBe(409);
        });

        it("NO detecta empalme si los eventos solo se tocan en el extremo", async () => {
            const token = generateToken();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidEventBody({
                        start: "2026-07-15T09:00:00-06:00",
                        end: "2026-07-15T11:00:00-06:00",
                    }),
                );

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(
                    buildValidEventBody({
                        name: "Evento contiguo",
                        start: "2026-07-15T11:00:00-06:00",
                        end: "2026-07-15T13:00:00-06:00",
                    }),
                );

            expect(res.statusCode).toBe(201);
        });
    });

    describe("5. Seguridad: Autenticación y Autorización", () => {
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
                    employeeId: TEST_ADMIN_ID,
                    role: "Administrador",
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

        it("retorna 403 si el rol es Coordinador (solo Administrador puede crear eventos globales)", async () => {
            const token = generateToken({ role: "Coordinador" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el rol es Empleado", async () => {
            const token = generateToken({ role: "Mantenimiento" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEventBody());

            expect(res.statusCode).toBe(403);
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
    });

    describe("6. Integridad de datos", () => {
        it("no crea el evento si falla la validación", async () => {
            const token = generateToken();
            const body = buildValidEventBody({ name: "" });

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const count = await prisma.global_event.count({
                where: { event_type_id: { in: [TEST_EVENT_TYPE_ID, TEST_OTHER_EVENT_TYPE_ID] } },
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

            const testFilter = { where: { event_type_id: { in: [TEST_EVENT_TYPE_ID, TEST_OTHER_EVENT_TYPE_ID] } } };
            const countBefore = await prisma.global_event.count(testFilter);

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const countAfter = await prisma.global_event.count(testFilter);
            expect(countAfter).toBe(countBefore);
        });

        it("persiste todos los datos correctamente en BD", async () => {
            const token = generateToken();
            const body = buildValidEventBody({
                name: "Evento global persistencia",
                description: "Descripción de prueba",
                isFreeDay: true,
                isRecurring: true,
                recurrenceType: "monthly",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const inDb = await prisma.global_event.findUnique({
                where: { global_event_id: res.body.data.globalEvent.globalEventId },
            });

            expect(inDb.name).toBe("Evento global persistencia");
            expect(inDb.description).toBe("Descripción de prueba");
            expect(inDb.event_type_id).toBe(TEST_EVENT_TYPE_ID);
            expect(inDb.all_day).toBe(false);
            expect(inDb.is_free_day).toBe(true);
            expect(inDb.is_recurring).toBe(true);
            expect(inDb.recurrence_type).toBe("monthly");
        });
    });

    describe.skip("7. Resiliencia: Rate Limiting", () => {
        it("bloquea con 429 si un usuario autenticado lanza muchas peticiones", async () => {
            const token = generateToken({
                employeeId: TEST_RATE_EMPLOYEE_ID,
                id: TEST_RATE_EMPLOYEE_ID,
            });

            const statuses = [];
            for (let i = 0; i < 120; i++) {
                const res = await request(app)
                    .post(API_ROUTE)
                    .set("Authorization", `Bearer ${token}`)
                    .send(buildValidEventBody());
                statuses.push(res.statusCode);

                if (res.statusCode === 429) break;
            }

            expect(statuses.includes(429)).toBe(true);
        });

        it("bloquea con 429 por IP cuando hay peticiones anónimas masivas", async () => {
            const statuses = [];
            for (let i = 0; i < 120; i++) {
                const res = await request(app)
                    .post(API_ROUTE)
                    .send(buildValidEventBody());
                statuses.push(res.statusCode);

                if (res.statusCode === 429) break;
            }

            expect(statuses.includes(429)).toBe(true);
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
