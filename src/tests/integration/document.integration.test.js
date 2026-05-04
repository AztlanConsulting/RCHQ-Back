// tests/integration/document.integration.test.js
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const path = require("path");
const fs = require("fs");
const app = require("../../app");

const prisma = new PrismaClient();

// ─── Constantes de prueba ─────────────────────────────────
const TEST_HOUSE_ID = randomUUID();
const TEST_ROLE_ID = randomUUID();
const TEST_EMPLOYEE_ID = randomUUID();
const TEST_EMAIL = "doctest@test.com";

// ─── Helpers ──────────────────────────────────────────────
const seedDependencies = async () => {
  await prisma.house.upsert({
    where: { house_id: TEST_HOUSE_ID },
    update: {},
    create: {
      house_id:     TEST_HOUSE_ID,
      name:         "Casa Test Update",
      location:     "Test",
      phone_number: "4420000000",
      description:  "Test",
      image:        "test.jpg",
    },
  });

  await prisma.role.upsert({
    where: { role_id: TEST_ROLE_ID },
    update: {},
    create: { role_id: TEST_ROLE_ID, name: "test-role-docs-it" },
  });

  await prisma.employee.upsert({
    where: { employee_id: TEST_EMPLOYEE_ID },
    update: {},
    create: {
      employee_id: TEST_EMPLOYEE_ID,
      house_id: TEST_HOUSE_ID,
      role_id: TEST_ROLE_ID,
      email: TEST_EMAIL,
      password: "hashed",
      name: "Test",
      surname: "User",
      curp: "TESTDOCS12345678AB",
      start_date: new Date(),
      is_active: true,
      has_first_login: true,
      type: "nomina",
    },
  });
};

