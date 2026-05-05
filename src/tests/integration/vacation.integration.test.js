const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const app = require("../../app");
const bcrypt = require("bcryptjs");
const { seedDb, cleanDb, disconnectDb } = require("../helpers/dbSetup");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const IDS = {
    house: randomUUID(),
    roleAdmin: randomUUID(),
    employeeAdmin: randomUUID(),
    roleCoordinator: randomUUID(),
    employeeCoordinator: randomUUID(),
    roleCook: randomUUID(),
    employeeCook: randomUUID(),
    doc: randomUUID(),
};

const empAdminBase = {
    house_id: IDS.house,
    role_id: IDS.roleAdmin,
    password: "hashed",
    name: "Test",
    surname: "User",
    start_date: new Date(Date.UTC(2022, 1, 1)),
    is_active: true,
    has_first_login: true,
    type: "nomina",
    email: "adminVacation@test.com",
    curp: "VACM000000000001AB",
};

const empCoordBase = {
    house_id: IDS.house,
    role_id: IDS.roleCoordinator,
    password: "hashed",
    name: "Test",
    surname: "User",
    start_date: new Date(Date.UTC(2022, 1, 1)),
    is_active: true,
    has_first_login: true,
    type: "nomina",
    email: "coordVacation@test.com",
    curp: "VACM000000000002AB",
};

const empCookBase = {
    house_id: IDS.house,
    role_id: IDS.roleAdmin,
    password: "hashed",
    name: "Test",
    surname: "User",
    start_date: new Date(Date.UTC(2022, 1, 1)),
    is_active: true,
    has_first_login: true,
    type: "nomina",
    email: "cookVacation@test.com",
    curp: "VACM000000000003AB",
};

const sign = (employeeId, roleId) => {
    return jwt.sign(
        {
            id: employeeId,
            houseId: IDS.house,
            role: roleId,
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
};

// Start seed
const seed = async () => {
    await prisma.house.upsert({
        where: { house_id: IDS.house },
        update: {},
        create: {
            house_id: IDS.house,
            name: `Vacation Test House ${IDS.house}`,
            location: "Loc",
            phone_number: "4420001122",
            description: "test",
            image: "img.jpg",
        },
    });

    const existingAdminRole = await prisma.role.findFirst({
        where: { name: "Admin" },
    });
    if (existingAdminRole) {
        IDS.roleAdmin = existingAdminRole.role_id;
    } else {
        await prisma.role.create({
            data: { role_id: IDS.roleAdmin, name: "Admin" },
        });
    }

    const existingCoordRole = await prisma.role.findFirst({
        where: { name: "Colaborador" },
    });
    if (existingCoordRole) {
        IDS.roleCoordinator = existingCoordRole.role_id;
    } else {
        await prisma.role.create({
            data: { role_id: IDS.roleCoordinator, name: "Colaborador" },
        });
    }

    const existingCookRole = await prisma.role.findFirst({
        where: { name: "Cocinero" },
    });
    if (existingCookRole) {
        IDS.roleCook = existingCookRole.role_id;
    } else {
        await prisma.role.create({
            data: { role_id: IDS.roleCook, name: "Cocinero" },
        });
    }

    await prisma.employee.upsert({
        where: { employee_id: IDS.employeeAdmin },
        update: {},
        create: {
            employee_id: IDS.employeeAdmin,
            ...empAdminBase,
        },
    });

    await prisma.employee.upsert({
        where: { employee_id: IDS.employeeCoordinator },
        update: {},
        create: {
            employee_id: IDS.employeeCoordinator,
            ...empCoordBase,
        },
    });

    await prisma.employee.upsert({
        where: { employee_id: IDS.employeeCook },
        update: {},
        create: {
            employee_id: IDS.employeeCook,
            ...empCookBase,
        },
    });

};

const clean = async () => {
    await prisma.logs.deleteMany({
        where: { employee_id: { in: [IDS.employeeAdmin, IDS.employeeCoordinator, IDS.employeeCook] } },
    });
    await prisma.vacations_request.deleteMany({ 
        where: { employee_id: { in: [IDS.employeeAdmin, IDS.employeeCoordinator, IDS.employeeCook] } },
    });
    await prisma.employee.deleteMany({
        where: { employee_id: { in: [IDS.employeeAdmin, IDS.employeeCoordinator, IDS.employeeCook] } },
    });
    await prisma.house.deleteMany({ where: { house_id: IDS.house } });
};

describe("Flujo integración /vacation/request", () => {

    beforeAll(async () => {
        await clean();
        await seed();
    });

    afterAll(async () => {
        await clean();
        await prisma.$disconnect();
    });

    describe("PASO 1 - GET /vacation/remaining/", () => {
        let sessionToken;

        beforeAll(async () => {
            sessionToken = await sign(IDS.employeeCook, IDS.roleCook);
        });

        it("Empleado obtiene sus propias vacaciones", async () => {
            const res = await request(app)
                .get(`/vacation/remaining/${IDS.employeeCook}`)
                .set("Authorization", `Bearer ${sessionToken}`);

            console.log(`/vacation/remaining/${IDS.employee}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.startDate).toBe(
                new Date(Date.UTC("2026-01-01")),
            );
            expect(res.body.data.endDate).toBe(
                new Date(Date.UTC("2026-12-31")),
            );
        });
    });
});
