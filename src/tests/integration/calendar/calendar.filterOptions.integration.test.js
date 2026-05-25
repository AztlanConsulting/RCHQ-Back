require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const app = require("../../../app");

const prisma = new PrismaClient({
    datasources: {
        db: { url: process.env.TEST_DATABASE_URL },
    },
});

const IDS = {
    houseA: randomUUID(),
    houseB: randomUUID(),
    coordinatorRole: randomUUID(),
    adminRole: randomUUID(),
    employeeRole: randomUUID(),
    coordinator: randomUUID(),
    houseEmployeeA: randomUUID(),
    houseEmployeeB: randomUUID(),
    adminA: randomUUID(),
    absenceTypeA: randomUUID(),
    absenceTypeB: randomUUID(),
};

const STATE = {
    createdCoordinatorRole: false,
    createdAdminRole: false,
};

const sign = (overrides = {}) =>
    jwt.sign(
        {
            id: IDS.coordinator,
            email: "coord.filter@test.com",
            role: "Coordinador",
            houseId: IDS.houseA,
            tokenType: "SESSION",
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );

const seed = async () => {
    await prisma.house.createMany({
        data: [
            {
                house_id: IDS.houseA,
                name: `Casa A ${IDS.houseA}`,
                location: "Querétaro",
                phone_number: "4420000001",
                description: "Casa A",
                image: "a.jpg",
            },
            {
                house_id: IDS.houseB,
                name: `Casa B ${IDS.houseB}`,
                location: "Querétaro",
                phone_number: "4420000002",
                description: "Casa B",
                image: "b.jpg",
            },
        ],
    });

    const existingCoordinatorRole = await prisma.role.findUnique({
        where: { name: "Coordinador" },
    });
    if (existingCoordinatorRole) {
        IDS.coordinatorRole = existingCoordinatorRole.role_id;
    } else {
        STATE.createdCoordinatorRole = true;
        await prisma.role.create({
            data: { role_id: IDS.coordinatorRole, name: "Coordinador" },
        });
    }

    const existingAdminRole = await prisma.role.findUnique({
        where: { name: "Administrador" },
    });
    if (existingAdminRole) {
        IDS.adminRole = existingAdminRole.role_id;
    } else {
        STATE.createdAdminRole = true;
        await prisma.role.create({
            data: { role_id: IDS.adminRole, name: "Administrador" },
        });
    }

    await prisma.role.create({
        data: {
            role_id: IDS.employeeRole,
            name: `Empleado-${IDS.employeeRole.slice(0, 8)}`,
        },
    });

    await prisma.employee.createMany({
        data: [
            {
                employee_id: IDS.coordinator,
                house_id: IDS.houseA,
                role_id: IDS.coordinatorRole,
                name: "Carmen",
                surname: "Coordinadora",
                is_active: true,
                email: "coord.filter@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "COOC900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.houseEmployeeA,
                house_id: IDS.houseA,
                role_id: IDS.employeeRole,
                name: "Luis",
                surname: "Martínez",
                is_active: true,
                email: "luis.house.a@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "LUIM900101HDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.houseEmployeeB,
                house_id: IDS.houseB,
                role_id: IDS.employeeRole,
                name: "María",
                surname: "González",
                is_active: true,
                email: "maria.house.b@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "MARG900101MDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
            {
                employee_id: IDS.adminA,
                house_id: IDS.houseA,
                role_id: IDS.adminRole,
                name: "Alberto",
                surname: "Administrador",
                is_active: true,
                email: "admin.house.a@test.com",
                password: "hashed",
                has_first_login: false,
                curp: "ADMA900101HDFABC01",
                start_date: new Date("2024-01-01"),
                type: "nomina",
            },
        ],
    });

    await prisma.absence_type.createMany({
        data: [
            {
                absence_type_id: IDS.absenceTypeA,
                name: `Médica-${IDS.absenceTypeA.slice(0, 8)}`,
            },
            {
                absence_type_id: IDS.absenceTypeB,
                name: `Paternidad-${IDS.absenceTypeB.slice(0, 8)}`,
            },
        ],
    });
};

const cleanup = async () => {
    await prisma.absence.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.coordinator,
                    IDS.houseEmployeeA,
                    IDS.houseEmployeeB,
                    IDS.adminA,
                ],
            },
        },
    });

    await prisma.employee_workday.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.coordinator,
                    IDS.houseEmployeeA,
                    IDS.houseEmployeeB,
                    IDS.adminA,
                ],
            },
        },
    });

    await prisma.employee.deleteMany({
        where: {
            employee_id: {
                in: [
                    IDS.coordinator,
                    IDS.houseEmployeeA,
                    IDS.houseEmployeeB,
                    IDS.adminA,
                ],
            },
        },
    });

    await prisma.absence_type.deleteMany({
        where: {
            absence_type_id: {
                in: [IDS.absenceTypeA, IDS.absenceTypeB],
            },
        },
    });

    await prisma.role.deleteMany({
        where: {
            role_id: IDS.employeeRole,
        },
    });

    if (STATE.createdCoordinatorRole) {
        await prisma.role.deleteMany({
            where: { role_id: IDS.coordinatorRole },
        });
    }

    if (STATE.createdAdminRole) {
        await prisma.role.deleteMany({
            where: { role_id: IDS.adminRole },
        });
    }

    await prisma.house.deleteMany({
        where: {
            house_id: { in: [IDS.houseA, IDS.houseB] },
        },
    });
};

