const { cleanIntegrationDb } = require("../../helpers/integrationIsolation");
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../../index");
const {
    calculateUsedDays,
    convertUTCToMexicanTime,
} = require("../../../utils/dates");

const prisma = new PrismaClient();

const HOUSE_A_ID = randomUUID();
const HOUSE_B_ID = randomUUID();

let ADMIN_ROLE_ID;
let COORDINATOR_ROLE_ID;
let USER_ROLE_ID;
let MANAGE_EMPLOYEES_PRIVILEGE_ID;

const ADMIN_ID = randomUUID();
const COORDINATOR_ID = randomUUID();
const USER_ID = randomUUID();
const TARGET_EMPLOYEE_ID = randomUUID();
const OTHER_HOUSE_EMPLOYEE_ID = randomUUID();
const NO_WORKDAYS_EMPLOYEE_ID = randomUUID();
const HOUSE_FREE_EVENT_TYPE_ID = randomUUID();

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

function localDateRangeToUtcEventRange(startDate, endDate = startDate) {
    const endDateUtc = toDbDate(endDate);
    endDateUtc.setUTCDate(endDateUtc.getUTCDate() + 1);

    return {
        start: new Date(`${startDate}T06:00:00.000Z`),
        end: new Date(`${formatDate(endDateUtc)}T05:59:00.000Z`),
    };
}

