const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");

const prisma = new PrismaClient();

const HOUSE_A_ID = randomUUID();
const HOUSE_B_ID = randomUUID();

let ADMIN_ROLE_ID;
let COORDINATOR_ROLE_ID;
let USER_ROLE_ID;

const ADMIN_ID = randomUUID();
const COORDINATOR_ID = randomUUID();
const USER_ID = randomUUID();
const TARGET_EMPLOYEE_ID = randomUUID();
const OTHER_HOUSE_EMPLOYEE_ID = randomUUID();

const WORKDAY_IDS = {
    monday: randomUUID(),
    tuesday: randomUUID(),
    wednesday: randomUUID(),
    thursday: randomUUID(),
    friday: randomUUID(),
};

function getTodayUTC() {
    const now = new Date();

    return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
}

function addDays(date, days) {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
}

function nextWeekdayDate(fromDate, targetDay) {
    const date = new Date(fromDate);

    while (date.getUTCDay() !== targetDay) {
        date.setUTCDate(date.getUTCDate() + 1);
    }

    return date;
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function toDbDate(dateString) {
    return new Date(`${dateString}T00:00:00.000Z`);
}

const TODAY_UTC = getTodayUTC();

const EMPLOYEE_START_DATE = new Date(
    Date.UTC(TODAY_UTC.getUTCFullYear() - 1, TODAY_UTC.getUTCMonth(), 1),
);

const BASE_FUTURE_DATE = addDays(TODAY_UTC, 14);

const SUCCESS_MONDAY = nextWeekdayDate(BASE_FUTURE_DATE, 1);
const SUCCESS_FRIDAY = addDays(SUCCESS_MONDAY, 4);

function generateSessionToken(employee) {
    return jwt.sign(
        {
            id: employee.employee_id,
            email: employee.email,
            name: employee.name,
            role: employee.roleName,
            houseId: employee.house_id,
            privileges: employee.privileges || [],
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
}

function getAdminToken() {
    return generateSessionToken({
        employee_id: ADMIN_ID,
        email: "admin.us32@test.com",
        name: "Admin",
        roleName: "Administrador",
        house_id: HOUSE_A_ID,
        privileges: ["manageEmployees"],
    });
}

function getCoordinatorToken() {
    return generateSessionToken({
        employee_id: COORDINATOR_ID,
        email: "coordinator.us32@test.com",
        name: "Coordinator",
        roleName: "Coordinador",
        house_id: HOUSE_A_ID,
        privileges: ["manageEmployees"],
    });
}

function getUserToken() {
    return generateSessionToken({
        employee_id: USER_ID,
        email: "user.us32@test.com",
        name: "User",
        roleName: "Usuario",
        house_id: HOUSE_A_ID,
        privileges: [],
    });
}

function getOtherHouseUserToken() {
    return generateSessionToken({
        employee_id: OTHER_HOUSE_EMPLOYEE_ID,
        email: "other.us32@test.com",
        name: "Other",
        roleName: "Usuario",
        house_id: HOUSE_B_ID,
        privileges: [],
    });
}

async function getOrCreateRoleId(name) {
    const existingRole = await prisma.role.findUnique({
        where: { name },
    });

    if (existingRole) {
        return existingRole.role_id;
    }

    const createdRole = await prisma.role.create({
        data: {
            role_id: randomUUID(),
            name,
        },
    });

    return createdRole.role_id;
}

async function seedActions() {
    await prisma.action.upsert({
        where: { action_id: "vaca-006" },
        update: {
            description: "Eliminación de vacaciones exitosa",
            important: false,
        },
        create: {
            action_id: "vaca-006",
            description: "Eliminación de vacaciones exitosa",
            important: false,
        },
    });
}

async function seedBaseData() {
    await prisma.house.createMany({
        data: [
            {
                house_id: HOUSE_A_ID,
                name: "Casa US32 A",
                location: "Test Location A",
                phone_number: "4420000032",
                description: "Casa de prueba US32 A",
                image: "test-a.jpg",
            },
            {
                house_id: HOUSE_B_ID,
                name: "Casa US32 B",
                location: "Test Location B",
                phone_number: "4420000132",
                description: "Casa de prueba US32 B",
                image: "test-b.jpg",
            },
        ],
        skipDuplicates: true,
    });

    ADMIN_ROLE_ID = await getOrCreateRoleId("Administrador");
    COORDINATOR_ROLE_ID = await getOrCreateRoleId("Coordinador");
    USER_ROLE_ID = await getOrCreateRoleId("Usuario");

    const existingWorkdays = await prisma.workday.findMany({
        where: {
            name: {
                in: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
            },
        },
    });

    for (const workday of existingWorkdays) {
        if (workday.name === "Lunes") WORKDAY_IDS.monday = workday.workday_id;
        if (workday.name === "Martes") WORKDAY_IDS.tuesday = workday.workday_id;
        if (workday.name === "Miércoles")
            WORKDAY_IDS.wednesday = workday.workday_id;
        if (workday.name === "Jueves")
            WORKDAY_IDS.thursday = workday.workday_id;
        if (workday.name === "Viernes") WORKDAY_IDS.friday = workday.workday_id;
    }

    await prisma.workday.createMany({
        data: [
            { workday_id: WORKDAY_IDS.monday, name: "Lunes" },
            { workday_id: WORKDAY_IDS.tuesday, name: "Martes" },
            { workday_id: WORKDAY_IDS.wednesday, name: "Miércoles" },
            { workday_id: WORKDAY_IDS.thursday, name: "Jueves" },
            { workday_id: WORKDAY_IDS.friday, name: "Viernes" },
        ],
        skipDuplicates: true,
    });

    await prisma.employee.createMany({
        data: [
            {
                employee_id: ADMIN_ID,
                house_id: HOUSE_A_ID,
                role_id: ADMIN_ROLE_ID,
                name: "Admin",
                surname: "US32",
                is_active: true,
                email: "admin.us32@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE80",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: COORDINATOR_ID,
                house_id: HOUSE_A_ID,
                role_id: COORDINATOR_ROLE_ID,
                name: "Coordinator",
                surname: "US32",
                is_active: true,
                email: "coordinator.us32@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE81",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: USER_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "User",
                surname: "US32",
                is_active: true,
                email: "user.us32@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE82",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: TARGET_EMPLOYEE_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "Target",
                surname: "US32",
                is_active: true,
                email: "target.us32@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE83",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: OTHER_HOUSE_EMPLOYEE_ID,
                house_id: HOUSE_B_ID,
                role_id: USER_ROLE_ID,
                name: "Other",
                surname: "House",
                is_active: true,
                email: "other.us32@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE84",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
        ],
        skipDuplicates: true,
    });

    const mondayToFriday = [
        WORKDAY_IDS.monday,
        WORKDAY_IDS.tuesday,
        WORKDAY_IDS.wednesday,
        WORKDAY_IDS.thursday,
        WORKDAY_IDS.friday,
    ];

    await prisma.employee_workday.createMany({
        data: [
            ...mondayToFriday.map((workdayId) => ({
                workday_id: workdayId,
                employee_id: COORDINATOR_ID,
                start: new Date("1970-01-01T09:00:00.000Z"),
                end: new Date("1970-01-01T18:00:00.000Z"),
            })),
            ...mondayToFriday.map((workdayId) => ({
                workday_id: workdayId,
                employee_id: TARGET_EMPLOYEE_ID,
                start: new Date("1970-01-01T09:00:00.000Z"),
                end: new Date("1970-01-01T18:00:00.000Z"),
            })),
            ...mondayToFriday.map((workdayId) => ({
                workday_id: workdayId,
                employee_id: OTHER_HOUSE_EMPLOYEE_ID,
                start: new Date("1970-01-01T09:00:00.000Z"),
                end: new Date("1970-01-01T18:00:00.000Z"),
            })),
        ],
        skipDuplicates: true,
    });
}

async function createVacation({
    employeeId = TARGET_EMPLOYEE_ID,
    startDate = formatDate(SUCCESS_MONDAY),
    endDate = formatDate(SUCCESS_FRIDAY),
    usedDays = 5,
    status = 0,
    feedback = null,
} = {}) {
    return await prisma.vacations_request.create({
        data: {
            vacations_request_id: randomUUID(),
            employee_id: employeeId,
            start: toDbDate(startDate),
            end: toDbDate(endDate),
            status,
            feedback,
            used_days: usedDays,
            created_at: new Date(),
        },
    });
}

async function cleanVacationAndLogsOnly() {
    const employeeIds = [
        ADMIN_ID,
        COORDINATOR_ID,
        USER_ID,
        TARGET_EMPLOYEE_ID,
        OTHER_HOUSE_EMPLOYEE_ID,
    ];

    await prisma.logs.deleteMany({
        where: {
            OR: [
                { employee_id: { in: employeeIds } },
                { affected: { in: employeeIds } },
            ],
        },
    });

    await prisma.vacations_request.deleteMany({
        where: {
            employee_id: {
                in: employeeIds,
            },
        },
    });
}

async function cleanTestData() {
    const employeeIds = [
        ADMIN_ID,
        COORDINATOR_ID,
        USER_ID,
        TARGET_EMPLOYEE_ID,
        OTHER_HOUSE_EMPLOYEE_ID,
    ];

    await cleanVacationAndLogsOnly();

    await prisma.employee_workday.deleteMany({
        where: {
            employee_id: {
                in: employeeIds,
            },
        },
    });

    await prisma.employee.deleteMany({
        where: {
            employee_id: {
                in: employeeIds,
            },
        },
    });

    await prisma.house.deleteMany({
        where: {
            house_id: {
                in: [HOUSE_A_ID, HOUSE_B_ID],
            },
        },
    });
}

beforeAll(async () => {
    await cleanTestData();
    await seedActions();
    await seedBaseData();
});

afterEach(async () => {
    await cleanVacationAndLogsOnly();
});

afterAll(async () => {
    await cleanTestData();
    await prisma.$disconnect();
});

describe("US32 - DELETE /vacation/request/:vacationRequestId", () => {
    test("coordinador elimina solicitud pendiente de empleado de su misma casa", async () => {
        const vacation = await createVacation({
            status: 0,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const deletedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        const logs = await prisma.logs.findMany({
            where: {
                action_id: "vaca-006",
                employee_id: COORDINATOR_ID,
                affected: TARGET_EMPLOYEE_ID,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Vacaciones removidas correctamente");
        expect(res.body.data.vacationRequest.vacations_request_id).toBe(
            vacation.vacations_request_id,
        );
        expect(deletedVacation).toBeNull();
        expect(logs).toHaveLength(1);
    });

    test("coordinador elimina solicitud pendiente pasada de empleado de su misma casa", async () => {
        const vacation = await createVacation({
            startDate: formatDate(addDays(TODAY_UTC, -30)),
            endDate: formatDate(addDays(TODAY_UTC, -26)),
            status: 0,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const deletedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(deletedVacation).toBeNull();
    });

    test("coordinador elimina solicitud aprobada futura de empleado de su misma casa", async () => {
        const vacation = await createVacation({
            status: 1,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const deletedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(deletedVacation).toBeNull();
    });

    test("coordinador no elimina solicitud aprobada en curso", async () => {
        const vacation = await createVacation({
            startDate: formatDate(addDays(TODAY_UTC, -2)),
            endDate: formatDate(addDays(TODAY_UTC, 2)),
            status: 1,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe(
            "No se pueden remover vacaciones aprobadas que ya iniciaron o terminaron",
        );
        expect(existingVacation).not.toBeNull();
    });

    test("coordinador no elimina solicitud aprobada pasada", async () => {
        const vacation = await createVacation({
            startDate: formatDate(addDays(TODAY_UTC, -30)),
            endDate: formatDate(addDays(TODAY_UTC, -26)),
            status: 1,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
        expect(existingVacation).not.toBeNull();
    });

    test("coordinador elimina solicitud rechazada pasada de empleado de su misma casa", async () => {
        const vacation = await createVacation({
            startDate: formatDate(addDays(TODAY_UTC, -30)),
            endDate: formatDate(addDays(TODAY_UTC, -26)),
            status: 2,
            feedback: "No procede",
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const deletedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(deletedVacation).toBeNull();
    });

    test("coordinador no elimina solicitud de empleado de otra casa", async () => {
        const vacation = await createVacation({
            employeeId: OTHER_HOUSE_EMPLOYEE_ID,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(existingVacation).not.toBeNull();
    });

    test("coordinador no elimina solicitud de un admin", async () => {
        const vacation = await createVacation({
            employeeId: ADMIN_ID,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(existingVacation).not.toBeNull();
    });

    test("usuario elimina su propia solicitud futura", async () => {
        const vacation = await createVacation({
            employeeId: USER_ID,
            status: 1,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getUserToken()}`)
            .send({});

        const deletedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(deletedVacation).toBeNull();
    });

    test("usuario elimina su propia solicitud rechazada pasada", async () => {
        const vacation = await createVacation({
            employeeId: USER_ID,
            startDate: formatDate(addDays(TODAY_UTC, -30)),
            endDate: formatDate(addDays(TODAY_UTC, -26)),
            status: 2,
            feedback: "No procede",
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getUserToken()}`)
            .send({});

        const deletedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(deletedVacation).toBeNull();
    });

    test("usuario no elimina su propia solicitud aprobada que ya inició", async () => {
        const vacation = await createVacation({
            employeeId: USER_ID,
            startDate: formatDate(addDays(TODAY_UTC, -2)),
            endDate: formatDate(addDays(TODAY_UTC, 2)),
            status: 1,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getUserToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
        expect(existingVacation).not.toBeNull();
    });

    test("usuario no puede eliminar su propia solicitud si es aprobada y ya pasó", async () => {
        const vacation = await createVacation({
            employeeId: USER_ID,
            startDate: formatDate(addDays(TODAY_UTC, -30)),
            endDate: formatDate(addDays(TODAY_UTC, -26)),
            status: 1,
        });

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getUserToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
        expect(existingVacation).not.toBeNull();
    });

    test("usuario no puede eliminar solicitudes de otros empleados", async () => {
        const vacation = await createVacation();

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getUserToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(existingVacation).not.toBeNull();
    });

    test("usuario de otra casa no puede eliminar solicitudes de otros empleados", async () => {
        const vacation = await createVacation();

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getOtherHouseUserToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(existingVacation).not.toBeNull();
    });

    test("admin no puede eliminar solicitudes si no es dueño ni Coordinador", async () => {
        const vacation = await createVacation();

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(existingVacation).not.toBeNull();
    });

    test("retorna 401 si no se envía token", async () => {
        const vacation = await createVacation();

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(401);
        expect(existingVacation).not.toBeNull();
    });

    test("retorna 401 si el token es inválido", async () => {
        const vacation = await createVacation();

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", "Bearer token_invalido")
            .send({});

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(401);
        expect(existingVacation).not.toBeNull();
    });

    test("retorna 400 si vacationRequestId no es UUID válido", async () => {
        const res = await request(app)
            .delete("/vacation/request/not-a-valid-uuid")
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("retorna 400 si body trae campos no permitidos", async () => {
        const vacation = await createVacation();

        const res = await request(app)
            .delete(`/vacation/request/${vacation.vacations_request_id}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({
                extra: "campo malicioso",
            });

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(existingVacation).not.toBeNull();
    });

    test("retorna 404 si la solicitud no existe", async () => {
        const res = await request(app)
            .delete(`/vacation/request/${randomUUID()}`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test("protege contra dos eliminaciones concurrentes de la misma solicitud", async () => {
        const vacation = await createVacation();

        const responses = await Promise.allSettled([
            request(app)
                .delete(`/vacation/request/${vacation.vacations_request_id}`)
                .set("Authorization", `Bearer ${getCoordinatorToken()}`)
                .send({}),
            request(app)
                .delete(`/vacation/request/${vacation.vacations_request_id}`)
                .set("Authorization", `Bearer ${getCoordinatorToken()}`)
                .send({}),
        ]);

        const fulfilledResponses = responses.map((result) => result.value);
        const statuses = fulfilledResponses
            .map((response) => response.status)
            .sort();

        const existingVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        const logs = await prisma.logs.findMany({
            where: {
                action_id: "vaca-006",
                affected: TARGET_EMPLOYEE_ID,
            },
        });

        expect(statuses).toEqual([200, 404]);
        expect(existingVacation).toBeNull();
        expect(logs).toHaveLength(1);
    });
});
