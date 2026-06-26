const { randomUUID } = require("crypto");
const request = require("supertest");
const app = require("../../app");
const prisma = require("../../prisma");
const jwt = require("jsonwebtoken");
const { VACATION_STATUS } = require("../../utils/vacationStatus");

function generateSessionToken({
    employeeId,
    email,
    name,
    role,
    houseId,
    privileges = [],
}) {
    return jwt.sign(
        {
            id: employeeId,
            employeeId,
            email,
            name,
            role,
            houseId,
            privileges,
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

describe("PATCH /vacation/request/:vacationRequestId/dates", () => {
    const houseId = "91000000-0000-4000-8000-000000000001";
    const otherHouseId = "91000000-0000-4000-8000-000000000002";

    let coordinatorRoleId = "92000000-0000-4000-8000-000000000001";
    let adminRoleId = "92000000-0000-4000-8000-000000000002";
    let maintenanceRoleId = "92000000-0000-4000-8000-000000000003";

    let manageEmployeesPrivilegeId = "93000000-0000-4000-8000-000000000001";
    let editVacationsPrivilegeId = "93000000-0000-4000-8000-000000000002";

    const coordinatorId = "94000000-0000-4000-8000-000000000001";
    const maintenanceId = "94000000-0000-4000-8000-000000000002";
    const otherHouseEmployeeId = "94000000-0000-4000-8000-000000000003";
    const adminEmployeeId = "94000000-0000-4000-8000-000000000004";

    const pendingVacationId = "95000000-0000-4000-8000-000000000001";
    const rejectedVacationId = "95000000-0000-4000-8000-000000000002";
    const overlapVacationId = "95000000-0000-4000-8000-000000000003";
    const approvedVacationId = "95000000-0000-4000-8000-000000000004";
    const otherHouseVacationId = "95000000-0000-4000-8000-000000000005";
    const adminVacationId = "95000000-0000-4000-8000-000000000006";
    const startedVacationId = "95000000-0000-4000-8000-000000000007";

    const testEmployeeIds = [
        coordinatorId,
        maintenanceId,
        otherHouseEmployeeId,
        adminEmployeeId,
    ];

    const testVacationIds = [
        pendingVacationId,
        rejectedVacationId,
        overlapVacationId,
        approvedVacationId,
        otherHouseVacationId,
        adminVacationId,
        startedVacationId,
    ];

    let coordinatorToken;
    let employeeToken;
    let otherHouseEmployeeToken;

    async function getOrCreateRoleId(name, fallbackId) {
        const existingRole = await prisma.role.findUnique({
            where: {
                name,
            },
        });

        if (existingRole) {
            return existingRole.role_id;
        }

        const createdRole = await prisma.role.create({
            data: {
                role_id: fallbackId,
                name,
            },
        });

        return createdRole.role_id;
    }

    async function getOrCreatePrivilegeId(name, fallbackId) {
        const existingPrivilege = await prisma.privileges.findUnique({
            where: {
                name,
            },
        });

        if (existingPrivilege) {
            return existingPrivilege.privilege_id;
        }

        const createdPrivilege = await prisma.privileges.create({
            data: {
                privilege_id: fallbackId,
                name,
            },
        });

        return createdPrivilege.privilege_id;
    }

    async function seedActions() {
        await prisma.action.upsert({
            where: {
                action_id: "vaca-005",
            },
            update: {
                description: "Modificación de vacaciones exitosa",
                important: false,
            },
            create: {
                action_id: "vaca-005",
                description: "Modificación de vacaciones exitosa",
                important: false,
            },
        });
    }

    async function cleanTestData() {
        await prisma.logs.deleteMany({
            where: {
                OR: [
                    {
                        employee_id: {
                            in: testEmployeeIds,
                        },
                    },
                    {
                        affected: {
                            in: testEmployeeIds,
                        },
                    },
                ],
            },
        });

        await prisma.vacations_request.deleteMany({
            where: {
                OR: [
                    {
                        vacations_request_id: {
                            in: testVacationIds,
                        },
                    },
                    {
                        employee_id: {
                            in: testEmployeeIds,
                        },
                    },
                ],
            },
        });

        await prisma.employee_shift.deleteMany({
            where: {
                employee_id: {
                    in: testEmployeeIds,
                },
            },
        });

        await prisma.employee.deleteMany({
            where: {
                employee_id: {
                    in: testEmployeeIds,
                },
            },
        });

        await prisma.house.deleteMany({
            where: {
                house_id: {
                    in: [houseId, otherHouseId],
                },
            },
        });
    }

    beforeAll(async () => {
        await cleanTestData();
        await seedActions();

        coordinatorRoleId = await getOrCreateRoleId(
            "Coordinador",
            coordinatorRoleId
        );
        adminRoleId = await getOrCreateRoleId("Administrador", adminRoleId);
        maintenanceRoleId = await getOrCreateRoleId(
            "Mantenimiento",
            maintenanceRoleId
        );

        manageEmployeesPrivilegeId = await getOrCreatePrivilegeId(
            "manageEmployees",
            manageEmployeesPrivilegeId
        );
        editVacationsPrivilegeId = await getOrCreatePrivilegeId(
            "editVacations",
            editVacationsPrivilegeId
        );

        await prisma.role_privilege.upsert({
            where: {
                role_id_privilege_id: {
                    role_id: coordinatorRoleId,
                    privilege_id: manageEmployeesPrivilegeId,
                },
            },
            update: {},
            create: {
                role_id: coordinatorRoleId,
                privilege_id: manageEmployeesPrivilegeId,
            },
        });

        for (const roleId of [
            coordinatorRoleId,
            adminRoleId,
            maintenanceRoleId,
        ]) {
            await prisma.role_privilege.upsert({
                where: {
                    role_id_privilege_id: {
                        role_id: roleId,
                        privilege_id: editVacationsPrivilegeId,
                    },
                },
                update: {},
                create: {
                    role_id: roleId,
                    privilege_id: editVacationsPrivilegeId,
                },
            });
        }

        await prisma.house.createMany({
            data: [
                {
                    house_id: houseId,
                    name: "Casa Test US30",
                    location: "Querétaro",
                    phone_number: "4420000000",
                    description: "Casa de prueba",
                    image: "default_house",
                },
                {
                    house_id: otherHouseId,
                    name: "Casa Test US30 Otra",
                    location: "Querétaro",
                    phone_number: "4420000001",
                    description: "Casa de prueba otra",
                    image: "default_house",
                },
            ],
        });

        await prisma.employee.createMany({
            data: [
                {
                    employee_id: coordinatorId,
                    house_id: houseId,
                    role_id: coordinatorRoleId,
                    name: "Coordinador",
                    surname: "Test",
                    is_active: true,
                    email: "coordinador.us30@test.com",
                    password: "hash",
                    has_first_login: false,
                    is_active_two_factor_auth: false,
                    failed_login_attempts: 0,
                    failed_two_factor_auth_attempts: 0,
                    curp: "MOXC801103MBSCYE80",
                    birth_date: new Date("1990-01-01T00:00:00.000Z"),
                    start_date: new Date("2025-04-09T00:00:00.000Z"),
                    picture: "boop",
                    type: "nomina",
                },
                {
                    employee_id: maintenanceId,
                    house_id: houseId,
                    role_id: maintenanceRoleId,
                    name: "Empleado",
                    surname: "Test",
                    is_active: true,
                    email: "empleado.us30@test.com",
                    password: "hash",
                    has_first_login: false,
                    is_active_two_factor_auth: false,
                    failed_login_attempts: 0,
                    failed_two_factor_auth_attempts: 0,
                    curp: "MOXC801103MBSCYE81",
                    birth_date: new Date("1990-01-01T00:00:00.000Z"),
                    start_date: new Date("2025-04-09T00:00:00.000Z"),
                    picture: "boop",
                    type: "nomina",
                },
                {
                    employee_id: otherHouseEmployeeId,
                    house_id: otherHouseId,
                    role_id: maintenanceRoleId,
                    name: "Empleado Otra Casa",
                    surname: "Test",
                    is_active: true,
                    email: "otra-casa.us30@test.com",
                    password: "hash",
                    has_first_login: false,
                    is_active_two_factor_auth: false,
                    failed_login_attempts: 0,
                    failed_two_factor_auth_attempts: 0,
                    curp: "MOXC801103MBSCYE82",
                    birth_date: new Date("1990-01-01T00:00:00.000Z"),
                    start_date: new Date("2025-04-09T00:00:00.000Z"),
                    picture: "boop",
                    type: "nomina",
                },
                {
                    employee_id: adminEmployeeId,
                    house_id: houseId,
                    role_id: adminRoleId,
                    name: "Administrador",
                    surname: "Test",
                    is_active: true,
                    email: "admin.us30@test.com",
                    password: "hash",
                    has_first_login: false,
                    is_active_two_factor_auth: false,
                    failed_login_attempts: 0,
                    failed_two_factor_auth_attempts: 0,
                    curp: "MOXC801103MBSCYE83",
                    birth_date: new Date("1990-01-01T00:00:00.000Z"),
                    start_date: new Date("2025-04-09T00:00:00.000Z"),
                    picture: "boop",
                    type: "nomina",
                },
            ],
        });

        await prisma.workday.createMany({
            data: [
                {
                    workday_id: "96000000-0000-4000-8000-000000000001",
                    name: "Lunes",
                },
                {
                    workday_id: "96000000-0000-4000-8000-000000000002",
                    name: "Martes",
                },
                {
                    workday_id: "96000000-0000-4000-8000-000000000003",
                    name: "Miércoles",
                },
                {
                    workday_id: "96000000-0000-4000-8000-000000000004",
                    name: "Jueves",
                },
                {
                    workday_id: "96000000-0000-4000-8000-000000000005",
                    name: "Viernes",
                },
            ],
            skipDuplicates: true,
        });

        const workdays = await prisma.workday.findMany({
            where: {
                name: {
                    in: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
                },
            },
        });

        const employeeWorkdays = [];

        for (const employeeId of testEmployeeIds) {
            for (const workday of workdays) {
                employeeWorkdays.push({
                    shift_id: randomUUID(),
            employee_id: employeeId,
            start_workday_id: workday.workday_id,
            end_workday_id: workday.workday_id,
            start: new Date("1970-01-01T09:00:00.000Z"),
                    end: new Date("1970-01-01T18:00:00.000Z"),
                });
            }
        }

        await prisma.employee_shift.createMany({
            data: employeeWorkdays,
            skipDuplicates: true,
        });

        await prisma.vacations_request.createMany({
            data: [
                {
                    vacations_request_id: pendingVacationId,
                    employee_id: maintenanceId,
                    start: new Date("2026-06-10T00:00:00.000Z"),
                    end: new Date("2026-06-12T00:00:00.000Z"),
                    status: VACATION_STATUS.PENDING,
                    feedback: null,
                    created_at: new Date(),
                    used_days: 3,
                },
                {
                    vacations_request_id: rejectedVacationId,
                    employee_id: maintenanceId,
                    start: new Date("2026-07-01T00:00:00.000Z"),
                    end: new Date("2026-07-03T00:00:00.000Z"),
                    status: VACATION_STATUS.REJECTED,
                    feedback: "No procede",
                    created_at: new Date(),
                    used_days: 3,
                },
                {
                    vacations_request_id: overlapVacationId,
                    employee_id: maintenanceId,
                    start: new Date("2026-08-10T00:00:00.000Z"),
                    end: new Date("2026-08-12T00:00:00.000Z"),
                    status: VACATION_STATUS.PENDING,
                    feedback: null,
                    created_at: new Date(),
                    used_days: 3,
                },
                {
                    vacations_request_id: approvedVacationId,
                    employee_id: maintenanceId,
                    start: new Date("2026-09-10T00:00:00.000Z"),
                    end: new Date("2026-09-11T00:00:00.000Z"),
                    status: VACATION_STATUS.APPROVED,
                    feedback: null,
                    created_at: new Date(),
                    used_days: 2,
                },
                {
                    vacations_request_id: otherHouseVacationId,
                    employee_id: otherHouseEmployeeId,
                    start: new Date("2026-10-10T00:00:00.000Z"),
                    end: new Date("2026-10-12T00:00:00.000Z"),
                    status: VACATION_STATUS.PENDING,
                    feedback: null,
                    created_at: new Date(),
                    used_days: 1,
                },
                {
                    vacations_request_id: adminVacationId,
                    employee_id: adminEmployeeId,
                    start: new Date("2026-11-10T00:00:00.000Z"),
                    end: new Date("2026-11-12T00:00:00.000Z"),
                    status: VACATION_STATUS.PENDING,
                    feedback: null,
                    created_at: new Date(),
                    used_days: 1,
                },
                {
                    vacations_request_id: startedVacationId,
                    employee_id: maintenanceId,
                    start: new Date("2026-02-20T00:00:00.000Z"),
                    end: new Date("2026-02-22T00:00:00.000Z"),
                    status: VACATION_STATUS.PENDING,
                    feedback: null,
                    created_at: new Date(),
                    used_days: 3,
                },
            ],
        });

        coordinatorToken = generateSessionToken({
            employeeId: coordinatorId,
            email: "coordinador.us30@test.com",
            name: "Coordinador",
            role: "Coordinador",
            houseId,
            privileges: ["manageEmployees", "editVacations"],
        });

        employeeToken = generateSessionToken({
            employeeId: maintenanceId,
            email: "empleado.us30@test.com",
            name: "Empleado",
            role: "Mantenimiento",
            houseId,
            privileges: ["editVacations"],
        });

        otherHouseEmployeeToken = generateSessionToken({
            employeeId: otherHouseEmployeeId,
            email: "otra-casa.us30@test.com",
            name: "Empleado Otra Casa",
            role: "Mantenimiento",
            houseId: otherHouseId,
            privileges: ["editVacations"],
        });
    });

    afterAll(async () => {
        await cleanTestData();
        await prisma.$disconnect();
    });

    it("200 modifica fechas de una solicitud pendiente", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-06-16",
                endDate: "2026-06-19",
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Vacaciones modificadas correctamente");

        const updated = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: pendingVacationId,
            },
        });

        expect(updated.start.toISOString().slice(0, 10)).toBe("2026-06-16");
        expect(updated.end.toISOString().slice(0, 10)).toBe("2026-06-19");
        expect(updated.used_days).toBe(4);
        expect(updated.status).toBe(VACATION_STATUS.PENDING);
    });

    it("200 modifica fechas de una solicitud aprobada conservando el estado", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${approvedVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-09-14",
                endDate: "2026-09-15",
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const updated = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: approvedVacationId,
            },
        });

        expect(updated.start.toISOString().slice(0, 10)).toBe("2026-09-14");
        expect(updated.end.toISOString().slice(0, 10)).toBe("2026-09-15");
        expect(updated.status).toBe(VACATION_STATUS.APPROVED);
    });

    it("200 permite que el dueño modifique su propia solicitud pendiente", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .set("Authorization", `Bearer ${employeeToken}`)
            .send({
                startDate: "2026-06-22",
                endDate: "2026-06-23",
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        const updated = await prisma.vacations_request.findUnique({
            where: {
                vacations_request_id: pendingVacationId,
            },
        });

        expect(updated.start.toISOString().slice(0, 10)).toBe("2026-06-22");
        expect(updated.end.toISOString().slice(0, 10)).toBe("2026-06-23");
        expect(updated.status).toBe(VACATION_STATUS.PENDING);
    });

    it("406 no permite que el dueño modifique su propia solicitud aprobada", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${approvedVacationId}/dates`)
            .set("Authorization", `Bearer ${employeeToken}`)
            .send({
                startDate: "2026-09-21",
                endDate: "2026-09-22",
            });

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Solo puedes modificar solicitudes de vacaciones pendientes"
        );
    });

    it("400 rechaza formato de fecha inválido", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-02-31",
                endDate: "2026-03-02",
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it("400 rechaza vacationRequestId inválido", async () => {
        const response = await request(app)
            .patch("/vacation/request/no-es-uuid/dates")
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-06-22",
                endDate: "2026-06-23",
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it("406 rechaza startDate posterior a endDate", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-06-20",
                endDate: "2026-06-19",
            });

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "No se puede tener una fecha de inicio posterior a la de finalización"
        );
    });

    it("406 no permite modificar solicitudes rechazadas", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${rejectedVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-07-06",
                endDate: "2026-07-07",
            });

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "No se pueden modificar vacaciones rechazadas"
        );
    });

    it("406 no permite modificar una vacación que ya comenzó", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${startedVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-05-25",
                endDate: "2026-05-26",
            });

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "No se pueden modificar vacaciones que ya comenzaron o asignar una fecha de inicio anterior al día de hoy"
        );
    });

    it("406 no permite modificar una vacación hacia una fecha pasada", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-02-22",
                endDate: "2026-02-23",
            });

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "No se pueden modificar vacaciones que ya comenzaron o asignar una fecha de inicio anterior al día de hoy"
        );
    });

    it("406 rechaza rango sin días hábiles", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-06-20",
                endDate: "2026-06-21",
            });

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Dentro del rango seleccionado no hay ningún día hábil de vacaciones"
        );
    });

    it("406 rechaza traslape con otra solicitud activa", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-08-11",
                endDate: "2026-08-13",
            });

        expect(response.status).toBe(406);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Ya hay una solicitud de vacaciones cubriendo los días solicitados"
        );
    });

    it("403 no permite modificar vacaciones de empleado de otra casa", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${otherHouseVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-10-13",
                endDate: "2026-10-14",
            });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    it("403 no permite modificar vacaciones de Administrador", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${adminVacationId}/dates`)
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-11-13",
                endDate: "2026-11-14",
            });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    it("403 no permite modificar si el usuario no es dueño ni Coordinador", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .set("Authorization", `Bearer ${otherHouseEmployeeToken}`)
            .send({
                startDate: "2026-06-24",
                endDate: "2026-06-25",
            });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe("Acceso denegado");
    });

    it("401 no permite modificar sin token", async () => {
        const response = await request(app)
            .patch(`/vacation/request/${pendingVacationId}/dates`)
            .send({
                startDate: "2026-06-22",
                endDate: "2026-06-23",
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it("404 regresa error si la solicitud no existe", async () => {
        const response = await request(app)
            .patch("/vacation/request/99999999-9999-4999-8999-999999999999/dates")
            .set("Authorization", `Bearer ${coordinatorToken}`)
            .send({
                startDate: "2026-06-22",
                endDate: "2026-06-23",
            });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});
