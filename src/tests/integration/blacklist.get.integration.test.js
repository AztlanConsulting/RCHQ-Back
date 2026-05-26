const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = require("../../app");
const { ROLES } = require("../../utils/roles");
const PRIVILEGES = require("../../utils/privileges");

const prisma = new PrismaClient();

const TEST_HOUSE_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b3c";
const TEST_HOUSE_2_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b50";
const TEST_COORDINADOR_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b3d";
const TEST_NORMAL_EMP_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b3e";
const TEST_BLACKLIST_EMP_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b42";
const TEST_OTHER_HOUSE_EMP_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b51";
const TEST_COORDINADOR_ROLE_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b3f";
const TEST_TARGET_ROLE_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b40";
const TEST_PRIVILEGE_ID = "c0a1b2c3-d4e5-4f6a-8b7c-8d9e0f1a2b41";

const TEST_PASSWORD = "TestPass123";
const TEST_COORDINADOR_EMAIL = "coordinador.get@test.com";
const TEST_NORMAL_CURP = "NORM900101HDFXXX01";
const TEST_BLACKLIST_CURP = "BLCK900101HDFXXX02";
const TEST_OTHER_CURP = "OTRO900101HDFXXX03";

let testCoordinadorRoleId;
let testTargetRoleId;
let testPrivilegeId;

const seedDependencies = async () => {
    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Prueba GET Blacklist IT",
            location: "Test Location",
            phone_number: "4421234567",
            description: "Casa usada solo para tests de GET blacklist",
            image: "test-image.jpg",
        },
    });

    await prisma.house.upsert({
        where: { house_id: TEST_HOUSE_2_ID },
        update: {},
        create: {
            house_id: TEST_HOUSE_2_ID,
            name: "Casa Externa GET Blacklist",
            location: "Otro lugar",
            phone_number: "4429999999",
            description: "Casa para testear ABAC",
            image: "otra.jpg",
        },
    });

    const coordRole = await prisma.role.upsert({
        where: { name: ROLES.COORDINATOR },
        update: {},
        create: {
            role_id: TEST_COORDINADOR_ROLE_ID,
            name: ROLES.COORDINATOR,
        },
    });
    testCoordinadorRoleId = coordRole.role_id;

    const targetRole = await prisma.role.upsert({
        where: { name: "test-role-blacklist-get" },
        update: {},
        create: {
            role_id: TEST_TARGET_ROLE_ID,
            name: "test-role-blacklist-get",
        },
    });
    testTargetRoleId = targetRole.role_id;

    const priv = await prisma.privileges.upsert({
        where: { name: PRIVILEGES.VIEW_BLACKLIST },
        update: {},
        create: {
            privilege_id: TEST_PRIVILEGE_ID,
            name: PRIVILEGES.VIEW_BLACKLIST,
        },
    });
    testPrivilegeId = priv.privilege_id;

    await prisma.role_privilege.upsert({
        where: { role_id_privilege_id: { role_id: testCoordinadorRoleId, privilege_id: testPrivilegeId } },
        update: {},
        create: { role_id: testCoordinadorRoleId, privilege_id: testPrivilegeId },
    });
};