function getExpectedUsedDays({ startDate, endDate, freeEvents = [] }) {
    const workDays = [
        { workday: { name: "Lunes" } },
        { workday: { name: "Martes" } },
        { workday: { name: "Miércoles" } },
        { workday: { name: "Jueves" } },
        { workday: { name: "Viernes" } },
    ];

    const freeDays = freeEvents.map((event) => ({
        ...event,
        start: convertUTCToMexicanTime(event.start),
        end: convertUTCToMexicanTime(event.end),
    }));

    return calculateUsedDays(
        workDays,
        toDbDate(startDate),
        toDbDate(endDate),
        freeDays,
        true,
    );
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

function getCoordinatorToken() {
    return generateSessionToken({
        employee_id: COORDINATOR_ID,
        email: "coordinator.us34@test.com",
        name: "Coordinator",
        roleName: "Coordinador",
        house_id: HOUSE_A_ID,
        privileges: ["manageEmployees"],
    });
}

function getUserToken() {
    return generateSessionToken({
        employee_id: USER_ID,
        email: "user.us34@test.com",
        name: "User",
        roleName: "Usuario",
        house_id: HOUSE_A_ID,
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

async function seedManageEmployeesPrivilege() {
    const existingPrivilege = await prisma.privileges.findUnique({
        where: { name: "manageEmployees" },
    });

    if (existingPrivilege) {
        MANAGE_EMPLOYEES_PRIVILEGE_ID = existingPrivilege.privilege_id;
    } else {
        MANAGE_EMPLOYEES_PRIVILEGE_ID = randomUUID();

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
        await prisma.role_privilege.create({
            data: {
                role_id: COORDINATOR_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
        });
    }
}

async function seedActions() {
    await prisma.action.upsert({
        where: { action_id: "vaca-003" },
        update: {
            description: "Aprobación de solicitud de vacaciones exitosa",
            important: false,
        },
        create: {
            action_id: "vaca-003",
            description: "Aprobación de solicitud de vacaciones exitosa",
            important: false,
        },
    });
}

async function seedBaseData() {
    await prisma.house.createMany({
        data: [
            {
                house_id: HOUSE_A_ID,
                name: "Casa US34 A",
                location: "Test Location A",
                phone_number: "4420000001",
                description: "Casa de prueba US34 A",
                image: "test-a.jpg",
            },
            {
                house_id: HOUSE_B_ID,
                name: "Casa US34 B",
                location: "Test Location B",
                phone_number: "4420000002",
                description: "Casa de prueba US34 B",
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
                surname: "US34",
                is_active: true,
                email: "admin.us34@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA31",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: COORDINATOR_ID,
                house_id: HOUSE_A_ID,
                role_id: COORDINATOR_ROLE_ID,
                name: "Coordinator",
                surname: "US34",
                is_active: true,
                email: "coordinator.us34@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA32",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: USER_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "User",
                surname: "US34",
                is_active: true,
                email: "user.us34@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA33",
                start_date: EMPLOYEE_START_DATE,
                type: "nomina",
            },
            {
                employee_id: TARGET_EMPLOYEE_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "Target",
                surname: "US34",
                is_active: true,
                email: "target.us34@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA34",
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
                email: "other.us34@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA35",
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
                email: "no.workdays.us34@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "USAA010101HDFAAA36",
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

async function createPendingVacation({
    employeeId = TARGET_EMPLOYEE_ID,
    startDate = formatDate(SUCCESS_MONDAY),
    endDate = formatDate(SUCCESS_FRIDAY),
    usedDays = 5,
} = {}) {
    return await prisma.vacations_request.create({
        data: {
            vacations_request_id: randomUUID(),
            employee_id: employeeId,
            start: toDbDate(startDate),
            end: toDbDate(endDate),
            status: 0,
            feedback: null,
            used_days: usedDays,
            created_at: new Date(),
        },
    });
}

beforeEach(async () => {
    await cleanIntegrationDb();
    await seedActions();
    await seedBaseData();
});

afterEach(async () => {
    await cleanIntegrationDb();
    await prisma.$disconnect();
});

describe("US34 - PATCH /vacation/request/:vacationRequestId/approve", () => {

    test("coordinador aprueba solicitud de empleado de su misma casa", async () => {
        const vacation = await createPendingVacation({
            startDate: formatDate(SECOND_SUCCESS_MONDAY),
            endDate: formatDate(SECOND_SUCCESS_FRIDAY),
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const updatedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(updatedVacation.status).toBe(1);
    });

    test("coordinador aprueba y no toma en cuenta días feriados por eventos de casa", async () => {
        const startDate = formatDate(THIRD_SUCCESS_MONDAY);
        const endDate = formatDate(THIRD_SUCCESS_FRIDAY);
        const freeEventRange = localDateRangeToUtcEventRange(
            formatDate(addDays(THIRD_SUCCESS_MONDAY, 2)),
        );

        await createEventType(
            HOUSE_FREE_EVENT_TYPE_ID,
            `Aprob casa ${HOUSE_FREE_EVENT_TYPE_ID.slice(0, 8)}`,
        );

        await prisma.house_event.create({
            data: {
                house_event_id: randomUUID(),
                house_id: HOUSE_A_ID,
                event_type_id: HOUSE_FREE_EVENT_TYPE_ID,
                start: freeEventRange.start,
                end: freeEventRange.end,
                name: "Aprobación casa libre",
                description: "Evento de casa libre para aprobación",
                all_day: true,
                is_free_day: true,
            },
        });

        const vacation = await createPendingVacation({
            startDate,
            endDate,
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const updatedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(updatedVacation.status).toBe(1);
        expect(updatedVacation.used_days).toBe(
            getExpectedUsedDays({
                startDate,
                endDate,
                freeEvents: [
                    {
                        ...freeEventRange,
                        isFreeDay: true,
                    },
                ],
            }),
        );
    });

    test("coordinador no aprueba solicitud de empleado de otra casa", async () => {
        const vacation = await createPendingVacation({
            employeeId: OTHER_HOUSE_EMPLOYEE_ID,
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const updatedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(updatedVacation.status).toBe(0);
    });

    test("coordinador no aprueba solicitud de un admin", async () => {
        const vacation = await createPendingVacation({
            employeeId: ADMIN_ID,
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const updatedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
        expect(updatedVacation.status).toBe(0);
    });

    test("usuario sin permisos no puede aprobar solicitudes", async () => {
        const vacation = await createPendingVacation();

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getUserToken()}`)
            .send({});

        const updatedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(403);
        expect(updatedVacation.status).toBe(0);
    });

    test("retorna 401 si no se envía token", async () => {
        const vacation = await createPendingVacation();

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .send({});

        expect(res.statusCode).toBe(401);
    });

    test("retorna 401 si el token es inválido", async () => {
        const vacation = await createPendingVacation();

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", "Bearer token_invalido")
            .send({});

        expect(res.statusCode).toBe(401);
    });

    test("retorna 400 si vacationRequestId no es UUID válido", async () => {
        const res = await request(app)
            .patch("/vacation/request/not-a-valid-uuid/approve")
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("retorna 404 si la solicitud no existe", async () => {
        const res = await request(app)
            .patch(`/vacation/request/${randomUUID()}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si la solicitud ya fue aprobada", async () => {
        const vacation = await createPendingVacation();

        await prisma.vacations_request.update({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
            data: {
                status: 1,
            },
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si la solicitud ya fue rechazada", async () => {
        const vacation = await createPendingVacation();

        await prisma.vacations_request.update({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
            data: {
                status: 2,
            },
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si se traslapa con vacaciones aprobadas", async () => {
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

        const pendingVacation = await createPendingVacation({
            startDate: formatDate(SUCCESS_MONDAY),
            endDate: formatDate(SUCCESS_FRIDAY),
        });

        const res = await request(app)
            .patch(`/vacation/request/${pendingVacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const updatedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: pendingVacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
        expect(updatedVacation.status).toBe(0);
    });

    test("retorna 406 si no tiene días suficientes contando PENDING + APPROVED", async () => {
        await prisma.vacations_request.create({
            data: {
                vacations_request_id: randomUUID(),
                employee_id: TARGET_EMPLOYEE_ID,
                start: toDbDate(formatDate(SECOND_SUCCESS_MONDAY)),
                end: toDbDate(formatDate(SECOND_SUCCESS_FRIDAY)),
                status: 0,
                used_days: 10,
                created_at: new Date(),
            },
        });

        const pendingVacation = await createPendingVacation({
            startDate: formatDate(SUCCESS_MONDAY),
            endDate: formatDate(SUCCESS_FRIDAY),
            usedDays: 5,
        });

        const res = await request(app)
            .patch(`/vacation/request/${pendingVacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const updatedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: pendingVacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
        expect(updatedVacation.status).toBe(0);
    });

    test("retorna 406 si el empleado no tiene días laborales registrados", async () => {
        const vacation = await createPendingVacation({
            employeeId: NO_WORKDAYS_EMPLOYEE_ID,
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("retorna 406 si el rango no contiene días laborales", async () => {
        const vacation = await createPendingVacation({
            startDate: formatDate(WEEKEND_SATURDAY),
            endDate: formatDate(WEEKEND_SUNDAY),
            usedDays: 0,
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        const updatedVacation = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: vacation.vacations_request_id,
            },
        });

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
        expect(updatedVacation.status).toBe(0);
    });

    test("retorna 406 si la solicitud está fuera del año laboral actual", async () => {
        const vacation = await createPendingVacation({
            startDate: formatDate(OUTSIDE_WORK_YEAR_START),
            endDate: formatDate(OUTSIDE_WORK_YEAR_END),
            usedDays: 2,
        });

        const res = await request(app)
            .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
            .set("Authorization", `Bearer ${getCoordinatorToken()}`)
            .send({});

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    test("protege contra dos aprobaciones concurrentes de la misma solicitud", async () => {
        const vacation = await createPendingVacation();

        const responses = await Promise.allSettled([
            request(app)
                .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
                .set("Authorization", `Bearer ${getCoordinatorToken()}`)
                .send({}),
            request(app)
                .patch(`/vacation/request/${vacation.vacations_request_id}/approve`)
                .set("Authorization", `Bearer ${getCoordinatorToken()}`)
                .send({}),
        ]);

        const fulfilledResponses = responses.map((result) => result.value);
        const statuses = fulfilledResponses
            .map((response) => response.status)
            .sort();

        expect(statuses).toEqual([200, 406]);

        const approvedVacations = await prisma.vacations_request.findMany({
            where: {
                vacations_request_id: vacation.vacations_request_id,
                status: 1,
            },
        });

        const logs = await prisma.logs.findMany({
            where: {
                action_id: "vaca-003",
                affected: TARGET_EMPLOYEE_ID,
            },
        });

        expect(approvedVacations).toHaveLength(1);
        expect(logs).toHaveLength(1);
    });

    test("protege contra aprobaciones concurrentes traslapadas del mismo empleado", async () => {
        const vacationA = await createPendingVacation({
            startDate: formatDate(SUCCESS_MONDAY),
            endDate: formatDate(SUCCESS_WEDNESDAY),
            usedDays: 3,
        });

        const vacationB = await createPendingVacation({
            startDate: formatDate(SUCCESS_TUESDAY),
            endDate: formatDate(SUCCESS_FRIDAY),
            usedDays: 4,
        });

        const responses = await Promise.allSettled([
            request(app)
                .patch(`/vacation/request/${vacationA.vacations_request_id}/approve`)
                .set("Authorization", `Bearer ${getCoordinatorToken()}`)
                .send({}),
            request(app)
                .patch(`/vacation/request/${vacationB.vacations_request_id}/approve`)
                .set("Authorization", `Bearer ${getCoordinatorToken()}`)
                .send({}),
        ]);

        const fulfilledResponses = responses.map((result) => result.value);
        const statuses = fulfilledResponses
            .map((response) => response.status)
            .sort();

        expect(statuses).toEqual([200, 406]);

        const approvedVacations = await prisma.vacations_request.findMany({
            where: {
                employee_id: TARGET_EMPLOYEE_ID,
                status: 1,
                start: {
                    lte: toDbDate(formatDate(SUCCESS_FRIDAY)),
                },
                end: {
                    gte: toDbDate(formatDate(SUCCESS_MONDAY)),
                },
            },
        });

        const logs = await prisma.logs.findMany({
            where: {
                action_id: "vaca-003",
                affected: TARGET_EMPLOYEE_ID,
            },
        });

        expect(approvedVacations).toHaveLength(1);
        expect(logs).toHaveLength(1);
    });
});
