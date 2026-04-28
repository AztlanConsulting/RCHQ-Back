// tests/integration/employeeGetAll.integration.test.js
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const app = require("../../app");

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL },
  },
});

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
const TEST_ADMIN_ID = randomUUID();
let TEST_ROLE_ID;

const API_ROUTE = "/employee/getAll";

// ─── Helpers ──────────────────────────────────────────────
const generateToken = () => {
    return jwt.sign(
        {
            id: TEST_ADMIN_ID,
            role: "Administrador",
            houseId: TEST_HOUSE_ID,
            tokenType: "SESSION",
        },
        process.env.JWT_SECRET || "test_secret",
        { expiresIn: "1h" },
    );
};

const seedDependencies = async () => {
    let role = await prisma.role.findUnique({
        where: { name: "Administrador" },
    });

    if (!role) {
        role = await prisma.role.create({
            data: {
                role_id: randomUUID(),
                name: "Administrador",
            },
        });
    }

    TEST_ROLE_ID = role.role_id;

    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Test",
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa usada solo para tests de integración",
            image: "test.jpg",
        },
    });

    for (let i = 1; i <= 15; i++) {
        await prisma.employee.create({
            data: {
                employee_id: randomUUID(),
                house_id: TEST_HOUSE_ID,
                role_id: TEST_ROLE_ID,
                name: `Juan${i}`,
                surname: "Perez",
                email: `juan${i}@test.com`,
                password: "123456",
                curp: `TEST900101HDFRR${String(i).padStart(2, "0")}`,
                birth_date: new Date("1990-01-01"),
                start_date: new Date(),
                is_active: i <= 10,
                has_first_login: false,
                is_active_2fa: false,
                failed_login_attempts: 0,
            },
        });
    }
};

const cleanDb = async () => {
    await prisma.employee.deleteMany({
        where: { house_id: TEST_HOUSE_ID },
    });

    await prisma.house.deleteMany({
        where: { house_id: TEST_HOUSE_ID },
    });
};

// ─── Hooks ────────────────────────────────────────────────
beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

describe(`GET ${API_ROUTE} - integration`, () => {
    it("retorna empleados activos por default", async () => {
        // Arrange
        const token = generateToken();

        // Act
        const res = await request(app)
            .get(API_ROUTE)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(6);
    });

    it("retorna empleados inactivos", async () => {
        // Arrange
        const token = generateToken();

        // Act
        const res = await request(app)
            .get(`${API_ROUTE}?active=false`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(5);
    });

    it("retorna paginación personalizada", async () => {
        // Arrange
        const token = generateToken();

        // Act
        const res = await request(app)
            .get(`${API_ROUTE}?page=2&limit=3`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(200);
        expect(res.body.pagination.page).toBe(2);
        expect(res.body.pagination.limit).toBe(3);
        expect(res.body.data.length).toBe(3);
    });

    it("busca empleados por nombre", async () => {
        // Arrange
        const token = generateToken();

        // Act
        const res = await request(app)
            .get(`${API_ROUTE}?search=Juan1`)
            .set("Authorization", `Bearer ${token}`);

        // Assert
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("retorna 401 si no se envía token", async () => {
        // Arrange

        // Act
        const res = await request(app).get(API_ROUTE);

        // Assert
        expect(res.statusCode).toBe(401);
    });
});
