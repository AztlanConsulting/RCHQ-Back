// tests/integration/personnel.integration.test.js
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const app = require("../../app");

const prisma = new PrismaClient();

// ─── Constantes de prueba (IDs fijos en esta corrida) ─────
const TEST_HOUSE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_ADMIN_EMPLOYEE_ID = randomUUID();
const TEST_SUBJECT_EMPLOYEE_ID = randomUUID();

const TEST_WORKDAY_ID = randomUUID();
const TEST_FAULT_ID = randomUUID();
const TEST_DOCUMENTS_ID = randomUUID();
const TEST_INSIDE_CERT_ID = randomUUID();
const TEST_OUTSIDE_CERT_ID = randomUUID();
const TEST_PSYCH_EVAL_ID = randomUUID();
const TEST_VACATION_REQ_ID = randomUUID();
const TEST_EMP_ADDRESS_ID = randomUUID();
const LOG_ACTION_READ_DETAIL = "pers-001";

const TEST_ADMIN_EMAIL = "integration.admin@test.com";
const TEST_SUBJECT_EMAIL = "integration.subject@test.com";
const TEST_PASSWORD = "TestPass123";
const TEST_CURP_ADMIN = "TEST123456ADMXXX01";
const TEST_CURP_SUBJECT = "TEST123456SUBXXX02";

// ─── JWT con rol admin (requireRole mira el payload, no la BD) ─────
const generateAdminSessionToken = () =>
  jwt.sign(
    {
      id: TEST_ADMIN_EMPLOYEE_ID,
      email: TEST_ADMIN_EMAIL,
      name: "Admin Test",
      role: "admin",
      privileges: [],
      tokenType: "SESSION",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );

// ─── Seed base: casa, rol, acción de log, empleado que llama al endpoint ─────
const seedDependencies = async () => {
  await prisma.house.upsert({
    where: { house_id: TEST_HOUSE_ID },
    update: {},
    create: {
      house_id: TEST_HOUSE_ID,
      name: "Casa personnel IT",
      location: "Test Location",
      phone_number: "4421234567",
      description: "Casa usada solo para tests de integración",
      image: "test-image.jpg",
    },
  });
  // role.name is @unique — must not collide with auth.integration.test.js
  await prisma.role.upsert({
    where: { role_id: TEST_ROLE_ID },
    update: {},
    create: {
      role_id: TEST_ROLE_ID,
      name: "test-role-personnel-it",
    },
  });
  await prisma.action.upsert({
    where: { action_id: LOG_ACTION_READ_DETAIL },
    update: {},
    create: {
      action_id: LOG_ACTION_READ_DETAIL,
      description: "read employee detail (integration test)",
      important: false,
    },
  });

  const hashedPwd = await bcrypt.hash(TEST_PASSWORD, 10);
  await prisma.employee.upsert({
    where: { employee_id: TEST_ADMIN_EMPLOYEE_ID },
    update: {},
    create: {
      employee_id: TEST_ADMIN_EMPLOYEE_ID,
      house_id: TEST_HOUSE_ID,
      role_id: TEST_ROLE_ID,
      email: TEST_ADMIN_EMAIL,
      password: hashedPwd,
      name: "Admin",
      surname: "Integration",
      type: "internal",
      curp: TEST_CURP_ADMIN,
      start_date: new Date("2024-01-01"),
      has_first_login: true,
      is_active: true,
      is_active_2fa: false,
      failed_login_attempts: 0,
      salary: "R8/gGMPXlSOGu3uAgxgrnEqIWwHHzHSm2l/vDjLF5ol9",
    },
  });
};

// Todo lo que toca getEmployeeDetail: adminInfo + record (personnel.model)
const seedSubjectEmployeeWithRelations = async () => {
  const hashedPwd = await bcrypt.hash(TEST_PASSWORD, 10);

  await prisma.employee.create({
    data: {
      employee_id: TEST_SUBJECT_EMPLOYEE_ID,
      house_id: TEST_HOUSE_ID,
      role_id: TEST_ROLE_ID,
      email: TEST_SUBJECT_EMAIL,
      password: hashedPwd,
      name: "Subject",
      surname: "Employee",
      type: "internal",
      curp: TEST_CURP_SUBJECT,
      start_date: new Date("2024-03-15"),
      has_first_login: true,
      is_active: true,
      is_active_2fa: false,
      failed_login_attempts: 0,
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
      date: new Date("2024-04-01T12:00:00.000Z"),
    },
  });

  // workday.name: unique, max 9 characters
  const workdayName = `W${TEST_WORKDAY_ID.replace(/-/g, "").slice(0, 8)}`;
  await prisma.workday.create({
    data: {
      workday_id: TEST_WORKDAY_ID,
      name: workdayName,
    },
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
      date: new Date("2024-05-10"),
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
      start: new Date("2024-12-01"),
      end: new Date("2024-12-15"),
      status: 1,
      feedback: "ok",
    },
  });

  await prisma.documents.create({
    data: {
      document_id: TEST_DOCUMENTS_ID,
      cv: "cv.pdf",
    },
  });
  await prisma.employee_documents.create({
    data: {
      document_id: TEST_DOCUMENTS_ID,
      employee_id: TEST_SUBJECT_EMPLOYEE_ID,
      url: "https://docs.example/bundle1",
    },
  });

  await prisma.inside_certifications.create({
    data: {
      inside_certification_id: TEST_INSIDE_CERT_ID,
      name: "Cert interna integration",
      description: "desc",
    },
  });
  await prisma.employee_inside_certification.create({
    data: {
      inside_certification_id: TEST_INSIDE_CERT_ID,
      employee_id: TEST_SUBJECT_EMPLOYEE_ID,
      date: new Date("2024-06-01"),
    },
  });

  await prisma.outside_certification.create({
    data: {
      outside_certification_id: TEST_OUTSIDE_CERT_ID,
      employee_id: TEST_SUBJECT_EMPLOYEE_ID,
      file: "ext-cert.pdf",
      name: "Cert externa",
    },
  });

  await prisma.psychological_evaluation.create({
    data: {
      psychological_evaluation_id: TEST_PSYCH_EVAL_ID,
      employee_id: TEST_SUBJECT_EMPLOYEE_ID,
      file: "psych.pdf",
      date: new Date("2024-07-20"),
    },
  });
};

