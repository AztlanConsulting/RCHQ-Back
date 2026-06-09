const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../../app");
const prisma = require("../../prisma");
const { LOG_ACTIONS } = require("../../utils/logActions");

const TEST_HOUSE_ID = randomUUID();
const TEST_OTHER_HOUSE_ID = randomUUID();
const TEST_COORDINATOR_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_ADMIN_ROLE_ID = randomUUID();
const TEST_MAINTENANCE_ROLE_ID = randomUUID();
const TEST_PRIVILEGE_ID = randomUUID();

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";
const API_ROUTE = "/employee/add";

let COORDINATOR_ROLE_ID = TEST_ROLE_ID;

const generateToken = (
    payloadOverrides = {},
    signOptions = { expiresIn: "1h" },
) => {
    const defaultPayload = {
        employeeId: TEST_COORDINATOR_ID,
        id: TEST_COORDINATOR_ID,
        role: "Coordinador",
        houseId: TEST_HOUSE_ID,
        tokenType: "SESSION",
        privileges: ["createEmployees"],
    };

    return jwt.sign(
        { ...defaultPayload, ...payloadOverrides },
        JWT_SECRET,
        signOptions,
    );
};

const buildValidEmployeeBody = (overrides = {}) => ({
    roleId: COORDINATOR_ROLE_ID,
    name: "Juan",
    surname: "Perez",
    email: `emp_${randomUUID().slice(0, 8)}@test.com`,
    curp: "PEPJ800101HDFRRN09",
    birthDate: "1990-01-01",
    startDate: "2020-01-01",
    ...overrides,
});

const getOrCreateRoleId = async (name, fallbackRoleId) => {
    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) return existing.role_id;

    const created = await prisma.role.create({
        data: { role_id: fallbackRoleId, name },
    });
    return created.role_id;
};

const getOrCreatePrivilegeId = async (name, fallbackPrivilegeId) => {
    const existing = await prisma.privileges.findUnique({ where: { name } });
    if (existing) return existing.privilege_id;

    const created = await prisma.privileges.create({
        data: { privilege_id: fallbackPrivilegeId, name },
    });
    return created.privilege_id;
};

const seedDependencies = async () => {
    COORDINATOR_ROLE_ID = await getOrCreateRoleId("Coordinador", TEST_ROLE_ID);
    const adminRoleId = await getOrCreateRoleId(
        "Administrador",
        TEST_ADMIN_ROLE_ID,
    );
    await getOrCreateRoleId("Mantenimiento", TEST_MAINTENANCE_ROLE_ID);

    const createEmployeesPrivilegeId = await getOrCreatePrivilegeId(
        "createEmployees",
        TEST_PRIVILEGE_ID,
    );

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: COORDINATOR_ROLE_ID,
                privilege_id: createEmployeesPrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: COORDINATOR_ROLE_ID,
            privilege_id: createEmployeesPrivilegeId,
        },
    });

    await prisma.role_privilege.upsert({
        where: {
            role_id_privilege_id: {
                role_id: adminRoleId,
                privilege_id: createEmployeesPrivilegeId,
            },
        },
        update: {},
        create: {
            role_id: adminRoleId,
            privilege_id: createEmployeesPrivilegeId,
        },
    });

    await prisma.action.upsert({
        where: { action_id: LOG_ACTIONS.EMPLOYEE_CREATED },
        update: {
            description: "Empleado creado con éxito",
            important: false,
        },
        create: {
            action_id: LOG_ACTIONS.EMPLOYEE_CREATED,
            description: "Empleado creado con éxito",
            important: false,
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_HOUSE_ID,
            name: "Casa Test Empleados 1",
            location: "Querétaro",
            phone_number: "4421234567",
            description: "Casa principal para tests",
            image: "test1.jpg",
        },
    });

    await prisma.house.create({
        data: {
            house_id: TEST_OTHER_HOUSE_ID,
            name: "Casa Test Empleados 2",
            location: "Querétaro",
            phone_number: "4429876543",
            description: "Casa secundaria para tests",
            image: "test2.jpg",
        },
    });

    await prisma.employee.create({
        data: {
            employee_id: TEST_COORDINATOR_ID,
            house_id: TEST_HOUSE_ID,
            role_id: COORDINATOR_ROLE_ID,
            name: "Coordinador",
            surname: "Test",
            email: `coord_${TEST_COORDINATOR_ID.slice(0, 8)}@test.com`,
            password: "123456",
            curp: "EHTC900101HDFRRS01",
            birth_date: new Date("1990-01-01"),
            start_date: new Date(),
            is_active: true,
            has_first_login: false,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
        },
    });
};

