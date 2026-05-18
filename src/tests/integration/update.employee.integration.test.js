const request = require("supertest");
const app     = require("../../app");
const prisma  = require("../../prisma");
const { hashPassword } = require("../../utils/password");
const { buildSessionToken } = require("../../utils/auth/authTokens");

// ─── IDs fijos ────────────────────────────────────────────────────────────────

const HOUSE_ID    = "f1000001-0000-4000-8000-000000000001";
const OTHER_HOUSE_ID = "f1000001-0000-4000-8000-000000000002";
const ROLE_ID     = "f2000001-0000-4000-8000-000000000001";
const FALLBACK_ADMIN_ROLE_ID = "f2000001-0000-4000-8000-000000000002";
const WD_ID       = "f3000001-0000-4000-8000-000000000001";
const EMP_ID      = "eee00001-0000-4000-8000-000000000001";
const OTHER_EMP   = "eee00002-0000-4000-8000-000000000002";
const UNKNOWN_ID  = "ffffffff-ffff-4fff-bfff-ffffffffffff";
const PRIVILEGE_ID = "b0000001-0000-4000-8000-000000000001";

let token;
let adminRoleId = FALLBACK_ADMIN_ROLE_ID;
let shouldCleanupAdminRole = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const authHeader = () => ({ Authorization: `Bearer ${token}` });

const json = () => ({
  "Content-Type": "application/json",
  ...authHeader(),
});

// ─── Seed / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  // 1. Limpieza inicial profunda (Orden inverso de dependencias)
  await prisma.logs.deleteMany({ where: { employee_id: { in: [EMP_ID, OTHER_EMP] } } });
  await prisma.employee_workday.deleteMany({ where: { employee_id: { in: [EMP_ID, OTHER_EMP] } } });
  await prisma.employee_address.deleteMany({ where: { employee_id: { in: [EMP_ID, OTHER_EMP] } } });
  await prisma.employee.deleteMany({ where: { employee_id: { in: [EMP_ID, OTHER_EMP] } } });
  await prisma.role_privilege.deleteMany({ where: { role_id: ROLE_ID } });
  await prisma.privileges.deleteMany({ where: { privilege_id: PRIVILEGE_ID } });
  await prisma.role.deleteMany({ where: { role_id: ROLE_ID } });
  await prisma.house.deleteMany({ where: { house_id: HOUSE_ID } });
  await prisma.house.deleteMany({ where: { house_id: OTHER_HOUSE_ID } });
  await prisma.workday.deleteMany({ where: { workday_id: WD_ID } });

  // 2. Preparar dependencias (Catálogos)
  await prisma.workday.upsert({
    where:  { workday_id: WD_ID },
    update: {},
    create: { workday_id: WD_ID, name: "Lunes Update IT" },
  });

  await prisma.house.upsert({
    where:  { house_id: HOUSE_ID },
    update: {},
    create: { 
        house_id: HOUSE_ID, 
        name: "Casa de Prueba",
        location: "Querétaro",
        phone_number: "4421234567",
        description: "Casa usada para pruebas de integración",
        image: "test-house.jpg", 
    },
  });

  await prisma.house.upsert({
    where:  { house_id: OTHER_HOUSE_ID },
    update: {},
    create: {
        house_id: OTHER_HOUSE_ID,
        name: "Casa Secundaria",
        location: "CDMX",
        phone_number: "5512345678",
        description: "Casa secundaria para pruebas de integración",
        image: "test-house-2.jpg",
    },
  });

  await prisma.role.upsert({
      where:  { role_id: ROLE_ID },
      update: { name: "Coordinador Update IT" },
      create: { role_id: ROLE_ID, name: "Coordinador Update IT" },
  });

  const existingAdminRole = await prisma.role.findFirst({
    where: { name: "Administrador" },
    select: { role_id: true },
  });

  if (existingAdminRole) {
    adminRoleId = existingAdminRole.role_id;
  } else {
    shouldCleanupAdminRole = true;
    await prisma.role.create({
      data: { role_id: adminRoleId, name: "Administrador" },
    });
  }

  const priv = await prisma.privileges.upsert({
      where: { name: "manageEmployees" },
      update: { name: "manageEmployees" },
      create: {
          privilege_id: PRIVILEGE_ID,
          name: "manageEmployees" 
      }
  });

  await prisma.role_privilege.create({
    data: {
      role_id: ROLE_ID,
      privilege_id: priv.privilege_id
    }
  });

  // 3. Crear el empleado base
  const password = await hashPassword("TestPass123!");

  await prisma.employee.create({
    data: {
      employee_id: EMP_ID,
      house_id:    HOUSE_ID,
      role_id:     ROLE_ID,
      name:        "Test",
      surname:     "User",
      is_active:   true,
      email:       "test.update@mail.com",
      password,
      has_first_login: false,
      curp:        "TESU800101HDFXXX01",
      start_date:  new Date("2024-01-01"),
    },
  });

  // 4. Token de sesión
  token = await buildSessionToken({ 
    employeeId: EMP_ID, 
    id: EMP_ID,
    roleId: ROLE_ID, 
    role: "Coordinador",
    privileges: ["manageEmployees"],
    houseId: HOUSE_ID, 
    email: "test.update@mail.com", 
    name: "Test User" 
  });
});

