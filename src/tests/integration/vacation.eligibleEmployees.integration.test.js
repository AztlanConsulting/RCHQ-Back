const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");

const prisma = new PrismaClient();

const HOUSE_A_ID = randomUUID();
const HOUSE_B_ID = randomUUID();

const ADMIN_ID = randomUUID();
const COORDINATOR_ID = randomUUID();
const USER_ID = randomUUID();
const TARGET_EMPLOYEE_ID = randomUUID();
const OTHER_HOUSE_EMPLOYEE_ID = randomUUID();
const ADMIN_TARGET_ID = randomUUID();

let ADMIN_ROLE_ID;
let COORDINATOR_ROLE_ID;
let USER_ROLE_ID;
let MANAGE_EMPLOYEES_PRIVILEGE_ID;

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
        email: "admin.eligible@test.com",
        name: "Admin Eligible",
        roleName: "Administrador",
        house_id: HOUSE_A_ID,
        privileges: ["manageEmployees"],
    });
}

function getCoordinatorToken() {
    return generateSessionToken({
        employee_id: COORDINATOR_ID,
        email: "coordinator.eligible@test.com",
        name: "Coordinator Eligible",
        roleName: "Coordinador",
        house_id: HOUSE_A_ID,
        privileges: ["manageEmployees"],
    });
}