const generateToken = () => {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    {
      id: TEST_EMPLOYEE_ID,
      employeeId: TEST_EMPLOYEE_ID,
      houseId: TEST_HOUSE_ID,
      email: TEST_EMAIL,
      role: "Admin",
      privileges: ["manageDocuments", "viewDocuments"],
      tokenType: "SESSION",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

const cleanDb = async () => {
  await prisma.employee_documents.deleteMany({
    where: { employee_id: TEST_EMPLOYEE_ID },
  });
  await prisma.documents.deleteMany();
  await prisma.logs.deleteMany();
  await prisma.employee.deleteMany({ where: { role_id: TEST_ROLE_ID } });
};

const dummyPdfBuffer = Buffer.from("%PDF-1.4 dummy content");

// ─── Hooks ────────────────────────────────────────────────
beforeAll(async () => {
  await cleanDb();
  await seedDependencies();
  const uploadDir = path.join(__dirname, "../../uploads/documents");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
});

afterAll(async () => {
  await cleanDb();
  await prisma.role.deleteMany({ where: { role_id: TEST_ROLE_ID } });
  await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
  await prisma.$disconnect();
});

// ─── POST /employee/:id/documents ─────────────────────────
describe("POST /employee/:id/documents - integration", () => {
  it("retorna 400 si faltan campos (sin archivo)", async () => {
    const token = generateToken();
    const res = await request(app)
      .post(`/employee/${TEST_EMPLOYEE_ID}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .field("documentField", "cv");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Faltan campos requeridos");
  });

  it("retorna 400 si el documentField es inválido", async () => {
    const token = generateToken();
    const res = await request(app)
      .post(`/employee/${TEST_EMPLOYEE_ID}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .field("documentField", "campo_inventado")
      .attach("file", dummyPdfBuffer, "test.pdf");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/inválido/i);
  });

  it("sube el documento y retorna 201 exitosamente", async () => {
    const token = generateToken();
    const res = await request(app)
      .post(`/employee/${TEST_EMPLOYEE_ID}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .field("documentField", "cv")
      .attach("file", dummyPdfBuffer, "test.pdf");

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);

    const docRow = await prisma.employee_documents.findFirst({
      where: { employee_id: TEST_EMPLOYEE_ID },
    });
    expect(docRow).not.toBeNull();
  });

  it("retorna 409 si el documento ya existe para ese campo", async () => {
    const token = generateToken();

    // El test anterior ya subió cv, intentamos subirlo de nuevo
    const res = await request(app)
      .post(`/employee/${TEST_EMPLOYEE_ID}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .field("documentField", "cv")
      .attach("file", dummyPdfBuffer, "duplicate.pdf");

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.field).toBe("cv");
  });

  it("sube un campo distinto sin problema aunque ya exista la fila", async () => {
    const token = generateToken();
    const res = await request(app)
      .post(`/employee/${TEST_EMPLOYEE_ID}/documents`)
      .set("Authorization", `Bearer ${token}`)
      .field("documentField", "nss")
      .attach("file", dummyPdfBuffer, "nss.pdf");

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});

// ─── PUT /employee/:id/documents/:field ───────────────────
describe("PUT /employee/:id/documents/:field - integration", () => {
  it("actualiza un documento existente retornando 200", async () => {
    const token = generateToken();
    const res = await request(app)
      .put(`/employee/${TEST_EMPLOYEE_ID}/documents/cv`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", dummyPdfBuffer, "update.pdf");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("retorna 400 si no se envía archivo", async () => {
    const token = generateToken();
    const res = await request(app)
      .put(`/employee/${TEST_EMPLOYEE_ID}/documents/cv`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 si el field es inválido", async () => {
    const token = generateToken();
    const res = await request(app)
      .put(`/employee/${TEST_EMPLOYEE_ID}/documents/campo_invalido`)
      .set("Authorization", `Bearer ${token}`)
      .attach("file", dummyPdfBuffer, "update.pdf");

    expect(res.statusCode).toBe(400);
  });
});

// ─── GET /employee/:id/documents ──────────────────────────
describe("GET /employee/:id/documents - integration", () => {
  it("retorna 200 y los documentos del empleado", async () => {
    const token = generateToken();
    const res = await request(app)
      .get(`/employee/${TEST_EMPLOYEE_ID}/documents`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.body.documents).toHaveProperty("cv");
  });

  it("retorna 200 con mensaje de no tener documentos para otro empleado válido", async () => {
    const OTHER_EMP_ID = randomUUID();
    await prisma.employee.create({
      data: {
        employee_id: OTHER_EMP_ID,
        house_id: TEST_HOUSE_ID,
        role_id: TEST_ROLE_ID,
        email: "doctest2@test.com",
        password: "hashed",
        name: "Test",
        surname: "User",
        type: "nomina",
        curp: "OTHEMP9876543210AB",
        start_date: new Date(),
        is_active: true,
        has_first_login: true,
        is_active_two_factor_auth: false,
        failed_login_attempts: 0,
        failed_two_factor_auth_attempts: 0,
      },
    });

    const token = generateToken();
    const res = await request(app)
      .get(`/employee/${OTHER_EMP_ID}/documents`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/no tiene documentos/i);

    await prisma.employee.delete({ where: { employee_id: OTHER_EMP_ID } });
  });
});

// ─── DELETE /employee/:id/documents/:field ────────────────
describe("DELETE /employee/:id/documents/:field - integration", () => {
  it("elimina el campo del documento retornando 200", async () => {
    const token = generateToken();
    const res = await request(app)
      .delete(`/employee/${TEST_EMPLOYEE_ID}/documents/cv`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const docRow = await prisma.employee_documents.findFirst({
      where: { employee_id: TEST_EMPLOYEE_ID },
      include: { documents: true },
    });
    expect(docRow.documents.cv).toBeNull();
  });

  it("retorna 400 si el field es inválido", async () => {
    const token = generateToken();
    const res = await request(app)
      .delete(`/employee/${TEST_EMPLOYEE_ID}/documents/invalido`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(400);
  });
});
