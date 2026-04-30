// tests/integration/deactivate.integration.test.js
require("dotenv").config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const request = require("supertest");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const app = require("../../app");
const { PrismaClient } = require("@prisma/client");
const { seedActions } = require("../helpers/seedActions");

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

// ─── IDs aleatorios para evitar colisiones entre suites ──────────────────────
const TEST_HOUSE_ID        = randomUUID();
let TEST_ROLE_ADMIN_ID = randomUUID();
const TEST_ACTOR_ID        = randomUUID();
const TEST_TARGET_ID       = randomUUID();
const TEST_TARGET_BL_ID    = randomUUID();
const TEST_TARGET_INACT_ID = randomUUID();

const TEST_ACTOR_EMAIL  = `actor.deactivate.${Date.now()}@test.com`;
const TEST_PASSWORD     = "AdminPass99";

const TEST_ACTOR_CURP   = `ADMC${Date.now().toString().slice(-6)}HDFRZN01`;
const TEST_TARGET_CURP  = `TGTC${Date.now().toString().slice(-6)}HDFRZN02`;
const TEST_TARGET_BL_CURP   = `BLPC${Date.now().toString().slice(-6)}HDFRZN03`;
const TEST_INACT_CURP   = `INAC${Date.now().toString().slice(-6)}HDFRZN04`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const seedDependencies = async (hashedPassword) => {
  await prisma.house.upsert({
    where:  { house_id: TEST_HOUSE_ID },
    update: {},
    create: {
      house_id:     TEST_HOUSE_ID,
      name:         `Casa Test Deactivate ${TEST_HOUSE_ID}`,
      location:     "Querétaro",
      phone_number: "4421234567",
      description:  "Casa de prueba deactivate",
      image:        "test.jpg",
    },
  });

  const adminRole = await prisma.role.upsert({
    where:  { name: "Admin" }, 
    update: {},
    create: { role_id: TEST_ROLE_ADMIN_ID, name: "Admin" },
  });

  // Actor (Admin que da de baja)
  await prisma.employee.create({
    data: {
      employee_id:     TEST_ACTOR_ID,
      house_id:        TEST_HOUSE_ID,
      role_id:         TEST_ROLE_ADMIN_ID,
      name:            "Actor",
      surname:         "Admin",
      is_active:       true,
      email:           TEST_ACTOR_EMAIL,
      password:        hashedPassword,
      has_first_login: false,
      curp:            TEST_ACTOR_CURP,
      rfc:             `ACT${Date.now().toString().slice(-9)}`,
      birth_date:      new Date("1990-01-01"),
      start_date:      new Date("2022-01-01"),
      nss:             `${Date.now().toString().slice(-11)}`,
      bank_account:    `0${Date.now().toString().slice(-17)}`,
    },
  });

  // Empleado activo a dar de baja
  await prisma.employee.create({
    data: {
      employee_id:     TEST_TARGET_ID,
      house_id:        TEST_HOUSE_ID,
      role_id:         TEST_ROLE_ADMIN_ID,
      name:            "Juan",
      surname:         "Objetivo",
      is_active:       true,
      email:           `target.${TEST_TARGET_ID}@test.com`,
      password:        hashedPassword,
      has_first_login: false,
      curp:            TEST_TARGET_CURP,
      rfc:             `TGT${Date.now().toString().slice(-9)}`,
      birth_date:      new Date("1990-01-01"),
      start_date:      new Date("2022-01-01"),
      nss:             `${(Date.now() + 1).toString().slice(-11)}`,
      bank_account:    `1${Date.now().toString().slice(-17)}`,
    },
  });

  // Empleado activo a dar de baja + lista negra
  await prisma.employee.create({
    data: {
      employee_id:     TEST_TARGET_BL_ID,
      house_id:        TEST_HOUSE_ID,
      role_id:         TEST_ROLE_ADMIN_ID,
      name:            "Pedro",
      surname:         "ListaNegra",
      is_active:       true,
      email:           `targetbl.${TEST_TARGET_BL_ID}@test.com`,
      password:        hashedPassword,
      has_first_login: false,
      curp:            TEST_TARGET_BL_CURP,
      rfc:             `BLP${Date.now().toString().slice(-9)}`,
      birth_date:      new Date("1990-01-01"),
      start_date:      new Date("2022-01-01"),
      nss:             `${(Date.now() + 2).toString().slice(-11)}`,
      bank_account:    `2${Date.now().toString().slice(-17)}`,
    },
  });

  // Empleado ya inactivo
  await prisma.employee.create({
    data: {
      employee_id:     TEST_TARGET_INACT_ID,
      house_id:        TEST_HOUSE_ID,
      role_id:         TEST_ROLE_ADMIN_ID,
      name:            "Ana",
      surname:         "Inactiva",
      is_active:       false,
      email:           `inact.${TEST_TARGET_INACT_ID}@test.com`,
      password:        hashedPassword,
      has_first_login: false,
      curp:            TEST_INACT_CURP,
      rfc:             `INA${Date.now().toString().slice(-9)}`,
      birth_date:      new Date("1990-01-01"),
      start_date:      new Date("2022-01-01"),
      nss:             `${(Date.now() + 3).toString().slice(-11)}`,
      bank_account:    `3${Date.now().toString().slice(-17)}`,
    },
  });
};

