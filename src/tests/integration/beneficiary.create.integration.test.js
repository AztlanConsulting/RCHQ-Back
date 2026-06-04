const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const app = require("../../app");
const { ROLES } = require("../../utils/roles");
const PRIVILEGES = require("../../utils/privileges");

const prisma = new PrismaClient();

const TEST_HOUSE_A = "b0520001-0000-4000-8000-000000000001";
const TEST_HOUSE_B = "b0520001-0000-4000-8000-000000000002";
const TEST_COORD_A_ID = "b0520001-0000-4000-8000-000000000011";
const TEST_COORD_B_ID = "b0520001-0000-4000-8000-000000000012";
const TEST_PRIVILEGE_ID = "b0520001-0000-4000-8000-000000000021";
const TEST_PASSWORD = "TestPass123";
const TEST_COORD_A_EMAIL = "coord.a.beneficiary@test.com";
const TEST_COORD_B_EMAIL = "coord.b.beneficiary@test.com";
const TEST_COORD_A_CURP = "COAA900101HDFXXX01";
const TEST_COORD_B_CURP = "COBB900101HDFXXX02";
const TEST_CHILD_CURP = "GALJ150310HDFRZN09";

let coordinatorRoleId;
let privilegeId;

const basePayload = () => ({
    name: "Juan Manuel",
    maternal_surname: "Lopez",
    paternal_surname: "Garcia",
    preferred_name: "Juanito",
    birth_date: "2015-03-10",
    age_entered_house: 8,
    blood_type: "O+",
});

const seedDependencies = async () => {
    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_A },
        update: {},
        create: {
            house_id: TEST_HOUSE_A,
            name: "Casa Beneficiary IT A",
            location: "Test",
            phone_number: "4421111111",
            description: "Integration tests beneficiary A",
            image: "test.jpg",
        },
    });

    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_B },
        update: {},
        create: {
            house_id: TEST_HOUSE_B,
            name: "Casa Beneficiary IT B",
            location: "Test",
            phone_number: "4422222222",
            description: "Integration tests beneficiary B",
            image: "test.jpg",
        },
    });

    const role = await prisma.role.upsert({
        where: { name: ROLES.COORDINATOR },
        update: {},
        create: {
            role_id: "b0520001-0000-4000-8000-000000000031",
            name: ROLES.COORDINATOR,
        },
    });
    coordinatorRoleId = role.role_id;

    const privilege = await prisma.privileges.upsert({
        where: { name: PRIVILEGES.CREATE_BENEFICIARY },
        update: {},
        create: {
            privilege_id: TEST_PRIVILEGE_ID,
            name: PRIVILEGES.CREATE_BENEFICIARY,
        },
    });
    privilegeId = privilege.privilege_id;

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: coordinatorRoleId,
                privilege_id: privilegeId,
            },
        },
        update: {},
        create: {
            role_id: coordinatorRoleId,
            privilege_id: privilegeId,
        },
    });
};

const createCoordinator = async ({
    employeeId,
    houseId,
    email,
    curp,
    name,
    surname,
}) => {
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    return prisma.employee.create({
        data: {
            employee_id: employeeId,
            house_id: houseId,
            role_id: coordinatorRoleId,
            name,
            surname,
            email,
            password: hashedPassword,
            curp,
            start_date: new Date("2024-01-01"),
            has_first_login: false,
            is_active: true,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            type: "nomina",
        },
    });
};

const loginAndGetToken = async (email) => {
    const res = await request(app)
        .post("/auth/login")
        .send({ email, password: TEST_PASSWORD });
    return res.body.data.token;
};

const cleanDb = async () => {
    await prisma.beneficiary.deleteMany({
        where: {
            OR: [
                { house_id: TEST_HOUSE_A },
                { house_id: TEST_HOUSE_B },
                { curp: TEST_CHILD_CURP },
            ],
        },
    });
    await prisma.employee.deleteMany({
        where: {
            employee_id: { in: [TEST_COORD_A_ID, TEST_COORD_B_ID] },
        },
    });
};

beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

beforeEach(async () => {
    await cleanDb();
    await createCoordinator({
        employeeId: TEST_COORD_A_ID,
        houseId: TEST_HOUSE_A,
        email: TEST_COORD_A_EMAIL,
        curp: TEST_COORD_A_CURP,
        name: "Coord",
        surname: "CasaA",
    });
    await createCoordinator({
        employeeId: TEST_COORD_B_ID,
        houseId: TEST_HOUSE_B,
        email: TEST_COORD_B_EMAIL,
        curp: TEST_COORD_B_CURP,
        name: "Maria",
        surname: "CasaB",
    });
});

afterAll(async () => {
    await cleanDb();
    await prisma.house.deleteMany({
        where: { house_id: { in: [TEST_HOUSE_A, TEST_HOUSE_B] } },
    });
    await prisma.$disconnect();
});

describe("POST /beneficiary/add - integración", () => {
    it("retorna 201 y crea el beneficiario en la casa del coordinador", async () => {
        const token = await loginAndGetToken(TEST_COORD_A_EMAIL);

        const res = await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${token}`)
            .send(basePayload());

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.beneficiaryId).toBeDefined();
        expect(res.body.redirect).toContain(res.body.data.beneficiaryId);

        const row = await prisma.beneficiary.findUnique({
            where: { beneficiary_id: res.body.data.beneficiaryId },
        });
        expect(row).not.toBeNull();
        expect(row.house_id).toBe(TEST_HOUSE_A);
        expect(row.name).toBe("Juan Manuel");
        expect(row.last_record_update).toBeNull();
    });

    it("retorna 201 registrando con CURP", async () => {
        const token = await loginAndGetToken(TEST_COORD_A_EMAIL);

        const res = await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${token}`)
            .send({ ...basePayload(), curp: TEST_CHILD_CURP });

        expect(res.statusCode).toBe(201);
        const row = await prisma.beneficiary.findUnique({
            where: { curp: TEST_CHILD_CURP },
        });
        expect(row?.house_id).toBe(TEST_HOUSE_A);
    });

    it("retorna 400 si el body no pasa la validación del middleware", async () => {
        const token = await loginAndGetToken(TEST_COORD_A_EMAIL);

        const res = await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "SoloNombre" });

        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("retorna 401 sin token", async () => {
        const res = await request(app)
            .post("/beneficiary/add")
            .send(basePayload());

        expect(res.statusCode).toBe(401);
    });

    it("retorna 406 si el beneficiario ya existe en la misma casa", async () => {
        const token = await loginAndGetToken(TEST_COORD_A_EMAIL);

        await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${token}`)
            .send(basePayload());

        const res = await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${token}`)
            .send(basePayload());

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
    });

    it("retorna 406 con datos de la otra casa si ya existe en la red", async () => {
        const tokenB = await loginAndGetToken(TEST_COORD_B_EMAIL);
        await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${tokenB}`)
            .send(basePayload());

        const tokenA = await loginAndGetToken(TEST_COORD_A_EMAIL);
        const res = await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${tokenA}`)
            .send(basePayload());

        expect(res.statusCode).toBe(406);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Casa Beneficiary IT B");
        expect(res.body.message).toContain("Maria CasaB");
        expect(res.body.data.coordinator.email).toBe(TEST_COORD_B_EMAIL);
    });

    it("detecta duplicado por CURP en otra casa", async () => {
        const tokenB = await loginAndGetToken(TEST_COORD_B_EMAIL);
        await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ ...basePayload(), curp: TEST_CHILD_CURP });

        const tokenA = await loginAndGetToken(TEST_COORD_A_EMAIL);
        const res = await request(app)
            .post("/beneficiary/add")
            .set("Authorization", `Bearer ${tokenA}`)
            .send({ ...basePayload(), curp: TEST_CHILD_CURP });

        expect(res.statusCode).toBe(406);
        expect(res.body.data.house.name).toBe("Casa Beneficiary IT B");
    });
});
