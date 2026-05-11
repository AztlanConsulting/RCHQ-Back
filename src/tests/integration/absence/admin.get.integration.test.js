const request = require("supertest");
const app     = require("../../../index");
const prisma  = require("../../../prisma");
const { hashPassword }     = require("../../../utils/password");
const { buildSessionToken } = require("../../../utils/auth/authTokens");
const jwt = require("jsonwebtoken");

// ─── IDs fijos ────────────────────────────────────────────────────────────────

const HOUSE_ID      = "c0000001-0000-4000-8000-000000000001";
const ROLE_ADMIN_ID = "c0000002-0000-4000-8000-000000000001";
const ROLE_NO_PRIV  = "c0000002-0000-4000-8000-000000000002";
const EMP_ADMIN     = "c0000003-0000-4000-8000-000000000001";
const EMP_NO_PRIV   = "c0000003-0000-4000-8000-000000000002";
const ABS_TYPE_ID   = "c0000004-0000-4000-8000-000000000001";
const PRIV_ID       = "c0000005-0000-4000-8000-000000000001";

const ABS_IDS = Array.from({ length: 10 }, (_, i) =>
  `c000000${i}-aaaa-4000-8000-000000000001`,
);

let tokenAdmin;
let tokenNoPriv;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const auth  = (t) => ({ Authorization: `Bearer ${t}` });
const get   = (url, t) => request(app).get(url).set(auth(t ?? tokenAdmin));

// ─── Seed / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  // limpieza profunda
  await prisma.absence.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.employee_workday.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.employee_address.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.logs.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.employee.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.role_privilege.deleteMany({ where: { role_id: { in: [ROLE_ADMIN_ID, ROLE_NO_PRIV] } } });
  await prisma.privileges.deleteMany({ where: { privilege_id: PRIV_ID } });
  await prisma.role.deleteMany({ where: { role_id: { in: [ROLE_ADMIN_ID, ROLE_NO_PRIV] } } });
  await prisma.absence_type.deleteMany({ where: { absence_type_id: ABS_TYPE_ID } });
  await prisma.house.deleteMany({ where: { house_id: HOUSE_ID } });

  // catálogos
  await prisma.house.create({
    data: {
      house_id: HOUSE_ID, name: "Casa Test Ausencias",
      location: "Querétaro", phone_number: "4421234567",
      description: "Test", image: "test.jpg",
    },
  });

  await prisma.role.createMany({
    data: [
      { role_id: ROLE_ADMIN_ID, name: "Admin" },
      { role_id: ROLE_NO_PRIV,  name: "RolSinPrivilegios" },
    ],
  });

  await prisma.privileges.create({
    data: { privilege_id: PRIV_ID, name: "viewEmployeesAbsences" },
  });

  await prisma.role_privilege.create({
    data: { role_id: ROLE_ADMIN_ID, privilege_id: PRIV_ID },
  });

  await prisma.absence_type.create({
    data: { absence_type_id: ABS_TYPE_ID, name: "Médica" },
  });

  const password = await hashPassword("TestPass123!");

  await prisma.employee.createMany({
    data: [
      {
        employee_id: EMP_ADMIN, house_id: HOUSE_ID, role_id: ROLE_ADMIN_ID,
        name: "Admin", surname: "Test", is_active: true,
        email: "admin.absence@mail.com", password,
        has_first_login: false, curp: "ADMT800101HDFXXX01",
        start_date: new Date("2024-01-01"),
      },
      {
        employee_id: EMP_NO_PRIV, house_id: HOUSE_ID, role_id: ROLE_NO_PRIV,
        name: "NoPriv", surname: "Test", is_active: true,
        email: "nopriv.absence@mail.com", password,
        has_first_login: false, curp: "NOPT800101HDFXXX02",
        start_date: new Date("2024-01-01"),
      },
    ],
  });

  // 10 ausencias variadas para paginación y filtros
  await prisma.absence.createMany({
    data: ABS_IDS.map((id, i) => ({
      absence_id:      id,
      employee_id:     EMP_ADMIN,
      absence_type_id: ABS_TYPE_ID,
      start:           new Date(`2026-0${(i % 9) + 1}-01`),
      end:             new Date(`2026-0${(i % 9) + 1}-05`),
      description:     `Ausencia ${i + 1}`,
      url:             i % 2 === 0 ? `uploads/evidencia_${i}.pdf` : null,
      is_deleted:      i === 9, // la última está "eliminada"
    })),
  });

  tokenAdmin = await buildSessionToken({
    employeeId: EMP_ADMIN, id: EMP_ADMIN,
    roleId: ROLE_ADMIN_ID, role: "Admin",
    privileges: ["viewEmployeesAbsences"],
    houseId: HOUSE_ID, email: "admin.absence@mail.com", name: "Admin Test",
  });

  tokenNoPriv = await buildSessionToken({
    employeeId: EMP_NO_PRIV, id: EMP_NO_PRIV,
    roleId: ROLE_NO_PRIV, role: "RolSinPrivilegios",
    privileges: [],
    houseId: HOUSE_ID, email: "nopriv.absence@mail.com", name: "NoPriv Test",
  });
});

