// tests/integration/employee.getDetail.test.js
const request = require("supertest");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const app = require("../../../app");
const {
    prisma,
    seedDb,
    cleanDb,
    disconnectDb,
    IDS,
    SEED,
} = require("../../helpers/dbSetup");

// ─── Constantes del empleado sujeto ───────────────────────────────────────────
const TEST_SUBJECT_EMPLOYEE_ID = randomUUID();
const TEST_WORKDAY_ID = randomUUID();
const TEST_FAULT_ID = randomUUID();
const TEST_VACATION_REQ_ID = randomUUID();
const TEST_EMP_ADDRESS_ID = randomUUID();

const TEST_SUBJECT_EMAIL = "integration.subject.detail@test.com";
const TEST_CURP_SUBJECT = "GETDT123456SUBXX02";

// ─── JWT con rol admin (requireRole mira el payload, no la BD) ────────────────
const generateAdminSessionToken = () =>
  jwt.sign(
    {
      id: IDS.employee,
      email: SEED.employee.email,
      name: "Administrador Test",
      role: "Administrador",
      privileges: ["viewEmployees", "createEmployees", "manageEmployees"],
      tokenType: "SESSION",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

// ─── Seed del empleado sujeto con sus relaciones ──────────────────────────────
const seedSubjectEmployeeWithRelations = async () => {
    await prisma.employee.create({
        data: {
            employee_id: TEST_SUBJECT_EMPLOYEE_ID,
            house_id: IDS.house,
            role_id: IDS.role,
            email: TEST_SUBJECT_EMAIL,
            password: "hashed-placeholder",
            name: "Subject",
            surname: "Employee",
            type: "internal",
            curp: TEST_CURP_SUBJECT,
            start_date: new Date("2026-03-15"),
            has_first_login: true,
            is_active: true,
            is_active_two_factor_auth: false,
            failed_login_attempts: 0,
            failed_two_factor_auth_attempts: 0,
            salary: "long-encrypted-salary-value",
        },
    });

    await prisma.employee_address.create({
        data: {
            employee_address_id: TEST_EMP_ADDRESS_ID,
            employee_id: TEST_SUBJECT_EMPLOYEE_ID,
            url: "https://maps.example/addr",
            street: "Calle 1",
            municipio: "Muni",
            city: "CDMX",
            postal_code: "01000",
            date: new Date("2026-04-01T12:00:00.000Z"),
        },
    });

    // workday.name is @unique with max 9 chars
    const workdayName = `W${TEST_WORKDAY_ID.replace(/-/g, "").slice(0, 8)}`;
    await prisma.workday.create({
        data: { workday_id: TEST_WORKDAY_ID, name: workdayName },
    });
    await prisma.employee_workday.create({
        data: {
            workday_id: TEST_WORKDAY_ID,
            employee_id: TEST_SUBJECT_EMPLOYEE_ID,
            start: new Date("1970-01-01T14:00:00.000Z"),
            end: new Date("1970-01-01T22:00:00.000Z"),
        },
    });

    await prisma.fault.create({
        data: {
            fault_id: TEST_FAULT_ID,
            date: new Date("2026-05-10"),
            description: "Falta de prueba (integration)",
        },
    });
    await prisma.employee_fault.create({
        data: {
            fault_id: TEST_FAULT_ID,
            employee_id: TEST_SUBJECT_EMPLOYEE_ID,
        },
    });

  await prisma.vacations_request.create({
    data: {
      vacations_request_id: TEST_VACATION_REQ_ID,
      employee_id: TEST_SUBJECT_EMPLOYEE_ID,
      start: new Date("2026-12-01"),
      end: new Date("2026-12-15"),
      status: 1,
      feedback: "ok",
      created_at: new Date(),
      used_days: 3
    },
  });
};

// ─── Cleanup del empleado sujeto (hijos primero) ──────────────────────────────
const cleanSubjectGraph = async () => {
    await prisma.vacations_request.deleteMany({
        where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
    });
    await prisma.employee_address.deleteMany({
        where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
    });
    await prisma.employee_workday.deleteMany({
        where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
    });
    await prisma.employee_fault.deleteMany({
        where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
    });
    await prisma.employee.deleteMany({
        where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
    });
    await prisma.fault.deleteMany({ where: { fault_id: TEST_FAULT_ID } });
    await prisma.workday.deleteMany({ where: { workday_id: TEST_WORKDAY_ID } });
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
    await cleanSubjectGraph();
    await seedDb();
});
afterEach(async () => {
    await cleanSubjectGraph();
});
afterAll(async () => {
    await cleanSubjectGraph();
    await cleanDb();
    await disconnectDb();
});

// ─── GET /employee/employee-detail/:employeeID ────────────────────────────────
describe("GET /employee/employee-detail/:employeeID - integration", () => {
    const authHeader = () => ({
        Authorization: `Bearer ${generateAdminSessionToken()}`,
    });

    it("retorna 401 sin token de sesión", async () => {
        const res = await request(app).get(
            `/employee/employee-detail/${TEST_SUBJECT_EMPLOYEE_ID}`,
        );
        expect(res.statusCode).toBe(401);
    });

    it("retorna 404 si el empleado no existe (sin crear filas con ese id)", async () => {
        const unknownId = randomUUID();
        const res = await request(app)
            .get(`/employee/employee-detail/${unknownId}`)
            .set(authHeader());
        expect(res.statusCode).toBe(404);
    });

    it("retorna 200 con basicInfo, address, house y adminInfo", async () => {
        await seedSubjectEmployeeWithRelations();

        const res = await request(app)
            .get(`/employee/employee-detail/${TEST_SUBJECT_EMPLOYEE_ID}`)
            .set(authHeader());

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.employee).toBeDefined();
        const { basicInfo, adminInfo } = res.body.data.employee;
        expect(basicInfo.employee).toMatchObject({ email: TEST_SUBJECT_EMAIL });
        expect(basicInfo.address).toMatchObject({ street: "Calle 1" });
        expect(basicInfo.house).toMatchObject({ name: expect.any(String) });
        expect(adminInfo).toMatchObject({
            workdays: [expect.objectContaining({ name: expect.any(String) })],
            vacationRequests: [
                expect.objectContaining({ status: 1, feedback: "ok" }),
            ],
        });
    });
});
