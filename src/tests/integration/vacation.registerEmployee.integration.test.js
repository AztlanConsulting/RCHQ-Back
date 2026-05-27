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
let MANAGE_EMPLOYEES_PRIVILEGE_ID;
let CREATED_MANAGE_EMPLOYEES_PRIVILEGE = false;
let CREATED_ADMIN_MANAGE_EMPLOYEES_PRIVILEGE = false;
let CREATED_COORDINATOR_MANAGE_EMPLOYEES_PRIVILEGE = false;

const ADMIN_ID = randomUUID();
const COORDINATOR_ID = randomUUID();
const USER_ID = randomUUID();
const TARGET_EMPLOYEE_ID = randomUUID();
const OTHER_HOUSE_EMPLOYEE_ID = randomUUID();
const NO_WORKDAYS_EMPLOYEE_ID = randomUUID();
const GLOBAL_FREE_EVENT_TYPE_ID = randomUUID();
const HOUSE_FREE_EVENT_TYPE_ID = randomUUID();

const { ACTIVE_VACATION_STATUSES } = require("../../utils/vacationStatus");
const { LOG_ACTIONS } = require("../../utils/logActions");

const WORKDAY_IDS = {
    monday: randomUUID(),
    tuesday: randomUUID(),
    wednesday: randomUUID(),
    thursday: randomUUID(),
    friday: randomUUID(),
    saturday: randomUUID(),
    sunday: randomUUID(),
};

function getTodayUTC() {
    const now = new Date();

    return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    ));
}

function addDays(date, days) {
    const copy = new Date(date);
    copy.setUTCDate(copy.getUTCDate() + days);
    return copy;
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function toDbDate(dateString) {
    return new Date(`${dateString}T00:00:00.000Z`);
}

function localDateRangeToUtcEventRange(startDate, endDate) {
    const endDateUtc = toDbDate(endDate);
    endDateUtc.setUTCDate(endDateUtc.getUTCDate() + 1);

    return {
        start: new Date(`${startDate}T06:00:00.000Z`),
        end: new Date(`${formatDate(endDateUtc)}T05:59:00.000Z`),
    };
}

async function createEventType(eventTypeId, name) {
    await prisma.event_type.upsert({
        where: { name },
        update: {},
        create: {
            event_type_id: eventTypeId,
            name,
        },
    });
}

function nextWeekdayDate(fromDate, targetDay) {
    const date = new Date(fromDate);

    while (date.getUTCDay() !== targetDay) {
        date.setUTCDate(date.getUTCDate() + 1);
    }

    return date;
}

const TODAY_UTC = getTodayUTC();

const EMPLOYEE_START_DATE = new Date(Date.UTC(
    TODAY_UTC.getUTCFullYear() - 1,
    TODAY_UTC.getUTCMonth(),
    1
));

const BASE_FUTURE_DATE = addDays(TODAY_UTC, 14);

const SUCCESS_MONDAY = nextWeekdayDate(BASE_FUTURE_DATE, 1);
const SUCCESS_TUESDAY = addDays(SUCCESS_MONDAY, 1);
const SUCCESS_WEDNESDAY = addDays(SUCCESS_MONDAY, 2);
const SUCCESS_FRIDAY = addDays(SUCCESS_MONDAY, 4);

const SECOND_SUCCESS_MONDAY = addDays(SUCCESS_MONDAY, 7);
const SECOND_SUCCESS_FRIDAY = addDays(SECOND_SUCCESS_MONDAY, 4);

const THIRD_SUCCESS_MONDAY = addDays(SUCCESS_MONDAY, 14);
const THIRD_SUCCESS_FRIDAY = addDays(THIRD_SUCCESS_MONDAY, 4);

const GLOBAL_FREE_MONDAY = addDays(SUCCESS_MONDAY, 28);
const GLOBAL_FREE_FRIDAY = addDays(GLOBAL_FREE_MONDAY, 4);

const HOUSE_FREE_MONDAY = addDays(SUCCESS_MONDAY, 35);
const HOUSE_FREE_FRIDAY = addDays(HOUSE_FREE_MONDAY, 4);

const WEEKEND_SATURDAY = nextWeekdayDate(BASE_FUTURE_DATE, 6);
const WEEKEND_SUNDAY = addDays(WEEKEND_SATURDAY, 1);

const OUTSIDE_WORK_YEAR_START = new Date(Date.UTC(
    TODAY_UTC.getUTCFullYear() + 2,
    TODAY_UTC.getUTCMonth(),
    1
));

const OUTSIDE_WORK_YEAR_END = addDays(OUTSIDE_WORK_YEAR_START, 1);

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
        { expiresIn: "1h" }
    );
}