const cleanCreatedEmployees = async () => {
    await prisma.logs.deleteMany({
        where: { employee_id: TEST_COORDINATOR_ID },
    });
    await prisma.employee.deleteMany({
        where: {
            house_id: TEST_HOUSE_ID,
            employee_id: { not: TEST_COORDINATOR_ID },
        },
    });
};

const cleanDb = async () => {
    await cleanCreatedEmployees();
    await prisma.employee.deleteMany({
        where: { employee_id: TEST_COORDINATOR_ID },
    });
    await prisma.house.deleteMany({
        where: {
            house_id: { in: [TEST_HOUSE_ID, TEST_OTHER_HOUSE_ID] },
        },
    });
};

beforeAll(async () => {
    await cleanDb();
    await seedDependencies();
});

afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
});

beforeEach(async () => {
    await cleanCreatedEmployees();
});

describe(`POST ${API_ROUTE} - Integration & Security`, () => {
    describe("1. Comportamiento esperado", () => {
        it("crea un empleado exitosamente (201)", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
            expect(res.body.message).toBeDefined();
            expect(res.body.redirect).toContain("/app/personal/ver/");

            const employeeId = res.body.redirect.split("/").pop();
            const inDb = await prisma.employee.findUnique({
                where: { employee_id: employeeId },
            });
            expect(inDb).not.toBeNull();
            expect(inDb.house_id).toBe(TEST_HOUSE_ID);
        });

        it("admin puede crear un empleado (201)", async () => {
            const token = generateToken({ role: "Administrador" });
            const body = buildValidEmployeeBody();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
        });

        it("crea empleado sin campos opcionales (birthDate, rfc, nss, bankAccount)", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();
            delete body.birthDate;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
        });

        it("acepta nombre y apellido con acentos y ñ", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                name: "Ángel",
                surname: "Muñoz",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);
        });

        it("registra un log en BD al crear el empleado", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();

            const logsBefore = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const logsAfter = await prisma.logs.count({
                where: { employee_id: TEST_COORDINATOR_ID },
            });
            expect(logsAfter).toBeGreaterThan(logsBefore);
        });

        it("el houseId del token tiene precedencia (camelCase houseId en body es ignorado)", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                houseId: TEST_OTHER_HOUSE_ID,
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const employeeId = res.body.redirect.split("/").pop();
            const inDb = await prisma.employee.findUnique({
                where: { employee_id: employeeId },
            });
            expect(inDb.house_id).toBe(TEST_HOUSE_ID);
        });
    });

    describe("2. Fuzzing y Manipulación de Parámetros", () => {
        it("retorna 400 si el body está vacío", async () => {
            const token = generateToken();

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si falta name", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();
            delete body.name;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si falta email", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();
            delete body.email;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si falta curp", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();
            delete body.curp;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si falta roleId", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();
            delete body.roleId;

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("rechaza name con XSS", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                name: "<script>alert('xss')</script>",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("rechaza name con caracteres de SQL injection", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                name: "'; DROP TABLE employees;--",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el name excede 50 caracteres", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ name: "A".repeat(51) });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el name contiene números", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ name: "Juan123" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el email tiene formato inválido", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ email: "correo-invalido" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el email excede 60 caracteres", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                email: `${"a".repeat(55)}@mail.com`,
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si la CURP no tiene exactamente 18 caracteres", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ curp: "PEPJ800101" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si la CURP no pasa el formato del regex", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ curp: "123456789012345678" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si roleId no es un UUID válido", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ roleId: "no-es-uuid" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si la fecha de nacimiento tiene mes inválido (mes 13)", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ birthDate: "1990-13-01" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si la fecha de nacimiento es futura", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ birthDate: "2050-01-01" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el empleado es menor de 18 años", async () => {
            const today = new Date();
            const tenYearsAgo = `${today.getFullYear() - 10}-01-01`;
            const token = generateToken();
            const body = buildValidEmployeeBody({ birthDate: tenYearsAgo });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el NSS contiene letras", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ nss: "123ABC45678" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si la CLABE tiene longitud incorrecta", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ bankAccount: "12345" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("retorna 400 si el RFC tiene formato inválido", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ rfc: "123" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("rechaza payload con tipos incorrectos (name como objeto)", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                name: { malicious: "object" },
                email: ["array", "instead", "of", "string"],
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
        });

        it("ignora campos extra en el body (no los persiste)", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                hackerField: "owned",
                employee_id: "FAKE_ID_INJECTION",
                is_active: false,
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const employeeId = res.body.redirect.split("/").pop();
            expect(employeeId).not.toBe("FAKE_ID_INJECTION");

            const inDb = await prisma.employee.findUnique({
                where: { employee_id: employeeId },
            });
            expect(inDb.is_active).toBe(true);
        });

        it("retorna 400 con múltiples errores cuando hay varios campos inválidos", async () => {
            const token = generateToken();
            const body = {
                name: "123",
                surname: "!!!",
                email: "mal",
                curp: "123",
                roleId: "no-uuid",
            };

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(400);
            expect(res.body.errors).toBeDefined();
            expect(res.body.errors.length).toBeGreaterThan(1);
        });
    });

    describe("3. Lógica de negocio: Duplicados", () => {
        it("retorna 409 si ya existe un empleado con el mismo CURP", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();

            const res1 = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);
            expect(res1.statusCode).toBe(201);

            const res2 = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    ...body,
                    email: `otro_${randomUUID().slice(0, 8)}@test.com`,
                });

            expect(res2.statusCode).toBe(409);
            expect(res2.body.redirect).toContain("/app/personal/ver/");
        });

        it("el redirect en conflicto apunta al empleado existente", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();

            const res1 = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);
            const existingId = res1.body.redirect.split("/").pop();

            const res2 = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    ...body,
                    email: `otro2_${randomUUID().slice(0, 8)}@test.com`,
                });

            const conflictId = res2.body.redirect.split("/").pop();
            expect(conflictId).toBe(existingId);
        });

        it("no crea un duplicado cuando hay conflicto de CURP", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody();

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const countBefore = await prisma.employee.count({
                where: {
                    house_id: TEST_HOUSE_ID,
                    employee_id: { not: TEST_COORDINATOR_ID },
                },
            });

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    ...body,
                    email: `otro3_${randomUUID().slice(0, 8)}@test.com`,
                });

            const countAfter = await prisma.employee.count({
                where: {
                    house_id: TEST_HOUSE_ID,
                    employee_id: { not: TEST_COORDINATOR_ID },
                },
            });

            expect(countAfter).toBe(countBefore);
        });
    });

    describe("4. Seguridad: Autenticación y Autorización", () => {
        it("retorna 401 si no se envía token", async () => {
            const res = await request(app)
                .post(API_ROUTE)
                .send(buildValidEmployeeBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está manipulado o mal formado", async () => {
            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", "Bearer token_falso_para_hackear.123")
                .send(buildValidEmployeeBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está expirado", async () => {
            const expiredToken = generateToken({}, { expiresIn: "-1s" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${expiredToken}`)
                .send(buildValidEmployeeBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 401 si el token está firmado con secret incorrecto", async () => {
            const fakeToken = jwt.sign(
                {
                    employeeId: TEST_COORDINATOR_ID,
                    id: TEST_COORDINATOR_ID,
                    role: "Coordinador",
                    houseId: TEST_HOUSE_ID,
                    tokenType: "SESSION",
                    privileges: ["createEmployees"],
                },
                "secret_incorrecto",
                { expiresIn: "1h" },
            );

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${fakeToken}`)
                .send(buildValidEmployeeBody());

            expect(res.statusCode).toBe(401);
        });

        it("retorna 403 si el rol del usuario no está autorizado (Mantenimiento)", async () => {
            const token = generateToken({ role: "Mantenimiento" });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEmployeeBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene el privilegio createEmployees", async () => {
            const token = generateToken({ privileges: ["viewEmployees"] });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEmployeeBody());

            expect(res.statusCode).toBe(403);
        });

        it("retorna 403 si el usuario no tiene privilegios definidos", async () => {
            const token = generateToken({ privileges: [] });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(buildValidEmployeeBody());

            expect(res.statusCode).toBe(403);
        });

        it("coordinador no puede crear para otra casa (via house_id snake_case en body)", async () => {
            const token = generateToken();
            const body = {
                ...buildValidEmployeeBody(),
                house_id: TEST_OTHER_HOUSE_ID,
            };

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(403);
        });
    });

    describe("5. Integridad de datos", () => {
        it("no crea el empleado si falla la validación", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({ name: "" });

            await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            const count = await prisma.employee.count({
                where: {
                    house_id: TEST_HOUSE_ID,
                    employee_id: { not: TEST_COORDINATOR_ID },
                },
            });
            expect(count).toBe(0);
        });

        it("persiste los datos correctamente en BD", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                name: "María",
                surname: "González",
                birthDate: "1985-06-15",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const employeeId = res.body.redirect.split("/").pop();
            const inDb = await prisma.employee.findUnique({
                where: { employee_id: employeeId },
            });

            expect(inDb.name).toBe("María");
            expect(inDb.surname).toBe("González");
            expect(inDb.curp).toBe("PEPJ800101HDFRRN09");
            expect(inDb.house_id).toBe(TEST_HOUSE_ID);
            expect(inDb.role_id).toBe(COORDINATOR_ROLE_ID);
            expect(inDb.is_active).toBe(true);
        });

        it("el email se normaliza a minúsculas antes de persistir", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                email: "JUAN.PEREZ@MAIL.COM",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const employeeId = res.body.redirect.split("/").pop();
            const inDb = await prisma.employee.findUnique({
                where: { employee_id: employeeId },
            });
            expect(inDb.email).toBe("juan.perez@mail.com");
        });

        it("la CURP se normaliza a mayúsculas antes de persistir", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                curp: "pepj800101hdfrrn09",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const employeeId = res.body.redirect.split("/").pop();
            const inDb = await prisma.employee.findUnique({
                where: { employee_id: employeeId },
            });
            expect(inDb.curp).toBe("PEPJ800101HDFRRN09");
        });

        it("aplica trim al nombre y email con espacios extra", async () => {
            const token = generateToken();
            const body = buildValidEmployeeBody({
                name: "  Juan  ",
                email: "  trim_test@mail.com  ",
            });

            const res = await request(app)
                .post(API_ROUTE)
                .set("Authorization", `Bearer ${token}`)
                .send(body);

            expect(res.statusCode).toBe(201);

            const employeeId = res.body.redirect.split("/").pop();
            const inDb = await prisma.employee.findUnique({
                where: { employee_id: employeeId },
            });
            expect(inDb.name).toBe("Juan");
            expect(inDb.email).toBe("trim_test@mail.com");
        });
    });

    describe.skip("6. Resiliencia: Rate Limiting", () => {
        it("bloquea con 429 si un usuario autenticado lanza muchas peticiones", async () => {
            const token = generateToken();
            const statuses = [];

            for (let i = 0; i < 120; i++) {
                const res = await request(app)
                    .post(API_ROUTE)
                    .set("Authorization", `Bearer ${token}`)
                    .send(buildValidEmployeeBody());
                statuses.push(res.statusCode);

                if (res.statusCode === 429) break;
            }

            expect(statuses.includes(429)).toBe(true);
        });

        it("bloquea con 429 por IP cuando hay peticiones anónimas masivas", async () => {
            const statuses = [];

            for (let i = 0; i < 120; i++) {
                const res = await request(app)
                    .post(API_ROUTE)
                    .send(buildValidEmployeeBody());
                statuses.push(res.statusCode);

                if (res.statusCode === 429) break;
            }

            expect(statuses.includes(429)).toBe(true);
        });
    });
});