describe("Calendar filter option routes", () => {
    beforeAll(async () => {
        await seed();
    });

    afterAll(async () => {
        await cleanup();
        await prisma.$disconnect();
    });

    describe("GET /house/employees", () => {
        it("401 sin token", async () => {
            const res = await request(app).get("/house/employees");
            expect(res.status).toBe(401);
        });

        it("403 si un empleado manipula role en el JWT para parecer coordinador", async () => {
            const token = sign({
                id: IDS.houseEmployeeA,
                email: "luis.house.a@test.com",
                role: "Coordinador",
            });

            const res = await request(app)
                .get("/house/employees")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(403);
        });

        it("ignora houseId del JWT y devuelve empleados de la casa real del coordinador", async () => {
            const token = sign({ houseId: IDS.houseB });

            const res = await request(app)
                .get("/house/employees")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.employees)).toBe(true);

            const employeeIds = res.body.data.employees.map((employee) => employee.employeeId);

            expect(employeeIds).toContain(IDS.coordinator);
            expect(employeeIds).toContain(IDS.houseEmployeeA);
            expect(employeeIds).toContain(IDS.adminA);
            expect(employeeIds).not.toContain(IDS.houseEmployeeB);
        });

        it("403 si un admin intenta acceder", async () => {
            const token = sign({
                id: IDS.adminA,
                email: "admin.house.a@test.com",
                role: "Administrador",
            });

            const res = await request(app)
                .get("/house/employees")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(403);
        });
    });

    describe("GET /absence/types", () => {
        it("401 sin token", async () => {
            const res = await request(app).get("/absence/types");
            expect(res.status).toBe(401);
        });

        it("403 si un empleado manipula role en el JWT para parecer coordinador", async () => {
            const token = sign({
                id: IDS.houseEmployeeA,
                email: "luis.house.a@test.com",
                role: "Coordinador",
            });

            const res = await request(app)
                .get("/absence/types")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(403);
        });

        it("200 y retorna absenceTypes en camelCase para un coordinador real", async () => {
            const token = sign({ houseId: IDS.houseB });

            const res = await request(app)
                .get("/absence/types")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.absenceTypes).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        absenceTypeId: IDS.absenceTypeA,
                        name: expect.stringContaining("Médica"),
                    }),
                    expect.objectContaining({
                        absenceTypeId: IDS.absenceTypeB,
                        name: expect.stringContaining("Paternidad"),
                    }),
                ]),
            );
        });
    });
});