const cleanDb = async () => {
  const allEmployeeIds = [
    TEST_ACTOR_ID,
    TEST_TARGET_ID,
    TEST_TARGET_BL_ID,
    TEST_TARGET_INACT_ID,
  ];

  await prisma.logs.deleteMany({
    where: { employee_id: { in: allEmployeeIds } },
  });
  await prisma.blacklist.deleteMany({
    where: { curp: { in: [TEST_TARGET_CURP, TEST_TARGET_BL_CURP] } },
  });
  await prisma.employee.deleteMany({
    where: { employee_id: { in: allEmployeeIds } },
  });
  await prisma.house.deleteMany({ where: { house_id: TEST_HOUSE_ID } });
};

const loginAndGetToken = async () => {
  const res = await request(app)
    .post("/auth/login")
    .send({ email: TEST_ACTOR_EMAIL, password: TEST_PASSWORD });

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Login falló: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
};

// ─── Suite ────────────────────────────────────────────────────────────────────
describe("Flujo integración: Login → PATCH /:employeeId/deactivate", () => {
  let token;

  beforeAll(async () => {
    await cleanDb();
    await seedActions(prisma);
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    await seedDependencies(hashedPassword);
    token = await loginAndGetToken();
  });

  afterAll(async () => {
    await cleanDb();
    await prisma.$disconnect();
  });

  // ── Autenticación requerida ────────────────────────────────────────────────
  describe("Autenticación requerida", () => {
    it("401 — sin token no puede dar de baja", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
        .send({ reason: "Renuncia", intoBlacklist: false });

      expect(res.status).toBe(401);
    });

    it("401 — token expirado no puede dar de baja", async () => {
      const jwt = require("jsonwebtoken");
      const expToken = jwt.sign(
        { id: TEST_ACTOR_ID, tokenType: "SESSION" },
        process.env.JWT_SECRET,
        { expiresIn: "-1s" },
      );

      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
        .set("Authorization", `Bearer ${expToken}`)
        .send({ reason: "Renuncia", intoBlacklist: false });

      expect(res.status).toBe(401);
    });
  });

  // ── Validación del schema ──────────────────────────────────────────────────
  describe("Validación del schema", () => {
    it("400 — razón vacía", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "", intoBlacklist: false });

      expect(res.status).toBe(400);
    });

    it("400 — razón ausente", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ intoBlacklist: false });

      expect(res.status).toBe(400);
    });

    it("400 — razón supera 250 caracteres", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "a".repeat(251), intoBlacklist: false });

      expect(res.status).toBe(400);
    });

    it("400 — employeeId no es UUID válido", async () => {
      const res = await request(app)
        .patch(`/employee/no-es-uuid/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Renuncia", intoBlacklist: false });

      expect(res.status).toBe(400);
    });

    it("400 — intoBlacklist ausente", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Renuncia" });

      expect(res.status).toBe(400);
    });
  });

  // ── Empleado no encontrado ─────────────────────────────────────────────────
  describe("Empleado no encontrado", () => {
    it("404 — employeeId que no existe en la DB", async () => {
      const res = await request(app)
        .patch(`/employee/${randomUUID()}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Renuncia", intoBlacklist: false });

      expect(res.status).toBe(404);
    });
  });

  // ── Empleado ya inactivo ───────────────────────────────────────────────────
  describe("Empleado ya inactivo", () => {
    it("409 — intento de dar de baja a un empleado ya inactivo", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_INACT_ID}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Renuncia", intoBlacklist: false });

      expect(res.status).toBe(409);
    });
  });

  // ── Baja exitosa sin lista negra ───────────────────────────────────────────
  describe("Baja exitosa sin lista negra", () => {
    it("200 — da de baja al empleado correctamente", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Renuncia voluntaria", intoBlacklist: false });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Empleado dado de baja exitosamente");
    });

    it("el empleado queda inactivo en la DB después de la baja", async () => {
      const employee = await prisma.employee.findUnique({
        where:  { employee_id: TEST_TARGET_ID },
        select: { is_active: true, end_date: true },
      });

      expect(employee.is_active).toBe(false);
      expect(employee.end_date).not.toBeNull();
    });

    it("409 — el mismo empleado ya no puede ser dado de baja de nuevo", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_ID}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Intento duplicado", intoBlacklist: false });

      expect(res.status).toBe(409);
    });
  });

  // ── Baja exitosa con lista negra ───────────────────────────────────────────
  describe("Baja exitosa con lista negra", () => {
    it("200 — da de baja y agrega a lista negra correctamente", async () => {
      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_BL_ID}/deactivate`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Conducta inapropiada", intoBlacklist: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe(
        "Empleado dado de baja y agregado a la lista negra",
      );
    });

    it("el empleado queda inactivo en la DB", async () => {
      const employee = await prisma.employee.findUnique({
        where:  { employee_id: TEST_TARGET_BL_ID },
        select: { is_active: true },
      });

      expect(employee.is_active).toBe(false);
    });

    it("el empleado aparece en la tabla blacklist con la razón correcta", async () => {
      const entry = await prisma.blacklist.findFirst({
        where: { curp: TEST_TARGET_BL_CURP },
      });

      expect(entry).not.toBeNull();
      expect(entry.name).toBe("Pedro");
      expect(entry.surname).toBe("ListaNegra");
      expect(entry.reason).toBe("Conducta inapropiada");
    });
  });

  // ── Flujo encadenado end-to-end ────────────────────────────────────────────
  describe("Flujo encadenado end-to-end", () => {
    it("Login → dar de baja → verificar estado en DB", async () => {
      const freshToken = await loginAndGetToken();

      const res = await request(app)
        .patch(`/employee/${TEST_TARGET_BL_ID}/deactivate`)
        .set("Authorization", `Bearer ${freshToken}`)
        .send({ reason: "Verificación e2e", intoBlacklist: false });

      // Ya estaba inactivo del test anterior
      expect(res.status).toBe(409);
    });
  });
});