// Borrado respetando FKs (hijos primero) — solo filas creadas en estos tests
const cleanSubjectGraph = async () => {
  await prisma.logs.deleteMany({
    where: {
      employee_id: { in: [TEST_ADMIN_EMPLOYEE_ID, TEST_SUBJECT_EMPLOYEE_ID] },
    },
  });
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
  await prisma.employee_documents.deleteMany({
    where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
  });
  await prisma.employee_inside_certification.deleteMany({
    where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
  });
  await prisma.outside_certification.deleteMany({
    where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
  });
  await prisma.psychological_evaluation.deleteMany({
    where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
  });
  await prisma.employee.deleteMany({
    where: { employee_id: TEST_SUBJECT_EMPLOYEE_ID },
  });
  await prisma.fault.deleteMany({ where: { fault_id: TEST_FAULT_ID } });
  await prisma.workday.deleteMany({ where: { workday_id: TEST_WORKDAY_ID } });
  await prisma.documents.deleteMany({
    where: { document_id: TEST_DOCUMENTS_ID },
  });
  await prisma.inside_certifications.deleteMany({
    where: { inside_certification_id: TEST_INSIDE_CERT_ID },
  });
};

const cleanAllSeeded = async () => {
  await prisma.logs.deleteMany({
    where: {
      employee_id: { in: [TEST_ADMIN_EMPLOYEE_ID, TEST_SUBJECT_EMPLOYEE_ID] },
    },
  });
  await cleanSubjectGraph();
  await prisma.employee.deleteMany({
    where: { employee_id: TEST_ADMIN_EMPLOYEE_ID },
  });
  await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
  await prisma.role.deleteMany({ where: { role_id: TEST_ROLE_ID } });
};

// ─── Hooks ────────────────────────────────────────────────
beforeAll(async () => {
  await cleanSubjectGraph();
  await prisma.employee.deleteMany({
    where: { employee_id: TEST_ADMIN_EMPLOYEE_ID },
  });
  await seedDependencies();
});
afterEach(async () => {
  await cleanSubjectGraph();
});
afterAll(async () => {
  await cleanAllSeeded();
  await prisma.$disconnect();
});

// ─── GET /employee/employee-detail/:employeeID ──────────────
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
    expect(res.body.code).toBe("Not Found");
  });

  it("retorna 200 con detalle, adminInfo y record según el esquema del servicio", async () => {
    await seedSubjectEmployeeWithRelations();

    const res = await request(app)
      .get(`/employee/employee-detail/${TEST_SUBJECT_EMPLOYEE_ID}`)
      .set(authHeader());

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.employee).toBeDefined();
    const { basicInfo, adminInfo, record } = res.body.data.employee;
    expect(basicInfo).toMatchObject({ email: TEST_SUBJECT_EMAIL });
    expect(basicInfo.address).toMatchObject({ street: "Calle 1" });
    expect(adminInfo).toMatchObject({
      faults: [
        expect.objectContaining({
          description: "Falta de prueba (integration)",
        }),
      ],
      workdays: [expect.objectContaining({ name: expect.any(String) })],
      vacationRequests: [
        expect.objectContaining({ status: 1, feedback: "ok" }),
      ],
    });
    expect(record).toMatchObject({
      documents: [
        expect.objectContaining({ url: "https://docs.example/bundle1" }),
      ],
      insideCertifications: [
        expect.objectContaining({ name: "Cert interna integration" }),
      ],
      outsideCertifications: [
        expect.objectContaining({ name: "Cert externa" }),
      ],
      psychologicalEvaluations: [
        expect.objectContaining({ file: "psych.pdf" }),
      ],
    });
  });
});
