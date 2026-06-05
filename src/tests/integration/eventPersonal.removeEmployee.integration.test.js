const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");
const prisma = require("../../prisma");

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
const TEST_TRAINING_EVENT_TYPE_ID = randomUUID();
const TEST_NON_TRAINING_EVENT_TYPE_ID = randomUUID();
const TEST_PRIVILEGE_DELETE_ID = randomUUID();
const TEST_ACTION_ID = "even-010";

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

let trainingEventTypeId = TEST_TRAINING_EVENT_TYPE_ID;
let createdTrainingEventType = false;

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

const createTrainingEvent = async (employeeIds, overrides = {}) => {
    const event = await prisma.personal_event.create({
        data: {
            personal_event_id: randomUUID(),
            event_type_id: trainingEventTypeId,
            date: new Date("2026-07-15"),
            start: new Date("2026-07-15T15:00:00.000Z"),
            end: new Date("2026-07-15T16:00:00.000Z"),
            name: "Capacitación de prueba",
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

const createNonTrainingEvent = async (employeeIds, overrides = {}) => {
    const event = await prisma.personal_event.create({
        data: {
            personal_event_id: randomUUID(),
            event_type_id: TEST_NON_TRAINING_EVENT_TYPE_ID,
            date: new Date("2026-07-15"),
            start: new Date("2026-07-15T15:00:00.000Z"),
            end: new Date("2026-07-15T16:00:00.000Z"),
            name: "Cita médica de prueba",
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

const getOrCreateTrainingEventType = async () => {
    const existing = await prisma.event_type.findFirst({
        where: { name: "Capacitaciones" },
    });

    if (existing) {
        trainingEventTypeId = existing.event_type_id;
        createdTrainingEventType = false;
        return;
    }

    await prisma.event_type.create({
        data: { event_type_id: TEST_TRAINING_EVENT_TYPE_ID, name: "Capacitaciones" },
    });
    trainingEventTypeId = TEST_TRAINING_EVENT_TYPE_ID;
    createdTrainingEventType = true;
};

const seedDependencies = async () => {
    const coordinatorRoleId = await getOrCreateRoleId("Coordinador", TEST_ROLE_ID);
    const employeeRoleId = await getOrCreateRoleId("Mantenimiento", TEST_EMPLOYEE_ROLE_ID);

    await getOrCreateTrainingEventType();

    await prisma.event_type.create({
        data: {
            event_type_id: TEST_NON_TRAINING_EVENT_TYPE_ID,
            name: `Cita RemoveEmpl Test ${TEST_NON_TRAINING_EVENT_TYPE_ID.slice(0, 8)}`,
        },
    });

    const deletePrivilegeId = await getOrCreatePrivilegeId(
        "deleteEvent",
        TEST_PRIVILEGE_DELETE_ID,
    );

    for (const roleId of [coordinatorRoleId, employeeRoleId]) {
        await prisma.role_privilege.upsert({
            where: {
                role_id_privilege_id: { role_id: roleId, privilege_id: deletePrivilegeId },
            },
            update: {},
            create: { role_id: roleId, privilege_id: deletePrivilegeId },
        });
    }

    await prisma.action.upsert({
        where: { action_id: TEST_ACTION_ID },
        update: {
            description: "Empleado eliminado de capacitación con éxito",
            important: false,
        },
        create: {
            action_id: TEST_ACTION_ID,
            description: "Empleado eliminado de capacitación con éxito",
            important: false,
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_HOUSE_ID,
            name: "Casa RemoveEmpl Test 1",
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa principal para tests de eliminar empleado de capacitación",
            image: "test_re1.jpg",
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_OTHER_HOUSE_ID,
            name: "Casa RemoveEmpl Test 2",
            location: "Querétaro",
            phone_number: "4429876543",
            description: "Casa secundaria para tests de eliminar empleado de capacitación",
            image: "test_re2.jpg",
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_COORDINATOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: coordinatorRoleId,
            name: "Coordinador",
            surname: "RemoveEmpl",
            email: `coord_re_${TEST_COORDINATOR_ID.slice(0, 8)}@test.com`,
            password: "123456",
            curp: "RELC900101HDFRRS01",
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
                surname: "RemoveEmpl",
                email: `empl_re_${TEST_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "RELE900101HDFRRS02",
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
                surname: "RemoveEmpl",
                email: `other_re_${TEST_OTHER_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "RELO900101HDFRRS03",
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
                surname: "RemoveEmpl",
                email: `other_house_re_${TEST_OTHER_HOUSE_COORD_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "RELH900101HDFRRS04",
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
                surname: "RemoveEmplLimit",
                email: `rate_re_${TEST_RATE_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "RELR900101HDFRRS05",
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
                surname: "RemoveEmplRate",
                email: `legit_re_${TEST_LEGIT_EMPLOYEE_ID.slice(0, 8)}@test.com`,
                password: "123456",
                curp: "RELL900101HDFRRS06",
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
        where: { event_type_id: TEST_NON_TRAINING_EVENT_TYPE_ID },
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

describe(`DELETE ${BASE_ROUTE}/:eventId/employee/:employeeId - Integration & Security`, () => {
    describe("1. Comportamiento esperado", () => {
        it("coordinador elimina empleado de capacitación y retorna 200", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe("Empleado eliminado de la capacitación correctamente.");
        });

        it("la relación employee_personal_event se elimina físicamente de BD", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const relation = await prisma.employee_personal_event.findUnique({
                where: {
                    personal_event_id_employee_id: {
                        personal_event_id: event.personal_event_id,
                        employee_id: TEST_EMPLOYEE_ID,
                    },
                },
            });

            expect(relation).toBeNull();
        });

        it("el evento de personal NO se elimina tras quitar al empleado", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const eventInDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: event.personal_event_id },
            });

            expect(eventInDb).not.toBeNull();
            expect(eventInDb.is_deleted).toBe(false);
        });

        it("registra un log en BD al eliminar al empleado", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            expect(logsAfter).toBeGreaterThan(logsBefore);
        });

        it("el log registra el id del coordinador, no el del empleado eliminado", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
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

        it("permite eliminar empleado de una capacitación con is_deleted=true", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID], {
                is_deleted: true,
            });

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe("2. Fuzzing y Manipulación de Parámetros", () => {
        it("retorna 404 si el eventId es un UUID válido que no existe", async () => {
            const token = generateToken();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${randomUUID()}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });

        it("retorna 500 si el eventId no es un UUID válido", async () => {
            const token = generateToken();

            const res = await request(app)
                .delete(`${BASE_ROUTE}/no-es-un-uuid/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(500);
        });

        it("retorna 500 si el employeeId no es un UUID válido", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/no-es-un-uuid`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(500);
        });

        it("retorna 404 si el empleado no está asignado a la capacitación", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_OTHER_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });

        it("retorna 400 si el evento no es de tipo Capacitaciones", async () => {
            const token = generateToken();
            const event = await createNonTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(400);
        });

        it("ignora campos extra en el body (DELETE no necesita body)", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ hackerField: "owned" });

            expect(res.statusCode).toBe(200);
        });
    });

    describe("3. Lógica de negocio", () => {
        it("retorna 403 si un empleado con rol Mantenimiento intenta eliminar", async () => {
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
                privileges: ["deleteEvent"],
            });
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
        });

        it("la relación no se elimina tras intento de empleado con rol Mantenimiento", async () => {
            const token = generateToken({
                employeeId: TEST_EMPLOYEE_ID,
                id: TEST_EMPLOYEE_ID,
                role: "Mantenimiento",
                privileges: ["deleteEvent"],
            });
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const relation = await prisma.employee_personal_event.findUnique({
                where: {
                    personal_event_id_employee_id: {
                        personal_event_id: event.personal_event_id,
                        employee_id: TEST_EMPLOYEE_ID,
                    },
                },
            });

            expect(relation).not.toBeNull();
        });

        it("retorna 404 en el segundo intento (empleado ya eliminado)", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res1 = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res1.statusCode).toBe(200);

            const res2 = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res2.statusCode).toBe(404);
        });

        it("no crea un segundo log si el empleado ya fue eliminado", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            expect(logsAfter).toBe(logsBefore);
        });
    });

    describe("4. Seguridad: Autenticación y Autorización", () => {
        it("retorna 401 si no se envía token", async () => {
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app).delete(
                `${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`,
            );

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está manipulado o mal formado", async () => {
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", "Bearer token_falso_para_hackear.123");

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está expirado", async () => {
            const expiredToken = generateToken({}, { expiresIn: "-1s" });
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
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
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${fakeToken}`);

            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 si el usuario no tiene el privilegio deleteEvent", async () => {
            const token = generateToken({ privileges: ["viewEvents"] });
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene privilegios definidos", async () => {
            const token = generateToken({ privileges: [] });
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
        });

        it("coordinador de otra casa retorna 404 al intentar eliminar", async () => {
            const token = generateToken({
                employeeId: TEST_OTHER_HOUSE_COORD_ID,
                id: TEST_OTHER_HOUSE_COORD_ID,
                role: "Coordinador",
                houseId: TEST_OTHER_HOUSE_ID,
            });
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(404);
        });

        it("la relación no se elimina tras el intento de coordinador de otra casa", async () => {
            const token = generateToken({
                employeeId: TEST_OTHER_HOUSE_COORD_ID,
                id: TEST_OTHER_HOUSE_COORD_ID,
                role: "Coordinador",
                houseId: TEST_OTHER_HOUSE_ID,
            });
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const relation = await prisma.employee_personal_event.findUnique({
                where: {
                    personal_event_id_employee_id: {
                        personal_event_id: event.personal_event_id,
                        employee_id: TEST_EMPLOYEE_ID,
                    },
                },
            });

            expect(relation).not.toBeNull();
        });
    });

    describe("5. Integridad de datos", () => {
        it("eliminar un empleado no afecta a otros empleados del mismo evento", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([
                TEST_EMPLOYEE_ID,
                TEST_OTHER_EMPLOYEE_ID,
            ]);

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const otherRelation = await prisma.employee_personal_event.findUnique({
                where: {
                    personal_event_id_employee_id: {
                        personal_event_id: event.personal_event_id,
                        employee_id: TEST_OTHER_EMPLOYEE_ID,
                    },
                },
            });

            expect(otherRelation).not.toBeNull();
        });

        it("eliminar empleado de un evento no afecta sus asignaciones en otros eventos", async () => {
            const token = generateToken();
            const event1 = await createTrainingEvent([TEST_EMPLOYEE_ID], {
                name: "Capacitación 1",
            });
            const event2 = await createTrainingEvent([TEST_EMPLOYEE_ID], {
                name: "Capacitación 2",
                start: new Date("2026-07-15T17:00:00.000Z"),
                end: new Date("2026-07-15T18:00:00.000Z"),
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event1.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const relationInEvent2 = await prisma.employee_personal_event.findUnique({
                where: {
                    personal_event_id_employee_id: {
                        personal_event_id: event2.personal_event_id,
                        employee_id: TEST_EMPLOYEE_ID,
                    },
                },
            });

            expect(relationInEvent2).not.toBeNull();
        });

        it("los datos del evento no cambian tras quitar al empleado", async () => {
            const token = generateToken();
            const event = await createTrainingEvent([TEST_EMPLOYEE_ID], {
                name: "Capacitación con datos",
            });

            await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${token}`);

            const eventInDb = await prisma.personal_event.findUnique({
                where: { personal_event_id: event.personal_event_id },
            });

            expect(eventInDb.name).toBe("Capacitación con datos");
            expect(eventInDb.event_type_id).toBe(trainingEventTypeId);
            expect(eventInDb.is_deleted).toBe(false);
        });
    });

    describe.skip("6. Resiliencia: Rate Limiting", () => {
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
                        .delete(`${BASE_ROUTE}/${nonExistentId}/employee/${randomUUID()}`)
                        .set("Authorization", `Bearer ${token}`),
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
            const event = await createTrainingEvent([TEST_LEGIT_EMPLOYEE_ID]);

            const res = await request(app)
                .delete(`${BASE_ROUTE}/${event.personal_event_id}/employee/${TEST_LEGIT_EMPLOYEE_ID}`)
                .set("Authorization", `Bearer ${tokenLegitimo}`);

            expect(res.statusCode).not.toBe(429);
        });
    });
});