const createCoordinador = async () => {
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    return prisma.employee.create({
        data: {
            employee_id: TEST_COORDINADOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: testCoordinadorRoleId,
            name: "Coordinador",
            surname: "Prueba GET",
            email: TEST_COORDINADOR_EMAIL,
            password: hashedPassword,
            curp: "COOR900101HDFGET01",
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

const createTargetEmployees = async () => {
    await prisma.employee.create({
        data: {
            employee_id: TEST_NORMAL_EMP_ID,
            house_id: TEST_HOUSE_ID,
            role_id: testTargetRoleId,
            name: "Luis",
            surname: "Martínez",
            email: "normal@test.com",
            password: "hashed",
            curp: TEST_NORMAL_CURP,
            start_date: new Date("2024-01-01"),
            has_first_login: false,
            is_active: true,
            type: "nomina",
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_BLACKLIST_EMP_ID,
            house_id: TEST_HOUSE_ID,
            role_id: testTargetRoleId,
            name: "María",
            surname: "González",
            email: "blacklist@test.com",
            password: "hashed",
            curp: TEST_BLACKLIST_CURP,
            start_date: new Date("2024-01-01"),
            has_first_login: false,
            is_active: false,
            type: "nomina",
        },
    });

    await prisma.blacklist.create({
        data: {
            curp: TEST_BLACKLIST_CURP,
            reason: "Motivo de prueba IT",
        }
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_OTHER_HOUSE_EMP_ID,
            house_id: TEST_HOUSE_2_ID,
            role_id: testTargetRoleId,
            name: "Externo",
            surname: "Gómez",
            email: "externo@test.com",
            password: "hashed",
            curp: TEST_OTHER_CURP,
            start_date: new Date("2024-01-01"),
            has_first_login: false,
            is_active: true,
            type: "nomina",
        },
    });
};

const generateSessionToken = (overrides = {}) => {
    return jwt.sign(
        {
            id: TEST_COORDINADOR_ID,
            email: TEST_COORDINADOR_EMAIL,
            name: "Coordinador Prueba",
            role: ROLES.COORDINATOR,
            houseId: TEST_HOUSE_ID,
            privileges: [PRIVILEGES.VIEW_BLACKLIST],
            tokenType: "SESSION",
            ...overrides,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
    );
};

const cleanDb = async () => {
    await prisma.blacklist.deleteMany({ where: { curp: { in: [TEST_NORMAL_CURP, TEST_BLACKLIST_CURP, TEST_OTHER_CURP] } } });
    await prisma.employee.deleteMany({
        where: { employee_id: { in: [TEST_COORDINADOR_ID, TEST_NORMAL_EMP_ID, TEST_BLACKLIST_EMP_ID, TEST_OTHER_HOUSE_EMP_ID] } },
    });
};

beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

beforeEach(async () => {
    await cleanDb();
    await createCoordinador();
    await createTargetEmployees();
});

afterAll(async () => {
    await cleanDb();
    await prisma.role.deleteMany({
        where: {
            role_id: testTargetRoleId,
        },
    });
    await prisma.house.deleteMany({ where: { house_id: { in: [TEST_HOUSE_ID, TEST_HOUSE_2_ID] } } });
    await prisma.$disconnect();
});

describe("GET /blacklist - integración", () => {
    it("retorna 200 y filtra correctamente para que el Coordinador SOLO vea a los empleados de su propia casa", async () => {
        const token = generateSessionToken();

        const res = await request(app)
            .get("/blacklist?page=1&limit=10")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.employees.length).toBe(3);
        expect(res.body.employees.some(emp => emp.curp === TEST_OTHER_CURP)).toBe(false);
    });

    it("retorna 200 y permite al Administrador ver a los empleados de TODAS las casas", async () => {
        const token = generateSessionToken({ role: ROLES.ADMIN });

        const res = await request(app)
            .get("/blacklist?page=1&limit=10")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.employees.length).toBe(4);
        expect(res.body.employees.some(emp => emp.curp === TEST_OTHER_CURP)).toBe(true);
    });

    it("retorna 200 con lista vacía cuando los filtros no encuentran resultados", async () => {
        const token = generateSessionToken();

        const res = await request(app)
            .get("/blacklist?page=1&limit=10&curp=ZZZ999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("No hay personas en la lista negra con los filtros aplicados");
        expect(res.body.employees).toEqual([]);
        expect(res.body.pagination).toEqual({
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
        });
    });

    it("retorna 200 y filtra correctamente solo a los que ESTÁN en la lista negra (isBlacklisted=true)", async () => {
        const token = generateSessionToken();

        const res = await request(app)
            .get("/blacklist?isBlacklisted=true")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.employees.every(emp => emp.isBlacklisted === true)).toBe(true);
        expect(res.body.employees.some(emp => emp.curp === TEST_BLACKLIST_CURP)).toBe(true);
    });

    it("retorna 200 y filtra correctamente por coincidencia parcial de CURP", async () => {
        const token = generateSessionToken();

        const res = await request(app)
            .get("/blacklist?curp=NORM90")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.employees.length).toBe(1);
        expect(res.body.employees[0].curp).toBe(TEST_NORMAL_CURP);
    });

    it("retorna 200 y encuentra empleados por nombre sin acentos", async () => {
        const token = generateSessionToken();

        const res = await request(app)
            .get("/blacklist?search=luis martinez")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.employees.length).toBe(1);
        expect(res.body.employees[0].fullName).toBe("Luis Martínez");
    });

    it("retorna 200 y encuentra empleados blacklisted por apellido sin acentos", async () => {
        const token = generateSessionToken();

        const res = await request(app)
            .get("/blacklist?isBlacklisted=true&search=maria gonzalez")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.employees.length).toBe(1);
        expect(res.body.employees[0].fullName).toBe("María González");
        expect(res.body.employees[0].isBlacklisted).toBe(true);
    });

    it("retorna 200 con lista vacía si la búsqueda no coincide con ningún empleado", async () => {
        const token = generateSessionToken();

        const res = await request(app)
            .get("/blacklist?curp=NOEXISTE99")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.employees).toEqual([]);
    });

    it("retorna 400 si los parámetros de paginación o booleanos son inválidos (Zod Schema)", async () => {
        const token = generateSessionToken();

        const res = await request(app)
            .get("/blacklist?page=-5&isBlacklisted=talvez")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
    });

    it("retorna 403 si el rol del usuario no tiene los privilegios adecuados", async () => {
        const token = generateSessionToken({ privileges: [] });

        const res = await request(app)
            .get("/blacklist")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toBe(403);
    });

    it("retorna 401 si se intenta consultar sin enviar el token de sesión", async () => {
        const res = await request(app).get("/blacklist");

        expect(res.statusCode).toBe(401);
    });
});