function getAdminToken() {
    return generateSessionToken({
        employee_id: ADMIN_ID,
        email: "admin.us28@test.com",
        name: "Administrador",
        roleName: "Administrador",
        house_id: HOUSE_A_ID,
        privileges: ["manageEmployees"],
    });
}

function getCoordinatorToken() {
    return generateSessionToken({
        employee_id: COORDINATOR_ID,
        email: "coordinator.us28@test.com",
        name: "Coordinator",
        roleName: "Coordinador",
        house_id: HOUSE_A_ID,
        privileges: ["manageEmployees"],
    });
}

function getUserToken() {
    return generateSessionToken({
        employee_id: USER_ID,
        email: "user.us28@test.com",
        name: "User",
        roleName: "Usuario",
        house_id: HOUSE_A_ID,
        privileges: [],
    });
}

async function seedActions() {
    await prisma.action.upsert({
        where: { action_id: "vaca-002" },
        update: {
            description: "Registro de vacaciones de empleado exitoso",
            important: false,
        },
        create: {
            action_id: "vaca-002",
            description: "Registro de vacaciones de empleado exitoso",
            important: false,
        },
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

async function seedManageEmployeesPrivilege() {
    const existingPrivilege = await prisma.privileges.findUnique({
        where: { name: "manageEmployees" },
    });

    if (existingPrivilege) {
        MANAGE_EMPLOYEES_PRIVILEGE_ID = existingPrivilege.privilege_id;
    } else {
        MANAGE_EMPLOYEES_PRIVILEGE_ID = randomUUID();
        CREATED_MANAGE_EMPLOYEES_PRIVILEGE = true;

        await prisma.privileges.create({
            data: {
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
                name: "manageEmployees",
            },
        });
    }

    const adminPrivilege = await prisma.role_privilege.findUnique({
        where: {
            role_id_privilege_id: {
                role_id: ADMIN_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
        },
    });

    if (!adminPrivilege) {
        CREATED_ADMIN_MANAGE_EMPLOYEES_PRIVILEGE = true;

        await prisma.role_privilege.create({
            data: {
                role_id: ADMIN_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
        });
    }

    const coordinatorPrivilege = await prisma.role_privilege.findUnique({
        where: {
            role_id_privilege_id: {
                role_id: COORDINATOR_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
        },
    });

    if (!coordinatorPrivilege) {
        CREATED_COORDINATOR_MANAGE_EMPLOYEES_PRIVILEGE = true;

        await prisma.role_privilege.create({
            data: {
                role_id: COORDINATOR_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
        });
    }
}

async function seedBaseData() {
    await prisma.house.createMany({
        data: [
            {
                house_id: HOUSE_A_ID,
                name: "Casa US28 A",
                location: "Test Location A",
                phone_number: "4420000001",
                description: "Casa de prueba US28 A",
                image: "test-a.jpg",
            },
            {
                house_id: HOUSE_B_ID,
                name: "Casa US28 B",
                location: "Test Location B",
                phone_number: "4420000002",
                description: "Casa de prueba US28 B",
                image: "test-b.jpg",
            },
        ],
        skipDuplicates: true,
    });

    ADMIN_ROLE_ID = await getOrCreateRoleId("Administrador");
    COORDINATOR_ROLE_ID = await getOrCreateRoleId("Coordinador");
    USER_ROLE_ID = await getOrCreateRoleId("Usuario");
    await seedManageEmployeesPrivilege();

    const existingWorkdays = await prisma.workday.findMany({
        where: {
            name: {
                in: [
                    "Lunes",
                    "Martes",
                    "Miércoles",
                    "Jueves",
                    "Viernes",
                    "Sábado",
                    "Domingo",
                ],
            },
        },
    });

    for (const workday of existingWorkdays) {
        if (workday.name === "Lunes") WORKDAY_IDS.monday = workday.workday_id;
        if (workday.name === "Martes") WORKDAY_IDS.tuesday = workday.workday_id;
        if (workday.name === "Miércoles") WORKDAY_IDS.wednesday = workday.workday_id;
        if (workday.name === "Jueves") WORKDAY_IDS.thursday = workday.workday_id;
        if (workday.name === "Viernes") WORKDAY_IDS.friday = workday.workday_id;
        if (workday.name === "Sábado") WORKDAY_IDS.saturday = workday.workday_id;
        if (workday.name === "Domingo") WORKDAY_IDS.sunday = workday.workday_id;
    }

    await prisma.workday.createMany({
        data: [
            { workday_id: WORKDAY_IDS.monday, name: "Lunes" },
            { workday_id: WORKDAY_IDS.tuesday, name: "Martes" },
            { workday_id: WORKDAY_IDS.wednesday, name: "Miércoles" },
            { workday_id: WORKDAY_IDS.thursday, name: "Jueves" },
            { workday_id: WORKDAY_IDS.friday, name: "Viernes" },
            { workday_id: WORKDAY_IDS.saturday, name: "Sábado" },
            { workday_id: WORKDAY_IDS.sunday, name: "Domingo" },
        ],
        skipDuplicates: true,
    });

    await prisma.employee.createMany({
        data: [
            {
                employee_id: ADMIN_ID,
                house_id: HOUSE_A_ID,
                role_id: ADMIN_ROLE_ID,
                name: "Administrador",
                surname: "US28",
                is_active: true,
                email: "admin.us28@test.com",
                password: "not-used-in-this-test",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA01",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: COORDINATOR_ID,
                house_id: HOUSE_A_ID,
                role_id: COORDINATOR_ROLE_ID,
                name: "Coordinator",
                surname: "US28",
                is_active: true,
                email: "coordinator.us28@test.com",
                password: "not-used-in-this-test",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA02",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: USER_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "User",
                surname: "US28",
                is_active: true,
                email: "user.us28@test.com",
                password: "not-used-in-this-test",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA03",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: TARGET_EMPLOYEE_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "Target",
                surname: "US28",
                is_active: true,
                email: "target.us28@test.com",
                password: "not-used-in-this-test",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA04",
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
                email: "other.house.us28@test.com",
                password: "not-used-in-this-test",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA05",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: NO_WORKDAYS_EMPLOYEE_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "No",
                surname: "Workdays",
                is_active: true,
                email: "no.workdays.us28@test.com",
                password: "not-used-in-this-test",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA06",
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
            ...mondayToFriday.map((workdayId) => ({
                workday_id: workdayId,
                employee_id: ADMIN_ID,
                start: new Date("1970-01-01T09:00:00.000Z"),
                end: new Date("1970-01-01T18:00:00.000Z"),
            })),
            ...mondayToFriday.map((workdayId) => ({
                workday_id: workdayId,
                employee_id: COORDINATOR_ID,
                start: new Date("1970-01-01T09:00:00.000Z"),
                end: new Date("1970-01-01T18:00:00.000Z"),
            })),
        ],
        skipDuplicates: true,
    });
}

async function cleanTestData() {
    const employeeIds = [
        ADMIN_ID,
        COORDINATOR_ID,
        USER_ID,
        TARGET_EMPLOYEE_ID,
        OTHER_HOUSE_EMPLOYEE_ID,
        NO_WORKDAYS_EMPLOYEE_ID,
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

    await prisma.global_event.deleteMany({
        where: {
            event_type_id: {
                in: [GLOBAL_FREE_EVENT_TYPE_ID, HOUSE_FREE_EVENT_TYPE_ID],
            },
        },
    });

    await prisma.house_event.deleteMany({
        where: {
            event_type_id: {
                in: [GLOBAL_FREE_EVENT_TYPE_ID, HOUSE_FREE_EVENT_TYPE_ID],
            },
        },
    });

    await prisma.event_type.deleteMany({
        where: {
            event_type_id: {
                in: [GLOBAL_FREE_EVENT_TYPE_ID, HOUSE_FREE_EVENT_TYPE_ID],
            },
        },
    });

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

async function cleanVacationAndLogsOnly() {
    const employeeIds = [
        ADMIN_ID,
        COORDINATOR_ID,
        USER_ID,
        TARGET_EMPLOYEE_ID,
        OTHER_HOUSE_EMPLOYEE_ID,
        NO_WORKDAYS_EMPLOYEE_ID,
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

    await prisma.global_event.deleteMany({
        where: {
            event_type_id: {
                in: [GLOBAL_FREE_EVENT_TYPE_ID, HOUSE_FREE_EVENT_TYPE_ID],
            },
        },
    });

    await prisma.house_event.deleteMany({
        where: {
            event_type_id: {
                in: [GLOBAL_FREE_EVENT_TYPE_ID, HOUSE_FREE_EVENT_TYPE_ID],
            },
        },
    });

    await prisma.event_type.deleteMany({
        where: {
            event_type_id: {
                in: [GLOBAL_FREE_EVENT_TYPE_ID, HOUSE_FREE_EVENT_TYPE_ID],
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

    if (CREATED_ADMIN_MANAGE_EMPLOYEES_PRIVILEGE) {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: ADMIN_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
        });
    }

    if (CREATED_COORDINATOR_MANAGE_EMPLOYEES_PRIVILEGE) {
        await prisma.role_privilege.deleteMany({
            where: {
                role_id: COORDINATOR_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
        });
    }

    if (CREATED_MANAGE_EMPLOYEES_PRIVILEGE) {
        await prisma.privileges.deleteMany({
            where: { privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID },
        });
    }

    await prisma.$disconnect();
});

describe("US28 - POST /vacation/employees/:employeeId/register", () => {
    test("admin registra vacaciones de un empleado correctamente", async () => {
        const startDate = formatDate(SUCCESS_MONDAY);
        const endDate = formatDate(SUCCESS_FRIDAY);

        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate,
                endDate,
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(startDate),
                end: toDbDate(endDate),
            },
        });

        const log = await prisma.logs.findFirst({
            where: {
                employee_id: ADMIN_ID,
                action_id: "vaca-002",
                affected: TARGET_EMPLOYEE_ID,
            },
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Vacaciones registradas correctamente");

        expect(vacation).not.toBeNull();
        expect(vacation.status).toBe(1);
        expect(vacation.used_days).toBe(5);

        expect(log).not.toBeNull();
    });

    test("admin puede registrarse vacaciones a sí mismo", async () => {
        const startDate = formatDate(THIRD_SUCCESS_MONDAY);
        const endDate = formatDate(THIRD_SUCCESS_FRIDAY);

        const res = await request(app)
            .post(`/vacation/employees/${ADMIN_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate,
                endDate,
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: ADMIN_ID,
                start: toDbDate(startDate),
                end: toDbDate(endDate),
                status: 1,
            },
        });

        const log = await prisma.logs.findFirst({
            where: {
                employee_id: ADMIN_ID,
                action_id: "vaca-002",
                affected: ADMIN_ID,
            },
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(vacation).not.toBeNull();
        expect(log).not.toBeNull();
    });

    test("coordinador puede registrarse vacaciones a sí mismo", async () => {
        const startDate = formatDate(THIRD_SUCCESS_MONDAY);
        const endDate = formatDate(THIRD_SUCCESS_FRIDAY);

        const res = await request(app)
            .post(`/vacation/employees/${COORDINATOR_ID}/register`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({
                startDate,
                endDate,
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: COORDINATOR_ID,
                start: toDbDate(startDate),
                end: toDbDate(endDate),
                status: 1,
            },
        });

        const log = await prisma.logs.findFirst({
            where: {
                employee_id: COORDINATOR_ID,
                action_id: "vaca-002",
                affected: COORDINATOR_ID,
            },
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("Vacaciones registradas correctamente");
        expect(vacation).not.toBeNull();
        expect(log).not.toBeNull();
    });

    test("coordinador registra vacaciones de empleado de su misma casa", async () => {
        const startDate = formatDate(SECOND_SUCCESS_MONDAY);
        const endDate = formatDate(SECOND_SUCCESS_FRIDAY);

        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({
                startDate,
                endDate,
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(startDate),
                end: toDbDate(endDate),
                status: 1,
            },
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(vacation).not.toBeNull();
    });

    test("coordinador no puede registrar vacaciones de empleado de otra casa", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${OTHER_HOUSE_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
                endDate: formatDate(SUCCESS_FRIDAY),
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: OTHER_HOUSE_EMPLOYEE_ID,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(vacation).toBeNull();
        expect(res.body).toEqual({
            success: false,
            message: "No puede acceder a este recurso",
        });
    });

    test("coordinador no puede registrar vacaciones de un admin", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${ADMIN_ID}/register`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
                endDate: formatDate(SUCCESS_FRIDAY),
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: ADMIN_ID,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(res.body).toEqual({
            success: false,
            message: "No puede acceder a este recurso",
        });
        expect(vacation).toBeNull();
    });

    test("usuario sin rol permitido no puede registrar vacaciones de otro empleado", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getUserToken()}`)
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
                endDate: formatDate(SUCCESS_FRIDAY),
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: TARGET_EMPLOYEE_ID,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(res.body).toBeDefined();
        expect(vacation).toBeNull();
        expect(res.body).toEqual({
            message: "Permisos insuficientes",
        });
    });

    test("retorna 401 si no se envía token", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
                endDate: formatDate(SUCCESS_FRIDAY),
            });

        expect(res.statusCode).toBe(401);
    });

    test("retorna 401 si el token es inválido", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", "Bearer token_invalido")
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
                endDate: formatDate(SUCCESS_FRIDAY),
            });

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            success: false,
            message: "Token inválido o expirado",
        });
    });

    test("retorna 400 si employeeId no es UUID válido", async () => {
        const res = await request(app)
            .post("/vacation/employees/not-a-valid-uuid/register")
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
                endDate: formatDate(SUCCESS_FRIDAY),
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("retorna 404 si el empleado objetivo no existe", async () => {
        const nonExistingEmployeeId = randomUUID();

        const res = await request(app)
            .post(`/vacation/employees/${nonExistingEmployeeId}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
                endDate: formatDate(SUCCESS_FRIDAY),
            });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
    });

    test("retorna 400 si faltan fechas", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("retorna 400 si las fechas tienen formato inválido", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: "2026-02-30",
                endDate: "2026-03-02",
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si la fecha final es anterior a la inicial", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: formatDate(SUCCESS_FRIDAY),
                endDate: formatDate(SUCCESS_MONDAY),
            });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si el empleado no tiene días laborales registrados", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${NO_WORKDAYS_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: formatDate(SUCCESS_MONDAY),
                endDate: formatDate(SUCCESS_FRIDAY),
            });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si el rango no contiene días laborales", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: formatDate(WEEKEND_SATURDAY),
                endDate: formatDate(WEEKEND_SUNDAY),
            });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si un día feriado de evento global cubre el rango seleccionado", async () => {
        const startDate = formatDate(GLOBAL_FREE_MONDAY);
        const endDate = formatDate(GLOBAL_FREE_FRIDAY);
        const eventRange = localDateRangeToUtcEventRange(startDate, endDate);

        await createEventType(
            GLOBAL_FREE_EVENT_TYPE_ID,
            `Reg glob ${GLOBAL_FREE_EVENT_TYPE_ID.slice(0, 8)}`,
        );

        await prisma.global_event.create({
            data: {
                global_event_id: randomUUID(),
                event_type_id: GLOBAL_FREE_EVENT_TYPE_ID,
                start: eventRange.start,
                end: eventRange.end,
                name: "Registro global libre",
                description: "Evento global que regala todo el rango",
                all_day: true,
                is_free_day: true,
            },
        });

        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate,
                endDate,
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(startDate),
                end: toDbDate(endDate),
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body).toMatchObject({
            success: false,
            message: "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
        });
        expect(vacation).toBeNull();
    });

    test("retorna 406 si un día feriado de evento de casa cubre el rango seleccionado", async () => {
        const startDate = formatDate(HOUSE_FREE_MONDAY);
        const endDate = formatDate(HOUSE_FREE_FRIDAY);
        const eventRange = localDateRangeToUtcEventRange(startDate, endDate);

        await createEventType(
            HOUSE_FREE_EVENT_TYPE_ID,
            `Reg casa ${HOUSE_FREE_EVENT_TYPE_ID.slice(0, 8)}`,
        );

        await prisma.house_event.create({
            data: {
                house_event_id: randomUUID(),
                house_id: HOUSE_A_ID,
                event_type_id: HOUSE_FREE_EVENT_TYPE_ID,
                start: eventRange.start,
                end: eventRange.end,
                name: "Registro casa libre",
                description: "Evento de casa que regala todo el rango",
                all_day: true,
                is_free_day: true,
            },
        });

        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate,
                endDate,
            });

        const vacation = await prisma.vacations_request.findFirst({
            where: {
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(startDate),
                end: toDbDate(endDate),
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body).toMatchObject({
            success: false,
            message: "Dentro del rango seleccionado no hay ningún día hábil de vacaciones",
        });
        expect(vacation).toBeNull();
    });

    test("retorna 406 si hay vacaciones pendientes traslapadas", async () => {
        const startDate = formatDate(SUCCESS_MONDAY);
        const endDate = formatDate(SUCCESS_FRIDAY);

        await prisma.vacations_request.create({
            data: {
                vacations_request_id: randomUUID(),
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(formatDate(SUCCESS_TUESDAY)),
                end: toDbDate(formatDate(SUCCESS_WEDNESDAY)),
                status: 0,
                used_days: 2,
                created_at: new Date(),
            },
        });

        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate,
                endDate,
            });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si hay vacaciones aprobadas traslapadas", async () => {
        const startDate = formatDate(SUCCESS_MONDAY);
        const endDate = formatDate(SUCCESS_FRIDAY);

        await prisma.vacations_request.create({
            data: {
                vacations_request_id: randomUUID(),
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(formatDate(SUCCESS_TUESDAY)),
                end: toDbDate(formatDate(SUCCESS_WEDNESDAY)),
                status: 1,
                used_days: 2,
                created_at: new Date(),
            },
        });

        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate,
                endDate,
            });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("permite registrar si sólo hay vacaciones rechazadas traslapadas", async () => {
        const startDate = formatDate(SUCCESS_MONDAY);
        const endDate = formatDate(SUCCESS_FRIDAY);

        await prisma.vacations_request.create({
            data: {
                vacations_request_id: randomUUID(),
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(formatDate(SUCCESS_TUESDAY)),
                end: toDbDate(formatDate(SUCCESS_WEDNESDAY)),
                status: 2,
                used_days: 2,
                created_at: new Date(),
            },
        });

        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate,
                endDate,
            });

        const approvedVacations = await prisma.vacations_request.findMany({
            where: {
                employee_id: TARGET_EMPLOYEE_ID,
                status: 1,
            },
        });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(approvedVacations).toHaveLength(1);
    });

    test("retorna 406 si no tiene días suficientes disponibles", async () => {
        await prisma.vacations_request.create({
            data: {
                vacations_request_id: randomUUID(),
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(formatDate(SUCCESS_MONDAY)),
                end: toDbDate(formatDate(SUCCESS_FRIDAY)),
                status: 1,
                used_days: 11,
                created_at: new Date(),
            },
        });

        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: formatDate(THIRD_SUCCESS_MONDAY),
                endDate: formatDate(THIRD_SUCCESS_FRIDAY),
            });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si las vacaciones están fuera del año laboral actual", async () => {
        const res = await request(app)
            .post(`/vacation/employees/${TARGET_EMPLOYEE_ID}/register`)
            .set("Authorization", `Bearer ${getAdminToken()}`)
            .send({
                startDate: formatDate(OUTSIDE_WORK_YEAR_START),
                endDate: formatDate(OUTSIDE_WORK_YEAR_END),
            });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("protege contra registros concurrentes traslapados para el mismo empleado", async () => {
        const targetEmployeeId = TARGET_EMPLOYEE_ID;

        const concurrentStartA = addDays(THIRD_SUCCESS_MONDAY, 14);
        const concurrentEndA = addDays(concurrentStartA, 2);
        const concurrentStartB = addDays(concurrentStartA, 1);
        const concurrentEndB = addDays(concurrentStartA, 3);

        const payloadA = {
            startDate: formatDate(concurrentStartA),
            endDate: formatDate(concurrentEndA),
        };

        const payloadB = {
            startDate: formatDate(concurrentStartB),
            endDate: formatDate(concurrentEndB),
        };

        const responses = await Promise.allSettled([
            request(app)
                .post(`/vacation/employees/${targetEmployeeId}/register`)
                .set("Authorization", `Bearer ${getAdminToken()}`)
                .send(payloadA),

            request(app)
                .post(`/vacation/employees/${targetEmployeeId}/register`)
                .set("Authorization", `Bearer ${getAdminToken()}`)
                .send(payloadB),
        ]);

        const fulfilledResponses = responses.map((result) => result.value);

        const statuses = fulfilledResponses
            .map((response) => response.status)
            .sort();

        expect(statuses).toEqual([201, 406]);

        const successResponse = fulfilledResponses.find(
            (response) => response.status === 201
        );

        const rejectedResponse = fulfilledResponses.find(
            (response) => response.status === 406
        );

        expect(successResponse.body).toMatchObject({
            success: true,
            message: "Vacaciones registradas correctamente",
        });

        expect(rejectedResponse.body).toMatchObject({
            success: false,
            message: "Ya hay una solicitud de vacaciones cubriendo los días solicitados",
        });

        const activeVacations = await prisma.vacations_request.findMany({
            where: {
                employee_id: targetEmployeeId,
                status: {
                    in: ACTIVE_VACATION_STATUSES,
                },
                start: {
                    lte: toDbDate(payloadB.endDate),
                },
                end: {
                    gte: toDbDate(payloadA.startDate),
                },
            },
        });

        expect(activeVacations).toHaveLength(1);

        const logs = await prisma.logs.findMany({
            where: {
                action_id: LOG_ACTIONS.VACATION_REGISTERED_SUCCESS,
                affected: targetEmployeeId,
            },
        });

        expect(logs).toHaveLength(1);
    }); 
});