afterAll(async () => {
  await prisma.absence.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.employee_workday.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.employee_address.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.logs.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.employee.deleteMany({ where: { employee_id: { in: [EMP_ADMIN, EMP_NO_PRIV] } } });
  await prisma.role_privilege.deleteMany({ where: { role_id: { in: [ROLE_ADMIN_ID, ROLE_NO_PRIV] } } });
  await prisma.privileges.deleteMany({ where: { privilege_id: PRIV_ID } });
  await prisma.role.deleteMany({ where: { role_id: { in: [ROLE_ADMIN_ID, ROLE_NO_PRIV] } } });
  await prisma.absence_type.deleteMany({ where: { absence_type_id: ABS_TYPE_ID } });
  await prisma.house.deleteMany({ where: { house_id: HOUSE_ID } });
  await prisma.$disconnect();
});

// ══════════════════════════════════════════════════════════════════════════════
// Autenticación y autorización
// ══════════════════════════════════════════════════════════════════════════════

describe("GET /absence/all — autenticación y autorización", () => {
  it("retorna 401 sin token", async () => {
    const res = await request(app).get("/absence/all?page=1&limit=6");
    expect(res.statusCode).toBe(401);
  });

  it("retorna 401 con token vacío", async () => {
    const res = await request(app)
      .get("/absence/all?page=1&limit=6")
      .set("Authorization", "Bearer ");
    expect(res.statusCode).toBe(401);
  });

  it("retorna 401 con token malformado (basura)", async () => {
    const res = await request(app)
      .get("/absence/all?page=1&limit=6")
      .set("Authorization", "Bearer esto.no.es.un.jwt");
    expect(res.statusCode).toBe(401);
  });

  it("retorna 401 con token firmado con secret incorrecto", async () => {
    const fakeToken = jwt.sign(
      { employeeId: EMP_ADMIN, role: "Admin", privileges: ["viewEmployeesAbsences"] },
      "secret_incorrecto",
      { expiresIn: "1h" }
    );
    const res = await request(app)
      .get("/absence/all?page=1&limit=6")
      .set("Authorization", `Bearer ${fakeToken}`);
    expect(res.statusCode).toBe(401);
  });

  it("retorna 401 con token expirado", async () => {
    const expiredToken = jwt.sign(
      { employeeId: EMP_ADMIN, role: "Admin", privileges: ["viewEmployeesAbsences"] },
      process.env.JWT_SECRET ?? "test_secret",
      { expiresIn: "-1s" }
    );
    const res = await request(app)
      .get("/absence/all?page=1&limit=6")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.statusCode).toBe(401);
  });

  it("retorna 401 con token manipulado (payload alterado)", async () => {
    const [header, , signature] = tokenAdmin.split(".");
    const fakePayload = Buffer.from(
      JSON.stringify({ employeeId: EMP_NO_PRIV, role: "Admin", privileges: ["viewEmployeesAbsences"] })
    ).toString("base64url");
    const tamperedToken = `${header}.${fakePayload}.${signature}`;
    const res = await request(app)
      .get("/absence/all?page=1&limit=6")
      .set("Authorization", `Bearer ${tamperedToken}`);
    expect(res.statusCode).toBe(401);
  });

  it("retorna 403 con token válido pero sin privilegio viewEmployeesAbsences", async () => {
    const res = await get("/absence/all?page=1&limit=6", tokenNoPriv);
    expect(res.statusCode).toBe(403);
  });

  it("retorna 200 con token válido y privilegio correcto", async () => {
    const res = await get("/absence/all?page=1&limit=6");
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Validación de parámetros
// ══════════════════════════════════════════════════════════════════════════════

describe("GET /absence/all — validación de parámetros", () => {
  it("retorna 400 sin page", async () => {
    const res = await get("/absence/all?limit=6");
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 sin limit", async () => {
    const res = await get("/absence/all?page=1");
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con page=0", async () => {
    const res = await get("/absence/all?page=0&limit=6");
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con page negativo", async () => {
    const res = await get("/absence/all?page=-1&limit=6");
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con limit=0", async () => {
    const res = await get("/absence/all?page=1&limit=0");
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con page=texto", async () => {
    const res = await get("/absence/all?page=abc&limit=6");
    expect(res.statusCode).toBe(400);
  });

  it("retorna 400 con limit=texto", async () => {
    const res = await get("/absence/all?page=1&limit=xyz");
    expect(res.statusCode).toBe(400);
  });

  it("acepta limit mayor a 100 pero lo recorta a 100", async () => {
    const res = await get("/absence/all?page=1&limit=999");
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination.limit).toBeLessThanOrEqual(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Paginación
// ══════════════════════════════════════════════════════════════════════════════

describe("GET /absence/all — paginación", () => {
  it("retorna máximo 6 registros con limit=6", async () => {
    const res = await get("/absence/all?page=1&limit=6");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(6);
  });

  it("retorna paginación con totalPages calculado", async () => {
    const res = await get("/absence/all?page=1&limit=6");
    expect(res.body.pagination).toMatchObject({
      page: 1,
      limit: 6,
      totalPages: expect.any(Number),
      total: expect.any(Number),
    });
  });

  it("retorna datos diferentes en page=1 y page=2", async () => {
    const r1 = await get("/absence/all?page=1&limit=3");
    const r2 = await get("/absence/all?page=2&limit=3");
    const ids1 = r1.body.data.map((a) => a.absenceId);
    const ids2 = r2.body.data.map((a) => a.absenceId);
    const overlap = ids1.filter((id) => ids2.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("retorna data vacía si page supera totalPages", async () => {
    const res = await get("/absence/all?page=999&limit=6");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Filtros
// ══════════════════════════════════════════════════════════════════════════════

describe("GET /absence/all — filtros", () => {
  it("filtra por nombre de empleado existente", async () => {
    const res = await get("/absence/all?page=1&limit=6&name=Admin");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    res.body.data.forEach((a) => {
      expect(a.employee.name.toLowerCase()).toContain("admin");
    });
  });

  it("filtra por nombre inexistente retorna data vacía", async () => {
    const res = await get("/absence/all?page=1&limit=6&name=UsuarioQueNoExiste99999");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("filtra por evidence=con retorna solo ausencias con URL", async () => {
    const res = await get("/absence/all?page=1&limit=10&evidence=con");
    expect(res.statusCode).toBe(200);
    res.body.data.forEach((a) => {
      expect(a.url).not.toBeNull();
    });
  });

  it("filtra por evidence=sin retorna solo ausencias sin URL", async () => {
    const res = await get("/absence/all?page=1&limit=10&evidence=sin");
    expect(res.statusCode).toBe(200);
    res.body.data.forEach((a) => {
      expect(a.url).toBeNull();
    });
  });

  it("filtra deleted=false no muestra ausencias eliminadas (default)", async () => {
    const res = await get("/absence/all?page=1&limit=10&deleted=false");
    expect(res.statusCode).toBe(200);
    // la ausencia eliminada (index 9) no debe aparecer
    const ids = res.body.data.map((a) => a.absenceId);
    expect(ids).not.toContain(ABS_IDS[9]);
  });

  it("filtra deleted=true muestra solo ausencias eliminadas", async () => {
    const res = await get("/absence/all?page=1&limit=10&deleted=true");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const ids = res.body.data.map((a) => a.absenceId);
    expect(ids).toContain(ABS_IDS[9]);
  });

  it("filtra por startFrom retorna solo ausencias desde esa fecha", async () => {
    const res = await get("/absence/all?page=1&limit=10&startFrom=2026-06-01");
    expect(res.statusCode).toBe(200);
    res.body.data.forEach((a) => {
      expect(new Date(a.start).getTime()).toBeGreaterThanOrEqual(
        new Date("2026-06-01").getTime()
      );
    });
  });

  it("filtra por endTo retorna solo ausencias hasta esa fecha", async () => {
    const res = await get("/absence/all?page=1&limit=10&endTo=2026-03-31");
    expect(res.statusCode).toBe(200);
    res.body.data.forEach((a) => {
      expect(new Date(a.end).getTime()).toBeLessThanOrEqual(
        new Date("2026-03-31").getTime()
      );
    });
  });

  it("combina filtros evidence=con y name correctamente", async () => {
    const res = await get("/absence/all?page=1&limit=10&evidence=con&name=Admin");
    expect(res.statusCode).toBe(200);
    res.body.data.forEach((a) => {
      expect(a.url).not.toBeNull();
      expect(a.employee.name.toLowerCase()).toContain("admin");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Estructura de la respuesta — camelCase
// ══════════════════════════════════════════════════════════════════════════════

describe("GET /absence/all — estructura camelCase", () => {
  it("retorna los campos en camelCase", async () => {
    const res = await get("/absence/all?page=1&limit=1");
    expect(res.statusCode).toBe(200);
    const absence = res.body.data[0];
    expect(absence).toHaveProperty("absenceId");
    expect(absence).toHaveProperty("start");
    expect(absence).toHaveProperty("end");
    expect(absence).toHaveProperty("url");
    expect(absence).toHaveProperty("absenceType");
    expect(absence).toHaveProperty("employee");
    expect(absence.employee).toHaveProperty("name");
    expect(absence.employee).toHaveProperty("picture");
    expect(absence.employee).toHaveProperty("house");
  });

  it("no expone campos en snake_case como absence_id", async () => {
    const res = await get("/absence/all?page=1&limit=1");
    const absence = res.body.data[0];
    expect(absence).not.toHaveProperty("absence_id");
    expect(absence).not.toHaveProperty("absence_type");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Ataques y edge cases de seguridad
// ══════════════════════════════════════════════════════════════════════════════

describe("GET /absence/all — seguridad", () => {
  it("no falla con inyección SQL en el parámetro name", async () => {
    const res = await get(
      `/absence/all?page=1&limit=6&name=${encodeURIComponent("'; DROP TABLE absence;--")}`
    );
    // Prisma usa queries parametrizadas — nunca debe ser 500
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("no falla con XSS en el parámetro name", async () => {
    const res = await get(
      `/absence/all?page=1&limit=6&name=${encodeURIComponent("<script>alert(1)</script>")}`
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("no falla con payload enorme en name (DoS)", async () => {
    const bigName = "A".repeat(5000);
    const res = await get(`/absence/all?page=1&limit=6&name=${encodeURIComponent(bigName)}`);
    expect([200, 400]).toContain(res.statusCode);
  });

  it("no expone stack trace en respuesta de error", async () => {
    const res = await get("/absence/all?page=1&limit=0");
    expect(res.body).not.toHaveProperty("stack");
    expect(JSON.stringify(res.body)).not.toContain("at Object.");
  });

  it("no acepta method POST en la ruta GET", async () => {
    const res = await request(app)
      .post("/absence/all")
      .set("Authorization", `Bearer ${tokenAdmin}`)
      .send({ page: 1, limit: 6 });
    expect(res.statusCode).toBe(404);
  });

  it("ignora evidence con valor no permitido y devuelve resultados sin filtro de evidencia", async () => {
    const res = await get("/absence/all?page=1&limit=6&evidence=hackeado");
    expect(res.statusCode).toBe(200);
    // no aplica filtro de evidencia inválido — devuelve resultados normales
  });

  it("no acepta token con algoritmo none (alg:none attack)", async () => {
    const header  = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      employeeId: EMP_ADMIN, role: "Admin", privileges: ["viewEmployeesAbsences"]
    })).toString("base64url");
    const noneToken = `${header}.${payload}.`;
    const res = await request(app)
      .get("/absence/all?page=1&limit=6")
      .set("Authorization", `Bearer ${noneToken}`);
    expect(res.statusCode).toBe(401);
  });
});