function getUserToken() {
    return generateSessionToken({
        employee_id: USER_ID,
        email: "user.eligible@test.com",
        name: "User Eligible",
        roleName: "Mantenimiento",
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

async function getOrCreatePrivilegeId(name) {
    const existingPrivilege = await prisma.privileges.findUnique({
        where: { name },
    });

    if (existingPrivilege) {
        return existingPrivilege.privilege_id;
    }

    const createdPrivilege = await prisma.privileges.create({
        data: {
            privilege_id: randomUUID(),
            name,
        },
    });

    return createdPrivilege.privilege_id;
}

async function seedRolePrivileges() {
    await prisma.role_privilege.createMany({
        data: [
            {
                role_id: ADMIN_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
            {
                role_id: COORDINATOR_ROLE_ID,
                privilege_id: MANAGE_EMPLOYEES_PRIVILEGE_ID,
            },
        ],
        skipDuplicates: true,
    });
}

async function seedBaseData() {
    await prisma.house.createMany({
        data: [
            {
                house_id: HOUSE_A_ID,
                name: "Casa Eligible A",
                location: "Test Location A",
                phone_number: "4420000080",
                description: "Casa de prueba elegibles A",
                image: "test-a.jpg",
            },
            {
                house_id: HOUSE_B_ID,
                name: "Casa Eligible B",
                location: "Test Location B",
                phone_number: "4420000180",
                description: "Casa de prueba elegibles B",
                image: "test-b.jpg",
            },
        ],
        skipDuplicates: true,
    });

    ADMIN_ROLE_ID = await getOrCreateRoleId("Administrador");
    COORDINATOR_ROLE_ID = await getOrCreateRoleId("Coordinador");
    USER_ROLE_ID = await getOrCreateRoleId("Mantenimiento");
    MANAGE_EMPLOYEES_PRIVILEGE_ID =
        await getOrCreatePrivilegeId("manageEmployees");

    await seedRolePrivileges();

    await prisma.employee.createMany({
        data: [
            {
                employee_id: ADMIN_ID,
                house_id: HOUSE_A_ID,
                role_id: ADMIN_ROLE_ID,
                name: "Admin",
                surname: "Eligible",
                is_active: true,
                email: "admin.eligible@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE80",
                start_date: new Date("2025-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: COORDINATOR_ID,
                house_id: HOUSE_A_ID,
                role_id: COORDINATOR_ROLE_ID,
                name: "Coordinator",
                surname: "Eligible",
                is_active: true,
                email: "coordinator.eligible@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE81",
                start_date: new Date("2025-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: USER_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "User",
                surname: "Eligible",
                is_active: true,
                email: "user.eligible@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE82",
                start_date: new Date("2025-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: TARGET_EMPLOYEE_ID,
                house_id: HOUSE_A_ID,
                role_id: USER_ROLE_ID,
                name: "Target",
                surname: "Eligible",
                is_active: true,
                email: "target.eligible@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE83",
                start_date: new Date("2025-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: OTHER_HOUSE_EMPLOYEE_ID,
                house_id: HOUSE_B_ID,
                role_id: USER_ROLE_ID,
                name: "Other",
                surname: "House Eligible",
                is_active: true,
                email: "other.house.eligible@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE84",
                start_date: new Date("2025-01-01T00:00:00.000Z"),
                type: "nomina",
            },
            {
                employee_id: ADMIN_TARGET_ID,
                house_id: HOUSE_A_ID,
                role_id: ADMIN_ROLE_ID,
                name: "AdminTarget",
                surname: "Eligible",
                is_active: true,
                email: "admin.target.eligible@test.com",
                password: "not-used",
                has_first_login: false,
                is_active_two_factor_auth: false,
                failed_login_attempts: 0,
                failed_two_factor_auth_attempts: 0,
                curp: "MOXC801103MBSCYE85",
                start_date: new Date("2025-01-01T00:00:00.000Z"),
                type: "nomina",
            },
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
        ADMIN_TARGET_ID,
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
    await seedBaseData();
});

afterAll(async () => {
    await cleanTestData();
    await prisma.$disconnect();
});

describe("GET /vacation/employees/eligible", () => {
    test("retorna 401 si no se envía token", async () => {
        const res = await request(app)
            .get("/vacation/employees/eligible");

        expect(res.statusCode).toBe(401);
    });

    test("retorna 401 si el token es inválido", async () => {
        const res = await request(app)
            .get("/vacation/employees/eligible")
            .set("Authorization", "Bearer token_invalido");

        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({
            success: false,
            message: "Token inválido o expirado",
        });
    });

    test("coordinador consulta empleados elegibles sin exponer roles", async () => {
        const res = await request(app)
            .get("/vacation/employees/eligible")
            .set("Authorization", `Bearer ${getCoordinatorToken()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.employees)).toBe(true);

        const targetEmployee = res.body.data.employees.find(
            (employee) => employee.employeeId === TARGET_EMPLOYEE_ID
        );

        expect(targetEmployee).toMatchObject({
            employeeId: TARGET_EMPLOYEE_ID,
            name: "Target Eligible",
            curp: "MOXC801103MBSCYE83",
            isActive: true,
        });

        res.body.data.employees.forEach((employee) => {
            expect(employee).toHaveProperty("employeeId");
            expect(employee).toHaveProperty("name");
            expect(employee).toHaveProperty("curp");
            expect(employee).toHaveProperty("isActive");

            expect(employee).not.toHaveProperty("role");
            expect(employee).not.toHaveProperty("roleName");
            expect(employee).not.toHaveProperty("roleId");
            expect(employee).not.toHaveProperty("role_id");
        });
    });

    test("coordinador no recibe administradores como empleados elegibles", async () => {
        const res = await request(app)
            .get("/vacation/employees/eligible")
            .set("Authorization", `Bearer ${getCoordinatorToken()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        const employeeIds = res.body.data.employees.map(
            (employee) => employee.employeeId
        );

        expect(employeeIds).not.toContain(ADMIN_ID);
        expect(employeeIds).not.toContain(ADMIN_TARGET_ID);
    });

    test("coordinador no recibe empleados de otra casa", async () => {
        const res = await request(app)
            .get("/vacation/employees/eligible")
            .set("Authorization", `Bearer ${getCoordinatorToken()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        const employeeIds = res.body.data.employees.map(
            (employee) => employee.employeeId
        );

        expect(employeeIds).toContain(TARGET_EMPLOYEE_ID);
        expect(employeeIds).not.toContain(OTHER_HOUSE_EMPLOYEE_ID);
    });

    test("administrador consulta empleados elegibles", async () => {
        const res = await request(app)
            .get("/vacation/employees/eligible")
            .set("Authorization", `Bearer ${getAdminToken()}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.employees)).toBe(true);

        const employeeIds = res.body.data.employees.map(
            (employee) => employee.employeeId
        );

        expect(employeeIds).toContain(TARGET_EMPLOYEE_ID);
        expect(employeeIds).toContain(OTHER_HOUSE_EMPLOYEE_ID);
    });

    test("usuario sin permisos no puede consultar empleados elegibles", async () => {
        const res = await request(app)
            .get("/vacation/employees/eligible")
            .set("Authorization", `Bearer ${getUserToken()}`);

        expect(res.statusCode).toBe(403);
    });
});