afterAll(async () => {
    // Limpieza final
    await prisma.logs.deleteMany({ where: { employee_id: { in: [EMP_ID, OTHER_EMP] } } });
    await prisma.employee_workday.deleteMany({ where: { employee_id: { in: [EMP_ID, OTHER_EMP] } } });
    await prisma.employee_address.deleteMany({ where: { employee_id: { in: [EMP_ID, OTHER_EMP] } } });
    await prisma.employee.deleteMany({ where: { employee_id: { in: [EMP_ID, OTHER_EMP] } } });
    await prisma.role_privilege.deleteMany({ where: { role_id: ROLE_ID } });
    await prisma.privileges.deleteMany({ where: { privilege_id: PRIVILEGE_ID } });
    await prisma.role.deleteMany({ where: { role_id: ROLE_ID } });
    if (shouldCleanupAdminRole) {
      await prisma.role.deleteMany({ where: { role_id: adminRoleId } });
    }
    await prisma.house.deleteMany({ where: { house_id: HOUSE_ID } });
    await prisma.house.deleteMany({ where: { house_id: OTHER_HOUSE_ID } });
    await prisma.workday.deleteMany({ where: { workday_id: WD_ID } });

    await prisma.$disconnect();
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /employee/update-form
// ══════════════════════════════════════════════════════════════════════════════

describe("GET /employee/update-form", () => {
  it("retorna 401 sin token", async () => {
    const res = await request(app).get("/employee/update-form");
    expect(res.statusCode).toBe(401);
  });

  it("retorna 200 con roles, casas y workdays", async () => {
    const res = await request(app)
      .get("/employee/update-form")
      .set(authHeader());
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.roles)).toBe(true);
    expect(Array.isArray(res.body.houses)).toBe(true);
    expect(Array.isArray(res.body.workdays)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /employee/:employeeId/basic-info
// ══════════════════════════════════════════════════════════════════════════════

describe("PUT /employee/:employeeId/basic-info", () => {
  it("retorna 401 sin token", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .send({ name: "Nuevo" });
    expect(res.statusCode).toBe(401);
  });

  it("retorna 200 y actualiza nombre y apellido", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ name: "Carlos", surname: "Ramírez" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await prisma.employee.findUnique({ where: { employee_id: EMP_ID } });
    expect(updated.name).toBe("Carlos");
    expect(updated.surname).toBe("Ramírez");
  });

  it("aplica trim al nombre", async () => {
    await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ name: "  Juan  " });
    const updated = await prisma.employee.findUnique({ where: { employee_id: EMP_ID } });
    expect(updated.name).toBe("Juan");
  });

  it("retorna 404 con employeeId inexistente", async () => {
    const res = await request(app)
      .put(`/employee/${UNKNOWN_ID}/basic-info`)
      .set(json())
      .send({ name: "Test" });
    expect(res.statusCode).toBe(404);
  });

  it("retorna 400 con body vacío", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con nombre con números", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ name: "Juan123" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con CURP de longitud incorrecta", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ curp: "CORTA" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con NSS con letras", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ nss: "123ABC45678" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con fecha de nacimiento en el futuro", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ birthDate: "2090-01-01" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con campo no permitido (strict)", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ name: "Juan", isActive: true });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con inyección SQL en nombre", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ name: "'; DROP TABLE employee;--" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con XSS en nombre", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ name: "<script>alert(1)</script>" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con nombre excediendo max length", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ name: "A".repeat(51) });
    expect(res.statusCode).toBe(400);
  });

  it("acepta nombres con acentos y ñ", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/basic-info`)
      .set(json())
      .send({ name: "Ángel", surname: "Muñoz" });
    expect(res.statusCode).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /employee/:employeeId/contact-info
// ══════════════════════════════════════════════════════════════════════════════

describe("PUT /employee/:employeeId/contact-info", () => {
  it("retorna 401 sin token", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .send({ email: "test@mail.com" });
    expect(res.statusCode).toBe(401);
  });

  it("retorna 200 y actualiza email", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .set(json())
      .send({ email: "nuevo@mail.com" });
    expect(res.statusCode).toBe(200);
    const updated = await prisma.employee.findUnique({ where: { employee_id: EMP_ID } });
    expect(updated.email).toBe("nuevo@mail.com");
  });

  it("convierte email a minúsculas en BD", async () => {
    await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .set(json())
      .send({ email: "UPPER@MAIL.COM" });
    const updated = await prisma.employee.findUnique({ where: { employee_id: EMP_ID } });
    expect(updated.email).toBe("upper@mail.com");
  });

  it("crea dirección si no existía (upsert)", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .set(json())
      .send({ street: "Calle Falsa 123", postalCode: "76000" });
    expect(res.statusCode).toBe(200);
    const addr = await prisma.employee_address.findFirst({ where: { employee_id: EMP_ID } });
    expect(addr).not.toBeNull();
    expect(addr.street).toBe("Calle Falsa 123");
  });

  it("actualiza dirección existente", async () => {
    await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .set(json())
      .send({ street: "Nueva Calle 456" });
    const addr = await prisma.employee_address.findFirst({ where: { employee_id: EMP_ID } });
    expect(addr.street).toBe("Nueva Calle 456");
  });

  it("retorna 400 con email inválido", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .set(json())
      .send({ email: "no-email" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con email demasiado largo", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .set(json())
      .send({ email: `${"a".repeat(70)}@mail.com` });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con body vacío", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .set(json())
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con campo no permitido", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/contact-info`)
      .set(json())
      .send({ email: "a@b.com", password: "hack123" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 404 con employeeId inexistente", async () => {
    const res = await request(app)
      .put(`/employee/${UNKNOWN_ID}/contact-info`)
      .set(json())
      .send({ email: "a@b.com" });
    expect(res.statusCode).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /employee/:employeeId/admin-info
// ══════════════════════════════════════════════════════════════════════════════

describe("PUT /employee/:employeeId/admin-info", () => {
  it("retorna 401 sin token", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .send({ type: "voluntario" });
    expect(res.statusCode).toBe(401);
  });

  it("retorna 200 y actualiza tipo", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ type: "Asalariado" });
    expect(res.statusCode).toBe(200);
    const updated = await prisma.employee.findUnique({ where: { employee_id: EMP_ID } });
    expect(updated.type).toBe("Asalariado");
  });

  it("encripta el salario en BD", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ salary: 25000 });
    expect(res.statusCode).toBe(200);
    const updated = await prisma.employee.findUnique({ where: { employee_id: EMP_ID } });
    expect(updated.salary).not.toBe("25000");
    expect(typeof updated.salary).toBe("string");
  });

  it("actualiza horarios (upsert workdays) y se persisten en BD", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({
        workdays: [{ workdayId: WD_ID, start: "09:00", end: "18:00" }],
      });
    expect(res.statusCode).toBe(200);
    const wds = await prisma.employee_workday.findMany({ where: { employee_id: EMP_ID } });
    expect(wds.length).toBe(1);
    expect(wds[0].workday_id).toBe(WD_ID);
  });

  it("sobreescribe workdays existentes al actualizar", async () => {
    await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ workdays: [{ workdayId: WD_ID, start: "08:00", end: "16:00" }] });

    await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ workdays: [{ workdayId: WD_ID, start: "10:00", end: "19:00" }] });

    const wds = await prisma.employee_workday.findMany({ where: { employee_id: EMP_ID } });
    expect(wds.length).toBe(1);
  });

  it("retorna 400 con salario negativo", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ salary: -1 });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con salario cero", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ salary: 0 });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con salario mayor al límite", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ salary: 9_999_999 });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 si se intenta modificar la casa", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ houseId: OTHER_HOUSE_ID });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 si se intenta modificar el puesto a Administrador", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ roleId: adminRoleId });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con workday start >= end", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({
        workdays: [{ workdayId: WD_ID, start: "18:00", end: "08:00" }],
      });
    expect(res.statusCode).toBe(200);
  });

  it("retorna 400 con formato de hora inválido", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({
        workdays: [{ workdayId: WD_ID, start: "8am", end: "5pm" }],
      });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con workdays array vacío", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ workdays: [] });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con campo no permitido (isActive)", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ type: "voluntario", isActive: false });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 intentando escalar privilegios con password", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({ type: "voluntario", password: "newHackedPass" });
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con body vacío", async () => {
    const res = await request(app)
      .put(`/employee/${EMP_ID}/admin-info`)
      .set(json())
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it("retorna 404 con employeeId inexistente", async () => {
    const res = await request(app)
      .put(`/employee/${UNKNOWN_ID}/admin-info`)
      .set(json())
      .send({ type: "voluntario" });
    expect(res.statusCode).toBe(404);
  });
});
